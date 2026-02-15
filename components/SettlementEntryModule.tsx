import React, { useState, useEffect, useRef } from 'react';
import { SettlementEntry, ParaType, ParagraphDetail, FinancialCategory, GroupOption } from '../types.ts';
import SearchableSelect from './SearchableSelect.tsx';
import { MINISTRIES_LIST, MINISTRY_ENTITY_MAP, ENTITY_BRANCH_MAP, AUDIT_YEARS_OPTIONS } from '../constants.ts';
import { Trash2, Sparkles, X, Building2, Building, AlertCircle, CheckCircle2, Calendar, FileText, Banknote, Archive, BookOpen, Send, FileEdit, Layout, Fingerprint, Info, BarChart3, ListOrdered, ArrowRightCircle, Check, ShieldCheck, Trash, MessageSquare, ArrowRight } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils.ts';
import { getCycleForDate, isEntryLate } from '../utils/cycleHelper.ts';
import { format } from 'date-fns';

const generateSafeId = () => {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

const inputCls = "w-full h-[48px] px-4 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm transition-all text-[14px]";
const labelCls = "block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-1.5";
const numBadge = "inline-flex items-center justify-center w-5 h-5 bg-white text-slate-600 rounded-md text-[10px] font-black mr-1 shadow-sm shrink-0";
const colWrapperCls = "p-5 rounded-2xl border transition-all hover:shadow-lg relative min-w-0";

const IDBadge = ({ id, isLayoutEditable }: { id: string, isLayoutEditable?: boolean }) => {
  const [copied, setCopied] = useState(false);
  if (!isLayoutEditable) return null;
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span onClick={handleCopy} title="Click to copy ID" className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>
      {copied ? 'COPIED!' : `#${id}`}
    </span>
  );
};

const SegmentedInput = ({ 
  id, icon: Icon, label, color, noValue, dayValue, monthValue, yearValue, 
  noSetter, daySetter, monthSetter, yearSetter, dayRef, monthRef, yearRef, 
  isFocused, focusSetter, isLayoutEditable, extra 
}: any) => {
  
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

  return (
    <div id={id} className={colWrapperCls + ` bg-${color}-50/70 border-${color}-100 hover:border-${color}-300`}>
      <IDBadge id={id} isLayoutEditable={isLayoutEditable} />
      <label className={labelCls + " truncate"}><span className={numBadge}>{id.split('-')[1]}</span> <Icon size={14} className={`text-${color}-600 shrink-0`} /> <span className="truncate">{label}</span></label>
      <div className={`relative w-full h-[55px] flex items-center border rounded-2xl bg-white transition-all duration-300 shadow-sm border-slate-200 hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50`}>
        {extra}
        <div className="flex items-center w-full px-2 sm:px-4 h-full">
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
                if (raw.includes('/') || raw.includes('-')) {
                   dayRef.current?.focus();
                } else {
                   noSetter(toBengaliDigits(raw.replace(/[\/\-]/g, '')));
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') dayRef.current?.focus();
              }}
            />
          </div>
          <div className="h-6 w-[1px] sm:w-[1.5px] bg-slate-200 mx-1 sm:mx-2 shrink-0"></div>
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
        </div>
      </div>
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
  isLayoutEditable?: boolean;
  isAdmin?: boolean;
}

