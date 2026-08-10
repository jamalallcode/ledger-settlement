import { toBengaliDigits } from '../utils/numberUtils';

export interface VisitorLog {
  id: string;
  identifier: string; // Gmail or Mobile number
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  formattedDate: string; // e.g. ৩১ জুলাই, ২০২৬
  formattedTime: string; // e.g. ০৫:২০ PM
  deviceInfo: string;
  visitCount: number;
  isWhitelisted: boolean;
  notes?: string;
}

const STORAGE_KEY = 'audit_doc_visitor_logs';

const MOCK_IDENTIFIERS = [
  'audit.officer99@gmail.com',
  '01715998844',
  'approved.auditor@gmail.com',
  'karim.cag.bd@gmail.com',
  '01812345678',
  'rahim.accountant@gmail.com',
  '01911223344',
  'deputy.auditor.cag@gmail.com'
];

/**
 * Validates whether an identifier is a complete, valid email or a valid phone number.
 * Filters out incomplete strings typed mid-way (e.g. 'kamalismybrother@gmai', 'kamal@gmail.').
 */
export const isValidIdentifier = (identifier: string): boolean => {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  if (!clean || clean.length < 5) return false;

  // Check if it's an email format
  if (clean.includes('@')) {
    // Valid email must follow user@domain.tld pattern with at least 2 char TLD
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) return false;

    // Reject incomplete or domain typos like 'gmail.co', 'gmai.com', 'gmail.c', etc.
    const parts = clean.split('@');
    if (parts.length === 2) {
      const domain = parts[1];
      // Check specific common typos for major providers
      if (
        domain === 'gmail.co' || 
        domain === 'gmail.c' || 
        domain === 'gmail.con' || 
        domain === 'gmail.cm' || 
        domain === 'gmai.com' || 
        domain === 'gmai.co' || 
        domain === 'yahoo.co' || 
        domain === 'hotmail.co' ||
        domain.endsWith('.co.com')
      ) {
        return false;
      }
    }
    return true;
  }

  // Check if it's a mobile/phone number (11 digits or +8801...)
  const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
  if (phoneRegex.test(clean)) return true;

  // Fallback: 10-14 pure digits
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length >= 10 && digitsOnly.length <= 14) return true;

  return false;
};

/**
 * Cleans, filters out incomplete/invalid emails, and groups/aggregates logs by unique identifier.
 */
