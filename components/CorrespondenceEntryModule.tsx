import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mail, X, FileText, Calendar, Hash, Banknote, BookOpen, 
  Inbox, Computer, User, CheckCircle2, Layout, Sparkles, 
  ListOrdered, ArrowRightCircle, ShieldCheck, AlertCircle, Trash2, Search, ChevronDown, Check, Plus, CalendarRange, ArrowRight, Send, FileEdit, ClipboardCheck, Globe,
  Building, Building2
} from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { getCycleForDate } from '../utils/cycleHelper';
import { getDateError } from '../utils/dateValidation';
import { SFI_RECEIVERS } from '../utils/sfi';
import { NONSFI_RECEIVERS } from '../utils/nonsfi';
import { isSFI, isNonSFI, isAdminBranch, getBranchVariations } from '../utils/branchUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MINISTRY_ENTITY_MAP, AUDIT_YEARS_OPTIONS } from '../constants';

/**
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 * 
 * CorrespondenceEntryModule - প্রাপ্ত চিঠিপত্র এন্ট্রি মডিউল (২২টি ফিল্ড)
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

  const [customOptions, setCustomOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_letter_types');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');

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

    customOptions.forEach((cOpt, index) => {
      opts.push({
        id: `custom-letter-type-${index}`,
        label: cOpt,
        value: cOpt,
        icon: FileText,
        color: 'indigo'
      });
    });

    opts.push(
      { id: 'others', label: 'অন্যান্য', value: 'অন্যান্য', icon: BookOpen, color: 'slate' }
    );

    return opts;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewItemName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewLetterType = () => {
    const cleanName = newItemName.trim();
    if (!cleanName) return;
    const allOptions = getOptions();
    if (allOptions.some(opt => opt.value === cleanName)) {
      alert("এই প্রকারটি ইতিমধ্যে রয়েছে।");
      return;
    }
    const next = [...customOptions, cleanName];
    setCustomOptions(next);
    localStorage.setItem('custom_letter_types', JSON.stringify(next));
    onChange(cleanName);
    setIsAddingNew(false);
    setNewItemName('');
    setIsOpen(false);
  };

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
        <div className="absolute top-[calc(100%+6px)] left-0 w-[60%] min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-emerald-600 animate-out duration-200">
          {isAddingNew ? (
            <div className="p-3 space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-emerald-500" /> নতুন পত্রের ধরণ যুক্ত করুন
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                placeholder="ধরণ লিখুন..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => { setIsAddingNew(false); setNewItemName(''); }}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-200"
                >বাতিল</button>
                <button 
                  type="button"
                  onClick={handleAddNewLetterType}
                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700"
                >সংরক্ষণ</button>
              </div>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={11} className="text-emerald-500" /> ক্যাটাগরি নির্বাচন করুন
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
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
              <div 
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-2.5 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all hover:bg-emerald-50 text-emerald-600 font-black border-t border-dashed border-slate-100 mt-1 shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Plus size={14} />
                  </div>
                  <span className="text-[12.5px] font-black">নতুন যুক্ত করুন</span>
                </div>
              </div>
            </div>
          )}
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

  const [customParaTypes, setCustomParaTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_para_types');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const defaultOptions = [
    { id: 'admin', label: 'প্রশাসন', value: 'প্রশাসন', icon: User, color: 'emerald' },
    { id: 'sfi', label: 'এসএফআই', value: 'এসএফআই', icon: ShieldCheck, color: 'blue' },
    { id: 'nonsfi', label: 'নন এসএফআই', value: 'নন এসএফআই', icon: Layout, color: 'indigo' },
  ];

  const options = [
    ...defaultOptions,
    ...customParaTypes.map((pt, index) => ({
      id: `custom-para-type-${index}`,
      label: pt,
      value: pt,
      icon: ShieldCheck,
      color: 'sky' as const
    }))
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewItemName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewParaType = () => {
    const cleanName = newItemName.trim();
    if (!cleanName) return;
    if (options.some(opt => opt.value === cleanName)) {
      alert("এই শাখার ধরণটি ইতিমধ্যে রয়েছে।");
      return;
    }
    const next = [...customParaTypes, cleanName];
    setCustomParaTypes(next);
    localStorage.setItem('custom_para_types', JSON.stringify(next));
    onChange(cleanName);
    setIsAddingNew(false);
    setNewItemName('');
    setIsOpen(false);
  };

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
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600 animate-out duration-200">
          {isAddingNew ? (
            <div className="p-3 space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-blue-500" /> নতুন শাখার ধরণ যুক্ত করুন
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                placeholder="শাখার নাম..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => { setIsAddingNew(false); setNewItemName(''); }}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-200"
                >বাতিল</button>
                <button 
                  type="button"
                  onClick={handleAddNewParaType}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700"
                >সংরক্ষণ</button>
              </div>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={11} className="text-blue-500" /> শাখা নির্বাচন করুন
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
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
              <div 
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-2.5 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all hover:bg-blue-50 text-blue-600 font-black border-t border-dashed border-slate-100 mt-1 shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Plus size={14} />
                  </div>
                  <span className="text-[12.5px] font-black">নতুন যুক্ত করুন</span>
                </div>
              </div>
            </div>
          )}
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

  const [customMinistries, setCustomMinistries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_ministries');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Define options based on MINISTRY_ENTITY_MAP keys
  const defaultOptions = Object.keys(MINISTRY_ENTITY_MAP).map((m, idx) => ({
    id: `ministry-opt-${idx}`,
    label: m,
    value: m,
    icon: Building,
    color: 'sky'
  }));

  const options = [
    ...defaultOptions,
    ...customMinistries.map((cm, idx) => ({
      id: `custom-ministry-opt-${idx}`,
      label: cm,
      value: cm,
      icon: Building,
      color: 'sky'
    }))
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewItemName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewMinistry = () => {
    const cleanName = newItemName.trim();
    if (!cleanName) return;
    if (options.some(opt => opt.value === cleanName)) {
      alert("এই মন্ত্রণালয়টি ইতিমধ্যে রয়েছে।");
      return;
    }
    const next = [...customMinistries, cleanName];
    setCustomMinistries(next);
    localStorage.setItem('custom_ministries', JSON.stringify(next));
    onChange(cleanName);
    setIsAddingNew(false);
    setNewItemName('');
    setIsOpen(false);
  };

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
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-sky-600 animate-out duration-200">
          {isAddingNew ? (
            <div className="p-3 space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-sky-500" /> নতুন মন্ত্রণালয় যুক্ত করুন
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-sky-500"
                placeholder="মন্ত্রণালয়ের নাম..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => { setIsAddingNew(false); setNewItemName(''); }}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-200"
                >বাতিল</button>
                <button 
                  type="button"
                  onClick={handleAddNewMinistry}
                  className="px-2.5 py-1.5 bg-sky-600 text-white rounded-lg text-[10px] font-black hover:bg-sky-700"
                >সংরক্ষণ</button>
              </div>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={11} className="text-sky-500" /> মন্ত্রণালয় নির্বাচন করুন
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
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
              <div 
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-2.5 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all hover:bg-sky-50 text-sky-600 font-black border-t border-dashed border-slate-100 mt-1 shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Plus size={14} />
                  </div>
                  <span className="text-[12.5px] font-black">নতুন যুক্ত করুন</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Premium Dropdown for Entity Selection
 */