const SettlementEntryModule: React.FC<SettlementEntryModuleProps> = ({ onAdd, onViewRegister, nextSl, branchSuggestions, initialEntry, onCancel, onBackToMenu, isLayoutEditable, isAdmin = false }) => {
  const [formData, setFormData] = useState({
    paraType: 'এসএফআই' as ParaType, 
    meetingType: 'বিএসআর',
    ministryName: '',
    entityName: '',
    branchName: '',
    auditYear: '',
    letterNoDate: '',
    meetingWorkpaper: '', 
    minutesNoDate: '', 
    workpaperNoDate: '', 
    issueLetterNoDate: '', 
    issueDateISO: '', 
    archiveNo: '',
    meetingSentParaCount: '',
    meetingSettledParaCount: '',
    meetingFullSettledParaCount: '',
    meetingPartialSettledParaCount: '',
    meetingUnsettledParas: '',
    meetingUnsettledAmount: 0,
    isMeeting: false,
    remarks: '',
    meetingDate: '',
    manualRaisedCount: null as string | null,
    manualRaisedAmount: null as number | null
  });

  const [wizardStep, setWizardStep] = useState('details'); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeletingPara, setIsDeletingPara] = useState(false);
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

  const [minNoPart, setMinNoPart] = useState('');
  const [minDay, setMinDay] = useState('');
  const [minMonth, setMinMonth] = useState('');
  const [minYear, setMinYear] = useState('');

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
  const [isMinFocused, setIsMinFocused] = useState(false);
  const [isDiaryFocused, setIsDiaryFocused] = useState(false);

  const letterDayRef = useRef<HTMLInputElement>(null);
  const letterMonthRef = useRef<HTMLInputElement>(null);
  const letterYearRef = useRef<HTMLInputElement>(null);
  const wpDayRef = useRef<HTMLInputElement>(null);
  const wpMonthRef = useRef<HTMLInputElement>(null);
  const wpYearRef = useRef<HTMLInputElement>(null);
  const minDayRef = useRef<HTMLInputElement>(null);
  const minMonthRef = useRef<HTMLInputElement>(null);
  const minYearRef = useRef<HTMLInputElement>(null);
  const diaryDayRef = useRef<HTMLInputElement>(null);
  const diaryMonthRef = useRef<HTMLInputElement>(null);
  const diaryYearRef = useRef<HTMLInputElement>(null);
  const issueDayRef = useRef<HTMLInputElement>(null);
  const issueMonthRef = useRef<HTMLInputElement>(null);
  const issueYearRef = useRef<HTMLInputElement>(null);

  const extractSegments = (combined: string, noPrefix: string, datePrefix: string) => {
    if (!combined) return { no: '', d: '', m: '', y: '' };
    const parts = combined.split(',');
    let no = '';
    let d = '', m = '', y = '';
    
    if (parts.length >= 1) {
      no = parts[0].replace(new RegExp(`${noPrefix}\\s*`), '').trim();
    }
    if (parts.length >= 2) {
      const dateStr = parts[1].replace(new RegExp(`${datePrefix}\\s*`), '').trim();
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
        minutesNoDate: initialEntry.minutesNoDate || '',
        workpaperNoDate: initialEntry.workpaperNoDate || '',
        issueLetterNoDate: initialEntry.issueLetterNoDate || '',
        issueDateISO: initialEntry.issueDateISO || '',
        archiveNo: initialEntry.archiveNo || '',
        meetingSentParaCount: initialEntry.meetingSentParaCount || '',
        meetingSettledParaCount: initialEntry.meetingSettledParaCount || '',
        meetingFullSettledParaCount: initialEntry.meetingFullSettledParaCount || '',
        meetingPartialSettledParaCount: initialEntry.meetingPartialSettledParaCount || '',
        meetingUnsettledParas: initialEntry.meetingUnsettledParas || '',
        meetingUnsettledAmount: initialEntry.meetingUnsettledAmount || 0,
        isMeeting: initialEntry.isMeeting || false,
        remarks: initialEntry.remarks || '',
        meetingDate: initialEntry.meetingDate || '',
        manualRaisedCount: initialEntry.manualRaisedCount || null,
        manualRaisedAmount: initialEntry.manualRaisedAmount || null
      });

      const f7 = extractSegments(initialEntry.letterNoDate, 'পত্র নং-', 'পত্রের তারিখ-');
      setLetterNoPart(f7.no); setLetterDay(f7.d); setLetterMonth(f7.m); setLetterYear(f7.y);

      const f8 = extractSegments(initialEntry.meetingWorkpaper, 'কার্যপত্র নং-', 'কার্যপত্রের তারিখ-');
      setWpNoPart(f8.no); setWpDay(f8.d); setWpMonth(f8.m); setWpYear(f8.y);

      const f9 = extractSegments(initialEntry.minutesNoDate, 'কার্যবিবরণী নং-', 'কার্যবিবরণীর তারিখ-');
      setMinNoPart(f9.no); setMinDay(f9.d); setMinMonth(f9.m); setMinYear(f9.y);

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
      });
      
      if (initialEntry.manualRaisedCount) newRaw['entry-raised-count'] = toBengaliDigits(initialEntry.manualRaisedCount);
      if (initialEntry.manualRaisedAmount) newRaw['entry-raised-amount'] = toBengaliDigits(initialEntry.manualRaisedAmount);

      setRawInputs(newRaw);
      setWizardStep('details');
    }
  }, [initialEntry]);

  const buildCombinedString = (no: string, d: string, m: string, y: string, noPrefix: string, datePrefix: string) => {
    const day = d ? (toEnglishDigits(d).length === 1 ? '0' + toEnglishDigits(d) : toEnglishDigits(d)) : '';
    const month = m ? (toEnglishDigits(m).length === 1 ? '0' + toEnglishDigits(m) : toEnglishDigits(m)) : '';
    let year = toEnglishDigits(y);
    if (year.length === 2) year = '20' + year;
    const formattedDate = (day && month && year.length === 4) ? `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(year)}` : '';
    return `${noPrefix} ${no}${formattedDate ? `, ${datePrefix} ${formattedDate}` : ''}`;
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, letterNoDate: buildCombinedString(letterNoPart, letterDay, letterMonth, letterYear, 'পত্র নং-', 'পত্রের তারিখ-') }));
  }, [letterNoPart, letterDay, letterMonth, letterYear]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, meetingWorkpaper: buildCombinedString(wpNoPart, wpDay, wpMonth, wpYear, 'কার্যপত্র নং-', 'কার্যপত্রের তারিখ-') }));
  }, [wpNoPart, wpDay, wpMonth, wpYear]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, minutesNoDate: buildCombinedString(minNoPart, minDay, minMonth, minYear, 'কার্যবিবরণী নং-', 'কার্যবিবরণীর তারিখ-') }));
  }, [minNoPart, minDay, minMonth, minYear]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, workpaperNoDate: buildCombinedString(diaryNoPart, diaryDay, diaryMonth, diaryYear, 'ডায়েরি নং-', 'ডায়েরির তারিখ-') }));
  }, [diaryNoPart, diaryDay, diaryMonth, diaryYear]);

  useEffect(() => {
    const combined = buildCombinedString(issueNoPart, dayPart, monthPart, yearPart, 'জারিপত্র নং-', 'জারিপত্রের তারিখ-');
    let iso = '';
    const d = toEnglishDigits(dayPart), m = toEnglishDigits(monthPart); let y = toEnglishDigits(yearPart);
    if (y.length === 2) y = '20' + y;
    if (d && m && y.length === 4) {
      try {
        const parsedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        if (!isNaN(parsedDate.getTime())) iso = format(parsedDate, 'yyyy-MM-dd');
      } catch (e) {}
    }
    setFormData(prev => ({ ...prev, issueLetterNoDate: combined, issueDateISO: iso }));
  }, [issueNoPart, dayPart, monthPart, yearPart]);

  const [paragraphs, setParagraphs] = useState<ParagraphDetail[]>([]);
  const [bulkParaInput, setBulkParaInput] = useState('');
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

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
       const isNumericField = ['meetingSentParaCount', 'meetingSettledParaCount', 'meetingUnsettledParas', 'meetingUnsettledAmount'].includes(field);
       setFormData(prev => ({ ...prev, [field]: isNumericField ? engNum : (val.includes('.') ? engNum : bDigits) } as any));
    } else {
      setRawInputs(prev => ({ ...prev, [`${id}-${field}`]: bDigits }));
      setParagraphs(prev => prev.map(p => p.id === id ? { ...p, [field]: engNum } : p));
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
    if (isSubmitting.current || isSuccess) return;
    isSubmitting.current = true;
    setIsSuccess(true);
    setIsDeletingPara(false);
    
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    const now = new Date();
    let cycleLabel = '';
    let isLate = false;
    if (formData.issueDateISO) {
      const cycle = getCycleForDate(new Date(formData.issueDateISO));
      cycleLabel = cycle.label;
      isLate = isEntryLate(now, cycle.end);
    }
    const totals = paragraphs.reduce((acc, p) => {
      if (p.category === 'ভ্যাট') { acc.vR += p.recoveredAmount; acc.vA += p.adjustedAmount; }
      else if (p.category === 'আয়কর') { acc.iR += p.recoveredAmount; acc.iA += p.adjustedAmount; }
      else { acc.oR += p.recoveredAmount; acc.oA += p.adjustedAmount; }
      return acc;
    }, { vR: 0, vA: 0, iR: 0, iA: 0, oR: 0, oA: 0 });
    const paraInvTotal = paragraphs.reduce((s, p) => s + p.involvedAmount, 0);
    
    const finalData = {
      ...formData, 
      meetingFullSettledParaCount: Math.round(summaryData.fullInvolved).toString(),
      meetingPartialSettledParaCount: Math.round(summaryData.partialInvolved).toString(),
      isMeeting: formData.meetingType !== 'বিএসআর', 
      paragraphs, cycleLabel, isLate, actualEntryDate: now.toISOString(), involvedAmount: paraInvTotal + (formData.meetingUnsettledAmount || 0),
      vatRec: totals.vR, vatAdj: totals.vA, itRec: totals.iR, itAdj: totals.iA, othersRec: totals.oR, othersAdj: totals.oA, totalRec: totals.vR + totals.iR + totals.oR, totalAdj: totals.vA + totals.iA + totals.oA 
    };

    onAdd(finalData);
    isSubmitting.current = false;
  };

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

  if (wizardStep === 'selection') {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8 max-w-4xl mx-auto animate-in zoom-in-95 duration-300 relative">
        <IDBadge id="step-selection-inner" isLayoutEditable={isLayoutEditable} />
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
            className={`group relative flex items-center min-h-[100px] w-full rounded-[1.5rem] shadow-md border-2 transition-all duration-500 cursor-pointer overflow-hidden ${formData.paraType === 'এসএফআই' ? 'bg-slate-900 border-blue-600 ring-4 ring-blue-50' : 'bg-white border-slate-100 hover:border-blue-200'}`}
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${formData.paraType === 'এসএফআই' ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-200'}`}></div>
            <div className="flex items-center pl-8 gap-6 flex-1 pr-6 py-4">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${formData.paraType === 'এসএফআই' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                  <Building2 size={30} />
               </div>
               <div className="flex-1 space-y-3">
                  <h4 className={`text-xl font-black transition-colors ${formData.paraType === 'এসএফআই' ? 'text-white' : 'text-slate-800'}`}>এসএফআই (SFI)</h4>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select 
                      value={formData.paraType === 'এসএফআই' ? formData.meetingType : ''} 
                      onChange={(e) => { setFormData({...formData, meetingType: e.target.value, isMeeting: e.target.value !== 'বিএসআর', paraType: 'এসএফআই'}); }} 
                      className={`w-full py-2 px-3 rounded-lg font-bold outline-none border transition-all ${formData.paraType === 'এসএফআই' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                    >
                      <option value="" disabled>ধরন নির্বাচন করুন...</option>
                      <option value="বিএসআর">বিএসআর (BSR)</option>
                      <option value="ত্রিপক্ষীয় সভা">ত্রিপক্ষীয় সভা</option>
                    </select>
                  </div>
               </div>
            </div>
            {formData.paraType === 'এসএফআই' && (
              <div className="pr-8 animate-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><Check size={18} className="text-white" strokeWidth={3} /></div>
              </div>
            )}
          </div>

          <div 
            onClick={() => setFormData({...formData, paraType: 'নন এসএফআই'})}
            className={`group relative flex items-center min-h-[100px] w-full rounded-[1.5rem] shadow-md border-2 transition-all duration-500 cursor-pointer overflow-hidden ${formData.paraType === 'নন এসএফআই' ? 'bg-slate-900 border-indigo-600 ring-4 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${formData.paraType === 'নন এসএফআই' ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-200'}`}></div>
            <div className="flex items-center pl-8 gap-6 flex-1 pr-6 py-4">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${formData.paraType === 'নন এসএফআই' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                  <Building size={30} />
               </div>
               <div className="flex-1 space-y-3">
                  <h4 className={`text-xl font-black transition-colors ${formData.paraType === 'নন এসএফআই' ? 'text-white' : 'text-slate-800'}`}>নন এসএফআই (Non-SFI)</h4>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select 
                      value={formData.paraType === 'নন এসএফআই' ? formData.meetingType : ''} 
                      onChange={(e) => { setFormData({...formData, meetingType: e.target.value, isMeeting: e.target.value !== 'বিএসআর', paraType: 'নন এসএফআই'}); }} 
                      className={`w-full py-2 px-3 rounded-lg font-bold outline-none border transition-all ${formData.paraType === 'নন এসএফআই' ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                    >
                      <option value="" disabled>ধরন নির্বাচন করুন...</option>
                      <option value="বিএসআর">বিএসআর (BSR)</option>
                      <option value="দ্বিপক্ষীয় সভা">দ্বিপক্ষীয় সভা</option>
                    </select>
                  </div>
               </div>
            </div>
            {formData.paraType === 'নন এসএফআই' && (
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

  return (
    <div id="form-container-settlement" className="bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-landing-premium max-w-7xl mx-auto overflow-x-hidden relative">
      <IDBadge id="view-settlement-form" isLayoutEditable={isLayoutEditable} />
      <div id="form-header" className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-100 gap-4 relative">
        <IDBadge id="form-header" isLayoutEditable={isLayoutEditable} />
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
          <div><h3 className="text-2xl font-black text-slate-900 leading-tight">মীমাংসা রেজিস্টার ডাটা এন্ট্রি</h3><p className="text-slate-500 font-bold text-sm">অনুগ্রহ করে নিচের ১৮টি ফিল্ড সঠিকভাবে পূরণ করুন</p></div>
        </div>
        {onCancel && (
          <button 
            id="btn-cancel-entry" 
            type="button" 
            onClick={onCancel} 
            className="px-5 py-2.5 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-black text-sm transition-all flex items-center gap-2 border border-slate-200 relative shrink-0"
          >
            <IDBadge id="btn-cancel-entry" isLayoutEditable={isLayoutEditable} />
            <X size={18} /> বাতিল করুন
          </button>
        )}
      </div>

      <form id="form-entry" onSubmit={handleSubmit} className="space-y-10">
        <fieldset disabled={isSuccess} className="space-y-10 border-none p-0 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
            <div id="field-1" className={col1Style}><IDBadge id="field-1" isLayoutEditable={isLayoutEditable} /><SearchableSelect label="১. শাখা (SFI/Non-SFI)" groups={[{ label: 'শাখা ধরণ', options: ['এসএফআই', 'নন এসএফআই'] }]} value={formData.paraType} onChange={v => setFormData({ ...formData, paraType: v as ParaType })} required isLayoutEditable={isLayoutEditable} badgeId="select-para-type" /></div>
            <div id="field-2" className={col2Style}><IDBadge id="field-2" isLayoutEditable={isLayoutEditable} /><SearchableSelect label="২. চিঠির ধরণ" groups={[{ label: 'চিঠি তালিকা', options: formData.paraType === 'এসএফআই' ? ['বিএসআর', 'ত্রিপক্ষীয় সভা'] : ['বিএসআর', 'দ্বিপক্ষীয় সভা'] }]} value={formData.meetingType} onChange={v => setFormData({...formData, meetingType: v, isMeeting: v !== 'বিএসআর'})} required isLayoutEditable={isLayoutEditable} badgeId="select-meeting-type" /></div>
            <div id="field-3" className={col3Style}><IDBadge id="field-3" isLayoutEditable={isLayoutEditable} /><SearchableSelect label="৩. মন্ত্রণালয়" groups={MINISTRIES_LIST} value={formData.ministryName} onChange={v => setFormData(f=>({...f, ministryName: v}))} required isLayoutEditable={isLayoutEditable} badgeId="select-ministry" /></div>
            <div id="field-4" className={col4Style}><IDBadge id="field-4" isLayoutEditable={isLayoutEditable} /><SearchableSelect label="৪. এনটিটি / সংস্থা" groups={[{label: 'এনটিটি তালিকা', options: entityOpts}]} value={formData.entityName} onChange={v => setFormData(f=>({...f, entityName: v}))} required isLayoutEditable={isLayoutEditable} badgeId="select-entity" /></div>
            <div id="field-5" className={col1Style}><IDBadge id="field-5" isLayoutEditable={isLayoutEditable} /><SearchableSelect label="৫. শাখা (বিস্তারিত বিবরণ)" groups={branchOpts.length > 0 ? [{label: ' শাখা তালিকা', options: branchOpts}] : branchSuggestions} value={formData.branchName} onChange={v => setFormData(f=>({...f, branchName: v}))} required isLayoutEditable={isLayoutEditable} badgeId="select-branch" /></div>
            <div id="field-6" className={col2Style}><IDBadge id="field-6" isLayoutEditable={isLayoutEditable} /><SearchableSelect label="৬. নিরীক্ষা সাল" groups={AUDIT_YEARS_OPTIONS} value={formData.auditYear} onChange={v => setFormData(f=>({...f, auditYear: v}))} required isLayoutEditable={isLayoutEditable} badgeId="select-audit-year" /></div>
            
            <SegmentedInput id="field-7" icon={FileText} label="পত্র নং ও তারিখ" color="amber" noValue={letterNoPart} dayValue={letterDay} monthValue={letterMonth} yearValue={letterYear} noSetter={setLetterNoPart} daySetter={setLetterDay} monthSetter={setLetterMonth} yearSetter={setLetterYear} dayRef={letterDayRef} monthRef={letterMonthRef} yearRef={letterYearRef} isFocused={isLetterFocused} focusSetter={setIsLetterFocused} isLayoutEditable={isLayoutEditable} />
            <SegmentedInput id="field-8" icon={FileEdit} label="কার্যপত্র নং ও তারিখ" color="purple" noValue={wpNoPart} dayValue={wpDay} monthValue={wpMonth} yearValue={wpYear} noSetter={setWpNoPart} daySetter={setWpDay} monthSetter={setWpMonth} yearSetter={setWpYear} dayRef={wpDayRef} monthRef={wpMonthRef} yearRef={wpYearRef} isFocused={isWpFocused} focusSetter={setIsWpFocused} isLayoutEditable={isLayoutEditable} />
            <SegmentedInput id="field-9" icon={Info} label="কার্যবিবরণী নং ও তারিখ" color="sky" noValue={minNoPart} dayValue={minDay} monthValue={minMonth} yearValue={minYear} noSetter={setMinNoPart} daySetter={setMinDay} monthSetter={setMinMonth} yearSetter={setMinYear} dayRef={minDayRef} monthRef={minMonthRef} yearRef={minYearRef} isFocused={isMinFocused} focusSetter={setIsMinFocused} isLayoutEditable={isLayoutEditable} />
            <SegmentedInput id="field-10" icon={BookOpen} label="ডায়েরি নং ও তারিখ" color="emerald" noValue={diaryNoPart} dayValue={diaryDay} monthValue={diaryMonth} yearValue={diaryYear} noSetter={setDiaryNoPart} daySetter={setDiaryDay} monthSetter={setDiaryMonth} yearSetter={setDiaryYear} dayRef={diaryDayRef} monthRef={diaryMonthRef} yearRef={diaryYearRef} isFocused={isDiaryFocused} focusSetter={setIsDiaryFocused} isLayoutEditable={isLayoutEditable} />

            <SegmentedInput 
              id="field-11" icon={Send} label="জারিপত্র নং ও তারিখ" color="amber" 
              noValue={issueNoPart} dayValue={dayPart} monthValue={monthPart} yearValue={yearPart} 
              noSetter={setIssueNoPart} daySetter={setDayPart} monthSetter={setMonthPart} yearSetter={setYearPart} 
              dayRef={issueDayRef} monthRef={issueMonthRef} yearRef={issueYearRef} 
              isFocused={isIssueFocused} focusSetter={setIsIssueFocused} isLayoutEditable={isLayoutEditable}
              extra={formData.issueDateISO && (
                <div className="absolute -right-2 -top-2 z-[310] flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-500">
                  <Check size={14} strokeWidth={4} />
                </div>
              )}
            />

            <div id="field-12" className={col4Style}><IDBadge id="field-12" isLayoutEditable={isLayoutEditable} /><label className={labelCls}><span className={numBadge}>১২</span> <Archive size={14} className="text-purple-600 shrink-0" /> আর্কাইভ নং</label><input type="text" className={inputCls} value={formData.archiveNo} onChange={e => { const val = e.target.value; const raw = val.startsWith('kg-') ? val.slice(3).trim() : val; const formatted = raw ? `kg- ${toBengaliDigits(raw)}` : ''; setFormData({...formData, archiveNo: formatted}); }} placeholder="আর্কাইভ নং" /></div>
            <div id="field-13" className={col1Style}><IDBadge id="field-13" isLayoutEditable={isLayoutEditable} /><label className={labelCls}><span className={numBadge}>১৩</span> <ListOrdered size={14} className="text-sky-600 shrink-0" /> প্রেরিত অনুচ্ছেদ সংখ্যা</label><input type="text" className={inputCls} value={rawInputs['direct-meetingSentParaCount'] || (formData.meetingSentParaCount === '0' || formData.meetingSentParaCount === '' ? '' : toBengaliDigits(formData.meetingSentParaCount))} onChange={e => handleNumericInput('direct', 'meetingSentParaCount', e.target.value)} placeholder="০" /></div>
            <div id="field-14" className={col2Style}><IDBadge id="field-14" isLayoutEditable={isLayoutEditable} /><label className={labelCls}><span className={numBadge}>১৪</span> <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> মীমাংসিত অনুচ্ছেদ সংখ্যা</label><input type="text" className={inputCls} value={rawInputs['direct-meetingSettledParaCount'] || (formData.meetingSettledParaCount === '0' || formData.meetingSettledParaCount === '' ? '' : toBengaliDigits(formData.meetingSettledParaCount))} onChange={e => handleNumericInput('direct', 'meetingSettledParaCount', e.target.value)} placeholder="০" /></div>
            <div id="field-15" className={col3Style}><IDBadge id="field-15" isLayoutEditable={isLayoutEditable} /><label className={labelCls}><span className={numBadge}>১৫</span> <AlertCircle size={14} className="text-amber-600 shrink-0" /> অমীমাংসিত অনুচ্ছেদ সংখ্যা</label><input type="text" className={inputCls} value={rawInputs['direct-meetingUnsettledParas'] || (formData.meetingUnsettledParas === '0' || formData.meetingUnsettledParas === '' ? '' : toBengaliDigits(formData.meetingUnsettledParas))} onChange={e => handleNumericInput('direct', 'meetingUnsettledParas', e.target.value)} placeholder="০" /></div>
            <div id="field-16" className={col4Style}><IDBadge id="field-16" isLayoutEditable={isLayoutEditable} /><label className={labelCls}><span className={numBadge}>১৬</span> <Banknote size={14} className="text-purple-600 shrink-0" /> অমীমাংসিত জড়িত টাকা</label><input type="text" className={inputCls} value={rawInputs['direct-meetingUnsettledAmount'] || (formData.meetingUnsettledAmount === 0 ? '' : toBengaliDigits(formData.meetingUnsettledAmount))} onChange={e => handleNumericInput('direct', 'meetingUnsettledAmount', e.target.value)} placeholder="০" /></div>
            
            <div id="field-17" className={col1Style}>
              <IDBadge id="field-17" isLayoutEditable={isLayoutEditable} />
              <label className={labelCls}><span className={numBadge}>১৭</span> <Calendar size={14} className="text-sky-600 shrink-0" /> সভার তারিখ</label>
              <input type="date" className={inputCls} value={formData.meetingDate} onChange={e => setFormData({...formData, meetingDate: e.target.value})} />
            </div>
            <div id="field-18" className={col2Style}>
              <IDBadge id="field-18" isLayoutEditable={isLayoutEditable} />
              <label className={labelCls}><span className={numBadge}>১৮</span> <MessageSquare size={14} className="text-emerald-600" /> মন্তব্য</label>
              <input type="text" className={inputCls} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="মন্তব্য লিখুন..." />
            </div>
          </div>

          <div id="section-manual-raised-block" className="pt-8 relative"><IDBadge id="section-manual-raised-block" isLayoutEditable={isLayoutEditable} /><div className="bg-blue-50/40 border border-blue-100 rounded-[2.5rem] p-8 shadow-sm space-y-6"><div className="flex items-center gap-3"><Sparkles size={20} className="text-blue-600 animate-pulse" /><h4 className="text-[15px] font-black text-blue-900 tracking-tight">বর্তমান মাসে উত্থাপিত অডিট আপত্তি (ঐচ্ছিক)</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-3"><label className="text-[13px] font-bold text-slate-700 ml-1">সংখ্যা (উত্থাপিত)</label><input type="text" className="w-full h-[58px] px-6 border-2 border-white rounded-2xl font-black text-slate-800 bg-white/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 outline-none shadow-sm transition-all text-center text-lg placeholder:text-slate-300 placeholder:font-black" value={rawInputs['entry-raised-count'] || (formData.manualRaisedCount === null || formData.manualRaisedCount === '0' || formData.manualRaisedCount === '' ? '' : toBengaliDigits(formData.manualRaisedCount || ''))} onChange={e => handleNumericInput('entry', 'raised-count', e.target.value)} placeholder="০" /></div><div className="space-y-3"><label className="text-[13px] font-bold text-slate-700 ml-1">টাকার পরিমাণ (উত্থাপিত)</label><input type="text" className="w-full h-[58px] px-6 border-2 border-white rounded-2xl font-black text-slate-800 bg-white/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 outline-none shadow-sm transition-all text-center text-lg placeholder:text-slate-300 placeholder:font-black" value={rawInputs['entry-raised-amount'] || (formData.manualRaisedAmount === null || formData.manualRaisedAmount === 0 ? '' : toBengaliDigits(formData.manualRaisedAmount || ''))} onChange={e => handleNumericInput('entry', 'raised-amount', e.target.value)} placeholder="০" /></div></div></div></div>
          
          <div id="section-para-entry-area" className="pt-10 border-t border-slate-100 relative">
            <IDBadge id="section-para-entry-area" isLayoutEditable={isLayoutEditable} />
            <div id="section-para-bulk" className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8 relative">
              <IDBadge id="section-para-bulk" isLayoutEditable={isLayoutEditable} />
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-black text-slate-500 mb-2 ml-1 uppercase">বিস্তারিত অনুচ্ছেদ যোগ করুন (মীমাংসিতদের জন্য)</label>
                  <input type="text" className="w-full h-[55px] px-6 border border-slate-300 rounded-2xl font-black text-slate-900 bg-white focus:border-blue-500 outline-none shadow-sm text-lg transition-all" value={bulkParaInput} onChange={e => setBulkParaInput(toBengaliDigits(e.target.value))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleBulkGenerate())} placeholder="অনুচ্ছেদ নং (যেমন: ৫, ১০, ১৫)" />
                </div>
                <button id="btn-add-paras" type="button" onClick={handleBulkGenerate} className="w-full md:w-auto px-8 h-[55px] bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg relative">
                  <IDBadge id="btn-add-paras" isLayoutEditable={isLayoutEditable} />
                  <Sparkles size={20} className="text-blue-400" /> অনুচ্ছেদ যোগ
                </button>
              </div>
            </div>
            <div id="section-para-list" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10 relative">
              <IDBadge id="section-para-list" isLayoutEditable={isLayoutEditable} />
              {paragraphs.map((p, idx) => (
                <div key={p.id} id={`card-para-${idx}`} className={`p-6 rounded-[2rem] relative border-2 ${p.involvedAmount > 0 && p.involvedAmount === (p.recoveredAmount + p.adjustedAmount) ? "border-emerald-500 bg-emerald-50/10 shadow-emerald-100" : "border-red-500 bg-red-50/20 shadow-red-100"} hover:shadow-xl transition-all group overflow-hidden`}>
                  <IDBadge id={`card-para-${idx}`} isLayoutEditable={isLayoutEditable} />
                  
                  {(isAdmin || !isUpdateMode) && (
                    <button 
                      type="button" 
                      onClick={() => { 
                        if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অনুচ্ছেদটি মুছে ফেলতে চান?")) return;
                        setIsDeletingPara(true);
                        setIsSuccess(true);
                        setTimeout(() => {
                          setParagraphs(prev => prev.filter(x => x.id !== p.id));
                          setIsSuccess(false);
                          setIsDeletingPara(false);
                          if(isUpdateMode) { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
                        }, 2800);
                      }} 
                      className="absolute top-4 right-4 h-6 w-6 flex items-center justify-center bg-white text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-100 rounded-lg transition-all shadow-sm z-30 active:scale-95 hover:scale-110"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 relative z-10 pr-10">
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl shadow-md">
                      <span className="text-[14px] font-black text-white">{toBengaliDigits(idx + 1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">অনু: নং</span>
                      <input type="text" className="w-20 h-9 border border-slate-300 rounded-lg text-center font-black bg-white text-slate-950 outline-none focus:border-blue-500" value={rawInputs[`${p.id}-paraNo`] || toBengaliDigits(p.paraNo)} onChange={e => handleNumericInput(p.id, 'paraNo', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => setParagraphs(prev => prev.map(x => x.id === p.id ? {...x, status: x.status === 'পূর্ণাঙ্গ' ? 'আংশিক' : 'পূর্ণাঙ্গ'} : x))} className={`h-9 w-[85px] rounded-xl text-[10px] font-black text-white shadow-md transition-all active:scale-95 flex items-center justify-center ${p.status === 'পূর্ণাঙ্গ' ? 'bg-emerald-600' : 'bg-red-600'}`}>{p.status}</button>
                    <div className="flex bg-slate-100 rounded-lg p-1 h-9 border border-slate-200">
                      {['ভ্যাট', 'আয়কর', 'অন্যান্য'].map(cat => (
                        <button key={cat} type="button" onClick={() => setParagraphs(prev => prev.map(x => x.id === p.id ? {...x, category: cat as FinancialCategory} : x))} className={`whitespace-nowrap px-3 py-1 text-[9px] font-black rounded-md transition-all ${p.category === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 relative z-10">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 pl-1 uppercase tracking-wider text-center block">জড়িত টাকা</label><input type="text" className="w-full h-12 px-3 border border-slate-300 rounded-xl text-center font-black bg-white text-slate-950 outline-none focus:border-blue-500 shadow-inner placeholder:text-slate-300 placeholder:font-black" value={rawInputs[`${p.id}-involvedAmount`] || (p.involvedAmount === 0 ? '' : toBengaliDigits(p.involvedAmount))} onChange={e => handleNumericInput(p.id, 'involvedAmount', e.target.value)} placeholder="০" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-emerald-600 pl-1 uppercase tracking-wider text-center block">আদায়কৃত</label><input type="text" className="w-full h-12 px-3 border border-slate-300 rounded-xl text-center font-black bg-white text-slate-950 outline-none focus:border-emerald-500 shadow-inner placeholder:text-slate-300 placeholder:font-black" value={rawInputs[`${p.id}-recoveredAmount`] || (p.recoveredAmount === 0 ? '' : toBengaliDigits(p.recoveredAmount))} onChange={e => handleNumericInput(p.id, 'recoveredAmount', e.target.value)} placeholder="০" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-indigo-600 pl-1 uppercase tracking-wider text-center block">সমন্বয়কৃত</label><input type="text" className="w-full h-12 px-3 border border-slate-300 rounded-xl text-center font-black bg-white text-slate-950 outline-none focus:border-indigo-500 shadow-inner placeholder:text-slate-300 placeholder:font-black" value={rawInputs[`${p.id}-adjustedAmount`] || (p.adjustedAmount === 0 ? '' : toBengaliDigits(p.adjustedAmount))} onChange={e => handleNumericInput(p.id, 'adjustedAmount', e.target.value)} placeholder="০" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="section-form-summary" className="pt-10 border-t border-slate-100 space-y-6 relative">
             <IDBadge id="section-form-summary" isLayoutEditable={isLayoutEditable} />
             <div className="flex items-center gap-3 ml-2">
               <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg"><BarChart3 size={18} /></div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">এন্ট্রি সারাংশ (Summary Dashboard)</h4>
             </div>
             <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
               <IDBadge id="summary-unified-block" isLayoutEditable={isLayoutEditable} />
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
                     <span className="text-[13px] font-black text-blue-100 uppercase tracking-widest">মোট আদায় টাকা:</span>
                     <span className="text-2xl font-black">{formatSummaryNum(summaryData.totalRec)}</span>
                   </div>
                   <div className="h-[1px] w-full bg-white/10"></div>
                   <div className="flex items-center justify-between">
                     <span className="text-[13px] font-black text-blue-100 uppercase tracking-widest">মোট সমন্বয় টাকা:</span>
                     <span className="text-2xl font-black">{formatSummaryNum(summaryData.totalAdj)}</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </fieldset>

        <div className="pt-6 relative" ref={bottomRef}>
          {isSuccess ? (
            <div className="w-full py-10 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200/60 rounded-[3rem] flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500 shadow-[0_25px_60px_rgba(16,185,129,0.2)] backdrop-blur-md relative overflow-hidden group">
               <div className="relative">
                  <div className={`w-24 h-24 ${isDeletingPara || deletedCount > 0 ? 'bg-red-600' : 'bg-emerald-600'} text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_15px_35px_rgba(5,150,105,0.4)] animate-in spin-in-12 duration-700 border-4 border-white`}>
                     {isDeletingPara || deletedCount > 0 ? <Trash size={56} strokeWidth={2.5} className="animate-pulse" /> : (isUpdateMode ? <ShieldCheck size={56} strokeWidth={2.5} className="animate-pulse" /> : <CheckCircle2 size={56} strokeWidth={2.5} className="animate-pulse" />)}
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-emerald-100">
                     <Sparkles size={22} className="text-amber-500" />
                  </div>
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter animate-pulse italic">{(isDeletingPara || deletedCount > 0) ? 'অনুগ্রহ করে অপেক্ষা করুন...' : 'প্রক্রিয়াটি সফলভাবে সম্পন্ন হয়েছে'}</span>
               </div>
            </div>
          ) : (
            <button 
              id="btn-submit-entry"
              type="submit"
              className="w-full py-5 text-white text-xl font-black rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-4 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <IDBadge id="btn-submit-entry" isLayoutEditable={isLayoutEditable} />
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
          animation: progress-loading-premium 4s linear forwards;
        }
      `}} />
    </div>
  );
};

export default SettlementEntryModule;
