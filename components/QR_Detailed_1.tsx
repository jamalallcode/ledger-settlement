import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, BarChart3, FileSpreadsheet, Database, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { format } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

interface QRProps {
  entries: SettlementEntry[];
  prevStats?: any;
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  monthPickerElement?: React.ReactNode;
}

const STORAGE_KEY = 'qr1_prior_balances_v1';

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

interface EntityPriorValues {
  col4: number;  // প্রারম্ভিক অমিমাংসিত উত্থাপিত আপত্তির সংখ্যা
  col7: number;  // প্রারম্ভিক নিষ্পত্তিকৃত আপত্তির সংখ্যা
  col11: number; // অমিমাংসিত আপত্তিতে জড়িত টাকা
}

const table1Data = [
  {
    ministry: "শিল্প মন্ত্রণালয়",
    entities: ["চিনি ও খাদ্য সংস্থা", "হস্ত ও কুটির শিল্প সংস্থা", "বিটাক", "রসায়ন শিল্প সংস্থা"]
  },
  {
    ministry: "বস্ত্র ও পাট মন্ত্রণালয়",
    entities: ["পাটকল সংস্থা", "পাট সংস্থা", "বস্ত্রকল সংস্থা", "রেশম বোর্ড"]
  },
  {
    ministry: "বাণিজ্য মন্ত্রণালয়",
    entities: ["টিসিবি", "আমদানি ও রপ্তানি"]
  },
  {
    ministry: "বেসামরিক বিমান পরিবহন ও পর্যটন",
    entities: ["বাংলাদেশ বিমান", "পর্যটন কর্পোরেশন"]
  }
];

const table2Data = [
  {
    ministry: "আর্থিক প্রতিষ্ঠান বিভাগ",
    entities: [
      "সোনালী ব্যাংক পিএলসি",
      "জনতা ব্যাংক পিএলসি",
      "অগ্রণী ব্যাংক পিএলসি",
      "বাংলাদেশ কৃষি ব্যাংক",
      "রূপালী ব্যাংক পিএলসি",
      "বাংলাদেশ ব্যাংক",
      "বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লিঃ",
      "গৃহনির্মাণ ঋণদান সংস্থা",
      "কর্মসংস্থান ব্যাংক",
      "বেসিক ব্যাংক লিঃ",
      "আনসার ভিডিপি উন্নয়ন ব্যাংক লিঃ",
      "ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ",
      "সাধারণ বীমা কর্পোরেশন",
      "জীবন বীমা কর্পোরেশন",
      "প্রবাসী কল্যাণ ব্যাংক পিএলসি"
    ]
  }
];

const allMinistryGroups = [...table1Data, ...table2Data];

