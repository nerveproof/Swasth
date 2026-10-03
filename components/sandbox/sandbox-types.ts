export interface SandboxConfig {
  // 3D Controls
  fov: number;
  meshScale: number;
  clearColor: string;
  exposure: number;
  dampingFactor: number;
  groundVisible: boolean;
  platformVisible: boolean;

  // Lighting Controls
  keyLightIntensity: number;
  keyLightX: number;
  keyLightY: number;
  keyLightZ: number;
  rimLightIntensity: number;
  rimLightX: number;
  rimLightY: number;
  rimLightZ: number;
  hemiLightIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;

  // UI Styling & Layout Controls
  uiPadding: number;
  uiMargin: number;
  uiZIndex: number;
  cardMaxHeight: number;
  tooltipFontSize: number;
  badgeOffsetX: number;
  badgeOffsetY: number;
  overlayOpacity: number;
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  fov: 34,
  meshScale: 1.0,
  clearColor: '#f2f3f3',
  exposure: 1.12,
  dampingFactor: 0.085,
  groundVisible: true,
  platformVisible: true,

  keyLightIntensity: 2.3,
  keyLightX: -2,
  keyLightY: 4,
  keyLightZ: 3,
  rimLightIntensity: 1.8,
  rimLightX: 2,
  rimLightY: 2,
  rimLightZ: -3,
  hemiLightIntensity: 1.05,
  hemiSkyColor: '#ffffff',
  hemiGroundColor: '#a7acb2',

  uiPadding: 16,
  uiMargin: 12,
  uiZIndex: 50,
  cardMaxHeight: 420,
  tooltipFontSize: 13,
  badgeOffsetX: 0,
  badgeOffsetY: 0,
  overlayOpacity: 0.85,
};

export function formatConfigAsSnippet(config: SandboxConfig): string {
  return `export const customConfig = ${JSON.stringify(config, null, 2)};`;
}
