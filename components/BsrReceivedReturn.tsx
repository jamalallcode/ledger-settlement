import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Search, 
  X, 
  ChevronDown, 
  Check, 
  FileSpreadsheet, 
  Calendar, 
  CalendarDays,
  Filter, 
  RotateCcw,
  Mail,
  Clock
} from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format as dateFnsFormat } from 'date-fns';

interface BsrReceivedReturnProps {
  correspondenceEntries: any[];
  settlementEntries?: any[];
  activeCycle?: any;
  ministryGroups?: string[];
  onBack?: () => void;
  IDBadge?: React.FC<{ id: string }>;
  showFilters?: boolean;
  isLayoutEditable?: boolean;
}

const BENGALI_MONTHS = [
  { index: 0, name: 'জানুয়ারি' },
  { index: 1, name: 'ফেব্রুয়ারি' },
  { index: 2, name: 'মার্চ' },
  { index: 3, name: 'এপ্রিল' },
  { index: 4, name: 'মে' },
  { index: 5, name: 'জুন' },
  { index: 6, name: 'জুলাই' },
  { index: 7, name: 'আগস্ট' },
  { index: 8, name: 'সেপ্টেম্বর' },
  { index: 9, name: 'অক্টোবর' },
  { index: 10, name: 'নভেম্বর' },
  { index: 11, name: 'ডিসেম্বর' },
];

const BENGALI_WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const cleanStr = toEnglishDigits(dateStr).trim();
  const parts = cleanStr.split(/[-/.]/);
  if (parts.length === 3) {
    let d: number, m: number, y: number;
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
    }
    const fullY = y < 100 ? 2000 + y : y;
    const date = new Date(fullY, m, d);
    if (!isNaN(date.getTime())) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  }
  const fallback = new Date(cleanStr);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  return null;
};

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

const formatDateWithHyphensBN = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear().toString();
  return `${toBengaliDigits(d)}-${toBengaliDigits(m)}-${toBengaliDigits(y)}`;
};

const formatShortDateBN = (dateStr: string | null | undefined): string => {
  const d = parseDate(dateStr);
  if (!d) return dateStr ? toBengaliDigits(dateStr) : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yr = String(d.getFullYear()).slice(-2);
  return `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(yr)}`;
};

const getLetterCategory = (entry: any): string => {
  const lType = robustNormalize(entry.letterType || '');
  const pType = robustNormalize(entry.paraType || '');
  
  if (lType.includes('বিএসআর') || lType.includes('bsr')) {
    if (pType.includes('নন এসএফআই') || pType.includes('non sfi') || pType.includes('non-sfi')) {
      return 'বিএসআর (নন এসএফআই)';
    } else if (pType.includes('এসএফআই') || pType.includes('sfi')) {
      return 'বিএসআর (এসএফআই)';
    }
    return 'বিএসআর (নন এসএফআই)';
  }
  if (lType.includes('দ্বিপক্ষীয়') || lType.includes('দ্বি-পক্ষীয়') || lType.includes('দ্বিপাক্ষিক') || lType.includes('bilateral')) {
    if (lType.includes('কার্যপত্র')) return 'দ্বিপক্ষীয় সভার কার্যপত্র';
    return 'দ্বিপক্ষীয় সভার কার্যবিবরণী';
  }
  if (lType.includes('ত্রিপক্ষীয়') || lType.includes('ত্রি-পক্ষীয়') || lType.includes('ত্রিপাক্ষিক') || lType.includes('trilateral')) {
    if (lType.includes('কার্যপত্র')) return 'ত্রিপক্ষীয় সভার কার্যপত্র';
    return 'ত্রিপক্ষীয় সভার কার্যবিবরণী';
  }
  if (lType.includes('কার্যপত্র')) {
    return 'কার্যপত্র';
  }
  if (lType.includes('কার্যবিবরণী') || lType.includes('বিবরণী')) {
    return 'কার্যবিবরণী';
  }
  if (lType.includes('মিলিকরণ') || lType.includes('মিলকরণ')) {
    return 'মিলিকরণ';
  }
  if (entry.letterType && entry.letterType.trim()) {
    return entry.letterType.trim();
  }
  return 'অন্যান্য পত্রাদি';
};

