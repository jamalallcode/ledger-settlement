import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FileSpreadsheet, Building2, Landmark, ChevronDown, X, CalendarDays, Check } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { format, addMonths } from 'date-fns';
import { SettlementEntry } from '../types';
import { getQuarterlyCycleForDate } from '../utils/cycleHelper';

interface QRProps {
  entries: SettlementEntry[];
  prevStats?: any;
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  filterEntity?: string;
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
  paraType?: 'এসএফআই' | 'নন এসএফআই';
}

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

const isEntityMatch = (entryEntity: string = '', targetEntity: string = ''): boolean => {
  const normEntry = robustNormalize(entryEntity);
  const normTarget = robustNormalize(targetEntity);
  if (!normEntry || !normTarget) return false;
  if (normEntry === normTarget) return true;

  // Cottage / Handicraft / Small Industries / BSCIC
  if ((normTarget.includes("কুটির") || normTarget.includes("হস্ত") || normTarget.includes("বিসিক")) && 
      (normEntry.includes("কুটির") || normEntry.includes("হস্ত") || normEntry.includes("বিসিক"))) return true;

  // Sugar & Food Industries (বিএসএফআইসি / চিনি ও খাদ্য)
  if ((normTarget.includes("চিনি") || normTarget.includes("খাদ্য") || normTarget.includes("বিএসএফআইসি")) && 
      (normEntry.includes("চিনি") || normEntry.includes("খাদ্য") || normEntry.includes("বিএসএফআইসি"))) return true;

  // Chemical Industries (BCIC / বিসিআইসি / রসায়ন)
  if ((normTarget.includes("রসায়ন") || normTarget.includes("রসায়ন") || normTarget.includes("বিসিআইসি")) && 
      (normEntry.includes("রসায়ন") || normEntry.includes("রসায়ন") || normEntry.includes("বিসিআইসি"))) return true;

  // Banks & Financial Institutions
  if (normTarget.includes("সোনালী") && normEntry.includes("সোনালী")) return true;
  if (normTarget.includes("জনতা") && normEntry.includes("জনতা")) return true;
  if (normTarget.includes("অগ্রণী") && normEntry.includes("অগ্রণী")) return true;
  if (normTarget.includes("রূপালী") && normEntry.includes("রূপালী")) return true;
  if (normTarget.includes("কৃষি") && normEntry.includes("কৃষি")) return true;
  if (normTarget.includes("বাংলাদেশ ব্যাংক") && normEntry.includes("বাংলাদেশ ব্যাংক")) return true;
  if (normTarget.includes("ডেভেলপমেন্ট") && normEntry.includes("ডেভেলপমেন্ট")) return true;
  if (normTarget.includes("গৃহনির্মাণ") && normEntry.includes("গৃহনির্মাণ")) return true;
  if (normTarget.includes("কর্মসংস্থান") && normEntry.includes("কর্মসংস্থান")) return true;
  if (normTarget.includes("বেসিক") && normEntry.includes("বেসিক")) return true;
  if (normTarget.includes("আনসার") && normEntry.includes("আনসার")) return true;
  if (normTarget.includes("ইনভেস্ট") && normEntry.includes("ইনভেস্ট")) return true;
  if (normTarget.includes("সাধারণ বীমা") && normEntry.includes("সাধারণ বীমা")) return true;
  if (normTarget.includes("জীবন বীমা") && normEntry.includes("জীবন বীমা")) return true;
  if (normTarget.includes("প্রবাসী কল্যাণ") && normEntry.includes("প্রবাসী কল্যাণ")) return true;

  // Jute & Textiles (Patkol vs Pat)
  const isPatkolTarget = normTarget.includes("পাটকল") || normTarget.includes("বিজেএমসি") || normTarget.includes("জুট");
  const isPatkolEntry = normEntry.includes("পাটকল") || normEntry.includes("বিজেএমসি") || normEntry.includes("জুট");
  if (isPatkolTarget || isPatkolEntry) return isPatkolTarget && isPatkolEntry;

  const isBostraTarget = normTarget.includes("বস্ত্র") || normTarget.includes("বিটিএমসি") || normTarget.includes("রেশম");
  const isBostraEntry = normEntry.includes("বস্ত্র") || normEntry.includes("বিটিএমসি") || normEntry.includes("রেশম");
  if (isBostraTarget || isBostraEntry) return isBostraTarget && isBostraEntry;

  if (normTarget.includes("টিসিবি") && normEntry.includes("টিসিবি")) return true;
  if ((normTarget.includes("আমদানি") || normTarget.includes("রপ্তানি")) && 
      (normEntry.includes("আমদানি") || normEntry.includes("রপ্তানি"))) return true;
  if (normTarget.includes("বিমান") && normEntry.includes("বিমান")) return true;
  if (normTarget.includes("পর্যটন") && normEntry.includes("পর্যটন")) return true;

  return normEntry.includes(normTarget) || normTarget.includes(normEntry);
};

