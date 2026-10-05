import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, FileSpreadsheet, ChevronDown, Check, Building2, Edit3, RotateCcw, CalendarDays, Layers } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { SettlementEntry, CorrespondenceEntry } from '../types';

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

// Default baseline dataset matching the official Commercial Audit Directorate, Khulna annual return sheets
const DEFAULT_YEARLY_DATA: Record<string, YearlyRowData> = {
  'আর্থিক প্রতিষ্ঠান বিভাগ': {
    id: 'fin',
    ministryName: 'আর্থিক প্রতিষ্ঠান বিভাগ',
    prevCount: 10714,
    prevAmount: 13042.032,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 59,
    settledCount: 200,
    settledAmount: 80.2129,
    recAmount: 20.1415,
    adjAmount: 60.0714,
  },
  'শিল্প মন্ত্রণালয়': {
    id: 'ind',
    ministryName: 'শিল্প মন্ত্রণালয়',
    prevCount: 781,
    prevAmount: 1723.303,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 9,
    settledCount: 13,
    settledAmount: 2.3921,
    recAmount: 0.4922,
    adjAmount: 1.8999,
  },
  'বস্ত্র ও পাট মন্ত্রণালয়': {
    id: 'tex',
    ministryName: 'বস্ত্র ও পাট মন্ত্রণালয়',
    prevCount: 1956,
    prevAmount: 3840.3214,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 43,
    settledCount: 48,
    settledAmount: 149.663,
    recAmount: 1.2024,
    adjAmount: 148.4606,
  },
  'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়': {
    id: 'avi',
    ministryName: 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
    prevCount: 113,
    prevAmount: 89.8415,
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
    prevCount: 60,
    prevAmount: 24.231,
    raisedCount: 0,
    raisedAmount: 0,
    bsrCount: 2,
    settledCount: 0,
    settledAmount: 0,
    recAmount: 0,
    adjAmount: 0,
  },
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

const STORAGE_KEY_YEARLY_OVERRIDES = 'ledger_yearly_return_overrides_v1';

export const YearlyReturnView: React.FC<YearlyReturnViewProps> = ({
  IDBadge,
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

  const tableDropdownRef = useRef<HTMLDivElement>(null);
  const minDropdownRef = useRef<HTMLDivElement>(null);

  const [customOverrides, setCustomOverrides] = useState<Record<string, Partial<YearlyRowData>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_YEARLY_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(e.target as Node)) {
        setIsTableDropdownOpen(false);
      }
      if (minDropdownRef.current && !minDropdownRef.current.contains(e.target as Node)) {
        setIsMinistryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (ministryName: string, field: keyof YearlyRowData, rawVal: string) => {
    const num = parseBengaliNumber(rawVal);
    setCustomOverrides(prev => {
      const updated = {
        ...prev,
        [ministryName]: {
          ...(prev[ministryName] || {}),
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
    return orderedMinistries.map((minName, index) => {
      const base = DEFAULT_YEARLY_DATA[minName];
      const over = customOverrides[minName] || {};

      const prevCount = over.prevCount !== undefined ? over.prevCount : base.prevCount;
      const prevAmount = over.prevAmount !== undefined ? over.prevAmount : base.prevAmount;
      const raisedCount = over.raisedCount !== undefined ? over.raisedCount : base.raisedCount;
      const raisedAmount = over.raisedAmount !== undefined ? over.raisedAmount : base.raisedAmount;
      const bsrCount = over.bsrCount !== undefined ? over.bsrCount : base.bsrCount;
      const settledCount = over.settledCount !== undefined ? over.settledCount : base.settledCount;
      const settledAmount = over.settledAmount !== undefined ? over.settledAmount : base.settledAmount;
      const recAmount = over.recAmount !== undefined ? over.recAmount : base.recAmount;
      const adjAmount = over.adjAmount !== undefined ? over.adjAmount : base.adjAmount;

      const totalCount = prevCount + raisedCount;
      const totalAmount = Number((prevAmount + raisedAmount).toFixed(4));

      const unsettledCount =
        over.unsettledCountOverride !== undefined
          ? over.unsettledCountOverride
          : totalCount - settledCount;
      const unsettledAmount =
        over.unsettledAmountOverride !== undefined
          ? over.unsettledAmountOverride
          : Number((totalAmount - settledAmount).toFixed(4));

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
      };
    });
  }, [orderedMinistries, customOverrides]);

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

        {/* ডান পাশের বাটনসমূহ: এডিট, রিসেট, এক্সেল, প্রিন্ট */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3 h-9 border rounded-none text-xs font-black transition-all cursor-pointer shadow-xs ${
              isEditMode
                ? 'bg-amber-500 text-slate-950 border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="টেবিলের সংখ্যা এডিট করুন"
          >
            <Edit3 size={14} />
            <span>{isEditMode ? 'এডিট সম্পন্ন' : 'এডিট'}</span>
          </button>

          {Object.keys(customOverrides).length > 0 && (
            <button
              type="button"
              onClick={handleResetOverrides}
              className="flex items-center gap-1 px-2.5 h-9 bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 rounded-none text-xs font-black transition-all cursor-pointer shadow-xs"
              title="ডিফল্ট ডাটায় রিসেট করুন"
            >
              <RotateCcw size={13} />
              <span>রিসেট</span>
            </button>
          )}

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
        <div className="w-full overflow-x-auto border border-slate-800 bg-white">
          <table id="yearly-return-active-table" className="w-full border-collapse text-center table-fixed">
            <colgroup>
              <col className="w-[4.2%]" />  {/* ১: ক্রমিক নং */}
              <col className="w-[16.8%]" /> {/* ২: মন্ত্রণালয়ের নাম */}
              <col className="w-[4.6%]" />  {/* ৩: সংখ্যা (১/৩ অংশ প্রস্থ কমানো হয়েছে) */}
              <col className="w-[9.8%]" />  {/* ৪: জড়িত টাকার পরিমাণ */}
              <col className="w-[4.4%]" />  {/* ৫: সংখ্যা (১/৩ অংশ প্রস্থ কমানো হয়েছে) */}
              <col className="w-[9.2%]" />  {/* ৬: জড়িত টাকার পরিমাণ */}
              <col className="w-[5.2%]" />  {/* ৭=(৩+৫): সংখ্যা (১/৩ অংশ প্রস্থ কমানো হয়েছে) */}
              <col className="w-[9.8%]" />  {/* ৮=(৪+৬): জড়িত টাকার পরিমাণ */}
              <col className="w-[8.2%]" />  {/* ৯: ব্রডশীট জবাবের সংখ্যা */}
              <col className="w-[4.6%]" />  {/* ১০: সংখ্যা (১/৩ অংশ প্রস্থ কমানো হয়েছে) */}
              <col className="w-[9.2%]" />  {/* ১১: জড়িত টাকার পরিমাণ */}
              <col className="w-[5.4%]" />  {/* ১২=(৭-১০): সংখ্যা (১/৩ অংশ প্রস্থ কমানো হয়েছে) */}
              <col className="w-[8.6%]" />  {/* ১৩=(৮-১১): জড়িত টাকার পরিমাণ */}
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
                <th rowSpan={2} className={thCls}>
                  <div>ব্রডশীট জবাবের সংখ্যা</div>
                  <div className="font-semibold text-[10.5px]">(SFI+NONSFI)</div>
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
                    {renderEditableCell(r.ministryName, 'settledCount', r.settledCount, fmtIntPlain(r.settledCount))}
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
                <td className={`${tdCls} !px-1 font-extrabold`}>{fmtIntPlain(totals.settledCount)}</td>
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
        <div className="w-full overflow-x-auto border border-slate-800 bg-white">
          <table id="yearly-return-active-table" className="w-full border-collapse text-center table-fixed">
            <colgroup>
              <col className="w-[3.8%]" />  {/* ১: ক্রমিক নং */}
              <col className="w-[14.2%]" /> {/* ২: মন্ত্রণালয়ের নাম */}
              <col className="w-[4.2%]" />  {/* ৩: সংখ্যা */}
              <col className="w-[8.6%]" />  {/* ৪: জড়িত টাকার পরিমাণ */}
              <col className="w-[4.0%]" />  {/* ৫: সংখ্যা */}
              <col className="w-[8.0%]" />  {/* ৬: জড়িত টাকার পরিমাণ */}
              <col className="w-[4.6%]" />  {/* ৭=৩+৫: সংখ্যা */}
              <col className="w-[8.6%]" />  {/* ৮=৪+৬: জড়িত টাকার পরিমাণ */}
              <col className="w-[5.2%]" />  {/* ৯: ব্রডশীট জবাবের সংখ্যা */}
              <col className="w-[4.2%]" />  {/* ১০: সংখ্যা */}
              <col className="w-[8.2%]" />  {/* ১১: জড়িত টাকার পরিমাণ */}
              <col className="w-[4.8%]" />  {/* ১২=৭-১০: সংখ্যা */}
              <col className="w-[8.4%]" />  {/* ১৩=৮-১১: জড়িত টাকার পরিমাণ */}
              <col className="w-[6.6%]" />  {/* ১৪: আদায় */}
              <col className="w-[6.6%]" />  {/* ১৫: সমন্বয় */}
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
                <th rowSpan={2} className={thCls}>
                  ব্রডশীট জবাবের সংখ্যা
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
                    {renderEditableCell(r.ministryName, 'settledCount', r.settledCount, fmtIntPlain(r.settledCount))}
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
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.settledCount)}</td>
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
        <div className="w-full overflow-x-auto border border-slate-800 bg-white">
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
                <th rowSpan={2} className={`${thCls} min-w-[115px]`}>
                  ব্রডশীট জবাবের সংখ্যা
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
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'bsrCount', r.bsrCount, fmtIntPlain(r.bsrCount))}
                  </td>
                  <td className={tdCls}>
                    {renderEditableCell(r.ministryName, 'settledCount', r.settledCount, fmtIntPlain(r.settledCount))}
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
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.raisedCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.raisedAmount, false, false)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.bsrCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.settledCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.settledAmount, false, true)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtIntPlain(totals.unsettledCount)}</td>
                <td className={`${tdCls} font-extrabold`}>{fmtDecTable2(totals.unsettledAmount, false, false)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default YearlyReturnView;
