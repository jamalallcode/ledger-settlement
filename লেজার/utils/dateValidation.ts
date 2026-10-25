import { isBefore, parseISO, isValid } from 'date-fns';
import { toEnglishDigits } from './numberUtils';

/**
 * Validates the chronological order of dates in the Settlement/Correspondence flow.
 * Sequence: Letter Date -> Diary Date -> Receipt Date -> Received Date -> Presentation Date -> Issue Date
 */

export const getDateError = (laterDate: string, earlierDate: string, laterLabel: string, earlierLabel: string): string | null => {
  if (!laterDate || !earlierDate) return null;
  
  const later = parseISO(laterDate);
  const earlier = parseISO(earlierDate);

  if (!isValid(later) || !isValid(earlier)) return null;

  // If later date is actually before the earlier date, trigger warning
  if (isBefore(later, earlier)) {
    return `${laterLabel} ${earlierLabel} এর আগের হতে পারবে না।`;
  }


  return null;
};

/**
 * Parses user-entered manual date strings in formats like:
 * DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD
 * Supports both Bengali digits (০-৯) and English digits (0-9).
 */
export const parseManualDate = (str: string): Date | null => {
  if (!str) return null;
  const clean = toEnglishDigits(str).trim();
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    let d = 0, m = 0, y = 0;
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
      if (y < 100) y = 2000 + y;
    }
    if (y >= 1970 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime()) && dt.getMonth() === m && dt.getDate() === d) return dt;
    }
  }
  return null;
};