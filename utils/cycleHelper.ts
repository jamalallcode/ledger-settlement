import { format, isAfter, isBefore, addMonths } from 'date-fns';

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
    start = new Date(year, 0, 16);
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