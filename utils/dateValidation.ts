
import { isBefore, parseISO, isValid } from 'date-fns';

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