export const DEFAULT_MINISTRIES = [
  {
    sl: 2,
    name: 'বস্ত্র ও পাট মন্ত্রণালয়',
    entities: ['পাটকল সংস্থা', 'পাট সংস্থা', 'বস্ত্রকল সংস্থা', 'রেশম বোর্ড'],
    matchKeys: ['পাট', 'বস্ত্র', 'বিজেএমসি', 'বিটিএমসি'],
  },
  {
    sl: 3,
    name: 'শিল্প মন্ত্রণালয়',
    entities: ['চিনি ও খাদ্য সংস্থা', 'ক্ষুদ্র ও কুটির শিল্প', 'বিটাক', 'রসায়ন শিল্প'],
    matchKeys: ['শিল্প', 'চিনি', 'কুটির', 'বিসিক', 'বিসিআইসি', 'রসায়ন', 'রসায়ন'],
  },
  {
    sl: 4,
    name: 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
    entities: ['বাংলাদেশ বিমান', 'পর্যটন কর্পোরেশন'],
    matchKeys: ['বিমান', 'পর্যটন'],
  },
  {
    sl: 5,
    name: 'বাণিজ্য মন্ত্রণালয়',
    entities: ['টিসিবি', 'আমদানি ও রপ্তানি', 'আমদানি', 'রপ্তানি'],
    matchKeys: ['বাণিজ্য', 'টিসিবি', 'আমদানি', 'রপ্তানি'],
  },
  {
    sl: 6,
    name: 'আর্থিক প্রতিষ্ঠান বিভাগ',
    entities: [
      'সোনালী ব্যাংক পিএলসি', 'জনতা ব্যাংক পিএলসি', 'অগ্রণী ব্যাংক পিএলসি',
      'বাংলাদেশ কৃষি ব্যাংক', 'রূপালী ব্যাংক পিএলসি', 'বাংলাদেশ ব্যাংক',
      'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লি.', 'গৃহনির্মাণ ঋণদান সংস্থা',
      'কর্মসংস্থান ব্যাংক', 'বেসিক ব্যাংক লি.', 'আনসার ভিডিপি উন্নয়ন ব্যাংক লি.',
      'ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ', 'সাধারণ বীমা কর্পোরেশন',
      'জীবন বীমা কর্পোরেশন', 'প্রবাসী কল্যাণ ব্যাংক'
    ],
    matchKeys: ['আর্থিক প্রতিষ্ঠান বিভাগ', 'আর্থিক প্রতিষ্ঠান', 'ব্যাংক', 'বীমা', 'ইনভেস্টমেন্ট', 'সোনালী', 'জনতা', 'অগ্রণী', 'রূপালী', 'কৃষি', 'বেসিক'],
  }
];

