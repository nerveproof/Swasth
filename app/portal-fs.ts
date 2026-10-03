/**
 * portal-fs.ts
 * File System Access API helper for the swastha-portal inbox.
 * Persists the directory handle via IndexedDB so the user only picks once.
 */

import type { SessionFileCategory } from './upload-session';

const IDB_DB = 'swastha-portal';
const IDB_STORE = 'handles';
const IDB_KEY = 'portal-root';

// ── IDB helpers ──────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Portal root handle ───────────────────────────────────────────────────────

export function isDirectoryPickerSupported(): { supported: boolean; message?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, message: 'Non-browser environment' };
  }
  if (typeof (window as any).showDirectoryPicker !== 'function') {
    return {
      supported: false,
      message: 'Directory picker is not supported in this browser. Use Chrome, Edge, or Chromium on http://localhost:3016.',
    };
  }
  if (!window.isSecureContext) {
    return {
      supported: false,
      message: 'Directory picker requires a secure context (localhost or https).',
    };
  }
  return { supported: true };
}

const INVALID_LANE_NAMES = new Set(['picture', 'summary', 'media', 'drop', 'inbox']);

export function validatePortalRootHandle(handle: FileSystemDirectoryHandle): { ok: true } | { ok: false; message: string } {
  if (!handle || typeof handle.name !== 'string') {
    return { ok: false, message: 'Invalid directory handle.' };
  }
  const name = handle.name.toLowerCase().trim();
  if (INVALID_LANE_NAMES.has(name)) {
    return {
      ok: false,
      message: 'Pick the swastha-portal folder, not inbox/picture.',
    };
  }
  return { ok: true };
}

/**
 * Restore a previously-saved handle from IDB.
 * 
 * IMPORTANT: requestPermission() requires a user gesture and will be denied
 * if called outside one (e.g. on page load). We use queryPermission() here
 * to check the current state WITHOUT prompting — callers that need to
 * prompt should call handle.requestPermission() themselves inside a click
 * handler (see pickPortalFolder / revalidatePortalHandle).
 */
export async function loadPortalHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
    const handle = await idbGet<FileSystemDirectoryHandle>(IDB_KEY);
    if (!handle) return null;

    const val = validatePortalRootHandle(handle);
    if (!val.ok) {
      await idbDelete(IDB_KEY);
      return null;
    }

    if (typeof (handle as any).queryPermission !== 'function') return handle;
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return handle;
    if (perm === 'prompt') {
      // Permission still potentially grantable — return the handle so the UI
      // can show the "reauthorise" button; actual requestPermission() will
      // happen in the click handler via revalidatePortalHandle().
      return handle;
    }
    // perm === 'denied' — forget it
    await idbDelete(IDB_KEY);
    return null;
  } catch {
    return null;
  }
}

export type RevalidateResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Must be called inside a user-gesture handler (button click).
 * Re-requests readwrite permission for an already-stored handle.
 */
export async function revalidatePortalHandle(
  handle: FileSystemDirectoryHandle,
): Promise<RevalidateResult> {
  try {
    const val = validatePortalRootHandle(handle);
    if (!val.ok) {
      return { ok: false, message: val.message };
    }
    if (typeof (handle as any).requestPermission !== 'function') {
      return { ok: true };
    }
    const perm = await (handle as any).requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      return { ok: true };
    }
    return { ok: false, message: 'Permission was not granted by user.' };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, message: 'Permission prompt was cancelled.' };
    }
    return { ok: false, message: err?.message || 'Failed to re-authorise folder permission.' };
  }
}

export type PickPortalResult =
  | { ok: true; handle: FileSystemDirectoryHandle }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'unsupported'; message: string }
  | { ok: false; reason: 'error'; message: string };

