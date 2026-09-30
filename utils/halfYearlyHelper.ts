import { SettlementEntry } from '../types';
import { parseBengaliNumber, toBengaliDigits, toEnglishDigits } from './numberUtils';
import { getHalfYearlyCycleForDate } from './cycleHelper';

export interface HRRowData {
  col3_pCount: number;
  col4_pAmount: number;
  col5_cCount: number;
  col6_cAmount: number;
  col7_sCount: number;
  col8_sAmount: number;
  col9_finalCount?: number;
  col10_finalAmount?: number;
}

export const HR1_CATEGORIES = [
  { id: 1, name: 'চুরি' },
  { id: 2, name: 'আত্মসাৎ' },
  { id: 3, name: 'ঘাটতি' },
  { id: 4, name: 'অপচয়' },
  { id: 5, name: 'বিধি বহির্ভূত পরিশোধ' },
  { id: 6, name: 'সরকারি অর্থ আদায়ে ব্যর্থতা' },
  { id: 7, name: 'অন্যান্য অনিয়ম' }
];

// Baseline Data as of 15 June 2025 (Official Directorate Record)
export const DEFAULT_HR_BASELINE_JUNE_2025: Record<number, { count: number; amount: number }> = {
  1: { count: 0, amount: 0 },
  2: { count: 0, amount: 0 },
  3: { count: 0, amount: 0 },
  4: { count: 0, amount: 0 },
  5: { count: 688, amount: 793.9882 },
  6: { count: 844, amount: 994.4385 },
  7: { count: 1027, amount: 1192.7909 }
};

/**
 * Safely parses any date from string, number, or Date, supporting ISO and DD/MM/YYYY formats
 * with English or Bengali numerals.
 */
