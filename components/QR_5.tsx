import React, { useMemo, useState } from 'react';
import { Printer, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber } from '../utils/numberUtils';
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

const QR_5: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle, paraType = 'এসএফআই' }) => {
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

  const { startDate, endDate, startMonthName, endMonthName, formattedRange } = getQuarterInfo(activeCycle.end);

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

    const filename = `${(customTitle || 'ত্রৈমাসিক_রিটার্ন_৫').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${customTitle || 'ত্রৈমাসিক রিটার্ন - ৫'}</h2>
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
  const [prevLedgerData, setPrevLedgerData] = useState<Record<string, {
    june25Amount: number;
    june25AuditRec: number;
    june25AuditAdj: number;
    june25CurrentRec: number;
    june25CurrentAdj: number;
    june25OldRec: number;
    june25OldAdj: number;
  }>>(() => {
    const storageKey = `qr5_prev_ledger_june2025_${paraType}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  // Ensure every entity has defaults
  const normalizedPrevLedgerData = useMemo(() => {
    const data = { ...prevLedgerData };
    entitiesList.forEach(({ entityName }) => {
      if (!data[entityName]) {
        data[entityName] = {
          june25Amount: 0,
          june25AuditRec: 0,
          june25AuditAdj: 0,
          june25CurrentRec: 0,
          june25CurrentAdj: 0,
          june25OldRec: 0,
          june25OldAdj: 0
        };
      }
    });
    return data;
  }, [prevLedgerData, entitiesList]);

  const handleSavePrevLedger = (updated: typeof prevLedgerData) => {
    setPrevLedgerData(updated);
    const storageKey = `qr5_prev_ledger_june2025_${paraType}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleInputChange = (entName: string, field: string, value: number) => {
    const updated = {
      ...prevLedgerData,
      [entName]: {
        ...(normalizedPrevLedgerData[entName] || {
          june25Amount: 0,
          june25AuditRec: 0,
          june25AuditAdj: 0,
          june25CurrentRec: 0,
          june25CurrentAdj: 0,
          june25OldRec: 0,
          june25OldAdj: 0
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
        june25Amount: 0,
        june25AuditRec: 0,
        june25AuditAdj: 0,
        june25CurrentRec: 0,
        june25CurrentAdj: 0,
        june25OldRec: 0,
        june25OldAdj: 0
      };
      
      // Calculate transition entries from July 1, 2025 up to cycle start
      const cycleStartStr = format(startDate, 'yyyy-MM-dd');
      const transitionEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.ministryName) !== robustNormalize(ministryName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;

        const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
        return entryDate !== '' && entryDate >= '2025-07-01' && entryDate < cycleStartStr;
      });

      let transAmount = 0;
      let transAuditRec = 0;
      let transAuditAdj = 0;
      let transCurrentRec = 0;
      let transCurrentAdj = 0;
      let transOldRec = 0;
      let transOldAdj = 0;

      transitionEntries.forEach(e => {
        transAmount += (e.involvedAmount || 0);
        transAuditRec += (e.vatRec || 0);
        transAuditAdj += (e.vatAdj || 0);
        transCurrentRec += (e.itRec || 0);
        transCurrentAdj += (e.itAdj || 0);
        transOldRec += (e.othersRec || 0);
        transOldAdj += (e.othersAdj || 0);
      });

      const totalAmount = ledger.june25Amount + transAmount;
      const totalAuditRec = ledger.june25AuditRec + transAuditRec;
      const totalAuditAdj = ledger.june25AuditAdj + transAuditAdj;
      const totalCurrentRec = ledger.june25CurrentRec + transCurrentRec;
      const totalCurrentAdj = ledger.june25CurrentAdj + transCurrentAdj;
      const totalOldRec = ledger.june25OldRec + transOldRec;
      const totalOldAdj = ledger.june25OldAdj + transOldAdj;

      rows.push({
        sl,
        ministryName,
        entityName,
        june25Amount: ledger.june25Amount,
        june25AuditRec: ledger.june25AuditRec,
        june25AuditAdj: ledger.june25AuditAdj,
        june25CurrentRec: ledger.june25CurrentRec,
        june25CurrentAdj: ledger.june25CurrentAdj,
        june25OldRec: ledger.june25OldRec,
        june25OldAdj: ledger.june25OldAdj,
        transAmount,
        transAuditRec,
        transAuditAdj,
        transCurrentRec,
        transCurrentAdj,
        transOldRec,
        transOldAdj,
        totalAmount,
        totalAuditRec,
        totalAuditAdj,
        totalCurrentRec,
        totalCurrentAdj,
        totalOldRec,
        totalOldAdj
      });
      
      sl++;
    });

    return rows;
  }, [entitiesList, normalizedPrevLedgerData, entries, startDate, paraType]);

  const prevLedgerGrandTotals = useMemo(() => {
    return prevLedgerRows.reduce((acc, r) => ({
      june25Amount: acc.june25Amount + r.june25Amount,
      june25AuditRec: acc.june25AuditRec + r.june25AuditRec,
      june25AuditAdj: acc.june25AuditAdj + r.june25AuditAdj,
      june25CurrentRec: acc.june25CurrentRec + r.june25CurrentRec,
      june25CurrentAdj: acc.june25CurrentAdj + r.june25CurrentAdj,
      june25OldRec: acc.june25OldRec + r.june25OldRec,
      june25OldAdj: acc.june25OldAdj + r.june25OldAdj,
      transAmount: acc.transAmount + r.transAmount,
      transAuditRec: acc.transAuditRec + r.transAuditRec,
      transAuditAdj: acc.transAuditAdj + r.transAuditAdj,
      transCurrentRec: acc.transCurrentRec + r.transCurrentRec,
      transCurrentAdj: acc.transCurrentAdj + r.transCurrentAdj,
      transOldRec: acc.transOldRec + r.transOldRec,
      transOldAdj: acc.transOldAdj + r.transOldAdj,
      totalAmount: acc.totalAmount + r.totalAmount,
      totalAuditRec: acc.totalAuditRec + r.totalAuditRec,
      totalAuditAdj: acc.totalAuditAdj + r.totalAuditAdj,
      totalCurrentRec: acc.totalCurrentRec + r.totalCurrentRec,
      totalCurrentAdj: acc.totalCurrentAdj + r.totalCurrentAdj,
      totalOldRec: acc.totalOldRec + r.totalOldRec,
      totalOldAdj: acc.totalOldAdj + r.totalOldAdj
    }), {
      june25Amount: 0, june25AuditRec: 0, june25AuditAdj: 0, june25CurrentRec: 0, june25CurrentAdj: 0, june25OldRec: 0, june25OldAdj: 0,
      transAmount: 0, transAuditRec: 0, transAuditAdj: 0, transCurrentRec: 0, transCurrentAdj: 0, transOldRec: 0, transOldAdj: 0,
      totalAmount: 0, totalAuditRec: 0, totalAuditAdj: 0, totalCurrentRec: 0, totalCurrentAdj: 0, totalOldRec: 0, totalOldAdj: 0
    });
  }, [prevLedgerRows]);

  const handlePaste = (e: React.ClipboardEvent, startRowIdx: number, field: string) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    const rowsText = clipboardData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    const updated = { ...prevLedgerData };
    const fieldsOrder = [
      'june25Amount',
      'june25AuditRec',
      'june25AuditAdj',
      'june25CurrentRec',
      'june25CurrentAdj',
      'june25OldRec',
      'june25OldAdj'
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
            june25Amount: 0,
            june25AuditRec: 0,
            june25AuditAdj: 0,
            june25CurrentRec: 0,
            june25CurrentAdj: 0,
            june25OldRec: 0,
            june25OldAdj: 0
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
          amount: 0,
          auditRec: 0,
          auditAdj: 0,
          currentRec: 0,
          currentAdj: 0,
          oldRec: 0,
          oldAdj: 0,
          totalRec: 0,
          totalAdj: 0,
          remarks: "০"
        });
      }
      const data = ministryMap.get(mName);
      data.amount += r.totalAmount;
      data.auditRec += r.totalAuditRec;
      data.auditAdj += r.totalAuditAdj;
      data.currentRec += r.totalCurrentRec;
      data.currentAdj += r.totalCurrentAdj;
      data.oldRec += r.totalOldRec;
      data.oldAdj += r.totalOldAdj;
    });

    // 2. Add current reporting range entries
    entries.forEach(e => {
      // Filter by SFI / Non-SFI
      if (robustNormalize(e.paraType) !== robustNormalize(paraType)) return;

      // Filter by Date Range (Issue Date)
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);
      if (issueDate < startDate || issueDate > endDate) return;

      const mName = e.ministryName;
      if (!ministryMap.has(mName)) {
        ministryMap.set(mName, {
          name: mName,
          amount: 0,
          auditRec: 0,
          auditAdj: 0,
          currentRec: 0,
          currentAdj: 0,
          oldRec: 0,
          oldAdj: 0,
          totalRec: 0,
          totalAdj: 0,
          remarks: "০"
        });
      }

      const data = ministryMap.get(mName);
      data.amount += (e.involvedAmount || 0);
      data.auditRec += (e.vatRec || 0);
      data.auditAdj += (e.vatAdj || 0);
      data.currentRec += (e.itRec || 0);
      data.currentAdj += (e.itAdj || 0);
      data.oldRec += (e.othersRec || 0);
      data.oldAdj += (e.othersAdj || 0);
    });

    // 3. Compute totals and convert to array
    const resultList = Array.from(ministryMap.values()).map(row => {
      row.totalRec = row.auditRec + row.currentRec + row.oldRec;
      row.totalAdj = row.auditAdj + row.currentAdj + row.oldAdj;
      return row;
    });

    // Filter by ministry and search term
    return resultList.filter(row => {
      const matchMinistry = filterMinistry === '' || robustNormalize(row.name).includes(robustNormalize(filterMinistry));
      const matchSearch = searchTerm === '' || robustNormalize(row.name).toLowerCase().includes(searchTerm.toLowerCase());
      return matchMinistry && matchSearch;
    });
  }, [entries, startDate, endDate, filterMinistry, searchTerm, paraType, prevLedgerRows]);

  const totals = useMemo(() => filteredData.reduce((acc, curr) => ({
    amount: acc.amount + curr.amount,
    auditRec: acc.auditRec + curr.auditRec,
    auditAdj: acc.auditAdj + curr.auditAdj,
    currentRec: acc.currentRec + curr.currentRec,
    currentAdj: acc.currentAdj + curr.currentAdj,
    oldRec: acc.oldRec + curr.oldRec,
    oldAdj: acc.oldAdj + curr.oldAdj,
    totalRec: acc.totalRec + curr.totalRec,
    totalAdj: acc.totalAdj + curr.totalAdj,
  }), { amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 0, oldAdj: 0, totalRec: 0, totalAdj: 0 }), [filteredData]);

  const renderPrevLedgerModal = () => {
    if (!isPrevLedgerOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left">
              <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500 animate-pulse" />
                {paraType} শাখা - পূর্ব জের সেটআপ ও গণনা তালিকা (বিস্তারিত-৫)
              </h2>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                ১৯৭১-৭২ হতে জুন/২০২৫ পর্যন্ত আদায় ও সমন্বয়ের সংখ্যা ও টাকা ইনপুট দিন। জুলাই/২০২৫ হতে তথ্য রেজিস্টার থেকে স্বয়ংক্রিয়ভাবে হিসাব হবে।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    const storageKey = `qr5_prev_ledger_june2025_${paraType}`;
                    localStorage.removeItem(storageKey);
                    const defaults: Record<string, any> = {};
                    entitiesList.forEach(({ entityName }) => {
                      defaults[entityName] = {
                        june25Amount: 0,
                        june25AuditRec: 0,
                        june25AuditAdj: 0,
                        june25CurrentRec: 0,
                        june25CurrentAdj: 0,
                        june25OldRec: 0,
                        june25OldAdj: 0
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
                    <th className="border-r border-b border-slate-300 p-2 text-center" colSpan={7}>জুন/২০২৫ পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" colSpan={7}>জুলাই/২০২৫ হতে Active Quarter এর আগের মাস পর্যন্ত সমন্বয় (রেজিস্টার হতে)</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center" colSpan={7}>১৯৭১-৭২ হতে মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    {/* June 2025 Inputs */}
                    <th className="border-r border-b border-slate-300 p-2 text-center">জড়িত টাকা</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অডিট কালীন আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অডিট কালীন সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">উত্থাপিত অর্থের বিপরীতে আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">উত্থাপিত অর্থের বিপরীতে সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">পুরাতন আপত্তিতে জড়িত আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">পুরাতন আপত্তিতে জড়িত সমন্বয়</th>
                    
                    {/* Transition Values */}
                    <th className="border-r border-b border-slate-300 p-2 text-center">জড়িত টাকা</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অডিট কালীন আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অডিট কালীন সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">উত্থাপিত অর্থের বিপরীতে আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">উত্থাপিত অর্থের বিপরীতে সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">পুরাতন আপত্তিতে জড়িত আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">পুরাতন আপত্তিতে জড়িত সমন্বয়</th>

                    {/* Total Cumulative */}
                    <th className="border-r border-b border-slate-300 p-2 text-center">জড়িত টাকা</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অডিট কালীন আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">অডিট কালীন সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">উত্থাপিত অর্থের বিপরীতে আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">উত্থাপিত অর্থের বিপরীতে সমন্বয়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">পুরাতন আপত্তিতে জড়িত আদায়</th>
                    <th className="border-r border-b border-slate-300 p-2 text-center">পুরাতন আপত্তিতে জড়িত সমন্বয়</th>
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
                          'june25Amount',
                          'june25AuditRec',
                          'june25AuditAdj',
                          'june25CurrentRec',
                          'june25CurrentAdj',
                          'june25OldRec',
                          'june25OldAdj'
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
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transAmount.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transAuditRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transAuditAdj.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transCurrentRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transCurrentAdj.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transOldRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-slate-50 font-bold text-slate-600">{toBengaliDigits(row.transOldAdj.toString())}</td>

                        {/* Cumulative totals */}
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-blue-900">{toBengaliDigits(row.totalAmount.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalAuditRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalAuditAdj.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalCurrentRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalCurrentAdj.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalOldRec.toString())}</td>
                        <td className="border-r border-b border-slate-300 p-2 bg-blue-50/10 font-bold text-slate-900">{toBengaliDigits(row.totalOldAdj.toString())}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-200 text-slate-900 font-extrabold text-[10px]">
                  <tr>
                    <td className="border-r border-b border-slate-300 p-2 text-right" colSpan={3}>সর্বমোট</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25Amount.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25AuditRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25AuditAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25CurrentRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25CurrentAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25OldRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2">{toBengaliDigits(prevLedgerGrandTotals.june25OldAdj.toString())}</td>

                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transAmount.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transAuditRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transAuditAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transCurrentRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transCurrentAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transOldRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-slate-100">{toBengaliDigits(prevLedgerGrandTotals.transOldAdj.toString())}</td>

                    <td className="border-r border-b border-slate-300 p-2 text-blue-900 bg-blue-100/30">{toBengaliDigits(prevLedgerGrandTotals.totalAmount.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalAuditRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalAuditAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalCurrentRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalCurrentAdj.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalOldRec.toString())}</td>
                    <td className="border-r border-b border-slate-300 p-2 bg-blue-100/20">{toBengaliDigits(prevLedgerGrandTotals.totalOldAdj.toString())}</td>
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
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-900 align-middle bg-slate-200 font-extrabold";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-200";

  return (
    <div id="qr-5-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-5-container" />
      
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
          {customTitle || "ত্রৈমাসিক রিটার্ন - ৫"}
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
          {customTitle || "ত্রৈমাসিক রিটার্ন - ৫"}
        </h1>

        {/* Right Column: Date Range Pill & Month Picker */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 h-[38px] bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-700 font-black text-[12.5px] whitespace-nowrap">
              {customTitle || "ত্রৈমাসিক রিটার্ন - ৫"} | {activeCycle.label}
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
        <p><span className="text-slate-500">বিষয়ঃ</span> অডিট আপত্তির ফলে আদায়কৃত/সমন্বয়কৃত অর্থের ত্রৈমাসিক প্রতিবেদন</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p className="shrink-0"><span className="text-slate-500">শাখাঃ</span> {paraType === 'এসএফআই' ? 'এসএফআই শাখা' : 'নন এসএফআই শাখা'}</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>

      <div className="table-container qr-table-container overflow-auto border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-[calc(5%-2px)]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[calc(15%-2px)]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>প্রতিবেদনধীন সময়ে উত্থাপিত আপত্তিতে জড়িত টাকার পরিমাণ</th>
              <th colSpan={2} className={thCls}>অডিট কালীন আদায়/সমন্বয়</th>
              <th colSpan={2} className={thCls}>প্রতিবেদনধীন সময়ে উত্থাপিত অর্থের বিপরীতে আদায়/সমন্বয়</th>
              <th colSpan={2} className={thCls}>পুরাতন আপত্তিতে জড়িত অর্থ</th>
              <th colSpan={2} className={thCls}>মোট</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <th key={n} className={thCls + " text-[9px] font-bold text-slate-500"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>
                  <HighlightText text={row.name} searchTerm={searchTerm} />
                </td>
                <td className={numTdCls}>{toBengaliDigits(row.amount.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.auditRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.auditAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.currentRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.currentAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.oldRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.oldAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.remarks)}</td>
              </tr>
            ))}
            <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
              <td colSpan={2} className={footerTdCls + " text-center font-black"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.amount.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.auditRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.auditAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.currentRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.currentAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.oldRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.oldAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.totalRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.totalAdj.toString())}</td>
              <td className={footerTdCls}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {renderPrevLedgerModal()}
    </div>
  );
};

export default QR_5;