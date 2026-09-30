import { format, isAfter, isBefore, addMonths } from 'date-fns';
import { toBengaliDigits } from './numberUtils';

/**
 * Normalizes a date to the very beginning of the day (00:00:00.000)
 */
const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Normalizes a date to the very end of the day (23:59:59.999)
 */
const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * A cycle is defined as the 16th of the previous month to the 15th of the current month.
 * Logic: 16th of Month A to 15th of Month B.
 */
export const getCurrentCycle = (date: Date = new Date()): { start: Date; end: Date; label: string } => {
  const day = date.getDate();
  let start: Date;
  let end: Date;

  if (day >= 16) {
    // Current date is 16th or later: we are in the cycle ending next month
    start = new Date(date.getFullYear(), date.getMonth(), 16);
    const nextMonth = addMonths(date, 1);
    end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15);
  } else {
    // Current date is 1st-15th: we are in the cycle ending this month
    const lastMonth = addMonths(date, -1);
    start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 16);
    end = new Date(date.getFullYear(), date.getMonth(), 15);
  }

  const s = startOfDay(start);
  const e = endOfDay(end);

  return {
    start: s,
    end: e,
    label: `${format(s, 'dd/MM/yyyy')} হতে ${format(e, 'dd/MM/yyyy')}`
  };
};

/**
 * Returns the cycle information for any given date object.
 * Logic: 16th of Month A to 15th of Month B.
 */
export const getCycleForDate = (date: Date): { start: Date; end: Date; label: string } => {
  const day = date.getDate();
  let start: Date;
  let end: Date;

  if (day >= 16) {
    // If date is 16th+, cycle is [This Month 16] to [Next Month 15]
    start = new Date(date.getFullYear(), date.getMonth(), 16);
    const nextMonth = addMonths(date, 1);
    end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15);
  } else {
    // If date is 1-15, cycle is [Prev Month 16] to [This Month 15]
    const lastMonth = addMonths(date, -1);
    start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 16);
    end = new Date(date.getFullYear(), date.getMonth(), 15);
  }

  const s = startOfDay(start);
  const e = endOfDay(end);

  return {
    start: s,
    end: e,
    label: `${format(s, 'dd/MM/yyyy')} হতে ${format(e, 'dd/MM/yyyy')}`
  };
};

/**
 * Returns quarterly cycle information for a given date.
 * Q1 (Jan-Mar): 16/01/YYYY to 15/03/YYYY
 * Q2 (Apr-Jun): 16/03/YYYY to 15/06/YYYY
 * Q3 (Jul-Sep): 16/06/YYYY to 15/09/YYYY
 * Q4 (Oct-Dec): 16/09/YYYY to 15/12/YYYY
 */
export const getQuarterlyCycleForDate = (date: Date): { start: Date; end: Date; label: string } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  let start: Date;
  let end: Date;

  if (month >= 0 && month <= 2) {
    start = new Date(year - 1, 11, 16);
    end = new Date(year, 2, 15);
  } else if (month >= 3 && month <= 5) {
    start = new Date(year, 2, 16);
    end = new Date(year, 5, 15);
  } else if (month >= 6 && month <= 8) {
    start = new Date(year, 5, 16);
    end = new Date(year, 8, 15);
  } else {
    start = new Date(year, 8, 16);
    end = new Date(year, 11, 15);
  }

  const s = startOfDay(start);
  const e = endOfDay(end);

  return {
    start: s,
    end: e,
    label: `${format(s, 'dd/MM/yyyy')} হতে ${format(e, 'dd/MM/yyyy')}`
  };
};

/**
 * Returns half-yearly cycle information for a given date.
 * H1 (Jan-Jun ending): 16/12/(YYYY-1) to 15/06/YYYY
 * H2 (Jul-Dec ending): 16/06/YYYY to 15/12/YYYY
 */
export const getHalfYearlyCycleForDate = (date: Date): { start: Date; end: Date; label: string; subLabel: string } => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 to 11
  const day = date.getDate();

  let start: Date;
  let end: Date;
  let subLabel: string;

  // H1: 16 Dec of (targetYear - 1) to 15 Jun of targetYear
  // H2: 16 Jun of targetYear to 15 Dec of targetYear
  if (month === 11 && day >= 16) {
    // 16-31 Dec belongs to next year's H1 (e.g. 16/12/2024 to 15/06/2025)
    const targetYear = year + 1;
    start = new Date(year, 11, 16);
    end = new Date(targetYear, 5, 15);
    const yrShort = format(end, 'yy');
    subLabel = `জানুয়ারি/${toBengaliDigits(yrShort)} হতে জুন/${toBengaliDigits(yrShort)}`;
  } else if (month <= 4 || (month === 5 && day <= 15)) {
    // 1 Jan to 15 Jun belongs to this year's H1 (e.g. 16/12/2024 to 15/06/2025)
    start = new Date(year - 1, 11, 16);
    end = new Date(year, 5, 15);
    const yrShort = format(end, 'yy');
    subLabel = `জানুয়ারি/${toBengaliDigits(yrShort)} হতে জুন/${toBengaliDigits(yrShort)}`;
  } else {
    // 16 Jun to 15 Dec belongs to this year's H2 (e.g. 16/06/2025 to 15/12/2025)
    start = new Date(year, 5, 16);
    end = new Date(year, 11, 15);
    const yrShort = format(end, 'yy');
    subLabel = `জুলাই/${toBengaliDigits(yrShort)} হতে ডিসেম্বর/${toBengaliDigits(yrShort)}`;
  }

  const s = startOfDay(start);
  const e = endOfDay(end);

  return {
    start: s,
    end: e,
    label: `${toBengaliDigits(format(s, 'dd/MM/yyyy'))} হতে ${toBengaliDigits(format(e, 'dd/MM/yyyy'))}`,
    subLabel
  };
};

/**
 * Helper to check if an entry is within its intended cycle or it's backdated/late
 */
export const isEntryLate = (entryMadeAt: Date, targetCycleEnd: Date): boolean => {
  return isAfter(entryMadeAt, targetCycleEnd);
};

/**
 * Checks if a date falls within the cycle range.
 * Uses getTime() for robust comparison regardless of timezone or reference issues.
 */
export const isInCycle = (entryDate: string | Date, cycleStart: Date, cycleEnd: Date): boolean => {
  const date = typeof entryDate === 'string' ? new Date(entryDate) : entryDate;
  
  const t = date.getTime();
  const s = cycleStart.getTime();
  const e = cycleEnd.getTime();
  
  return t >= s && t <= e;
};