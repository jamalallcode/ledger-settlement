import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Search, 
  X, 
  ChevronDown, 
  Check, 
  FileSpreadsheet, 
  Calendar, 
  Filter, 
  Mail,
  Building2,
  RotateCcw,
  Copy,
  FileText
} from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format as dateFnsFormat } from 'date-fns';
import { isSFI, isNonSFI } from '../utils/branchUtils';
import { MINISTRY_ENTITY_MAP } from '../constants';

interface BsrReceivedReturnProps {
  correspondenceEntries: any[];
  settlementEntries?: any[];
  activeCycle?: any;
  ministryGroups?: string[];
  onBack?: () => void;
  IDBadge?: React.FC<{ id: string }>;
  showFilters?: boolean;
  isLayoutEditable?: boolean;
  initialLetterType?: string;
}

const BENGALI_MONTHS = [
  { index: 0, name: 'জানুয়ারি' },
  { index: 1, name: 'ফেব্রুয়ারি' },
  { index: 2, name: 'মার্চ' },
  { index: 3, name: 'এপ্রিল' },
  { index: 4, name: 'মে' },
  { index: 5, name: 'জুন' },
  { index: 6, name: 'জুলাই' },
  { index: 7, name: 'আগস্ট' },
  { index: 8, name: 'সেপ্টেম্বর' },
  { index: 9, name: 'অক্টোবর' },
  { index: 10, name: 'নভেম্বর' },
  { index: 11, name: 'ডিসেম্বর' },
];

const parseDateSafe = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const cleanStr = toEnglishDigits(String(dateStr)).trim();
  if (!cleanStr) return null;

  const datePortion = cleanStr.split('T')[0].split(' ')[0].trim();
  const parts = datePortion.split(/[-/.]/);
  if (parts.length === 3) {
    let d: number, m: number, y: number;
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
    }
    const fullY = y < 100 ? 2000 + y : y;
    const date = new Date(fullY, m, d);
    if (!isNaN(date.getTime())) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  }
  const fallback = new Date(datePortion);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  return null;
};

const formatDateDMY = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  let d: Date | null = null;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = parseDateSafe(dateInput);
  }
  if (!d || isNaN(d.getTime())) {
    const raw = String(dateInput).trim();
    return raw ? toBengaliDigits(raw) : '-';
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear().toString();
  return `${day}/${month}/${year}`;
};

