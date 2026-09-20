import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, Printer, FileSpreadsheet, Calendar, 
  RotateCcw, Edit3, X, Building2, Plus, Trash2, Eye,
  Layers, Check, Download, LayoutGrid, FileText, BarChart3,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { isSFI, isNonSFI } from '../utils/branchUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';
import * as XLSX from 'xlsx';
import { isBilateralLetter, isTrilateralLetter, isExcludedFromDhakaReturn } from './CorrespondenceDhakaReturn';

interface CorrespondenceDhakaReturn2Props {
  correspondenceEntries: any[];
  settlementEntries?: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter?: React.FC;
  IDBadge: React.FC<{ id: string }>;
  showFilters?: boolean;
}

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

// 17 Audit Directorates under OCAG Bangladesh
export const BANGLADESH_AUDIT_DIRECTORATES = [
  'বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা',
  'সিভিল অডিট অধিদপ্তর, ঢাকা',
  'প্রতিরক্ষা অডিট অধিদপ্তর, ঢাকা',
  'রেলওয়ে অডিট অধিদপ্তর, ঢাকা',
  'ডাক, টেলিযোগাযোগ ও বিজ্ঞান-প্রযুক্তি অডিট অধিদপ্তর, ঢাকা',
  'স্বাস্থ্য ও পরিবার কল্যাণ অডিট অধিদপ্তর, ঢাকা',
  'শিক্ষা অডিট অধিদপ্তর, ঢাকা',
  'পূর্ত অডিট অধিদপ্তর, ঢাকা',
  'স্থানীয় সরকার ও পল্লী উন্নয়ন অডিট অধিদপ্তর, ঢাকা',
  'পরিবহন ও যোগাযোগ অডিট অধিদপ্তর, ঢাকা',
  'কৃষি ও পরিবেশ অডিট অধিদপ্তর, ঢাকা',
  'বিদ্যুৎ, জ্বালানি ও খনিজ সম্পদ অডিট অধিদপ্তর, ঢাকা',
  'রাজস্ব অডিট অধিদপ্তর, ঢাকা',
  'মিশন অডিট অধিদপ্তর, ঢাকা',
  'সামাজিক নিরাপত্তা ও নারী-শিশু অডিট অধিদপ্তর, ঢাকা',
  'আইটি ও বিশেষায়িত অডিট অধিদপ্তর, ঢাকা',
  'সাংবিধানিক প্রতিষ্ঠান অডিট অধিদপ্তর, ঢাকা'
];

const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const cleanStr = toEnglishDigits(dateStr).trim();
  const parts = cleanStr.split(/[-/.]/);
  if (parts.length === 3) {
    let d: number, m: number, y: number;
    if (parts[0].length === 4) {
      y = parseInt(parts[0]);
      m = parseInt(parts[1]) - 1;
      d = parseInt(parts[2]);
    } else {
      d = parseInt(parts[0]);
      m = parseInt(parts[1]) - 1;
      y = parseInt(parts[2]);
    }
    const fullY = y < 100 ? 2000 + y : y;
    const date = new Date(fullY, m, d);
    if (!isNaN(date.getTime())) return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const fallback = new Date(cleanStr);
  if (!isNaN(fallback.getTime())) return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  return null;
};

