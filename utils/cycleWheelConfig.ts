/**
 * Cycle Wheel Configuration & Feature Registry
 * Defines the features available on the interactive cyclical chevron menu,
 * their visual colors matching the design cycle palette, and localStorage persistence.
 */

export interface CycleWheelItem {
  id: string;
  title: string;
  shortTitle: string;
  englishLabel?: string;
  numberBn: string;
  numberEn: string;
  color: string;           // Base hex color matching the reference diagram
  gradient: string;        // SVG or CSS gradient
  hoverColor: string;
  textColor: string;
  iconName: string;
  tab: string;
  subModule?: 'settlement' | 'correspondence';
  defaultEnabled: boolean;
}

// Master list of all features that can appear on the cyclical wheel
// Distinct and clear segments for:
// 1. চিঠিপত্র এন্ট্রি (Correspondence Entry)
// 2. মীমাংসা এন্ট্রি (Settlement Entry)
// 3. চিঠিপত্র রেজিস্টার (Correspondence Register)
// 4. মীমাংসা রেজিস্টার (Settlement Register)
// 5. রিপোর্ট ও সারাংশ (Reports)
export const MASTER_WHEEL_ITEMS: CycleWheelItem[] = [
  {
    id: 'entry_correspondence',
    title: 'চিঠিপত্র এন্ট্রি',
    shortTitle: 'চিঠি এন্ট্রি',
    englishLabel: 'CORR. ENTRY',
    numberBn: '১',
    numberEn: '1',
    color: '#0284c7',      // Sky Blue
    gradient: 'from-[#38bdf8] to-[#0284c7]',
    hoverColor: '#0369a1',
    textColor: '#ffffff',
    iconName: 'MailPlus',
    tab: 'entry',
    subModule: 'correspondence',
    defaultEnabled: true,
  },
  {
    id: 'entry_settlement',
    title: 'মীমাংসা এন্ট্রি',
    shortTitle: 'মীমাংসা এন্ট্রি',
    englishLabel: 'SETTLE ENTRY',
    numberBn: '২',
    numberEn: '2',
    color: '#dc2626',      // Red / Coral
    gradient: 'from-[#ef4444] to-[#b91c1c]',
    hoverColor: '#b91c1c',
    textColor: '#ffffff',
    iconName: 'FilePlus2',
    tab: 'entry',
    subModule: 'settlement',
    defaultEnabled: true,
  },
  {
    id: 'register_correspondence',
    title: 'চিঠিপত্র রেজিস্টার',
    shortTitle: 'চিঠি রেজিস্টার',
    englishLabel: 'CORR. REG',
    numberBn: '৩',
    numberEn: '3',
    color: '#eab308',      // Amber / Gold
    gradient: 'from-[#facc15] to-[#ca8a04]',
    hoverColor: '#ca8a04',
    textColor: '#ffffff',
    iconName: 'Mail',
    tab: 'register',
    subModule: 'correspondence',
    defaultEnabled: true,
  },
  {
    id: 'register_settlement',
    title: 'মীমাংসা রেজিস্টার',
    shortTitle: 'মীমাংসা রেজিস্টার',
    englishLabel: 'SETTLE REG',
    numberBn: '৪',
    numberEn: '4',
    color: '#1e3a8a',      // Dark Slate Navy
    gradient: 'from-[#1e40af] to-[#172554]',
    hoverColor: '#172554',
    textColor: '#ffffff',
    iconName: 'ClipboardCheck',
    tab: 'register',
    subModule: 'settlement',
    defaultEnabled: true,
  },
  {
    id: 'return',
    title: 'রিপোর্ট ও সারাংশ',
    shortTitle: 'রিপোর্ট',
    englishLabel: 'REPORTS',
    numberBn: '৫',
    numberEn: '5',
    color: '#0d9488',      // Teal / Emerald
    gradient: 'from-[#14b8a6] to-[#0f766e]',
    hoverColor: '#0f766e',
    textColor: '#ffffff',
    iconName: 'PieChart',
    tab: 'return',
    defaultEnabled: true,
  },
];

const STORAGE_KEY = 'cycle_wheel_module_settings';

/**
 * Load wheel configuration from localStorage
 */
export function getWheelSettings(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load cycle wheel settings:', err);
  }

  // Default settings
  const defaults: Record<string, boolean> = {};
  MASTER_WHEEL_ITEMS.forEach((item) => {
    defaults[item.id] = item.defaultEnabled;
  });
  return defaults;
}

/**
 * Save wheel configuration to localStorage and dispatch custom event
 */
export function saveWheelSettings(settings: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('cycle-wheel-settings-updated', { detail: settings }));
  } catch (err) {
    console.error('Failed to save cycle wheel settings:', err);
  }
}

/**
 * Get active, ordered wheel items according to current settings
 */
export function getActiveWheelItems(settings?: Record<string, boolean>): CycleWheelItem[] {
  const currentSettings = settings || getWheelSettings();
  const active = MASTER_WHEEL_ITEMS.filter((item) => currentSettings[item.id] ?? item.defaultEnabled);
  
  // Re-index Bengali/English numbers sequentially for the active set
  const bengaliDigits = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '১০'];
  return active.map((item, idx) => ({
    ...item,
    numberBn: bengaliDigits[idx] || `${idx + 1}`,
    numberEn: `${idx + 1}`,
  }));
}