const QR_4: React.FC<QRProps> = ({
  entries,
  activeCycle,
  IDBadge,
  searchTerm = '',
  filterMinistry = '',
  filterEntity = '',
  monthPickerElement,
  customTitle = 'বিস্তারিত - ৩',
  paraType = 'নন এসএফআই'
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, Record<string, number>>>({});

  // Multi-select filter states
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>(
    filterMinistry && filterMinistry !== 'সকল' ? [filterMinistry] : []
  );
  const [selectedEntities, setSelectedEntities] = useState<string[]>(
    filterEntity && filterEntity !== 'সকল' ? [filterEntity] : []
  );

  const [isCycleOpen, setIsCycleOpen] = useState(false);
  const [isMinOpen, setIsMinOpen] = useState(false);
  const [isEntOpen, setIsEntOpen] = useState(false);

  const cycleDropdownRef = useRef<HTMLDivElement>(null);
  const minDropdownRef = useRef<HTMLDivElement>(null);
  const entDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filterMinistry !== undefined) {
      if (filterMinistry && filterMinistry !== 'সকল') {
        setSelectedMinistries([filterMinistry]);
      } else {
        setSelectedMinistries([]);
      }
    }
  }, [filterMinistry]);

  useEffect(() => {
    if (filterEntity !== undefined) {
      if (filterEntity && filterEntity !== 'সকল') {
        setSelectedEntities([filterEntity]);
      } else {
        setSelectedEntities([]);
      }
    }
  }, [filterEntity]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(e.target as Node)) {
        setIsCycleOpen(false);
      }
      if (minDropdownRef.current && !minDropdownRef.current.contains(e.target as Node)) {
        setIsMinOpen(false);
      }
      if (entDropdownRef.current && !entDropdownRef.current.contains(e.target as Node)) {
        setIsEntOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleOptions = useMemo(() => {
    const list: { label: string; startStr: string; endStr: string }[] = [];
    const baseDate = activeCycle?.end ? new Date(activeCycle.end) : new Date();
    for (let i = -12; i <= 6; i += 3) {
      const d = addMonths(baseDate, i);
      const c = getQuarterlyCycleForDate(d);
      const startStr = format(c.start, 'yyyy-MM-dd');
      const endStr = format(c.end, 'yyyy-MM-dd');
      const label = `${toBengaliDigits(format(c.start, 'dd/MM/yyyy'))} হতে ${toBengaliDigits(format(c.end, 'dd/MM/yyyy'))}`;
      if (!list.some(item => item.startStr === startStr && item.endStr === endStr)) {
        list.push({ label, startStr, endStr });
      }
    }
    return list;
  }, [activeCycle]);

  const ministryOptions = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_MINISTRIES.forEach(m => set.add(m.name));
    return Array.from(set);
  }, []);

  const entityOptions = useMemo(() => {
    const set = new Set<string>();
    if (selectedMinistries.length > 0) {
      selectedMinistries.forEach(min => {
        const normSelected = robustNormalize(min).toLowerCase();
        DEFAULT_MINISTRIES.forEach(m => {
          const normM = robustNormalize(m.name).toLowerCase();
          if (normSelected === normM || normSelected.includes(normM) || normM.includes(normSelected)) {
            m.entities.forEach(ent => set.add(ent));
          }
        });
        (entries || []).forEach(e => {
          const normEntryMin = robustNormalize(e.ministryName || '').toLowerCase();
          if (normSelected.includes(normEntryMin) || normEntryMin.includes(normSelected)) {
            if (e.entityName && e.entityName.trim()) set.add(e.entityName.trim());
          }
        });
      });
    } else {
      DEFAULT_MINISTRIES.forEach(m => {
        m.entities.forEach(ent => set.add(ent));
      });
      (entries || []).forEach(e => {
        if (e.entityName && e.entityName.trim()) set.add(e.entityName.trim());
      });
    }
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [selectedMinistries, entries]);

  // Cycle range extraction (matching 16th to 15th reporting cycle)
  const getQuarterInfo = (date: Date) => {
    const cycleEndMonth = date.getMonth(); // 0 to 11
    const year = date.getFullYear();
    let quarterStartMonth = 0;
    let quarterEndMonth = 2;
    let quarterYear = year;

    if (cycleEndMonth >= 0 && cycleEndMonth <= 2) {
      quarterStartMonth = 0; // Jan
      quarterEndMonth = 2;   // Mar
    } else if (cycleEndMonth >= 3 && cycleEndMonth <= 5) {
      quarterStartMonth = 3; // Apr
      quarterEndMonth = 5;   // Jun
    } else if (cycleEndMonth >= 6 && cycleEndMonth <= 8) {
      quarterStartMonth = 6; // Jul
      quarterEndMonth = 8;   // Sep
    } else {
      quarterStartMonth = 9; // Oct
      quarterEndMonth = 11;  // Dec
    }

    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const startMonthName = months[quarterStartMonth];
    const endMonthName = months[quarterEndMonth];

    const startYearShort = format(new Date(quarterYear, quarterStartMonth, 1), 'yy');
    const endYearShort = format(new Date(quarterYear, quarterEndMonth, 1), 'yy');

    const formattedRange = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;

    return {
      startMonthName,
      endMonthName,
      formattedRange,
      quarterStartMonth,
      quarterYear
    };
  };

  const { startMonthName, endMonthName, formattedRange, quarterStartMonth, quarterYear } = getQuarterInfo(activeCycle?.end || new Date());

  // Use the actual selected activeCycle range (e.g. 16/06/2026 to 15/09/2026)
  const cycleStartDate = activeCycle?.start ? new Date(activeCycle.start) : new Date(quarterYear, quarterStartMonth, 16);
  const cycleEndDate = activeCycle?.end ? new Date(activeCycle.end) : new Date(quarterYear, quarterStartMonth + 2, 15);
  cycleStartDate.setHours(0, 0, 0, 0);
  cycleEndDate.setHours(23, 59, 59, 999);

  const quarterCycleStartDateStr = format(cycleStartDate, 'yyyy-MM-dd');
  const quarterCycleEndDateStr = format(cycleEndDate, 'yyyy-MM-dd');
  const quarterCycleRangeFormatted = activeCycle?.label
    ? toBengaliDigits(activeCycle.label)
    : `${toBengaliDigits(format(cycleStartDate, 'dd/MM/yyyy'))} হতে ${toBengaliDigits(format(cycleEndDate, 'dd/MM/yyyy'))}`;

  // Unique storage key for custom cell overrides
  const storageKey = `qr4_custom_overrides_${quarterCycleStartDateStr}_${quarterCycleEndDateStr}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCustomValues(JSON.parse(saved));
      } else {
        setCustomValues({});
      }
    } catch {
      setCustomValues({});
    }
  }, [storageKey]);

  const handleCellChange = (ministryName: string, field: string, value: string) => {
    const num = parseBengaliNumber(value);
    setCustomValues(prev => {
      const updated = {
        ...prev,
        [ministryName]: {
          ...(prev[ministryName] || {}),
          [field]: isNaN(num) ? 0 : num
        }
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleResetOverrides = () => {
    if (window.confirm('আপনি কি এই টেবিলের কাস্টম মানসমূহ রিসেট করতে চান?')) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error(e);
      }
      setCustomValues({});
    }
  };

  // Process and aggregate data ministry-wise
  const tableData = useMemo(() => {
    const isEntryForMinistry = (e: SettlementEntry, minConfig: typeof DEFAULT_MINISTRIES[0]) => {
      const eMin = robustNormalize(e.ministryName || '');
      const eEnt = robustNormalize(e.entityName || '');

      if (eMin === robustNormalize(minConfig.name) || eMin.includes(robustNormalize(minConfig.name)) || robustNormalize(minConfig.name).includes(eMin)) {
        return true;
      }

      if (minConfig.entities && minConfig.entities.some(ent => isEntityMatch(eEnt, ent))) {
        return true;
      }

      return minConfig.matchKeys.some(key => {
        const normKey = robustNormalize(key);
        return eMin.includes(normKey) || eEnt.includes(normKey);
      });
    };

    // Filter relevant entries for the current cycle (এসএফআই ও নন-এসএফআই উভয় শাখার সম্মিলিত হিসাব)
    const relevantEntries = (entries || []).filter(e => {
      // Do not restrict by paraType so both SFI and Non-SFI are included
      if (paraType && !['এসএফআই ও নন-এসএফআই', 'সকল', 'নন এসএফআই'].includes(paraType) && e.paraType && robustNormalize(e.paraType) !== robustNormalize(paraType)) {
        return false;
      }

      // Robust date extraction: check issueDateISO, or parse issueLetterNoDate, or fallback to createdAt
      let issueDateStr = e.issueDateISO || '';
      if (!issueDateStr && e.issueLetterNoDate) {
        const eng = toEnglishDigits(e.issueLetterNoDate);
        const ymd = eng.match(/\b(\d{4})[-\/\.](0?[1-9]|1[0-2])[-\/\.](0?[1-9]|[12]\d|3[01])\b/);
        if (ymd) {
          issueDateStr = `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
        } else {
          const dmy = eng.match(/\b(0?[1-9]|[12]\d|3[01])[-\/\.](0?[1-9]|1[0-2])[-\/\.](\d{4})\b/);
          if (dmy) {
            issueDateStr = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
          }
        }
      }
      if (!issueDateStr && e.createdAt) {
        issueDateStr = e.createdAt.split('T')[0];
      }
      if (!issueDateStr) return false;

      // Cycle filter (multi-select or active cycle range)
      if (selectedCycles.length > 0) {
        const matchesAnyCycle = selectedCycles.some(cLabel => {
          const opt = cycleOptions.find(o => o.label === cLabel);
          if (!opt) return false;
          return issueDateStr >= opt.startStr && issueDateStr <= opt.endStr;
        });
        if (!matchesAnyCycle) return false;
      } else {
        if (issueDateStr < quarterCycleStartDateStr || issueDateStr > quarterCycleEndDateStr) return false;
      }

      // Filter by Ministry filter if selected (multi-select)
      if (selectedMinistries.length > 0) {
        const normEntryMin = robustNormalize(e.ministryName || '').toLowerCase();
        const matchesMin = selectedMinistries.some(min => {
          const normMin = robustNormalize(min).toLowerCase();
          return normEntryMin.includes(normMin) || normMin.includes(normEntryMin);
        });
        if (!matchesMin) return false;
      }

      // Filter by Entity filter if selected (multi-select)
      if (selectedEntities.length > 0) {
        const normEntryEnt = robustNormalize(e.entityName || '').toLowerCase();
        const matchesEnt = selectedEntities.some(ent => {
          const normEnt = robustNormalize(ent).toLowerCase();
          return isEntityMatch(e.entityName || '', ent) ||
            normEntryEnt.includes(normEnt) || normEntryEnt.includes(normEntryEnt);
        });
        if (!matchesEnt) return false;
      }

      // Filter by Search Term if present
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSearch =
          robustNormalize(e.ministryName || '').toLowerCase().includes(term) ||
          robustNormalize(e.entityName || '').toLowerCase().includes(term) ||
          robustNormalize(e.remarks || '').toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      return true;
    });

    const targetMinistries = DEFAULT_MINISTRIES.filter(minConfig => {
      if (selectedMinistries.length === 0 && selectedEntities.length === 0) return true;

      if (selectedMinistries.length > 0) {
        const normMinName = robustNormalize(minConfig.name).toLowerCase();
        const matchMin = selectedMinistries.some(m => {
          const normM = robustNormalize(m).toLowerCase();
          return normMinName === normM || normMinName.includes(normM) || normMinName.includes(normMinName);
        });
        if (!matchMin) return false;
      }

      if (selectedEntities.length > 0) {
        const hasEnt = minConfig.entities.some(e =>
          selectedEntities.some(se => isEntityMatch(e, se))
        );
        if (!hasEnt) return false;
      }

      return true;
    });

    return targetMinistries.map(minConfig => {
      const matchedEntries = relevantEntries.filter(e => isEntryForMinistry(e, minConfig));

      let matchedCol3 = 0; // উত্থাপিত আপত্তিতে জড়িত টাকা
      let matchedCol4 = 0; // অডিট কালীন আদায়
      let matchedCol5 = 0; // অডিট কালীন সমন্বয়
      let matchedCol6 = 0; // প্রতিবেদনাধীন সময়ে উত্থাপিত অর্থের বিপরীতে আদায়
      let matchedCol7 = 0; // প্রতিবেদনাধীন সময়ে উত্থাপিত অর্থের বিপরীতে সমন্বয়
      let matchedCol8 = 0; // পুরাতন আপত্তিতে জড়িত অর্থ - আদায়
      let matchedCol9 = 0; // পুরাতন আপত্তিতে জড়িত অর্থ - সমন্বয়
      const remarksList: string[] = [];

      matchedEntries.forEach(entry => {
        if (entry.remarks && entry.remarks.trim()) {
          remarksList.push(entry.remarks.trim());
        }

        // If manual raised amount exists
        if (entry.manualRaisedAmount) {
          matchedCol3 += Number(entry.manualRaisedAmount) || 0;
        }

        // Authoritative recovery and adjustment from entry (as in SettlementTable)
        const entryTotalRec = Number(entry.totalRec) || 0;
        const entryTotalAdj = Number(entry.totalAdj) || 0;

        // Sum paragraph-level or top-level recoveries and adjustments
        let entRec = 0;
        let entAdj = 0;

        if (entry.paragraphs && entry.paragraphs.length > 0) {
          entry.paragraphs.forEach(p => {
            const explicitRec = parseBengaliNumber(String(p.recoveredAmount || '0'));
            const categorizedRec = parseBengaliNumber(String(p.vatRec || '0')) + 
                                   parseBengaliNumber(String(p.itRec || '0')) + 
                                   parseBengaliNumber(String(p.othersRec || '0'));
            const pRec = Math.max(explicitRec, categorizedRec);

            const explicitAdj = parseBengaliNumber(String(p.adjustedAmount || '0'));
            const categorizedAdj = parseBengaliNumber(String(p.vatAdj || '0')) + 
                                   parseBengaliNumber(String(p.itAdj || '0')) + 
                                   parseBengaliNumber(String(p.othersAdj || '0'));
            const pAdj = Math.max(explicitAdj, categorizedAdj);

            entRec += pRec;
            entAdj += pAdj;
          });
        }

        // If paragraph sum was 0, check entry-level fields
        if (entRec === 0) {
          entRec = parseBengaliNumber(String(entry.settledAmount || entry.manualSettledAmount || '0')) ||
            (parseBengaliNumber(String(entry.vatRec || '0')) + parseBengaliNumber(String(entry.itRec || '0')) + parseBengaliNumber(String(entry.othersRec || '0')));
        }
        if (entAdj === 0) {
          entAdj = parseBengaliNumber(String(entry.vatAdj || '0')) + parseBengaliNumber(String(entry.itAdj || '0')) + parseBengaliNumber(String(entry.othersAdj || '0'));
        }

        const finalRec = entryTotalRec > 0 ? entryTotalRec : entRec;
        const finalAdj = entryTotalAdj > 0 ? entryTotalAdj : entAdj;

        // In commercial audit reporting, settled objections of the reporting quarter are mapped to Col 8 & 9 (পুরাতন আপত্তিতে জড়িত অর্থ)
        matchedCol8 += finalRec;
        matchedCol9 += finalAdj;
      });

      // User custom cell overrides (if manually modified)
      const minOverrides = customValues[minConfig.name] || {};

      const col3 = minOverrides['col3'] !== undefined ? minOverrides['col3'] : matchedCol3;
      const col4 = minOverrides['col4'] !== undefined ? minOverrides['col4'] : matchedCol4;
      const col5 = minOverrides['col5'] !== undefined ? minOverrides['col5'] : matchedCol5;
      const col6 = minOverrides['col6'] !== undefined ? minOverrides['col6'] : matchedCol6;
      const col7 = minOverrides['col7'] !== undefined ? minOverrides['col7'] : matchedCol7;

      // Col 8 (পুরাতন আপত্তি - আদায়) and Col 9 (পুরাতন আপত্তি - সমন্বয়) populated from relevant settled entries
      const col8 = minOverrides['col8'] !== undefined ? minOverrides['col8'] : matchedCol8;
      const col9 = minOverrides['col9'] !== undefined ? minOverrides['col9'] : matchedCol9;

      // Column 10 (মোট আদায়) = Col 4 + Col 6 + Col 8
      const col10 = col4 + col6 + col8;
      // Column 11 (মোট সমন্বয়) = Col 5 + Col 7 + Col 9
      const col11 = col5 + col7 + col9;

      return {
        sl: minConfig.sl,
        ministryName: minConfig.name,
        col3,
        col4,
        col5,
        col6,
        col7,
        col8,
        col9,
        col10,
        col11,
        remarks: remarksList.length > 0 ? Array.from(new Set(remarksList)).join(', ') : '-'
      };
    });
  }, [entries, paraType, quarterCycleStartDateStr, quarterCycleEndDateStr, filterMinistry, searchTerm, customValues, selectedCycles, selectedMinistries, selectedEntities, cycleOptions]);

  // Calculate Grand Totals across all columns
  const totals = useMemo(() => {
    return tableData.reduce((acc, row) => {
      acc.col3 += row.col3;
      acc.col4 += row.col4;
      acc.col5 += row.col5;
      acc.col6 += row.col6;
      acc.col7 += row.col7;
      acc.col8 += row.col8;
      acc.col9 += row.col9;
      acc.col10 += row.col10;
      acc.col11 += row.col11;
      return acc;
    }, {
      col3: 0,
      col4: 0,
      col5: 0,
      col6: 0,
      col7: 0,
      col8: 0,
      col9: 0,
      col10: 0,
      col11: 0,
    });
  }, [tableData]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Excel Download Handler
  const downloadExcel = () => {
    const table = document.querySelector('#qr-detailed-3-table');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const filename = `ত্রৈমাসিক_রিটার্ন_বিস্তারিত_৩_${format(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #94a3b8 !important; padding: 8px 10px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-sub { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .footer-row td { background-color: #000000 !important; color: #ffffff !important; font-weight: bold !important; }
          .text-right { text-align: right !important; }
          .text-left { text-align: left !important; }
          .text-center { text-align: center !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 5px; color: #1e3a8a;">বিস্তারিত - ৩</h2>
        <div style="margin-bottom: 12px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between;">
          <span>বিষয়ঃ অডিট আপত্তির ফলে আদায়কৃত/সমন্বয়কৃত অর্থের ত্রৈমাসিক প্রতিবেদন ${formattedRange} পর্যন্ত</span>
          <span style="float: right;">শাখার নামঃ ${paraType} শাখা।</span>
        </div>
        ${clonedTable.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tableRef = useRef<HTMLTableElement>(null);

  useLayoutEffect(() => {
    const updateHeaderStickyOffsets = () => {
      const table = tableRef.current;
      if (!table) return;
      const tr1 = table.querySelector('thead tr:nth-child(1)') as HTMLElement | null;
      const tr2 = table.querySelector('thead tr:nth-child(2)') as HTMLElement | null;
      if (tr1 && tr2) {
        const r1Cell = tr1.querySelector('th:not([rowspan]):not([rowSpan])') as HTMLElement | null;
        const h1 = r1Cell ? r1Cell.getBoundingClientRect().height : (tr2.getBoundingClientRect().top - tr1.getBoundingClientRect().top);
        const r2Cell = tr2.querySelector('th') as HTMLElement | null;
        const h2 = r2Cell ? r2Cell.getBoundingClientRect().height : tr2.getBoundingClientRect().height;

        if (h1 > 0) {
          table.style.setProperty('--th-r2-top', `${Math.round(h1)}px`);
          if (h2 > 0) {
            table.style.setProperty('--th-r3-top', `${Math.round(h1 + h2)}px`);
          }
        }
      }

      const bottomFooter = table.querySelector('.qr-sticky-footer-bottom') as HTMLElement | null;
      if (bottomFooter) {
        const hBottom = bottomFooter.getBoundingClientRect().height;
        if (hBottom > 0) {
          table.style.setProperty('--qr-footer-bottom-h', `${Math.round(hBottom)}px`);
        }
      }
    };

    updateHeaderStickyOffsets();
    const t1 = setTimeout(updateHeaderStickyOffsets, 50);
    const t2 = setTimeout(updateHeaderStickyOffsets, 200);

    window.addEventListener('resize', updateHeaderStickyOffsets);

    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver && tableRef.current) {
      ro = new ResizeObserver(updateHeaderStickyOffsets);
      ro.observe(tableRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateHeaderStickyOffsets);
      if (ro) ro.disconnect();
    };
  }, [tableData]);

  const thCls = "border-r border-b border-slate-400 p-2 text-[10px] font-black text-slate-900 bg-[#e2e8f0] align-middle text-center";
  const thClsWithTop = thCls + " border-t border-slate-400";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-800 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-900 text-right align-middle font-bold tabular-nums";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-white align-middle bg-black font-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-white text-right align-middle font-black bg-black tabular-nums";

  const renderNumber = (val: number) => {
    return toBengaliDigits(Math.round(val || 0).toLocaleString('en-IN'));
  };

  return (
    <div id="qr-detailed-3-container" className="w-full mx-auto py-4 px-2 bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-detailed-3-container" />

      {/* Action bar (No Print) */}
      <div className="flex flex-wrap justify-end items-center gap-3 mb-4 no-print">
        <div className="flex items-center gap-2 flex-wrap">
          {monthPickerElement && (
            <div className="select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}

          {/* Cycle Multi-Select Filter */}
          <div className="relative select-none z-[300]" ref={cycleDropdownRef}>
            <div
              onClick={() => setIsCycleOpen(!isCycleOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-lg cursor-pointer text-[11px] font-bold shadow-xs ${
                selectedCycles.length > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <CalendarDays size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[130px]">
                {selectedCycles.length === 0
                  ? 'সকল সাইকেল'
                  : selectedCycles.length === 1
                  ? selectedCycles[0]
                  : `${toBengaliDigits(selectedCycles.length.toString())}টি সাইকেল`}
              </span>
              {selectedCycles.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px]">
                  {toBengaliDigits(selectedCycles.length.toString())}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${isCycleOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </div>

            {isCycleOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-[270px] bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarDays size={11} /> সাইকেল নির্বাচন
                  </span>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => setSelectedCycles([])}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                      selectedCycles.length === 0
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>সকল সাইকেল</span>
                    {selectedCycles.length === 0 && <Check size={13} />}
                  </div>
                  {cycleOptions.map((opt, idx) => {
                    const isSelected = selectedCycles.includes(opt.label);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCycles(selectedCycles.filter(c => c !== opt.label));
                          } else {
                            setSelectedCycles([...selectedCycles, opt.label]);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCycleOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ministry Multi-Select Filter */}
          <div className="relative select-none z-[290]" ref={minDropdownRef}>
            <div
              onClick={() => setIsMinOpen(!isMinOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-lg cursor-pointer text-[11px] font-bold shadow-xs ${
                selectedMinistries.length > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Building2 size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[130px]">
                {selectedMinistries.length === 0
                  ? 'সকল মন্ত্রণালয়'
                  : selectedMinistries.length === 1
                  ? selectedMinistries[0]
                  : `${toBengaliDigits(selectedMinistries.length.toString())}টি মন্ত্রণালয়`}
              </span>
              {selectedMinistries.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px]">
                  {toBengaliDigits(selectedMinistries.length.toString())}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${isMinOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </div>

            {isMinOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-[260px] bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 size={11} /> মন্ত্রণালয় নির্বাচন
                  </span>
                  {selectedMinistries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMinistries([])}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => {
                      setSelectedMinistries([]);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                      selectedMinistries.length === 0
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>সকল মন্ত্রণালয়</span>
                    {selectedMinistries.length === 0 && <Check size={13} />}
                  </div>
                  {ministryOptions.map((m, idx) => {
                    const isSelected = selectedMinistries.includes(m);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMinistries(selectedMinistries.filter(item => item !== m));
                          } else {
                            setSelectedMinistries([...selectedMinistries, m]);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMinOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Entity Multi-Select Filter */}
          <div className="relative select-none z-[280]" ref={entDropdownRef}>
            <div
              onClick={() => setIsEntOpen(!isEntOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-lg cursor-pointer text-[11px] font-bold shadow-xs ${
                selectedEntities.length > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Landmark size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[130px]">
                {selectedEntities.length === 0
                  ? 'সকল সংস্থা'
                  : selectedEntities.length === 1
                  ? selectedEntities[0]
                  : `${toBengaliDigits(selectedEntities.length.toString())}টি সংস্থা`}
              </span>
              {selectedEntities.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px]">
                  {toBengaliDigits(selectedEntities.length.toString())}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${isEntOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </div>

            {isEntOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-[260px] bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Landmark size={11} /> সংস্থা নির্বাচন
                  </span>
                  {selectedEntities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedEntities([])}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => {
                      setSelectedEntities([]);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                      selectedEntities.length === 0
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>সকল সংস্থা</span>
                    {selectedEntities.length === 0 && <Check size={13} />}
                  </div>
                  {entityOptions.map((ent, idx) => {
                    const isSelected = selectedEntities.includes(ent);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedEntities(selectedEntities.filter(item => item !== ent));
                          } else {
                            setSelectedEntities([...selectedEntities, ent]);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{ent}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEntOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters button if any active */}


          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 transition-all rounded-lg cursor-pointer shrink-0 shadow-xs"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {customTitle}
        </h1>
      </div>

      {/* Subheader info: Row 4 from image (Subject on left, Branch Name on right) */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] font-bold text-slate-800 px-1">
        <div>
          বিষয়ঃ অডিট আপত্তির ফলে আদায়কৃত/সমন্বয়কৃত অর্থের ত্রৈমাসিক প্রতিবেদন <span className="font-extrabold text-blue-900">{formattedRange}</span> পর্যন্ত
        </div>
        <div className="text-right">
          শাখার নামঃ <span className="font-extrabold text-slate-900">{paraType} শাখা।</span>
        </div>
      </div>

      {/* Main 12-Column Table */}
      <div className="table-container qr-table-container w-full overflow-visible border-t border-l border-slate-400 rounded-xs shadow-xs">
        <style>{`
          #qr-detailed-3-table {
            --th-r2-top: 65px;
            --th-r3-top: 102px;
          }
          #qr-detailed-3-table thead th {
            position: -webkit-sticky !important;
            position: sticky !important;
            background-color: #e2e8f0 !important;
            background-clip: padding-box !important;
            vertical-align: middle !important;
            opacity: 1 !important;
            box-shadow: none !important;
          }
          #qr-detailed-3-table thead tr:first-child th {
            top: 0px !important;
            z-index: 140 !important;
          }
          #qr-detailed-3-table thead tr:first-child th[rowspan],
          #qr-detailed-3-table thead tr:first-child th[rowSpan] {
            top: 0px !important;
            z-index: 145 !important;
          }
          #qr-detailed-3-table thead tr:nth-child(2) th {
            top: var(--th-r2-top, 65px) !important;
            z-index: 135 !important;
          }
          #qr-detailed-3-table thead tr:nth-child(3) th {
            top: var(--th-r3-top, 102px) !important;
            z-index: 130 !important;
            white-space: nowrap !important;
          }
        `}</style>
        <table id="qr-detailed-3-table" ref={tableRef} className="w-full border-separate border-spacing-0 text-center">
          <thead>
            {/* Header Row 1 */}
            <tr>
              <th rowSpan={2} className={thClsWithTop + " w-[45px]"}>ক্রঃ নং</th>
              <th rowSpan={2} className={thClsWithTop + " min-w-[210px] text-left pl-3"}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={thClsWithTop + " min-w-[140px]"}>প্রতিবেদনাধীন সময়ে উত্থাপিত আপত্তিতে জড়িত টাকার পরিমাণ</th>
              <th colSpan={2} className={thClsWithTop + " min-w-[170px]"}>অডিট কালীন আদায়/সমন্বয়</th>
              <th colSpan={2} className={thClsWithTop + " min-w-[190px]"}>প্রতিবেদনাধীন সময়ে উত্থাপিত অর্থের বিপরীতে আদায়/সমন্বয়</th>
              <th colSpan={2} className={thClsWithTop + " min-w-[180px]"}>পুরাতন আপত্তিতে জড়িত অর্থ</th>
              <th colSpan={2} className={thClsWithTop + " min-w-[170px]"}>মোট</th>
            </tr>
            {/* Header Row 2 */}
            <tr>
              <th className={thCls + " min-w-[85px]"}>আদায়</th>
              <th className={thCls + " min-w-[85px]"}>সমন্বয়</th>
              <th className={thCls + " min-w-[95px]"}>আদায়</th>
              <th className={thCls + " min-w-[95px]"}>সমন্বয়</th>
              <th className={thCls + " min-w-[90px]"}>আদায়</th>
              <th className={thCls + " min-w-[90px]"}>সমন্বয়</th>
              <th className={thCls + " min-w-[85px]"}>আদায়</th>
              <th className={thCls + " min-w-[85px]"}>সমন্বয়</th>
            </tr>
            {/* Header Row 3: Column Numbers 1 to 11 */}
            <tr className="bg-[#e2e8f0] font-black text-[9px] text-slate-700">
              <th className={thCls}>১</th>
              <th className={thCls}>২</th>
              <th className={thCls}>৩</th>
              <th className={thCls}>৪</th>
              <th className={thCls}>৫</th>
              <th className={thCls}>৬</th>
              <th className={thCls}>৭</th>
              <th className={thCls}>৮</th>
              <th className={thCls}>৯</th>
              <th className={thCls}>১০</th>
              <th className={thCls}>১১</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.sl} className="hover:bg-slate-50 transition-colors">
                <td className={tdCls + " text-center font-bold"}>{toBengaliDigits(row.sl.toString())}</td>
                <td className={tdCls + " text-left pl-3 font-bold text-slate-900"}>{row.ministryName}</td>
                
                {/* Col 3 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col3.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col3', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col3)
                  )}
                </td>

                {/* Col 4 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col4.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col4', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col4)
                  )}
                </td>

                {/* Col 5 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col5.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col5', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col5)
                  )}
                </td>

                {/* Col 6 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col6.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col6', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col6)
                  )}
                </td>

                {/* Col 7 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col7.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col7', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col7)
                  )}
                </td>

                {/* Col 8 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col8.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col8', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col8)
                  )}
                </td>

                {/* Col 9 */}
                <td className={numTdCls}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={toBengaliDigits(row.col9.toString())}
                      onChange={(e) => handleCellChange(row.ministryName, 'col9', e.target.value)}
                      className="w-full text-right px-1 py-0.5 border border-amber-300 rounded text-[11px] font-bold bg-amber-50/50"
                    />
                  ) : (
                    renderNumber(row.col9)
                  )}
                </td>

                {/* Col 10 (মোট আদায় = ৪ + ৬ + ৮) */}
                <td className={numTdCls + " font-black bg-slate-50/60"}>
                  {renderNumber(row.col10)}
                </td>

                {/* Col 11 (মোট সমন্বয় = ৫ + ৭ + ৯) */}
                <td className={numTdCls + " font-black bg-slate-50/60"}>
                  {renderNumber(row.col11)}
                </td>
              </tr>
            ))}

            {/* Totals Row */}
            <tr className="footer-row font-black h-[32px] bg-black text-white no-hover-row">
              <td colSpan={2} className={footerTdCls + " text-center tracking-wide"}>মোট</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col3)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col4)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col5)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col6)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col7)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col8)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col9)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col10)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.col11)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QR_4;
