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
  Filter, 
  Mail,
  RotateCcw
} from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format as dateFnsFormat } from 'date-fns';
import { isSFI, isNonSFI } from '../utils/branchUtils';
import { MINISTRY_ENTITY_MAP } from '../constants';

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
  const cleanStr = toEnglishDigits(String(dateStr)).trim();
  if (!cleanStr) return null;

  // Extract date portion before any 'T' or space
  const datePortion = cleanStr.split('T')[0].split(' ')[0].trim();
  const parts = datePortion.split(/[-/.]/);
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
  const fallback = new Date(datePortion);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  return null;
};

const formatFullDateSlashBN = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return '';
  let d: Date | null;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = parseDate(dateInput);
  }
  if (!d) return typeof dateInput === 'string' ? toBengaliDigits(dateInput) : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yr = String(d.getFullYear());
  return `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(yr)}`;
};

const formatDateForInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Ministry detection helper
const getMinistryForEntry = (entry: any): string => {
  if (entry.ministryName && String(entry.ministryName).trim()) {
    return String(entry.ministryName).trim();
  }
  const searchCorpus = `${entry.entityName || ''} ${entry.description || ''}`.toLowerCase();
  for (const [ministry, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
    for (const ent of entities) {
      if (searchCorpus.includes(ent.toLowerCase())) {
        return ministry;
      }
    }
  }
  // Generic fallback heuristics based on commercial audit branches
  if (searchCorpus.includes('ব্যাংক') || searchCorpus.includes('বীমা') || searchCorpus.includes('আর্থিক')) {
    return 'আর্থিক প্রতিষ্ঠান বিভাগ';
  }
  if (searchCorpus.includes('জুট') || searchCorpus.includes('পাট')) {
    return 'পাট মন্ত্রণালয়';
  }
  if (searchCorpus.includes('বস্ত্র') || searchCorpus.includes('রেশম')) {
    return 'বস্ত্র মন্ত্রণালয়';
  }
  if (searchCorpus.includes('চিনি') || searchCorpus.includes('কুটির') || searchCorpus.includes('শিল্প') || searchCorpus.includes('বিসিক')) {
    return 'শিল্প মন্ত্রণালয়';
  }
  if (searchCorpus.includes('বিমান') || searchCorpus.includes('পর্যটন')) {
    return 'বিমান ও পর্যটন মন্ত্রণালয়';
  }
  if (searchCorpus.includes('টিসিবি') || searchCorpus.includes('বাণিজ্য')) {
    return 'বাণিজ্য মন্ত্রণালয়';
  }
  return 'অন্যান্য';
};

const ORDERED_MINISTRIES = [
  'আর্থিক প্রতিষ্ঠান বিভাগ',
  'পাট মন্ত্রণালয়',
  'বস্ত্র মন্ত্রণালয়',
  'শিল্প মন্ত্রণালয়',
  'বিমান ও পর্যটন মন্ত্রণালয়',
  'বাণিজ্য মন্ত্রণালয়',
  'অন্যান্য'
];

export const BsrReceivedReturn: React.FC<BsrReceivedReturnProps> = ({
  correspondenceEntries = [],
  activeCycle,
  onBack,
  IDBadge,
}) => {
  // Initialize date range based on activeCycle or current system date
  // By default, if activeCycle exists, use activeCycle range (which is typically 16th to 15th like in Image 2!)
  const initialDates = useMemo(() => {
    if (activeCycle?.start && activeCycle?.end) {
      const s = parseDate(activeCycle.start);
      const e = parseDate(activeCycle.end);
      if (s && e) {
        return { start: s, end: e, isCycle: true };
      }
    }
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      isCycle: false,
    };
  }, [activeCycle]);

  // Date mode: 'cycle' (16th of prev month to 15th of selected month) or 'custom'
  const [dateSelectionMode, setDateSelectionMode] = useState<'cycle' | 'custom'>('cycle');

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (activeCycle?.end) {
      const d = parseDate(activeCycle.end);
      if (d) return d.getMonth();
    }
    return new Date().getMonth();
  });
  
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (activeCycle?.end) {
      const d = parseDate(activeCycle.end);
      if (d) return d.getFullYear();
    }
    return new Date().getFullYear();
  });

  const [customStartDateStr, setCustomStartDateStr] = useState<string>(() => formatDateForInput(initialDates.start));
  const [customEndDateStr, setCustomEndDateStr] = useState<string>(() => formatDateForInput(initialDates.end));

  const [pickerYear, setPickerYear] = useState<number>(selectedYear);

  // Filters - default to 'নন এসএফআই' as shown in the paper document
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

  // Handlers for next and previous month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
      setPickerYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
      setPickerYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Compute effective date range based on selection mode
  // The monthly audit return cycle is strictly: 16th of previous month to 15th of selected month
  const { startDate, endDate, dateRangeTitleBN, monthLabelBN, cycleBriefBN } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (dateSelectionMode === 'custom') {
      start = parseDate(customStartDateStr) || new Date(selectedYear, selectedMonth - 1, 16);
      end = parseDate(customEndDateStr) || new Date(selectedYear, selectedMonth, 15);
    } else {
      // 16th of previous month to 15th of selected month (Audit Cycle)
      // e.g. For September 2026: 16/08/2026 to 15/09/2026
      // For October 2026: 16/09/2026 to 15/10/2026
      start = new Date(selectedYear, selectedMonth - 1, 16);
      end = new Date(selectedYear, selectedMonth, 15);
    }

    const startFormattedBN = formatFullDateSlashBN(start);
    const endFormattedBN = formatFullDateSlashBN(end);
    const monthNameBN = BENGALI_MONTHS.find(m => m.index === selectedMonth)?.name || '';
    const yearBN = toBengaliDigits(selectedYear.toString());

    return {
      startDate: start,
      endDate: end,
      dateRangeTitleBN: `${startFormattedBN} হতে ${endFormattedBN} খ্রিঃ তারিখ পর্যন্ত`,
      monthLabelBN: `${monthNameBN}, ${yearBN}`,
      cycleBriefBN: `${startFormattedBN} - ${endFormattedBN}`,
    };
  }, [dateSelectionMode, selectedMonth, selectedYear, customStartDateStr, customEndDateStr]);

  // Branch label for title
  const branchLabelInSubject = useMemo(() => {
    if (filterBranch === 'নন এসএফআই') return 'নন এসএফআই শাখায়';
    if (filterBranch === 'এসএফআই') return 'এসএফআই শাখায়';
    return 'সকল শাখায়';
  }, [filterBranch]);

  // Subject title matching the user's paper document (Image 2)
  const reportSubjectTitle = useMemo(() => {
    return `বিষয়: ${dateRangeTitleBN} ${branchLabelInSubject} বিএসআর প্রাপ্তির রিটার্ণ।`;
  }, [dateRangeTitleBN, branchLabelInSubject]);

  // Filter letter types available
  const letterTypeOptions = useMemo(() => {
    const types = new Set<string>();
    types.add('সকল');
    types.add('বিএসআর');
    correspondenceEntries.forEach(entry => {
      if (entry.letterType && String(entry.letterType).trim()) {
        types.add(String(entry.letterType).trim());
      }
    });
    return Array.from(types);
  }, [correspondenceEntries]);

  // Filter entries strictly based on Diary Date (ডায়েরি তারিখ) within the selected date range
  const filteredEntries = useMemo(() => {
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

    return correspondenceEntries.filter(entry => {
      // 1. DIARY DATE FILTER (Critical requirement: তারিখটি মূলত ডায়েরি তারিখকে বোঝাচ্ছে)
      if (!entry.diaryDate) return false;
      const dDate = parseDate(entry.diaryDate);
      if (!dDate) return false;
      const dTime = dDate.getTime();
      if (dTime < startMidnight || dTime > endMidnight) {
        return false;
      }

      // 2. Branch / Para Type Filter
      if (filterBranch === 'এসএফআই' || isSFI(filterBranch)) {
        if (!isSFI(entry.paraType)) return false;
      } else if (filterBranch === 'নন এসএফআই' || isNonSFI(filterBranch)) {
        if (!isNonSFI(entry.paraType)) return false;
      }

      // 3. Letter Type Filter
      if (filterLetterType !== 'সকল') {
        const lType = (entry.letterType || '').trim();
        if (filterLetterType === 'বিএসআর') {
          if (!lType.includes('বিএসআর') && !lType.toLowerCase().includes('bsr')) {
            return false;
          }
        } else if (lType !== filterLetterType) {
          return false;
        }
      }

      // 4. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const desc = (entry.description || '').toLowerCase();
        const diaryNo = (entry.diaryNo || '').toLowerCase();
        const letterNo = (entry.letterNo || '').toLowerCase();
        const archiveNo = (entry.archiveNo || '').toLowerCase();
        const comments = (entry.comments || entry.remarks || '').toLowerCase();
        const minName = (entry.ministryName || '').toLowerCase();
        const entity = (entry.entityName || '').toLowerCase();

        if (
          !desc.includes(term) &&
          !diaryNo.includes(term) &&
          !letterNo.includes(term) &&
          !archiveNo.includes(term) &&
          !comments.includes(term) &&
          !minName.includes(term) &&
          !entity.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [correspondenceEntries, startDate, endDate, filterBranch, filterLetterType, searchTerm]);

  // Group entries by Ministry and structure rows with rowSpan according to Image 2
  const processedTableData = useMemo(() => {
    // Group entries by ministry
    const ministryMap = new Map<string, any[]>();

    filteredEntries.forEach(entry => {
      const ministry = getMinistryForEntry(entry);
      if (!ministryMap.has(ministry)) {
        ministryMap.set(ministry, []);
      }
      ministryMap.get(ministry)!.push(entry);
    });

    // Sort ministries according to predefined order
    const sortedMinistries = Array.from(ministryMap.keys()).sort((a, b) => {
      const idxA = ORDERED_MINISTRIES.indexOf(a);
      const idxB = ORDERED_MINISTRIES.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'bn');
    });

    let globalSerial = 1;
    const rows: Array<{
      entry: any;
      serial: string;
      ministryName: string;
      showMinistry: boolean;
      rowSpan: number;
      institutionAuditYear: string;
      diaryNoDisplay: string;
      letterNoDisplay: string;
      letterTypeDisplay: string;
      archiveNoDisplay: string;
      commentsDisplay: string;
    }> = [];

    sortedMinistries.forEach(ministry => {
      const entriesInMinistry = ministryMap.get(ministry)!;

      // Sort entries within ministry by diary date ascending, then diary no
      entriesInMinistry.sort((a, b) => {
        const dateA = parseDate(a.diaryDate)?.getTime() || 0;
        const dateB = parseDate(b.diaryDate)?.getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        const numA = parseInt(toEnglishDigits(a.diaryNo || '0'), 10) || 0;
        const numB = parseInt(toEnglishDigits(b.diaryNo || '0'), 10) || 0;
        return numA - numB;
      });

      entriesInMinistry.forEach((entry, idx) => {
        const serial = toBengaliDigits((globalSerial++).toString());
        const showMinistry = idx === 0;
        const rowSpan = entriesInMinistry.length;

        // Institution & Audit Year (অডিট প্রতিষ্ঠানের নাম ও নিরীক্ষা সাল)
        let institutionAuditYear = (entry.description || '').trim();
        if (!institutionAuditYear) {
          const parts: string[] = [];
          if (entry.entityName) parts.push(entry.entityName);
          if (entry.auditYear) parts.push(`(${toBengaliDigits(entry.auditYear)})`);
          institutionAuditYear = parts.join(' ');
        }

        // Diary No & Date (ডায়েরি নং): e.g. "২৩৯, ৩০/০৭/২০২৬"
        const diaryNoBN = entry.diaryNo ? toBengaliDigits(String(entry.diaryNo)) : '';
        const diaryDateBN = entry.diaryDate ? formatFullDateSlashBN(entry.diaryDate) : '';
        const diaryParts: string[] = [];
        if (diaryNoBN) diaryParts.push(diaryNoBN);
        if (diaryDateBN) diaryParts.push(diaryDateBN);
        const diaryNoDisplay = diaryParts.length > 0 ? diaryParts.join(', ') : '-';

        // Letter No & Date (পত্র নং): e.g. "১৩২, ২৭/০৭/২০২৬"
        const letterNoBN = entry.letterNo ? toBengaliDigits(String(entry.letterNo)) : '';
        const letterDateBN = entry.letterDate ? formatFullDateSlashBN(entry.letterDate) : '';
        const letterParts: string[] = [];
        if (letterNoBN) letterParts.push(letterNoBN);
        if (letterDateBN) letterParts.push(letterDateBN);
        const letterNoDisplay = letterParts.length > 0 ? letterParts.join(', ') : '-';

        // Letter Type (চিঠির ধরণ): e.g. "বিএসআর"
        let letterTypeDisplay = (entry.letterType || '').trim();
        if (!letterTypeDisplay || letterTypeDisplay.toLowerCase().includes('bsr')) {
          letterTypeDisplay = 'বিএসআর';
        }

        // Archive No (আর্কাইভ নং): e.g. "Kg- 0498", "ফাইল ফেরত"
        const archiveNoDisplay = (entry.archiveNo || '').trim() || '-';

        // Comments (মন্তব্য)
        const commentsDisplay = (entry.comments || entry.remarks || '').trim() || '-';

        rows.push({
          entry,
          serial,
          ministryName: ministry,
          showMinistry,
          rowSpan,
          institutionAuditYear,
          diaryNoDisplay,
          letterNoDisplay,
          letterTypeDisplay,
          archiveNoDisplay,
          commentsDisplay,
        });
      });
    });

    return {
      rows,
      totalCount: rows.length,
    };
  }, [filteredEntries]);

  // Excel Download with exact format from Image 2
  const downloadExcel = () => {
    const table = document.getElementById('table-bsr-received-return-main');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const filename = `বিএসআর_প্রাপ্তির_রিটার্ণ_${formatFullDateSlashBN(startDate).replace(/\//g, '-')}_হতে_${formatFullDateSlashBN(endDate).replace(/\//g, '-')}_${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Nikosh', 'SolaimanLipi', 'SutonnyMJ', Arial, sans-serif; }
          .title-text { font-size: 15px; font-weight: bold; margin-bottom: 12px; color: #000; text-align: left; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000000; padding: 6px 10px; font-size: 12px; color: #000000; }
          th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
        </style>
      </head>
      <body>
        <div class="title-text">${reportSubjectTitle}</div>
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
                  চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: প্রাপ্ত বিএসআর
                </h1>
                {IDBadge && <IDBadge id="bsr-received-return" />}
              </div>
              <p className="text-[11px] font-bold text-slate-500">
                শাখা ভিত্তিক বিএসআর প্রাপ্তির অফিসিয়াল রিটার্ণ প্রতিবেদন
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
          {/* Left: Date mode toggle & selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Navigation: Previous Month < | Month Dropdown | Next Month > */}
            {dateSelectionMode === 'cycle' ? (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {/* Prev Month Button */}
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white hover:text-emerald-700 text-slate-700 rounded-lg transition-all cursor-pointer shadow-xs active:scale-90"
                  title="পূর্ববর্তী মাস"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Month Dropdown Button */}
                <div className="relative select-none" ref={monthRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerYear(selectedYear);
                      setIsMonthOpen(prev => !prev);
                    }}
                    className={`flex items-center gap-2 px-3 h-[34px] bg-white border rounded-lg font-bold text-xs transition-all cursor-pointer shadow-xs ${
                      isMonthOpen ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    <Calendar size={14} className="text-emerald-600 shrink-0" />
                    <span className="text-slate-600 font-semibold">মাস:</span>
                    <span className="text-slate-900 font-black">{monthLabelBN}</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                      {cycleBriefBN}
                    </span>
                    <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isMonthOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>

                  {/* 12-Month Grid Dropdown */}
                  {isMonthOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[310px] sm:w-[330px] bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-[1200] animate-in fade-in duration-150 select-none">
                      {/* Year Selector */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickerYear(prev => prev - 1);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="পূর্ববর্তী বছর"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <span className="font-black text-sm text-slate-900">
                          {toBengaliDigits(pickerYear.toString())} খ্রিঃ
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickerYear(prev => prev + 1);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="পরবর্তী বছর"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* 12 Months Grid with 16th to 15th cycle range preview */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {BENGALI_MONTHS.map((m) => {
                          const isCurrent = selectedYear === pickerYear && selectedMonth === m.index;
                          
                          // Compute preview cycle for this month
                          const prevMonthIndex = m.index === 0 ? 11 : m.index - 1;
                          const prevMNum = (prevMonthIndex + 1).toString().padStart(2, '0');
                          const currMNum = (m.index + 1).toString().padStart(2, '0');
                          const cyclePreview = `১৬/${toBengaliDigits(prevMNum)} - ১৫/${toBengaliDigits(currMNum)}`;

                          return (
                            <button
                              key={m.index}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedYear(pickerYear);
                                setSelectedMonth(m.index);
                                setIsMonthOpen(false);
                              }}
                              className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-center ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                                  : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200/70'
                              }`}
                            >
                              <span className="text-xs font-bold leading-tight">{m.name}</span>
                              <span className={`text-[10px] mt-0.5 ${isCurrent ? 'text-emerald-100' : 'text-slate-500'}`}>
                                {cyclePreview}
                              </span>
                            </button>
                          );
                        })}
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
                            setPickerYear(now.getFullYear());
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

                {/* Next Month Button */}
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white hover:text-emerald-700 text-slate-700 rounded-lg transition-all cursor-pointer shadow-xs active:scale-90"
                  title="পরবর্তী মাস"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              /* Custom Date Range Pickers */
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDateStr}
                  onChange={e => setCustomStartDateStr(e.target.value)}
                  className="h-[38px] px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-500">হতে</span>
                <input
                  type="date"
                  value={customEndDateStr}
                  onChange={e => setCustomEndDateStr(e.target.value)}
                  className="h-[38px] px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Custom Date Range Toggle */}
            <button
              type="button"
              onClick={() => setDateSelectionMode(prev => prev === 'cycle' ? 'custom' : 'cycle')}
              className={`px-2.5 h-[38px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                dateSelectionMode === 'custom'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {dateSelectionMode === 'custom' ? 'মাসিক রিটার্নে ফিরুন' : 'কাস্টম তারিখ'}
            </button>

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
                <div className="absolute top-full left-0 mt-1.5 w-[180px] max-h-[260px] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-[1100] animate-in fade-in">
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
          </div>

          {/* Right: Search Input & Count Badge */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="খুঁজুন (ডায়েরি, প্রতিষ্ঠান, পত্র নং)..."
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
                মোট প্রাপ্তি: {toBengaliDigits(processedTableData.totalCount.toString())} টি
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
        {/* Subject Header matching the user's paper document (Image 2) */}
        <div className="mb-4">
          <h2 className="text-base sm:text-[17px] font-bold text-black tracking-tight leading-relaxed">
            {reportSubjectTitle}
          </h2>
        </div>

        {/* Table View matching the EXACT layout with মন্তব্য column */}
        <div className="table-container relative w-full overflow-x-auto pb-2">
          <table 
            id="table-bsr-received-return-main" 
            className="w-full border-collapse border border-black text-black text-xs sm:text-[13px] font-sans"
            style={{ borderCollapse: 'collapse', borderColor: '#000000' }}
          >
            <thead>
              {/* Row 1: Main Header Names */}
              <tr className="bg-slate-100/90 print:bg-white text-black font-bold">
                <th 
                  className="border border-black p-2 text-center align-middle w-[50px] min-w-[45px] font-bold"
                  style={{ width: '4%' }}
                >
                  ক্রমিক<br />নং
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '13%' }}
                >
                  বিভাগ/মন্ত্রণালয়
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '31%' }}
                >
                  অডিট প্রতিষ্ঠানের নাম ও নিরীক্ষা সাল
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '12%' }}
                >
                  ডায়েরি নং
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '12%' }}
                >
                  পত্র নং
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '8%' }}
                >
                  চিঠির ধরণ
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '9%' }}
                >
                  আর্কাইভ নং
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold"
                  style={{ width: '11%' }}
                >
                  মন্তব্য
                </th>
              </tr>

              {/* Row 2: Subheader Numbers (১) - (৮) */}
              <tr className="bg-slate-50/90 print:bg-white text-black font-bold text-xs">
                <th className="border border-black py-1 text-center font-bold">(১)</th>
                <th className="border border-black py-1 text-center font-bold">(২)</th>
                <th className="border border-black py-1 text-center font-bold">(৩)</th>
                <th className="border border-black py-1 text-center font-bold">(৪)</th>
                <th className="border border-black py-1 text-center font-bold">(৫)</th>
                <th className="border border-black py-1 text-center font-bold">(৬)</th>
                <th className="border border-black py-1 text-center font-bold">(৭)</th>
                <th className="border border-black py-1 text-center font-bold">(৮)</th>
              </tr>
            </thead>

            <tbody>
              {processedTableData.rows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={8} 
                    className="border border-black py-12 text-center text-slate-500 font-bold bg-white"
                  >
                    এই সময়কালে ({dateRangeTitleBN}) {filterBranch} শাখার কোনো বিএসআর প্রাপ্তির তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                processedTableData.rows.map((row, index) => {
                  return (
                    <tr 
                      key={row.entry.id || `${index}-${row.entry.diaryNo}`} 
                      className="bg-white hover:bg-slate-50/60 transition-colors"
                    >
                      {/* (১) ক্রমিক নং */}
                      <td className="border border-black p-2 text-center font-bold align-middle whitespace-nowrap">
                        {row.serial}
                      </td>

                      {/* (২) বিভাগ/মন্ত্রণালয়: Grouped by Ministry with rowSpan */}
                      {row.showMinistry && (
                        <td
                          rowSpan={row.rowSpan}
                          className="border border-black p-2.5 text-center font-bold align-middle bg-white"
                        >
                          {row.ministryName}
                        </td>
                      )}

                      {/* (৩) অডিট প্রতিষ্ঠানের নাম ও নিরীক্ষা সাল */}
                      <td className="border border-black px-3 py-2 text-left font-medium align-middle leading-relaxed">
                        {row.institutionAuditYear}
                      </td>

                      {/* (৪) ডায়েরি নং (ডায়েরি নং ও ডায়েরি তারিখ) */}
                      <td className="border border-black p-2 text-center font-bold align-middle whitespace-nowrap">
                        {row.diaryNoDisplay}
                      </td>

                      {/* (৫) পত্র নং (পত্র নং ও তারিখ) */}
                      <td className="border border-black p-2 text-center font-bold align-middle whitespace-nowrap">
                        {row.letterNoDisplay}
                      </td>

                      {/* (৬) চিঠির ধরণ */}
                      <td className="border border-black p-2 text-center font-bold align-middle whitespace-nowrap">
                        {row.letterTypeDisplay}
                      </td>

                      {/* (৭) আর্কাইভ নং */}
                      <td className="border border-black p-2 text-center font-bold align-middle">
                        {row.archiveNoDisplay}
                      </td>

                      {/* (৮) মন্তব্য */}
                      <td className="border border-black p-2 text-left font-medium align-middle">
                        {row.commentsDisplay}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BsrReceivedReturn;
