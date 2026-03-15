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
  // Robustness check for invalid dates
  if (!date || isNaN(date.getTime())) {
    date = new Date();
  }
  
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

  // Final safety check before formatting
  const safeS = isNaN(s.getTime()) ? new Date() : s;
  const safeE = isNaN(e.getTime()) ? new Date() : e;

  return {
    start: safeS,
    end: safeE,
    label: `${format(safeS, 'dd/MM/yyyy')} হতে ${format(safeE, 'dd/MM/yyyy')}`
  };
};

/**
 * Returns the cycle information for any given date object.
 * Logic: 16th of Month A to 15th of Month B.
 */
export const getCycleForDate = (date: Date): { start: Date; end: Date; label: string } => {
  // Robustness check for invalid dates
  if (!date || isNaN(date.getTime())) {
    return getCurrentCycle(new Date());
  }

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

  // Final safety check before formatting
  const safeS = isNaN(s.getTime()) ? new Date() : s;
  const safeE = isNaN(e.getTime()) ? new Date() : e;

  return {
    start: safeS,
    end: safeE,
    label: `${format(safeS, 'dd/MM/yyyy')} হতে ${format(safeE, 'dd/MM/yyyy')}`
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
