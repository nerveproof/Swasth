/**
 * Saves a File into the project Upload/ folder via the Vite local API.
 * Destination: /home/leafyishere/Current_Projects/SeeTogether/Upload
 * No cloud, no classification — flat write of whatever was dropped.
 */
/* export const PROJECT_UPLOAD_DIR = '/home/leafyishere/Current_Projects/SeeTogether/Upload'; */
export const PROJECT_UPLOAD_DIR = '/home/leafyishere/Swasth/Upload';

type UploadResponse = {ok?: boolean; path?: string; message?: string; dir?: string};

export async function saveToProjectUpload(file: File, relativePath?: string): Promise<string> {
  const uploadName = relativePath || (file as any).relativePath || (file as any).webkitRelativePath || file.name;
  const res = await fetch(`/api/upload?name=${encodeURIComponent(uploadName)}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/octet-stream'},
    body: file,
  });
  const data = (await res.json().catch(() => ({}))) as UploadResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `Upload failed (${res.status})`);
  }
  return `Upload/${data.path || uploadName}`;
}

export type UploadItem = File | { file: File; relativePath?: string; name?: string };

export async function saveManyToProjectUpload(
  items: UploadItem[],
  concurrency = 8
): Promise<{okPaths: string[]; errors: string[]}> {
  const okPaths: string[] = [];
  const errors: string[] = [];

  let index = 0;
  const workerCount = Math.min(concurrency, Math.max(1, items.length));

  const workers = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const current = items[index++];
      const file = current instanceof File ? current : current.file;
      const rel = current instanceof File ? (current as any).relativePath : current.relativePath;
      const displayName = current instanceof File ? current.name : (current.name || file.name);
      try {
        const saved = await saveToProjectUpload(file, rel);
        okPaths.push(saved);
      } catch {
        errors.push(displayName);
      }
    }
  });

  await Promise.all(workers);
  return {okPaths, errors};
}