export function parseAnyDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const str = toEnglishDigits(String(val)).trim();
  if (!str) return null;

  // 1. ISO format: YYYY-MM-DD (e.g. 2025-07-22)
  const isoMatch = str.match(/\b(\d{4})[-\/\.](0?[1-9]|1[0-2])[-\/\.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    if (!isNaN(d.getTime())) return d;
  }

  // 2. DD/MM/YYYY format (e.g. 22/07/2025 or 22-07-2025)
  const dmyMatch = str.match(/\b(0?[1-9]|[12]\d|3[01])[-\/\.](0?[1-9]|1[0-2])[-\/\.](\d{4})\b/);
  if (dmyMatch) {
    const d = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Fallback standard Date parse if ISO string with T
  if (str.includes('T') || str.includes('Z')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/**
 * Safely extracts a Date object from a SettlementEntry prioritizing official letter/meeting dates
 * so that creation timestamps do not distort the historical cycle.
 */
export function extractEntryDate(e: SettlementEntry): Date | null {
  // 1. Explicit issueDateISO (e.g. "2025-07-22")
  if (e.issueDateISO) {
    const d = parseAnyDate(e.issueDateISO);
    if (d) return d;
  }

  // 2. Issue letter no & date text (e.g. "জারিপত্র নং- ৭৪১৮, জারিপত্রের তারিখ- ২২/০৭/২০২৫")
  if (e.issueLetterNoDate) {
    const d = parseAnyDate(e.issueLetterNoDate);
    if (d) return d;
  }

  // 3. Meeting date (e.g. "22/07/2025" or "২২/০৭/২০২৫")
  if (e.meetingDate) {
    const d = parseAnyDate(e.meetingDate);
    if (d) return d;
  }

  // 4. Letter no & date (e.g. "স্মারক নং- ১২৩৪, তারিখ- ২২/০৭/২০২৫")
  if (e.letterNoDate) {
    const d = parseAnyDate(e.letterNoDate);
    if (d) return d;
  }

  // 5. Actual entry date
  if (e.actualEntryDate) {
    const d = parseAnyDate(e.actualEntryDate);
    if (d) return d;
  }

  // 6. Only fallback to createdAt if no official correspondence/meeting date is found
  if (e.createdAt) {
    const d = parseAnyDate(e.createdAt);
    if (d) return d;
  }

  return null;
}

/**
 * Calculates settlements from Settlement Register entries for a specific half-yearly period.
 * 
 * Option A (বিকল্প ক):
 * সংশ্লিষ্ট সময়কালের মোট নিষ্পন্ন অনুচ্ছেদের সংখ্যা (N) এবং জড়িত মোট টাকা (A কোটি)-কে
 * - ২/৩ অংশ বরাদ্দ করা হয়: সরকারি অর্থ আদায়ে ব্যর্থতা (Cat 6) [কলাম ৭ ও কলাম ৮]
 * - অবশিষ্ট ১/৩ অংশ বরাদ্দ করা হয়: বিধি বহির্ভূত পরিশোধ (Cat 5) [কলাম ৭ ও কলাম ৮]
 */
export function calculateSettlementsForHalfYearly(
  entries: SettlementEntry[],
  startDate: Date,
  endDate: Date,
  selectedMinistry?: string,
  selectedBranchType?: string,
  selectedEntity?: string
): Record<number, { raisedCount: number; raisedAmount: number; settledCount: number; settledAmount: number }> {
  const result: Record<number, { raisedCount: number; raisedAmount: number; settledCount: number; settledAmount: number }> = {
    1: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 },
    2: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 },
    3: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 },
    4: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 },
    5: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 },
    6: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 },
    7: { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 }
  };

  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  const startTime = startOfDay.getTime();

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);
  const endTime = endOfDay.getTime();

  let totalSettledParas = 0;
  let totalSettledAmountCrore = 0;
  let totalRaisedCount = 0;
  let totalRaisedAmountCrore = 0;

  const normTargetMinistry = selectedMinistry && selectedMinistry !== 'সকল'
    ? selectedMinistry.normalize('NFC').replace(/\s+/g, ' ').trim()
    : null;

  (entries || []).forEach(e => {
    if (e.approvalStatus === 'pending') return;

    if (normTargetMinistry) {
      const eMin = (e.ministryName || '').normalize('NFC').replace(/\s+/g, ' ').trim();
      const isTextileJute = (normTargetMinistry.includes('বস্ত্র') || normTargetMinistry.includes('পাট'));
      const eIsTextileJute = (eMin.includes('বস্ত্র') || eMin.includes('পাট'));

      const isCivilAviation = (normTargetMinistry.includes('বিমান') || normTargetMinistry.includes('পর্যটন'));
      const eIsCivilAviation = (eMin.includes('বিমান') || eMin.includes('পর্যটন'));

      if (isTextileJute && eIsTextileJute) {
        // match! বস্ত্র ও পাট মন্ত্রণালয় একসাথে
      } else if (isCivilAviation && eIsCivilAviation) {
        // match!
      } else if (eMin && !eMin.includes(normTargetMinistry) && !normTargetMinistry.includes(eMin)) {
        return;
      }
    }

    // Branch Type filter: এসএফআই vs নন-এসএফআই
    if (selectedBranchType && selectedBranchType !== 'সকল' && selectedBranchType !== 'সকল শাখা') {
      const isSFI = selectedBranchType.includes('এসএফআই') && !selectedBranchType.includes('নন');
      const eParaType = (e.paraType || '').trim();
      if (isSFI) {
        if (eParaType && eParaType.includes('নন')) return;
      } else {
        if (eParaType && !eParaType.includes('নন') && eParaType.includes('এসএফআই')) return;
      }
    }

    // Entity / Institution filter: যেমন "সোনালী ব্যাংক পিএলসি", "আলীম জুট মিলস লিমিটেড"
    if (selectedEntity && selectedEntity !== 'সকল' && selectedEntity !== 'সকল প্রতিষ্ঠান') {
      const normTargetEntity = selectedEntity.normalize('NFC').replace(/\s+/g, ' ').trim();
      const eEntity = (e.entityName || '').normalize('NFC').replace(/\s+/g, ' ').trim();
      if (eEntity && !eEntity.includes(normTargetEntity) && !normTargetEntity.includes(eEntity)) {
        return;
      }
    }

    const entryDate = extractEntryDate(e);
    if (!entryDate) return;
    const entryTime = entryDate.getTime();

    if (entryTime < startTime || entryTime > endTime) return;

    // 1. Raised Objections (উত্থাপিত) if manualRaised is set
    const mRaisedCount = e.manualRaisedCount ? parseInt(e.manualRaisedCount, 10) || 0 : 0;
    const mRaisedAmount = e.manualRaisedAmount ? Number(e.manualRaisedAmount) || 0 : 0;
    if (mRaisedCount > 0 || mRaisedAmount > 0) {
      totalRaisedCount += mRaisedCount;
      totalRaisedAmountCrore += mRaisedAmount / 10000000;
    }

    // 2. Settled Objections (নিষ্পত্তি)
    let parasCount = 0;
    if (e.paragraphs && e.paragraphs.length > 0) {
      // "আংশিক" অনুচ্ছেদ কোনোভাবেই সংখ্যায় গণনা হবে না, শুধুমাত্র "পূর্ণাঙ্গ" অনুচ্ছেদ গণনা হবে
      parasCount = e.paragraphs.filter(p => p.status !== 'আংশিক').length;
    } else if (e.meetingFullSettledParaCount) {
      parasCount = parseInt(toEnglishDigits(e.meetingFullSettledParaCount), 10) || 0;
    } else if (e.meetingPartialSettledParaCount && !e.meetingFullSettledParaCount) {
      parasCount = 0;
    } else {
      parasCount = 1;
    }
    totalSettledParas += parasCount;

    // টাকার পরিমাণ: আংশিক ও পূর্ণাঙ্গ উভয় নিষ্পত্তির টাকাই আর্থিক হিসাবে যুক্ত হবে
    const totalRec = Number(e.totalRec) || 0;
    const totalAdj = Number(e.totalAdj) || 0;
    const inv = Number(e.involvedAmount) || 0;
    const entryAmt = (totalRec + totalAdj > 0) ? (totalRec + totalAdj) : inv;
    totalSettledAmountCrore += (entryAmt / 10000000);
  });

  // ৩ ভাগে ভাগ করার নীতি:
  // ১. বিধি বহির্ভূত পরিশোধ (Cat 5): বাকি দুই ভাগের সমান (৫০% বা অর্ধেক)
  // ২. অন্যান্য অনিয়ম (Cat 7): অবশিষ্ট অংশের কিছুটা বেশি অংশ (~২৮%)
  // ৩. সরকারি অর্থ আদায়ে ব্যর্থতা (Cat 6): অবশিষ্ট অংশের সর্বনিম্ন অংশ (~২২%)
  if (totalSettledParas > 0) {
    // ১. বিধি বহির্ভূত পরিশোধ (Cat 5): ৫০%
    const cat5Count = Math.round(totalSettledParas / 2);
    const cat5Amount = Number((totalSettledAmountCrore * 0.5).toFixed(4));
    result[5].settledCount = cat5Count;
    result[5].settledAmount = cat5Amount;

    // অবশিষ্ট ৫০% কে দুই ভাগে ভাগ:
    const remCount = totalSettledParas - cat5Count;
    const remAmount = Number((totalSettledAmountCrore - cat5Amount).toFixed(4));

    // ২. অন্যান্য অনিয়ম (Cat 7): অবশিষ্ট অংশের কিছুটা বেশি অংশ
    let cat7Count = Math.round(remCount * (28 / 50));
    if (remCount > 1 && cat7Count <= remCount - cat7Count) {
      cat7Count = Math.ceil(remCount / 2);
    }
    // ৩. সরকারি অর্থ আদায়ে ব্যর্থতা (Cat 6): অবশিষ্ট অংশের সর্বনিম্ন অংশ
    const cat6Count = remCount - cat7Count;

    const cat7Amount = Number((totalSettledAmountCrore * 0.28).toFixed(4));
    const cat6Amount = Number((remAmount - cat7Amount).toFixed(4));

    result[7].settledCount = cat7Count;
    result[7].settledAmount = cat7Amount;

    result[6].settledCount = cat6Count;
    result[6].settledAmount = cat6Amount;
  }

  if (totalRaisedCount > 0 || totalRaisedAmountCrore > 0) {
    result[7].raisedCount = totalRaisedCount;
    result[7].raisedAmount = Number(totalRaisedAmountCrore.toFixed(4));
  }

  return result;
}