export async function pickPortalFolder(): Promise<PickPortalResult> {
  const check = isDirectoryPickerSupported();
  if (!check.supported) {
    return {
      ok: false,
      reason: 'unsupported',
      message: check.message || 'Directory picker is not supported.',
    };
  }

  try {
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
      id: 'swastha-portal',
      mode: 'readwrite',
      startIn: 'documents',
    });

    const val = validatePortalRootHandle(handle);
    if (!val.ok) {
      return {
        ok: false,
        reason: 'error',
        message: val.message,
      };
    }

    await idbSet(IDB_KEY, handle);
    await ensureInboxDirs(handle);
    return { ok: true, handle };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, reason: 'cancelled' };
    }
    return {
      ok: false,
      reason: 'error',
      message: err?.message || 'Could not access the selected directory.',
    };
  }
}

export async function clearPortalHandle(): Promise<void> {
  await idbDelete(IDB_KEY);
}

// ── Directory bootstrap ──────────────────────────────────────────────────────

const INBOX_SUBDIRS = ['summary', 'picture', 'media', 'drop'] as const;

export async function ensureInboxDirs(root: FileSystemDirectoryHandle): Promise<void> {
  const val = validatePortalRootHandle(root);
  if (!val.ok) {
    throw new Error(val.message);
  }
  const inbox = await root.getDirectoryHandle('inbox', { create: true });
  for (const sub of INBOX_SUBDIRS) {
    await inbox.getDirectoryHandle(sub, { create: true });
  }
  for (const dir of ['processed', 'models', 'state']) {
    await root.getDirectoryHandle(dir, { create: true });
  }
  await writePortalReadme(root);
}

async function writePortalReadme(root: FileSystemDirectoryHandle): Promise<void> {
  const val = validatePortalRootHandle(root);
  if (!val.ok) return;

  const readme = `# swastha-portal

Local portal folder for the Swastha anatomy studio.
Absolute path: /home/leafyishere/Medical/swastha-portal

All data stays on this machine.
No server uploads, no cloud sync, no patient data committed to git.

## Layout

inbox/
  summary/   <- imaging summary documents (.pdf, .txt, .docx)
  picture/   <- report photos / film captures (.jpg, .png, .webp)
  media/     <- MRI / CT disc exports (.dcm, .zip, .tar, .gz)
  drop/      <- reserved (not currently used for writes)

processed/   <- CLI pipeline outputs (never patient originals)
models/      <- 3D model pointer files
state/       <- saved session state JSON for the UI

## CLI

export PORTAL_ROOT=/home/leafyishere/Medical/swastha-portal
# Read from:  $PORTAL_ROOT/inbox/{summary,picture,media}/
# Write to:   $PORTAL_ROOT/processed/ or $PORTAL_ROOT/state/
# Never write into inbox/, never send off-machine
`;
  const fh = await root.getFileHandle('logic.md', { create: true });
  const w = await fh.createWritable();
  await w.write(readme);
  await w.close();
}

// ── Write a file into the portal ─────────────────────────────────────────────

export async function writeToPortal(
  portalRoot: FileSystemDirectoryHandle,
  file: File,
  category: SessionFileCategory,
): Promise<string> {
  const val = validatePortalRootHandle(portalRoot);
  if (!val.ok) {
    throw new Error(val.message);
  }
  // inbox/ must exist under the portal root
  const inbox = await portalRoot.getDirectoryHandle('inbox', { create: true });
  // category maps 1:1 to subdir name (summary | picture | media)
  const subdir = await inbox.getDirectoryHandle(category, { create: true });

  const safeName = await resolveCollision(subdir, file.name);
  const fh = await subdir.getFileHandle(safeName, { create: true });
  const w = await fh.createWritable();
  await w.write(await file.arrayBuffer());
  await w.close();
  return `inbox/${category}/${safeName}`;
}

/** If name already exists, append a short base-36 timestamp before the extension. */
async function resolveCollision(
  dir: FileSystemDirectoryHandle,
  name: string,
): Promise<string> {
  const dot = name.lastIndexOf('.');
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot) : '';

  let candidate = name;
  try {
    await dir.getFileHandle(candidate);
    // File exists — append timestamp suffix
    const ts = Date.now().toString(36).slice(-5);
    candidate = `${base}-${ts}${ext}`;
  } catch {
    // Does not exist — safe to use original name
  }
  return candidate;
}
