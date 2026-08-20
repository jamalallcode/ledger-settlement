// Display Scale Controller & Auto Monitor Detection
export type DisplayScaleOption = 'auto' | '100%' | '110%' | '120%' | '130%' | '140%' | '150%';

const STORAGE_KEY = 'ledger_display_scale_v1';

export const getSavedDisplayScale = (): DisplayScaleOption => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val && ['auto', '100%', '110%', '120%', '130%', '140%', '150%'].includes(val)) {
      return val as DisplayScaleOption;
    }
  } catch (e) {
    // fallback
  }
  return 'auto';
};

export const setSavedDisplayScale = (scale: DisplayScaleOption) => {
  try {
    localStorage.setItem(STORAGE_KEY, scale);
  } catch (e) {
    // fallback
  }
  applyDisplayScale(scale);
};

export const calculateEffectiveZoom = (scale: DisplayScaleOption): number => {
  if (scale === '100%') return 1.0;
  if (scale === '110%') return 1.10;
  if (scale === '120%') return 1.20;
  if (scale === '130%') return 1.30;
  if (scale === '140%') return 1.40;
  if (scale === '150%') return 1.50;

  // Auto mode: Intelligent monitor & screen size detection
  if (typeof window === 'undefined') return 1.0;

  const w = window.innerWidth || 1280;
  const sw = window.screen?.availWidth || window.screen?.width || w;
  const maxDimension = Math.max(w, sw);

  // 4K and Ultra-wide screens
  if (maxDimension >= 2800 || w >= 2400) {
    return 1.40;
  }
  // 2K / QHD monitors (2560px)
  if (maxDimension >= 2200 || w >= 2000) {
    return 1.30;
  }
  // Full HD 1080p monitors & 24"/27" desktops (1920px)
  if (maxDimension >= 1700 || w >= 1600) {
    return 1.20;
  }
  // Large laptops & medium desktop monitors (1440px - 1600px)
  if (maxDimension >= 1400 || w >= 1350) {
    return 1.10;
  }
  
  return 1.0;
};

export const applyDisplayScale = (scale?: DisplayScaleOption): number => {
  const currentScale = scale || getSavedDisplayScale();
  const zoomFactor = calculateEffectiveZoom(currentScale);

  if (typeof document !== 'undefined') {
    // Apply zoom on documentElement, body and root for 100% coverage
    try {
      if (document.documentElement) {
        (document.documentElement.style as any).zoom = `${zoomFactor}`;
      }
      if (document.body) {
        (document.body.style as any).zoom = `${zoomFactor}`;
      }
      const rootEl = document.getElementById('root');
      if (rootEl) {
        (rootEl.style as any).zoom = `${zoomFactor}`;
      }
    } catch (err) {
      console.warn('Display zoom apply warning:', err);
    }
  }

  return zoomFactor;
};
