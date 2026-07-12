import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mail, X, FileText, Calendar, Hash, Banknote, BookOpen, 
  Inbox, Computer, User, CheckCircle2, Layout, Sparkles, 
  ListOrdered, ArrowRightCircle, ShieldCheck, AlertCircle, Trash2, Search, ChevronDown, Check, Plus, CalendarRange, ArrowRight, Send, FileEdit, ClipboardCheck, Globe,
  Building
} from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { getCycleForDate } from '../utils/cycleHelper';
import { getDateError } from '../utils/dateValidation';
import { SFI_RECEIVERS } from '../utils/sfi';
import { NONSFI_RECEIVERS } from '../utils/nonsfi';
import { isSFI, isNonSFI, isAdminBranch, getBranchVariations } from '../utils/branchUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MINISTRY_ENTITY_MAP } from '../constants';

/**
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 * 
 * CorrespondenceEntryModule - প্রাপ্ত চিঠিপত্র এন্ট্রি মডিউল
 * AI MUST NOT change existing styles, colors, or core logic without permission.
 */

// UI Constants moved to top for global access within the file
const colWrapper = "p-5 rounded-2xl border bg-white transition-all hover:shadow-lg relative min-w-0";
const inputCls = "w-full h-[52px] px-4 border-2 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 shadow-sm transition-all text-[14px]";
const getDynamicBorder = (val: any) => {
  if (val && val.toString().trim() !== '' && val !== '০' && val.toString() !== '0') return 'border-emerald-500 ring-emerald-50';
  return 'border-red-500 ring-red-50';
};
const labelCls = "block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-2";
const numBadge = "inline-flex items-center justify-center w-5 h-5 bg-slate-900 text-white rounded-md text-[10px] font-black shadow-sm shrink-0";
const sectionHeaderCls = "col-span-full mt-6 mb-2 py-2 border-b border-slate-100 flex items-center gap-3";
const sectionTitleCls = "text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]";

/**
 * Premium Dropdown for Letter Type (Flat Structure, Conditional based on paraType)
 */