export const BsrReceivedReturn: React.FC<BsrReceivedReturnProps> = ({
  correspondenceEntries = [],
  settlementEntries = [],
  activeCycle,
  onBack,
  IDBadge,
}) => {
  // Initialize month and year based on activeCycle or current system date
  const initialDate = useMemo(() => {
    if (activeCycle?.end) {
      const d = parseDate(activeCycle.end);
      if (d) return d;
    }
    return new Date();
  }, [activeCycle]);

  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear());
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const [filterBranch, setFilterBranch] = useState<string>('নন এসএফআই');
  const [filterLetterType, setFilterLetterType] = useState<string>('সকল');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dropdown states
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isLetterTypeOpen, setIsLetterTypeOpen] = useState(false);

  const monthRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const letterTypeRef = useRef<HTMLDivElement>(null);

  // Sync viewDate when popover opens or month/year changes
  useEffect(() => {
    if (isMonthOpen) {
      setCurrentViewDate(new Date(selectedYear, selectedMonth, 1));
    }
  }, [isMonthOpen, selectedYear, selectedMonth]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setIsMonthOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
      if (letterTypeRef.current && !letterTypeRef.current.contains(e.target as Node)) {
        setIsLetterTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute start date (1st of selected month) and end date (last day of selected month)
  const { startDate, endDate, dateRangeTitleBN, monthLabelBN } = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0); // Last day of the selected month
    
    const startHyphenBN = formatDateWithHyphensBN(start);
    const endHyphenBN = formatDateWithHyphensBN(end);
    const monthNameBN = BENGALI_MONTHS.find(m => m.index === selectedMonth)?.name || '';
    const yearBN = toBengaliDigits(selectedYear.toString());

    return {
      startDate: start,
      endDate: end,
      dateRangeTitleBN: `${startHyphenBN} হতে ${endHyphenBN} খ্রিঃ তারিখ পর্যন্ত`,
      monthLabelBN: `${monthNameBN}, ${yearBN}`,
    };
  }, [selectedMonth, selectedYear]);

  // Letter type options
  const letterTypeOptions = useMemo(() => {
    const standard = ['সকল', 'বিএসআর', 'দ্বিপক্ষীয় সভা', 'ত্রিপক্ষীয় সভা', 'কার্যপত্র', 'কার্যবিবরণী', 'মিলিকরণ', 'অন্যান্য'];
    const found = new Set<string>();
    correspondenceEntries.forEach(e => {
      if (e.letterType && e.letterType.trim()) {
        found.add(e.letterType.trim());
      }
    });
    return Array.from(new Set([...standard, ...Array.from(found)]));
  }, [correspondenceEntries]);

  // Filtered entries strictly based on Diary Date within selected month (01 to end of month)
  const filteredEntries = useMemo(() => {
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

    return correspondenceEntries.filter(entry => {
      // 1. Diary Date Check (01 of selected month to end of selected month)
      if (!entry.diaryDate) return false;
      const dDate = parseDate(entry.diaryDate);
      if (!dDate) return false;
      const dTime = dDate.getTime();
      if (dTime < startMidnight || dTime > endMidnight) {
        return false;
      }

      // 2. Branch / Para Type Filter
      if (filterBranch !== 'সকল') {
        const pType = robustNormalize(entry.paraType || '');
        const normFilterBranch = robustNormalize(filterBranch);
        if (!pType.includes(normFilterBranch)) {
          return false;
        }
      }

      // 3. Letter Type Filter
      if (filterLetterType !== 'সকল') {
        const lType = robustNormalize(entry.letterType || '');
        const normFilterLetter = robustNormalize(filterLetterType);
        if (!lType.includes(normFilterLetter)) {
          return false;
        }
      }

      // 4. Search Term Filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const desc = (entry.description || '').toLowerCase();
        const diaryNo = (entry.diaryNo || '').toLowerCase();
        const letterNo = (entry.letterNo || '').toLowerCase();
        const archiveNo = (entry.archiveNo || '').toLowerCase();
        const comments = (entry.comments || entry.remarks || '').toLowerCase();
        const minName = (entry.ministryName || '').toLowerCase();

        if (
          !desc.includes(term) &&
          !diaryNo.includes(term) &&
          !letterNo.includes(term) &&
          !archiveNo.includes(term) &&
          !comments.includes(term) &&
          !minName.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [correspondenceEntries, startDate, endDate, filterBranch, filterLetterType, searchTerm]);

  // Grouped and processed rows strictly matching the table in user's image
  const processedTableRows = useMemo(() => {
    // 1. Group items by category (বিবরণ)
    const categoryMap = new Map<string, any[]>();
    
    const categoryOrder = [
      'বিএসআর (নন এসএফআই)',
      'বিএসআর (এসএফআই)',
      'বিএসআর',
      'দ্বিপক্ষীয় সভার কার্যবিবরণী',
      'দ্বিপক্ষীয় সভার কার্যপত্র',
      'দ্বিপক্ষীয় সভা',
      'ত্রিপক্ষীয় সভার কার্যবিবরণী',
      'ত্রিপক্ষীয় সভার কার্যপত্র',
      'ত্রিপক্ষীয় সভা',
      'কার্যপত্র',
      'কার্যবিবরণী',
      'মিলিকরণ',
    ];

    filteredEntries.forEach(entry => {
      const cat = getLetterCategory(entry);
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(entry);
    });

    const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'bn');
    });

    let globalSerial = 1;
    const flatRows: Array<{
      entry: any;
      serial: string;
      category: string;
      showCategory: boolean;
      rowSpan: number;
      letterCountStr: string;
      diaryNoDateDisplay: string;
      paraCount: number;
      disposalDisplay: string;
      settledCount: number;
      unsettledCount: number;
    }> = [];

    let totalParasSum = 0;
    let totalSettledSum = 0;
    let totalUnsettledSum = 0;

    sortedCategories.forEach(cat => {
      const entriesInCat = categoryMap.get(cat)!;

      // Sort entries within category by diaryDate ascending, then diaryNo numeric
      entriesInCat.sort((a, b) => {
        const dateA = parseDate(a.diaryDate)?.getTime() || 0;
        const dateB = parseDate(b.diaryDate)?.getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        const numA = parseInt(toEnglishDigits(a.diaryNo || '0'), 10) || 0;
        const numB = parseInt(toEnglishDigits(b.diaryNo || '0'), 10) || 0;
        return numA - numB;
      });

      entriesInCat.forEach((entry, idx) => {
        const serial = toBengaliDigits((globalSerial++).toString());
        const showCategory = idx === 0;
        const rowSpan = entriesInCat.length;

        // 3. Letter Count formatted as ০১ or ১
        const letterCountStr = toBengaliDigits('০১');

        // 4. Diary No & Date: e.g. "২০৩, ১৪/০১/২৬"
        const diaryNoBN = toBengaliDigits(entry.diaryNo || '');
        const diaryDateShort = formatShortDateBN(entry.diaryDate);
        const diaryNoDateDisplay = diaryNoBN ? `${diaryNoBN}${diaryDateShort ? `, ${diaryDateShort}` : ''}` : '-';

        // 5. Paragraph Count: e.g. "১", "৩", "২৫"
        let paraCount = 1;
        if (entry.totalParas && String(entry.totalParas).trim() !== '') {
          const parsed = parseInt(toEnglishDigits(String(entry.totalParas)), 10);
          if (!isNaN(parsed) && parsed > 0) paraCount = parsed;
        } else if (entry.paragraphs && Array.isArray(entry.paragraphs) && entry.paragraphs.length > 0) {
          paraCount = entry.paragraphs.length;
        }
        totalParasSum += paraCount;

        // 6. Disposal / Issue letter & date: e.g. "চলমান" or "৮৫৬, ২৫/০৮/২৬"
        const hasIssueNo = entry.issueLetterNo && String(entry.issueLetterNo).trim() !== '' && entry.issueLetterNo !== '০';
        const hasIssueDate = entry.issueLetterDate && String(entry.issueLetterDate).trim() !== '' && entry.issueLetterDate !== '০';
        
        let disposalDisplay = 'চলমান';
        if (hasIssueNo || hasIssueDate) {
          const parts: string[] = [];
          if (hasIssueNo) parts.push(toBengaliDigits(entry.issueLetterNo));
          if (hasIssueDate) parts.push(formatShortDateBN(entry.issueLetterDate));
          disposalDisplay = parts.join(', ');
        }

        // 7 & 8. Settled and Unsettled Paras
        let settledCount = 0;
        if (entry.meetingSettledParas !== undefined && entry.meetingSettledParas !== null && String(entry.meetingSettledParas).trim() !== '') {
          settledCount = parseInt(toEnglishDigits(String(entry.meetingSettledParas)), 10) || 0;
        } else if (entry.settledParas && Array.isArray(entry.settledParas)) {
          settledCount = entry.settledParas.length;
        } else if (settlementEntries && settlementEntries.length > 0) {
          const matched = settlementEntries.filter((s: any) => {
            if (s.correspondenceId && s.correspondenceId === entry.id) return true;
            if (s.diaryNo && entry.diaryNo && String(s.diaryNo).trim() === String(entry.diaryNo).trim()) return true;
            return false;
          });
          if (matched.length > 0) {
            matched.forEach((m: any) => {
              if (m.settledParas && Array.isArray(m.settledParas)) {
                settledCount += m.settledParas.length;
              } else if (m.meetingSettledParas) {
                settledCount += parseInt(toEnglishDigits(String(m.meetingSettledParas)), 10) || 0;
              }
            });
          }
        }

        let unsettledCount = 0;
        if (settledCount > 0) {
          unsettledCount = Math.max(0, paraCount - settledCount);
        }

        totalSettledSum += settledCount;
        totalUnsettledSum += unsettledCount;

        flatRows.push({
          entry,
          serial,
          category: cat,
          showCategory,
          rowSpan,
          letterCountStr,
          diaryNoDateDisplay,
          paraCount,
          disposalDisplay,
          settledCount,
          unsettledCount,
        });
      });
    });

    return {
      rows: flatRows,
      totalLetters: flatRows.length,
      totalParasSum,
      totalSettledSum,
      totalUnsettledSum,
    };
  }, [filteredEntries, settlementEntries]);

  // Branch Title Display
  const branchTitleBN = useMemo(() => {
    if (filterBranch === 'নন এসএফআই') return 'শাখাঃ নন এসএফআই।';
    if (filterBranch === 'এসএফআই') return 'শাখাঃ এসএফআই।';
    return 'শাখাঃ সকল শাখা।';
  }, [filterBranch]);

  // Excel Download
  const downloadExcel = () => {
    const table = document.getElementById('table-bsr-received-return-main');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const filename = `Responsible_Party_প্রাপ্ত_পত্রাদির_প্রতিবেদন_${monthLabelBN.replace(/[\s,]+/g, '_')}_${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'SolaimanLipi', 'SutonnyMJ', sans-serif; }
          th, td { border: 1px solid #000000; padding: 6px 8px; text-align: center; font-size: 13px; vertical-align: middle; color: #000000; }
          th { background-color: #ffffff; color: #000000; font-weight: bold; }
          .header-title { font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <table style="width:100%; border:none; margin-bottom:10px;">
          <tr>
            <td style="border:none; text-align:left; font-size:15px; font-weight:bold;">
              Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদনঃ (${dateRangeTitleBN})
            </td>
            <td style="border:none; text-align:right; font-size:15px; font-weight:bold;">
              ${branchTitleBN}
            </td>
          </tr>
        </table>
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

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleResetFilters = () => {
    setFilterBranch('নন এসএফআই');
    setFilterLetterType('সকল');
    setSearchTerm('');
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-900 pb-16">
      {/* Top Header Card (Controls / No-print) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-3 sm:p-4 no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronLeft size={16} />
              <span>পেছনে</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black shadow-inner">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: প্রাপ্ত বিএসআর ও অন্যান্য পত্রাদি
                </h1>
                {IDBadge && <IDBadge id="bsr-received-return" />}
              </div>
              <p className="text-[11px] font-bold text-slate-500">
                Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদন
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>এক্সেল ডাউনলোড</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-3 sm:p-4 no-print space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Simple Month Calendar Control */}
            <div className="relative shrink-0 select-none" ref={monthRef}>
              {/* Main Trigger Button */}
              <button
                type="button"
                onClick={() => setIsMonthOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3 h-[38px] bg-slate-50 border rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  isMonthOpen ? 'border-emerald-600 ring-2 ring-emerald-100 bg-white' : 'border-slate-300 hover:border-emerald-400'
                }`}
              >
                <Calendar size={14} className="text-emerald-600" />
                <span className="text-slate-600 font-semibold">মাস:</span>
                <span className="text-slate-900 font-black">{monthLabelBN}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isMonthOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>

              {/* Simple Standard Calendar Popover */}
              {isMonthOpen && (
                <div className="absolute top-full left-0 mt-2 w-[280px] sm:w-[295px] bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-[1200] animate-in fade-in duration-150 select-none">
                  {/* Calendar Header with < Month Year > */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="পূর্ববর্তী মাস"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span className="font-black text-sm text-slate-800">
                      {BENGALI_MONTHS[currentViewDate.getMonth()].name} {toBengaliDigits(currentViewDate.getFullYear().toString())}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="পরবর্তী মাস"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                    {BENGALI_WEEKDAYS.map((wd, i) => (
                      <span key={i} className="text-[11px] font-black text-slate-400 py-0.5">
                        {wd}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const Y = currentViewDate.getFullYear();
                      const M = currentViewDate.getMonth();
                      const firstDay = new Date(Y, M, 1);

                      // Saturday start (0=Sun -> 1, 6=Sat -> 0)
                      const startOffset = (firstDay.getDay() + 1) % 7;

                      const daysInMonth = new Date(Y, M + 1, 0).getDate();
                      const prevMonthDays = new Date(Y, M, 0).getDate();

                      const cells: Array<{ day: number; isCurrentMonth: boolean; dateObj: Date }> = [];

                      // Trailing days from previous month
                      for (let i = startOffset - 1; i >= 0; i--) {
                        const d = prevMonthDays - i;
                        const dateObj = new Date(Y, M - 1, d);
                        cells.push({ day: d, isCurrentMonth: false, dateObj });
                      }

                      // Current month days
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateObj = new Date(Y, M, d);
                        cells.push({ day: d, isCurrentMonth: true, dateObj });
                      }

                      // Leading days
                      const totalCells = cells.length > 35 ? 42 : 35;
                      const remaining = totalCells - cells.length;
                      for (let d = 1; d <= remaining; d++) {
                        const dateObj = new Date(Y, M + 1, d);
                        cells.push({ day: d, isCurrentMonth: false, dateObj });
                      }

                      const today = new Date();
                      const todayDateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

                      return cells.map((cell, idx) => {
                        const isSelectedMonth = cell.dateObj.getFullYear() === selectedYear && cell.dateObj.getMonth() === selectedMonth;
                        const cellDateStr = `${cell.dateObj.getFullYear()}-${cell.dateObj.getMonth()}-${cell.dateObj.getDate()}`;
                        const isToday = cellDateStr === todayDateStr;

                        let cellCls = "text-[12px] font-bold h-7.5 flex items-center justify-center rounded-lg transition-all cursor-pointer relative ";
                        if (cell.isCurrentMonth && isSelectedMonth && cell.day === 1) {
                          cellCls += "bg-emerald-600 text-white font-extrabold shadow-sm";
                        } else if (cell.isCurrentMonth && isSelectedMonth) {
                          cellCls += "bg-emerald-50 text-emerald-800 font-extrabold";
                        } else if (cell.isCurrentMonth) {
                          cellCls += "text-slate-800 hover:bg-emerald-50 hover:text-emerald-700";
                        } else {
                          cellCls += "text-slate-300 hover:bg-slate-50 hover:text-slate-500";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedYear(cell.dateObj.getFullYear());
                              setSelectedMonth(cell.dateObj.getMonth());
                              setIsMonthOpen(false);
                            }}
                            className={cellCls}
                          >
                            <span>{toBengaliDigits(cell.day.toString())}</span>
                            {isToday && !isSelectedMonth && (
                              <span className="absolute bottom-[2px] w-1 h-1 bg-emerald-600 rounded-full" />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const now = new Date();
                        setSelectedYear(now.getFullYear());
                        setSelectedMonth(now.getMonth());
                        setIsMonthOpen(false);
                      }}
                      className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      চলতি মাস
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMonthOpen(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Branch Filter */}
            <div className="relative" ref={branchRef}>
              <button
                type="button"
                onClick={() => setIsBranchOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 h-[38px] bg-slate-50 border rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  isBranchOpen ? 'border-emerald-600 ring-2 ring-emerald-100 bg-white' : 'border-slate-300 hover:border-emerald-400'
                }`}
              >
                <Filter size={13} className="text-emerald-600" />
                <span className="text-slate-600">শাখা:</span>
                <span className="text-slate-900 font-black">{filterBranch}</span>
                <ChevronDown size={13} className={`text-slate-500 transition-transform duration-200 ${isBranchOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBranchOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-[160px] bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-[1100] animate-in fade-in">
                  {['নন এসএফআই', 'এসএফআই', 'সকল'].map(branch => {
                    const isSelected = filterBranch === branch;
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => {
                          setFilterBranch(branch);
                          setIsBranchOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors ${
                          isSelected ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{branch}</span>
                        {isSelected && <Check size={13} className="text-emerald-600 font-bold" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Letter Type Filter */}
            <div className="relative" ref={letterTypeRef}>
              <button
                type="button"
                onClick={() => setIsLetterTypeOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 h-[38px] bg-slate-50 border rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  isLetterTypeOpen ? 'border-emerald-600 ring-2 ring-emerald-100 bg-white' : 'border-slate-300 hover:border-emerald-400'
                }`}
              >
                <Mail size={13} className="text-emerald-600" />
                <span className="text-slate-600">চিঠির ধরণ:</span>
                <span className="text-slate-900 font-black">{filterLetterType}</span>
                <ChevronDown size={13} className={`text-slate-500 transition-transform duration-200 ${isLetterTypeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLetterTypeOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-[200px] max-h-[260px] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-[1100] animate-in fade-in">
                  {letterTypeOptions.map(lType => {
                    const isSelected = filterLetterType === lType;
                    return (
                      <button
                        key={lType}
                        type="button"
                        onClick={() => {
                          setFilterLetterType(lType);
                          setIsLetterTypeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors ${
                          isSelected ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{lType}</span>
                        {isSelected && <Check size={13} className="text-emerald-600 font-bold" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reset Filters Button */}
            {(filterBranch !== 'নন এসএফআই' || filterLetterType !== 'সকল' || searchTerm) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 h-[38px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                title="ফিল্টার রিসেট করুন"
              >
                <RotateCcw size={13} />
                <span>রিসেট</span>
              </button>
            )}
          </div>

          {/* Right: Search Input & Count Badge */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="খুঁজুন (ডায়েরি, বিবরণ, মন্তব্য)..."
                className="w-full h-[38px] pl-8.5 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="px-3 h-[38px] bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-emerald-800">
                মোট চিঠি: {toBengaliDigits(processedTableRows.totalLetters.toString())} টি
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable & Viewable Report Container */}
      <div 
        id="bsr-received-report-container" 
        className="bg-white p-4 sm:p-6 border border-slate-300 rounded-2xl shadow-sm print:shadow-none print:border-none print:p-0 overflow-visible"
      >
        {/* Title Header matching the requested screenshot */}
        <div className="mb-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
          <h1 className="text-sm sm:text-[15px] font-bold text-black tracking-tight">
            Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদনঃ ({dateRangeTitleBN})
          </h1>
          <div className="text-sm sm:text-[15px] font-bold text-black sm:text-right shrink-0">
            {branchTitleBN}
          </div>
        </div>

        {/* Table View matching the exact column layout from user image */}
        <div className="table-container relative w-full overflow-x-auto pb-2">
          <table 
            id="table-bsr-received-return-main" 
            className="w-full min-w-[980px] border-separate border-spacing-0 text-black text-xs sm:text-[13px] font-sans"
            style={{ borderColor: '#000000' }}
          >
            <thead>
              {/* Row 1: Headers */}
              <tr>
                <th 
                  rowSpan={2} 
                  className="border border-black p-2 font-bold text-center align-middle w-[55px] min-w-[50px] bg-white whitespace-nowrap"
                >
                  ক্রমিক<br />নং
                </th>
                <th 
                  rowSpan={2} 
                  className="border border-black p-2 font-bold text-center align-middle w-[150px] min-w-[140px] bg-white whitespace-nowrap"
                >
                  বিবরণ
                </th>
                <th 
                  rowSpan={2} 
                  className="border border-black p-2 font-bold text-center align-middle w-[110px] min-w-[100px] bg-white whitespace-nowrap"
                >
                  প্রাপ্ত জবাব<br />(পত্র সংখ্যা)
                </th>
                <th 
                  rowSpan={2} 
                  className="border border-black p-2 font-bold text-center align-middle w-[190px] min-w-[170px] bg-white whitespace-nowrap"
                >
                  প্রাপ্ত জবাবের ডায়েরি নং ও তারিখ
                </th>
                <th 
                  rowSpan={2} 
                  className="border border-black p-2 font-bold text-center align-middle w-[95px] min-w-[90px] bg-white whitespace-nowrap"
                >
                  অনুচ্ছেদ<br />সংখ্যা
                </th>
                <th 
                  colSpan={3} 
                  className="border border-black p-1.5 font-bold text-center align-middle bg-white whitespace-nowrap"
                >
                  গৃহীত কার্যক্রম
                </th>
              </tr>

              {/* Row 2: Subheaders under গৃহীত কার্যক্রম */}
              <tr>
                <th className="border border-black p-2 font-bold text-center align-middle w-[190px] min-w-[170px] bg-white whitespace-nowrap">
                  প্রাপ্ত জবাবের Disposal/জারিপত্র ও তারিখ
                </th>
                <th className="border border-black p-2 font-bold text-center align-middle w-[130px] min-w-[120px] bg-white whitespace-nowrap">
                  নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা
                </th>
                <th className="border border-black p-2 font-bold text-center align-middle w-[130px] min-w-[120px] bg-white whitespace-nowrap">
                  অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা
                </th>
              </tr>

              {/* Row 3: Column Numbers ১ - ৮ */}
              <tr className="text-xs font-bold bg-white">
                <th className="border border-black py-1 text-center font-bold">১</th>
                <th className="border border-black py-1 text-center font-bold">২</th>
                <th className="border border-black py-1 text-center font-bold">৩</th>
                <th className="border border-black py-1 text-center font-bold">৪</th>
                <th className="border border-black py-1 text-center font-bold">৫</th>
                <th className="border border-black py-1 text-center font-bold">৬</th>
                <th className="border border-black py-1 text-center font-bold">৭</th>
                <th className="border border-black py-1 text-center font-bold">৮</th>
              </tr>
            </thead>

            <tbody>
              {processedTableRows.rows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={8} 
                    className="border border-black py-10 text-center text-slate-500 font-bold bg-white"
                  >
                    এই সময়কালে ({dateRangeTitleBN}) কোনো পত্রাদির তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                processedTableRows.rows.map((row, index) => {
                  return (
                    <tr 
                      key={row.entry.id || `${index}-${row.entry.diaryNo}`} 
                      className="bg-white hover:bg-slate-50/60 transition-colors"
                    >
                      {/* ১. ক্রমিক নং: ১, ২, ৩, ৪... */}
                      <td className="border border-black p-2 text-center font-bold align-middle whitespace-nowrap">
                        {row.serial}
                      </td>

                      {/* ২. বিবরণ: Grouped by category with rowSpan (বিএসআর (নন এসএফআই), দ্বিপক্ষীয় সভার কার্যবিবরণী, etc.) */}
                      {row.showCategory && (
                        <td
                          rowSpan={row.rowSpan}
                          className="border border-black p-2.5 text-center font-bold align-middle bg-white"
                        >
                          {row.category}
                        </td>
                      )}

                      {/* ৩. প্রাপ্ত জবাব (পত্র সংখ্যা): ০১ */}
                      <td className="border border-black p-2 text-center font-bold align-middle">
                        {row.letterCountStr}
                      </td>

                      {/* ৪. প্রাপ্ত জবাবের ডায়েরি নং ও তারিখ: যেমন ২০৩, ১৪/০১/২৬ */}
                      <td className="border border-black p-2 text-center font-bold align-middle whitespace-nowrap">
                        {row.diaryNoDateDisplay}
                      </td>

                      {/* ৫. অনুচ্ছেদ সংখ্যা */}
                      <td className="border border-black p-2 text-center font-bold align-middle">
                        {toBengaliDigits(row.paraCount.toString())}
                      </td>

                      {/* ৬. প্রাপ্ত জবাবের Disposal/জারিপত্র ও তারিখ: যেমন "চলমান" */}
                      <td className="border border-black p-2 text-center font-bold align-middle">
                        {row.disposalDisplay}
                      </td>

                      {/* ৭. নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা */}
                      <td className="border border-black p-2 text-center font-bold align-middle">
                        {row.settledCount > 0 ? toBengaliDigits(row.settledCount.toString()) : '-'}
                      </td>

                      {/* ৮. অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা */}
                      <td className="border border-black p-2 text-center font-bold align-middle">
                        {row.unsettledCount > 0 ? toBengaliDigits(row.unsettledCount.toString()) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total / Summary Row */}
            {processedTableRows.rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-black">
                  <td colSpan={2} className="border border-black p-2 text-center font-black">
                    সর্বমোটঃ
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {toBengaliDigits(processedTableRows.totalLetters.toString())}
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    -
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {toBengaliDigits(processedTableRows.totalParasSum.toString())}
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    -
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {processedTableRows.totalSettledSum > 0 ? toBengaliDigits(processedTableRows.totalSettledSum.toString()) : '-'}
                  </td>
                  <td className="border border-black p-2 text-center font-black">
                    {processedTableRows.totalUnsettledSum > 0 ? toBengaliDigits(processedTableRows.totalUnsettledSum.toString()) : '-'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default BsrReceivedReturn;
