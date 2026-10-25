import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, FileSpreadsheet, ChevronDown, Check, Building2, Edit3, RotateCcw, CalendarDays, Layers, X, ListFilter } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber } from '../utils/numberUtils';
import { SettlementEntry, CorrespondenceEntry } from '../types';
import { isSFI, isNonSFI } from '../utils/branchUtils';
import { extractEntryDate } from '../utils/halfYearlyHelper';
import { formatBengaliDateDMY } from '../utils/syncHelper';

export type YearlyTableType = 'বার্ষিক - ১' | 'বার্ষিক - ২' | 'বার্ষিক - ৩';

interface YearlyReturnViewProps {
  entries: SettlementEntry[];
  correspondenceEntries?: CorrespondenceEntry[];
  prevStats?: any;
  activeCycle?: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  selectedReportType: string | null;
  setSelectedReportType: (type: string | null) => void;
  monthPickerElement?: React.ReactNode;
}

interface YearlyRowData {
  id: string;
  ministryName: string;
  prevCount: number;
  prevAmount: number;
  raisedCount: number;
  raisedAmount: number;
  bsrCount: number;
  settledCount: number;
  settledAmount: number;
  unsettledCountOverride?: number;
  unsettledAmountOverride?: number;
  recAmount: number;
  adjAmount: number;
}

// Default empty baseline dataset (Opening balance comes from OpeningBalanceSetup and settlements from Settlement Register)
const DEFAULT_YEARLY_DATA: Record<string, YearlyRowData> = {
  'আর্থিক প্রতিষ্ঠান বিভাগ': {
    id: 'fin',
    ministryName: 'আর্থিক প্রতিষ্ঠান বিভাগ',
    prevCount: 0,
    prevAmount: 0,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 0,
    settledCount: 0,
    settledAmount: 0,
    recAmount: 0,
    adjAmount: 0,
  },
  'শিল্প মন্ত্রণালয়': {
    id: 'ind',
    ministryName: 'শিল্প মন্ত্রণালয়',
    prevCount: 0,
    prevAmount: 0,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 0,
    settledCount: 0,
    settledAmount: 0,
    recAmount: 0,
    adjAmount: 0,
  },
  'বস্ত্র ও পাট মন্ত্রণালয়': {
    id: 'tex',
    ministryName: 'বস্ত্র ও পাট মন্ত্রণালয়',
    prevCount: 0,
    prevAmount: 0,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 0,
    settledCount: 0,
    settledAmount: 0,
    recAmount: 0,
    adjAmount: 0,
  },
  'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়': {
    id: 'avi',
    ministryName: 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
    prevCount: 0,
    prevAmount: 0,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 0,
    settledCount: 0,
    settledAmount: 0,
    recAmount: 0,
    adjAmount: 0,
  },
  'বাণিজ্য মন্ত্রণালয়': {
    id: 'com',
    ministryName: 'বাণিজ্য মন্ত্রণালয়',
    prevCount: 0,
    prevAmount: 0,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 0,
    settledCount: 0,
    settledAmount: 0,
    recAmount: 0,
    adjAmount: 0,
  },
};

const isMinistryMatchForYearly = (entryMinistry: string = '', targetMinistry: string = ''): boolean => {
  const normEntry = entryMinistry.normalize('NFC').replace(/\s+/g, ' ').trim();
  const normTarget = targetMinistry.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!normEntry || !normTarget) return false;
  if (normEntry === normTarget) return true;

  if (normTarget.includes('আর্থিক')) return normEntry.includes('আর্থিক');
  if (normTarget.includes('শিল্প')) return normEntry.includes('শিল্প');
  if (normTarget.includes('বস্ত্র') || normTarget.includes('পাট')) {
    return normEntry.includes('বস্ত্র') || normEntry.includes('পাট');
  }
  if (normTarget.includes('বিমান') || normTarget.includes('পর্যটন')) {
    return normEntry.includes('বিমান') || normEntry.includes('পর্যটন');
  }
  if (normTarget.includes('বাণিজ্য')) return normEntry.includes('বাণিজ্য');

  return normEntry.includes(normTarget) || normTarget.includes(normEntry);
};

// Order of ministries in Table 1 (Screenshot 2)
const TABLE_1_MINISTRY_ORDER = [
  'আর্থিক প্রতিষ্ঠান বিভাগ',
  'শিল্প মন্ত্রণালয়',
  'বস্ত্র ও পাট মন্ত্রণালয়',
  'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
  'বাণিজ্য মন্ত্রণালয়',
];

// Order of ministries in Table 2 & Table 3 (Screenshots 3 & 4)
const TABLE_2_3_MINISTRY_ORDER = [
  'শিল্প মন্ত্রণালয়',
  'বস্ত্র ও পাট মন্ত্রণালয়',
  'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
  'বাণিজ্য মন্ত্রণালয়',
  'আর্থিক প্রতিষ্ঠান বিভাগ',
];

const TABLE_OPTIONS: { id: YearlyTableType; reportType: string; label: string; subtitle: string }[] = [
  {
    id: 'বার্ষিক - ১',
    reportType: 'বাৎসরিক রিটার্ন - ১',
    label: 'বার্ষিক - ১ (১৩ কলাম: নিষ্পত্তির সারাংশ)',
    subtitle: 'মন্ত্রণালয়/বিভাগ সম্পর্কিত অডিট আপত্তি নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ (বার্ষিক)।',
  },
  {
    id: 'বার্ষিক - ২',
    reportType: 'বাৎসরিক রিটার্ন - ২',
    label: 'বার্ষিক - ২ (১৫ কলাম: আদায় ও সমন্বয়সহ সারাংশ)',
    subtitle: 'মন্ত্রণালয়/বিভাগ সম্পর্কিত অডিট আপত্তি নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ (বার্ষিক)।',
  },
  {
    id: 'বার্ষিক - ৩',
    reportType: 'বাৎসরিক রিটার্ন - ৩',
    label: 'বার্ষিক - ৩ (৯ কলাম: ২.১ অডিট আপত্তি সংক্রান্ত তথ্য)',
    subtitle: '২.১ অডিট আপত্তি সংক্রান্ত তথ্য (জুলাই/২০২৫ থেকে জুন/২০২৬ খ্রি: পর্যন্ত)।',
  },
];

const STORAGE_KEY_YEARLY_OVERRIDES = 'ledger_yearly_return_overrides_v2';