/**
 * Rolls forward half-yearly data starting from June 2025 up to targetDate.
 * 
 * Chaining:
 *   Col 9 (Closing Count) = (Col 3 + Col 5) - Col 7
 *   Col 10 (Closing Amount) = (Col 4 + Col 6) - Col 8
 * 
 * Next cycle's Col 3 & 4 = Previous cycle's Col 9 & 10
 */
/**
 * Robustly retrieves saved opening stats for any ministry and category, handling
 * Unicode normalization variations, key separators, combined ministries, and fallbacks.
 */
export function getSavedStatsForMinistryAndCategory(
  savedStats: Record<string, any> | undefined,
  ministry: string | undefined,
  catName: string,
  catId?: number
): any {
  if (!savedStats) return undefined;

  const targetMin = (ministry && ministry !== 'সকল' ? ministry : 'আর্থিক প্রতিষ্ঠান বিভাগ')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
  const targetCat = catName.normalize('NFC').replace(/\s+/g, ' ').trim();

  // 1. Direct key match: `${targetMin}_${targetCat}`
  if (savedStats[`${targetMin}_${targetCat}`]) {
    return savedStats[`${targetMin}_${targetCat}`];
  }

  // 2. Direct key match with original strings
  if (ministry && savedStats[`${ministry}_${catName}`]) {
    return savedStats[`${ministry}_${catName}`];
  }

  // 3. Ministry classifications
  const isFinancial = targetMin.includes('আর্থিক');
  const isTextileJute = targetMin.includes('বস্ত্র') || targetMin.includes('পাট');
  const isIndustry = targetMin.includes('শিল্প');
  const isCommerce = targetMin.includes('বাণিজ্য');
  const isAviation = targetMin.includes('বিমান') || targetMin.includes('পর্যটন');

  // If Textile & Jute, check combined or individual keys
  if (isTextileJute) {
    if (savedStats[`বস্ত্র ও পাট মন্ত্রণালয়_${catName}`]) return savedStats[`বস্ত্র ও পাট মন্ত্রণালয়_${catName}`];
    const j = savedStats[`পাট মন্ত্রণালয়_${catName}`];
    const t = savedStats[`বস্ত্র মন্ত্রণালয়_${catName}`];
    if (j || t) {
      return {
        halfYearlyPrevUnsettledCount: (parseBengaliNumber(j?.halfYearlyPrevUnsettledCount) || 0) + (parseBengaliNumber(t?.halfYearlyPrevUnsettledCount) || 0),
        halfYearlyPrevUnsettledAmount: (parseBengaliNumber(j?.halfYearlyPrevUnsettledAmount) || 0) + (parseBengaliNumber(t?.halfYearlyPrevUnsettledAmount) || 0),
        halfYearlyRaisedCount: (parseBengaliNumber(j?.halfYearlyRaisedCount) || 0) + (parseBengaliNumber(t?.halfYearlyRaisedCount) || 0),
        halfYearlyRaisedAmount: (parseBengaliNumber(j?.halfYearlyRaisedAmount) || 0) + (parseBengaliNumber(t?.halfYearlyRaisedAmount) || 0),
        halfYearlySettledCount: (parseBengaliNumber(j?.halfYearlySettledCount) || 0) + (parseBengaliNumber(t?.halfYearlySettledCount) || 0),
        halfYearlySettledAmount: (parseBengaliNumber(j?.halfYearlySettledAmount) || 0) + (parseBengaliNumber(t?.halfYearlySettledAmount) || 0),
      };
    }
  }

  // If Civil Aviation, check all variations
  if (isAviation) {
    if (savedStats[`বেসামরিক বিমান, পরিবহন ও পর্যটন মন্ত্রণালয়_${catName}`]) {
      return savedStats[`বেসামরিক বিমান, পরিবহন ও পর্যটন মন্ত্রণালয়_${catName}`];
    }
    if (savedStats[`বিমান ও পর্যটন মন্ত্রণালয়_${catName}`]) {
      return savedStats[`বিমান ও পর্যটন মন্ত্রণালয়_${catName}`];
    }
  }

  // 4. Scan all keys in savedStats with robust normalization
  for (const [key, val] of Object.entries(savedStats)) {
    if (!val || typeof val !== 'object') continue;
    const parts = key.split('_');
    if (parts.length >= 2) {
      const kMin = parts[0].normalize('NFC').replace(/\s+/g, ' ').trim();
      const kCat = parts.slice(1).join('_').normalize('NFC').replace(/\s+/g, ' ').trim();

      if (kCat === targetCat || kCat.includes(targetCat) || targetCat.includes(kCat)) {
        if (isIndustry && kMin.includes('শিল্প')) return val;
        if (isCommerce && kMin.includes('বাণিজ্য')) return val;
        if (isAviation && (kMin.includes('বিমান') || kMin.includes('পর্যটন'))) return val;
        if (isTextileJute && (kMin.includes('বস্ত্র') || kMin.includes('পাট'))) return val;
        if (isFinancial && kMin.includes('আর্থিক')) return val;
        if (kMin === targetMin || kMin.includes(targetMin) || targetMin.includes(kMin)) return val;
      }
    }
  }

  // 5. Fallback for Financial Institutions: directly by category name
  if (isFinancial) {
    if (savedStats[catName]) return savedStats[catName];
    if (savedStats[targetCat]) return savedStats[targetCat];
  }

  return undefined;
}

