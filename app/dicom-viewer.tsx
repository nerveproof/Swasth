import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Box, Layers, LayoutGrid} from 'lucide-react';
import * as T from 'three';
import type {SessionFile} from './upload-session';

interface DicomViewerProps {
  sessionFiles: SessionFile[];
}

type SliceRef = {file: string; instance: number; z: number | null};
type DicomSeries = {
  description: string;
  uid: string;
  rows: number;
  cols: number;
  windowCenter: string;
  windowWidth: string;
  thickness: string;
  files: SliceRef[];
};
type DicomStudy = {
  id: string;
  patient?: {name?: string; studyDate?: string; studyDescription?: string};
  series: DicomSeries[];
};

type Layout = 'stack' | 'mpr' | 'volume';
type Preset = 'soft-tissue' | 'brain' | 'bone';

const pngUrl = (file: string, preset: Preset) =>
  `/api/dicom/png?file=${encodeURIComponent(file)}&preset=${preset}`;

function pickSeries(series: DicomSeries[], hint: string): DicomSeries | undefined {
  return series.find(s => s.description === hint) || series.find(s => s.description.includes(hint));
}

function SliceImage({file, preset, alt}: {file: string; preset: Preset; alt: string}) {
  return (
    <img
      src={pngUrl(file, preset)}
      alt={alt}
      draggable={false}
      style={{width: '100%', height: '100%', objectFit: 'contain', background: '#05080b'}}
    />
  );
}

