import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Disc, FileText, FolderOpen, Image, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  clearPortalHandle,
  ensureInboxDirs,
  isDirectoryPickerSupported,
  loadPortalHandle,
  pickPortalFolder,
  revalidatePortalHandle,
} from './portal-fs';
import {saveToProjectUpload, saveManyToProjectUpload} from './local-upload';
// import {parseClinicalReport, type ClinicalReportResult} from './clinical-report';
import {type ClinicalReportResult} from './clinical-report';
import {resolveClinicalReport} from './clinical-reconstruction';

export type SessionFileCategory = 'summary' | 'picture' | 'media';

export interface SessionFile {
  id: string;
  name: string;
  category: SessionFileCategory;
  size: number;
  type: string;
  file?: File;
  addedAt: number;
  relativePath?: string;
}

interface UploadSessionProps {
  files: SessionFile[];
  onAddFiles: (files: File[], category?: SessionFileCategory) => void;
  onRemoveFile: (id: string) => void;
  onChangeCategory: (id: string, category: SessionFileCategory) => void;
  onClearFiles: () => void;
  onReportAnalyzed?: (report: ClinicalReportResult) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function inferCategory(filename: string, mimeType: string): SessionFileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mimeType.startsWith('image/')) return 'picture';
  if (['dcm', 'zip', 'tar', 'gz'].includes(ext)) return 'media';
  if (['pdf', 'txt', 'docx', 'doc', 'rtf'].includes(ext) || mimeType.includes('text') || mimeType.includes('pdf')) return 'summary';
  if (!filename.includes('.') || /dicom|image|series|ct|mr|slice|im[0-9]+/i.test(filename)) return 'media';
  return 'media';
}

const CATEGORY_META = {
  summary: {
    label: 'Summary page',
    sub: 'Imaging summary document (.pdf, .txt)',
    accept: '.pdf,.txt,.doc,.docx,.rtf',
    icon: FileText,
    color: '#65717e',
  },
  picture: {
    label: 'Picture capture',
    sub: 'Film / report photo (.jpg, .png, .webp)',
    accept: '.jpg,.jpeg,.png,.webp,image/*',
    icon: Image,
    color: '#65717e',
  },
  media: {
    label: 'Media (disc export)',
    sub: 'MRI disc export / archive (.dcm, .zip, etc.)',
    accept: '.dcm,.zip,.tar,.gz,.pdf,.png,.jpg,.jpeg',
    icon: Disc,
    color: '#458a85',
  },
};

// Track permission state: 'granted' | 'prompt' | 'denied' | null (unknown / loading)
type PermState = 'granted' | 'prompt' | null;

/**
 * Recursively extracts File objects from a FileSystemEntry (file or directory).
 * Attaches custom relativePath preserving subdirectory paths.
 */
async function getFilesFromEntry(entry: any, currentPath = ''): Promise<File[]> {
  if (!entry) return [];
  if (entry.isFile) {
    return new Promise<File[]>((resolve) => {
      entry.file(
        (file: File) => {
          const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
          Object.defineProperty(file, 'relativePath', {
            value: relPath,
            writable: true,
            configurable: true,
          });
          resolve([file]);
        },
        () => resolve([])
      );
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    const entries: any[] = [];

    const readBatch = (): Promise<any[]> => {
      return new Promise((resolve) => {
        dirReader.readEntries(
          (batch: any[]) => resolve(batch || []),
          () => resolve([])
        );
      });
    };

    let batch: any[];
    do {
      batch = await readBatch();
      if (batch && batch.length > 0) {
        entries.push(...batch);
      }
    } while (batch && batch.length > 0);

    const nestedFiles = await Promise.all(
      entries.map((subEntry) => getFilesFromEntry(subEntry, dirPath))
    );
    return nestedFiles.flat();
  }
  return [];
}

/**
 * Extracts all files (including files inside nested directories) from a DataTransfer event.
 */
async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items;
  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const entries: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }
    if (entries.length > 0) {
      const results = await Promise.all(entries.map((entry) => getFilesFromEntry(entry)));
      return results.flat();
    }
  }
  if (dataTransfer.files?.length) {
    return Array.from(dataTransfer.files);
  }
  return [];
}

