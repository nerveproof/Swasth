import React, { useState, useRef } from 'react';
import { 
  RotateCcw, Copy, Check, Sliders, Eye, EyeOff, Trash2, 
  Move, Plus, Upload, FolderOpen, Paperclip, FileText, Image, Disc, X, Download
} from 'lucide-react';

export interface UploadSessionConfig {
  // Panel Dimensions & Position
  panelWidth: number;
  panelPadding: number;
  borderRadius: number;
  panelBgColor: string;
  panelOpacity: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowColor: string;
  borderWidth: number;
  borderColor: string;

  // Header Styling
  headerTitleSize: number;
  headerTitleWeight: number;
  headerTitleColor: string;
  headerBadgeText: string;
  headerBadgeBg: string;
  headerBadgeColor: string;
  showBadge: boolean;
  showCloseBtn: boolean;
  showClearBtn: boolean;

  // Portal / Warning Notice Row
  showPortalRow: boolean;
  portalText: string;
  portalTextColor: string;
  portalTextSize: number;
  portalLinkBtnText: string;
  portalLinkBtnBg: string;
  portalLinkBtnColor: string;

  // Description / Subtitle
  showDescription: boolean;
  descText: string;
  descFontSize: number;
  descTextColor: string;

  // Category Grid & Cards
  showCategories: boolean;
  categoryCols: number;
  categoryCardPadding: number;
  categoryCardBg: string;
  categoryCardBorderColor: string;
  categoryCardRadius: number;
  categoryTitleSize: number;
  categorySubSize: number;
  categoryIconSize: number;
  categoryGap: number;

  // Dropzone
  showDropzone: boolean;
  dropzonePadding: number;
  dropzoneBorderRadius: number;
  dropzoneBorderColor: string;
  dropzoneBgColor: string;
  dropzoneFontSize: number;
  dropzoneIconSize: number;
  dropzoneText: string;
  dropzoneFormatsText: string;

  // File List Preview
  showFileList: boolean;
  fileRowBg: string;
  fileRowPadding: number;
  fileRowRadius: number;
  fileNameSize: number;
}

export const DEFAULT_UPLOAD_CONFIG: UploadSessionConfig = {
  // Panel Dimensions & Position
  panelWidth: 480,
  panelPadding: 16,
  borderRadius: 16,
  panelBgColor: '#ffffff',
  panelOpacity: 0.96,
  shadowBlur: 36,
  shadowSpread: 0,
  shadowColor: 'rgba(24, 37, 54, 0.15)',
  borderWidth: 1,
  borderColor: 'rgba(24, 37, 54, 0.10)',

  // Header Styling
  headerTitleSize: 14,
  headerTitleWeight: 600,
  headerTitleColor: '#233544',
  headerBadgeText: 'Local only',
  headerBadgeBg: '#f1f5f9',
  headerBadgeColor: '#475569',
  showBadge: true,
  showCloseBtn: true,
  showClearBtn: true,

  // Portal / Warning Notice Row
  showPortalRow: true,
  portalText: 'Directory picker is not supported in this browser. Use Chrome, Edge, or Chromium on...',
  portalTextColor: '#b91c1c',
  portalTextSize: 12,
  portalLinkBtnText: 'Link portal folder',
  portalLinkBtnBg: '#f8fafc',
  portalLinkBtnColor: '#263b48',

  // Description / Subtitle
  showDescription: true,
  descText: 'Local-only. Files land in SeeTogether/Upload.',
  descFontSize: 12,
  descTextColor: '#64748b',

  // Category Grid & Cards
  showCategories: true,
  categoryCols: 3,
  categoryCardPadding: 10,
  categoryCardBg: '#ffffff',
  categoryCardBorderColor: 'rgba(24, 37, 54, 0.10)',
  categoryCardRadius: 8,
  categoryTitleSize: 12,
  categorySubSize: 10,
  categoryIconSize: 15,
  categoryGap: 8,

  // Dropzone
  showDropzone: true,
  dropzonePadding: 14,
  dropzoneBorderRadius: 10,
  dropzoneBorderColor: 'rgba(24, 37, 54, 0.20)',
  dropzoneBgColor: '#f8fafc',
  dropzoneFontSize: 12,
  dropzoneIconSize: 14,
  dropzoneText: 'Drop files here or browse',
  dropzoneFormatsText: '(.pdf · .jpg · .png · .webp · .dcm · .zip)',

  // File List Preview
  showFileList: true,
  fileRowBg: '#f8fafc',
  fileRowPadding: 6,
  fileRowRadius: 6,
  fileNameSize: 11,
};

