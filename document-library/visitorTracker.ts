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

export const getInitialVisitorLogs = (): VisitorLog[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // Pre-seed mock realistic visitor logs for the last 3 days
  const now = new Date();
  
  const formatDateBN = (d: Date) => {
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const day = toBengaliDigits(d.getDate().toString().padStart(2, '0'));
    const month = months[d.getMonth()];
    const year = toBengaliDigits(d.getFullYear().toString());
    return `${day} ${month}, ${year}`;
  };

  const formatTimeBN = (d: Date) => {
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${toBengaliDigits(hours.toString().padStart(2, '0'))}:${toBengaliDigits(minutes)} ${ampm}`;
  };

  const today = new Date(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const twentyFiveDaysAgo = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

  const initialLogs: VisitorLog[] = [
    {
      id: 'vlog-1',
      identifier: 'audit.officer99@gmail.com',
      timestamp: today.getTime() - 2 * 60 * 60 * 1000,
      dateStr: today.toISOString().split('T')[0],
      formattedDate: formatDateBN(today) + ' (আজ)',
      formattedTime: formatTimeBN(new Date(today.getTime() - 2 * 60 * 60 * 1000)),
      deviceInfo: 'Chrome (Windows 11)',
      visitCount: 5,
      isWhitelisted: false,
    },
    {
      id: 'vlog-2',
      identifier: '01715998844',
      timestamp: today.getTime() - 4 * 60 * 60 * 1000,
      dateStr: today.toISOString().split('T')[0],
      formattedDate: formatDateBN(today) + ' (আজ)',
      formattedTime: formatTimeBN(new Date(today.getTime() - 4 * 60 * 60 * 1000)),
      deviceInfo: 'Safari (iPhone iOS 17)',
      visitCount: 3,
      isWhitelisted: false,
    },
    {
      id: 'vlog-3',
      identifier: 'approved.auditor@gmail.com',
      timestamp: yesterday.getTime() - 1 * 60 * 60 * 1000,
      dateStr: yesterday.toISOString().split('T')[0],
      formattedDate: formatDateBN(yesterday) + ' (গতকাল)',
      formattedTime: formatTimeBN(new Date(yesterday.getTime() - 1 * 60 * 60 * 1000)),
      deviceInfo: 'Edge (Windows 10)',
      visitCount: 12,
      isWhitelisted: true,
    },
    {
      id: 'vlog-4',
      identifier: 'karim.cag.bd@gmail.com',
      timestamp: twoDaysAgo.getTime(),
      dateStr: twoDaysAgo.toISOString().split('T')[0],
      formattedDate: formatDateBN(twoDaysAgo) + ' (২ দিন আগে)',
      formattedTime: '১০:১৫ AM',
      deviceInfo: 'Chrome (Android)',
      visitCount: 2,
      isWhitelisted: false,
    },
    {
      id: 'vlog-5',
      identifier: '01812345678',
      timestamp: threeDaysAgo.getTime(),
      dateStr: threeDaysAgo.toISOString().split('T')[0],
      formattedDate: formatDateBN(threeDaysAgo) + ' (৩ দিন আগে)',
      formattedTime: '০৩:৪৫ PM',
      deviceInfo: 'Firefox (Linux)',
      visitCount: 1,
      isWhitelisted: false,
    },
    {
      id: 'vlog-6',
      identifier: 'rahim.accountant@gmail.com',
      timestamp: sevenDaysAgo.getTime(),
      dateStr: sevenDaysAgo.toISOString().split('T')[0],
      formattedDate: formatDateBN(sevenDaysAgo) + ' (৭ দিন আগে)',
      formattedTime: '১১:২০ AM',
      deviceInfo: 'Chrome (Windows 10)',
      visitCount: 4,
      isWhitelisted: false,
    },
    {
      id: 'vlog-7',
      identifier: '01911223344',
      timestamp: fifteenDaysAgo.getTime(),
      dateStr: fifteenDaysAgo.toISOString().split('T')[0],
      formattedDate: formatDateBN(fifteenDaysAgo) + ' (১৫ দিন আগে)',
      formattedTime: '০২:১০ PM',
      deviceInfo: 'Samsung Browser (Android)',
      visitCount: 6,
      isWhitelisted: false,
    },
    {
      id: 'vlog-8',
      identifier: 'deputy.auditor.cag@gmail.com',
      timestamp: twentyFiveDaysAgo.getTime(),
      dateStr: twentyFiveDaysAgo.toISOString().split('T')[0],
      formattedDate: formatDateBN(twentyFiveDaysAgo) + ' (২৫ দিন আগে)',
      formattedTime: '০৪:৫০ PM',
      deviceInfo: 'Safari (Mac OS)',
      visitCount: 9,
      isWhitelisted: false,
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLogs));
  return initialLogs;
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
