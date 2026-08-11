import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, FileText, User, Users, BookOpen, Printer, Search, RefreshCw, 
  ChevronLeft, LayoutGrid, Sparkles, FileSpreadsheet, ArrowRight,
  ShieldCheck, Mail, Info, FileEdit, ArrowUpDown, Clock
} from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { isSFI, isNonSFI, getCleanLetterTypeDisplay } from '../utils/branchUtils';
import { format } from 'date-fns';
import { MINISTRY_ENTITY_MAP, EMPLOYEES } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STATIC_MINISTRIES = [
  "আর্থিক প্রতিষ্ঠান বিভাগ",
  "পাট মন্ত্রণালয়",
  "বস্ত্র মন্ত্রণালয়",
  "শিল্প মন্ত্রণালয়",
  "বিমান ও পর্যটন মন্ত্রণালয়",
  "বাণিজ্য মন্ত্রণালয়"
];

const normalizeForSearch = (str: string = '') => {
  if (!str) return '';
  let normalized = str.normalize('NFC').toLowerCase();
  
  // Remove zero-width characters and special diacritics
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Replace Bengali digits with English digits to search numbers easily
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(bengaliDigits[i], 'g'), englishDigits[i]);
  }
  
  // Normalize common spelling variations/typos in Bengali
  normalized = normalized.replace(/ী/g, 'ি'); // 'ী' (dirgho-i) -> 'ি' (hrosso-i)
  normalized = normalized.replace(/ূ/g, 'ু'); // 'ূ' -> 'ু'
  normalized = normalized.replace(/ণ/g, 'ন'); // 'ণ' -> 'ন'
  normalized = normalized.replace(/য়/g, 'য'); // 'য়' -> 'য'
  normalized = normalized.replace(/ষ/g, 'স'); // 'ষ' -> 'স'
  normalized = normalized.replace(/শ/g, 'স'); // 'শ' -> 'স'
  
  return normalized.replace(/\s+/g, ' ').trim();
};

const normalizeAuditor = (name: string | null | undefined): string => {
  if (!name) return '';
  let n = name
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC');

  // Strip designations like (অডিটর), (এসএএস সুপার), (এএন্ডএও), etc.
  n = n.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  // Strip common honorific prefixes
  n = n.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়)\s+/, '');
  n = n.replace(/^মো[ঃ:\.]\s*/, '');
  n = n.replace(/^মোঃ\s*/, '');

  // Strip punctuation
  n = n.replace(/[:ঃ।\.\-]/g, '').trim();

  // Normalize Bengali vowels & sibilants & virama/hasanta for robust matching
  n = n.replace(/ী/g, 'ি')
       .replace(/ূ/g, 'ু')
       .replace(/ষ/g, 'স')
       .replace(/শ/g, 'স')
       .replace(/ণ/g, 'ন')
       .replace(/য়/g, 'য')
       .replace(/্/g, '')      // Strip hasanta so "শাহ্রিন" (হ্+র) matches "শাহরিন" (হ+র)
       .replace(/ঁ/g, '')      // Strip chandrabindu
       .replace(/়/g, '');     // Strip nukta

  return n.trim();
};

const getCleanAuditorDisplayName = (raw: string): string => {
  if (!raw) return '';
  let clean = raw
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC');

  clean = clean.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  clean = clean.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়)\s+/, '').trim();
  clean = clean.replace(/^মো[ঃ:\.]\s*/, 'মো: ');
  clean = clean.replace(/^মোঃ\s*/, 'মো: ');

  // Standardize known name spellings to match Receiver Management (প্রাপক ব্যবস্থাপনা) exactly
  if (clean.includes('শাহ্রিন')) {
    clean = clean.replace(/শাহ্রিন/g, 'শাহরিন');
  }

  return clean || raw.trim();
};

const cleanAndFormat = (info: string | undefined, label: string) => {
  if (!info || info === '-') return `${label}: -`;
  
  const cleaned = info
    .replace(/(পত্র নং|ডায়েরি নং|জারিপত্র নং)[-\s:]*/g, '')
    .replace(/(পত্রের তারিখ|ডায়েরির তারিখ|জারিপত্রের তারিখ)[-\s:]*/g, '')
    .trim();
  
  const checkClean = cleaned.replace(/[\s,\-]/g, '');
  if (!checkClean) return `${label}: -`;
  
  return `${label}: ${toBengaliDigits(cleaned)}`;
};

const renderMeetingType = (meetingType: string | undefined) => {
  if (!meetingType) return '';
  const trimmed = meetingType.trim();
  if (trimmed.endsWith('সভা')) {
    return trimmed;
  }
  return `${trimmed} সভা`;
};

const getSettlementTypeDisplay = (entry: any): string => {
  // Check paragraphs array if present
  if (entry.paragraphs && entry.paragraphs.length > 0) {
    const hasPartial = entry.paragraphs.some((p: any) => p.status === 'আংশিক');
    const fullCount = entry.paragraphs.filter((p: any) => p.status === 'পূর্ণাঙ্গ').length;
    const totalParasCount = entry.paragraphs.length;

    if (hasPartial) {
      return 'আংশিক';
    }
    if (fullCount > 0 && fullCount < totalParasCount) {
      return 'আংশিক';
    }
    if (fullCount === totalParasCount && totalParasCount > 0) {
      return 'পূর্ণাঙ্গ';
    }
  }

  // Check numeric fields
  const partialCount = parseInt(toEnglishDigits(String(entry.meetingPartialSettledParaCount || '0')));
  if (partialCount > 0) {
    return 'আংশিক';
  }

  const fullCount = parseInt(toEnglishDigits(String(entry.meetingFullSettledParaCount || '0')));
  const settledCount = parseInt(toEnglishDigits(String(entry.meetingSettledParaCount || '0')));
  const sentCount = parseInt(toEnglishDigits(String(entry.meetingSentParaCount || '0')));

  if (fullCount > 0 && sentCount > 0 && fullCount < sentCount) {
    return 'আংশিক';
  }

  if (settledCount > 0 && sentCount > 0 && settledCount < sentCount) {
    return 'আংশিক';
  }

  // Check explicit status string
  if (entry.settlementStatus === 'আংশিক' || entry.status === 'আংশিক' || entry.isPartial) {
    return 'আংশিক';
  }

  if (entry.settlementStatus === 'পূর্ণাঙ্গ' || entry.status === 'পূর্ণাঙ্গ' || entry.isFull) {
    return 'পূর্ণাঙ্গ';
  }

  return 'পূর্ণাঙ্গ';
};

const getSettlementEntryStats = (entry: any) => {
  let fullCount = 0;
  let partialCount = 0;
  let settledAmount = 0;
  let fullAmount = 0;
  let partialAmount = 0;
  let fullParas: string[] = [];
  let partialParas: string[] = [];
  let allParas: string[] = [];

  if (entry.paragraphs && entry.paragraphs.length > 0) {
    entry.paragraphs.forEach((p: any) => {
      const pNum = p.paraNo || p.paragraphNo || p.number || '';
      const rec = (p.recoveredAmount || 0) + (p.adjustedAmount || 0);
      if (p.status === 'পূর্ণাঙ্গ') {
        fullCount++;
        fullAmount += rec;
        if (pNum) fullParas.push(String(pNum));
      } else if (p.status === 'আংশিক' || (rec > 0 && p.status !== 'পূর্ণাঙ্গ')) {
        partialCount++;
        partialAmount += rec;
        if (pNum) partialParas.push(String(pNum));
      }
      if (pNum && (p.status === 'পূর্ণাঙ্গ' || p.status === 'আংশিক' || rec > 0)) {
        allParas.push(String(pNum));
      }
    });
    settledAmount = fullAmount + partialAmount;
  } else {
    const hasFullField = entry.meetingFullSettledParaCount !== undefined && entry.meetingFullSettledParaCount !== null && entry.meetingFullSettledParaCount !== '';
    const hasPartialField = entry.meetingPartialSettledParaCount !== undefined && entry.meetingPartialSettledParaCount !== null && entry.meetingPartialSettledParaCount !== '';

    if (hasFullField || hasPartialField) {
      fullCount = parseInt(toEnglishDigits(String(entry.meetingFullSettledParaCount || entry.fullSettledCount || '0')));
      partialCount = parseInt(toEnglishDigits(String(entry.meetingPartialSettledParaCount || entry.partialSettledCount || '0')));
    } else {
      const totalSettled = parseInt(toEnglishDigits(String(entry.meetingSettledParaCount || '0')));
      if (entry.settlementStatus === 'আংশিক' || entry.status === 'আংশিক' || entry.isPartial) {
        partialCount = totalSettled;
        fullCount = 0;
      } else {
        fullCount = totalSettled;
        partialCount = 0;
      }
    }

    settledAmount = entry.meetingSettledAmount !== undefined && entry.meetingSettledAmount !== null && entry.meetingSettledAmount !== ''
      ? parseFloat(toEnglishDigits(String(entry.meetingSettledAmount)))
      : ((entry.totalRec || 0) + (entry.totalAdj || 0));

    if (fullCount > 0 && partialCount === 0) {
      fullAmount = settledAmount;
    } else if (partialCount > 0 && fullCount === 0) {
      partialAmount = settledAmount;
    } else {
      fullAmount = 0;
      partialAmount = settledAmount;
    }

    const rawParas = String(entry.meetingSettledParas || entry.settledParas || entry.meetingUnsettledParas || '');
    if (rawParas) {
      allParas = rawParas.split(/[,;\s]+/).filter(Boolean);
    }
  }

  return { fullCount, partialCount, settledAmount, fullAmount, partialAmount, fullParas, partialParas, allParas };
};

