import React, { useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { format } from 'date-fns';
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
  customTitle?: string;
  paraType?: 'এসএফআই' | 'নন এসএফআই';
}

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

const isEntityMatch = (entryEntity: string = '', targetEntity: string = ''): boolean => {
  const normEntry = robustNormalize(entryEntity);
  const normTarget = robustNormalize(targetEntity);
  if (!normEntry || !normTarget) return false;
  if (normEntry === normTarget) return true;

  // Cottage / Handicraft / Small Industries / BSCIC
  if ((normTarget.includes("কুটির") || normTarget.includes("হস্ত") || normTarget.includes("বিসিক")) && 
      (normEntry.includes("কুটির") || normEntry.includes("হস্ত") || normEntry.includes("বিসিক"))) return true;

  // Sugar & Food Industries (বিএসএফআইসি / চিনি ও খাদ্য)
  if ((normTarget.includes("চিনি") || normTarget.includes("খাদ্য") || normTarget.includes("বিএসএফআইসি")) && 
      (normEntry.includes("চিনি") || normEntry.includes("খাদ্য") || normEntry.includes("বিএসএফআইসি"))) return true;

  // Chemical Industries (BCIC / বিসিআইসি / রসায়ন)
  if ((normTarget.includes("রসায়ন") || normTarget.includes("রসায়ন") || normTarget.includes("বিসিআইসি")) && 
      (normEntry.includes("রসায়ন") || normEntry.includes("রসায়ন") || normEntry.includes("বিসিআইসি"))) return true;

  // Banks & Financial Institutions
  if (normTarget.includes("সোনালী") && normEntry.includes("সোনালী")) return true;
  if (normTarget.includes("জনতা") && normEntry.includes("জনতা")) return true;
  if (normTarget.includes("অগ্রণী") && normEntry.includes("অগ্রণী")) return true;
  if (normTarget.includes("রূপালী") && normEntry.includes("রূপালী")) return true;
  if (normTarget.includes("কৃষি") && normEntry.includes("কৃষি")) return true;
  if (normTarget.includes("বাংলাদেশ ব্যাংক") && normEntry.includes("বাংলাদেশ ব্যাংক")) return true;
  if (normTarget.includes("ডেভেলপমেন্ট") && normEntry.includes("ডেভেলপমেন্ট")) return true;
  if (normTarget.includes("গৃহনির্মাণ") && normEntry.includes("গৃহনির্মাণ")) return true;
  if (normTarget.includes("কর্মসংস্থান") && normEntry.includes("কর্মসংস্থান")) return true;
  if (normTarget.includes("বেসিক") && normEntry.includes("বেসিক")) return true;
  if (normTarget.includes("আনসার") && normEntry.includes("আনসার")) return true;
  if (normTarget.includes("ইনভেস্ট") && normEntry.includes("ইনভেস্ট")) return true;
  if (normTarget.includes("সাধারণ বীমা") && normEntry.includes("সাধারণ বীমা")) return true;
  if (normTarget.includes("জীবন বীমা") && normEntry.includes("জীবন বীমা")) return true;
  if (normTarget.includes("প্রবাসী কল্যাণ") && normEntry.includes("প্রবাসী কল্যাণ")) return true;

  // Jute & Textiles (Patkol vs Pat)
  const isPatkolTarget = normTarget.includes("পাটকল") || normTarget.includes("বিজেএমসি") || normTarget.includes("জুট");
  const isPatkolEntry = normEntry.includes("পাটকল") || normEntry.includes("বিজেএমসি") || normEntry.includes("জুট");
  if (isPatkolTarget || isPatkolEntry) return isPatkolTarget && isPatkolEntry;

  const isBostraTarget = normTarget.includes("বস্ত্র") || normTarget.includes("বিটিএমসি") || normTarget.includes("রেশম");
  const isBostraEntry = normEntry.includes("বস্ত্র") || normEntry.includes("বিটিএমসি") || normEntry.includes("রেশম");
  if (isBostraTarget || isBostraEntry) return isBostraTarget && isBostraEntry;

  if (normTarget.includes("টিসিবি") && normEntry.includes("টিসিবি")) return true;
  if ((normTarget.includes("আমদানি") || normTarget.includes("রপ্তানি")) && 
      (normEntry.includes("আমদানি") || normEntry.includes("রপ্তানি"))) return true;
  if (normTarget.includes("বিমান") && normEntry.includes("বিমান")) return true;
  if (normTarget.includes("পর্যটন") && normEntry.includes("পর্যটন")) return true;

  return normEntry.includes(normTarget) || normTarget.includes(normEntry);
};