const formatDateShortDMY = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  let d: Date | null = null;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = parseDateSafe(dateInput);
  }
  if (!d || isNaN(d.getTime())) {
    const raw = String(dateInput).trim();
    return raw ? toBengaliDigits(raw) : '-';
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(year)}`;
};

const robustNormalize = (str: string = '') => {
  return str
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u09af\u09bc/g, '\u09df') // য়
    .replace(/\u09a1\u09bc/g, '\u09dc') // ড়
    .replace(/\u09a2\u09bc/g, '\u09dd') // ঢ়
    .replace(/\s+/g, ' ')
    .trim();
};

const getLetterTypeCategory = (entry: any): string => {
  const lTypeRaw = (entry.letterType || entry.meetingType || entry.type || '').trim();
  const norm = robustNormalize(lTypeRaw);
  const descNorm = robustNormalize(entry.description || '');

  if (norm.includes('বিএসআর') || norm.toLowerCase().includes('bsr') || (!norm && !descNorm.includes('সভা') && !descNorm.includes('মিলিক'))) {
    return 'বিএসআর';
  }
  if ((norm.includes('দ্বি') || norm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বি-সভা')) && 
      (norm.includes('কার্যবিবরন') || descNorm.includes('কার্যবিবরন') || norm.includes('বিবরণী') || descNorm.includes('বিবরণী'))) {
    return 'দ্বি-সভা (কার্যবিবরনী)';
  }
  if ((norm.includes('দ্বি') || norm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বি-সভা')) && 
      (norm.includes('কার্যপত্র') || descNorm.includes('কার্যপত্র'))) {
    return 'দ্বি-সভা (কার্যপত্র)';
  }
  if ((norm.includes('ত্রি') || norm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রি-সভা')) && 
      (norm.includes('কার্যবিবরন') || descNorm.includes('কার্যবিবরন') || norm.includes('বিবরণী') || descNorm.includes('বিবরণী'))) {
    return 'ত্রি-সভা (কার্যবিবরনী)';
  }
  if ((norm.includes('ত্রি') || norm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রি-সভা')) && 
      (norm.includes('কার্যপত্র') || descNorm.includes('কার্যপত্র'))) {
    return 'ত্রি-সভা (কার্যপত্র)';
  }
  if (norm.includes('মিলিক') || norm.includes('মিলক') || norm.includes('reconciliation') || descNorm.includes('মিলিক') || descNorm.includes('মিলক')) {
    return 'মিলিকরন';
  }
  return 'অন্যান্য পত্র';
};

const getEntryMinistry = (entry: any): string => {
  if (entry.ministryName && entry.ministryName.trim() && entry.ministryName.trim() !== '-') {
    return entry.ministryName.trim();
  }
  // Lookup by entityName in MINISTRY_ENTITY_MAP
  const ent = (entry.entityName || '').trim();
  if (ent) {
    for (const [min, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      if (entities.some(e => e.includes(ent) || ent.includes(e))) {
        return min;
      }
    }
  }
  // Lookup by description in MINISTRY_ENTITY_MAP
  const desc = (entry.description || '').trim();
  if (desc) {
    for (const [min, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      if (entities.some(e => desc.includes(e))) {
        return min;
      }
    }
  }
  return 'অন্যান্য মন্ত্রণালয়';
};

const KNOWN_ENTITIES_LIST = [
  'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লি.',
  'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক পিএলসি',
  'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক',
  'ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ',
  'আইসিবি',
  'আনসার ভিডিপি উন্নয়ন ব্যাংক লি.',
  'আনসার ভিডিপি উন্নয়ন ব্যাংক',
  'সাধারণ বীমা কর্পোরেশন',
  'জীবন বীমা কর্পোরেশন',
  'গৃহনির্মাণ ঋণদান সংস্থা',
  'প্রবাসী কল্যাণ ব্যাংক',
  'বাংলাদেশ কৃষি ব্যাংক',
  'রূপালী ব্যাংক পিএলসি',
  'রূপালী ব্যাংক লি.',
  'রূপালী ব্যাংক লিমিটেড',
  'রূপালী ব্যাংক',
  'সোনালী ব্যাংক পিএলসি',
  'সোনালী ব্যাংক লি.',
  'সোনালী ব্যাংক লিমিটেড',
  'সোনালী ব্যাংক',
  'জনতা ব্যাংক পিএলসি',
  'জনতা ব্যাংক লি.',
  'জনতা ব্যাংক লিমিটেড',
  'জনতা ব্যাংক',
  'অগ্রণী ব্যাংক পিএলসি',
  'অগ্রণী ব্যাংক লি.',
  'অগ্রণী ব্যাংক লিমিটেড',
  'অগ্রণী ব্যাংক',
  'বেসিক ব্যাংক লি.',
  'বেসিক ব্যাংক লিমিটেড',
  'বেসিক ব্যাংক',
  'বাংলাদেশ ব্যাংক',
  'কর্মসংস্থান ব্যাংক',
  'বাংলাদেশ চিনি ও খাদ্য শিল্প কর্পোরেশন',
  'চিনি ও খাদ্য সংস্থা',
  'ক্ষুদ্র ও কুটির শিল্প',
  'বিসিক',
  'বিটাক',
  'রসায়ন শিল্প',
  'বিসিআইসি',
  'বাংলাদেশ বিমান',
  'বিমান বাংলাদেশ এয়ারলাইন্স',
  'পর্যটন কর্পোরেশন',
  'টিসিবি',
  'আমদানি ও রপ্তানি',
  'পাটকল সংস্থা',
  'পাট সংস্থা',
  'বিজেএমসি',
  'বস্ত্রকল সংস্থা',
  'বিটিএমসি',
  'রেশম বোর্ড'
];

const KNOWN_MILLS_LIST = [
  'দি ক্রিসেন্ট জুট মিলস লিমিটেড',
  'দি ক্রিসেন্ট জুট মিলস্ লিমিটেড',
  'দি ক্রিসেন্ট জুট মিলস্ লিঃ',
  'দি ক্রিসেন্ট জুট মিলস লিঃ',
  'দি ক্রিসেন্ট জুট মিলস',
  'দি ক্রিসেন্ট জুট মিল',
  'দৌলতপুর জুট মিলস লিমিটেড',
  'দৌলতপুর জুট মিলস',
  'দৌলতপুর জুট মিল',
  'ইস্টার্ন জুট মিলস লিমিটেড',
  'ইস্টার্ন জুট মিলস',
  'ইস্টার্ন জুট মিল',
  'আলীম জুট মিলস লিমিটেড',
  'আলীম জুট মিলস',
  'আলীম জুট মিল',
  'স্টার সুট মিলস লিমিটেড',
  'স্টার জুট মিলস লিমিটেড',
  'স্টার জুট মিলস',
  'স্টার জুট মিল',
  'যশোর জুট মিলস লিমিটেড',
  'যশোর জুট মিলস',
  'যশোর জুট মিল',
  'প্লাটিনাম জুট মিলস লিমিটেড',
  'প্লাটিনাম জুট মিলস',
  'প্লাটিনাম জুট মিল',
  'প্লাটিনাম জুবিলী জুট মিলস',
  'প্লাটিনাম জুবিলী জুট মিল',
  'ক্রিসেন্ট জুট মিলস লিমিটেড',
  'ক্রিসেন্ট জুট মিলস্ লিমিটেড',
  'ক্রিসেন্ট জুট মিলস্ লিঃ',
  'ক্রিসেন্ট জুট মিলস লিঃ',
  'ক্রিসেন্ট জুট মিলস',
  'ক্রিসেন্ট জুট মিল',
  'কার্পেটিং জুট মিলস লিমিটেড',
  'কার্পেটিং জুট মিলস',
  'কার্পেটিং জুট মিল',
  'জাতীয় পাটকল',
  'জনতা জুট মিলস',
  'আদমজী জুট মিলস',
  'রাজশাহী জুট মিলস',
  'কুষ্টিয়া সুগার মিলস',
  'মোবারকগঞ্জ সুগার মিলস'
];

const BANK_OR_FI_NAMES = [
  'বাংলাদেশ ڈویلপমেন্ট ব্যাংক লি.',
  'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক পিএলসি',
  'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক',
  'ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ',
  'আইসিবি',
  'আনসার ভিডিপি উন্নয়ন ব্যাংক লি.',
  'আনসার ভিডিপি উন্নয়ন ব্যাংক',
  'সাধারণ বীমা কর্পোরেশন',
  'জীবন বীমা কর্পোরেশন',
  'গৃহনির্মাণ ঋণদান সংস্থা',
  'প্রবাসী কল্যাণ ব্যাংক',
  'বাংলাদেশ কৃষি ব্যাংক',
  'রূপালী ব্যাংক পিএলসি',
  'রূপালী ব্যাংক লি.',
  'রূপালী ব্যাংক লিমিটেড',
  'রূপালী ব্যাংক',
  'সোনালী ব্যাংক পিএলসি',
  'সোনালী ব্যাংক লি.',
  'সোনালী ব্যাংক লিমিটেড',
  'সোনালী ব্যাংক',
  'জনতা ব্যাংক পিএলসি',
  'জনতা ব্যাংক লি.',
  'জনতা ব্যাংক লিমিটেড',
  'জনতা ব্যাংক',
  'অগ্রণী ব্যাংক পিএলসি',
  'অগ্রণী ব্যাংক লি.',
  'অগ্রণী ব্যাংক লিমিটেড',
  'অগ্রণী ব্যাংক',
  'বেসিক ব্যাংক লি.',
  'বেসিক ব্যাংক লিমিটেড',
  'বেসিক ব্যাংক',
  'বাংলাদেশ ব্যাংক',
  'কর্মসংস্থান ব্যাংক'
];

const BANK_ACRONYM_MAP: Record<string, string> = {
  'বিকেবি': 'বাংলাদেশ কৃষি ব্যাংক',
  'বি.কে.বি': 'বাংলাদেশ কৃষি ব্যাংক',
  'বি.কে.বি.': 'বাংলাদেশ কৃষি ব্যাংক',
  'bkb': 'বাংলাদেশ কৃষি ব্যাংক',
  'কৃষি ব্যাংক': 'বাংলাদেশ কৃষি ব্যাংক',
  'রাকাব': 'রাজশাহী কৃষি উন্নয়ন ব্যাংক',
  'রা.কা.ব': 'রাজশাহী কৃষি উন্নয়ন ব্যাংক',
  'rakub': 'রাজশাহী কৃষি উন্নয়ন ব্যাংক',
  'বিডিবিএল': 'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক পিএলসি',
  'বি.ডি.বি.এল': 'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক পিএলসি',
  'bdbl': 'বাংলাদেশ ডেভেলপমেন্ট ব্যাংক পিএলসি',
  'আইসিবি': 'ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ',
  'icb': 'ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ',
  'পিকেবি': 'প্রবাসী কল্যাণ ব্যাংক',
  'pkb': 'প্রবাসী কল্যাণ ব্যাংক',
  'বেসিক ব্যাংক': 'বেসিক ব্যাংক লি.',
  'বেসিক': 'বেসিক ব্যাংক লি.',
  'basic': 'বেসিক ব্যাংক লি.',
  'সোনালী ব্যাংক': 'সোনালী ব্যাংক পিএলসি',
  'এসবি': 'সোনালী ব্যাংক পিএলসি',
  'রূপালী ব্যাংক': 'রূপালী ব্যাংক পিএলসি',
  'রুপালী ব্যাংক': 'রূপালী ব্যাংক পিএলসি',
  'আরবি': 'রূপালী ব্যাংক পিএলসি',
  'জনতা ব্যাংক': 'জনতা ব্যাংক পিএলসি',
  'জেবি': 'জনতা ব্যাংক পিএলসি',
  'অগ্রণী ব্যাংক': 'অগ্রণী ব্যাংক পিএলসি',
  'অগ্রনী ব্যাংক': 'অগ্রণী ব্যাংক পিএলসি',
  'এবি': 'অগ্রণী ব্যাংক পিএলসি'
};

const getAuditEntityAndBranch = (entry: any, settlementEntries: any[] = []): { entityLine: string; branchLine: string; lines: string[] } => {
  let ent = (entry.entityName || '').trim();
  let yr = (entry.auditYear || '').trim();
  let branch = (entry.branchName || entry.branch || '').trim();
  const desc = (entry.description || '').trim();
  const ministry = (entry.ministryName || entry.ministry || '').trim();

  // ১. পত্রের বিবরণ (description)-এ যদি অডিট সাল থাকে (যেমন: (২০০৫-১৩)), তবে সেটিই এই পত্রের মূল অডিট সাল
  const yrInDesc = desc.match(/\(([০-৯0-9\s\-–—/হতেথেকেto]+[০-৯0-9]+)\)/);
  if (yrInDesc) {
    yr = yrInDesc[1].trim();
  } else if (!yr) {
    const fullText = `${desc} ${branch} ${ent}`;
    const yrMatch = fullText.match(/\(([০-৯0-9\s\-–—/হতেথেকেto]+[০-৯0-9]+)\)/);
    if (yrMatch) {
      yr = yrMatch[1].trim();
    }
  }

  // ২. settlementEntries হতে তথ্য নেওয়া যাবে শুধুমাত্র যদি বিবরণ বা মূল তথ্য অনুপস্থিত থাকে এবং নির্দিষ্ট আইডি মিল থাকে
  // কখনোই ডায়েরি নং একা দিয়ে তথ্য ওভাররাইট করা যাবে না (কারণ ডায়েরি নং প্রতি বছর পুনরাবৃত্তি হয় এবং অন্য পত্রের তথ্য ঢুকিয়ে দেয়)
  if (!desc && (!branch || !ent || !yr) && settlementEntries && settlementEntries.length > 0) {
    const entryLetterDigits = toEnglishDigits(entry.letterNo || '').replace(/\D/g, '');
    const entryDiaryDigits = toEnglishDigits(entry.diaryNo || '').replace(/\D/g, '');

    const matched = settlementEntries.find(s => {
      if (!s) return false;
      if (s.id && (s.id === entry.correspondenceId || s.correspondenceId === entry.id || s.letterId === entry.id)) return true;
      if (entry.id && s.correspondenceId === entry.id) return true;
      if (entry.settlementId && s.id === entry.settlementId) return true;
      
      const sLetterDigits = toEnglishDigits(s.letterNoDate || s.letterNo || '').replace(/\D/g, '');
      const sDiaryDigits = toEnglishDigits(s.diaryNo || '').replace(/\D/g, '');
      if (entryLetterDigits && sLetterDigits && entryDiaryDigits && sDiaryDigits) {
        if (entryLetterDigits === sLetterDigits && entryDiaryDigits === sDiaryDigits) {
          return true;
        }
      }
      return false;
    });

    if (matched) {
      if (!ent && matched.entityName) ent = matched.entityName.trim();
      if (!yr && matched.auditYear) yr = matched.auditYear.trim();
      if (!branch && matched.branchName) branch = matched.branchName.trim();
    }
  }

  // ৩. Build full mills list (built-in + localStorage custom mills)
  const millsList = [...KNOWN_MILLS_LIST];
  try {
    const savedCustom = localStorage.getItem('custom_patkol_mills');
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      if (Array.isArray(parsed)) {
        parsed.forEach((m: any) => {
          if (m && typeof m === 'string' && !millsList.includes(m.trim())) {
            millsList.unshift(m.trim());
          }
        });
      }
    }
  } catch (_) {}

  // Clean year string and format to Bengali digits
  const cleanYr = yr.replace(/^\(/, '').replace(/\)$/, '').trim();
  const bengaliYr = cleanYr ? toBengaliDigits(cleanYr) : '';
  const yearSuffix = bengaliYr ? ` (${bengaliYr})` : '';

  // 4. Check whether this is a Jute/Patkol entry
  const isDefinitelyBank = 
    ministry.includes('আর্থিক প্রতিষ্ঠান') || 
    ministry.includes('অর্থ বিভাগ') ||
    Object.keys(BANK_ACRONYM_MAP).some(k => 
      new RegExp(`(?:^|[\\s,，(])${k.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:$|[\\s,，)])`, 'i').test(`${desc} ${ent} ${branch}`)
    ) ||
    BANK_OR_FI_NAMES.some(b => ent.includes(b) || desc.includes(b));

  const isJuteOrPatkol = !isDefinitelyBank && (
    ministry.includes('পাট') || 
    ministry.includes('বস্ত্র') || 
    ent.includes('পাট') || 
    ent.includes('বিজেএমসি') || 
    millsList.some(m => desc.includes(m) || ent.includes(m) || branch.includes(m)) ||
    /(?:জুট\s*মিল|টেক্সটাইল\s*মিল|পাটকল)/i.test(`${desc} ${branch} ${ent}`)
  );

  if (isJuteOrPatkol) {
    // ১ম লাইন: এনটিটি (চিঠিপত্র এন্ট্রিতে পাটকল সংস্থা থাকলে তা পরিবর্তিত হয়ে "বিজেএমসি", পাট সংস্থা থাকলে "পাট সংস্থা")
    let line1Entity = 'বিজেএমসি';
    if (ent.includes('পাট সংস্থা')) {
      line1Entity = 'পাট সংস্থা';
    } else if (ent && !ent.includes('পাটকল সংস্থা')) {
      line1Entity = ent.split(',')[0].trim() || 'বিজেএমসি';
    }
    // যদি পাটকল সংস্থা বা বিজেএমসি হয়
    if (line1Entity === 'পাটকল সংস্থা') line1Entity = 'বিজেএমসি';

    // ২য় লাইন: মিলের নাম + নিরীক্ষা সাল (যেমন: দি ক্রিসেন্ট জুট মিলস লিমিটেড (২০১৮-১৯),)
    const sortedMills = [...millsList].sort((a, b) => b.length - a.length);
    let foundMill = sortedMills.find(m => desc.includes(m) || ent.includes(m) || branch.includes(m));
    if (!foundMill) {
      const millMatch = (desc || branch || ent).match(/((?:দি\s+|মেসার্স\s+)?[^\s,，()]+(?:\s+[^\s,，()]+)?\s+(?:জুট মিল(?:স|স্)?(?: লিমিটেড| লিঃ)?|টেক্সটাইল মিল(?:স|স্)?|সুগার মিল(?:স|স্)?))/);
      if (millMatch) {
        foundMill = millMatch[1].trim();
      }
    }
    // যদি মূল টেক্সটে মিলের নামের পূর্বে "দি" বা "মেসার্স" থাকে (যেমন: "দি ক্রিসেন্ট জুট মিলস লিমিটেড"), তবে সেটিও মিলের নামের অবিচ্ছেদ্য অংশ হিসেবে যুক্ত হবে
    if (foundMill && !foundMill.startsWith('দি ') && !foundMill.startsWith('মেসার্স ')) {
      const srcText = `${desc} ${branch} ${ent}`;
      const prefixRegex = new RegExp(`(?:^|\\s)(দি|মেসার্স)\\s+${foundMill.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'i');
      const prefixMatch = srcText.match(prefixRegex);
      if (prefixMatch) {
        foundMill = `${prefixMatch[1]} ${foundMill}`;
      }
    }
    const millName = foundMill || (branch && branch !== ent ? branch : 'জুট মিলস');

    // ৩য় লাইন: মিলের পরে যদি কোন লেখা থাকে কেবল সেটিই আসবে। মিলের পরে যদি কোন লেখা না থাকে তাহলে খালিই থাকবে।
    // মিলের নাম বা অডিট সাল কোনোভাবেই ৩য় লাইনে ২বার আসবে না।
    let rawRemaining = `${desc} ${branch && branch !== desc ? branch : ''}`.trim();

    // ১. অডিট সাল সংক্রান্ত অংশ বাদ দেওয়া
    rawRemaining = rawRemaining
      .replace(/\s*\([০-৯0-9\s\-–—/হতেথেকেto]+[০-৯0-9]+\)/g, ' ')
      .trim();
    if (cleanYr) {
      rawRemaining = rawRemaining
        .replace(new RegExp(`\\s*\\(?${cleanYr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)?`, 'g'), ' ')
        .trim();
    }
    if (bengaliYr) {
      rawRemaining = rawRemaining
        .replace(new RegExp(`\\s*\\(?${bengaliYr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)?`, 'g'), ' ')
        .trim();
    }

    // ২. এনটিটি বা মন্ত্রণালয় সম্পর্কিত শব্দ বাদ দেওয়া
    rawRemaining = rawRemaining
      .replace(/(?:বাংলাদেশ\s+)?পাটকল\s+(?:সংস্থা|কর্পোরেশন)/gi, ' ')
      .replace(/বিজেএমসি(?:['’]র|র)?/gi, ' ')
      .replace(/পাট\s+সংস্থা/gi, ' ')
      .replace(/বস্ত্র\s+ও\s+পাট\s+মন্ত্রণালয়/gi, ' ')
      .trim();

    // ৩. মিলের নাম বা মিলের অংশগুলো ৩য় লাইন থেকে বাদ দেওয়া (যেন কোনো মিলের নাম ২বার না আসে)
    if (foundMill) {
      rawRemaining = rawRemaining
        .replace(new RegExp(foundMill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
        .trim();
    }
    if (millName) {
      rawRemaining = rawRemaining
        .replace(new RegExp(millName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
        .trim();
    }
    sortedMills.forEach(m => {
      if (rawRemaining.includes(m)) {
        rawRemaining = rawRemaining.replace(new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ').trim();
      }
    });

    // অতিরিক্ত সাধারণ মিল শব্দ ও উপসর্গ থাকলে পরিষ্কার করা
    rawRemaining = rawRemaining
      .replace(/(?:দি\s+|মেসার্স\s+)?(?:[^\s,，()]+(?:\s+[^\s,，()]+)?\s+)?(?:জুট মিল(?:স|স্)?(?: লিমিটেড| লিঃ)?|টেক্সটাইল মিল(?:স|স্)?|সুগার মিল(?:স|স্)?)/gi, ' ')
      .replace(/\b(?:জুট মিলস লিমিটেড|জুট মিলস্ লিমিটেড|জুট মিলস|জুট মিল|লিমিটেড|লিঃ|পিএলসি|মেসার্স|দি)\b/gi, ' ')
      .replace(/^(?:দি|মেসার্স)\s+/gi, ' ')
      .replace(/\s+(?:দি|মেসার্স)$/gi, ' ')
      .trim();

    // বিরামচিহ্ন পরিষ্কার করা
    rawRemaining = rawRemaining
      .replace(/^[,\s।\-–—:;，()]+/g, '')
      .replace(/[,\s।\-–—:;，()]+$/g, '')
      .trim();

    // যদি অবশিষ্ট অংশ শুধু মিলের নাম, এনটিটি, 'দি', 'মেসার্স' বা ফাঁকা হয় তবে ৩য় লাইন খালি থাকবে
    if (
      rawRemaining === millName || 
      rawRemaining === line1Entity || 
      rawRemaining === 'জুট মিলস' || 
      rawRemaining === 'দি' ||
      rawRemaining === 'মেসার্স' ||
      rawRemaining.length <= 2
    ) {
      rawRemaining = '';
    }

    const line3Desc = rawRemaining;
    const line3 = line3Desc ? `${line3Desc}${yearSuffix}` : (yearSuffix ? yearSuffix.trim() : '');

    const lines: string[] = [];
    lines.push(`${line1Entity},`);
    if (line3) {
      lines.push(`${millName},`);
      lines.push(line3);
    } else {
      lines.push(millName);
    }

    return {
      entityLine: lines[0] || '',
      branchLine: lines.slice(1).join(' '),
      lines
    };
  }

  // 5. Check whether this is a Bank / Financial Institution entry
  const isBankOrFI = 
    ministry.includes('আর্থিক প্রতিষ্ঠান') || 
    ministry.includes('অর্থ বিভাগ') ||
    Object.keys(BANK_ACRONYM_MAP).some(k => 
      new RegExp(`(?:^|[\\s,，(])${k.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:$|[\\s,，)])`, 'i').test(`${desc} ${ent} ${branch}`)
    ) ||
    BANK_OR_FI_NAMES.some(b => ent.includes(b) || desc.includes(b) || branch.includes(b));

  if (isBankOrFI) {
    // ১ম লাইন: আর্থিক প্রতিষ্ঠান,
    const line1 = 'আর্থিক প্রতিষ্ঠান,';

    // ২য় লাইন: ব্যাংকের নাম ও নিরীক্ষা সাল (যেমন: রূপালী ব্যাংক পিএলসি (২০০৫-১২ হতে ২০১৭-১৮),)
    const sortedBankNames = [...BANK_OR_FI_NAMES].sort((a, b) => b.length - a.length);
    let matchedBank = sortedBankNames.find(b => ent.includes(b) || desc.includes(b) || branch.includes(b));

    // Check bank acronyms / abbreviations (e.g. বিকেবি -> বাংলাদেশ কৃষি ব্যাংক)
    if (!matchedBank) {
      const srcText = `${desc} ${ent} ${branch}`;
      for (const [acronym, fullName] of Object.entries(BANK_ACRONYM_MAP)) {
        const regex = new RegExp(`(?:^|[\\s,，(])${acronym.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:$|[\\s,，)])`, 'i');
        if (regex.test(srcText)) {
          matchedBank = fullName;
          break;
        }
      }
    }
    if (!matchedBank) {
      matchedBank = ent.split(',')[0].trim() || 'ব্যাংক';
    }

    // ৩য় লাইন: সংশ্লিষ্ট শাখার নাম (যেমন: বিভাগীয় কাযালয়, বরিশাল এর আওতাধীন গৌরনদী শাখা, বরিশাল)
    // ব্যাংকের নাম বা সাল ৩য় লাইনে ২বার আসবে না
    let rawBranch = (branch || '').trim();
    if (!rawBranch && ent && ent !== matchedBank && !BANK_OR_FI_NAMES.some(b => ent === b)) {
      rawBranch = ent.replace(matchedBank, '').trim();
    }
    if (!rawBranch && desc && desc !== matchedBank) {
      rawBranch = desc;
    }

    // সাল বাদ দেওয়া
    rawBranch = rawBranch
      .replace(/\s*\([০-৯0-9\s\-–—/হতেথেকেto]+[০-৯0-9]+\)/g, ' ')
      .trim();
    if (cleanYr) {
      rawBranch = rawBranch
        .replace(new RegExp(`\\s*\\(?${cleanYr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)?`, 'g'), ' ')
        .trim();
    }
    if (bengaliYr) {
      rawBranch = rawBranch
        .replace(new RegExp(`\\s*\\(?${bengaliYr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)?`, 'g'), ' ')
        .trim();
    }

    // ব্যাংকের নাম ও আর্থিক প্রতিষ্ঠান সংক্রান্ত শব্দ মুছে ফেলা
    if (matchedBank) {
      rawBranch = rawBranch
        .replace(new RegExp(matchedBank.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
        .trim();
    }
    sortedBankNames.forEach(b => {
      if (rawBranch.includes(b)) {
        rawBranch = rawBranch.replace(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ').trim();
      }
    });

    // ব্যাংক এক্রোনিম (যেমন: বিকেবি) মুছে ফেলা
    Object.keys(BANK_ACRONYM_MAP).forEach(acronym => {
      const regex = new RegExp(`(?:^|[\\s,，(])${acronym.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:$|[\\s,，)])`, 'gi');
      rawBranch = rawBranch.replace(regex, ' ').trim();
    });

    rawBranch = rawBranch
      .replace(/(?:আর্থিক\s+প্রতিষ্ঠান|ব্যাংক\s+ও\s+আর্থিক\s+প্রতিষ্ঠান|অর্থ\s+মন্ত্রণালয়)/gi, ' ')
      .replace(/\b(?:লিমিটেড|লিঃ|পিএলসি)\b/gi, ' ')
      .replace(/^[,\s।\-–—:;，()]+/g, '')
      .replace(/[,\s।\-–—:;，()]+$/g, '')
      .replace(/^এর\s+/, '')
      .trim();

    if (rawBranch === matchedBank || rawBranch === 'আর্থিক প্রতিষ্ঠান' || rawBranch.length <= 1) {
      rawBranch = '';
    }

    const branchText = rawBranch;
    const line3 = branchText ? `${branchText}${yearSuffix}` : (yearSuffix ? yearSuffix.trim() : '');

    const lines: string[] = [];
    lines.push(line1);
    if (line3) {
      lines.push(`${matchedBank},`);
      lines.push(line3);
    } else {
      lines.push(matchedBank);
    }

    return {
      entityLine: lines[0] || '',
      branchLine: lines.slice(1).join(' '),
      lines
    };
  }

  // 6. General Entities (অন্যান্য সংস্থা/মন্ত্রণালয়)
  let generalEntity = ent.split(',')[0].trim() || ministry || 'প্রতিষ্ঠান';
  let generalBranch = branch || ent.replace(generalEntity, '').replace(/^[,，\-–\s]+/, '').trim() || (desc !== generalEntity ? desc : '');
  
  if (cleanYr && generalBranch) {
    generalBranch = generalBranch
      .replace(new RegExp(`\\s*\\(${cleanYr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), ' ')
      .replace(new RegExp(`\\s*\\(${bengaliYr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), ' ')
      .replace(/\s*\([০-৯0-9\s\-–—/হতেথেকেto]+[০-৯0-9]+\)/g, ' ')
      .trim();
  }
  if (generalEntity && generalBranch) {
    generalBranch = generalBranch.replace(new RegExp(generalEntity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ').trim();
  }
  generalBranch = generalBranch.replace(/^[,\s।\-–—:;，()]+/g, '').replace(/[,\s।\-–—:;，()]+$/g, '').trim();

  if (generalBranch === generalEntity || generalBranch.length <= 1) {
    generalBranch = '';
  }

  const lines: string[] = [];
  if (generalBranch) {
    lines.push(`${generalEntity},`);
    lines.push(`${generalBranch}${yearSuffix}`);
  } else {
    lines.push(`${generalEntity}${yearSuffix}`);
  }

  return {
    entityLine: lines[0] || '',
    branchLine: lines.slice(1).join(' '),
    lines
  };
};

export const BsrReceivedReturn: React.FC<BsrReceivedReturnProps> = ({
  correspondenceEntries = [],
  settlementEntries = [],
  activeCycle,
  onBack,
  IDBadge,
  initialLetterType,
}) => {
  // Default branch filter is 'নন এসএফআই' as shown in the user's reference image
  const [filterBranch, setFilterBranch] = useState<'নন এসএফআই' | 'এসএফআই' | 'সকল'>('নন এসএফআই');
  const [filterLetterType, setFilterLetterType] = useState<string>(initialLetterType || 'বিএসআর');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dropdown states
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isLetterTypeOpen, setIsLetterTypeOpen] = useState(false);
  const [isMonthlyReportDropdownOpen, setIsMonthlyReportDropdownOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  // Monthly Report Mode & Selected Types
  const [isMonthlyReportMode, setIsMonthlyReportMode] = useState(false);
  const [monthlyReportSelectedTypes, setMonthlyReportSelectedTypes] = useState<string[]>(() => {
    return ['বিএসআর', 'দ্বি-সভা (কার্যপত্র)', 'দ্বি-সভা (কার্যবিবরনী)'];
  });

  const branchRef = useRef<HTMLDivElement>(null);
  const letterTypeRef = useRef<HTMLDivElement>(null);
  const monthlyReportRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Initialize start & end date based on activeCycle or previous 1 month
  const [startDate, setStartDate] = useState<Date>(() => {
    if (activeCycle?.start) {
      const d = parseDateSafe(activeCycle.start);
      if (d) return d;
    }
    const now = new Date();
    // Default to 16th of previous month
    return new Date(now.getFullYear(), now.getMonth() - 1, 16);
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    if (activeCycle?.end) {
      const d = parseDateSafe(activeCycle.end);
      if (d) return d;
    }
    const now = new Date();
    // Default to 15th of current month
    return new Date(now.getFullYear(), now.getMonth(), 15);
  });

  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date(startDate));

  // Sync with activeCycle if it changes
  useEffect(() => {
    if (activeCycle?.start && activeCycle?.end) {
      const s = parseDateSafe(activeCycle.start);
      const e = parseDateSafe(activeCycle.end);
      if (s && e) {
        setStartDate(s);
        setEndDate(e);
        setCurrentViewDate(new Date(s));
      }
    }
  }, [activeCycle]);

  // Listen for navbar back button event
  useEffect(() => {
    const handleAppGoBack = (e: Event) => {
      if (onBack) {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('app:goback', handleAppGoBack);
    return () => window.removeEventListener('app:goback', handleAppGoBack);
  }, [onBack]);

  // Measure and synchronize sticky header offsets smoothly without jitter
  useEffect(() => {
    const updateHeaderStickyOffsets = () => {
      const table = tableRef.current;
      if (!table) return;
      const tr1 = table.querySelector('thead tr:nth-child(1)') as HTMLElement | null;
      const tr2 = table.querySelector('thead tr:nth-child(2)') as HTMLElement | null;
      if (!tr1 || !tr2) return;

      const colSpanTh = tr1.querySelector('th[colspan]') as HTMLElement | null;
      if (colSpanTh) {
        // ৩ সারির হেডার (মাসিক প্রতিবেদন):
        // সারি ১-এ 'গৃহীত কার্যক্রম' (colSpan) এর নিজস্ব উচ্চতা হচ্ছে সারি ২-এর স্টিকি টপ (যাতে নিচে কোনো ফাঁকা না থাকে)
        const r1SubHeight = Math.round(colSpanTh.getBoundingClientRect().height);
        const tr2Th = tr2.querySelector('th') as HTMLElement | null;
        const r2Height = tr2Th ? Math.round(tr2Th.getBoundingClientRect().height) : Math.round(tr2.getBoundingClientRect().height);

        if (r1SubHeight > 0) {
          table.style.setProperty('--th-r2-top', `${r1SubHeight}px`);
        }
        if (r1SubHeight > 0 && r2Height > 0) {
          table.style.setProperty('--th-r3-top', `${r1SubHeight + r2Height}px`);
        }
      } else {
        // ২ সারির হেডার (স্ট্যান্ডার্ড ভিউ):
        const h1 = Math.round(tr1.getBoundingClientRect().height);
        if (h1 > 0) {
          table.style.setProperty('--th-r2-top', `${h1}px`);
        }
      }
    };

    updateHeaderStickyOffsets();
    const timer = setTimeout(updateHeaderStickyOffsets, 60);
    window.addEventListener('resize', updateHeaderStickyOffsets);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderStickyOffsets);
    };
  }, [isMonthlyReportMode, filterBranch, filterLetterType]);

  useEffect(() => {
    if (initialLetterType) {
      setFilterLetterType(initialLetterType);
    }
  }, [initialLetterType]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
      if (letterTypeRef.current && !letterTypeRef.current.contains(e.target as Node)) {
        setIsLetterTypeOpen(false);
      }
      if (monthlyReportRef.current && !monthlyReportRef.current.contains(e.target as Node)) {
        setIsMonthlyReportDropdownOpen(false);
      }
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Letter Type Options based on selected Branch:
  // নন এসএফআই: “বিএসআর”, “দ্বি-সভা (কার্যপত্র)”, “দ্বি-সভা (কার্যবিবরনী)”, “অন্যান্য”, “মিলিকরন”, “সকল”
  // এসএফআই: “বিএসআর”, “ত্রি-সভা (কার্যপত্র)”, “ত্রি-সভা (কার্যবিবরনী)”, “অন্যান্য”, “মিলিকরন”, “সকল”
  const letterTypeOptions = useMemo(() => {
    if (filterBranch === 'নন এসএফআই') {
      return [
        'বিএসআর',
        'দ্বি-সভা (কার্যপত্র)',
        'দ্বি-সভা (কার্যবিবরনী)',
        'অন্যান্য',
        'মিলিকরন',
        'সকল'
      ];
    }
    if (filterBranch === 'এসএফআই') {
      return [
        'বিএসআর',
        'ত্রি-সভা (কার্যপত্র)',
        'ত্রি-সভা (কার্যবিবরনী)',
        'অন্যান্য',
        'মিলিকরন',
        'সকল'
      ];
    }
    return [
      'বিএসআর',
      'দ্বি-সভা (কার্যপত্র)',
      'দ্বি-সভা (কার্যবিবরনী)',
      'ত্রি-সভা (কার্যপত্র)',
      'ত্রি-সভা (কার্যবিবরনী)',
      'অন্যান্য',
      'মিলিকরন',
      'সকল'
    ];
  }, [filterBranch]);

  // মাসিক প্রতিবেদনের জন্য শাখা অনুযায়ী প্রযোজ্য চিঠির ধরণসমূহ:
  // নন এসএফআই সিলেক্ট করলে ত্রি-সভা সম্পর্কিত কিছুই থাকবে না।
  // এসএফআই সিলেক্ট করলে দ্বি-সভা সম্পর্কিত কিছুই থাকবে না।
  const monthlyReportAvailableTypes = useMemo(() => {
    if (filterBranch === 'নন এসএফআই') {
      return [
        'বিএসআর',
        'দ্বি-সভা (কার্যবিবরণী)',
        'দ্বি-সভা (কার্যপত্র)',
        'মিলিকরণ',
        'অন্যান্য'
      ];
    }
    if (filterBranch === 'এসএফআই') {
      return [
        'বিএসআর',
        'ত্রি-সভা (কার্যবিবরণী)',
        'ত্রি-সভা (কার্যপত্র)',
        'মিলিকরণ',
        'অন্যান্য'
      ];
    }
    return [
      'বিএসআর',
      'দ্বি-সভা (কার্যবিবরণী)',
      'দ্বি-সভা (কার্যপত্র)',
      'ত্রি-সভা (কার্যবিবরণী)',
      'ত্রি-সভা (কার্যপত্র)',
      'মিলিকরণ',
      'অন্যান্য'
    ];
  }, [filterBranch]);

  // শাখা পরিবর্তন হলে নির্বাচিত চিঠির ধরণ স্বয়ংক্রিয়ভাবে ফিল্টার করা (যাতে অবৈধ অপশন না থাকে)
  useEffect(() => {
    if (filterBranch === 'নন এসএফআই' && (filterLetterType.includes('ত্রি-') || filterLetterType.includes('ত্রিপক্ষীয়'))) {
      setFilterLetterType('বিএসআর');
    } else if (filterBranch === 'এসএফআই' && (filterLetterType.includes('দ্বি-') || filterLetterType.includes('দ্বিপক্ষীয়'))) {
      setFilterLetterType('বিএসআর');
    }

    setMonthlyReportSelectedTypes(prev => {
      const filtered = prev.filter(t => {
        if (filterBranch === 'নন এসএফআই' && (t.includes('ত্রি-') || t.includes('ত্রিপক্ষীয়'))) return false;
        if (filterBranch === 'এসএফআই' && (t.includes('দ্বি-') || t.includes('দ্বিপক্ষীয়'))) return false;
        return true;
      });
      if (filtered.length === 0) {
        return monthlyReportAvailableTypes.slice(0, 3);
      }
      return filtered;
    });
  }, [filterBranch, monthlyReportAvailableTypes]);

  // Date range formatted labels in Bengali
  const dateRangeDisplayBN = useMemo(() => {
    const sStr = formatDateDMY(startDate);
    const eStr = formatDateDMY(endDate);
    return `${toBengaliDigits(sStr)} হতে ${toBengaliDigits(eStr)}`;
  }, [startDate, endDate]);

  // ২ নং ছবির হেডার অনুযায়ী ড্যাশ দিয়ে ফরম্যাটকৃত তারিখ
  const formatDashDateBN = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return toBengaliDigits(`${day}-${month}-${year}`);
  };

  // ডায়েরি ও নিষ্পত্তির তারিখের জন্য সংক্ষিপ্ত বাংলা ফরম্যাট (যেমন: ০৩/০৯/২৬)
  const formatShortDateBN = (dateVal: any): string => {
    if (!dateVal) return '';
    const d = parseDateSafe(dateVal);
    if (!d) return toBengaliDigits(String(dateVal).trim());
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const yr = String(d.getFullYear()).slice(-2);
    return toBengaliDigits(`${day}/${month}/${yr}`);
  };

  // ২ নং ছবি অনুযায়ী মাসিক প্রতিবেদনের শিরোনাম
  const monthlyReportTitleBN = useMemo(() => {
    const sStr = formatDashDateBN(startDate);
    const eStr = formatDashDateBN(endDate);
    return `Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদনঃ (${sStr} হতে ${eStr} খ্রিঃ তারিখ পর্যন্ত)`;
  }, [startDate, endDate]);

  // ২ নং ছবির চিঠির ধরণ ম্যাপিং ও নরমালাইজেশন
  const getNormalizedMonthlyLetterType = (entry: any): string => {
    const rawType = (entry.letterType || entry.meetingType || entry.type || '').trim();
    const norm = robustNormalize(rawType);
    const descNorm = robustNormalize(entry.description || '');

    // ১. দ্বি-সভা (কার্যবিবরণী)
    if ((norm.includes('দ্বি') || descNorm.includes('দ্বি') || norm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বিপক্ষীয়')) &&
        (norm.includes('কার্যবিবরন') || descNorm.includes('কার্যবিবরন') || norm.includes('বিবরণী') || descNorm.includes('বিবরণী') || norm.includes('কার্যবিবরণী'))) {
      return 'দ্বি-সভা (কার্যবিবরণী)';
    }

    // ২. দ্বি-সভা (কার্যপত্র)
    if ((norm.includes('দ্বি') || descNorm.includes('দ্বি') || norm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বিপক্ষীয়')) &&
        (norm.includes('কার্যপত্র') || descNorm.includes('কার্যপত্র'))) {
      return 'দ্বি-সভা (কার্যপত্র)';
    }

    // ৩. ত্রি-সভা (কার্যবিবরণী)
    if ((norm.includes('ত্রি') || descNorm.includes('ত্রি') || norm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রিপক্ষীয়')) &&
        (norm.includes('কার্যবিবরন') || descNorm.includes('কার্যবিবরন') || norm.includes('বিবরণী') || descNorm.includes('বিবরণী') || norm.includes('কার্যবিবরণী'))) {
      return 'ত্রি-সভা (কার্যবিবরণী)';
    }

    // ৪. ত্রি-সভা (কার্যপত্র)
    if ((norm.includes('ত্রি') || descNorm.includes('ত্রি') || norm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রিপক্ষীয়')) &&
        (norm.includes('কার্যপত্র') || descNorm.includes('কার্যপত্র'))) {
      return 'ত্রি-সভা (কার্যপত্র)';
    }

    // ৫. বিএসআর
    if (norm.includes('বিএসআর') || norm.toLowerCase().includes('bsr') || (!norm && !descNorm.includes('দ্বি') && !descNorm.includes('ত্রি') && !descNorm.includes('সভা') && !descNorm.includes('মিলিক'))) {
      return 'বিএসআর';
    }

    // ৬. মিলিকরণ
    if (norm.includes('মিলিক') || norm.includes('মিলক') || descNorm.includes('মিলিক') || descNorm.includes('মিলক')) {
      return 'মিলিকরণ';
    }

    return 'অন্যান্য';
  };

  // ২ নং ছবির হুবহু টেবিলের জন্য ডেটা প্রসেসিং
  const monthlyReportProcessedRows = useMemo(() => {
    const startMs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0).getTime();
    const endMs = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

    const selectedSet = new Set(monthlyReportSelectedTypes);

    const matched = (correspondenceEntries || []).filter(entry => {
      if (!entry) return false;
      if (entry.approvalStatus === 'pending') return false;

      // তারিখ চেক (diaryDate, receiptDate, or letterDate)
      const dDate = parseDateSafe(entry.diaryDate) || parseDateSafe(entry.receiptDate) || parseDateSafe(entry.letterDate);
      if (dDate) {
        const dTime = dDate.getTime();
        if (dTime < startMs || dTime > endMs) return false;
      }

      // শাখা ফিল্টার
      const pType = (entry.paraType || entry.branchName || '').trim();
      if (filterBranch === 'এসএফআই') {
        if (!isSFI(pType)) return false;
      } else if (filterBranch === 'নন এসএফআই') {
        if (!isNonSFI(pType)) return false;
      }

      // চিঠির ধরণ চেক
      const mappedType = getNormalizedMonthlyLetterType(entry);
      if (!selectedSet.has(mappedType)) return false;

      // সার্চ টার্ম
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const str = `${entry.description || ''} ${entry.diaryNo || ''} ${entry.letterNo || ''} ${entry.entityName || ''} ${entry.ministryName || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });

    // সর্টিং: চিঠির ধরণের ক্রমিক (বিএসআর -> দ্বি/ত্রি-কার্যবিবরণী -> দ্বি/ত্রি-কার্যপত্র -> মিলিকরণ -> অন্যান্য), তারপর ডায়েরি তারিখ
    const typeOrderMap = new Map<string, number>(monthlyReportAvailableTypes.map((t, idx) => [t, idx]));

    matched.sort((a, b) => {
      const typeA = getNormalizedMonthlyLetterType(a);
      const typeB = getNormalizedMonthlyLetterType(b);
      const orderA: number = typeOrderMap.get(typeA) ?? 999;
      const orderB: number = typeOrderMap.get(typeB) ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      const dateA = parseDateSafe(a.diaryDate)?.getTime() || 0;
      const dateB = parseDateSafe(b.diaryDate)?.getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;

      const dNoA = parseInt(a.diaryNo || '0', 10) || 0;
      const dNoB = parseInt(b.diaryNo || '0', 10) || 0;
      return dNoA - dNoB;
    });

    interface MonthlyRow {
      entry: any;
      serial: number;
      letterTypeName: string;
      isFirstInTypeGroup: boolean;
      typeRowSpan: number;
      diaryStr: string;
      paraCount: number;
      disposalStr: string;
      settledCount: string;
      unsettledCount: string;
    }

    const rows: MonthlyRow[] = [];
    let i = 0;
    while (i < matched.length) {
      const currentType = getNormalizedMonthlyLetterType(matched[i]);
      let j = i;
      while (j < matched.length && getNormalizedMonthlyLetterType(matched[j]) === currentType) {
        j++;
      }
      const groupCount = j - i;
      for (let k = i; k < j; k++) {
        const item = matched[k];
        
        const dDateShort = formatShortDateBN(item.diaryDate);
        const dNoBN = toBengaliDigits(item.diaryNo || '');
        const diaryStr = dNoBN && dDateShort ? `${dNoBN}, ${dDateShort}` : (dNoBN || dDateShort || '-');

        // প্রেরিত অনুচ্ছেদ সংখ্যা নির্ণয় (sentParaCount, totalParas, paragraphs ইত্যাদির বাংলা ডিজিট রূপান্তর সহ)
        let paraCount = 1;
        const candidateParaValues = [
          item.sentParaCount,
          item.totalParas,
          item.meetingSentParaCount,
          item.meetingDiscussedParaCount,
          item.meetingRecommendedParaCount,
        ];
        for (const cand of candidateParaValues) {
          if (cand !== undefined && cand !== null && String(cand).trim() !== '') {
            const eng = toEnglishDigits(String(cand).trim()).replace(/[^\d]/g, '');
            if (eng) {
              const num = parseInt(eng, 10);
              if (!isNaN(num) && num > 0) {
                paraCount = num;
                break;
              }
            }
          }
        }
        if (paraCount === 1 && Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
          paraCount = item.paragraphs.length;
        }

        const matchedS = (settlementEntries || []).find((s: any) => 
          (s.correspondenceId && s.correspondenceId === item.id) ||
          (s.letterId && s.letterId === item.id) ||
          (item.issueLetterNo && (s.issueNo === item.issueLetterNo || s.issueLetterNo === item.issueLetterNo))
        );

        // জারিপত্রের তারিখ যদি রিপোর্টের সমাপ্তি তারিখের (endMs) পরে হয়, তবে উক্ত রিপোর্ট সময়সীমা পর্যন্ত এটি 'চলমান' থাকবে
        let rawIssueDate = item.issueLetterDate || item.issueDateISO || item.issueDate || matchedS?.issueDateISO || matchedS?.issueDate || matchedS?.issueLetterDate;
        if (!rawIssueDate && item.issueLetterNoDate) {
          const m = toEnglishDigits(item.issueLetterNoDate).match(/\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
          if (m) rawIssueDate = m[0];
        }
        if (!rawIssueDate && matchedS?.issueLetterNoDate) {
          const m = toEnglishDigits(matchedS.issueLetterNoDate).match(/\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
          if (m) rawIssueDate = m[0];
        }

        const parsedIssueDate = parseDateSafe(rawIssueDate);
        const isIssuedAfterPeriod = Boolean(parsedIssueDate && parsedIssueDate.getTime() > endMs);

        let disposalStr = 'চলমান';
        if (!isIssuedAfterPeriod && (item.issueLetterNo || item.issueLetterDate || matchedS?.issueNo || matchedS?.issueLetterNo)) {
          const issNoVal = item.issueLetterNo || matchedS?.issueNo || matchedS?.issueLetterNo || '';
          const issDateVal = item.issueLetterDate || rawIssueDate;
          const issDateShort = formatShortDateBN(issDateVal);
          const issNoBN = toBengaliDigits(issNoVal);
          if (issNoBN && issDateShort) {
            disposalStr = `${issNoBN}, ${issDateShort}`;
          } else if (issNoBN) {
            disposalStr = issNoBN;
          } else if (issDateShort) {
            disposalStr = issDateShort;
          }
        }

        // নিষ্পত্তিকৃত ও অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা
        let settledStr = '-';
        let unsettledStr = '-';

        if (!isIssuedAfterPeriod) {
          if (matchedS) {
            let sCount = 0;
            if (matchedS.paragraphs && matchedS.paragraphs.length > 0) {
              sCount = matchedS.paragraphs.filter((p: any) => p.status === 'পূর্ণাঙ্গ' || p.status === 'মীমাংসিত' || p.status === 'নিষ্পন্ন').length;
            } else if (matchedS.meetingSettledParaCount || matchedS.settledParaCount) {
              sCount = parseInt(toEnglishDigits(String(matchedS.meetingSettledParaCount || matchedS.settledParaCount || '0')).replace(/[^\d]/g, ''), 10) || 0;
            }
            if (sCount > 0) {
              settledStr = toBengaliDigits(sCount);
              const uns = Math.max(0, paraCount - sCount);
              unsettledStr = uns > 0 ? toBengaliDigits(uns) : '-';
            } else if (matchedS.isSettled === 'হ্যাঁ') {
              settledStr = toBengaliDigits(paraCount);
            } else if (matchedS.isSettled === 'না') {
              unsettledStr = toBengaliDigits(paraCount);
            }
          } else if (item.isSettled === 'হ্যাঁ') {
            settledStr = toBengaliDigits(paraCount);
          } else if (item.isSettled === 'না' && (item.issueLetterNo || item.issueLetterDate)) {
            unsettledStr = toBengaliDigits(paraCount);
          }
        }

        rows.push({
          entry: item,
          serial: k + 1,
          letterTypeName: currentType,
          isFirstInTypeGroup: k === i,
          typeRowSpan: groupCount,
          diaryStr,
          paraCount,
          disposalStr,
          settledCount: settledStr,
          unsettledCount: unsettledStr
        });
      }
      i = j;
    }

    return rows;
  }, [correspondenceEntries, settlementEntries, startDate, endDate, filterBranch, monthlyReportSelectedTypes, monthlyReportAvailableTypes, searchTerm]);

  const monthlyReportTotalParas = useMemo(() => {
    return monthlyReportProcessedRows.reduce((acc, r) => acc + r.paraCount, 0);
  }, [monthlyReportProcessedRows]);

  // Subject title matching Image 1 exactly:
  // "বিষয়: ১৬/০৮/২০২৬ হতে ১৫/০৯/২০২৬ খ্রিঃ তারিখ পর্যন্ত নন এসএফআই শাখায় বিএসআর প্রাপ্তির রিটার্ন।"
  const subjectTitleBN = useMemo(() => {
    const branchText = filterBranch === 'সকল' ? 'সকল' : filterBranch;
    const letterText = filterLetterType === 'সকল' ? 'সকল পত্র' : filterLetterType;
    return `বিষয়: ${dateRangeDisplayBN} খ্রিঃ তারিখ পর্যন্ত ${branchText} শাখায় ${letterText} প্রাপ্তির রিটার্ন।`;
  }, [dateRangeDisplayBN, filterBranch, filterLetterType]);

  // Filter and prepare entries
  const filteredRows = useMemo(() => {
    const startMs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0).getTime();
    const endMs = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

    // Pool from correspondenceEntries
    let list = (correspondenceEntries || []).filter(entry => {
      if (!entry) return false;
      if (entry.approvalStatus === 'pending') return false;

      // Date check: check diaryDate, receiptDate, or letterDate
      const dDate = parseDateSafe(entry.diaryDate) || parseDateSafe(entry.receiptDate) || parseDateSafe(entry.letterDate);
      if (dDate) {
        const dTime = dDate.getTime();
        if (dTime < startMs || dTime > endMs) return false;
      }

      // Branch filter
      const pType = (entry.paraType || entry.branchName || '').trim();
      if (filterBranch === 'এসএফআই') {
        if (!isSFI(pType)) return false;
      } else if (filterBranch === 'নন এসএফআই') {
        if (!isNonSFI(pType)) return false;
      }

      // Letter Type filter
      if (filterLetterType !== 'সকল') {
        const lTypeRaw = (entry.letterType || entry.meetingType || entry.type || '').trim();
        const norm = robustNormalize(lTypeRaw);
        const descNorm = robustNormalize(entry.description || '');

        if (filterLetterType === 'বিএসআর') {
          const isBsr = norm.includes('বিএসআর') || norm.toLowerCase().includes('bsr') || (!norm && !descNorm.includes('সভা') && !descNorm.includes('মিলিক'));
          if (!isBsr) return false;
        } else if (filterLetterType.includes('দ্বি-সভা (কার্যপত্র)') || filterLetterType.includes('দ্বিপক্ষীয় সভা (কার্যপত্র)')) {
          const isBilateralWork = (norm.includes('দ্বি') || norm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বি-সভা')) && 
                                  (norm.includes('কার্যপত্র') || descNorm.includes('কার্যপত্র'));
          if (!isBilateralWork) return false;
        } else if (filterLetterType.includes('দ্বি-সভা (কার্যবিবরনী)') || filterLetterType.includes('দ্বিপক্ষীয় সভা (কার্যবিবরনী)')) {
          const isBilateralMinutes = (norm.includes('দ্বি') || norm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বিপক্ষীয়') || descNorm.includes('দ্বি-সভা')) && 
                                     (norm.includes('কার্যবিবরন') || descNorm.includes('কার্যবিবরন') || norm.includes('বিবরণী') || descNorm.includes('বিবরণী'));
          if (!isBilateralMinutes) return false;
        } else if (filterLetterType.includes('ত্রি-সভা (কার্যপত্র)') || filterLetterType.includes('ত্রিপক্ষীয় সভা (কার্যপত্র)')) {
          const isTrilateralWork = (norm.includes('ত্রি') || norm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রি-সভা')) && 
                                   (norm.includes('কার্যপত্র') || descNorm.includes('কার্যপত্র'));
          if (!isTrilateralWork) return false;
        } else if (filterLetterType.includes('ত্রি-সভা (কার্যবিবরনী)') || filterLetterType.includes('ত্রিপক্ষীয় সভা (কার্যবিবরনী)')) {
          const isTrilateralMinutes = (norm.includes('ত্রি') || norm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রিপক্ষীয়') || descNorm.includes('ত্রি-সভা')) && 
                                      (norm.includes('কার্যবিবরন') || descNorm.includes('কার্যবিবরন') || norm.includes('বিবরণী') || descNorm.includes('বিবরণী'));
          if (!isTrilateralMinutes) return false;
        } else if (filterLetterType.includes('মিলিকরন') || filterLetterType.includes('মিলিকরণ')) {
          const isRecon = norm.includes('মিলিক') || norm.includes('মিলক') || norm.includes('reconciliation') || 
                          descNorm.includes('মিলিক') || descNorm.includes('মিলক');
          if (!isRecon) return false;
        } else if (filterLetterType.includes('অন্যান্য')) {
          const isOther = norm.includes('অন্যান্য') || norm.toLowerCase().includes('other') || 
                          (!norm.includes('বিএসআর') && !norm.includes('সভা') && !norm.includes('মিলিক'));
          if (!isOther) return false;
        } else {
          if (!norm.includes(robustNormalize(filterLetterType)) && !descNorm.includes(robustNormalize(filterLetterType))) return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const str = `${entry.description || ''} ${entry.diaryNo || ''} ${entry.letterNo || ''} ${entry.entityName || ''} ${entry.ministryName || ''} ${entry.archiveNo || ''} ${entry.remarks || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });

    // Sort entries by Ministry so identical ministries cluster consecutively for rowSpan grouping
    list.sort((a, b) => {
      const minA = getEntryMinistry(a);
      const minB = getEntryMinistry(b);
      if (minA !== minB) return minA.localeCompare(minB, 'bn');
      const dateA = parseDateSafe(a.diaryDate)?.getTime() || 0;
      const dateB = parseDateSafe(b.diaryDate)?.getTime() || 0;
      return dateA - dateB;
    });

    // Grouping by Ministry for rowSpan (Matching Image 2 where consecutive rows with same ministry share column 2)
    interface ProcessedRow {
      entry: any;
      serial: number;
      ministryName: string;
      isFirstInMinistryGroup: boolean;
      ministryRowSpan: number;
    }

    const processed: ProcessedRow[] = [];
    let i = 0;
    while (i < list.length) {
      const currentMin = getEntryMinistry(list[i]);
      let j = i;
      while (j < list.length && getEntryMinistry(list[j]) === currentMin) {
        j++;
      }
      const groupCount = j - i;
      for (let k = i; k < j; k++) {
        processed.push({
          entry: list[k],
          serial: k + 1,
          ministryName: currentMin,
          isFirstInMinistryGroup: k === i,
          ministryRowSpan: groupCount
        });
      }
      i = j;
    }

    return processed;
  }, [correspondenceEntries, startDate, endDate, filterBranch, filterLetterType, searchTerm]);

  const [copiedWord, setCopiedWord] = useState(false);

  // Copy report for Word: Title is OUTSIDE the main table as a paragraph, table underneath
  const handleCopyWord = async () => {
    const tableEl = document.getElementById('table-bsr-received-return-main');
    if (!tableEl) return;

    const cloned = tableEl.cloneNode(true) as HTMLTableElement;
    cloned.querySelectorAll('button, svg, input').forEach(el => el.remove());

    // Replace any remaining div inside td/th with span so Word never splits into multiple cells/rows
    cloned.querySelectorAll('td div, th div').forEach(div => {
      const span = document.createElement('span');
      span.innerHTML = div.innerHTML;
      if (div.getAttribute('style')) span.setAttribute('style', div.getAttribute('style') || '');
      div.parentNode?.replaceChild(span, div);
    });

    // Ensure all br elements have mso-data-placement: same-cell so Excel & Word treat them as in-cell breaks
    cloned.querySelectorAll('br').forEach(br => {
      br.setAttribute('style', 'mso-data-placement:same-cell;');
    });

    // Ensure all cells have mso-number-format: '\@' to strictly treat serials like (১), (২) as text (not negative numbers)
    cloned.querySelectorAll('th, td').forEach(cell => {
      const existing = cell.getAttribute('style') || '';
      cell.setAttribute('style', `${existing}; mso-number-format:'\\@';`);
    });

    // Title is OUTSIDE the table as a clean paragraph (হুবহু নির্দেশনা অনুযায়ী শিরোনাম টেবিলের বাইরে)
    const titleHtml = isMonthlyReportMode
      ? `<table style="width: 100%; border: none; margin-bottom: 8pt; font-family: 'Noto Sans Bengali', Arial, sans-serif;">
           <tr>
             <td style="border: none; text-align: left; font-size: 13pt; font-weight: bold; color: #000000; padding: 0;">${monthlyReportTitleBN}</td>
             <td style="border: none; text-align: right; font-size: 13pt; font-weight: bold; color: #000000; padding: 0;">শাখাঃ ${filterBranch}।</td>
           </tr>
         </table>`
      : `<p style="font-size: 13pt; font-weight: bold; margin-bottom: 8pt; text-align: left; color: #000000; line-height: 1.4;">
           ${subjectTitleBN}
         </p>`;

    const htmlContent = `
      <div style="font-family: 'Noto Sans Bengali', Arial, sans-serif;">
        ${titleHtml}
        <table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #000000; font-size: 10pt; font-family: 'Noto Sans Bengali', Arial, sans-serif;">
          ${cloned.innerHTML}
        </table>
      </div>
    `;

    const plainText = isMonthlyReportMode
      ? `${monthlyReportTitleBN}          শাখাঃ ${filterBranch}।\n\n` + tableEl.innerText
      : `${subjectTitleBN}\n\n` + tableEl.innerText;

    try {
      let success = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const blobHtml = new Blob([htmlContent], { type: 'text/html' });
          const blobText = new Blob([plainText], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': blobHtml,
              'text/plain': blobText,
            }),
          ]);
          success = true;
        } catch {
          // Fallback to execCommand if ClipboardItem is blocked in iframe
        }
      }

      if (!success) {
        const handler = (e: ClipboardEvent) => {
          e.preventDefault();
          if (e.clipboardData) {
            e.clipboardData.setData('text/html', htmlContent);
            e.clipboardData.setData('text/plain', plainText);
          }
        };
        document.addEventListener('copy', handler);
        document.execCommand('copy');
        document.removeEventListener('copy', handler);
      }

      setCopiedWord(true);
      setTimeout(() => setCopiedWord(false), 2500);
    } catch (err) {
      console.error('Failed to copy for Word:', err);
    }
  };

  // Excel download functionality
  const handleDownloadExcel = () => {
    const tableEl = document.getElementById('table-bsr-received-return-main');
    if (!tableEl) return;

    const cloned = tableEl.cloneNode(true) as HTMLTableElement;
    cloned.querySelectorAll('button, svg, input').forEach(el => el.remove());

    // Replace any remaining div inside td/th with span so Excel and Word never split into multiple cells/rows
    cloned.querySelectorAll('td div, th div').forEach(div => {
      const span = document.createElement('span');
      span.innerHTML = div.innerHTML;
      if (div.getAttribute('style')) span.setAttribute('style', div.getAttribute('style') || '');
      div.parentNode?.replaceChild(span, div);
    });

    // Ensure all br elements have mso-data-placement: same-cell so Excel treats them as in-cell breaks
    cloned.querySelectorAll('br').forEach(br => {
      br.setAttribute('style', 'mso-data-placement:same-cell;');
    });

    // Ensure all th, td have mso-number-format: '\@' so (১), (২) etc are NEVER converted to minus signs
    cloned.querySelectorAll('th, td').forEach(cell => {
      const existing = cell.getAttribute('style') || '';
      cell.setAttribute('style', `${existing}; mso-number-format:'\\@';`);
    });

    const filename = isMonthlyReportMode
      ? `Responsible_Party_মাসিক_প্রতিবেদন_${formatDashDateBN(startDate)}_হতে_${formatDashDateBN(endDate)}.xls`
      : `বিএসআর_প্রাপ্তির_রিটার্ন_${dateRangeDisplayBN.replace(/\s+/g, '_')}.xls`;

    // Note: The title is intentionally NOT placed inside the Excel sheet so that when the user
    // copies from Excel to Word, the Word table will NOT have the title inside the table!
    const excelTitle = isMonthlyReportMode
      ? `${monthlyReportTitleBN} - শাখাঃ ${filterBranch}`
      : subjectTitleBN;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <title>${excelTitle}</title>
        <style>
          body { font-family: 'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 5px; }
          th, td { border: 1px solid #000000; padding: 6px 8px; text-align: center; font-size: 11px; vertical-align: middle; mso-number-format: "\\@"; }
          th { background-color: #f1f5f9; font-weight: bold; }
          br { mso-data-placement: same-cell; }
          .text-left { text-align: left !important; }
        </style>
      </head>
      <body>
        ${cloned.outerHTML}
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="bsr-received-report-container" className="w-full bg-white p-3 sm:p-5 rounded-none relative font-sans">
      {IDBadge && <IDBadge id="bsr-received-report-container" />}

      {/* Non-Print Top Toolbar & Filters */}
      <div className="no-print mb-4 pb-3 border-b border-slate-200 flex flex-wrap items-center justify-start gap-2">
        {/* Filters (Branch, Letter Type, Date Range, Search, Excel) */}
        {/* ১. শাখা ফিল্টার ড্রপডাউন */}
        <div className="relative z-[500]" ref={branchRef}>
          <button
            type="button"
            onClick={() => setIsBranchOpen(!isBranchOpen)}
            className="flex items-center justify-between gap-1.5 px-3 h-[38px] w-[135px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer select-none"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Filter size={13} className="text-slate-600 shrink-0" />
              <span className="text-slate-500 shrink-0">শাখা:</span>
              <span className="font-black text-blue-900 truncate">{filterBranch}</span>
            </div>
            <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${isBranchOpen ? 'rotate-180' : ''}`} />
          </button>

            {isBranchOpen && (
              <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-[600] py-1">
                {(['নন এসএফআই', 'এসএফআই', 'সকল'] as const).map(branch => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => {
                      setFilterBranch(branch);
                      setIsBranchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors ${
                      filterBranch === branch ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{branch}</span>
                    {filterBranch === branch && <Check size={14} className="text-blue-600 font-bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ২. চিঠির ধরণ ফিল্টার */}
          <div className="relative z-[500]" ref={letterTypeRef}>
            <button
              type="button"
              onClick={() => setIsLetterTypeOpen(!isLetterTypeOpen)}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer"
            >
              <Mail size={13} className="text-slate-600" />
              <span className="text-slate-500">ধরণ:</span>
              <span className="font-black text-blue-900">{filterLetterType}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isLetterTypeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLetterTypeOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[600] py-1 max-h-60 overflow-y-auto">
                {letterTypeOptions.map(lType => (
                  <button
                    key={lType}
                    type="button"
                    onClick={() => {
                      setFilterLetterType(lType);
                      setIsLetterTypeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors ${
                      filterLetterType === lType ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lType}</span>
                    {filterLetterType === lType && <Check size={14} className="text-blue-600 font-bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ২.৫. মাসিক প্রতিবেদন ড্রপডাউন (ধরন ও সময়কাল এর মাঝখানে - হুবহু লাল বক্সের স্থানে) */}
          <div className="relative z-[500]" ref={monthlyReportRef}>
            <button
              type="button"
              onClick={() => setIsMonthlyReportDropdownOpen(!isMonthlyReportDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 h-[38px] rounded-xl font-bold text-xs shadow-xs cursor-pointer select-none transition-all border ${
                isMonthlyReportMode
                  ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800'
              }`}
              title="Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদন"
            >
              <FileText size={13} className={isMonthlyReportMode ? 'text-white' : 'text-slate-600'} />
              <span className={isMonthlyReportMode ? 'text-white font-black' : 'text-slate-700 font-bold'}>
                মাসিক প্রতিবেদন
              </span>
              {isMonthlyReportMode ? (
                <span className="bg-white text-blue-700 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  সক্রিয়
                </span>
              ) : (
                monthlyReportSelectedTypes.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                    {toBengaliDigits(monthlyReportSelectedTypes.length)}
                  </span>
                )
              )}
              <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${isMonthlyReportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMonthlyReportDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[600] p-3 space-y-2.5">
                {/* ভিউ টগল */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">মাসিক প্রতিবেদন ভিউ</span>
                    <span className="text-[10px] text-slate-500">২ নং ছবির টেবিল ফরম্যাট</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMonthlyReportMode(!isMonthlyReportMode)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                      isMonthlyReportMode ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isMonthlyReportMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* অপশন হেডার ও কুইক সিলেক্ট বাটন */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] font-bold text-slate-600">চিঠির ধরণ নির্বাচন করুন:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMonthlyReportSelectedTypes([...monthlyReportAvailableTypes])}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      সব নির্বাচন
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonthlyReportSelectedTypes([])}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      সব মুছুন
                    </button>
                  </div>
                </div>

                {/* চেকবক্স তালিকা */}
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {monthlyReportAvailableTypes.map(type => {
                    const isChecked = monthlyReportSelectedTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50 text-blue-900 font-black' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setMonthlyReportSelectedTypes(prev => prev.filter(t => t !== type));
                              } else {
                                setMonthlyReportSelectedTypes(prev => [...prev, type]);
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>{type}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* অ্যাকশন বাটন */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMonthlyReportMode(true);
                      setIsMonthlyReportDropdownOpen(false);
                    }}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all text-center"
                  >
                    প্রতিবেদন দেখুন
                  </button>
                  {isMonthlyReportMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMonthlyReportMode(false);
                        setIsMonthlyReportDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      সাধারণ ভিউ
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ৩. সময়কাল / তারিখ রেঞ্জ নির্বাচন */}
          <div className="relative z-[500]" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer"
            >
              <Calendar size={13} className="text-slate-600" />
              <span className="text-slate-500">সময়কাল:</span>
              <span className="font-black text-blue-900">{dateRangeDisplayBN}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isDateRangeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateRangeOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[600] p-3 space-y-2.5">
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider border-b pb-1">
                  তারিখ সীমা নির্ধারণ
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">হতে (শুরু)</label>
                    <input
                      type="date"
                      value={dateFnsFormat(startDate, 'yyyy-MM-dd')}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          setStartDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">পর্যন্ত (শেষ)</label>
                    <input
                      type="date"
                      value={dateFnsFormat(endDate, 'yyyy-MM-dd')}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          setEndDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeCycle?.start && activeCycle?.end) {
                        const s = parseDateSafe(activeCycle.start);
                        const e = parseDateSafe(activeCycle.end);
                        if (s && e) {
                          setStartDate(s);
                          setEndDate(e);
                        }
                      }
                      setIsDateRangeOpen(false);
                    }}
                    className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold cursor-pointer"
                  >
                    চলতি সাইকেল
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 16));
                      setEndDate(new Date(now.getFullYear(), now.getMonth(), 15));
                      setIsDateRangeOpen(false);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer"
                  >
                    বিগত সাইকেল
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ৪. সার্চ বার */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="খুঁজুন..."
              className="h-[38px] pl-8 pr-7 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-44 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* ৫. ওয়ার্ডে কপি বাটন */}
          <button
            type="button"
            onClick={handleCopyWord}
            className={`flex items-center gap-1.5 px-3 h-[38px] rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all ${
              copiedWord 
                ? 'bg-blue-700 text-white ring-2 ring-blue-400' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="ওয়ার্ডে পেস্ট করার জন্য শিরোনামসহ টেবিল কপি করুন (শিরোনাম টেবিলের বাইরে থাকবে)"
          >
            {copiedWord ? <Check size={15} /> : <Copy size={15} />}
            <span className="hidden sm:inline">{copiedWord ? 'কপি হয়েছে' : 'ওয়ার্ডে কপি'}</span>
          </button>

          {/* ৬. এক্সেল ডাউনলোড বাটন */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            title="এক্সেল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">এক্সেল</span>
          </button>
        </div>

      {/* Main Official Printable Report Area */}
      <div className="w-full bg-white print:p-0">
        {isMonthlyReportMode ? (
          /* ============================================================ */
          /* ২ নং ছবি অনুযায়ী Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদন */
          /* ============================================================ */
          <>
            {/* Title Line (হুবহু ২ নং ছবি অনুযায়ী বামে শিরোনাম ও ডানে শাখা) */}
            <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-black font-bold text-[14px] sm:text-[15.5px]">
              <p className="leading-snug tracking-tight">
                {monthlyReportTitleBN}
              </p>
              <div className="flex items-center gap-3">
                <p className="whitespace-nowrap sm:text-right font-bold text-[14px] sm:text-[15.5px]">
                  {`শাখাঃ ${filterBranch}।`}
                </p>
                <button
                  type="button"
                  onClick={() => setIsMonthlyReportMode(false)}
                  className="no-print text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  title="সাধারণ প্রাপ্তির রিটার্ন টেবিলে ফিরুন"
                >
                  সাধারণ ভিউ
                </button>
              </div>
            </div>

            {/* The 8-Column Exact Table from Image 2 */}
            <div className="table-container qr-table-container relative w-full overflow-visible">
              <table
                id="table-bsr-received-return-main"
                ref={tableRef}
                className="w-full min-w-[1050px] border-collapse border border-black text-black text-xs sm:text-[13px] font-sans"
                style={{ borderCollapse: 'collapse', borderColor: '#000000', minWidth: '1050px' }}
              >
                <colgroup>
                  <col style={{ width: '60px', minWidth: '55px' }} />
                  <col style={{ width: '180px', minWidth: '160px' }} />
                  <col style={{ width: '120px', minWidth: '105px' }} />
                  <col style={{ width: '160px', minWidth: '140px' }} />
                  <col style={{ width: '110px', minWidth: '100px' }} />
                  <col style={{ width: '170px', minWidth: '150px' }} />
                  <col style={{ width: '125px', minWidth: '110px' }} />
                  <col style={{ width: '125px', minWidth: '110px' }} />
                </colgroup>
                <thead>
                  {/* Row 1: Headers */}
                  <tr className="bg-white text-black font-bold">
                    <th rowSpan={2} className="border border-black p-2 text-center align-middle font-bold w-[60px]">
                      ক্রমিক নং
                    </th>
                    <th rowSpan={2} className="border border-black p-2 text-center align-middle font-bold w-[180px]">
                      বিবরণ
                    </th>
                    <th rowSpan={2} className="border border-black p-2 text-center align-middle font-bold w-[120px]">
                      প্রাপ্ত জবাব (পত্র সংখ্যা)
                    </th>
                    <th rowSpan={2} className="border border-black p-2 text-center align-middle font-bold w-[160px]">
                      প্রাপ্ত জবাবের ডায়েরি নং ও তারিখ
                    </th>
                    <th rowSpan={2} className="border border-black p-2 text-center align-middle font-bold w-[110px]">
                      প্রেরিত অনুচ্ছেদ সংখ্যা
                    </th>
                    <th colSpan={3} className="border border-black p-2 text-center align-middle font-bold bg-white text-black">
                      গৃহীত কার্যক্রম
                    </th>
                  </tr>

                  {/* Row 2: Sub-headers under গৃহীত কার্যক্রম */}
                  <tr className="bg-white text-black font-bold">
                    <th className="border border-black p-2 text-center align-middle font-bold w-[170px]">
                      প্রাপ্ত জবাবের Disposal/জারিপত্র ও তারিখ
                    </th>
                    <th className="border border-black p-2 text-center align-middle font-bold w-[125px]">
                      নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা
                    </th>
                    <th className="border border-black p-2 text-center align-middle font-bold w-[125px]">
                      অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা
                    </th>
                  </tr>

                  {/* Row 3: Numbered Sub-headers (১) হতে (৮) */}
                  <tr className="bg-white text-black font-bold h-[28px]">
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(১)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(২)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৩)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৪)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৫)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৬)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৭)</th>
                    <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৮)</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyReportProcessedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-black py-12 text-center text-slate-500 font-bold bg-white text-sm">
                        নির্বাচিত তারিখ ও শাখার কোনো পত্রাদির তথ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    monthlyReportProcessedRows.map((row, idx) => (
                      <tr key={row.entry.id || idx} className="bg-white hover:bg-slate-50 transition-colors text-black">
                        {/* (১) ক্রমিক নং */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-bold">
                          {toBengaliDigits(row.serial)}
                        </td>

                        {/* (২) বিবরণ (RowSpan for grouped letter type - বিএসআর চিহ্নিত স্থানে ফিক্সড) */}
                        {row.isFirstInTypeGroup && (
                          <td
                            rowSpan={row.typeRowSpan}
                            className="border border-black p-2 text-center align-top font-bold bg-white text-black"
                            style={{ verticalAlign: 'top' }}
                          >
                            <div
                              className="sticky top-[120px] z-20 py-1.5 px-1 font-bold text-center print:static whitespace-nowrap"
                              style={{ position: 'sticky', top: '120px', zIndex: 20 }}
                            >
                              {row.letterTypeName || 'বিএসআর'}
                            </div>
                          </td>
                        )}

                        {/* (৩) প্রাপ্ত জবাব (পত্র সংখ্যা) */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-bold">
                          ১
                        </td>

                        {/* (৪) প্রাপ্ত জবাবের ডায়েরি নং ও তারিখ */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-medium">
                          {row.diaryStr}
                        </td>

                        {/* (৫) প্রেরিত অনুচ্ছেদ সংখ্যা */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-medium">
                          {toBengaliDigits(row.paraCount)}
                        </td>

                        {/* (৬) প্রাপ্ত জবাবের Disposal/জারিপত্র ও তারিখ */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-medium">
                          {row.disposalStr}
                        </td>

                        {/* (৭) নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-medium">
                          {row.settledCount}
                        </td>

                        {/* (৮) অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা */}
                        <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-medium">
                          {row.unsettledCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer Row (সর্বমোটঃ) হুবহু ২ নং ছবি অনুযায়ী */}
                {monthlyReportProcessedRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-white text-black font-bold">
                      <td colSpan={2} className="border border-black p-2 text-center align-middle font-black">
                        সর্বমোটঃ
                      </td>
                      <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-black">
                        {toBengaliDigits(monthlyReportProcessedRows.length)}
                      </td>
                      <td className="border border-black p-2 text-center align-middle font-bold">
                        -
                      </td>
                      <td style={{ msoNumberFormat: '\\@' } as any} className="border border-black p-2 text-center align-middle font-black">
                        {toBengaliDigits(monthlyReportTotalParas)}
                      </td>
                      <td className="border border-black p-2 text-center align-middle font-bold">
                        -
                      </td>
                      <td className="border border-black p-2 text-center align-middle font-bold">
                        -
                      </td>
                      <td className="border border-black p-2 text-center align-middle font-bold">
                        -
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        ) : (
          /* ============================================================ */
          /* ১ নং ছবি অনুযায়ী স্ট্যান্ডার্ড বিএসআর প্রাপ্তির রিটার্ন টেবিল */
          /* ============================================================ */
          <>
            {/* Title Line (হুবহু ১ নং ছবি অনুযায়ী) */}
            <div className="mb-2 text-left">
              <p className="font-bold text-[14px] sm:text-[15.5px] text-black leading-snug tracking-tight">
                {subjectTitleBN}
              </p>
            </div>

            {/* The 8-Column Exact Table from Image 1 */}
            <div className="table-container qr-table-container relative w-full overflow-visible">
              <table
                id="table-bsr-received-return-main"
                ref={tableRef}
                className="w-full min-w-[1050px] border-collapse border border-black text-black text-xs sm:text-[13px] font-sans"
                style={{ borderCollapse: 'collapse', borderColor: '#000000', minWidth: '1050px' }}
              >
            <colgroup>
              <col style={{ width: '60px', minWidth: '60px' }} />
              <col style={{ width: '160px', minWidth: '150px' }} />
              <col style={{ width: '320px', minWidth: '280px' }} />
              <col style={{ width: '125px', minWidth: '115px' }} />
              <col style={{ width: '125px', minWidth: '115px' }} />
              <col style={{ width: '95px', minWidth: '90px' }} />
              <col style={{ width: '100px', minWidth: '95px' }} />
              <col style={{ width: '90px', minWidth: '85px' }} />
            </colgroup>
            <thead>
              {/* Row 1: 8 Column Headers */}
              <tr className="bg-white text-black font-bold">
                <th className="border border-black p-2 text-center align-middle w-[60px] min-w-[60px] font-bold">
                  ক্রমিক নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[160px] min-w-[150px] font-bold">
                  বিভাগ/মন্ত্রণালয়
                </th>
                <th 
                  className="border border-black p-2 text-center align-middle font-bold text-black"
                  style={{ width: '320px', minWidth: '280px' }}
                >
                  <span className="inline-block whitespace-nowrap">অডিট প্রতিষ্ঠানের নাম</span>{' '}
                  <span className="inline-block whitespace-nowrap">ও নিরীক্ষা সাল</span>
                </th>
                <th className="border border-black p-2 text-center align-middle w-[125px] min-w-[115px] font-bold">
                  ডায়েরি নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[125px] min-w-[115px] font-bold">
                  পত্র নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[95px] min-w-[90px] font-bold">
                  চিঠির ধরণ
                </th>
                <th className="border border-black p-2 text-center align-middle w-[100px] min-w-[95px] font-bold">
                  আর্কাইভ নং
                </th>
                <th className="border border-black p-2 text-center align-middle w-[90px] min-w-[85px] font-bold">
                  মন্তব্য
                </th>
              </tr>

              {/* Row 2: Sub-headers (১) হতে (৮) - ১ম ছবির নির্দেশনা অনুযায়ী ফাস্ট ব্রাকেটের মধ্যে */}
              <tr className="bg-white text-black font-bold h-[28px]">
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(১)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(২)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৩)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৪)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৫)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৬)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৭)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-1 px-1 text-center font-bold whitespace-nowrap align-middle leading-normal text-xs">(৮)</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-black py-12 text-center text-slate-500 font-bold bg-white text-sm"
                  >
                    এই সময়কালে কোনো পত্রাদির তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const entry = row.entry;
                  const diaryNo = entry.diaryNo ? String(entry.diaryNo).trim() : '-';
                  const diaryDate = formatDateDMY(entry.diaryDate || entry.receiptDate);
                  const letterNo = entry.letterNo ? String(entry.letterNo).trim() : '-';
                  const letterDate = formatDateDMY(entry.letterDate);
                  const letterTypeDisplay = entry.letterType?.trim() || filterLetterType || 'বিএসআর';
                  const archiveNo = entry.archiveNo ? String(entry.archiveNo).trim() : '';
                  const remarks = entry.remarks || entry.comments || '';

                  return (
                    <tr
                      key={entry.id || `row-${row.serial}`}
                      className="bg-white hover:bg-slate-50/70 transition-colors text-black"
                    >
                      {/* ১. ক্রমিক নং (Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-bold text-xs sm:text-[13px] whitespace-nowrap">
                        {toBengaliDigits(row.serial.toString())}
                      </td>

                      {/* ২. বিভাগ/মন্ত্রণালয় (Merged with rowSpan for same ministry with sticky floating) */}
                      {row.isFirstInMinistryGroup && (
                        <td
                          rowSpan={row.ministryRowSpan}
                          className="border border-black p-1.5 pt-4 text-center font-bold align-top bg-emerald-50/70 text-black text-xs sm:text-[13px] leading-snug"
                          style={{ verticalAlign: 'top', backgroundColor: 'rgba(236, 253, 245, 0.75)' }}
                        >
                          <div 
                            className="sticky-ministry-cell sticky top-[74px] z-20 py-1 px-1 bg-emerald-50/90 font-bold text-center print:static rounded-xs"
                            style={{ position: 'sticky', top: '74px', zIndex: 20, backgroundColor: '#f0fdf4' }}
                          >
                            {row.ministryName}
                          </div>
                        </td>
                      )}

                      {/* ৩. অডিট প্রতিষ্ঠানের নাম ও নিরীক্ষা সাল (একক সেলে প্রতিষ্ঠান ও শাখা) */}
                      <td 
                        className="border border-black p-2.5 text-justify align-middle text-xs sm:text-[13px] text-black leading-snug"
                        style={{ width: '320px', minWidth: '280px', textAlign: 'justify' }}
                      >
                        {(() => {
                          const { lines } = getAuditEntityAndBranch(entry, settlementEntries);
                          return (
                            <>
                              {lines.map((line, idx) => (
                                <React.Fragment key={idx}>
                                  {idx > 0 && <br style={{ msoDataPlacement: 'same-cell' } as any} />}
                                  <span 
                                    className={
                                      idx === 0 
                                        ? "font-bold text-black" 
                                        : (idx === 1 && (lines.length > 2 || /জুট মিল|ব্যাংক|সুগার মিল|টেক্সটাইল|বীমা|কর্পোরেশন|বোর্ড|সংস্থা/.test(line)))
                                          ? "font-bold text-slate-900" 
                                          : "text-blue-600 print:text-blue-600 font-semibold"
                                    }
                                    style={{ 
                                      color: idx === 0 ? '#000000' : (idx === 1 && (lines.length > 2 || /জুট মিল|ব্যাংক|সুগার মিল|টেক্সটাইল|বীমা|কর্পোরেশন|বোর্ড|সংস্থা/.test(line))) ? '#0f172a' : '#2563eb', 
                                      textAlign: 'justify' 
                                    }}
                                  >
                                    {line}
                                  </span>
                                </React.Fragment>
                              ))}
                            </>
                          );
                        })()}
                      </td>

                      {/* ৪. ডায়েরি নং (ডায়েরি নং ও তারিখ - একক সেলে হুবহু ২ নং ছবির মত, অখণ্ড অংশ) */}
                      <td className="border border-black p-2 text-center align-middle text-black font-semibold text-xs sm:text-[13px] leading-tight">
                        <span className="inline-block whitespace-nowrap">
                          {toBengaliDigits(diaryNo)}{diaryDate && diaryDate !== '-' ? ',' : ''}
                        </span>
                        {diaryDate && diaryDate !== '-' && (
                          <>
                            {' '}
                            <span className="inline-block whitespace-nowrap">
                              {toBengaliDigits(diaryDate)}
                            </span>
                          </>
                        )}
                      </td>

                      {/* ৫. পত্র নং (পত্র নং ও তারিখ - একক সেলে হুবহু ২ নং ছবির মত, অখণ্ড অংশ) */}
                      <td className="border border-black p-2 text-center align-middle text-black font-semibold text-xs sm:text-[13px] leading-tight">
                        <span className="inline-block whitespace-nowrap">
                          {toBengaliDigits(letterNo)}{letterDate && letterDate !== '-' ? ',' : ''}
                        </span>
                        {letterDate && letterDate !== '-' && (
                          <>
                            {' '}
                            <span className="inline-block whitespace-nowrap">
                              {toBengaliDigits(letterDate)}
                            </span>
                          </>
                        )}
                      </td>

                      {/* ৬. চিঠির ধরণ (বিএসআর - Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-semibold text-xs sm:text-[13px] text-black whitespace-nowrap">
                        {letterTypeDisplay}
                      </td>

                      {/* ৭. আর্কাইভ নং (Centered - কোনো নম্বর বা ডিজিট ভাঙবে না) */}
                      <td className="border border-black p-2 text-center align-middle font-semibold text-xs sm:text-[13px] text-black leading-snug">
                        {(() => {
                          if (!archiveNo) return '';
                          const rawBn = toBengaliDigits(archiveNo);
                          const parts = rawBn.split(',').map(p => p.trim()).filter(Boolean);
                          if (parts.length <= 1) {
                            return <span className="inline-block whitespace-nowrap">{rawBn}</span>;
                          }
                          return parts.map((part, pIdx) => (
                            <React.Fragment key={pIdx}>
                              <span className="inline-block whitespace-nowrap">
                                {part}{pIdx < parts.length - 1 ? ',' : ''}
                              </span>
                              {pIdx < parts.length - 1 && ' '}
                            </React.Fragment>
                          ));
                        })()}
                      </td>

                      {/* ৮. মন্তব্য (Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-medium text-xs sm:text-[13px] text-black">
                        {remarks ? toBengaliDigits(remarks) : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
</div>
  );
};

export default BsrReceivedReturn;
