import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mail, X, FileText, Calendar, Hash, Banknote, BookOpen, 
  Inbox, Computer, User, CheckCircle2, Layout, Sparkles, 
  ListOrdered, ArrowRightCircle, ShieldCheck, AlertCircle, Trash, Search, ChevronDown, Check, Plus, CalendarRange, ArrowRight, Send, FileEdit
} from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { getCycleForDate } from '../utils/cycleHelper';
import { getDateError } from '../utils/dateValidation';

/**
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 * 
 * CorrespondenceEntryModule - প্রাপ্ত চিঠিপত্র এন্ট্রি মডিউল
 * AI MUST NOT change existing styles, colors, or core logic without permission.
 */

/**
 * Segmented Date Input Component (Mirrored from Settlement Module Logic)
 * Handles auto-padding, max limits, smart year expansion, and auto-focus jump.
 */
const SegmentedInput = ({ 
  id, icon: Icon, label, color, dayValue, monthValue, yearValue, 
  daySetter, monthSetter, yearSetter, dayRef, monthRef, yearRef, 
  isLayoutEditable, originalValue, onDateSelect, error 
}: any) => {
  
  const handleSegmentChange = (val: string, type: 'day'|'month'|'year', setter: (v: string) => void, nextRef?: React.RefObject<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(val).replace(/[^0-9]/g, '');
    const num = parseInt(cleaned);

    if (type === 'day') {
      if (cleaned.length <= 2) {
        if (cleaned.length > 0 && num > 31) return;
        setter(toBengaliDigits(cleaned));
        if (cleaned.length === 2 || (cleaned.length === 1 && num > 3)) nextRef?.current?.focus();
      }
    } else if (type === 'month') {
      if (cleaned.length <= 2) {
        if (cleaned.length > 0 && num > 12) return;
        setter(toBengaliDigits(cleaned));
        if (cleaned.length === 2 || (cleaned.length === 1 && num > 1)) nextRef?.current?.focus();
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
      <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-lg relative min-w-0 ${error ? 'bg-red-50 border-red-200' : `bg-${color}-50/70 border-${color}-100 hover:border-${color}-300`}`}>
      <IDBadge id={id} />
      <label className="block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-1.5 truncate">
        <Icon size={14} className={`${error ? 'text-red-600' : `text-${color}-600`} shrink-0`} /> <span>{label}</span>
      </label>
      <div className={`relative w-full h-[55px] flex items-center border rounded-2xl bg-white transition-all duration-300 shadow-sm ${error ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-200 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50'}`}>
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
  existingEntries?: any[];
}

const CorrespondenceEntryModule: React.FC<CorrespondenceEntryModuleProps> = ({ 
  onAdd, 
  onViewRegister, 
  onBackToMenu, 
  isLayoutEditable, 
  initialEntry, 
  isAdmin = false,
  existingEntries = []
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [calculatedCycle, setCalculatedCycle] = useState<string>('');
  
  const [formData, setFormData] = useState({
    description: '',
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
    isOnline: 'না'
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
  const [receiverSuggestions, setReceiverSuggestions] = useState<string[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const receiverRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedNames = localStorage.getItem('ledger_correspondence_receivers');
    if (savedNames) setReceiverSuggestions(JSON.parse(savedNames));

    const savedDescriptions = localStorage.getItem('ledger_correspondence_descriptions');
    if (savedDescriptions) setDescriptionSuggestions(JSON.parse(savedDescriptions));
  }, []);

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

  /**
   * Duplicate Check Logic
   */
  const isDuplicate = useMemo(() => {
    if (!formData.diaryNo || !formData.letterNo) return false;
    
    // Normalize for robust comparison (convert Bengali to English digits)
    const normalizedDiary = toEnglishDigits(formData.diaryNo).trim();
    const normalizedLetter = toEnglishDigits(formData.letterNo).trim();
    
    return existingEntries.some(entry => {
      // If editing, skip the current entry itself
      if (initialEntry && entry.id === initialEntry.id) return false;
      
      const eDiary = toEnglishDigits(entry.diaryNo || '').trim();
      const eLetter = toEnglishDigits(entry.letterNo || '').trim();
      
      return eDiary === normalizedDiary && eLetter === normalizedLetter;
    });
  }, [formData.diaryNo, formData.letterNo, existingEntries, initialEntry]);

  useEffect(() => {
    if (initialEntry) {
      setFormData({
        description: initialEntry.description || '',
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
        isOnline: initialEntry.isOnline || 'না'
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

  const resetForm = () => {
    setFormData({
      description: '',
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
      isOnline: 'না'
    });
    setLd(''); setLm(''); setLy('');
    setDd(''); setDm(''); setDy('');
    setRd(''); setRm(''); setRy('');
    setRcd(''); setRcm(''); setRcy('');
    setRawInputs({});
    setCalculatedCycle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate) return;

    if (formData.receiverName.trim()) {
      const updatedNames = Array.from(new Set([formData.receiverName.trim(), ...receiverSuggestions]));
      setReceiverSuggestions(updatedNames);
      localStorage.setItem('ledger_correspondence_receivers', JSON.stringify(updatedNames));
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

  const colWrapper = "p-5 rounded-2xl border bg-white transition-all hover:shadow-lg relative min-w-0";
  const inputCls = "w-full h-[52px] px-4 border border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 shadow-sm transition-all text-[14px]";
  const labelCls = "block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-2";
  const numBadge = "inline-flex items-center justify-center w-5 h-5 bg-slate-900 text-white rounded-md text-[10px] font-black shadow-sm shrink-0";
  const sectionHeaderCls = "col-span-full mt-6 mb-2 py-2 border-b border-slate-100 flex items-center gap-3";
  const sectionTitleCls = "text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]";

  return (
    <div id="form-container-correspondence" className="bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-landing-premium max-w-7xl mx-auto overflow-x-hidden relative">
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
        <div className="mb-8 p-6 bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-red-100">
           <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-red-200 animate-pulse">
              <AlertCircle size={32} />
           </div>
           <div className="space-y-1">
              <h4 className="text-xl font-black text-red-900 tracking-tight">চিঠিচি ইতোমধ্যেই এন্ট্রি করা হয়েছে</h4>
              <p className="text-sm font-bold text-red-700/80">ডায়েরি নং: <span className="underline underline-offset-4">{toBengaliDigits(formData.diaryNo)}</span> এবং স্মারক নং: <span className="underline underline-offset-4">{toBengaliDigits(formData.letterNo)}</span> সম্বলিত একটি চিঠি আগে থেকেই ডাটাবেজে বিদ্যমান। অনুগ্রহ করে তথ্য যাচাই করুন।</p>
           </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isSuccess} className="space-y-8 border-none p-0 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Field 1 - Full Width Description with Suggestions */}
            <div className={`${colWrapper} border-emerald-100 lg:col-span-4`} ref={descriptionRef}>
              <IDBadge id="corr-field-1" />
              <label className={labelCls}><span className={numBadge}>১</span> <FileText size={14} className="text-emerald-600" /> পত্রের বিবরণ নিরীক্ষা সালসহ:</label>
              <div className="relative group">
                <input 
                  type="text" 
                  required 
                  className={inputCls} 
                  value={formData.description} 
                  onFocus={() => setShowDescriptionDropdown(true)}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="বিবরণ লিখুন বা সাজেশন্স থেকে বাছুন..."
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => setShowDescriptionDropdown(!showDescriptionDropdown)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <ChevronDown size={18} className={`transition-transform duration-300 ${showDescriptionDropdown ? 'rotate-180' : ''}`} />
                </button>

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
                          <span className="text-[13px] leading-relaxed">{desc}</span>
                          {formData.description === desc && <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
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

            {/* Field 2 */}
            <div className={`${colWrapper} border-blue-100`}>
              <IDBadge id="corr-field-2" />
              <label className={labelCls}><span className={numBadge}>২</span> <ShieldCheck size={14} className="text-blue-600" /> শাখার ধরণ:</label>
              <select 
                className={inputCls} value={formData.paraType}
                onChange={e => setFormData({...formData, paraType: e.target.value})}
              >
                <option value="এসএফআই">এসএফআই (SFI)</option>
                <option value="নন এসএফআই">নন এসএফআই (NON-SFI)</option>
              </select>
            </div>

            {/* Field 3 */}
            <div className={`${colWrapper} border-indigo-100`}>
              <IDBadge id="corr-field-letter-type" />
              <label className={labelCls}><span className={numBadge}>৩</span> <FileText size={14} className="text-indigo-600" /> পত্রের ধরণ:</label>
              <select 
                className={inputCls} value={formData.letterType}
                onChange={e => setFormData({...formData, letterType: e.target.value})}
              >
                <option value="বিএসআর">বিএসআর (BSR)</option>
                <option value="দ্বিপক্ষীয় সভা">দ্বিপক্ষীয় সভা</option>
                <option value="ত্রিপক্ষীয় সভা">ত্রিপক্ষীয় সভা</option>
                <option value="মিলিকরণ">মিলিকরণ</option>
                <option value="কার্যপত্র">কার্যপত্র</option>
              </select>
            </div>

            {/* Field 4.ক */}
            <div className={`${colWrapper} border-amber-100`}>
              <IDBadge id="corr-field-4a" />
              <label className={labelCls}><span className={numBadge}>৪.ক</span> <Hash size={14} className="text-amber-600" /> পত্র নং:</label>
              <input 
                type="text" className={inputCls} 
                value={formData.letterNo} onChange={e => setFormData({...formData, letterNo: toBengaliDigits(e.target.value)})} 
                placeholder="নং লিখুন"
              />
            </div>

            {/* Field 4.খ - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-4b" icon={Calendar} label="৪.খ পত্রের তারিখ" color="amber" 
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
                type="text" className={inputCls} 
                value={rawInputs.totalParas || ''} onChange={e => handleNumericInput('totalParas', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Field 6 */}
            <div className={`${colWrapper} border-rose-100`}>
              <IDBadge id="corr-field-amount" />
              <label className={labelCls}><span className={numBadge}>৬</span> <Banknote size={14} className="text-rose-600" /> মোট জড়িত টাকা:</label>
              <input 
                type="text" className={inputCls} 
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
            <div className={`${colWrapper} border-emerald-100`}>
              <IDBadge id="corr-field-7a" />
              <label className={labelCls}><span className={numBadge}>৭.ক</span> <BookOpen size={14} className="text-emerald-600" /> ডায়েরি নং:</label>
              <input 
                type="text" className={inputCls} 
                value={formData.diaryNo} onChange={e => setFormData({...formData, diaryNo: toBengaliDigits(e.target.value)})} 
                placeholder="নং লিখুন"
              />
            </div>

            {/* Field 7.খ - Smart Segmented Date */}
            <div className="space-y-2">
              <SegmentedInput 
                id="corr-field-7b" icon={Calendar} label="৭.খ ডায়েরি তারিখ" color="emerald" 
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
              id="corr-field-8" icon={Inbox} label="৮ শাখায় প্রাপ্তির তারিখ" color="sky" 
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
                type="text" className={inputCls} 
                value={formData.digitalFileNo} onChange={e => setFormData({...formData, digitalFileNo: toBengaliDigits(e.target.value)})}
                placeholder="নথি নং লিখুন"
              />
            </div>

            {/* Field 10 */}
            <div className={`${colWrapper} border-slate-200`} ref={receiverRef}>
              <IDBadge id="corr-field-10" />
              <label className={labelCls}><span className={numBadge}>১০</span> <User size={14} className="text-slate-600" /> গৃহীতার নাম:</label>
              <div className="relative group">
                <input 
                  type="text" 
                  className={inputCls} 
                  value={formData.receiverName} 
                  onFocus={() => setShowReceiverDropdown(true)}
                  onChange={e => setFormData({...formData, receiverName: e.target.value})}
                  placeholder="নাম লিখুন বা তালিকা থেকে বাছুন"
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => setShowReceiverDropdown(!showReceiverDropdown)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <ChevronDown size={18} className={`transition-transform duration-300 ${showReceiverDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showReceiverDropdown && receiverSuggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> পূর্ববর্তী নামসমূহ</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto no-scrollbar py-2">
                      {receiverSuggestions
                        .filter(name => name.toLowerCase().includes(formData.receiverName.toLowerCase()))
                        .map((name, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setFormData({...formData, receiverName: name});
                            setShowReceiverDropdown(false);
                          }}
                          className={`px-5 py-3 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${formData.receiverName === name ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-slate-700 font-bold'}`}
                        >
                          <span className="text-[13px]">{name}</span>
                          {formData.receiverName === name && <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Field 11 - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-11" icon={Calendar} label="১১ গ্রহণের তারিখ" color="blue" 
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

          </div>
        </fieldset>

        {/* Action Buttons & Success Message */}
        <div className="pt-10 border-t border-slate-100 relative" ref={bottomRef}>
          {isSuccess ? (
            <div className="w-full py-10 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-100/50">
               <div className="relative">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(5,150,105,0.3)] animate-in spin-in-12 duration-700 border-4 border-white">
                     <CheckCircle2 size={56} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-emerald-100">
                     <Sparkles size={22} className="text-amber-50" />
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
                    className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl font-black text-lg shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95 group"
                  >
                    নতুন চিঠি এন্ট্রি দিন <Plus size={20} />
                  </button>
                  <button 
                    onClick={onViewRegister}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 group"
                  >
                    চিঠিপত্র প্রাপ্তি রেজিস্টার দেখুন <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>

               <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="h-1.5 w-64 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div className="h-full bg-emerald-600 animate-progress-loading-premium"></div>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <span className="text-[14px] font-black text-emerald-600 uppercase tracking-widest animate-complete-text">কমপ্লিট</span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
               <button 
                  type="button" onClick={onBackToMenu}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-lg border border-slate-200 hover:bg-slate-200 transition-all active:scale-95"
               >বাতিল করুন</button>
               <button 
                  type="submit"
                  disabled={isDuplicate || !!diaryDateError || !!receiptDateError || !!receivedDateError}
                  className={`flex-[2] py-5 rounded-[2rem] font-black text-xl shadow-[0_20px_40px_rgba(5,150,105,0.3)] transition-all active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden ${isDuplicate || diaryDateError || receiptDateError || receivedDateError ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
               >
                 {(!isDuplicate && !diaryDateError && !receiptDateError && !receivedDateError) && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>}
                 <CheckCircle2 size={24} /> {initialEntry ? 'তথ্য আপডেট করুন' : 'তথ্য সংরক্ষণ করুন'}
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
          animation: progress-loading-premium 4s linear forwards;
        }
        @keyframes fade-in-complete {
          0%, 95% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-complete-text {
          animation: fade-in-complete 4.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default CorrespondenceEntryModule;
