import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, Printer, FileSpreadsheet, Calendar, 
  RotateCcw, Edit3, X, Building2, Plus, Trash2, Eye,
  Layers, Check, Download
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

const STORAGE_KEY_MANUAL = 'dhaka_return_2_manual_overrides_v2';
const STORAGE_KEY_DIRECTORATES = 'dhaka_return_2_directorates_list_v2';

export const CorrespondenceDhakaReturn2: React.FC<CorrespondenceDhakaReturn2Props> = ({
  correspondenceEntries = [],
  settlementEntries = [],
  activeCycle,
  setSelectedReportType,
  IDBadge
}) => {
  // Initialize period from active cycle
  const cycleEndDate = activeCycle?.end ? new Date(activeCycle.end) : new Date();
  const currentYear = cycleEndDate.getFullYear();
  const cycleEndMonth = cycleEndDate.getMonth(); // 0-indexed

  const [startMonth, setStartMonth] = useState<number>(0); // Default January
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endMonth, setEndMonth] = useState<number>(cycleEndMonth >= 7 ? cycleEndMonth : 7); // Default August or current cycle
  const [endYear, setEndYear] = useState<number>(currentYear);

  // Branch Type Filter: 'সকল', 'এসএফআই', 'নন এসএফআই'
  const [branchType, setBranchType] = useState<'সকল' | 'এসএফআই' | 'নন এসএফআই'>('সকল');

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
  const periodStartDate = useMemo(() => new Date(startYear, startMonth, 1), [startYear, startMonth]);
  const periodEndDate = useMemo(() => new Date(endYear, endMonth + 1, 0, 23, 59, 59), [endYear, endMonth]);

  // Display text for period
  const periodLabel = useMemo(() => {
    const sMonthName = BENGALI_MONTHS[startMonth];
    const sYearBN = toBengaliDigits(startYear);
    const eMonthName = BENGALI_MONTHS[endMonth];
    const eYearBN = toBengaliDigits(endYear);
    return `${sMonthName}/${sYearBN} হতে ${eMonthName}/${eYearBN}`;
  }, [startMonth, startYear, endMonth, endYear]);

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
      const d = entry.diaryDate || entry.letterDate || entry.receiptDate || (entry.createdAt ? entry.createdAt.split('T')[0] : '');
      return isDateInPeriod(d);
    });
  }, [correspondenceEntries, periodStartDate, periodEndDate]);

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

    // SFI Settled Paras (মীমাংসা রেজিস্টার হতে)
    const sfiSettlements = periodSettlementEntries.filter(s => isSFI(s.paraType));
    const sfiSettledParasCount = sfiSettlements.reduce((sum, s) => {
      const pCount = Array.isArray(s.paragraphs) 
        ? s.paragraphs.length 
        : (parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || 0);
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

    // Non-SFI Settled Paras (মীমাংসা রেজিস্টার হতে)
    const nonSfiSettlements = periodSettlementEntries.filter(s => isNonSFI(s.paraType));
    const nonSfiSettledParasCount = nonSfiSettlements.reduce((sum, s) => {
      const pCount = Array.isArray(s.paragraphs) 
        ? s.paragraphs.length 
        : (parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || 0);
      return sum + pCount;
    }, 0);

    // 3. Bilateral Meetings (দ্বি-পক্ষীয় সভা)
    const biCorr = periodCorrespondenceEntries.filter(e => isBilateralLetter(e));
    const biSettlement = periodSettlementEntries.filter(s => 
      s.isMeeting && (s.meetingType?.includes('দ্বি') || s.meetingType?.includes('দ্বিপক্ষীয়'))
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

    const biHeldCount = filterBiCorr.length + filterBiSettlement.length;
    const biDiscParasCount = filterBiCorr.reduce((acc, e) => 
      acc + (parseInt(toEnglishDigits(e.totalParas || e.meetingDiscussedParaCount || '0')) || 0), 0) +
      filterBiSettlement.reduce((acc, s) => 
        acc + (parseInt(toEnglishDigits(s.meetingDiscussedParaCount || '0')) || (s.paragraphs ? s.paragraphs.length : 0)), 0);

    const biActCount = filterBiSettlement.length + filterBiCorr.filter(c => c.issueLetterNo || c.isSettled === 'হ্যাঁ').length;
    const biSettledParasCount = filterBiSettlement.reduce((acc, s) => 
      acc + (parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || (s.paragraphs ? s.paragraphs.length : 0)), 0);

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

    const triHeldCount = filterTriCorr.length + filterTriSettlement.length;
    const triDiscParasCount = filterTriCorr.reduce((acc, e) => 
      acc + (parseInt(toEnglishDigits(e.totalParas || e.meetingDiscussedParaCount || '0')) || 0), 0) +
      filterTriSettlement.reduce((acc, s) => 
        acc + (parseInt(toEnglishDigits(s.meetingDiscussedParaCount || '0')) || (s.paragraphs ? s.paragraphs.length : 0)), 0);

    const triActCount = filterTriSettlement.length + filterTriCorr.filter(c => c.issueLetterNo || c.isSettled === 'হ্যাঁ').length;
    const triSettledParasCount = filterTriSettlement.reduce((acc, s) => 
      acc + (parseInt(toEnglishDigits(s.meetingSettledParaCount || '0')) || (s.paragraphs ? s.paragraphs.length : 0)), 0);

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
    <div id="dhaka-return-2-root" className="min-h-screen bg-slate-900/40 p-2 sm:p-4 md:p-6 space-y-6 text-slate-100 w-full max-w-full overflow-x-hidden">
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

      {/* Control Header & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl no-print space-y-4 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setSelectedReportType(null)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="ফিরে যান"
          >
            <ChevronLeft size={16} />
            <span>ফিরে যান</span>
          </button>

          {/* Download Icon Button: Placed at the top right marked position */}
          <button
            onClick={handleExportExcel}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/30 active:scale-95 border border-emerald-500/50 flex items-center justify-center transition-all"
            title="এক্সেলে ডাউনলোড করুন"
            aria-label="ডাউনলোড"
          >
            <Download size={18} />
          </button>
        </div>

        {/* Filter Controls Row: Branch Type + Period Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center text-xs">
          {/* 1. Branch Type Selector (শাখার ধরন: সকল / এসএফআই / নন এসএফআই) */}
          <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-indigo-500/40 shadow-sm">
            <Layers size={16} className="text-indigo-400 shrink-0 ml-1" />
            <span className="font-black text-indigo-200 shrink-0 text-xs">শাখার ধরন:</span>
            <select
              value={branchType}
              onChange={(e) => setBranchType(e.target.value as any)}
              className="bg-slate-950 border border-indigo-500/50 text-amber-300 rounded-lg px-2.5 py-1 text-xs font-black focus:outline-none focus:border-indigo-400 w-full"
            >
              <option value="সকল">সকল (উভয় শাখা)</option>
              <option value="এসএফআই">এসএফআই (SFI)</option>
              <option value="নন এসএফআই">নন এসএফআই (Non-SFI)</option>
            </select>
          </div>

          {/* 2. Period Start Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
            <Calendar size={15} className="text-amber-400 shrink-0 ml-1 mr-0.5" />
            <span className="font-bold text-slate-300 shrink-0 text-[11px]">শুরু:</span>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-amber-400 w-full"
            >
              {BENGALI_MONTHS.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
            <select
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-amber-400"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{toBengaliDigits(y)}</option>
              ))}
            </select>
          </div>

          {/* 3. Period End Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
            <Calendar size={15} className="text-blue-400 shrink-0 ml-1 mr-0.5" />
            <span className="font-bold text-slate-300 shrink-0 text-[11px]">হতে:</span>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-blue-400 w-full"
            >
              {BENGALI_MONTHS.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
            <select
              value={endYear}
              onChange={(e) => setEndYear(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-blue-400"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{toBengaliDigits(y)}</option>
              ))}
            </select>
          </div>

          {/* 4. Add Directorate Row / Quick Action */}
          <div className="flex items-center gap-2">
            {!showAddDirectorate ? (
              <button
                onClick={() => setShowAddDirectorate(true)}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Plus size={14} />
                <span>+ অধিদপ্তর যোগ করুন</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  placeholder="অধিদপ্তরের নাম..."
                  value={newDirectorateInput}
                  onChange={(e) => setNewDirectorateInput(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500"
                />
                <button
                  onClick={handleAddCustomDirectorate}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                  title="যোগ করুন"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setShowAddDirectorate(false)}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                  title="বাতিল"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {isManualEditMode && (
          <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span><strong>ম্যানুয়াল এডিট মোড সক্রিয়:</strong> যেকোনো সেলে সরাসরি সংখ্যা টাইপ করে পরিবর্তন করতে পারবেন। মান স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।</span>
            </div>
            <button 
              onClick={() => setIsManualEditMode(false)}
              className="text-amber-200 hover:text-white underline font-bold"
            >
              সম্পন্ন করুন
            </button>
          </div>
        )}
      </div>

      {/* Table Dedicated Horizontal Scroll Container: Only this table scrolls horizontally on mobile/desktop */}
      <div className="w-full max-w-full overflow-x-auto rounded-2xl shadow-2xl border border-slate-700/60 bg-white/5">
        <div 
          id="dhaka-return-2-print-container" 
          className="bg-white text-slate-900 rounded-2xl p-4 sm:p-8 md:p-10 shadow-none border-none space-y-8 font-serif select-text"
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
                <tr className="bg-slate-50 text-slate-900 text-[11px] sm:text-xs">
                  {showNonSfi && (
                    <>
                      {/* দ্বি-পক্ষীয় */}
                      <th className="border border-black px-1.5 py-1 text-center font-bold">সভার সংখ্যা</th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold">আলোচিত অনুচ্ছেদের সংখ্যা</th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold">সভার সংখ্যা</th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold">নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা</th>
                    </>
                  )}
                  {showSfi && (
                    <>
                      {/* ত্রি-পক্ষীয় */}
                      <th className="border border-black px-1.5 py-1 text-center font-bold">সভার সংখ্যা</th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold">আলোচিত অনুচ্ছেদের সংখ্যা</th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold">সভার সংখ্যা</th>
                      <th className="border border-black px-1.5 py-1 text-center font-bold">নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {computedDirectorateRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="border border-black px-3 py-1.5 font-bold text-slate-900 text-left">
                      {row.directorateName}
                    </td>

                    {showNonSfi && (
                      <>
                        {/* দ্বি-পক্ষীয় সভা অনুষ্ঠিত: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biHeld || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiHeld, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.biHeld > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - অনুষ্ঠিত দ্বি-পক্ষীয় সভা`,
                                  entries: [...officeStats.meetings.rawBiCorr, ...officeStats.meetings.rawBiSettlements],
                                  type: 'correspondence'
                                })}
                                className="hover:underline cursor-pointer font-black text-blue-900"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.biHeld)}
                              </button>
                            ) : (
                              <span>{toBengaliDigits(row.meetings.biHeld)}</span>
                            )
                          )}
                        </td>

                        {/* দ্বি-পক্ষীয়: আলোচিত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biDisc || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiDisc, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            <span>{toBengaliDigits(row.meetings.biDisc)}</span>
                          )}
                        </td>

                        {/* দ্বি-পক্ষীয় গৃহীত কার্যক্রম: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biAct || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiAct, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            <span>{toBengaliDigits(row.meetings.biAct)}</span>
                          )}
                        </td>

                        {/* দ্বি-পক্ষীয় গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.biSet || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kBiSet, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.biSet > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - দ্বি-পক্ষীয় সভায় নিষ্পত্তিকৃত অনুচ্ছেদ`,
                                  entries: officeStats.meetings.rawBiSettlements,
                                  type: 'settlement'
                                })}
                                className="hover:underline cursor-pointer font-black text-emerald-900"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.biSet)}
                              </button>
                            ) : (
                              <span>{toBengaliDigits(row.meetings.biSet)}</span>
                            )
                          )}
                        </td>
                      </>
                    )}

                    {showSfi && (
                      <>
                        {/* ত্রি-পক্ষীয় সভা অনুষ্ঠিত: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triHeld || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriHeld, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.triHeld > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - অনুষ্ঠিত ত্রি-পক্ষীয় সভা`,
                                  entries: [...officeStats.meetings.rawTriCorr, ...officeStats.meetings.rawTriSettlements],
                                  type: 'correspondence'
                                })}
                                className="hover:underline cursor-pointer font-black text-blue-900"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.triHeld)}
                              </button>
                            ) : (
                              <span>{toBengaliDigits(row.meetings.triHeld)}</span>
                            )
                          )}
                        </td>

                        {/* ত্রি-পক্ষীয়: আলোচিত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triDisc || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriDisc, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            <span>{toBengaliDigits(row.meetings.triDisc)}</span>
                          )}
                        </td>

                        {/* ত্রি-পক্ষীয় গৃহীত কার্যক্রম: সভার সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triAct || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriAct, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            <span>{toBengaliDigits(row.meetings.triAct)}</span>
                          )}
                        </td>

                        {/* ত্রি-পক্ষীয় গৃহীত কার্যক্রম: নিষ্পত্তিকৃত অনুচ্ছেদের সংখ্যা */}
                        <td className="border border-black px-1.5 py-1 text-center font-semibold text-slate-900">
                          {isManualEditMode ? (
                            <input
                              type="text"
                              value={row.meetings.triSet || ''}
                              onChange={(e) => handleManualCellChange(row.meetings.keys.kTriSet, e.target.value)}
                              className="w-12 text-center bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 py-0.5"
                            />
                          ) : (
                            row.isOurOffice && row.meetings.triSet > 0 ? (
                              <button
                                onClick={() => setDrilldownModal({
                                  title: `${row.directorateName} - ত্রি-পক্ষীয় সভায় নিষ্পত্তিকৃত অনুচ্ছেদ`,
                                  entries: officeStats.meetings.rawTriSettlements,
                                  type: 'settlement'
                                })}
                                className="hover:underline cursor-pointer font-black text-emerald-900"
                                title="বিস্তারিত দেখুন"
                              >
                                {toBengaliDigits(row.meetings.triSet)}
                              </button>
                            ) : (
                              <span>{toBengaliDigits(row.meetings.triSet)}</span>
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

      {/* Drilldown Modal (চিঠিপত্র বা নিষ্পত্তির বিস্তারিত বিবরণী) */}
      {drilldownModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye size={18} className="text-blue-400" />
                <span>{drilldownModal.title}</span>
              </h3>
              <button
                onClick={() => setDrilldownModal(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>মোট এন্ট্রি: {toBengaliDigits(drilldownModal.entries.length)} টি</span>
                <span className="text-blue-400 font-medium">চিঠিপত্র ও মীমাংসা রেজিস্টার থেকে প্রাপ্ত</span>
              </div>

              {drilldownModal.entries.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  কোনো এন্ট্রি পাওয়া যায়নি
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-200 font-bold border-b border-slate-700">
                      <tr>
                        <th className="p-2 text-center w-10">ক্র:</th>
                        <th className="p-2">তারিখ</th>
                        <th className="p-2">স্মারক / বিবরণ</th>
                        <th className="p-2">শাখার ধরন</th>
                        <th className="p-2 text-center">অনুচ্ছেদ</th>
                        <th className="p-2">কার্যক্রম / স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {drilldownModal.entries.map((item, i) => {
                        const date = item.diaryDate || item.letterDate || item.receiptDate || item.issueDateISO || item.meetingDate || '';
                        const desc = item.description || item.entityName || item.letterNo || item.issueLetterNoDate || '-';
                        const pType = item.paraType || '-';
                        const paras = item.totalParas || item.sentParaCount || item.meetingSettledParaCount || (item.paragraphs ? item.paragraphs.length : '-');
                        const status = item.issueLetterNo || item.isSettled || item.approvalStatus || (item.isMeeting ? 'সভা অনুষ্ঠিত' : 'গৃহীত');

                        return (
                          <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-2 text-center text-slate-400 font-semibold">{toBengaliDigits(i + 1)}</td>
                            <td className="p-2 whitespace-nowrap text-slate-300">{toBengaliDigits(date)}</td>
                            <td className="p-2 font-medium text-white max-w-xs truncate" title={desc}>{desc}</td>
                            <td className="p-2 text-indigo-300">{pType}</td>
                            <td className="p-2 text-center font-bold text-amber-400">{toBengaliDigits(paras)}</td>
                            <td className="p-2 text-emerald-400">{status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDrilldownModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrespondenceDhakaReturn2;
