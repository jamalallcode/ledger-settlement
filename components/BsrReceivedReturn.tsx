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
  Building2,
  RotateCcw,
  Copy
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
  initialLetterType?: string;
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

const parseDateSafe = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const cleanStr = toEnglishDigits(String(dateStr)).trim();
  if (!cleanStr) return null;

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

const formatDateDMY = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  let d: Date | null = null;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = parseDateSafe(dateInput);
  }
  if (!d || isNaN(d.getTime())) {
    const raw = String(dateInput).trim();
    return raw ? toBengaliDigits(raw) : '-';
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear().toString();
  return `${day}/${month}/${year}`;
};

const robustNormalize = (str: string = '') => {
  return str
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u09af\u09bc/g, '\u09df') // য়
    .replace(/\u09a1\u09bc/g, '\u09dc') // ড়
    .replace(/\u09a2\u09bc/g, '\u09dd') // ঢ়
    .replace(/\s+/g, ' ')
    .trim();
};

const getEntryMinistry = (entry: any): string => {
  if (entry.ministryName && entry.ministryName.trim() && entry.ministryName.trim() !== '-') {
    return entry.ministryName.trim();
  }
  // Lookup by entityName in MINISTRY_ENTITY_MAP
  const ent = (entry.entityName || '').trim();
  if (ent) {
    for (const [min, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      if (entities.some(e => e.includes(ent) || ent.includes(e))) {
        return min;
      }
    }
  }
  // Lookup by description in MINISTRY_ENTITY_MAP
  const desc = (entry.description || '').trim();
  if (desc) {
    for (const [min, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      if (entities.some(e => desc.includes(e))) {
        return min;
      }
    }
  }
  return 'অন্যান্য মন্ত্রণালয়';
};

const getAuditEntityAndBranch = (entry: any, settlementEntries: any[] = []): { entityLine: string; branchLine: string } => {
  let ent = (entry.entityName || '').trim();
  let yr = (entry.auditYear || '').trim();
  let branch = (entry.branchName || entry.branch || '').trim();
  const desc = (entry.description || '').trim();

  // Try finding in linked settlement entry if fields are missing
  if ((!branch || !ent || !yr) && settlementEntries && settlementEntries.length > 0) {
    const entryLetterDigits = toEnglishDigits(entry.letterNo || '').replace(/\D/g, '');
    const entryDiaryDigits = toEnglishDigits(entry.diaryNo || '').replace(/\D/g, '');

    const matched = settlementEntries.find(s => {
      if (!s) return false;
      if (s.id && (s.id === entry.correspondenceId || s.correspondenceId === entry.id || s.letterId === entry.id)) return true;
      if (entry.id && s.correspondenceId === entry.id) return true;
      
      const sLetterDigits = toEnglishDigits(s.letterNoDate || s.letterNo || '').replace(/\D/g, '');
      if (entryLetterDigits && sLetterDigits && entryLetterDigits.length >= 2) {
        if (sLetterDigits.startsWith(entryLetterDigits) || sLetterDigits.includes(entryLetterDigits)) {
          return true;
        }
      }
      if (entryDiaryDigits && s.diaryNo) {
        const sDiaryDigits = toEnglishDigits(s.diaryNo).replace(/\D/g, '');
        if (sDiaryDigits && sDiaryDigits === entryDiaryDigits) return true;
      }
      // Match by entity name
      if (ent && s.entityName && robustNormalize(s.entityName) === robustNormalize(ent)) {
        if (!yr || !s.auditYear || robustNormalize(s.auditYear) === robustNormalize(yr)) {
          return true;
        }
      }
      return false;
    });

    if (matched) {
      if (!ent && matched.entityName) ent = matched.entityName.trim();
      if (!yr && matched.auditYear) yr = matched.auditYear.trim();
      if (!branch && matched.branchName) branch = matched.branchName.trim();
    }
  }

  // If no entityName, check if desc or branch contains known entity
  if (!ent && desc) {
    for (const [_, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      const found = entities.find(e => desc.includes(e));
      if (found) {
        ent = found;
        break;
      }
    }
  }
  if (!ent && branch) {
    for (const [_, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      const found = entities.find(e => branch.includes(e));
      if (found) {
        ent = found;
        break;
      }
    }
  }

  // If yr not found, check if it's in desc or branch, e.g. (২০০৯-১৬) or (২০১২-১৩)
  if (!yr && desc) {
    const yrMatch = desc.match(/\(([০-৯0-9]{4}\s*[-–—]\s*[০-৯0-9]{2,4})\)/);
    if (yrMatch) {
      yr = yrMatch[1].trim();
    }
  }
  if (!yr && branch) {
    const yrMatch = branch.match(/\(([০-৯0-9]{4}\s*[-–—]\s*[০-৯0-9]{2,4})\)/);
    if (yrMatch) {
      yr = yrMatch[1].trim();
    }
  }

  // Clean year string (remove surrounding parentheses if already present)
  const cleanYr = yr.replace(/^\(/, '').replace(/\)$/, '').trim();
  const yearPart = cleanYr ? ` (${toBengaliDigits(cleanYr)})` : '';

  // Determine branchLine:
  let branchLine = '';
  if (branch && branch !== ent) {
    branchLine = branch;
  } else if (desc && desc !== ent && desc !== `${ent}${yearPart}`) {
    branchLine = desc;
  }

  // Strip leading entity or year from branchLine if present
  if (branchLine && ent && branchLine.includes(ent)) {
    const regex = new RegExp(`^${ent}\\s*(\\([^)]*\\))?\\s*[,，-]?\\s*`, 'i');
    const stripped = branchLine.replace(regex, '').trim();
    if (stripped) {
      branchLine = stripped;
    }
  }

  // Remove duplicate year parentheses from branchLine if present
  if (cleanYr && branchLine) {
    branchLine = branchLine
      .replace(new RegExp(`\\s*\\(${cleanYr}\\)`, 'g'), '')
      .replace(new RegExp(`\\s*\\(${toBengaliDigits(cleanYr)}\\)`, 'g'), '')
      .trim();
  }

  const entityLine = ent ? `${ent}${yearPart}${branchLine ? ',' : ''}` : (branchLine || '-');

  return { entityLine, branchLine };
};

export const BsrReceivedReturn: React.FC<BsrReceivedReturnProps> = ({
  correspondenceEntries = [],
  settlementEntries = [],
  activeCycle,
  onBack,
  IDBadge,
  initialLetterType,
}) => {
  // Default branch filter is 'নন এসএফআই' as shown in the user's reference image
  const [filterBranch, setFilterBranch] = useState<'নন এসএফআই' | 'এসএফআই' | 'সকল'>('নন এসএফআই');
  const [filterLetterType, setFilterLetterType] = useState<string>(initialLetterType || 'বিএসআর');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dropdown states
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isLetterTypeOpen, setIsLetterTypeOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  const branchRef = useRef<HTMLDivElement>(null);
  const letterTypeRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  // Initialize start & end date based on activeCycle or previous 1 month
  const [startDate, setStartDate] = useState<Date>(() => {
    if (activeCycle?.start) {
      const d = parseDateSafe(activeCycle.start);
      if (d) return d;
    }
    const now = new Date();
    // Default to 16th of previous month
    return new Date(now.getFullYear(), now.getMonth() - 1, 16);
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    if (activeCycle?.end) {
      const d = parseDateSafe(activeCycle.end);
      if (d) return d;
    }
    const now = new Date();
    // Default to 15th of current month
    return new Date(now.getFullYear(), now.getMonth(), 15);
  });

  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date(startDate));

  // Sync with activeCycle if it changes
  useEffect(() => {
    if (activeCycle?.start && activeCycle?.end) {
      const s = parseDateSafe(activeCycle.start);
      const e = parseDateSafe(activeCycle.end);
      if (s && e) {
        setStartDate(s);
        setEndDate(e);
        setCurrentViewDate(new Date(s));
      }
    }
  }, [activeCycle]);

  useEffect(() => {
    if (initialLetterType) {
      setFilterLetterType(initialLetterType);
    }
  }, [initialLetterType]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
      if (letterTypeRef.current && !letterTypeRef.current.contains(e.target as Node)) {
        setIsLetterTypeOpen(false);
      }
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const letterTypeOptions = [
    'বিএসআর',
    'দ্বিপক্ষীয় সভা (কার্যপত্র)',
    'দ্বিপক্ষীয় সভা (কার্যবিবরনী)',
    'ত্রিপক্ষীয় সভা (কার্যপত্র)',
    'ত্রিপক্ষীয় সভা (কার্যবিবরনী)',
    'অন্যান্য পত্র',
    'সকল'
  ];

  // Date range formatted labels in Bengali
  const dateRangeDisplayBN = useMemo(() => {
    const sStr = formatDateDMY(startDate);
    const eStr = formatDateDMY(endDate);
    return `${toBengaliDigits(sStr)} হতে ${toBengaliDigits(eStr)}`;
  }, [startDate, endDate]);

  // Subject title matching Image 2 exactly:
  // "বিষয়: ১৬/০৮/২০২৬ হতে ১৫/০৯/২০২৬ খ্রিঃ তারিখ পর্যন্ত নন এসএফআই শাখায় বিএসআর প্রাপ্তির রিটার্ন।"
  const subjectTitleBN = useMemo(() => {
    const branchText = filterBranch === 'সকল' ? 'সকল' : filterBranch;
    const letterText = filterLetterType === 'সকল' ? 'সকল পত্র' : filterLetterType;
    return `বিষয়: ${dateRangeDisplayBN} খ্রিঃ তারিখ পর্যন্ত ${branchText} শাখায় ${letterText} প্রাপ্তির রিটার্ন।`;
  }, [dateRangeDisplayBN, filterBranch, filterLetterType]);

  // Filter and prepare entries
  const filteredRows = useMemo(() => {
    const startMs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0).getTime();
    const endMs = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

    // Pool from correspondenceEntries
    let list = (correspondenceEntries || []).filter(entry => {
      if (!entry) return false;
      if (entry.approvalStatus === 'pending') return false;

      // Date check: check diaryDate, receiptDate, or letterDate
      const dDate = parseDateSafe(entry.diaryDate) || parseDateSafe(entry.receiptDate) || parseDateSafe(entry.letterDate);
      if (dDate) {
        const dTime = dDate.getTime();
        if (dTime < startMs || dTime > endMs) return false;
      }

      // Branch filter
      const pType = (entry.paraType || entry.branchName || '').trim();
      if (filterBranch === 'এসএফআই') {
        if (!isSFI(pType)) return false;
      } else if (filterBranch === 'নন এসএফআই') {
        if (!isNonSFI(pType)) return false;
      }

      // Letter Type filter
      if (filterLetterType !== 'সকল') {
        const lTypeRaw = (entry.letterType || entry.meetingType || entry.type || '').trim();
        const norm = robustNormalize(lTypeRaw);
        if (filterLetterType === 'বিএসআর') {
          const isBsr = norm.includes('বিএসআর') || norm.toLowerCase().includes('bsr') || !norm;
          if (!isBsr) return false;
        } else if (filterLetterType.includes('দ্বিপক্ষীয়') || filterLetterType.includes('দ্বি-সভা')) {
          if (!norm.includes('দ্বিপক্ষীয়') && !norm.includes('দ্বিপক্ষীয়') && !norm.includes('দ্বি-সভা')) return false;
        } else if (filterLetterType.includes('ত্রিপক্ষীয়') || filterLetterType.includes('ত্রি-সভা')) {
          if (!norm.includes('ত্রিপক্ষীয়') && !norm.includes('ত্রিপক্ষীয়') && !norm.includes('ত্রি-সভা')) return false;
        } else {
          if (!norm.includes(robustNormalize(filterLetterType))) return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const str = `${entry.description || ''} ${entry.diaryNo || ''} ${entry.letterNo || ''} ${entry.entityName || ''} ${entry.ministryName || ''} ${entry.archiveNo || ''} ${entry.remarks || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });

    // Sort entries by Ministry so identical ministries cluster consecutively for rowSpan grouping
    list.sort((a, b) => {
      const minA = getEntryMinistry(a);
      const minB = getEntryMinistry(b);
      if (minA !== minB) return minA.localeCompare(minB, 'bn');
      const dateA = parseDateSafe(a.diaryDate)?.getTime() || 0;
      const dateB = parseDateSafe(b.diaryDate)?.getTime() || 0;
      return dateA - dateB;
    });

    // Grouping by Ministry for rowSpan (Matching Image 2 where consecutive rows with same ministry share column 2)
    interface ProcessedRow {
      entry: any;
      serial: number;
      ministryName: string;
      isFirstInMinistryGroup: boolean;
      ministryRowSpan: number;
    }

    const processed: ProcessedRow[] = [];
    let i = 0;
    while (i < list.length) {
      const currentMin = getEntryMinistry(list[i]);
      let j = i;
      while (j < list.length && getEntryMinistry(list[j]) === currentMin) {
        j++;
      }
      const groupCount = j - i;
      for (let k = i; k < j; k++) {
        processed.push({
          entry: list[k],
          serial: k + 1,
          ministryName: currentMin,
          isFirstInMinistryGroup: k === i,
          ministryRowSpan: groupCount
        });
      }
      i = j;
    }

    return processed;
  }, [correspondenceEntries, startDate, endDate, filterBranch, filterLetterType, searchTerm]);

  const [copiedWord, setCopiedWord] = useState(false);

  // Copy report for Word: Title is OUTSIDE the main table as a paragraph, table underneath
  const handleCopyWord = async () => {
    const tableEl = document.getElementById('table-bsr-received-return-main');
    if (!tableEl) return;

    const cloned = tableEl.cloneNode(true) as HTMLTableElement;
    cloned.querySelectorAll('button, svg, input').forEach(el => el.remove());

    // Replace any remaining div inside td/th with span so Word never splits into multiple cells/rows
    cloned.querySelectorAll('td div, th div').forEach(div => {
      const span = document.createElement('span');
      span.innerHTML = div.innerHTML;
      if (div.getAttribute('style')) span.setAttribute('style', div.getAttribute('style') || '');
      div.parentNode?.replaceChild(span, div);
    });

    // Ensure all br elements have mso-data-placement: same-cell so Excel & Word treat them as in-cell breaks
    cloned.querySelectorAll('br').forEach(br => {
      br.setAttribute('style', 'mso-data-placement:same-cell;');
    });

    // Ensure all cells have mso-number-format: '\@' to strictly treat serials like (১), (২) as text (not negative numbers)
    cloned.querySelectorAll('th, td').forEach(cell => {
      const existing = cell.getAttribute('style') || '';
      cell.setAttribute('style', `${existing}; mso-number-format:'\\@';`);
    });

    // Title is OUTSIDE the table as a clean paragraph (হুবহু নির্দেশনা অনুযায়ী শিরোনাম টেবিলের বাইরে)
    const htmlContent = `
      <div style="font-family: 'Noto Sans Bengali', Arial, sans-serif;">
        <p style="font-size: 13pt; font-weight: bold; margin-bottom: 8pt; text-align: left; color: #000000; line-height: 1.4;">
          ${subjectTitleBN}
        </p>
        <table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #000000; font-size: 10pt; font-family: 'Noto Sans Bengali', Arial, sans-serif;">
          ${cloned.innerHTML}
        </table>
      </div>
    `;

    const plainText = `${subjectTitleBN}\n\n` + tableEl.innerText;

    try {
      let success = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const blobHtml = new Blob([htmlContent], { type: 'text/html' });
          const blobText = new Blob([plainText], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': blobHtml,
              'text/plain': blobText,
            }),
          ]);
          success = true;
        } catch {
          // Fallback to execCommand if ClipboardItem is blocked in iframe
        }
      }

      if (!success) {
        const handler = (e: ClipboardEvent) => {
          e.preventDefault();
          if (e.clipboardData) {
            e.clipboardData.setData('text/html', htmlContent);
            e.clipboardData.setData('text/plain', plainText);
          }
        };
        document.addEventListener('copy', handler);
        document.execCommand('copy');
        document.removeEventListener('copy', handler);
      }

      setCopiedWord(true);
      setTimeout(() => setCopiedWord(false), 2500);
    } catch (err) {
      console.error('Failed to copy for Word:', err);
    }
  };

  // Excel download functionality
  const handleDownloadExcel = () => {
    const tableEl = document.getElementById('table-bsr-received-return-main');
    if (!tableEl) return;

    const cloned = tableEl.cloneNode(true) as HTMLTableElement;
    cloned.querySelectorAll('button, svg, input').forEach(el => el.remove());

    // Replace any remaining div inside td/th with span so Excel and Word never split into multiple cells/rows
    cloned.querySelectorAll('td div, th div').forEach(div => {
      const span = document.createElement('span');
      span.innerHTML = div.innerHTML;
      if (div.getAttribute('style')) span.setAttribute('style', div.getAttribute('style') || '');
      div.parentNode?.replaceChild(span, div);
    });

    // Ensure all br elements have mso-data-placement: same-cell so Excel treats them as in-cell breaks
    cloned.querySelectorAll('br').forEach(br => {
      br.setAttribute('style', 'mso-data-placement:same-cell;');
    });

    // Ensure all th, td have mso-number-format: '\@' so (১), (২) etc are NEVER converted to minus signs
    cloned.querySelectorAll('th, td').forEach(cell => {
      const existing = cell.getAttribute('style') || '';
      cell.setAttribute('style', `${existing}; mso-number-format:'\\@';`);
    });

    const filename = `বিএসআর_প্রাপ্তির_রিটার্ন_${dateRangeDisplayBN.replace(/\s+/g, '_')}.xls`;

    // Note: The title is intentionally NOT placed inside the Excel sheet so that when the user
    // copies from Excel to Word, the Word table will NOT have the title inside the table!
    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <title>${subjectTitleBN}</title>
        <style>
          body { font-family: 'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 5px; }
          th, td { border: 1px solid #000000; padding: 6px 8px; text-align: center; font-size: 11px; vertical-align: middle; mso-number-format: "\\@"; }
          th { background-color: #f1f5f9; font-weight: bold; }
          br { mso-data-placement: same-cell; }
          .text-left { text-align: left !important; }
        </style>
      </head>
      <body>
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="bsr-received-report-container" className="w-full bg-white p-3 sm:p-5 rounded-none animate-in fade-in duration-300 relative font-sans">
      {IDBadge && <IDBadge id="bsr-received-report-container" />}

      {/* Non-Print Top Toolbar & Filters */}
      <div className="no-print mb-4 pb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button & Title tag */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-3 h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              title="রিটার্ন তালিকায় ফিরে যান"
            >
              <ChevronLeft size={16} />
              <span>পেছনে ফিরুন</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3.5 h-[38px] bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-black text-xs shadow-xs">
            <Mail size={15} className="text-blue-600" />
            <span>প্রাপ্ত পত্র: বিএসআর প্রাপ্তির রিটার্ন</span>
          </div>
        </div>

        {/* Center / Right: Filters (Branch, Letter Type, Date Range, Search, Excel, Print) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ১. শাখা ফিল্টার ড্রপডাউন */}
          <div className="relative z-[500]" ref={branchRef}>
            <button
              type="button"
              onClick={() => setIsBranchOpen(!isBranchOpen)}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer"
            >
              <Filter size={13} className="text-slate-600" />
              <span className="text-slate-500">শাখা:</span>
              <span className="font-black text-blue-900">{filterBranch}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isBranchOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBranchOpen && (
              <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-[600] py-1">
                {(['নন এসএফআই', 'এসএফআই', 'সকল'] as const).map(branch => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => {
                      setFilterBranch(branch);
                      setIsBranchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors ${
                      filterBranch === branch ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{branch}</span>
                    {filterBranch === branch && <Check size={14} className="text-blue-600 font-bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ২. চিঠির ধরণ ফিল্টার */}
          <div className="relative z-[500]" ref={letterTypeRef}>
            <button
              type="button"
              onClick={() => setIsLetterTypeOpen(!isLetterTypeOpen)}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer"
            >
              <Mail size={13} className="text-slate-600" />
              <span className="text-slate-500">ধরণ:</span>
              <span className="font-black text-blue-900">{filterLetterType}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isLetterTypeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLetterTypeOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[600] py-1 max-h-60 overflow-y-auto">
                {letterTypeOptions.map(lType => (
                  <button
                    key={lType}
                    type="button"
                    onClick={() => {
                      setFilterLetterType(lType);
                      setIsLetterTypeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors ${
                      filterLetterType === lType ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lType}</span>
                    {filterLetterType === lType && <Check size={14} className="text-blue-600 font-bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ৩. সময়কাল / তারিখ রেঞ্জ নির্বাচন */}
          <div className="relative z-[500]" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer"
            >
              <Calendar size={13} className="text-slate-600" />
              <span className="text-slate-500">সময়কাল:</span>
              <span className="font-black text-blue-900">{dateRangeDisplayBN}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isDateRangeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateRangeOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[600] p-3 space-y-2.5">
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider border-b pb-1">
                  তারিখ সীমা নির্ধারণ
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">হতে (শুরু)</label>
                    <input
                      type="date"
                      value={dateFnsFormat(startDate, 'yyyy-MM-dd')}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          setStartDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">পর্যন্ত (শেষ)</label>
                    <input
                      type="date"
                      value={dateFnsFormat(endDate, 'yyyy-MM-dd')}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          setEndDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeCycle?.start && activeCycle?.end) {
                        const s = parseDateSafe(activeCycle.start);
                        const e = parseDateSafe(activeCycle.end);
                        if (s && e) {
                          setStartDate(s);
                          setEndDate(e);
                        }
                      }
                      setIsDateRangeOpen(false);
                    }}
                    className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold cursor-pointer"
                  >
                    চলতি সাইকেল
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 16));
                      setEndDate(new Date(now.getFullYear(), now.getMonth(), 15));
                      setIsDateRangeOpen(false);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer"
                  >
                    বিগত সাইকেল
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ৪. সার্চ বার */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="খুঁজুন..."
              className="h-[38px] pl-8 pr-7 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-44 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* ৫. ওয়ার্ডে কপি বাটন */}
          <button
            type="button"
            onClick={handleCopyWord}
            className={`flex items-center gap-1.5 px-3 h-[38px] rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all ${
              copiedWord 
                ? 'bg-blue-700 text-white ring-2 ring-blue-400' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="ওয়ার্ডে পেস্ট করার জন্য শিরোনামসহ টেবিল কপি করুন (শিরোনাম টেবিলের বাইরে থাকবে)"
          >
            {copiedWord ? <Check size={15} /> : <Copy size={15} />}
            <span className="hidden sm:inline">{copiedWord ? 'কপি হয়েছে' : 'ওয়ার্ডে কপি'}</span>
          </button>

          {/* ৬. এক্সেল ডাউনলোড বাটন */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            title="এক্সেল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">এক্সেল</span>
          </button>

          {/* ৭. প্রিন্ট বাটন */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            title="প্রিন্ট করুন"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Main Official Printable Report Area (Harking back strictly to Image 2) */}
      <div className="w-full bg-white print:p-0">
        {/* Title Line (হুবহু ২ নং ছবি অনুযায়ী) */}
        <div className="mb-2 text-left">
          <p className="font-bold text-[14px] sm:text-[15.5px] text-black leading-snug tracking-tight">
            {subjectTitleBN}
          </p>
        </div>

        {/* The 8-Column Exact Table from Image 2 */}
        <div className="table-container relative w-full overflow-x-auto">
          <table
            id="table-bsr-received-return-main"
            className="w-full min-w-[1050px] border-collapse border border-black text-black text-xs sm:text-[13px] font-sans"
            style={{ borderCollapse: 'collapse', borderColor: '#000000', minWidth: '1050px' }}
          >
            <colgroup>
              <col style={{ width: '60px', minWidth: '60px' }} />
              <col style={{ width: '160px', minWidth: '150px' }} />
              <col style={{ width: '320px', minWidth: '280px' }} />
              <col style={{ width: '125px', minWidth: '115px' }} />
              <col style={{ width: '125px', minWidth: '115px' }} />
              <col style={{ width: '95px', minWidth: '90px' }} />
              <col style={{ width: '100px', minWidth: '95px' }} />
              <col style={{ width: '90px', minWidth: '85px' }} />
            </colgroup>
            <thead>
              {/* Row 1: 8 Column Headers */}
              <tr className="bg-white text-black font-bold h-[38px]">
                <th className="border border-black p-2 text-center align-middle w-[60px] min-w-[60px] font-bold">
                  ক্রমিক নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[160px] min-w-[150px] font-bold">
                  বিভাগ/মন্ত্রণালয়
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold text-black"
                  style={{ width: '320px', minWidth: '280px' }}
                >
                  <span className="inline-block whitespace-nowrap">অডিট প্রতিষ্ঠানের নাম</span>{' '}
                  <span className="inline-block whitespace-nowrap">ও নিরীক্ষা সাল</span>
                </th>
                <th className="border border-black p-2 text-center align-middle w-[125px] min-w-[115px] font-bold">
                  ডায়েরি নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[125px] min-w-[115px] font-bold">
                  পত্র নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[95px] min-w-[90px] font-bold">
                  চিঠির ধরণ
                </th>
                <th className="border border-black p-2 text-center align-middle w-[100px] min-w-[95px] font-bold">
                  আর্কাইভ নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[90px] min-w-[85px] font-bold">
                  মন্তব্য
                </th>
              </tr>

              {/* Row 2: Sub-headers (১) হতে (৮) - ১ম ছবির নির্দেশনা অনুযায়ী ফাস্ট ব্রাকেটের মধ্যে */}
              <tr className="bg-white text-black font-bold h-[26px]">
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(১)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(২)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৩)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৪)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৫)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৬)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৭)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৮)</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-black py-12 text-center text-slate-500 font-bold bg-white text-sm"
                  >
                    এই সময়কালে কোনো পত্রাদির তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const entry = row.entry;
                  const diaryNo = entry.diaryNo ? String(entry.diaryNo).trim() : '-';
                  const diaryDate = formatDateDMY(entry.diaryDate || entry.receiptDate);
                  const letterNo = entry.letterNo ? String(entry.letterNo).trim() : '-';
                  const letterDate = formatDateDMY(entry.letterDate);
                  const letterTypeDisplay = entry.letterType?.trim() || filterLetterType || 'বিএসআর';
                  const archiveNo = entry.archiveNo ? String(entry.archiveNo).trim() : '';
                  const remarks = entry.remarks || entry.comments || '';

                  return (
                    <tr
                      key={entry.id || `row-${row.serial}`}
                      className="bg-white hover:bg-slate-50/70 transition-colors text-black"
                    >
                      {/* ১. ক্রমিক নং (Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-bold text-xs sm:text-[13px] whitespace-nowrap">
                        {toBengaliDigits(row.serial.toString())}
                      </td>

                      {/* ২. বিভাগ/মন্ত্রণালয় (Merged with rowSpan for same ministry!) */}
                      {row.isFirstInMinistryGroup && (
                        <td
                          rowSpan={row.ministryRowSpan}
                          className="border border-black p-2.5 text-center font-bold align-middle bg-white text-black text-xs sm:text-[13px] leading-snug"
                        >
                          {row.ministryName}
                        </td>
                      )}

                      {/* ৩. অডিট প্রতিষ্ঠানের নাম ও নিরীক্ষা সাল (একক সেলে প্রতিষ্ঠান ও শাখা) */}
                      <td 
                        className="border border-black p-2.5 text-justify align-middle text-xs sm:text-[13px] text-black leading-snug"
                        style={{ width: '320px', minWidth: '280px', textAlign: 'justify' }}
                      >
                        {(() => {
                          const { entityLine, branchLine } = getAuditEntityAndBranch(entry, settlementEntries);
                          return (
                            <>
                              <span className="font-bold text-black" style={{ textAlign: 'justify' }}>
                                {entityLine}
                              </span>
                              {branchLine && (
                                <>
                                  <br style={{ msoDataPlacement: 'same-cell' } as any} />
                                  <span 
                                    className="text-blue-600 print:text-blue-600 font-semibold"
                                    style={{ color: '#2563eb', textAlign: 'justify' }}
                                  >
                                    {branchLine}
                                  </span>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      {/* ৪. ডায়েরি নং (ডায়েরি নং ও তারিখ - একক সেলে হুবহু ২ নং ছবির মত) */}
                      <td className="border border-black p-2 text-center align-middle whitespace-nowrap text-black font-semibold text-xs sm:text-[13px] leading-tight">
                        {diaryDate && diaryDate !== '-' 
                          ? `${toBengaliDigits(diaryNo)}, ${toBengaliDigits(diaryDate)}`
                          : toBengaliDigits(diaryNo)}
                      </td>

                      {/* ৫. পত্র নং (পত্র নং ও তারিখ - একক সেলে হুবহু ২ নং ছবির মত) */}
                      <td className="border border-black p-2 text-center align-middle whitespace-nowrap text-black font-semibold text-xs sm:text-[13px] leading-tight">
                        {letterDate && letterDate !== '-' 
                          ? `${toBengaliDigits(letterNo)}, ${toBengaliDigits(letterDate)}`
                          : toBengaliDigits(letterNo)}
                      </td>

                      {/* ৬. চিঠির ধরণ (বিএসআর - Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-semibold text-xs sm:text-[13px] text-black whitespace-nowrap">
                        {letterTypeDisplay}
                      </td>

                      {/* ৭. আর্কাইভ নং (Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-semibold text-xs sm:text-[13px] text-black whitespace-nowrap">
                        {archiveNo ? toBengaliDigits(archiveNo) : ''}
                      </td>

                      {/* ৮. মন্তব্য (Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-medium text-xs sm:text-[13px] text-black">
                        {remarks ? toBengaliDigits(remarks) : ''}
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