const DEFAULT_MINISTRIES = [
  {
    sl: 1,
    name: 'বস্ত্র ও পাট মন্ত্রণালয়',
    entities: ['পাটকল সংস্থা', 'পাট সংস্থা', 'বস্ত্রকল সংস্থা', 'রেশম বোর্ড'],
    matchKeys: ['পাট', 'বস্ত্র', 'বিজেএমসি', 'বিটিএমসি'],
  },
  {
    sl: 2,
    name: 'শিল্প মন্ত্রণালয়',
    entities: ['চিনি ও খাদ্য সংস্থা', 'ক্ষুদ্র ও কুটির শিল্প', 'বিটাক', 'রসায়ন শিল্প'],
    matchKeys: ['শিল্প', 'চিনি', 'কুটির', 'বিসিক', 'বিসিআইসি', 'রসায়ন', 'রসায়ন'],
  },
  {
    sl: 3,
    name: 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
    entities: ['বাংলাদেশ বিমান', 'পর্যটন কর্পোরেশন'],
    matchKeys: ['বিমান', 'পর্যটন'],
  },
  {
    sl: 4,
    name: 'বাণিজ্য মন্ত্রণালয়',
    entities: ['টিসিবি', 'আমদানি ও রপ্তানি', 'আমদানি', 'রপ্তানি'],
    matchKeys: ['বাণিজ্য', 'টিসিবি', 'আমদানি', 'রপ্তানি'],
  },
  {
    sl: 5,
    name: 'আর্থিক প্রতিষ্ঠান বিভাগ',
    entities: [
      'সোনালী ব্যাংক পিএলসি', 'জনতা ব্যাংক পিএলসি', 'অগ্রণী ব্যাংক পিএলসি',
      'বাংলাদেশ কৃষি ব্যাংক', 'রূপালী ব্যাংক পিএলসি', 'বাংলাদেশ ব্যাংক',
      'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লি.', 'গৃহনির্মাণ ঋণদান সংস্থা',
      'কর্মসংস্থান ব্যাংক', 'বেসিক ব্যাংক লি.', 'আনসার ভিডিপি উন্নয়ন ব্যাংক লি.',
      'ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ', 'সাধারণ বীমা কর্পোরেশন',
      'জীবন বীমা কর্পোরেশন', 'প্রবাসী কল্যাণ ব্যাংক'
    ],
    matchKeys: ['আর্থিক প্রতিষ্ঠান বিভাগ', 'আর্থিক প্রতিষ্ঠান', 'ব্যাংক', 'বীমা', 'ইনভেস্টমেন্ট', 'সোনালী', 'জনতা', 'অগ্রণী', 'রূপালী', 'কৃষি', 'বেসিক'],
  }
];