export const extractIssueNo = (item: any): string => {
  if (!item) return '';

  // Helper to extract clean issue number from any string
  const cleanNumFromStr = (str: string): string => {
    if (!str) return '';
    const eng = toEnglishDigits(str).trim();

    // 1. Explicit prefix match for 'জারিপত্র নং', 'জারিপত্রের নং', 'জারি নং', 'জারিপত্র', 'স্মারক নং', 'নং'
    const prefixMatch = eng.match(/(?:জারিপত্র নং|জারিপত্রের নং|জারি নং|জারিপত্র|স্মারক নং|নং)[\s:\-–—]*(\d+)/i);
    if (prefixMatch && prefixMatch[1]) {
      return prefixMatch[1];
    }

    // 2. Segment before comma or date label
    const firstSegment = eng.split(/[\(,\/–—]|\bতারিখ\b|তারিখ/i)[0] || '';
    const firstMatch = firstSegment.match(/\d+/);
    if (firstMatch && firstMatch[0].length <= 5 && !['2023', '2024', '2025', '2026', '2027'].includes(firstMatch[0])) {
      return firstMatch[0];
    }

    // 3. Fallback: find any digits that are not common 4-digit calendar years
    const allDigits = eng.match(/\d+/g);
    if (allDigits) {
      for (const d of allDigits) {
        if (d.length <= 5 && !['2023', '2024', '2025', '2026', '2027'].includes(d)) {
          return d;
        }
      }
    }
    return '';
  };

  // Check direct issue fields first
  if (item.issueNo) {
    const res = cleanNumFromStr(String(item.issueNo));
    if (res) return res;
  }

  if (item.issueLetterNo) {
    const res = cleanNumFromStr(String(item.issueLetterNo));
    if (res) return res;
  }

  // Check combined or memo fields
  const candidates = [
    item.issueLetterNoDate,
    item.meetingMemoNo,
    item.memoNo
  ];

  for (const cand of candidates) {
    if (cand) {
      const res = cleanNumFromStr(String(cand));
      if (res) return res;
    }
  }

  return '';
};

export const splitCombinedInfo = (info: string, noPrefix: string, datePrefix: string) => {
  if (!info) return { no: '', date: '' };
  const str = String(info).trim();
  const parts = str.split(',');
  if (parts.length < 2) {
    const dateMatch = str.match(/\b(\d{1,4}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/);
    const date = dateMatch ? dateMatch[1] : '';
    let cleaned = str
      .replace(new RegExp(`.*${noPrefix}[\\s:\\-–—]*`, 'i'), '')
      .replace(/(?:কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|স্মারকের|স্মারক|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/gi, '')
      .replace(/\b(\d{1,4}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/g, '')
      .trim();
    return { no: cleaned, date };
  }
  let no = parts[0]
    .replace(new RegExp(`.*${noPrefix}[\\s:\\-–—]*`, 'i'), '')
    .replace(/(?:কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|স্মারকের|স্মারক|নং)[\s:\-–—]*/gi, '')
    .trim();
  let date = parts[1]
    .replace(new RegExp(`.*${datePrefix}[\\s:\\-–—]*`, 'i'), '')
    .replace(/(?:তারিখের|তারিখ|ডায়েরির\s*তারিখ|পত্রের\s*তারিখ|জারিপত্রের\s*তারিখ)[\s:\-–—]*/gi, '')
    .replace(/খ্রি:?/gi, '')
    .trim();
  return { no, date };
};

export const formatDateDisplay = (dateVal?: string): string => {
  if (!dateVal) return '';
  const trimmed = String(dateVal).trim().replace(/খ্রি:?/gi, '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return toBengaliDigits(`${parts[2]}/${parts[1]}/${parts[0]}`);
    }
  }
  return toBengaliDigits(trimmed);
};

export const findMatchedCorr = (entry: any, corrList: any[] = []): any => {
  if (!entry || !Array.isArray(corrList) || corrList.length === 0) return null;
  if (entry.correspondenceId || entry.letterId) {
    const byId = corrList.find(c => c.id === entry.correspondenceId || c.id === entry.letterId);
    if (byId) return byId;
  }
  
  const extractDigits = (s?: string) => toEnglishDigits(String(s || '')).replace(/\D/g, '');
  const normStr = (s?: string) => toEnglishDigits(String(s || '')).toLowerCase().replace(/[\s\-\,\.\(\)\/\\\_:;\']/g, '');

  const sIssue = extractIssueNo(entry);
  const sDiary = extractDigits(entry.diaryNo || entry.diaryNumber || entry.workpaperNoDate);
  const sLetter = extractDigits(entry.letterNo || entry.letterNoDate);
  const sEntity = normStr(entry.entityName);

  return corrList.find(c => {
    if (c.id === entry.id) return true;
    const cIssue = extractIssueNo(c);
    const cDiary = extractDigits(c.diaryNo || c.diaryNumber || c.workpaperNoDate);
    const cLetter = extractDigits(c.letterNo || c.letterNoDate);
    const cEntity = normStr(c.entityName);

    if (sEntity && cEntity && !sEntity.includes(cEntity) && !cEntity.includes(sEntity)) {
      return false;
    }

    if (sIssue && cIssue && sIssue === cIssue) return true;
    if (sDiary && cDiary && sDiary === cDiary) return true;
    if (sLetter && cLetter && sLetter === cLetter) return true;

    return false;
  });
};

const STORAGE_KEY_MANUAL = 'dhaka_return_2_manual_overrides_v2';
const STORAGE_KEY_DIRECTORATES = 'dhaka_return_2_directorates_list_v2';

export const CorrespondenceDhakaReturn2: React.FC<CorrespondenceDhakaReturn2Props> = ({
  correspondenceEntries = [],
  settlementEntries = [],
  activeCycle,
  setSelectedReportType,
  IDBadge
}) => {
  // Initialize period from active cycle or default to 01/01/2026 to 31/08/2026
  const cycleEndDate = activeCycle?.end ? new Date(activeCycle.end) : new Date();
  const currentYear = cycleEndDate.getFullYear();

  // Date range states: Start date (default 01/01/2026) and End date (default 31/08/2026)
  const initialStartDate = useMemo(() => {
    return new Date(2026, 0, 1); // ০১/০১/২০২৬
  }, []);

  const initialEndDate = useMemo(() => {
    return new Date(2026, 7, 31); // ৩১/০৮/২০২৬
  }, []);

  const [startDate, setStartDate] = useState<Date>(() => initialStartDate);
  const [endDate, setEndDate] = useState<Date>(() => initialEndDate);
  const [selectingDateType, setSelectingDateType] = useState<'start' | 'end'>('start');

  // Date Picker & Calendar States
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date(2026, 7, 1));
  const calendarRef = React.useRef<HTMLDivElement>(null);

  // Branch Type Filter: 'সকল', 'এসএফআই', 'নন এসএফআই'
  const [branchType, setBranchType] = useState<'সকল' | 'এসএফআই' | 'নন এসএফআই'>('সকল');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState<boolean>(false);
  const branchDropdownRef = React.useRef<HTMLDivElement>(null);

  // Letter Type Filter matching Image 1
  const [filterLetterType, setFilterLetterType] = useState<string>('সকল');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const typeDropdownRef = React.useRef<HTMLDivElement>(null);

  // Statistics modal state
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Directorate rows state: default is our regional office
  const [directorates, setDirectorates] = useState<string[]>([
    'বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা'
  ]);
  const [showAll17, setShowAll17] = useState<boolean>(false);
  const [newDirectorateInput, setNewDirectorateInput] = useState<string>('');
  const [showAddDirectorate, setShowAddDirectorate] = useState<boolean>(false);

  // Manual edit mode & stored values
  const [isManualEditMode, setIsManualEditMode] = useState<boolean>(false);
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});

  // Drilldown modal for checking items from register
  const [drilldownModal, setDrilldownModal] = useState<{
    title: string;
    entries: any[];
    type: 'correspondence' | 'settlement';
    metric?: 'discussed' | 'settled' | 'held' | 'default';
  } | null>(null);

  // Load saved manual overrides and custom directorate list
  useEffect(() => {
    try {
      const savedOverrides = localStorage.getItem(STORAGE_KEY_MANUAL);
      if (savedOverrides) {
        setManualOverrides(JSON.parse(savedOverrides));
      }
      const savedDirectorates = localStorage.getItem(STORAGE_KEY_DIRECTORATES);
      if (savedDirectorates) {
        setDirectorates(JSON.parse(savedDirectorates));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveDirectoratesList = (list: string[]) => {
    setDirectorates(list);
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTORATES, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle17Directorates = () => {
    if (!showAll17) {
      setShowAll17(true);
      saveDirectoratesList(BANGLADESH_AUDIT_DIRECTORATES);
    } else {
      setShowAll17(false);
      saveDirectoratesList(['বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা']);
    }
  };

  const handleAddCustomDirectorate = () => {
    const trimmed = newDirectorateInput.trim();
    if (!trimmed) return;
    if (!directorates.includes(trimmed)) {
      const updated = [...directorates, trimmed];
      saveDirectoratesList(updated);
    }
    setNewDirectorateInput('');
    setShowAddDirectorate(false);
  };

  const handleRemoveDirectorate = (dirName: string) => {
    if (directorates.length <= 1) {
      alert('কমপক্ষে একটি অধিদপ্তর থাকতে হবে।');
      return;
    }
    const updated = directorates.filter(d => d !== dirName);
    saveDirectoratesList(updated);
  };

  const handleManualCellChange = (key: string, val: string) => {
    const num = parseInt(toEnglishDigits(val)) || 0;
    const updated = { ...manualOverrides, [key]: num };
    setManualOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MANUAL, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetManualOverrides = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সমস্ত ম্যানুয়াল সংখ্যা রিসেট করে চিঠিপত্র ও মীমাংসা রেজিস্টার হতে হিসাব দেখতে চান?')) {
      setManualOverrides({});
      localStorage.removeItem(STORAGE_KEY_MANUAL);
    }
  };

  // Compute period boundaries
  const periodStartDate = useMemo(() => {
    return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
  }, [startDate]);

  const periodEndDate = useMemo(() => {
    return new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
  }, [endDate]);

  // Display text for period
  const periodLabel = useMemo(() => {
    const sDateFormatted = toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'));
    const eDateFormatted = toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'));
    return `${sDateFormatted} হতে ${eDateFormatted} খ্রি: পর্যন্ত`;
  }, [startDate, endDate]);

  // Helper to check if an entry date falls within the period
  const isDateInPeriod = (dateVal: any): boolean => {
    if (!dateVal) return false;
    const d = parseDate(dateVal);
    if (!d) return false;
    return d >= periodStartDate && d <= periodEndDate;
  };

  // Filter correspondence entries within the period
  const periodCorrespondenceEntries = useMemo(() => {
    return correspondenceEntries.filter(entry => {
      if (filterLetterType === 'বিএসআর' && !(entry.letterType === 'বিএসআর' || (entry.letterType || '').includes('বিএসআর'))) return false;
      if (filterLetterType === 'দ্বি-পক্ষীয়' && !isBilateralLetter(entry)) return false;
      if (filterLetterType === 'ত্রি-পক্ষীয়' && !isTrilateralLetter(entry)) return false;

      const d = entry.diaryDate || entry.letterDate || entry.receiptDate || (entry.createdAt ? entry.createdAt.split('T')[0] : '');
      return isDateInPeriod(d);
    });
  }, [correspondenceEntries, periodStartDate, periodEndDate, filterLetterType]);

  // Filter settlement entries within the period
  const periodSettlementEntries = useMemo(() => {
    return settlementEntries.filter(entry => {
      const d = entry.issueDateISO || entry.meetingDate || entry.issueLetterNoDate || (entry.createdAt ? entry.createdAt.split('T')[0] : '');
      return isDateInPeriod(d);
    });
  }, [settlementEntries, periodStartDate, periodEndDate]);

  // =========================================================================
  // DATA COMPUTATION FROM REGISTERS (চিঠিপত্র রেজিস্টার ও মীমাংসা রেজিস্টার)
  // For our regional office ("বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা")
  // =========================================================================
  const officeStats = useMemo(() => {
    // 1. SFI Broadsheet Responses (চিঠিপত্র রেজিস্টার হতে)
    const sfiBroadsheetCorr = periodCorrespondenceEntries.filter(e => {
      if (!isSFI(e.paraType)) return false;
      if (isExcludedFromDhakaReturn(e.letterType)) return false;
      if (isBilateralLetter(e) || isTrilateralLetter(e)) return false;
      return true;
    });
    const sfiRecSheetCount = sfiBroadsheetCorr.length;
    const sfiRecParasCount = sfiBroadsheetCorr.reduce((sum, e) => {
      const p = parseInt(toEnglishDigits(e.totalParas || e.sentParaCount || '0')) || 0;
      return sum + p;
    }, 0);

    // SFI Actioned Broadsheet: letters where action was taken
    const sfiActedCorr = sfiBroadsheetCorr.filter(e => {
      return Boolean(e.issueLetterNo || e.issueLetterDate || e.isSettled === 'হ্যাঁ' || e.sentToDhakaDate);
    });
    const sfiActedSheetCount = sfiActedCorr.length;

    // Helper to identify meeting settlements (দ্বি-পক্ষীয় বা ত্রি-পক্ষীয় সভা)
    const isMeetingSettlementEntry = (s: any) => {
      if (s.isMeeting && s.meetingType !== 'বিএসআর') return true;
      const mType = (s.meetingType || '').trim();
      if (
        mType.includes('দ্বি') || 
        mType.includes('দ্বিপক্ষীয়') || 
        mType.includes('দ্বিপক্ষীয়') ||
        mType.includes('ত্রি') || 
        mType.includes('ত্রিপক্ষীয়') || 
        mType.includes('ত্রিপক্ষীয়') ||
        mType.includes('সভা')
      ) {
        return true;
      }
      return false;
    };

    // SFI Settled Paras (মীমাংসা রেজিস্টার হতে) - বিএসআর এর মধ্যে কোনো সভা ঢুকবে না, আংশিক অনুচ্ছেদ বাদ
    const sfiSettlements = periodSettlementEntries.filter(s => isSFI(s.paraType) && !isMeetingSettlementEntry(s));
    const sfiSettledParasCount = sfiSettlements.reduce((sum, s) => {
      let pCount = 0;
      if (Array.isArray(s.paragraphs) && s.paragraphs.length > 0) {
        // আংশিক অনুচ্ছেদ সংখ্যা কাউন্ট হবে না
        pCount = s.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
      } else if (s.meetingFullSettledParaCount) {
        pCount = parseInt(toEnglishDigits(s.meetingFullSettledParaCount)) || 0;
      } else {
        const total = parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || 0;
        const partial = parseInt(toEnglishDigits(s.meetingPartialSettledParaCount || '0')) || 0;
        pCount = Math.max(0, total - partial);
      }
      return sum + pCount;
    }, 0);

    // 2. Non-SFI Broadsheet Responses (চিঠিপত্র রেজিস্টার হতে)
    const nonSfiBroadsheetCorr = periodCorrespondenceEntries.filter(e => {
      if (!isNonSFI(e.paraType)) return false;
      if (isExcludedFromDhakaReturn(e.letterType)) return false;
      if (isBilateralLetter(e) || isTrilateralLetter(e)) return false;
      return true;
    });
    const nonSfiRecSheetCount = nonSfiBroadsheetCorr.length;
    const nonSfiRecParasCount = nonSfiBroadsheetCorr.reduce((sum, e) => {
      const p = parseInt(toEnglishDigits(e.totalParas || e.sentParaCount || '0')) || 0;
      return sum + p;
    }, 0);

    // Non-SFI Actioned Broadsheet
    const nonSfiActedCorr = nonSfiBroadsheetCorr.filter(e => {
      return Boolean(e.issueLetterNo || e.issueLetterDate || e.isSettled === 'হ্যাঁ' || e.sentToDhakaDate);
    });
    const nonSfiActedSheetCount = nonSfiActedCorr.length;

    // Non-SFI Settled Paras (মীমাংসা রেজিস্টার হতে) - বিএসআর এর মধ্যে দ্বি-সভা বা কোনো সভা ঢুকবে না, আংশিক অনুচ্ছেদ বাদ
    const nonSfiSettlements = periodSettlementEntries.filter(s => isNonSFI(s.paraType) && !isMeetingSettlementEntry(s));
    const nonSfiSettledParasCount = nonSfiSettlements.reduce((sum, s) => {
      let pCount = 0;
      if (Array.isArray(s.paragraphs) && s.paragraphs.length > 0) {
        // আংশিক অনুচ্ছেদ সংখ্যা কাউন্ট হবে না
        pCount = s.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
      } else if (s.meetingFullSettledParaCount) {
        pCount = parseInt(toEnglishDigits(s.meetingFullSettledParaCount)) || 0;
      } else {
        const total = parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || 0;
        const partial = parseInt(toEnglishDigits(s.meetingPartialSettledParaCount || '0')) || 0;
        pCount = Math.max(0, total - partial);
      }
      return sum + pCount;
    }, 0);

    // 3. Bilateral Meetings (দ্বি-পক্ষীয় সভা) - দ্বি-সভার মধ্যে বিএসআর ঢুকবে না
    const biCorr = periodCorrespondenceEntries.filter(e => isBilateralLetter(e));
    const biSettlement = periodSettlementEntries.filter(s => 
      s.isMeeting && (s.meetingType?.includes('দ্বি') || s.meetingType?.includes('দ্বিপক্ষীয়') || s.meetingType?.includes('দ্বিপক্ষীয়'))
    );

    // Filter by branch type if specific branch selected for meetings
    const filterBiCorr = biCorr.filter(e => {
      if (branchType === 'এসএফআই') return isSFI(e.paraType);
      if (branchType === 'নন এসএফআই') return isNonSFI(e.paraType);
      return true;
    });
    const filterBiSettlement = biSettlement.filter(s => {
      if (branchType === 'এসএফআই') return isSFI(s.paraType);
      if (branchType === 'নন এসএফআই') return isNonSFI(s.paraType);
      return true;
    });

    // ফিল্টার: চিঠিপত্র রেজিস্টারে যে সভার কার্যবিবরণী বা চিঠিপত্র এসেছে এবং যার প্রেক্ষিতে জারিপত্র ইস্যু করা হয়েছে,
    // মীমাংসা রেজিস্টারের সেই একই জারিপত্রকে সভার সংখ্যায় পুনরায় কাউন্ট করা যাবে না
    const biCorrIssueNos = new Set(
      filterBiCorr.map(c => extractIssueNo(c)).filter(Boolean)
    );
    const uniqueBiSettlement = filterBiSettlement.filter(s => {
      const sIssueNo = extractIssueNo(s);
      if (sIssueNo && biCorrIssueNos.has(sIssueNo)) {
        return false;
      }
      return true;
    });

    const biHeldCount = filterBiCorr.length + uniqueBiSettlement.length;
    const biDiscParasCount = filterBiCorr.reduce((acc, e) => 
      acc + (parseInt(toEnglishDigits(e.totalParas || e.meetingDiscussedParaCount || '0')) || 0), 0) +
      uniqueBiSettlement.reduce((acc, s) => 
        acc + (parseInt(toEnglishDigits(s.meetingDiscussedParaCount || '0')) || (s.paragraphs ? s.paragraphs.length : 0)), 0);

    const biActCount = uniqueBiSettlement.length + filterBiCorr.filter(c => c.issueLetterNo || c.isSettled === 'হ্যাঁ').length;
    const biSettledParasCount = filterBiSettlement.reduce((acc, s) => {
      let pCount = 0;
      if (Array.isArray(s.paragraphs) && s.paragraphs.length > 0) {
        pCount = s.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
      } else if (s.meetingFullSettledParaCount) {
        pCount = parseInt(toEnglishDigits(s.meetingFullSettledParaCount)) || 0;
      } else {
        const total = parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || 0;
        const partial = parseInt(toEnglishDigits(s.meetingPartialSettledParaCount || '0')) || 0;
        pCount = Math.max(0, total - partial);
      }
      return acc + pCount;
    }, 0);

    // 4. Trilateral Meetings (ত্রি-পক্ষীয় সভা)
    const triCorr = periodCorrespondenceEntries.filter(e => isTrilateralLetter(e));
    const triSettlement = periodSettlementEntries.filter(s => 
      s.isMeeting && (s.meetingType?.includes('ত্রি') || s.meetingType?.includes('ত্রিপক্ষীয়'))
    );

    const filterTriCorr = triCorr.filter(e => {
      if (branchType === 'এসএফআই') return isSFI(e.paraType);
      if (branchType === 'নন এসএফআই') return isNonSFI(e.paraType);
      return true;
    });
    const filterTriSettlement = triSettlement.filter(s => {
      if (branchType === 'এসএফআই') return isSFI(s.paraType);
      if (branchType === 'নন এসএফআই') return isNonSFI(s.paraType);
      return true;
    });

    const triCorrIssueNos = new Set(
      filterTriCorr.map(c => extractIssueNo(c)).filter(Boolean)
    );
    const uniqueTriSettlement = filterTriSettlement.filter(s => {
      const sIssueNo = extractIssueNo(s);
      if (sIssueNo && triCorrIssueNos.has(sIssueNo)) {
        return false;
      }
      return true;
    });

    const triHeldCount = filterTriCorr.length + uniqueTriSettlement.length;
    const triDiscParasCount = filterTriCorr.reduce((acc, e) => 
      acc + (parseInt(toEnglishDigits(e.totalParas || e.meetingDiscussedParaCount || '0')) || 0), 0) +
      uniqueTriSettlement.reduce((acc, s) => 
        acc + (parseInt(toEnglishDigits(s.meetingDiscussedParaCount || '0')) || (s.paragraphs ? s.paragraphs.length : 0)), 0);

    const triActCount = filterTriSettlement.length + filterTriCorr.filter(c => c.issueLetterNo || c.isSettled === 'হ্যাঁ').length;
    const triSettledParasCount = filterTriSettlement.reduce((acc, s) => {
      let pCount = 0;
      if (Array.isArray(s.paragraphs) && s.paragraphs.length > 0) {
        pCount = s.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
      } else if (s.meetingFullSettledParaCount) {
        pCount = parseInt(toEnglishDigits(s.meetingFullSettledParaCount)) || 0;
      } else {
        const total = parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || 0;
        const partial = parseInt(toEnglishDigits(s.meetingPartialSettledParaCount || '0')) || 0;
        pCount = Math.max(0, total - partial);
      }
      return acc + pCount;
    }, 0);

    return {
      sfi: {
        recSheet: sfiRecSheetCount,
        recParas: sfiRecParasCount,
        actedSheet: sfiActedSheetCount,
        settledParas: sfiSettledParasCount,
        rawCorr: sfiBroadsheetCorr,
        rawSettlements: sfiSettlements
      },
      nonSfi: {
        recSheet: nonSfiRecSheetCount,
        recParas: nonSfiRecParasCount,
        actedSheet: nonSfiActedSheetCount,
        settledParas: nonSfiSettledParasCount,
        rawCorr: nonSfiBroadsheetCorr,
        rawSettlements: nonSfiSettlements
      },
      meetings: {
        biHeld: biHeldCount,
        biDisc: biDiscParasCount,
        biAct: biActCount,
        biSet: biSettledParasCount,
        triHeld: triHeldCount,
        triDisc: triDiscParasCount,
        triAct: triActCount,
        triSet: triSettledParasCount,
        rawBiCorr: filterBiCorr,
        rawBiSettlements: filterBiSettlement,
        rawTriCorr: filterTriCorr,
        rawTriSettlements: filterTriSettlement
      }
    };
  }, [periodCorrespondenceEntries, periodSettlementEntries, branchType]);

  // Helper to deduplicate meeting entries between correspondence and settlement registers
  const getUniqueMeetingEntries = (corrList: any[], settlementList: any[]) => {
    const knownKeys = new Set<string>();
    const result: any[] = [];

    corrList.forEach(item => {
      const issueNo = extractIssueNo(item);
      const letNo = String(item.letterNo || '').trim();
      const diaryNo = String(item.diaryNo || item.diaryNumber || '').trim();
      
      if (issueNo) knownKeys.add(`issue_${issueNo}`);
      if (letNo) knownKeys.add(`let_${letNo}`);
      if (diaryNo) knownKeys.add(`diary_${diaryNo}`);
      result.push(item);
    });

    settlementList.forEach(item => {
      const issueNo = extractIssueNo(item);
      if (issueNo && knownKeys.has(`issue_${issueNo}`)) {
        return; // Skip duplicate settlement entry since correspondence entry already covers this
      }
      result.push(item);
    });

    return result;
  };

  // Compute table rows for each directorate
  // If directorate is our office, use auto values from register, else 0 (unless manually overridden)
  const computedDirectorateRows = useMemo(() => {
    return directorates.map(directorateName => {
      const isOurOffice = directorateName.includes('বাণিজ্যিক অডিট') || directorateName.includes('খুলনা');

      // Check branch type conditions:
      // When branchType === 'নন এসএফআই', SFI columns are filled with 0
      // When branchType === 'এসএফআই', Non-SFI columns are filled with 0
      // When branchType === 'সকল', both are filled!
      const shouldFillSFI = branchType === 'সকল' || branchType === 'এসএফআই';
      const shouldFillNonSFI = branchType === 'সকল' || branchType === 'নন এসএফআই';

      // SFI values
      const kSfiRecSheet = `sfi_${directorateName}_recSheet`;
      const kSfiRecParas = `sfi_${directorateName}_recParas`;
      const kSfiActedSheet = `sfi_${directorateName}_actedSheet`;
      const kSfiSettledParas = `sfi_${directorateName}_settledParas`;

      const autoSfiRecSheet = isOurOffice && shouldFillSFI ? officeStats.sfi.recSheet : 0;
      const autoSfiRecParas = isOurOffice && shouldFillSFI ? officeStats.sfi.recParas : 0;
      const autoSfiActedSheet = isOurOffice && shouldFillSFI ? officeStats.sfi.actedSheet : 0;
      const autoSfiSettledParas = isOurOffice && shouldFillSFI ? officeStats.sfi.settledParas : 0;

      const sfiRecSheet = manualOverrides[kSfiRecSheet] !== undefined ? manualOverrides[kSfiRecSheet] : autoSfiRecSheet;
      const sfiRecParas = manualOverrides[kSfiRecParas] !== undefined ? manualOverrides[kSfiRecParas] : autoSfiRecParas;
      const sfiActedSheet = manualOverrides[kSfiActedSheet] !== undefined ? manualOverrides[kSfiActedSheet] : autoSfiActedSheet;
      const sfiSettledParas = manualOverrides[kSfiSettledParas] !== undefined ? manualOverrides[kSfiSettledParas] : autoSfiSettledParas;

      // Non-SFI values
      const kNonSfiRecSheet = `nonsfi_${directorateName}_recSheet`;
      const kNonSfiRecParas = `nonsfi_${directorateName}_recParas`;
      const kNonSfiActedSheet = `nonsfi_${directorateName}_actedSheet`;
      const kNonSfiSettledParas = `nonsfi_${directorateName}_settledParas`;

      const autoNonSfiRecSheet = isOurOffice && shouldFillNonSFI ? officeStats.nonSfi.recSheet : 0;
      const autoNonSfiRecParas = isOurOffice && shouldFillNonSFI ? officeStats.nonSfi.recParas : 0;
      const autoNonSfiActedSheet = isOurOffice && shouldFillNonSFI ? officeStats.nonSfi.actedSheet : 0;
      const autoNonSfiSettledParas = isOurOffice && shouldFillNonSFI ? officeStats.nonSfi.settledParas : 0;

      const nonSfiRecSheet = manualOverrides[kNonSfiRecSheet] !== undefined ? manualOverrides[kNonSfiRecSheet] : autoNonSfiRecSheet;
      const nonSfiRecParas = manualOverrides[kNonSfiRecParas] !== undefined ? manualOverrides[kNonSfiRecParas] : autoNonSfiRecParas;
      const nonSfiActedSheet = manualOverrides[kNonSfiActedSheet] !== undefined ? manualOverrides[kNonSfiActedSheet] : autoNonSfiActedSheet;
      const nonSfiSettledParas = manualOverrides[kNonSfiSettledParas] !== undefined ? manualOverrides[kNonSfiSettledParas] : autoNonSfiSettledParas;

      // Meetings values
      const kBiHeld = `meet_${directorateName}_biHeld`;
      const kBiDisc = `meet_${directorateName}_biDisc`;
      const kBiAct = `meet_${directorateName}_biAct`;
      const kBiSet = `meet_${directorateName}_biSet`;

      const kTriHeld = `meet_${directorateName}_triHeld`;
      const kTriDisc = `meet_${directorateName}_triDisc`;
      const kTriAct = `meet_${directorateName}_triAct`;
      const kTriSet = `meet_${directorateName}_triSet`;

      const autoBiHeld = isOurOffice ? officeStats.meetings.biHeld : 0;
      const autoBiDisc = isOurOffice ? officeStats.meetings.biDisc : 0;
      const autoBiAct = isOurOffice ? officeStats.meetings.biAct : 0;
      const autoBiSet = isOurOffice ? officeStats.meetings.biSet : 0;

      const autoTriHeld = isOurOffice ? officeStats.meetings.triHeld : 0;
      const autoTriDisc = isOurOffice ? officeStats.meetings.triDisc : 0;
      const autoTriAct = isOurOffice ? officeStats.meetings.triAct : 0;
      const autoTriSet = isOurOffice ? officeStats.meetings.triSet : 0;

      const biHeld = manualOverrides[kBiHeld] !== undefined ? manualOverrides[kBiHeld] : autoBiHeld;
      const biDisc = manualOverrides[kBiDisc] !== undefined ? manualOverrides[kBiDisc] : autoBiDisc;
      const biAct = manualOverrides[kBiAct] !== undefined ? manualOverrides[kBiAct] : autoBiAct;
      const biSet = manualOverrides[kBiSet] !== undefined ? manualOverrides[kBiSet] : autoBiSet;

      const triHeld = manualOverrides[kTriHeld] !== undefined ? manualOverrides[kTriHeld] : autoTriHeld;
      const triDisc = manualOverrides[kTriDisc] !== undefined ? manualOverrides[kTriDisc] : autoTriDisc;
      const triAct = manualOverrides[kTriAct] !== undefined ? manualOverrides[kTriAct] : autoTriAct;
      const triSet = manualOverrides[kTriSet] !== undefined ? manualOverrides[kTriSet] : autoTriSet;

      return {
        directorateName,
        isOurOffice,
        sfi: {
          recSheet: sfiRecSheet,
          recParas: sfiRecParas,
          actedSheet: sfiActedSheet,
          settledParas: sfiSettledParas,
          keys: { kSfiRecSheet, kSfiRecParas, kSfiActedSheet, kSfiSettledParas }
        },
        nonSfi: {
          recSheet: nonSfiRecSheet,
          recParas: nonSfiRecParas,
          actedSheet: nonSfiActedSheet,
          settledParas: nonSfiSettledParas,
          keys: { kNonSfiRecSheet, kNonSfiRecParas, kNonSfiActedSheet, kNonSfiSettledParas }
        },
        meetings: {
          biHeld,
          biDisc,
          biAct,
          biSet,
          triHeld,
          triDisc,
          triAct,
          triSet,
          keys: { kBiHeld, kBiDisc, kBiAct, kBiSet, kTriHeld, kTriDisc, kTriAct, kTriSet }
        }
      };
    });
  }, [directorates, officeStats, branchType, manualOverrides]);

  // Totals for all tables
  const totals = useMemo(() => {
    return computedDirectorateRows.reduce(
      (acc, r) => ({
        sfi: {
          recSheet: acc.sfi.recSheet + r.sfi.recSheet,
          recParas: acc.sfi.recParas + r.sfi.recParas,
          actedSheet: acc.sfi.actedSheet + r.sfi.actedSheet,
          settledParas: acc.sfi.settledParas + r.sfi.settledParas
        },
        nonSfi: {
          recSheet: acc.nonSfi.recSheet + r.nonSfi.recSheet,
          recParas: acc.nonSfi.recParas + r.nonSfi.recParas,
          actedSheet: acc.nonSfi.actedSheet + r.nonSfi.actedSheet,
          settledParas: acc.nonSfi.settledParas + r.nonSfi.settledParas
        },
        meetings: {
          biHeld: acc.meetings.biHeld + r.meetings.biHeld,
          biDisc: acc.meetings.biDisc + r.meetings.biDisc,
          biAct: acc.meetings.biAct + r.meetings.biAct,
          biSet: acc.meetings.biSet + r.meetings.biSet,
          triHeld: acc.meetings.triHeld + r.meetings.triHeld,
          triDisc: acc.meetings.triDisc + r.meetings.triDisc,
          triAct: acc.meetings.triAct + r.meetings.triAct,
          triSet: acc.meetings.triSet + r.meetings.triSet
        }
      }),
      {
        sfi: { recSheet: 0, recParas: 0, actedSheet: 0, settledParas: 0 },
        nonSfi: { recSheet: 0, recParas: 0, actedSheet: 0, settledParas: 0 },
        meetings: { biHeld: 0, biDisc: 0, biAct: 0, biSet: 0, triHeld: 0, triDisc: 0, triAct: 0, triSet: 0 }
      }
    );
  }, [computedDirectorateRows]);

  // Excel export generating real OpenXML .xlsx file
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Master Sheet Rows
      const masterRows: any[][] = [];

      // Office Header
      masterRows.push([OFFICE_HEADER.main]);
      masterRows.push([`${OFFICE_HEADER.sub}, ${OFFICE_HEADER.address}`]);
      masterRows.push([`চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ-২ (${periodLabel}) [শাখার ধরন: ${branchType}]`]);
      masterRows.push([]); // blank row

      // Table (ক) SFI
      masterRows.push([`(ক) SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম (${periodLabel})`]);
      masterRows.push([
        'অধিদপ্তরের নাম',
        'প্রাপ্ত ব্রড শীট জবাবের সংখ্যা',
        'অনুচ্ছেদের সংখ্যা',
        'গৃহীত কার্যক্রম: ব্রড শীট জবাবের সংখ্যা',
        'গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা'
      ]);

      computedDirectorateRows.forEach(r => {
        masterRows.push([
          r.directorateName,
          toBengaliDigits(r.sfi.recSheet),
          toBengaliDigits(r.sfi.recParas),
          toBengaliDigits(r.sfi.actedSheet),
          toBengaliDigits(r.sfi.settledParas)
        ]);
      });

      masterRows.push([
        'মোট',
        toBengaliDigits(totals.sfi.recSheet),
        toBengaliDigits(totals.sfi.recParas),
        toBengaliDigits(totals.sfi.actedSheet),
        toBengaliDigits(totals.sfi.settledParas)
      ]);
      masterRows.push([]); // blank separator

      // Table (খ) Non-SFI
      masterRows.push([`(খ) Non-SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম (${periodLabel})`]);
      masterRows.push([
        'অধিদপ্তরের নাম',
        'প্রাপ্ত ব্রড শীট জবাবের সংখ্যা',
        'অনুচ্ছেদের সংখ্যা',
        'গৃহীত কার্যক্রম: ব্রড শীট জবাবের সংখ্যা',
        'গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা'
      ]);

      computedDirectorateRows.forEach(r => {
        masterRows.push([
          r.directorateName,
          toBengaliDigits(r.nonSfi.recSheet),
          toBengaliDigits(r.nonSfi.recParas),
          toBengaliDigits(r.nonSfi.actedSheet),
          toBengaliDigits(r.nonSfi.settledParas)
        ]);
      });

      masterRows.push([
        'মোট',
        toBengaliDigits(totals.nonSfi.recSheet),
        toBengaliDigits(totals.nonSfi.recParas),
        toBengaliDigits(totals.nonSfi.actedSheet),
        toBengaliDigits(totals.nonSfi.settledParas)
      ]);
      masterRows.push([]); // blank separator

      // Table (গ) Meetings
      masterRows.push([`(গ) দ্বি-পক্ষীয় ও ত্রি-পক্ষীয় সভার উপর গৃহীত কার্যক্রম (${periodLabel})`]);
      
      const meetHeaderRow = ['অধিদপ্তরের নাম'];
      if (showNonSfi) {
        meetHeaderRow.push(
          'দ্বিপক্ষীয় সভার সংখ্যা',
          'দ্বিপক্ষীয় আলোচিত অনুচ্ছেদ',
          'দ্বিপক্ষীয় পত্র জারী',
          'দ্বিপক্ষীয় নিষ্পত্তিকৃত অনুচ্ছেদ'
        );
      }
      if (showSfi) {
        meetHeaderRow.push(
          'ত্রিপক্ষীয় সভার সংখ্যা',
          'ত্রিপক্ষীয় আলোচিত অনুচ্ছেদ',
          'ত্রিপক্ষীয় পত্র জারী',
          'ত্রিপক্ষীয় নিষ্পত্তিকৃত অনুচ্ছেদ'
        );
      }
      masterRows.push(meetHeaderRow);

      computedDirectorateRows.forEach(r => {
        const rowData = [r.directorateName];
        if (showNonSfi) {
          rowData.push(
            toBengaliDigits(r.meetings.biHeld),
            toBengaliDigits(r.meetings.biDisc),
            toBengaliDigits(r.meetings.biAct),
            toBengaliDigits(r.meetings.biSet)
          );
        }
        if (showSfi) {
          rowData.push(
            toBengaliDigits(r.meetings.triHeld),
            toBengaliDigits(r.meetings.triDisc),
            toBengaliDigits(r.meetings.triAct),
            toBengaliDigits(r.meetings.triSet)
          );
        }
        masterRows.push(rowData);
      });

      const meetTotalRow = ['মোট'];
      if (showNonSfi) {
        meetTotalRow.push(
          toBengaliDigits(totals.meetings.biHeld),
          toBengaliDigits(totals.meetings.biDisc),
          toBengaliDigits(totals.meetings.biAct),
          toBengaliDigits(totals.meetings.biSet)
        );
      }
      if (showSfi) {
        meetTotalRow.push(
          toBengaliDigits(totals.meetings.triHeld),
          toBengaliDigits(totals.meetings.triDisc),
          toBengaliDigits(totals.meetings.triAct),
          toBengaliDigits(totals.meetings.triSet)
        );
      }
      masterRows.push(meetTotalRow);

      const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
      wsMaster['!cols'] = [
        { wch: 45 },
        { wch: 24 },
        { wch: 24 },
        { wch: 26 },
        { wch: 28 },
        { wch: 24 },
        { wch: 24 },
        { wch: 26 },
        { wch: 28 }
      ];

      XLSX.utils.book_append_sheet(wb, wsMaster, 'ঢাকা রিটার্ন-২ (সকল)');

      // Sheet 2: SFI Table
      const sfiRows = [
        [OFFICE_HEADER.main],
        [`(ক) SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম (${periodLabel})`],
        ['অধিদপ্তরের নাম', 'প্রাপ্ত ব্রড শীট জবাবের সংখ্যা', 'অনুচ্ছেদের সংখ্যা', 'গৃহীত কার্যক্রম: ব্রড শীট জবাবের সংখ্যা', 'গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা'],
        ...computedDirectorateRows.map(r => [
          r.directorateName,
          toBengaliDigits(r.sfi.recSheet),
          toBengaliDigits(r.sfi.recParas),
          toBengaliDigits(r.sfi.actedSheet),
          toBengaliDigits(r.sfi.settledParas)
        ]),
        ['মোট', toBengaliDigits(totals.sfi.recSheet), toBengaliDigits(totals.sfi.recParas), toBengaliDigits(totals.sfi.actedSheet), toBengaliDigits(totals.sfi.settledParas)]
      ];
      const wsSfi = XLSX.utils.aoa_to_sheet(sfiRows);
      wsSfi['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 28 }];
      XLSX.utils.book_append_sheet(wb, wsSfi, 'ক - SFI ব্রডশীট');

      // Sheet 3: Non-SFI Table
      const nonSfiRows = [
        [OFFICE_HEADER.main],
        [`(খ) Non-SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম (${periodLabel})`],
        ['অধিদপ্তরের নাম', 'প্রাপ্ত ব্রড শীট জবাবের সংখ্যা', 'অনুচ্ছেদের সংখ্যা', 'গৃহীত কার্যক্রম: ব্রড শীট জবাবের সংখ্যা', 'গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা'],
        ...computedDirectorateRows.map(r => [
          r.directorateName,
          toBengaliDigits(r.nonSfi.recSheet),
          toBengaliDigits(r.nonSfi.recParas),
          toBengaliDigits(r.nonSfi.actedSheet),
          toBengaliDigits(r.nonSfi.settledParas)
        ]),
        ['মোট', toBengaliDigits(totals.nonSfi.recSheet), toBengaliDigits(totals.nonSfi.recParas), toBengaliDigits(totals.nonSfi.actedSheet), toBengaliDigits(totals.nonSfi.settledParas)]
      ];
      const wsNonSfi = XLSX.utils.aoa_to_sheet(nonSfiRows);
      wsNonSfi['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 28 }];
      XLSX.utils.book_append_sheet(wb, wsNonSfi, 'খ - Non-SFI ব্রডশীট');

      // Sheet 4: Meetings Table
      const meetRows = [
        [OFFICE_HEADER.main],
        [`(গ) দ্বি-পক্ষীয় ও ত্রি-পক্ষীয় সভার উপর গৃহীত কার্যক্রম (${periodLabel})`],
        meetHeaderRow,
        ...computedDirectorateRows.map(r => {
          const rowData = [r.directorateName];
          if (showNonSfi) {
            rowData.push(
              toBengaliDigits(r.meetings.biHeld),
              toBengaliDigits(r.meetings.biDisc),
              toBengaliDigits(r.meetings.biAct),
              toBengaliDigits(r.meetings.biSet)
            );
          }
          if (showSfi) {
            rowData.push(
              toBengaliDigits(r.meetings.triHeld),
              toBengaliDigits(r.meetings.triDisc),
              toBengaliDigits(r.meetings.triAct),
              toBengaliDigits(r.meetings.triSet)
            );
          }
          return rowData;
        }),
        meetTotalRow
      ];
      const wsMeet = XLSX.utils.aoa_to_sheet(meetRows);
      wsMeet['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, wsMeet, 'গ - সভার কার্যক্রম');

      // Trigger automatic download of .xlsx file
      const fileName = `চিঠিপত্র_মাসিক_রিটার্ন_ঢাকায়_প্রেরণ_২_${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('এক্সেল ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const showSfi = branchType === 'সকল' || branchType === 'এসএফআই';
  const showNonSfi = branchType === 'সকল' || branchType === 'নন এসএফআই';

  return (
    <div id="dhaka-return-2-root" className="min-h-screen bg-white text-slate-900 w-full max-w-full overflow-x-hidden p-2 sm:p-4 md:p-6 space-y-5">
      <IDBadge id="dhaka-return-2-root" />

      {/* Landscape Print CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 8mm 10mm !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #dhaka-return-2-print-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          table {
            page-break-inside: avoid !important;
            width: 100% !important;
          }
        }
      `}} />

      {/* Control Header & Filters - Image 1 Design */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm no-print mb-4 w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Back Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSelectedReportType(null)}
            className="p-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-all border border-slate-300 shadow-sm flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
            title="ফিরে যান"
          >
            <ChevronLeft size={16} />
            <span>ফিরে যান</span>
          </button>
        </div>

        {/* Right/Middle: Group of Compact Controls matching Image 1 */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5 sm:gap-2.5 w-full md:w-auto">
          {/* 1. Reporting Period Date Range Picker */}
          <div className="relative shrink-0 select-none z-[400]" ref={calendarRef}>
            <div 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="relative inline-flex items-center gap-2 px-3 h-[38px] bg-slate-50 border border-slate-300 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-50 transition-all text-slate-800 rounded-xl text-[11px] sm:text-[11.5px] font-bold shadow-sm cursor-pointer"
            >
              <span className="text-slate-500 leading-none">রিপোর্টিং সময়কাল:</span> 
              <span className="text-slate-800 flex items-center gap-1 font-black leading-none">
                {toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))} হতে {toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))}
                <Calendar size={13} className="text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
              </span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isCalendarOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </div>

            {isCalendarOpen && (
              <div className="absolute top-[110%] left-0 sm:left-auto sm:right-0 w-[330px] sm:w-[360px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header & Close */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <Calendar size={14} className="text-emerald-600" />
                    <span>সময়কাল নির্ধারণ করুন</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Start & End Date Selection Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div 
                    onClick={() => {
                      setSelectingDateType('start');
                      setCurrentViewDate(new Date(startDate));
                    }}
                    className={`relative p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectingDateType === 'start'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] font-bold text-slate-500">শুরুর তারিখ</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-extrabold text-xs text-slate-800">
                        {toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))}
                      </span>
                      <div className="relative">
                        <input 
                          type="date"
                          value={dateFnsFormat(startDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split('-').map(Number);
                              const newD = new Date(y, m - 1, d);
                              setStartDate(newD);
                              if (newD > endDate) setEndDate(newD);
                              setCurrentViewDate(newD);
                            }
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          title="শুরুর তারিখ পরিবর্তন করুন"
                        />
                        <Calendar size={13} className="text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setSelectingDateType('end');
                      setCurrentViewDate(new Date(endDate));
                    }}
                    className={`relative p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectingDateType === 'end'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] font-bold text-slate-500">শেষের তারিখ</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-extrabold text-xs text-slate-800">
                        {toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))}
                      </span>
                      <div className="relative">
                        <input 
                          type="date"
                          value={dateFnsFormat(endDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split('-').map(Number);
                              const newD = new Date(y, m - 1, d);
                              setEndDate(newD);
                              if (newD < startDate) setStartDate(newD);
                              setCurrentViewDate(newD);
                            }
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          title="শেষের তারিখ পরিবর্তন করুন"
                        />
                        <Calendar size={13} className="text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const s = new Date(2026, 0, 1);
                      const e = new Date(2026, 7, 31);
                      setStartDate(s);
                      setEndDate(e);
                      setCurrentViewDate(new Date(2026, 7, 1));
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    ০১/০১/২০২৬ - ৩১/০৮/২০২৬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = new Date(now.getFullYear(), 0, 1);
                      setStartDate(s);
                      setEndDate(now);
                      setCurrentViewDate(now);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    চলতি বছর
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = new Date(now.getFullYear(), now.getMonth(), 1);
                      setStartDate(s);
                      setEndDate(now);
                      setCurrentViewDate(now);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    চলতি মাস
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const e = new Date(now.getFullYear(), now.getMonth(), 0);
                      setStartDate(s);
                      setEndDate(e);
                      setCurrentViewDate(s);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    বিগত মাস
                  </button>
                </div>

                {/* Calendar Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                    type="button"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="font-extrabold text-[13px] text-slate-800">
                    {BENGALI_MONTHS[currentViewDate.getMonth()]} {toBengaliDigits(currentViewDate.getFullYear().toString())}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                    type="button"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Calendar Week Days */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {BENGALI_WEEKDAYS.map((wd, i) => (
                    <span key={i} className="text-[10px] font-black text-slate-400">
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const Y = currentViewDate.getFullYear();
                    const M = currentViewDate.getMonth();
                    const firstDayIdx = (new Date(Y, M, 1).getDay() + 1) % 7; // Saturday as 0
                    const daysInMonth = new Date(Y, M + 1, 0).getDate();
                    const prevMonthDays = new Date(Y, M, 0).getDate();

                    const cells = [];
                    for (let i = firstDayIdx - 1; i >= 0; i--) {
                      cells.push({ day: prevMonthDays - i, isCurrentMonth: false, dateObj: new Date(Y, M - 1, prevMonthDays - i) });
                    }
                    for (let d = 1; d <= daysInMonth; d++) {
                      cells.push({ day: d, isCurrentMonth: true, dateObj: new Date(Y, M, d) });
                    }
                    const remaining = 42 - cells.length;
                    for (let d = 1; d <= remaining; d++) {
                      cells.push({ day: d, isCurrentMonth: false, dateObj: new Date(Y, M + 1, d) });
                    }

                    const startStr = dateFnsFormat(startDate, 'yyyy-MM-dd');
                    const endStr = dateFnsFormat(endDate, 'yyyy-MM-dd');

                    return cells.map((cell, idx) => {
                      const dateStr = dateFnsFormat(cell.dateObj, 'yyyy-MM-dd');
                      const isStart = dateStr === startStr;
                      const isEnd = dateStr === endStr;
                      const isInRange = dateStr > startStr && dateStr < endStr;

                      let cellCls = "text-[11.5px] font-bold h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ";
                      if (isStart || isEnd) {
                        cellCls += "bg-emerald-600 text-white font-black shadow-sm ";
                      } else if (isInRange) {
                        cellCls += "bg-emerald-100/70 text-emerald-900 font-bold rounded-none ";
                      } else if (cell.isCurrentMonth) {
                        cellCls += "text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 ";
                      } else {
                        cellCls += "text-slate-400 hover:bg-slate-50 ";
                      }

                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectingDateType === 'start') {
                              if (cell.dateObj > endDate) {
                                setStartDate(cell.dateObj);
                                setEndDate(cell.dateObj);
                                setSelectingDateType('end');
                              } else {
                                setStartDate(cell.dateObj);
                                setSelectingDateType('end');
                              }
                            } else {
                              if (cell.dateObj < startDate) {
                                setStartDate(cell.dateObj);
                                setSelectingDateType('end');
                              } else {
                                setEndDate(cell.dateObj);
                                setSelectingDateType('start');
                              }
                            }
                          }}
                          className={cellCls}
                        >
                          <span>{toBengaliDigits(cell.day.toString())}</span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Footer Apply */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                  <div className="text-[10.5px] text-slate-600 font-bold truncate max-w-[200px]">
                    সীমা: <span className="text-emerald-700 font-extrabold">{toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))} - {toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    প্রয়োগ করুন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Branch Filter Dropdown (সকল শাখা) */}
          <div className="relative shrink-0 no-print" ref={branchDropdownRef}>
            <div 
              onClick={() => {
                setIsBranchDropdownOpen(!isBranchDropdownOpen);
                setIsTypeDropdownOpen(false);
                setIsCalendarOpen(false);
              }}
              className={`relative flex items-center gap-1.5 px-3 h-[38px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 shadow-sm min-w-[105px] sm:min-w-[120px] ${isBranchDropdownOpen ? 'border-emerald-600 ring-2 ring-emerald-50 bg-white' : 'border-slate-300 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-50'}`}
            >
              <LayoutGrid size={13} className="text-emerald-600 shrink-0" />
              <span className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-800 break-words leading-none">
                {branchType === 'সকল' ? 'সকল শাখা' : branchType}
              </span>
              <ChevronDown size={11} className={`text-slate-400 ml-auto transition-transform duration-300 shrink-0 ${isBranchDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </div>
            
            {isBranchDropdownOpen && (
              <div className="absolute top-full left-0 w-full min-w-[130px] pt-1 z-[2000]">
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                  {[
                    { label: 'সকল শাখা', val: 'সকল' },
                    { label: 'এসএফআই', val: 'এসএফআই' },
                    { label: 'নন এসএফআই', val: 'নন এসএফআই' }
                  ].map((opt, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setBranchType(opt.val as any);
                        setIsBranchDropdownOpen(false);
                      }} 
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${branchType === opt.val ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[11.5px]'}`}
                    >
                      <span>{opt.label}</span>
                      {branchType === opt.val && <Check size={12} strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Type Filter Dropdown (চিঠির ধরন) */}
          <div className="relative shrink-0 no-print" ref={typeDropdownRef}>
            <div 
              onClick={() => {
                setIsTypeDropdownOpen(!isTypeDropdownOpen);
                setIsBranchDropdownOpen(false);
                setIsCalendarOpen(false);
              }}
              className={`relative flex items-center gap-1.5 px-3 h-[38px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 shadow-sm min-w-[110px] sm:min-w-[125px] ${isTypeDropdownOpen ? 'border-emerald-600 ring-2 ring-emerald-50 bg-white' : 'border-slate-300 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-50'}`}
            >
              <FileText size={13} className="text-emerald-600 shrink-0" />
              <span className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-800 break-words leading-none">
                {filterLetterType === 'সকল' ? 'চিঠির ধরন' : filterLetterType}
              </span>
              <ChevronDown size={11} className={`text-slate-400 ml-auto transition-transform duration-300 shrink-0 ${isTypeDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </div>
            
            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 w-full min-w-[140px] pt-1 z-[2000]">
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                  {['সকল', 'বিএসআর', 'দ্বি-পক্ষীয়', 'ত্রি-পক্ষীয়', 'অন্যান্য'].map((opt, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setFilterLetterType(opt);
                        setIsTypeDropdownOpen(false);
                      }} 
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${filterLetterType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[11.5px]'}`}
                    >
                      <span>{opt === 'সকল' ? 'চিঠির ধরন (সকল)' : opt}</span>
                      {filterLetterType === opt && <Check size={12} strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Excel Download Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center w-10 h-[38px] bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0 no-print"
            title="এক্সেলে ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} className="stroke-[2.5]" />
          </button>

          {/* 5. Statistics Trigger Button */}
          <button 
            onClick={() => setShowStatsModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 h-[38px] bg-slate-50 border border-slate-300 rounded-xl cursor-pointer transition-all duration-300 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-50 shadow-sm text-slate-800 text-[11px] sm:text-[11.5px] font-black shrink-0 no-print"
          >
            <BarChart3 size={13} className="text-emerald-600 shrink-0" />
            <span className="leading-none">পরিসংখ্যান</span>
          </button>
        </div>

        {isManualEditMode && (
          <div className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span><strong>ম্যানুয়াল এডিট মোড সক্রিয়:</strong> যেকোনো সেলে সরাসরি সংখ্যা টাইপ করে পরিবর্তন করতে পারবেন। মান স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।</span>
            </div>
            <button 
              onClick={() => setIsManualEditMode(false)}
              className="text-amber-700 hover:text-amber-900 underline font-bold cursor-pointer"
            >
              সম্পন্ন করুন
            </button>
          </div>
        )}
      </div>

      {/* Table Dedicated Horizontal Scroll Container: Only this table scrolls horizontally on mobile/desktop */}
      <div className="w-full max-w-full overflow-x-auto rounded-xl shadow-sm border border-slate-200 bg-white">
        <div 
          id="dhaka-return-2-print-container" 
          className="bg-white text-slate-900 rounded-xl p-4 sm:p-6 md:p-8 shadow-none border-none space-y-8 font-serif select-text"
          style={{ color: '#000000', minWidth: '980px' }}
        >
        {/* Official Header */}
        <div className="text-center space-y-1 pb-4 border-b border-slate-300">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-serif">
            {OFFICE_HEADER.main}
          </h2>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800">
            {OFFICE_HEADER.sub}, {OFFICE_HEADER.address}
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 pt-1">
            চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ-২ ({periodLabel})
          </p>
          {branchType !== 'সকল' && (
            <p className="text-xs font-bold text-slate-600">
              [ শাখার ধরন: {branchType} ]
            </p>
          )}
        </div>

        {/* ========================================================= */}
        {/* TABLE (ক) : SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম           */}
        {/* ========================================================= */}
        {showSfi && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                (ক) SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম ({periodLabel}):
              </h4>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs sm:text-sm table-fixed">
              <colgroup>
                <col className="w-[18.6%]" />
                <col className="w-[20.35%]" />
                <col className="w-[20.35%]" />
                <col className="w-[20.35%]" />
                <col className="w-[20.35%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th rowSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    অধিদপ্তরের নাম
                  </th>
                  <th colSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    প্রাপ্ত ব্রড শীট জবাবের উপর গৃহীত কার্যক্রম ({periodLabel})
                  </th>
                  <th colSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    গৃহীত কার্যক্রম
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900">
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    প্রাপ্ত ব্রড শীট জবাবের সংখ্যা
                  </th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    অনুচ্ছেদের সংখ্যা
                  </th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    ব্রড শীট জবাবের সংখ্যা
                  </th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা
                  </th>
                </tr>
              </thead>
              <tbody>
                {computedDirectorateRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="border border-black px-3 py-1.5 font-bold text-slate-900 text-left">
                      <div className="flex items-center justify-between">
                        <span>{row.directorateName}</span>
                        {directorates.length > 1 && (
                          <button
                            onClick={() => handleRemoveDirectorate(row.directorateName)}
                            className="text-rose-500 hover:text-rose-700 p-1 opacity-0 hover:opacity-100 no-print"
                            title="সারিটি মুছুন"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 1. প্রাপ্ত ব্রড শীট জবাবের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.sfi.recSheet || ''}
                          onChange={(e) => handleManualCellChange(row.sfi.keys.kSfiRecSheet, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        row.isOurOffice && row.sfi.recSheet > 0 ? (
                          <button
                            onClick={() => setDrilldownModal({
                              title: `${row.directorateName} - SFI প্রাপ্ত ব্রডশীট জবাব (চিঠিপত্র রেজিস্টার)`,
                              entries: officeStats.sfi.rawCorr,
                              type: 'correspondence'
                            })}
                            className="hover:underline cursor-pointer font-black text-blue-900"
                            title="চিঠিপত্র রেজিস্টার হতে বিস্তারিত দেখুন"
                          >
                            {toBengaliDigits(row.sfi.recSheet)}
                          </button>
                        ) : (
                          <span>{toBengaliDigits(row.sfi.recSheet)}</span>
                        )
                      )}
                    </td>

                    {/* 2. অনুচ্ছেদের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.sfi.recParas || ''}
                          onChange={(e) => handleManualCellChange(row.sfi.keys.kSfiRecParas, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        <span className={row.sfi.recParas > 0 ? 'font-bold text-slate-900' : 'text-slate-700'}>
                          {toBengaliDigits(row.sfi.recParas)}
                        </span>
                      )}
                    </td>

                    {/* 3. গৃহীত কার্যক্রম: ব্রড শীট জবাবের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.sfi.actedSheet || ''}
                          onChange={(e) => handleManualCellChange(row.sfi.keys.kSfiActedSheet, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        <span className={row.sfi.actedSheet > 0 ? 'font-bold text-emerald-900' : 'text-slate-700'}>
                          {toBengaliDigits(row.sfi.actedSheet)}
                        </span>
                      )}
                    </td>

                    {/* 4. গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.sfi.settledParas || ''}
                          onChange={(e) => handleManualCellChange(row.sfi.keys.kSfiSettledParas, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        row.isOurOffice && row.sfi.settledParas > 0 ? (
                          <button
                            onClick={() => setDrilldownModal({
                              title: `${row.directorateName} - SFI নিষ্পত্তিকৃত অনুচ্ছেদ (মীমাংসা রেজিস্টার)`,
                              entries: officeStats.sfi.rawSettlements,
                              type: 'settlement'
                            })}
                            className="hover:underline cursor-pointer font-black text-emerald-900"
                            title="মীমাংসা রেজিস্টার হতে বিস্তারিত দেখুন"
                          >
                            {toBengaliDigits(row.sfi.settledParas)}
                          </button>
                        ) : (
                          <span>{toBengaliDigits(row.sfi.settledParas)}</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}

                {/* মোট Row */}
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-black">
                  <td className="border border-black px-3 py-2 text-center font-black text-sm">
                    মোট
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.sfi.recSheet)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.sfi.recParas)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.sfi.actedSheet)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.sfi.settledParas)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* ========================================================= */}
        {/* TABLE (খ) : Non-SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম       */}
        {/* ========================================================= */}
        {showNonSfi && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                {branchType === 'নন এসএফআই' ? '(ক)' : '(খ)'} Non-SFI ব্রডশীট জবাবের উপর গৃহীত কার্যক্রম ({periodLabel}):
              </h4>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs sm:text-sm table-fixed">
              <colgroup>
                <col className="w-[18.6%]" />
                <col className="w-[20.35%]" />
                <col className="w-[20.35%]" />
                <col className="w-[20.35%]" />
                <col className="w-[20.35%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th rowSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    অধিদপ্তরের নাম
                  </th>
                  <th colSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    প্রাপ্ত ব্রড শীট জবাবের উপর গৃহীত কার্যক্রম ({periodLabel})
                  </th>
                  <th colSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    গৃহীত কার্যক্রম
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900">
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    প্রাপ্ত ব্রড শীট জবাবের সংখ্যা
                  </th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    অনুচ্ছেদের সংখ্যা
                  </th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    ব্রড শীট জবাবের সংখ্যা
                  </th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold w-[15%]">
                    নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা
                  </th>
                </tr>
              </thead>
              <tbody>
                {computedDirectorateRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="border border-black px-3 py-1.5 font-bold text-slate-900 text-left">
                      {row.directorateName}
                    </td>

                    {/* 1. প্রাপ্ত ব্রড শীট জবাবের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.nonSfi.recSheet || ''}
                          onChange={(e) => handleManualCellChange(row.nonSfi.keys.kNonSfiRecSheet, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        row.isOurOffice && row.nonSfi.recSheet > 0 ? (
                          <button
                            onClick={() => setDrilldownModal({
                              title: `${row.directorateName} - Non-SFI প্রাপ্ত ব্রডশীট জবাব (চিঠিপত্র রেজিস্টার)`,
                              entries: officeStats.nonSfi.rawCorr,
                              type: 'correspondence'
                            })}
                            className="hover:underline cursor-pointer font-black text-blue-900"
                            title="চিঠিপত্র রেজিস্টার হতে বিস্তারিত দেখুন"
                          >
                            {toBengaliDigits(row.nonSfi.recSheet)}
                          </button>
                        ) : (
                          <span>{toBengaliDigits(row.nonSfi.recSheet)}</span>
                        )
                      )}
                    </td>

                    {/* 2. অনুচ্ছেদের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.nonSfi.recParas || ''}
                          onChange={(e) => handleManualCellChange(row.nonSfi.keys.kNonSfiRecParas, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        <span className={row.nonSfi.recParas > 0 ? 'font-bold text-slate-900' : 'text-slate-700'}>
                          {toBengaliDigits(row.nonSfi.recParas)}
                        </span>
                      )}
                    </td>

                    {/* 3. গৃহীত কার্যক্রম: ব্রড শীট জবাবের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.nonSfi.actedSheet || ''}
                          onChange={(e) => handleManualCellChange(row.nonSfi.keys.kNonSfiActedSheet, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        <span className={row.nonSfi.actedSheet > 0 ? 'font-bold text-emerald-900' : 'text-slate-700'}>
                          {toBengaliDigits(row.nonSfi.actedSheet)}
                        </span>
                      )}
                    </td>

                    {/* 4. গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা */}
                    <td className="border border-black px-2 py-1.5 text-center font-semibold text-slate-900">
                      {isManualEditMode ? (
                        <input
                          type="text"
                          value={row.nonSfi.settledParas || ''}
                          onChange={(e) => handleManualCellChange(row.nonSfi.keys.kNonSfiSettledParas, e.target.value)}
                          className="w-16 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                        />
                      ) : (
                        row.isOurOffice && row.nonSfi.settledParas > 0 ? (
                          <button
                            onClick={() => setDrilldownModal({
                              title: `${row.directorateName} - Non-SFI নিষ্পত্তিকৃত অনুচ্ছেদ (মীমাংসা রেজিস্টার)`,
                              entries: officeStats.nonSfi.rawSettlements,
                              type: 'settlement'
                            })}
                            className="hover:underline cursor-pointer font-black text-emerald-900"
                            title="মীমাংসা রেজিস্টার হতে বিস্তারিত দেখুন"
                          >
                            {toBengaliDigits(row.nonSfi.settledParas)}
                          </button>
                        ) : (
                          <span>{toBengaliDigits(row.nonSfi.settledParas)}</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}

                {/* মোট Row */}
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-black">
                  <td className="border border-black px-3 py-2 text-center font-black text-sm">
                    মোট
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.nonSfi.recSheet)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.nonSfi.recParas)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.nonSfi.actedSheet)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-black text-sm">
                    {toBengaliDigits(totals.nonSfi.settledParas)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* ========================================================= */}
        {/* TABLE (গ) : দ্বি-পক্ষীয় ও ত্রি-পক্ষীয় সভার উপর গৃহীত কার্যক্রম */}
        {/* ========================================================= */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-black text-slate-900">
              {branchType === 'সকল'
                ? `(গ) দ্বি-পক্ষীয় ও ত্রি-পক্ষীয় সভার উপর গৃহীত কার্যক্রম (${periodLabel}):`
                : branchType === 'এসএফআই'
                ? `(খ) ত্রি-পক্ষীয় সভার উপর গৃহীত কার্যক্রম (${periodLabel}):`
                : `(খ) দ্বি-পক্ষীয় সভার উপর গৃহীত কার্যক্রম (${periodLabel}):`}
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs sm:text-sm table-fixed">
              <colgroup>
                <col className="w-[18.6%]" />
                {showNonSfi && showSfi ? (
                  <>
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                    <col className="w-[10.175%]" />
                  </>
                ) : (
                  <>
                    <col className="w-[20.35%]" />
                    <col className="w-[20.35%]" />
                    <col className="w-[20.35%]" />
                    <col className="w-[20.35%]" />
                  </>
                )}
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th rowSpan={2} className="border border-black px-3 py-2 text-center font-bold">
                    অধিদপ্তরের নাম
                  </th>
                  {showNonSfi && (
                    <>
                      <th colSpan={2} className="border border-black px-2 py-1.5 text-center font-bold">
                        অনুষ্ঠিত দ্বি-পক্ষীয় সভা ({periodLabel})
                      </th>
                      <th colSpan={2} className="border border-black px-2 py-1.5 text-center font-bold">
                        দ্বি-পক্ষীয় সভার প্রেক্ষিতে গৃহীত কার্যক্রম
                      </th>
                    </>
                  )}
                  {showSfi && (
                    <>
                      <th colSpan={2} className="border border-black px-2 py-1.5 text-center font-bold">
                        অনুষ্ঠিত ত্রি-পক্ষীয় সভা ({periodLabel})
                      </th>
                      <th colSpan={2} className="border border-black px-2 py-1.5 text-center font-bold">
                        ত্রি-পক্ষীয় সভার প্রেক্ষিতে গৃহীত কার্যক্রম
                      </th>
                    </>
                  )}
                </tr>
                <tr className="bg-slate-50 text-slate-900 text-xs sm:text-[13px]">
                  {showNonSfi && (
                    <>
                      {/* দ্বি-পক্ষীয় */}
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        সভার সংখ্যা
                      </th>
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        <span className="block">আলোচিত</span>
                        <span className="block text-[11px] sm:text-xs text-slate-800">অনুচ্ছেদের সংখ্যা</span>
                      </th>
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        সভার সংখ্যা
                      </th>
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        <span className="block">নিষ্পত্তিকৃত</span>
                        <span className="block text-[11px] sm:text-xs text-slate-800">অনুচ্ছেদের সংখ্যা</span>
                      </th>
                    </>
                  )}
                  {showSfi && (
                    <>
                      {/* ত্রি-পক্ষীয় */}
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        সভার সংখ্যা
                      </th>
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        <span className="block">আলোচিত</span>
                        <span className="block text-[11px] sm:text-xs text-slate-800">অনুচ্ছেদের সংখ্যা</span>
                      </th>
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        সভার সংখ্যা
                      </th>
                      <th className="border border-black px-1.5 py-2 text-center font-bold leading-snug">
                        <span className="block">নিষ্পত্তিকৃত</span>
                        <span className="block text-[11px] sm:text-xs text-slate-800">অনুচ্ছেদের সংখ্যা</span>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {computedDirectorateRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="border border-black px-3 py-2 font-bold text-slate-900 text-left">
                      {row.directorateName}
                    </td>

                    {showNonSfi && (
                      <>
                        {/* দ্বি-পক্ষীয় সভা অনুষ্ঠিত: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-black text-sm text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biHeld || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiHeld, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-black text-slate-900 py-0.5 text-sm"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.biHeld > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - অনুষ্ঠিত দ্বি-পক্ষীয় সভা`,
                                  entries: getUniqueMeetingEntries(officeStats.meetings.rawBiCorr, officeStats.meetings.rawBiSettlements),
                                  type: 'correspondence',
                                  metric: 'held'
                                })}
                                className="hover:underline cursor-pointer font-black text-blue-900 text-sm inline-block"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.biHeld)}
                              </button>
                            ) : (
                              <span className="font-black text-sm text-slate-900">{toBengaliDigits(row.meetings.biHeld)}</span>
                            )
                          )}
                        </td>

                        {/* দ্বি-পক্ষীয়: আলোচিত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-black text-slate-950 text-sm">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biDisc || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiDisc, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-black text-slate-950 py-0.5 text-sm"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.biDisc > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - দ্বি-পক্ষীয় সভায় আলোচিত অনুচ্ছেদ`,
                                  entries: getUniqueMeetingEntries(officeStats.meetings.rawBiCorr, officeStats.meetings.rawBiSettlements),
                                  type: 'correspondence',
                                  metric: 'discussed'
                                })}
                                className="hover:underline cursor-pointer font-black text-slate-950 text-sm inline-block"
                                title="আলোচিত অনুচ্ছেদের বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.biDisc)}
                              </button>
                            ) : (
                              <span className="font-black text-slate-950 text-sm">{toBengaliDigits(row.meetings.biDisc)}</span>
                            )
                          )}
                        </td>

                        {/* দ্বি-পক্ষীয় গৃহীত কার্যক্রম: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-bold text-slate-900 text-sm">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biAct || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiAct, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5 text-sm"
                            />
                          ) : (
                            <span className="font-bold text-slate-900 text-sm">{toBengaliDigits(row.meetings.biAct)}</span>
                          )}
                        </td>

                        {/* দ্বি-পক্ষীয় গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-black text-sm text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biSet || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiSet, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-black text-slate-900 py-0.5 text-sm"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.biSet > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - দ্বি-পক্ষীয় সভায় নিষ্পত্তিকৃত অনুচ্ছেদ`,
                                  entries: officeStats.meetings.rawBiSettlements,
                                  type: 'settlement',
                                  metric: 'settled'
                                })}
                                className="hover:underline cursor-pointer font-black text-emerald-900 text-sm inline-block"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.biSet)}
                              </button>
                            ) : (
                              <span className="font-black text-sm text-slate-900">{toBengaliDigits(row.meetings.biSet)}</span>
                            )
                          )}
                        </td>
                      </>
                    )}

                    {showSfi && (
                      <>
                        {/* ত্রি-পক্ষীয় সভা অনুষ্ঠিত: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-black text-sm text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triHeld || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriHeld, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-black text-slate-900 py-0.5 text-sm"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.triHeld > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - অনুষ্ঠিত ত্রি-পক্ষীয় সভা`,
                                  entries: getUniqueMeetingEntries(officeStats.meetings.rawTriCorr, officeStats.meetings.rawTriSettlements),
                                  type: 'correspondence',
                                  metric: 'held'
                                })}
                                className="hover:underline cursor-pointer font-black text-blue-900 text-sm inline-block"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.triHeld)}
                              </button>
                            ) : (
                              <span className="font-black text-sm text-slate-900">{toBengaliDigits(row.meetings.triHeld)}</span>
                            )
                          )}
                        </td>

                        {/* ত্রি-পক্ষীয়: আলোচিত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-black text-slate-950 text-sm">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triDisc || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriDisc, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-black text-slate-950 py-0.5 text-sm"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.triDisc > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - ত্রি-পক্ষীয় সভায় আলোচিত অনুচ্ছেদ`,
                                  entries: getUniqueMeetingEntries(officeStats.meetings.rawTriCorr, officeStats.meetings.rawTriSettlements),
                                  type: 'correspondence',
                                  metric: 'discussed'
                                })}
                                className="hover:underline cursor-pointer font-black text-slate-950 text-sm inline-block"
                                title="আলোচিত অনুচ্ছেদের বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.triDisc)}
                              </button>
                            ) : (
                              <span className="font-black text-slate-950 text-sm">{toBengaliDigits(row.meetings.triDisc)}</span>
                            )
                          )}
                        </td>

                        {/* ত্রি-পক্ষীয় গৃহীত কার্যক্রম: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-bold text-slate-900 text-sm">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triAct || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriAct, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5 text-sm"
                            />
                          ) : (
                            <span className="font-bold text-slate-900 text-sm">{toBengaliDigits(row.meetings.triAct)}</span>
                          )}
                        </td>

                        {/* ত্রি-পক্ষীয় গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-2 text-center font-black text-sm text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triSet || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriSet, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-black text-slate-900 py-0.5 text-sm"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.triSet > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - ত্রি-পক্ষীয় সভায় নিষ্পত্তিকৃত অনুচ্ছেদ`,
                                  entries: officeStats.meetings.rawTriSettlements,
                                  type: 'settlement',
                                  metric: 'settled'
                                })}
                                className="hover:underline cursor-pointer font-black text-emerald-900 text-sm inline-block"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.triSet)}
                              </button>
                            ) : (
                              <span className="font-black text-sm text-slate-900">{toBengaliDigits(row.meetings.triSet)}</span>
                            )
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {/* মোট Row */}
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-black">
                  <td className="border border-black px-3 py-2 text-center font-black text-sm">
                    মোট
                  </td>
                  {showNonSfi && (
                    <>
                      {/* দ্বি-পক্ষীয় মোট */}
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.biHeld)}</td>
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.biDisc)}</td>
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.biAct)}</td>
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.biSet)}</td>
                    </>
                  )}
                  {showSfi && (
                    <>
                      {/* ত্রি-পক্ষীয় মোট */}
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.triHeld)}</td>
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.triDisc)}</td>
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.triAct)}</td>
                      <td className="border border-black px-1.5 py-2 text-center font-black text-sm">{toBengaliDigits(totals.meetings.triSet)}</td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Signature Footer */}
        <div className="pt-10 flex justify-end items-end text-xs sm:text-sm font-semibold text-slate-800">
          <div className="text-center space-y-1">
            <p className="font-bold">উপ-পরিচালক</p>
            <p>{OFFICE_HEADER.sub}</p>
            <p>{OFFICE_HEADER.address}</p>
          </div>
        </div>
      </div>
    </div>

      {/* Drilldown Modal (চিঠিপত্র বা নিষ্পত্তির বিস্তারিত বিবরণী - সাইডবারের ডান পাশ থেকে ফুল ভিউ) */}
      {drilldownModal && createPortal(
        <div className="fixed top-0 bottom-0 left-0 lg:left-[126px] right-0 z-[4000] bg-white flex flex-col text-slate-900 overflow-hidden shadow-2xl border-l border-slate-300 animate-in fade-in duration-150">
          
          {/* স্ক্রোলেবল এরিয়া - যার ভেতরে টাইটেল ও টেবিল থাকবে। স্ক্রোল করলে টাইটেল উপরে চলে যাবে এবং thead শীর্ষে ফিক্সড থাকবে */}
          <div className="flex-1 overflow-y-auto overflow-x-auto bg-white">
            {/* ১. শীর্ষ টাইটেল হেডার ও সাব-হেডার (স্ক্রোল করলে উপরে চলে যাবে) */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between shadow-xs">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye size={16} className="text-blue-600 shrink-0" />
                <span>{drilldownModal.title}</span>
              </h3>
              <button
                onClick={() => setDrilldownModal(null)}
                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shrink-0"
                title="বন্ধ করুন"
              >
                <X size={15} />
              </button>
            </div>

            {/* ২. টেবিল (thead স্ক্রিনের শীর্ষে গিয়ে ফিক্সড থাকবে) */}
            {(() => {
              const isSettlementModal = drilldownModal.type === 'settlement' || drilldownModal.metric === 'settled' || drilldownModal.title.includes('নিষ্পত্তিকৃত');
              const isDiscussedModal = drilldownModal.metric === 'discussed' || drilldownModal.metric === 'held' || drilldownModal.title.includes('আলোচিত') || drilldownModal.title.includes('অনুষ্ঠিত');

              // চিঠিপত্র ও মীমাংসার মধ্যকার ডুপ্লিকেট বাদ দিয়ে ফিল্টার করি (যদি চিঠিপত্র ভিত্তিক মোডাল হয়)
              const knownIssueNos = new Set<string>();
              if (!isSettlementModal) {
                drilldownModal.entries.forEach((item: any) => {
                  const isCorr = !Boolean(item.paragraphs || item.meetingSettledParaCount || item.meetingFullSettledParaCount);
                  if (isCorr) {
                    const num = extractIssueNo(item);
                    if (num) knownIssueNos.add(num);
                  }
                });
              }

              const entriesToDisplay = drilldownModal.entries.filter((item: any) => {
                if (isSettlementModal) return true;
                const isSettlement = Boolean(item.paragraphs || item.meetingSettledParaCount || item.meetingFullSettledParaCount);
                if (isSettlement) {
                  const sIssueNo = extractIssueNo(item);
                  if (sIssueNo && knownIssueNos.has(sIssueNo)) {
                    return false; // বাদ কারণ চিঠিপত্র হিসেবে এটি ইতিপূর্বেই রো-তে বিদ্যমান
                  }
                }
                return true;
              });

              if (entriesToDisplay.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    কোনো এন্ট্রি পাওয়া যায়নি
                  </div>
                );
              }

              const totalParasSum = entriesToDisplay.reduce((sum, item) => {
                let count = 0;
                if (isDiscussedModal) {
                  if (item.meetingDiscussedParaCount) {
                    count = parseInt(toEnglishDigits(item.meetingDiscussedParaCount)) || 0;
                  } else if (item.totalParas) {
                    count = parseInt(toEnglishDigits(item.totalParas)) || 0;
                  } else if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
                    count = item.paragraphs.length;
                  } else if (item.sentParaCount) {
                    count = parseInt(toEnglishDigits(item.sentParaCount)) || 0;
                  }
                } else if (isSettlementModal) {
                  if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
                    count = item.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
                  } else if (item.meetingFullSettledParaCount) {
                    count = parseInt(toEnglishDigits(item.meetingFullSettledParaCount)) || 0;
                  } else if (item.meetingSettledParaCount) {
                    const tot = parseInt(toEnglishDigits(item.meetingSettledParaCount || '0')) || 0;
                    const part = parseInt(toEnglishDigits(item.meetingPartialSettledParaCount || '0')) || 0;
                    count = Math.max(0, tot - part);
                  } else if (item.totalParas) {
                    count = parseInt(toEnglishDigits(item.totalParas)) || 0;
                  }
                } else {
                  if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
                    count = item.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
                  } else if (item.meetingFullSettledParaCount) {
                    count = parseInt(toEnglishDigits(item.meetingFullSettledParaCount)) || 0;
                  } else if (item.totalParas) {
                    count = parseInt(toEnglishDigits(item.totalParas)) || 0;
                  } else if (item.sentParaCount) {
                    count = parseInt(toEnglishDigits(item.sentParaCount)) || 0;
                  } else if (item.meetingSettledParaCount) {
                    const tot = parseInt(toEnglishDigits(item.meetingSettledParaCount || '0')) || 0;
                    const part = parseInt(toEnglishDigits(item.meetingPartialSettledParaCount || '0')) || 0;
                    count = Math.max(0, tot - part);
                  }
                }
                return sum + count;
              }, 0);

              return (
                <>
                  <div className="px-3 sm:px-4 py-1.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold">মোট এন্ট্রি: {toBengaliDigits(entriesToDisplay.length)} টি</span>
                    <span className="text-blue-700 font-bold">চিঠিপত্র ও মীমাংসা রেজিস্টার থেকে প্রাপ্ত</span>
                  </div>

                  <table className="w-full text-[11px] text-left text-slate-800 border-collapse table-auto sm:table-fixed">
                    <thead className="sticky top-0 z-30 bg-slate-100 text-slate-900 font-bold border-b border-slate-300 shadow-sm">
                      <tr>
                        <th className="p-1.5 text-center w-8 sm:w-10 border-r border-slate-200 bg-slate-100">ক্র:</th>
                        <th className="p-1.5 text-center border-r border-slate-200 bg-slate-100 w-28 sm:w-32">ডায়েরি নং ও তারিখ</th>
                        <th className="p-1.5 text-center border-r border-slate-200 bg-slate-100 w-36 sm:w-44">পত্র / স্মারক নং ও তারিখ</th>
                        <th className="p-1.5 border-r border-slate-200 bg-slate-100">প্রতিষ্ঠান / বিবরণ</th>
                        <th className="p-1.5 text-center border-r border-slate-200 bg-slate-100 w-24 sm:w-28">শাখার ধরন</th>
                        <th className="p-1.5 text-center border-r border-slate-200 bg-slate-100 w-14 sm:w-16">অনুচ্ছেদ</th>
                        <th className="p-1.5 text-center bg-slate-100 w-28 sm:w-32">কার্যক্রম / স্ট্যাটাস</th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-600 font-bold text-[10px] border-t border-slate-200">
                        <th className="p-1 text-center border-r border-slate-200 bg-slate-50">১</th>
                        <th className="p-1 text-center border-r border-slate-200 bg-slate-50">২</th>
                        <th className="p-1 text-center border-r border-slate-200 bg-slate-50">৩</th>
                        <th className="p-1 text-center border-r border-slate-200 bg-slate-50">৪</th>
                        <th className="p-1 text-center border-r border-slate-200 bg-slate-50">৫</th>
                        <th className="p-1 text-center border-r border-slate-200 bg-slate-50">৬</th>
                        <th className="p-1 text-center bg-slate-50">৭</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {entriesToDisplay.map((item, i) => {
                        // find matched correspondence if available
                        const matchedCorr = findMatchedCorr(item, correspondenceEntries);

                        // ১. ডায়েরি নং ও তারিখ
                        let diaryNo = String(item.diaryNo || item.diaryNumber || '').trim();
                        let diaryDate = String(item.diaryDate || '').trim();

                        if (!diaryNo || !diaryDate) {
                          if (item.workpaperNoDate) {
                            const wp = splitCombinedInfo(item.workpaperNoDate, "ডায়েরি নং", "ডায়েরির তারিখ");
                            if (!diaryNo && wp.no) diaryNo = wp.no;
                            if (!diaryDate && wp.date) diaryDate = wp.date;
                          }
                        }

                        if ((!diaryNo || !diaryDate) && matchedCorr) {
                          if (!diaryNo && matchedCorr.diaryNo) diaryNo = String(matchedCorr.diaryNo).trim();
                          if (!diaryDate && matchedCorr.diaryDate) diaryDate = String(matchedCorr.diaryDate).trim();
                          if (!diaryDate && matchedCorr.receiptDate && !matchedCorr.letterDate) diaryDate = String(matchedCorr.receiptDate).trim();
                        }

                        if (!diaryDate && item.receiptDate && !item.letterDate) {
                          diaryDate = String(item.receiptDate).trim();
                        }

                        // ২. পত্র / স্মারক নং ও তারিখ (শুধুমাত্র আগমনী পত্র / স্মারক, জারিপত্র নয়)
                        let letterNo = String(item.letterNo || item.memoNo || item.meetingMemoNo || '').trim();
                        let letterDate = String(item.letterDate || item.memoDate || item.meetingDate || '').trim();

                        if (!letterNo || !letterDate) {
                          if (item.letterNoDate) {
                            const lp = splitCombinedInfo(item.letterNoDate, "পত্র নং", "পত্রের তারিখ");
                            if (!letterNo && lp.no) letterNo = lp.no;
                            if (!letterDate && lp.date) letterDate = lp.date;
                          }
                        }

                        if ((!letterNo || !letterDate) && matchedCorr) {
                          if (!letterNo && matchedCorr.letterNo) letterNo = String(matchedCorr.letterNo).trim();
                          if (!letterDate && matchedCorr.letterDate) letterDate = String(matchedCorr.letterDate).trim();
                        }

                        // ৩. প্রতিষ্ঠান ও বিবরণ
                        const entityName = String(item.entityName || matchedCorr?.entityName || '').trim();
                        const branchName = String(item.branchName || matchedCorr?.branchName || '').trim();
                        const auditYear = String(item.auditYear || matchedCorr?.auditYear || '').trim();

                        // পত্রের বিবরণ (যেমন, বেসিক ব্যাংক পিএলসি, খুলনা (২০০৮-১৬))
                        let letterDesc = String(item.description || matchedCorr?.description || '').trim();

                        if (!letterDesc || letterDesc === entityName) {
                          const parts: string[] = [];
                          if (entityName) parts.push(entityName);
                          if (branchName && !entityName.includes(branchName)) parts.push(branchName);
                          let built = parts.join(', ');
                          if (auditYear && !built.includes(auditYear)) {
                            built = built ? `${built} (${toBengaliDigits(auditYear)})` : `(${toBengaliDigits(auditYear)})`;
                          }
                          if (built) letterDesc = built;
                        } else {
                          if (branchName && !letterDesc.includes(branchName)) {
                            const yearPart = auditYear && !letterDesc.includes(auditYear) ? ` (${toBengaliDigits(auditYear)})` : '';
                            letterDesc = `${letterDesc}, ${branchName}${yearPart}`;
                          } else if (auditYear && !letterDesc.includes(auditYear)) {
                            letterDesc = `${letterDesc} (${toBengaliDigits(auditYear)})`;
                          }
                        }

                        const pType = item.paraType || matchedCorr?.paraType || '-';
                        let rowParas = 0;
                        if (isDiscussedModal) {
                          if (item.meetingDiscussedParaCount) {
                            rowParas = parseInt(toEnglishDigits(item.meetingDiscussedParaCount)) || 0;
                          } else if (item.totalParas) {
                            rowParas = parseInt(toEnglishDigits(item.totalParas)) || 0;
                          } else if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
                            rowParas = item.paragraphs.length;
                          } else if (item.sentParaCount) {
                            rowParas = parseInt(toEnglishDigits(item.sentParaCount)) || 0;
                          }
                        } else if (isSettlementModal) {
                          if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
                            rowParas = item.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
                          } else if (item.meetingFullSettledParaCount) {
                            rowParas = parseInt(toEnglishDigits(item.meetingFullSettledParaCount)) || 0;
                          } else if (item.meetingSettledParaCount) {
                            const tot = parseInt(toEnglishDigits(item.meetingSettledParaCount || '0')) || 0;
                            const part = parseInt(toEnglishDigits(item.meetingPartialSettledParaCount || '0')) || 0;
                            rowParas = Math.max(0, tot - part);
                          } else if (item.totalParas) {
                            rowParas = parseInt(toEnglishDigits(item.totalParas)) || 0;
                          }
                        } else {
                          if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
                            rowParas = item.paragraphs.filter((p: any) => p.status !== 'আংশিক').length;
                          } else if (item.meetingFullSettledParaCount) {
                            rowParas = parseInt(toEnglishDigits(item.meetingFullSettledParaCount)) || 0;
                          } else if (item.totalParas) {
                            rowParas = parseInt(toEnglishDigits(item.totalParas)) || 0;
                          } else if (item.sentParaCount) {
                            rowParas = parseInt(toEnglishDigits(item.sentParaCount)) || 0;
                          } else if (item.meetingSettledParaCount) {
                            const tot = parseInt(toEnglishDigits(item.meetingSettledParaCount || '0')) || 0;
                            const part = parseInt(toEnglishDigits(item.meetingPartialSettledParaCount || '0')) || 0;
                            rowParas = Math.max(0, tot - part);
                          }
                        }
                        const paras = rowParas > 0 ? rowParas : '-';

                        // কার্যক্রম / স্ট্যাটাস: জারিপত্র নং ও তারিখ
                        let issueNo = String(item.issueLetterNo || '').trim();
                        let issueDate = String(item.issueLetterDate || item.issueDateISO || item.issueDate || '').trim();

                        if (!issueNo || !issueDate) {
                          if (item.issueLetterNoDate) {
                            const ip = splitCombinedInfo(item.issueLetterNoDate, "জারিপত্র নং", "জারিপত্রের তারিখ");
                            if (!issueNo && ip.no) issueNo = ip.no;
                            if (!issueDate && ip.date) issueDate = ip.date;
                          }
                        }

                        if (!issueNo) {
                          const extracted = extractIssueNo(item);
                          if (extracted) issueNo = extracted;
                        }

                        if ((!issueNo || !issueDate) && matchedCorr) {
                          if (!issueNo && matchedCorr.issueLetterNo) issueNo = String(matchedCorr.issueLetterNo).trim();
                          if (!issueDate && (matchedCorr.issueLetterDate || matchedCorr.issueDateISO)) {
                            issueDate = String(matchedCorr.issueLetterDate || matchedCorr.issueDateISO).trim();
                          }
                        }

                        // যদি চিঠিপত্রে issueDate না থাকে, সংশ্লিষ্ট মীমাংসা এন্ট্রি থেকে তারিখ নেওয়া
                        if (issueNo && !issueDate && Array.isArray(settlementEntries)) {
                          const matched = settlementEntries.find(s => {
                            const sNo = String(s.issueLetterNo || s.meetingMemoNo || s.memoNo || s.issueLetterNoDate || '').trim();
                            return sNo.includes(issueNo);
                          });
                          if (matched) {
                            issueDate = String(matched.issueDateISO || matched.issueDate || '').trim();
                            if (!issueDate && matched.issueLetterNoDate) {
                              const dateMatch = matched.issueLetterNoDate.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
                              if (dateMatch) issueDate = dateMatch[0];
                            }
                          }
                        }

                        let formattedIssueText = '';
                        if (issueNo) {
                          const formattedDate = formatDateDisplay(issueDate);
                          formattedIssueText = formattedDate 
                            ? `জারিপত্র নং- ${toBengaliDigits(issueNo)}, জারিপত্রের তারিখ- ${formattedDate}` 
                            : `জারিপত্র নং- ${toBengaliDigits(issueNo)}`;
                        }

                        return (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-1.5 text-center text-slate-600 font-semibold border-r border-slate-200">{toBengaliDigits(i + 1)}</td>
                            
                            {/* ডায়েরি নং ও তারিখ */}
                            <td className="p-1.5 text-center border-r border-slate-200">
                              <div className="font-bold text-slate-900 leading-tight text-center">{diaryNo ? toBengaliDigits(diaryNo) : '-'}</div>
                              {diaryDate && <div className="text-[10px] text-slate-500 text-center">{formatDateDisplay(diaryDate)}</div>}
                            </td>

                            {/* পত্র / স্মারক নং ও তারিখ */}
                            <td className="p-1.5 text-center border-r border-slate-200">
                              <div className="font-bold text-slate-900 break-words leading-tight text-center">{letterNo ? toBengaliDigits(letterNo) : '-'}</div>
                              {letterDate && <div className="text-[10px] text-slate-500 text-center">{formatDateDisplay(letterDate)}</div>}
                            </td>

                            {/* প্রতিষ্ঠান / বিবরণ (উপরে পত্রের বিবরণ এবং তার নিচে প্রতিষ্ঠান) */}
                            <td className="p-1.5 font-medium text-slate-900 border-r border-slate-200">
                              <div className="font-bold text-slate-900 leading-tight">{letterDesc || entityName || '-'}</div>
                              {entityName && letterDesc && letterDesc !== entityName && (
                                <div className="text-[10.5px] text-slate-600 font-semibold leading-tight mt-0.5" title={entityName}>{entityName}</div>
                              )}
                            </td>

                            <td className="p-1.5 text-center text-slate-800 border-r border-slate-200 whitespace-nowrap">{pType}</td>
                            <td className="p-1.5 text-center font-bold text-slate-900 border-r border-slate-200">{toBengaliDigits(paras)}</td>
                            <td className="p-1.5 text-center">
                              {formattedIssueText ? (
                                <span className="font-semibold text-emerald-800 text-[11px] leading-tight block">
                                  {formattedIssueText}
                                </span>
                              ) : (
                                <span className="font-bold text-amber-700 text-[11px]">
                                  চলমান
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* নিচে সর্বমোট নামক রো (মোট অনুচ্ছেদ হিসাব সম্বলিত) */}
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 shadow-md">
                      <tr className="bg-slate-100 text-slate-900">
                        <td colSpan={5} className="p-2 text-right font-black border-r border-slate-300 text-slate-900 text-xs bg-slate-100">
                          সর্বমোট:
                        </td>
                        <td className="p-2 text-center font-black text-slate-900 text-xs border-r border-slate-300 bg-amber-100/70">
                          {toBengaliDigits(totalParasSum)}
                        </td>
                        <td className="p-2 bg-slate-100"></td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              );
            })()}
          </div>

          {/* ৩. নিচের ফুটার - সবসময় নিচে স্ক্রিনের সাথে ফিক্সড */}
          <div className="px-3 sm:px-4 py-2 border-t border-slate-200 flex justify-end bg-slate-50 shrink-0 z-30 shadow-xs">
            <button
              onClick={() => setDrilldownModal(null)}
              className="px-6 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Statistics Modal (পরিসংখ্যান) */}
      {showStatsModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-600/30 rounded-lg flex items-center justify-center border border-emerald-500/30">
                  <BarChart3 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">রিটার্ন-২ পরিসংখ্যান ও সারসংক্ষেপ</h3>
                  <p className="text-slate-400 text-[11px]">রিপোর্টিং সময়কাল: {periodLabel}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowStatsModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">ব্রডশীট জবাব (এসএফআই)</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">{toBengaliDigits(officeStats.sfi.recSheet)} টি পত্র</span>
                  <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">অনুচ্ছেদ: {toBengaliDigits(officeStats.sfi.recParas)} টি</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">ব্রডশীট জবাব (নন-এসএফআই)</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">{toBengaliDigits(officeStats.nonSfi.recSheet)} টি পত্র</span>
                  <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">অনুচ্ছেদ: {toBengaliDigits(officeStats.nonSfi.recParas)} টি</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">দ্বি-পক্ষীয় সভা</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">{toBengaliDigits(officeStats.meetings.biHeld)} টি সভা</span>
                  <span className="text-[11px] font-semibold text-blue-700 mt-0.5 block">আলোচিত: {toBengaliDigits(officeStats.meetings.biDisc)} | নিষ্পত্তিকৃত: {toBengaliDigits(officeStats.meetings.biSet)}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">ত্রি-পক্ষীয় সভা</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">{toBengaliDigits(officeStats.meetings.triHeld)} টি সভা</span>
                  <span className="text-[11px] font-semibold text-purple-700 mt-0.5 block">আলোচিত: {toBengaliDigits(officeStats.meetings.triDisc)} | নিষ্পত্তিকৃত: {toBengaliDigits(officeStats.meetings.triSet)}</span>
                </div>
              </div>

              {/* Total Settled Summary */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block">সর্বমোট নিষ্পত্তিকৃত অনুচ্ছেদ</span>
                  <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                    {toBengaliDigits(officeStats.nonSfi.settledParas + officeStats.meetings.biSet + officeStats.meetings.triSet)} টি
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10.5px] font-semibold text-slate-500 block">সক্রিয় শাখা ফিল্টার</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-bold">
                    {branchType === 'সকল' ? 'সকল শাখা' : branchType}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CorrespondenceDhakaReturn2;
