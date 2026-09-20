import { SettlementEntry, CorrespondenceEntry } from '../types';
import { toBengaliDigits, toEnglishDigits } from './numberUtils';

/**
 * Splits a combined info string (e.g. "পত্র নং- ১০৮৯, পত্রের তারিখ- ২৮/০৬/২০২৬")
 * into number and date components.
 */
export const splitCombinedInfo = (
  info: string = '',
  noPrefix: string = 'পত্র নং',
  datePrefix: string = 'পত্রের তারিখ'
): { no: string; date: string } => {
  if (!info) return { no: '', date: '' };
  let no = '';
  let date = '';

  const noRegex = new RegExp(`${noPrefix}[^:–—\\-,\\d]*[:–—\\-]?\\s*([\\d০-৯a-zA-Z\\/\\-_.]+)`, 'i');
  const noMatch = info.match(noRegex);
  if (noMatch) no = noMatch[1].trim();

  const dateRegex = new RegExp(`${datePrefix}[^:–—\\-,\\d]*[:–—\\-]?\\s*([\\d০-৯\\/\\-\\.]+)`, 'i');
  const dateMatch = info.match(dateRegex);
  if (dateMatch) date = dateMatch[1].trim();

  return { no, date };
};

/**
 * Checks if a settlement entry matches a correspondence entry.
 */
export const isSettlementMatchingCorrespondence = (
  se: SettlementEntry,
  corr: any
): boolean => {
  if (!se || !corr) return false;

  // 1. Direct ID match
  if (se.correspondenceId && se.correspondenceId === corr.id) return true;
  if ((se as any).letterId && (se as any).letterId === corr.id) return true;
  if (se.id === corr.id) return true;

  const cleanDigits = (val?: any) => toEnglishDigits(String(val || '')).replace(/\D/g, '');
  const normArchive = (val?: any) => toEnglishDigits(String(val || '')).toLowerCase().replace(/[\s\-_]/g, '');

  const cArchive = normArchive(corr.archiveNo);
  const seArchive = normArchive(se.archiveNo);

  // 2. Archive No match (if valid non-empty archive number like "kg- 0598")
  if (cArchive && seArchive && cArchive === seArchive) {
    return true;
  }

  // 3. Number-based correlation
  let cLNo = cleanDigits(corr.letterNo);
  let cDNo = cleanDigits(corr.diaryNo);
  let cINo = cleanDigits(corr.issueLetterNo);

  if (!cLNo && corr.letterNoDate) {
    cLNo = cleanDigits(splitCombinedInfo(corr.letterNoDate, 'পত্র নং', 'পত্রের তারিখ').no);
  }
  if (!cDNo && corr.workpaperNoDate) {
    cDNo = cleanDigits(splitCombinedInfo(corr.workpaperNoDate, 'ডায়েরি নং', 'ডায়েরির তারিখ').no);
  }
  if (!cINo && corr.issueLetterNoDate) {
    cINo = cleanDigits(splitCombinedInfo(corr.issueLetterNoDate, 'জারিপত্র নং', 'জারিপত্রের তারিখ').no);
  }

  const seLNo = cleanDigits(se.letterNoDate);
  const seDNo = cleanDigits(se.workpaperNoDate);
  const seINo = cleanDigits(se.issueLetterNoDate);

  // Match A: Letter No AND Diary No match
  if (cLNo && seLNo && cDNo && seDNo) {
    if (seLNo.includes(cLNo) && seDNo.includes(cDNo)) {
      return true;
    }
  }

  // Match B: Letter No AND Issue No match
  if (cLNo && seLNo && cINo && seINo) {
    if (seLNo.includes(cLNo) && seINo.includes(cINo)) {
      return true;
    }
  }

  return false;
};

/**
 * Automatically synchronizes updated correspondence data (letter no, letter date, diary no, diary date, archive no)
 * to any linked or matching settlement entries so that changes reflect across all reports and registers.
 */
export const syncCorrespondenceToSettlements = (
  corr: any,
  settlements: SettlementEntry[]
): { updatedSettlements: SettlementEntry[]; hasChanges: boolean } => {
  if (!corr || !settlements || settlements.length === 0) {
    return { updatedSettlements: settlements, hasChanges: false };
  }

  let hasChanges = false;

  const updatedSettlements = settlements.map((se) => {
    if (!isSettlementMatchingCorrespondence(se, corr)) {
      return se;
    }

    let changed = false;
    const updatedSe = { ...se };

    // 1. Ensure correspondenceId linkage
    if (!updatedSe.correspondenceId) {
      updatedSe.correspondenceId = corr.id;
      changed = true;
    }

    // 2. Sync Letter No & Letter Date
    let lNo = corr.letterNo || '';
    let lDate = corr.letterDate || '';
    if (!lNo || !lDate) {
      if (corr.letterNoDate) {
        const parts = splitCombinedInfo(corr.letterNoDate, 'পত্র নং', 'পত্রের তারিখ');
        if (!lNo) lNo = parts.no;
        if (!lDate) lDate = parts.date;
      }
    }

    if (lNo || lDate) {
      const existingParts = splitCombinedInfo(updatedSe.letterNoDate || '', 'পত্র নং', 'পত্রের তারিখ');
      const finalNo = lNo || existingParts.no;
      const finalDate = lDate || existingParts.date;

      if (finalNo || finalDate) {
        const targetLetterStr = `পত্র নং- ${toBengaliDigits(finalNo)}, পত্রের তারিখ- ${toBengaliDigits(finalDate)}`;
        if (updatedSe.letterNoDate !== targetLetterStr) {
          updatedSe.letterNoDate = targetLetterStr;
          changed = true;
        }
      }
    }

    // 3. Sync Diary No & Diary Date
    let dNo = corr.diaryNo || '';
    let dDate = corr.diaryDate || '';
    if (!dNo || !dDate) {
      if (corr.workpaperNoDate) {
        const parts = splitCombinedInfo(corr.workpaperNoDate, 'ডায়েরি নং', 'ডায়েরির তারিখ');
        if (!dNo) dNo = parts.no;
        if (!dDate) dDate = parts.date;
      }
    }

    if (dNo || dDate) {
      const existingParts = splitCombinedInfo(updatedSe.workpaperNoDate || '', 'ডায়েরি নং', 'ডায়েরির তারিখ');
      const finalDNo = dNo || existingParts.no;
      const finalDDate = dDate || existingParts.date;

      if (finalDNo || finalDDate) {
        const targetDiaryStr = `ডায়েরি নং- ${toBengaliDigits(finalDNo)}, ডায়েরির তারিখ- ${toBengaliDigits(finalDDate)}`;
        if (updatedSe.workpaperNoDate !== targetDiaryStr) {
          updatedSe.workpaperNoDate = targetDiaryStr;
          changed = true;
        }
      }
    }

    // 4. Sync Archive No
    if (corr.archiveNo && updatedSe.archiveNo !== corr.archiveNo) {
      updatedSe.archiveNo = corr.archiveNo;
      changed = true;
    }

    if (changed) {
      hasChanges = true;
      return updatedSe;
    }

    return se;
  });

  return { updatedSettlements, hasChanges };
};