const PremiumEntitySelect = ({ value, onChange, ministryName, IDBadge }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [customEntities, setCustomEntities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_entities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const ministryEntities = ministryName && MINISTRY_ENTITY_MAP[ministryName] ? MINISTRY_ENTITY_MAP[ministryName] : [];

  const defaultOptions = ministryEntities.map((ent: string, idx: number) => ({
    id: `entity-opt-${idx}`,
    label: ent,
    value: ent,
    icon: Building2,
    color: 'purple'
  }));

  const options = [
    ...defaultOptions,
    ...customEntities.map((ce: string, idx: number) => ({
      id: `custom-entity-opt-${idx}`,
      label: ce,
      value: ce,
      icon: Building2,
      color: 'purple'
    }))
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewItemName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewEntity = () => {
    const cleanName = newItemName.trim();
    if (!cleanName) return;
    if (options.some(opt => opt.value === cleanName)) {
      alert("এই এনটিটিটি ইতিমধ্যে রয়েছে।");
      return;
    }
    const next = [...customEntities, cleanName];
    setCustomEntities(next);
    localStorage.setItem('custom_entities', JSON.stringify(next));
    onChange(cleanName);
    setIsAddingNew(false);
    setNewItemName('');
    setIsOpen(false);
  };

  const selectedOpt = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <IDBadge id="corr-field-entity-custom" />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${inputCls} flex items-center justify-between cursor-pointer group hover:border-purple-400 hover:ring-4 hover:ring-purple-50 transition-all duration-300 ${isOpen ? 'border-purple-500 ring-4 ring-purple-50 bg-white shadow-md' : (value ? 'border-emerald-500 shadow-sm' : 'border-slate-300 shadow-sm')}`}
      >
        <div className="flex items-center gap-3">
          {selectedOpt ? (
            <>
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building2 size={16} />
              </div>
              <span className="text-slate-900 font-black">{selectedOpt.label}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <span className="text-slate-400 font-bold">{value || "এনটিটি বাছুন..."}</span>
            </>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-purple-600' : 'group-hover:text-purple-500'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-purple-600 animate-out duration-200">
          {isAddingNew ? (
            <div className="p-3 space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-purple-500" /> নতুন এনটিটি যুক্ত করুন
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-purple-500"
                placeholder="এনটিটির নাম..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => { setIsAddingNew(false); setNewItemName(''); }}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-200"
                >বাতিল</button>
                <button 
                  type="button"
                  onClick={handleAddNewEntity}
                  className="px-2.5 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-black hover:bg-purple-700"
                >সংরক্ষণ</button>
              </div>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={11} className="text-purple-500" /> এনটিটি নির্বাচন করুন
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
                {options.map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all group relative ${
                      value === opt.value ? `bg-purple-50 text-purple-700 shadow-sm` : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        value === opt.value ? `bg-purple-600 text-white` : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Building2 size={14} />
                      </div>
                      <span className={`text-[12.5px] font-black transition-colors ${value === opt.value ? `text-purple-700` : 'text-slate-700'}`}>{opt.label}</span>
                    </div>
                    {value === opt.value && (
                      <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-300">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div 
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-2.5 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all hover:bg-purple-50 text-purple-600 font-black border-t border-dashed border-slate-100 mt-1 shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Plus size={14} />
                  </div>
                  <span className="text-[12.5px] font-black">নতুন যুক্ত করুন</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Premium Dropdown for Audit Year Selection with Direct Custom Input
 */
const PremiumAuditYearSelect = ({ value, onChange, IDBadge }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [customYears, setCustomYears] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_audit_years');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [filterText, setFilterText] = useState('');

  const defaultYears = AUDIT_YEARS_OPTIONS[0].options;

  const defaultOptions = defaultYears.map((yr: string, idx: number) => ({
    id: `audit-yr-opt-${idx}`,
    label: yr,
    value: yr,
    icon: Calendar,
    color: 'emerald'
  }));

  const options = [
    ...defaultOptions,
    ...customYears.map((cy: string, idx: number) => ({
      id: `custom-audit-yr-opt-${idx}`,
      label: cy,
      value: cy,
      icon: Calendar,
      color: 'emerald'
    }))
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFilterText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrAdd = (valToSelect: string) => {
    const clean = valToSelect.trim();
    if (!clean) return;
    if (!options.some(opt => opt.value === clean)) {
      const next = [...customYears, clean];
      setCustomYears(next);
      localStorage.setItem('custom_audit_years', JSON.stringify(next));
    }
    onChange(clean);
    setFilterText('');
    setIsOpen(false);
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(filterText.toLowerCase()) || 
    opt.value.toLowerCase().includes(filterText.toLowerCase())
  );

  const isFilterExactMatch = options.some(opt => opt.value.trim() === filterText.trim());

  const selectedOpt = options.find(opt => opt.value === value) || (value ? { label: value, value } : null);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <IDBadge id="corr-field-audit-year-custom" />
      <div 
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
        }}
        className={`${inputCls} flex items-center justify-between cursor-pointer group hover:border-emerald-400 hover:ring-4 hover:ring-emerald-50 transition-all duration-300 ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-50 bg-white shadow-md' : (value ? 'border-emerald-500 shadow-sm' : 'border-slate-300 shadow-sm')}`}
      >
        <div className="flex items-center gap-3">
          {selectedOpt ? (
            <>
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar size={16} />
              </div>
              <span className="text-slate-900 font-black">{selectedOpt.label}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <span className="text-slate-400 font-bold">{value || "সাল বাছুন..."}</span>
            </>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-emerald-600' : 'group-hover:text-emerald-500'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 border-t-4 border-t-emerald-600 animate-out duration-200">
          <div className="p-2 space-y-2">
            <div className="px-2 pt-1 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={11} className="text-emerald-500" /> সাল নির্বাচন করুন
              </span>
            </div>

            {/* Custom Audit Year / Search Input Field - Marked in Image 1 */}
            <div className="px-1">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white bg-slate-50 transition-all placeholder:text-slate-400"
                placeholder="সাল লিখুন বা খুঁজুন (যেমন: ২০২৪-২৫)..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filterText.trim()) {
                      handleSelectOrAdd(filterText.trim());
                    }
                  }
                }}
              />
            </div>

            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5 px-0.5">
              {filterText.trim() && !isFilterExactMatch && (
                <div 
                  onClick={() => handleSelectOrAdd(filterText.trim())}
                  className="px-3 py-2 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-black border border-emerald-200 mb-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                      <Plus size={14} />
                    </div>
                    <span className="text-[12px]">কাস্টম সাল যুক্ত করুন: "{filterText.trim()}"</span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">Enter ↵</span>
                </div>
              )}

              {filteredOptions.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => handleSelectOrAdd(opt.value)}
                  className={`px-3 py-2 mx-0.5 rounded-lg cursor-pointer flex items-center justify-between transition-all group relative ${
                    value === opt.value ? `bg-emerald-50 text-emerald-700 shadow-sm` : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      value === opt.value ? `bg-emerald-600 text-white` : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Calendar size={14} />
                    </div>
                    <span className={`text-[12.5px] font-black transition-colors ${value === opt.value ? `text-emerald-700` : 'text-slate-700'}`}>{opt.label}</span>
                  </div>
                  {value === opt.value && (
                    <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-300">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}

              {filteredOptions.length === 0 && !filterText.trim() && (
                <div className="p-3 text-center text-xs text-slate-400 font-bold">কোন সাল পাওয়া যায়নি</div>
              )}
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
  onViewRegister: (entryId?: string) => void;
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
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
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
    entityName: '',
    auditYear: '',
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
    remarks: '',
    meetingDate: initialEntry?.meetingDate || '',
    meetingDiscussedParaCount: initialEntry?.meetingDiscussedParaCount || initialEntry?.discussedParaCount || '',
    meetingRecommendedParaCount: initialEntry?.meetingRecommendedParaCount || initialEntry?.recommendedParaCount || '',
    discussedParaCount: initialEntry?.discussedParaCount || initialEntry?.meetingDiscussedParaCount || '',
    recommendedParaCount: initialEntry?.recommendedParaCount || initialEntry?.meetingRecommendedParaCount || '',
    sentToDhakaDate: initialEntry?.sentToDhakaDate || '',
    returnedFromDhakaDate: initialEntry?.returnedFromDhakaDate || ''
  });

  // Date segments state for each date field
  const [ld, setLd] = useState(''), [lm, setLm] = useState(''), [ly, setLy] = useState('');
  const [dd, setDd] = useState(''), [dm, setDm] = useState(''), [dy, setDy] = useState('');
  const [rd, setRd] = useState(''), [rm, setRm] = useState(''), [ry, setRy] = useState('');
  const [rcd, setRcd] = useState(''), [rcm, setRcm] = useState(''), [rcy, setRcy] = useState('');
  const [md, setMd] = useState(''), [mm, setMm] = useState(''), [my, setMy] = useState('');

  // Refs for auto-focus jump logic
  const ldRef = useRef<HTMLInputElement>(null), lmRef = useRef<HTMLInputElement>(null), lyRef = useRef<HTMLInputElement>(null);
  const ddRef = useRef<HTMLInputElement>(null), dmRef = useRef<HTMLInputElement>(null), dyRef = useRef<HTMLInputElement>(null);
  const rdRef = useRef<HTMLInputElement>(null), rmRef = useRef<HTMLInputElement>(null), ryRef = useRef<HTMLInputElement>(null);
  const rcdRef = useRef<HTMLInputElement>(null), rcmRef = useRef<HTMLInputElement>(null), rcyRef = useRef<HTMLInputElement>(null);
  const mdRef = useRef<HTMLInputElement>(null), mmRef = useRef<HTMLInputElement>(null), myRef = useRef<HTMLInputElement>(null);

  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [receiverSuggestions, setReceiverSuggestions] = useState<any[]>([]);
  const [receiverSearchQuery, setReceiverSearchQuery] = useState('');
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [customPatkolMills, setCustomPatkolMills] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_patkol_mills');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddingNewPatkol, setIsAddingNewPatkol] = useState(false);
  const [newPatkolName, setNewPatkolName] = useState('');
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);
  const [showAuditYearWarning, setShowAuditYearWarning] = useState(false);
  const [hasWarnedAuditYear, setHasWarnedAuditYear] = useState(false);

  const DEFAULT_PATKOL_MILLS = [
    "দৌলতপুর জুট মিলস লিমিটেড",
    "ইস্টার্ন জুট মিলস লিমিটেড",
    "আলীম জুট মিলস লিমিটেড",
    "স্টার সুট মিলস লিমিটেড",
    "যশোর জুট মিলস লিমিটেড",
    "প্লাটিনাম জুট মিলস লিমিটেড"
  ];

  const handleAddPatkolMill = () => {
    const name = newPatkolName.trim();
    if (!name) return;
    const updated = Array.from(new Set([...customPatkolMills, name]));
    setCustomPatkolMills(updated);
    localStorage.setItem('custom_patkol_mills', JSON.stringify(updated));
    setFormData(prev => ({ ...prev, description: name }));
    setIsAddingNewPatkol(false);
    setNewPatkolName('');
    setShowDescriptionDropdown(false);
  };
  
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
    let active = true;
    const loadReceivers = async () => {
      const normalizeName = (name: string | null | undefined) => {
        if (!name) return '';
        let n = name
          .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '') // Remove all possible invisible characters and non-breaking spaces
          .trim()
          .replace(/\s+/g, ' ')                  // Normalize internal whitespace to a single space
          .replace(/[:ঃ।\.\-]/g, '')         // Remove punctuation and hasant for comparison
          .normalize('NFC');                     // Normalize Unicode to canonical form

        // Strip common prefixes like "জনাব", "জনাবা", "ডাঃ", "ডা", "ড", "ডক্টর"
        n = n.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়)\s+/, '');
        n = n.replace(/^মো[ঃ:\.]\s*/, '');
        n = n.replace(/^মোঃ\s*/, '');

        // Normalize common spelling variations in Bengali vowels for matching
        n = n.replace(/ী/g, 'ি')
             .replace(/ূ/g, 'ু')
             .replace(/ষ/g, 'স')
             .replace(/শ/g, 'স')
             .replace(/ণ/g, 'ন')
             .replace(/য়/g, 'য')
             .replace(/্/g, '')
             .replace(/ঁ/g, '')
             .replace(/়/g, '');

        return n;
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

        // Always load and merge LocalStorage receivers to ensure newly added/moved receivers in dashboard show up here
        const key = isAdminBranch(formData.paraType) ? 'ledger_correspondence_receivers_admin' :
                    isNonSFI(formData.paraType) ? 'ledger_correspondence_receivers_nonsfi' :
                    'ledger_correspondence_receivers_sfi';
        const savedNames = localStorage.getItem(key);
        if (savedNames) {
          try {
            const parsed = JSON.parse(savedNames);
            const localReceivers = parsed.map((p: any) => {
              if (typeof p === 'string') {
                return { name: p, designation: 'অডিটর' };
              }
              return p;
            }).filter(Boolean);
            
            // Merge with what we might have got from Supabase using normalized names to prevent duplicates
            const existingNormalized = new Set(finalReceivers.map(r => normalizeName(r.name)));
            localReceivers.forEach((lr: any) => {
              const norm = normalizeName(lr.name);
              if (norm && !existingNormalized.has(norm)) {
                finalReceivers.push(lr);
                existingNormalized.add(norm);
              }
            });
          } catch (e) { console.error('Error parsing local receivers:', e); }
        }

        // To ensure "Recipient Management" is the only source of truth, we do not fetch or merge any names from old correspondence entries.
        const existingNormalizedNames = new Set(finalReceivers.map(r => normalizeName(r.name)));

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
            const saved = localStorage.getItem('ledger_receiver_transfers_v2');
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

          // STRICT BRANCH ISOLATION: Ensure receivers from other branches are not shown
          if (r.para_type && getCleanBranch(r.para_type) !== currentFormBranchClean) {
            is_active = false;
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
        if (active) {
          setReceiverSuggestions(filteredReceivers);
        }

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
            const saved = localStorage.getItem('ledger_receiver_transfers_v2');
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

          // STRICT BRANCH ISOLATION: Ensure receivers from other branches are not shown
          if (r.para_type && getCleanBranch(r.para_type) !== currentFormBranchClean) {
            is_active = false;
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

        if (active) {
          setReceiverSuggestions(filtered);
        }
      }
    };

    loadReceivers();

    const handleStorageChange = () => {
      if (active) {
        loadReceivers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const savedDescriptions = localStorage.getItem('ledger_correspondence_descriptions');
    if (savedDescriptions) setDescriptionSuggestions(JSON.parse(savedDescriptions));

    return () => {
      active = false;
      window.removeEventListener('storage', handleStorageChange);
    };
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
        entityName: initialEntry.entityName || '',
        auditYear: initialEntry.auditYear || '',
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
        remarks: initialEntry.remarks || '',
        meetingDate: initialEntry.meetingDate || '',
        meetingDiscussedParaCount: initialEntry.meetingDiscussedParaCount || initialEntry.discussedParaCount || '',
        meetingRecommendedParaCount: initialEntry.meetingRecommendedParaCount || initialEntry.recommendedParaCount || '',
        discussedParaCount: initialEntry.discussedParaCount || initialEntry.meetingDiscussedParaCount || '',
        recommendedParaCount: initialEntry.recommendedParaCount || initialEntry.meetingRecommendedParaCount || '',
        sentToDhakaDate: initialEntry.sentToDhakaDate || '',
        returnedFromDhakaDate: initialEntry.returnedFromDhakaDate || ''
      });
      
      setSegmentsFromDate(initialEntry.letterDate, setLd, setLm, setLy);
      setSegmentsFromDate(initialEntry.diaryDate, setDd, setDm, setDy);
      setSegmentsFromDate(initialEntry.receiptDate, setRd, setRm, setRy);
      setSegmentsFromDate(initialEntry.receivedDate, setRcd, setRcm, setRcy);
      setSegmentsFromDate(initialEntry.meetingDate, setMd, setMm, setMy);

      setRawInputs({
        totalParas: toBengaliDigits(initialEntry.totalParas),
        totalAmount: toBengaliDigits(initialEntry.totalAmount),
        sentParaCount: toBengaliDigits(initialEntry.sentParaCount),
        meetingDiscussedParaCount: toBengaliDigits(initialEntry.meetingDiscussedParaCount),
        meetingRecommendedParaCount: toBengaliDigits(initialEntry.meetingRecommendedParaCount)
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
  useEffect(() => { setFormData(prev => ({ ...prev, meetingDate: formatDateSegments(md, mm, my) })); }, [md, mm, my]);

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
    else if (type === 'meeting') setSegmentsFromDate(iso, setMd, setMm, setMy);
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
    setFormData(prev => ({
      ...prev,
      [field]: val,
      ...(field === 'meetingDiscussedParaCount' ? { discussedParaCount: val } : {}),
      ...(field === 'meetingRecommendedParaCount' ? { recommendedParaCount: val } : {})
    }));
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
      entityName: '',
      auditYear: '',
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
      remarks: '',
      meetingDate: '',
      meetingDiscussedParaCount: '',
      meetingRecommendedParaCount: ''
    });
    setLd(''); setLm(''); setLy('');
    setDd(''); setDm(''); setDy('');
    setRd(''); setRm(''); setRy('');
    setRcd(''); setRcm(''); setRcy('');
    setMd(''); setMm(''); setMy('');
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
      if (!yearRegex.test(desc) && !formData.auditYear) {
        setShowAuditYearWarning(true);
        setHasWarnedAuditYear(true);
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
      // 1. Ministry mismatch validation
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
      if (!yearRegex.test(desc) && !formData.auditYear) {
        setShowAuditYearWarning(true);
        setHasWarnedAuditYear(true);
      }
    }
    
    // Defer heavy work to next tick to avoid blocking UI (INP fix)
    setTimeout(() => {
      if (formData.description.trim()) {
        const updatedDesc = Array.from(new Set([formData.description.trim(), ...descriptionSuggestions]));
        setDescriptionSuggestions(updatedDesc);
        localStorage.setItem('ledger_correspondence_descriptions', JSON.stringify(updatedDesc));
      }

      const res = onAdd(formData);
      if (res && res.id) {
        setLastCreatedId(res.id);
      } else if (res && typeof res.then === 'function') {
        res.then((r: any) => { if (r && r.id) setLastCreatedId(r.id); });
      }
      setIsSuccess(true);
      resetForm();
      setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }, 0);
  };

  // Chronological Validations
  const diaryDateError = getDateError(formData.diaryDate, formData.letterDate, 'ডায়েরি তারিখ', 'পত্রের তারিখ');
  const receiptDateError = getDateError(formData.receiptDate, formData.diaryDate, 'শাখায় প্রাপ্তির তারিখ', 'ডায়েরি তারিখ');
  const receivedDateError = getDateError(formData.receivedDate, formData.receiptDate, 'গ্রহণের তারিখ', 'শাখায় প্রাপ্তির তারিখ');

  const isMeeting = formData.letterType === 'দ্বিপক্ষীয় সভা' || 
                    formData.letterType === 'ত্রিপক্ষীয় সভা' || 
                    (Boolean(formData.letterType) && formData.letterType.includes('সভা') && !formData.letterType.includes('কার্যপত্র'));

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

  let serialCount = 1;
  const getSerial = () => toBengaliDigits(serialCount++);

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
                  <span>ডায়েরি নং- <span className="underline underline-offset-4 font-black">{toBengaliDigits(formData.diaryNo)}</span> </span>
                )}
                {duplicates.diaryNo && duplicates.letterNo && <span>এবং </span>}
                {duplicates.letterNo && (
                  <span>পত্র নং- <span className="underline underline-offset-4 font-black">{toBengaliDigits(formData.letterNo)}</span> </span>
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
            
            {/* --- Section: পত্রের অন্যান্য তথ্য --- */}
            <div className={sectionHeaderCls}>
               <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
               <h4 className={sectionTitleCls}>পত্রের অন্যান্য তথ্য</h4>
            </div>

            {/* Field Ministry */}
            <div className={`${colWrapper} border-sky-100`}>
              <label className={labelCls}>
                <span className={numBadge}>{getSerial()}</span> 
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

            {/* Field Entity */}
            <div className={`${colWrapper} border-purple-100`}>
              <label className={labelCls}>
                <span className={numBadge}>{getSerial()}</span> 
                <Building2 size={14} className="text-purple-600" /> 
                এনটিটি:
              </label>
              <PremiumEntitySelect 
                value={formData.entityName}
                onChange={(val: string) => setFormData({...formData, entityName: val})}
                ministryName={formData.ministryName}
                IDBadge={IDBadge}
              />
            </div>

            {/* Field Description - Double Width */}
            <div className={`${colWrapper} border-emerald-100 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2`} ref={descriptionRef}>
              <IDBadge id="corr-field-1" />
              <label className={labelCls}>
                <span className={numBadge}>{getSerial()}</span> 
                <FileText size={14} className="text-emerald-600" /> 
                পত্রের বিবরণ:
              </label>
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

                {showAuditYearWarning && formData.description && !/[0-9]{4}|[০-৯]{4}/.test(formData.description) && !formData.auditYear && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <AlertCircle size={14} className="shrink-0 text-red-600" />
                    <span>নিরীক্ষা সাল উল্লেখ করা হয়নি (নিচের ঘরে নিরীক্ষা সাল দিন)</span>
                  </div>
                )}

                {showDescriptionDropdown && (
                  formData.entityName === 'পাটকল সংস্থা' ? (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-emerald-600">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={12} /> পাটকল সমূহের তালিকা
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                        {Array.from(new Set([...DEFAULT_PATKOL_MILLS, ...customPatkolMills]))
                          .filter(mill => mill.toLowerCase().includes(formData.description.toLowerCase()))
                          .map((mill, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setFormData({...formData, description: mill});
                              setShowDescriptionDropdown(false);
                            }}
                            className={`px-5 py-3 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${formData.description === mill ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-emerald-50 text-slate-700 font-bold'}`}
                          >
                            <span className="text-[13px] leading-relaxed flex-1">{mill}</span>
                            {formData.description === mill && <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-slate-100 bg-slate-50">
                        {!isAddingNewPatkol ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddingNewPatkol(true);
                            }}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Plus size={14} /> নতুন যুক্ত করুন
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 p-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              placeholder="নতুন মিলের নাম..."
                              className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              value={newPatkolName}
                              onChange={(e) => setNewPatkolName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddPatkolMill();
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleAddPatkolMill}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                            >
                              সংরক্ষণ
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsAddingNewPatkol(false); setNewPatkolName(''); }}
                              className="px-2 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    descriptionSuggestions.length > 0 && (
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
                    )
                  )
                )}
              </div>
            </div>

            {/* Field Audit Year */}
            <div className={`${colWrapper} border-emerald-100`}>
              <label className={labelCls}>
                <span className={numBadge}>{getSerial()}</span> 
                <Calendar size={14} className="text-emerald-600" /> 
                নিরীক্ষা সাল:
              </label>
              <PremiumAuditYearSelect 
                value={formData.auditYear}
                onChange={(val: string) => setFormData({...formData, auditYear: val})}
                IDBadge={IDBadge}
              />
              {showAuditYearWarning && !formData.auditYear && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600">
                  <AlertCircle size={14} className="shrink-0 text-red-600" />
                  <span>নিরীক্ষা সাল প্রদান করুন</span>
                </div>
              )}
            </div>

            {/* Field Para Type */}
            <div className={`${colWrapper} border-blue-100`}>
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <ShieldCheck size={14} className="text-blue-600" /> শাখার ধরণ:</label>
              <PremiumParaTypeSelect 
                value={formData.paraType}
                onChange={(val: string) => setFormData({...formData, paraType: val})}
                IDBadge={IDBadge}
              />
            </div>

            {/* Field Letter Type */}
            <div className={`${colWrapper} border-indigo-100`}>
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <FileText size={14} className="text-indigo-600" /> পত্রের ধরণ:</label>
              <PremiumLetterTypeSelect 
                value={formData.letterType}
                onChange={(val: string) => setFormData({...formData, letterType: val})}
                isLayoutEditable={isLayoutEditable}
                IDBadge={IDBadge}
                paraType={formData.paraType}
              />
            </div>

            {/* Field Letter No */}
            <div className={`${colWrapper} ${duplicates.letterNo ? 'bg-amber-50 border-amber-200' : 'border-amber-100'}`}>
              <IDBadge id="corr-field-4a" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Hash size={14} className="text-amber-600" /> পত্র নং-</label>
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

            {/* Field Letter Date - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-4b" icon={Calendar} num={getSerial()} label="পত্রের তারিখ" color="amber" 
              dayValue={ld} monthValue={lm} yearValue={ly} 
              daySetter={setLd} monthSetter={setLm} yearSetter={setLy} 
              dayRef={ldRef} monthRef={lmRef} yearRef={lyRef} 
              isLayoutEditable={isLayoutEditable} originalValue={formData.letterDate} 
              onDateSelect={(iso: string) => handleManualDateSelect(iso, 'letter')} 
            />

            {/* Field Sent Para Count */}
            <div className={`${colWrapper} border-purple-100`}>
              <IDBadge id="corr-field-paras-count" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <ListOrdered size={14} className="text-purple-600" /> প্রেরিত অনু: সংখ্যা:</label>
              <input 
                type="text" className={`${inputCls} ${rawInputs.totalParas ? 'border-emerald-500' : 'border-red-500'}`} 
                value={rawInputs.totalParas || ''} onChange={e => handleNumericInput('totalParas', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Field Total Amount */}
            <div className={`${colWrapper} border-rose-100`}>
              <IDBadge id="corr-field-amount" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Banknote size={14} className="text-rose-600" /> মোট জড়িত টাকা:</label>
              <input 
                type="text" className={`${inputCls} ${rawInputs.totalAmount ? 'border-emerald-500' : 'border-red-500'}`} 
                value={rawInputs.totalAmount || ''} onChange={e => handleNumericInput('totalAmount', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Meeting specific fields if দ্বিপক্ষীয় / ত্রিপক্ষীয় সভা */}
            {isMeeting && (
              <>
                <SegmentedInput 
                  id="corr-field-meeting-date" icon={Calendar} num={getSerial()} label="সভার তারিখ" color="amber" 
                  dayValue={md} monthValue={mm} yearValue={my} 
                  daySetter={setMd} monthSetter={setMm} yearSetter={setMy} 
                  dayRef={mdRef} monthRef={mmRef} yearRef={myRef} 
                  isLayoutEditable={isLayoutEditable} originalValue={formData.meetingDate} 
                  onDateSelect={(iso: string) => handleManualDateSelect(iso, 'meeting')} 
                />

                <div className={`${colWrapper} border-sky-100`}>
                  <IDBadge id="corr-field-discussed-paras" />
                  <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <ListOrdered size={14} className="text-sky-600" /> আলোচিত অনুচ্ছেদ সংখ্যা:</label>
                  <input 
                    type="text" className={`${inputCls} ${rawInputs.meetingDiscussedParaCount ? 'border-emerald-500' : 'border-red-500'}`} 
                    value={rawInputs.meetingDiscussedParaCount || (formData.meetingDiscussedParaCount === '0' || formData.meetingDiscussedParaCount === '' ? '' : toBengaliDigits(formData.meetingDiscussedParaCount || ''))} 
                    onChange={e => handleNumericInput('meetingDiscussedParaCount', e.target.value)}
                    placeholder="০"
                  />
                </div>

                <div className={`${colWrapper} border-emerald-100`}>
                  <IDBadge id="corr-field-recommended-paras" />
                  <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <CheckCircle2 size={14} className="text-emerald-600" /> সুপারিশকৃত অনুচ্ছেদ সংখ্যা:</label>
                  <input 
                    type="text" className={`${inputCls} ${rawInputs.meetingRecommendedParaCount ? 'border-emerald-500' : 'border-red-500'}`} 
                    value={rawInputs.meetingRecommendedParaCount || (formData.meetingRecommendedParaCount === '0' || formData.meetingRecommendedParaCount === '' ? '' : toBengaliDigits(formData.meetingRecommendedParaCount || ''))} 
                    onChange={e => handleNumericInput('meetingRecommendedParaCount', e.target.value)}
                    placeholder="০"
                  />
                </div>
              </>
            )}

            {/* --- Section: অত্র অফিসের তথ্য --- */}
            <div className={sectionHeaderCls}>
               <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
               <h4 className={sectionTitleCls}>অত্র অফিসের তথ্য</h4>
            </div>

            {/* Field Diary No */}
            <div className={`${colWrapper} ${duplicates.diaryNo ? 'bg-amber-50 border-amber-200' : 'border-emerald-100'}`}>
              <IDBadge id="corr-field-7a" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <BookOpen size={14} className="text-emerald-600" /> ডায়েরি নং-</label>
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

            {/* Field Diary Date - Smart Segmented Date */}
            <div className="space-y-2">
              <SegmentedInput 
                id="corr-field-7b" icon={Calendar} num={getSerial()} label="ডায়েরি তারিখ" color="emerald" 
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

            {/* Field Receipt Date - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-8" icon={Inbox} num={getSerial()} label="শাখায় প্রাপ্তির তারিখ" color="sky" 
              dayValue={rd} monthValue={rm} yearValue={ry} 
              daySetter={setRd} monthSetter={setRm} yearSetter={setRy} 
              dayRef={rdRef} monthRef={rmRef} yearRef={ryRef} 
              isLayoutEditable={isLayoutEditable} originalValue={formData.receiptDate} 
              onDateSelect={(iso: string) => handleManualDateSelect(iso, 'receipt')} 
              error={receiptDateError}
            />

            {/* Field Digital File No */}
            <div className={`${colWrapper} border-indigo-100`}>
              <IDBadge id="corr-field-9" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Computer size={14} className="text-indigo-600" /> ডিজিটাল নথি নং-</label>
              <input 
                type="text" className={`${inputCls} ${formData.digitalFileNo ? 'border-emerald-500' : 'border-red-500'}`} 
                value={formData.digitalFileNo} onChange={e => setFormData({...formData, digitalFileNo: toBengaliDigits(e.target.value)})}
                placeholder="নথি নং লিখুন"
              />
            </div>

            {/* Field Receiver Name */}
            <div className={`${colWrapper} border-slate-200`} ref={receiverRef}>
              <IDBadge id="corr-field-10" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <User size={14} className="text-slate-600" /> গ্রহীতার নাম:</label>
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
                    {/* Scrollable list (visible scrollbar) */}
                    <div className="max-h-52 overflow-y-auto py-2">
                      {receiverSuggestions.length === 0 ? (
                        <div className="px-5 py-4 text-center text-slate-400 font-bold text-sm">
                          কোন নাম পাওয়া যায়নি।
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

              {/* Recipient Dropdown is managed exclusively from Receiver Management */}
            </div>

            {/* Field Received Date - Smart Segmented Date */}
            <SegmentedInput 
              id="corr-field-11" icon={Calendar} num={getSerial()} label="গ্রহণের তারিখ" color="blue" 
              dayValue={rcd} monthValue={rcm} yearValue={rcy} 
              daySetter={setRcd} monthSetter={setRcm} yearSetter={setRcy} 
              dayRef={rcdRef} monthRef={rcmRef} yearRef={rcyRef} 
              isLayoutEditable={isLayoutEditable} originalValue={formData.receivedDate} 
              onDateSelect={(iso: string) => handleManualDateSelect(iso, 'received')}
              error={receivedDateError}
            />

            {/* Field Online Receipt */}
            <div className={`${colWrapper} border-emerald-100`}>
              <IDBadge id="corr-field-12" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Computer size={14} className="text-emerald-600" /> অনলাইনে প্রাপ্তি:</label>
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

            {/* Field Archive No */}
            <div className={`${colWrapper} border-amber-100`}>
              <IDBadge id="corr-field-archive-no" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <Hash size={14} className="text-amber-600" /> আর্কাইভ নং-</label>
              <input 
                type="text" 
                className={`${inputCls} ${formData.archiveNo ? 'border-emerald-500' : 'border-red-500'}`} 
                value={formData.archiveNo} 
                onChange={e => handleArchiveNoChange(e.target.value)}
                placeholder="নং লিখুন"
              />
            </div>

            {/* Field Remarks */}
            <div className={`${colWrapper} border-slate-200 col-span-full`}>
              <IDBadge id="corr-field-14" />
              <label className={labelCls}><span className={numBadge}>{getSerial()}</span> <FileText size={14} className="text-slate-600" /> মন্তব্য:</label>
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
                    onClick={() => {
                      setIsSuccess(false);
                      
                      // Scroll to container top first
                      const container = document.getElementById('form-container-correspondence');
                      if (container) {
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }

                      // Also scroll the main container which has the actual overflow scroll in App.tsx
                      const mainContainer = document.querySelector('main');
                      if (mainContainer) {
                        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
                      }

                      // Apply a timeout fallback so that as the DOM recalculates heights after state change, it fully scrolls to top
                      setTimeout(() => {
                        const containerAgain = document.getElementById('form-container-correspondence');
                        if (containerAgain) {
                          containerAgain.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        if (mainContainer) {
                          mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                    className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl font-black text-lg shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95 group cursor-pointer"
                  >
                    নতুন চিঠি এন্ট্রি দিন <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => onViewRegister(lastCreatedId || undefined)}
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