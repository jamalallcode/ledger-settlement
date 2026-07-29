import React from 'react';
import { Sparkles, ChevronDown, BarChart3, FileSpreadsheet } from 'lucide-react';
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
  periodOpeningBalances?: any[];
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

  const isPatTarget = normTarget.includes("পাট") && !normTarget.includes("পাটকল") && !normTarget.includes("বিজেএমসি");
  const isPatEntry = normEntry.includes("পাট") && !normEntry.includes("পাটকল") && !normEntry.includes("বিজেএমসি");
  if (isPatTarget || isPatEntry) return isPatTarget && isPatEntry;

  // Commerce / Aviation / Tourism
  if (normTarget.includes("টিসিবি") && normEntry.includes("টিসিবি")) return true;
  if ((normTarget.includes("আমদানি") || normTarget.includes("রপ্তানি")) && 
      (normEntry.includes("আমদানি") || normEntry.includes("রপ্তানি"))) return true;
  if (normTarget.includes("বিমান") && normEntry.includes("বিমান")) return true;
  if (normTarget.includes("পর্যটন") && normEntry.includes("পর্যটন")) return true;

  return normEntry.includes(normTarget) || normTarget.includes(normEntry);
};

interface EntityPriorValues {
  col4: number;  // প্রারম্ভিক অমিমাংসিত উত্থাপিত আপত্তির সংখ্যা
  col7: number;  // প্রারম্ভিক নিষ্পত্তিকৃত আপত্তির সংখ্যা
  col11: number; // অমিমাংসিত আপত্তিতে জড়িত টাকা
}

