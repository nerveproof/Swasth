import React, { useState } from 'react';
import { SandboxConfig, DEFAULT_SANDBOX_CONFIG, formatConfigAsSnippet } from './sandbox-types';
import { RotateCcw, Copy, Check, Sliders, Sun, Layout, Eye } from 'lucide-react';

interface Props {
  config: SandboxConfig;
  onChange: (newConfig: SandboxConfig) => void;
  onResetAll: () => void;
}

export function SandboxControlsPanel({ config, onChange, onResetAll }: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'lights' | 'ui' | 'shaders'>('3d');

  const updateField = <K extends keyof SandboxConfig>(key: K, value: SandboxConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const resetField = <K extends keyof SandboxConfig>(key: K) => {
    updateField(key, DEFAULT_SANDBOX_CONFIG[key]);
  };

  const handleCopy = async () => {
    const snippet = formatConfigAsSnippet(config);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
      const textArea = document.createElement('textarea');
      textArea.value = snippet;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderSlider = (
    label: string,
    key: keyof SandboxConfig,
    min: number,
    max: number,
    step: number = 0.01
  ) => {
    const val = config[key] as number;
    const isDefault = val === DEFAULT_SANDBOX_CONFIG[key];

    return (
      <div className="flex flex-col gap-1 text-xs py-1.5 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center justify-between font-medium text-gray-700">
          <span>{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
              {typeof val === 'number' ? (Number.isInteger(step) ? val : val.toFixed(2)) : val}
            </span>
            <button
              onClick={() => resetField(key)}
              title="Reset setting"
              disabled={isDefault}
              className={`p-1 rounded transition-colors ${
                isDefault
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => updateField(key, Math.max(min, Number((val - step).toFixed(4))))}
            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded font-bold text-gray-600 transition-colors"
          >
            -
          </button>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={val}
            onChange={(e) => updateField(key, parseFloat(e.target.value))}
            className="flex-1 accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
          />
          <button
            onClick={() => updateField(key, Math.min(max, Number((val + step).toFixed(4))))}
            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded font-bold text-gray-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderColorPicker = (label: string, key: keyof SandboxConfig) => {
    const val = config[key] as string;
    const isDefault = val === DEFAULT_SANDBOX_CONFIG[key];

    return (
      <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100">
        <span className="font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={val}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
          />
          <span className="font-mono text-gray-600 text-[11px]">{val}</span>
          <button
            onClick={() => resetField(key)}
            title="Reset setting"
            disabled={isDefault}
            className={`p-1 rounded transition-colors ${
              isDefault
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const renderToggle = (label: string, key: keyof SandboxConfig) => {
    const val = config[key] as boolean;
    const isDefault = val === DEFAULT_SANDBOX_CONFIG[key];

    return (
      <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100">
        <span className="font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateField(key, !val)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
              val
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {val ? 'Enabled' : 'Disabled'}
          </button>
          <button
            onClick={() => resetField(key)}
            title="Reset setting"
            disabled={isDefault}
            className={`p-1 rounded transition-colors ${
              isDefault
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full max-w-sm shadow-sm select-none">
      {/* Top Header Actions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h2 className="font-bold text-gray-800 text-sm">Control Panel</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetAll}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium transition-all shadow-xs"
            title="Reset all settings to default"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy Config'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50/50 p-1 gap-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded transition-colors ${
            activeTab === '3d'
              ? 'bg-white text-indigo-600 shadow-xs border border-gray-200 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          3D View
        </button>
        <button
          onClick={() => setActiveTab('lights')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded transition-colors ${
            activeTab === 'lights'
              ? 'bg-white text-indigo-600 shadow-xs border border-gray-200 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          Lighting
        </button>
        <button
          onClick={() => setActiveTab('ui')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded transition-colors ${
            activeTab === 'ui'
              ? 'bg-white text-indigo-600 shadow-xs border border-gray-200 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          UI Layout
        </button>
      </div>

      {/* Scrollable Controls Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === '3d' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Camera & Scene</h3>
            {renderSlider('Camera FOV (deg)', 'fov', 15, 90, 1)}
            {renderSlider('Mesh Scale', 'meshScale', 0.2, 3.0, 0.05)}
            {renderSlider('Tone Mapping Exposure', 'exposure', 0.2, 3.0, 0.05)}
            {renderSlider('Orbit Damping Factor', 'dampingFactor', 0.01, 0.3, 0.005)}
            {renderColorPicker('Background Clear Color', 'clearColor')}
            {renderToggle('Ground Circle', 'groundVisible')}
            {renderToggle('Platform Cylinder', 'platformVisible')}
          </div>
        )}

        {activeTab === 'lights' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Light (Directional)</h3>
              {renderSlider('Key Light Intensity', 'keyLightIntensity', 0, 8, 0.1)}
              {renderSlider('Key Position X', 'keyLightX', -10, 10, 0.5)}
              {renderSlider('Key Position Y', 'keyLightY', -10, 10, 0.5)}
              {renderSlider('Key Position Z', 'keyLightZ', -10, 10, 0.5)}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rim Light (Directional)</h3>
              {renderSlider('Rim Light Intensity', 'rimLightIntensity', 0, 8, 0.1)}
              {renderSlider('Rim Position X', 'rimLightX', -10, 10, 0.5)}
              {renderSlider('Rim Position Y', 'rimLightY', -10, 10, 0.5)}
              {renderSlider('Rim Position Z', 'rimLightZ', -10, 10, 0.5)}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hemisphere Light</h3>
              {renderSlider('Hemisphere Intensity', 'hemiLightIntensity', 0, 5, 0.05)}
              {renderColorPicker('Sky Color', 'hemiSkyColor')}
              {renderColorPicker('Ground Color', 'hemiGroundColor')}
            </div>
          </div>
        )}

        {activeTab === 'ui' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">UI Spacing & Elements</h3>
            {renderSlider('UI Container Padding (px)', 'uiPadding', 0, 48, 2)}
            {renderSlider('UI Container Margin (px)', 'uiMargin', 0, 48, 2)}
            {renderSlider('Z-Index Base', 'uiZIndex', 1, 100, 1)}
            {renderSlider('Card Max Height (px)', 'cardMaxHeight', 200, 800, 10)}
            {renderSlider('Tooltip Font Size (px)', 'tooltipFontSize', 9, 24, 1)}
            {renderSlider('Badge Offset X (px)', 'badgeOffsetX', -50, 50, 1)}
            {renderSlider('Badge Offset Y (px)', 'badgeOffsetY', -50, 50, 1)}
            {renderSlider('Overlay Opacity', 'overlayOpacity', 0.1, 1.0, 0.05)}
          </div>
        )}
      </div>
    </div>
  );
}