const QR_4: React.FC<QRProps> = ({
  entries,
  activeCycle,
  IDBadge,
  searchTerm = '',
  filterMinistry = '',
  monthPickerElement,
  customTitle = 'বিস্তারিত - ৩',
  paraType = 'নন এসএফআই'
}) => {
  // Extract quarter information
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

  const { formattedRange } = getQuarterInfo(activeCycle?.end || new Date());

  const cycleStartStr = activeCycle?.start ? format(activeCycle.start, 'yyyy-MM-dd') : '';
  const cycleEndStr = activeCycle?.end ? format(activeCycle.end, 'yyyy-MM-dd') : '';

  // Process and aggregate data ministry-wise
  const tableData = useMemo(() => {
    // Check if an entry matches a specific ministry configuration
    const isEntryForMinistry = (e: SettlementEntry, minConfig: typeof DEFAULT_MINISTRIES[0]) => {
      const eMin = robustNormalize(e.ministryName || '');
      const eEnt = robustNormalize(e.entityName || '');

      // 1. Check if entity matches any mapped entity for this ministry
      if (minConfig.entities && minConfig.entities.some(ent => isEntityMatch(eEnt, ent))) {
        return true;
      }

      // 2. Check keyword / name match
      return minConfig.matchKeys.some(key => {
        const normKey = robustNormalize(key);
        return eMin.includes(normKey) || eEnt.includes(normKey);
      });
    };

    // Filter relevant entries for the current cycle and paraType
    const relevantEntries = (entries || []).filter(e => {
      if (paraType && robustNormalize(e.paraType || '') !== robustNormalize(paraType)) {
        return false;
      }

      const entryDateRaw = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      const entryDate = entryDateRaw ? entryDateRaw.split('T')[0] : '';

      if (cycleStartStr && cycleEndStr && entryDate) {
        if (entryDate < cycleStartStr || entryDate > cycleEndStr) {
          return false;
        }
      }

      return true;
    });

    return DEFAULT_MINISTRIES.map(minConfig => {
      const matchedEntries = relevantEntries.filter(e => isEntryForMinistry(e, minConfig));

      let vatRec = 0;
      let vatAdj = 0;
      let itRec = 0;
      let itAdj = 0;
      let othersRec = 0;
      let othersAdj = 0;
      const remarksList: string[] = [];

      matchedEntries.forEach(entry => {
        if (entry.remarks && entry.remarks.trim()) {
          remarksList.push(entry.remarks.trim());
        }

        if (entry.paragraphs && entry.paragraphs.length > 0) {
          entry.paragraphs.forEach(p => {
            let pVatRec = parseBengaliNumber(String(p.vatRec || '0'));
            let pVatAdj = parseBengaliNumber(String(p.vatAdj || '0'));
            let pItRec = parseBengaliNumber(String(p.itRec || '0'));
            let pItAdj = parseBengaliNumber(String(p.itAdj || '0'));
            let pOthRec = parseBengaliNumber(String(p.othersRec || '0'));
            let pOthAdj = parseBengaliNumber(String(p.othersAdj || '0'));

            const pRecAmt = parseBengaliNumber(String(p.recoveredAmount || '0'));
            const pAdjAmt = parseBengaliNumber(String(p.adjustedAmount || '0'));

            if (p.category === 'ভ্যাট') {
              if (pVatRec === 0 && pRecAmt > 0) pVatRec = pRecAmt;
              if (pVatAdj === 0 && pAdjAmt > 0) pVatAdj = pAdjAmt;
            } else if (p.category === 'আয়কর') {
              if (pItRec === 0 && pRecAmt > 0) pItRec = pRecAmt;
              if (pItAdj === 0 && pAdjAmt > 0) pItAdj = pAdjAmt;
            } else if (p.category === 'অন্যান্য') {
              if (pOthRec === 0 && pRecAmt > 0) pOthRec = pRecAmt;
              if (pOthAdj === 0 && pAdjAmt > 0) pOthAdj = pAdjAmt;
            } else {
              if (pVatRec + pItRec + pOthRec === 0 && pRecAmt > 0) {
                pOthRec = pRecAmt;
              }
              if (pVatAdj + pItAdj + pOthAdj === 0 && pAdjAmt > 0) {
                pOthAdj = pAdjAmt;
              }
            }

            vatRec += pVatRec;
            vatAdj += pVatAdj;
            itRec += pItRec;
            itAdj += pItAdj;
            othersRec += pOthRec;
            othersAdj += pOthAdj;
          });
        } else {
          let entVatRec = parseBengaliNumber(String(entry.vatRec || '0'));
          let entVatAdj = parseBengaliNumber(String(entry.vatAdj || '0'));
          let entItRec = parseBengaliNumber(String(entry.itRec || '0'));
          let entItAdj = parseBengaliNumber(String(entry.itAdj || '0'));
          let entOthRec = parseBengaliNumber(String(entry.othersRec || '0'));
          let entOthAdj = parseBengaliNumber(String(entry.othersAdj || '0'));

          const topTotalRec = parseBengaliNumber(String(entry.totalRec || entry.settledAmount || entry.manualSettledAmount || '0'));
          const topTotalAdj = parseBengaliNumber(String(entry.totalAdj || '0'));

          if (topTotalRec > 0 && (entVatRec + entItRec + entOthRec === 0)) {
            entOthRec = topTotalRec;
          }
          if (topTotalAdj > 0 && (entVatAdj + entItAdj + entOthAdj === 0)) {
            entOthAdj = topTotalAdj;
          }

          vatRec += entVatRec;
          vatAdj += entVatAdj;
          itRec += entItRec;
          itAdj += entItAdj;
          othersRec += entOthRec;
          othersAdj += entOthAdj;
        }
      });

      const itVatRec = vatRec + itRec;
      const itVatAdj = vatAdj + itAdj;
      const totalRec = itVatRec + othersRec;
      const totalAdj = itVatAdj + othersAdj;
      const involvedAmount = totalRec + totalAdj;

      return {
        sl: minConfig.sl,
        ministryName: minConfig.name,
        involvedAmount,
        itVatRec,
        itVatAdj,
        othersRec,
        othersAdj,
        totalRec,
        totalAdj,
        remarks: remarksList.length > 0 ? Array.from(new Set(remarksList)).join(', ') : ''
      };
    });
  }, [entries, paraType, cycleStartStr, cycleEndStr]);

  // Calculate Column Totals
  const totals = useMemo(() => {
    return tableData.reduce((acc, row) => {
      acc.involvedAmount += row.involvedAmount;
      acc.itVatRec += row.itVatRec;
      acc.itVatAdj += row.itVatAdj;
      acc.othersRec += row.othersRec;
      acc.othersAdj += row.othersAdj;
      acc.totalRec += row.totalRec;
      acc.totalAdj += row.totalAdj;
      return acc;
    }, {
      involvedAmount: 0,
      itVatRec: 0,
      itVatAdj: 0,
      othersRec: 0,
      othersAdj: 0,
      totalRec: 0,
      totalAdj: 0
    });
  }, [tableData]);

  // Excel Download Handler
  const downloadExcel = () => {
    const table = document.querySelector('#qr-4-table');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const filename = `${customTitle}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .bg-black { background-color: #090d16 !important; color: #ffffff !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
          .text-right { text-align: right !important; }
          .text-left { text-align: left !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 5px; color: #1e3a8a;">${customTitle}</h2>
        <div style="margin-bottom: 15px; font-weight: bold;">
          <span>মন্ত্রণালয়/সংস্থাভিত্তিক অডিট আপত্তির ${formattedRange} পর্যন্ত মাসের বিবরণ:</span>
          <span style="float: right;">শাখার নাম: ${paraType} শাখা</span>
        </div>
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

  const thCls = "border-r border-b border-slate-400 p-2 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const thClsWithTop = thCls + " border-t border-slate-400";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-800 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-800 text-right align-middle font-bold tabular-nums";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-white align-middle bg-black font-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-white text-right align-middle font-black bg-black tabular-nums";

  const renderNumber = (val: number) => {
    return toBengaliDigits(val.toLocaleString('en-US'));
  };

  return (
    <div id="qr-4-container" className="w-full mx-auto py-4 px-2 bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-4-container" />

      {/* Action bar */}
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-100 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-blue-800 font-bold text-[12px]">
              {customTitle} | {toBengaliDigits(activeCycle?.label || '')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {monthPickerElement && (
            <div className="select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}
          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 transition-all rounded-lg cursor-pointer shrink-0 shadow-xs"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {customTitle}
        </h1>
      </div>

      {/* Subheader info: Left (description) and Right (branch name) */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] font-bold text-slate-800 px-1">
        <div>
          মন্ত্রণালয়/সংস্থাভিত্তিক অডিট আপত্তির <span className="font-extrabold text-blue-900">{formattedRange}</span> পর্যন্ত মাসের বিবরণ:
        </div>
        <div className="text-right">
          শাখার নাম: <span className="font-extrabold text-slate-900">{paraType} শাখা</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="w-full overflow-x-auto border-t border-l border-slate-400 rounded-xs shadow-xs">
        <table id="qr-4-table" className="w-full border-collapse text-center">
          <thead>
            {/* Header Row 1 */}
            <tr>
              <th rowSpan={2} className={thClsWithTop + " w-[50px]"}>ক্রঃ নং</th>
              <th rowSpan={2} className={thClsWithTop + " min-w-[220px] text-left pl-3"}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={thClsWithTop + " min-w-[130px]"}>জড়িত টাকা</th>
              <th colSpan={2} className={thClsWithTop}>আয়কর ও ভ্যাট বাবদ</th>
              <th colSpan={2} className={thClsWithTop}>অন্যান্য বাবদ</th>
              <th colSpan={2} className={thClsWithTop}>সর্বমোট</th>
              <th rowSpan={2} className={thClsWithTop + " min-w-[100px]"}>মন্তব্য</th>
            </tr>
            {/* Header Row 2 */}
            <tr>
              <th className={thCls + " min-w-[100px]"}>আদায়</th>
              <th className={thCls + " min-w-[100px]"}>সমন্বয়</th>
              <th className={thCls + " min-w-[100px]"}>আদায়</th>
              <th className={thCls + " min-w-[100px]"}>সমন্বয়</th>
              <th className={thCls + " min-w-[110px]"}>আদায়</th>
              <th className={thCls + " min-w-[110px]"}>সমন্বয়</th>
            </tr>
            {/* Column Index Row */}
            <tr className="bg-slate-200/80 font-black text-[9px] text-slate-700">
              <th className={thCls}>১</th>
              <th className={thCls}>২</th>
              <th className={thCls}>৩</th>
              <th className={thCls}>৪</th>
              <th className={thCls}>৫</th>
              <th className={thCls}>৬</th>
              <th className={thCls}>৭</th>
              <th className={thCls}>৮=৪+৬</th>
              <th className={thCls}>৯=৫+৭</th>
              <th className={thCls}>১০</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.sl} className="hover:bg-slate-50 transition-colors">
                <td className={tdCls + " text-center font-bold"}>{toBengaliDigits(row.sl.toString())}</td>
                <td className={tdCls + " text-left pl-3 font-semibold text-slate-900"}>{row.ministryName}</td>
                <td className={numTdCls}>{renderNumber(row.involvedAmount)}</td>
                <td className={numTdCls}>{renderNumber(row.itVatRec)}</td>
                <td className={numTdCls}>{renderNumber(row.itVatAdj)}</td>
                <td className={numTdCls}>{renderNumber(row.othersRec)}</td>
                <td className={numTdCls}>{renderNumber(row.othersAdj)}</td>
                <td className={numTdCls}>{renderNumber(row.totalRec)}</td>
                <td className={numTdCls}>{renderNumber(row.totalAdj)}</td>
                <td className={tdCls + " text-center text-slate-500"}>{row.remarks || '-'}</td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="font-black h-[32px] bg-black text-white no-hover-row">
              <td colSpan={2} className={footerTdCls + " text-center tracking-wide"}>মোট</td>
              <td className={footerNumTdCls}>{renderNumber(totals.involvedAmount)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.itVatRec)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.itVatAdj)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.othersRec)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.othersAdj)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.totalRec)}</td>
              <td className={footerNumTdCls}>{renderNumber(totals.totalAdj)}</td>
              <td className={footerTdCls + " text-center"}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QR_4;