const table1Data = [
  {
    ministry: "শিল্প মন্ত্রণালয়",
    entities: ["চিনি ও খাদ্য সংস্থা", "ক্ষুদ্র ও কুটির শিল্প", "বিটাক", "রসায়ন শিল্প"]
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
      "বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লি.",
      "গৃহনির্মাণ ঋণদান সংস্থা",
      "কর্মসংস্থান ব্যাংক",
      "বেসিক ব্যাংক লি.",
      "আনসার ভিডিপি উন্নয়ন ব্যাংক লি.",
      "ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ",
      "সাধারণ বীমা কর্পোরেশন",
      "জীবন বীমা কর্পোরেশন",
      "প্রবাসী কল্যাণ ব্যাংক"
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
  monthPickerElement,
  periodOpeningBalances
}) => {
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

  // Compute metrics for each entity
  const getEntityData = (entityName: string) => {
    let priorRaisedCount = 0;
    let priorRaisedAmount = 0;
    let priorSettledCount = 0;
    let priorSettledAmount = 0;

    let currentRaisedCount = 0;
    let currentSettledCount = 0;
    let currentSettledAmount = 0;

    const cycleStartStr = activeCycle?.start ? format(activeCycle.start, 'yyyy-MM-dd') : '';
    const cycleEndStr = activeCycle?.end ? format(activeCycle.end, 'yyyy-MM-dd') : '';

    (entries || []).forEach(e => {
      if (isEntityMatch(e.entityName || '', entityName)) {
        // Extract raised count
        let rCount = 0;
        const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          rCount = parseBengaliNumber(rCountRaw);
        }

        // Extract raised amount
        let rAmount = 0;
        if (e.manualRaisedAmount) {
          rAmount = parseBengaliNumber(String(e.manualRaisedAmount));
        }

        // Extract settled amount
        let settledAmt = 0;
        if (e.paragraphs && e.paragraphs.length > 0) {
          e.paragraphs.forEach(p => {
            settledAmt += parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
          });
        } else {
          if (e.settledAmount) {
            settledAmt += parseBengaliNumber(String(e.settledAmount));
          } else if (e.manualSettledAmount) {
            settledAmt += parseBengaliNumber(String(e.manualSettledAmount));
          } else {
            const rec = (e.totalRec || 0) + (e.totalAdj || 0);
            if (rec > 0) settledAmt += rec;
          }
        }

        // Extract settled count (only full settlements count towards settled paragraph count)
        let sCount = 0;
        if (e.paragraphs && e.paragraphs.length > 0) {
          sCount = e.paragraphs.filter(p => robustNormalize(p.status || '') === robustNormalize('পূর্ণাঙ্গ')).length;
        } else {
          const rawFc = parseBengaliNumber(String(e.fullCount || e.meetingFullSettledParaCount || e.meetingSettledParaCount || 0));
          if (settledAmt > 0 && (rawFc === settledAmt || rawFc > 500)) {
            sCount = 1;
          } else {
            sCount = rawFc;
          }
        }

        // Categorize by date relative to active cycle using string comparison (yyyy-MM-dd)
        const entryDateRaw = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
        const entryDate = entryDateRaw ? entryDateRaw.split('T')[0] : '';

        if (cycleStartStr && cycleEndStr && entryDate) {
          if (entryDate < cycleStartStr) {
            // Prior quarter entry -> carry forward to opening balance of current quarter
            priorRaisedCount += rCount;
            priorRaisedAmount += rAmount;
            priorSettledCount += sCount;
            priorSettledAmount += settledAmt;
          } else if (entryDate >= cycleStartStr && entryDate <= cycleEndStr) {
            // Current active quarter entry
            currentRaisedCount += rCount;
            currentSettledCount += sCount;
            currentSettledAmount += settledAmt;
          }
        } else {
          currentRaisedCount += rCount;
          currentSettledCount += sCount;
          currentSettledAmount += settledAmt;
        }
      }
    });

    // Helper to get stats from a map with robust key matching
    const getStatsFromMap = (map: Record<string, any> | undefined) => {
      if (!map) return { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
      let matchKey = entityName;
      if (robustNormalize(entityName) === robustNormalize("হস্ত ও কুটির শিল্প সংস্থা")) {
        matchKey = "ক্ষুদ্র ও কুটির শিল্প";
      } else if (robustNormalize(entityName) === robustNormalize("রসায়ন শিল্প সংস্থা")) {
        matchKey = "রসায়ন শিল্প";
      }
      let res = map[matchKey] || map[entityName];
      if (!res) {
        const keys = Object.keys(map);
        const foundKey = keys.find(k => isEntityMatch(k, entityName));
        if (foundKey) res = map[foundKey];
      }
      return res || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
    };

    // পূর্ব জের টেবিল হতে প্রারম্ভিক জের প্রাপ্তি এবং ত্রৈমাসিক রিটার্নে ম্যাপিং:
    // - পূর্ব জের কলাম (২) [অমীমাংসিত অনুচ্ছেদ সংখ্যা] -> কলাম ৪ (প্রারম্ভিক অমীমাংসিত অনুচ্ছেদ সংখ্যা)
    // - পূর্ব জের কলাম (৪) [অমীমাংসিত টাকা (ত্রৈমাসিক)] -> কলাম ১১ (প্রারম্ভিক অমীমাংসিত টাকা)
    // - পূর্ব জের কলাম (৫) [মীমাংসিত অনুচ্ছেদ সংখ্যা] -> কলাম ৭ (প্রারম্ভিক নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা)
    let baseUnsettledCount = 0;
    let baseUnsettledAmount = 0;
    let baseSettledCount = 0;

    const exactMatch = periodOpeningBalances?.find(pb => pb.startDate === cycleStartStr);
    let sfiObj: any = null;
    let nonSfiObj: any = null;

    if (exactMatch && exactMatch.stats) {
      sfiObj = getStatsFromMap(exactMatch.stats.entitiesSFI);
      nonSfiObj = getStatsFromMap(exactMatch.stats.entitiesNonSFI);
    } else if (prevStats) {
      sfiObj = getStatsFromMap(prevStats.entitiesSFI);
      nonSfiObj = getStatsFromMap(prevStats.entitiesNonSFI);
    }

    if (sfiObj || nonSfiObj) {
      const sC = sfiObj?.unsettledCount || 0;
      const nsC = nonSfiObj?.unsettledCount || 0;
      const sA = sfiObj?.unsettledAmount || 0;
      const nsA = nonSfiObj?.unsettledAmount || 0;
      const sQA = (sfiObj && sfiObj.unsettledQuarterlyAmount !== undefined && sfiObj.unsettledQuarterlyAmount !== null)
        ? sfiObj.unsettledQuarterlyAmount 
        : sA;
      const nsQA = (nonSfiObj && nonSfiObj.unsettledQuarterlyAmount !== undefined && nonSfiObj.unsettledQuarterlyAmount !== null)
        ? nonSfiObj.unsettledQuarterlyAmount 
        : nsA;
      const sS = sfiObj?.settledCount || 0;
      const nsS = nonSfiObj?.settledCount || 0;

      // Opening Balance Setup uses a unified master row per entity.
      // Column 4 (unsettledQuarterlyAmount) represents the total initial quarterly unsettled amount.
      if (sQA === nsQA || nsQA === 0 || sfiObj === nonSfiObj) {
        baseUnsettledAmount = sQA;
      } else if (sQA === 0) {
        baseUnsettledAmount = nsQA;
      } else {
        baseUnsettledAmount = sQA + nsQA;
      }

      if (sC === nsC || nsC === 0 || sfiObj === nonSfiObj) {
        baseUnsettledCount = sC;
      } else if (sC === 0) {
        baseUnsettledCount = nsC;
      } else {
        baseUnsettledCount = sC + nsC;
      }

      if (sS === nsS || nsS === 0 || sfiObj === nonSfiObj) {
        baseSettledCount = sS;
      } else if (sS === 0) {
        baseSettledCount = nsS;
      } else {
        baseSettledCount = sS + nsS;
      }
    }

    const col4 = baseUnsettledCount + priorRaisedCount;
    const col5 = currentRaisedCount;
    const col6 = col4 + col5;

    const col7 = baseSettledCount + priorSettledCount;
    const col8 = currentSettledCount;
    const col9 = col7 + col8;

    const col10 = col6 - col9;

    const col11 = baseUnsettledAmount + priorRaisedAmount - priorSettledAmount;
    const col12 = currentSettledAmount;
    const col13 = col11 - col12;

    return { col4, col5, col6, col7, col8, col9, col10, col11, col12, col13 };
  };

  // Header styles with border fix for sticky header
  const thCls = "p-2 text-[10px] font-black text-slate-800 align-middle text-center bg-slate-100";
  const thRow2Cls = "p-2 text-[10px] font-black text-slate-800 align-middle text-center bg-slate-100";
  const thRow3Cls = "p-2 text-[10px] font-black text-slate-800 align-middle text-center bg-slate-200";

  const yellowThCls = "p-2 text-[10px] font-black text-slate-900 align-middle text-center bg-amber-300";
  const yellowThRow2Cls = "p-2 text-[10px] font-black text-slate-900 align-middle text-center bg-amber-300";
  const yellowThRow3Cls = "p-2 text-[10px] font-black text-slate-900 align-middle text-center bg-amber-400";

  const tdCls = "p-2 text-[10px] text-slate-800 align-middle bg-white";
  const numTdCls = "p-2 text-[10px] text-slate-800 text-center align-middle font-bold bg-white whitespace-nowrap";
  const footerTdCls = "p-2 text-[10px] text-white align-middle bg-black font-black text-center whitespace-nowrap";

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
      <div className="flex flex-wrap items-center justify-end gap-3 mb-4 bg-slate-50 border border-slate-200 p-2.5 rounded-xl no-print shadow-sm">
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
      <div className="qr-table-container table-container overflow-auto shadow-sm rounded-lg mb-6 max-h-[75vh]">
        {/* TABLE 1 */}
        <table className="w-full border-separate border-spacing-0 min-w-[1050px]">
          <thead>
            <tr>
              <th rowSpan={2} className={`${thCls} w-[40px]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[68px]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${thCls} w-[78px]`}>প্রতিষ্ঠানের নাম</th>
              <th colSpan={3} className={thCls}>প্রারম্ভিক অমিমাংসিত</th>
              <th colSpan={3} className={thCls}>প্রারম্ভিক মীমাংসিত</th>
              <th rowSpan={2} className={`${thCls} w-[100px]`}>{cumPeriodEnd} পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
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
              <th className={thRow3Cls}>১</th>
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
                      <td className={numTdCls}>{toBengaliDigits(serialCount.toString())}</td>
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
                      <td colSpan={3} className={`${tdCls} font-black text-center bg-slate-200 text-slate-900`}>
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
          <tfoot className="bg-black">
            <tr className="bg-black">
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
              <th rowSpan={2} className={`${yellowThCls} w-[40px]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${yellowThCls} w-[68px]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${yellowThCls} w-[78px]`}>প্রতিষ্ঠানের নাম</th>
              <th colSpan={3} className={yellowThCls}>প্রারম্ভিক অমিমাংসিত</th>
              <th colSpan={3} className={yellowThCls}>প্রারম্ভিক মীমাংসিত</th>
              <th rowSpan={2} className={`${yellowThCls} w-[100px]`}>{cumPeriodEnd} পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
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
              <th className={yellowThRow3Cls}>১</th>
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
                      <td className={numTdCls}>{toBengaliDigits(serialCount.toString())}</td>
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
                      <td colSpan={3} className={`${tdCls} font-black text-center bg-amber-200 text-slate-900`}>
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
          <tfoot className="bg-black">
            <tr className="bg-black">
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
            <tr className="bg-black">
              <td colSpan={3} className={footerTdCls}>সর্বমোট</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col4.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col5.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col6.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col7.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col8.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col9.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col10.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col11.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col12.toString())}</td>
              <td className={footerTdCls}>{toBengaliDigits(grandTotals.col13.toString())}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default QR_Detailed_1;
