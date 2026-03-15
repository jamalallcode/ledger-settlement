
/**
 * Converts English digits in a string or number to Bengali digits, preserving dots and spaces.
 */
export const toBengaliDigits = (input: string | number | undefined | null): string => {
  if (input === undefined || input === null) return '';
  const bengaliDigits: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return input.toString().replace(/[0-9]/g, (digit) => bengaliDigits[digit]);
};

/**
 * Converts Bengali digits in a string back to English digits.
 */
export const toEnglishDigits = (input: string): string => {
  const englishDigits: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return input.replace(/[০-৯]/g, (digit) => englishDigits[digit]);
};

/**
 * Parses a string that may contain Bengali or English digits into a number.
 */
export const parseBengaliNumber = (input: string): number => {
  if (!input) return 0;
  const englishString = toEnglishDigits(input).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(englishString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a number with commas and converts to Bengali digits for display only.
 */
export const formatBengaliAmount = (num: number): string => {
  if (num === 0) return '০.০০';
  const formatted = num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return toBengaliDigits(formatted);
};

/**
 * Formats an ISO date string (YYYY-MM-DD) to Bengali DD/MM/YYYY format.
 */
export const formatDateBN = (iso: string | undefined | null): string => {
  if (!iso || iso === '0000-00-00' || iso.startsWith('0000')) return '';
  // If it's already in DD/MM/YYYY format (contains /), just convert digits
  if (iso.includes('/')) return toBengaliDigits(iso);
  // If it's ISO YYYY-MM-DD
  const parts = iso.split('-');
  if (parts.length === 3) {
    return toBengaliDigits(`${parts[2]}/${parts[1]}/${parts[0]}`);
  }
  return toBengaliDigits(iso);
};
