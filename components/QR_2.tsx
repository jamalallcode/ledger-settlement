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

  // Calculate the 16th-to-15th quarterly reporting cycle range
  const quarterEndMonth = quarterStartMonth + 2;
  const quarterCycleStartDate = new Date(quarterYear, quarterStartMonth, 16);
  const quarterCycleEndDate = new Date(quarterYear, quarterEndMonth, 15);
  quarterCycleStartDate.setHours(0, 0, 0, 0);
  quarterCycleEndDate.setHours(23, 59, 59, 999);

  const quarterCycleStartDateStr = format(quarterCycleStartDate, 'yyyy-MM-dd');
  const quarterCycleEndDateStr = format(quarterCycleEndDate, 'yyyy-MM-dd');
  const quarterCycleRangeFormatted = `${toBengaliDigits(format(quarterCycleStartDate, 'dd/MM/yyyy'))} হতে ${toBengaliDigits(format(quarterCycleEndDate, 'dd/MM/yyyy'))}`;

  // Settlement cycle starts from the 16th of the month BEFORE the quarter start month
  let settlementStartMonth = quarterStartMonth - 1;
  let settlementStartYear = quarterYear;
  if (settlementStartMonth < 0) {
    settlementStartMonth = 11;
    settlementStartYear -= 1;
  }
  const settlementCycleStartDate = new Date(settlementStartYear, settlementStartMonth, 16);
  settlementCycleStartDate.setHours(0, 0, 0, 0);
  const settlementCycleStartDateStr = format(settlementCycleStartDate, 'yyyy-MM-dd');

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
    let normalized = str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    normalized = normalized.replace(/कर्मসংস্থান/g, "কর্মসংস্থান").replace(/कर्मसंस्थान/g, "কর্মসংস্থান");
    return normalized;
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

  const isMinistryMatch = (entryMinistry: string, targetMinistry: string) => {
    const normEntry = robustNormalize(entryMinistry);
    const normTarget = robustNormalize(targetMinistry);
    if (normEntry === normTarget) return true;

    if (normTarget === robustNormalize("বস্ত্র ও পাট মন্ত্রণালয়")) {
      return normEntry === robustNormalize("পাট মন্ত্রণালয়") || 
             normEntry === robustNormalize("বস্ত্র মন্ত্রণালয়") || 
             normEntry === robustNormalize("বস্ত্র ও পাট মন্ত্রণালয়") ||
             normEntry.includes("পাট") || normEntry.includes("বস্ত্র");
    }

    if (normTarget === robustNormalize("শিল্প মন্ত্রণালয়")) {
      return normEntry === robustNormalize("শিল্প মন্ত্রণালয়") || normEntry.includes("শিল্প");
    }

    if (normTarget === robustNormalize("বেসামরিক বিমান পরিবহন ও পর্যটন")) {
      return normEntry === robustNormalize("বিমান ও পর্যটন মন্ত্রণালয়") || 
             normEntry === robustNormalize("বেসামরিক বিমান পরিবহন ও পর্যটন") ||
             normEntry.includes("বিমান") || normEntry.includes("পর্যটন");
    }

    return normEntry.includes(normTarget) || normTarget.includes(normEntry);
  };

  const isEntityMatch = (entryEntity: string, targetEntity: string) => {
    const normEntry = robustNormalize(entryEntity);
    const normTarget = robustNormalize(targetEntity);
    if (normEntry === normTarget) return true;
    
    // Equivalence mappings
    if (normTarget === robustNormalize("হস্ত ও কুটির শিল্প সংস্থা") && (normEntry === robustNormalize("ক্ষুদ্র ও কুটির শিল্প") || normEntry.includes("কুটির") || normEntry.includes("হস্ত"))) return true;
    if (normTarget === robustNormalize("ক্ষুদ্র ও কুটির শিল্প") && (normEntry === robustNormalize("হস্ত ও কুটির শিল্প সংস্থা") || normEntry.includes("কুটির") || normEntry.includes("হস্ত"))) return true;
    if (normTarget === robustNormalize("রসায়ন শিল্প সংস্থা") && (normEntry === robustNormalize("রসায়ন শিল্প") || normEntry.includes("রসায়ন") || normEntry.includes("রসায়ন"))) return true;
    if (normTarget === robustNormalize("রসায়ন শিল্প") && (normEntry === robustNormalize("রসায়ন শিল্প সংস্থা") || normEntry.includes("রসায়ন") || normEntry.includes("রসায়ন"))) return true;
    
    // General equivalent matches for Jute/Patkol
    const isPatkolTarget = normTarget === robustNormalize("পাটকল সংস্থা");
    const isPatTarget = normTarget === robustNormalize("পাট সংস্থা");
    
    const isPatkolEntry = normEntry === robustNormalize("পাটকল সংস্থা") || normEntry.includes("পাটকল") || normEntry.includes("বিজেএমসি") || normEntry.includes("জুট");
    const isPatEntry = normEntry === robustNormalize("পাট সংস্থা") || (normEntry.includes("পাট") && !normEntry.includes("পাটকল") && !normEntry.includes("বিজেএমসি") && !normEntry.includes("জুট"));

    if (isPatkolTarget) {
      return isPatkolEntry;
    }
    if (isPatTarget) {
      return isPatEntry && !isPatkolEntry;
    }

    const isPatkolEntryDirect = normEntry === robustNormalize("পাটকল সংস্থা");
    const isPatEntryDirect = normEntry === robustNormalize("পাট সংস্থা");

    if (isPatkolEntryDirect) {
      return normTarget.includes("পাটকল") || normTarget.includes("বিজেএমসি") || normTarget.includes("জুট");
    }
    if (isPatEntryDirect) {
      return normTarget.includes("পাট") && !normTarget.includes("পাটকল") && !normTarget.includes("বিজেএমসি") && !normTarget.includes("জুট");
    }

    // Financial institutions equivalents to prevent typo mismatches
    if (normTarget.includes("বাংলাদেশ ডেভেলপমেন্ট ব্যাংক") && normEntry.includes("বাংলাদেশ ডেভেলপমেন্ট ব্যাংক")) return true;
    if (normTarget.includes("বেসিক ব্যাংক") && normEntry.includes("বেসিক ব্যাংক")) return true;
    if (normTarget.includes("ইনভেস্টমেন্ট কর্পোরেশন") && normEntry.includes("ইনভেস্ট")) return true;
    if (normTarget.includes("ইনভেস্ট কর্পোরেশন") && normEntry.includes("ইনভেস্ট")) return true;
    if (normTarget.includes("আনসার ভিডিপি") && normEntry.includes("আনসার ভিডিপি")) return true;
    if (normTarget.includes("সোনালী ব্যাংক") && normEntry.includes("সোনালী ব্যাংক")) return true;
    if (normTarget.includes("জনতা ব্যাংক") && normEntry.includes("জনতা ব্যাংক")) return true;
    if (normTarget.includes(" can ") || normTarget.includes("অগ্রণী ব্যাংক") && normEntry.includes("অগ্রণী ব্যাংক")) return true;
    if (normTarget.includes("রূপালী ব্যাংক") && normEntry.includes("রূপালী ব্যাংক")) return true;
    if (normTarget.includes("কৃষি ব্যাংক") && normEntry.includes("কৃষি ব্যাংক")) return true;
    if (normTarget.includes("কর্মসংস্থান") && normEntry.includes("কর্মসংস্থান")) return true;
    if (normTarget.includes("সাধারণ বীমা") && normEntry.includes("সাধারণ বীমা")) return true;
    if (normTarget.includes("জীবন বীমা") && normEntry.includes("জীবন বীমা")) return true;
    if (normTarget.includes(" can ") || normTarget.includes("কো-অপারেটিভ") || normTarget.includes("সমবায়") || normTarget.includes("সমবায়") || normTarget.includes("প্রবাসী কল্যাণ") && normEntry.includes("প্রবাসী কল্যাণ")) return true;

    return normEntry.includes(normTarget) || normTarget.includes(normEntry);
  };

  const getSettlementStats = (
    entriesList: SettlementEntry[],
    entityName: string,
    mName: string,
    startStr: string,
    endStr: string,
    isExclusiveEnd: boolean = false,
    isTransition: boolean = false
  ) => {
    const filtered = entriesList.filter(e => {
      if (!isEntityMatch(e.entityName, entityName)) return false;
      if (!isMinistryMatch(e.ministryName, mName)) return false;

      const normalizedPType = robustNormalize(e.paraType || '');
      if (isTransition) {
        if (normalizedPType !== robustNormalize('নন এসএফআই')) return false;
      } else {
        const isBranchMatch = normalizedPType === robustNormalize('নন এসএফআই') || normalizedPType === robustNormalize('এসএফআই');
        if (!isBranchMatch) return false;
      }

      const mType = robustNormalize(e.meetingType || '');
      if (isTransition) {
        if (!mType.includes(robustNormalize('বিএসআর'))) return false;
      } else {
        const isValidMeeting = mType.includes(robustNormalize('বিএসআর')) ||
                               mType.includes(robustNormalize('দ্বিপক্ষীয়')) ||
                               mType.includes(robustNormalize('দ্বিপাক্ষিক')) ||
                               mType.includes(robustNormalize('ত্রিপক্ষীয়')) ||
                               mType.includes(robustNormalize('ত্রিপাক্ষিক'));
        if (!isValidMeeting) return false;
      }

      const entryDateStr = (e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '')).trim();
      if (!entryDateStr) return false;
      
      if (isExclusiveEnd) {
        return entryDateStr >= startStr && entryDateStr < endStr;
      } else {
        return entryDateStr >= startStr && entryDateStr <= endStr;
      }
    });

    let settledCount = 0;
    let settledAmount = 0;
    const processedParaIds = new Set<string>();

    filtered.forEach(entry => {
      if (entry.paragraphs && entry.paragraphs.length > 0) {
        entry.paragraphs.forEach((p, idx) => {
          const cleanParaNo = String(p.paraNo || '').trim();
          const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
          const pUniqueId = p.id || `${cleanParaNo}-${idx}`;
          if (pUniqueId && !processedParaIds.has(pUniqueId) && hasDigit) {
            processedParaIds.add(pUniqueId);
            const status = robustNormalize(p.status || '');
            const pInvAmt = parseBengaliNumber(String(p.involvedAmount || '0'));
            const pRecAmt = parseBengaliNumber(String(p.recoveredAmount || '0'));
            const pAdjAmt = parseBengaliNumber(String(p.adjustedAmount || '0'));
            
            const pSettledAmt = (pRecAmt + pAdjAmt) || 0;

            if (status === robustNormalize('পূর্ণাঙ্গ')) {
              settledCount++;
            }
            settledAmount += pSettledAmt;
          }
        });
      } else {
        const sCount = parseInt(toEnglishDigits(entry.meetingSettledParaCount || entry.meetingFullSettledParaCount || '0')) || 0;
        settledCount += sCount;
        settledAmount += parseBengaliNumber(String(entry.involvedAmount || '0'));
      }
    });

    return { settledCount, settledAmount, filtered };
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
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [cutoffMonth, setCutoffMonth] = React.useState(() => {
    const saved = localStorage.getItem('opening_balance_cutoff_month');
    if (saved) {
      const [y, m] = saved.split('-').map(Number);
      if (y > 2025 || (y === 2025 && m >= 12)) {
        return saved;
      }
    }
    return '2025-12';
  });

  // Automatically sync cutoffMonth with the month preceding the active quarter's startDate
  // We commented this out so that the user's manual previous ledger (e.g., December/2025)
  // is preserved and flows automatically into future return periods without being reset.
  // React.useEffect(() => {
  //   if (startDate) {
  //     const prevMonthDate = subMonths(setDate(startDate, 1), 1);
  //     const prevMonthStr = format(prevMonthDate, 'yyyy-MM');
  //     setCutoffMonth(prevMonthStr);
  //     localStorage.setItem('opening_balance_cutoff_month', prevMonthStr);
  //   }
  // }, [startDate]);

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
        if (y < 2025 || (y === 2025 && m < 11)) {
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

  const getStorageKeyTable1 = (monthStr: string) => {
    if (monthStr === '2025-06') return 'qr2_table1_prev_ledger_june2025';
    return `qr2_table1_prev_ledger_${monthStr}`;
  };

  const getStorageKeyTable2 = (monthStr: string) => {
    if (monthStr === '2025-06') return 'qr2_table2_prev_ledger_june2025';
    return `qr2_table2_prev_ledger_${monthStr}`;
  };

  const [prevLedgerData, setPrevLedgerData] = React.useState<Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }>>(() => {
    const initialMonth = localStorage.getItem('opening_balance_cutoff_month') || '2025-12';
    const key = initialMonth === '2025-06' ? 'qr2_table1_prev_ledger_june2025' : `qr2_table1_prev_ledger_${initialMonth}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, any> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          const cleanKey = key.replace(/कर्मसंस्थान/g, "কর্মসংস্থান");
          migrated[cleanKey] = val;
        });
        return migrated;
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
    localStorage.setItem(getStorageKeyTable1(cutoffMonth), JSON.stringify(updated));
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

  const [isPrevLedgerTable2Open, setIsPrevLedgerTable2Open] = React.useState(false);

  const [prevLedgerTable2Data, setPrevLedgerTable2Data] = React.useState<Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }>>(() => {
    const initialMonth = localStorage.getItem('opening_balance_cutoff_month') || '2025-12';
    const key = initialMonth === '2025-06' ? 'qr2_table2_prev_ledger_june2025' : `qr2_table2_prev_ledger_${initialMonth}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, any> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          const cleanKey = key.replace(/कर्मसंस्थान/g, "কর্মসংস্থান");
          migrated[cleanKey] = val;
        });
        return migrated;
      } catch (e) {
        console.error("Error parsing prev ledger table 2 data:", e);
      }
    }
    
    // Fallback/Default values derived from base prevStats for Table 2
    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
    Object.values(QR2_MINISTRY_MAP_TABLE2).forEach(entities => {
      entities.forEach(entName => {
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

  const handleSavePrevLedgerTable2 = (updated: typeof prevLedgerTable2Data) => {
    setPrevLedgerTable2Data(updated);
    localStorage.setItem(getStorageKeyTable2(cutoffMonth), JSON.stringify(updated));
  };

  const handleInputChangeTable2 = (entName: string, field: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount', value: number) => {
    const updated = {
      ...prevLedgerTable2Data,
      [entName]: {
        ...(prevLedgerTable2Data[entName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 }),
        [field]: value
      }
    };
    handleSavePrevLedgerTable2(updated);
  };

  React.useEffect(() => {
    const key = getStorageKeyTable1(cutoffMonth);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, any> = {};
        Object.entries(parsed).forEach(([k, val]) => {
          const cleanKey = k.replace(/कर्मसंस्थान/g, "কর্মসংস্থান");
          migrated[cleanKey] = val;
        });
        setPrevLedgerData(migrated);
      } catch (e) {
        console.error(e);
      }
    } else {
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
  }, [cutoffMonth]);

  React.useEffect(() => {
    const key = getStorageKeyTable2(cutoffMonth);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, any> = {};
        Object.entries(parsed).forEach(([k, val]) => {
          const cleanKey = k.replace(/कर्मसंस्थान/g, "কর্মসংস্থান");
          migrated[cleanKey] = val;
        });
        setPrevLedgerTable2Data(migrated);
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
      Object.values(QR2_MINISTRY_MAP_TABLE2).forEach(entities => {
        entities.forEach(entName => {
          const base = getEntityStats(entName);
          defaults[entName] = {
            june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
            june25Settled: (base?.settledCount || 0),
            june25UnsettledAmount: (base?.unsettledAmount || 0)
          };
        });
      });
      setPrevLedgerTable2Data(defaults);
    }
  }, [cutoffMonth]);

  const prevLedgerTable2Rows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    Object.entries(QR2_MINISTRY_MAP_TABLE2).forEach(([mName, entities]) => {
      entities.forEach(entityName => {
        const rawLedger = prevLedgerTable2Data[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        const ledger = {
          june25Raised: parseBengaliNumber(rawLedger.june25Raised),
          june25Settled: parseBengaliNumber(rawLedger.june25Settled),
          june25UnsettledAmount: parseBengaliNumber(rawLedger.june25UnsettledAmount)
        };
        
        // Calculate transition settled from July 1, 2025 up to cycle start
        const { settledCount: transitionSettledCount, settledAmount: transitionSettledAmount } = getSettlementStats(
          entries,
          entityName,
          mName,
          cutoffInfo.transitionStartStr,
          settlementCycleStartDateStr,
          true, // isExclusiveEnd
          true  // isTransition
        );

        const unsettledCountJune25 = ledger.june25Raised;
        const totalSettledCount = transitionSettledCount;
        const totalUnsettledCount = Math.max(0, ledger.june25Raised - transitionSettledCount);
        const totalUnsettledAmount = Math.max(0, ledger.june25Settled - transitionSettledAmount);

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
  }, [prevLedgerTable2Data, entries, startDate]);

  const handlePasteTable2 = (
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

    const updated = { ...prevLedgerTable2Data };

    for (let r = 0; r < pastedRows.length; r++) {
      const rowIndex = startRowIndex + r;
      if (rowIndex >= prevLedgerTable2Rows.length) break;

      const entityName = prevLedgerTable2Rows[rowIndex].entityName;
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

    handleSavePrevLedgerTable2(updated);
  };

  const prevLedgerTable2GrandTotals = useMemo(() => {
    return prevLedgerTable2Rows.reduce((acc, row) => {
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
  }, [prevLedgerTable2Rows]);

  const downloadPrevLedgerTable2Excel = () => {
    const tableElement = document.getElementById('prev-ledger-table-2-modal');
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

    const filename = `পূর্ব_জের_টেবিল_২_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">টেবিল-২ এর পূর্ব জের (জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত)</h2>
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

  const prevLedgerRows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    Object.entries(QR2_MINISTRY_MAP).forEach(([mName, entities]) => {
      entities.forEach(entityName => {
        const rawLedger = prevLedgerData[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        const ledger = {
          june25Raised: parseBengaliNumber(rawLedger.june25Raised),
          june25Settled: parseBengaliNumber(rawLedger.june25Settled),
          june25UnsettledAmount: parseBengaliNumber(rawLedger.june25UnsettledAmount)
        };
        
        // Calculate transition settled from July 1, 2025 up to cycle start
        const { settledCount: transitionSettledCount, settledAmount: transitionSettledAmount } = getSettlementStats(
          entries,
          entityName,
          mName,
          cutoffInfo.transitionStartStr,
          settlementCycleStartDateStr,
          true, // isExclusiveEnd
          true  // isTransition
        );

        const unsettledCountJune25 = ledger.june25Raised;
        const totalSettledCount = transitionSettledCount;
        const totalUnsettledCount = Math.max(0, ledger.june25Raised - transitionSettledCount);
        const totalUnsettledAmount = Math.max(0, ledger.june25Settled - transitionSettledAmount);

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
            <div className="text-left flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  টেবিল-১ এর পূর্ব জের সেটআপ ও গণনা তালিকা
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  ১৯৭১-৭২ হতে {cutoffInfo.formattedLong} পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। {cutoffInfo.nextMonthFormattedLong} হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
                </p>
              </div>

              {/* Dynamic Month Selector */}
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/80 rounded-xl px-3.5 py-1.5 shadow-sm text-xs shrink-0">
                <span className="font-extrabold text-amber-900 tracking-wide">জেরের মাস:</span>
                <select
                  value={cutoffMonth}
                  onChange={(e) => {
                    setCutoffMonth(e.target.value);
                    localStorage.setItem('opening_balance_cutoff_month', e.target.value);
                  }}
                  className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 font-black text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none cursor-pointer shadow-sm hover:bg-slate-50 transition-all text-xs"
                >
                  {getMonthOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrevLedgerOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] border border-blue-700 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                সংরক্ষণ করুন ও বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirmReset) {
                    setConfirmReset(true);
                    setTimeout(() => setConfirmReset(false), 4000);
                  } else {
                    localStorage.removeItem(getStorageKeyTable1(cutoffMonth));
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
                    setConfirmReset(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] border transition-all cursor-pointer ${
                  confirmReset 
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse" 
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                }`}
              >
                {confirmReset ? "নিশ্চিত করুন?" : "রিসেট করুন"}
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
                    <th className={`${thCls} w-[130px]`} colSpan={2}>{cutoffInfo.formattedShort} পর্যন্ত অমীমাংসিত অডিট আপত্তির</th>
                  </tr>
                  <tr>
                    <th className={thCls}>সংখ্যা</th>
                    <th className={thCls}>টাকা</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-500">
                    {["১", "২", "৩", "৪ (ইনপুট)", "৫ (ইনপুট)"].map((l, i) => (
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
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-extrabold text-[10px] text-slate-900">
                    <td className={footerTdCls} colSpan={3}>সর্বমোট</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25Raised)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25Settled)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>



        </div>
      </div>
    );
  };

  const renderPrevLedgerTable2Modal = () => {
    if (!isPrevLedgerTable2Open) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  টেবিল-২ এর পূর্ব জের সেটআপ ও গণনা তালিকা
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  ১৯৭১-৭২ হতে {cutoffInfo.formattedLong} পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। {cutoffInfo.nextMonthFormattedLong} হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
                </p>
              </div>

              {/* Dynamic Month Selector */}
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/80 rounded-xl px-3.5 py-1.5 shadow-sm text-xs shrink-0">
                <span className="font-extrabold text-amber-900 tracking-wide">জেরের মাস:</span>
                <select
                  value={cutoffMonth}
                  onChange={(e) => {
                    setCutoffMonth(e.target.value);
                    localStorage.setItem('opening_balance_cutoff_month', e.target.value);
                  }}
                  className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 font-black text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none cursor-pointer shadow-sm hover:bg-slate-50 transition-all text-xs"
                >
                  {getMonthOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrevLedgerTable2Open(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] border border-blue-700 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                সংরক্ষণ করুন ও বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem(getStorageKeyTable2(cutoffMonth));
                    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
                    Object.values(QR2_MINISTRY_MAP_TABLE2).forEach(entities => {
                      entities.forEach(entName => {
                        const base = getEntityStats(entName);
                        defaults[entName] = {
                          june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
                          june25Settled: (base?.settledCount || 0),
                          june25UnsettledAmount: (base?.unsettledAmount || 0)
                        };
                      });
                    });
                    setPrevLedgerTable2Data(defaults);
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-black text-[10px] border border-rose-200 transition-all cursor-pointer"
              >
                রিসেট করুন
              </button>
              <button
                type="button"
                onClick={downloadPrevLedgerTable2Excel}
                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                title="এক্সেল ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsPrevLedgerTable2Open(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer border border-slate-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-white relative">
            <div className="p-6 pt-0">
              <table id="prev-ledger-table-2-modal" className="w-full border-separate border-spacing-0 border-l border-t border-slate-400 !table-auto text-center">
                <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className={`${thCls} w-[45px]`} rowSpan={2}>ক্র নং</th>
                    <th className={`${thCls} w-[150px]`} rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                    <th className={`${thCls} w-[180px]`} rowSpan={2}>প্রতিষ্ঠানের নাম</th>
                    <th className={`${thCls} w-[130px]`} colSpan={2}>{cutoffInfo.formattedShort} পর্যন্ত অমীমাংসিত অডিট আপত্তির</th>
                  </tr>
                  <tr>
                    <th className={thCls}>সংখ্যা</th>
                    <th className={thCls}>টাকা</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-500">
                    {["১", "২", "৩", "৪ (ইনপুট)", "৫ (ইনপুট)"].map((l, i) => (
                      <th key={i} className={thCls + " py-1"}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prevLedgerTable2Rows.map((row, idx) => {
                    const showMinistry = idx === 0 || prevLedgerTable2Rows[idx - 1].ministryName !== row.ministryName;
                    const rowSpan = prevLedgerTable2Rows.filter(r => r.ministryName === row.ministryName).length;

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
                              handleInputChangeTable2(row.entityName, 'june25Raised', val);
                            }}
                            onPaste={e => handlePasteTable2(e, idx, 'june25Raised')}
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
                              handleInputChangeTable2(row.entityName, 'june25Settled', val);
                            }}
                            onPaste={e => handlePasteTable2(e, idx, 'june25Settled')}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-extrabold text-[10px] text-slate-900">
                    <td className={footerTdCls} colSpan={3}>সর্বমোট</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.june25Raised)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.june25Settled)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
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

    const cycleStartStr = quarterCycleStartDateStr;

    const processedGroups: any[] = [];

    Object.entries(QR2_MINISTRY_MAP).forEach(([mName, entities]) => {
      const matchMinistry = filterMinistry === '' || robustNormalize(mName).includes(robustNormalize(filterMinistry));
      
      const entityDataList = entities.map(entityName => {
        const rawLedger = prevLedgerData[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        const ledger = {
          june25Raised: parseBengaliNumber(rawLedger.june25Raised),
          june25Settled: parseBengaliNumber(rawLedger.june25Settled),
          june25UnsettledAmount: parseBengaliNumber(rawLedger.june25UnsettledAmount)
        };

        // Filter past entries (transition period from July 1, 2025 up to cycle start date)
        const transitionEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          const normalizedPType = robustNormalize(e.paraType || '');
          if (normalizedPType !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate >= cutoffInfo.transitionStartStr && entryDate < cycleStartStr;
        });

        let transitionRC = 0, transitionRA = 0;
        transitionEntries.forEach(entry => {
          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            transitionRC += parseBengaliNumber(rCountRaw);
          }
          if (entry.manualRaisedAmount) transitionRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));
        });

        const { settledCount: transitionSC, settledAmount: transitionSA } = getSettlementStats(
          entries,
          entityName,
          mName,
          cutoffInfo.transitionStartStr,
          settlementCycleStartDateStr,
          true, // isExclusiveEnd
          true  // isTransition
        );

        // Filter current entries for this entity and ministry
        const currentEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          const normalizedPType = robustNormalize(e.paraType || '');
          if (normalizedPType !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDateStr = (e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '')).trim();
          if (!entryDateStr) return false;
          return entryDateStr >= quarterCycleStartDateStr && entryDateStr <= quarterCycleEndDateStr;
        });

        let cCount = 0;
        let cRaisedAmount = 0;

        currentEntries.forEach(e => {
          const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            cCount += parseBengaliNumber(rCountRaw);
          }
          if (e.manualRaisedAmount) cRaisedAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));
        });

        // Calculate settlement (Columns 10 & 11) for SFI + Non-SFI and BSR + Bilateral + Trilateral meetings
        const { settledCount: cSettled, settledAmount: cSettledAmount } = getSettlementStats(
          entries,
          entityName,
          mName,
          settlementCycleStartDateStr,
          quarterCycleEndDateStr,
          false, // isExclusiveEnd
          false  // isTransition
        );

        const unsettledCountPrior = Math.max(0, ledger.june25Raised + transitionRC - transitionSC);
        const unsettledAmountPrior = Math.max(0, ledger.june25Settled + transitionRA - transitionSA);

        const raisedCountCurr = cCount;
        const raisedAmountCurr = cRaisedAmount;

        const totalCount = unsettledCountPrior + raisedCountCurr;
        const totalAmount = unsettledAmountPrior + raisedAmountCurr;

        const settledCountCurr = cSettled;
        const settledAmountCurr = cSettledAmount;

        const unsettledCountEnd = Math.max(0, totalCount - settledCountCurr);
        const unsettledAmountEnd = Math.max(0, totalAmount - settledAmountCurr);

        return {
          entityName,
          unsettledCountPrior,
          unsettledAmountPrior,
          raisedCountCurr,
          raisedAmountCurr,
          totalCount,
          totalAmount,
          settledCountCurr,
          settledAmountCurr,
          unsettledCountEnd,
          unsettledAmountEnd
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
  }, [entries, prevLedgerData, searchTerm, filterMinistry, startDate, endDate, customTitle, cutoffMonth]);

  const details1Totals = useMemo(() => {
    const t = { 
      unsettledCountPrior: 0,
      unsettledAmountPrior: 0,
      raisedCountCurr: 0, 
      raisedAmountCurr: 0,
      totalCount: 0, 
      totalAmount: 0, 
      settledCountCurr: 0, 
      settledAmountCurr: 0, 
      unsettledCountEnd: 0, 
      unsettledAmountEnd: 0 
    };
    details1Data.forEach(g => {
      g.entities.forEach((ent: any) => {
        t.unsettledCountPrior += (ent.unsettledCountPrior || 0);
        t.unsettledAmountPrior += (ent.unsettledAmountPrior || 0);
        t.raisedCountCurr += (ent.raisedCountCurr || 0);
        t.raisedAmountCurr += (ent.raisedAmountCurr || 0);
        t.totalCount += (ent.totalCount || 0);
        t.totalAmount += (ent.totalAmount || 0);
        t.settledCountCurr += (ent.settledCountCurr || 0);
        t.settledAmountCurr += (ent.settledAmountCurr || 0);
        t.unsettledCountEnd += (ent.unsettledCountEnd || 0);
        t.unsettledAmountEnd += (ent.unsettledAmountEnd || 0);
      });
    });
    return t;
  }, [details1Data]);

  const details1Table2Data = useMemo(() => {
    if (customTitle !== 'বিস্তারিত - ১') return [];

    const cycleStartStr = quarterCycleStartDateStr;

    const processedGroups: any[] = [];

    Object.entries(QR2_MINISTRY_MAP_TABLE2).forEach(([mName, entities]) => {
      const matchMinistry = filterMinistry === '' || robustNormalize(mName).includes(robustNormalize(filterMinistry));
      
      const entityDataList = entities.map(entityName => {
        const rawLedger = prevLedgerTable2Data[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        const ledger = {
          june25Raised: parseBengaliNumber(rawLedger.june25Raised),
          june25Settled: parseBengaliNumber(rawLedger.june25Settled),
          june25UnsettledAmount: parseBengaliNumber(rawLedger.june25UnsettledAmount)
        };

        // Filter past entries (transition period from July 1, 2025 up to cycle start date)
        const transitionEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          const normalizedPType = robustNormalize(e.paraType || '');
          if (normalizedPType !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate >= cutoffInfo.transitionStartStr && entryDate < cycleStartStr;
        });

        let transitionRC = 0, transitionRA = 0;
        transitionEntries.forEach(entry => {
          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            transitionRC += parseBengaliNumber(rCountRaw);
          }
          if (entry.manualRaisedAmount) transitionRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));
        });

        const { settledCount: transitionSC, settledAmount: transitionSA } = getSettlementStats(
          entries,
          entityName,
          mName,
          cutoffInfo.transitionStartStr,
          settlementCycleStartDateStr,
          true, // isExclusiveEnd
          true  // isTransition
        );

        // Filter current entries for this entity and ministry
        const currentEntries = entries.filter(e => {
          if (!isEntityMatch(e.entityName, entityName)) return false;
          if (!isMinistryMatch(e.ministryName, mName)) return false;
          const normalizedPType = robustNormalize(e.paraType || '');
          if (normalizedPType !== robustNormalize('নন এসএফআই')) return false;

          const mType = robustNormalize(e.meetingType || e.letterType || '');
          if (!mType.includes(robustNormalize('বিএসআর'))) return false;

          const entryDateStr = (e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '')).trim();
          if (!entryDateStr) return false;
          return entryDateStr >= quarterCycleStartDateStr && entryDateStr <= quarterCycleEndDateStr;
        });

        let cCount = 0;
        let cRaisedAmount = 0;

        currentEntries.forEach(e => {
          const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            cCount += parseBengaliNumber(rCountRaw);
          }
          if (e.manualRaisedAmount) cRaisedAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));
        });

        // Calculate settlement (Columns 10 & 11) for SFI + Non-SFI and BSR + Bilateral + Trilateral meetings
        const { settledCount: cSettled, settledAmount: cSettledAmount } = getSettlementStats(
          entries,
          entityName,
          mName,
          settlementCycleStartDateStr,
          quarterCycleEndDateStr,
          false, // isExclusiveEnd
          false  // isTransition
        );

        const unsettledCountPrior = Math.max(0, ledger.june25Raised + transitionRC - transitionSC);
        const unsettledAmountPrior = Math.max(0, ledger.june25Settled + transitionRA - transitionSA);

        const raisedCountCurr = cCount;
        const raisedAmountCurr = cRaisedAmount;

        const totalCount = unsettledCountPrior + raisedCountCurr;
        const totalAmount = unsettledAmountPrior + raisedAmountCurr;

        const settledCountCurr = cSettled;
        const settledAmountCurr = cSettledAmount;

        const unsettledCountEnd = Math.max(0, totalCount - settledCountCurr);
        const unsettledAmountEnd = Math.max(0, totalAmount - settledAmountCurr);

        return {
          entityName,
          unsettledCountPrior,
          unsettledAmountPrior,
          raisedCountCurr,
          raisedAmountCurr,
          totalCount,
          totalAmount,
          settledCountCurr,
          settledAmountCurr,
          unsettledCountEnd,
          unsettledAmountEnd
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
  }, [entries, prevLedgerTable2Data, searchTerm, filterMinistry, startDate, endDate, customTitle, cutoffMonth]);

  const details1Table2Totals = useMemo(() => {
    const t = { 
      unsettledCountPrior: 0,
      unsettledAmountPrior: 0,
      raisedCountCurr: 0, 
      raisedAmountCurr: 0,
      totalCount: 0, 
      totalAmount: 0, 
      settledCountCurr: 0, 
      settledAmountCurr: 0, 
      unsettledCountEnd: 0, 
      unsettledAmountEnd: 0 
    };
    details1Table2Data.forEach(g => {
      g.entities.forEach((ent: any) => {
        t.unsettledCountPrior += (ent.unsettledCountPrior || 0);
        t.unsettledAmountPrior += (ent.unsettledAmountPrior || 0);
        t.raisedCountCurr += (ent.raisedCountCurr || 0);
        t.raisedAmountCurr += (ent.raisedAmountCurr || 0);
        t.totalCount += (ent.totalCount || 0);
        t.totalAmount += (ent.totalAmount || 0);
        t.settledCountCurr += (ent.settledCountCurr || 0);
        t.settledAmountCurr += (ent.settledAmountCurr || 0);
        t.unsettledCountEnd += (ent.unsettledCountEnd || 0);
        t.unsettledAmountEnd += (ent.unsettledAmountEnd || 0);
      });
    });
    return t;
  }, [details1Table2Data]);

  const details1GrandTotals = useMemo(() => {
    return {
      unsettledCountPrior: details1Totals.unsettledCountPrior + details1Table2Totals.unsettledCountPrior,
      unsettledAmountPrior: details1Totals.unsettledAmountPrior + details1Table2Totals.unsettledAmountPrior,
      raisedCountCurr: details1Totals.raisedCountCurr + details1Table2Totals.raisedCountCurr,
      raisedAmountCurr: details1Totals.raisedAmountCurr + details1Table2Totals.raisedAmountCurr,
      totalCount: details1Totals.totalCount + details1Table2Totals.totalCount,
      totalAmount: details1Totals.totalAmount + details1Table2Totals.totalAmount,
      settledCountCurr: details1Totals.settledCountCurr + details1Table2Totals.settledCountCurr,
      settledAmountCurr: details1Totals.settledAmountCurr + details1Table2Totals.settledAmountCurr,
      unsettledCountEnd: details1Totals.unsettledCountEnd + details1Table2Totals.unsettledCountEnd,
      unsettledAmountEnd: details1Totals.unsettledAmountEnd + details1Table2Totals.unsettledAmountEnd
    };
  }, [details1Totals, details1Table2Totals]);

  const filteredData = entries.filter(e => {
    // Filter by SFI or Non-SFI
    const normalizedParaType = robustNormalize(e.paraType || '');
    if (normalizedParaType !== robustNormalize('নন এসএফআই')) return false;
    
    // Filter only by BSR
    const mType = robustNormalize(e.meetingType || e.letterType || '');
    const isValidType = mType.includes(robustNormalize('বিএসআর'));
    if (!isValidType) return false;

    // Filter by Date Range (Issue Date) matching quarterly cycle range
    const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
    if (!issueDateStr) return false;
    if (issueDateStr < quarterCycleStartDateStr || issueDateStr > quarterCycleEndDateStr) return false;

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
          .reduce((sum, p) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0)
      : ((curr.totalRec || 0) + (curr.totalAdj || 0));

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
    const rounded = Math.round(val);
    const formatted = rounded.toLocaleString('en-IN');
    return toBengaliDigits(formatted);
  };

  const formatCountBengali = (val: number | undefined | null) => {
    if (val === undefined || val === null || val === 0) return '-';
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

  const thCls = "border-r border-b border-slate-400 p-0.5 md:p-1 text-[7.5px] font-black text-slate-800 bg-slate-100 align-middle text-center leading-tight break-words";
  const thClsWithTop = thCls + " border-t border-slate-400";
  const tdCls = "border-r border-b border-slate-400 p-1 text-[8.5px] text-slate-700 align-middle leading-tight break-words";
  const numTdCls = "border-r border-b border-slate-400 p-1 text-[8.5px] text-slate-700 text-center align-middle font-bold leading-tight break-all";
  const footerTdCls = "border-r border-b border-slate-400 p-1 text-[9px] text-slate-900 align-middle bg-slate-200 font-extrabold";
  const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[9px] text-slate-900 text-center align-middle font-black bg-slate-200";

  if (customTitle === 'বিস্তারিত - ১') {
    const priorMonthIdx = (quarterStartMonth - 1 + 12) % 12;
    const priorYear = quarterStartMonth === 0 ? quarterYear - 1 : quarterYear;
    const monthsList = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const priorMonthName = monthsList[priorMonthIdx];
    const priorMonthFormatted = `${priorMonthName}/${toBengaliDigits(priorYear.toString())}`;
    
    const currentQuarterFormatted = `${startMonthName}/${toBengaliDigits(format(startDate, 'yy'))} হতে ${endMonthName}/${toBengaliDigits(format(endDate, 'yy'))}`;
    const endMonthFormatted = `${endMonthName}/${toBengaliDigits(format(endDate, 'yyyy'))}`;

    // Local styling shadowing for larger, more readable font size
    const thCls = "border-r border-b border-slate-400 p-1 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center leading-tight break-words";
    const thClsWithTop = thCls + " border-t border-slate-400";
    const tdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-700 align-middle leading-tight break-words";
    const numTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-700 text-center align-middle font-bold leading-tight break-all";
    const footerTdCls = "border-r border-b border-slate-400 p-1 text-[10.5px] text-slate-900 align-middle bg-slate-200 font-extrabold";
    const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-200";

    const getColWidthClass = (index: number) => {
      if (index === 0) return "w-[30px] min-w-[30px] max-w-[30px]";
      if (index === 1) return "w-[75px] min-w-[75px] max-w-[75px]";
      if (index === 2) return "w-[95px] min-w-[95px] max-w-[95px]";
      if (index % 2 === 1) {
        return "w-[35px] min-w-[35px] max-w-[35px]";
      } else {
        return "w-[110px] min-w-[110px] max-w-[110px]";
      }
    };

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

        {/* Print-only title to ensure perfect centering in print mode */}
        <div className="hidden print:block text-center mb-4 border-b-[3px] border-double border-slate-900 pb-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yyyy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yyyy'))} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন
          </h1>
          <div className="flex justify-between items-center mt-1 text-[11px] font-bold text-slate-700">
            <span>রিপোর্ট চক্র: {quarterCycleRangeFormatted}</span>
            <span>এসএফআই + নন-এসএফআই</span>
          </div>
        </div>

        {/* Header Section with symmetric layout */}
        <div className="flex flex-col gap-2 mb-3 pt-1 relative z-[260] no-print font-sans">
          {/* Main symmetric row */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-2">
            {/* Left Column: Previous Ledger Setup buttons */}
            <div className="flex items-center gap-2 w-full xl:w-auto justify-start flex-wrap">
              <button
                type="button"
                onClick={() => setIsPrevLedgerOpen(true)}
                className="flex items-center gap-1.5 px-3 h-[38px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all duration-300 rounded-xl text-[11px] font-black cursor-pointer shrink-0"
              >
                <Sparkles size={13} className="text-amber-500 animate-pulse" />
                <span>পূর্ব জের (টেবিল-১)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrevLedgerTable2Open(true)}
                className="flex items-center gap-1.5 px-3 h-[38px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all duration-300 rounded-xl text-[11px] font-black cursor-pointer shrink-0"
              >
                <Sparkles size={13} className="text-amber-500 animate-pulse" />
                <span>পূর্ব জের (টেবিল-২)</span>
              </button>
            </div>

            {/* Center Column: Title */}
            <h1 className="text-2.5xl font-black text-slate-900 tracking-tight text-center py-1">
              {customTitle || "ত্রৈমাসিক রিটার্ন - ২"}
            </h1>

            {/* Right Column: Date Range Pill & Month Picker */}
            <div className="flex items-center gap-2.5 w-full xl:w-auto justify-end flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 h-[38px] bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-blue-700 font-black text-[12.5px] whitespace-nowrap">
                  {customTitle || "ত্রৈমাসিক রিটার্ন - ২"} | {quarterCycleRangeFormatted}
                </span>
              </div>
              {monthPickerElement && (
                <div className="select-none relative z-[300]">
                  {monthPickerElement}
                </div>
              )}
            </div>
          </div>



          {/* Elegant Info Bar */}
          <div className="mb-1 text-[12.5px] font-bold text-slate-800 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5 border border-slate-200 py-2.5 px-4 bg-slate-50/50 rounded-xl shadow-sm">
            <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থা ভিত্তিক অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
            <span className="text-slate-300 hidden md:inline font-normal">|</span>
            <p><span className="text-slate-500">শাখাঃ</span> এসএফআই + নন-এসএফআই শাখা</p>
            <span className="text-slate-300 hidden md:inline font-normal">|</span>
            <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
          </div>
        </div>


        {/* Table 1 Container */}
        <div className="table-container qr-table-container qr2-table-container overflow-auto xl:overflow-visible shadow-sm rounded-none mb-8">
          <table className="w-full border-separate border-spacing-0 !table-auto border-l border-slate-400">
            <colgroup>
              <col style={{ width: '30px', minWidth: '30px' }} />
              <col style={{ width: '75px', minWidth: '75px' }} />
              <col style={{ width: '95px', minWidth: '95px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
            </colgroup>
            <thead className="bg-slate-100">
              <tr>
                <th className={`${thClsWithTop} w-[30px] min-w-[30px] max-w-[30px]`} rowSpan={2}>ক্রঃ নং</th>
                <th className={`${thClsWithTop} w-[75px] min-w-[75px] max-w-[75px]`} rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                <th className={`${thClsWithTop} w-[95px] min-w-[95px] max-w-[95px]`} rowSpan={2}>সংস্থার নাম</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{priorMonthFormatted} পর্যন্ত অমীমাংসিত অডিট আপত্তির</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{currentQuarterFormatted} পর্যন্ত উত্থাপিত অডিট আপত্তির</th>
                <th className={`${thClsWithTop}`} colSpan={2}>মোট অডিট আপত্তি</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{currentQuarterFormatted} পর্যন্ত মীমাংসিত অডিট আপত্তির</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{endMonthFormatted} পর্যন্ত অমীমাংসিত অডিট আপত্তির</th>
              </tr>
              <tr>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
              </tr>
              <tr className="h-[28px]">
                {["১", "২", "৩", "৪", "৫", "৬", "৭", "৮=৪+৬", "৯=৫+৭", "১০", "১১", "১২=৮-১০", "১৩=৯-১১"].map((idxLabel, i) => (
                  <th key={i} className={`${thCls} text-[10px] font-bold text-slate-500 py-1 ${getColWidthClass(i)}`}>{idxLabel}</th>
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
                          <td rowSpan={mGroup.entities.length} className={`${numTdCls} w-[30px] min-w-[30px] max-w-[30px] text-[10px]`}>
                            {toBengaliDigits((mIdx + 1).toString())}
                          </td>
                          <td rowSpan={mGroup.entities.length} className={`${tdCls} font-bold text-center bg-slate-50/20 w-[75px] min-w-[75px] max-w-[75px] text-[10px]`}>
                            <HighlightText text={mGroup.ministryName} searchTerm={searchTerm} />
                          </td>
                        </>
                      )}
                      <td className={`${tdCls} font-semibold w-[95px] min-w-[95px] max-w-[95px] text-[10px]`}>
                        <HighlightText text={ent.entityName} searchTerm={searchTerm} />
                      </td>
                      <td className={`${numTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.unsettledCountPrior)}</td>
                      <td className={`${numTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.unsettledAmountPrior)}</td>
                      <td className={`${numTdCls} bg-slate-50/30 w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.raisedCountCurr)}</td>
                      <td className={`${numTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.raisedAmountCurr)}</td>
                      <td className={`${numTdCls} font-black text-slate-900 bg-slate-50/40 w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.totalCount)}</td>
                      <td className={`${numTdCls} font-black text-slate-900 bg-slate-50/40 w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.totalAmount)}</td>
                      <td className={`${numTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.settledCountCurr)}</td>
                      <td className={`${numTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.settledAmountCurr)}</td>
                      <td className={`${numTdCls} font-black text-blue-900 bg-blue-50/5 w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.unsettledCountEnd)}</td>
                      <td className={`${numTdCls} text-slate-900 font-black bg-slate-50/5 w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.unsettledAmountEnd)}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
            <tfoot className="qr-sticky-footer-bottom">
              <tr className="h-[36px]">
                <td className={`${footerTdCls} w-[30px] min-w-[30px] max-w-[30px]`}></td>
                <td className={`${footerTdCls} w-[75px] min-w-[75px] max-w-[75px]`}></td>
                <td className={`${footerTdCls} text-center font-black w-[95px] min-w-[95px] max-w-[95px] text-[11px]`}>মোট</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Totals.unsettledCountPrior)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Totals.unsettledAmountPrior)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Totals.raisedCountCurr)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Totals.raisedAmountCurr)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Totals.totalCount)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Totals.totalAmount)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Totals.settledCountCurr)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Totals.settledAmountCurr)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Totals.unsettledCountEnd)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Totals.unsettledAmountEnd)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table 2 Section Header */}
        <div className="flex items-center justify-between border-b-[2px] border-slate-300 pb-1 mb-3 px-1 mt-8">
          <span className="text-[12.5px] font-black text-slate-800">
            টেবিল - ২: আর্থিক প্রতিষ্ঠান বিভাগ
          </span>
        </div>

        {/* Table 2 Container */}
        <div className="table-container qr-table-container qr2-table-container overflow-auto xl:overflow-visible shadow-sm rounded-none">
          <table className="w-full border-separate border-spacing-0 !table-auto border-l border-slate-400">
            <colgroup>
              <col style={{ width: '30px', minWidth: '30px' }} />
              <col style={{ width: '75px', minWidth: '75px' }} />
              <col style={{ width: '95px', minWidth: '95px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
              <col style={{ width: '35px', minWidth: '35px' }} />
              <col style={{ width: '110px', minWidth: '110px' }} />
            </colgroup>
            <thead className="bg-slate-100">
              <tr>
                <th className={`${thClsWithTop} w-[30px] min-w-[30px] max-w-[30px]`} rowSpan={2}>ক্রঃ নং</th>
                <th className={`${thClsWithTop} w-[75px] min-w-[75px] max-w-[75px]`} rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                <th className={`${thClsWithTop} w-[95px] min-w-[95px] max-w-[95px]`} rowSpan={2}>সংস্থার নাম</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{priorMonthFormatted} পর্যন্ত অমীমাংসিত অডিট আপত্তির</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{currentQuarterFormatted} পর্যন্ত উত্থাপিত অডিট আপত্তির</th>
                <th className={`${thClsWithTop}`} colSpan={2}>মোট অডিট আপত্তি</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{currentQuarterFormatted} পর্যন্ত মীমাংসিত অডিট আপত্তির</th>
                <th className={`${thClsWithTop}`} colSpan={2}>{endMonthFormatted} পর্যন্ত অমীমাংসিত অডিট আপত্তির</th>
              </tr>
              <tr>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
                <th className={`${thCls} w-[35px] min-w-[35px] max-w-[35px]`}>সংখ্যা</th>
                <th className={`${thCls} w-[110px] min-w-[110px] max-w-[110px]`}>টাকা</th>
              </tr>
              <tr className="h-[28px]">
                {["১", "২", "৩", "৪", "৫", "৬", "৭", "৮=৪+৬", "৯=৫+৭", "১০", "১১", "১২=৮-১০", "১৩=৯-১১"].map((idxLabel, i) => (
                  <th key={i} className={`${thCls} text-[10px] font-bold text-slate-500 py-1 ${getColWidthClass(i)}`}>{idxLabel}</th>
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
                          <td rowSpan={mGroup.entities.length} className={`${numTdCls} w-[30px] min-w-[30px] max-w-[30px] text-[10px]`}>
                            {toBengaliDigits((mIdx + 5).toString())}
                          </td>
                          <td rowSpan={mGroup.entities.length} className={`${tdCls} font-bold text-center bg-slate-50/20 w-[75px] min-w-[75px] max-w-[75px] text-[10px]`}>
                            <HighlightText text={mGroup.ministryName} searchTerm={searchTerm} />
                          </td>
                        </>
                      )}
                      <td className={`${tdCls} font-semibold w-[95px] min-w-[95px] max-w-[95px] text-[10px]`}>
                        <HighlightText text={ent.entityName} searchTerm={searchTerm} />
                      </td>
                      <td className={`${numTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.unsettledCountPrior)}</td>
                      <td className={`${numTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.unsettledAmountPrior)}</td>
                      <td className={`${numTdCls} bg-slate-50/30 w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.raisedCountCurr)}</td>
                      <td className={`${numTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.raisedAmountCurr)}</td>
                      <td className={`${numTdCls} font-black text-slate-900 bg-slate-50/40 w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.totalCount)}</td>
                      <td className={`${numTdCls} font-black text-slate-900 bg-slate-50/40 w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.totalAmount)}</td>
                      <td className={`${numTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.settledCountCurr)}</td>
                      <td className={`${numTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.settledAmountCurr)}</td>
                      <td className={`${numTdCls} font-black text-blue-900 bg-blue-50/5 w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(ent.unsettledCountEnd)}</td>
                      <td className={`${numTdCls} text-slate-900 font-black bg-slate-50/5 w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(ent.unsettledAmountEnd)}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
            <tfoot className="qr-sticky-footer-bottom">
              <tr className="h-[36px]">
                <td className={`${footerTdCls} w-[30px] min-w-[30px] max-w-[30px]`}></td>
                <td className={`${footerTdCls} w-[75px] min-w-[75px] max-w-[75px]`}></td>
                <td className={`${footerTdCls} text-center font-black w-[95px] min-w-[95px] max-w-[95px] text-[11px]`}>মোট</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Table2Totals.unsettledCountPrior)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Table2Totals.unsettledAmountPrior)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Table2Totals.raisedCountCurr)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Table2Totals.raisedAmountCurr)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Table2Totals.totalCount)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Table2Totals.totalAmount)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Table2Totals.settledCountCurr)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Table2Totals.settledAmountCurr)}</td>
                <td className={`${footerNumTdCls} w-[35px] min-w-[35px] max-w-[35px] text-[10px]`}>{formatCountBengali(details1Table2Totals.unsettledCountEnd)}</td>
                <td className={`${footerNumTdCls} w-[110px] min-w-[110px] max-w-[110px] text-[10px]`}>{formatAmountBengali(details1Table2Totals.unsettledAmountEnd)}</td>
              </tr>
              <tr className="h-[36px]">
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 align-middle bg-slate-300 font-extrabold w-[30px] min-w-[30px] max-w-[30px]"></td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 align-middle bg-slate-300 font-extrabold w-[75px] min-w-[75px] max-w-[75px]"></td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 align-middle bg-slate-300 font-extrabold text-center w-[95px] min-w-[95px] max-w-[95px] text-[11px]">সর্বমোট</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[35px] min-w-[35px] max-w-[35px] text-[10px]">{formatCountBengali(details1GrandTotals.unsettledCountPrior)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[110px] min-w-[110px] max-w-[110px] text-[10px]">{formatAmountBengali(details1GrandTotals.unsettledAmountPrior)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[35px] min-w-[35px] max-w-[35px] text-[10px]">{formatCountBengali(details1GrandTotals.raisedCountCurr)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[110px] min-w-[110px] max-w-[110px] text-[10px]">{formatAmountBengali(details1GrandTotals.raisedAmountCurr)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[35px] min-w-[35px] max-w-[35px] text-[10px]">{formatCountBengali(details1GrandTotals.totalCount)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[110px] min-w-[110px] max-w-[110px] text-[10px]">{formatAmountBengali(details1GrandTotals.totalAmount)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[35px] min-w-[35px] max-w-[35px] text-[10px]">{formatCountBengali(details1GrandTotals.settledCountCurr)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[110px] min-w-[110px] max-w-[110px] text-[10px]">{formatAmountBengali(details1GrandTotals.settledAmountCurr)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[35px] min-w-[35px] max-w-[35px] text-[10px]">{formatCountBengali(details1GrandTotals.unsettledCountEnd)}</td>
                <td className="border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-300 w-[110px] min-w-[110px] max-w-[110px] text-[10px]">{formatAmountBengali(details1GrandTotals.unsettledAmountEnd)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {renderPrevLedgerModal()}
        {renderPrevLedgerTable2Modal()}
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
                {customTitle || "ত্রৈমাসিক রিটার্ন - ২"} | {quarterCycleRangeFormatted}
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
          <p><span className="text-slate-500">শাখাঃ</span> এসএফআই + নন-এসএফআই শাখা</p>
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
      <div className="table-container qr-table-container qr2-table-container overflow-auto xl:overflow-visible shadow-sm rounded-none">
        <table className="w-full border-separate border-spacing-0 !table-auto border-l border-slate-400">
          <thead className="bg-slate-100">
            <tr className="h-[44px]">
              <th rowSpan={2} className={`${thClsWithTop} w-[3%] rounded-none`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[16%]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[5%]`}>ব্রডশিট জবাবের সংখ্যা</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[8%]`}>ডায়েরি নম্বর ও তারিখ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[9%]`}>ব্রডশিট জবাবের স্মারক ও তারিখ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[5%]`}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[5%]`}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[9%]`}>মীমাংসা জারিপত্রের স্মারক ও তারিখ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[7%]`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={`${thClsWithTop} w-[12%]`}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[5%]`}>অমীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[11%]`}>অমীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[5%]`}>আর্কাইভ নং</th>
            </tr>
            <tr className="h-[38px]">
              <th className={`${thCls} w-[4%]`}>আদায়</th>
              <th className={`${thCls} w-[4%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[4%]`}>অন্যান্য</th>
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
                            .reduce((sum, p) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0)
                        : ((row.totalRec || 0) + (row.totalAdj || 0))
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