const PremiumLetterTypeSelect = ({ value, onChange, isLayoutEditable, IDBadge, paraType }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getOptions = () => {
    const isSfiBranch = isSFI(paraType);
    const isNonSfiBranch = isNonSFI(paraType);
    const isAdministration = isAdminBranch(paraType) || (!isSfiBranch && !isNonSfiBranch);

    const opts = [
      { id: 'broadsheet', label: 'বিএসআর', value: 'বিএসআর', icon: FileText, color: 'emerald' },
    ];

    if (isNonSfiBranch || isAdministration) {
      opts.push(
        { id: 'bilateral', label: 'দ্বিপক্ষীয় সভা', value: 'দ্বিপক্ষীয় সভা', icon: User, color: 'blue' },
        { id: 'bilateral_work', label: 'কার্যপত্র (দ্বি-সভা)', value: 'কার্যপত্র (দ্বি-সভা)', icon: FileEdit, color: 'sky' }
      );
    }

    if (isSfiBranch || isAdministration) {
      opts.push(
        { id: 'trilateral', label: 'ত্রিপক্ষীয় সভা', value: 'ত্রিপক্ষীয় সভা', icon: Layout, color: 'indigo' },
        { id: 'trilateral_work', label: 'কার্যপত্র (ত্রি-সভা)', value: 'কার্যপত্র (ত্রি-সভা)', icon: ClipboardCheck, color: 'violet' }
      );
    }

    opts.push(
      { id: 'others', label: 'অন্যান্য', value: 'অন্যান্য', icon: BookOpen, color: 'slate' }
    );

    return opts;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = getOptions();

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <IDBadge id="corr-field-letter-type-custom" />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${inputCls} ${value && value.toString().trim() !== '' ? 'border-emerald-500' : 'border-red-500'} flex items-center justify-between cursor-pointer group hover:border-emerald-400 hover:ring-4 hover:ring-emerald-50 transition-all duration-300 ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-50 bg-white shadow-md' : 'shadow-sm'}`}
      >
        <div className="flex items-center gap-3">
          {value ? (
            <>
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Send size={16} />
              </div>
              <span className="text-slate-900 font-black">{value}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
                <Plus size={16} />
              </div>
              <span className="text-slate-400 font-bold">পত্রের ধরণ বাছুন...</span>
            </>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-emerald-600' : 'group-hover:text-emerald-500'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-[60%] min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-emerald-600">
          <div className="p-1.5 space-y-0.5">
            <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-emerald-500" /> ক্যাটাগরি নির্বাচন করুন
              </span>
            </div>
            {options.map((opt) => (
              <div 
                key={opt.id}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all group relative ${
                  value === opt.value
                    ? `bg-${opt.color}-50 text-${opt.color}-700 shadow-sm` 
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    value === opt.value
                      ? `bg-${opt.color}-600 text-white`
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <opt.icon size={14} />
                  </div>
                  <span className={`text-[12.5px] font-black transition-colors ${
                    value === opt.value
                      ? `text-${opt.color}-700`
                      : 'text-slate-700'
                  }`}>{opt.label}</span>
                </div>
                
                {value === opt.value && (
                  <div className={`w-5 h-5 bg-${opt.color}-600 text-white rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-300`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Premium Dropdown for Branch Type (Para Type)
 */
const PremiumParaTypeSelect = ({ value, onChange, IDBadge }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { id: 'admin', label: 'প্রশাসন', value: 'প্রশাসন', icon: User, color: 'emerald' },
    { id: 'sfi', label: 'এসএফআই', value: 'এসএফআই', icon: ShieldCheck, color: 'blue' },
    { id: 'nonsfi', label: 'নন এসএফআই', value: 'নন এসএফআই', icon: Layout, color: 'indigo' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <IDBadge id="corr-field-para-type-custom" />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${inputCls} flex items-center justify-between cursor-pointer group hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all duration-300 ${isOpen ? 'border-blue-500 ring-4 ring-blue-50 bg-white shadow-md' : 'border-emerald-500 shadow-sm'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-${selectedOpt.color}-100 text-${selectedOpt.color}-600 rounded-lg flex items-center justify-center shadow-sm`}>
            <selectedOpt.icon size={16} />
          </div>
          <span className="text-slate-900 font-black">{selectedOpt.label}</span>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-blue-500'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600">
          <div className="p-1.5 space-y-0.5">
            <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-blue-500" /> শাখা নির্বাচন করুন
              </span>
            </div>
            {options.map((opt) => (
              <div 
                key={opt.id}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all group relative ${
                  value === opt.value ? `bg-${opt.color}-50 text-${opt.color}-700 shadow-sm` : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    value === opt.value ? `bg-${opt.color}-600 text-white` : 'bg-slate-100 text-slate-400'
                  }`}>
                    <opt.icon size={14} />
                  </div>
                  <span className={`text-[12.5px] font-black transition-colors ${value === opt.value ? `text-${opt.color}-700` : 'text-slate-700'}`}>{opt.label}</span>
                </div>
                {value === opt.value && (
                  <div className={`w-5 h-5 bg-${opt.color}-600 text-white rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-300`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Premium Dropdown for Ministry Selection
 */
const PremiumMinistrySelect = ({ value, onChange, IDBadge }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define options based on MINISTRY_ENTITY_MAP keys
  const options = Object.keys(MINISTRY_ENTITY_MAP).map((m, idx) => ({
    id: `ministry-opt-${idx}`,
    label: m,
    value: m,
    icon: Building,
    color: 'sky'
  }));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <IDBadge id="corr-field-ministry-custom" />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${inputCls} flex items-center justify-between cursor-pointer group hover:border-sky-400 hover:ring-4 hover:ring-sky-50 transition-all duration-300 ${isOpen ? 'border-sky-500 ring-4 ring-sky-50 bg-white shadow-md' : (value ? 'border-emerald-500 shadow-sm' : 'border-red-500 shadow-sm')}`}
      >
        <div className="flex items-center gap-3">
          {selectedOpt ? (
            <>
              <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building size={16} />
              </div>
              <span className="text-slate-900 font-black">{selectedOpt.label}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
                <Building size={16} />
              </div>
              <span className="text-slate-400 font-bold">মন্ত্রণালয় বাছুন...</span>
            </>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-sky-600' : 'group-hover:text-sky-500'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-sky-600">
          <div className="p-1.5 space-y-0.5">
            <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-sky-500" /> মন্ত্রণালয় নির্বাচন করুন
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto no-scrollbar">
              {options.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all group relative ${
                    value === opt.value ? `bg-sky-50 text-sky-700 shadow-sm` : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      value === opt.value ? `bg-sky-600 text-white` : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Building size={14} />
                    </div>
                    <span className={`text-[12.5px] font-black transition-colors ${value === opt.value ? `text-sky-700` : 'text-slate-700'}`}>{opt.label}</span>
                  </div>
                  {value === opt.value && (
                    <div className="w-5 h-5 bg-sky-600 text-white rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-300">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Segmented Date Input Component (Mirrored from Settlement Module Logic)
 * Handles auto-padding, max limits, smart year expansion, and auto-focus jump.
 */
const SegmentedInput = ({ 
  id, icon: Icon, num, label, color, dayValue, monthValue, yearValue, 
  daySetter, monthSetter, yearSetter, dayRef, monthRef, yearRef, 
  isLayoutEditable, originalValue, onDateSelect, error 
}: any) => {
  
  const handleSegmentChange = (val: string, type: 'day'|'month'|'year', setter: (v: string) => void, nextRef?: React.RefObject<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(val).replace(/[^0-9]/g, '');
    const numVal = parseInt(cleaned);

    if (type === 'day') {
      if (cleaned.length <= 2) {
        if (cleaned.length > 0 && numVal > 31) return;
        setter(toBengaliDigits(cleaned));
        if (cleaned.length === 2 || (cleaned.length === 1 && numVal > 3)) nextRef?.current?.focus();
      }
    } else if (type === 'month') {
      if (cleaned.length <= 2) {
        if (cleaned.length > 0 && numVal > 12) return;
        setter(toBengaliDigits(cleaned));
        if (cleaned.length === 2 || (cleaned.length === 1 && numVal > 1)) nextRef?.current?.focus();
      }
    } else if (type === 'year') {
      if (cleaned.length <= 4) setter(toBengaliDigits(cleaned));
    }
  };

  const handleSegmentBlur = (val: string, type: 'day'|'month'|'year', setter: (v: string) => void) => {
    const eng = toEnglishDigits(val);
    if (!eng) return;
    if (type === 'year') {
      if (eng.length === 1) setter(toBengaliDigits('200' + eng));
      else if (eng.length === 2) setter(toBengaliDigits('20' + eng));
    } else {
      if (eng.length === 1) setter(toBengaliDigits('0' + eng));
    }
  };

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  const isFilled = dayValue && monthValue && yearValue;

  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-lg relative min-w-0 ${error ? 'bg-red-50 border-red-200' : `bg-${color}-50/70 border-${color}-100 hover:border-${color}-300`}`}>
      <IDBadge id={id} />
      <label className="block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-2 truncate">
        {/* Adjusted Serial and Icon Position as per request */}
        <span className={numBadge}>{num}</span> <Icon size={14} className={`${error ? 'text-red-600' : `text-${color}-600`} shrink-0`} /> <span className="truncate">{label}</span>
      </label>
      <div className={`relative w-full h-[55px] flex items-center border-2 rounded-2xl bg-white transition-all duration-300 shadow-sm ${error ? 'border-red-400 ring-4 ring-red-50' : (isFilled ? 'border-emerald-500 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50' : 'border-red-500 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-50')}`}>
        <div className="flex items-center w-full px-4 h-full gap-2">
          <div className="relative flex-1 h-full flex items-center justify-center gap-1 shrink-0">
            <input 
              ref={dayRef} type="text" className="w-7 bg-transparent border-none outline-none font-black text-slate-800 text-[14px] p-0 text-center placeholder-slate-300"
              value={dayValue} onChange={e => handleSegmentChange(e.target.value, 'day', daySetter, monthRef)}
              onBlur={(e) => handleSegmentBlur(e.target.value, 'day', daySetter)} placeholder="..."
            />
            <span className="text-slate-300 font-black text-[14px]">/</span>
            <input 
              ref={monthRef} type="text" className="w-7 bg-transparent border-none outline-none font-black text-slate-800 text-[14px] p-0 text-center placeholder-slate-300"
              value={monthValue} onChange={e => handleSegmentChange(e.target.value, 'month', monthSetter, yearRef)}
              onBlur={(e) => handleSegmentBlur(e.target.value, 'month', monthSetter)} placeholder="..."
            />
            <span className="text-slate-300 font-black text-[14px]">/</span>
            <input 
              ref={yearRef} type="text" className="w-12 bg-transparent border-none outline-none font-black text-slate-800 text-[14px] p-0 text-center placeholder-slate-300"
              value={yearValue} onChange={e => handleSegmentChange(e.target.value, 'year', yearSetter)}
              onBlur={(e) => handleSegmentBlur(e.target.value, 'year', yearSetter)} placeholder="...."
            />
          </div>
          <div className="flex items-center ml-auto relative group shrink-0">
            <Calendar 
              size={16} className="text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors" 
              onClick={() => hiddenInputRef.current?.showPicker()}
            />
            <input 
              ref={hiddenInputRef} type="date" className="absolute inset-0 opacity-0 w-6 h-6 cursor-pointer pointer-events-auto"
              value={originalValue || ''} onChange={e => onDateSelect(e.target.value)}
            />
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-2 text-[10px] font-black text-red-600 animate-in slide-in-from-top-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
};

interface CorrespondenceEntryModuleProps {
  onAdd: (data: any) => void;
  onViewRegister: () => void;
  onBackToMenu: () => void;
  isLayoutEditable?: boolean;
  initialEntry?: any;
  isAdmin?: boolean;
  userEmail?: string | null;
  existingEntries?: any[];
  navigateToEntry?: (id: string, type: 'settlement' | 'correspondence', searchNo?: string) => void;
}

const CorrespondenceEntryModule: React.FC<CorrespondenceEntryModuleProps> = ({ 
  onAdd, 
  onViewRegister, 
  onBackToMenu, 
  isLayoutEditable, 
  initialEntry, 
  isAdmin = false,
  userEmail,
  existingEntries = [],
  navigateToEntry
}) => {
  // Admin check for receiver management
  const adminEmails = ['websitetogather@gmail.com'];
  const isReceiverAdmin = isAdmin || (userEmail && adminEmails.includes(userEmail));

  const [isSuccess, setIsSuccess] = useState(false);
  const [successProgress, setSuccessProgress] = useState(0);
  const [isDataSavedFully, setIsDataSavedFully] = useState(false);
  const [calculatedCycle, setCalculatedCycle] = useState<string>('');
  
  const [formData, setFormData] = useState({
    description: '',
    ministryName: '',
    paraType: 'এসএফআই',
    letterType: 'বিএসআর',
    letterNo: '',
    letterDate: '',
    totalParas: '',
    totalAmount: '',
    diaryNo: '',
    diaryDate: '',
    receiptDate: '',
    digitalFileNo: '',
    presentationDate: '',
    presentedToName: '',
    sentParaCount: '',
    receiverName: '',
    receivedDate: '',
    isOnline: 'না',
    archiveNo: '',
    remarks: ''
  });

  // Date segments state for each date field
  const [ld, setLd] = useState(''), [lm, setLm] = useState(''), [ly, setLy] = useState('');
  const [dd, setDd] = useState(''), [dm, setDm] = useState(''), [dy, setDy] = useState('');
  const [rd, setRd] = useState(''), [rm, setRm] = useState(''), [ry, setRy] = useState('');
  const [rcd, setRcd] = useState(''), [rcm, setRcm] = useState(''), [rcy, setRcy] = useState('');

  // Refs for auto-focus jump logic
  const ldRef = useRef<HTMLInputElement>(null), lmRef = useRef<HTMLInputElement>(null), lyRef = useRef<HTMLInputElement>(null);
  const ddRef = useRef<HTMLInputElement>(null), dmRef = useRef<HTMLInputElement>(null), dyRef = useRef<HTMLInputElement>(null);
  const rdRef = useRef<HTMLInputElement>(null), rmRef = useRef<HTMLInputElement>(null), ryRef = useRef<HTMLInputElement>(null);
  const rcdRef = useRef<HTMLInputElement>(null), rcmRef = useRef<HTMLInputElement>(null), rcyRef = useRef<HTMLInputElement>(null);

  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [receiverSuggestions, setReceiverSuggestions] = useState<any[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);
  const [showAuditYearWarning, setShowAuditYearWarning] = useState(false);
  const [hasWarnedAuditYear, setHasWarnedAuditYear] = useState(false);
  
  // New states for recipient management
  const [isManagingReceivers, setIsManagingReceivers] = useState(false);
  const [editingReceiverIdx, setEditingReceiverIdx] = useState<number | null>(null);
  const [tempReceiverName, setTempReceiverName] = useState('');
  const [tempReceiverDesignation, setTempReceiverDesignation] = useState('');
  const [tempReceiverImage, setTempReceiverImage] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const receiverRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // Simulated progress simulation when isSuccess is true
  useEffect(() => {
    if (isSuccess) {
      setSuccessProgress(0);
      setIsDataSavedFully(false);
      const interval = setInterval(() => {
        setSuccessProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDataSavedFully(true);
            return 100;
          }
          // smooth realistic increment
          const next = prev + Math.floor(Math.random() * 15) + 12;
          return next > 100 ? 100 : next;
        });
      }, 55);
      return () => clearInterval(interval);
    }
  }, [isSuccess]);

  // Automated reversion from success screen back to entry form when any field gets modified (user re-fills form)
  useEffect(() => {
    if (isSuccess) {
      const isModified = 
        formData.description !== '' ||
        formData.letterNo !== '' ||
        formData.letterDate !== '' ||
        formData.totalParas !== '' ||
        formData.totalAmount !== '' ||
        formData.diaryNo !== '' ||
        formData.diaryDate !== '' ||
        formData.receiptDate !== '' ||
        formData.digitalFileNo !== '' ||
        formData.presentationDate !== '' ||
        formData.presentedToName !== '' ||
        formData.sentParaCount !== '' ||
        formData.receiverName !== '' ||
        formData.receivedDate !== '' ||
        formData.archiveNo !== '' ||
        formData.remarks !== '' ||
        ld !== '' || lm !== '' || ly !== '' ||
        dd !== '' || dm !== '' || dy !== '' ||
        rd !== '' || rm !== '' || ry !== '' ||
        rcd !== '' || rcm !== '' || rcy !== '';

      if (isModified) {
        setIsSuccess(false);
      }
    }
  }, [formData, ld, lm, ly, dd, dm, dy, rd, rm, ry, rcd, rcm, rcy, isSuccess]);

  useEffect(() => {
    const loadReceivers = async () => {
      const normalizeName = (name: string | null | undefined) => {
        if (!name) return '';
        return name
          .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '') // Remove all possible invisible characters and non-breaking spaces
          .trim()
          .replace(/\s+/g, ' ')                  // Normalize internal whitespace to a single space
          .replace(/[:ঃ।\.\-]/g, '')             // Remove punctuation for comparison
          .normalize('NFC');                     // Normalize Unicode to canonical form
      };

      const getCleanBranch = (type: string | null | undefined): string => {
        if (!type) return 'এসএফআই';
        if (type.includes('প্রশাসন') || type === 'ADMIN' || type === 'admin') return 'প্রশাসন';
        if (type.includes('নন') || type.toUpperCase().includes('NON')) return 'নন এসএফআই';
        return 'এসএফআই';
      };

      try {
        let finalReceivers: any[] = [];
        const uniqueVariations = getBranchVariations(formData.paraType);
        let supabaseError = null;

        // 1. Fetch from receivers table (Current Branch)
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('receivers')
            .select('*')
            .in('para_type', uniqueVariations)
            .order('name', { ascending: true });

          if (error) {
            console.error('Supabase load error:', error);
            supabaseError = error;
          } else {
            finalReceivers = data || [];
          }
        }

        // 2. Fetch ALL receivers to build a Global Master List of names and collect all profiles
        const allSystemProfiles: any[] = [];
        const globalSavedNames = new Map<string, any>();
        if (isSupabaseConfigured) {
          const { data: allData, error: allError } = await supabase
            .from('receivers')
            .select('*');
          if (!allError && allData) {
            allData.forEach(r => {
              allSystemProfiles.push(r);
              const norm = normalizeName(r.name);
              if (norm) globalSavedNames.set(norm, { ...r, source: 'database' });
            });
          }
        }

        // Always populate allSystemProfiles from local storage to have a complete master registry
        ['ledger_correspondence_receivers_admin', 'ledger_correspondence_receivers_nonsfi', 'ledger_correspondence_receivers_sfi'].forEach(key => {
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const branch = key.includes('admin') ? 'প্রশাসন' : key.includes('nonsfi') ? 'নন এসএফআই' : 'এসএফআই';
              parsed.forEach((p: any) => {
                const profile = typeof p === 'string' ? { name: p, designation: 'অডিটর' } : p;
                const norm = normalizeName(profile.name);
                const exists = allSystemProfiles.some(sp => normalizeName(sp.name) === norm && getCleanBranch(sp.para_type) === getCleanBranch(profile.para_type || branch));
                if (!exists) {
                  allSystemProfiles.push({
                    ...profile,
                    para_type: profile.para_type || branch
                  });
                }
              });
            } catch (e) {
              console.error('Error parsing local receivers for master list:', e);
            }
          }
        });

        // If Supabase failed or is not configured, try LocalStorage
        if (!isSupabaseConfigured || supabaseError || finalReceivers.length === 0) {
          const key = isAdminBranch(formData.paraType) ? 'ledger_correspondence_receivers_admin' :
                      isNonSFI(formData.paraType) ? 'ledger_correspondence_receivers_nonsfi' :
                      'ledger_correspondence_receivers_sfi';
          const savedNames = localStorage.getItem(key);
          if (savedNames) {
            try {
              const parsed = JSON.parse(savedNames);
              const localReceivers = (parsed.length > 0 && typeof parsed[0] === 'string')
                ? parsed.map((name: string) => ({ name, designation: 'অডিটর' }))
                : parsed;
              
              // Merge with what we might have got from Supabase
              const existingNames = new Set(finalReceivers.map(r => r.name));
              localReceivers.forEach((lr: any) => {
                if (!existingNames.has(lr.name)) {
                  finalReceivers.push(lr);
                }
              });
            } catch (e) { console.error('Error parsing local receivers:', e); }
          }
        }

        // 2. Fetch unique names from correspondence entries to ensure they are suggested
        let correspondenceNames: string[] = [];
        const CORR_STORAGE_KEY = 'ledger_correspondence_v1';
        
        if (isSupabaseConfigured) {
          // Query settlement_entries for receiverName in content with server-side filtering
          const { data: entries, error: entriesError } = await supabase
            .from('settlement_entries')
            .select('content')
            .not('content->>receiverName', 'is', null)
            .filter('content->>paraType', 'in', `(${uniqueVariations.map(v => `"${v}"`).join(',')})`);
          
          if (!entriesError && entries) {
            entries.forEach(row => {
              let content = row.content;
              if (typeof content === 'string') {
                try { content = JSON.parse(content); } catch (e) { return; }
              }
              if (!content) return;
              
              // Robust check for correspondence: either has type 'correspondence' or has a description (which only letters have)
              const isCorr = content.type === 'correspondence' || 
                            (content.description !== undefined && content.description !== null && content.description !== '');
              
              if (isCorr && content.receiverName) {
                const trimmedName = content.receiverName.trim();
                if (trimmedName) correspondenceNames.push(trimmedName);
              }
            });
          }
        } else {
          const savedCorr = localStorage.getItem(CORR_STORAGE_KEY);
          if (savedCorr) {
            try {
              const entries = JSON.parse(savedCorr);
              entries.forEach((entry: any) => {
                const entryPara = entry.paraType?.replace('-', ' ');
                const currentPara = formData.paraType.replace('-', ' ');
                if (entryPara === currentPara && entry.receiverName) {
                  correspondenceNames.push(entry.receiverName);
                }
              });
            } catch (e) { console.error(e); }
          }
        }

        // 4. Merge unique names from correspondence into finalReceivers if they don't exist
        const existingNormalizedNames = new Set(finalReceivers.map(r => normalizeName(r.name)));
        
        correspondenceNames.forEach(name => {
          const originalName = name.trim();
          const normalizedName = normalizeName(originalName);
          if (normalizedName && !existingNormalizedNames.has(normalizedName)) {
            const globalMatch = globalSavedNames.get(normalizedName);
            if (globalMatch) {
              finalReceivers.push({ ...globalMatch, source: 'database' });
            } else {
              finalReceivers.push({ name: originalName, designation: 'অডিটর', source: 'correspondence' });
            }
            existingNormalizedNames.add(normalizedName);
          }
        });

        // 4. Sort final list and filter out inactive receivers unless they are the currently selected one
        const INACTIVE_STORAGE_KEY = 'ledger_inactive_receivers_v1';
        const getInactiveList = (): string[] => {
          try {
            const saved = localStorage.getItem(INACTIVE_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
          } catch {
            return [];
          }
        };

        const getTransfersMap = (): Record<string, string> => {
          try {
            const saved = localStorage.getItem('ledger_transfers_map_v1');
            return saved ? JSON.parse(saved) : {};
          } catch {
            return {};
          }
        };

        const inactiveListRaw = getInactiveList();
        const inactiveKeysSet = new Set(inactiveListRaw.map(item => normalizeName(item)));
        const transfersMap = getTransfersMap();
        const currentReceiverNormalized = normalizeName(formData.receiverName || initialEntry?.receiverName);
        const currentFormBranchClean = getCleanBranch(formData.paraType);

        const filteredReceivers = finalReceivers.map(r => {
          const norm = normalizeName(r.name);
          const currentCompKey = `${norm}_${currentFormBranchClean}`;
          
          // Check explicit deactivation and transfer status
          const isLInactive = inactiveKeysSet.has(currentCompKey);
          const hasTransfer = (r.transferred_to && r.transferred_to.trim() !== '') || 
                              (transfersMap[currentCompKey] && transfersMap[currentCompKey].trim() !== '');

          let is_active = true;

          // Check for Shamima/Shamira hardcoded transfers
          const normNoSpaces = norm.replace(/\s+/g, '');
          const isShamimaTransfer = normNoSpaces === 'শামীমাশাহরিন' || normNoSpaces === 'শামীরাশাহরিন';

          if (isShamimaTransfer) {
            if (currentFormBranchClean === 'নন এসএফআই') {
              is_active = false;
            } else if (currentFormBranchClean === 'এসএফআই') {
              is_active = true;
            }
          } else if (r.is_active === false || isLInactive || hasTransfer) {
            is_active = false;
          } else {
            // Find any profiles for this person in the master system profiles list
            const matches = allSystemProfiles.filter(p => normalizeName(p.name) === norm);
            const branchMatch = matches.find(p => getCleanBranch(p.para_type) === currentFormBranchClean);

            if (branchMatch) {
              const isBranchLInactive = inactiveKeysSet.has(currentCompKey);
              const branchHasTransfer = (branchMatch.transferred_to && branchMatch.transferred_to.trim() !== '') ||
                                        (transfersMap[currentCompKey] && transfersMap[currentCompKey].trim() !== '');
              if (branchMatch.is_active === false || isBranchLInactive || branchHasTransfer) {
                is_active = false;
              } else {
                is_active = true;
              }
            } else if (matches.length > 0) {
              // If they have profiles in other branches, check if they are active in ANY of those other branches
              const activeInOtherBranch = matches.some(p => {
                const pBranchClean = getCleanBranch(p.para_type);
                const pCompKey = `${norm}_${pBranchClean}`;
                const isPInactive = inactiveKeysSet.has(pCompKey);
                const pHasTransfer = (p.transferred_to && p.transferred_to.trim() !== '') ||
                                     (transfersMap[pCompKey] && transfersMap[pCompKey].trim() !== '');
                return p.is_active !== false && !isPInactive && !pHasTransfer;
              });
              if (activeInOtherBranch) {
                // Since they are active in another branch and not configured for this branch, they are not active in this branch
                is_active = false;
              } else {
                // Not active anywhere else, let's check local deactivation/transfer list
                is_active = !isLInactive && !hasTransfer;
              }
            } else {
              // No profiles at all, check local deactivation/transfer lists
              is_active = !isLInactive && !hasTransfer;
            }
          }

          return { ...r, is_active };
        }).filter(r => {
          if (r.is_active !== false) return true;
          if (currentReceiverNormalized && normalizeName(r.name) === currentReceiverNormalized) {
            return true;
          }
          return false;
        });

        filteredReceivers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setReceiverSuggestions(filteredReceivers);

      } catch (err) {
        console.error('Error loading receivers:', err);
        const initialList = isAdminBranch(formData.paraType) ? [] :
                            isSFI(formData.paraType) ? SFI_RECEIVERS : NONSFI_RECEIVERS;
        const mappedList = initialList.map(name => ({ name, designation: 'অডিটর' }));
        
        const allSystemProfiles: any[] = [];
        ['ledger_correspondence_receivers_admin', 'ledger_correspondence_receivers_nonsfi', 'ledger_correspondence_receivers_sfi'].forEach(key => {
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const branch = key.includes('admin') ? 'প্রশাসন' : key.includes('nonsfi') ? 'নন এসএফআই' : 'এসএফআই';
              parsed.forEach((p: any) => {
                const profile = typeof p === 'string' ? { name: p, designation: 'অডিটর' } : p;
                const norm = normalizeName(profile.name);
                const exists = allSystemProfiles.some(sp => normalizeName(sp.name) === norm && getCleanBranch(sp.para_type) === getCleanBranch(profile.para_type || branch));
                if (!exists) {
                  allSystemProfiles.push({
                    ...profile,
                    para_type: profile.para_type || branch
                  });
                }
              });
            } catch (e) {
              console.error('Error parsing local receivers for master list in catch:', e);
            }
          }
        });

        const INACTIVE_STORAGE_KEY = 'ledger_inactive_receivers_v1';
        const getInactiveList = (): string[] => {
          try {
            const saved = localStorage.getItem(INACTIVE_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
          } catch {
            return [];
          }
        };

        const getTransfersMap = (): Record<string, string> => {
          try {
            const saved = localStorage.getItem('ledger_transfers_map_v1');
            return saved ? JSON.parse(saved) : {};
          } catch {
            return {};
          }
        };

        const inactiveListRaw = getInactiveList();
        const inactiveKeysSet = new Set(inactiveListRaw.map(item => normalizeName(item)));
        const transfersMap = getTransfersMap();
        const currentReceiverNormalized = normalizeName(formData.receiverName || initialEntry?.receiverName);
        const currentFormBranchClean = getCleanBranch(formData.paraType);

        const filtered = (mappedList as any[]).map(r => {
          const norm = normalizeName(r.name);
          const currentCompKey = `${norm}_${currentFormBranchClean}`;
          
          // Check explicit deactivation and transfer status
          const isLInactive = inactiveKeysSet.has(currentCompKey);
          const hasTransfer = (r.transferred_to && r.transferred_to.trim() !== '') || 
                              (transfersMap[currentCompKey] && transfersMap[currentCompKey].trim() !== '');

          let is_active = true;

          // Check for Shamima/Shamira hardcoded transfers
          const normNoSpaces = norm.replace(/\s+/g, '');
          const isShamimaTransfer = normNoSpaces === 'শামীমাশাহরিন' || normNoSpaces === 'শামীরাশাহরিন';

          if (isShamimaTransfer) {
            if (currentFormBranchClean === 'নন এসএফআই') {
              is_active = false;
            } else if (currentFormBranchClean === 'এসএফআই') {
              is_active = true;
            }
          } else if (r.is_active === false || isLInactive || hasTransfer) {
            is_active = false;
          } else {
            // Find any profiles for this person in the master system profiles list
            const matches = allSystemProfiles.filter(p => normalizeName(p.name) === norm);
            const branchMatch = matches.find(p => getCleanBranch(p.para_type) === currentFormBranchClean);

            if (branchMatch) {
              const isBranchLInactive = inactiveKeysSet.has(currentCompKey);
              const branchHasTransfer = (branchMatch.transferred_to && branchMatch.transferred_to.trim() !== '') ||
                                        (transfersMap[currentCompKey] && transfersMap[currentCompKey].trim() !== '');
              if (branchMatch.is_active === false || isBranchLInactive || branchHasTransfer) {
                is_active = false;
              } else {
                is_active = true;
              }
            } else if (matches.length > 0) {
              // If they have profiles in other branches, check if they are active in ANY of those other branches
              const activeInOtherBranch = matches.some(p => {
                const pBranchClean = getCleanBranch(p.para_type);
                const pCompKey = `${norm}_${pBranchClean}`;
                const isPInactive = inactiveKeysSet.has(pCompKey);
                const pHasTransfer = (p.transferred_to && p.transferred_to.trim() !== '') ||
                                     (transfersMap[pCompKey] && transfersMap[pCompKey].trim() !== '');
                return p.is_active !== false && !isPInactive && !pHasTransfer;
              });
              if (activeInOtherBranch) {
                // Since they are active in another branch and not configured for this branch, they are not active in this branch
                is_active = false;
              } else {
                // Not active anywhere else, let's check local deactivation/transfer list
                is_active = !isLInactive && !hasTransfer;
              }
            } else {
              // No profiles at all, check local deactivation/transfer lists
              is_active = !isLInactive && !hasTransfer;
            }
          }

          return { ...r, is_active };
        }).filter(r => {
          if (r.is_active !== false) return true;
          if (currentReceiverNormalized && normalizeName(r.name) === currentReceiverNormalized) {
            return true;
          }
          return false;
        });

        setReceiverSuggestions(filtered);
      }
    };

    loadReceivers();

    const handleStorageChange = () => {
      loadReceivers();
    };

    window.addEventListener('storage', handleStorageChange);

    const savedDescriptions = localStorage.getItem('ledger_correspondence_descriptions');
    if (savedDescriptions) setDescriptionSuggestions(JSON.parse(savedDescriptions));

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [formData.paraType, formData.receiverName, initialEntry]);

  const formatDateSegments = (d: string, m: string, y: string) => {
    if (!d || !m || !y || y.length < 4) return '';
    return `${toEnglishDigits(y)}-${toEnglishDigits(m).padStart(2, '0')}-${toEnglishDigits(d).padStart(2, '0')}`;
  };

  const setSegmentsFromDate = (date: string, sd: any, sm: any, sy: any) => {
    if (!date) return;
    const parts = date.split('-');
    if (parts.length === 3) {
      sd(toBengaliDigits(parts[2]));
      sm(toBengaliDigits(parts[1]));
      sy(toBengaliDigits(parts[0]));
    }
  };

  const handleDeleteDescription = (e: React.MouseEvent, descToDelete: string) => {
    e.stopPropagation();
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${descToDelete}" বিবরণটি তালিকা থেকে মুছে ফেলতে চান?`)) return;
    
    const updated = descriptionSuggestions.filter(d => d !== descToDelete);
    setDescriptionSuggestions(updated);
    localStorage.setItem('ledger_correspondence_descriptions', JSON.stringify(updated));
  };

  /**
   * Duplicate Check Logic
   */
  const duplicates = useMemo(() => {
    const normalizedDiary = toEnglishDigits(formData.diaryNo.replace(/\s+/g, ''));
    const normalizedLetter = toEnglishDigits(formData.letterNo.replace(/\s+/g, ''));
    
    const diaryDuplicate = normalizedDiary ? existingEntries.find(entry => {
      if (initialEntry && entry.id === initialEntry.id) return false;
      const entryDiary = toEnglishDigits((entry.diaryNo || '').replace(/\s+/g, ''));
      return entryDiary === normalizedDiary;
    }) : null;

    const letterDuplicate = normalizedLetter ? existingEntries.find(entry => {
      if (initialEntry && entry.id === initialEntry.id) return false;
      const entryLetter = toEnglishDigits((entry.letterNo || '').replace(/\s+/g, ''));
      return entryLetter === normalizedLetter;
    }) : null;

    return {
      diaryNo: !!diaryDuplicate,
      letterNo: !!letterDuplicate,
      diaryEntryId: diaryDuplicate?.id,
      letterEntryId: letterDuplicate?.id,
      any: !!diaryDuplicate || !!letterDuplicate
    };
  }, [formData.diaryNo, formData.letterNo, existingEntries, initialEntry]);

  const isDuplicate = duplicates.any;

  useEffect(() => {
    if (initialEntry) {
      setFormData({
        description: initialEntry.description || '',
        ministryName: initialEntry.ministryName || '',
        paraType: initialEntry.paraType || 'এসএফআই',
        letterType: initialEntry.letterType || 'বিএসআর',
        letterNo: initialEntry.letterNo || '',
        letterDate: initialEntry.letterDate || '',
        totalParas: initialEntry.totalParas || '',
        totalAmount: initialEntry.totalAmount || '',
        diaryNo: initialEntry.diaryNo || '',
        diaryDate: initialEntry.diaryDate || '',
        receiptDate: initialEntry.receiptDate || '',
        digitalFileNo: initialEntry.digitalFileNo || '',
        presentationDate: initialEntry.presentationDate || '',
        presentedToName: initialEntry.presentedToName || '',
        sentParaCount: initialEntry.sentParaCount || '',
        receiverName: initialEntry.receiverName || '',
        receivedDate: initialEntry.receivedDate || '',
        isOnline: initialEntry.isOnline || 'না',
        archiveNo: initialEntry.archiveNo || '',
        remarks: initialEntry.remarks || ''
      });
      
      setSegmentsFromDate(initialEntry.letterDate, setLd, setLm, setLy);
      setSegmentsFromDate(initialEntry.diaryDate, setDd, setDm, setDy);
      setSegmentsFromDate(initialEntry.receiptDate, setRd, setRm, setRy);
      setSegmentsFromDate(initialEntry.receivedDate, setRcd, setRcm, setRcy);

      setRawInputs({
        totalParas: toBengaliDigits(initialEntry.totalParas),
        totalAmount: toBengaliDigits(initialEntry.totalAmount),
        sentParaCount: toBengaliDigits(initialEntry.sentParaCount)
      });
      setHasWarnedAuditYear(false);
    }
  }, [initialEntry]);

  // Sync individual segment states to the main formData object
  useEffect(() => { setFormData(prev => ({ ...prev, letterDate: formatDateSegments(ld, lm, ly) })); }, [ld, lm, ly]);
  useEffect(() => { 
    const date = formatDateSegments(dd, dm, dy);
    setFormData(prev => ({ ...prev, diaryDate: date }));
    if (date) {
      try {
        const cycle = getCycleForDate(new Date(date));
        setCalculatedCycle(toBengaliDigits(cycle.label));
      } catch (e) { setCalculatedCycle(''); }
    } else { setCalculatedCycle(''); }
  }, [dd, dm, dy]);
  useEffect(() => { setFormData(prev => ({ ...prev, receiptDate: formatDateSegments(rd, rm, ry) })); }, [rd, rm, ry]);
  useEffect(() => { setFormData(prev => ({ ...prev, receivedDate: formatDateSegments(rcd, rcm, rcy) })); }, [rcd, rcm, rcy]);

  useEffect(() => {
    if (formData.archiveNo) {
      const prefix = isSFI(formData.paraType) ? 'ka- ' : 'kg- ';
      const rawValue = formData.archiveNo.replace(/^ka-\s*/, '').replace(/^kg-\s*/, '');
      setFormData(prev => ({ ...prev, archiveNo: prefix + rawValue }));
    }
  }, [formData.paraType]);

  // Automatically adjust letterType if branch (paraType) changes and it's no longer valid
  useEffect(() => {
    if (isSFI(formData.paraType)) {
      if (formData.letterType === 'দ্বিপক্ষীয় সভা' || formData.letterType === 'কার্যপত্র (দ্বি-সভা)') {
        setFormData(prev => ({ ...prev, letterType: 'বিএসআর' }));
      }
    } else if (isNonSFI(formData.paraType)) {
      if (formData.letterType === 'ত্রিপক্ষীয় সভা' || formData.letterType === 'কার্যপত্র (ত্রি-সভা)') {
        setFormData(prev => ({ ...prev, letterType: 'বিএসআর' }));
      }
    }
  }, [formData.paraType, formData.letterType]);

  const handleManualDateSelect = (iso: string, type: string) => {
    if (!iso) return;
    if (type === 'letter') setSegmentsFromDate(iso, setLd, setLm, setLy);
    else if (type === 'diary') setSegmentsFromDate(iso, setDd, setDm, setDy);
    else if (type === 'receipt') setSegmentsFromDate(iso, setRd, setRm, setRy);
    else if (type === 'received') setSegmentsFromDate(iso, setRcd, setRcm, setRcy);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (receiverRef.current && !receiverRef.current.contains(event.target as Node)) {
        setShowReceiverDropdown(false);
      }
      if (descriptionRef.current && !descriptionRef.current.contains(event.target as Node)) {
        setShowDescriptionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNumericInput = (field: string, val: string) => {
    const bDigits = toBengaliDigits(val);
    setRawInputs(prev => ({ ...prev, [field]: bDigits }));
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleArchiveNoChange = (val: string) => {
    const prefix = formData.paraType === 'এসএফআই' ? 'ka- ' : 'kg- ';
    let rawValue = val.replace(/^ka-\s*/, '').replace(/^kg-\s*/, '');
    
    if (val === '') {
      setFormData(prev => ({ ...prev, archiveNo: '' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      archiveNo: prefix + toBengaliDigits(rawValue)
    }));
  };

  const handleAddReceiver = async () => {
    if (!isReceiverAdmin) return;
    if (tempReceiverName.trim()) {
      const profileData = {
        name: tempReceiverName.trim(),
        designation: tempReceiverDesignation.trim() || null,
        image: tempReceiverImage || null,
        para_type: formData.paraType
      };

      try {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('receivers').insert([profileData]);
          if (error) throw error;
        } else {
          const key = isAdminBranch(formData.paraType) ? 'ledger_correspondence_receivers_admin' :
                      isNonSFI(formData.paraType) ? 'ledger_correspondence_receivers_nonsfi' :
                      'ledger_correspondence_receivers_sfi';
          const updated = [...receiverSuggestions, profileData];
          setReceiverSuggestions(updated);
          localStorage.setItem(key, JSON.stringify(updated));
        }
        resetReceiverForm();
        setIsManagingReceivers(false);
        // Trigger reload
        const event = new Event('storage');
        window.dispatchEvent(event);
      } catch (err) {
        console.error('Error adding receiver:', err);
        alert('তথ্য যোগ করতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleEditReceiver = async (idx: number) => {
    if (!isReceiverAdmin) return;
    if (tempReceiverName.trim()) {
      const profileData = {
        name: tempReceiverName.trim(),
        designation: tempReceiverDesignation.trim() || null,
        image: tempReceiverImage || null,
        para_type: formData.paraType
      };

      try {
        if (isSupabaseConfigured && receiverSuggestions[idx]?.id) {
          const { error } = await supabase
            .from('receivers')
            .update(profileData)
            .eq('id', receiverSuggestions[idx].id);
          if (error) throw error;
        } else {
          const key = isAdminBranch(formData.paraType) ? 'ledger_correspondence_receivers_admin' :
                      isNonSFI(formData.paraType) ? 'ledger_correspondence_receivers_nonsfi' :
                      'ledger_correspondence_receivers_sfi';
          const updated = [...receiverSuggestions];
          updated[idx] = profileData;
          setReceiverSuggestions(updated);
          localStorage.setItem(key, JSON.stringify(updated));
        }
        setEditingReceiverIdx(null);
        resetReceiverForm();
        setIsManagingReceivers(false);
        // Trigger reload
        const event = new Event('storage');
        window.dispatchEvent(event);
      } catch (err) {
        console.error('Error editing receiver:', err);
        alert('তথ্য পরিবর্তন করতে সমস্যা হয়েছে।');
      }
    }
  };

  const resetReceiverForm = () => {
    setTempReceiverName('');
    setTempReceiverDesignation('');
    setTempReceiverImage(null);
  };

  const handleReceiverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("ছবির সাইজ ১ মেগাবাইটের কম হতে হবে।");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempReceiverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteReceiver = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isReceiverAdmin) return;
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই নামটি মুছে ফেলতে চান?")) return;

    try {
      const profileToDelete = receiverSuggestions[idx];
      if (isSupabaseConfigured && profileToDelete?.id) {
        const { error } = await supabase
          .from('receivers')
          .delete()
          .eq('id', profileToDelete.id);
        if (error) throw error;
      } else {
        const key = isAdminBranch(formData.paraType) ? 'ledger_correspondence_receivers_admin' :
                    isNonSFI(formData.paraType) ? 'ledger_correspondence_receivers_nonsfi' :
                    'ledger_correspondence_receivers_sfi';
        const updated = receiverSuggestions.filter((_, i) => i !== idx);
        setReceiverSuggestions(updated);
        localStorage.setItem(key, JSON.stringify(updated));
      }

      if (formData.receiverName === profileToDelete.name) {
        setFormData(prev => ({ ...prev, receiverName: '' }));
      }
      
      // Trigger reload
      const event = new Event('storage');
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error deleting receiver:', err);
      alert('তথ্য মুছতে সমস্যা হয়েছে।');
    }
  };

  const checkAuditYear = (value: string) => {
    const desc = value.trim();
    if (!desc) {
      setShowAuditYearWarning(false);
      setHasWarnedAuditYear(false);
      return;
    }
    
    // Regex to check for 4 consecutive digits (English or Bengali)
    const yearRegex = /[0-9]{4}|[০-৯]{4}/;
    if (yearRegex.test(desc)) {
      setShowAuditYearWarning(false);
      setHasWarnedAuditYear(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      ministryName: '',
      paraType: 'এসএফআই',
      letterType: 'বিএসআর',
      letterNo: '',
      letterDate: '',
      totalParas: '',
      totalAmount: '',
      diaryNo: '',
      diaryDate: '',
      receiptDate: '',
      digitalFileNo: '',
      presentationDate: '',
      presentedToName: '',
      sentParaCount: '',
      receiverName: '',
      receivedDate: '',
      isOnline: 'না',
      archiveNo: '',
      remarks: ''
    });
    setLd(''); setLm(''); setLy('');
    setDd(''); setDm(''); setDy('');
    setRd(''); setRm(''); setRy('');
    setRcd(''); setRcm(''); setRcy('');
    setRawInputs({});
    setCalculatedCycle('');
    setHasWarnedAuditYear(false);
  };

  const handleFormFocusCapture = (e: React.FocusEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    
    // Skip checking if user is focusing within Field 1 (description container) itself
    if (descriptionRef.current && descriptionRef.current.contains(target)) {
      return;
    }

    // Only apply if they are focusing on an form input/select/button/segmented item
    const isInteractive = target.tagName === 'INPUT' || 
                          target.tagName === 'SELECT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.tagName === 'BUTTON' ||
                          target.getAttribute('role') === 'button';
                          
    if (!isInteractive) return;

    const desc = (formData.description || '').trim();
    if (desc) {
      const yearRegex = /[0-9]{4}|[০-৯]{4}/;
      if (!yearRegex.test(desc)) {
        if (hasWarnedAuditYear) {
          // Hide the warning banner so it doesn't float on the screen forever
          setShowAuditYearWarning(false);
          return;
        }

        // Blur to close keyboard on mobile devices
        (target as any).blur?.();
        
        setShowAuditYearWarning(true);
        alert("আপনি নিরীক্ষা সাল উল্লেখ করেন নি");
        setHasWarnedAuditYear(true);
        
        setTimeout(() => {
          descriptionInputRef.current?.focus();
          descriptionInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      } else {
        setShowAuditYearWarning(false);
        setHasWarnedAuditYear(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if form is empty
    const isEmpty = !formData.description && 
                    !formData.letterNo && 
                    !formData.diaryNo && 
                    !formData.digitalFileNo && 
                    !formData.archiveNo && 
                    !ld && !lm && !ly && 
                    !dd && !dm && !dy && 
                    !rd && !rm && !ry && 
                    !rcd && !rcm && !rcy;

    if (isEmpty) {
      const container = document.getElementById('form-container-correspondence');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (!formData.ministryName) {
      alert("দয়া করে মন্ত্রণালয় নির্বাচন করুন");
      return;
    }

    // Audit Year and Ministry mismatch validations
    const desc = (formData.description || '').trim();
    if (desc) {
      // 1. Ministry mismatch validation (Check this first as requested by the user)
      const descLower = desc.toLowerCase();
      const hasBank = descLower.includes('ব্যাংক') || descLower.includes('bank');
      const hasMillsOrJute = descLower.includes('মিল') || descLower.includes('মিলস') || descLower.includes('জুট') || descLower.includes('mill') || descLower.includes('mills') || descLower.includes('jute');

      if (hasBank && formData.ministryName !== "আর্থিক প্রতিষ্ঠান বিভাগ") {
        if (!window.confirm("আপনি কি সঠিক মন্ত্রণালয় সিলেক্ট করেছেন?")) {
          return;
        }
      } else if (hasMillsOrJute && formData.ministryName !== "পাট মন্ত্রণালয়") {
        if (!window.confirm("আপনি কি সঠিক মন্ত্রণালয় সিলেক্ট করেছেন?")) {
          return;
        }
      }

      // 2. Audit Year validation
      const yearRegex = /[0-9]{4}|[০-৯]{4}/;
      if (!yearRegex.test(desc)) {
        if (!hasWarnedAuditYear) {
          setShowAuditYearWarning(true);
          alert("আপনি নিরীক্ষা সাল উল্লেখ করেন নি");
          descriptionInputRef.current?.focus();
          descriptionInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHasWarnedAuditYear(true);
          return;
        }
      }
    }
    
    // Defer heavy work to next tick to avoid blocking UI (INP fix)
    setTimeout(() => {
      if (isReceiverAdmin && formData.receiverName.trim()) {
        const key = isAdminBranch(formData.paraType) ? 'ledger_correspondence_receivers_admin' :
                    isNonSFI(formData.paraType) ? 'ledger_correspondence_receivers_nonsfi' :
                    'ledger_correspondence_receivers_sfi';
        const updatedNames = Array.from(new Set([formData.receiverName.trim(), ...receiverSuggestions]));
        setReceiverSuggestions(updatedNames);
        localStorage.setItem(key, JSON.stringify(updatedNames));
      }
      
      if (formData.description.trim()) {
        const updatedDesc = Array.from(new Set([formData.description.trim(), ...descriptionSuggestions]));
        setDescriptionSuggestions(updatedDesc);
        localStorage.setItem('ledger_correspondence_descriptions', JSON.stringify(updatedDesc));
      }

      onAdd(formData);
      setIsSuccess(true);
      resetForm();
      setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }, 0);
  };

  // Chronological Validations
  const diaryDateError = getDateError(formData.diaryDate, formData.letterDate, 'ডায়েরি তারিখ', 'পত্রের তারিখ');
  const receiptDateError = getDateError(formData.receiptDate, formData.diaryDate, 'শাখায় প্রাপ্তির তারিখ', 'ডায়েরি তারিখ');
  const receivedDateError = getDateError(formData.receivedDate, formData.receiptDate, 'গ্রহণের তারিখ', 'শাখায় প্রাপ্তির তারিখ');

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <span onClick={handleCopy} title="Click to copy ID" className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  return (
    <div id="form-container-correspondence" className="bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-landing-premium max-w-[1880px] mx-auto overflow-x-hidden relative">
      <IDBadge id="view-correspondence-form" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-100 gap-4 relative">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={onBackToMenu}
            className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200 shrink-0">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 leading-tight">
               {initialEntry ? 'প্রাপ্ত চিঠিপত্র এডিট' : 'প্রাপ্ত চিঠিপত্র ডাটা এন্ট্রি'}
            </h3>
            <p className="text-slate-500 font-bold text-sm">নতুন চিঠিপত্র এবং ডায়েরি এন্ট্রির জন্য এই ফরমটি ব্যবহার করুন</p>
          </div>
        </div>
      </div>

      {/* Duplicate Warning Message */}
      {isDuplicate && !isSuccess && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-amber-100">
           <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-200 animate-pulse">
              <AlertCircle size={32} />
           </div>
           <div className="space-y-1">
              <h4 className="text-xl font-black text-amber-900 tracking-tight">সতর্কবার্তা: তথ্যটি ইতোমধ্যেই বিদ্যমান</h4>
              <p className="text-sm font-bold text-amber-700/80">
                {duplicates.diaryNo && (
                  <span>ডায়েরি নং: <span className="underline underline-offset-4 font-black">{toBengaliDigits(formData.diaryNo)}</span> </span>
                )}
                {duplicates.diaryNo && duplicates.letterNo && <span>এবং </span>}
                {duplicates.letterNo && (
                  <span>পত্র নং: <span className="underline underline-offset-4 font-black">{toBengaliDigits(formData.letterNo)}</span> </span>
                )}
                ইতোমধ্যেই ডাটাবেজে বিদ্যমান। অনুগ্রহ করে তথ্য যাচাই করুন।
                {(duplicates.diaryEntryId || duplicates.letterEntryId) && navigateToEntry && (
                  <button
                    type="button"
                    onClick={() => navigateToEntry(duplicates.diaryEntryId || duplicates.letterEntryId || '', 'correspondence', formData.diaryNo || formData.letterNo)}
                    className="ml-3 px-3 py-1 bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 transition-colors font-black text-xs flex inline-flex items-center gap-1.5 shadow-sm border border-amber-300"
                  >
                    <Search size={12} /> দেখুন
                  </button>
                )}
              </p>
           </div>
        </div>
      )}

      <form onSubmit={handleSubmit} onFocusCapture={handleFormFocusCapture} className="space-y-8">
        <fieldset className="space-y-8 border-none p-0 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Field 1 - Full Width Description with Suggestions */}
            <div className={`${colWrapper} border-emerald-100 lg:col-span-4`} ref={descriptionRef}>
              <IDBadge id="corr-field-1" />
              <label className={labelCls}><span className={numBadge}>১</span> <FileText size={14} className="text-emerald-600" /> পত্রের বিবরণ নিরীক্ষা সালসহ:</label>
              <div className="relative group">
                <input 
                  ref={descriptionInputRef}
                  type="text" 
                  required 
                  className={`${inputCls} ${formData.description ? 'border-emerald-500 !pr-12' : 'border-red-500'}`} 
                  value={formData.description} 
                  onFocus={() => {
                    setShowDescriptionDropdown(true);
                  }}
                  onBlur={() => {
                    checkAuditYear(formData.description);
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({...formData, description: val});
                    checkAuditYear(val);
                  }}
                  placeholder="বিবরণ লিখুন"
                  autoComplete="off"
                />

                {showAuditYearWarning && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[13px] font-black text-red-600 animate-pulse">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>আপনি পত্রটির নিরীক্ষা সাল উল্লেখ করেননি</span>
                  </div>
                )}

                {showDescriptionDropdown && descriptionSuggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-emerald-600">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> পূর্ববর্তী বিবরণসমূহ</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                      {descriptionSuggestions
                        .filter(desc => desc.toLowerCase().includes(formData.description.toLowerCase()))
                        .map((desc, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setFormData({...formData, description: desc});
                            setShowDescriptionDropdown(false);
                          }}
                          className={`px-5 py-3.5 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${formData.description === desc ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-emerald-50 text-slate-700 font-bold'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] leading-relaxed flex-1">{desc}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {formData.description === desc && <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
                              <button 
                                type="button"
                                onClick={(e) => handleDeleteDescription(e, desc)}
                                className={`p-1.5 rounded-lg transition-all ${formData.description === desc ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-red-50 hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100'}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- Section: পিত্রের অন্যান্য তথ্য --- */}
            <div className={sectionHeaderCls}>
               <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
               <h4 className={sectionTitleCls}>পত্রের অন্যান্য তথ্য</h4>
            </div>

            {/* Field Ministry */}
            <div className={`${colWrapper} border-sky-100`}>
              <label className={labelCls}>
                <span className={numBadge}>ম</span> 
                <Building size={14} className="text-sky-600" /> 
                মন্ত্রণালয়:
              </label>
              <PremiumMinistrySelect 
                value={formData.ministryName}
                onChange={(val: string) => {
                  const desc = (formData.description || '').trim();
                  const descLower = desc.toLowerCase();
                  const hasBank = descLower.includes('ব্যাংক') || descLower.includes('bank');
                  const hasMillsOrJute = descLower.includes('মিল') || descLower.includes('মিলস') || descLower.includes('জুট') || descLower.includes('mill') || descLower.includes('mills') || descLower.includes('jute');

                  if (hasBank && val !== "আর্থিক প্রতিষ্ঠান বিভাগ") {
                    if (!window.confirm("আপনি কি সঠিক মন্ত্রণালয় সিলেক্ট করেছেন?")) {
                      return;
                    }
                  } else if (hasMillsOrJute && val !== "পাট মন্ত্রণালয়") {
                    if (!window.confirm("আপনি কি সঠিক মন্ত্রণালয় সিলেক্ট করেছেন?")) {
                      return;
                    }
                  }
                  setFormData({...formData, ministryName: val});
                }}
                IDBadge={IDBadge}
              />
            </div>

            {/* Field 2 */}
            <div className={`${colWrapper} border-blue-100`}>
              <label className={labelCls}><span className={numBadge}>২</span> <ShieldCheck size={14} className="text-blue-600" /> শাখার ধরণ:</label>
              <PremiumParaTypeSelect 
                value={formData.paraType}
                onChange={(val: string) => setFormData({...formData, paraType: val})}
                IDBadge={IDBadge}
              />
            </div>

            {/* Field 3 */}
            <div className={`${colWrapper} border-indigo-100`}>
              <label className={labelCls}><span className={numBadge}>৩</span> <FileText size={14} className="text-indigo-600" /> পত্রের ধরণ:</label>
              <PremiumLetterTypeSelect 
                value={formData.letterType}
                onChange={(val: string) => setFormData({...formData, letterType: val})}
                isLayoutEditable={isLayoutEditable}
                IDBadge={IDBadge}
                paraType={formData.paraType}
              />
            </div>

            {/* Field 4.ক */}
            <div className={`${colWrapper} ${duplicates.letterNo ? 'bg-amber-50 border-amber-200' : 'border-amber-100'}`}>
              <IDBadge id="corr-field-4a" />
              <label className={labelCls}><span className={numBadge}>৪.ক</span> <Hash size={14} className="text-amber-600" /> পত্র নং:</label>
              <input 
                type="text" className={`${inputCls} ${duplicates.letterNo ? 'border-amber-500 ring-4 ring-amber-50' : (formData.letterNo ? 'border-emerald-500' : 'border-red-500')}`} 
                value={formData.letterNo} onChange={e => setFormData({...formData, letterNo: toBengaliDigits(e.target.value)})} 
                placeholder="নং লিখুন"
              />
              {duplicates.letterNo && (
                <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1">
                  <div className="text-[10px] font-black text-amber-600 flex items-center gap-1">
                    <AlertCircle size={10} /> এই পত্র নম্বরটি ইতিপূর্বে এন্ট্রি করা হয়েছে
                  </div>
                  {duplicates.letterEntryId && navigateToEntry && (
                    <button
                      type="button"
                      onClick={() => navigateToEntry(duplicates.letterEntryId || '', 'correspondence', formData.letterNo)}
                      className="px-2 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded shadow-sm hover:bg-amber-700 transition-all flex items-center gap-1"
                    >
                      <Search size={10} /> দেখুন
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Field 4.খ - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-4b" icon={Calendar} num="৪.খ" label="পত্রের তারিখ" color="amber" 
              dayValue={ld} monthValue={lm} yearValue={ly} 
              daySetter={setLd} monthSetter={setLm} yearSetter={setLy} 
              dayRef={ldRef} monthRef={lmRef} yearRef={lyRef} 
              isLayoutEditable={isLayoutEditable} originalValue={formData.letterDate} 
              onDateSelect={(iso: string) => handleManualDateSelect(iso, 'letter')} 
            />

            {/* Field 5 */}
            <div className={`${colWrapper} border-purple-100`}>
              <IDBadge id="corr-field-paras-count" />
              <label className={labelCls}><span className={numBadge}>৫</span> <ListOrdered size={14} className="text-purple-600" /> প্রেরিত অনু: সংখ্যা:</label>
              <input 
                type="text" className={`${inputCls} ${rawInputs.totalParas ? 'border-emerald-500' : 'border-red-500'}`} 
                value={rawInputs.totalParas || ''} onChange={e => handleNumericInput('totalParas', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Field 6 */}
            <div className={`${colWrapper} border-rose-100`}>
              <IDBadge id="corr-field-amount" />
              <label className={labelCls}><span className={numBadge}>৬</span> <Banknote size={14} className="text-rose-600" /> মোট জড়িত টাকা:</label>
              <input 
                type="text" className={`${inputCls} ${rawInputs.totalAmount ? 'border-emerald-500' : 'border-red-500'}`} 
                value={rawInputs.totalAmount || ''} onChange={e => handleNumericInput('totalAmount', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* --- Section: অত্র অফিসের তথ্য --- */}
            <div className={sectionHeaderCls}>
               <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
               <h4 className={sectionTitleCls}>অত্র অফিসের তথ্য</h4>
            </div>

            {/* Field 7.ক */}
            <div className={`${colWrapper} ${duplicates.diaryNo ? 'bg-amber-50 border-amber-200' : 'border-emerald-100'}`}>
              <IDBadge id="corr-field-7a" />
              <label className={labelCls}><span className={numBadge}>৭.ক</span> <BookOpen size={14} className="text-emerald-600" /> ডায়েরি নং:</label>
              <input 
                type="text" className={`${inputCls} ${duplicates.diaryNo ? 'border-amber-500 ring-4 ring-amber-50' : (formData.diaryNo ? 'border-emerald-500' : 'border-red-500')}`} 
                value={formData.diaryNo} onChange={e => setFormData({...formData, diaryNo: toBengaliDigits(e.target.value)})} 
                placeholder="নং লিখুন"
              />
              {duplicates.diaryNo && (
                <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1">
                  <div className="text-[10px] font-black text-amber-600 flex items-center gap-1">
                    <AlertCircle size={10} /> এই ডায়েরি নম্বরটি ইতিপূর্বে এন্ট্রি করা হয়েছে
                  </div>
                  {duplicates.diaryEntryId && navigateToEntry && (
                    <button
                      type="button"
                      onClick={() => navigateToEntry(duplicates.diaryEntryId || '', 'correspondence', formData.diaryNo)}
                      className="px-2 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded shadow-sm hover:bg-amber-700 transition-all flex items-center gap-1"
                    >
                      <Search size={10} /> দেখুন
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Field 7.খ - Smart Segmented Date */}
            <div className="space-y-2">
              <SegmentedInput 
                id="corr-field-7b" icon={Calendar} num="৭.খ" label="ডায়েরি তারিখ" color="emerald" 
                dayValue={dd} monthValue={dm} yearValue={dy} 
                daySetter={setDd} monthSetter={setDm} yearSetter={setDy} 
                dayRef={ddRef} monthRef={dmRef} yearRef={dyRef} 
                isLayoutEditable={isLayoutEditable} originalValue={formData.diaryDate} 
                onDateSelect={(iso: string) => handleManualDateSelect(iso, 'diary')}
                error={diaryDateError}
              />
              {calculatedCycle && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 w-fit animate-in slide-in-from-top-1 duration-300 ml-2">
                  <CalendarRange size={12} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">সাইকেল: {calculatedCycle}</span>
                </div>
              )}
            </div>

            {/* Field 8 - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-8" icon={Inbox} num="৮" label="শাখায় প্রাপ্তির তারিখ" color="sky" 
              dayValue={rd} monthValue={rm} yearValue={ry} 
              daySetter={setRd} monthSetter={setRm} yearSetter={setRy} 
              dayRef={rdRef} monthRef={rmRef} yearRef={ryRef} 
              isLayoutEditable={isLayoutEditable} originalValue={formData.receiptDate} 
              onDateSelect={(iso: string) => handleManualDateSelect(iso, 'receipt')} 
              error={receiptDateError}
            />

            {/* Field 9 */}
            <div className={`${colWrapper} border-indigo-100`}>
              <IDBadge id="corr-field-9" />
              <label className={labelCls}><span className={numBadge}>৯</span> <Computer size={14} className="text-indigo-600" /> ডিজিটাল নথি নং-:</label>
              <input 
                type="text" className={`${inputCls} ${formData.digitalFileNo ? 'border-emerald-500' : 'border-red-500'}`} 
                value={formData.digitalFileNo} onChange={e => setFormData({...formData, digitalFileNo: toBengaliDigits(e.target.value)})}
                placeholder="নথি নং লিখুন"
              />
            </div>

            {/* Field 10 */}
            <div className={`${colWrapper} border-slate-200`} ref={receiverRef}>
              <IDBadge id="corr-field-10" />
              <label className={labelCls}><span className={numBadge}>১০</span> <User size={14} className="text-slate-600" /> গ্রহীতার নাম:</label>
              <div className="relative group flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    readOnly
                    className={`${inputCls} ${formData.receiverName ? 'border-emerald-500' : 'border-red-500'} cursor-pointer !text-[11px] placeholder:!text-[10px] !pl-3 !pr-9`} 
                    value={formData.receiverName} 
                    onClick={() => setShowReceiverDropdown(!showReceiverDropdown)}
                    placeholder="গ্রহীতার নাম"
                    autoComplete="off"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowReceiverDropdown(!showReceiverDropdown)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <ChevronDown size={18} className={`transition-transform duration-300 ${showReceiverDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {showReceiverDropdown && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> গ্রহীতার তালিকা</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto no-scrollbar py-2">
                      {receiverSuggestions.length === 0 ? (
                        <div className="px-5 py-4 text-center text-slate-400 font-bold text-sm">
                          কোন নাম পাওয়া যায়নি। প্লাস (+) বাটনে ক্লিক করে যোগ করুন।
                        </div>
                      ) : (
                        receiverSuggestions.map((profile, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setFormData({...formData, receiverName: profile.name});
                              setShowReceiverDropdown(false);
                            }}
                            className={`px-5 py-3 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${formData.receiverName === profile.name ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-slate-700 font-bold'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden group-hover:border-blue-200 transition-colors">
                                {profile.image ? (
                                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={14} className="text-slate-300" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px]">{profile.name}</span>
                                {profile.designation && (
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${formData.receiverName === profile.name ? 'text-blue-100' : 'text-slate-400'}`}>{profile.designation}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {formData.receiverName === profile.name && <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient Management Modal */}
              {isManagingReceivers && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-8">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                            {editingReceiverIdx !== null ? <FileEdit size={24} /> : <Plus size={24} />}
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-900">{editingReceiverIdx !== null ? 'নাম পরিবর্তন করুন' : 'নতুন গ্রহীতা যোগ করুন'}</h4>
                            <p className="text-sm font-bold text-slate-500">গ্রহীতার নাম নির্ভুলভাবে লিখুন</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsManagingReceivers(false)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-center mb-4">
                          <div className="relative group">
                            <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-all">
                              {tempReceiverImage ? (
                                <img src={tempReceiverImage} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <User size={32} className="text-slate-300" />
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleReceiverImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg pointer-events-none">
                              <Plus size={16} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">গ্রহীতার নাম</label>
                          <input 
                            type="text"
                            autoFocus
                            className={inputCls}
                            value={tempReceiverName}
                            onChange={(e) => setTempReceiverName(e.target.value)}
                            placeholder="এখানে নাম লিখুন..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">পদবি</label>
                          <input 
                            type="text"
                            className={inputCls}
                            value={tempReceiverDesignation}
                            onChange={(e) => setTempReceiverDesignation(e.target.value)}
                            placeholder="পদবি লিখুন..."
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => {
                              setIsManagingReceivers(false);
                              resetReceiverForm();
                            }}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                          >বাতিল</button>
                          <button 
                            onClick={editingReceiverIdx !== null ? () => handleEditReceiver(editingReceiverIdx) : handleAddReceiver}
                            disabled={!tempReceiverName.trim()}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editingReceiverIdx !== null ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 11 - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-11" icon={Calendar} num="১১" label="গ্রহণের তারিখ" color="blue" 
              dayValue={rcd} monthValue={rcm} yearValue={rcy} 
              daySetter={setRcd} monthSetter={setRcm} yearSetter={setRcy} 
              dayRef={rcdRef} monthRef={rcmRef} yearRef={rcyRef} 
              isLayoutEditable={isLayoutEditable} originalValue={formData.receivedDate} 
              onDateSelect={(iso: string) => handleManualDateSelect(iso, 'received')}
              error={receivedDateError}
            />

            {/* Field 12 */}
            <div className={`${colWrapper} border-emerald-100`}>
              <IDBadge id="corr-field-12" />
              <label className={labelCls}><span className={numBadge}>১২</span> <Computer size={14} className="text-emerald-600" /> অনলাইনে প্রাপ্তি:</label>
              <div className="flex gap-4 h-[52px] items-center px-2">
                <button 
                  type="button" onClick={() => setFormData({...formData, isOnline: 'হ্যাঁ'})}
                  className={`flex-1 h-full rounded-xl font-black text-sm transition-all border-2 ${formData.isOnline === 'হ্যাঁ' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >হ্যাঁ</button>
                <button 
                  type="button" onClick={() => setFormData({...formData, isOnline: 'না'})}
                  className={`flex-1 h-full rounded-xl font-black text-sm transition-all border-2 ${formData.isOnline === 'না' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >না</button>
              </div>
            </div>

            {/* Field 13 - আর্কাইভ নং */}
            <div className={`${colWrapper} border-amber-100`}>
              <IDBadge id="corr-field-archive-no" />
              <label className={labelCls}><span className={numBadge}>১৩</span> <Hash size={14} className="text-amber-600" /> আর্কাইভ নং:</label>
              <input 
                type="text" 
                className={`${inputCls} ${formData.archiveNo ? 'border-emerald-500' : 'border-red-500'}`} 
                value={formData.archiveNo} 
                onChange={e => handleArchiveNoChange(e.target.value)}
                placeholder="নং লিখুন"
              />
            </div>

            {/* Field 14 - Remarks */}
            <div className={`${colWrapper} border-slate-200 col-span-full`}>
              <IDBadge id="corr-field-14" />
              <label className={labelCls}><span className={numBadge}>১৪</span> <FileText size={14} className="text-slate-600" /> মন্তব্য:</label>
              <textarea 
                className={`${inputCls} ${formData.remarks ? 'border-emerald-500' : 'border-red-500'} h-24 py-3 resize-none`}
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
                placeholder="কোন মন্তব্য থাকলে এখানে লিখুন (ঐচ্ছিক)"
              />
            </div>

          </div>
        </fieldset>

        {/* Action Buttons & Success Message */}
        <div className="pt-10 border-t border-slate-100 relative" ref={bottomRef}>
          {isSuccess ? (
            <div className="w-full py-10 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-100/40">
               <div className="relative">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(5,150,105,0.3)] animate-in spin-in-12 duration-700 border-4 border-white">
                     <CheckCircle2 size={56} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-emerald-100">
                     <Sparkles size={22} className="text-amber-500" />
                  </div>
               </div>
               <div className="text-center space-y-3 px-6">
                  <h4 className="text-4xl font-black text-emerald-950 tracking-tight">
                    {initialEntry ? 'তথ্য সফলভাবে আপডেট হয়েছে' : (isAdmin ? 'চিঠিপত্র তথ্য সফলভাবে সংরক্ষিত হয়েছে' : 'চিঠি এন্ট্রি হয়েছে')}
                  </h4>
                  <p className="text-[16px] font-bold text-emerald-700 uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck size={20} /> {isAdmin ? 'আপনার ডাটাবেজে এন্ট্রিটি যুক্ত করা হয়েছে' : 'সফলভাবে এন্ট্রি হয়েছে, এডমিন অনুমোদনের পর রেজিস্টারে দেখা যাবে'}
                  </p>
               </div>
               
               <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl font-black text-lg shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95 group cursor-pointer"
                  >
                    নতুন চিঠি এন্ট্রি দিন <Plus size={20} />
                  </button>
                  <button 
                    onClick={onViewRegister}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 group cursor-pointer"
                  >
                    চিঠিপত্র প্রাপ্তি রেজিস্টার দেখুন <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>

               <div className="flex flex-col items-center gap-3.5 mt-3">
                  <div className="h-2 w-72 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-150 ease-out"
                        style={{ width: `${successProgress}%` }}
                     ></div>
                  </div>
                  <div className="relative h-8 flex items-center justify-center">
                    {!isDataSavedFully ? (
                      <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest animate-pulse flex items-center gap-2">
                        সংরক্ষণ করা হচ্ছে... <span className="text-emerald-600 font-mono">{toBengaliDigits(successProgress)}%</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full font-black text-[13px] shadow-sm animate-in zoom-in-95 duration-350">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs animate-in spin-in-95 duration-500">
                          <Check size={12} strokeWidth={4} />
                        </span>
                        <span>কমপ্লিট</span>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-5 max-w-2xl mx-auto w-full pt-4">
               <button 
                  type="button" 
                  onClick={onBackToMenu}
                  className="flex-1 py-4.5 px-6 rounded-2xl font-black text-lg border-2 border-slate-200 hover:border-rose-300 bg-slate-50 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 group cursor-pointer shadow-xs hover:shadow-rose-100"
               >
                  <X size={20} className="text-slate-400 group-hover:text-rose-500 transition-transform group-hover:rotate-90 duration-300" />
                  <span>বাতিল করুন</span>
               </button>
               <button 
                  type="submit"
                  disabled={!!diaryDateError || !!receiptDateError || !!receivedDateError}
                  className={`flex-[1.8] py-4.5 px-8 rounded-2xl font-black text-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3.5 group relative overflow-hidden cursor-pointer shadow-md ${diaryDateError || receiptDateError || receivedDateError ? 'bg-slate-200 text-slate-400 border-2 border-slate-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.01]'}`}
               >
                  {(!diaryDateError && !receiptDateError && !receivedDateError) && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>}
                  <CheckCircle2 size={22} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>{initialEntry ? 'তথ্য আপডেট করুন' : 'তথ্য সংরক্ষণ করুন'}</span>
               </button>
            </div>
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

export default CorrespondenceEntryModule;