const QR_Detailed_1: React.FC<QRProps> = ({
  entries,
  prevStats,
  activeCycle,
  IDBadge,
  searchTerm = '',
  filterMinistry = '',
  monthPickerElement
}) => {
  const [priorData, setPriorData] = useState<Record<string, EntityPriorValues>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const [isPriorModalOpen, setIsPriorModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(priorData));
    } catch (e) {
      console.error(e);
    }
  }, [priorData]);

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

    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const startMonthName = months[quarterStartMonth];
    const endMonthName = months[quarterEndMonth];
    
    let priorMonthIdx = quarterStartMonth - 1;
    let priorYear = quarterYear;
    if (priorMonthIdx < 0) {
      priorMonthIdx = 11;
      priorYear -= 1;
    }
    const priorMonthName = months[priorMonthIdx];

    const formattedRange = `${startMonthName}/${toBengaliDigits(quarterYear.toString())} হতে ${endMonthName}/${toBengaliDigits(quarterYear.toString())}`;
    const priorPeriodEnd = `${priorMonthName}/${toBengaliDigits(priorYear.toString())}`;
    const cumPeriodEnd = `${endMonthName}/${toBengaliDigits(quarterYear.toString())}`;

    return {
      formattedRange,
      priorPeriodEnd,
      cumPeriodEnd
    };
  };

  const { formattedRange, priorPeriodEnd, cumPeriodEnd } = getQuarterInfo(activeCycle?.end || new Date());

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

    const filename = `ত্রৈমাসিক_রিটার্ন_বিস্তারিত_১_${format(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 6px 10px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-yellow-header { background-color: #facc15 !important; color: #000000 !important; font-weight: bold !important; }
          .bg-black { background-color: #000000 !important; color: #ffffff !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">বিস্তারিত - ১</h2>
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

  const handleInputValueChange = (entity: string, field: 'col4' | 'col7' | 'col11', val: string) => {
    const num = parseBengaliNumber(val);
    setPriorData(prev => ({
      ...prev,
      [entity]: {
        col4: prev[entity]?.col4 || 0,
        col7: prev[entity]?.col7 || 0,
        col11: prev[entity]?.col11 || 0,
        [field]: num
      }
    }));
  };

  const handleTablePaste = (e: React.ClipboardEvent, startEntity: string, startColField: 'col4' | 'col7' | 'col11') => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length === 0) return;

    const fieldsInOrder: Array<'col4' | 'col7' | 'col11'> = ['col4', 'col7', 'col11'];
    const startColIndex = fieldsInOrder.indexOf(startColField);

    const allEntitiesInOrder: string[] = [];
    allMinistryGroups.forEach(g => {
      g.entities.forEach(ent => allEntitiesInOrder.push(ent));
    });

    const startEntityIndex = allEntitiesInOrder.indexOf(startEntity);
    if (startEntityIndex === -1) return;

    const updatedData = { ...priorData };

    rows.forEach((rowStr, rowOffset) => {
      const currentEntityIdx = startEntityIndex + rowOffset;
      if (currentEntityIdx >= allEntitiesInOrder.length) return;
      const targetEntity = allEntitiesInOrder[currentEntityIdx];

      const cellValues = rowStr.split('\t');
      cellValues.forEach((cellVal, colOffset) => {
        const currentColIdx = startColIndex + colOffset;
        if (currentColIdx >= fieldsInOrder.length) return;
        const targetField = fieldsInOrder[currentColIdx];

        const parsedVal = parseBengaliNumber(cellVal.trim());
        if (!updatedData[targetEntity]) {
          updatedData[targetEntity] = { col4: 0, col7: 0, col11: 0 };
        }
        updatedData[targetEntity][targetField] = isNaN(parsedVal) ? 0 : parsedVal;
      });
    });

    setPriorData(updatedData);
  };

  const handleResetConfirmed = () => {
    setPriorData({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setShowResetConfirm(false);
  };

  // Compute metrics for each entity
  const getEntityData = (entityName: string) => {
    const prior = priorData[entityName] || { col4: 0, col7: 0, col11: 0 };
    
    // Calculate current quarter raised and settled from entries
    let currentRaisedCount = 0;
    let currentSettledCount = 0;
    let currentSettledAmount = 0;

    const normTarget = robustNormalize(entityName);

    (entries || []).forEach(e => {
      const normEntity = robustNormalize(e.entityName || '');
      if (normEntity === normTarget) {
        // Filter by active cycle dates (the 3 months of the quarter)
        const eDate = e.issueDateISO ? new Date(e.issueDateISO) : (e.createdAt ? new Date(e.createdAt) : null);
        if (activeCycle?.start && activeCycle?.end && eDate) {
          if (eDate < activeCycle.start || eDate > activeCycle.end) return;
        }

        // Col 5: Raised Count
        const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          currentRaisedCount += parseBengaliNumber(rCountRaw);
        }
        
        // Col 12: Settled Amount
        let settledAmt = 0;
        if (e.settledAmount) {
          settledAmt += parseBengaliNumber(String(e.settledAmount));
        } else if (e.manualSettledAmount) {
          settledAmt += parseBengaliNumber(String(e.manualSettledAmount));
        } else {
          const rec = (e.totalRec || 0) + (e.totalAdj || 0);
          if (rec > 0) settledAmt += rec;
        }

        if (!settledAmt && e.paragraphs && e.paragraphs.length > 0) {
          e.paragraphs.forEach(p => {
            settledAmt += (p.recoveredAmount || 0) + (p.adjustedAmount || 0);
          });
        }

        // Col 8: Settled Count
        let fc = parseBengaliNumber(String(e.fullCount || 0));
        let pc = parseBengaliNumber(String(e.partialCount || 0));

        if (fc === 0 && pc === 0 && e.meetingSettledParaCount) {
          fc = parseBengaliNumber(String(e.meetingSettledParaCount));
        }
        if (fc === 0 && pc === 0 && e.paragraphs && e.paragraphs.length > 0) {
          fc = e.paragraphs.filter(p => p.status === 'পূর্ণাঙ্গ').length;
          pc = e.paragraphs.filter(p => p.status === 'আংশিক').length;
        }

        currentSettledCount += (fc + pc);
        currentSettledAmount += settledAmt;
      }
    });

    const col4 = prior.col4 || 0;
    const col5 = currentRaisedCount;
    const col6 = col4 + col5;

    const col7 = prior.col7 || 0;
    const col8 = currentSettledCount;
    const col9 = col7 + col8;

    const col10 = col6 - col9;

    const col11 = prior.col11 || 0;
    const col12 = currentSettledAmount;
    const col13 = col11 - col12;

    return { col4, col5, col6, col7, col8, col9, col10, col11, col12, col13 };
  };

  // Header styles with border fix for sticky header
  const thCls = "border-b border-r border-t border-l border-slate-400 p-2 text-[10px] font-black text-slate-800 align-middle text-center bg-slate-100";
  const thRow2Cls = "border-b border-r border-t border-l border-slate-400 p-2 text-[10px] font-black text-slate-800 align-middle text-center bg-slate-100";
  const thRow3Cls = "border-b border-r border-t border-l border-slate-400 p-2 text-[10px] font-black text-slate-800 align-middle text-center bg-slate-200";

  const yellowThCls = "border-b border-r border-t border-l border-slate-400 p-2 text-[10px] font-black text-slate-900 align-middle text-center bg-amber-300";
  const yellowThRow2Cls = "border-b border-r border-t border-l border-slate-400 p-2 text-[10px] font-black text-slate-900 align-middle text-center bg-amber-300";
  const yellowThRow3Cls = "border-b border-r border-t border-l border-slate-400 p-2 text-[10px] font-black text-slate-900 align-middle text-center bg-amber-400";

  const tdCls = "border-b border-r border-l border-slate-400 p-2 text-[10px] text-slate-800 align-middle bg-white";
  const numTdCls = "border-b border-r border-slate-400 p-2 text-[10px] text-slate-800 text-center align-middle font-bold bg-white";
  const footerTdCls = "border-b border-r border-l border-slate-400 p-2 text-[10px] text-white align-middle bg-black font-black text-center";

  // Calculate Table 1 Totals
  const t1Totals = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0, col11: 0, col12: 0, col13: 0 };
  table1Data.forEach(g => {
    g.entities.forEach(ent => {
      const d = getEntityData(ent);
      t1Totals.col4 += d.col4; t1Totals.col5 += d.col5; t1Totals.col6 += d.col6;
      t1Totals.col7 += d.col7; t1Totals.col8 += d.col8; t1Totals.col9 += d.col9;
      t1Totals.col10 += d.col10; t1Totals.col11 += d.col11; t1Totals.col12 += d.col12;
      t1Totals.col13 += d.col13;
    });
  });

  // Calculate Table 2 Totals
  const t2Totals = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0, col11: 0, col12: 0, col13: 0 };
  table2Data.forEach(g => {
    g.entities.forEach(ent => {
      const d = getEntityData(ent);
      t2Totals.col4 += d.col4; t2Totals.col5 += d.col5; t2Totals.col6 += d.col6;
      t2Totals.col7 += d.col7; t2Totals.col8 += d.col8; t2Totals.col9 += d.col9;
      t2Totals.col10 += d.col10; t2Totals.col11 += d.col11; t2Totals.col12 += d.col12;
      t2Totals.col13 += d.col13;
    });
  });

  // Grand Totals
  const grandTotals = {
    col4: t1Totals.col4 + t2Totals.col4,
    col5: t1Totals.col5 + t2Totals.col5,
    col6: t1Totals.col6 + t2Totals.col6,
    col7: t1Totals.col7 + t2Totals.col7,
    col8: t1Totals.col8 + t2Totals.col8,
    col9: t1Totals.col9 + t2Totals.col9,
    col10: t1Totals.col10 + t2Totals.col10,
    col11: t1Totals.col11 + t2Totals.col11,
    col12: t1Totals.col12 + t2Totals.col12,
    col13: t1Totals.col13 + t2Totals.col13,
  };

  return (
    <div id="qr-detailed-1-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-detailed-1-container" />

      {/* Top Single Row Toolbar (Item 2.4) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-50 border border-slate-200 p-2.5 rounded-xl no-print shadow-sm">
        {/* Left: "ত্রৈমাসিক পূর্বজের" Button (Item 2.1) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPriorModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[12px] shadow-sm hover:shadow transition-all cursor-pointer border border-blue-700"
          >
            <Database size={15} />
            <span>ত্রৈমাসিক পূর্বজের</span>
          </button>
        </div>

        {/* Right: Cycle Selector, Statistics & Excel Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Cycle / Quarterly selector element */}
          {monthPickerElement && (
            <div className="scale-95 origin-center select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}

          {/* Statistics Button Dropdown */}
          <div className="relative group shrink-0 z-[250]">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-[11px] border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:border-blue-200"
            >
              <Sparkles size={13} className="text-blue-500" />
              পরিসংখ্যান
              <ChevronDown size={11} className="text-blue-400 transition-transform duration-300 group-hover:rotate-180" />
            </button>
            
            <div className="absolute top-[calc(100%+4px)] right-0 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-[1000] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto text-left">
              <div className="space-y-2 text-slate-700 text-[11px] font-bold">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <BarChart3 size={15} className="text-blue-600" />
                  <span className="text-blue-900 font-black text-[12px]">বিস্তারিত - ১ পরিসংখ্যান</span>
                </div>
                <p className="text-slate-500 text-[10.5px]">টেবিল স্ট্রাকচার প্রস্তুত রয়েছে।</p>
              </div>
            </div>
          </div>

          {/* Excel Download Button */}
          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center justify-center h-[38px] px-3 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100/50 transition-all duration-300 rounded-xl cursor-pointer shrink-0 font-extrabold text-[11.5px] gap-1.5 shadow-sm"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
            <span>এক্সেল ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Header Title Section */}
      <div className="text-center mb-3 pt-1 relative z-[260]">
        <div className="inline-block relative">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            বিস্তারিত - ১
          </h1>

          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
        </div>
      </div>

      {/* Subject Bar */}
      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-x-4 gap-y-2 border-b border-t border-slate-200 py-2 px-3 bg-slate-50/50 rounded-lg">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থা ভিত্তিক অমিমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">শাখাঃ</span> এসএফআই + নন-এসএফআই শাখা</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
        </div>
      </div>

      {/* Main Table Container (With Fixed Borders & Scroll Fix - Item 1) */}
      <div className="qr-table-container table-container overflow-auto border border-slate-400 shadow-sm rounded-lg mb-6 max-h-[75vh]">
        {/* TABLE 1 */}
        <table className="w-full border-separate border-spacing-0 min-w-[1050px]">
          <thead>
            <tr>
              <th rowSpan={2} className={`${thCls} w-[40px] border-l`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[105px]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${thCls} w-[112px]`}>প্রতিষ্ঠানের নাম</th>
              <th colSpan={3} className={thCls}>প্রারম্ভিক অমিমাংসিত</th>
              <th colSpan={3} className={thCls}>প্রারম্ভিক মীমাংসিত</th>
              <th rowSpan={2} className={`${thCls} w-[100px]`}>জুন/২০২৫ পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th colSpan={3} className={thCls}>অমিমাংসিত আপত্তিতে জড়িত টাকা</th>
            </tr>
            <tr>
              {/* Columns 4, 5, 6 under প্রারম্ভিক অমিমাংসিত - Item 2.5 Header Text Fix */}
              <th className={thRow2Cls}>১৯৭১-৭২ হতে {priorPeriodEnd} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thRow2Cls}>{formattedRange} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thRow2Cls}>{cumPeriodEnd} পর্যন্ত উত্থাপিত মোট আপত্তির সংখ্যা</th>
              
              {/* Columns 7, 8, 9 under প্রারম্ভিক মীমাংসিত - Item 2.5 Header Text Fix */}
              <th className={thRow2Cls}>১৯৭১-৭২ হতে {priorPeriodEnd} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thRow2Cls}>{formattedRange} পর্যন্ত নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thRow2Cls}>{cumPeriodEnd} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              
              {/* Columns 11, 12, 13 under অমিমাংসিত আপত্তিতে জড়িত টাকা - Item 2.5 Header Text Fix */}
              <th className={thRow2Cls}>১৯৭১-৭২ হতে {priorPeriodEnd} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
              <th className={thRow2Cls}>{formattedRange} পর্যন্ত নিষ্পত্তিকৃত আপত্তিতে জড়িত টাকা</th>
              <th className={thRow2Cls}>১৯৭১-৭২ হতে {cumPeriodEnd} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
            </tr>
            {/* Column Numbers Row */}
            <tr>
              <th className={`${thRow3Cls} border-l`}>১</th>
              <th className={thRow3Cls}>২</th>
              <th className={thRow3Cls}>৩</th>
              <th className={thRow3Cls}>৪</th>
              <th className={thRow3Cls}>৫</th>
              <th className={thRow3Cls}>৬ = ৪+৫</th>
              <th className={thRow3Cls}>৭</th>
              <th className={thRow3Cls}>৮</th>
              <th className={thRow3Cls}>৯ = (৭+৮)</th>
              <th className={thRow3Cls}>১০ = ৬-৯</th>
              <th className={thRow3Cls}>১১</th>
              <th className={thRow3Cls}>১২</th>
              <th className={thRow3Cls}>১৩ = ১১-১২</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let serialCount = 0;
              return table1Data.map((group, gIdx) => {
                const groupSums = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0, col11: 0, col12: 0, col13: 0 };
                group.entities.forEach(ent => {
                  const d = getEntityData(ent);
                  groupSums.col4 += d.col4; groupSums.col5 += d.col5; groupSums.col6 += d.col6;
                  groupSums.col7 += d.col7; groupSums.col8 += d.col8; groupSums.col9 += d.col9;
                  groupSums.col10 += d.col10; groupSums.col11 += d.col11; groupSums.col12 += d.col12;
                  groupSums.col13 += d.col13;
                });

                const groupRows = group.entities.map((entity, eIdx) => {
                  serialCount++;
                  const isFirstOfGroup = eIdx === 0;

                  const matchSearch = searchTerm === '' ||
                    group.ministry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entity.toLowerCase().includes(searchTerm.toLowerCase());

                  const matchFilter = filterMinistry === '' || group.ministry.includes(filterMinistry);

                  if (!matchSearch || !matchFilter) return null;

                  const d = getEntityData(entity);

                  return (
                    <tr key={`${gIdx}-${eIdx}`} className="hover:bg-slate-50 transition-colors">
                      <td className={`${numTdCls} border-l`}>{toBengaliDigits(serialCount.toString())}</td>
                      {isFirstOfGroup && (
                        <td rowSpan={group.entities.length} className={`${tdCls} font-bold text-center bg-white`}>
                          <HighlightText text={group.ministry} searchTerm={searchTerm} />
                        </td>
                      )}
                      <td className={tdCls}>
                        <HighlightText text={entity} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{toBengaliDigits(d.col4.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col5.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col6.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col7.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col8.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col9.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col10.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col11.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col12.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col13.toString())}</td>
                    </tr>
                  );
                });

                const hasMatchingEntities = groupRows.some(row => row !== null);
                if (!hasMatchingEntities) return null;

                return (
                  <React.Fragment key={`t1-group-${gIdx}`}>
                    {groupRows}
                    <tr className="bg-slate-100 font-black">
                      <td colSpan={3} className={`${tdCls} border-l font-black text-center bg-slate-200 text-slate-900`}>
                        মোট ({group.ministry})
                      </td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col4.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col5.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col6.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col7.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col8.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col9.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col10.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col11.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col12.toString())}</td>
                      <td className={`${numTdCls} font-black bg-slate-100`}>{toBengaliDigits(groupSums.col13.toString())}</td>
                    </tr>
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className={footerTdCls}>মোট (টেবিল-১)</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col4.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col5.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col6.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col7.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col8.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col9.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col10.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col11.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col12.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t1Totals.col13.toString())}</td>
            </tr>
          </tfoot>
        </table>

        {/* TABLE 2 (YELLOW HEADER & FOOTER - FINANCIAL INSTITUTIONS) */}
        <table className="w-full border-separate border-spacing-0 min-w-[1050px] mt-3">
          <thead>
            <tr>
              <th rowSpan={2} className={`${yellowThCls} w-[40px] border-l`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${yellowThCls} w-[105px]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${yellowThCls} w-[112px]`}>প্রতিষ্ঠানের নাম</th>
              <th colSpan={3} className={yellowThCls}>প্রারম্ভিক অমিমাংসিত</th>
              <th colSpan={3} className={yellowThCls}>প্রারম্ভিক মীমাংসিত</th>
              <th rowSpan={2} className={`${yellowThCls} w-[100px]`}>জুন/২০২৫ পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th colSpan={3} className={yellowThCls}>অমিমাংসিত আপত্তিতে জড়িত টাকা</th>
            </tr>
            <tr>
              {/* Item 2.5 Header Text Fix */}
              <th className={yellowThRow2Cls}>১৯৭১-৭২ হতে {priorPeriodEnd} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={yellowThRow2Cls}>{formattedRange} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={yellowThRow2Cls}>{cumPeriodEnd} পর্যন্ত উত্থাপিত মোট আপত্তির সংখ্যা</th>
              
              <th className={yellowThRow2Cls}>১৯৭১-৭২ হতে {priorPeriodEnd} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={yellowThRow2Cls}>{formattedRange} পর্যন্ত নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={yellowThRow2Cls}>{cumPeriodEnd} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              
              <th className={yellowThRow2Cls}>১৯৭১-৭২ হতে {priorPeriodEnd} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
              <th className={yellowThRow2Cls}>{formattedRange} পর্যন্ত নিষ্পত্তিকৃত আপত্তিতে জড়িত টাকা</th>
              <th className={yellowThRow2Cls}>১৯৭১-৭২ হতে {cumPeriodEnd} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
            </tr>
            <tr>
              <th className={`${yellowThRow3Cls} border-l`}>১</th>
              <th className={yellowThRow3Cls}>২</th>
              <th className={yellowThRow3Cls}>৩</th>
              <th className={yellowThRow3Cls}>৪</th>
              <th className={yellowThRow3Cls}>৫</th>
              <th className={yellowThRow3Cls}>৬ = ৪+৫</th>
              <th className={yellowThRow3Cls}>৭</th>
              <th className={yellowThRow3Cls}>৮</th>
              <th className={yellowThRow3Cls}>৯ = (৭+৮)</th>
              <th className={yellowThRow3Cls}>১০ = ৬-৯</th>
              <th className={yellowThRow3Cls}>১১</th>
              <th className={yellowThRow3Cls}>১২</th>
              <th className={yellowThRow3Cls}>১৩ = ১১-১২</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let serialCount = 0;
              return table2Data.map((group, gIdx) => {
                const groupSums = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0, col11: 0, col12: 0, col13: 0 };
                group.entities.forEach(ent => {
                  const d = getEntityData(ent);
                  groupSums.col4 += d.col4; groupSums.col5 += d.col5; groupSums.col6 += d.col6;
                  groupSums.col7 += d.col7; groupSums.col8 += d.col8; groupSums.col9 += d.col9;
                  groupSums.col10 += d.col10; groupSums.col11 += d.col11; groupSums.col12 += d.col12;
                  groupSums.col13 += d.col13;
                });

                const groupRows = group.entities.map((entity, eIdx) => {
                  serialCount++;
                  const isFirstOfGroup = eIdx === 0;

                  const matchSearch = searchTerm === '' ||
                    group.ministry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entity.toLowerCase().includes(searchTerm.toLowerCase());

                  const matchFilter = filterMinistry === '' || group.ministry.includes(filterMinistry);

                  if (!matchSearch || !matchFilter) return null;

                  const d = getEntityData(entity);

                  return (
                    <tr key={`t2-${gIdx}-${eIdx}`} className="hover:bg-amber-50/40 transition-colors">
                      <td className={`${numTdCls} border-l`}>{toBengaliDigits(serialCount.toString())}</td>
                      {isFirstOfGroup && (
                        <td rowSpan={group.entities.length} className={`${tdCls} font-bold text-center bg-white`}>
                          <HighlightText text={group.ministry} searchTerm={searchTerm} />
                        </td>
                      )}
                      <td className={tdCls}>
                        <HighlightText text={entity} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{toBengaliDigits(d.col4.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col5.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col6.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col7.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col8.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col9.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col10.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col11.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col12.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(d.col13.toString())}</td>
                    </tr>
                  );
                });

                const hasMatchingEntities = groupRows.some(row => row !== null);
                if (!hasMatchingEntities) return null;

                return (
                  <React.Fragment key={`t2-group-${gIdx}`}>
                    {groupRows}
                    <tr className="bg-amber-100/80 font-black">
                      <td colSpan={3} className={`${tdCls} border-l font-black text-center bg-amber-200 text-slate-900`}>
                        মোট ({group.ministry})
                      </td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col4.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col5.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col6.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col7.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col8.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col9.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col10.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col11.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col12.toString())}</td>
                      <td className={`${numTdCls} font-black bg-amber-100/80`}>{toBengaliDigits(groupSums.col13.toString())}</td>
                    </tr>
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className={footerTdCls}>মোট (টেবিল-২)</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col4.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col5.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col6.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col7.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col8.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col9.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col10.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col11.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col12.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(t2Totals.col13.toString())}</td>
            </tr>
            <tr className="bg-amber-300">
              <td colSpan={3} className="border-b border-r border-l border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">সর্বমোট</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col4.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col5.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col6.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col7.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col8.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col9.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col10.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col11.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col12.toString())}</td>
              <td className="border-b border-r border-slate-400 p-2 text-[11px] font-black text-slate-900 text-center bg-amber-300">{toBengaliDigits(grandTotals.col13.toString())}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* "ত্রৈমাসিক পূর্বজের" MODAL POPUP (Item 2.1) */}
      {isPriorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 z-[100000] no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[98%] max-h-[94vh] flex flex-col overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">ত্রৈমাসিক পূর্বজের প্রারম্ভিক জের এন্ট্রি</h3>
                  <p className="text-[11px] text-slate-300 font-bold">
                    মন্ত্রণালয় ও প্রতিষ্ঠান ভিত্তিক কলাম ৪, ৭, এবং ১১ এর ডাটা ইনপুট দিন (এক্সেল থেকে সরাসরি কপি-পেস্ট সাপোর্টসহ)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriorModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[11.5px] text-slate-600 font-bold">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>এক্সেল টেবিল কপি করে যেকোনো ইনপুট ঘরে পেস্ট করলে অটো-ফিল হবে।</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11.5px] transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>রিসেট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPriorModalOpen(false)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11.5px] shadow-sm transition-all cursor-pointer"
                >
                  <span>সংরক্ষণ ও বন্ধ করুন</span>
                </button>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="px-4 pb-4 pt-0 overflow-auto grow">
              <table className="w-full border-separate border-spacing-0 border border-slate-300 text-[11px]">
                <thead className="bg-slate-200 sticky top-0 z-30 shadow-sm">
                  <tr>
                    <th className="sticky top-0 z-30 border-b border-r border-slate-300 p-2.5 font-black text-slate-900 text-center w-[45px] bg-slate-200">ক্রঃ নং</th>
                    <th className="sticky top-0 z-30 border-b border-r border-slate-300 p-2.5 font-black text-slate-900 text-center w-[160px] bg-slate-200">মন্ত্রণালয়ের নাম</th>
                    <th className="sticky top-0 z-30 border-b border-r border-slate-300 p-2.5 font-black text-slate-900 text-center bg-slate-200">প্রতিষ্ঠানের নাম</th>
                    <th className="sticky top-0 z-30 border-b border-r border-slate-300 p-2.5 font-black text-blue-950 text-center bg-blue-100 w-[180px]">
                      প্রারম্ভিক অমিমাংসিত উত্থাপিত আপত্তির সংখ্যা (কলাম ৪)
                    </th>
                    <th className="sticky top-0 z-30 border-b border-r border-slate-300 p-2.5 font-black text-emerald-950 text-center bg-emerald-100 w-[180px]">
                      প্রারম্ভিক মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা (কলাম ৭)
                    </th>
                    <th className="sticky top-0 z-30 border-b border-slate-300 p-2.5 font-black text-purple-950 text-center bg-purple-100 w-[180px]">
                      অমিমাংসিত আপত্তিতে জড়িত টাকা (কলাম ১১)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let overallSerial = 0;
                    const grandSums = { col4: 0, col7: 0, col11: 0 };

                    return (
                      <>
                        {allMinistryGroups.map((group, groupIdx) => {
                          const minSums = { col4: 0, col7: 0, col11: 0 };

                          const groupRows = group.entities.map((entity, entityIdx) => {
                            overallSerial++;
                            const isFirst = entityIdx === 0;
                            const curVals = priorData[entity] || { col4: 0, col7: 0, col11: 0 };

                            minSums.col4 += curVals.col4 || 0;
                            minSums.col7 += curVals.col7 || 0;
                            minSums.col11 += curVals.col11 || 0;

                            grandSums.col4 += curVals.col4 || 0;
                            grandSums.col7 += curVals.col7 || 0;
                            grandSums.col11 += curVals.col11 || 0;

                            return (
                              <tr key={`${groupIdx}-${entityIdx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="border-b border-r border-slate-300 p-2 text-center font-bold text-slate-600 bg-slate-50/50">
                                  {toBengaliDigits(overallSerial.toString())}
                                </td>
                                {isFirst && (
                                  <td rowSpan={group.entities.length} className="border-b border-r border-slate-300 p-2 font-black text-slate-900 text-center align-middle bg-slate-100/60">
                                    {group.ministry}
                                  </td>
                                )}
                                <td className="border-b border-r border-slate-300 p-2 font-bold text-slate-800">
                                  {entity}
                                </td>
                                <td className="border-b border-r border-slate-300 p-1 bg-blue-50/30">
                                  <input
                                    type="text"
                                    value={curVals.col4 === 0 ? '' : toBengaliDigits(curVals.col4.toString())}
                                    onChange={(e) => handleInputValueChange(entity, 'col4', e.target.value)}
                                    onPaste={(e) => handleTablePaste(e, entity, 'col4')}
                                    placeholder="০"
                                    className="w-full text-center font-extrabold text-blue-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none text-[12px]"
                                  />
                                </td>
                                <td className="border-b border-r border-slate-300 p-1 bg-emerald-50/30">
                                  <input
                                    type="text"
                                    value={curVals.col7 === 0 ? '' : toBengaliDigits(curVals.col7.toString())}
                                    onChange={(e) => handleInputValueChange(entity, 'col7', e.target.value)}
                                    onPaste={(e) => handleTablePaste(e, entity, 'col7')}
                                    placeholder="০"
                                    className="w-full text-center font-extrabold text-emerald-900 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 outline-none text-[12px]"
                                  />
                                </td>
                                <td className="border-b border-slate-300 p-1 bg-purple-50/30">
                                  <input
                                    type="text"
                                    value={curVals.col11 === 0 ? '' : toBengaliDigits(curVals.col11.toString())}
                                    onChange={(e) => handleInputValueChange(entity, 'col11', e.target.value)}
                                    onPaste={(e) => handleTablePaste(e, entity, 'col11')}
                                    placeholder="০"
                                    className="w-full text-center font-extrabold text-purple-900 bg-white border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded px-2 py-1 outline-none text-[12px]"
                                  />
                                </td>
                              </tr>
                            );
                          });

                          return (
                            <React.Fragment key={groupIdx}>
                              {groupRows}
                              {/* Ministry Total Row */}
                              <tr className="bg-slate-200/90 font-black">
                                <td className="border-b border-r border-slate-300 p-2 text-center text-slate-900 bg-slate-200" colSpan={3}>
                                  মোট ({group.ministry})
                                </td>
                                <td className="border-b border-r border-slate-300 p-2 text-center text-blue-950 font-black bg-blue-100">
                                  {toBengaliDigits(minSums.col4.toString())}
                                </td>
                                <td className="border-b border-r border-slate-300 p-2 text-center text-emerald-950 font-black bg-emerald-100">
                                  {toBengaliDigits(minSums.col7.toString())}
                                </td>
                                <td className="border-b border-slate-300 p-2 text-center text-purple-950 font-black bg-purple-100">
                                  {toBengaliDigits(minSums.col11.toString())}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}

                        {/* Grand Total Row ("সর্বমোট") */}
                        <tr className="bg-slate-900 text-white font-black">
                          <td colSpan={3} className="border-r border-slate-700 p-3 text-center text-[12px] bg-slate-900">
                            সর্বমোট
                          </td>
                          <td className="border-r border-slate-700 p-3 text-center text-[12px] text-blue-200 bg-slate-900">
                            {toBengaliDigits(grandSums.col4.toString())}
                          </td>
                          <td className="border-r border-slate-700 p-3 text-center text-[12px] text-emerald-200 bg-slate-900">
                            {toBengaliDigits(grandSums.col7.toString())}
                          </td>
                          <td className="p-3 text-center text-[12px] text-purple-200 bg-slate-900">
                            {toBengaliDigits(grandSums.col11.toString())}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal (Item 2.1) */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[10000] no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center space-y-4 font-sans">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 mb-1">সতর্কবার্তা</h4>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                আপনি কি নিশ্চিত যে সকল ত্রৈমাসিক পূর্বজের প্রারম্ভিক জের ডাটা মুছে ফেলতে চান? এই কাজের পর ডাটাগুলো পুনরুদ্ধার করা যাবে না।
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleResetConfirmed}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                হ্যাঁ, রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QR_Detailed_1;
