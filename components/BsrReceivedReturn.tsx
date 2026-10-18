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
  Copy
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
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  const branchRef = useRef<HTMLDivElement>(null);
  const letterTypeRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);

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

  // Date range formatted labels in Bengali
  const dateRangeDisplayBN = useMemo(() => {
    const sStr = formatDateDMY(startDate);
    const eStr = formatDateDMY(endDate);
    return `${toBengaliDigits(sStr)} হতে ${toBengaliDigits(eStr)}`;
  }, [startDate, endDate]);

  // Subject title matching Image 2 exactly:
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
    const htmlContent = `
      <div style="font-family: 'Noto Sans Bengali', Arial, sans-serif;">
        <p style="font-size: 13pt; font-weight: bold; margin-bottom: 8pt; text-align: left; color: #000000; line-height: 1.4;">
          ${subjectTitleBN}
        </p>
        <table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #000000; font-size: 10pt; font-family: 'Noto Sans Bengali', Arial, sans-serif;">
          ${cloned.innerHTML}
        </table>
      </div>
    `;

    const plainText = `${subjectTitleBN}\n\n` + tableEl.innerText;

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

    const filename = `বিএসআর_প্রাপ্তির_রিটার্ন_${dateRangeDisplayBN.replace(/\s+/g, '_')}.xls`;

    // Note: The title is intentionally NOT placed inside the Excel sheet so that when the user
    // copies from Excel to Word, the Word table will NOT have the title inside the table!
    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <title>${subjectTitleBN}</title>
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
    <div id="bsr-received-report-container" className="w-full bg-white p-3 sm:p-5 rounded-none animate-in fade-in duration-300 relative font-sans">
      {IDBadge && <IDBadge id="bsr-received-report-container" />}

      {/* Non-Print Top Toolbar & Filters */}
      <div className="no-print mb-4 pb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button & Title tag */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-3 h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              title="রিটার্ন তালিকায় ফিরে যান"
            >
              <ChevronLeft size={16} />
              <span>পেছনে ফিরুন</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3.5 h-[38px] bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-black text-xs shadow-xs">
            <Mail size={15} className="text-blue-600" />
            <span>প্রাপ্ত পত্র: {filterLetterType === 'সকল' || filterLetterType === 'বিএসআর' ? 'বিএসআর প্রাপ্তির রিটার্ন' : `${filterLetterType} প্রাপ্তির রিটার্ন`}</span>
          </div>
        </div>

        {/* Center / Right: Filters (Branch, Letter Type, Date Range, Search, Excel, Print) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ১. শাখা ফিল্টার ড্রপডাউন */}
          <div className="relative z-[500]" ref={branchRef}>
            <button
              type="button"
              onClick={() => setIsBranchOpen(!isBranchOpen)}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shadow-xs cursor-pointer"
            >
              <Filter size={13} className="text-slate-600" />
              <span className="text-slate-500">শাখা:</span>
              <span className="font-black text-blue-900">{filterBranch}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isBranchOpen ? 'rotate-180' : ''}`} />
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

          {/* ৭. প্রিন্ট বাটন */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            title="প্রিন্ট করুন"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Main Official Printable Report Area (Harking back strictly to Image 2) */}
      <div className="w-full bg-white print:p-0">
        {/* Title Line (হুবহু ২ নং ছবি অনুযায়ী) */}
        <div className="mb-2 text-left">
          <p className="font-bold text-[14px] sm:text-[15.5px] text-black leading-snug tracking-tight">
            {subjectTitleBN}
          </p>
        </div>

        {/* The 8-Column Exact Table from Image 2 */}
        <div className="table-container qr-table-container relative w-full overflow-visible">
          <table
            id="table-bsr-received-return-main"
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
              <tr className="bg-white text-black font-bold h-[38px]">
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
              <tr className="bg-white text-black font-bold h-[26px]">
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(১)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(২)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৩)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৪)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৫)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৬)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৭)</th>
                <th style={{ msoNumberFormat: '\\@' } as any} className="border border-black py-0.5 text-center font-bold whitespace-nowrap">(৮)</th>
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
                          className="border border-black p-1.5 text-center font-bold align-top bg-white text-black text-xs sm:text-[13px] leading-snug"
                          style={{ verticalAlign: 'top' }}
                        >
                          <div 
                            className="sticky-ministry-cell sticky top-[66px] z-20 py-1 px-1 bg-white font-bold text-center print:static"
                            style={{ position: 'sticky', top: '66px', zIndex: 20 }}
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

                      {/* ৪. ডায়েরি নং (ডায়েরি নং ও তারিখ - একক সেলে হুবহু ২ নং ছবির মত) */}
                      <td className="border border-black p-2 text-center align-middle whitespace-nowrap text-black font-semibold text-xs sm:text-[13px] leading-tight">
                        {diaryDate && diaryDate !== '-' 
                          ? `${toBengaliDigits(diaryNo)}, ${toBengaliDigits(diaryDate)}`
                          : toBengaliDigits(diaryNo)}
                      </td>

                      {/* ৫. পত্র নং (পত্র নং ও তারিখ - একক সেলে হুবহু ২ নং ছবির মত) */}
                      <td className="border border-black p-2 text-center align-middle whitespace-nowrap text-black font-semibold text-xs sm:text-[13px] leading-tight">
                        {letterDate && letterDate !== '-' 
                          ? `${toBengaliDigits(letterNo)}, ${toBengaliDigits(letterDate)}`
                          : toBengaliDigits(letterNo)}
                      </td>

                      {/* ৬. চিঠির ধরণ (বিএসআর - Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-semibold text-xs sm:text-[13px] text-black whitespace-nowrap">
                        {letterTypeDisplay}
                      </td>

                      {/* ৭. আর্কাইভ নং (Centered) */}
                      <td className="border border-black p-2 text-center align-middle font-semibold text-xs sm:text-[13px] text-black whitespace-nowrap">
                        {archiveNo ? toBengaliDigits(archiveNo) : ''}
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
      </div>
    </div>
  );
};

export default BsrReceivedReturn;
