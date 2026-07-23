
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
export const toEnglishDigits = (input: string | number | undefined | null): string => {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  const englishDigits: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (digit) => englishDigits[digit]);
};

/**
 * Parses a string that may contain Bengali or English digits into a number.
 */
export const parseBengaliNumber = (input: string | number | undefined | null): number => {
  if (input === undefined || input === null || input === '') return 0;
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
  
  // If it's a full ISO string or contains time info
  if (iso.includes('T') || iso.includes(':')) {
    try {
      const date = new Date(iso);
      if (!isNaN(date.getTime())) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear().toString();
        return toBengaliDigits(`${d}/${m}/${y}`);
      }
    } catch (e) {}
  }

  // If it's already in DD/MM/YYYY format (contains /), just convert digits
  if (iso.includes('/')) return toBengaliDigits(iso);
  
  // If it's ISO YYYY-MM-DD
  const parts = iso.split('-');
  if (parts.length === 3) {
    const day = parts[2].split('T')[0].split(' ')[0];
    return toBengaliDigits(`${day}/${parts[1]}/${parts[0]}`);
  }
  return toBengaliDigits(iso);
};

/**
 * Extracts a normalized YYYY-MM-DD date string from a text field.
 * Gives top priority to dates explicitly following "তারিখ" or "date" keywords.
 */
export const extractDateFromText = (text: string): string => {
  if (!text || typeof text !== 'string' || text.trim() === '') return '';

  const engStr = toEnglishDigits(text);

  // 1. Look for a date explicitly preceded by "তারিখ" or "date" keyword
  const kwMatchDDMM = engStr.match(/(?:তারিখ|date)[:\-\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i);
  if (kwMatchDDMM) {
    const d = kwMatchDDMM[1].padStart(2, '0');
    const m = kwMatchDDMM[2].padStart(2, '0');
    const y = kwMatchDDMM[3];
    const numY = parseInt(y, 10);
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numY >= 1970 && numY <= 2099 && numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  const kwMatchYYYY = engStr.match(/(?:তারিখ|date)[:\-\s]*(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/i);
  if (kwMatchYYYY) {
    const y = kwMatchYYYY[1];
    const m = kwMatchYYYY[2].padStart(2, '0');
    const d = kwMatchYYYY[3].padStart(2, '0');
    const numY = parseInt(y, 10);
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numY >= 1970 && numY <= 2099 && numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 2. Fallback: match any DD/MM/YYYY in the text
  const matchDDMM = engStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (matchDDMM) {
    const d = matchDDMM[1].padStart(2, '0');
    const m = matchDDMM[2].padStart(2, '0');
    const y = matchDDMM[3];
    const numY = parseInt(y, 10);
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numY >= 1970 && numY <= 2099 && numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 3. Fallback: match any YYYY-MM-DD in the text
  const matchYYYY = engStr.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (matchYYYY) {
    const y = matchYYYY[1];
    const m = matchYYYY[2].padStart(2, '0');
    const d = matchYYYY[3].padStart(2, '0');
    const numY = parseInt(y, 10);
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numY >= 1970 && numY <= 2099 && numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  return '';
};

/**
 * Extracts a normalized ISO YYYY-MM-DD date strictly prioritizing the Issue Letter Date (জারিপত্রের তারিখ)
 * fields of a SettlementEntry or CorrespondenceEntry.
 */
export const extractEntryDate = (e: any): string => {
  if (!e) return '';

  // 1. Check issueLetterNoDate (জারিপত্র নং ও তারিখ) - top text priority
  if (e.issueLetterNoDate && typeof e.issueLetterNoDate === 'string') {
    const d = extractDateFromText(e.issueLetterNoDate);
    if (d) return d;
  }

  // 2. Check issueLetterDate
  if (e.issueLetterDate && typeof e.issueLetterDate === 'string') {
    const d = extractDateFromText(e.issueLetterDate);
    if (d) return d;
  }

  // 3. Check issueDateISO
  if (e.issueDateISO && typeof e.issueDateISO === 'string' && e.issueDateISO.trim() !== '') {
    const isoClean = e.issueDateISO.split('T')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoClean)) {
      return isoClean;
    }
  }

  // 4. Check issueLetterNo
  if (e.issueLetterNo && typeof e.issueLetterNo === 'string') {
    const d = extractDateFromText(e.issueLetterNo);
    if (d) return d;
  }

  // 5. Fallback fields ONLY if issue letter date fields had no date
  const fallbackFields = [
    e.letterNoDate,
    e.letterDate,
    e.workpaperNoDate,
    e.minutesNoDate,
    e.meetingDate,
    e.branchReceiptDate,
    e.presentationDate
  ];

  for (const field of fallbackFields) {
    if (field && typeof field === 'string') {
      const d = extractDateFromText(field);
      if (d) return d;
    }
  }

  // 6. Fallback to createdAt if valid ISO
  if (e.createdAt && typeof e.createdAt === 'string' && e.createdAt.trim() !== '') {
    const createdClean = e.createdAt.split('T')[0].trim();
    const d = extractDateFromText(createdClean);
    if (d) return d;
  }

  return '';
};