export const cleanAndGroupVisitorLogs = (rawLogs: any[]): VisitorLog[] => {
  if (!Array.isArray(rawLogs)) return [];

  // Map to hold aggregated log per unique identifier
  const map = new Map<string, VisitorLog>();

  for (const item of rawLogs) {
    if (!item || !item.identifier) continue;
    const cleanId = String(item.identifier).trim().toLowerCase();

    // Skip invalid incomplete identifiers or mock demo identifiers
    if (!isValidIdentifier(cleanId) || MOCK_IDENTIFIERS.includes(cleanId)) {
      continue;
    }

    const itemTimestamp = Number(item.timestamp) || Date.now();
    const itemVisitCount = Math.max(1, Number(item.visitCount) || 1);

    if (map.has(cleanId)) {
      const existing = map.get(cleanId)!;
      // Combine visits count
      existing.visitCount = existing.visitCount + itemVisitCount;

      // Keep the latest timestamp and date/time formatting
      if (itemTimestamp > existing.timestamp) {
        existing.timestamp = itemTimestamp;
        existing.dateStr = item.dateStr || existing.dateStr;
        existing.formattedDate = item.formattedDate || existing.formattedDate;
        existing.formattedTime = item.formattedTime || existing.formattedTime;
        existing.deviceInfo = item.deviceInfo || existing.deviceInfo;
        existing.isWhitelisted = item.isWhitelisted ?? existing.isWhitelisted;
      }
    } else {
      map.set(cleanId, {
        id: item.id || `vlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        identifier: cleanId,
        timestamp: itemTimestamp,
        dateStr: item.dateStr || new Date(itemTimestamp).toISOString().split('T')[0],
        formattedDate: item.formattedDate || 'আজ',
        formattedTime: item.formattedTime || '',
        deviceInfo: item.deviceInfo || 'Desktop Device',
        visitCount: itemVisitCount,
        isWhitelisted: Boolean(item.isWhitelisted)
      });
    }
  }

  // Convert to array and sort by latest timestamp descending
  const sorted = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  return sorted;
};

export const getInitialVisitorLogs = (): VisitorLog[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const cleaned = cleanAndGroupVisitorLogs(parsed);
      // Persist cleaned deduplicated list back to storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    } catch (e) {}
  }
  return [];
};

export const recordVisitorLog = (identifier: string, isWhitelisted: boolean): VisitorLog[] => {
  if (!identifier || !isValidIdentifier(identifier)) {
    return getInitialVisitorLogs();
  }

  const logs = getInitialVisitorLogs();
  const clean = identifier.trim().toLowerCase();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const day = toBengaliDigits(now.getDate().toString().padStart(2, '0'));
  const month = months[now.getMonth()];
  const year = toBengaliDigits(now.getFullYear().toString());
  const formattedDate = `${day} ${month}, ${year} (আজ)`;

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedTime = `${toBengaliDigits(hours.toString().padStart(2, '0'))}:${toBengaliDigits(minutes)} ${ampm}`;

  const existingIndex = logs.findIndex(l => l.identifier.toLowerCase() === clean);

  if (existingIndex >= 0) {
    logs[existingIndex].timestamp = Date.now();
    logs[existingIndex].dateStr = dateStr;
    logs[existingIndex].formattedDate = formattedDate;
    logs[existingIndex].formattedTime = formattedTime;
    logs[existingIndex].visitCount += 1;
    logs[existingIndex].isWhitelisted = isWhitelisted;
  } else {
    logs.unshift({
      id: `vlog-${Date.now()}`,
      identifier: clean,
      timestamp: Date.now(),
      dateStr,
      formattedDate,
      formattedTime,
      deviceInfo: typeof window !== 'undefined' && window.navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device',
      visitCount: 1,
      isWhitelisted
    });
  }

  // Re-sort so newest visit is at top
  logs.sort((a, b) => b.timestamp - a.timestamp);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return logs;
};

export const clearAllVisitorLogs = (): VisitorLog[] => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
};

export interface AuditLogItem {
  id: string;
  actionType: 'WHITELIST_ADD' | 'WHITELIST_REMOVE' | 'LOG_DELETE' | 'LOGS_CLEAR' | 'MANUAL_VISITOR_ADD';
  description: string;
  targetIdentifier?: string;
  timestamp: number;
  formattedDate: string;
  formattedTime: string;
  performedBy: string;
}

const AUDIT_STORAGE_KEY = 'audit_doc_action_history';

export const getAuditLogs = (): AuditLogItem[] => {
  const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [
    {
      id: 'audit-init-1',
      actionType: 'WHITELIST_ADD',
      description: 'ডিফল্ট সিস্টেম ইনিশিয়ালাইজেশন ও সিকিউরিটি ফিল্টার সক্রিয় করা হয়েছে',
      targetIdentifier: 'System Security',
      timestamp: Date.now() - 3600000,
      formattedDate: 'আজ',
      formattedTime: '১০:০০ AM',
      performedBy: 'System Admin'
    }
  ];
};

export const recordAuditLog = (
  actionType: AuditLogItem['actionType'],
  description: string,
  targetIdentifier?: string,
  performedBy: string = 'Admin'
): AuditLogItem[] => {
  const logs = getAuditLogs();
  const now = new Date();
  const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const day = toBengaliDigits(now.getDate().toString().padStart(2, '0'));
  const month = months[now.getMonth()];
  const year = toBengaliDigits(now.getFullYear().toString());
  const formattedDate = `${day} ${month}, ${year} (আজ)`;

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedTime = `${toBengaliDigits(hours.toString().padStart(2, '0'))}:${toBengaliDigits(minutes)} ${ampm}`;

  const newEntry: AuditLogItem = {
    id: `audit-${Date.now()}`,
    actionType,
    description,
    targetIdentifier,
    timestamp: Date.now(),
    formattedDate,
    formattedTime,
    performedBy
  };

  logs.unshift(newEntry);
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  return logs;
};

export const clearAuditLogs = (): AuditLogItem[] => {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
  return [];
};

