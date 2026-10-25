import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AccessCodeItem {
  id: string;
  code: string;
  userName: string;
  createdAt: string;
  status: 'active' | 'revoked';
  devices: string[]; // List of registered device IDs (max 2)
}

const STORAGE_CODES_KEY = 'audit_access_codes_v2';
const ACTIVE_PIN_KEY = 'audit_active_pin_v2';
const DEVICE_ID_KEY = 'audit_app_device_id_v2';

/**
 * Get or generate a unique persistent ID for this browser / device
 */
export const getDeviceId = (): string => {
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      devId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 9);
  }
};

const DEFAULT_CODES: AccessCodeItem[] = [
  {
    id: 'code-default-1',
    code: 'AUDIT2026',
    userName: 'সম্মানিত অডিটর (ডিফল্ট কোড)',
    createdAt: new Date().toISOString(),
    status: 'active',
    devices: []
  }
];

/**
 * Fetch all access codes (from Supabase or LocalStorage fallback)
 */
export const getAccessCodes = async (): Promise<AccessCodeItem[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'access_codes_list')
        .maybeSingle();

      if (!error && data && Array.isArray(data.value) && data.value.length > 0) {
        localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(data.value));
        return data.value as AccessCodeItem[];
      }
    } catch (err) {
      console.warn('Could not fetch access_codes_list from Supabase:', err);
    }
  }

  // Fallback to local storage
  try {
    const localStr = localStorage.getItem(STORAGE_CODES_KEY);
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Initialize with default codes
  saveAccessCodes(DEFAULT_CODES);
  return DEFAULT_CODES;
};

/**
 * Save access codes list to LocalStorage & Supabase
 */
export const saveAccessCodes = async (codes: AccessCodeItem[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(codes));
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('app_settings')
        .upsert({ key: 'access_codes_list', value: codes }, { onConflict: 'key' });
      return true;
    } catch (err) {
      console.error('Failed saving access_codes_list to Supabase:', err);
    }
  }
  return true;
};

/**
 * Verify a PIN/Code and register device if eligible
 */
export const verifyAndActivatePin = async (
  inputPin: string
): Promise<{
  success: boolean;
  message: string;
  isDeviceLimitReached?: boolean;
  deviceCount?: number;
  userName?: string;
  codeItem?: AccessCodeItem;
}> => {
  const pinClean = (inputPin || '').trim().toUpperCase();
  if (!pinClean) {
    return { success: false, message: 'দয়া করে একটি সঠিক অ্যাক্সেস কোড লিখুন।' };
  }

  const codes = await getAccessCodes();
  const codeItem = codes.find(c => c.code.toUpperCase() === pinClean);

  if (!codeItem) {
    return { success: false, message: 'ভুল অ্যাক্সেস কোড! এই নামে কোনো অ্যাক্সেস কোড পাওয়া যায়নি।' };
  }

  if (codeItem.status === 'revoked') {
    return { success: false, message: 'এই অ্যাক্সেস কোডটি বাতিল (Revoked) করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।' };
  }

  const currDevId = getDeviceId();
  const registeredDevs = Array.isArray(codeItem.devices) ? codeItem.devices : [];

  // Case 1: Device is already registered for this PIN
  if (registeredDevs.includes(currDevId)) {
    try {
      localStorage.setItem(ACTIVE_PIN_KEY, pinClean);
    } catch {}

    return {
      success: true,
      message: `অ্যাক্সেস সফল! আপনার ডিভাইসটিতে এই কোডটি ইতোমধ্যেই অনুমোদিত আছে (${registeredDevs.length}/২ ডিভাইস নিবন্ধিত)।`,
      deviceCount: registeredDevs.length,
      userName: codeItem.userName,
      codeItem
    };
  }

  // Case 2: Device is new, check if device limit (Max 2) is reached
  if (registeredDevs.length < 2) {
    const updatedDevs = [...registeredDevs, currDevId];
    codeItem.devices = updatedDevs;

    // Save updated codes list
    const updatedCodes = codes.map(c => (c.id === codeItem.id ? codeItem : c));
    await saveAccessCodes(updatedCodes);

    try {
      localStorage.setItem(ACTIVE_PIN_KEY, pinClean);
    } catch {}

    return {
      success: true,
      message: `অ্যাক্সেস সফল! আপনার এই নতুন ডিভাইসটিতে কোডটি সক্রিয় করা হয়েছে (${updatedDevs.length}/২ ডিভাইস ব্যবহৃত)।`,
      deviceCount: updatedDevs.length,
      userName: codeItem.userName,
      codeItem
    };
  }

  // Case 3: Device limit reached (2/2) for this PIN
  return {
    success: false,
    isDeviceLimitReached: true,
    deviceCount: 2,
    userName: codeItem.userName,
    message: 'এই অ্যাক্সেস কোডটি ইতোমধ্যে সর্বোচ্চ ২টি ডিভাইসে ব্যবহার করা হয়ে গেছে! ৩য় কোনো নতুন ডিভাইসে ব্যবহারের অনুমতি নেই।'
  };
};

/**
 * Check if the current device has an active unlocked PIN saved
 */
export const checkCurrentDeviceUnlock = async (): Promise<{
  isUnlocked: boolean;
  activePin?: string;
  userName?: string;
  deviceCount?: number;
}> => {
  try {
    const savedPin = localStorage.getItem(ACTIVE_PIN_KEY);
    if (!savedPin) return { isUnlocked: false };

    const codes = await getAccessCodes();
    const currDevId = getDeviceId();
    const pinClean = savedPin.trim().toUpperCase();

    const codeItem = codes.find(c => c.code.toUpperCase() === pinClean);
    if (
      codeItem &&
      codeItem.status === 'active' &&
      Array.isArray(codeItem.devices) &&
      codeItem.devices.includes(currDevId)
    ) {
      return {
        isUnlocked: true,
        activePin: codeItem.code,
        userName: codeItem.userName,
        deviceCount: codeItem.devices.length
      };
    }
  } catch {}

  return { isUnlocked: false };
};

/**
 * Logout / Clear active PIN on this device
 */
export const deactivateCurrentDevicePin = () => {
  try {
    localStorage.removeItem(ACTIVE_PIN_KEY);
  } catch {}
};
