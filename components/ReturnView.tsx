import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import { SettlementEntry, CumulativeStats, MinistryPrevStats } from '../types';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP, ENTRY_START_DATE } from '../constants';
import { Printer, ChevronDown, Check, CalendarDays, CalendarSearch, PieChart, ArrowRightCircle, CheckCircle2, Search, X, LayoutGrid, Sparkles, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { addMonths, format as dateFnsFormat, endOfDay, startOfDay } from 'date-fns';
import { getCycleForDate } from '../utils/cycleHelper';
import { isSFI, isNonSFI } from '../utils/branchUtils';
import DDSirCorrespondenceReturn from './DDSirCorrespondenceReturn';
import CorrespondenceDhakaReturn from './CorrespondenceDhakaReturn';
import OpeningBalanceSetup from './OpeningBalanceSetup';
import ReturnSummaryTable from './ReturnSummaryTable';
import QR_1 from './QR_1';
import QR_2 from './QR_2';
import QR_3 from './QR_3';
import QR_4 from './QR_4';
import QR_5 from './QR_5';
import QR_6 from './QR_6';
import BSRMonthlySettlementDetail from './BSRMonthlySettlementDetail';
import BilateralMonthlySettlementDetail from './BilateralMonthlySettlementDetail';
import BSRMonthlyOnlineReceiptDetail from './BSRMonthlyOnlineReceiptDetail';
import BilateralMonthlyOnlineReceiptDetail from './BilateralMonthlyOnlineReceiptDetail';
import { CustomPeriodReceiptReport } from './CustomPeriodReceiptReport';

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

interface ReturnViewProps {
  entries: SettlementEntry[];
  correspondenceEntries?: any[];
  cycleLabel: string;
  onDownloadPDF?: () => void;
  isGeneratingPDF?: boolean;
  prevStats: CumulativeStats;
  setPrevStats: (stats: CumulativeStats) => void;
  onDemoLoad?: () => void;
  onJumpToRegister?: () => void;
  isLayoutEditable?: boolean;
  resetKey?: number;
  isAdmin?: boolean;
  selectedReportType: string | null;
  setSelectedReportType: (type: string | null) => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  activeTab?: string;
  periodOpeningBalances: any[];
  setPeriodOpeningBalances: (balances: any[]) => void;
  onEdit?: (entry: any) => void;
}

const ReturnView: React.FC<ReturnViewProps> = ({ 
  entries, correspondenceEntries = [], cycleLabel, prevStats, setPrevStats, 
  isLayoutEditable, resetKey, onDemoLoad, onJumpToRegister, isAdmin,
  selectedReportType, setSelectedReportType,
  showFilters, setShowFilters,
  activeTab,
  periodOpeningBalances, setPeriodOpeningBalances,
  onEdit
}) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [tempPrevStats, setTempPrevStats] = useState<Record<string, MinistryPrevStats>>({});
  
  const [selectedCycleDate, setSelectedCycleDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date(selectedCycleDate));
  const [showDetailedBsrView, setShowDetailedBsrView] = useState(true);
  const [showDetailedBilateralView, setShowDetailedBilateralView] = useState(true);
  const [showDetailedOnlineBsrView, setShowDetailedOnlineBsrView] = useState(true);
  const [showDetailedOnlineBilateralView, setShowDetailedOnlineBilateralView] = useState(true);
  
  useEffect(() => {
    setCurrentViewDate(new Date(selectedCycleDate));
  }, [selectedCycleDate]);

  useEffect(() => {
    if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর') {
      setShowDetailedBsrView(true);
    }
    if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়') {
      setShowDetailedBilateralView(true);
    }
    if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর') {
      setShowDetailedOnlineBsrView(true);
    }
    if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়') {
      setShowDetailedOnlineBilateralView(true);
    }
  }, [selectedReportType]);
  
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMinistry, setFilterMinistry] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const downloadExcel = useCallback(() => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) {
      return;
    }

    let tablesHtml = '';
    tables.forEach((table, tableIdx) => {
      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      
      // Remove any interactive buttons, icons, or non-print elements inside the cloned table
      const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
      interactiveElements.forEach(el => el.remove());
      
      tablesHtml += `
        <div style="margin-bottom: 40px;">
          ${tableIdx > 0 ? '<br><hr><br>' : ''}
          ${clonedTable.outerHTML}
        </div>
      `;
    });

    const filename = `${selectedReportType ? selectedReportType.replace(/[:|*?"<>\\/]/g, '_') : 'রিপোর্ট'}_${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.xls`;

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
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', 'Calibri', sans-serif;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
            text-align: center;
            font-size: 11px;
            vertical-align: middle;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: bold !important;
          }
          .bg-slate-200, thead, tfoot {
            background-color: #e2e8f0 !important;
            font-weight: bold !important;
          }
          .bg-sky-100 {
            background-color: #e0f2fe !important;
          }
          .bg-amber-50 {
            background-color: #fef3c7 !important;
          }
          .bg-black {
            background-color: #090d16 !important;
            color: #ffffff !important;
          }
          tfoot td {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: bold !important;
          }
          .text-left {
            text-align: left !important;
          }
          .text-right {
            text-align: right !important;
          }
          .font-black, .font-extrabold {
            font-weight: 900 !important;
          }
          .font-bold {
            font-weight: 700 !important;
          }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${selectedReportType || 'রিপোর্ট'}</h2>
        ${tablesHtml}
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
  }, [selectedReportType]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const ministryDropdownRef = useRef<HTMLDivElement>(null);

  const ministryGroups = useMemo(() => ['আর্থিক প্রতিষ্ঠান বিভাগ', 'পাট মন্ত্রণালয়', 'বস্ত্র মন্ত্রণালয়', 'শিল্প মন্ত্রণালয়', 'বিমান ও পর্যটন মন্ত্রণালয়', 'বাণিজ্য মন্ত্রণালয়'], []);

  useEffect(() => {
    if (resetKey && resetKey > 0) {
      setSelectedReportType(null);
      setIsSetupMode(false);
      setSelectedCycleDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
  }, [resetKey, setSelectedReportType]);

  useEffect(() => {
    if (selectedReportType?.includes('প্রারম্ভিক জের সেটআপ')) {
      setIsSetupMode(true);
    } else if (selectedReportType?.startsWith('সময়কাল ভিত্তিক প্রারম্ভিক জের সেটআপ')) {
      setIsSetupMode(true);
    } else if (selectedReportType !== null) {
      setIsSetupMode(false);
    }
  }, [selectedReportType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCycleDropdownOpen(false);
      }
      if (ministryDropdownRef.current && !ministryDropdownRef.current.contains(event.target as Node)) {
        setIsMinistryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Lock scroll when dropdown is open without hiding scrollbars/layout flickering
    if (isCycleDropdownOpen || isMinistryDropdownOpen) {
      document.body.setAttribute('data-scroll-locked', 'true');
    } else {
      document.body.removeAttribute('data-scroll-locked');
    }
    return () => {
      document.body.removeAttribute('data-scroll-locked');
    };
  }, [isCycleDropdownOpen, isMinistryDropdownOpen]);

  const cycleOptions = useMemo(() => {
    const options = [];
    const seen = new Set<string>();
    const today = new Date();
    
    const isQuarterly = selectedReportType?.includes('ত্রৈমাসিক');
    const isHalfYearly = selectedReportType?.includes('ষাণ্মাসিক');
    const isYearly = selectedReportType?.includes('বাৎসরিক');

    if (isQuarterly) {
      // Loop back about 24 months to find all quarters in the last 2 years.
      for (let i = -2; i < 24; i++) {
        const refDate = addMonths(today, -i);
        const month = refDate.getMonth(); // 0 to 11
        const year = refDate.getFullYear();
        
        let quarterStartMonth = 0;
        let quarterEndMonth = 2;
        let quarterYear = year;

        if (month >= 0 && month <= 2) {
          quarterStartMonth = 0; // Jan
          quarterEndMonth = 2;   // Mar
        } else if (month >= 3 && month <= 5) {
          quarterStartMonth = 3; // Apr
          quarterEndMonth = 5;   // Jun
        } else if (month >= 6 && month <= 8) {
          quarterStartMonth = 6; // Jul
          quarterEndMonth = 8;   // Sep
        } else {
          quarterStartMonth = 9; // Oct
          quarterEndMonth = 11;  // Dec
        }

        const startMonthName = BENGALI_MONTHS[quarterStartMonth];
        const endMonthName = BENGALI_MONTHS[quarterEndMonth];
        
        const startYearShort = dateFnsFormat(new Date(quarterYear, quarterStartMonth, 1), 'yy');
        const endYearShort = dateFnsFormat(new Date(quarterYear, quarterEndMonth, 1), 'yy');

        const label = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;
        
        if (!seen.has(label)) {
          if (quarterYear < 2026 || (quarterYear === 2026 && quarterStartMonth < 3)) {
            continue;
          }
          seen.add(label);
          const reprDate = new Date(quarterYear, quarterStartMonth, 1);
          const cycle = getCycleForDate(reprDate);
          options.push({ date: reprDate, label, cycleLabel: cycle.label });
        }
      }
    } else if (isHalfYearly) {
      // Half-Yearly: 6-month cycles (Jan to Jun, Jul to Dec)
      for (let i = -2; i < 24; i++) {
        const refDate = addMonths(today, -i);
        const month = refDate.getMonth();
        const year = refDate.getFullYear();

        let halfStartMonth = 0;
        let halfEndMonth = 5;
        if (month >= 6) {
          halfStartMonth = 6;
          halfEndMonth = 11;
        }

        const startMonthName = BENGALI_MONTHS[halfStartMonth];
        const endMonthName = BENGALI_MONTHS[halfEndMonth];

        const startYearShort = dateFnsFormat(new Date(year, halfStartMonth, 1), 'yy');
        const endYearShort = dateFnsFormat(new Date(year, halfEndMonth, 1), 'yy');

        const label = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;

        if (!seen.has(label)) {
          if (year < 2026 || (year === 2026 && halfStartMonth < 3)) {
            continue;
          }
          seen.add(label);
          const reprDate = new Date(year, halfStartMonth, 1);
          const cycle = getCycleForDate(reprDate);
          options.push({ date: reprDate, label, cycleLabel: cycle.label });
        }
      }
    } else if (isYearly) {
      // Yearly: 12-month cycles (Jan to Dec)
      for (let i = -1; i < 10; i++) {
        const refDate = addMonths(today, -i * 12);
        const year = refDate.getFullYear();

        const label = `${BENGALI_MONTHS[0]}/${toBengaliDigits(dateFnsFormat(new Date(year, 0, 1), 'yy'))} হতে ${BENGALI_MONTHS[11]}/${toBengaliDigits(dateFnsFormat(new Date(year, 11, 1), 'yy'))}`;

        if (!seen.has(label)) {
          if (year < 2026) {
            continue;
          }
          seen.add(label);
          const reprDate = new Date(year, 0, 1);
          const cycle = getCycleForDate(reprDate);
          options.push({ date: reprDate, label, cycleLabel: cycle.label });
        }
      }
    } else {
      // Monthly!
      // Loop back about 24 months to find all months in the last 2 years.
      for (let i = -2; i < 24; i++) {
        const refDate = addMonths(today, -i);
        const month = refDate.getMonth(); // 0 to 11
        const year = refDate.getFullYear();

        const monthName = BENGALI_MONTHS[month];
        const label = `${monthName}/${toBengaliDigits(year.toString())}`;

        if (!seen.has(label)) {
          if (year < 2026 || (year === 2026 && month < 3)) {
            continue;
          }
          seen.add(label);
          const reprDate = new Date(year, month, 1);
          const cycle = getCycleForDate(reprDate);
          options.push({ date: reprDate, label, cycleLabel: cycle.label });
        }
      }
    }
    return options;
  }, [selectedReportType]);

  const activeCycle = useMemo(() => getCycleForDate(selectedCycleDate), [selectedCycleDate]);

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const calculateRecursiveOpening = useCallback((entityName: string, cycleStart: Date, paraType: 'এসএফআই' | 'নন এসএফআই' = 'এসএফআই') => {
    const cycleStartStr = dateFnsFormat(cycleStart, 'yyyy-MM-dd');
    const activeLabelCanon = toEnglishDigits(activeCycle.label).trim();
    
    // 1. Check for EXACT period match (Start Date matches Cycle Start)
    const exactMatch = periodOpeningBalances.find(pb => pb.startDate === cycleStartStr);
    if (exactMatch) {
      const stats = isSFI(paraType) ? exactMatch.stats.entitiesSFI[entityName] : exactMatch.stats.entitiesNonSFI[entityName];
      // If an exact match for this period exists, we use it. 
      // If this specific branch (SFI/Non-SFI) is missing, we treat it as 0, not "not found".
      return stats || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
    }

    let baseMap = isSFI(paraType) ? prevStats.entitiesSFI : prevStats.entitiesNonSFI;
    let effectiveEntryStartDate = ENTRY_START_DATE;

    const base = baseMap[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
    
    let filteredPotential = [...entries, ...correspondenceEntries];
    if (selectedReportType?.startsWith('ত্রৈমাসিক রিটার্ন')) {
      filteredPotential = filteredPotential.filter(e => {
        const mType = robustNormalize(e.meetingType || e.letterType || '');
        return mType.includes(robustNormalize('বিএসআর')) || 
               mType.includes(robustNormalize('দ্বিপক্ষীয়')) || 
               mType.includes(robustNormalize('দ্বিপাক্ষিক')) || 
               mType.includes(robustNormalize('ত্রিপক্ষীয়')) ||
               e.isMeeting;
      });
    } else if (selectedReportType?.includes('বিএসআর')) {
      filteredPotential = filteredPotential.filter(e => {
        const meetingType = e.meetingType || e.letterType || '';
        return !e.isMeeting || meetingType.includes('বিএসআর');
      });
    } else if (selectedReportType?.includes('দ্বিপক্ষীয়')) {
      filteredPotential = filteredPotential.filter(e => {
        const meetingType = e.meetingType || e.letterType || '';
        return e.isMeeting && (meetingType.includes('দ্বিপক্ষীয়') || meetingType.includes('দ্বিপাক্ষিক'));
      });
    }

    if (selectedReportType?.includes('অনলাইন প্রাপ্তি')) {
      filteredPotential = filteredPotential.filter(e => e.isSentOnline === 'হ্যাঁ' || e.isOnline === 'হ্যাঁ');
    }

    const pastEntries = filteredPotential.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;
        
        const labelMatch = e.cycleLabel && toEnglishDigits(e.cycleLabel).trim() === activeLabelCanon;
        if (labelMatch) return false;
        
        const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
        if (entryDate !== '' && entryDate >= cycleStartStr) return false;
        
        return entryDate !== '' && entryDate >= effectiveEntryStartDate;
    });

    let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
    const processedParaIds = new Set<string>();

    pastEntries.forEach(entry => {
        const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            pastRC += parseBengaliNumber(rCountRaw);
        }
        if (entry.manualRaisedAmount) pastRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

        if (entry.paragraphs && entry.paragraphs.length > 0) {
          entry.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              const status = robustNormalize(p.status || '');
              const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
              if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  pastSC++; 
              }
              pastSA += settledAmt;
            }
          });
        } else {
          const settledAmt = parseBengaliNumber(entry.totalRec || '0') + parseBengaliNumber(entry.totalAdj || '0');
          const sc = parseBengaliNumber(entry.meetingFullSettledParaCount || '0');
          pastSC += sc;
          pastSA += settledAmt;
        }
    });

    return {
        unsettledCount: Math.max(0, base.unsettledCount + pastRC),
        unsettledAmount: Math.max(0, base.unsettledAmount + Math.round(pastRA)),
        settledCount: base.settledCount + pastSC,
        settledAmount: base.settledAmount + Math.round(pastSA)
    };
  }, [entries, correspondenceEntries, activeCycle, prevStats, selectedReportType]);

  useEffect(() => {
    if (isSetupMode) {
      const rawMasterStats: Record<string, MinistryPrevStats> = {};
      ministryGroups.forEach(m => {
        const entities = MINISTRY_ENTITY_MAP[m] || [];
        entities.forEach(ent => {
          rawMasterStats[ent] = prevStats.entitiesSFI[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        });
      });
      setTempPrevStats(rawMasterStats);
    }
  }, [isSetupMode, prevStats, ministryGroups]);

  const reportData = useMemo(() => {
    const isExcludedReport = !selectedReportType || 
      selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' || 
      selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।';
    if (isExcludedReport) return [];
    const cycleStartStr = dateFnsFormat(activeCycle.start, 'yyyy-MM-dd');
    const cycleEndStr = dateFnsFormat(activeCycle.end, 'yyyy-MM-dd');
    const activeLabelCanon = toEnglishDigits(activeCycle.label).trim();

    return ministryGroups.map(ministryName => {
      const normMinistry = robustNormalize(ministryName);
      const mapKey = Object.keys(MINISTRY_ENTITY_MAP).find(k => robustNormalize(k) === normMinistry);
      const entities = mapKey ? (MINISTRY_ENTITY_MAP[mapKey] || []) : [];
      return {
        ministry: normMinistry,
        entityRows: entities.map(entityName => {
          const normEntity = robustNormalize(entityName);
          const ePrevSFI = calculateRecursiveOpening(entityName, activeCycle.start, 'এসএফআই');
          const ePrevNonSFI = calculateRecursiveOpening(entityName, activeCycle.start, 'নন এসএফআই');
          const ePrev = {
            unsettledCount: ePrevSFI.unsettledCount + ePrevNonSFI.unsettledCount,
            unsettledAmount: ePrevSFI.unsettledAmount + ePrevNonSFI.unsettledAmount,
            settledCount: ePrevSFI.settledCount + ePrevNonSFI.settledCount,
            settledAmount: ePrevSFI.settledAmount + ePrevNonSFI.settledAmount
          };
          const allPotentialEntries = [...entries, ...correspondenceEntries];
          const matchingEntries = allPotentialEntries.filter(e => {
            const eMin = robustNormalize(e.ministryName || '');
            const eEnt = robustNormalize(e.entityName || '');
            if (eMin !== normMinistry || eEnt !== normEntity) return false;
            
            const entryDateRaw = e.issueDateISO || "";
            const entryDate = entryDateRaw.split("T")[0];
            const dateMatch =
              entryDate !== "" &&
              entryDate >= cycleStartStr &&
              entryDate <= cycleEndStr;

            return dateMatch;
          });

          let filteredMatching = matchingEntries;
          if (selectedReportType?.startsWith('ত্রৈমাসিক রিটার্ন')) {
            filteredMatching = filteredMatching.filter(e => {
              const mType = robustNormalize(e.meetingType || e.letterType || '');
              return mType.includes(robustNormalize('বিএসআর')) || 
                     mType.includes(robustNormalize('দ্বিপক্ষীয়')) || 
                     mType.includes(robustNormalize('দ্বিপাক্ষিক')) || 
                     mType.includes(robustNormalize('ত্রিপক্ষীয়')) ||
                     e.isMeeting;
            });
          } else if (selectedReportType.includes('বিএসআর')) {
            filteredMatching = filteredMatching.filter(e => {
              const meetingType = e.meetingType || e.letterType || '';
              return !e.isMeeting || meetingType.includes('বিএসআর');
            });
          } else if (selectedReportType.includes('দ্বিপক্ষীয়')) {
            filteredMatching = filteredMatching.filter(e => {
              const meetingType = e.meetingType || e.letterType || '';
              return e.isMeeting && (meetingType.includes('দ্বিপক্ষীয়') || meetingType.includes('দ্বিপাক্ষিক'));
            });
          }

          if (selectedReportType.includes('অনলাইন প্রাপ্তি')) {
            filteredMatching = filteredMatching.filter(e => e.isSentOnline === 'হ্যাঁ' || e.isOnline === 'হ্যাঁ');
          }

          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0, curSFIC = 0, curNonSFIC = 0, sfiSA = 0, nonSfiSA = 0;
          let sfiBSR = 0, sfiTriWork = 0, sfiTriMin = 0, sfiRecon = 0;
          let nonSfiBSR = 0, nonSfiBiWork = 0, nonSfiBiMin = 0, nonSfiRecon = 0;

          const processedParaIds = new Set<string>();
          filteredMatching.forEach(entry => {
            const isSFI = robustNormalize(entry.paraType || '') === robustNormalize('এসএফআই');
            const rawLT = entry.meetingType || entry.letterType || '';
            const normLT = robustNormalize(rawLT);

            if (entry.paragraphs && entry.paragraphs.length > 0) {
              entry.paragraphs.forEach((p, pIdx) => { 
                const cleanParaNo = String(p.paraNo || '').trim();
                // Use a more robust unique key for tracking processed paragraphs within this entity
                const pUniqueKey = p.id ? `${entry.id}-${p.id}` : `${entry.id}-idx-${pIdx}`;
                
                if (!processedParaIds.has(pUniqueKey) && (/[১-৯1-9]/.test(cleanParaNo) || p.recoveredAmount > 0 || p.adjustedAmount > 0)) {
                  processedParaIds.add(pUniqueKey);
                  const status = robustNormalize(p.status || '');
                  const recovered = parseBengaliNumber(String(p.recoveredAmount || '0'));
                  const adjusted = parseBengaliNumber(String(p.adjustedAmount || '0'));
                  const settledAmt = recovered + adjusted;
                  
                  // CRITICAL: Add to total settled amount regardless of status (Full or Partial)
                  if (settledAmt > 0) {
                    curSA += settledAmt;
                    if (isSFI) sfiSA += settledAmt;
                    else nonSfiSA += settledAmt;
                  }

                  if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                    curFC++; curSC++; 
                    if (isSFI) {
                      curSFIC++;
                      if (normLT.includes(robustNormalize('বিএসআর'))) sfiBSR++;
                      else if (normLT.includes(robustNormalize('ত্রিপক্ষীয়')) || normLT.includes(robustNormalize('ত্রি-সভা'))) {
                        if (normLT.includes(robustNormalize('কার্যপত্র'))) sfiTriWork++;
                        else if (normLT.includes(robustNormalize('বিবরণী')) || normLT.includes(robustNormalize('(বি)')) || normLT.includes(robustNormalize('সভা')) || !!entry.meetingType) sfiTriMin++;
                        else sfiTriWork++;
                      } else if (normLT.includes(robustNormalize('মিলিকরণ'))) sfiRecon++;
                    } else {
                      curNonSFIC++;
                      if (normLT.includes(robustNormalize('বিএসআর'))) nonSfiBSR++;
                      else if (normLT.includes(robustNormalize('দ্বিপক্ষীয়')) || normLT.includes(robustNormalize('দ্বি-সভা'))) {
                        if (normLT.includes(robustNormalize('কার্যপত্র'))) nonSfiBiWork++;
                        else if (normLT.includes(robustNormalize('বিবরণী')) || normLT.includes(robustNormalize('(বি)')) || normLT.includes(robustNormalize('সভা')) || !!entry.meetingType) nonSfiBiMin++;
                        else nonSfiBiWork++;
                      } else if (normLT.includes(robustNormalize('মিলিকরণ'))) nonSfiRecon++;
                    }
                  } else if (status === robustNormalize('আংশিক')) {
                    curPC++;
                  }
                }
              });
            } else {
              const settledAmt = parseBengaliNumber(entry.totalRec || '0') + parseBengaliNumber(entry.totalAdj || '0');
              const fc = parseBengaliNumber(entry.meetingFullSettledParaCount || '0');
              const pc = parseBengaliNumber(entry.meetingPartialSettledParaCount || '0');
              
              // For entries without paragraphs, we still want to count them if they have settled amounts
              if (fc > 0 || pc > 0 || settledAmt > 0) {
                curFC += fc; curPC += pc; curSC += fc;
                if (settledAmt > 0) {
                  curSA += settledAmt;
                  if (isSFI) sfiSA += settledAmt;
                  else nonSfiSA += settledAmt;
                }
              }
            }
            const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
            if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") curRC += parseBengaliNumber(rCountRaw);
            if (entry.manualRaisedAmount) curRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));
          });
          return { 
            entity: entityName, 
            currentRaisedCount: curRC, currentRaisedAmount: curRA,
            currentSettledCount: curSC, currentSettledAmount: curSA,
            currentFullCount: curFC, currentPartialCount: curPC,
            currentSFICount: curSFIC, currentNonSFICount: curNonSFIC,
            currentSFIAmount: sfiSA, currentNonSFIAmount: nonSfiSA,
            sfiBreakdown: { bsr: sfiBSR, triWork: sfiTriWork, triMin: sfiTriMin, recon: sfiRecon },
            nonSfiBreakdown: { bsr: nonSfiBSR, biWork: nonSfiBiWork, biMin: nonSfiBiMin, recon: nonSfiRecon },
            prev: ePrev 
          };
        })
      };
    });
  }, [entries, correspondenceEntries, selectedReportType, calculateRecursiveOpening, activeCycle, ministryGroups]);

  const filteredCorrespondence = useMemo(() => {
    if (selectedReportType !== 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' && selectedReportType !== 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') return [];
    
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedMonthStart = new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth(), 1);
    
    let reportingLimitDate: Date;
    if (selectedMonthStart.getTime() > currentMonthStart.getTime()) {
      // Next month selected: show up to today (Current Status)
      reportingLimitDate = today;
    } else if (selectedMonthStart.getTime() === currentMonthStart.getTime()) {
      // Current month selected: show up to today
      reportingLimitDate = today;
    } else {
      // Past month selected: show up to the end of that month
      reportingLimitDate = new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth() + 1, 0, 23, 59, 59);
    }

    return (correspondenceEntries || []).filter(e => {
      if (!e.diaryDate) return false;
      const diaryDateStr = toEnglishDigits(e.diaryDate);
      const diaryDateObj = startOfDay(new Date(diaryDateStr));
      if (isNaN(diaryDateObj.getTime())) return false;
      
      // Must be received ON OR BEFORE reportingLimitDate
      const isBeforeOrOnReportingDate = diaryDateObj.getTime() <= reportingLimitDate.getTime();
      
      // Exclude specific letter types as requested (Milikaran, Karjapatra)
      const isExcludedType = e.letterType === 'মিলিকরণ' || e.letterType.includes('কার্যপত্র');
      if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' && isExcludedType) return false;

      const rawNo = e.issueLetterNo ? String(e.issueLetterNo).trim() : '';
      const rawDate = e.issueLetterDate ? String(e.issueLetterDate).trim() : '';
      const hasValidNo = rawNo !== '' && rawNo !== '০' && rawNo !== '0' && !rawNo.includes('নং-');
      const hasValidDate = rawDate !== '' && rawDate !== '0000-00-00';
      
      let isIssued = false;
      if (hasValidNo && hasValidDate) {
        isIssued = true;
      }
      
      return isBeforeOrOnReportingDate && !isIssued;
    }).sort((a, b) => new Date(toEnglishDigits(b.diaryDate)).getTime() - new Date(toEnglishDigits(a.diaryDate)).getTime());
  }, [correspondenceEntries, selectedReportType, activeCycle]);

  const grandTotals = useMemo(() => {
    const initial = { 
      pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0, 
      cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0,
      sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0,
      nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0
    };
    if (!reportData || reportData.length === 0) return initial;
    return reportData.reduce((acc, mGroup) => {
      mGroup.entityRows.forEach((row: any) => {
        acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); 
        acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
        acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); 
        acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
        acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
        acc.cSFIC += (row.currentSFICount || 0); acc.cNonSFIC += (row.currentNonSFICount || 0);
        acc.cSFIA += (row.currentSFIAmount || 0); acc.cNonSFIA += (row.currentNonSFIAmount || 0);
        
        acc.sfiBSR += (row.sfiBreakdown?.bsr || 0);
        acc.sfiTriWork += (row.sfiBreakdown?.triWork || 0);
        acc.sfiTriMin += (row.sfiBreakdown?.triMin || 0);
        acc.sfiRecon += (row.sfiBreakdown?.recon || 0);
        
        acc.nonSfiBSR += (row.nonSfiBreakdown?.bsr || 0);
        acc.nonSfiBiWork += (row.nonSfiBreakdown?.biWork || 0);
        acc.nonSfiBiMin += (row.nonSfiBreakdown?.biMin || 0);
        acc.nonSfiRecon += (row.nonSfiBreakdown?.recon || 0);
      });
      return acc;
    }, initial);
  }, [reportData]);

  const statsDataTuple = useMemo(() => {
    if (!selectedReportType) return { statsReportData: [], statsGrandTotals: null };
    
    let targetReportType = selectedReportType;
    if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর') {
      targetReportType = 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর';
    } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়') {
      targetReportType = 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়';
    }

    if (targetReportType === selectedReportType) {
      return { statsReportData: reportData, statsGrandTotals: grandTotals };
    }

    const cycleStartStr = dateFnsFormat(activeCycle.start, 'yyyy-MM-dd');
    const cycleEndStr = dateFnsFormat(activeCycle.end, 'yyyy-MM-dd');

    const calculatedStatsReportData = ministryGroups.map(ministryName => {
      const normMinistry = robustNormalize(ministryName);
      const mapKey = Object.keys(MINISTRY_ENTITY_MAP).find(k => robustNormalize(k) === normMinistry);
      const entities = mapKey ? (MINISTRY_ENTITY_MAP[mapKey] || []) : [];
      return {
        ministry: normMinistry,
        entityRows: entities.map(entityName => {
          const normEntity = robustNormalize(entityName);
          const ePrevSFI = calculateRecursiveOpening(entityName, activeCycle.start, 'এসএফআই');
          const ePrevNonSFI = calculateRecursiveOpening(entityName, activeCycle.start, 'নন এসএফআই');
          const ePrev = {
            unsettledCount: ePrevSFI.unsettledCount + ePrevNonSFI.unsettledCount,
            unsettledAmount: ePrevSFI.unsettledAmount + ePrevNonSFI.unsettledAmount,
            settledCount: ePrevSFI.settledCount + ePrevNonSFI.settledCount,
            settledAmount: ePrevSFI.settledAmount + ePrevNonSFI.settledAmount
          };
          const allPotentialEntries = [...entries, ...correspondenceEntries];
          const matchingEntries = allPotentialEntries.filter(e => {
            const eMin = robustNormalize(e.ministryName || '');
            const eEnt = robustNormalize(e.entityName || '');
            if (eMin !== normMinistry || eEnt !== normEntity) return false;
            
            const entryDateRaw = e.issueDateISO || "";
            const entryDate = entryDateRaw.split("T")[0];
            const dateMatch =
              entryDate !== "" &&
              entryDate >= cycleStartStr &&
              entryDate <= cycleEndStr;

            return dateMatch;
          });

          let filteredMatching = matchingEntries;
          if (targetReportType?.startsWith('ত্রৈমাসিক রিটার্ন')) {
            filteredMatching = filteredMatching.filter(e => {
              const mType = robustNormalize(e.meetingType || e.letterType || '');
              return mType.includes(robustNormalize('বিএসআর')) || 
                     mType.includes(robustNormalize('দ্বিপক্ষীয়')) || 
                     mType.includes(robustNormalize('দ্বিপাক্ষিক')) || 
                     mType.includes(robustNormalize('ত্রিপক্ষীয়')) ||
                     e.isMeeting;
            });
          } else if (targetReportType.includes('বিএসআর')) {
            filteredMatching = filteredMatching.filter(e => {
              const meetingType = e.meetingType || e.letterType || '';
              return !e.isMeeting || meetingType.includes('বিএসআর');
            });
          } else if (targetReportType.includes('দ্বিপক্ষীয়')) {
            filteredMatching = filteredMatching.filter(e => {
              const meetingType = e.meetingType || e.letterType || '';
              return e.isMeeting && (meetingType.includes('দ্বিপক্ষীয়') || meetingType.includes('দ্বিপাক্ষিক'));
            });
          }

          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0, curSFIC = 0, curNonSFIC = 0, sfiSA = 0, nonSfiSA = 0;
          let sfiBSR = 0, sfiTriWork = 0, sfiTriMin = 0, sfiRecon = 0;
          let nonSfiBSR = 0, nonSfiBiWork = 0, nonSfiBiMin = 0, nonSfiRecon = 0;

          const processedParaIds = new Set<string>();
          filteredMatching.forEach(entry => {
            const isSFI = robustNormalize(entry.paraType || '') === robustNormalize('এসএফআই');
            const rawLT = entry.meetingType || entry.letterType || '';
            const normLT = robustNormalize(rawLT);

            if (entry.paragraphs && entry.paragraphs.length > 0) {
              entry.paragraphs.forEach((p, pIdx) => { 
                const cleanParaNo = String(p.paraNo || '').trim();
                const pUniqueKey = p.id ? `${entry.id}-${p.id}` : `${entry.id}-idx-${pIdx}`;
                
                if (!processedParaIds.has(pUniqueKey) && (/[১-৯1-9]/.test(cleanParaNo) || p.recoveredAmount > 0 || p.adjustedAmount > 0)) {
                  processedParaIds.add(pUniqueKey);
                  const settledAmt = p.recoveredAmount + p.adjustedAmount;
                  if (settledAmt > 0) {
                    curSA += settledAmt;
                    if (isSFI) sfiSA += settledAmt;
                    else nonSfiSA += settledAmt;
                  }

                  if (p.recoveredAmount > 0 || p.adjustedAmount > 0) {
                    const status = robustNormalize(p.status || '');
                    if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                      curFC++; curSC++; 
                      if (isSFI) {
                        curSFIC++;
                        if (normLT.includes(robustNormalize('বিএসআর'))) sfiBSR++;
                        else if (normLT.includes(robustNormalize('ত্রিপক্ষীয়')) || normLT.includes(robustNormalize('ত্রি-সভা'))) {
                          if (normLT.includes(robustNormalize('কার্যপত্র'))) sfiTriWork++;
                          else if (normLT.includes(robustNormalize('বিবরণী')) || normLT.includes(robustNormalize('(বি)')) || normLT.includes(robustNormalize('সভা')) || !entry.meetingType) sfiTriMin++;
                          else sfiTriWork++;
                        } else if (normLT.includes(robustNormalize('মিলিকরণ'))) sfiRecon++;
                      } else {
                        curNonSFIC++;
                        if (normLT.includes(robustNormalize('বিএসআর'))) nonSfiBSR++;
                        else if (normLT.includes(robustNormalize('দ্বিপক্ষীয়')) || normLT.includes(robustNormalize('দ্বি-সভা'))) {
                          if (normLT.includes(robustNormalize('কার্যপত্র'))) nonSfiBiWork++;
                          else if (normLT.includes(robustNormalize('বিবরণী')) || normLT.includes(robustNormalize('(বি)')) || normLT.includes(robustNormalize('সভা')) || !entry.meetingType) nonSfiBiMin++;
                          else nonSfiBiWork++;
                        } else if (normLT.includes(robustNormalize('মিলিকরণ'))) nonSfiRecon++;
                      }
                    } else if (status === robustNormalize('আংশিক')) {
                      curPC++;
                    }
                  }
                }
              });
            } else {
              const settledAmt = parseBengaliNumber(entry.totalRec || '0') + parseBengaliNumber(entry.totalAdj || '0');
              const fc = parseBengaliNumber(entry.meetingFullSettledParaCount || '0');
              const pc = parseBengaliNumber(entry.meetingPartialSettledParaCount || '0');
              
              if (fc > 0 || pc > 0 || settledAmt > 0) {
                curFC += fc; curPC += pc; curSC += fc;
                if (settledAmt > 0) {
                  curSA += settledAmt;
                  if (isSFI) sfiSA += settledAmt;
                  else nonSfiSA += settledAmt;
                }
              }
            }
            const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
            if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") curRC += parseBengaliNumber(rCountRaw);
            if (entry.manualRaisedAmount) curRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));
          });
          return { 
            entity: entityName, 
            currentRaisedCount: curRC, currentRaisedAmount: curRA,
            currentSettledCount: curSC, currentSettledAmount: curSA,
            currentFullCount: curFC, currentPartialCount: curPC,
            currentSFICount: curSFIC, currentNonSFICount: curNonSFIC,
            currentSFIAmount: sfiSA, currentNonSFIAmount: nonSfiSA,
            sfiBreakdown: { bsr: sfiBSR, triWork: sfiTriWork, triMin: sfiTriMin, recon: sfiRecon },
            nonSfiBreakdown: { bsr: nonSfiBSR, biWork: nonSfiBiWork, biMin: nonSfiBiMin, recon: nonSfiRecon },
            prev: ePrev 
          };
        })
      };
    });

    const calculatedStatsGrandTotals = calculatedStatsReportData.reduce((acc, mGroup) => {
      mGroup.entityRows.forEach((row: any) => {
        acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); 
        acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
        acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); 
        acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
        acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
        acc.cSFIC += (row.currentSFICount || 0); acc.cNonSFIC += (row.currentNonSFICount || 0);
        acc.cSFIA += (row.currentSFIAmount || 0); acc.cNonSFIA += (row.currentNonSFIAmount || 0);
        
        acc.sfiBSR += (row.sfiBreakdown?.bsr || 0);
        acc.sfiTriWork += (row.sfiBreakdown?.triWork || 0);
        acc.sfiTriMin += (row.sfiBreakdown?.triMin || 0);
        acc.sfiRecon += (row.sfiBreakdown?.recon || 0);
        
        acc.nonSfiBSR += (row.nonSfiBreakdown?.bsr || 0);
        acc.nonSfiBiWork += (row.nonSfiBreakdown?.biWork || 0);
        acc.nonSfiBiMin += (row.nonSfiBreakdown?.biMin || 0);
        acc.nonSfiRecon += (row.nonSfiBreakdown?.recon || 0);
      });
      return acc;
    }, { 
      pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0, 
      cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0,
      sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0,
      nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0
    });

    return { statsReportData: calculatedStatsReportData, statsGrandTotals: calculatedStatsGrandTotals };
  }, [entries, correspondenceEntries, selectedReportType, calculateRecursiveOpening, activeCycle, ministryGroups, reportData, grandTotals]);

  const { statsReportData, statsGrandTotals } = statsDataTuple;

  const handleSaveSetup = () => {
    setPrevStats({ ...prevStats, entitiesSFI: tempPrevStats, entitiesNonSFI: {} });
    setIsSetupMode(false); setSelectedReportType(null); setIsEditingSetup(false);
  };

  const handleSetupPaste = (e: React.ClipboardEvent, startEntity: string, startField: keyof MinistryPrevStats) => {
    if (!isEditingSetup) return;
    e.preventDefault(); const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const allEntities: string[] = [];
    ministryGroups.forEach(m => { (MINISTRY_ENTITY_MAP[m] || []).forEach(ent => allEntities.push(ent)); });
    const startIdx = allEntities.indexOf(startEntity);
    if (startIdx === -1) return;
    
    const isQuarterly = selectedReportType?.includes('ত্রৈমাসিক');
    const fields: (keyof MinistryPrevStats)[] = isQuarterly 
      ? ['unsettledCount', 'settledCount', 'unsettledAmount']
      : ['unsettledCount', 'unsettledAmount', 'settledCount', 'settledAmount'];
      
    const fieldStartIdx = fields.indexOf(startField);
    const newStats = { ...tempPrevStats };
    rows.forEach((row, rowOffset) => {
      const entityIdx = startIdx + rowOffset; if (entityIdx >= allEntities.length) return;
      const entityName = allEntities[entityIdx]; const cells = row.split(/\t/); 
      cells.forEach((cell, cellOffset) => {
        const fieldIdx = fieldStartIdx + cellOffset; if (fieldIdx >= fields.length) return;
        const fieldName = fields[fieldIdx]; const value = parseBengaliNumber(cell.trim());
        newStats[entityName] = { ...(newStats[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), [fieldName]: value };
      });
    });
    setTempPrevStats(newStats);
  };

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div onClick={handleCopy} className="absolute top-0 left-0 -translate-y-full z-[9995] pointer-events-auto no-print">
        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-black text-[9px] bg-black text-white border border-white/30 shadow-2xl transition-all duration-300 hover:scale-150 hover:bg-blue-600 hover:z-[99999] active:scale-95 cursor-copy origin-bottom-left ${copied ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30 !scale-125' : ''}`}>
          {copied ? <><CheckCircle2 size={10} /> COPIED</> : `#${id}`}
        </span>
      </div>
    );
  };

  const monthPickerElement = (
    <div className="relative no-print z-[350]" ref={dropdownRef}>
      <div 
        onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} 
        className={`flex items-center gap-1.5 px-2.5 h-[38px] bg-white border rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-md group shadow-sm ${isCycleDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-300'}`}
      >
         <CalendarDays size={14} className="text-blue-600 shrink-0" />
         <span className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-800 tracking-tight shrink-0 leading-none">
           {cycleOptions.find(o => o.cycleLabel === activeCycle.label)?.label || toBengaliDigits(activeCycle.label)}
         </span>
         <ChevronDown size={13} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isCycleDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </div>
      {isCycleDropdownOpen && (
        <div 
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="absolute top-[calc(100%+4px)] right-0 lg:left-0 w-[240px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-[9999] p-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-[10] mb-2">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <CalendarDays size={11} className="text-blue-500" /> সাইকেল নির্বাচন করুন
            </span>
          </div>
          <div className="max-h-[260px] overflow-y-auto overscroll-contain space-y-1 p-0.5 scrollbar-thin">
            {cycleOptions.map((opt, idx) => {
              const matchesActive = opt.cycleLabel === activeCycle.label;
              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCycleDate(opt.date);
                    setIsCycleDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    matchesActive 
                      ? "bg-blue-600 text-white font-extrabold shadow-md"
                      : "hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold bg-white"
                  }`}
                >
                  <span className="text-[12px]">{opt.label}</span>
                  {matchesActive && <Check size={13} className="text-white stroke-[3.5]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const historicalFilterElement = (
    <div className="flex items-center gap-1.5 no-print shrink-0">
      <div className="flex items-center gap-1.5 animate-in fade-in duration-300 shrink-0">
        {/* COMPACT MINISTRY DROPDOWN */}
        <div className="relative shrink-0 select-none z-[400]" ref={ministryDropdownRef}>
          <div 
             onClick={() => setIsMinistryDropdownOpen(!isMinistryDropdownOpen)}
             className={`flex items-center gap-1.5 px-2.5 h-[38px] bg-sky-50 border hover:border-sky-300 hover:bg-white transition-all rounded-xl cursor-pointer shadow-md select-none ${isMinistryDropdownOpen ? 'border-sky-300 bg-white ring-2 ring-sky-50' : 'border-sky-100'}`}
          >
            <LayoutGrid size={14} className="text-sky-600 shrink-0" />
            <span className="font-extrabold text-[11px] sm:text-[11.5px] text-sky-800 tracking-tight shrink-0 max-w-[140px] sm:max-w-[180px] truncate leading-none">
              {filterMinistry || 'সকল মন্ত্রণালয়'}
            </span>
            <ChevronDown size={13} className={`text-sky-500 shrink-0 transition-transform duration-300 ${isMinistryDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
          </div>

          {isMinistryDropdownOpen && (
            <div 
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="absolute top-[110%] right-0 lg:left-1/2 lg:-translate-x-1/2 w-[220px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2 overscroll-contain animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="p-1 max-h-[300px] overflow-y-auto overscroll-contain no-scrollbar">
                <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <LayoutGrid size={10} /> মন্ত্রণালয় নির্বাচন
                  </span>
                </div>
                <div 
                  onClick={() => { setFilterMinistry(''); setIsMinistryDropdownOpen(false); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-left ${filterMinistry === '' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600 font-bold'}`}
                >
                  <span className="text-[11px]">সকল মন্ত্রণালয়</span>
                  {filterMinistry === '' && <Check size={12} className="text-blue-600 stroke-[3]" />}
                </div>
                {ministryGroups.map((m, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setFilterMinistry(m); setIsMinistryDropdownOpen(false); }}
                    className={`flex items-center justify-between px-3 py-2 mt-0.5 rounded-xl cursor-pointer transition-all duration-200 text-left ${filterMinistry === m ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600 font-bold'}`}
                  >
                    <span className="text-[11px] truncate">{m}</span>
                    {filterMinistry === m && <Check size={12} className="text-blue-600 stroke-[3]" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!selectedReportType && !isSetupMode) {
    return (
      <div id="section-report-selector" className="min-h-[70vh] flex items-center justify-center animate-in fade-in zoom-in duration-700 relative py-4">
        <IDBadge id="section-report-selector" />
        
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] space-y-6 text-center group transition-all duration-500 hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)]">
           <div className="relative inline-block">
             <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
             <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
               <PieChart size={40} strokeWidth={1.5} />
             </div>
             <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-amber-400 text-slate-900 rounded-xl flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
               <Sparkles size={18} fill="currentColor" />
             </div>
           </div>

           <div className="space-y-3">
             <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
               রিটার্ন মডিউলে <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">স্বাগতম</span>
             </h3>
             <p className="text-slate-600 font-bold text-base max-w-lg mx-auto leading-relaxed">
               আপনার কাঙ্ক্ষিত রিটার্ন বা সারাংশের ধরনটি নির্বাচন করে কাজ শুরু করুন। আমরা আপনার তথ্যের সঠিকতা ও নিরাপত্তা নিশ্চিত করি।
             </p>
           </div>

           <div className="pt-4">
             <div className="inline-flex items-center gap-3 px-7 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-500/30 transition-all duration-300 cursor-default group/btn">
               <ArrowRightCircle size={20} className="text-blue-400 group-hover/btn:translate-x-1 transition-transform" />
               বাম পাশের সাইডবার থেকে সিলেক্ট করুন
             </div>
           </div>

           {/* Bottom Stats or Decorative Line */}
           <div className="flex items-center justify-center gap-6 pt-6 opacity-40">
             <div className="h-px w-24 bg-gradient-to-r from-transparent to-slate-400"></div>
             <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-600"></div>
               <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
               <div className="w-2 h-2 rounded-full bg-slate-400"></div>
             </div>
             <div className="h-px w-24 bg-gradient-to-l from-transparent to-slate-400"></div>
           </div>
        </div>
      </div>
    );
  }

  let renderedContent;

  if (selectedReportType === 'চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট') {
    renderedContent = <CustomPeriodReceiptReport entries={correspondenceEntries || []} onBack={() => setSelectedReportType(null)} IDBadge={IDBadge} onEdit={onEdit} isAdmin={isAdmin} />;
  } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') {
    renderedContent = <DDSirCorrespondenceReturn entries={correspondenceEntries} activeCycle={activeCycle} onBack={() => setSelectedReportType(null)} isLayoutEditable={isLayoutEditable} IDBadge={IDBadge} showFilters={showFilters} />;
  } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।') {
    renderedContent = <CorrespondenceDhakaReturn correspondenceEntries={correspondenceEntries} activeCycle={activeCycle} setSelectedReportType={setSelectedReportType} HistoricalFilter={() => null} IDBadge={IDBadge} showFilters={showFilters} />;
  } else if (isSetupMode) {
    renderedContent = <OpeningBalanceSetup 
      ministryGroups={ministryGroups} 
      tempPrevStats={tempPrevStats} 
      setTempPrevStats={setTempPrevStats} 
      isEditingSetup={isEditingSetup} 
      setIsEditingSetup={setIsEditingSetup} 
      handleSaveSetup={handleSaveSetup} 
      handleSetupPaste={handleSetupPaste} 
      setIsSetupMode={setIsSetupMode} 
      setSelectedReportType={setSelectedReportType} 
      IDBadge={IDBadge} 
      setupType={selectedReportType || ''} 
      originalStats={prevStats.entitiesSFI}
    />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ১') {
    renderedContent = <QR_1 entries={entries} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ২') {
    renderedContent = <QR_2 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - বিস্তারিত - ১') {
    renderedContent = <QR_2 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} customTitle="বিস্তারিত - ১" />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - বিস্তারিত - ২') {
    renderedContent = <QR_3 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} customTitle="বিস্তারিত - ২" />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - বিস্তারিত - ৩') {
    renderedContent = <QR_4 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} customTitle="বিস্তারিত - ৩" paraType="নন এসএফআই" />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - বিস্তারিত - ৪') {
    renderedContent = <QR_4 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} customTitle="বিস্তারিত - ৪" paraType="এসএফআই" />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - বিস্তারিত - ৫') {
    renderedContent = <QR_5 entries={entries} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} customTitle="বিস্তারিত - ৫" paraType="নন এসএফআই" />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - বিস্তারিত - ৬') {
    renderedContent = <QR_6 entries={entries} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} customTitle="বিস্তারিত - ৬" paraType="নন এসএফআই" />;
  } else if (selectedReportType?.startsWith('ত্রৈমাসিক রিটার্ন - বিস্তারিত -')) {
    const num = selectedReportType.split(' - ').pop();
    renderedContent = (
      <div className="max-w-4xl mx-auto my-10 p-10 bg-white rounded-2xl border border-slate-100 shadow-xl text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
          <Sparkles size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3">বিস্তারিত - {num}</h2>
        <p className="text-slate-500 font-bold mb-8 max-w-md mx-auto leading-relaxed">
          এই টেবিল বা ছকটির কাজ আপাতত বন্ধ রয়েছে। আপনার পরবর্তী নির্দেশনার অপেক্ষায় প্রস্তুত রাখা হচ্ছে। অন্য টেবিলের কাজ করতে বললে তা এখানে যুক্ত করা হবে।
        </p>
        <button 
          onClick={() => setSelectedReportType(null)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ChevronLeft size={16} /> পেছনে ফিরুন
        </button>
      </div>
    );
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৩') {
    renderedContent = <QR_3 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৪') {
    renderedContent = <QR_4 entries={entries} prevStats={prevStats} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৫') {
    renderedContent = <QR_5 entries={entries} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} />;
  } else if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৬') {
    renderedContent = <QR_6 entries={entries} activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} monthPickerElement={monthPickerElement} />;
  } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর' && showDetailedBsrView) {
    renderedContent = (
      <BSRMonthlySettlementDetail
        entries={entries}
        selectedCycleDate={selectedCycleDate}
        setSelectedCycleDate={setSelectedCycleDate}
        activeCycle={activeCycle}
        cycleOptions={cycleOptions}
        ministryGroups={ministryGroups}
        IDBadge={IDBadge}
        onBack={() => setSelectedReportType(null)}
        onToggleSummaryView={() => setShowDetailedBsrView(false)}
      />
    );
  } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়' && showDetailedBilateralView) {
    renderedContent = (
      <BilateralMonthlySettlementDetail
        entries={entries}
        selectedCycleDate={selectedCycleDate}
        setSelectedCycleDate={setSelectedCycleDate}
        activeCycle={activeCycle}
        cycleOptions={cycleOptions}
        ministryGroups={ministryGroups}
        IDBadge={IDBadge}
        onBack={() => setSelectedReportType(null)}
        onToggleSummaryView={() => setShowDetailedBilateralView(false)}
      />
    );
  } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর' && showDetailedOnlineBsrView) {
    renderedContent = (
      <BSRMonthlyOnlineReceiptDetail
        entries={entries}
        selectedCycleDate={selectedCycleDate}
        setSelectedCycleDate={setSelectedCycleDate}
        activeCycle={activeCycle}
        cycleOptions={cycleOptions}
        ministryGroups={ministryGroups}
        IDBadge={IDBadge}
        onBack={() => setSelectedReportType(null)}
        onToggleSummaryView={() => setShowDetailedOnlineBsrView(false)}
      />
    );
  } else if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়' && showDetailedOnlineBilateralView) {
    renderedContent = (
      <BilateralMonthlyOnlineReceiptDetail
        entries={entries}
        selectedCycleDate={selectedCycleDate}
        setSelectedCycleDate={setSelectedCycleDate}
        activeCycle={activeCycle}
        cycleOptions={cycleOptions}
        ministryGroups={ministryGroups}
        IDBadge={IDBadge}
        onBack={() => setSelectedReportType(null)}
        onToggleSummaryView={() => setShowDetailedOnlineBilateralView(false)}
      />
    );
  } else {
    renderedContent = <ReturnSummaryTable 
      reportData={reportData} 
      grandTotals={grandTotals} 
      activeCycle={activeCycle} 
      selectedReportType={selectedReportType} 
      setSelectedReportType={setSelectedReportType} 
      isAdmin={isAdmin || false} 
      historicalFilterElement={historicalFilterElement} 
      monthPickerElement={monthPickerElement}
      IDBadge={IDBadge} 
      showFilters={showFilters} 
      searchTerm={searchTerm} 
      filterMinistry={filterMinistry} 
      statsReportData={statsReportData}
      statsGrandTotals={statsGrandTotals}
      isSearchExpanded={isSearchExpanded}
      onDownloadExcel={downloadExcel}
      correspondenceEntries={correspondenceEntries}
      onToggleDetailedView={
        selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়'
          ? () => setShowDetailedBilateralView(true)
          : selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর'
          ? () => setShowDetailedOnlineBsrView(true)
          : selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়'
          ? () => setShowDetailedOnlineBilateralView(true)
          : () => setShowDetailedBsrView(true)
      }
    />;
  }

  return (
    <div className="relative w-full">
      {renderedContent}
    </div>
  );
};

export default ReturnView;