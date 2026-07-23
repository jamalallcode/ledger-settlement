import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SettlementEntry, ParaType, ParagraphDetail, FinancialCategory, GroupOption } from '../types.ts';
import SearchableSelect from './SearchableSelect.tsx';
import DeleteConfirmationModal from './DeleteConfirmationModal.tsx';
import { MINISTRIES_LIST, MINISTRY_ENTITY_MAP, ENTITY_BRANCH_MAP, AUDIT_YEARS_OPTIONS } from '../constants.ts';
import { Trash2, Globe, Sparkles, X, Building2, Building, AlertCircle, CheckCircle2, Calendar, FileText, Banknote, Archive, BookOpen, Send, FileEdit, Layout, Fingerprint, Info, BarChart3, ListOrdered, ArrowRightCircle, Check, ShieldCheck, Trash, MessageSquare, ArrowRight, Plus, Hash, ChevronDown, CheckCircle } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits, extractEntryDate } from '../utils/numberUtils.ts';
import { getCycleForDate, isEntryLate } from '../utils/cycleHelper.ts';
import { getDateError } from '../utils/dateValidation';
import { format } from 'date-fns';
import { isSFI, isNonSFI, getBranchVariations } from '../utils/branchUtils';

/**
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 */

const generateSafeId = () => {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

const inputBaseCls = "w-full h-[48px] px-4 border-2 rounded-xl font-bold bg-white text-slate-900 outline-none shadow-sm transition-all text-[14px] focus:ring-4";
const getDynamicInputCls = (value: any) => {
  const isFilled = value && value.toString().trim() !== '' && value !== '০' && value.toString() !== '0';
  return `${inputBaseCls} ${isFilled ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-50' : 'border-red-500 focus:border-red-600 focus:ring-red-50'}`;
};
const labelCls = "block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-1.5";
const numBadge = "inline-flex items-center justify-center w-5 h-5 bg-white text-slate-600 rounded-md text-[10px] font-black mr-1 shadow-sm shrink-0";
const colWrapperCls = "p-5 rounded-2xl border transition-all hover:shadow-lg relative min-w-0";

const IDBadge = ({ id }: { id: string }) => (
  <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded-md shadow-sm z-10 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
    {id}
  </div>
);

const SegmentedInput = ({ 
  id, icon: Icon, label, color, noValue, dayValue, monthValue, yearValue, 
  noSetter, daySetter, monthSetter, yearSetter, dayRef, monthRef, yearRef, 
  isFocused, focusSetter, extra, error, warning, num 
}: any) => {
  const datePickerRef = useRef<HTMLInputElement>(null);
  
  const handleSegmentChange = (val: string, type: 'day'|'month'|'year', setter: (v: string) => void, nextRef?: React.RefObject<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(val).replace(/[^0-9]/g, '');
    if (type === 'day') {
      if (cleaned.length <= 2) {
        if (cleaned.length === 2 && parseInt(cleaned) > 31) return;
        setter(toBengaliDigits(cleaned));
        if (cleaned.length === 2 && nextRef) nextRef.current?.focus();
      }
    } else if (type === 'month') {
      if (cleaned.length <= 2) {
        if (cleaned.length === 2 && parseInt(cleaned) > 12) return;
        setter(toBengaliDigits(cleaned));
        if (cleaned.length === 2 && nextRef) nextRef.current?.focus();
      }
    } else if (type === 'year') {
      if (cleaned.length <= 4) setter(toBengaliDigits(cleaned));
    }
  };

  const handleSegmentBlur = (val: string, type: 'day'|'month'|'year', setter: (v: string) => void) => {
    const eng = toEnglishDigits(val);
    if (type === 'year' && eng.length === 2) setter(toBengaliDigits('20' + eng));
    else if (eng.length === 1 && eng !== '') setter(toBengaliDigits('0' + eng));
  };

  const isFilled = [noValue, dayValue, monthValue, yearValue].every(v => v && v.toString().trim() !== '' && v !== '০' && v !== '0');

  return (
    <div id={id} className={colWrapperCls + ` ${error ? 'bg-red-50 border-red-200' : (warning ? 'bg-amber-50 border-amber-200' : `bg-${color}-50/70 border-${color}-100 hover:border-${color}-300`)}`}>
      <label className={labelCls + " truncate"}><span className={numBadge}>{num || toBengaliDigits(id.split('-')[1].replace(/[ab]/g, ''))}</span> <Icon size={14} className={`${error ? 'text-red-600' : (warning ? 'text-amber-600' : `text-${color}-600`)} shrink-0`} /> <span className="truncate">{label}</span></label>
      <div className={`relative w-full h-[55px] flex items-center border-2 rounded-2xl bg-white transition-all duration-300 shadow-sm ${error ? 'border-red-400 ring-4 ring-red-50' : (warning ? 'border-amber-400 ring-4 ring-amber-50' : (isFilled ? 'border-emerald-500 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50' : 'border-red-500 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-50'))}`}>
        {extra}
        <div className="flex items-center w-full px-2 sm:px-4 h-full">
          {noValue !== 'DATE_ONLY' && (
            <>
              <div className="relative flex-[2.5] h-full flex items-center min-w-0">
                {(!isFocused && !noValue) && <span className="text-[9px] sm:text-[11px] font-black text-slate-400 select-none absolute left-0 pointer-events-none">নং-</span>}
                <input 
                  type="text" 
                  className={`w-full bg-transparent border-none outline-none font-black text-slate-800 text-[10px] sm:text-[12px] p-0 transition-all ${(!isFocused && !noValue) ? 'pl-5 sm:pl-6' : 'pl-0'}`}
                  value={noValue}
                  onFocus={() => focusSetter(true)}
                  onBlur={() => focusSetter(false)}
                  onChange={e => {
                    const raw = e.target.value;
                    noSetter(toBengaliDigits(raw));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') dayRef.current?.focus();
                  }}
                />
              </div>
              <div className="h-6 w-[1px] sm:w-[1.5px] bg-slate-200 mx-1 sm:mx-2 shrink-0"></div>
            </>
          )}
          <div className="relative flex-1 h-full flex items-center justify-center gap-0.5 sm:gap-1 shrink-0">
            <input 
              ref={dayRef}
              type="text" 
              className="w-5 sm:w-7 bg-transparent border-none outline-none font-black text-slate-800 text-[10px] sm:text-[12px] p-0 text-center placeholder-slate-300"
              value={dayValue}
              onChange={e => handleSegmentChange(e.target.value, 'day', daySetter, monthRef)}
              onBlur={(e) => handleSegmentBlur(e.target.value, 'day', daySetter)}
              placeholder="..."
            />
            <span className="text-slate-300 font-black text-[10px] sm:text-[12px]">/</span>
            <input 
              ref={monthRef}
              type="text" 
              className="w-5 sm:w-7 bg-transparent border-none outline-none font-black text-slate-800 text-[10px] sm:text-[12px] p-0 text-center placeholder-slate-300"
              value={monthValue}
              onChange={e => handleSegmentChange(e.target.value, 'month', monthSetter, yearRef)}
              onBlur={(e) => handleSegmentBlur(e.target.value, 'month', monthSetter)}
              placeholder="..."
            />
            <span className="text-slate-300 font-black text-[10px] sm:text-[12px]">/</span>
            <input 
              ref={yearRef}
              type="text" 
              className="w-9 sm:w-12 bg-transparent border-none outline-none font-black text-slate-800 text-[10px] sm:text-[12px] p-0 text-center placeholder-slate-300"
              value={yearValue}
              onChange={e => handleSegmentChange(e.target.value, 'year', yearSetter)}
              onBlur={(e) => handleSegmentBlur(e.target.value, 'year', yearSetter)}
              placeholder="...."
            />
          </div>
          <div className="relative flex items-center justify-center ml-2 mr-4 h-8 shrink-0">
            <input 
              type="date" 
              ref={datePickerRef}
              className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const [y, m, d] = val.split('-');
                  daySetter(toBengaliDigits(d));
                  monthSetter(toBengaliDigits(m));
                  yearSetter(toBengaliDigits(y));
                }
              }}
              onClick={(e) => {
                try {
                  (e.target as any).showPicker();
                } catch (err) {
                  // Fallback for older browsers
                }
              }}
            />
            <Calendar size={18} className="text-slate-400" />
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-2 text-[10px] font-black text-red-600 animate-in slide-in-from-top-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}
      {warning && (
        <div className="mt-2 text-[10px] font-black text-amber-600 animate-in slide-in-from-top-1 flex items-center gap-1">
          <AlertCircle size={10} /> {warning}
        </div>
      )}
    </div>
  );
};

interface SettlementEntryModuleProps {
  onAdd: (entry: Omit<SettlementEntry, 'id' | 'sl' | 'createdAt'> | SettlementEntry) => void;
  onViewRegister: () => void;
  nextSl: number;
  branchSuggestions: GroupOption[];
  initialEntry?: SettlementEntry | null;
  onCancel?: () => void;
  onBackToMenu: () => void;
  isAdmin?: boolean;
  existingEntries?: SettlementEntry[];
  navigateToEntry?: (id: string, type: 'settlement' | 'correspondence', searchNo?: string) => void;
  showAuditDetails?: boolean;
}

