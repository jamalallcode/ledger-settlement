import React, { useMemo, useState, useEffect } from 'react';
import { Printer, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber, extractEntryDate } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP } from '../constants';

interface QRProps {
  entries: SettlementEntry[];
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
  paraType?: 'এসএফআই' | 'নন এসএফআই';
}

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

// Categorization helper
const isFinancialInstitution = (ministryName: string) => {
  return robustNormalize(ministryName).includes(robustNormalize('আর্থিক প্রতিষ্ঠান বিভাগ'));
};

const QR_6: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle, paraType = 'এসএফআই' }) => {
  // Standard calendar quarter date calculation:
  // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
  // Each quarter start date is the 16th of the month preceding the quarter's start month.
  // Each quarter end date is the 15th of the quarter's end month.
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

    const start = new Date(quarterYear, quarterStartMonth, 1);
    const end = new Date(quarterYear, quarterEndMonth + 1, 0);
    
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const startMonthName = months[quarterStartMonth];
    const endMonthName = months[quarterEndMonth];
    
    const startYearShort = format(new Date(quarterYear, quarterStartMonth, 1), 'yy');
    const endYearShort = format(new Date(quarterYear, quarterEndMonth, 1), 'yy');

    const formattedRange = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;
    
    return {
      startDate: start,
      endDate: end,
      startMonthName,
      endMonthName,
      formattedRange
    };
  };

  const { startDate, endDate, startMonthName, endMonthName } = getQuarterInfo(activeCycle.end);
  const formattedRange = activeCycle.label;

  const downloadExcel = () => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return;

    let tablesHtml = '';
    tables.forEach((table, tableIdx) => {
      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
      interactiveElements.forEach(el => el.remove());
      
      tablesHtml += `
        <div style="margin-bottom: 40px;">
          ${tableIdx > 0 ? '<br><hr><br>' : ''}
          ${clonedTable.outerHTML}
        </div>
      `;
    });

    const filename = `${(customTitle || 'ত্রৈমাসিক_রিটার্ন_৬').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .bg-sky-100 { background-color: #e0f2fe !important; }
          .bg-amber-50 { background-color: #fef3c7 !important; }
          .bg-black { background-color: #090d16 !important; color: #ffffff !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${customTitle || 'ত্রৈমাসিক রিটার্ন - ৬'}</h2>
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
  };

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  // Dynamic extraction of all entities matching the active paraType
  const entitiesList = useMemo(() => {
    const list: { ministryName: string; entityName: string }[] = [];
    const isFI = paraType === 'এসএফআই';
    Object.entries(MINISTRY_ENTITY_MAP).forEach(([mName, entities]) => {
      if (isFI === isFinancialInstitution(mName)) {
        entities.forEach(ent => {
          list.push({ ministryName: mName, entityName: ent });
        });
      }
    });
    return list;
  }, [paraType]);

  const [isPrevLedgerOpen, setIsPrevLedgerOpen] = useState(false);

  const [cutoffMonth, setCutoffMonth] = useState(() => {
    const saved = localStorage.getItem('opening_balance_cutoff_month');
    if (saved) {
      const [y, m] = saved.split('-').map(Number);
      if (y > 2025 || (y === 2025 && m >= 12)) {
        return saved;
      }
    }
    return '2026-03';
  });

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const startYear = 2024;
    const monthNamesBN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    
    for (let y = currentYear; y >= startYear; y--) {
      const maxM = (y === currentYear) ? currentMonth : 11;
      for (let m = maxM; m >= 0; m--) {
        if (y < 2026 || (y === 2026 && m < 2)) {
          continue;
        }
        const val = `${y}-${String(m + 1).padStart(2, '0')}`;
        const lbl = `${monthNamesBN[m]}/${toBengaliDigits(y.toString())}`;
        options.push({ value: val, label: lbl });
      }
    }
    return options;
  };

  const getCutoffMonthInfo = (monthStr: string) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const [yearNum, monthNum] = monthStr.split('-').map(Number);
    const mIdx = monthNum - 1;
    const monthNameBN = months[mIdx];
    const yearBN = toBengaliDigits(yearNum.toString());
    const yearShortBN = toBengaliDigits(String(yearNum).slice(-2));
    
    const nextMonthDate = new Date(yearNum, mIdx + 1, 1);
    const nextMonthNameBN = months[nextMonthDate.getMonth()];
    const nextMonthYearBN = toBengaliDigits(nextMonthDate.getFullYear().toString());
    const nextMonthStrStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

    return {
      monthNameBN,
      yearBN,
      yearShortBN,
      formattedLong: `${monthNameBN}/${yearBN}`,
      formattedShort: `${monthNameBN}/${yearShortBN}`,
      nextMonthNameBN,
      nextMonthYearBN,
      nextMonthFormattedLong: `${nextMonthNameBN}/${nextMonthYearBN}`,
      transitionStartStr: nextMonthStrStr
    };
  };

  const cutoffInfo = getCutoffMonthInfo(cutoffMonth);

  const getStorageKey = (monthStr: string) => {
    if (monthStr === '2025-06') return `qr6_prev_ledger_june2025_${paraType}`;
    return `qr6_prev_ledger_${monthStr}_${paraType}`;
  };

  const [prevLedgerData, setPrevLedgerData] = useState<Record<string, {
    june25Involved: number;
    june25TaxRec: number;
    june25TaxAdj: number;
    june25OtherRec: number;
    june25OtherAdj: number;
  }>>(() => {
    const initialMonth = localStorage.getItem('opening_balance_cutoff_month') || '2025-06';
    const key = initialMonth === '2025-06' ? `qr6_prev_ledger_june2025_${paraType}` : `qr6_prev_ledger_${initialMonth}_${paraType}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  // Load and sync from localStorage when cutoffMonth changes
  useEffect(() => {
    const key = getStorageKey(cutoffMonth);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setPrevLedgerData(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setPrevLedgerData({});
    }
  }, [cutoffMonth, paraType]);

  // Ensure every entity has defaults
  const normalizedPrevLedgerData = useMemo(() => {
    const data = { ...prevLedgerData };
    entitiesList.forEach(({ entityName }) => {
      if (!data[entityName]) {
        data[entityName] = {
          june25Involved: 0,
          june25TaxRec: 0,
          june25TaxAdj: 0,
          june25OtherRec: 0,
          june25OtherAdj: 0
        };
      }
    });
    return data;
  }, [prevLedgerData, entitiesList]);

  const handleSavePrevLedger = (updated: typeof prevLedgerData) => {
    setPrevLedgerData(updated);
    const key = getStorageKey(cutoffMonth);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleInputChange = (entName: string, field: string, value: number) => {
    const updated = {
      ...prevLedgerData,
      [entName]: {
        ...(normalizedPrevLedgerData[entName] || {
          june25Involved: 0,
          june25TaxRec: 0,
          june25TaxAdj: 0,
          june25OtherRec: 0,
          june25OtherAdj: 0
        }),
        [field]: value
      }
    };
    handleSavePrevLedger(updated);
  };

  const prevLedgerRows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    entitiesList.forEach(({ ministryName, entityName }) => {
      const ledger = normalizedPrevLedgerData[entityName] || {
        june25Involved: 0,
        june25TaxRec: 0,
        june25TaxAdj: 0,
        june25OtherRec: 0,
        june25OtherAdj: 0
      };
      
      // Calculate transition entries from July 1, 2025 up to cycle start
      const cycleStartStr = format(startDate, 'yyyy-MM-dd');
      const transitionEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.ministryName) !== robustNormalize(ministryName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;

        const entryDate = extractEntryDate(e);
        return entryDate !== '' && entryDate >= cutoffInfo.transitionStartStr && entryDate < cycleStartStr;
      });

      let transInvolved = 0;
      let transTaxRec = 0;
      let transTaxAdj = 0;
      let transOtherRec = 0;
      let transOtherAdj = 0;

      transitionEntries.forEach(e => {
        transInvolved += (e.involvedAmount || 0);
        transTaxRec += (e.vatRec || 0) + (e.itRec || 0);
        transTaxAdj += (e.vatAdj || 0) + (e.itAdj || 0);
        transOtherRec += (e.othersRec || 0);
        transOtherAdj += (e.othersAdj || 0);
      });

      const totalInvolved = ledger.june25Involved + transInvolved;
      const totalTaxRec = ledger.june25TaxRec + transTaxRec;
      const totalTaxAdj = ledger.june25TaxAdj + transTaxAdj;
      const totalOtherRec = ledger.june25OtherRec + transOtherRec;
      const totalOtherAdj = ledger.june25OtherAdj + transOtherAdj;

      rows.push({
        sl,
        ministryName,
        entityName,
        june25Involved: ledger.june25Involved,
        june25TaxRec: ledger.june25TaxRec,
        june25TaxAdj: ledger.june25TaxAdj,
        june25OtherRec: ledger.june25OtherRec,
        june25OtherAdj: ledger.june25OtherAdj,
        transInvolved,
        transTaxRec,
        transTaxAdj,
        transOtherRec,
        transOtherAdj,
        totalInvolved,
        totalTaxRec,
        totalTaxAdj,
        totalOtherRec,
        totalOtherAdj
      });
      
      sl++;
    });

    return rows;
  }, [entitiesList, normalizedPrevLedgerData, entries, startDate, paraType]);

  const prevLedgerGrandTotals = useMemo(() => {
    return prevLedgerRows.reduce((acc, r) => ({
      june25Involved: acc.june25Involved + r.june25Involved,
      june25TaxRec: acc.june25TaxRec + r.june25TaxRec,
      june25TaxAdj: acc.june25TaxAdj + r.june25TaxAdj,
      june25OtherRec: acc.june25OtherRec + r.june25OtherRec,
      june25OtherAdj: acc.june25OtherAdj + r.june25OtherAdj,
      transInvolved: acc.transInvolved + r.transInvolved,
      transTaxRec: acc.transTaxRec + r.transTaxRec,
      transTaxAdj: acc.transTaxAdj + r.transTaxAdj,
      transOtherRec: acc.transOtherRec + r.transOtherRec,
      transOtherAdj: acc.transOtherAdj + r.transOtherAdj,
      totalInvolved: acc.totalInvolved + r.totalInvolved,
      totalTaxRec: acc.totalTaxRec + r.totalTaxRec,
      totalTaxAdj: acc.totalTaxAdj + r.totalTaxAdj,
      totalOtherRec: acc.totalOtherRec + r.totalOtherRec,
      totalOtherAdj: acc.totalOtherAdj + r.totalOtherAdj
    }), {
      june25Involved: 0, june25TaxRec: 0, june25TaxAdj: 0, june25OtherRec: 0, june25OtherAdj: 0,
      transInvolved: 0, transTaxRec: 0, transTaxAdj: 0, transOtherRec: 0, transOtherAdj: 0,
      totalInvolved: 0, totalTaxRec: 0, totalTaxAdj: 0, totalOtherRec: 0, totalOtherAdj: 0
    });
  }, [prevLedgerRows]);

  const handlePaste = (e: React.ClipboardEvent, startRowIdx: number, field: string) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    const rowsText = clipboardData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    const updated = { ...prevLedgerData };
    const fieldsOrder = [
      'june25Involved',
      'june25TaxRec',
      'june25TaxAdj',
      'june25OtherRec',
      'june25OtherAdj'
    ];
    const startFieldIdx = fieldsOrder.indexOf(field);

    rowsText.forEach((rowText, rowOffset) => {
      const targetRowIdx = startRowIdx + rowOffset;
      if (targetRowIdx >= prevLedgerRows.length) return;
      
      const targetEntity = prevLedgerRows[targetRowIdx].entityName;
      const cols = rowText.split('\t');

      cols.forEach((colText, colOffset) => {
        const targetFieldIdx = startFieldIdx + colOffset;
        if (targetFieldIdx >= fieldsOrder.length) return;
        
        const targetField = fieldsOrder[targetFieldIdx];
        const numericVal = parseBengaliNumber(colText.trim());
        
        if (!updated[targetEntity]) {
          updated[targetEntity] = {
            june25Involved: 0,
            june25TaxRec: 0,
            june25TaxAdj: 0,
            june25OtherRec: 0,
            june25OtherAdj: 0
          };
        }
        updated[targetEntity][targetField] = numericVal;
      });
    });

    handleSavePrevLedger(updated);
  };

  const filteredData = useMemo(() => {
    const ministryMap = new Map<string, any>();

    // 1. Initialize with previous ledger totals for each ministry
    prevLedgerRows.forEach(r => {
      const mName = r.ministryName;
      if (!ministryMap.has(mName)) {
        ministryMap.set(mName, {
          name: mName,
          involved: 0,
          taxRec: 0,
          taxAdj: 0,
          otherRec: 0,
          otherAdj: 0,
          remarks: "০"
        });
      }
      const data = ministryMap.get(mName);
      data.involved += r.totalInvolved;
      data.taxRec += r.totalTaxRec;
      data.taxAdj += r.totalTaxAdj;
      data.otherRec += r.totalOtherRec;
      data.otherAdj += r.totalOtherAdj;
    });

    // 2. Add current reporting range entries
    entries.forEach(e => {
      // Filter by SFI / Non-SFI
      if (robustNormalize(e.paraType) !== robustNormalize(paraType)) return;

      // Filter by Date Range (Issue Date)
      const issueDateStr = extractEntryDate(e);
      if (!issueDateStr) return;
      const cycleStartStr = format(activeCycle.start, 'yyyy-MM-dd');
      const cycleEndStr = format(activeCycle.end, 'yyyy-MM-dd');
      if (issueDateStr < cycleStartStr || issueDateStr > cycleEndStr) return;

      const mName = e.ministryName;
      if (!ministryMap.has(mName)) {
        ministryMap.set(mName, {
          name: mName,
          involved: 0,
          taxRec: 0,
          taxAdj: 0,
          otherRec: 0,
          otherAdj: 0,
          remarks: "০"
        });
      }

      const data = ministryMap.get(mName);
      data.involved += (e.involvedAmount || 0);
      data.taxRec += (e.vatRec || 0) + (e.itRec || 0);
      data.taxAdj += (e.vatAdj || 0) + (e.itAdj || 0);
      data.otherRec += (e.othersRec || 0);
      data.otherAdj += (e.othersAdj || 0);
    });

    // Filter by ministry and search term
    return Array.from(ministryMap.values()).filter(row => {
      const matchMinistry = filterMinistry === '' || robustNormalize(row.name).includes(robustNormalize(filterMinistry));
      const matchSearch = searchTerm === '' || robustNormalize(row.name).toLowerCase().includes(searchTerm.toLowerCase());
      return matchMinistry && matchSearch;
    });
  }, [entries, startDate, endDate, filterMinistry, searchTerm, paraType, prevLedgerRows]);

  const totals = useMemo(() => filteredData.reduce((acc, curr) => ({
    involved: acc.involved + curr.involved,
    taxRec: acc.taxRec + curr.taxRec,
    taxAdj: acc.taxAdj + curr.taxAdj,
    otherRec: acc.otherRec + curr.otherRec,
    otherAdj: acc.otherAdj + curr.otherAdj,
  }), { involved: 0, taxRec: 0, taxAdj: 0, otherRec: 0, otherAdj: 0 }), [filteredData]);

  const renderPrevLedgerModal = () => {
    if (!isPrevLedgerOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 animate-pulse" />
                  {paraType} শাখা - পূর্ব জের সেটআপ ও গণনা তালিকা (বিস্তারিত-৬)
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  ১৯৭১-৭২ হতে {cutoffInfo.formattedLong} পর্যন্ত আদায় ও সমন্বয়ের টাকা ইনপুট দিন। {cutoffInfo.nextMonthFormattedLong} হতে তথ্য রেজিস্টার থেকে স্বয়ংক্রিয়ভাবে হিসাব হবে।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem(getStorageKey(cutoffMonth));
                    const defaults: Record<string, any> = {};
                    entitiesList.forEach(({ entityName }) => {
                      defaults[entityName] = {
                        june25Involved: 0,
                        june25TaxRec: 0,
                        june25TaxAdj: 0,
                        june25OtherRec: 0,
                        june25OtherAdj: 0
                      };
                    });
                    setPrevLedgerData(defaults);
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-black text-[10px] border border-rose-200 transition-all cursor-pointer"
              >
                রিসেট করুন
              </button>
              <button
                type="button"
                onClick={() => setIsPrevLedgerOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer border border-slate-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-white relative p-6">
            <div className="overflow-x-auto border border-slate-300 rounded-2xl">
              <table className="w-full border-separate border-spacing-0 !table-auto text-center min-w-[1200px]">
                <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm text-[9px] font-black text-slate-800">
                  <tr>
                    <th className="border-r border-b border-slate-300 p-2 text-center" rowSpan={2}>ক্র নং</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" rowSpan={2}>সংস্থার নাম</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" colSpan={5}>{cutoffInfo.formattedLong} পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" colSpan={5}>{cutoffInfo.nextMonthFormattedLong} হতে Active Quarter এর আগের মাস পর্যন্ত সমন্বয় (রেজিস্টার হতে)</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" colSpan={5}>১৯৭১-৭২ হতে মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    {/* June 2025 Inputs */}
                    <th className="border-r border-b border-slate-300 p-2 text-center">জড়িত টাকা</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">ভ্যাট ও ট্যাক্স আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">ভ্যাট ও ট্যাক্স সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অন্যান্য আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অন্যান্য সমন্বয়</th>
                    
                    {/* Transition Values */}
                    <th className="border-r border-b border-slate-300 p-2 text-center">জড়িত টাকা</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">ভ্যাট ও ট্যাক্স আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">ভ্যাট ও ট্যাক্স সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অন্যান্য আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অন্যান্য সমন্বয়</th>

                    {/* Total Cumulative */}
                    <th className="border-r border-b border-slate-300 p-2 text-center">জড়িত টাকা</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">ভ্যাট ও ট্যাক্স আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">ভ্যাট ও ট্যাক্স সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অন্যান্য আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অন্যান্য সমন্বয়</th>
                  </tr>
                </thead>
                <tbody>
                  {prevLedgerRows.map((row, idx) => {
                    const showMinistry = idx === 0 || prevLedgerRows[idx - 1].ministryName !== row.ministryName;
                    const rowSpan = prevLedgerRows.filter(r => r.ministryName === row.ministryName).length;

                    return (
                      <tr key={row.entityName} className="hover:bg-slate-50 transition-colors text-[10px]">
                        <td className="border-r border-b border-slate-300 p-2 font-bold">{toBengaliDigits(row.sl.toString())}</td>
                        {showMinistry && (
                          <td rowSpan={rowSpan} className="border-r border-b border-slate-300 p-2 font-black bg-slate-50/50 align-middle text-center">
                            {row.ministryName}
                          </td>
                        )}
                        <td className="border-r border-b border-slate-300 p-2 font-bold text-left">{row.entityName}</td>
                        
                        {/* June 2025 Inputs */}
                        {[
                          'june25Involved',
                          'june25TaxRec',
                          'june25TaxAdj',
                          'june25OtherRec',
                          'june25OtherAdj'
                        ].map(f => (
                          <td key={f} className="border-r border-b border-slate-300 p-1 bg-amber-50/10">
                            <input
                              type="text"
                              className="w-full text-center font-black text-[11px] bg-amber-50/20 hover:bg-amber-100/30 focus:bg-white border border-amber-200 focus:border-blue-500 rounded px-1 py-0.5 outline-none transition-all"
                              value={row[f] === 0 ? '' : toBengaliDigits(row[f].toString())}
                              placeholder="০"
                              onChange={e => {
                                const val = parseBengaliNumber(e.target.value);
                                handleInputChange(row.entityName, f, val);
                              }}
                              onPaste={e => handlePaste(e, idx, f)}
                            />
                          </td>
                        ))}

                        {/* Transitions */}
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transInvolved.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transTaxRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transTaxAdj.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transOtherRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transOtherAdj.toString())}</td>

                        {/* Cumulative totals */}
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-blue-900">{toBengaliDigits(row.totalInvolved.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalTaxRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalTaxAdj.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalOtherRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalOtherAdj.toString())}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-200 text-slate-900 font-extrabold text-[10px]">
                  <tr>
                    <td className="border-r border-b border-slate-300 p-2 text-right" colSpan={3}>সর্বমোট</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25Involved.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25TaxRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25TaxAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25OtherRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25OtherAdj.toString())}</td>

                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transInvolved.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transTaxRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transTaxAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transOtherRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transOtherAdj.toString())}</td>

                    <td className="border-r border-b border-slate-300 p-2 text-blue-900 bg-blue-100/30">{toBengaliDigits(prevLedgerGrandTotals.totalInvolved.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalTaxRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalTaxAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalOtherRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalOtherAdj.toString())}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer controls */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPrevLedgerOpen(false)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 border-b-4 border-blue-800"
            >
              সংরক্ষণ করুন ও বন্ধ করুন
            </button>
          </div>

        </div>
      </div>
    );
  };

  const thCls = "border-r border-b border-slate-400 p-2 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white text-center align-middle font-bold bg-black";

  return (
    <div id="qr-6-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-6-container" />
      
      <div className="flex justify-end items-center mb-4 no-print">
        <button
          type="button"
          onClick={downloadExcel}
          className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
          title="এক্সেল ফাইল ডাউনলোড করুন"
        >
          <FileSpreadsheet size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Print-only title to ensure perfect centering in print mode */}
      <div className="hidden print:block text-center mb-3">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {customTitle || "ত্রৈমাসিক রিটার্ন - ৬"}
        </h1>
        <p className="text-[12px] font-bold text-slate-700 mt-1">
          {activeCycle.label}
        </p>
      </div>

      {/* Header Section with symmetric layout */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pt-1 relative z-[260] no-print">
        {/* Left Column: Previous Ledger Setup buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-start">
          <button
            type="button"
            onClick={() => setIsPrevLedgerOpen(true)}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all duration-300 rounded-xl text-[11px] font-black cursor-pointer shrink-0"
          >
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span>পূর্ব জের সেটআপ</span>
          </button>
        </div>

        {/* Center Column: Title */}
        <h1 className="text-2.5xl font-black text-slate-900 tracking-tight text-center md:absolute md:left-1/2 md:-translate-x-1/2">
          {customTitle || "ত্রৈমাসিক রিটার্ন - ৬"}
        </h1>

        {/* Right Column: Date Range Pill & Month Picker */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 h-[38px] bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-700 font-black text-[12.5px] whitespace-nowrap">
              {customTitle || "ত্রৈমাসিক রিটার্ন - ৬"} | {activeCycle.label}
            </span>
          </div>
          {monthPickerElement && (
            <div className="select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থাভিত্তিক অডিট আপত্তির বিবরণ</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p className="shrink-0"><span className="text-slate-500">শাখাঃ</span> {paraType === 'এসএফআই' ? 'এসএফআই শাখা' : 'নন এসএফআই শাখা'}</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>

      <div className="table-container qr-table-container overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[850px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-[calc(5%-2px)]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[calc(12%-2px)]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={thCls}>জড়িত টাকা</th>
              <th colSpan={2} className={thCls}>আয়কর ও ভ্যাট বাবদ</th>
              <th colSpan={2} className={thCls}>অন্যান্য বাবদ</th>
              <th colSpan={2} className={thCls}>সর্বমোট</th>
              <th rowSpan={2} className={thCls}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, '৮=৪+৬', '৯=৫+৭', 10].map((n, i) => (
                <th key={i} className={thCls + " text-[9px] font-bold text-slate-500"}>
                  {typeof n === 'string' ? toBengaliDigits(n) : toBengaliDigits(n.toString())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => {
              const totalRec = row.taxRec + row.otherRec;
              const totalAdj = row.taxAdj + row.otherAdj;
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                  <td className={tdCls}>
                    <HighlightText text={row.name} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>{toBengaliDigits(row.involved.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.taxRec.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.taxAdj.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.otherRec.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.otherAdj.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(totalRec.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(totalAdj.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.remarks)}</td>
                </tr>
              );
            })}
            <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom no-hover-row">
              <td colSpan={2} className={footerTdCls + " text-center font-black"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.involved.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.taxRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.taxAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.otherRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.otherAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits((totals.taxRec + totals.otherRec).toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits((totals.taxAdj + totals.otherAdj).toString())}</td>
              <td className={footerTdCls}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {renderPrevLedgerModal()}
    </div>
  );
};

export default QR_6;