export function UploadSession({
  files,
  onAddFiles,
  onRemoveFile,
  onChangeCategory,
  onClearFiles,
  onReportAnalyzed,
}: UploadSessionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const generalInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);
  const [activeCat, setActiveCat] = useState<SessionFileCategory | undefined>(undefined);

  // Portal state — use a ref so callbacks always see latest value without re-memo
  const [portalHandle, setPortalHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const portalHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const [portalName, setPortalName] = useState<string | null>(null);
  const [permState, setPermState] = useState<PermState>(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [writeStatus, setWriteStatus] = useState<{ errors: string[]; okPaths: string[] }>({ errors: [], okPaths: [] });

  const pickerSupport = isDirectoryPickerSupported();

  // Keep ref in sync with state
  useEffect(() => { portalHandleRef.current = portalHandle; }, [portalHandle]);

  // Load handle on mount — queryPermission() does NOT need a gesture
  useEffect(() => {
    (async () => {
      const h = await loadPortalHandle();
      if (h) {
        setPortalHandle(h);
        setPortalName(h.name);
        try {
          const perm = typeof (h as any).queryPermission === 'function'
            ? await (h as any).queryPermission({ mode: 'readwrite' })
            : 'granted';
          setPermState(perm === 'granted' ? 'granted' : 'prompt');
        } catch {
          setPermState('prompt');
        }
      } else {
        setPermState(null);
      }
      setPortalLoading(false);
    })();
  }, []);

  /** Called from a click handler — safe to call requestPermission() */
  const handleLinkPortal = async () => {
    setPortalError(null);
    const res = await pickPortalFolder();
    if (res.ok) {
      setPortalHandle(res.handle);
      setPortalName(res.handle.name);
      setPermState('granted');
      setPortalError(null);
    } else if (res.reason === 'unsupported' || res.reason === 'error') {
      setPortalError(res.message);
    }
  };

  /** Re-authorise an already-stored handle (requires user gesture) */
  const handleReauthorise = async () => {
    if (!portalHandle) return;
    setPortalError(null);
    const res = await revalidatePortalHandle(portalHandle);
    if (res.ok) {
      await ensureInboxDirs(portalHandle);
      setPermState('granted');
      setPortalError(null);
    } else {
      setPermState('prompt');
      setPortalError(res.message);
    }
  };

  const handleClearPortal = async () => {
    await clearPortalHandle();
    setPortalHandle(null);
    setPortalName(null);
    setPermState(null);
    setPortalError(null);
  };

  // Submit / drop save: flat write into SeeTogether/Upload via local Vite API (no cloud, no classification).
  const [submitPending, setSubmitPending] = useState(false);
  const saveFilesToUpload = useCallback(async (list: {name: string; file?: File; relativePath?: string}[]) => {
    const uploadable = list.filter((sf): sf is {name: string; file: File; relativePath?: string} => !!sf.file);
    const unfileable = list.filter(sf => !sf.file).map(sf => sf.name);

    const {okPaths, errors} = await saveManyToProjectUpload(
      uploadable.map(u => ({
        file: u.file,
        relativePath: u.relativePath || (u.file as any).relativePath || u.name,
        name: u.name,
      })),
      8
    );
    return { errors: [...unfileable, ...errors], okPaths };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitPending || files.length === 0) return;
    setSubmitPending(true);
    setPortalError(null);

    // Analyze clinical summary if present
    const summaryFile = files.find(f => f.category === 'summary' || /report|ncct|ct|mri|summary|findings/i.test(f.name)) || files[0];
    let parsedReport = null;
    if (summaryFile && onReportAnalyzed) {
      try {
        let content = '';
        if (summaryFile.file && (summaryFile.file.type.startsWith('text') || summaryFile.name.endsWith('.txt') || summaryFile.name.endsWith('.md'))) {
          content = await summaryFile.file.text();
        }
        // parsedReport = parseClinicalReport(content, summaryFile.name);
        parsedReport = resolveClinicalReport(content, summaryFile.name);
        onReportAnalyzed(parsedReport);
      } catch (e) {
        console.error('[clinical-report] parse failed', e);
      }
    }

    const {errors, okPaths} = await saveFilesToUpload(files);

    // Detect DICOM files or folders
    const isDicomPresent = files.some(f =>
      f.category === 'media' ||
      f.name.toLowerCase().endsWith('.dcm') ||
      (f.relativePath && (f.relativePath.toLowerCase().endsWith('.dcm') || f.relativePath.includes('/'))) ||
      /dicom|series|slice|im[0-9]+/i.test(f.name)
    );

    // Save TASK.json into /Upload for Grok CLI / Agy CLI agents
    try {
      const taskPayload = {
        timestamp: new Date().toISOString(),
        files: files.map(f => ({
          name: f.name,
          relativePath: f.relativePath || (f.file as any)?.relativePath || f.name,
          category: f.category,
          size: f.size,
          type: f.type,
        })),
        isDicom: isDicomPresent,
        primaryReport: summaryFile?.name || null,
        targetRegion: 'above_neck',
        modality: isDicomPresent
          ? (parsedReport?.modality || 'DICOM Series (CT/MRI)')
          : (parsedReport?.modality || 'NCCT Face / Craniofacial'),
        impression: parsedReport?.impression || 'Clinical impression pending agent reconstruction',
        status: 'submitted',
        instructions: isDicomPresent
          ? 'Read Upload/DICOM_AGENT_INSTRUCTIONS.md and execute Upload/run-agent.sh --agent grok (or agy)'
          : 'Read Upload/AGENT_INSTRUCTIONS.md and execute Upload/run-agent.sh --agent grok (or agy)'
      };
      const taskBlob = new Blob([JSON.stringify(taskPayload, null, 2)], { type: 'application/json' });
      await saveToProjectUpload(new File([taskBlob], 'TASK.json', { type: 'application/json' }));
      if (isDicomPresent) {
        await saveToProjectUpload(new File([taskBlob], 'TASK-dicom.json', { type: 'application/json' }));
      }
    } catch (e) {
      console.warn('[upload] failed to write TASK.json', e);
    }

    setSubmitPending(false);
    setWriteStatus({ errors, okPaths });
    if (errors.length === 0) {
      onClearFiles();
      setIsOpen(false);
    } else {
      for (const ok of okPaths) {
        const matching = files.find(f => ok.endsWith(f.name));
        if (matching) onRemoveFile(matching.id);
      }
    }
    setTimeout(() => setWriteStatus({ errors: [], okPaths: [] }), 8000);
  }, [files, submitPending, saveFilesToUpload, onClearFiles, onRemoveFile, onReportAnalyzed]);

  // Add: React state only. Portal write happens on Submit, not on add.
  const handleAddWithPortal = useCallback((newFiles: File[], cat?: SessionFileCategory) => {
    onAddFiles(newFiles, cat);
  }, [onAddFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
  const persistDropped = useCallback(async (fileList: File[], cat?: SessionFileCategory) => {
    handleAddWithPortal(fileList, cat);
    setIsOpen(true);
    setSubmitPending(true);
    setPortalError(null);
    const {errors, okPaths} = await saveFilesToUpload(fileList.map(f => ({
      name: (f as any).relativePath || f.webkitRelativePath || f.name,
      file: f,
      relativePath: (f as any).relativePath || f.webkitRelativePath,
    })));
    setSubmitPending(false);
    setWriteStatus({ errors, okPaths });
    setTimeout(() => setWriteStatus({ errors: [], okPaths: [] }), 8000);
  }, [handleAddWithPortal, saveFilesToUpload]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer) {
      const extracted = await extractFilesFromDataTransfer(e.dataTransfer);
      if (extracted.length > 0) {
        void persistDropped(extracted);
      }
    }
  };

  // Window-level drag and drop to capture files/folders dropped anywhere on screen
  useEffect(() => {
    const onWindowDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        setIsDragOver(true);
      }
    };
    const onWindowDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null || (e.clientX === 0 && e.clientY === 0)) {
        setIsDragOver(false);
      }
    };
    const onWindowDrop = async (e: DragEvent) => {
      if (e.dataTransfer) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const extracted = await extractFilesFromDataTransfer(e.dataTransfer);
        if (extracted.length > 0) {
          void persistDropped(extracted);
        }
      }
    };

    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('dragleave', onWindowDragLeave);
    window.addEventListener('drop', onWindowDrop);
    return () => {
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('dragleave', onWindowDragLeave);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, [persistDropped]);

  const handleGeneralSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { void persistDropped(Array.from(e.target.files)); e.target.value = ''; }
  };
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const fileList = Array.from(e.target.files).map(f => {
        const rel = f.webkitRelativePath || f.name;
        Object.defineProperty(f, 'relativePath', {
          value: rel,
          writable: true,
          configurable: true,
        });
        return f;
      });
      void persistDropped(fileList, 'media');
      e.target.value = '';
    }
  };
  const handleCatSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { void persistDropped(Array.from(e.target.files), activeCat); e.target.value = ''; }
  };
  const triggerCatPicker = (cat: SessionFileCategory) => {
    setActiveCat(cat);
    if (catInputRef.current) { catInputRef.current.accept = CATEGORY_META[cat].accept; catInputRef.current.click(); }
  };

  const isLinkedAndGranted = !!portalHandle && permState === 'granted';
  const isLinkedNeedsAuth = !!portalHandle && permState === 'prompt';
  const canSubmit = files.length > 0 && !submitPending;

  return (
    <div className="upload-session-container">
      <input ref={generalInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleGeneralSelect} />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...{ webkitdirectory: '', directory: '' }}
        style={{ display: 'none' }}
        onChange={handleFolderSelect}
      />
      <input ref={catInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleCatSelect} />

      {isOpen && (
        <div
          className={`upload-session-panel glass ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Upload session panel"
        >
          {/* Header */}
          <div className="upload-panel-header">
            <div className="upload-header-left">
              <Upload size={14} className="text-muted-foreground" />
              <span className="upload-panel-title">Upload session</span>
              {/* <Badge variant="outline" className="upload-badge">Local only</Badge> */}
            </div>
            <div className="upload-header-actions">
              {files.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    className="upload-submit-btn header"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    title={
                      !isLinkedAndGranted
                        ? 'Save staged files into SeeTogether/Upload'
                        : `Submit ${files.length} file(s) to portal`
                    }
                    aria-label="Submit files to portal"
                  >
                    {submitPending ? 'Saving…' : 'Submit'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="upload-clear-btn"
                    onClick={onClearFiles}
                    title="Remove all files"
                    aria-label="Remove all files"
                  >
                    Clear ({files.length})
                  </Button>
                </>
              )}
              <Button variant="ghost" className="upload-close-btn" onClick={() => setIsOpen(false)} title="Collapse" aria-label="Collapse upload session">
                <ChevronDown size={15} />
              </Button>
            </div>
          </div>

          {/* Portal link row */}
          {/*
          <div className="upload-portal-row">
            {portalLoading ? (
              <span className="upload-portal-hint">Checking portal…</span>
            ) : isLinkedAndGranted ? (
              <>
                <span className="upload-portal-linked">
                  <FolderOpen size={12} />
                  <span>{portalName || 'swastha-portal'}</span>
                  <span className="upload-portal-path-sub">…/SeeTogether/Upload</span>
                </span>
                <button type="button" className="upload-portal-change" onClick={handleLinkPortal} title="Pick a different portal folder">Change…</button>
                <button type="button" className="upload-portal-clear" onClick={handleClearPortal} title="Unlink portal folder" aria-label="Unlink"><X size={11} /></button>
              </>
            ) : isLinkedNeedsAuth ? (
              <>
                <span className="upload-portal-hint" style={{ color: '#a8574a' }}>Portal needs permission.</span>
                <button type="button" className="upload-portal-link-btn" style={{ background: '#a8574a12', color: '#a8574a', borderColor: '#a8574a18' }} onClick={handleReauthorise}>Reauthorise</button>
                <button type="button" className="upload-portal-clear" onClick={handleClearPortal} title="Unlink" aria-label="Unlink"><X size={11} /></button>
              </>
            ) : !pickerSupport.supported ? (
              <>
                <span className="upload-portal-hint" style={{ color: '#a8574a' }}>
                  {pickerSupport.message}
                </span>
              </>
            ) : (
              <>
                <span className="upload-portal-hint">
                  Target: <code className="upload-portal-path">…/SeeTogether/Upload</code>
                </span>
                <button type="button" className="upload-portal-link-btn" onClick={handleLinkPortal} title="Link SeeTogether/Upload to save files to disk">Link portal folder</button>
              </>
            )}
          </div>
          */}

          {/* Description / nudge */}
          {/*
          <p className="upload-panel-desc">
            {isLinkedAndGranted
              ? 'Saves into SeeTogether/Upload on drop or Submit. No cloud.'
              : files.length > 0
                ? 'Drop or Submit writes into SeeTogether/Upload.'
                : 'Local-only. Files land in SeeTogether/Upload.'}
          </p>
          */}

          {/* Portal error / status feedback */}
          {portalError && (
            <div className="upload-portal-error">{portalError}</div>
          )}
          {writeStatus.errors.length > 0 && (
            <div className="upload-portal-error">Failed to write: {writeStatus.errors.join(', ')}</div>
          )}
          {writeStatus.okPaths.length > 0 && (
            <div className="upload-portal-ok">Saved {writeStatus.okPaths.length} file(s) to portal: {writeStatus.okPaths.join(', ')}</div>
          )}

          {/* Category cards */}
          <div className="upload-categories-grid">
            {(['summary', 'picture', 'media'] as SessionFileCategory[]).map(cat => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const catCount = files.filter(f => f.category === cat).length;
              return (
                <button key={cat} type="button" className="upload-cat-card" onClick={() => triggerCatPicker(cat)} title={`Add ${meta.label}`}>
                  <div className="upload-cat-top">
                    <Icon size={14} style={{ color: meta.color }} />
                    <span className="upload-cat-label">{meta.label}</span>
                    {catCount > 0 && <span className="upload-cat-badge">{catCount}</span>}
                  </div>
                  <div className="upload-cat-sub">{meta.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Dropzone */}
          <div
            className="upload-dropzone"
            onClick={() => generalInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Paperclip size={13} />
            <span>Drop files or folder here, or</span>
            <button
              type="button"
              className="upload-dropzone-action"
              onClick={(e) => { e.stopPropagation(); generalInputRef.current?.click(); }}
              title="Browse individual files"
            >
              browse files
            </button>
            <span className="upload-dropzone-sep">/</span>
            <button
              type="button"
              className="upload-dropzone-action"
              onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
              title="Upload entire DICOM folder or CD series"
            >
              <FolderOpen size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: '-1px' }} />
              folder (DICOM)
            </button>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="upload-files-section">
              <div className="upload-files-list">
                {files.map(f => {
                  const meta = CATEGORY_META[f.category];
                  const Icon = meta.icon;
                  return (
                    <div key={f.id} className="upload-file-row">
                      <Icon size={13} style={{ color: meta.color, flexShrink: 0 }} />
                      <span className="upload-file-name" title={f.name}>{f.name}</span>
                      <select
                        value={f.category}
                        onChange={e => onChangeCategory(f.id, e.target.value as SessionFileCategory)}
                        className="upload-file-cat-select"
                        title="Change category"
                        aria-label="Change category"
                      >
                        <option value="summary">Summary</option>
                        <option value="picture">Picture</option>
                        <option value="media">Media</option>
                      </select>
                      <span className="upload-file-size">{formatFileSize(f.size)}</span>
                      <button type="button" className="upload-file-remove" onClick={() => onRemoveFile(f.id)} title={`Remove ${f.name}`} aria-label={`Remove ${f.name}`}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Submit footer bar */}
              <div className="upload-submit-bar">
                <Button
                  className="upload-submit-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  title={
                    !isLinkedAndGranted
                      ? 'Save staged files into SeeTogether/Upload to disk'
                      : `Save ${files.length} file(s) to Upload/`
                  }
                >
                  <Check size={13} />
                  <span>{submitPending ? 'Saving…' : `Submit (${files.length}) to Upload`}</span>
                </Button>
                {!isLinkedAndGranted && (
                  <span className="upload-submit-nudge">
                    {/* Destination: SeeTogether/Upload */}
                    Destination: Swasth/Upload
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dock chip */}
      <Button
        variant="ghost"
        className={`upload-dock-chip ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Toggle upload session"
        title="Upload session (local only)"
      >
        <Upload size={14} />
        <span>Upload session</span>
        {files.length > 0 ? (
          <Badge variant="secondary" className="upload-chip-count">{files.length}</Badge>
        ) : (
          <span className={`upload-chip-local ${isLinkedAndGranted ? 'linked' : ''}`}>
            {isLinkedAndGranted ? 'Portal' : 'Upload'}
          </span>
        )}
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </Button>
    </div>
  );
}
