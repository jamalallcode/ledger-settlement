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

export const getInitialVisitorLogs = (): VisitorLog[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out initial demo logs
        const realLogs = parsed.filter(l => !MOCK_IDENTIFIERS.includes(l.identifier.toLowerCase()));
        return realLogs;
      }
    } catch (e) {}
  }
  return [];
};

export const recordVisitorLog = (identifier: string, isWhitelisted: boolean): VisitorLog[] => {
  if (!identifier || identifier.trim() === '') return getInitialVisitorLogs();
  
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
      deviceInfo: window.navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device',
      visitCount: 1,
      isWhitelisted
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return logs;
};

export const clearAllVisitorLogs = (): VisitorLog[] => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
};