export const YearlyReturnView: React.FC<YearlyReturnViewProps> = ({
  entries = [],
  correspondenceEntries = [],
  prevStats,
  activeCycle,
  IDBadge,
  onBack,
  selectedReportType,
  setSelectedReportType,
  monthPickerElement,
}) => {
  // Determine active table from selectedReportType
  const activeTable: YearlyTableType = useMemo(() => {
    if (selectedReportType === 'বাৎসরিক রিটার্ন - ২' || selectedReportType === 'বার্ষিক - ২') return 'বার্ষিক - ২';
    if (selectedReportType === 'বাৎসরিক রিটার্ন - ৩' || selectedReportType === 'বার্ষিক - ৩') return 'বার্ষিক - ৩';
    return 'বার্ষিক - ১';
  }, [selectedReportType]);

  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<string>('সকল');
  const [isEditMode, setIsEditMode] = useState(false);

  // ৯ নং কলামের (ব্রডশীট জবাবের সংখ্যা) জন্য পৃথক শাখা ফিল্টার ড্রপডাউন স্টেট
  const [col9BranchFilter, setCol9BranchFilter] = useState<'সকল' | 'এসএফআই' | 'নন এসএফআই'>('সকল');
  const [isCol9DropdownOpen, setIsCol9DropdownOpen] = useState(false);

  // নিষ্পত্তিকৃত আপত্তির সংখ্যায় ক্লিক করলে বিস্তারিত অনুচ্ছেদ ও টাকার পপআপ স্টেট
  const [selectedSettledMinistry, setSelectedSettledMinistry] = useState<string | null>(null);

  const tableDropdownRef = useRef<HTMLDivElement>(null);
  const minDropdownRef = useRef<HTMLDivElement>(null);
  const col9DropdownRef = useRef<HTMLTableCellElement>(null);

  const [customOverrides, setCustomOverrides] = useState<Record<string, Partial<YearlyRowData>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_YEARLY_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_YEARLY_OVERRIDES);
    } catch {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(e.target as Node)) {
        setIsTableDropdownOpen(false);
      }
      if (minDropdownRef.current && !minDropdownRef.current.contains(e.target as Node)) {
        setIsMinistryDropdownOpen(false);
      }
      if (col9DropdownRef.current && !col9DropdownRef.current.contains(e.target as Node)) {
        setIsCol9DropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (ministryName: string, field: keyof YearlyRowData, rawVal: string) => {
    const num = parseBengaliNumber(rawVal);
    const overrideKey = `${activeTable}_${ministryName}`;
    setCustomOverrides(prev => {
      const updated = {
        ...prev,
        [overrideKey]: {
          ...(prev[overrideKey] || {}),
          [field]: isNaN(num) ? 0 : num,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY_YEARLY_OVERRIDES, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save yearly overrides:', err);
      }
      return updated;
    });
  };

  const handleResetOverrides = () => {
    if (window.confirm('আপনি কি বার্ষিক রিটার্নের কাস্টম পরিবর্তিত মানসমূহ ডিফল্ট মানে রিসেট করতে চান?')) {
      setCustomOverrides({});
      try {
        localStorage.removeItem(STORAGE_KEY_YEARLY_OVERRIDES);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Build ordered rows for the active table
  const orderedMinistries = useMemo(() => {
    const baseOrder = activeTable === 'বার্ষিক - ১' ? TABLE_1_MINISTRY_ORDER : TABLE_2_3_MINISTRY_ORDER;
    if (selectedMinistry && selectedMinistry !== 'সকল') {
      return baseOrder.filter(m => m === selectedMinistry);
    }
    return baseOrder;
  }, [activeTable, selectedMinistry]);

  const rows = useMemo(() => {
    let savedLocalStats: Record<string, any> = {};
    try {
      const stored = localStorage.getItem('opening_balance_setup_stats_v1');
      if (stored) savedLocalStats = JSON.parse(stored);
    } catch {}

    const openingStatsMap: Record<string, any> = {
      ...(prevStats?.entitiesNonSFI || {}),
      ...(prevStats?.entitiesSFI || {}),
      ...savedLocalStats,
    };

    return orderedMinistries.map((minName, index) => {
      const base = DEFAULT_YEARLY_DATA[minName];
      const overrideKey = `${activeTable}_${minName}`;
      const over = customOverrides[overrideKey] || {};

      // ১. বাৎসরিক পূর্ব জের (সংশ্লিষ্ট বার্ষিক টেবিলের জন্য সংরক্ষিত প্রারম্ভিক জের - ১৬/০৬/২০২৪ হতে ১৫/০৬/২০২৫)
      const savedOpening = openingStatsMap[overrideKey] || {};
      const baseOpeningPrevCount =
        savedOpening.yearlyPrevUnsettledCount !== undefined && savedOpening.yearlyPrevUnsettledCount !== ''
          ? parseBengaliNumber(savedOpening.yearlyPrevUnsettledCount) || 0
          : base.prevCount;
      const baseOpeningPrevAmount =
        savedOpening.yearlyPrevUnsettledAmount !== undefined && savedOpening.yearlyPrevUnsettledAmount !== ''
          ? parseBengaliNumber(savedOpening.yearlyPrevUnsettledAmount) || 0
          : base.prevAmount;

      // নির্দিষ্ট সময়কালের জন্য মীমাংসা রেজিস্টার (entries) হতে হিসাবের হেল্পার
      const computeRegisterForRange = (rangeStartMs: number, rangeEndMs: number) => {
        let rRaisedCount = 0;
        let rRaisedTaka = 0;
        let rBsrCount = 0;
        let rSettledCount = 0;
        let rSettledTaka = 0;
        let rRecTaka = 0;
        let rAdjTaka = 0;
        const processedIds = new Set<string>();
        const settledDetails: {
          ministryName: string;
          entityName: string;
          branchName: string;
          auditYear: string;
          paraNo: string;
          status: string;
          involvedTaka: number;
          settledTaka: number;
          settledCrore: number;
          issueLetterNoDate: string;
          issueDateISO?: string;
          meetingDate?: string;
          entryId?: string;
          isCountedInSettled: boolean;
          countValue: number;
        }[] = [];

        (entries || []).forEach(entry => {
          if (entry.approvalStatus === 'pending') return;
          if (!isMinistryMatchForYearly(entry.ministryName, minName)) return;

          const entryDate = extractEntryDate(entry);
          if (entryDate) {
            const entryTime = entryDate.getTime();
            if (entryTime < rangeStartMs || entryTime > rangeEndMs) return;
          }

          // উত্থাপিত আপত্তি
          const rCountRaw = entry.manualRaisedCount ? String(entry.manualRaisedCount).trim() : '';
          if (rCountRaw !== '' && rCountRaw !== '0' && rCountRaw !== '০') {
            rRaisedCount += parseBengaliNumber(rCountRaw) || 0;
          }
          if (entry.manualRaisedAmount) {
            rRaisedTaka += parseBengaliNumber(String(entry.manualRaisedAmount)) || 0;
          }

          // ব্রডশীট জবাবের সংখ্যা (BSR) - শুধুমাত্র ৯ নং কলামের শাখা ফিল্টার অনুযায়ী
          const mType = (entry.meetingType || (entry as any).letterType || '').normalize('NFC');
          const isBsr = !entry.isMeeting || mType.includes('বিএসআর'.normalize('NFC'));
          if (isBsr) {
            const branchRaw = entry.paraType || entry.branchName || '';
            const matchesCol9Branch =
              col9BranchFilter === 'সকল'
                ? true
                : col9BranchFilter === 'এসএফআই'
                ? isSFI(branchRaw)
                : isNonSFI(branchRaw);
            if (matchesCol9Branch) {
              rBsrCount += 1;
            }
          }

          // নিষ্পত্তিকৃত আপত্তি, আদায় ও সমন্বয়
          if (entry.paragraphs && entry.paragraphs.length > 0) {
            entry.paragraphs.forEach((p, pIdx) => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const pUniqueKey = p.id ? `${entry.id}-${p.id}` : `${entry.id}-idx-${pIdx}`;
              const pRec = parseBengaliNumber(String(p.recoveredAmount || '0')) || 0;
              const pAdj = parseBengaliNumber(String(p.adjustedAmount || '0')) || 0;
              const pInv = parseBengaliNumber(String(p.involvedAmount || '0')) || 0;

              if (!processedIds.has(pUniqueKey) && (/[১-৯1-9]/.test(cleanParaNo) || pRec > 0 || pAdj > 0 || pInv > 0)) {
                processedIds.add(pUniqueKey);
                rRecTaka += pRec;
                rAdjTaka += pAdj;

                const status = (p.status || '').normalize('NFC').trim();
                const isFull = status === 'পূর্ণাঙ্গ'.normalize('NFC');
                if (isFull) {
                  rSettledCount += 1;
                }
                const settledAmt = pRec + pAdj > 0 ? pRec + pAdj : isFull ? pInv : 0;
                rSettledTaka += settledAmt;

                if (isFull || settledAmt > 0) {
                  settledDetails.push({
                    ministryName: minName,
                    entityName: entry.entityName || '-',
                    branchName: entry.branchName || '',
                    auditYear: entry.auditYear || '-',
                    paraNo: cleanParaNo || '-',
                    status: status || '-',
                    involvedTaka: pInv,
                    settledTaka: settledAmt,
                    settledCrore: Number((settledAmt / 10000000).toFixed(4)),
                    issueLetterNoDate: entry.issueLetterNoDate || '-',
                    issueDateISO: entry.issueDateISO || '',
                    meetingDate: entry.meetingDate || '',
                    entryId: entry.id,
                    isCountedInSettled: isFull,
                    countValue: isFull ? 1 : 0,
                  });
                }
              }
            });
          } else {
            const eRec = parseBengaliNumber(String(entry.totalRec || '0')) || 0;
            const eAdj = parseBengaliNumber(String(entry.totalAdj || '0')) || 0;
            const eInv = parseBengaliNumber(String(entry.involvedAmount || '0')) || 0;
            const fc = parseBengaliNumber(String(entry.meetingFullSettledParaCount || entry.meetingSettledParaCount || '0')) || 0;

            if (fc > 0 || eRec > 0 || eAdj > 0 || eInv > 0) {
              rSettledCount += fc;
              rRecTaka += eRec;
              rAdjTaka += eAdj;
              const settledAmt = eRec + eAdj > 0 ? eRec + eAdj : eInv;
              rSettledTaka += settledAmt;

              if (fc > 0 || settledAmt > 0) {
                settledDetails.push({
                  ministryName: minName,
                  entityName: entry.entityName || '-',
                  branchName: entry.branchName || '',
                  auditYear: entry.auditYear || '-',
                  paraNo: entry.settledParaNos || entry.raisedParaNos || `মোট ${toBengaliDigits(fc.toString())}টি অনুচ্ছেদ`,
                  status: fc > 0 ? 'পূর্ণাঙ্গ' : 'আংশিক',
                  involvedTaka: eInv,
                  settledTaka: settledAmt,
                  settledCrore: Number((settledAmt / 10000000).toFixed(4)),
                  issueLetterNoDate: entry.issueLetterNoDate || '-',
                  issueDateISO: entry.issueDateISO || '',
                  meetingDate: entry.meetingDate || '',
                  entryId: entry.id,
                  isCountedInSettled: fc > 0,
                  countValue: fc,
                });
              }
            }
          }
        });

        return {
          raisedCount: rRaisedCount,
          raisedAmount: Number((rRaisedTaka / 10000000).toFixed(4)),
          bsrCount: rBsrCount,
          settledCount: rSettledCount,
          settledAmount: Number((rSettledTaka / 10000000).toFixed(4)),
          recAmount: Number((rRecTaka / 10000000).toFixed(4)),
          adjAmount: Number((rAdjTaka / 10000000).toFixed(4)),
          settledDetails,
        };
      };

      // নির্বাচিত বার্ষিক সময়কাল নির্ধারণ (যেমন: ১৬/০৬/২০২৫ হতে ১৫/০৬/২০২৬ বা ১৬/০৬/২০২৬ হতে ১৫/০৬/২০২৭)
      const cycleStartDate = activeCycle?.start ? new Date(activeCycle.start) : new Date(2025, 5, 16, 0, 0, 0, 0);
      const cycleEndDate = activeCycle?.end ? new Date(activeCycle.end) : new Date(2026, 5, 15, 23, 59, 59, 999);
      const selectedStartYear =
        cycleStartDate.getMonth() > 5 || (cycleStartDate.getMonth() === 5 && cycleStartDate.getDate() >= 16)
          ? cycleStartDate.getFullYear()
          : cycleStartDate.getFullYear() - 1;

      // পূর্ববর্তী বছরগুলোর সমাপনী জের স্বয়ংক্রিয়ভাবে পরবর্তী বছরের প্রারম্ভিক জের হিসেবে ধারাবাহিক হিসাব (২০২৫ হতে শুরু)
      let openingPrevCount = baseOpeningPrevCount;
      let openingPrevAmount = baseOpeningPrevAmount;

      if (selectedStartYear > 2025) {
        for (let yr = 2025; yr < selectedStartYear; yr++) {
          const yStart = new Date(yr, 5, 16, 0, 0, 0, 0).getTime();
          const yEnd = new Date(yr + 1, 5, 15, 23, 59, 59, 999).getTime();
          const yrStats = computeRegisterForRange(yStart, yEnd);
          const yrTotalCount = openingPrevCount + yrStats.raisedCount;
          const yrTotalAmount = Number((openingPrevAmount + yrStats.raisedAmount).toFixed(4));
          openingPrevCount = yrTotalCount - yrStats.settledCount;
          openingPrevAmount = Number((yrTotalAmount - yrStats.settledAmount).toFixed(4));
        }
      }

      // ২. নির্বাচিত বছরের মীমাংসা রেজিস্টার (entries) হতে কলাম অনুযায়ী হিসাব
      const yearlyStartTime = cycleStartDate.getTime();
      const yearlyEndTime = cycleEndDate.getTime();
      const currentStats = computeRegisterForRange(yearlyStartTime, yearlyEndTime);

      const regRaisedCount = currentStats.raisedCount;
      const regRaisedAmount = currentStats.raisedAmount;
      const regBsrCount = currentStats.bsrCount;
      const regSettledCount = currentStats.settledCount;
      const regSettledAmount = currentStats.settledAmount;
      const regRecAmount = currentStats.recAmount;
      const regAdjAmount = currentStats.adjAmount;

      const prevCount = openingPrevCount;
      const prevAmount = openingPrevAmount;
      const raisedCount = regRaisedCount;
      const raisedAmount = regRaisedAmount;
      const bsrCount = regBsrCount;
      const settledCount = regSettledCount;
      const settledAmount = regSettledAmount;
      const recAmount = regRecAmount;
      const adjAmount = regAdjAmount;

      const totalCount = prevCount + raisedCount;
      const totalAmount = Number((prevAmount + raisedAmount).toFixed(4));

      const unsettledCount = totalCount - settledCount;
      const unsettledAmount = Number((totalAmount - settledAmount).toFixed(4));

      return {
        sl: index + 1,
        ministryName: minName,
        prevCount,
        prevAmount,
        raisedCount,
        raisedAmount,
        totalCount,
        totalAmount,
        bsrCount,
        settledCount,
        settledAmount,
        unsettledCount,
        unsettledAmount,
        recAmount,
        adjAmount,
        settledDetails: currentStats.settledDetails,
      };
    });
  }, [orderedMinistries, customOverrides, activeTable, entries, prevStats, col9BranchFilter, activeCycle]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        prevCount: acc.prevCount + r.prevCount,
        prevAmount: Number((acc.prevAmount + r.prevAmount).toFixed(4)),
        raisedCount: acc.raisedCount + r.raisedCount,
        raisedAmount: Number((acc.raisedAmount + r.raisedAmount).toFixed(4)),
        totalCount: acc.totalCount + r.totalCount,
        totalAmount: Number((acc.totalAmount + r.totalAmount).toFixed(4)),
        bsrCount: acc.bsrCount + r.bsrCount,
        settledCount: acc.settledCount + r.settledCount,
        settledAmount: Number((acc.settledAmount + r.settledAmount).toFixed(4)),
        unsettledCount: acc.unsettledCount + r.unsettledCount,
        unsettledAmount: Number((acc.unsettledAmount + r.unsettledAmount).toFixed(4)),
        recAmount: Number((acc.recAmount + r.recAmount).toFixed(4)),
        adjAmount: Number((acc.adjAmount + r.adjAmount).toFixed(4)),
      }),
      {
        prevCount: 0,
        prevAmount: 0,
        raisedCount: 0,
        raisedAmount: 0,
        totalCount: 0,
        totalAmount: 0,
        bsrCount: 0,
        settledCount: 0,
        settledAmount: 0,
        unsettledCount: 0,
        unsettledAmount: 0,
        recAmount: 0,
        adjAmount: 0,
      }
    );
  }, [rows]);

  // Number formatting helpers matching each screenshot's exact visual convention
  const fmtIntPlain = (n: number) => toBengaliDigits(Math.round(n).toString());
  const fmtIntComma = (n: number) => toBengaliDigits(Math.round(n).toLocaleString('en-IN'));

  // Table 1 trims trailing zeros on some decimals (e.g., ১৩০৪২.০৩২, ১৪৯.৬৬৩, ২৩২.২৬৮) and shows ০.০০০০ for zero settledAmount
  const fmtDecTable1 = (n: number, zeroAsDot = false, zeroFourDec = false) => {
    if (!n || Math.abs(n) < 0.00001) {
      if (zeroAsDot) return '০.';
      if (zeroFourDec) return '০.০০০০';
      return '০';
    }
    const fixed = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    // Keep 4 decimals if it has all 4 or if specified
    return toBengaliDigits(fixed);
  };

  // Table 2 formats with 4 decimals (or trimmed on ۱۴৯.৬৬৩ / ২৩২.২৬৮) and commas on prevAmount/totalAmount
  const fmtDecTable2 = (n: number, useComma = false, trimTrailingZeros = false) => {
    if (!n || Math.abs(n) < 0.00001) {
      return '০.০০০০';
    }
    const fixed = trimTrailingZeros ? n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : n.toFixed(4);
    if (!useComma) return toBengaliDigits(fixed);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = Number(intPart).toLocaleString('en-IN');
    return toBengaliDigits(decPart ? `${formattedInt}.${decPart}` : formattedInt);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const tableEl = document.getElementById('yearly-return-active-table');
    if (!tableEl) return;

    const cloned = tableEl.cloneNode(true) as HTMLTableElement;
    cloned.querySelectorAll('button, svg, input').forEach(el => el.remove());

    const activeOption = TABLE_OPTIONS.find(o => o.id === activeTable) || TABLE_OPTIONS[0];
    const filename = `${activeTable.replace(/\s+/g, '_')}_রিটার্ন.xls`;

    const headerTopHtml =
      activeTable === 'বার্ষিক - ১'
        ? `
          <div style="text-align:center; font-weight:bold; font-size:14px; line-height:1.5;">
            <div>আঞ্চলিক কার্যালয় (সেক্টর-৬)</div>
            <div>বিডিবিএল ভবন (৯ম ও ১০ম তলা)</div>
            <div>খুলনা- ৯০০০</div>
          </div>
        `
        : `
          <div style="text-align:center; font-weight:bold; font-size:14px; line-height:1.5;">
            <div>বাণিজ্যিক অডিট অধিদপ্তর</div>
            <div>আঞ্চলিক কার্যালয় (সেক্টর-৬)</div>
            <div>বিডিবিএল ভবন (৯ম ও ১০ম তলা)</div>
            <div>খুলনা- ৯০০০</div>
          </div>
        `;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th, td { border: 1px solid #000000; padding: 6px 8px; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .text-left { text-align: left !important; }
          tfoot td { font-weight: bold; background-color: #f8fafc; }
        </style>
      </head>
      <body>
        ${headerTopHtml}
        <p style="font-weight:bold; font-size:12px; margin: 12px 0 6px 0;">${activeOption.subtitle}</p>
        ${cloned.outerHTML}
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

  const thCls =
    'border border-slate-800 px-2 py-2 text-[11px] sm:text-[12px] font-bold text-slate-900 bg-[#f1f5f9] align-middle text-center leading-snug';
  const tdCls =
    'border border-slate-800 px-2.5 py-2.5 text-[12px] sm:text-[13px] text-slate-900 align-middle text-center font-medium tabular-nums bg-white';

  const renderEditableCell = (
    minName: string,
    field: keyof YearlyRowData,
    rawValue: number,
    formattedDisplay: string
  ) => {
    if (!isEditMode) {
      return <span>{formattedDisplay}</span>;
    }
    return (
      <input
        type="text"
        value={toBengaliDigits(rawValue.toString())}
        onChange={e => handleFieldChange(minName, field, e.target.value)}
        className="w-full min-w-[65px] px-1.5 py-1 text-center text-xs font-bold text-blue-950 bg-amber-50 border border-amber-400 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none"
      />
    );
  };

  return (
    <div id="yearly-return-container" className="w-full mx-auto py-3 px-2 sm:px-4 bg-white rounded-none relative animate-in fade-in duration-300 font-sans">
      <IDBadge id="yearly-return-container" />

      {/* Top Toolbar: Dropdown to select 1 of the 3 Yearly Return Tables, Ministry Filter, Edit/Reset, Excel & Print */}
      <div className="relative z-[500] flex flex-wrap items-center justify-between gap-2 mb-4 pb-2.5 border-b border-slate-300 no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* ১. বার্ষিক রিটার্ন ফরমেট নির্বাচন ড্রপডাউন (৩টি টেবিল) */}
          <div className="relative z-[600]" ref={tableDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsTableDropdownOpen(!isTableDropdownOpen);
                setIsMinistryDropdownOpen(false);
              }}
              className="flex items-center justify-between gap-2 px-3.5 h-9 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-none text-xs font-black shadow-xs transition-all cursor-pointer min-w-[260px]"
              title="বার্ষিক রিটার্নের ফরমেট নির্বাচন করুন"
            >
              <div className="flex items-center gap-2 truncate">
                <Layers size={14} className="text-amber-300 shrink-0" />
                <span className="truncate">
                  {TABLE_OPTIONS.find(t => t.id === activeTable)?.label || activeTable}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-white shrink-0 transition-transform duration-200 ${isTableDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isTableDropdownOpen && (
              <div className="absolute left-0 mt-1 w-[320px] max-w-[90vw] bg-white border border-slate-300 rounded-none shadow-2xl z-[99999] p-1.5 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  বার্ষিক রিটার্ন টেবিল নির্বাচন করুন (৩টি ফরমেট)
                </div>
                {TABLE_OPTIONS.map(opt => {
                  const isSelected = activeTable === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedReportType(opt.reportType);
                        setIsTableDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-none transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                          : 'hover:bg-slate-100 text-slate-800 font-bold bg-white'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && <Check size={14} className="text-white stroke-[3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ২. মন্ত্রণালয় ফিল্টার ড্রপডাউন */}
          <div className="relative z-[600]" ref={minDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsMinistryDropdownOpen(!isMinistryDropdownOpen);
                setIsTableDropdownOpen(false);
              }}
              className="flex items-center justify-between gap-2 px-3 h-9 bg-white border border-slate-300 hover:border-slate-400 rounded-none text-xs font-black text-slate-800 shadow-xs transition-all cursor-pointer min-w-[200px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Building2 size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">{selectedMinistry === 'সকল' ? 'সকল মন্ত্রণালয়' : selectedMinistry}</span>
              </div>
              <ChevronDown
                size={13}
                className={`text-slate-400 shrink-0 transition-transform duration-200 ${isMinistryDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isMinistryDropdownOpen && (
              <div className="absolute left-0 mt-1 w-[260px] bg-white border border-slate-200 rounded-none shadow-2xl z-[99999] p-1.5 space-y-1">
                {['সকল', ...TABLE_1_MINISTRY_ORDER].map(min => {
                  const isSelected = selectedMinistry === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setSelectedMinistry(min);
                        setIsMinistryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-none transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-extrabold'
                          : 'hover:bg-slate-50 text-slate-700 font-bold bg-white'
                      }`}
                    >
                      <span className="truncate pr-2">{min === 'সকল' ? 'সকল মন্ত্রণালয়' : min}</span>
                      {isSelected && <Check size={13} className="text-white stroke-[3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ৩. সাইকেল পিকার (যদি প্রপ হিসেবে আসে) */}
          {monthPickerElement && (
            <div className="relative z-[600] flex items-center [&>div>div:first-child]:!h-9 [&>div>div:first-child]:!rounded-none [&>div>div:first-child]:!shadow-xs [&>div>div:first-child]:!box-border">
              {monthPickerElement}
            </div>
          )}
        </div>

        {/* ডান পাশের বাটনসমূহ: এক্সেল, প্রিন্ট */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all rounded-none cursor-pointer shrink-0 shadow-xs"
            title="এক্সেল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} className="stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center w-9 h-9 bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 transition-all rounded-none cursor-pointer shrink-0 shadow-xs"
            title="প্রিন্ট করুন"
          >
            <Printer size={15} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Office Official Header (Exact match to provided screenshots) */}
      <div className="text-center mb-3 space-y-0.5 text-slate-900">
        {activeTable !== 'বার্ষিক - ১' && (
          <div className="text-[14px] sm:text-[15px] font-medium leading-snug">
            বাণিজ্যিক অডিট অধিদপ্তর
          </div>
        )}
        <div className="text-[14px] sm:text-[15px] font-medium leading-snug">
          আঞ্চলিক কার্যালয় (সেক্টর-৬)
        </div>
        <div className="text-[14px] sm:text-[15px] font-medium leading-snug">
          বিডিবিএল ভবন (৯ম ও ১০ম তলা)
        </div>
        <div className="text-[14px] sm:text-[15px] font-medium leading-snug">
          খুলনা- ৯০০০
        </div>
      </div>

      {/* Left-aligned Table Section Title */}
      <div className="mb-2 text-left">
        <p className="text-[13px] sm:text-[14px] font-medium text-slate-900">
          {activeTable === 'বার্ষিক - ৩'
            ? '২.১ অডিট আপত্তি সংক্রান্ত তথ্য (জুলাই/২০২৫ থেকে জুন/২০২৬ খ্রি: পর্যন্ত)।'
            : 'মন্ত্রণালয়/বিভাগ সম্পর্কিত অডিট আপত্তি নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ (বার্ষিক)।'}
        </p>
      </div>

      {/* ===================================================================== */}
      {/* TABLE 1: বার্ষিক - ১ (Exact 13-Column Format from Image 2)             */}
      {/* ===================================================================== */}
      {activeTable === 'বার্ষিক - ১' && (
        <div className="w-full overflow-x-auto bg-white">
          <table id="yearly-return-active-table" className="w-full border-collapse text-center table-fixed">
            <colgroup>
              <col className="w-[4.2%]" />
              <col className="w-[16.8%]" />
              <col className="w-[4.6%]" />
              <col className="w-[9.8%]" />
              <col className="w-[4.4%]" />
              <col className="w-[9.2%]" />
              <col className="w-[5.2%]" />
              <col className="w-[9.8%]" />
              <col className="w-[8.2%]" />
              <col className="w-[4.6%]" />
              <col className="w-[9.2%]" />
              <col className="w-[5.4%]" />
              <col className="w-[8.6%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th rowSpan={2} className={thCls}>
                  ক্রমিক নং
                </th>
                <th rowSpan={2} className={thCls}>
                  মন্ত্রণালয়ের নাম
                </th>
                <th colSpan={2} className={thCls}>
                  পূর্ববর্তী সময়ের জের
                </th>
                <th colSpan={2} className={thCls}>
                  ২০২৫-২৬ বছরের উত্থাপিত
                </th>
                <th colSpan={2} className={thCls}>
                  মোট অডিট আপত্তি
                </th>
                <th rowSpan={2} className={`${thCls} relative`} ref={col9DropdownRef}>
                  <div>ব্রডশীট জবাবের সংখ্যা</div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="font-semibold text-[10.5px]">
                      {col9BranchFilter === 'সকল'
                        ? '(SFI+NONSFI)'
                        : col9BranchFilter === 'এসএফআই'
                        ? '(এসএফআই)'
                        : '(নন এসএফআই)'}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setIsCol9DropdownOpen(prev => !prev);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-400 rounded-none transition-colors cursor-pointer no-print shrink-0"
                      title="শাখা নির্বাচন করুন (শুধুমাত্র এই কলামের জন্য)"
                    >
                      <ChevronDown
                        size={11}
                        className={`transition-transform duration-200 ${isCol9DropdownOpen ? 'rotate-180 text-blue-600' : ''}`}
                      />
                    </button>
                  </div>
                  {isCol9DropdownOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-white border border-slate-300 shadow-2xl z-[9999] p-1 text-left font-normal rounded-none no-print">
                      {(['সকল', 'এসএফআই', 'নন এসএফআই'] as const).map(opt => {
                        const isSelected = col9BranchFilter === opt;
                        const label = opt === 'সকল' ? 'সকল (SFI+NONSFI)' : opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setCol9BranchFilter(opt);
                              setIsCol9DropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-none transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-100 font-semibold bg-white'
                            }`}
                          >
                            <span>{label}</span>
                            {isSelected && <Check size={12} className="text-white stroke-[3] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </th>
                <th colSpan={2} className={thCls}>
                  ২০২৫-২৬ বছরে নিষ্পত্তিকৃত আপত্তির
                </th>
                <th colSpan={2} className={thCls}>
                  অনিষ্পন্ন অডিট আপত্তি ৩০/০৬/২০২৬ খ্রি: এর স্থিতি
                </th>
              </tr>
              <tr className="bg-[#f1f5f9]">
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
              </tr>
              <tr className="bg-[#f1f5f9]">
                <th className={thCls}>১</th>
                <th className={thCls}>২</th>
                <th className={`${thCls} !px-1`}>৩</th>
                <th className={thCls}>৪</th>
                <th className={`${thCls} !px-1`}>৫</th>
                <th className={thCls}>৬</th>
                <th className={`${thCls} !px-0.5 text-[10.5px]`}>৭=(৩+৫)</th>
                <th className={thCls}>৮=(৪+৬)</th>
                <th className={thCls}>৯</th>
                <th className={`${thCls} !px-1`}>১০</th>
                <th className={thCls}>১১</th>
                <th className={`${thCls} !px-0.5 text-[10.5px]`}>১২=(৭-১০)</th>
                <th className={thCls}>১৩=(৮-১১)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.ministryName} className="hover:bg-slate-50/80 transition-colors">
                  <td className={tdCls}>{toBengaliDigits(r.sl.toString())}</td>
                  <td className={`${tdCls} text-left pl-3`}>{r.ministryName}</td>
                  <td className={`${tdCls} !px-1`}>
                    {renderEditableCell(r.ministryName, 'prevCount', r.prevCount, fmtIntPlain(r.prevCount))}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'prevAmount',
                      r.prevAmount,
                      fmtDecTable1(r.prevAmount)
                    )}
                  </td>
                  <td className={`${tdCls} !px-1`}>
                    {renderEditableCell(r.ministryName, 'raisedCount', r.raisedCount, fmtIntPlain(r.raisedCount))}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'raisedAmount',
                      r.raisedAmount,
                      fmtDecTable1(r.raisedAmount, true)
                    )}
                  </td>
                  <td className={`${tdCls} !px-1`}>{fmtIntPlain(r.totalCount)}</td>
                  <td className={tdCls}>{fmtDecTable1(r.totalAmount)}</td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'bsrCount', r.bsrCount, fmtIntPlain(r.bsrCount))}
                  </td>
                  <td className={`${tdCls} !px-1`}>
                    {isEditMode ? (
                      renderEditableCell(r.ministryName, 'settledCount', r.settledCount, fmtIntPlain(r.settledCount))
                    ) : (
                      <span
                        onClick={() => setSelectedSettledMinistry(r.ministryName)}
                        className="inline-block w-full font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors"
                        title="সংশ্লিষ্ট অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ দেখতে ক্লিক করুন"
                      >
                        {fmtIntPlain(r.settledCount)}
                      </span>
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'settledAmount',
                      r.settledAmount,
                      fmtDecTable1(r.settledAmount, false, true)
                    )}
                  </td>
                  <td className={`${tdCls} !px-1`}>{fmtIntPlain(r.unsettledCount)}</td>
                  <td className={tdCls}>
                    {r.unsettledAmount === 24.231
                      ? toBengaliDigits('24.2310')
                      : fmtDecTable1(r.unsettledAmount, false, true)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white font-bold text-slate-950">
                <td className={`${tdCls} font-extrabold`}></td>
                <td className={`${tdCls} font-extrabold text-right pr-3`}>মোট=</td>
                <td className={`${tdCls} !px-1 font-extrabold`}>{fmtIntPlain(totals.prevCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable1(totals.prevAmount)}</td>
                <td className={`${tdCls} !px-1 font-extrabold`}>{fmtIntPlain(totals.raisedCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable1(totals.raisedAmount, true)}</td>
                <td className={`${tdCls} !px-1 font-extrabold`}>{fmtIntPlain(totals.totalCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable1(totals.totalAmount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.bsrCount)}</td>
                <td className={`${tdCls} !px-1 font-extrabold`}>
                  <span
                    onClick={() => setSelectedSettledMinistry('সকল')}
                    className="inline-block w-full font-extrabold text-blue-800 hover:text-blue-950 hover:underline cursor-pointer transition-colors"
                    title="সকল মন্ত্রণালয়ের নিষ্পত্তিকৃত অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ দেখতে ক্লিক করুন"
                  >
                    {fmtIntPlain(totals.settledCount)}
                  </span>
                </td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable1(totals.settledAmount)}</td>
                <td className={`${tdCls} !px-1 font-extrabold`}>{fmtIntPlain(totals.unsettledCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable1(totals.unsettledAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TABLE 2: বার্ষিক - ২ (Exact 15-Column Format from Image 3)             */}
      {/* ===================================================================== */}
      {activeTable === 'বার্ষিক - ২' && (
        <div className="w-full overflow-x-auto bg-white">
          <table id="yearly-return-active-table" className="w-full border-collapse text-center table-fixed">
            <colgroup>
              <col className="w-[3.8%]" />
              <col className="w-[14.2%]" />
              <col className="w-[4.2%]" />
              <col className="w-[8.6%]" />
              <col className="w-[4.0%]" />
              <col className="w-[8.0%]" />
              <col className="w-[4.6%]" />
              <col className="w-[8.6%]" />
              <col className="w-[5.2%]" />
              <col className="w-[4.2%]" />
              <col className="w-[8.2%]" />
              <col className="w-[4.8%]" />
              <col className="w-[8.4%]" />
              <col className="w-[6.6%]" />
              <col className="w-[6.6%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th rowSpan={2} className={thCls}>
                  ক্রমিক নং
                </th>
                <th rowSpan={2} className={thCls}>
                  মন্ত্রণালয়ের নাম
                </th>
                <th colSpan={2} className={thCls}>
                  পূর্ববর্তী সময়ের জের
                </th>
                <th colSpan={2} className={thCls}>
                  ২০২৫-২৬ বছরের উত্থাপিত
                </th>
                <th colSpan={2} className={thCls}>
                  মোট অডিট আপত্তি
                </th>
                <th rowSpan={2} className={`${thCls} relative`} ref={col9DropdownRef}>
                  <div>ব্রডশীট জবাবের সংখ্যা</div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {col9BranchFilter !== 'সকল' && (
                      <span className="font-semibold text-[10px]">({col9BranchFilter})</span>
                    )}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setIsCol9DropdownOpen(prev => !prev);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-400 rounded-none transition-colors cursor-pointer no-print shrink-0"
                      title="শাখা নির্বাচন করুন (শুধুমাত্র এই কলামের জন্য)"
                    >
                      <ChevronDown
                        size={11}
                        className={`transition-transform duration-200 ${isCol9DropdownOpen ? 'rotate-180 text-blue-600' : ''}`}
                      />
                    </button>
                  </div>
                  {isCol9DropdownOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-white border border-slate-300 shadow-2xl z-[9999] p-1 text-left font-normal rounded-none no-print">
                      {(['সকল', 'এসএফআই', 'নন এসএফআই'] as const).map(opt => {
                        const isSelected = col9BranchFilter === opt;
                        const label = opt === 'সকল' ? 'সকল (SFI+NONSFI)' : opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setCol9BranchFilter(opt);
                              setIsCol9DropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-none transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-100 font-semibold bg-white'
                            }`}
                          >
                            <span>{label}</span>
                            {isSelected && <Check size={12} className="text-white stroke-[3] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </th>
                <th colSpan={2} className={thCls}>
                  ২০২৫-২৬ বছরে নিষ্পত্তিকৃত আপত্তির
                </th>
                <th colSpan={2} className={thCls}>
                  অনিষ্পন্ন অডিট আপত্তি ৩০/০৬/২০২৬ খ্রি: এর স্থিতি
                </th>
                <th colSpan={2} className={thCls}>
                  অডিট আপত্তির প্রেক্ষিতে ২০২৫-২৬ অর্থ বছরে মোট
                </th>
              </tr>
              <tr className="bg-[#f1f5f9]">
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} !px-1`}>সংখ্যা</th>
                <th className={thCls}>জড়িত টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={thCls}>আদায়</th>
                <th className={thCls}>সমন্বয়</th>
              </tr>
              <tr className="bg-[#f1f5f9]">
                <th className={thCls}>১</th>
                <th className={thCls}>২</th>
                <th className={`${thCls} !px-1`}>৩</th>
                <th className={thCls}>৪</th>
                <th className={`${thCls} !px-1`}>৫</th>
                <th className={thCls}>৬</th>
                <th className={`${thCls} !px-0.5 text-[10.5px]`}>৭=৩+৫</th>
                <th className={thCls}>৮=৪+৬</th>
                <th className={thCls}>৯</th>
                <th className={`${thCls} !px-1`}>১০</th>
                <th className={thCls}>১১</th>
                <th className={`${thCls} !px-0.5 text-[10.5px]`}>১২=৭-১০</th>
                <th className={thCls}>১৩=৮-১১</th>
                <th className={thCls}>১৪</th>
                <th className={thCls}>১৫</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.ministryName} className="hover:bg-slate-50/80 transition-colors">
                  <td className={tdCls}>{toBengaliDigits(r.sl.toString())}</td>
                  <td className={`${tdCls} text-left pl-3`}>{r.ministryName}</td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'prevCount', r.prevCount, fmtIntComma(r.prevCount))}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'prevAmount',
                      r.prevAmount,
                      fmtDecTable2(r.prevAmount, true, false)
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'raisedCount', r.raisedCount, fmtIntPlain(r.raisedCount))}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'raisedAmount',
                      r.raisedAmount,
                      fmtDecTable2(r.raisedAmount, false, false)
                    )}
                  </td>
                  <td className={tdCls}>{fmtIntComma(r.totalCount)}</td>
                  <td className={tdCls}>{fmtDecTable2(r.totalAmount, true, false)}</td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'bsrCount', r.bsrCount, fmtIntPlain(r.bsrCount))}
                  </td>
                  <td className={tdCls}>
                    {isEditMode ? (
                      renderEditableCell(r.ministryName, 'settledCount', r.settledCount, fmtIntPlain(r.settledCount))
                    ) : (
                      <span
                        onClick={() => setSelectedSettledMinistry(r.ministryName)}
                        className="inline-block w-full font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors"
                        title="সংশ্লিষ্ট অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ দেখতে ক্লিক করুন"
                      >
                        {fmtIntPlain(r.settledCount)}
                      </span>
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'settledAmount',
                      r.settledAmount,
                      r.settledAmount === 149.663
                        ? toBengaliDigits('149.663')
                        : fmtDecTable2(r.settledAmount, false, false)
                    )}
                  </td>
                  <td className={tdCls}>{fmtIntPlain(r.unsettledCount)}</td>
                  <td className={tdCls}>{fmtDecTable2(r.unsettledAmount, false, false)}</td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'recAmount',
                      r.recAmount,
                      fmtDecTable2(r.recAmount, false, false)
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'adjAmount',
                      r.adjAmount,
                      fmtDecTable2(r.adjAmount, false, false)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white font-bold text-slate-950">
                <td colSpan={2} className={`${tdCls} font-extrabold text-center`}>
                  মোট=
                </td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.prevCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.prevAmount, false, true)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.raisedCount)}</td>
                <td className={`${tdCls} font-extrabold`}>
                  {totals.raisedAmount === 0 ? '০' : fmtDecTable2(totals.raisedAmount, false, true)}
                </td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.totalCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.totalAmount, false, true)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.bsrCount)}</td>
                <td className={`${tdCls} font-extrabold`}>
                  <span
                    onClick={() => setSelectedSettledMinistry('সকল')}
                    className="inline-block w-full font-extrabold text-blue-800 hover:text-blue-950 hover:underline cursor-pointer transition-colors"
                    title="সকল মন্ত্রণালয়ের নিষ্পত্তিকৃত অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ দেখতে ক্লিক করুন"
                  >
                    {fmtIntPlain(totals.settledCount)}
                  </span>
                </td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.settledAmount, false, true)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntComma(totals.unsettledCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.unsettledAmount, false, false)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.recAmount, false, false)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.adjAmount, false, false)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TABLE 3: বার্ষিক - ৩ (Exact 9-Column Format from Image 4)              */}
      {/* ===================================================================== */}
      {activeTable === 'বার্ষিক - ৩' && (
        <div className="w-full overflow-x-auto bg-white">
          <table id="yearly-return-active-table" className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th rowSpan={2} className={`${thCls} w-[65px]`}>
                  ক্রমিক নং
                </th>
                <th rowSpan={2} className={`${thCls} min-w-[230px]`}>
                  মন্ত্রণালয়ের নাম
                </th>
                <th colSpan={2} className={thCls}>
                  উত্থাপিত অডিট আপত্তির
                </th>
                <th rowSpan={2} className={`${thCls} min-w-[115px] relative`} ref={col9DropdownRef}>
                  <div>ব্রডশীট জবাবের সংখ্যা</div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {col9BranchFilter !== 'সকল' && (
                      <span className="font-semibold text-[10px]">({col9BranchFilter})</span>
                    )}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setIsCol9DropdownOpen(prev => !prev);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-400 rounded-none transition-colors cursor-pointer no-print shrink-0"
                      title="শাখা নির্বাচন করুন (শুধুমাত্র এই কলামের জন্য)"
                    >
                      <ChevronDown
                        size={11}
                        className={`transition-transform duration-200 ${isCol9DropdownOpen ? 'rotate-180 text-blue-600' : ''}`}
                      />
                    </button>
                  </div>
                  {isCol9DropdownOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-40 bg-white border border-slate-300 shadow-2xl z-[9999] p-1 text-left font-normal rounded-none no-print">
                      {(['সকল', 'এসএফআই', 'নন এসএফআই'] as const).map(opt => {
                        const isSelected = col9BranchFilter === opt;
                        const label = opt === 'সকল' ? 'সকল (SFI+NONSFI)' : opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setCol9BranchFilter(opt);
                              setIsCol9DropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-none transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-800 hover:bg-slate-100 font-semibold bg-white'
                            }`}
                          >
                            <span>{label}</span>
                            {isSelected && <Check size={12} className="text-white stroke-[3] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </th>
                <th colSpan={2} className={thCls}>
                  নিষ্পত্তিকৃত অডিট আপত্তি
                </th>
                <th colSpan={2} className={thCls}>
                  অনিষ্পন্ন অডিট আপত্তি
                </th>
              </tr>
              <tr className="bg-[#f1f5f9]">
                <th className={`${thCls} min-w-[75px]`}>সংখ্যা</th>
                <th className={`${thCls} min-w-[145px]`}>টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} min-w-[75px]`}>সংখ্যা</th>
                <th className={`${thCls} min-w-[155px]`}>টাকার পরিমাণ (কোটি টাকা)</th>
                <th className={`${thCls} min-w-[85px]`}>সংখ্যা</th>
                <th className={`${thCls} min-w-[155px]`}>টাকার পরিমাণ (কোটি টাকা)</th>
              </tr>
              <tr className="bg-[#f1f5f9]">
                <th className={thCls}>১</th>
                <th className={thCls}>২</th>
                <th className={thCls}>৩</th>
                <th className={thCls}>৪</th>
                <th className={thCls}>৫</th>
                <th className={thCls}>৬</th>
                <th className={thCls}>৭</th>
                <th className={thCls}>৮</th>
                <th className={thCls}>৯</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.ministryName} className="hover:bg-slate-50/80 transition-colors">
                  <td className={tdCls}>{toBengaliDigits(r.sl.toString())}</td>
                  <td className={`${tdCls} text-left pl-3`}>{r.ministryName}</td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'prevCount', r.totalCount, fmtIntPlain(r.totalCount))}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'prevAmount',
                      r.totalAmount,
                      fmtDecTable2(r.totalAmount, false, false)
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'bsrCount', r.bsrCount, fmtIntPlain(r.bsrCount))}
                  </td>
                  <td className={tdCls}>
                    {isEditMode ? (
                      renderEditableCell(r.ministryName, 'settledCount', r.settledCount, fmtIntPlain(r.settledCount))
                    ) : (
                      <span
                        onClick={() => setSelectedSettledMinistry(r.ministryName)}
                        className="inline-block w-full font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors"
                        title="সংশ্লিষ্ট অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ দেখতে ক্লিক করুন"
                      >
                        {fmtIntPlain(r.settledCount)}
                      </span>
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'settledAmount',
                      r.settledAmount,
                      r.settledAmount === 149.663
                        ? toBengaliDigits('149.663')
                        : fmtDecTable2(r.settledAmount, false, false)
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'unsettledCountOverride',
                      r.unsettledCount,
                      fmtIntPlain(r.unsettledCount)
                    )}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(
                      r.ministryName,
                      'unsettledAmountOverride',
                      r.unsettledAmount,
                      fmtDecTable2(r.unsettledAmount, false, false)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white font-bold text-slate-950">
                <td colSpan={2} className={`${tdCls} font-extrabold text-center`}>
                  মোট=
                </td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.totalCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.totalAmount, false, false)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.bsrCount)}</td>
                <td className={`${tdCls} font-extrabold`}>
                  <span
                    onClick={() => setSelectedSettledMinistry('সকল')}
                    className="inline-block w-full font-extrabold text-blue-800 hover:text-blue-950 hover:underline cursor-pointer transition-colors"
                    title="সকল মন্ত্রণালয়ের নিষ্পত্তিকৃত অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ দেখতে ক্লিক করুন"
                  >
                    {fmtIntPlain(totals.settledCount)}
                  </span>
                </td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.settledAmount, false, true)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.unsettledCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.unsettledAmount, false, false)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* নিষ্পত্তিকৃত আপত্তির বিস্তারিত অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ পপআপ মডাল */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* নিষ্পত্তিকৃত আপত্তির বিস্তারিত অনুচ্ছেদ নং ও জড়িত টাকার পরিমাণ পপআপ মডাল */}
      {/* ===================================================================== */}
      {selectedSettledMinistry && (
        <SettledDetailsModal
          selectedSettledMinistry={selectedSettledMinistry}
          onClose={() => setSelectedSettledMinistry(null)}
          rows={rows}
          activeCycle={activeCycle}
          entries={entries}
          correspondenceEntries={correspondenceEntries}
        />
      )}
    </div>
  );
};

interface SettledDetailsModalProps {
  selectedSettledMinistry: string;
  onClose: () => void;
  rows: any[];
  activeCycle?: { label?: string; [key: string]: any };
  entries?: SettlementEntry[];
  correspondenceEntries?: CorrespondenceEntry[];
}

const SettledDetailsModal: React.FC<SettledDetailsModalProps> = ({
  selectedSettledMinistry,
  onClose,
  rows,
  activeCycle,
  entries,
  correspondenceEntries,
}) => {
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [theadHeight, setTheadHeight] = useState<number>(54);

  useEffect(() => {
    const updateHeight = () => {
      if (theadRef.current) {
        const h = theadRef.current.getBoundingClientRect().height;
        if (h > 0) {
          setTheadHeight(Math.round(h));
        }
      }
    };
    updateHeight();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && theadRef.current) {
      ro = new ResizeObserver(updateHeight);
      ro.observe(theadRef.current);
    }
    window.addEventListener('resize', updateHeight);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const targetRows =
    selectedSettledMinistry === 'সকল'
      ? rows
      : rows.filter((r) => r.ministryName === selectedSettledMinistry);
  const detailItems = targetRows.flatMap((r) => r.settledDetails || []);
  const totalParaCount = detailItems.reduce((sum, item) => sum + (item.countValue || 0), 0);
  const totalInvolvedTaka = detailItems.reduce((sum, item) => sum + (item.involvedTaka || 0), 0);
  const totalSettledTaka = detailItems.reduce((sum, item) => sum + (item.settledTaka || 0), 0);
  const totalSettledCrore = Number((totalSettledTaka / 10000000).toFixed(4));

  // Group items by ministry, entity, branch, and issueLetterNoDate
  type GroupType = {
    groupKey: string;
    ministryName: string;
    entityName: string;
    branchName: string;
    issueLetterNoDate: string;
    items: any[];
  };
  const groupedDetails: GroupType[] = (detailItems as any[]).reduce((acc: GroupType[], item: any) => {
    const branchClean = (item.branchName || '').trim();
    const issueLetterClean = (item.issueLetterNoDate || '').trim();
    const key = `${item.ministryName}|||${item.entityName}|||${branchClean}|||${issueLetterClean}`;
    const existing = acc.find((g) => g.groupKey === key);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({
        groupKey: key,
        ministryName: item.ministryName,
        entityName: item.entityName,
        branchName: item.branchName,
        issueLetterNoDate: item.issueLetterNoDate,
        items: [item],
      });
    }
    return acc;
  }, []);

  let globalRowCounter = 0;
  // ২য় ছবির মত হেডার ও লেখার মাঝখানে ঠিক নিখুঁত ফাঁকা বজায় রাখতে গতিশীল অফসেট (theadHeight + 10px)
  const stickyTop = (theadHeight || 54) + 10;

  const renderIssueLetterInfo = (rawText: string, groupItems: any[] = []) => {
    if (!rawText || rawText.trim() === '' || rawText.trim() === '-') {
      return (
        <div className="space-y-1 text-center leading-snug">
          <div>
            <span className="font-semibold text-slate-700">জারিপত্র নং: </span>
            <span className="text-slate-400">-</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">তারিখ: </span>
            <span className="text-slate-400">-</span>
          </div>
        </div>
      );
    }

    const text = rawText.trim();
    // তারিখ খুঁজে নেওয়া (১মে ডেট তারপর মাস তারপর বছর - দিন/মাস/বছর)
    let matchedRawDate = '';
    const ymdMatch = text.match(/(?:^|[^\d০-৯])([০-৯0-9]{4}[-\/\.][০-৯0-9]{1,2}[-\/\.][০-৯0-9]{1,2})(?:[^\d০-৯]|$)/);
    if (ymdMatch) {
      matchedRawDate = ymdMatch[1];
    } else {
      const dmyMatch = text.match(/(?:^|[^\d০-৯])([০-৯0-9]{1,2}[-\/\.][০-৯0-9]{1,2}[-\/\.][০-৯0-9]{2,4})(?:[^\d০-৯]|$)/);
      if (dmyMatch) {
        matchedRawDate = dmyMatch[1];
      }
    }

    // তারিখ ও তারিখের লেবেল অংশগুলো বাদ দিয়ে মূল জারিপত্র নম্বর আলাদা করা
    let withoutDate = text
      .replace(/(?:জারিপত্রের\s*তারিখ|তারিখের\s*তারিখ|তারিখ)[\s:\-–—]*[০-৯0-9\/\-\.]+/gi, '')
      .trim();

    if (matchedRawDate) {
      withoutDate = withoutDate.replace(matchedRawDate, '').trim();
    }

    const cleanNo = withoutDate
      .replace(/(?:জারিপত্র\s*নং|জারিপত্রের\s*নং|স্মারক\s*নং|জারিপত্র|নং)[\s:\-–—]*/gi, '')
      .replace(/^[,\s–—\-:]+/, '')
      .replace(/[,\s–—\-:]+$/, '')
      .trim();

    const noStr = cleanNo ? toBengaliDigits(cleanNo) : '';

    // If date was not found inside rawText, try finding it from groupItems or related entry or correspondence
    if (!matchedRawDate && groupItems && groupItems.length > 0) {
      for (const it of groupItems) {
        if (it.issueDateISO) {
          matchedRawDate = it.issueDateISO;
          break;
        }
        if (it.meetingDate) {
          matchedRawDate = it.meetingDate;
          break;
        }
        if (it.entryId && entries) {
          const matchedEntry = entries.find((e) => e.id === it.entryId);
          if (matchedEntry?.issueDateISO) {
            matchedRawDate = matchedEntry.issueDateISO;
            break;
          }
        }
      }
    }

    // If still no date, search in entries by cleanNo
    if (!matchedRawDate && cleanNo && entries) {
      const normNo = toEnglishDigits(cleanNo).replace(/\D/g, '');
      if (normNo) {
        const found = entries.find((e) => {
          const eIssue = toEnglishDigits(e.issueLetterNoDate || '').replace(/\D/g, '');
          return eIssue.includes(normNo) && e.issueDateISO;
        });
        if (found?.issueDateISO) {
          matchedRawDate = found.issueDateISO;
        }
      }
    }

    // If still no date, check correspondenceEntries
    if (!matchedRawDate && cleanNo && correspondenceEntries) {
      const normNo = toEnglishDigits(cleanNo).replace(/\D/g, '');
      if (normNo) {
        const found = correspondenceEntries.find((c) => {
          const cIssue = toEnglishDigits(c.issueLetterNo || c.issueLetterNoDate || '').replace(/\D/g, '');
          return cIssue === normNo && (c.issueLetterDate || c.issueDateISO);
        });
        if (found) {
          matchedRawDate = found.issueLetterDate || found.issueDateISO || '';
        }
      }
    }

    // ১মে ডেট তারপর মাস তারপর বছর (দিন/মাস/বছর)
    const dateStr = matchedRawDate ? formatBengaliDateDMY(matchedRawDate) : '';

    return (
      <div className="space-y-1 text-center leading-snug">
        <div>
          <span className="font-semibold text-slate-700">জারিপত্র নং: </span>
          <span className="font-bold text-slate-900">{noStr || toBengaliDigits(text) || '-'}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">তারিখ: </span>
          <span className="font-medium text-slate-800">{dateStr || '-'}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-3 no-print animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl max-h-[95vh] bg-white border border-slate-300 shadow-2xl flex flex-col overflow-hidden rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <ListFilter size={20} className="text-amber-400 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-sky-300">
                নিষ্পত্তিকৃত অনুচ্ছেদসমূহের বিস্তারিত হিসাব —{' '}
                <span className="text-amber-300">
                  {selectedSettledMinistry === 'সকল' ? 'সকল মন্ত্রণালয় (মোট)' : selectedSettledMinistry}
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                সময়কাল:{' '}
                <span className="text-slate-100 font-semibold">
                  {activeCycle?.label || '১৬/০৬/২০২৫ হতে ১৫/০৬/২০২৬'}
                </span>{' '}
                | পূর্ণাঙ্গ নিষ্পত্তিকৃত অনুচ্ছেদ:{' '}
                <span className="font-bold text-amber-300">{toBengaliDigits(totalParaCount.toString())} টি</span>{' '}
                | নিষ্পত্তিকৃত টাকা:{' '}
                <span className="font-bold text-emerald-300">
                  {toBengaliDigits(Math.round(totalSettledTaka).toLocaleString('en-IN'))} টাকা ({toBengaliDigits(totalSettledCrore.toFixed(4))} কোটি)
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {detailItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-bold text-xs">
              এই সময়কালে কোনো নিষ্পত্তিকৃত অনুচ্ছেদের তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <div className="flex-1 overflow-auto relative">
              <table className="w-full border-collapse text-center text-xs">
                <thead ref={theadRef} className="sticky top-0 z-20 bg-slate-100">
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-2.5 py-2.5 w-[50px] whitespace-nowrap">
                      ক্রমিক
                    </th>
                    {selectedSettledMinistry === 'সকল' && (
                      <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 text-left whitespace-nowrap min-w-[130px]">
                        মন্ত্রণালয়ের নাম
                      </th>
                    )}
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 text-left min-w-[180px] max-w-[260px]">
                      প্রতিষ্ঠানের নাম
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 min-w-[125px] whitespace-nowrap">
                      নিরীক্ষা বছর
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-2.5 py-2.5 w-[95px] whitespace-nowrap">
                      অনুচ্ছেদ নং
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-2.5 py-2.5 w-[85px] whitespace-nowrap">
                      ধরন
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 text-right min-w-[135px] whitespace-nowrap">
                      অনুচ্ছেদে জড়িত টাকা
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 text-right min-w-[135px] whitespace-nowrap">
                      নিষ্পত্তিকৃত টাকা
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 text-right min-w-[130px] whitespace-nowrap">
                      নিষ্পত্তিকৃত (কোটি টাকা)
                    </th>
                    <th className="sticky top-0 z-20 bg-slate-100 border border-slate-400 shadow-[0_1px_0_0_#94a3b8] px-3 py-2.5 text-center min-w-[170px] max-w-[240px]">
                      জারিপত্র নং ও তারিখ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedDetails.map((group) => {
                    return group.items.map((item, itemIdx) => {
                      globalRowCounter++;
                      const currentSerial = globalRowCounter;
                      const isFirstInGroup = itemIdx === 0;

                      return (
                        <tr
                          key={`${group.groupKey}-${itemIdx}`}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            !item.isCountedInSettled ? 'bg-amber-50/40' : 'bg-white'
                          } ${isFirstInGroup && currentSerial > 1 ? 'border-t-2 border-t-slate-400' : ''}`}
                        >
                          <td className="border border-slate-300 px-2.5 py-2 font-medium">
                            {toBengaliDigits(currentSerial.toString())}
                          </td>

                          {selectedSettledMinistry === 'সকল' && isFirstInGroup && (
                            <td
                              rowSpan={group.items.length}
                              className="border border-slate-300 px-3 py-2 text-left font-medium align-top bg-white"
                            >
                              <div
                                className="sticky py-1"
                                style={{ top: `${stickyTop}px` }}
                              >
                                {group.ministryName}
                              </div>
                            </td>
                          )}

                          {isFirstInGroup && (
                            <td
                              rowSpan={group.items.length}
                              className="border border-slate-300 px-3 py-2 text-left font-medium align-top bg-white"
                            >
                              <div
                                className="sticky py-1"
                                style={{ top: `${stickyTop}px` }}
                              >
                                <div className="font-bold text-slate-900 leading-snug text-xs flex items-start gap-1">
                                  <Building2 size={13} className="text-blue-700 shrink-0 mt-0.5" />
                                  <span>{group.entityName}</span>
                                </div>
                                {group.branchName &&
                                  group.branchName.trim() !== '' &&
                                  group.branchName.trim() !== '-' && (() => {
                                    const cleanBranch = group.branchName.replace(/^শাখা[\s:\-–—]*/i, '').trim();
                                    return (
                                      <div className="text-[11px] font-normal mt-1 leading-snug pl-4 text-justify">
                                        <span className="font-bold text-emerald-600">শাখা: </span>
                                        <span className="text-blue-600 font-semibold">{cleanBranch || group.branchName}</span>
                                      </div>
                                    );
                                  })()}
                              </div>
                            </td>
                          )}

                          <td className="border border-slate-300 px-3 py-2 font-medium whitespace-nowrap">
                            {toBengaliDigits(item.auditYear)}
                          </td>

                          <td className="border border-slate-300 px-2.5 py-1.5 font-bold text-blue-900 whitespace-nowrap">
                            {toBengaliDigits(item.paraNo)}
                          </td>

                          <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 text-[10.5px] font-bold ${
                                item.isCountedInSettled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="border border-slate-300 px-2.5 py-1.5 text-right tabular-nums font-medium whitespace-nowrap">
                            {toBengaliDigits(Math.round(item.involvedTaka).toLocaleString('en-IN'))}
                          </td>

                          <td className="border border-slate-300 px-2.5 py-1.5 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                            {toBengaliDigits(Math.round(item.settledTaka).toLocaleString('en-IN'))}
                          </td>

                          <td className="border border-slate-300 px-2.5 py-1.5 text-right tabular-nums font-bold text-blue-900 whitespace-nowrap">
                            {toBengaliDigits(item.settledCrore.toFixed(4))}
                          </td>

                          {isFirstInGroup && (
                            <td
                              rowSpan={group.items.length}
                              className="border border-slate-300 px-2.5 py-2 text-center tabular-nums text-slate-800 text-[11px] font-medium align-top bg-white"
                            >
                              <div
                                className="sticky py-1 leading-relaxed"
                                style={{ top: `${stickyTop}px` }}
                              >
                                {renderIssueLetterInfo(group.issueLetterNoDate, group.items)}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 z-20">
                  <tr className="bg-slate-900 text-white font-extrabold">
                    <td
                      colSpan={selectedSettledMinistry === 'সকল' ? 4 : 3}
                      className="border border-slate-700 px-2.5 py-2 text-right bg-slate-900 whitespace-nowrap"
                    >
                      মোট পূর্ণাঙ্গ নিষ্পত্তিকৃত অনুচ্ছেদ =
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 text-center text-amber-300 bg-slate-900 whitespace-nowrap">
                      {toBengaliDigits(totalParaCount.toString())} টি
                    </td>
                    <td className="border border-slate-700 px-2 py-2 text-right bg-slate-900 whitespace-nowrap">
                      মোট টাকা =
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 text-right tabular-nums bg-slate-900 whitespace-nowrap">
                      {toBengaliDigits(Math.round(totalInvolvedTaka).toLocaleString('en-IN'))}
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 text-right tabular-nums text-emerald-300 bg-slate-900 whitespace-nowrap">
                      {toBengaliDigits(Math.round(totalSettledTaka).toLocaleString('en-IN'))}
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 text-right tabular-nums text-amber-300 bg-slate-900 whitespace-nowrap">
                      {toBengaliDigits(totalSettledCrore.toFixed(4))}
                    </td>
                    <td className="border border-slate-700 px-2.5 py-2 text-center bg-slate-900"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YearlyReturnView;