const getEntryMinistry = (ent: any): string => {
  if (ent.ministryName) {
    return ent.ministryName;
  }
  const desc = ent.description || '';
  const descNorm = normalizeForSearch(desc);
  if (!descNorm) return '';

  // 1. Check exact or partial match with STATIC_MINISTRIES list using normalized strings
  for (const mName of STATIC_MINISTRIES) {
    const normM = normalizeForSearch(mName);
    if (descNorm.includes(normM) || normM.includes(descNorm)) {
      return mName;
    }
  }

  // 2. Check entities map using normalized strings
  for (const [mName, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
    for (const entity of entities) {
      const normE = normalizeForSearch(entity);
      const cleanNormE = normE.replace(/(পিএলসি|লি\.|লিমিটেড|গ্রুপ|шаха|জোন|বিভাগ|কর্পোরেশন|সংস্থা|বোর্ড)/g, '').trim();
      const cleanDesc = descNorm.replace(/(পিএলসি|লি\.|লিমিটেড|গ্রুপ|шаха|জোন|বিভাগ|কর্পোরেশন|সংস্থা|বোর্ড)/g, '').trim();
      if (
        descNorm.includes(normE) || 
        normE.includes(descNorm) ||
        (cleanNormE.length > 2 && cleanDesc.includes(cleanNormE)) ||
        (cleanDesc.length > 2 && cleanNormE.includes(cleanDesc))
      ) {
        return mName;
      }
    }
  }

  // 3. Fallback keyword checks using normalized keywords
  if (
    descNorm.includes(normalizeForSearch('সোনালী')) ||
    descNorm.includes(normalizeForSearch('জনতা')) ||
    descNorm.includes(normalizeForSearch('অগ্রণী')) ||
    descNorm.includes(normalizeForSearch('কৃষি')) ||
    descNorm.includes(normalizeForSearch('রূপালী')) ||
    descNorm.includes(normalizeForSearch('বাংলাদেশ ব্যাংক')) ||
    descNorm.includes(normalizeForSearch('বীমা')) ||
    descNorm.includes(normalizeForSearch('আর্থিক')) ||
    descNorm.includes(normalizeForSearch('ব্যাংক')) ||
    descNorm.includes(normalizeForSearch('বেসিক')) ||
    descNorm.includes(normalizeForSearch('कर्मসংস্থান')) ||
    descNorm.includes(normalizeForSearch('আইসিবি')) ||
    descNorm.includes(normalizeForSearch('ইনভেস্টমেন্ট'))
  ) {
    return 'আর্থিক প্রতিষ্ঠান বিভাগ';
  }
  if (descNorm.includes(normalizeForSearch('পাট')) || descNorm.includes(normalizeForSearch('পাটকল'))) {
    return 'পাট মন্ত্রণালয়';
  }
  if (descNorm.includes(normalizeForSearch('বস্ত্র')) || descNorm.includes(normalizeForSearch('রেশম'))) {
    return 'বস্ত্র মন্ত্রণালয়';
  }
  if (
    descNorm.includes(normalizeForSearch('শিল্প')) ||
    descNorm.includes(normalizeForSearch('চিনি')) ||
    descNorm.includes(normalizeForSearch('বিটাক')) ||
    descNorm.includes(normalizeForSearch('রসায়ন')) ||
    descNorm.includes(normalizeForSearch('কুটির'))
  ) {
    return 'শিল্প মন্ত্রণালয়';
  }
  if (
    descNorm.includes(normalizeForSearch('বিমান')) ||
    descNorm.includes(normalizeForSearch('পর্যটন')) ||
    descNorm.includes(normalizeForSearch('বেসামরিক'))
  ) {
    return 'বিমান ও পর্যটন মন্ত্রণালয়';
  }
  if (
    descNorm.includes(normalizeForSearch('বাণিজ্য')) ||
    descNorm.includes(normalizeForSearch('টিসিবি')) ||
    descNorm.includes(normalizeForSearch('আমদানি')) ||
    descNorm.includes(normalizeForSearch('রপ্তানি'))
  ) {
    return 'বাণিজ্য মন্ত্রণালয়';
  }
  return '';
};

interface CustomPeriodReceiptReportProps {
  entries: any[]; // These are approved correspondenceEntries passed from ReturnView
  settlementEntries?: any[]; // Approved settlement entries from ReturnView
  onBack: () => void;
  IDBadge: React.FC<{ id: string }>;
  onEdit?: (entry: any) => void;
  isAdmin?: boolean;
}

export const CustomPeriodReceiptReport: React.FC<CustomPeriodReceiptReportProps> = ({
  entries = [],
  settlementEntries = [],
  onBack,
  IDBadge,
  onEdit,
  isAdmin
}) => {
  // Calculate initial default start date (earliest diary date) & end date (today)
  const initialDates = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayISO = `${yyyy}-${mm}-${dd}`;

    let minDate = '';

    const normalizeDateStr = (raw: any): string => {
      if (!raw || typeof raw !== 'string') return '';
      const eng = toEnglishDigits(raw.trim());
      if (/^\d{4}-\d{2}-\d{2}$/.test(eng)) {
        return eng;
      }
      const parts = eng.split(/[\/\.-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return '';
    };

    const processItem = (rawDate: any) => {
      const iso = normalizeDateStr(rawDate);
      if (iso) {
        if (!minDate || iso < minDate) {
          minDate = iso;
        }
      }
    };

    if (Array.isArray(entries)) {
      entries.forEach(e => {
        if (e.diaryDate) {
          processItem(e.diaryDate);
        } else {
          processItem(e.receiptDate || e.letterDate);
        }
      });
    }

    if (Array.isArray(settlementEntries)) {
      settlementEntries.forEach(s => {
        processItem(s.branchReceiptDate || s.issueDateISO || s.actualEntryDate);
      });
    }

    return {
      start: minDate || todayISO,
      end: todayISO
    };
  }, [entries, settlementEntries]);

  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  // Segment states in Bengali digits as standard in this app
  const [startDD, setStartDD] = useState(() => {
    const parts = initialDates.start.split('-');
    return parts.length === 3 ? toBengaliDigits(parts[2]) : '০১';
  });
  const [startMM, setStartMM] = useState(() => {
    const parts = initialDates.start.split('-');
    return parts.length === 3 ? toBengaliDigits(parts[1]) : '০৭';
  });
  const [startYYYY, setStartYYYY] = useState(() => {
    const parts = initialDates.start.split('-');
    return parts.length === 3 ? toBengaliDigits(parts[0]) : '২০২৫';
  });

  const [endDD, setEndDD] = useState(() => {
    const parts = initialDates.end.split('-');
    return parts.length === 3 ? toBengaliDigits(parts[2]) : '৩০';
  });
  const [endMM, setEndMM] = useState(() => {
    const parts = initialDates.end.split('-');
    return parts.length === 3 ? toBengaliDigits(parts[1]) : '০৬';
  });
  const [endYYYY, setEndYYYY] = useState(() => {
    const parts = initialDates.end.split('-');
    return parts.length === 3 ? toBengaliDigits(parts[0]) : '২০২৬';
  });

  // Sync initial dates when entries load or change (without overwriting if already set)
  const isInitialDatesSet = useRef(false);
  useEffect(() => {
    if (!isInitialDatesSet.current && (entries.length > 0 || settlementEntries.length > 0)) {
      isInitialDatesSet.current = true;
      setStartDate(initialDates.start);
      setEndDate(initialDates.end);

      const startParts = initialDates.start.split('-');
      if (startParts.length === 3) {
        setStartYYYY(toBengaliDigits(startParts[0]));
        setStartMM(toBengaliDigits(startParts[1]));
        setStartDD(toBengaliDigits(startParts[2]));
      }

      const endParts = initialDates.end.split('-');
      if (endParts.length === 3) {
        setEndYYYY(toBengaliDigits(endParts[0]));
        setEndMM(toBengaliDigits(endParts[1]));
        setEndDD(toBengaliDigits(endParts[2]));
      }
    }
  }, [initialDates, entries.length, settlementEntries.length]);

  const [searchTerm, setSearchTerm] = useState('সকল');
  const [filterBranch, setFilterBranch] = useState('সকল');
  const [filterAuditor, setFilterAuditor] = useState('সকল');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [filterMinistry, setFilterMinistry] = useState('সকল');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeReportMode, setActiveReportMode] = useState<'correspondence' | 'settlement' | 'pending'>('correspondence');
  const [expandedParasMap, setExpandedParasMap] = useState<Record<string, boolean>>({});
  const [dbReceiversList, setDbReceiversList] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchReceivers = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('receivers')
            .select('*')
            .order('name', { ascending: true });
          if (data && isMounted) {
            setDbReceiversList(data);
          }
        } catch (e) {}
      }
    };
    fetchReceivers();
    return () => { isMounted = false; };
  }, []);

  const toggleExpandParas = (entryId: string) => {
    setExpandedParasMap(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const MINISTRIES = STATIC_MINISTRIES;

  // Sync effect to clear invalid letter type selections when switching branches
  useEffect(() => {
    if (filterBranch === 'এসএফআই') {
      if (searchTerm === 'দ্বিপক্ষীয়' || searchTerm === 'কার্যপত্র (দ্বি-সভা)') {
        setSearchTerm('সকল');
      }
    } else if (filterBranch === 'নন এসএফআই') {
      if (searchTerm === 'ত্রিপক্ষীয়' || searchTerm === 'কার্যপত্র (ত্রি-সভা)') {
        setSearchTerm('সকল');
      }
    }
  }, [filterBranch, searchTerm]);

  // Refs for auto focus and calendar popups
  const startDayRef = useRef<HTMLInputElement>(null);
  const startMonthRef = useRef<HTMLInputElement>(null);
  const startYearRef = useRef<HTMLInputElement>(null);
  const startCalendarRef = useRef<HTMLInputElement>(null);

  const endDayRef = useRef<HTMLInputElement>(null);
  const endMonthRef = useRef<HTMLInputElement>(null);
  const endYearRef = useRef<HTMLInputElement>(null);
  const endCalendarRef = useRef<HTMLInputElement>(null);

  const handleSegmentChange = (
    val: string, 
    type: 'day'|'month'|'year', 
    setter: (v: string) => void, 
    setFullDate: (d: string) => void, 
    otherSegments: any, 
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    const cleaned = toEnglishDigits(val).replace(/[^0-9]/g, '');
    const numVal = parseInt(cleaned);

    let updatedVal = toBengaliDigits(cleaned);
    if (type === 'day') {
      if (cleaned.length <= 2) {
        if (cleaned.length > 0 && numVal > 31) return;
        setter(updatedVal);
        if (cleaned.length === 2 || (cleaned.length === 1 && numVal > 3)) {
          nextRef?.current?.focus();
        }
        
        const d = cleaned;
        const m = toEnglishDigits(otherSegments.month);
        const y = toEnglishDigits(otherSegments.year);
        if (d && m && y && y.length === 4) {
          setFullDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        }
      }
    } else if (type === 'month') {
      if (cleaned.length <= 2) {
        if (cleaned.length > 0 && numVal > 12) return;
        setter(updatedVal);
        if (cleaned.length === 2 || (cleaned.length === 1 && numVal > 1)) {
          nextRef?.current?.focus();
        }

        const d = toEnglishDigits(otherSegments.day);
        const m = cleaned;
        const y = toEnglishDigits(otherSegments.year);
        if (d && m && y && y.length === 4) {
          setFullDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        }
      }
    } else if (type === 'year') {
      if (cleaned.length <= 4) {
        setter(updatedVal);
        const d = toEnglishDigits(otherSegments.day);
        const m = toEnglishDigits(otherSegments.month);
        const y = cleaned;
        if (d && m && y && y.length === 4) {
          setFullDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        }
      }
    }
  };

  const handleSegmentBlur = (
    val: string, 
    type: 'day'|'month'|'year', 
    setter: (v: string) => void, 
    setFullDate: (d: string) => void, 
    otherSegments: any
  ) => {
    const eng = toEnglishDigits(val);
    if (!eng) return;
    let finalEng = eng;
    if (type === 'year') {
      if (eng.length === 1) finalEng = '200' + eng;
      else if (eng.length === 2) finalEng = '20' + eng;
    } else {
      if (eng.length === 1) finalEng = '0' + eng;
    }
    setter(toBengaliDigits(finalEng));

    const d = type === 'day' ? finalEng : toEnglishDigits(otherSegments.day);
    const m = type === 'month' ? finalEng : toEnglishDigits(otherSegments.month);
    const y = type === 'year' ? finalEng : toEnglishDigits(otherSegments.year);
    if (d && m && y && y.length === 4) {
      setFullDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
  };

  const handleStartDateSelect = (dateStr: string) => {
    if (!dateStr) return;
    setStartDate(dateStr);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      setStartDD(toBengaliDigits(parts[2]));
      setStartMM(toBengaliDigits(parts[1]));
      setStartYYYY(toBengaliDigits(parts[0]));
    }
  };

  const handleEndDateSelect = (dateStr: string) => {
    if (!dateStr) return;
    setEndDate(dateStr);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      setEndDD(toBengaliDigits(parts[2]));
      setEndMM(toBengaliDigits(parts[1]));
      setEndYYYY(toBengaliDigits(parts[0]));
    }
  };

  // Calculate auditor options with letter counts for the selected date range and strictly for the selected branch
  const auditorOptionsWithCounts = useMemo(() => {
    // 1. Gather all entries matching the selected branch
    const branchEntries = (entries || []).filter(entry => {
      if (filterBranch !== 'সকল') {
        if (filterBranch === 'এসএফআই' && !isSFI(entry.paraType)) return false;
        if (filterBranch === 'নন এসএফআই' && !isNonSFI(entry.paraType)) return false;
      }
      return true;
    });

    // 2. Filter entries within selected date range (diaryDate)
    const periodEntries = branchEntries.filter(entry => {
      const entryDate = entry.diaryDate || '';
      if (!entryDate) return false;
      return entryDate >= startDate && entryDate <= endDate;
    });

    const periodCounts = new Map<string, number>();
    periodEntries.forEach(entry => {
      const rawName = (entry.receiverName || entry.presentedToName || '').trim();
      if (rawName) {
        const norm = normalizeAuditor(rawName);
        if (norm) {
          periodCounts.set(norm, (periodCounts.get(norm) || 0) + 1);
        }
      }
    });

    // 3. Strictly collect auditors belonging to the selected branch
    const branchAuditorsMap = new Map<string, string>(); // norm -> displayName

    // Check inactive/transferred list
    let inactiveSet = new Set<string>();
    try {
      const rawInactive = localStorage.getItem('ledger_inactive_receivers_v1');
      if (rawInactive) {
        const parsed = JSON.parse(rawInactive);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: string) => inactiveSet.add(normalizeAuditor(item)));
        }
      }
    } catch (e) {}

    // First, populate from Supabase receivers (source of truth matching Receiver Management)
    if (Array.isArray(dbReceiversList) && dbReceiversList.length > 0) {
      dbReceiversList.forEach(r => {
        const branchType = r.para_type || '';
        if (filterBranch === 'নন এসএফআই' && !isNonSFI(branchType)) return;
        if (filterBranch === 'এসএফআই' && !isSFI(branchType)) return;

        const rawName = (r.name || '').trim();
        if (!rawName) return;
        const norm = normalizeAuditor(rawName);
        if (!norm) return;

        const isInactive = r.is_active === false || inactiveSet.has(norm);
        const isTransferred = r.transferred_to && r.transferred_to.trim() !== '';

        const count = periodCounts.get(norm) || 0;
        if ((isInactive || isTransferred) && count === 0) {
          return;
        }

        if (!branchAuditorsMap.has(norm)) {
          branchAuditorsMap.set(norm, getCleanAuditorDisplayName(rawName));
        }
      });
    }

    const targetKeys: Array<{ key: string; branch: string }> = [];
    if (filterBranch === 'নন এসএফআই') {
      targetKeys.push({ key: 'ledger_correspondence_receivers_nonsfi', branch: 'নন এসএফআই' });
    } else if (filterBranch === 'এসএফআই') {
      targetKeys.push({ key: 'ledger_correspondence_receivers_sfi', branch: 'এসএফআই' });
    } else {
      targetKeys.push(
        { key: 'ledger_correspondence_receivers_nonsfi', branch: 'নন এসএফআই' },
        { key: 'ledger_correspondence_receivers_sfi', branch: 'এসএফআই' },
        { key: 'ledger_correspondence_receivers_admin', branch: 'প্রশাসন' }
      );
    }

    targetKeys.forEach(({ key }) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const rawName = (typeof p === 'string' ? p : p?.name) || '';
              if (!rawName) return;
              const norm = normalizeAuditor(rawName);
              if (!norm) return;

              const isInactive = p.is_active === false || inactiveSet.has(norm);
              const isTransferred = p.transferred_to && p.transferred_to.trim() !== '';

              // If auditor is inactive/transferred and has 0 letters in period, skip
              const count = periodCounts.get(norm) || 0;
              if ((isInactive || isTransferred) && count === 0) {
                return;
              }

              if (!branchAuditorsMap.has(norm)) {
                branchAuditorsMap.set(norm, getCleanAuditorDisplayName(rawName));
              }
            });
          }
        }
      } catch (e) {}
    });

    // Fallback: If SFI branch and localStorage is empty, check EMPLOYEES
    if (branchAuditorsMap.size === 0 && (filterBranch === 'এসএফআই' || filterBranch === 'সকল')) {
      if (Array.isArray(EMPLOYEES)) {
        EMPLOYEES.forEach(emp => {
          if (emp.includes('অডিটর') || emp.includes('এএন্ডএও') || emp.includes('সুপার')) {
            const norm = normalizeAuditor(emp);
            if (norm && !branchAuditorsMap.has(norm)) {
              branchAuditorsMap.set(norm, getCleanAuditorDisplayName(emp));
            }
          }
        });
      }
    }

    // Also include any auditors found in entries of this branch
    branchEntries.forEach(entry => {
      const rawName = (entry.receiverName || entry.presentedToName || '').trim();
      if (rawName) {
        const norm = normalizeAuditor(rawName);
        if (norm && !branchAuditorsMap.has(norm)) {
          branchAuditorsMap.set(norm, getCleanAuditorDisplayName(rawName));
        }
      }
    });

    // 4. Build sorted result
    const result: Array<{ name: string; count: number; norm: string }> = [];
    branchAuditorsMap.forEach((displayName, norm) => {
      const count = periodCounts.get(norm) || 0;
      result.push({
        name: displayName,
        count,
        norm
      });
    });

    // Sort: auditors with letters received in period first (descending count), then alphabetically
    return result.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name, 'bn');
    });
  }, [entries, startDate, endDate, filterBranch, dbReceiversList]);

  // Reset filterAuditor if it no longer exists in current branch options
  useEffect(() => {
    if (filterAuditor !== 'সকল') {
      const filterNorm = normalizeAuditor(filterAuditor);
      const exists = auditorOptionsWithCounts.some(a => a.norm === filterNorm || a.name === filterAuditor);
      if (!exists) {
        setFilterAuditor('সকল');
      }
    }
  }, [filterBranch, auditorOptionsWithCounts, filterAuditor]);

  // Filter entries based on selected dates and other controls
  const filteredEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      // 1. Date Range Filter strictly using diaryDate (diary date) as requested by user
      const entryDate = entry.diaryDate || '';
      if (!entryDate) return false;

      const isWithinDateRange = entryDate >= startDate && entryDate <= endDate;
      if (!isWithinDateRange) return false;

      // 2. Branch/ParaType Filter
      if (filterBranch !== 'সকল') {
        if (filterBranch === 'এসএফআই' && !isSFI(entry.paraType)) return false;
        if (filterBranch === 'নন এসএফআই' && !isNonSFI(entry.paraType)) return false;
      }

      // 2.5 Ministry Filter
      if (filterMinistry !== 'সকল') {
        const entMin = getEntryMinistry(entry);
        const entryMin = entMin.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
        const filterMin = filterMinistry.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
        if (entryMin !== filterMin) return false;
      }

      // 3. Dropdown Search / Filter by Letter Type
      if (searchTerm !== 'সকল') {
        const typeNorm = normalizeForSearch(entry.letterType || '');

        if (searchTerm === 'বিএসআর') {
          if (!typeNorm.includes(normalizeForSearch('বিএসআর')) && !typeNorm.includes('bsr')) return false;
        } else if (searchTerm === 'দ্বিপক্ষীয়') {
          if (
            (!typeNorm.includes(normalizeForSearch('দ্বিপক্ষীয়')) && 
             !typeNorm.includes(normalizeForSearch('দ্বিপাক্ষী')) && 
             !typeNorm.includes('bilateral')) ||
            typeNorm.includes(normalizeForSearch('কার্যপত্র')) ||
            typeNorm.includes(normalizeForSearch('কাযপত্র')) ||
            typeNorm.includes('working')
          ) return false;
        } else if (searchTerm === 'ত্রিপক্ষীয়') {
          if (
            (!typeNorm.includes(normalizeForSearch('ত্রিপক্ষীয়')) && 
             !typeNorm.includes(normalizeForSearch('ত্রিপাক্ষী')) && 
             !typeNorm.includes('trilateral')) ||
            typeNorm.includes(normalizeForSearch('কার্যপত্র')) ||
            typeNorm.includes(normalizeForSearch('কাযপত্র')) ||
            typeNorm.includes('working')
          ) return false;
        } else if (searchTerm === 'কার্যপত্র (দ্বি-সভা)') {
          if (
            typeNorm !== normalizeForSearch('কার্যপত্র (দ্বি-সভা)') && 
            !typeNorm.includes(normalizeForSearch('দ্বিপক্ষীয় সভা (কার্যপত্র)'))
          ) return false;
        } else if (searchTerm === 'কার্যপত্র (ত্রি-সভা)') {
          if (
            typeNorm !== normalizeForSearch('কার্যপত্র (ত্রি-সভা)') && 
            !typeNorm.includes(normalizeForSearch('ত্রিপক্ষীয় সভা (কার্যপত্র)'))
          ) return false;
        } else if (searchTerm === 'অন্যান্য') {
          const isMain = 
            typeNorm.includes(normalizeForSearch('বিএসআর')) || typeNorm.includes('bsr') ||
            typeNorm.includes(normalizeForSearch('দ্বিপক্ষীয়')) || typeNorm.includes(normalizeForSearch('দ্বিপাক্ষী')) || typeNorm.includes('bilateral') ||
            typeNorm.includes(normalizeForSearch('ত্রিপক্ষীয়')) || typeNorm.includes(normalizeForSearch('ত্রিপাক্ষী')) || typeNorm.includes('trilateral') ||
            typeNorm.includes(normalizeForSearch('কার্যপত্র')) || typeNorm.includes(normalizeForSearch('কাযপত্র')) || typeNorm.includes('working') ||
            typeNorm.includes(normalizeForSearch('মিলিকরণ')) || typeNorm.includes(normalizeForSearch('মিলকরণ')) || typeNorm.includes(normalizeForSearch('মিলিকরন')) || typeNorm.includes('reconciliation');
          if (isMain) return false;
        }
      }

      // 3.5 Auditor Filter (গ্রহীতা / অডিটর)
      if (filterAuditor !== 'সকল') {
        const queryNorm = normalizeAuditor(filterAuditor);
        const querySearch = normalizeForSearch(filterAuditor);
        const receiverRaw = entry.receiverName || '';
        const presentedRaw = entry.presentedToName || '';
        
        const receiverNorm = normalizeAuditor(receiverRaw);
        const presentedNorm = normalizeAuditor(presentedRaw);

        const receiverSearch = normalizeForSearch(receiverRaw);
        const presentedSearch = normalizeForSearch(presentedRaw);

        const matches = (receiverNorm && queryNorm && (receiverNorm === queryNorm || receiverNorm.includes(queryNorm) || queryNorm.includes(receiverNorm))) ||
                        (presentedNorm && queryNorm && (presentedNorm === queryNorm || presentedNorm.includes(queryNorm) || queryNorm.includes(presentedNorm))) ||
                        (receiverSearch && (receiverSearch === querySearch || receiverSearch.includes(querySearch) || querySearch.includes(receiverSearch))) ||
                        (presentedSearch && (presentedSearch === querySearch || presentedSearch.includes(querySearch) || querySearch.includes(presentedSearch)));
        if (!matches) return false;
      }

      // 4. Keyword / Institution Search
      if (keywordSearch.trim() !== '') {
        const query = normalizeForSearch(keywordSearch);
        const desc = normalizeForSearch(entry.description || '');
        const letterNo = normalizeForSearch(entry.letterNo || '');
        const diaryNo = normalizeForSearch(entry.diaryNo || '');
        const letterType = normalizeForSearch(entry.letterType || '');
        const receiver = normalizeForSearch(entry.receiverName || '');
        const paraType = normalizeForSearch(entry.paraType || '');

        const matches = desc.includes(query) || 
                        letterNo.includes(query) || 
                        diaryNo.includes(query) || 
                        letterType.includes(query) ||
                        receiver.includes(query) ||
                        paraType.includes(query);
        if (!matches) return false;
      }

      return true;
    });

    // Apply sorting date-wise (diaryDate) as requested
    return [...filtered].sort((a, b) => {
      const dateA = a.diaryDate || '';
      const dateB = b.diaryDate || '';
      if (dateA !== dateB) {
        return sortOrder === 'asc' 
          ? dateA.localeCompare(dateB) 
          : dateB.localeCompare(dateA);
      }
      // If diary dates are equal, sort by diaryNo or letterDate secondary
      const letterA = a.letterDate || '';
      const letterB = b.letterDate || '';
      if (letterA !== letterB) {
        return sortOrder === 'asc' 
          ? letterA.localeCompare(letterB) 
          : letterB.localeCompare(letterA);
      }
      const diaryNoA = String(a.diaryNo || '');
      const diaryNoB = String(b.diaryNo || '');
      return sortOrder === 'asc'
        ? diaryNoA.localeCompare(diaryNoB)
        : diaryNoB.localeCompare(diaryNoA);
    });
  }, [entries, startDate, endDate, filterBranch, searchTerm, filterAuditor, keywordSearch, filterMinistry, sortOrder]);

  // Pending / ongoing work entries (letters without issue letter no and date)
  const pendingEntries = useMemo(() => {
    return filteredEntries.filter(entry => {
      const hasIssue = !!(entry.issueLetterNo || entry.issueLetterDate || entry.issueLetterNoDate);
      return !hasIssue;
    });
  }, [filteredEntries]);

  // Calculate statistics for BSR, Bilateral meetings, Trilateral meetings, Working papers, and Others
  const stats = useMemo(() => {
    let bsrCount = 0;
    let bilateralCount = 0;
    let trilateralCount = 0;
    let workingPaperCount = 0;
    let othersCount = 0;

    const targetEntries = activeReportMode === 'pending' ? pendingEntries : filteredEntries;

    const robustNormalize = (str: string = '') => {
      if (!str) return '';
      let normalized = str.normalize('NFC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');
      normalized = normalized.replace(/ী/g, 'ি');
      normalized = normalized.replace(/য়/g, 'য');
      normalized = normalized.replace(/ণ/g, 'ন');
      normalized = normalized.replace(/ষ/g, 's');
      normalized = normalized.replace(/শ/g, 's');
      return normalized.replace(/\s+/g, ' ').trim();
    };

    targetEntries.forEach(entry => {
      const type = robustNormalize(entry.letterType || '');
      
      // 1. Working papers count (কার্যপত্র)
      if (type.includes(robustNormalize('কার্যপত্র')) || type.includes(robustNormalize('কাযপত্র')) || type.includes('working')) {
        workingPaperCount++;
      }
      // 2. BSR count (বিএসআর)
      else if (type.includes(robustNormalize('বিএসআর')) || type.includes('bsr')) {
        bsrCount++;
      }
      // 3. Bilateral count (দ্বিপক্ষীয় সভা)
      else if (type.includes(robustNormalize('দ্বিপক্ষীয়')) || type.includes(robustNormalize('দ্বিপাক্ষী')) || type.includes('bilateral')) {
        bilateralCount++;
      }
      // 4. Trilateral count (ত্রিপক্ষীয় সভা)
      else if (type.includes(robustNormalize('ত্রিপক্ষীয়')) || type.includes(robustNormalize('ত্রিপাক্ষী')) || type.includes('trilateral')) {
        trilateralCount++;
      }
      // 5. Others count (অন্যান্য)
      else {
        othersCount++;
      }
    });

    return {
      bsr: bsrCount,
      bilateral: bilateralCount,
      trilateral: trilateralCount,
      workingPaper: workingPaperCount,
      others: othersCount,
      total: targetEntries.length
    };
  }, [filteredEntries, pendingEntries, activeReportMode]);

  const filteredSettlementEntries = useMemo(() => {
    const filtered = (settlementEntries || []).filter(entry => {
      // 1. Date Range Filter using entry.issueDateISO or entry.createdAt
      const entryDate = entry.issueDateISO || (entry.createdAt ? entry.createdAt.split('T')[0] : '');
      if (!entryDate) return false;

      const isWithinDateRange = entryDate >= startDate && entryDate <= endDate;
      if (!isWithinDateRange) return false;

      // 2. Branch Filter (paraType)
      if (filterBranch !== 'সকল') {
        if (filterBranch === 'এসএফআই' && !isSFI(entry.paraType)) return false;
        if (filterBranch === 'নন এসএফআই' && !isNonSFI(entry.paraType)) return false;
      }

      // 3. Ministry Filter
      if (filterMinistry !== 'সকল') {
        const entryMin = (entry.ministryName || '').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
        const filterMin = filterMinistry.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
        if (entryMin !== filterMin) return false;
      }

      // 4. Letters / Meetings Type Filter
      if (searchTerm !== 'সকল') {
        const meetingTypeNorm = normalizeForSearch(entry.meetingType || '');
        if (searchTerm === 'বিএসআর') {
          if (entry.isMeeting && !meetingTypeNorm.includes(normalizeForSearch('বিএসআর')) && !meetingTypeNorm.includes('bsr')) return false;
        } else if (searchTerm === 'দ্বিপক্ষীয়') {
          if (!entry.isMeeting || 
              (!meetingTypeNorm.includes(normalizeForSearch('দ্বিপক্ষীয়')) && 
               !meetingTypeNorm.includes(normalizeForSearch('দ্বিপাক্ষী')) && 
               !meetingTypeNorm.includes('bilateral'))) return false;
        } else if (searchTerm === 'ত্রিপক্ষীয়') {
          if (!entry.isMeeting || 
              (!meetingTypeNorm.includes(normalizeForSearch('ত্রিপক্ষীয়')) && 
               !meetingTypeNorm.includes(normalizeForSearch('ত্রিপাক্ষী')) && 
               !meetingTypeNorm.includes('trilateral'))) return false;
        } else if (searchTerm === 'কার্যপত্র (দ্বি-সভা)') {
          return false;
        } else if (searchTerm === 'কার্যপত্র (ত্রি-সভা)') {
          return false;
        } else if (searchTerm === 'অন্যান্য') {
          return false;
        }
      }

      // 5. Keyword search
      if (keywordSearch.trim() !== '') {
        const query = normalizeForSearch(keywordSearch);
        const desc = normalizeForSearch(entry.remarks || '');
        const letterNo = normalizeForSearch(entry.issueLetterNoDate || '');
        const ministry = normalizeForSearch(entry.ministryName || '');
        const entity = normalizeForSearch(entry.entityName || '');
        const branch = normalizeForSearch(entry.branchName || '');

        const matches = desc.includes(query) || 
                        letterNo.includes(query) || 
                        ministry.includes(query) || 
                        entity.includes(query) || 
                        branch.includes(query);
        if (!matches) return false;
      }

      // 6. Auditor search for settlement entries
      if (filterAuditor !== 'সকল') {
        const queryNorm = normalizeAuditor(filterAuditor);
        const querySearch = normalizeForSearch(filterAuditor);
        const rawReceiver = entry.receiverName || entry.presentedToName || entry.auditorName || '';
        const receiverNorm = normalizeAuditor(rawReceiver);
        const receiverSearch = normalizeForSearch(rawReceiver);
        if (rawReceiver) {
          const matches = (receiverNorm && queryNorm && (receiverNorm === queryNorm || receiverNorm.includes(queryNorm) || queryNorm.includes(receiverNorm))) ||
                          (receiverSearch && (receiverSearch === querySearch || receiverSearch.includes(querySearch) || querySearch.includes(receiverSearch)));
          if (!matches) return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const dateA = a.issueDateISO || (a.createdAt ? a.createdAt.split('T')[0] : '');
      const dateB = b.issueDateISO || (b.createdAt ? b.createdAt.split('T')[0] : '');
      return sortOrder === 'desc' 
        ? dateB.localeCompare(dateA) 
        : dateA.localeCompare(dateB);
    });
  }, [settlementEntries, startDate, endDate, filterBranch, filterMinistry, filterAuditor, searchTerm, keywordSearch, sortOrder]);

  const { totalSettledCountSum, totalSettledAmountSum, totalUnsettledAmountSum } = useMemo(() => {
    let countSum = 0;
    let amountSum = 0;
    let unsettledSum = 0;
    filteredSettlementEntries.forEach(entry => {
      const { fullCount, settledAmount } = getSettlementEntryStats(entry);
      countSum += fullCount;
      amountSum += settledAmount;
      const totalInvolved = entry.involvedAmount || entry.totalAmount || (entry.paragraphs && entry.paragraphs.length > 0 ? entry.paragraphs.reduce((sum: number, p: any) => sum + (p.involvedAmount || p.totalAmount || 0), 0) : 0);
      const rowUnsettled = Math.max(0, totalInvolved - settledAmount);
      unsettledSum += rowUnsettled;
    });
    return { totalSettledCountSum: countSum, totalSettledAmountSum: amountSum, totalUnsettledAmountSum: unsettledSum };
  }, [filteredSettlementEntries]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download as Excel (.xls) file
  const downloadExcel = () => {
    const table = document.getElementById('custom-period-report-table');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const filename = activeReportMode === 'correspondence'
      ? `চাহিদা_মোতাবেক_প্রাপ্তি_রিপোর্ট_${startDate}_হতে_${endDate}.xls`
      : activeReportMode === 'pending'
      ? `চলমান_পেন্ডিং_কাজ_রিপোর্ট_${startDate}_হতে_${endDate}.xls`
      : `চাহিদা_মোতাবেক_মীমাংসিত_অনুচ্ছেদ_রিপোর্ট_${startDate}_হতে_${endDate}.xls`;

    const titleText = activeReportMode === 'correspondence'
      ? 'চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট'
      : activeReportMode === 'pending'
      ? 'চলমান/পেন্ডিং কাজের রিপোর্ট'
      : 'চাহিদা মোতাবেক নিষ্পন্নকৃত অডিট অনুচ্ছেদ ও টাকার রিপোর্ট';

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>রিপোর্ট</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 10px 14px !important; text-align: left; font-size: 12px; }
          th { background-color: #1e3a8a !important; color: #ffffff !important; font-weight: bold !important; text-align: center; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .text-center { text-align: center !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 5px; color: #1e3a8a;">${titleText}</h2>
        <p style="text-align: center; margin-top: 0; font-size: 14px; color: #475569;">
          সময়কাল: ${formatDateBN(startDate)} হতে ${formatDateBN(endDate)}
          ${filterAuditor !== 'সকল' ? ` | অডিটর: ${filterAuditor}` : ''}
        </p>
        ${activeReportMode === 'correspondence' ? `
        <table style="width: 50%; margin: 10px auto; border: none;">
          <tr style="background-color: #e2e8f0;">
            <th style="padding: 6px; text-align: left; color: #000; background: #e2e8f0 !important; border: none;">পত্রের প্রকারভেদ</th>
            <th style="padding: 6px; text-align: center; color: #000; background: #e2e8f0 !important; border: none;">মোট সংখ্যা</th>
          </tr>
          <tr>
            <td style="padding: 6px; border: none;">মোট বিএসআর (BSR)</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: none;">${toBengaliDigits(stats.bsr)} টি</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: none;">মোট দ্বিপক্ষীয় সভা</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: none;">${toBengaliDigits(stats.bilateral)} টি</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: none;">মোট ত্রিপক্ষীয় সভা</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: none;">${toBengaliDigits(stats.trilateral)} টি</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: none;">মোট কার্যপত্র</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: none;">${toBengaliDigits(stats.workingPaper)} টি</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: none;">অন্যান্য চিঠিপত্র</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: none;">${toBengaliDigits(stats.others)} টি</td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td style="padding: 6px; border: none;">সর্বমোট প্রাপ্ত পত্র</td>
            <td style="padding: 6px; text-align: center; border: none;">${toBengaliDigits(stats.total)} টি</td>
          </tr>
        </table>
        ` : `
        <table style="width: 50%; margin: 10px auto; border: none;">
          <tr style="background-color: #e2e8f0;">
            <th colSpan="2" style="padding: 8px; text-align: center; color: #000; background: #e2e8f0 !important; border: none;">মীমাংসার সারসংক্ষেপ</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: none; font-weight: bold;">মোট নিষ্পত্তি হওয়া অনুচ্ছেদের সংখ্যা</td>
            <td style="padding: 8px; text-align: center; font-weight: bold; border: none; color: #1e3a8a;">${toBengaliDigits(totalSettledCountSum)} টি</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: none; font-weight: bold;">মোট নিষ্পত্তিকৃত টাকা</td>
            <td style="padding: 8px; text-align: center; font-weight: bold; border: none; color: #1e3a8a;">${toBengaliDigits(totalSettledAmountSum)} টাকা</td>
          </tr>
        </table>
        `}
        ${clonedTable.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-full mx-auto px-1 sm:px-1.5 md:px-2 py-3 md:py-4 space-y-5 animate-in fade-in duration-500 relative">
      <IDBadge id="custom-period-receipt-report-panel" />

      {/* TOP HEADER / BACK BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <button 
            onClick={onBack}
            className="group px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
            পেছনে ফিরুন
          </button>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-amber-500 shrink-0" />
            চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট
          </h2>
          <p className="text-slate-500 font-bold text-xs">
            যেকোনো নির্দিষ্ট সময়কালের জন্য বিএসআর, দ্বিপক্ষীয় সভা এবং কার্যপত্রের তাৎক্ষণিক রিপোর্ট
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={downloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11.5px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet size={15} />
            এক্সেল ডাউনলোড
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11.5px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BOX */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 shadow-xl no-print space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar size={18} className="text-blue-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">রিপোর্ট ফিল্টারিং ও সময়কাল নির্বাচন</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              শুরুর তারিখ
            </label>
            <div className="relative w-full h-11 flex items-center border-2 border-slate-200 rounded-xl bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all text-xs shadow-sm">
              <div className="flex items-center w-full px-2 h-full justify-center gap-1.5">
                <div className="flex items-center justify-center gap-0.5 font-bold text-slate-800">
                  <input 
                    ref={startDayRef}
                    type="text"
                    placeholder="DD"
                    value={startDD}
                    onChange={(e) => handleSegmentChange(e.target.value, 'day', setStartDD, setStartDate, { month: startMM, year: startYYYY }, startMonthRef)}
                    onBlur={(e) => handleSegmentBlur(e.target.value, 'day', setStartDD, setStartDate, { month: startMM, year: startYYYY })}
                    className="w-5 bg-transparent border-none outline-none text-center font-black p-0 text-xs placeholder-slate-300"
                  />
                  <span className="text-slate-300 font-black">/</span>
                  <input 
                    ref={startMonthRef}
                    type="text"
                    placeholder="MM"
                    value={startMM}
                    onChange={(e) => handleSegmentChange(e.target.value, 'month', setStartMM, setStartDate, { day: startDD, year: startYYYY }, startYearRef)}
                    onBlur={(e) => handleSegmentBlur(e.target.value, 'month', setStartMM, setStartDate, { day: startDD, year: startYYYY })}
                    className="w-5 bg-transparent border-none outline-none text-center font-black p-0 text-xs placeholder-slate-300"
                  />
                  <span className="text-slate-300 font-black">/</span>
                  <input 
                    ref={startYearRef}
                    type="text"
                    placeholder="YYYY"
                    value={startYYYY}
                    onChange={(e) => handleSegmentChange(e.target.value, 'year', setStartYYYY, setStartDate, { day: startDD, month: startMM })}
                    onBlur={(e) => handleSegmentBlur(e.target.value, 'year', setStartYYYY, setStartDate, { day: startDD, month: startMM })}
                    className="w-9 bg-transparent border-none outline-none text-center font-black p-0 text-xs placeholder-slate-300"
                  />
                </div>
                <div className="flex items-center relative cursor-pointer ml-0.5">
                  <Calendar 
                    size={13}
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                    onClick={() => startCalendarRef.current?.showPicker()}
                  />
                  <input 
                    ref={startCalendarRef}
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateSelect(e.target.value)}
                    className="absolute inset-0 opacity-0 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              শেষের তারিখ
            </label>
            <div className="relative w-full h-11 flex items-center border-2 border-slate-200 rounded-xl bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all text-xs shadow-sm">
              <div className="flex items-center w-full px-2 h-full justify-center gap-1.5">
                <div className="flex items-center justify-center gap-0.5 font-bold text-slate-800">
                  <input 
                    ref={endDayRef}
                    type="text"
                    placeholder="DD"
                    value={endDD}
                    onChange={(e) => handleSegmentChange(e.target.value, 'day', setEndDD, setEndDate, { month: endMM, year: endYYYY }, endMonthRef)}
                    onBlur={(e) => handleSegmentBlur(e.target.value, 'day', setEndDD, setEndDate, { month: endMM, year: endYYYY })}
                    className="w-5 bg-transparent border-none outline-none text-center font-black p-0 text-xs placeholder-slate-300"
                  />
                  <span className="text-slate-300 font-black">/</span>
                  <input 
                    ref={endMonthRef}
                    type="text"
                    placeholder="MM"
                    value={endMM}
                    onChange={(e) => handleSegmentChange(e.target.value, 'month', setEndMM, setEndDate, { day: endDD, year: endYYYY }, endYearRef)}
                    onBlur={(e) => handleSegmentBlur(e.target.value, 'month', setEndMM, setEndDate, { day: endDD, year: endYYYY })}
                    className="w-5 bg-transparent border-none outline-none text-center font-black p-0 text-xs placeholder-slate-300"
                  />
                  <span className="text-slate-300 font-black">/</span>
                  <input 
                    ref={endYearRef}
                    type="text"
                    placeholder="YYYY"
                    value={endYYYY}
                    onChange={(e) => handleSegmentChange(e.target.value, 'year', setEndYYYY, setEndDate, { day: endDD, month: endMM })}
                    onBlur={(e) => handleSegmentBlur(e.target.value, 'year', setEndYYYY, setEndDate, { day: endDD, month: endMM })}
                    className="w-9 bg-transparent border-none outline-none text-center font-black p-0 text-xs placeholder-slate-300"
                  />
                </div>
                <div className="flex items-center relative cursor-pointer ml-0.5">
                  <Calendar 
                    size={13}
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                    onClick={() => endCalendarRef.current?.showPicker()}
                  />
                  <input 
                    ref={endCalendarRef}
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateSelect(e.target.value)}
                    className="absolute inset-0 opacity-0 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              শাখা নির্বাচন
            </label>
            <div className="relative">
              <select 
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full h-11 pl-3 pr-7 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs cursor-pointer appearance-none"
              >
                <option value="সকল">সকল শাখা</option>
                <option value="এসএফআই">এসএফআই (SFI)</option>
                <option value="নন এসএফআই">নন এসএফআই (Non-SFI)</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Term / Letter Type */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              চিঠির ধরন নির্বাচন
            </label>
            <div className="relative">
              <select 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-9 pr-8 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs cursor-pointer appearance-none"
              >
                <option value="সকল">সকল চিঠি</option>
                <option value="বিএসআর">বিএসআর (BSR)</option>
                {filterBranch !== 'এসএফআই' && (
                  <>
                    <option value="দ্বিপক্ষীয়">দ্বিপক্ষীয় সভা</option>
                    <option value="কার্যপত্র (দ্বি-সভা)">কার্যপত্র (দ্বি-সভা)</option>
                  </>
                )}
                {filterBranch !== 'নন এসএফআই' && (
                  <>
                    <option value="ত্রিপক্ষীয়">ত্রিপক্ষীয় সভা</option>
                    <option value="কার্যপত্র (ত্রি-সভা)">কার্যপত্র (ত্রি-সভা)</option>
                  </>
                )}
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Auditor Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              অডিটর নির্বাচন
            </label>
            <div className="relative">
              <select 
                value={filterAuditor}
                onChange={(e) => setFilterAuditor(e.target.value)}
                className="w-full h-11 pl-9 pr-8 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs cursor-pointer appearance-none"
              >
                <option value="সকল">সকল অডিটর</option>
                {auditorOptionsWithCounts.map((auditor, idx) => (
                  <option key={idx} value={auditor.name}>
                    {auditor.name} ({toBengaliDigits(auditor.count)} টি)
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Keyword Search / Institution */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              কীওয়ার্ড
            </label>
            <div className="relative">
              <input 
                type="text"
                placeholder="সোনালী ব্যাংক, অগ্রণী ব্যাংক বা ডায়রি নং..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="w-full h-11 pl-9 pr-3 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs placeholder:text-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          {/* Ministry Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              মন্ত্রণালয় নির্বাচন
            </label>
            <div className="relative">
              <select 
                value={filterMinistry}
                onChange={(e) => setFilterMinistry(e.target.value)}
                className="w-full h-11 pl-9 pr-8 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs cursor-pointer appearance-none"
              >
                <option value="সকল">সকল মন্ত্রণালয়</option>
                {MINISTRIES.map((min, idx) => (
                  <option key={idx} value={min}>{min}</option>
                ))}
              </select>
              <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTICS CARDS (Bento Grid Style) */}
      {activeReportMode === 'correspondence' || activeReportMode === 'pending' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* BSR Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-md">BSR</span>
              <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <FileText size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-emerald-600">মোট বিএসআর সংখ্যা</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(stats.bsr)} <span className="text-sm font-black text-slate-500">টি</span>
              </p>
            </div>
          </div>

          {/* Bilateral Meetings Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest bg-blue-100 px-2 py-1 rounded-md">Bilateral</span>
              <div className="w-9 h-9 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <User size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-blue-600">মোট দ্বিপক্ষীয় সভা</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(stats.bilateral)} <span className="text-sm font-black text-slate-500">টি</span>
              </p>
            </div>
          </div>

          {/* Trilateral Meetings Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest bg-indigo-100 px-2 py-1 rounded-md">Trilateral</span>
              <div className="w-9 h-9 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-indigo-600">মোট ত্রিপক্ষীয় সভা</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(stats.trilateral)} <span className="text-sm font-black text-slate-500">টি</span>
              </p>
            </div>
          </div>

          {/* Working Papers Card */}
          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-violet-800 uppercase tracking-widest bg-violet-100 px-2 py-1 rounded-md">Working Paper</span>
              <div className="w-9 h-9 bg-violet-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                <FileEdit size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-violet-600">মোট কার্যপত্র</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(stats.workingPaper)} <span className="text-sm font-black text-slate-500">টি</span>
              </p>
            </div>
          </div>

          {/* Others Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest bg-amber-100 px-2 py-1 rounded-md">Others</span>
              <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                <BookOpen size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-amber-600">অন্যান্য চিঠিপত্র</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(stats.others)} <span className="text-sm font-black text-slate-500">টি</span>
              </p>
            </div>
          </div>

          {/* Total Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-950 rounded-3xl p-5 md:p-6 shadow-xl text-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md">Total</span>
              <div className="w-9 h-9 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Mail size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-slate-400">সর্বমোট প্রাপ্ত পত্র</p>
              <p className="text-2xl md:text-3xl font-black text-white">
                {toBengaliDigits(stats.total)} <span className="text-sm font-black text-slate-400">টি</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
          {/* Total Settled Paragraphs */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-md">Resolved Paras</span>
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-emerald-600">মোট নিষ্পত্তি হওয়া অনুচ্ছেদের সংখ্যা</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(totalSettledCountSum)} <span className="text-sm font-black text-slate-500">টি</span>
              </p>
            </div>
          </div>

          {/* Total Settled Amount */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest bg-indigo-100 px-2 py-1 rounded-md">Settled Amount</span>
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <FileSpreadsheet size={20} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[11px] font-bold text-indigo-600">মোট নিষ্পত্তিকৃত টাকা</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {toBengaliDigits(totalSettledAmountSum)} <span className="text-sm font-black text-slate-500">টাকা</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRINT BANNER / REPORT CARD (Visible both on screen and print) */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-visible">
        {/* Print Header */}
        <div className="hidden print:block text-center space-y-2 p-6 border-b border-slate-300">
          <h1 className="text-2xl font-black text-slate-900 uppercase">হিসাব মহানিয়ন্ত্রক এর কার্যালয়</h1>
          <p className="text-xs font-bold text-slate-600">
            {activeReportMode === 'correspondence'
              ? 'প্রাপ্ত চিঠিপত্র ও সভার সারসংক্ষেপ রিপোর্ট'
              : activeReportMode === 'pending'
              ? 'চলমান/পেন্ডিং কাজের রিপোর্ট'
              : 'নিষ্পন্নকৃত অডিট অনুচ্ছেদ ও টাকার রিপোর্ট'}
          </p>
          <div className="text-[11px] font-bold text-slate-700 bg-slate-100 py-1.5 px-4 rounded-lg inline-block">
            সময়কাল: {formatDateBN(startDate)} হতে {formatDateBN(endDate)}
            {filterAuditor !== 'সকল' && ` | অডিটর: ${filterAuditor}`}
          </div>
        </div>

        <div className="p-2 sm:p-3 md:p-3">
          {/* Toggle Report Mode Control - Engraved / Embedded Segmented Style */}
          <div className="flex items-center p-1.5 bg-slate-200/90 border border-slate-300/80 rounded-2xl w-fit mb-6 no-print shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] max-w-full overflow-x-auto">
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => setActiveReportMode('correspondence')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-[11.5px] font-black transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeReportMode === 'correspondence'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-900/20 scale-[1.01]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <FileText size={14} className={activeReportMode === 'correspondence' ? 'text-emerald-100' : 'text-slate-500'} />
                <span>চিঠিপত্র প্রাপ্তি রিপোর্ট ({toBengaliDigits(filteredEntries.length)} টি)</span>
              </button>

              {/* Inset Engraved Divider */}
              <div className="h-6 w-[2px] bg-slate-300/90 shadow-[1px_0_0_0_rgba(255,255,255,0.9)] mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => setActiveReportMode('settlement')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-[11.5px] font-black transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeReportMode === 'settlement'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-900/20 scale-[1.01]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <ShieldCheck size={14} className={activeReportMode === 'settlement' ? 'text-blue-100' : 'text-slate-500'} />
                <span>মীমাংসিত অনুচ্ছেদ রিপোর্ট ({toBengaliDigits(filteredSettlementEntries.length)} টি)</span>
              </button>

              {/* Inset Engraved Divider */}
              <div className="h-6 w-[2px] bg-slate-300/90 shadow-[1px_0_0_0_rgba(255,255,255,0.9)] mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => setActiveReportMode('pending')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-[11.5px] font-black transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeReportMode === 'pending'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-md shadow-amber-900/20 scale-[1.01]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <Clock size={14} className={activeReportMode === 'pending' ? 'text-amber-100' : 'text-slate-500'} />
                <span>চলমান/পেন্ডিং কাজ ({toBengaliDigits(pendingEntries.length)} টি)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 no-print flex-wrap gap-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-blue-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase">
                  {activeReportMode === 'correspondence'
                    ? 'প্রাপ্ত তথ্যের তালিকা'
                    : activeReportMode === 'pending'
                    ? 'চলমান/পেন্ডিং কাজের তালিকা'
                    : 'মীমাংসিত অনুচ্ছেদের তালিকা'} 
                  ({toBengaliDigits(
                    activeReportMode === 'correspondence'
                      ? filteredEntries.length
                      : activeReportMode === 'pending'
                      ? pendingEntries.length
                      : filteredSettlementEntries.length
                  )} টি)
                </h3>
              </div>
              
              {/* সাজানোর ক্রমানুসার */}
              <div className="relative">
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                  className="h-8 pl-8 pr-7 border-2 border-slate-200 rounded-lg font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all text-xs cursor-pointer appearance-none"
                >
                  <option value="desc">নতুন থেকে পুরানো</option>
                  <option value="asc">পুরানো থেকে নতুন</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 items-center flex-wrap">
              {filterAuditor !== 'সকল' && (
                <div className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                  অডিটর: {filterAuditor}
                </div>
              )}
              {filterMinistry !== 'সকল' && (
                <div className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                  মন্ত্রণালয়: {filterMinistry}
                </div>
              )}
              <div className="text-[11px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                সময়কাল: {formatDateBN(startDate)} হতে {formatDateBN(endDate)}
              </div>
            </div>
          </div>

          {/* TABLE */}
          {activeReportMode === 'correspondence' || activeReportMode === 'pending' ? (
            (() => {
              const displayEntries = activeReportMode === 'pending' ? pendingEntries : filteredEntries;
              return displayEntries.length > 0 ? (
                <div className="table-container overflow-x-auto rounded-2xl shadow-inner border border-slate-200">
                  <table id="custom-period-report-table" className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[3.5%]" />
                      <col className="w-[26%]" />
                      <col className="w-[21%]" />
                      <col className="w-[11.5%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead className="sticky top-0 xl:top-[45px] z-30 shadow-sm bg-slate-200">
                      {/* Header Row 1: Titles (Black Text) */}
                      <tr className="bg-slate-200 text-slate-900 text-[11px] font-black tracking-wider">
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">ক্র: নং</th>
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">অডিটি প্রতিষ্ঠানের নাম ও অন্যান্য</th>
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">পত্র ও ডায়েরির বিবরণ</th>
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">বর্তমান অবস্থান / জারিপত্র</th>
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">প্রাপ্ত অনুচ্ছেদ ও টাকা</th>
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">নিষ্পত্তিকৃত তথ্য</th>
                        <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-slate-300 font-black">অনিষ্পন্ন তথ্য ও মন্তব্য</th>
                      </tr>
                      {/* Header Row 2: Sub-header Numbers (1-7) */}
                      <tr className="bg-slate-100 text-slate-900 text-[11px] font-black text-center">
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">১</th>
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">২</th>
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৩</th>
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৪</th>
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৫</th>
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৬</th>
                        <th className="bg-slate-100 text-slate-900 py-1 border-b border-slate-300">৭</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {displayEntries.map((entry, index) => {
                      const auditEntity = entry.description || entry.entityName || 'নির্ধারিত নয়';
                      const hasSeparateEntity = Boolean(entry.entityName && entry.description && entry.entityName !== entry.description);
                      const ministryName = getEntryMinistry(entry) || entry.ministryName || 'নির্ধারিত নয়';

                      const paraType = entry.paraType || 'এসএফআই';
                      const letterTypeDisplay = getCleanLetterTypeDisplay(entry.letterType) || (entry.isMeeting ? renderMeetingType(entry.meetingType) : 'সাধারণ');
                      const diaryNo = entry.diaryNo ? toBengaliDigits(entry.diaryNo) : (entry.workpaperNoDate ? cleanAndFormat(entry.workpaperNoDate, "ডায়রি") : '-');
                      const diaryDate = entry.diaryDate || '-';
                      const letterNo = entry.letterNo ? toBengaliDigits(entry.letterNo) : (entry.letterNoDate ? cleanAndFormat(entry.letterNoDate, "পত্র") : '-');
                      const letterDate = entry.letterDate || '-';
                      const auditYear = entry.auditYear || '-';
                      const receiptDate = entry.receiptDate || entry.branchReceiptDate || entry.receivedDate || '-';
                      const presentationDate = entry.presentationDate || entry.createdAt || '-';
                      const archiveNo = entry.archiveNo || '-';

                      // Current Position / Issue Letter Status
                      const hasIssueLetter = !!(entry.issueLetterNo || entry.issueLetterDate || entry.issueLetterNoDate);
                      const issueLetterNo = entry.issueLetterNo || (entry.issueLetterNoDate ? cleanAndFormat(entry.issueLetterNoDate, "জারিপত্র") : '');
                      const issueLetterDate = entry.issueLetterDate || '';
                      const rawHolder = entry.presentedToName || entry.receiverName || 'শাখা কর্মকর্তা';
                      const holderName = rawHolder === 'শাখা কর্মকর্তা' ? rawHolder : getCleanAuditorDisplayName(rawHolder);

                      // Sent/Received Paras & Amount
                      const totalParas = parseInt(toEnglishDigits(String(entry.totalParas || entry.sentParaCount || (entry.paragraphs ? entry.paragraphs.length : 1))));
                      const totalAmount = parseFloat(toEnglishDigits(String(entry.totalAmount || entry.sentParaInvolvedAmount || entry.involvedAmount || 0)));

                      // Settlement stats calculation - Pull from Settlement Register (settlementEntries)
                      let settledCount = 0;
                      let settledAmount = 0;
                      let settledParas: any[] = [];

                      const extractPureNo = (directNo?: string, combinedStr?: string) => {
                        if (directNo && String(directNo).trim()) {
                          return toEnglishDigits(String(directNo)).replace(/\D/g, '');
                        }
                        if (!combinedStr || !combinedStr.trim()) return '';
                        const str = String(combinedStr);
                        const firstPart = str.split(/[\(,\/–—]|\bতারিখ\b|তারিখ/i)[0] || str;
                        return toEnglishDigits(firstPart).replace(/\D/g, '');
                      };

                      const eIssue = extractPureNo(entry.issueLetterNo, entry.issueLetterNoDate);
                      const eDiary = extractPureNo(entry.diaryNo, entry.workpaperNoDate);
                      const eLetter = extractPureNo(entry.letterNo, entry.letterNoDate);

                      const matchedSettlementEntries = (settlementEntries || []).filter((s: any) => {
                        if (s.correspondenceId && s.correspondenceId === entry.id) return true;
                        if (s.letterId && s.letterId === entry.id) return true;

                        const sIssue = extractPureNo(s.issueNo || s.issueLetterNo, s.issueLetterNoDate);
                        const sDiary = extractPureNo(s.diaryNo, s.workpaperNoDate);
                        const sLetter = extractPureNo(s.letterNo, s.letterNoDate);

                        const issueMatch = Boolean(eIssue && sIssue && eIssue === sIssue);
                        const diaryMatch = Boolean(eDiary && sDiary && eDiary === sDiary);
                        const letterMatch = Boolean(eLetter && sLetter && eLetter === sLetter);

                        if (issueMatch && diaryMatch && letterMatch) return true;
                        if (issueMatch && diaryMatch) return true;
                        if (issueMatch && letterMatch) return true;
                        if (diaryMatch && letterMatch) return true;
                        if (issueMatch && !eDiary && !eLetter) return true;
                        if (diaryMatch && !eIssue && !eLetter) return true;
                        if (letterMatch && !eIssue && !eDiary) return true;

                        return false;
                      });

                      if (matchedSettlementEntries.length > 0) {
                        matchedSettlementEntries.forEach((matchedS: any) => {
                          let sAmtFromParas = 0;
                          let sCountFromParas = 0;

                          if (matchedS.paragraphs && matchedS.paragraphs.length > 0) {
                            matchedS.paragraphs.forEach((p: any) => {
                              const isFullSettled = p.status === 'পূর্ণাঙ্গ' || p.status === 'মীমাংসিত' || p.status === 'নিষ্পন্ন';
                              const recAdj = (p.recoveredAmount || 0) + (p.adjustedAmount || 0);

                              if (isFullSettled) {
                                sCountFromParas += 1;
                              }
                              if (isFullSettled || recAdj > 0 || p.status === 'আংশিক') {
                                const pAmount = recAdj > 0 ? recAdj : (p.involvedAmount || p.totalAmount || 0);
                                sAmtFromParas += pAmount;
                                settledParas.push(p);
                              }
                            });
                          }

                          const stats = getSettlementEntryStats(matchedS);
                          const fallbackCount = stats.fullCount;
                          const fallbackAmt = stats.settledAmount || parseFloat(toEnglishDigits(String(matchedS.meetingSettledAmount || (matchedS.totalRec || 0) + (matchedS.totalAdj || 0) || matchedS.involvedAmount || 0)));

                          settledCount += (matchedS.paragraphs && matchedS.paragraphs.length > 0 ? sCountFromParas : fallbackCount);
                          settledAmount += (sAmtFromParas > 0 ? sAmtFromParas : fallbackAmt);
                        });
                      } else if (hasIssueLetter) {
                        if (entry.paragraphs && entry.paragraphs.length > 0) {
                          entry.paragraphs.forEach((p: any) => {
                            const isFullSettled = p.status === 'পূর্ণাঙ্গ' || p.status === 'মীমাংসিত' || p.status === 'নিষ্পন্ন';
                            const recAdj = (p.recoveredAmount || 0) + (p.adjustedAmount || 0);

                            if (isFullSettled) {
                              settledCount += 1;
                            }
                            if (isFullSettled || recAdj > 0 || p.status === 'আংশিক') {
                              settledParas.push(p);
                              const pAmount = recAdj > 0 ? recAdj : (p.involvedAmount || p.totalAmount || 0);
                              settledAmount += pAmount;
                            }
                          });
                        } else {
                          const stats = getSettlementEntryStats(entry);
                          settledCount = stats.fullCount;
                          settledAmount = stats.settledAmount || parseFloat(toEnglishDigits(String(entry.meetingSettledAmount || (entry.totalRec || 0) + (entry.totalAdj || 0) || 0)));
                        }
                      }

                      // Unsettled stats
                      const unsettledCount = Math.max(0, totalParas - settledCount);
                      const unsettledAmount = Math.max(0, totalAmount - settledAmount);
                      const remarks = entry.remarks || entry.issueLetterComment || '-';

                      return (
                        <tr key={entry.id || index} className="group hover:bg-blue-50/40 transition-colors align-top relative">
                          {/* Col 1: ক্র: নং */}
                          <td className="px-2 py-3 text-center text-[11px] font-black text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {toBengaliDigits(index + 1)}
                          </td>

                          {/* Col 2: অডিট প্রতিষ্ঠান ও মন্ত্রণালয় */}
                          <td className="px-3 py-3 text-left border-r border-slate-200">
                            <div className="space-y-1 text-[10.5px] leading-snug text-justify">
                              <div>
                                <span className="font-black text-emerald-700">১. প্রতিষ্ঠানের নাম: </span>
                                <span className="font-bold text-slate-900">{auditEntity}</span>
                              </div>
                              {hasSeparateEntity && (
                                <div>
                                  <span className="font-black text-emerald-700">২. এনটিটি: </span>
                                  <span className="font-bold text-slate-900">{entry.entityName}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-black text-emerald-700">{hasSeparateEntity ? '৩.' : '২.'} মন্ত্রণালয়: </span>
                                <span className="font-bold text-slate-900">{ministryName}</span>
                              </div>
                            </div>
                          </td>

                          {/* Col 3: পত্র ও ডায়েরির বিবরণ */}
                          <td className="px-3 py-3 text-left border-r border-slate-200">
                            <div className="space-y-1 text-[10.5px] leading-snug">
                              <div>
                                <span className="font-black text-emerald-700">১. শাখার নাম: </span>
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded text-[9.5px]">{paraType}</span>
                              </div>
                              <div>
                                <span className="font-black text-emerald-700">২. পত্রের ধরন: </span>
                                <span className="font-bold text-slate-900">{letterTypeDisplay}</span>
                              </div>
                              <div>
                                <span className="font-black text-emerald-700">৩. ডায়েরী নম্বর ও তারিখ: </span>
                                <span className="font-bold text-slate-900">{diaryNo}</span>
                                {diaryDate !== '-' && <span className="text-slate-800 font-bold"> ({formatDateBN(diaryDate)})</span>}
                              </div>
                              <div>
                                <span className="font-black text-emerald-700">৪. পত্র নম্বর ও তারিখ: </span>
                                <span className="font-bold text-slate-900">{letterNo}</span>
                                {letterDate !== '-' && <span className="text-slate-800 font-bold"> ({formatDateBN(letterDate)})</span>}
                              </div>
                              {auditYear !== '-' && (
                                <div>
                                  <span className="font-black text-emerald-700">৫. নিরীক্ষা বছর: </span>
                                  <span className="font-bold text-slate-900">{toBengaliDigits(auditYear)}</span>
                                </div>
                              )}
                              {receiptDate !== '-' && (
                                <div>
                                  <span className="font-black text-emerald-700">৬. শাখায় প্রাপ্তির তারিখ: </span>
                                  <span className="font-bold text-slate-800">{formatDateBN(receiptDate)}</span>
                                </div>
                              )}
                              {presentationDate !== '-' && (
                                <div>
                                  <span className="font-black text-emerald-700">৭. গ্রহণের তারিখ: </span>
                                  <span className="font-bold text-slate-800">{formatDateBN(presentationDate)}</span>
                                </div>
                              )}
                              {archiveNo !== '-' && (
                                <div>
                                  <span className="font-black text-emerald-700">৮. আর্কাইভ নং: </span>
                                  <span className="font-bold text-purple-700">{toBengaliDigits(archiveNo)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Col 4: বর্তমান অবস্থান / জারিপত্র */}
                          <td className="px-3 py-3 text-left border-r border-slate-200">
                            <div className="space-y-1.5 text-[11px]">
                              <span className="font-black text-slate-700 block text-[10.5px]">১. চিঠিটির বর্তমান অবস্থান:</span>
                              {hasIssueLetter ? (
                                <div className="bg-emerald-50 text-emerald-900 p-2 rounded-xl border border-emerald-200 shadow-2xs space-y-0.5">
                                  {issueLetterNo && <span className="block text-[10px] font-bold">জারিপত্র নং: {issueLetterNo}</span>}
                                  {issueLetterDate && <span className="block text-[10px] font-bold text-emerald-900">তারিখ: {formatDateBN(issueLetterDate)}</span>}
                                </div>
                              ) : (
                                <div className="bg-amber-50 text-amber-900 p-2 rounded-xl border border-amber-200 shadow-2xs space-y-0.5">
                                  <span className="font-bold block text-[10px] text-amber-700">চিঠিটি এখনো যার কাছে আছে:</span>
                                  <span className="font-black block text-[11px] text-amber-950">{holderName}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Col 5: প্রাপ্ত অনুচ্ছেদ ও টাকা */}
                          <td className="px-3 py-3 text-left border-r border-slate-200">
                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex flex-wrap items-baseline gap-x-1.5 break-words">
                                <span className="font-black text-slate-700 text-[10px]">১. প্রেরিত মোট অনুচ্ছেদ:</span>
                                <span className="font-black text-slate-900 text-xs break-all">{toBengaliDigits(totalParas)} টি</span>
                              </div>
                              <div className="flex flex-wrap items-baseline gap-x-1.5 break-words pt-0.5">
                                <span className="font-black text-slate-700 text-[10px]">২. মোট জড়িত টাকা:</span>
                                <span className="font-black text-blue-900 text-xs break-all">{toBengaliDigits(totalAmount)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Col 6: নিষ্পত্তিকৃত তথ্য */}
                          <td className="px-3 py-3 text-left border-r border-slate-200">
                            <div className="space-y-1 text-[11px]">
                              <div className="flex flex-wrap items-baseline gap-x-1.5 break-words">
                                <span className="font-black text-slate-700 text-[10px]">১. মোট অনুচ্ছেদ:</span>
                                <span className="font-black text-emerald-700 text-xs break-all">{toBengaliDigits(settledCount)} টি</span>
                              </div>
                              <div className="flex flex-wrap items-baseline gap-x-1.5 break-words pt-0.5">
                                <span className="font-black text-slate-700 text-[10px]">২. মোট টাকা:</span>
                                <span className="font-black text-emerald-900 text-xs break-all">{toBengaliDigits(settledAmount)}</span>
                              </div>
                              {settledParas.length > 0 && (
                                <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                  <span className="font-black text-slate-700 text-[10px] shrink-0">
                                    ৩. অনুচ্ছেদ নং:
                                  </span>
                                  {(() => {
                                    const entryKey = entry.id || String(index);
                                    const isExpanded = !!expandedParasMap[entryKey];
                                    const hasMore = settledParas.length > 3;
                                    const visibleParas = (hasMore && !isExpanded) ? settledParas.slice(0, 3) : settledParas;
                                    const paraNumbersStr = visibleParas.map((p: any, pIdx: number) => {
                                      return p.paraNo ? toBengaliDigits(p.paraNo) : toBengaliDigits(pIdx + 1);
                                    }).join(', ');

                                    return (
                                      <span className="inline-flex items-center gap-1 text-[10.5px]">
                                        <span className="font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline">
                                          {paraNumbersStr}
                                          {hasMore && !isExpanded && '...'}
                                        </span>
                                        {hasMore && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleExpandParas(entryKey);
                                            }}
                                            className="ml-1 inline-flex items-center text-[10px] font-black text-blue-600 hover:text-blue-800 underline cursor-pointer no-print whitespace-nowrap"
                                          >
                                            {isExpanded ? 'কম দেখুন' : 'আরো দেখুন'}
                                          </button>
                                        )}
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Col 7: অনিষ্পন্ন তথ্য ও মন্তব্য (এবং হোভারে এডিট বাটন) */}
                          <td className="px-3 py-3 text-left relative">
                            <div className="space-y-1.5 text-[11px] pr-2 pb-7">
                              <div className="flex flex-wrap items-baseline gap-x-1.5 break-words">
                                <span className="font-black text-slate-700 text-[10px]">১. মোট অনুচ্ছেদ:</span>
                                <span className="font-black text-rose-700 text-xs break-all">{toBengaliDigits(unsettledCount)} টি</span>
                              </div>
                              <div className="flex flex-wrap items-baseline gap-x-1.5 break-words pt-0.5">
                                <span className="font-black text-slate-700 text-[10px]">২. মোট টাকা:</span>
                                <span className="font-black text-rose-800 text-xs break-all">{toBengaliDigits(unsettledAmount)}</span>
                              </div>
                              <div>
                                <span className="font-black text-slate-700 block text-[10px] mb-0.5">৩. মন্তব্য:</span>
                                <p className="text-[10.5px] font-medium text-slate-800 leading-tight">
                                  {remarks}
                                </p>
                              </div>
                            </div>

                            {/* Floating Hover Edit Button */}
                            <div className="no-print absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEdit) onEdit(entry);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-200 font-bold text-[10.5px] active:scale-95 cursor-pointer whitespace-nowrap"
                                title="এডিট করুন"
                              >
                                <FileEdit size={12} className="shrink-0" />
                                এডিট
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Info className="mx-auto text-slate-400" size={32} />
                <p className="text-slate-500 font-bold text-sm">
                  {activeReportMode === 'pending'
                    ? 'নির্বাচিত সময়কাল এবং ফিল্টার অনুযায়ী কোনো চলমান বা পেন্ডিং চিঠি পাওয়া যায়নি।'
                    : 'নির্বাচিত সময়কাল এবং ফিল্টার অনুযায়ী কোনো চিঠি পাওয়া যায়নি।'}
                </p>
                <p className="text-[11px] text-slate-400">অনুগ্রহ করে সময়কাল বা ফিল্টার অপশন পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
              </div>
            );
            })()
          ) : (
            filteredSettlementEntries.length > 0 ? (
              <div className="table-container overflow-x-auto rounded-2xl shadow-inner">
                <table id="custom-period-report-table" className="w-full text-left border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[18%]" />
                    <col className="w-[17%]" />
                    <col className="w-[8%]" />
                    <col className="w-[15%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="sticky top-0 xl:top-[45px] z-30 shadow-sm bg-slate-200">
                    {/* Header Row 1: Titles */}
                    <tr className="bg-slate-200 text-slate-900 text-[11px] font-black tracking-wider">
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">ক্র: নং</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">মন্ত্রণালয় ও প্রতিষ্ঠান</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">স্মারক ও তারিখ</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">অডিট বছর</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">শাখা ও নিষ্পত্তির ধরন</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">নিষ্পন্নকৃত অনুচ্ছেদের সংখ্যা</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">নিষ্পত্তিকৃত টাকা (টাকা)</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-r border-slate-300 font-black">অনিষ্পন্ন টাকা (টাকা)</th>
                      <th className="bg-slate-200 text-slate-900 px-3 py-2.5 text-center border-b border-slate-300 font-black">মন্তব্য</th>
                    </tr>
                    {/* Header Row 2: Sub-header Numbers (1-9) */}
                    <tr className="bg-slate-100 text-slate-900 text-[11px] font-black text-center">
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">১</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">২</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৩</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৪</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৫</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৬</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৭</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-r border-slate-300">৮</th>
                      <th className="bg-slate-100 text-slate-900 py-1 border-b border-slate-300">৯</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSettlementEntries.map((entry, index) => {
                      const { fullCount, partialCount, settledAmount, fullAmount, partialAmount, fullParas, partialParas, allParas } = getSettlementEntryStats(entry);
                      const rowSettledCount = (fullCount + partialCount) || fullCount || partialCount;
                      const rowSettledAmount = settledAmount;

                      const totalInvolved = entry.involvedAmount || entry.totalAmount || (entry.paragraphs && entry.paragraphs.length > 0 ? entry.paragraphs.reduce((sum: number, p: any) => sum + (p.involvedAmount || p.totalAmount || 0), 0) : 0);
                      const rowUnsettledAmount = Math.max(0, totalInvolved - rowSettledAmount);

                      const fullParasText = fullParas.length > 0 ? fullParas.map(toBengaliDigits).join(', ') : '';
                      const partialParasText = partialParas.length > 0 ? partialParas.map(toBengaliDigits).join(', ') : '';
                      const allParasText = allParas.length > 0 
                        ? allParas.map(toBengaliDigits).join(', ') 
                        : ([fullParasText, partialParasText].filter(Boolean).join(', '));

                      return (
                        <tr key={entry.id || index} className="hover:bg-blue-50/20 transition-colors group">
                          <td className="px-2 py-3 text-center text-[11px] font-black text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {toBengaliDigits(index + 1)}
                          </td>
                          <td className="px-3 py-3 text-left text-[11px] font-bold text-slate-800 border-r border-slate-200">
                            <div className="flex flex-col space-y-1">
                              <div>
                                <span className="font-black text-slate-700">১. </span>
                                <span className="font-black text-slate-900">{entry.ministryName}</span>
                              </div>
                              <div>
                                <span className="font-black text-slate-700">২. </span>
                                <span className="text-[10px] text-slate-600 font-medium">{entry.entityName} ({entry.branchName})</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-left text-[11px] font-bold text-slate-800 border-r border-slate-200">
                            <div className="flex flex-col space-y-1">
                              <div>
                                <span className="font-black text-slate-700">১. </span>
                                <span className="font-bold text-slate-900">{cleanAndFormat(entry.letterNoDate, "পত্র নং ও তারিখ")}</span>
                              </div>
                              <div>
                                <span className="font-black text-slate-700">২. </span>
                                <span className="text-[10px] text-slate-600 font-bold">{cleanAndFormat(entry.workpaperNoDate, "ডায়েরি নং ও তারিখ")}</span>
                              </div>
                              <div>
                                <span className="font-black text-slate-700">৩. </span>
                                <span className="text-[10px] text-slate-600 font-bold">{cleanAndFormat(entry.issueLetterNoDate, "জারিপত্র নং ও তারিখ")}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-[11px] font-black text-slate-900 border-r border-slate-200">
                            {toBengaliDigits(entry.auditYear)}
                          </td>
                          <td className="px-3 py-3 text-left text-[11px] font-bold text-slate-700 border-r border-slate-200">
                            <div className="space-y-1">
                              <div>
                                <span className="font-black text-slate-700 text-[10px]">১. </span>
                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600">
                                  {entry.paraType}
                                </span>
                              </div>
                              {fullCount > 0 && partialCount > 0 ? (
                                <div className="space-y-0.5 pt-0.5">
                                  <div 
                                    className="cursor-help hover:text-blue-700 transition-colors"
                                    title={fullParasText ? `পূর্ণাঙ্গ নিষ্পন্ন অনুচ্ছেদ নং: ${fullParasText}` : `পূর্ণাঙ্গ অনুচ্ছেদ: ${toBengaliDigits(fullCount)} টি`}
                                  >
                                    <span className="font-black text-slate-700 text-[10px]">২. </span>
                                    <span className="font-black text-slate-900 text-[10.5px]">
                                      পূর্ণাঙ্গ = {toBengaliDigits(fullCount)} টি ({toBengaliDigits(fullAmount || 0)})
                                    </span>
                                  </div>
                                  <div 
                                    className="cursor-help hover:text-amber-900 transition-colors"
                                    title={partialParasText ? `আংশিক নিষ্পন্ন অনুচ্ছেদ নং: ${partialParasText}` : `আংশিক অনুচ্ছেদ: ${toBengaliDigits(partialCount)} টি`}
                                  >
                                    <span className="font-black text-slate-700 text-[10px]">৩. </span>
                                    <span className="font-black text-amber-800 text-[10.5px]">
                                      আংশিক = {toBengaliDigits(partialCount)} টি ({toBengaliDigits(partialAmount || 0)})
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="cursor-help hover:text-blue-700 transition-colors"
                                  title={allParasText ? `সকল নিষ্পন্ন অনুচ্ছেদ নং: ${allParasText}` : `নিষ্পন্ন অনুচ্ছেদ: ${toBengaliDigits(rowSettledCount)} টি`}
                                >
                                  <span className="font-black text-slate-700 text-[10px]">২. </span>
                                  <span className="font-black text-slate-900 text-[10.5px]">
                                    {fullCount > 0 ? (
                                      <>পূর্ণাঙ্গ = {toBengaliDigits(fullCount)} টি ({toBengaliDigits(fullAmount || settledAmount)})</>
                                    ) : partialCount > 0 ? (
                                      <>আংশিক = {toBengaliDigits(partialCount)} টি ({toBengaliDigits(partialAmount || settledAmount)})</>
                                    ) : (
                                      <>{getSettlementTypeDisplay(entry)} ({toBengaliDigits(settledAmount)})</>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td 
                            className="px-4 py-3 text-center text-[11px] font-black text-slate-700 border-r border-slate-200 cursor-help hover:bg-blue-100/50 hover:text-blue-700 transition-colors"
                            title={allParasText ? `সকল নিষ্পন্নকৃত অনুচ্ছেদ নং: ${allParasText}` : `নিষ্পন্নকৃত অনুচ্ছেদ সংখ্যা: ${toBengaliDigits(rowSettledCount)} টি`}
                          >
                            {toBengaliDigits(rowSettledCount)} টি
                          </td>
                          <td className="px-4 py-3 text-center text-[11.5px] font-black text-slate-900 border-r border-slate-200">
                            {toBengaliDigits(rowSettledAmount || '০')}
                          </td>
                          <td className="px-4 py-3 text-center text-[11.5px] font-black text-rose-800 border-r border-slate-200">
                            {toBengaliDigits(rowUnsettledAmount || '০')}
                          </td>
                          <td className="px-4 py-3 text-justify break-words text-[11px] font-semibold text-slate-800 border-r border-slate-200 relative pb-7">
                            {entry.remarks || '-'}
                            <div className="no-print absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEdit) onEdit(entry);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 font-bold text-[10.5px] shadow-sm active:scale-95 border border-slate-200 cursor-pointer whitespace-nowrap"
                                title="এডিট করুন"
                              >
                                <FileEdit size={12} className="text-blue-500 shrink-0" />
                                এডিট
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={5} className="px-4 py-3 text-center text-xs border-r border-slate-200 font-black">সর্বমোট:</td>
                      <td className="px-4 py-3 text-center text-[11px] border-r border-slate-200 font-black">
                        {toBengaliDigits(totalSettledCountSum)} টি
                      </td>
                      <td className="px-4 py-3 text-center text-[11.5px] border-r border-slate-200 font-black">
                        {toBengaliDigits(totalSettledAmountSum || '০')}
                      </td>
                      <td className="px-4 py-3 text-center text-[11.5px] border-r border-slate-200 font-black text-rose-800">
                        {toBengaliDigits(totalUnsettledAmountSum || '০')}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Info className="mx-auto text-slate-400" size={32} />
                <p className="text-slate-500 font-bold text-sm">নির্বাচিত সময়কাল এবং ফিল্টার অনুযায়ী কোনো মীমাংসিত অনুচ্ছেদ পাওয়া যায়নি।</p>
                <p className="text-[11px] text-slate-400">অনুগ্রহ করে সময়কাল বা ফিল্টার অপশন পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
