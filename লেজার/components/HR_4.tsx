import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Printer, FileSpreadsheet, Building2, Search, ChevronDown, Check, HelpCircle } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP } from '../constants';
import HRLogicModal from './HRLogicModal';

interface HRProps {
  entries: SettlementEntry[];
  prevStats?: any;
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
}

export interface HRRowData {
  col3_pCount: number;
  col4_pAmount: number;
  col5_cCount: number;
  col6_cAmount: number;
  col7_sCount: number;
  col8_sAmount: number;
}

// ৭টি সুনির্দিষ্ট অডিট আপত্তির শ্রেণীবিন্যাস
export const HR4_CATEGORIES = [
  { id: 1, name: 'চুরি' },
  { id: 2, name: 'আত্মসাৎ' },
  { id: 3, name: 'ঘাটতি' },
  { id: 4, name: 'অপচয়' },
  { id: 5, name: 'বিধি বহির্ভূত পরিশোধ' },
  { id: 6, name: 'সরকারি অর্থ আদায়ে ব্যর্থতা' },
  { id: 7, name: 'অন্যান্য অনিয়ম' }
];

export const HR_4: React.FC<HRProps> = ({
  entries,
  activeCycle,
  IDBadge,
  searchTerm: initialSearchTerm = '',
  filterMinistry: initialMinistry = '',
  monthPickerElement,
  customTitle = 'ষাণ্মাসিক - ৪'
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedMinistry, setSelectedMinistry] = useState<string>(
    initialMinistry && initialMinistry !== 'সকল' ? initialMinistry : 'বাণিজ্য মন্ত্রণালয়'
  );
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [isLogicModalOpen, setIsLogicModalOpen] = useState(false);
  const minDropdownRef = useRef<HTMLDivElement>(null);

  // Available ministries
  const ministryList = useMemo(() => {
    return Object.keys(MINISTRY_ENTITY_MAP);
  }, []);

  // ৬ মাস ভিত্তিক সময়কাল নির্ধারণ
  const cyclePeriods = useMemo(() => {
    const baseDate = activeCycle?.end ? new Date(activeCycle.end) : new Date();
    const month = baseDate.getMonth();
    const year = baseDate.getFullYear();
    const isFirstHalfOfYear = month <= 5;

    if (isFirstHalfOfYear) {
      const prevYearShort = toBengaliDigits(((year - 1) % 100).toString().padStart(2, '0'));
      const currYearShort = toBengaliDigits((year % 100).toString().padStart(2, '0'));
      const fullCurrYear = toBengaliDigits(year.toString());
      return {
        prevRangeLine1: `১৫/০১/${fullCurrYear} পর্যন্ত`,
        prevRangeLine2: `ডিসেম্বর/${prevYearShort} পর্যন্ত`,
        rangeLine1: `১৬/০১/${fullCurrYear} হতে ১৫/০৬/${fullCurrYear}`,
        rangeLine2: `জানুয়ারি/${currYearShort} হতে জুন/${currYearShort}`,
        currRangeLine1: `১৫/০৬/${fullCurrYear} পর্যন্ত অনিষ্পন্ন`,
        currRangeLine2: `জুন/${currYearShort} পর্যন্ত`
      };
    } else {
      const currYearShort = toBengaliDigits((year % 100).toString().padStart(2, '0'));
      const fullCurrYear = toBengaliDigits(year.toString());
      return {
        prevRangeLine1: `১৫/০৭/${fullCurrYear} পর্যন্ত`,
        prevRangeLine2: `জুন/${currYearShort} পর্যন্ত`,
        rangeLine1: `১৬/০৭/${fullCurrYear} হতে ১৫/১২/${fullCurrYear}`,
        rangeLine2: `জুলাই/${currYearShort} হতে ডিসেম্বর/${currYearShort}`,
        currRangeLine1: `১৫/১২/${fullCurrYear} পর্যন্ত অনিষ্পন্ন`,
        currRangeLine2: `ডিসেম্বর/${currYearShort} পর্যন্ত`
      };
    }
  }, [activeCycle]);

  const defaultInitialData: Record<number, HRRowData> = {
    1: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 },
    2: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 },
    3: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 },
    4: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 },
    5: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 },
    6: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 },
    7: { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 }
  };

  const storageKey = `hr_4_data_${selectedMinistry}`;
  const [tableData, setTableData] = useState<Record<number, HRRowData>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultInitialData;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hr_4_data_${selectedMinistry}`);
      if (saved) {
        setTableData(JSON.parse(saved));
        return;
      }
    } catch {}
    setTableData(defaultInitialData);
  }, [selectedMinistry]);

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return HR4_CATEGORIES;
    return HR4_CATEGORIES.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [searchTerm]);

  const editableFields: Array<keyof HRRowData> = [
    'col3_pCount',
    'col4_pAmount',
    'col5_cCount',
    'col6_cAmount',
    'col7_sCount',
    'col8_sAmount'
  ];

  const handleCellChange = (catId: number, field: keyof HRRowData, rawVal: string) => {
    const numVal = parseBengaliNumber(rawVal);
    setTableData(prev => {
      const updated = {
        ...prev,
        [catId]: {
          ...(prev[catId] || { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 }),
          [field]: numVal
        }
      };
      try {
        localStorage.setItem(`hr_4_data_${selectedMinistry}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startRowIdx: number,
    startField: keyof HRRowData
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    e.preventDefault();

    const pastedRows = text
      .split(/\r?\n/)
      .map(row => row.split('\t'))
      .filter(row => row.length > 0 && !(row.length === 1 && row[0].trim() === ''));

    if (pastedRows.length === 0) return;

    const startColIdx = editableFields.indexOf(startField);
    if (startColIdx === -1) return;

    setTableData(prev => {
      const updated = { ...prev };
      for (let r = 0; r < pastedRows.length; r++) {
        const targetRowIdx = startRowIdx + r;
        if (targetRowIdx >= filteredCategories.length) break;
        const cat = filteredCategories[targetRowIdx];
        if (!updated[cat.id]) {
          updated[cat.id] = { col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0 };
        }
        const cols = pastedRows[r];
        for (let c = 0; c < cols.length; c++) {
          const targetColIdx = startColIdx + c;
          if (targetColIdx >= editableFields.length) break;
          const field = editableFields[targetColIdx];
          const rawVal = cols[c].trim();
          const numVal = parseBengaliNumber(rawVal);
          updated[cat.id] = {
            ...updated[cat.id],
            [field]: numVal
          };
        }
      }
      try {
        localStorage.setItem(`hr_4_data_${selectedMinistry}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Dynamic 10-column table rows
  const tableRows = useMemo(() => {
    return filteredCategories.map(cat => {
      const data = tableData[cat.id] || {
        col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0
      };

      const col3_pCount = data.col3_pCount || 0;
      const col4_pAmount = data.col4_pAmount || 0;
      const col5_cCount = data.col5_cCount || 0;
      const col6_cAmount = data.col6_cAmount || 0;
      const col7_sCount = data.col7_sCount || 0;
      const col8_sAmount = data.col8_sAmount || 0;

      // Dynamic calculation: ৯ = (৩+৫)-৭, ১০ = (৪+৬)-৮
      const col9_finalCount = (col3_pCount + col5_cCount) - col7_sCount;
      const col10_finalAmount = (col4_pAmount + col6_cAmount) - col8_sAmount;

      return {
        sl: cat.id,
        categoryName: cat.name,
        col3_pCount,
        col4_pAmount,
        col5_cCount,
        col6_cAmount,
        col7_sCount,
        col8_sAmount,
        col9_finalCount,
        col10_finalAmount
      };
    });
  }, [filteredCategories, tableData]);

  // Totals for table footer (মোট)
  const totals = useMemo(() => {
    return tableRows.reduce(
      (acc, r) => ({
        col3_pCount: acc.col3_pCount + r.col3_pCount,
        col4_pAmount: acc.col4_pAmount + r.col4_pAmount,
        col5_cCount: acc.col5_cCount + r.col5_cCount,
        col6_cAmount: acc.col6_cAmount + r.col6_cAmount,
        col7_sCount: acc.col7_sCount + r.col7_sCount,
        col8_sAmount: acc.col8_sAmount + r.col8_sAmount,
        col9_finalCount: acc.col9_finalCount + r.col9_finalCount,
        col10_finalAmount: acc.col10_finalAmount + r.col10_finalAmount
      }),
      {
        col3_pCount: 0,
        col4_pAmount: 0.0,
        col5_cCount: 0,
        col6_cAmount: 0.0,
        col7_sCount: 0,
        col8_sAmount: 0.0,
        col9_finalCount: 0,
        col10_finalAmount: 0.0
      }
    );
  }, [tableRows]);

  const formatCount = (val: number) => {
    if (!val || val === 0) return '০';
    return toBengaliDigits(Math.round(val).toLocaleString('en-IN'));
  };

  const formatAmount = (val: number, forceDecimal = false) => {
    if (!val || val === 0) {
      return forceDecimal ? '০.০০০০' : '০';
    }
    const fixed = val.toFixed(4);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = Number(intPart).toLocaleString('en-IN');
    return toBengaliDigits(`${formattedInt}.${decPart}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const filename = `Half_Yearly_Return_4_${selectedMinistry.replace(/\s+/g, '_')}.xls`;
    const rowsHtml = tableRows
      .map(
        r => `
        <tr>
          <td>${toBengaliDigits(r.sl.toString())}</td>
          <td style="text-align: left;">${r.categoryName}</td>
          <td>${formatCount(r.col3_pCount)}</td>
          <td>${formatAmount(r.col4_pAmount)}</td>
          <td>${formatCount(r.col5_cCount)}</td>
          <td>${formatAmount(r.col6_cAmount, true)}</td>
          <td>${formatCount(r.col7_sCount)}</td>
          <td>${formatAmount(r.col8_sAmount, true)}</td>
          <td>${formatCount(r.col9_finalCount)}</td>
          <td>${formatAmount(r.col10_finalAmount)}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; text-align: center; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .bg-total { background-color: #0f172a; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center;">ষাণ্মাসিক অডিট আপত্তি/নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ</h2>
        <h4 style="text-align: center;">মন্ত্রণালয়: ${selectedMinistry} | নন-এসএফআই</h4>
        <h5 style="text-align: center;">সময়কাল: ${cyclePeriods.rangeLine1} (${cyclePeriods.rangeLine2})</h5>
        <table>
          <thead>
            <tr>
              <th rowspan="2">১</th>
              <th rowspan="2">২</th>
              <th colspan="2">${cyclePeriods.prevRangeLine1} (${cyclePeriods.prevRangeLine2})</th>
              <th colspan="4">${cyclePeriods.rangeLine1} (${cyclePeriods.rangeLine2})</th>
              <th colspan="2">${cyclePeriods.currRangeLine1} (${cyclePeriods.currRangeLine2})</th>
            </tr>
            <tr>
              <th>পূর্ববর্তী ৬ মাস পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th>আলোচ্য ৬ মাসে উত্থাপিত আপত্তির সংখ্যা</th>
              <th>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th>আলোচ্য ৬ মাসে নিষ্পত্তির সংখ্যা</th>
              <th>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th>ষাণ্মাসিক শেষে অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th>অনিষ্পন্ন আপত্তিতে জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
            </tr>
            <tr>
              <th>১</th><th>২</th><th>৩</th><th>৪</th><th>৫</th><th>৬</th><th>৭</th><th>৮</th><th>৯: (৩+৫)-৭</th><th>১০: (৪+৬)-৮</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="bg-total">
              <td colspan="2">মোট</td>
              <td>${formatCount(totals.col3_pCount)}</td>
              <td>${formatAmount(totals.col4_pAmount)}</td>
              <td>${formatCount(totals.col5_cCount)}</td>
              <td>${formatAmount(totals.col6_cAmount, true)}</td>
              <td>${formatCount(totals.col7_sCount)}</td>
              <td>${formatAmount(totals.col8_sAmount, true)}</td>
              <td>${formatCount(totals.col9_finalCount)}</td>
              <td>${formatAmount(totals.col10_finalAmount)}</td>
            </tr>
          </tfoot>
        </table>
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

  const thCls = "border-r border-b border-slate-300 p-1.5 text-[9.5px] font-bold text-slate-800 bg-[#f8fafc] align-middle text-center";
  const thClsWithTop = thCls + " border-t border-slate-300";
  const tdCls = "p-1.5 text-[10px] text-slate-700 align-middle border-r border-b border-slate-300";
  const numTdCls = "p-1 text-[10px] text-slate-800 text-center align-middle font-bold border-r border-b border-slate-300 tabular-nums";

  return (
    <div id="hr-4-container" className="w-full mx-auto py-3 px-2 bg-white rounded-none relative animate-in fade-in duration-300 font-sans">
      <IDBadge id="hr-4-container" />

      {/* Top Action Bar (100% Square Corners) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-slate-300 no-print">
        {/* Left Side: Ministry Selector & Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ministry Dropdown */}
          <div className="relative" ref={minDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMinistryDropdownOpen(!isMinistryDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-none text-xs font-black text-slate-800 shadow-xs transition-all cursor-pointer"
            >
              <Building2 size={14} className="text-blue-600" />
              <span>{selectedMinistry}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isMinistryDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-300 rounded-none shadow-xl z-[200] max-h-72 overflow-y-auto">
                <div className="p-1">
                  {ministryList.map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setSelectedMinistry(min);
                        setIsMinistryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold rounded-none transition-colors cursor-pointer ${
                        selectedMinistry === min ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{min}</span>
                      {selectedMinistry === min && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Month / Period Picker */}
          {monthPickerElement && (
            <div className="flex items-center">
              {monthPickerElement}
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="শ্রেণী খুঁজুন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-none text-xs outline-none w-40 sm:w-48 transition-all"
            />
          </div>
        </div>

        {/* Right Side: Logic Modal, Excel, Print */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Logic Modal Button */}
          <button
            type="button"
            onClick={() => setIsLogicModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-none text-xs font-black transition-all cursor-pointer shadow-xs"
            title="কলামগুলোর হিসাবের লজিক ও সূত্রাবলি দেখুন"
          >
            <HelpCircle size={14} className="text-blue-600" />
            <span>হিসাবের লজিক</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all rounded-none cursor-pointer shrink-0 shadow-xs"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} className="stroke-[2.5]" />
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center w-8 h-8 bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 transition-all rounded-none cursor-pointer shrink-0 shadow-xs"
            title="প্রিন্ট করুন"
          >
            <Printer size={15} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-2">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight underline underline-offset-4 decoration-slate-400">
          ষাণ্মাসিক অডিট আপত্তি/নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ
        </h1>
      </div>

      {/* Subtitles: Left (মন্ত্রণালয়ের নাম) | Right (নন-এসএফআই) */}
      <div className="mb-2 text-[11px] font-bold text-slate-900 flex flex-row items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span>মন্ত্রণালয়ের নাম:</span>
          <span className="font-extrabold text-blue-950">{selectedMinistry}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900">নন-এসএফআই</span>
          <span className="text-slate-700 font-bold text-[10.5px] hidden sm:inline bg-slate-100 px-2 py-0.5 rounded-none border border-slate-300">
            সময়কাল: {cyclePeriods.rangeLine1} ({cyclePeriods.rangeLine2})
          </span>
        </div>
      </div>

      {/* Scoped Sticky Table Container with Screen Bottom Fixed Footer */}
      <style>{`
        #hr-4-table-container {
          width: 100% !important;
          overflow: visible !important;
          position: relative !important;
          border-radius: 0px !important;
        }
        #hr-4-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          width: 100%;
        }
        #hr-4-table thead {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0px !important;
          z-index: 150 !important;
        }
        #hr-4-table thead th {
          position: -webkit-sticky !important;
          position: sticky !important;
          background-clip: padding-box !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          opacity: 1 !important;
        }
        #hr-4-table thead tr:first-child {
          height: 46px !important;
        }
        #hr-4-table thead tr:first-child th {
          top: 0px !important;
          height: 46px !important;
          z-index: 160 !important;
        }
        #hr-4-table thead tr:nth-child(2) {
          height: 46px !important;
        }
        #hr-4-table thead tr:nth-child(2) th {
          top: 46px !important;
          height: 46px !important;
          z-index: 155 !important;
        }
        #hr-4-table thead tr:nth-child(3) {
          height: 32px !important;
        }
        #hr-4-table thead tr:nth-child(3) th {
          top: 92px !important;
          height: 32px !important;
          z-index: 150 !important;
        }
        #hr-4-table thead tr:first-child th[rowspan="2"] {
          top: 0px !important;
          height: 92px !important;
          z-index: 165 !important;
        }
        #hr-4-table tfoot {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          z-index: 170 !important;
        }
        #hr-4-table tfoot tr {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          background-color: #0f172a !important;
        }
        #hr-4-table tfoot th,
        #hr-4-table tfoot td {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          z-index: 170 !important;
          background-color: #0f172a !important;
          color: #ffffff !important;
          box-shadow: 0 -3px 8px rgba(0, 0, 0, 0.45) !important;
        }
      `}</style>

      {/* Table Section (Editable & Pasteable from Excel just like Monthly/Quarterly Returns) */}
      <div id="hr-4-table-container" className="table-container qr-table-container shadow-xs rounded-none border border-slate-400 bg-white">
        <table id="hr-4-table" className="w-full text-center border-collapse">
          <thead>
            {/* Header Row 1 */}
            <tr className="h-[46px] bg-[#f8fafc]">
              <th rowSpan={2} className={`${thClsWithTop} w-[42px]`}>
                ক্রমিক
              </th>
              <th rowSpan={2} className={`${thClsWithTop} min-w-[170px]`}>
                শ্রেণী
              </th>
              <th colSpan={2} className={`${thClsWithTop} min-w-[210px] py-1`}>
                <div className="font-extrabold text-slate-900 text-[11px]">{cyclePeriods.prevRangeLine1}</div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">“{cyclePeriods.prevRangeLine2}”</div>
              </th>
              <th colSpan={4} className={`${thClsWithTop} min-w-[420px] py-1 bg-blue-50/60`}>
                <div className="font-black text-blue-950 text-[12px] tracking-wide">{cyclePeriods.rangeLine1}</div>
                <div className="text-[10.5px] font-bold text-blue-800 mt-0.5">“{cyclePeriods.rangeLine2}”</div>
              </th>
              <th colSpan={2} className={`${thClsWithTop} min-w-[220px] py-1`}>
                <div className="font-extrabold text-slate-900 text-[11px]">{cyclePeriods.currRangeLine1}</div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">“{cyclePeriods.currRangeLine2}”</div>
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="h-[46px] bg-[#f8fafc]">
              <th className={`${thCls} min-w-[105px]`}>পূর্ববর্তী ৬ মাস পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[110px]`}>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th className={`${thCls} min-w-[95px]`}>আলোচ্য ৬ মাসে উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[110px]`}>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th className={`${thCls} min-w-[95px]`}>আলোচ্য ৬ মাসে নিষ্পত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[110px]`}>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th className={`${thCls} min-w-[105px]`}>ষাণ্মাসিক শেষে অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[125px]`}>অনিষ্পন্ন আপত্তিতে জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
            </tr>

            {/* Header Row 3: Column Numbers and Formulas */}
            <tr className="h-[32px] bg-[#f8fafc] font-bold text-[9.5px] text-slate-800">
              <th className={thCls}>১</th>
              <th className={thCls}>২</th>
              <th className={thCls}>৩</th>
              <th className={thCls}>৪</th>
              <th className={thCls}>৫</th>
              <th className={thCls}>৬</th>
              <th className={thCls}>৭</th>
              <th className={thCls}>৮</th>
              <th className={thCls}>
                <div className="font-black text-[10px]">৯</div>
                <div className="text-[8.5px] text-slate-600 font-bold">(৩+৫)-৭</div>
              </th>
              <th className={thCls}>
                <div className="font-black text-[10px]">১০</div>
                <div className="text-[8.5px] text-slate-600 font-bold">(৪+৬)-৮</div>
              </th>
            </tr>
          </thead>

          <tbody>
            {tableRows.map((row, idx) => (
              <tr key={row.sl} className="hover:bg-amber-50/20 transition-colors">
                <td className={numTdCls}>{toBengaliDigits(row.sl.toString())}</td>
                <td className={`${tdCls} text-left pl-3 font-semibold text-slate-900`}>
                  <HighlightText text={row.categoryName} searchTerm={searchTerm} />
                </td>
                
                {/* Column 3: Input with Excel Copy/Paste */}
                <td className="p-1 border-r border-b border-slate-300 bg-amber-50/15">
                  <input
                    type="text"
                    className="w-full text-center font-bold text-xs bg-transparent hover:bg-amber-100/40 focus:bg-white border border-transparent hover:border-amber-300 focus:border-blue-600 rounded-none px-1 py-1 text-slate-900 outline-none transition-all tabular-nums"
                    value={row.col3_pCount === 0 ? '' : toBengaliDigits(row.col3_pCount.toString())}
                    placeholder="০"
                    onChange={e => handleCellChange(row.sl, 'col3_pCount', e.target.value)}
                    onPaste={e => handlePaste(e, idx, 'col3_pCount')}
                  />
                </td>

                {/* Column 4: Input with Excel Copy/Paste */}
                <td className="p-1 border-r border-b border-slate-300 bg-amber-50/15">
                  <input
                    type="text"
                    className="w-full text-center font-bold text-xs bg-transparent hover:bg-amber-100/40 focus:bg-white border border-transparent hover:border-amber-300 focus:border-blue-600 rounded-none px-1 py-1 text-slate-900 outline-none transition-all tabular-nums"
                    value={row.col4_pAmount === 0 ? '' : toBengaliDigits(row.col4_pAmount.toString())}
                    placeholder="০.০০"
                    onChange={e => handleCellChange(row.sl, 'col4_pAmount', e.target.value)}
                    onPaste={e => handlePaste(e, idx, 'col4_pAmount')}
                  />
                </td>

                {/* Column 5: Input with Excel Copy/Paste */}
                <td className="p-1 border-r border-b border-slate-300 bg-blue-50/20">
                  <input
                    type="text"
                    className="w-full text-center font-bold text-xs bg-transparent hover:bg-blue-100/40 focus:bg-white border border-transparent hover:border-blue-300 focus:border-blue-600 rounded-none px-1 py-1 text-slate-900 outline-none transition-all tabular-nums"
                    value={row.col5_cCount === 0 ? '' : toBengaliDigits(row.col5_cCount.toString())}
                    placeholder="০"
                    onChange={e => handleCellChange(row.sl, 'col5_cCount', e.target.value)}
                    onPaste={e => handlePaste(e, idx, 'col5_cCount')}
                  />
                </td>

                {/* Column 6: Input with Excel Copy/Paste */}
                <td className="p-1 border-r border-b border-slate-300 bg-blue-50/20">
                  <input
                    type="text"
                    className="w-full text-center font-bold text-xs bg-transparent hover:bg-blue-100/40 focus:bg-white border border-transparent hover:border-blue-300 focus:border-blue-600 rounded-none px-1 py-1 text-slate-900 outline-none transition-all tabular-nums"
                    value={row.col6_cAmount === 0 ? '' : toBengaliDigits(row.col6_cAmount.toString())}
                    placeholder="০.০০"
                    onChange={e => handleCellChange(row.sl, 'col6_cAmount', e.target.value)}
                    onPaste={e => handlePaste(e, idx, 'col6_cAmount')}
                  />
                </td>

                {/* Column 7: Input with Excel Copy/Paste */}
                <td className="p-1 border-r border-b border-slate-300 bg-emerald-50/20">
                  <input
                    type="text"
                    className="w-full text-center font-bold text-xs bg-transparent hover:bg-emerald-100/40 focus:bg-white border border-transparent hover:border-emerald-300 focus:border-blue-600 rounded-none px-1 py-1 text-slate-900 outline-none transition-all tabular-nums"
                    value={row.col7_sCount === 0 ? '' : toBengaliDigits(row.col7_sCount.toString())}
                    placeholder="০"
                    onChange={e => handleCellChange(row.sl, 'col7_sCount', e.target.value)}
                    onPaste={e => handlePaste(e, idx, 'col7_sCount')}
                  />
                </td>

                {/* Column 8: Input with Excel Copy/Paste */}
                <td className="p-1 border-r border-b border-slate-300 bg-emerald-50/20">
                  <input
                    type="text"
                    className="w-full text-center font-bold text-xs bg-transparent hover:bg-emerald-100/40 focus:bg-white border border-transparent hover:border-emerald-300 focus:border-blue-600 rounded-none px-1 py-1 text-slate-900 outline-none transition-all tabular-nums"
                    value={row.col8_sAmount === 0 ? '' : toBengaliDigits(row.col8_sAmount.toString())}
                    placeholder="০.০০"
                    onChange={e => handleCellChange(row.sl, 'col8_sAmount', e.target.value)}
                    onPaste={e => handlePaste(e, idx, 'col8_sAmount')}
                  />
                </td>

                {/* Column 9: Auto Calculated (৩+৫)-৭ */}
                <td className={`${numTdCls} bg-slate-50 font-black text-blue-950`}>
                  {formatCount(row.col9_finalCount)}
                </td>

                {/* Column 10: Auto Calculated (৪+৬)-৮ */}
                <td className={`${numTdCls} bg-slate-50 font-black text-blue-950`}>
                  {formatAmount(row.col10_finalAmount)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Table Footer: Fixed to screen bottom */}
          <tfoot className="qr-sticky-footer-bottom">
            <tr className="h-[40px] font-black text-white bg-slate-900 border-t-2 border-slate-700">
              <td colSpan={2} className="p-2 text-right text-xs sm:text-[13px] font-black uppercase tracking-wider border border-slate-700 bg-slate-900 text-white">
                মোট
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatCount(totals.col3_pCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatAmount(totals.col4_pAmount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatCount(totals.col5_cCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatAmount(totals.col6_cAmount, true)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatCount(totals.col7_sCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatAmount(totals.col8_sAmount, true)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-950 text-amber-300 tabular-nums shadow-inner">
                {formatCount(totals.col9_finalCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-950 text-amber-300 tabular-nums shadow-inner">
                {formatAmount(totals.col10_finalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Official Bottom Note & Cycle Reference */}
      <div className="mt-3 px-3 py-2 bg-slate-50 border border-slate-300 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10.5px] text-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded-none text-[10px]">বিশেষ দ্রষ্টব্য</span>
          <span className="font-medium">টাকার পরিমাণ কোটি টাকায় প্রদর্শিত। ৯ ও ১০ নং কলামের ফলাফল স্বয়ংক্রিয় সূত্রে (৩+৫)-৭ এবং (৪+৬)-৮ হিসাবকৃত। সেলগুলোতে সরাসরি এক্সেল হতে ডাটা পেস্ট করা যাবে।</span>
        </div>
        <div className="text-[10.5px] font-bold text-blue-950 shrink-0">
          ষাণ্মাসিক হিসাব চক্র: <span className="underline decoration-blue-500 font-extrabold">{cyclePeriods.rangeLine1} ({cyclePeriods.rangeLine2})</span>
        </div>
      </div>

      {/* Official 3-tier Signatures */}
      <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[11px] font-bold text-slate-800 print:mt-12">
        <div>
          <div className="h-8 border-b border-dashed border-slate-400 mb-1 mx-auto max-w-[170px]"></div>
          <p className="font-extrabold text-slate-900 text-[11px]">প্রস্তুতকারী</p>
          <p className="text-[10px] text-slate-600 font-medium">নিরীক্ষক / ডাটা এন্ট্রি অপারেটর</p>
          <p className="text-[9px] text-slate-500 mt-0.5">তারিখ: .......................</p>
        </div>
        <div>
          <div className="h-8 border-b border-dashed border-slate-400 mb-1 mx-auto max-w-[170px]"></div>
          <p className="font-extrabold text-slate-900 text-[11px]">যাচাইকারী</p>
          <p className="text-[10px] text-slate-600 font-medium">অডিট অ্যান্ড একাউন্টস অফিসার</p>
          <p className="text-[9px] text-slate-500 mt-0.5">তারিখ: .......................</p>
        </div>
        <div>
          <div className="h-8 border-b border-dashed border-slate-400 mb-1 mx-auto max-w-[170px]"></div>
          <p className="font-extrabold text-slate-900 text-[11px]">অনুমোদনকারী</p>
          <p className="text-[10px] text-slate-600 font-medium">উপ-পরিচালক / পরিচালক</p>
          <p className="text-[9px] text-slate-500 mt-0.5">তারিখ: .......................</p>
        </div>
      </div>

      {/* Calculation Logic Details Modal */}
      <HRLogicModal
        isOpen={isLogicModalOpen}
        onClose={() => setIsLogicModalOpen(false)}
        reportName={customTitle}
        ministryName={selectedMinistry}
        cyclePeriods={cyclePeriods}
      />
    </div>
  );
};

export default HR_4;