const SettlementEntryModule: React.FC<SettlementEntryModuleProps> = ({ 
  onAdd, 
  onViewRegister, 
  nextSl, 
  branchSuggestions, 
  initialEntry, 
  onCancel, 
  onBackToMenu, 
  isAdmin = false,
  existingEntries = [],
  navigateToEntry,
  showAuditDetails = true
}) => {
  const dynamicAuditYearsOptions = useMemo(() => {
    const years = new Set<string>();
    // First, populate with default years from AUDIT_YEARS_OPTIONS
    AUDIT_YEARS_OPTIONS.forEach(group => {
      group.options.forEach(opt => years.add(opt));
    });
    // Then, add any custom years from existingEntries
    existingEntries.forEach(e => {
      if (e.auditYear) years.add(e.auditYear);
    });
    // Convert to sorted array or preserve the order
    const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
    return [{ label: "সাল", options: sortedYears }];
  }, [existingEntries]);

  const [formData, setFormData] = useState({
    paraType: 'এসএফআই' as ParaType, 
    meetingType: 'বিএসআর',
    ministryName: '',
    entityName: '',
    branchName: '',
    auditYear: '',
    letterNoDate: '',
    meetingWorkpaper: '', 
    workpaperNoDate: '', 
    issueLetterNoDate: '', 
    issueDateISO: '', 
    archiveNo: '',
    meetingSentParaCount: '',
    sentParaInvolvedAmount: 0,
    meetingDiscussedParaCount: '',
    meetingRecommendedParaCount: '',
    meetingSettledParaCount: '',
    meetingFullSettledParaCount: '',
    meetingPartialSettledParaCount: '',
    meetingUnsettledParas: '',
    meetingUnsettledAmount: 0,
    totalInvolvedAmount: 0,
    isMeeting: false,
    isOnline: 'না',
    remarks: '',
    meetingDate: '',
    meetingResponseDate: '',
    manualRaisedCount: null as string | null,
    manualRaisedAmount: null as number | null
  });

  const [wizardStep, setWizardStep] = useState('details'); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeletingPara, setIsDeletingPara] = useState(false);
  const [paraToDeleteId, setParaToDeleteId] = useState<string | null>(null);
  const [deletingLocalParaId, setDeletingLocalParaId] = useState<string | null>(null);
  const isSubmitting = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [letterNoPart, setLetterNoPart] = useState('');
  const [letterDay, setLetterDay] = useState('');
  const [letterMonth, setLetterMonth] = useState('');
  const [letterYear, setLetterYear] = useState('');

  const [wpNoPart, setWpNoPart] = useState('');
  const [wpDay, setWpDay] = useState('');
  const [wpMonth, setWpMonth] = useState('');
  const [wpYear, setWpYear] = useState('');

  const [mrDay, setMrDay] = useState('');
  const [mrMonth, setMrMonth] = useState('');
  const [mrYear, setMrYear] = useState('');

  const [diaryNoPart, setDiaryNoPart] = useState('');
  const [diaryDay, setDiaryDay] = useState('');
  const [diaryMonth, setDiaryMonth] = useState('');
  const [diaryYear, setDiaryYear] = useState('');

  const [issueNoPart, setIssueNoPart] = useState('');
  const [dayPart, setDayPart] = useState('');
  const [monthPart, setMonthPart] = useState('');
  const [yearPart, setYearPart] = useState('');
  
  const [isIssueFocused, setIsIssueFocused] = useState(false);
  const [isLetterFocused, setIsLetterFocused] = useState(false);
  const [isWpFocused, setIsWpFocused] = useState(false);
  const [isDiaryFocused, setIsDiaryFocused] = useState(false);
  const [isMrFocused, setIsMrFocused] = useState(false);

  const missingNumbersWarning = useMemo(() => {
    return !letterNoPart.trim() && !diaryNoPart.trim() && !issueNoPart.trim();
  }, [letterNoPart, diaryNoPart, issueNoPart]);

  const duplicates = useMemo(() => {
    if (!existingEntries || existingEntries.length === 0) return { letterNo: false, diaryNo: false, issueNo: false, any: false };
    
    const findDuplicate = (combinedStr: string | undefined, prefixRegex: RegExp, searchNo: string) => {
      if (!combinedStr || !searchNo.trim()) return null;
      // Extract the number part more reliably
      // The format is "Prefix Number, DatePrefix Date"
      const firstPart = combinedStr.split(',')[0];
      // Handle cases where the prefix might be missing or just "নং-"
      const cleanRegex = new RegExp(`(${prefixRegex.source}|নং[:\\-]?\\s*)`, 'g');
      const extractedNo = firstPart.replace(cleanRegex, '').replace(/\s+/g, '');
      
      const engExtracted = toEnglishDigits(extractedNo);
      const engSearch = toEnglishDigits(searchNo.replace(/\s+/g, ''));
      
      return engExtracted === engSearch;
    };

    const letterDuplicate = letterNoPart ? existingEntries.find(e => {
      if (initialEntry && e.id === initialEntry.id) return false;
      return findDuplicate(e.letterNoDate, /পত্র\s+নং[:\-]?\s*/g, letterNoPart);
    }) : null;

    const diaryDuplicate = diaryNoPart ? existingEntries.find(e => {
      if (initialEntry && e.id === initialEntry.id) return false;
      return findDuplicate(e.workpaperNoDate, /ডায়েরি\s+নং[:\-]?\s*/g, diaryNoPart);
    }) : null;

    const issueDuplicate = issueNoPart ? existingEntries.find(e => {
      if (initialEntry && e.id === initialEntry.id) return false;
      return findDuplicate(e.issueLetterNoDate, /জারিপত্র\s+নং[:\-]?\s*/g, issueNoPart);
    }) : null;

    return {
      letterNo: !!letterDuplicate,
      diaryNo: !!diaryDuplicate,
      issueNo: !!issueDuplicate,
      letterEntryId: letterDuplicate?.id,
      diaryEntryId: diaryDuplicate?.id,
      issueEntryId: issueDuplicate?.id,
      any: !!letterDuplicate || !!diaryDuplicate || !!issueDuplicate
    };
  }, [letterNoPart, diaryNoPart, issueNoPart, existingEntries, initialEntry]);

  const isDuplicate = duplicates.any;

  const letterDayRef = useRef<HTMLInputElement>(null);
  const letterMonthRef = useRef<HTMLInputElement>(null);
  const letterYearRef = useRef<HTMLInputElement>(null);
  const wpDayRef = useRef<HTMLInputElement>(null);
  const wpMonthRef = useRef<HTMLInputElement>(null);
  const wpYearRef = useRef<HTMLInputElement>(null);
  const mrDayRef = useRef<HTMLInputElement>(null);
  const mrMonthRef = useRef<HTMLInputElement>(null);
  const mrYearRef = useRef<HTMLInputElement>(null);
  const diaryDayRef = useRef<HTMLInputElement>(null);
  const diaryMonthRef = useRef<HTMLInputElement>(null);
  const diaryYearRef = useRef<HTMLInputElement>(null);
  const issueDayRef = useRef<HTMLInputElement>(null);
  const issueMonthRef = useRef<HTMLInputElement>(null);
  const issueYearRef = useRef<HTMLInputElement>(null);

  const extractSegments = (combined: string, noPrefix: string, datePrefix: string) => {
    if (!combined || !combined.trim()) return { no: '', d: '', m: '', y: '' };
    const parts = combined.split(',');
    let no = '';
    let d = '', m = '', y = '';
    
    if (parts.length >= 1) {
      // Clean all possible number prefixes globally to handle corrupted data
      const cleanRegex = /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g;
      no = parts[0].replace(cleanRegex, '').trim();
    }
    if (parts.length >= 2) {
      // Clean all possible date prefixes globally
      const cleanDateRegex = /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g;
      const dateStr = parts[1].replace(cleanDateRegex, '').trim();
      const dateParts = toEnglishDigits(dateStr).split(/[\/\-]/);
      if (dateParts.length === 3) {
        d = toBengaliDigits(dateParts[0]);
        m = toBengaliDigits(dateParts[1]);
        y = toBengaliDigits(dateParts[2]);
      }
    }
    return { no, d, m, y };
  };

  useEffect(() => {
    if (initialEntry) {
      setFormData({
        paraType: initialEntry.paraType || 'এসএফআই',
        meetingType: initialEntry.meetingType || (initialEntry.isMeeting ? 'ত্রিপক্ষীয় সভা' : 'বিএসআর'),
        ministryName: initialEntry.ministryName || '',
        entityName: initialEntry.entityName || '',
        branchName: initialEntry.branchName || '',
        auditYear: initialEntry.auditYear || '',
        letterNoDate: initialEntry.letterNoDate || '',
        meetingWorkpaper: initialEntry.meetingWorkpaper || '',
        workpaperNoDate: initialEntry.workpaperNoDate || '',
        issueLetterNoDate: initialEntry.issueLetterNoDate || '',
        issueDateISO: initialEntry.issueDateISO || '',
        archiveNo: initialEntry.archiveNo || '',
        meetingSentParaCount: initialEntry.meetingSentParaCount || '',
        sentParaInvolvedAmount: initialEntry.sentParaInvolvedAmount || 0,
        meetingDiscussedParaCount: initialEntry.meetingDiscussedParaCount || '',
        meetingRecommendedParaCount: initialEntry.meetingRecommendedParaCount || '',
        meetingSettledParaCount: initialEntry.meetingSettledParaCount || '',
        meetingFullSettledParaCount: initialEntry.meetingFullSettledParaCount || '',
        meetingPartialSettledParaCount: initialEntry.meetingPartialSettledParaCount || '',
        meetingUnsettledParas: initialEntry.meetingUnsettledParas || '',
        meetingUnsettledAmount: initialEntry.meetingUnsettledAmount || 0,
        totalInvolvedAmount: initialEntry.totalInvolvedAmount || 0,
        isMeeting: initialEntry.isMeeting || false,
        isOnline: (initialEntry as any).isOnline || initialEntry.isSentOnline || 'না',
        remarks: initialEntry.remarks || '',
        meetingDate: initialEntry.meetingDate || '',
        meetingResponseDate: initialEntry.meetingResponseDate || '',
        manualRaisedCount: initialEntry.manualRaisedCount || null,
        manualRaisedAmount: initialEntry.manualRaisedAmount || null
      });

      const f7 = extractSegments(initialEntry.letterNoDate, 'পত্র নং-', 'পত্রের তারিখ-');
      setLetterNoPart(f7.no); setLetterDay(f7.d); setLetterMonth(f7.m); setLetterYear(f7.y);

      const f8 = extractSegments(initialEntry.meetingWorkpaper, 'কার্যপত্র নং-', 'কার্যপত্রের তারিখ-');
      setWpNoPart(f8.no); setWpDay(f8.d); setWpMonth(f8.m); setWpYear(f8.y);

      if (initialEntry.meetingResponseDate) {
        const cleanDate = toEnglishDigits(initialEntry.meetingResponseDate);
        const parts = cleanDate.split(/[\/\-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            setMrDay(toBengaliDigits(parts[2]));
            setMrMonth(toBengaliDigits(parts[1]));
            setMrYear(toBengaliDigits(parts[0]));
          } else {
            setMrDay(toBengaliDigits(parts[0]));
            setMrMonth(toBengaliDigits(parts[1]));
            setMrYear(toBengaliDigits(parts[2]));
          }
        } else {
          setMrDay(''); setMrMonth(''); setMrYear('');
        }
      } else {
        setMrDay(''); setMrMonth(''); setMrYear('');
      }

      const f10 = extractSegments(initialEntry.workpaperNoDate, 'ডায়েরি নং-', 'ডায়েরির তারিখ-');
      setDiaryNoPart(f10.no); setDiaryDay(f10.d); setDiaryMonth(f10.m); setDiaryYear(f10.y);

      const f11 = extractSegments(initialEntry.issueLetterNoDate, 'জারিপত্র নং-', 'জারিপত্রের তারিখ-');
      setIssueNoPart(f11.no); setDayPart(f11.d); setMonthPart(f11.m); setYearPart(f11.y);
      
      const entryParas = initialEntry.paragraphs || [];
      setParagraphs([...entryParas]);
      
      const newRaw: Record<string, string> = {};
      entryParas.forEach(p => {
        newRaw[`${p.id}-paraNo`] = toBengaliDigits(p.paraNo);
        newRaw[`${p.id}-involvedAmount`] = p.involvedAmount === 0 ? '' : toBengaliDigits(p.involvedAmount);
        newRaw[`${p.id}-recoveredAmount`] = p.recoveredAmount === 0 ? '' : toBengaliDigits(p.recoveredAmount);
        newRaw[`${p.id}-adjustedAmount`] = p.adjustedAmount === 0 ? '' : toBengaliDigits(p.adjustedAmount);
        newRaw[`${p.id}-vatRec`] = p.vatRec === 0 ? '' : toBengaliDigits(p.vatRec);
        newRaw[`${p.id}-vatAdj`] = p.vatAdj === 0 ? '' : toBengaliDigits(p.vatAdj);
        newRaw[`${p.id}-itRec`] = p.itRec === 0 ? '' : toBengaliDigits(p.itRec);
        newRaw[`${p.id}-itAdj`] = p.itAdj === 0 ? '' : toBengaliDigits(p.itAdj);
        newRaw[`${p.id}-othersRec`] = p.othersRec === 0 ? '' : toBengaliDigits(p.othersRec);
        newRaw[`${p.id}-othersAdj`] = p.othersAdj === 0 ? '' : toBengaliDigits(p.othersAdj);
      });
      
      if (initialEntry.manualRaisedCount) newRaw['entry-raised-count'] = toBengaliDigits(initialEntry.manualRaisedCount);
      if (initialEntry.manualRaisedAmount) newRaw['entry-raised-amount'] = toBengaliDigits(initialEntry.manualRaisedAmount);

      setRawInputs(newRaw);
      setWizardStep('details');
    }
  }, [initialEntry]);

  const buildCombinedString = (no: string, d: string, m: string, y: string, noPrefix: string = 'নং-', datePrefix: string = 'তারিখ-') => {
    const day = d ? (toEnglishDigits(d).length === 1 ? '0' + toEnglishDigits(d) : toEnglishDigits(d)) : '';
    const month = m ? (toEnglishDigits(m).length === 1 ? '0' + toEnglishDigits(m) : toEnglishDigits(m)) : '';
    let year = toEnglishDigits(y);
    if (year.length === 2) year = '20' + year;
    const formattedDate = (day && month && year.length === 4) ? `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(year)}` : '';
    
    // Strip any existing prefix from 'no' globally before adding the desired one
    const cleanNo = no.trim().replace(/(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g, '').trim();
    
    if (!cleanNo && !formattedDate) return '';

    const noPart = cleanNo ? `${noPrefix} ${cleanNo}` : '';
    const datePart = formattedDate ? `${datePrefix} ${formattedDate}` : '';
    
    if (noPart && datePart) return `${noPart}, ${datePart}`;
    return noPart || datePart;
  };

  const getIsoFromSegments = (d: string, m: string, y: string) => {
    const day = toEnglishDigits(d), month = toEnglishDigits(m); let year = toEnglishDigits(y);
    if (year.length === 2) year = '20' + year;
    if (day && month && year.length === 4) {
      try {
        const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');
      } catch (e) {}
    }
    return '';
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, letterNoDate: buildCombinedString(letterNoPart, letterDay, letterMonth, letterYear, 'পত্র নং-', 'পত্রের তারিখ-') }));
  }, [letterNoPart, letterDay, letterMonth, letterYear]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, meetingWorkpaper: buildCombinedString(wpNoPart, wpDay, wpMonth, wpYear, 'কার্যপত্র নং-', 'কার্যপত্রের তারিখ-') }));
  }, [wpNoPart, wpDay, wpMonth, wpYear]);

  useEffect(() => {
    const day = mrDay ? (toEnglishDigits(mrDay).length === 1 ? '0' + toEnglishDigits(mrDay) : toEnglishDigits(mrDay)) : '';
    const month = mrMonth ? (toEnglishDigits(mrMonth).length === 1 ? '0' + toEnglishDigits(mrMonth) : toEnglishDigits(mrMonth)) : '';
    let year = toEnglishDigits(mrYear);
    if (year.length === 2) year = '20' + year;
    const formattedDate = (day && month && year.length === 4) ? `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(year)}` : '';
    setFormData(prev => ({ ...prev, meetingResponseDate: formattedDate }));
  }, [mrDay, mrMonth, mrYear]);

  /* useMemo added to track values for validation */
  const currentDiaryISO = useMemo(() => getIsoFromSegments(diaryDay, diaryMonth, diaryYear), [diaryDay, diaryMonth, diaryYear]);
  const currentLetterISO = useMemo(() => getIsoFromSegments(letterDay, letterMonth, letterYear), [letterDay, letterMonth, letterYear]);
  const currentIssueISO = useMemo(() => getIsoFromSegments(dayPart, monthPart, yearPart), [dayPart, monthPart, yearPart]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, workpaperNoDate: buildCombinedString(diaryNoPart, diaryDay, diaryMonth, diaryYear, 'ডায়েরি নং-', 'ডায়েরির তারিখ-') }));
  }, [diaryNoPart, diaryDay, diaryMonth, diaryYear]);

  useEffect(() => {
    const combined = buildCombinedString(issueNoPart, dayPart, monthPart, yearPart, 'জারিপত্র নং-', 'জারিপত্রের তারিখ-');
    setFormData(prev => ({ ...prev, issueLetterNoDate: combined, issueDateISO: currentIssueISO }));
  }, [issueNoPart, dayPart, monthPart, yearPart, currentIssueISO]);

  const [paragraphs, setParagraphs] = useState<ParagraphDetail[]>([]);
  const [bulkParaInput, setBulkParaInput] = useState('');
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const isCatExpanded = (paraId: string, catName: string) => {
    if (expandedCats[`${paraId}-${catName}`] !== undefined) {
      return expandedCats[`${paraId}-${catName}`];
    }
    const p = paragraphs.find(x => x.id === paraId);
    if (p) {
      if (catName === 'ভ্যাট' && (p.vatRec > 0 || p.vatAdj > 0 || p.category === 'ভ্যাট')) return true;
      if (catName === 'আয়কর' && (p.itRec > 0 || p.itAdj > 0 || p.category === 'আয়কর')) return true;
      if (catName === 'অন্যান্য' && (p.othersRec > 0 || p.othersAdj > 0 || p.category === 'অন্যান্য')) return true;
    }
    return false;
  };

  const toggleCatExpanded = (paraId: string, catName: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [`${paraId}-${catName}`]: !isCatExpanded(paraId, catName)
    }));
  };

  const handleNumericInput = (id: string, field: string, val: string) => {
    const bDigits = toBengaliDigits(val);
    const engNum = parseBengaliNumber(val);
    if (id === 'entry') {
      setRawInputs(prev => ({ ...prev, [`entry-${field}`]: bDigits }));
      setFormData(prev => {
        const update = { ...prev } as any;
        if (field === 'raised-count') update.manualRaisedCount = (val.trim() === "" || val === "০" || val === "0") ? null : val;
        if (field === 'raised-amount') update.manualRaisedAmount = (val.trim() === "" || val === "০" || val === "0") ? 0 : engNum;
        return update;
      });
    } else if (id === 'direct') {
       setRawInputs(prev => ({ ...prev, [`direct-${field}`]: bDigits }));
       const isNumericField = ['meetingSentParaCount', 'meetingDiscussedParaCount', 'meetingRecommendedParaCount', 'meetingSettledParaCount', 'meetingUnsettledParas', 'meetingUnsettledAmount', 'totalInvolvedAmount', 'sentParaInvolvedAmount'].includes(field);
       setFormData(prev => ({ ...prev, [field]: isNumericField ? engNum : (val.includes('.') ? engNum : bDigits) } as any));
    } else {
      setRawInputs(prev => ({ ...prev, [`${id}-${field}`]: bDigits }));
      setParagraphs(prev => prev.map(p => {
        if (p.id === id) {
          let updated = { ...p, [field]: engNum };
          
          if (field === 'recoveredAmount') {
            if (!updated.isAdvanced) {
              if (updated.category === 'ভ্যাট') {
                updated.vatRec = engNum;
                updated.itRec = 0;
                updated.othersRec = 0;
              } else if (updated.category === 'আয়কর') {
                updated.vatRec = 0;
                updated.itRec = engNum;
                updated.othersRec = 0;
              } else {
                updated.vatRec = 0;
                updated.itRec = 0;
                updated.othersRec = engNum;
              }
            }
          } else if (field === 'adjustedAmount') {
            if (!updated.isAdvanced) {
              if (updated.category === 'ভ্যাট') {
                updated.vatAdj = engNum;
                updated.itAdj = 0;
                updated.othersAdj = 0;
              } else if (updated.category === 'আয়কর') {
                updated.vatAdj = 0;
                updated.itAdj = engNum;
                updated.othersAdj = 0;
              } else {
                updated.vatAdj = 0;
                updated.itAdj = 0;
                updated.othersAdj = engNum;
              }
            }
          }
          
          // ALWAYS keep recoveredAmount and adjustedAmount strictly synchronized with the sum of category-specific fields!
          updated.recoveredAmount = (updated.vatRec || 0) + (updated.itRec || 0) + (updated.othersRec || 0);
          updated.adjustedAmount = (updated.vatAdj || 0) + (updated.itAdj || 0) + (updated.othersAdj || 0);
          
          return updated;
        }
        return p;
      }));
    }
  };

  const handleBulkGenerate = () => {
    if (!bulkParaInput.trim()) return;
    const nums = bulkParaInput.split(/[,，\s]+/).map(s => s.trim()).filter(s => s);
    const newItems: ParagraphDetail[] = nums.map(n => {
      const id = generateSafeId();
      setRawInputs(prev => ({ ...prev, [`${id}-paraNo`]: toBengaliDigits(n) }));
      return { id, paraNo: n, status: 'পূর্ণাঙ্গ', involvedAmount: 0, recoveredAmount: 0, adjustedAmount: 0, category: 'ভ্যাট', isAdvanced: false, vatRec: 0, vatAdj: 0, itRec: 0, itAdj: 0, othersRec: 0, othersAdj: 0 };
    });
    setParagraphs(prev => [...prev, ...newItems]);
    setBulkParaInput('');
  };

  const summaryData = {
    fullCount: paragraphs.filter(p => p.status === 'পূর্ণাঙ্গ').length,
    partialCount: paragraphs.filter(p => p.status === 'আংশিক').length,
    fullInvolved: paragraphs.filter(p => p.status === 'পূর্ণাঙ্গ').reduce((s, p) => s + p.involvedAmount, 0),
    partialInvolved: paragraphs.filter(p => p.status === 'আংশিক').reduce((s, p) => s + p.involvedAmount, 0),
    totalInvolved: paragraphs.reduce((s, p) => s + p.involvedAmount, 0),
    totalRec: paragraphs.reduce((s, p) => s + p.recoveredAmount, 0),
    totalAdj: paragraphs.reduce((s, p) => s + p.adjustedAmount, 0)
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if form is empty
    const isEmpty = !formData.ministryName && 
                    !formData.entityName && 
                    !formData.branchName && 
                    !formData.auditYear && 
                    !letterNoPart && 
                    !diaryNoPart && 
                    !issueNoPart && 
                    paragraphs.length === 0;

    if (isEmpty) {
      const container = document.getElementById('form-container-settlement');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (isSubmitting.current || isSuccess) return;
    isSubmitting.current = true;
    
    // Defer heavy work to next tick to avoid blocking UI (INP fix)
    setTimeout(() => {
      setIsSuccess(true);
      setIsDeletingPara(false);
      
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      const combinedLetter = buildCombinedString(letterNoPart, letterDay, letterMonth, letterYear, 'পত্র নং-', 'পত্রের তারিখ-');
      const combinedDiary = formData.meetingType === 'বিএসআর' ? buildCombinedString(diaryNoPart, diaryDay, diaryMonth, diaryYear, 'ডায়েরি নং-', 'ডায়েরির তারিখ-') : '';
      const combinedIssue = buildCombinedString(issueNoPart, dayPart, monthPart, yearPart, 'জারিপত্র নং-', 'জারিপত্রের তারিখ-');
      const combinedWp = formData.meetingType !== 'বিএসআর' ? buildCombinedString(wpNoPart, wpDay, wpMonth, wpYear, 'কার্যপত্র নং-', 'কার্যপত্রের তারিখ-') : '';

      const effectiveIssueISO = formData.issueDateISO || extractEntryDate({
        ...formData,
        issueLetterNoDate: combinedIssue,
        letterNoDate: combinedLetter,
        workpaperNoDate: combinedDiary,
        meetingWorkpaper: combinedWp
      });

      const now = new Date();
      let cycleLabel = '';
      let isLate = false;
      if (effectiveIssueISO) {
        const cycle = getCycleForDate(new Date(effectiveIssueISO));
        cycleLabel = cycle.label;
        isLate = isEntryLate(now, cycle.end);
      }
      const totals = paragraphs.reduce((acc, p) => {
        if (p.isAdvanced) {
          acc.vR += p.vatRec || 0;
          acc.vA += p.vatAdj || 0;
          acc.iR += p.itRec || 0;
          acc.iA += p.itAdj || 0;
          acc.oR += p.othersRec || 0;
          acc.oA += p.othersAdj || 0;
        } else {
          if (p.category === 'ভ্যাট') { acc.vR += p.recoveredAmount; acc.vA += p.adjustedAmount; }
          else if (p.category === 'আয়কর') { acc.iR += p.recoveredAmount; acc.iA += p.adjustedAmount; }
          else { acc.oR += p.recoveredAmount; acc.oA += p.adjustedAmount; }
        }
        return acc;
      }, { vR: 0, vA: 0, iR: 0, iA: 0, oR: 0, oA: 0 });
      const paraInvTotal = paragraphs.reduce((s, p) => s + p.involvedAmount, 0);
      const totalSettledAmount = paragraphs.reduce((s, p) => s + p.recoveredAmount + p.adjustedAmount, 0);
      const calculatedUnsettledAmount = (formData.totalInvolvedAmount || 0) - totalSettledAmount;

      const finalData = {
        ...formData, 
        issueDateISO: effectiveIssueISO,
        letterNoDate: combinedLetter,
        issueLetterNoDate: combinedIssue,
        workpaperNoDate: combinedDiary,
        meetingWorkpaper: combinedWp,
        meetingDate: formData.meetingType === 'বিএসআর' ? '' : formData.meetingDate,
        meetingResponseDate: formData.meetingType === 'বিএসআর' ? '' : formData.meetingResponseDate,
        meetingFullSettledParaCount: summaryData.fullCount.toString(),
        meetingPartialSettledParaCount: summaryData.partialCount.toString(),
        meetingSettledParaCount: summaryData.fullCount.toString(),
        isMeeting: formData.meetingType !== 'বিএসআর', 
        paragraphs, cycleLabel, isLate, actualEntryDate: now.toISOString(), involvedAmount: paraInvTotal + (formData.meetingUnsettledAmount || 0),
        meetingUnsettledAmount: calculatedUnsettledAmount,
        totalUnsettledAmount: calculatedUnsettledAmount,
        vatRec: totals.vR, vatAdj: totals.vA, itRec: totals.iR, itAdj: totals.iA, othersRec: totals.oR, othersAdj: totals.oA, totalRec: totals.vR + totals.iR + totals.oR, totalAdj: totals.vA + totals.iA + totals.oA,
        isSentOnline: (formData as any).isOnline
      };

      onAdd(finalData);
      isSubmitting.current = false;
      resetForm();
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      paraType: 'এসএফআই' as ParaType, 
      meetingType: 'বিএসআর',
      ministryName: '',
      entityName: '',
      branchName: '',
      auditYear: '',
      letterNoDate: '',
      meetingWorkpaper: '', 
      workpaperNoDate: '', 
      issueLetterNoDate: '', 
      issueDateISO: '', 
      archiveNo: '',
      meetingSentParaCount: '',
      sentParaInvolvedAmount: 0,
      meetingDiscussedParaCount: '',
      meetingRecommendedParaCount: '',
      meetingSettledParaCount: '',
      meetingFullSettledParaCount: '',
      meetingPartialSettledParaCount: '',
      meetingUnsettledParas: '',
      meetingUnsettledAmount: 0,
      totalInvolvedAmount: 0,
      isMeeting: false,
      isOnline: 'না',
      remarks: '',
      meetingDate: '',
      meetingResponseDate: '',
      manualRaisedCount: null as string | null,
      manualRaisedAmount: null as number | null
    });
    setLetterNoPart(''); setLetterDay(''); setLetterMonth(''); setLetterYear('');
    setWpNoPart(''); setWpDay(''); setWpMonth(''); setWpYear('');
    setMrDay(''); setMrMonth(''); setMrYear('');
    setDiaryNoPart(''); setDiaryDay(''); setDiaryMonth(''); setDiaryYear('');
    setIssueNoPart(''); setDayPart(''); setMonthPart(''); setYearPart('');
    setParagraphs([]);
    setRawInputs({});
  };

  const handleNewEntry = () => {
    setIsSuccess(false);
    setWizardStep('details');
    // Scroll to top
    const container = document.getElementById('form-container-settlement');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset success state if user starts typing again
  useEffect(() => {
    if (isSuccess && !isDeletingPara) {
      const isDirty = 
        formData.ministryName !== '' || 
        formData.entityName !== '' || 
        formData.branchName !== '' || 
        formData.auditYear !== '' ||
        letterNoPart !== '' ||
        wpNoPart !== '' ||
        diaryNoPart !== '' ||
        issueNoPart !== '' ||
        paragraphs.length > 0;
      
      if (isDirty) {
        setIsSuccess(false);
      }
    }
  }, [
    isSuccess,
    isDeletingPara,
    formData.ministryName, 
    formData.entityName, 
    formData.branchName, 
    formData.auditYear,
    letterNoPart,
    wpNoPart,
    diaryNoPart,
    issueNoPart,
    paragraphs.length
  ]);

  const formatSummaryNum = (val: number) => {
    if (val === 0) return '০';
    return toBengaliDigits(Math.round(val).toLocaleString('en-IN'));
  };

  const col1Style = `${colWrapperCls} bg-sky-50/70 border-sky-100 hover:border-sky-300`;
  const col2Style = `${colWrapperCls} bg-emerald-50/70 border-emerald-100 hover:border-emerald-300`;
  const col3Style = `${colWrapperCls} bg-amber-50/70 border-amber-100 hover:border-amber-300`;
  const col4Style = `${colWrapperCls} bg-purple-50/70 border-purple-100 hover:border-purple-300`;

  const entityOpts = formData.ministryName ? (MINISTRY_ENTITY_MAP[formData.ministryName] || []) : [];
  const branchOpts = formData.entityName ? (ENTITY_BRANCH_MAP[formData.entityName] || []) : [];

  const isUpdateMode = !!initialEntry;
  const deletedCount = isUpdateMode ? (initialEntry?.paragraphs?.length || 0) - paragraphs.length : 0;

  // Chronological Validations for Settlement
  const diaryDateError = getDateError(currentDiaryISO, currentLetterISO, 'ডায়েরি তারিখ', 'পত্রের তারিখ');
  const issueDateError = getDateError(currentIssueISO, currentDiaryISO, 'জারিপত্র তারিখ', 'ডায়েরি তারিখ');

  if (wizardStep === 'selection') {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8 max-w-4xl mx-auto animate-in zoom-in-95 duration-300 relative">
        <button 
          onClick={onBackToMenu} 
          className="absolute top-8 left-10 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 font-black text-xs"
        >
          <X size={16} /> মডিউল পরিবর্তন
        </button>
        
        <div className="text-center space-y-3 mb-12 mt-6">
          <h3 className="text-3xl font-black text-slate-900">নিষ্পত্তি ধরন নির্বাচন</h3>
          <p className="text-slate-500 font-bold">নিচের অপশনগুলো থেকে চিঠির ধরন বাছাই করুন</p>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <div 
            onClick={() => setFormData({...formData, paraType: 'এসএফআই'})}
            className={`group relative flex items-center min-h-[100px] w-full rounded-[1.5rem] shadow-md border-2 transition-all duration-500 cursor-pointer overflow-hidden ${isSFI(formData.paraType) ? 'bg-slate-900 border-blue-600 ring-4 ring-blue-50' : 'bg-white border-slate-100 hover:border-blue-200'}`}
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${isSFI(formData.paraType) ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-200'}`}></div>
            <div className="flex items-center pl-8 gap-6 flex-1 pr-6 py-4">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSFI(formData.paraType) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                  <Building2 size={30} />
               </div>
               <div className="flex-1 space-y-3">
                  <h4 className={`text-xl font-black transition-colors ${isSFI(formData.paraType) ? 'text-white' : 'text-slate-800'}`}>এসএফআই (SFI)</h4>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select 
                      value={isSFI(formData.paraType) ? formData.meetingType : ''} 
                      onChange={(e) => { setFormData({...formData, meetingType: e.target.value, isMeeting: e.target.value !== 'বিএসআর', paraType: 'এসএফআই'}); }} 
                      className={`w-full py-2 px-3 rounded-lg font-bold outline-none border transition-all ${isSFI(formData.paraType) ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                    >
                      <option value="" disabled>ধরন নির্বাচন করুন...</option>
                      <option value="বিএসআর">বিএসআর (BSR)</option>
                      <option value="ত্রিপক্ষীয় সভা">ত্রিপক্ষীয় সভা</option>
                    </select>
                  </div>
               </div>
            </div>
            {isSFI(formData.paraType) && (
              <div className="pr-8 animate-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><Check size={18} className="text-white" strokeWidth={3} /></div>
              </div>
            )}
          </div>

          <div 
            onClick={() => setFormData({...formData, paraType: 'নন এসএফআই'})}
            className={`group relative flex items-center min-h-[100px] w-full rounded-[1.5rem] shadow-md border-2 transition-all duration-500 cursor-pointer overflow-hidden ${isNonSFI(formData.paraType) ? 'bg-slate-900 border-indigo-600 ring-4 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${isNonSFI(formData.paraType) ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-200'}`}></div>
            <div className="flex items-center pl-8 gap-6 flex-1 pr-6 py-4">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isNonSFI(formData.paraType) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                  <Building size={30} />
               </div>
               <div className="flex-1 space-y-3">
                  <h4 className={`text-xl font-black transition-colors ${isNonSFI(formData.paraType) ? 'text-white' : 'text-slate-800'}`}>নন এসএফআই (Non-SFI)</h4>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select 
                      value={isNonSFI(formData.paraType) ? formData.meetingType : ''} 
                      onChange={(e) => { setFormData({...formData, meetingType: e.target.value, isMeeting: e.target.value !== 'বিএসআর', paraType: 'নন এসএফআই'}); }} 
                      className={`w-full py-2 px-3 rounded-lg font-bold outline-none border transition-all ${isNonSFI(formData.paraType) ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                    >
                      <option value="" disabled>ধরন নির্বাচন করুন...</option>
                      <option value="বিএসআর">বিএসআর (BSR)</option>
                      <option value="দ্বিপক্ষীয় সভা">দ্বিপক্ষীয় সভা</option>
                    </select>
                  </div>
               </div>
            </div>
            {isNonSFI(formData.paraType) && (
              <div className="pr-8 animate-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg"><Check size={18} className="text-white" strokeWidth={3} /></div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setWizardStep('details')} 
          disabled={!formData.meetingType} 
          className={`w-full mt-12 py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all ${formData.meetingType ? 'bg-blue-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:bg-blue-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
        >
          তথ্য এন্ট্রি শুরু করুন <ArrowRightCircle size={24} />
        </button>
      </div>
    );
  }

  let serialCount = 1;
  const getSerial = () => toBengaliDigits(serialCount++);

  return (
    <div id="form-container-settlement" className="bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-landing-premium max-w-[1880px] mx-auto overflow-x-hidden relative">
      <div id="form-header" className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-100 gap-4 relative">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={onBackToMenu}
            className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="p-3 bg-slate-900 rounded-2xl text-white shrink-0">
            <Layout size={24} />
          </div>
          <div><h3 className="text-2xl font-black text-slate-900 leading-tight">মীমাংসা এন্ট্রি</h3><p className="text-slate-500 font-bold text-sm">অনুগ্রহ করে নিচের {toBengaliDigits(formData.meetingType === 'বিএসআর' ? (showAuditDetails ? 16 : 15) : (showAuditDetails ? 20 : 19))}টি ফিল্ড সঠিকভাবে পূরণ করুন</p></div>
        </div>
        {onCancel && (
          <button 
            id="btn-cancel-entry" 
            type="button" 
            onClick={onCancel} 
            className="px-5 py-2.5 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-black text-sm transition-all flex items-center gap-2 border border-slate-200 relative shrink-0"
          >
            <X size={18} /> বাতিল করুন
          </button>
        )}
      </div>

      {/* Duplicate Warning Message */}
      {isDuplicate && !isSuccess && (
        <div className="mb-10 p-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-amber-100">
           <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-200 animate-pulse">
              <AlertCircle size={32} />
           </div>
           <div className="space-y-1">
              <h4 className="text-xl font-black text-amber-900 tracking-tight">সতর্কবার্তা: তথ্যটি ইতোমধ্যেই বিদ্যমান</h4>
              <p className="text-sm font-bold text-amber-700/80">
                {duplicates.letterNo && <span>পত্র নং: <span className="underline underline-offset-4 font-black">{toBengaliDigits(letterNoPart)}</span> </span>}
                {duplicates.diaryNo && <span>ডায়েরি নং: <span className="underline underline-offset-4 font-black">{toBengaliDigits(diaryNoPart)}</span> </span>}
                {duplicates.issueNo && <span>জারিপত্র নং: <span className="underline underline-offset-4 font-black">{toBengaliDigits(issueNoPart)}</span> </span>}
                ইতোমধ্যেই ডাটাবেজে বিদ্যমান। অনুগ্রহ করে তথ্য যাচাই করুন।
              </p>
           </div>
           <div className="ml-auto flex gap-2">
             {duplicates.letterNo && (
               <button
                 type="button"
                 onClick={() => navigateToEntry?.(duplicates.letterEntryId!, 'settlement', letterNoPart)}
                 className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 hover:bg-amber-700 transition-all flex items-center gap-2"
               >
                 <ArrowRightCircle size={14} /> পত্র দেখুন
               </button>
             )}
             {duplicates.diaryNo && (
               <button
                 type="button"
                 onClick={() => navigateToEntry?.(duplicates.diaryEntryId!, 'settlement', diaryNoPart)}
                 className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 hover:bg-amber-700 transition-all flex items-center gap-2"
               >
                 <ArrowRightCircle size={14} /> ডায়েরি দেখুন
               </button>
             )}
             {duplicates.issueNo && (
               <button
                 type="button"
                 onClick={() => navigateToEntry?.(duplicates.issueEntryId!, 'settlement', issueNoPart)}
                 className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 hover:bg-amber-700 transition-all flex items-center gap-2"
               >
                 <ArrowRightCircle size={14} /> জারিপত্র দেখুন
               </button>
             )}
           </div>
        </div>
      )}

      <form id="form-entry" onSubmit={handleSubmit} className="space-y-10">
        <fieldset className="space-y-10 border-none p-0 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
            <div id="field-1" className={col1Style}><SearchableSelect label={<><span className={numBadge}>{getSerial()}</span> <Building2 size={14} className="text-blue-600 shrink-0" /> শাখা (SFI/Non-SFI)</>} groups={[{ label: 'শাখা ধরণ', options: ['এসএফআই', 'নন এসএফআই'] }]} value={formData.paraType} onChange={v => setFormData({ ...formData, paraType: v as ParaType })} required badgeId="select-para-type" isAdmin={isAdmin} showSearch={false} /></div>
            <div id="field-2" className={col2Style}><SearchableSelect label={<><span className={numBadge}>{getSerial()}</span> <Layout size={14} className="text-emerald-600 shrink-0" /> চিঠির ধরণ</>} groups={[{ label: 'চিঠি তালিকা', options: isSFI(formData.paraType) ? ['বিএসআর', 'ত্রিপক্ষীয় সভা'] : ['বিএসআর', 'দ্বিপক্ষীয় সভা'] }]} value={formData.meetingType} onChange={v => setFormData({...formData, meetingType: v, isMeeting: v !== 'বিএসআর'})} required badgeId="select-meeting-type" isAdmin={isAdmin} showSearch={false} /></div>
            <div id="field-3" className={col3Style}><SearchableSelect label={<><span className={numBadge}>{getSerial()}</span> <Building size={14} className="text-amber-600 shrink-0" /> মন্ত্রণালয়</>} groups={MINISTRIES_LIST} value={formData.ministryName} onChange={v => setFormData(f=>({...f, ministryName: v}))} required badgeId="select-ministry" isAdmin={isAdmin} /></div>
            <div id="field-4" className={col4Style}><SearchableSelect label={<><span className={numBadge}>{getSerial()}</span> <Building2 size={14} className="text-purple-600 shrink-0" /> এনটিটি / সংস্থা</>} groups={[{label: 'এনটিটি তালিকা', options: entityOpts}]} value={formData.entityName} onChange={v => setFormData(f=>({...f, entityName: v}))} required badgeId="select-entity" isAdmin={isAdmin} align="right" /></div>
            <div id="field-5" className={col1Style}><SearchableSelect label={<><span className={numBadge}>{getSerial()}</span> <Building size={14} className="text-sky-600 shrink-0" /> শাখা (বিস্তারিত বিবরণ)</>} groups={branchOpts.length > 0 ? [{label: ' শাখা তালিকা', options: branchOpts}] : branchSuggestions} value={formData.branchName} onChange={v => setFormData(f=>({...f, branchName: v}))} required badgeId="select-branch" isAdmin={isAdmin} allowCustom={true} hideAddNew={true} /></div>
            <div id="field-6" className={col2Style}><SearchableSelect label={<><span className={numBadge}>{getSerial()}</span> <Calendar size={14} className="text-emerald-600 shrink-0" /> নিরীক্ষা সাল</>} groups={dynamicAuditYearsOptions} value={formData.auditYear} onChange={v => setFormData(f=>({...f, auditYear: v}))} required badgeId="select-audit-year" isAdmin={isAdmin} allowCustom={true} hideAddNew={true} align="right" /></div>
            
            <div id="field-7a" className={`${colWrapperCls} ${duplicates.letterNo ? 'bg-amber-50 border-amber-200' : 'bg-amber-50/70 border-amber-100'}`}>
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Hash size={14} className="text-amber-600 shrink-0" /> পত্র নং:</label>
              <input 
                type="text" 
                className={duplicates.letterNo ? `${inputBaseCls} border-amber-500 ring-4 ring-amber-50` : getDynamicInputCls(letterNoPart)} 
                value={letterNoPart} 
                onChange={e => setLetterNoPart(toBengaliDigits(e.target.value))} 
                placeholder="নং লিখুন"
              />
              {duplicates.letterNo && (
                <div className="mt-2 text-[10px] font-black text-amber-600 animate-in slide-in-from-top-1 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <AlertCircle size={10} /> এই পত্র নম্বরটি ইতিপূর্বে এন্ট্রি করা হয়েছে
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToEntry?.(duplicates.letterEntryId!, 'settlement', letterNoPart)}
                    className="text-amber-700 hover:text-amber-900 underline underline-offset-2 flex items-center gap-1"
                  >
                    দেখুন <ArrowRightCircle size={10} />
                  </button>
                </div>
              )}
            </div>
            <SegmentedInput id="field-7b" num={getSerial()} icon={Calendar} label="পত্রের তারিখ" color="amber" noValue="DATE_ONLY" dayValue={letterDay} monthValue={letterMonth} yearValue={letterYear} noSetter={()=>{}} daySetter={setLetterDay} monthSetter={setLetterMonth} yearSetter={setLetterYear} dayRef={letterDayRef} monthRef={letterMonthRef} yearRef={letterYearRef} isFocused={isLetterFocused} focusSetter={setIsLetterFocused} />

            {formData.meetingType === 'বিএসআর' && (
              <>
                <div id="field-8a" className={`${colWrapperCls} ${duplicates.diaryNo ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50/70 border-emerald-100'}`}>
                  <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Hash size={14} className="text-emerald-600 shrink-0" /> ডায়েরি নং:</label>
                  <input 
                    type="text" 
                    className={duplicates.diaryNo ? `${inputBaseCls} border-amber-500 ring-4 ring-amber-50` : getDynamicInputCls(diaryNoPart)} 
                    value={diaryNoPart} 
                    onChange={e => setDiaryNoPart(toBengaliDigits(e.target.value))} 
                    placeholder="নং লিখুন"
                  />
                  {duplicates.diaryNo && (
                    <div className="mt-2 text-[10px] font-black text-amber-600 animate-in slide-in-from-top-1 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <AlertCircle size={10} /> এই ডায়েরি নম্বরটি ইতিপূর্বে এন্ট্রি করা হয়েছে
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToEntry?.(duplicates.diaryEntryId!, 'settlement', diaryNoPart)}
                        className="text-amber-700 hover:text-amber-900 underline underline-offset-2 flex items-center gap-1"
                      >
                        দেখুন <ArrowRightCircle size={10} />
                      </button>
                    </div>
                  )}
                </div>
                <SegmentedInput id="field-8b" num={getSerial()} icon={Calendar} label="ডায়েরি তারিখ" color="emerald" noValue="DATE_ONLY" dayValue={diaryDay} monthValue={diaryMonth} yearValue={diaryYear} noSetter={()=>{}} daySetter={setDiaryDay} monthSetter={setDiaryMonth} yearSetter={setDiaryYear} dayRef={diaryDayRef} monthRef={diaryMonthRef} yearRef={diaryYearRef} isFocused={isDiaryFocused} focusSetter={setIsDiaryFocused} error={diaryDateError} />
              </>
            )}

            <div id="field-9a" className={`${colWrapperCls} ${duplicates.issueNo ? 'bg-amber-50 border-amber-200' : 'bg-amber-50/70 border-amber-100'}`}>
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Hash size={14} className="text-amber-600 shrink-0" /> জারিপত্র নং:</label>
              <input 
                type="text" 
                className={duplicates.issueNo ? `${inputBaseCls} border-amber-500 ring-4 ring-amber-50` : getDynamicInputCls(issueNoPart)} 
                value={issueNoPart} 
                onChange={e => setIssueNoPart(toBengaliDigits(e.target.value))} 
                placeholder="নং লিখুন"
              />
              {duplicates.issueNo && (
                <div className="mt-2 text-[10px] font-black text-amber-600 animate-in slide-in-from-top-1 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <AlertCircle size={10} /> এই জারিপত্র নম্বরটি ইতিপূর্বে এন্ট্রি করা হয়েছে
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToEntry?.(duplicates.issueEntryId!, 'settlement', issueNoPart)}
                    className="text-amber-700 hover:text-amber-900 underline underline-offset-2 flex items-center gap-1"
                  >
                    দেখুন <ArrowRightCircle size={10} />
                  </button>
                </div>
              )}
            </div>
            <SegmentedInput 
              id="field-9b" num={getSerial()} icon={Calendar} label="জারিপত্র তারিখ" color="amber" 
              noValue="DATE_ONLY" dayValue={dayPart} monthValue={monthPart} yearValue={yearPart} 
              noSetter={()=>{}} daySetter={setDayPart} monthSetter={setMonthPart} yearSetter={setYearPart} 
              dayRef={issueDayRef} monthRef={issueMonthRef} yearRef={issueYearRef} 
              isFocused={isIssueFocused} focusSetter={setIsIssueFocused}
              error={issueDateError}
              extra={formData.issueDateISO && (
                <div className="absolute -right-2 -top-2 z-[310] flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-500">
                  <Check size={14} strokeWidth={4} />
                </div>
              )}
            />

            {/* Fields 11 (Audit Details) - Conditionally Rendered */}
            {showAuditDetails && (
              <>
                <div id="field-11" className={col1Style}><label className={labelCls}><span className={numBadge}>{getSerial()}</span> <ListOrdered size={14} className="text-sky-600 shrink-0" /> প্রেরিত অনুচ্ছেদ সংখ্যা</label><input type="text" className={getDynamicInputCls(rawInputs['direct-meetingSentParaCount'] || formData.meetingSentParaCount)} value={rawInputs['direct-meetingSentParaCount'] || (formData.meetingSentParaCount === '0' || formData.meetingSentParaCount === '' ? '' : toBengaliDigits(formData.meetingSentParaCount))} onChange={e => handleNumericInput('direct', 'meetingSentParaCount', e.target.value)} placeholder="০" /></div>
                <div id="field-sent-para-involved-amount" className={col1Style}><label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Banknote size={14} className="text-emerald-600 shrink-0" /> প্রেরিত অনুচ্ছেদে মোট জড়িত টাকার পরিমান</label><input type="text" className={getDynamicInputCls(rawInputs['direct-sentParaInvolvedAmount'] || formData.sentParaInvolvedAmount)} value={rawInputs['direct-sentParaInvolvedAmount'] || (formData.sentParaInvolvedAmount === 0 || formData.sentParaInvolvedAmount === undefined || formData.sentParaInvolvedAmount === null ? '' : toBengaliDigits(formData.sentParaInvolvedAmount.toString()))} onChange={e => handleNumericInput('direct', 'sentParaInvolvedAmount', e.target.value)} placeholder="টাকা লিখুন" /></div>
              </>
            )}
            {/* Field: Online/Offline Status */}
            <div className={`${colWrapperCls} border-emerald-100`}>
              <IDBadge id="settlement-field-online" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Globe size={14} className="text-emerald-600" /> অনলাইন/অফলাইন স্ট্যাটাস:</label>
              <div className="flex items-center h-[52px]">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isOnline: formData.isOnline === 'হ্যাঁ' ? 'না' : 'হ্যাঁ'})}
                  className={`relative w-[130px] h-[50px] rounded-full cursor-pointer select-none transition-all duration-300 shadow-[inset_0_4px_6px_rgba(0,0,0,0.25),_0_1px_0_rgba(255,255,255,0.6)] focus:outline-none border border-t-[1.5px] border-l-[1.5px] border-b-[0.5px] border-r-[0.5px] ${
                    formData.isOnline === 'হ্যাঁ'
                      ? 'bg-[#00a669] border-[#007348]'
                      : 'bg-[#a3aab1] border-[#80878d]'
                  }`}
                >
                  {/* Left Label ("হ্যাঁ") */}
                  <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-white font-[950] text-[16px] tracking-wider transition-all duration-300 select-none ${
                    formData.isOnline === 'হ্যাঁ' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                  }`}>
                    হ্যাঁ
                  </span>

                  {/* 3D Skeuomorphic Knob */}
                  <div
                    className={`absolute w-10 h-10 top-[4px] rounded-full bg-[#f4f6f8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#b6bcc2] shadow-[0_3px_6px_rgba(0,0,0,0.35),_inset_0_1px_1px_white] transition-all duration-300 ${
                      formData.isOnline === 'হ্যাঁ'
                        ? 'left-[calc(100%-44px)]'
                        : 'left-[4px]'
                    }`}
                  />

                  {/* Right Label ("না") */}
                  <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-white font-[950] text-[16px] tracking-wider transition-all duration-300 select-none ${
                    formData.isOnline === 'হ্যাঁ' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
                  }`}>
                    না
                  </span>
                </button>
              </div>
            </div>

            <div id="field-17" className={col4Style}>
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Archive size={14} className="text-purple-600 shrink-0" /> আর্কাইভ নং</label>
              <input 
                type="text" 
                className={getDynamicInputCls(formData.archiveNo)} 
                value={formData.archiveNo} 
                onChange={e => { 
                  const val = e.target.value; 
                  const raw = val.startsWith('kg-') ? val.slice(3).trim() : val; 
                  const formatted = raw ? `kg- ${toBengaliDigits(raw)}` : ''; 
                  setFormData({...formData, archiveNo: formatted}); 
                }} 
                placeholder="আর্কাইভ নং" 
              />
            </div>

            {formData.meetingType === 'বিএসআর' && (
              <div id="field-18" className={`${col3Style} lg:col-span-2 md:col-span-2`}>
                <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <MessageSquare size={14} className="text-purple-600" /> মন্তব্য</label>
                <input type="text" className={getDynamicInputCls(formData.remarks)} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="মন্তব্য লিখুন..." />
              </div>
            )}

            {formData.meetingType !== 'বিএসআর' && (
              <>
                <div id="field-19" className={col1Style}>
                  <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Calendar size={14} className="text-amber-600 shrink-0" /> সভার তারিখ</label>
                  <input type="date" className={getDynamicInputCls(formData.meetingDate)} value={formData.meetingDate} onChange={e => setFormData({...formData, meetingDate: e.target.value})} />
                </div>
                <div id="field-20" className={col3Style}><label className={labelCls}><span className={numBadge}>{getSerial()}</span> <ListOrdered size={14} className="text-sky-600 shrink-0" /> আলোচিত অনুচ্ছেদ সংখ্যা</label><input type="text" className={getDynamicInputCls(rawInputs['direct-meetingDiscussedParaCount'] || formData.meetingDiscussedParaCount)} value={rawInputs['direct-meetingDiscussedParaCount'] || (formData.meetingDiscussedParaCount === '0' || formData.meetingDiscussedParaCount === '' ? '' : toBengaliDigits(formData.meetingDiscussedParaCount))} onChange={e => handleNumericInput('direct', 'meetingDiscussedParaCount', e.target.value)} placeholder="০" /></div>
                <div id="field-21" className={col1Style}><label className={labelCls}><span className={numBadge}>{getSerial()}</span> <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> সুপারিশকৃত অনুচ্ছেদ সংখ্যা</label><input type="text" className={getDynamicInputCls(rawInputs['direct-meetingRecommendedParaCount'] || formData.meetingRecommendedParaCount)} value={rawInputs['direct-meetingRecommendedParaCount'] || (formData.meetingRecommendedParaCount === '0' || formData.meetingRecommendedParaCount === '' ? '' : toBengaliDigits(formData.meetingRecommendedParaCount))} onChange={e => handleNumericInput('direct', 'meetingRecommendedParaCount', e.target.value)} placeholder="০" /></div>
                <div id="field-22a" className={`${colWrapperCls} bg-purple-50/70 border-purple-100 hover:border-purple-300`}>
                  <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Hash size={14} className="text-purple-600 shrink-0" /> কার্যপত্র নং:</label>
                  <input 
                    type="text" 
                    className={getDynamicInputCls(wpNoPart)} 
                    value={wpNoPart} 
                    onChange={e => setWpNoPart(toBengaliDigits(e.target.value))} 
                    placeholder="নং লিখুন"
                  />
                </div>
                <SegmentedInput id="field-22b" icon={FileEdit} num={getSerial()} label="কার্যপত্র তারিখ" color="purple" noValue="DATE_ONLY" dayValue={wpDay} monthValue={wpMonth} yearValue={wpYear} noSetter={()=>{}} daySetter={setWpDay} monthSetter={setWpMonth} yearSetter={setWpYear} dayRef={wpDayRef} monthRef={wpMonthRef} yearRef={wpYearRef} isFocused={isWpFocused} focusSetter={setIsWpFocused} />
                <SegmentedInput id="field-22c" icon={Calendar} num={getSerial()} label="কার্যবিবরণী প্রাপ্তির তারিখ" color="purple" noValue="DATE_ONLY" dayValue={mrDay} monthValue={mrMonth} yearValue={mrYear} noSetter={()=>{}} daySetter={setMrDay} monthSetter={setMrMonth} yearSetter={setMrYear} dayRef={mrDayRef} monthRef={mrMonthRef} yearRef={mrYearRef} isFocused={isMrFocused} focusSetter={setIsMrFocused} />
                
                <div id="field-18" className={`${col3Style} lg:col-span-2 md:col-span-2`}>
                  <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <MessageSquare size={14} className="text-purple-600" /> মন্তব্য</label>
                  <input type="text" className={getDynamicInputCls(formData.remarks)} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="মন্তব্য লিখুন..." />
                </div>
              </>
            )}
          </div>

          <div id="section-manual-raised-block" className="pt-8 relative"><div className="bg-blue-50/40 border border-blue-100 rounded-[2.5rem] p-8 shadow-sm space-y-6"><div className="flex items-center gap-3"><Sparkles size={20} className="text-blue-600 animate-pulse" /><h4 className="text-[15px] font-black text-blue-900 tracking-tight">বর্তমান মাসে উত্থাপিত অডিট আপত্তি (ঐচ্ছিক)</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-3"><label className="text-[13px] font-bold text-slate-700 ml-1">সংখ্যা (উত্থাপিত)</label><input type="text" className={`w-full h-[58px] px-6 border-2 rounded-2xl font-black text-slate-800 bg-white/60 focus:bg-white outline-none shadow-sm transition-all text-center text-lg placeholder:text-slate-300 placeholder:font-black ${formData.manualRaisedCount ? 'border-emerald-500 focus:border-emerald-600' : 'border-red-500 focus:border-red-600'}`} value={rawInputs['entry-raised-count'] || (formData.manualRaisedCount === null || formData.manualRaisedCount === '0' || formData.manualRaisedCount === '' ? '' : toBengaliDigits(formData.manualRaisedCount || ''))} onChange={e => handleNumericInput('entry', 'raised-count', e.target.value)} placeholder="০" /></div><div className="space-y-3"><label className="text-[13px] font-bold text-slate-700 ml-1">টাকার পরিমাণ (উত্থাপিত)</label><input type="text" className={`w-full h-[58px] px-6 border-2 rounded-2xl font-black text-slate-800 bg-white/60 focus:bg-white outline-none shadow-sm transition-all text-center text-lg placeholder:text-slate-300 placeholder:font-black ${formData.manualRaisedAmount ? 'border-emerald-500 focus:border-emerald-600' : 'border-red-500 focus:border-red-600'}`} value={rawInputs['entry-raised-amount'] || (formData.manualRaisedAmount === null || formData.manualRaisedAmount === 0 ? '' : toBengaliDigits(formData.manualRaisedAmount || ''))} onChange={e => handleNumericInput('entry', 'raised-amount', e.target.value)} placeholder="০" /></div></div>
</div></div>
          
          <div id="section-para-entry-area" className="pt-10 border-t border-slate-100 relative">
            <div id="section-para-bulk" className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8 relative">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full relative">
                  <label className="block text-sm font-black text-slate-500 mb-2 ml-1 uppercase">বিস্তারিত অনুচ্ছেদ যোগ করুন (মীমাংসিতদের জন্য)</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      className={`w-full h-[55px] pl-6 pr-48 border rounded-2xl font-black text-slate-900 bg-white outline-none shadow-sm text-lg transition-all ${bulkParaInput ? 'border-emerald-500 focus:border-emerald-600' : 'border-red-500 focus:border-red-600'}`} 
                      value={bulkParaInput} 
                      onChange={e => setBulkParaInput(toBengaliDigits(e.target.value))} 
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleBulkGenerate())} 
                      placeholder="অনুচ্ছেদ নং (যেমন: ৫, ১০, ১৫)" 
                    />
                    {bulkParaInput.trim() && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-right-2 duration-300">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-700 pr-2">মোট অনুচ্ছেদ সংখ্যা=</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-black text-emerald-400 leading-none">{toBengaliDigits(bulkParaInput.split(/[,，\s]+/).filter(s => s.trim()).length)}</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase">টি</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button id="btn-add-paras" type="button" onClick={handleBulkGenerate} className="w-full md:w-auto px-8 h-[55px] bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg relative">
                  <Sparkles size={20} className="text-blue-400" /> অনুচ্ছেদ যোগ
                </button>
              </div>
            </div>
            <div id="section-para-list" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10 relative">
              {paragraphs.map((p, idx) => {
                const isMatched = p.involvedAmount > 0 && p.involvedAmount === (p.recoveredAmount + p.adjustedAmount);
                return (
                  <div key={p.id} id={`card-para-${idx}`} className={`p-6 rounded-none relative border-2 ${isMatched ? "border-emerald-500 bg-emerald-50/10 shadow-emerald-100" : "border-red-500 bg-red-50/20 shadow-red-100"} hover:shadow-xl transition-all group overflow-visible`}>
                    
                    {(isAdmin || !isUpdateMode) && (
                      <div className="absolute top-[30px] right-4 z-40 flex items-center">
                        <button 
                          type="button" 
                          onClick={() => setParaToDeleteId(p.id)} 
                          className="h-6 w-6 flex items-center justify-center bg-white text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-100 rounded-lg transition-all shadow-sm active:scale-95 hover:scale-110"
                        >
                          <Trash2 size={12} />
                        </button>

                        {paraToDeleteId === p.id && (
                          <div className="absolute right-8 top-[-8px] z-50 bg-slate-950 text-white rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col items-start gap-2 w-52 animate-in fade-in zoom-in-95 duration-150">
                            {/* Decorative mini pointer arrow */}
                            <div className="absolute right-[-4px] top-4 w-2 h-2 bg-slate-950 rotate-45 border-t border-r border-slate-800"></div>
                            
                            {deletingLocalParaId === p.id ? (
                              <div className="flex flex-col items-center justify-center py-4 px-1 w-full gap-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="relative flex items-center justify-center">
                                  {/* Outer premium spinning gradient ring */}
                                  <div className="w-10 h-10 rounded-full border-[3.5px] border-rose-500/10 border-t-rose-500 animate-spin"></div>
                                  {/* Inner pulsing trash icon */}
                                  <Trash size={12} className="absolute text-rose-500 animate-pulse" />
                                </div>
                                <span className="text-[12px] font-black text-rose-400 tracking-wider animate-pulse">ডিলিট করা হচ্ছে...</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 text-rose-400">
                                  <Trash size={13} strokeWidth={2.5} className="animate-pulse" />
                                  <span className="text-[11px] font-black tracking-tight mb-[-1px]">মুছে ফেলবেন?</span>
                                </div>
                                
                                <p className="text-[9px] font-black text-slate-400 text-left leading-normal">
                                  অনুচ্ছেদটির ডায়েরি ও তালিকাভুক্ত ট্র্যাকিং তথ্য চলে যাবে।
                                </p>
                                
                                <div className="flex items-center gap-2 w-full mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeletingLocalParaId(p.id);
                                      setTimeout(() => {
                                        setParagraphs(prev => prev.filter(x => x.id !== p.id));
                                        setDeletingLocalParaId(null);
                                        setParaToDeleteId(null);
                                        if (isUpdateMode) { 
                                          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); 
                                        }
                                      }, 800);
                                    }}
                                    className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black transition-all active:scale-95 shadow-sm shadow-red-500/20 text-center cursor-pointer"
                                  >
                                    হ্যাঁ, মুছুন
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setParaToDeleteId(null)}
                                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[9px] font-black transition-all active:scale-95 border border-slate-700/60 text-center cursor-pointer"
                                  >
                                    না
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-row flex-nowrap items-center gap-1.5 sm:gap-2 mb-6 relative z-10 pr-8 sm:pr-10">
                      <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl shadow-md shrink-0">
                        <span className="text-[13px] font-black text-white">{toBengaliDigits(idx + 1)}</span>
                        {isMatched && (
                          <Check size={12} strokeWidth={4} className="text-emerald-400 ml-1 animate-bounce" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-black text-slate-500 uppercase">অনু: নং</span>
                        <input type="text" className={`w-14 sm:w-16 h-9 border-2 rounded-lg text-center font-black bg-white text-slate-950 outline-none ${p.paraNo ? 'border-emerald-500 focus:border-emerald-600' : 'border-red-500 focus:border-red-600'}`} value={rawInputs[`${p.id}-paraNo`] || toBengaliDigits(p.paraNo)} onChange={e => handleNumericInput(p.id, 'paraNo', e.target.value)} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setParagraphs(prev => prev.map(x => x.id === p.id ? {...x, status: x.status === 'পূর্ণাঙ্গ' ? 'আংশিক' : 'পূর্ণাঙ্গ'} : x))}
                        className={`relative inline-flex h-8 w-[64px] sm:w-[70px] shrink-0 cursor-pointer rounded-full border-2 border-slate-900 transition-all duration-300 outline-none select-none items-center overflow-hidden shadow-[inset_0_3px_6px_rgba(0,0,0,0.25)] active:scale-95 ${
                          p.status === 'পূর্ণাঙ্গ' 
                            ? 'bg-gradient-to-b from-emerald-500 to-emerald-600' 
                            : 'bg-gradient-to-b from-amber-500 to-amber-600'
                        }`}
                      >
                        {/* The sliding dark thumb/button */}
                        <div
                          className={`absolute top-[2px] h-[24px] w-[24px] rounded-full transition-all duration-300 ease-out border border-slate-950 flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_3px_6px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.2)] ${
                            p.status === 'পূর্ণাঙ্গ' 
                              ? 'left-[36px] sm:left-[42px]' 
                              : 'left-[2px]'
                          }`}
                        >
                          {/* Subtle notch/dot on the knob for ultra realism */}
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-950 opacity-60 shadow-inner"></div>
                        </div>

                        {/* Text labels */}
                        <div className="absolute inset-0 pointer-events-none select-none flex items-center">
                          <span 
                            className={`absolute right-1.5 text-[7.5px] sm:text-[8px] font-black text-white tracking-tighter transition-all duration-300 ${
                              p.status === 'পূর্ণাঙ্গ' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                            }`}
                          >
                            আংশিক
                          </span>
                          <span 
                            className={`absolute left-[6px] sm:left-[8px] text-[7.5px] sm:text-[8px] font-black text-white tracking-tighter transition-all duration-300 ${
                              p.status === 'পূর্ণাঙ্গ' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                            }`}
                          >
                            পূর্ণাঙ্গ
                          </span>
                        </div>
                      </button>

                      {/* Sparkles Special Option Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setParagraphs(prev => prev.map(x => {
                            if (x.id === p.id) {
                              const nextVal = !x.isAdvanced;
                              const updated = { ...x, isAdvanced: nextVal };
                              if (nextVal) {
                                // Sync initial values for advanced mode
                                if (x.category === 'ভ্যাট') {
                                  updated.vatRec = x.recoveredAmount;
                                  updated.vatAdj = x.adjustedAmount;
                                  updated.itRec = 0; updated.itAdj = 0;
                                  updated.othersRec = 0; updated.othersAdj = 0;
                                } else if (x.category === 'আয়কর') {
                                  updated.itRec = x.recoveredAmount;
                                  updated.itAdj = x.adjustedAmount;
                                  updated.vatRec = 0; updated.vatAdj = 0;
                                  updated.othersRec = 0; updated.othersAdj = 0;
                                } else {
                                  updated.othersRec = x.recoveredAmount;
                                  updated.othersAdj = x.adjustedAmount;
                                  updated.vatRec = 0; updated.vatAdj = 0;
                                  updated.itRec = 0; updated.itAdj = 0;
                                }
                              } else {
                                // Sync back to standard mode based on current category and reset others to 0
                                if (x.category === 'ভ্যাট') {
                                  updated.recoveredAmount = x.vatRec || 0;
                                  updated.adjustedAmount = x.vatAdj || 0;
                                  updated.itRec = 0; updated.itAdj = 0;
                                  updated.othersRec = 0; updated.othersAdj = 0;
                                } else if (x.category === 'আয়কর') {
                                  updated.recoveredAmount = x.itRec || 0;
                                  updated.adjustedAmount = x.itAdj || 0;
                                  updated.vatRec = 0; updated.vatAdj = 0;
                                  updated.othersRec = 0; updated.othersAdj = 0;
                                } else {
                                  updated.recoveredAmount = x.othersRec || 0;
                                  updated.adjustedAmount = x.othersAdj || 0;
                                  updated.vatRec = 0; updated.vatAdj = 0;
                                  updated.itRec = 0; updated.itAdj = 0;
                                }
                              }
                              // Always keep them calculated from category-specific fields!
                              updated.recoveredAmount = (updated.vatRec || 0) + (updated.itRec || 0) + (updated.othersRec || 0);
                              updated.adjustedAmount = (updated.vatAdj || 0) + (updated.itAdj || 0) + (updated.othersAdj || 0);
                              return updated;
                            }
                            return x;
                          }));
                        }}
                        className={`h-8 w-8 rounded-lg transition-all active:scale-95 flex items-center justify-center shrink-0 border-2 shadow-sm ${
                          p.isAdvanced 
                            ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white animate-pulse' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                        title={p.isAdvanced ? "সাধারণ ক্যাটাগরিতে ফিরে যান" : "একাধিক আর্থিক ক্যাটাগরি একসাথে যোগ করুন"}
                      >
                        <Sparkles size={13} className={p.isAdvanced ? "text-white" : "text-amber-500"} />
                      </button>

                      {!p.isAdvanced && (
                        <div className="flex bg-slate-100 rounded-lg p-0.5 h-8 border border-slate-200 shrink-0 ml-1 sm:ml-1.5">
                          {['ভ্যাট', 'আয়কর', 'অন্যান্য'].map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setParagraphs(prev => prev.map(x => {
                                if (x.id === p.id) {
                                  const updated = { ...x, category: cat as FinancialCategory };
                                  if (cat === 'ভ্যাট') {
                                    updated.vatRec = x.recoveredAmount;
                                    updated.vatAdj = x.adjustedAmount;
                                    updated.itRec = 0; updated.itAdj = 0;
                                    updated.othersRec = 0; updated.othersAdj = 0;
                                  } else if (cat === 'আয়কর') {
                                    updated.itRec = x.recoveredAmount;
                                    updated.itAdj = x.adjustedAmount;
                                    updated.vatRec = 0; updated.vatAdj = 0;
                                    updated.othersRec = 0; updated.othersAdj = 0;
                                  } else {
                                    updated.othersRec = x.recoveredAmount;
                                    updated.othersAdj = x.adjustedAmount;
                                    updated.vatRec = 0; updated.vatAdj = 0;
                                    updated.itRec = 0; updated.itAdj = 0;
                                  }
                                  return updated;
                                }
                                return x;
                              }))}
                              className={`whitespace-nowrap px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-black rounded-md transition-all ${p.category === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {!p.isAdvanced ? (
                      <div className="grid grid-cols-3 gap-4 relative z-10">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 pl-1 uppercase tracking-wider text-center block">জড়িত টাকা</label>
                          <input type="text" className={`w-full h-12 px-3 border-2 rounded-xl text-center font-black bg-white text-slate-950 outline-none shadow-inner placeholder:text-slate-300 placeholder:font-black transition-all duration-200 ${(p.involvedAmount > 0 || isMatched) ? 'border-emerald-500 hover:border-emerald-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100' : 'border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`} value={rawInputs[`${p.id}-involvedAmount`] || (p.involvedAmount === 0 ? '' : toBengaliDigits(p.involvedAmount))} onChange={e => handleNumericInput(p.id, 'involvedAmount', e.target.value)} placeholder="০" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-emerald-600 pl-1 uppercase tracking-wider text-center block">আদায়কৃত</label>
                          <input type="text" className={`w-full h-12 px-3 border-2 rounded-xl text-center font-black bg-white text-slate-950 outline-none shadow-inner placeholder:text-slate-300 placeholder:font-black transition-all duration-200 ${(p.recoveredAmount > 0 || isMatched) ? 'border-emerald-500 hover:border-emerald-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100' : 'border-slate-300 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'}`} value={rawInputs[`${p.id}-recoveredAmount`] || (p.recoveredAmount === 0 ? '' : toBengaliDigits(p.recoveredAmount))} onChange={e => handleNumericInput(p.id, 'recoveredAmount', e.target.value)} placeholder="০" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-indigo-600 pl-1 uppercase tracking-wider text-center block">সমন্বয়কৃত</label>
                          <input type="text" className={`w-full h-12 px-3 border-2 rounded-xl text-center font-black bg-white text-slate-950 outline-none shadow-inner placeholder:text-slate-300 placeholder:font-black transition-all duration-200 ${(p.adjustedAmount > 0 || isMatched) ? 'border-emerald-500 hover:border-emerald-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100' : 'border-slate-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`} value={rawInputs[`${p.id}-adjustedAmount`] || (p.adjustedAmount === 0 ? '' : toBengaliDigits(p.adjustedAmount))} onChange={e => handleNumericInput(p.id, 'adjustedAmount', e.target.value)} placeholder="০" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 relative z-10">
                        {/* Involved Amount Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 pl-1 uppercase tracking-wider text-center block">জড়িত টাকা (মোট)</label>
                            <input type="text" className={`w-full h-12 px-3 border-2 rounded-xl text-center font-black bg-white text-slate-950 outline-none shadow-inner placeholder:text-slate-300 placeholder:font-black transition-all duration-200 ${(p.involvedAmount > 0 || isMatched) ? 'border-emerald-500 hover:border-emerald-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100' : 'border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`} value={rawInputs[`${p.id}-involvedAmount`] || (p.involvedAmount === 0 ? '' : toBengaliDigits(p.involvedAmount))} onChange={e => handleNumericInput(p.id, 'involvedAmount', e.target.value)} placeholder="০" />
                          </div>
                          
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 pl-1 uppercase tracking-wider text-left block">
                              বিশেষ আর্থিক ক্যাটাগরি (ক্লিক করে নিচে এন্ট্রি ফিল্ড বের করুন):
                            </label>
                            <div className="flex bg-slate-100/80 rounded-2xl p-1 border border-slate-200 h-12 items-center w-full gap-2">
                              {['ভ্যাট', 'আয়কর', 'অন্যান্য'].map(cat => {
                                const isExp = isCatExpanded(p.id, cat);
                                let hasData = false;
                                if (cat === 'ভ্যাট') hasData = (p.vatRec > 0 || p.vatAdj > 0);
                                if (cat === 'আয়কর') hasData = (p.itRec > 0 || p.itAdj > 0);
                                if (cat === 'অন্যান্য') hasData = (p.othersRec > 0 || p.othersAdj > 0);
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggleCatExpanded(p.id, cat)}
                                    className={`flex-1 h-10 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 border shadow-sm ${
                                      isExp
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : hasData 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {cat}
                                    {hasData && <CheckCircle size={11} className={isExp ? "text-white" : "text-emerald-500"} />}
                                    <ChevronDown size={12} className={`transition-transform duration-300 ${isExp ? 'rotate-180' : ''}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Category Inputs */}
                        <div className="space-y-3">
                          {['ভ্যাট', 'আয়কর', 'অন্যান্য'].map(cat => {
                            if (!isCatExpanded(p.id, cat)) return null;
                            
                            let recField = '';
                            let adjField = '';
                            let recVal = 0;
                            let adjVal = 0;
                            let colorClass = '';
                            
                            if (cat === 'ভ্যাট') {
                              recField = 'vatRec';
                              adjField = 'vatAdj';
                              recVal = p.vatRec || 0;
                              adjVal = p.vatAdj || 0;
                              colorClass = 'border-sky-200 bg-sky-50/20';
                            } else if (cat === 'আয়কর') {
                              recField = 'itRec';
                              adjField = 'itAdj';
                              recVal = p.itRec || 0;
                              adjVal = p.itAdj || 0;
                              colorClass = 'border-teal-200 bg-teal-50/20';
                            } else {
                              recField = 'othersRec';
                              adjField = 'othersAdj';
                              recVal = p.othersRec || 0;
                              adjVal = p.othersAdj || 0;
                              colorClass = 'border-indigo-200 bg-indigo-50/20';
                            }

                            return (
                              <div 
                                key={cat} 
                                className={`p-4 border-2 rounded-2xl ${colorClass} grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300 relative`}
                              >
                                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shadow-sm border border-slate-100 bg-white text-slate-700 flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${cat === 'ভ্যাট' ? 'bg-sky-500' : cat === 'আয়কর' ? 'bg-teal-500' : 'bg-indigo-500'}`} />
                                  {cat} সংক্রান্ত এন্ট্রি
                                </div>
                                
                                <div className="space-y-1 mt-1">
                                  <label className="text-[10px] font-black text-emerald-600 pl-1 uppercase tracking-wider text-left block">
                                    {cat} আদায়কৃত টাকা
                                  </label>
                                  <input 
                                    type="text" 
                                    className="w-full h-11 px-3 border-2 border-slate-200 rounded-xl text-center font-black bg-white text-slate-950 outline-none focus:border-blue-400 focus:bg-white shadow-inner" 
                                    value={rawInputs[`${p.id}-${recField}`] || (recVal === 0 ? '' : toBengaliDigits(recVal))} 
                                    onChange={e => handleNumericInput(p.id, recField, e.target.value)} 
                                    placeholder="০" 
                                  />
                                </div>
                                
                                <div className="space-y-1 mt-1">
                                  <label className="text-[10px] font-black text-indigo-600 pl-1 uppercase tracking-wider text-left block">
                                    {cat} সমন্বয়কৃত টাকা
                                  </label>
                                  <input 
                                    type="text" 
                                    className="w-full h-11 px-3 border-2 border-slate-200 rounded-xl text-center font-black bg-white text-slate-950 outline-none focus:border-blue-400 focus:bg-white shadow-inner" 
                                    value={rawInputs[`${p.id}-${adjField}`] || (adjVal === 0 ? '' : toBengaliDigits(adjVal))} 
                                    onChange={e => handleNumericInput(p.id, adjField, e.target.value)} 
                                    placeholder="০" 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isMatched && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-emerald-700 animate-in zoom-in-95 duration-300 relative z-10 shadow-sm shadow-emerald-500/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-tight leading-tight">
                            সফলতা: জড়িত টাকা ও আদায়-সমন্বয়ের যোগফল সম্পূর্ণ সমান হয়েছে!
                          </span>
                        </div>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm shrink-0 animate-bounce">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      </div>
                    )}

                    {p.involvedAmount > 0 && p.involvedAmount !== (p.recoveredAmount + p.adjustedAmount) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 animate-in slide-in-from-top-2 duration-300 relative z-10">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-tight leading-tight">
                          সতর্কতা: জড়িত টাকা ({toBengaliDigits(p.involvedAmount)}) এবং আদায় ও সমন্বয়ের যোগফল ({toBengaliDigits(p.recoveredAmount + p.adjustedAmount)}) সমান নয়।
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div id="section-form-summary" className="pt-10 border-t border-slate-100 space-y-6 relative">
             <div className="flex items-center gap-3 ml-2">
               <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg"><BarChart3 size={18} /></div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">এন্ট্রি সারাংশ (Summary Dashboard)</h4>
             </div>
             <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
               <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                 <div className="p-8 space-y-6 bg-slate-50/30">
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-slate-600 uppercase tracking-tighter">পূর্ণাঙ্গ নিষ্পন্ন</span>
                     <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[14px] font-black shadow-sm">{toBengaliDigits(summaryData.fullCount)} টি</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-slate-600 uppercase tracking-tighter">আংশিক নিষ্পন্ন</span>
                     <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[14px] font-black shadow-sm">{toBengaliDigits(summaryData.partialCount)} টি</span>
                   </div>
                 </div>
                 <div className="p-8 space-y-6">
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-slate-500 uppercase tracking-tighter">পূর্ণাঙ্গ জড়িত টাকা:</span>
                     <span className="text-lg font-black text-slate-900">{formatSummaryNum(summaryData.fullInvolved)}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-slate-500 uppercase tracking-tighter">আংশিক জড়িত টাকা:</span>
                     <span className="text-lg font-black text-slate-900">{formatSummaryNum(summaryData.partialInvolved)}</span>
                   </div>
                   <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                     <span className="text-[13px] font-black text-blue-600 uppercase tracking-tighter">মোট জড়িত টাকা:</span>
                     <span className="text-2xl font-black text-blue-700">{formatSummaryNum(summaryData.totalInvolved)}</span>
                   </div>
                 </div>
                 <div className="p-8 space-y-6 bg-blue-600 text-white">
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-blue-100 uppercase tracking-widest">মোট আদায় টাকা:</span>
                     <span className="text-2xl font-black">{formatSummaryNum(summaryData.totalRec)}</span>
                   </div>
                   <div className="h-[1px] w-full bg-white/10"></div>
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-blue-100 uppercase tracking-widest">মোট সমন্বয় টাকা:</span>
                     <span className="text-2xl font-black">{formatSummaryNum(summaryData.totalAdj)}</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </fieldset>

        <div className="pt-6 relative" ref={bottomRef}>
          {missingNumbersWarning && !isSuccess && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-500 shadow-sm">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-amber-900 tracking-tight">সতর্কবার্তা: প্রয়োজনীয় নম্বর অনুপস্থিত</h4>
                <p className="text-[11px] font-bold text-amber-700/80">
                  ডায়েরি নং, পত্র নং অথবা জারিপত্র নং - এর মধ্যে কমপক্ষে একটি নম্বর থাকা প্রয়োজন। তবে আপনি চাইলে এন্ট্রি সম্পন্ন করতে পারেন।
                </p>
              </div>
            </div>
          )}

          {isSuccess ? (
            <div className="w-full py-10 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200/60 rounded-[3rem] flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500 shadow-[0_25px_60px_rgba(16,185,129,0.2)] backdrop-blur-md relative overflow-hidden group">
               <div className="relative">
                  <div className={`w-24 h-24 ${isDeletingPara || deletedCount > 0 ? 'bg-red-600' : 'bg-emerald-600'} text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_15px_35px_rgba(5,150,105,0.4)] animate-in spin-in-12 duration-700 border-4 border-white`}>
                     {isDeletingPara || deletedCount > 0 ? <Trash size={56} strokeWidth={2.5} className="animate-pulse" /> : (isUpdateMode ? <ShieldCheck size={56} strokeWidth={2.5} className="animate-pulse" /> : <CheckCircle2 size={56} strokeWidth={2.5} className="animate-pulse" />)}
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-emerald-100"><Sparkles size={22} className="text-amber-500" /></div>
               </div>
               
               <div className="text-center space-y-3 relative z-10 px-6">
                  <h4 className={`text-4xl font-black ${isDeletingPara || deletedCount > 0 ? 'text-red-950' : 'text-emerald-950'} tracking-tight`}>
                    {isDeletingPara || deletedCount === 1 ? "অনুচ্ছেদটি ডিলিট করা হচ্ছে" : (deletedCount > 1 ? "অনুচ্ছেদসমূহ ডিলিট করা হচ্ছে" : (isUpdateMode ? "তথ্য আপডেট করা হচ্ছে" : "রেজিস্টার তথ্য সফলভাবে সংরক্ষিত হয়েছে"))}
                  </h4>
                  <div className="text-[16px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                     {isDeletingPara || deletedCount === 1 ? (
                       <React.Fragment><AlertCircle size={20} className="text-red-600" /> তথ্য যাচাই করা হচ্ছে</React.Fragment>
                     ) : (deletedCount > 1 ? (
                       <React.Fragment><AlertCircle size={20} className="text-red-600" /> তথ্য আপডেট হচ্ছে</React.Fragment>
                     ) : (isUpdateMode || isAdmin ? (
                       <React.Fragment><CheckCircle2 size={20} className="text-emerald-600" /> আপনার এন্ট্রিটি সরাসরি মূল রেজিস্টারে যুক্ত করা হয়েছে</React.Fragment>
                     ) : (
                       <React.Fragment><ShieldCheck size={20} className="text-emerald-600" /> চিঠি এন্ট্রি হয়েছে, এডমিন অনুমোদনের পর রেজিস্টারে দেখা যাবে</React.Fragment>
                     )))}
                  </div>
               </div>

               {!isDeletingPara && (
                  <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
                    <button 
                      onClick={handleNewEntry}
                      className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95 group"
                    >
                      নতুন মীমাংসা এন্ট্রি দিন <Plus size={20} />
                    </button>
                    <button 
                      onClick={onViewRegister}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 group"
                    >
                      মীমাংসা রেজিস্টারটি দেখুন <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
               )}
               
               <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="h-1.5 w-64 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div className={`h-full ${isDeletingPara || deletedCount > 0 ? 'bg-red-600' : 'bg-emerald-600'} animate-progress-loading-premium`}></div>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <span className="text-[14px] font-black text-emerald-600 uppercase tracking-widest animate-complete-text">কমপ্লিট</span>
                  </div>
               </div>
            </div>
          ) : (
            <button 
              id="btn-submit-entry"
              type="submit"
              disabled={!!diaryDateError || !!issueDateError}
              className={`w-full py-5 text-white text-xl font-black rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-4 group relative overflow-hidden ${diaryDateError || issueDateError ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {!diaryDateError && !issueDateError && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>}
              <CheckCircle2 size={24} strokeWidth={2.5} /> {isUpdateMode ? 'তথ্য আপডেট করুন' : 'রেজিস্টার তথ্য সংরক্ষণ করুন'}
            </button>
          )}
        </div>
      </form>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-loading-premium {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-loading-premium {
          animation: progress-loading-premium 0.6s linear forwards;
        }
        @keyframes fade-in-complete {
          0%, 95% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-complete-text {
          animation: fade-in-complete 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default SettlementEntryModule;