function VolumeStack({files, preset}: {files: SliceRef[]; preset: Preset}) {
  const host = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState('Building head volume…');

  const sampled = useMemo(() => {
    const step = Math.max(1, Math.ceil(files.length / 56));
    return files.filter((_, i) => i % step === 0);
  }, [files]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;
    const renderer = new T.WebGLRenderer({antialias: true, alpha: false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05080b, 1);
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(35, 1, 0.01, 50);
    camera.position.set(0.9, 0.35, 1.35);
    const pivot = new T.Group();
    scene.add(pivot);
    scene.add(new T.AmbientLight(0xffffff, 1.2));

    const resize = () => {
      const w = el.clientWidth || 640;
      const h = el.clientHeight || 480;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let dragging = false;
    let px = 0;
    let py = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      pivot.rotation.y += (e.clientX - px) * 0.008;
      pivot.rotation.x += (e.clientY - py) * 0.005;
      pivot.rotation.x = Math.max(-1.2, Math.min(1.2, pivot.rotation.x));
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.min(3.2, Math.max(0.45, camera.position.z + e.deltaY * 0.0015));
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, {passive: true});

    const textures: T.Texture[] = [];
    const meshes: T.Mesh[] = [];
    (async () => {
      for (let i = 0; i < sampled.length; i++) {
        if (dead) return;
        setProgress(`Decoding ${i + 1} / ${sampled.length}`);
        const img = new Image();
        img.src = pngUrl(sampled[i].file, preset);
        try {
          await img.decode();
        } catch {
          continue;
        }
        if (dead) return;
        const tex = new T.Texture(img);
        tex.needsUpdate = true;
        tex.colorSpace = T.SRGBColorSpace;
        textures.push(tex);
        const mat = new T.MeshBasicMaterial({map: tex, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false});
        const mesh = new T.Mesh(new T.PlaneGeometry(1.05, 1.05 * (img.height / Math.max(1, img.width))), mat);
        mesh.position.z = (i - sampled.length / 2) * 0.018;
        pivot.add(mesh);
        meshes.push(mesh);
      }
      if (!dead) setProgress(`${sampled.length} axial planes · drag to orbit`);
    })();

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
      meshes.forEach(m => {
        m.geometry.dispose();
        (m.material as T.Material).dispose();
      });
      textures.forEach(t => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sampled, preset]);

  return (
    <div style={{position: 'relative', width: '100%', height: '100%'}}>
      <div ref={host} style={{width: '100%', height: '100%'}} />
      <div style={{position: 'absolute', left: 12, bottom: 12, fontSize: 11, color: '#9eb0bf'}}>{progress}</div>
    </div>
  );
}

export function DicomViewer({sessionFiles}: DicomViewerProps) {
  const [study, setStudy] = useState<DicomStudy | null>(null);
  const [error, setError] = useState('');
  const [layout, setLayout] = useState<Layout>('stack');
  const [preset, setPreset] = useState<Preset>('brain');
  const [seriesUid, setSeriesUid] = useState('');
  const [sliceIndex, setSliceIndex] = useState(0);

  useEffect(() => {
    let cancel = false;
    fetch('/api/dicom/study')
      .then(r => {
        if (!r.ok) throw new Error('PAT001 is not indexed');
        return r.json() as Promise<DicomStudy>;
      })
      .then(data => {
        if (cancel) return;
        const usable = (data.series || []).filter(s => s.description && s.description !== 'Lexmark' && s.files.length > 1);
        setStudy({...data, series: usable});
        const axial = pickSeries(usable, 'T1 SAG FS SPC FLAIR POST_MPR_AX') || usable[0];
        if (axial) {
          setSeriesUid(axial.uid);
          setSliceIndex(Math.floor(axial.files.length / 2));
        }
      })
      .catch(e => { if (!cancel) setError(e.message || 'Could not open the study'); });
    return () => { cancel = true; };
  }, []);

  const series = study?.series.find(s => s.uid === seriesUid) || study?.series[0];
  const slice = series?.files[Math.min(sliceIndex, (series?.files.length || 1) - 1)];
  const axial = study ? pickSeries(study.series, 'T1 SAG FS SPC FLAIR POST_MPR_AX') : undefined;
  const coronal = study ? pickSeries(study.series, 'T1 SAG FS SPC FLAIR POST_MPR_COR') : undefined;
  const sagittal = study ? pickSeries(study.series, 'T1 SAG FS SPC FLAIR POST') : undefined;

  const patientName = (study?.patient?.name || 'Kumar Oshonik').replace('^', ' ');
  const studyDate = study?.patient?.studyDate === '20260428' ? '28/04/2026' : (study?.patient?.studyDate || '');

  return (
    <div className="glass" style={{display: 'flex', width: '100%', height: '100%', backgroundColor: '#ffffffeb', color: '#26313c', border: '1px solid #18253612'}}>
      <div style={{width: 280, borderRight: '1px solid #18253612', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h2 style={{fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#65717e', textTransform: 'uppercase', margin: 0}}>Series Browser</h2>
          <Badge variant="outline" style={{fontSize: 10, padding: '0 5px'}}>{study ? `${study.series.length} series` : '…'}</Badge>
        </div>
        <div style={{fontSize: 12, lineHeight: 1.45, color: '#263b48'}}>
          <div style={{fontWeight: 600}}>{patientName}</div>
          <div style={{color: '#65717e'}}>MR Trigeminal Nerves W/WO &middot; HEAD &middot; {studyDate}</div>
          <div style={{color: '#788694', marginTop: 4}}>Above the neck. Pixel volume from PAT001, not the anatomy atlas.</div>
        </div>
        {error && <div style={{fontSize: 12, color: '#9a3412'}}>{error}</div>}
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          {(study?.series || []).map(s => (
            <button
              key={s.uid || s.description}
              type="button"
              onClick={() => {
                setSeriesUid(s.uid);
                setSliceIndex(Math.floor(s.files.length / 2));
                setLayout('stack');
              }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                background: s.uid === series?.uid ? '#263b4814' : '#ffffffc4',
                border: '1px solid #18253610',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <div style={{fontWeight: 600, color: '#26313c'}}>{s.description}</div>
              <div style={{color: '#788694', marginTop: 2}}>{s.files.length} slices{s.rows ? ` · ${s.cols}×${s.rows}` : ''}</div>
            </button>
          ))}
        </div>
        {sessionFiles.length > 0 && (
          <div style={{fontSize: 10, color: '#788694'}}>{sessionFiles.length} file(s) also staged in this session.</div>
        )}
      </div>

      <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
        <div style={{display: 'flex', padding: '10px 16px', gap: 8, borderBottom: '1px solid #18253612', alignItems: 'center', flexWrap: 'wrap'}}>
          <Button variant="ghost" size="sm" onClick={() => setLayout('stack')} style={layout === 'stack' ? {background: '#263b4812', color: '#263b48', fontWeight: 600} : {color: '#65717e'}}>
            <Layers size={14} style={{marginRight: 5}} /> Stack
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLayout('mpr')} style={layout === 'mpr' ? {background: '#263b4812', color: '#263b48', fontWeight: 600} : {color: '#65717e'}}>
            <LayoutGrid size={14} style={{marginRight: 5}} /> MPR
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLayout('volume')} style={layout === 'volume' ? {background: '#263b4812', color: '#263b48', fontWeight: 600} : {color: '#65717e'}}>
            <Box size={14} style={{marginRight: 5}} /> 3D volume
          </Button>
          <div style={{width: 1, background: '#18253612', margin: '0 4px', height: 20}} />
          {(['soft-tissue', 'brain', 'bone'] as Preset[]).map(p => (
            <Button key={p} variant="ghost" size="sm" onClick={() => setPreset(p)} style={preset === p ? {background: '#263b4812', color: '#263b48', fontWeight: 600} : {color: '#65717e'}}>
              {p === 'soft-tissue' ? 'Soft Tissue' : p === 'brain' ? 'Trigeminal Nerves' : 'Bone'}
            </Button>
          ))}
        </div>

        <div style={{flex: 1, display: 'flex', padding: 4, background: '#0b1218', minHeight: 0}}>
          {layout === 'stack' && slice && (
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
              <div style={{flex: 1, minHeight: 0, position: 'relative'}}>
                <SliceImage file={slice.file} preset={preset} alt={series?.description || 'slice'} />
                <div style={{position: 'absolute', left: 12, top: 10, color: '#d5dee6', fontSize: 12, textShadow: '0 1px 2px #000'}}>
                  {series?.description}<br />
                  <span style={{color: '#9eb0bf'}}>{sliceIndex + 1} / {series?.files.length}</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, (series?.files.length || 1) - 1)}
                value={sliceIndex}
                onChange={e => setSliceIndex(Number(e.target.value))}
                style={{width: '100%'}}
                aria-label="Slice position"
              />
            </div>
          )}
          {layout === 'mpr' && (
            <div style={{flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4}}>
              <Plane title="AXIAL" series={axial} preset={preset} />
              <Plane title="SAGITTAL" series={sagittal} preset={preset} />
              <Plane title="CORONAL" series={coronal} preset={preset} />
              <div style={{background: '#0f171e', color: '#9eb0bf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, padding: 12, textAlign: 'center'}}>
                Open 3D volume to orbit the axial stack of this head MR.
              </div>
            </div>
          )}
          {layout === 'volume' && axial && <VolumeStack files={axial.files} preset={preset} />}
          {!study && !error && (
            <div style={{color: '#9eb0bf', margin: 'auto', fontSize: 13}}>Opening PAT001…</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Plane({title, series, preset}: {title: string; series?: DicomSeries; preset: Preset}) {
  const [index, setIndex] = useState(() => (series ? Math.floor(series.files.length / 2) : 0));
  useEffect(() => {
    if (series) setIndex(Math.floor(series.files.length / 2));
  }, [series]);
  const file = series?.files[Math.min(index, (series?.files.length || 1) - 1)]?.file;
  return (
    <div style={{background: '#0f171e', minHeight: 0, display: 'flex', flexDirection: 'column'}}>
      <div style={{fontSize: 11, color: '#458a85', fontWeight: 600, padding: '6px 8px'}}>{title}{series ? ` · ${series.files.length}` : ''}</div>
      <div style={{flex: 1, minHeight: 0}}>
        {file ? <SliceImage file={file} preset={preset} alt={title} /> : <div style={{color: '#556575', fontSize: 11, padding: 8}}>Series missing</div>}
      </div>
      {series && (
        <input type="range" min={0} max={series.files.length - 1} value={index} onChange={e => setIndex(Number(e.target.value))} aria-label={`${title} slice`} />
      )}
    </div>
  );
}

export default DicomViewer;
