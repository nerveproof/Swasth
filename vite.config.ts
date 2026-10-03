import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type {IncomingMessage, ServerResponse} from 'node:http';
import type {Plugin} from 'vite';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

const rootPath=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
const UPLOAD_DIR = rootPath('./Upload');
const DICOM_ROOT = path.join(UPLOAD_DIR, 'DICOM', 'PAT001');

function windowFilter(preset: string, filePath: string): string {
  if (filePath.includes('PAT001')) {
    if (preset === 'bone') return 'colorlevels=rimin=0.50,normalize,format=gray,eq=contrast=1.3:brightness=-0.1';
    return 'colorlevels=rimin=0.50,normalize,format=gray';
  }
  if (preset === 'bone') return 'format=gray,eq=contrast=1.7:brightness=-0.12';
  if (preset === 'soft-tissue') return 'format=gray,eq=contrast=0.9:brightness=0.08';
  return 'format=gray,eq=contrast=1.2:brightness=-0.02';
}

function decodeDicomPng(filePath: string, preset: string): Promise<Buffer> {
  const jpeg = fs.readFileSync(filePath);
  const start = jpeg.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  const end = jpeg.lastIndexOf(Buffer.from([0xff, 0xd9]));
  if (start < 0 || end < start) return Promise.reject(new Error('no JPEG frame'));
  const frame = jpeg.subarray(start, end + 2);
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'image2pipe', '-i', 'pipe:0',
      '-vf', windowFilter(preset, filePath),
      '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1',
    ]);
    const chunks: Buffer[] = [];
    let err = '';
    proc.stdout.on('data', (c: Buffer) => chunks.push(c));
    proc.stderr.on('data', (c: Buffer) => { err += c.toString(); });
    proc.on('error', reject);
    proc.on('close', code => {
      if (code !== 0) reject(new Error(err || `ffmpeg ${code}`));
      else resolve(Buffer.concat(chunks));
    });
    proc.stdin.write(frame);
    proc.stdin.end();
  });
}

/** Dev-only: GET /api/dicom/study and /api/dicom/png?file=STUDY001/n.dcm&preset=brain */
function dicomReadPlugin(): Plugin {
  const cache = new Map<string, Buffer>();
  return {
    name: 'seetogether-dicom-read',
    configureServer(server) {
      server.middlewares.use('/api/dicom', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'GET') {
          next();
          return;
        }
        const url = new URL(req.url || '', 'http://localhost');
        if (url.pathname === '/study') {
          const indexPath = path.join(DICOM_ROOT, 'series-index.json');
          if (!fs.existsSync(indexPath)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ok: false, message: 'series index missing'}));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          fs.createReadStream(indexPath).pipe(res);
          return;
        }
        if (url.pathname !== '/png') {
          next();
          return;
        }
        const rel = url.searchParams.get('file') || '';
        const preset = url.searchParams.get('preset') || 'brain';
        if (!rel || rel.includes('..') || path.isAbsolute(rel) || !rel.endsWith('.dcm')) {
          res.statusCode = 400;
          res.end('bad file');
          return;
        }
        const abs = path.resolve(DICOM_ROOT, rel);
        if (!abs.startsWith(DICOM_ROOT + path.sep)) {
          res.statusCode = 400;
          res.end('bad path');
          return;
        }
        const key = `${preset}|${rel}`;
        const hit = cache.get(key);
        if (hit) {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(hit);
          return;
        }
        decodeDicomPng(abs, preset).then(png => {
          cache.set(key, png);
          if (cache.size > 160) {
            const oldest = cache.keys().next().value;
            if (oldest) cache.delete(oldest);
          }
          res.setHeader('Content-Type', 'image/png');
          res.end(png);
        }).catch((e: Error) => {
          res.statusCode = 500;
          res.end(e.message || 'decode failed');
        });
      });
    },
  };
}

/** Dev-only: POST /api/upload?name=file.ext  body=raw bytes → SeeTogether/Upload */
function localUploadPlugin(): Plugin {
  return {
    name: 'seetogether-local-upload',
    configureServer(server) {
      fs.mkdirSync(UPLOAD_DIR, {recursive: true});
      server.middlewares.use('/api/upload', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          next();
          return;
        }
        const url = new URL(req.url || '', 'http://localhost');
        const rawName = url.searchParams.get('name') || 'upload.bin';
        // Normalize slashes and prevent directory traversal
        const normalizedRel = path.normalize(rawName).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          try {
            let dest = path.join(UPLOAD_DIR, normalizedRel);
            const parentDir = path.dirname(dest);
            await fsp.mkdir(parentDir, {recursive: true});

            if (fs.existsSync(dest)) {
              const ext = path.extname(dest);
              const stem = path.basename(dest, ext);
              dest = path.join(parentDir, `${stem}-${Date.now().toString(36).slice(-5)}${ext}`);
            }
            await fsp.writeFile(dest, Buffer.concat(chunks));
            const relSavedPath = path.relative(UPLOAD_DIR, dest);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ok: true, path: relSavedPath, dir: 'Upload'}));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ok: false, message: e?.message || 'write failed'}));
          }
        });
        req.on('error', () => {
          res.statusCode = 500;
          res.end(JSON.stringify({ok: false, message: 'request error'}));
        });
      });
    },
  };
}

export default defineConfig({
  root: rootPath('./web'),
  publicDir: rootPath('./public'),
  plugins: [react(), localUploadPlugin(), dicomReadPlugin()],
  resolve: {alias: {'@': rootPath('./')}},
  css: {postcss: {plugins: [tailwindcss()]}},
  server: {watch: {usePolling: true}},
  build: {outDir: rootPath('./dist'), emptyOutDir: true},
});
