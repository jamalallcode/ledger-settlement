import React, { useMemo } from 'react';
import { Printer, Sparkles, ChevronDown, BarChart3, FileSpreadsheet } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { ENTRY_START_DATE } from '../constants';

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
}

const QR_2: React.FC<QRProps> = ({ entries, prevStats, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle }) => {
  // Standard calendar quarter date calculation:
  // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
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
      formattedRange,
      quarterStartMonth,
      quarterYear
    };
  };

  const { startDate, endDate, startMonthName, endMonthName, formattedRange, quarterStartMonth, quarterYear } = getQuarterInfo(activeCycle.end);

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

    const filename = `${(customTitle || 'ত্রৈমাসিক_রিটার্ন_২').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${customTitle || 'ত্রৈমাসিক রিটার্ন - ২'}</h2>
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

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const getPrevQuarterEndInfo = () => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    let prevMonthIdx = 0;
    let prevYear = quarterYear;
    
    if (quarterStartMonth === 0) { // Jan
      prevMonthIdx = 11; // Dec
      prevYear = quarterYear - 1;
    } else if (quarterStartMonth === 3) { // Apr
      prevMonthIdx = 2; // Mar
    } else if (quarterStartMonth === 6) { // Jul
      prevMonthIdx = 5; // Jun
    } else if (quarterStartMonth === 9) { // Oct
      prevMonthIdx = 8; // Sep
    }
    
    return {
      monthName: months[prevMonthIdx],
      year: toBengaliDigits(prevYear.toString())
    };
  };
  
  const prevQuarterEnd = getPrevQuarterEndInfo();

  const QR2_MINISTRY_MAP: Record<string, string[]> = {
    "শিল্প মন্ত্রণালয়": [
      "চিনি ও খাদ্য সংস্থা",
      "হস্ত ও কুটির শিল্প সংস্থা",
      "বিটাক",
      "রসায়ন শিল্প সংস্থা"
    ],
    "বস্ত্র ও পাট মন্ত্রণালয়": [
      "পাটকল সংস্থা",
      "পাট সংস্থা",
      "বস্ত্রকল সংস্থা",
      "রেশম বোর্ড"
    ],
    "বাণিজ্য মন্ত্রণালয়": [
      "টিসিবি",
      "আমদানি ও রপ্তানি"
    ],
    "বেসামরিক বিমান পরিবহন ও পর্যটন": [
      "বাংলাদেশ বিমান",
      "পর্যটন কর্পোরেশন"
    ]
  };

  const isMinistryMatch = (entryMinistry: string, targetMinistry: string) => {
    const normEntry = robustNormalize(entryMinistry);
    const normTarget = robustNormalize(targetMinistry);
    if (normEntry === normTarget) return true;

    if (normTarget === robustNormalize("বস্ত্র ও পাট মন্ত্রণালয়")) {
      return normEntry === robustNormalize("পাট মন্ত্রণালয়") || 
             normEntry === robustNormalize("বস্ত্র মন্ত্রণালয়") || 
             normEntry === robustNormalize("বস্ত্র ও পাট মন্ত্রণালয়");
    }

    if (normTarget === robustNormalize("বেসামরিক বিমান পরিবহন ও পর্যটন")) {
      return normEntry === robustNormalize("বিমান ও পর্যটন মন্ত্রণালয়") || 
             normEntry === robustNormalize("বেসামরিক বিমান পরিবহন ও পর্যটন");
    }

    return false;
  };

  const isEntityMatch = (entryEntity: string, targetEntity: string) => {
    const normEntry = robustNormalize(entryEntity);
    const normTarget = robustNormalize(targetEntity);
    if (normEntry === normTarget) return true;
    
    // Equivalence mappings
    if (normTarget === robustNormalize("হস্ত ও কুটির শিল্প সংস্থা") && normEntry === robustNormalize("ক্ষুদ্র ও কুটির শিল্প")) return true;
    if (normTarget === robustNormalize("ক্ষুদ্র ও কুটির শিল্প") && normEntry === robustNormalize("হস্ত ও কুটির শিল্প সংস্থা")) return true;
    if (normTarget === robustNormalize("রসায়ন শিল্প সংস্থা") && normEntry === robustNormalize("রসায়ন শিল্প")) return true;
    if (normTarget === robustNormalize("রসায়ন শিল্প") && normEntry === robustNormalize("রসায়ন শিল্প সংস্থা")) return true;
    
    // Financial institutions equivalents to prevent typo mismatches
    if (normTarget.includes("বাংলাদেশ ডেভেলপমেন্ট ব্যাংক") && normEntry.includes("বাংলাদেশ ডেভেলপমেন্ট ব্যাংক")) return true;
    if (normTarget.includes("বেসিক ব্যাংক") && normEntry.includes("বেসিক ব্যাংক")) return true;
    if (normTarget.includes("ইনভেস্টমেন্ট কর্পোরেশন") && normEntry.includes("ইনভেস্ট")) return true;
    if (normTarget.includes("ইনভেস্ট কর্পোরেশন") && normEntry.includes("ইনভেস্ট")) return true;
    if (normTarget.includes("আনসার ভিডিপি") && normEntry.includes("আনসার ভিডিপি")) return true;
    if (normTarget.includes("সোনালী ব্যাংক") && normEntry.includes("সোনালী ব্যাংক")) return true;
    if (normTarget.includes("জনতা ব্যাংক") && normEntry.includes("জনতা ব্যাংক")) return true;
    if (normTarget.includes("অগ্রণী ব্যাংক") && normEntry.includes("অগ্রণী ব্যাংক")) return true;
    if (normTarget.includes("রূপালী ব্যাংক") && normEntry.includes("রূপালী ব্যাংক")) return true;
    if (normTarget.includes("কৃষি ব্যাংক") && normEntry.includes("কৃষি ব্যাংক")) return true;
    if (normTarget.includes("কর্মসংস্থান ব্যাংক") && normEntry.includes("কর্মসংস্থান ব্যাংক")) return true;
    if (normTarget.includes("সাধারণ বীমা") && normEntry.includes("সাধারণ বীমা")) return true;
    if (normTarget.includes("জীবন বীমা") && normEntry.includes("জীবন বীমা")) return true;
    if (normTarget.includes("প্রবাসী কল্যাণ") && normEntry.includes("প্রবাসী কল্যাণ")) return true;

    return normEntry.includes(normTarget) || normTarget.includes(normEntry);
  };

  const getEntityStats = (entName: string) => {
    const baseMap = prevStats?.entitiesNonSFI || {};
    let matchKey = entName;
    if (robustNormalize(entName) === robustNormalize("হস্ত ও কুটির শিল্প সংস্থা")) {
      matchKey = "ক্ষুদ্র ও কুটির শিল্প";
    } else if (robustNormalize(entName) === robustNormalize("রসায়ন শিল্প সংস্থা")) {
      matchKey = "রসায়ন শিল্প";
    }
    
    let stats = baseMap[matchKey] || baseMap[entName];
    if (!stats) {
      const keys = Object.keys(baseMap);
      const foundKey = keys.find(k => robustNormalize(k).includes(robustNormalize(entName)) || robustNormalize(entName).includes(robustNormalize(k)));
      if (foundKey) {
        stats = baseMap[foundKey];
      }
    }
    return stats || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
  };

  const [isPrevLedgerOpen, setIsPrevLedgerOpen] = React.useState(false);

  const [prevLedgerData, setPrevLedgerData] = React.useState<Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }>>(() => {
    const saved = localStorage.getItem('qr2_table1_prev_ledger_june2025');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing prev ledger data:", e);
      }
    }
    
    // Fallback/Default values derived from base prevStats
    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
    Object.values(QR2_MINISTRY_MAP).forEach(entities => {
      entities.forEach(entName => {
        // Find default stats
        const base = getEntityStats(entName);
        defaults[entName] = {
          june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
          june25Settled: (base?.settledCount || 0),
          june25UnsettledAmount: (base?.unsettledAmount || 0)
        };
      });
    });
    return defaults;
  });

  const handleSavePrevLedger = (updated: typeof prevLedgerData) => {
    setPrevLedgerData(updated);
    localStorage.setItem('qr2_table1_prev_ledger_june2025', JSON.stringify(updated));
  };

  const handleInputChange = (entName: string, field: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount', value: number) => {
    const updated = {
      ...prevLedgerData,
      [entName]: {
        ...(prevLedgerData[entName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 }),
        [field]: value
      }
    };
    handleSavePrevLedger(updated);
  };

  const prevLedgerRows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    Object.entries(QR2_MINISTRY_MAP).forEach(([mName, entities]) => {
      entities.forEach(entityName => {
        const ledger = prevLedgerData[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        
        // Calculate transition settled from July 1, 2025 up to cycle start
        const cycleStartStr = format(startDate, 'yyyy-MM-dd');
        const transitionEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;
          
          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate >= '2025-07-01' && entryDate < cycleStartStr;
        });

        let transitionSettledCount = 0;
        let transitionSettledAmount = 0;
        const processedParaIds = new Set<string>();

        transitionEntries.forEach(entry => {
          if (entry.paragraphs) {
            entry.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedParaIds.has(p.id) && hasDigit) {
                processedParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  transitionSettledCount++; 
                  transitionSettledAmount += settledAmt;
                }
              }
            });
          }
        });

        const unsettledCountJune25 = Math.max(0, ledger.june25Raised - ledger.june25Settled);
        const totalSettledCount = ledger.june25Settled + transitionSettledCount;
        const totalUnsettledCount = Math.max(0, ledger.june25Raised - totalSettledCount);
        const totalUnsettledAmount = Math.max(0, ledger.june25UnsettledAmount - transitionSettledAmount);

        rows.push({
          sl,
          ministryName: mName,
          entityName,
          june25Raised: ledger.june25Raised,
          june25Settled: ledger.june25Settled,
          unsettledCountJune25,
          june25UnsettledAmount: ledger.june25UnsettledAmount,
          transitionSettledCount,
          transitionSettledAmount,
          totalSettledCount,
          totalUnsettledCount,
          totalUnsettledAmount
        });
        
        sl++;
      });
    });

    return rows;
  }, [prevLedgerData, entries, startDate]);

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startRowIndex: number,
    startColField: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount'
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) {
      return;
    }

    e.preventDefault();

    const pastedRows = text
      .split(/\r?\n/)
      .map(row => row.split('\t'))
      .filter(row => row.length > 0 && !(row.length === 1 && row[0] === ''));

    if (pastedRows.length === 0) return;

    const fields: Array<'june25Raised' | 'june25Settled' | 'june25UnsettledAmount'> = [
      'june25Raised',
      'june25Settled',
      'june25UnsettledAmount'
    ];
    const startColIndex = fields.indexOf(startColField);

    const updated = { ...prevLedgerData };

    for (let r = 0; r < pastedRows.length; r++) {
      const rowIndex = startRowIndex + r;
      if (rowIndex >= prevLedgerRows.length) break;

      const entityName = prevLedgerRows[rowIndex].entityName;
      if (!entityName) continue;

      const pastedCols = pastedRows[r];
      for (let c = 0; c < pastedCols.length; c++) {
        const colIndex = startColIndex + c;
        if (colIndex >= fields.length) break;

        const field = fields[colIndex];
        const rawValue = pastedCols[c].trim();
        const value = parseBengaliNumber(rawValue);

        if (!updated[entityName]) {
          updated[entityName] = { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        }
        updated[entityName][field] = value;
      }
    }

    handleSavePrevLedger(updated);
  };

  const prevLedgerGrandTotals = useMemo(() => {
    return prevLedgerRows.reduce((acc, row) => {
      acc.june25Raised += row.june25Raised;
      acc.june25Settled += row.june25Settled;
      acc.unsettledCountJune25 += row.unsettledCountJune25;
      acc.june25UnsettledAmount += row.june25UnsettledAmount;
      acc.transitionSettledCount += row.transitionSettledCount;
      acc.transitionSettledAmount += row.transitionSettledAmount;
      acc.totalSettledCount += row.totalSettledCount;
      acc.totalUnsettledCount += row.totalUnsettledCount;
      acc.totalUnsettledAmount += row.totalUnsettledAmount;
      return acc;
    }, {
      june25Raised: 0,
      june25Settled: 0,
      unsettledCountJune25: 0,
      june25UnsettledAmount: 0,
      transitionSettledCount: 0,
      transitionSettledAmount: 0,
      totalSettledCount: 0,
      totalUnsettledCount: 0,
      totalUnsettledAmount: 0
    });
  }, [prevLedgerRows]);

  const downloadPrevLedgerExcel = () => {
    const tableElement = document.getElementById('prev-ledger-table-modal');
    if (!tableElement) return;

    const clonedTable = tableElement.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    // Replace inputs with text values in the cloned table
    const inputs = clonedTable.querySelectorAll('input');
    inputs.forEach(input => {
      const parent = input.parentNode;
      if (parent) {
        parent.textContent = input.value;
      }
    });
    interactiveElements.forEach(el => el.remove());

    const filename = `পূর্ব_জের_টেবিল_১_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">টেবিল-১ এর পূর্ব জের (জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত)</h2>
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

  const renderPrevLedgerModal = () => {
    if (!isPrevLedgerOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left">
              <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                টেবিল-১ এর পূর্ব জের সেটআপ ও গণনা তালিকা
              </h2>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                ১৯৭১-৭২ হতে জুন/২০২৫ পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। জুলাই/২০২৫ হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem('qr2_table1_prev_ledger_june2025');
                    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
                    Object.values(QR2_MINISTRY_MAP).forEach(entities => {
                      entities.forEach(entName => {
                        const base = getEntityStats(entName);
                        defaults[entName] = {
                          june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
                          june25Settled: (base?.settledCount || 0),
                          june25UnsettledAmount: (base?.unsettledAmount || 0)
                        };
                      });
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
                onClick={downloadPrevLedgerExcel}
                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                title="এক্সেল ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet size={16} />
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
          <div className="flex-1 overflow-auto bg-white relative">
            <div className="p-6 pt-0">
              <table id="prev-ledger-table-modal" className="w-full border-separate border-spacing-0 border-l border-t border-slate-400 !table-auto text-center">
                <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className={`${thCls} w-[45px]`} rowSpan={2}>ক্র নং</th>
                    <th className={`${thCls} w-[150px]`} rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                    <th className={`${thCls} w-[180px]`} rowSpan={2}>প্রতিষ্ঠানের নাম</th>
                    <th className={`${thCls} w-[130px]`} colSpan={3}>জুন/২০২৫ পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className={`${thCls} w-[240px]`} colSpan={2}>জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত নিষ্পত্তি (রেজিস্টার হতে)</th>
                    <th className={`${thCls} w-[300px]`} colSpan={3}>১৯৭১-৭২ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    <th className={thCls}>১৯৭১-৭২ হতে জুন/২৫ উত্থাপিত</th>
                    <th className={thCls}>১৯৭১-৭২ হতে জুন/২৫ নিষ্পত্তিকৃত</th>
                    <th className={thCls}>জুন/২৫ অমীমাংসিত টাকা</th>
                    <th className={thCls}>নিষ্পত্তিকৃত সংখ্যা</th>
                    <th className={thCls}>নিষ্পত্তিকৃত টাকা</th>
                    <th className={thCls}>মোট নিষ্পত্তিকৃত সংখ্যা</th>
                    <th className={thCls}>মোট অনিষ্পন্ন সংখ্যা</th>
                    <th className={thCls}>মোট অনিষ্পন্ন টাকা</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-500">
                    {["১", "২", "৩", "৪ (ইনপুট)", "৫ (ইনপুট)", "৬ (ইনপুট)", "৭ (মীমাংসা)", "৮ (মীমাংসা)", "৯=৫+৭", "১০=৪-৯", "১১=৬-৮"].map((l, i) => (
                      <th key={i} className={thCls + " py-1"}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prevLedgerRows.map((row, idx) => {
                    const showMinistry = idx === 0 || prevLedgerRows[idx - 1].ministryName !== row.ministryName;
                    const rowSpan = prevLedgerRows.filter(r => r.ministryName === row.ministryName).length;

                    return (
                      <tr key={row.entityName} className="hover:bg-slate-50 transition-colors">
                        <td className={numTdCls}>{toBengaliDigits(row.sl.toString())}</td>
                        {showMinistry && (
                          <td rowSpan={rowSpan} className={tdCls + " text-[10px] font-black text-center bg-slate-50/10"}>
                            {row.ministryName}
                          </td>
                        )}
                        <td className={tdCls + " text-[10px] font-bold text-left"}>{row.entityName}</td>
                        
                        {/* Input fields with copy-paste listeners */}
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25Raised === 0 ? '' : toBengaliDigits(row.june25Raised.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChange(row.entityName, 'june25Raised', val);
                            }}
                            onPaste={e => handlePaste(e, idx, 'june25Raised')}
                          />
                        </td>
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25Settled === 0 ? '' : toBengaliDigits(row.june25Settled.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChange(row.entityName, 'june25Settled', val);
                            }}
                            onPaste={e => handlePaste(e, idx, 'june25Settled')}
                          />
                        </td>
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25UnsettledAmount === 0 ? '' : toBengaliDigits(row.june25UnsettledAmount.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChange(row.entityName, 'june25UnsettledAmount', val);
                            }}
                            onPaste={e => handlePaste(e, idx, 'june25UnsettledAmount')}
                          />
                        </td>

                        {/* Read only calculated transition values */}
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {formatNumberSimple(row.transitionSettledCount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-emerald-700 font-extrabold"}>
                          {row.transitionSettledAmount === 0 ? '০' : formatNumberSimple(row.transitionSettledAmount)}
                        </td>

                        {/* Cumulative balances */}
                        <td className={numTdCls + " bg-blue-50/10 font-bold text-slate-900"}>
                          {formatNumberSimple(row.totalSettledCount)}
                        </td>
                        <td className={numTdCls + " bg-blue-50/20 font-black text-blue-900"}>
                          {formatNumberSimple(row.totalUnsettledCount)}
                        </td>
                        <td className={numTdCls + " bg-blue-50/30 font-extrabold text-slate-900"}>
                          {row.totalUnsettledAmount === 0 ? '০' : formatNumberSimple(row.totalUnsettledAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-extrabold text-[10px] text-slate-900">
                    <td className={footerTdCls} colSpan={3}>সর্বমোট</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25Raised)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25Settled)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25UnsettledAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.transitionSettledCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.transitionSettledAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.totalSettledCount)}</td>
                    <td className={footerNumTdCls + " text-blue-900"}>{formatNumberSimple(prevLedgerGrandTotals.totalUnsettledCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.totalUnsettledAmount)}</td>
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

  const formatNumberSimple = (val: number | undefined | null) => {
    if (val === undefined || val === null || val === 0) return '০';
    return toBengaliDigits(Math.round(val).toString());
  };

  const details1Data = useMemo(() => {
    if (customTitle !== 'বিস্তারিত - ১') return [];

    const cycleStartStr = format(startDate, 'yyyy-MM-dd');

    const processedGroups: any[] = [];

    Object.entries(QR2_MINISTRY_MAP).forEach(([mName, entities]) => {
      const matchMinistry = filterMinistry === '' || robustNormalize(mName).includes(robustNormalize(filterMinistry));
      
      const entityDataList = entities.map(entityName => {
        const ledger = prevLedgerData[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };

        // Filter past entries (transition period from July 1, 2025 up to cycle start date)
        const transitionEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate >= '2025-07-01' && entryDate < cycleStartStr;
        });

        let transitionRC = 0, transitionRA = 0, transitionSC = 0, transitionSA = 0;
        const processedPastParaIds = new Set<string>();

        transitionEntries.forEach(entry => {
          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            transitionRC += parseBengaliNumber(rCountRaw);
          }
          if (entry.manualRaisedAmount) transitionRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

          if (entry.paragraphs) {
            entry.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedPastParaIds.has(p.id) && hasDigit) {
                processedPastParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  transitionSC++; 
                  transitionSA += settledAmt;
                }
              }
            });
          }
        });

        // Filter current entries for this entity and ministry
        const currentEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          if (!entryDateStr) return false;
          const entryDate = new Date(entryDateStr);
          return entryDate >= startDate && entryDate <= endDate;
        });

        let cCount = 0;
        let cRaisedAmount = 0;
        let cSettled = 0;
        let cSettledAmount = 0;

        currentEntries.forEach(e => {
          const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            cCount += parseBengaliNumber(rCountRaw);
          }
          if (e.manualRaisedAmount) cRaisedAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));

          if (e.paragraphs) {
            const processedCurrParaIds = new Set<string>();
            e.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedCurrParaIds.has(p.id) && hasDigit) {
                processedCurrParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  cSettled++; 
                  cSettledAmount += settledAmt;
                }
              }
            });
          }
        });

        const col4 = ledger.june25Raised + transitionRC;
        const col5 = cCount;
        const col6 = col4 + col5;
        const col7 = ledger.june25Settled + transitionSC;
        const col8 = cSettled;
        const col9 = col7 + col8;
        const col10 = col6 - col9;
        const col11 = cSettledAmount;
        const col12 = Math.max(0, ledger.june25UnsettledAmount + transitionRA + cRaisedAmount - transitionSA - cSettledAmount);

        return {
          entityName,
          col4,
          col5,
          col6,
          col7,
          col8,
          col9,
          col10,
          col11,
          col12
        };
      });

      const matchSearch = searchTerm === '' || 
        robustNormalize(mName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        entityDataList.some(ent => robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()));

      if (matchMinistry && matchSearch) {
        processedGroups.push({
          ministryName: mName,
          entities: entityDataList.filter(ent => {
            if (searchTerm === '') return true;
            return robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                   robustNormalize(mName).toLowerCase().includes(searchTerm.toLowerCase());
          })
        });
      }
    });

    return processedGroups;
  }, [entries, prevLedgerData, searchTerm, filterMinistry, startDate, endDate, customTitle]);

  const details1Totals = useMemo(() => {
    const t = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0, col11: 0, col12: 0 };
    details1Data.forEach(g => {
      g.entities.forEach((ent: any) => {
        t.col4 += ent.col4;
        t.col5 += ent.col5;
        t.col6 += ent.col6;
        t.col7 += ent.col7;
        t.col8 += ent.col8;
        t.col9 += ent.col9;
        t.col10 += ent.col10;
        t.col11 += ent.col11;
        t.col12 += ent.col12;
      });
    });
    return t;
  }, [details1Data]);

  const details1Table2Data = useMemo(() => {
    if (customTitle !== 'বিস্তারিত - ১') return [];

    const cycleStartStr = format(startDate, 'yyyy-MM-dd');

    const processedGroups: any[] = [];

    const QR2_MINISTRY_MAP_TABLE2: Record<string, string[]> = {
      "আর্থিক প্রতিষ্ঠান বিভাগ": [
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
        "প্রবাসী কল্যাণ ব্যাংক"
      ]
    };

    Object.entries(QR2_MINISTRY_MAP_TABLE2).forEach(([mName, entities]) => {
      const matchMinistry = filterMinistry === '' || robustNormalize(mName).includes(robustNormalize(filterMinistry));
      
      const entityDataList = entities.map(entityName => {
        const base = getEntityStats(entityName);

        // Filter past entries for this entity and ministry
        const pastEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate < cycleStartStr && entryDate >= ENTRY_START_DATE;
        });

        let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
        const processedPastParaIds = new Set<string>();

        pastEntries.forEach(entry => {
          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            pastRC += parseBengaliNumber(rCountRaw);
          }
          if (entry.manualRaisedAmount) pastRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

          if (entry.paragraphs) {
            entry.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedPastParaIds.has(p.id) && hasDigit) {
                processedPastParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  pastSC++; 
                  pastSA += settledAmt;
                }
              }
            });
          }
        });

        // Filter current entries for this entity and ministry
        const currentEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          if (!entryDateStr) return false;
          const entryDate = new Date(entryDateStr);
          return entryDate >= startDate && entryDate <= endDate;
        });

        let cCount = 0;
        let cRaisedAmount = 0;
        let cSettled = 0;
        let cSettledAmount = 0;

        currentEntries.forEach(e => {
          const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            cCount += parseBengaliNumber(rCountRaw);
          }
          if (e.manualRaisedAmount) cRaisedAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));

          if (e.paragraphs) {
            const processedCurrParaIds = new Set<string>();
            e.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedCurrParaIds.has(p.id) && hasDigit) {
                processedCurrParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  cSettled++; 
                  cSettledAmount += settledAmt;
                }
              }
            });
          }
        });

        const col4 = Math.max(0, (base?.unsettledCount || 0) + pastRC);
        const col5 = cCount;
        const col6 = col4 + col5;
        const col7 = Math.max(0, (base?.settledCount || 0) + pastSC);
        const col8 = cSettled;
        const col9 = col7 + col8;
        const col10 = col6 - col9;
        const col11 = cSettledAmount;
        const col12 = Math.max(0, (base?.unsettledAmount || 0) + pastRA + cRaisedAmount - pastSA - cSettledAmount);

        return {
          entityName,
          col4,
          col5,
          col6,
          col7,
          col8,
          col9,
          col10,
          col11,
          col12
        };
      });

      const matchSearch = searchTerm === '' || 
        robustNormalize(mName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        entityDataList.some(ent => robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()));

      if (matchMinistry && matchSearch) {
        processedGroups.push({
          ministryName: mName,
          entities: entityDataList.filter(ent => {
            if (searchTerm === '') return true;
            return robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                   robustNormalize(mName).toLowerCase().includes(searchTerm.toLowerCase());
          })
        });
      }
    });

    return processedGroups;
  }, [entries, prevStats, searchTerm, filterMinistry, startDate, endDate, customTitle]);

  const details1Table2Totals = useMemo(() => {
    const t = { col4: 0, col5: 0, col6: 0, col7: 0, col8: 0, col9: 0, col10: 0, col11: 0, col12: 0 };
    details1Table2Data.forEach(g => {
      g.entities.forEach((ent: any) => {
        t.col4 += ent.col4;
        t.col5 += ent.col5;
        t.col6 += ent.col6;
        t.col7 += ent.col7;
        t.col8 += ent.col8;
        t.col9 += ent.col9;
        t.col10 += ent.col10;
        t.col11 += ent.col11;
        t.col12 += ent.col12;
      });
    });
    return t;
  }, [details1Table2Data]);

  const filteredData = entries.filter(e => {
    // Filter by Non-SFI
    if (robustNormalize(e.paraType) !== robustNormalize('নন এসএফআই')) return false;
    
    // Filter only by BSR
    const mType = robustNormalize(e.meetingType || e.letterType || '');
    const isValidType = mType.includes(robustNormalize('বিএসআর'));
    if (!isValidType) return false;

    // Filter by Date Range (Issue Date)
    const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
    if (!issueDateStr) return false;
    const issueDate = new Date(issueDateStr);
    if (issueDate < startDate || issueDate > endDate) return false;

    // Filter by Ministry
    const matchMinistry = filterMinistry === '' || robustNormalize(e.ministryName).includes(robustNormalize(filterMinistry));
    
    // Filter by Search Term
    const matchSearch = searchTerm === '' || 
      robustNormalize(e.ministryName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      robustNormalize(e.entityName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      robustNormalize(e.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchMinistry && matchSearch;
  });

  const totals = filteredData.reduce((acc, curr) => {
    const sCount = parseInt(toEnglishDigits(curr.meetingSentParaCount || '0')) || curr.paragraphs?.length || 0;
    const setlCount = curr.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0;
    const unsetlCount = parseInt(toEnglishDigits(curr.meetingUnsettledParas || '0')) || Math.max(0, sCount - setlCount);
    const unsAmount = Math.max(0, (curr.involvedAmount || 0) - (curr.totalRec || 0) - (curr.totalAdj || 0));
    
    const settledAmount = curr.paragraphs && curr.paragraphs.length > 0
      ? curr.paragraphs
          .filter(p => p.status === 'পূর্ণাঙ্গ')
          .reduce((sum, p) => sum + (p.involvedAmount || (p.recoveredAmount + p.adjustedAmount) || 0), 0)
      : (curr.involvedAmount || 0);

    return {
      sentPara: acc.sentPara + sCount,
      settledPara: acc.settledPara + setlCount,
      unsettledPara: acc.unsettledPara + unsetlCount,
      amount: acc.amount + settledAmount,
      recovery: acc.recovery + (curr.totalRec || 0),
      adjustment: acc.adjustment + (curr.totalAdj || 0),
      unsettledAmount: acc.unsettledAmount + unsAmount,
      others: 0,
    };
  }, { sentPara: 0, settledPara: 0, unsettledPara: 0, amount: 0, recovery: 0, adjustment: 0, unsettledAmount: 0, others: 0 });

  const formatAmountBengali = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '-';
    if (val === 0) return '-';
    return toBengaliDigits(Math.round(val).toString()) + '/-';
  };

  const formatCountBengali = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '০';
    return toBengaliDigits(val.toString());
  };

  const formatTextValue = (val: string | undefined | null) => {
    if (!val || val.trim() === '') return '-';
    return toBengaliDigits(val);
  };

  const formatArchiveNoForTable = (val: string | undefined | null) => {
    if (!val || val.trim() === '') return '-';
    
    const trimmed = val.trim();
    let prefix = "";
    let rest = trimmed;
    
    if (trimmed.toLowerCase().startsWith("kg-")) {
      const dashIdx = trimmed.indexOf("-");
      prefix = trimmed.substring(0, dashIdx + 1).trim() + " ";
      rest = trimmed.substring(dashIdx + 1).trim();
    }
    
    if (!rest) return prefix ? prefix.trim() : '-';
    
    // Split rest by commas
    const parts = rest.split(',').map(p => p.trim()).filter(p => p !== '');
    if (parts.length === 0) return prefix ? prefix.trim() : '-';
    
    // Group parts: max 3 per line
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      const chunk = parts.slice(i, i + 3);
      lines.push(chunk.join(', '));
    }
    
    return prefix + lines.join('\n');
  };

  const thCls = "border-r border-b border-slate-400 p-1 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center leading-normal";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle leading-normal";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold leading-normal";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-900 align-middle bg-slate-200 font-extrabold";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-200";

  if (customTitle === 'বিস্তারিত - ১') {
    return (
      <div id="qr-2-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
        <IDBadge id="qr-2-container" />

        <div className="flex justify-end mb-4 no-print">
          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Outer Visual Container / Elegant Report Title Section */}
        <div className="flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-2 mb-3 px-1 flex-wrap gap-2">
          <h1 className="text-[14px] md:text-[15px] font-black text-slate-900 leading-tight">
            {getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন
          </h1>
          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => setIsPrevLedgerOpen(true)}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 hover:shadow-md border border-amber-600 hover:border-amber-700 rounded-lg font-black text-xs transition-all duration-300 select-none cursor-pointer"
            >
              পূর্ব জের
            </button>
          </div>
          <span className="text-[14px] md:text-[15px] font-black text-slate-900">
            নন-এসএফআই
          </span>
        </div>

        {/* Month range selector pill for the dynamic UI */}
        <div className="mt-1 mb-4 flex items-center justify-start gap-3 no-print flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
            <span className="text-slate-700 font-medium">
              রিপোর্ট চক্র: {activeCycle.label}
            </span>
          </div>
          {monthPickerElement && (
            <div className="scale-95 origin-center select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}
        </div>

        {/* Table 1 Section Header */}
        <div className="flex items-center justify-between border-b-[2px] border-slate-300 pb-1 mb-3 px-1 mt-4">
          <span className="text-[11px] font-black text-slate-800">
            টেবিল - ১: শিল্প, বস্ত্র ও পাট, বাণিজ্য এবং বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়
          </span>
        </div>

        {/* Table 1 Container */}
        <div className="table-container qr-table-container overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg mb-8">
          <table className="w-full border-separate border-spacing-0 min-w-[1200px] !table-auto border-l border-t border-slate-400">
            <thead className="bg-slate-100">
              <tr>
                <th className={`${thCls} w-[45px] rounded-none`}>ক্র নং</th>
                <th className={`${thCls} w-[150px]`}>মন্ত্রণালয়ের নাম</th>
                <th className={`${thCls} w-[200px]`}>প্রতিষ্ঠানের নাম</th>
                <th className={`${thCls} w-[140px]`}>১৯৭১-৭২ হতে {prevQuarterEnd.monthName}/{prevQuarterEnd.year} মাস পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত মোট উত্থাপিত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>১৯৭১-৭২ হতে {prevQuarterEnd.monthName}/{toBengaliDigits(format(startDate, 'yy'))} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yy'))} পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[150px]`}>{getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত নিষ্পত্তিকৃত আপত্তিতে জড়িত টাকা</th>
                <th className={`${thCls} w-[150px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
                <th className={`${thCls} w-[100px] rounded-none`}>মন্তব্য</th>
              </tr>
              <tr className="h-[28px]">
                {["১", "২", "৩", "৪", "৫", "৬=৪+৫", "৭", "৮", "৯=৭+৮", "১০=৬-৯", "১১", "১২", "১৩"].map((idxLabel, i) => (
                  <th key={i} className={thCls + " text-[9px] font-bold text-slate-500 py-1"}>{idxLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details1Data.map((mGroup, mIdx) => {
                return mGroup.entities.map((ent: any, eIdx: number) => {
                  return (
                    <tr key={`${mIdx}-${ent.entityName}`} className="hover:bg-slate-50 transition-colors">
                      {eIdx === 0 && (
                        <>
                          <td rowSpan={mGroup.entities.length} className={numTdCls + " text-[10px]"}>
                            {toBengaliDigits((mIdx + 1).toString())}
                          </td>
                          <td rowSpan={mGroup.entities.length} className={tdCls + " text-[10px] font-bold text-center bg-slate-50/20"}>
                            <HighlightText text={mGroup.ministryName} searchTerm={searchTerm} />
                          </td>
                        </>
                      )}
                      <td className={tdCls + " text-[10px] font-semibold"}>
                        <HighlightText text={ent.entityName} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col4)}</td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col5)}</td>
                      <td className={numTdCls + " bg-slate-50/30"}>{formatNumberSimple(ent.col6)}</td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col7)}</td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col8)}</td>
                      <td className={numTdCls + " bg-slate-50/30"}>{formatNumberSimple(ent.col9)}</td>
                      <td className={numTdCls + " font-black text-blue-900 bg-blue-50/5"}>{formatNumberSimple(ent.col10)}</td>
                      <td className={numTdCls + " text-emerald-700 font-extrabold bg-emerald-50/5"}>{formatNumberSimple(ent.col11)}</td>
                      <td className={numTdCls + " text-slate-900 font-black bg-slate-50/5"}>{formatNumberSimple(ent.col12)}</td>
                      <td className={tdCls}></td>
                    </tr>
                  );
                });
              })}
            </tbody>
            <tfoot className="qr-sticky-footer-bottom">
              <tr className="h-[36px]">
                <td className={footerTdCls}></td>
                <td className={footerTdCls}></td>
                <td className={footerTdCls + " text-center font-black"}>মোট</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col4)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col5)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col6)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col7)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col8)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col9)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col10)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col11)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Totals.col12)}</td>
                <td className={footerTdCls}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table 2 Section Header */}
        <div className="flex items-center justify-between border-b-[2px] border-slate-300 pb-1 mb-3 px-1 mt-8">
          <span className="text-[11px] font-black text-slate-800">
            টেবিল - ২: আর্থিক প্রতিষ্ঠান বিভাগ
          </span>
        </div>

        {/* Table 2 Container */}
        <div className="table-container qr-table-container overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
          <table className="w-full border-separate border-spacing-0 min-w-[1200px] !table-auto border-l border-t border-slate-400">
            <thead className="bg-slate-100">
              <tr>
                <th className={`${thCls} w-[45px] rounded-none`}>ক্র নং</th>
                <th className={`${thCls} w-[150px]`}>মন্ত্রণালয়ের নাম</th>
                <th className={`${thCls} w-[200px]`}>প্রতিষ্ঠানের নাম</th>
                <th className={`${thCls} w-[140px]`}>১৯৭১-৭২ হতে {prevQuarterEnd.monthName}/{prevQuarterEnd.year} মাস পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত মোট উত্থাপিত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>১৯৭১-৭২ হতে {prevQuarterEnd.monthName}/{toBengaliDigits(format(startDate, 'yy'))} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[140px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yy'))} পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
                <th className={`${thCls} w-[150px]`}>{getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত নিষ্পত্তিকৃত আপত্তিতে জড়িত টাকা</th>
                <th className={`${thCls} w-[150px]`}>{getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
                <th className={`${thCls} w-[100px] rounded-none`}>মন্তব্য</th>
              </tr>
              <tr className="h-[28px]">
                {["১", "২", "৩", "৪", "৫", "৬=৪+৫", "৭", "৮", "৯=৭+৮", "১০=৬-৯", "১১", "১২", "১৩"].map((idxLabel, i) => (
                  <th key={i} className={thCls + " text-[9px] font-bold text-slate-500 py-1"}>{idxLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details1Table2Data.map((mGroup, mIdx) => {
                return mGroup.entities.map((ent: any, eIdx: number) => {
                  return (
                    <tr key={`${mIdx}-${ent.entityName}`} className="hover:bg-slate-50 transition-colors">
                      {eIdx === 0 && (
                        <>
                          <td rowSpan={mGroup.entities.length} className={numTdCls + " text-[10px]"}>
                            {toBengaliDigits((mIdx + 5).toString())}
                          </td>
                          <td rowSpan={mGroup.entities.length} className={tdCls + " text-[10px] font-bold text-center bg-slate-50/20"}>
                            <HighlightText text={mGroup.ministryName} searchTerm={searchTerm} />
                          </td>
                        </>
                      )}
                      <td className={tdCls + " text-[10px] font-semibold"}>
                        <HighlightText text={ent.entityName} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col4)}</td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col5)}</td>
                      <td className={numTdCls + " bg-slate-50/30"}>{formatNumberSimple(ent.col6)}</td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col7)}</td>
                      <td className={numTdCls}>{formatNumberSimple(ent.col8)}</td>
                      <td className={numTdCls + " bg-slate-50/30"}>{formatNumberSimple(ent.col9)}</td>
                      <td className={numTdCls + " font-black text-blue-900 bg-blue-50/5"}>{formatNumberSimple(ent.col10)}</td>
                      <td className={numTdCls + " text-emerald-700 font-extrabold bg-emerald-50/5"}>{formatNumberSimple(ent.col11)}</td>
                      <td className={numTdCls + " text-slate-900 font-black bg-slate-50/5"}>{formatNumberSimple(ent.col12)}</td>
                      <td className={tdCls}></td>
                    </tr>
                  );
                });
              })}
            </tbody>
            <tfoot className="qr-sticky-footer-bottom">
              <tr className="h-[36px]">
                <td className={footerTdCls}></td>
                <td className={footerTdCls}></td>
                <td className={footerTdCls + " text-center font-black"}>মোট</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col4)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col5)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col6)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col7)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col8)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col9)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col10)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col11)}</td>
                <td className={footerNumTdCls}>{formatNumberSimple(details1Table2Totals.col12)}</td>
                <td className={footerTdCls}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {renderPrevLedgerModal()}
      </div>
    );
  }

  return (
    <div id="qr-2-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-2-container" />

      <div className="flex justify-end mb-4 no-print">
        <button
          type="button"
          onClick={downloadExcel}
          className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
          title="এক্সেল ফাইল ডাউনলোড করুন"
        >
          <FileSpreadsheet size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Header Section */}
      <div className="text-center mb-3 pt-1 relative z-[260]">
        <div className="inline-block relative">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {customTitle || "ত্রৈমাসিক রিটার্ন - ২"}
          </h1>

          {/* Date Range Pill */}
          <div className="mt-1 mb-2 flex items-center justify-center gap-3 no-print flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 border border-blue-100 rounded-full shadow-sm scale-95 origin-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-[12px]">
                {customTitle || "ত্রৈমাসিক রিটার্ন - ২"} | {activeCycle.label}
              </span>
            </div>
            {monthPickerElement && (
              <div className="scale-95 origin-center select-none relative z-[300]">
                {monthPickerElement}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
          <div className="inline-block border-b border-slate-900 pb-0.5">
            <span className="text-sm font-black text-slate-900">ছক: ৪(ক)</span>
          </div>
        </div>
      </div>

      {/* Info Section + Lowered statistics button */}
      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-x-4 gap-y-2 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p><span className="text-slate-500">অধিদপ্তরঃ</span> বাণিজ্যিক অডিট অধিদপ্তর, খুলনা</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">বিষয়ঃ</span> ব্রডশিট জবাবের বিপরীতে নিষ্পত্তির সুপারিশের ত্রৈমাসিক প্রতিবেদন</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">শাখাঃ</span> নন এসএফআই শাখা</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
        </div>

        {/* Statistics Button (Lowered into subject bar) */}
        <div className="relative group no-print shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-[11px] border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:border-blue-200"
          >
            <Sparkles size={13} className="text-blue-500" />
            পরিসংখ্যান
            <ChevronDown size={11} className="text-blue-400 transition-transform duration-300 group-hover:rotate-180" />
          </button>
          
          <div className="absolute top-[calc(100%+4px)] right-0 w-[330px] bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[1000] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <BarChart3 size={16} className="text-blue-600" />
                <span className="text-blue-900 font-black text-[13px]">ত্রৈমাসিক রিপোর্ট পরিসংখ্যান</span>
              </div>
              <div className="space-y-1.5 text-slate-700 text-[11px] font-bold leading-normal">
                <div className="flex justify-between">
                  <span>সর্বমোট আলোচিত অনুচ্ছেদ:</span>
                  <span className="text-blue-700">{toBengaliDigits(totals.sentPara ?? 0)} টি</span>
                </div>
                <div className="flex justify-between">
                  <span>সর্বমোট সুপারিশকৃত অনুচ্ছেদ:</span>
                  <span className="text-emerald-600">{toBengaliDigits(totals.settledPara ?? 0)} টি</span>
                </div>
                <div className="flex justify-between">
                  <span>জড়িত মোট টাকা:</span>
                  <span className="text-slate-900">{toBengaliDigits(Math.round(totals.amount ?? 0))} টাকা</span>
                </div>
                <div className="flex justify-between">
                  <span>মোট আদায় সমন্বয়ের পরিমাণ:</span>
                  <span className="text-emerald-700">{toBengaliDigits(Math.round((totals.recovery ?? 0) + (totals.adjustment ?? 0)))} টাকা</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container qr-table-container overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[1200px] !table-auto border-l border-t border-slate-400">
          <thead className="bg-slate-100">
            <tr className="h-[44px]">
              <th rowSpan={2} className={`${thCls} w-[35px] rounded-none`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[180px]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={`${thCls} w-[60px]`}>ব্রডশিট জবাবের সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[100px]`}>ডায়েরি নম্বর ও তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[110px]`}>ব্রডশিট জবাবের স্মারক ও তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[65px]`}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[65px]`}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[110px]`}>মীমাংসা জারিপত্রের স্মারক ও তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[85px]`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={`${thCls}`}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={`${thCls} w-[65px]`}>অমীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[85px]`}>অমীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th rowSpan={2} className={`${thCls} w-[70px] rounded-none`}>আর্কাইভ নং</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>অন্যান্য</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                <th key={n} className={thCls + " text-[9px] font-bold text-slate-500 py-1"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => {
              const entryUnsettledAmount = Math.max(0, (row.involvedAmount || 0) - (row.totalRec || 0) - (row.totalAdj || 0));
              const rowSentCount = parseInt(toEnglishDigits(row.meetingSentParaCount || '0')) || row.paragraphs?.length || 0;
              const rowSettledCount = row.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(row.meetingSettledParaCount || '0')) || 0;
              const rowUnsettledCount = parseInt(toEnglishDigits(row.meetingUnsettledParas || '0')) || Math.max(0, rowSentCount - rowSettledCount);

              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                  <td className={tdCls}>
                    <HighlightText text={row.ministryName} searchTerm={searchTerm} />
                    {row.entityName && (
                      <>
                        ,<br />
                        <HighlightText text={row.entityName} searchTerm={searchTerm} />
                      </>
                    )}
                    {row.branchName && (
                      <>
                        ,<br />
                        <span className="text-blue-700 font-extrabold text-[10.5px]">
                          <HighlightText text={row.branchName} searchTerm={searchTerm} />
                        </span>
                      </>
                    )}
                    {row.auditYear && (
                      <>
                        <br />
                        <span className="font-bold text-slate-800">({toBengaliDigits(row.auditYear)})</span>
                      </>
                    )}
                  </td>
                  <td className={numTdCls}>{toBengaliDigits("১")}</td>
                  <td className={numTdCls}>
                    <HighlightText text={formatTextValue(row.workpaperNoDate)} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>
                    <HighlightText text={formatTextValue(row.letterNoDate)} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>
                    {formatCountBengali(rowSentCount)}
                  </td>
                  <td className={numTdCls}>
                    {formatCountBengali(rowSettledCount)}
                  </td>
                  <td className={numTdCls}>
                    <HighlightText text={formatTextValue(row.issueLetterNoDate)} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>
                    {formatAmountBengali(
                      row.paragraphs && row.paragraphs.length > 0
                        ? row.paragraphs
                            .filter(p => p.status === 'পূর্ণাঙ্গ')
                            .reduce((sum, p) => sum + (p.involvedAmount || (p.recoveredAmount + p.adjustedAmount) || 0), 0)
                        : (row.involvedAmount || 0)
                    )}
                  </td>
                  <td className={`${numTdCls} text-emerald-600 bg-emerald-50/10`}>
                    {formatAmountBengali(row.totalRec)}
                  </td>
                  <td className={`${numTdCls} text-indigo-600 bg-indigo-50/10`}>
                    {formatAmountBengali(row.totalAdj)}
                  </td>
                  <td className={numTdCls}>
                    {formatAmountBengali(0)}
                  </td>
                  <td className={numTdCls}>
                    {formatCountBengali(rowUnsettledCount)}
                  </td>
                  <td className={numTdCls}>
                    {entryUnsettledAmount === 0 ? toBengaliDigits('0') + '/-' : formatAmountBengali(entryUnsettledAmount)}
                  </td>
                  <td className={`${numTdCls} whitespace-pre-line font-bold`}>
                    <HighlightText text={formatArchiveNoForTable(row.archiveNo)} searchTerm={searchTerm} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="qr-sticky-footer-bottom">
            <tr className="h-[40px]">
              <td colSpan={2} className={footerTdCls}>সর্বমোট (ফিল্টারকৃত):</td>
              <td className={footerNumTdCls}>{toBengaliDigits(filteredData.length.toString())} টি</td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.sentPara.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.settledPara.toString())}</td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}>{totals.amount === 0 ? '-' : toBengaliDigits(Math.round(totals.amount).toString()) + "/-"}</td>
              <td className={footerNumTdCls}>{totals.recovery === 0 ? '-' : toBengaliDigits(Math.round(totals.recovery).toString()) + "/-"}</td>
              <td className={footerNumTdCls}>{totals.adjustment === 0 ? '-' : toBengaliDigits(Math.round(totals.adjustment).toString()) + "/-"}</td>
              <td className={footerNumTdCls}>-</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.unsettledPara.toString())}</td>
              <td className={footerNumTdCls}>{totals.unsettledAmount === 0 ? '-' : toBengaliDigits(Math.round(totals.unsettledAmount).toString()) + "/-"}</td>
              <td className={footerTdCls}></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};

export default QR_2;