export interface MockFileItem {
  id: string;
  name: string;
  category: 'summary' | 'picture' | 'media';
  size: string;
}

export function UploadSessionSandbox() {
  const [config, setConfig] = useState<UploadSessionConfig>(DEFAULT_UPLOAD_CONFIG);
  const [activeTab, setActiveTab] = useState<'layout' | 'typography' | 'elements' | 'visibility'>('layout');
  const [copied, setCopied] = useState(false);
  
  // Drag & drop interactive positioning inside sandbox viewport
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  // Interactive mock files list to test remove/add
  const [mockFiles, setMockFiles] = useState<MockFileItem[]>([
    { id: '1', name: 'Brain_MRI_Axial_T2.dcm', category: 'media', size: '24.2 MB' },
    { id: '2', name: 'Radiology_Report_Final.pdf', category: 'summary', size: '1.4 MB' },
    { id: '3', name: 'Dental_Panoramic_XRay.png', category: 'picture', size: '4.8 MB' },
  ]);

  const updateField = <K extends keyof UploadSessionConfig>(key: K, value: UploadSessionConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const resetField = <K extends keyof UploadSessionConfig>(key: K) => {
    updateField(key, DEFAULT_UPLOAD_CONFIG[key]);
  };

  const handleResetAll = () => {
    setConfig({ ...DEFAULT_UPLOAD_CONFIG });
    setPos({ x: 0, y: 0 });
  };

  const handleCopyConfig = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Drag panel handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, button, select, textarea, [data-nodrag]')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({
      x: dragStart.current.initialX + dx,
      y: dragStart.current.initialY + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const removeMockFile = (id: string) => {
    setMockFiles(prev => prev.filter(f => f.id !== id));
  };

  const addMockFile = () => {
    const ext = ['pdf', 'png', 'dcm', 'zip'][Math.floor(Math.random() * 4)];
    const id = Date.now().toString();
    setMockFiles(prev => [
      ...prev,
      {
        id,
        name: `Scan_Record_${id.slice(-4)}.${ext}`,
        category: ext === 'pdf' ? 'summary' : ext === 'png' ? 'picture' : 'media',
        size: `${(Math.random() * 15 + 1).toFixed(1)} MB`,
      }
    ]);
  };

  const renderSlider = (
    label: string,
    key: keyof UploadSessionConfig,
    min: number,
    max: number,
    step: number = 1,
    unit: string = 'px'
  ) => {
    const val = config[key] as number;
    const isDefault = val === DEFAULT_UPLOAD_CONFIG[key];

    return (
      <div className="flex flex-col gap-1 py-1.5 border-b border-gray-100 last:border-0 text-xs">
        <div className="flex items-center justify-between text-gray-700 font-medium">
          <span>{label}</span>
          <div className="flex items-center gap-1">
            <span className="font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[11px]">
              {val}{unit}
            </span>
            <button
              onClick={() => resetField(key)}
              disabled={isDefault}
              title="Reset to default"
              className={`p-1 rounded ${isDefault ? 'text-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={() => updateField(key, Math.max(min, Number((val - step).toFixed(2))))}
            className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-bold"
          >
            -
          </button>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={val}
            onChange={e => updateField(key, parseFloat(e.target.value))}
            className="flex-1 accent-indigo-600 h-1.5 bg-gray-200 rounded cursor-pointer"
          />
          <button
            onClick={() => updateField(key, Math.min(max, Number((val + step).toFixed(2))))}
            className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-bold"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderColorPicker = (label: string, key: keyof UploadSessionConfig) => {
    const val = config[key] as string;
    const isDefault = val === DEFAULT_UPLOAD_CONFIG[key];

    return (
      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 text-xs">
        <span className="text-gray-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={val.startsWith('#') ? val : '#ffffff'}
            onChange={e => updateField(key, e.target.value)}
            className="w-6 h-6 p-0 border border-gray-300 rounded cursor-pointer"
          />
          <span className="font-mono text-gray-500 text-[11px]">{val}</span>
          <button
            onClick={() => resetField(key)}
            disabled={isDefault}
            className={`p-1 rounded ${isDefault ? 'text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const renderToggle = (label: string, key: keyof UploadSessionConfig) => {
    const val = config[key] as boolean;
    const isDefault = val === DEFAULT_UPLOAD_CONFIG[key];

    return (
      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 text-xs">
        <span className="text-gray-700 font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => updateField(key, !val)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              val ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {val ? 'Visible' : 'Hidden'}
          </button>
          <button
            onClick={() => resetField(key)}
            disabled={isDefault}
            className={`p-1 rounded ${isDefault ? 'text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const renderTextInput = (label: string, key: keyof UploadSessionConfig) => {
    const val = config[key] as string;
    const isDefault = val === DEFAULT_UPLOAD_CONFIG[key];

    return (
      <div className="flex flex-col gap-1 py-1.5 border-b border-gray-100 last:border-0 text-xs">
        <div className="flex items-center justify-between text-gray-700 font-medium">
          <span>{label}</span>
          <button
            onClick={() => resetField(key)}
            disabled={isDefault}
            className={`p-1 rounded ${isDefault ? 'text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        <input
          type="text"
          value={val}
          onChange={e => updateField(key, e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 focus:outline-indigo-500"
        />
      </div>
    );
  };

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-slate-100 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ── Left Side: Interactive Drag & Drop Sandbox Canvas ────────────────── */}
      <div className="flex-1 relative flex flex-col h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden">
        {/* Canvas Toolbar / Helper */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2 pointer-events-auto text-xs text-slate-600">
            <Move className="w-3.5 h-3.5 text-indigo-600" />
            <span><b>Drag Panel:</b> Click & hold anywhere on the card background to move around.</span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setPos({ x: 0, y: 0 })}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Center Panel
            </button>
            <button
              onClick={addMockFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md text-xs font-medium shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Mock File
            </button>
          </div>
        </div>

        {/* Center Container for the Upload Session Panel */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              width: `${config.panelWidth}px`,
              padding: `${config.panelPadding}px`,
              borderRadius: `${config.borderRadius}px`,
              backgroundColor: config.panelBgColor,
              opacity: config.panelOpacity,
              boxShadow: `0 16px ${config.shadowBlur}px ${config.shadowSpread}px ${config.shadowColor}`,
              border: `${config.borderWidth}px solid ${config.borderColor}`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            className="flex flex-col gap-2.5 transition-shadow select-none relative backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between min-h-[26px]">
              <div className="flex items-center gap-2">
                <Upload size={config.headerTitleSize} className="text-slate-500" />
                <span
                  style={{
                    fontSize: `${config.headerTitleSize}px`,
                    fontWeight: config.headerTitleWeight,
                    color: config.headerTitleColor,
                  }}
                >
                  Upload session
                </span>
                {config.showBadge && (
                  <span
                    style={{
                      backgroundColor: config.headerBadgeBg,
                      color: config.headerBadgeColor,
                    }}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200/80"
                  >
                    {config.headerBadgeText}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {config.showClearBtn && mockFiles.length > 0 && (
                  <button
                    data-nodrag
                    onClick={() => setMockFiles([])}
                    className="text-[11px] text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
                  >
                    Clear ({mockFiles.length})
                  </button>
                )}
                {config.showCloseBtn && (
                  <button
                    data-nodrag
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Warning / Portal Row */}
            {config.showPortalRow && (
              <div 
                className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap py-0.5"
                style={{
                  fontSize: `${config.portalTextSize}px`,
                  color: config.portalTextColor,
                }}
              >
                <span className="truncate">{config.portalText}</span>
              </div>
            )}

            {/* Description / Subtext */}
            {config.showDescription && (
              <p
                style={{
                  fontSize: `${config.descFontSize}px`,
                  color: config.descTextColor,
                }}
                className="m-0 leading-tight"
              >
                {config.descText}
              </p>
            )}

            {/* Categories Grid */}
            {config.showCategories && (
              <div 
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${config.categoryCols}, minmax(0, 1fr))`,
                  gap: `${config.categoryGap}px`,
                }}
              >
                {/* Summary card */}
                <div
                  data-nodrag
                  style={{
                    padding: `${config.categoryCardPadding}px`,
                    backgroundColor: config.categoryCardBg,
                    borderColor: config.categoryCardBorderColor,
                    borderRadius: `${config.categoryCardRadius}px`,
                  }}
                  className="flex flex-col gap-1 border shadow-2xs hover:border-slate-400 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <FileText size={config.categoryIconSize} className="text-slate-600" />
                    <span
                      style={{ fontSize: `${config.categoryTitleSize}px` }}
                      className="font-semibold text-slate-800 leading-tight"
                    >
                      Summary page
                    </span>
                  </div>
                  <span
                    style={{ fontSize: `${config.categorySubSize}px` }}
                    className="text-slate-400 truncate leading-tight"
                  >
                    Imaging summary (.pdf)
                  </span>
                </div>

                {/* Picture card */}
                <div
                  data-nodrag
                  style={{
                    padding: `${config.categoryCardPadding}px`,
                    backgroundColor: config.categoryCardBg,
                    borderColor: config.categoryCardBorderColor,
                    borderRadius: `${config.categoryCardRadius}px`,
                  }}
                  className="flex flex-col gap-1 border shadow-2xs hover:border-slate-400 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <Image size={config.categoryIconSize} className="text-slate-600" />
                    <span
                      style={{ fontSize: `${config.categoryTitleSize}px` }}
                      className="font-semibold text-slate-800 leading-tight"
                    >
                      Picture capture
                    </span>
                  </div>
                  <span
                    style={{ fontSize: `${config.categorySubSize}px` }}
                    className="text-slate-400 truncate leading-tight"
                  >
                    Film / report photo
                  </span>
                </div>

                {/* Media card */}
                <div
                  data-nodrag
                  style={{
                    padding: `${config.categoryCardPadding}px`,
                    backgroundColor: config.categoryCardBg,
                    borderColor: config.categoryCardBorderColor,
                    borderRadius: `${config.categoryCardRadius}px`,
                  }}
                  className="flex flex-col gap-1 border shadow-2xs hover:border-slate-400 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <Disc size={config.categoryIconSize} className="text-teal-600" />
                    <span
                      style={{ fontSize: `${config.categoryTitleSize}px` }}
                      className="font-semibold text-slate-800 leading-tight"
                    >
                      Media (disc export)
                    </span>
                  </div>
                  <span
                    style={{ fontSize: `${config.categorySubSize}px` }}
                    className="text-slate-400 truncate leading-tight"
                  >
                    MRI disc export
                  </span>
                </div>
              </div>
            )}

            {/* Dropzone */}
            {config.showDropzone && (
              <div
                data-nodrag
                style={{
                  padding: `${config.dropzonePadding}px`,
                  borderRadius: `${config.dropzoneBorderRadius}px`,
                  borderColor: config.dropzoneBorderColor,
                  backgroundColor: config.dropzoneBgColor,
                  fontSize: `${config.dropzoneFontSize}px`,
                }}
                className="flex items-center justify-center gap-2 border border-dashed text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <Paperclip size={config.dropzoneIconSize} />
                <span>
                  Drop files here or <u className="font-semibold text-slate-900">browse</u>
                </span>
                <span className="text-[10px] text-slate-400">
                  {config.dropzoneFormatsText}
                </span>
              </div>
            )}

            {/* Mock Files Section */}
            {config.showFileList && mockFiles.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {mockFiles.map(file => (
                    <div
                      key={file.id}
                      data-nodrag
                      style={{
                        backgroundColor: config.fileRowBg,
                        padding: `${config.fileRowPadding}px 10px`,
                        borderRadius: `${config.fileRowRadius}px`,
                      }}
                      className="flex items-center justify-between border border-slate-200/60 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {file.category === 'summary' && <FileText size={12} className="text-slate-500" />}
                        {file.category === 'picture' && <Image size={12} className="text-slate-500" />}
                        {file.category === 'media' && <Disc size={12} className="text-teal-600" />}
                        <span 
                          style={{ fontSize: `${config.fileNameSize}px` }} 
                          className="font-medium text-slate-700 truncate max-w-[200px]"
                        >
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                        <button
                          onClick={() => removeMockFile(file.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete element"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Side: Live Control & Tweak Panel ────────────────────────────── */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-md z-30">
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Session Sandbox</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-all shadow-xs"
              title="Reset everything to default"
            >
              <RotateCcw className="w-3 h-3" />
              Default
            </button>
            <button
              onClick={handleCopyConfig}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-all shadow-xs ${
                copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Export'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 p-1 gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('layout')}
            className={`flex-1 py-1.5 rounded transition-colors ${
              activeTab === 'layout' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Layout
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex-1 py-1.5 rounded transition-colors ${
              activeTab === 'typography' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Type & Colors
          </button>
          <button
            onClick={() => setActiveTab('elements')}
            className={`flex-1 py-1.5 rounded transition-colors ${
              activeTab === 'elements' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Elements
          </button>
          <button
            onClick={() => setActiveTab('visibility')}
            className={`flex-1 py-1.5 rounded transition-colors ${
              activeTab === 'visibility' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Visibility
          </button>
        </div>

        {/* Tab Controls Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB: LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Panel Box Dimensions</h3>
              {renderSlider('Panel Width', 'panelWidth', 320, 800, 10)}
              {renderSlider('Internal Padding', 'panelPadding', 8, 40, 1)}
              {renderSlider('Corner Radius', 'borderRadius', 0, 32, 1)}
              {renderSlider('Border Width', 'borderWidth', 0, 8, 1)}
              {renderSlider('Opacity', 'panelOpacity', 0.1, 1.0, 0.05, '')}

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Shadow Styling</h3>
              {renderSlider('Shadow Blur', 'shadowBlur', 0, 80, 2)}
              {renderSlider('Shadow Spread', 'shadowSpread', -10, 30, 1)}
            </div>
          )}

          {/* TAB: TYPOGRAPHY & COLORS */}
          {activeTab === 'typography' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Colors</h3>
              {renderColorPicker('Panel Background', 'panelBgColor')}
              {renderColorPicker('Panel Border Color', 'borderColor')}
              {renderColorPicker('Header Title Color', 'headerTitleColor')}
              {renderColorPicker('Warning / Notice Color', 'portalTextColor')}
              {renderColorPicker('Description Color', 'descTextColor')}

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Font Sizes</h3>
              {renderSlider('Header Title Size', 'headerTitleSize', 10, 24, 1)}
              {renderSlider('Notice / Warning Size', 'portalTextSize', 9, 18, 1)}
              {renderSlider('Description Size', 'descFontSize', 9, 18, 1)}
              {renderSlider('Dropzone Text Size', 'dropzoneFontSize', 9, 18, 1)}
              {renderSlider('Category Title Size', 'categoryTitleSize', 9, 18, 1)}
              {renderSlider('Category Subtitle Size', 'categorySubSize', 8, 16, 1)}
            </div>
          )}

          {/* TAB: ELEMENTS CONFIG */}
          {activeTab === 'elements' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notice / Warning Bar</h3>
              {renderTextInput('Warning / Portal Notice Text', 'portalText')}

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Description</h3>
              {renderTextInput('Description Text', 'descText')}

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Category Cards</h3>
              {renderSlider('Grid Columns', 'categoryCols', 1, 4, 1, ' cols')}
              {renderSlider('Grid Gap', 'categoryGap', 2, 24, 1)}
              {renderSlider('Card Padding', 'categoryCardPadding', 4, 24, 1)}
              {renderSlider('Card Corner Radius', 'categoryCardRadius', 0, 20, 1)}
              {renderSlider('Icon Size', 'categoryIconSize', 10, 28, 1)}

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Dropzone</h3>
              {renderSlider('Dropzone Padding', 'dropzonePadding', 6, 32, 1)}
              {renderSlider('Dropzone Radius', 'dropzoneBorderRadius', 0, 24, 1)}
              {renderSlider('Dropzone Icon Size', 'dropzoneIconSize', 10, 24, 1)}
              {renderTextInput('Dropzone Main Text', 'dropzoneText')}
              {renderTextInput('Formats Hint Text', 'dropzoneFormatsText')}
            </div>
          )}

          {/* TAB: VISIBILITY (DELETE / HIDE ELEMENTS) */}
          {activeTab === 'visibility' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toggle / Remove Elements</h3>
              <p className="text-[11px] text-slate-500">
                Instantly show or hide components to test cleaner layout variations:
              </p>
              {renderToggle('Warning / Portal Row', 'showPortalRow')}
              {renderToggle('Description Subtitle', 'showDescription')}
              {renderToggle('Category Buttons Grid', 'showCategories')}
              {renderToggle('Dropzone Area', 'showDropzone')}
              {renderToggle('Header Badge ("Local only")', 'showBadge')}
              {renderToggle('Close Button (X)', 'showCloseBtn')}
              {renderToggle('Clear Button', 'showClearBtn')}
              {renderToggle('File List Preview', 'showFileList')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