export function getHalfYearlyRollingData(
  targetDate: Date,
  entries: SettlementEntry[],
  savedStats?: Record<string, any>,
  selectedMinistry?: string,
  selectedBranchType?: string,
  selectedEntity?: string
): Record<number, HRRowData> {
  // Step 1: Base Opening (June 2025)
  const currentRolling: Record<number, { count: number; amount: number }> = {};
  const normMin = selectedMinistry && selectedMinistry !== 'সকল' ? selectedMinistry.normalize('NFC').trim() : 'আর্থিক প্রতিষ্ঠান বিভাগ';
  const isFinancialInst = normMin.includes('আর্থিক প্রতিষ্ঠান');

  HR1_CATEGORIES.forEach(cat => {
    const saved = getSavedStatsForMinistryAndCategory(savedStats, selectedMinistry, cat.name, cat.id);

    let baseCount = isFinancialInst ? (DEFAULT_HR_BASELINE_JUNE_2025[cat.id]?.count || 0) : 0;
    let baseAmount = isFinancialInst ? (DEFAULT_HR_BASELINE_JUNE_2025[cat.id]?.amount || 0) : 0;

    if (saved) {
      const pCount = (saved.halfYearlyPrevUnsettledCount !== undefined && saved.halfYearlyPrevUnsettledCount !== '')
        ? (parseBengaliNumber(saved.halfYearlyPrevUnsettledCount) || 0)
        : (saved.unsettledCount !== undefined && saved.unsettledCount !== '' ? (parseBengaliNumber(saved.unsettledCount) || 0) : 0);

      const pAmount = (saved.halfYearlyPrevUnsettledAmount !== undefined && saved.halfYearlyPrevUnsettledAmount !== '')
        ? (parseBengaliNumber(saved.halfYearlyPrevUnsettledAmount) || 0)
        : (saved.unsettledAmount !== undefined && saved.unsettledAmount !== '' ? (parseBengaliNumber(saved.unsettledAmount) || 0) : 0);

      const rCount = parseBengaliNumber(saved.halfYearlyRaisedCount) || 0;
      const rAmount = parseBengaliNumber(saved.halfYearlyRaisedAmount) || 0;
      const sCount = parseBengaliNumber(saved.halfYearlySettledCount) || 0;
      const sAmount = parseBengaliNumber(saved.halfYearlySettledAmount) || 0;

      // Closing of June 2025 = (Opening + Raised) - Settled
      const closingCount = (pCount + rCount) - sCount;
      const closingAmount = Number(((pAmount + rAmount) - sAmount).toFixed(4));

      if (closingCount !== 0 || rCount !== 0 || sCount !== 0) {
        baseCount = Math.max(0, closingCount);
      } else if (pCount > 0) {
        baseCount = pCount;
      }

      if (closingAmount !== 0 || rAmount !== 0 || sAmount !== 0) {
        baseAmount = Math.max(0, closingAmount);
      } else if (pAmount > 0) {
        baseAmount = pAmount;
      }
    }

    currentRolling[cat.id] = { count: baseCount, amount: baseAmount };
  });

  // Target cycle calculation
  const targetCycle = getHalfYearlyCycleForDate(targetDate);
  // Baseline boundary is the end of 15 June 2025 (or beginning of 16 June 2025)
  const baselineBoundaryTime = new Date(2025, 5, 16, 0, 0, 0).getTime();

  // If target cycle is entirely at or prior to the 15 June 2025 baseline (e.g. 16/12/2024 to 15/06/2025)
  if (targetCycle.end.getTime() <= baselineBoundaryTime) {
    const periodSettlements = calculateSettlementsForHalfYearly(entries, targetCycle.start, targetCycle.end, selectedMinistry, selectedBranchType, selectedEntity);
    const baselineRowData: Record<number, HRRowData> = {};

    HR1_CATEGORIES.forEach(cat => {
      // Col 9 & 10 is the baseline closing as of 15 June 2025
      const fCount = currentRolling[cat.id]?.count || 0;
      const fAmount = currentRolling[cat.id]?.amount || 0;

      const cData = periodSettlements[cat.id] || { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 };
      const sCount = cData.settledCount;
      const sAmount = cData.settledAmount;
      const cCount = cData.raisedCount;
      const cAmount = cData.raisedAmount;

      // Col 3 & 4 (Opening before this period): Closing - Raised + Settled
      const pCount = Math.max(0, fCount - cCount + sCount);
      const pAmount = Math.max(0, Number((fAmount - cAmount + sAmount).toFixed(4)));

      baselineRowData[cat.id] = {
        col3_pCount: pCount,
        col4_pAmount: pAmount,
        col5_cCount: cCount,
        col6_cAmount: cAmount,
        col7_sCount: sCount,
        col8_sAmount: sAmount,
        col9_finalCount: fCount,
        col10_finalAmount: fAmount
      };
    });
    return baselineRowData;
  }

  // Build chronological sequence of post-baseline cycles:
  // Cycle 1: H2 2025 (16/06/2025 to 15/12/2025)
  // Cycle 2: H1 2026 (16/12/2025 to 15/06/2026)
  // Cycle 3: H2 2026 (16/06/2026 to 15/12/2026)
  // ... up to targetCycle
  const periodsToSimulate: { year: number; isH1: boolean; start: Date; end: Date; label: string }[] = [];
  const maxYear = Math.max(targetCycle.end.getFullYear() + 1, 2026);

  for (let y = 2025; y <= maxYear; y++) {
    // For y = 2025, only H2 (Jul-Dec) is after the June 2025 baseline.
    // For subsequent years, both H1 and H2 occur.
    const halves = (y === 2025) ? [false] : [true, false];
    let reachedTarget = false;

    for (const isH1 of halves) {
      const refDate = new Date(y, isH1 ? 0 : 6, 16);
      const cycle = getHalfYearlyCycleForDate(refDate);

      periodsToSimulate.push({
        year: y,
        isH1,
        start: cycle.start,
        end: cycle.end,
        label: cycle.label
      });

      // Strict match on targetCycle start or end date
      const isStartMatch = Math.abs(cycle.start.getTime() - targetCycle.start.getTime()) < 86400000;
      const isEndMatch = Math.abs(cycle.end.getTime() - targetCycle.end.getTime()) < 86400000;
      if (isStartMatch || isEndMatch) {
        reachedTarget = true;
        break;
      }
    }

    if (reachedTarget) {
      break;
    }
  }

  let finalRowData: Record<number, HRRowData> = {};

  for (let idx = 0; idx < periodsToSimulate.length; idx++) {
    const p = periodsToSimulate[idx];
    const isTarget = idx === periodsToSimulate.length - 1;

    // Calculate settlements and raised from entries in this period using Option A (2/3 and 1/3)
    const periodSettlements = calculateSettlementsForHalfYearly(entries, p.start, p.end, selectedMinistry, selectedBranchType, selectedEntity);

    const stepRowData: Record<number, HRRowData> = {};

    HR1_CATEGORIES.forEach(cat => {
      const pCount = currentRolling[cat.id]?.count || 0;
      const pAmount = currentRolling[cat.id]?.amount || 0;

      const cData = periodSettlements[cat.id] || { raisedCount: 0, raisedAmount: 0, settledCount: 0, settledAmount: 0 };
      const cCount = cData.raisedCount;
      const cAmount = cData.raisedAmount;
      const sCount = cData.settledCount;
      const sAmount = cData.settledAmount;

      const fCount = (pCount + cCount) - sCount;
      const fAmount = (pAmount + cAmount) - sAmount;

      stepRowData[cat.id] = {
        col3_pCount: pCount,
        col4_pAmount: pAmount,
        col5_cCount: cCount,
        col6_cAmount: cAmount,
        col7_sCount: sCount,
        col8_sAmount: sAmount,
        col9_finalCount: fCount,
        col10_finalAmount: Number(fAmount.toFixed(4))
      };

      // Roll forward: closing becomes opening for the next period!
      currentRolling[cat.id] = {
        count: fCount,
        amount: Number(fAmount.toFixed(4))
      };
    });

    if (isTarget) {
      finalRowData = stepRowData;
    }
  }

  // Fail-safe: ensure target cycle settlements in finalRowData strictly match calculateSettlementsForHalfYearly
  const directTargetSettlements = calculateSettlementsForHalfYearly(entries, targetCycle.start, targetCycle.end, selectedMinistry, selectedBranchType, selectedEntity);
  HR1_CATEGORIES.forEach(cat => {
    if (finalRowData[cat.id]) {
      const direct = directTargetSettlements[cat.id] || { settledCount: 0, settledAmount: 0, raisedCount: 0, raisedAmount: 0 };
      finalRowData[cat.id].col7_sCount = direct.settledCount;
      finalRowData[cat.id].col8_sAmount = direct.settledAmount;
      finalRowData[cat.id].col5_cCount = direct.raisedCount;
      finalRowData[cat.id].col6_cAmount = direct.raisedAmount;
      finalRowData[cat.id].col9_finalCount = (finalRowData[cat.id].col3_pCount + direct.raisedCount) - direct.settledCount;
      finalRowData[cat.id].col10_finalAmount = Number(((finalRowData[cat.id].col4_pAmount + direct.raisedAmount) - direct.settledAmount).toFixed(4));
    }
  });

  return finalRowData;
}
