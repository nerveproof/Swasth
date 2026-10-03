import React, { useState } from 'react';
import { DEFAULT_SANDBOX_CONFIG, SandboxConfig } from './sandbox-types';
import { SandboxControlsPanel } from './sandbox-controls-panel';
import { SandboxScene } from './sandbox-scene';
import { ArrowLeft, Sparkles, Box, Info, Layers, Upload } from 'lucide-react';
import { UploadSessionSandbox } from './upload-session-sandbox';

interface Props {
  onBackToAtlas: () => void;
}

export function SandboxPage({ onBackToAtlas }: Props) {
  const [activeMode, setActiveMode] = useState<'upload-session' | '3d-scene'>('upload-session');
  const [config, setConfig] = useState<SandboxConfig>(DEFAULT_SANDBOX_CONFIG);

  const handleResetAll = () => {
    setConfig({ ...DEFAULT_SANDBOX_CONFIG });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 font-sans">
      {/* Top Header Bar */}
      <header className="h-14 bg-gray-950 border-b border-gray-800 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAtlas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Swastha
          </button>
          <div className="h-4 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h1 className="text-sm font-bold tracking-wide">Interactive Sandbox</h1>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-gray-900 border border-gray-800 p-0.5 rounded-lg ml-2">
            <button
              onClick={() => setActiveMode('upload-session')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeMode === 'upload-session'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Session
            </button>
            <button
              onClick={() => setActiveMode('3d-scene')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeMode === '3d-scene'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3D & Lighting
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Quick Presets:</span>
          <button
            onClick={() => setConfig({ ...DEFAULT_SANDBOX_CONFIG })}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
          >
            Default Studio
          </button>
          <button
            onClick={() =>
              setConfig({
                ...config,
                fov: 45,
                keyLightIntensity: 4.5,
                rimLightIntensity: 3.0,
                clearColor: '#0f172a',
                hemiSkyColor: '#60a5fa',
              })
            }
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
          >
            Dramatic Dark
          </button>
          <button
            onClick={() =>
              setConfig({
                ...config,
                fov: 25,
                keyLightIntensity: 1.5,
                exposure: 1.4,
                clearColor: '#ffffff',
              })
            }
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
          >
            Clean Studio
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeMode === 'upload-session' ? (
        <UploadSessionSandbox />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Side: Real-time 3D Scene + UI Overlays */}
          <div className="flex-1 relative flex flex-col bg-slate-900">
            <SandboxScene atlas={null} config={config} />

            {/* Interactive UI Component Overlay preview to test UI styling sliders live */}
            <div
              className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md border border-gray-700 text-white rounded-lg shadow-xl max-w-xs transition-all pointer-events-auto"
              style={{
                padding: `${config.uiPadding}px`,
                margin: `${config.uiMargin}px`,
                zIndex: config.uiZIndex,
                opacity: config.overlayOpacity,
              }}
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-xs">Live UI Preview Card</span>
                </div>
                <span
                  className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    transform: `translate(${config.badgeOffsetX}px, ${config.badgeOffsetY}px)`,
                  }}
                >
                  Badge
                </span>
              </div>
              <p className="text-gray-300" style={{ fontSize: `${config.tooltipFontSize}px` }}>
                This card dynamically responds to UI Padding, Margin, Tooltip Font Size, Badge Offsets, and Opacity controls in real time.
              </p>
              <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-indigo-400" /> FOV: {config.fov}°
                </span>
                <span>Exposure: {config.exposure}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Control Panel */}
          <SandboxControlsPanel config={config} onChange={setConfig} onResetAll={handleResetAll} />
        </div>
      )}
    </div>
  );
}

