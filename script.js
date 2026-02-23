import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, 
  Sparkles, Menu, Calendar, Trash2, FileSpreadsheet, Pencil, Tag, 
  Search, FileDown, AlertTriangle, X, ArrowRightCircle, Building2, 
  Building, AlertCircle, CheckCircle2, TrendingUp, Coins, CreditCard, 
  ArrowRight, ClipboardCheck, CalendarRange, History, CalendarDays, 
  Database, Table as TableIcon, PlusCircle
} from 'lucide-react';
import { format, isAfter, isBefore, addMonths } from 'date-fns';

// --- UTILS (numberUtils.ts) ---
const toBengaliDigits = (input) => {
  if (input === undefined || input === null) return '';
  const bengaliDigits = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return input.toString().replace(/[0-9]/g, (digit) => bengaliDigits[digit]);
};

const toEnglishDigits = (input) => {
  const englishDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return input.replace(/[০-৯]/g, (digit) => englishDigits[digit]);
};

const parseBengaliNumber = (input) => {
  if (!input) return 0;
  const englishString = toEnglishDigits(input).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(englishString);
  return isNaN(parsed) ? 0 : parsed;
};

const formatBengaliAmount = (num) => {
  if (num === 0) return '০.০০';
  const formatted = num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return toBengaliDigits(formatted);
};

// --- UTILS (cycleHelper.ts) ---
const getCurrentCycle = (date = new Date()) => {
  const day = date.getDate();
  let start, end;
  if (day >= 16) {
    start = new Date(date); start.setDate(16); start.setHours(0, 0, 0, 0);
    const nextMonth = addMonths(date, 1);
    end = new Date(nextMonth); end.setDate(15); end.setHours(23, 59, 59, 999);
  } else {
    const lastMonth = addMonths(date, -1);
    start = new Date(lastMonth); start.setDate(16); start.setHours(0, 0, 0, 0);
    end = new Date(date); end.setDate(15); end.setHours(23, 59, 59, 999);
  }
  return { start, end, label: `${format(start, 'dd/MM/yyyy')} হতে ${format(end, 'dd/MM/yyyy')}` };
};

const getCycleForDate = (date) => {
  const day = date.getDate();
  let start, end;
  if (day >= 16) {
    start = new Date(date); start.setDate(16); start.setHours(0, 0, 0, 0);
    const nextMonth = addMonths(date, 1);
    end = new Date(nextMonth); end.setDate(15); end.setHours(23, 59, 59, 999);
  } else {
    const lastMonth = addMonths(date, -1);
    start = new Date(lastMonth); start.setDate(16); start.setHours(0, 0, 0, 0);
    end = new Date(date); end.setDate(15); end.setHours(23, 59, 59, 999);
  }
  return { start, end, label: `${format(start, 'dd/MM/yyyy')} হতে ${format(end, 'dd/MM/yyyy')}` };
};

const isEntryLate = (entryMadeAt, targetCycleEnd) => isAfter(entryMadeAt, targetCycleEnd);

// --- CONSTANTS ---
const OFFICE_HEADER = {
  main: "মহাপরিচালকের কার্যালয়",
  sub: "বাণিজ্যিক অডিট অধিদপ্তর",
  address: "আঞ্চলিক কার্যালয় সেক্টর- ০৬, খুলনা"
};

const MINISTRY_ENTITY_MAP = {
  "আর্থিক প্রতিষ্ঠান বিভাগ": ["সোনালী ব্যাংক পিএলসি", "জনতা ব্যাংক পিএলসি", "অগ্রণী ব্যাংক পিএলসি", "বাংলাদেশ কৃষি ব্যাংক", "রূপালী ব্যাংক পিএলসি", "বাংলাদেশ ব্যাংক", "বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লি.", "গৃহনির্মাণ ঋণদান সংস্থা", "কর্মসংস্থান ব্যাংক", "বেসিক ব্যাংক লি.", "আনসার ভিডিপি উন্নয়ন ব্যাংক লি.", "ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ", "সাধারণ বীমা কর্পোরেশন", "জীবন বীমা কর্পোরেশন", "প্রবাসী কল্যাণ ব্যাংক"],
  "পাট মন্ত্রণালয়": ["পাটকল সংস্থা", "পাট সংস্থা"],
  "বস্ত্র মন্ত্রণালয়": ["বস্ত্রকল সংস্থা", "রেশম বোর্ড"],
  "শিল্প মন্ত্রণালয়": ["চিনি ও খাদ্য সংস্থা", "ক্ষুদ্র ও কুটির শিল্প", "বিটাক", "রসায়ন শিল্প"],
  "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়": ["বাংলাদেশ বিমান", "পর্যটন কর্পোরেশন"],
  "বাণিজ্য মন্ত্রণালয়": ["টিসিবি", "আমদানি ও রপ্তানি"]
};

const ENTITY_BRANCH_MAP = {
  "সোনালী ব্যাংক পিএলসি": ["খুলনা কর্পোরেট শাখা", "দৌলতপুর শাখা", "শিপইয়ার্ড শাখা", "বরিশাল কর্পোরেট শাখা"],
  "জনতা ব্যাংক পিএলসি": ["খুলনা কর্পোরেট শাখা", "বরিশাল কর্পোরেট শাখা", "মোংলা শাখা"],
  "চিনি ও খাদ্য সংস্থা": ["কুষ্টিয়া সুগার মিলস", "মোবারকগঞ্জ সুগার মিলস"],
  "পাটকল সংস্থা": ["ক্রিসেন্ট জুট মিলস", "প্লাটিনাম জুবিলী জুট মিলস", "স্টার জুট মিলস"]
};

const MINISTRIES_LIST = [{ label: "মন্ত্রণালয়", options: Object.keys(MINISTRY_ENTITY_MAP) }];

const AUDIT_YEARS_OPTIONS = [{
  label: "সাল",
  options: Array.from({ length: 2026 - 1990 }, (_, i) => {
    const startYear = 1990 + i;
    const endYear = (startYear + 1).toString().slice(-2);
    return `${startYear}-${endYear}`;
  }).reverse()
}];

// --- COMPONENTS (SearchableSelect) ---
const SearchableSelect = ({ label, value, onChange, groups, placeholder = "নির্বাচন করুন", required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(value || '');
      setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, 50);
    } else { setSearchTerm(''); }
  }, [isOpen]);

  const allOptions = groups.flatMap(g => g.options);
  const filteredOptions = allOptions.filter(opt => !searchTerm || searchTerm === value || opt.toLowerCase().includes(searchTerm.toLowerCase()));
  const exactMatch = allOptions.some(o => o.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <div className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-300 flex items-center justify-between cursor-pointer shadow-sm ${isOpen ? 'border-blue-500 ring-4 ring-blue-50 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`} onClick={() => setIsOpen(true)}>
        {isOpen ? (
          <input ref={inputRef} type="text" className="w-full bg-transparent border-none focus:ring-0 text-[14px] font-bold text-slate-900 placeholder-slate-400 outline-none p-0" placeholder="টাইপ করে খুঁজুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />
        ) : (
          <span className={`text-[14px] truncate ${value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}`}>{value || placeholder}</span>
        )}
        <div className="flex items-center gap-1 ml-2">
          {isOpen && searchTerm && <X size={14} className="text-slate-300 hover:text-slate-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} />}
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-64 overflow-y-auto py-2">
            {searchTerm && !exactMatch && (
              <div className="px-4 py-3 mx-2 mb-2 rounded-lg cursor-pointer bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group" onClick={() => { onChange(searchTerm); setIsOpen(false); }}>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs"><PlusCircle size={14} /><span>নতুন হিসেবে যোগ করুন: "{searchTerm}"</span></div>
              </div>
            )}
            {filteredOptions.length > 0 ? filteredOptions.map((option, idx) => (
              <div key={idx} className={`px-4 py-2.5 mx-1 my-0.5 rounded-md cursor-pointer text-sm font-bold transition-all ${value === option ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} onClick={(e) => { e.stopPropagation(); onChange(option); setIsOpen(false); }}>{option}</div>
            )) : <div className="p-6 text-center text-slate-400 text-xs font-bold italic">কিছু পাওয়া যায়নি</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTS (SettlementForm) ---
const SettlementForm = ({ onAdd, nextSl, branchSuggestions, initialEntry, onCancel }) => {
  const [wizardStep, setWizardStep] = useState('selection');
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [tempParaType, setTempParaType] = useState(null);
  const [formData, setFormData] = useState({ ministryName: '', entityName: '', branchName: '', auditYear: '', letterNoDate: '', workpaperNoDate: '', minutesNoDate: '', paraType: 'নন এসএফআই', issueLetterNoDate: '', issueDateISO: '', isMeeting: false, meetingType: '', meetingDate: '', meetingRecommendedParaCount: '', meetingSettledParaCount: '', meetingUnsettledAmount: 0, remarks: '', manualRaisedCount: null, manualRaisedAmount: null });
  const [paragraphs, setParagraphs] = useState([]);
  const [bulkParaInput, setBulkParaInput] = useState('');
  const [rawInputs, setRawInputs] = useState({});

  useEffect(() => {
    if (initialEntry) {
      setFormData({ ...initialEntry, meetingUnsettledAmount: initialEntry.meetingUnsettledAmount || 0 });
      setSelectedSubtype(initialEntry.isMeeting ? initialEntry.meetingType || '' : 'বিএসআর');
      setParagraphs(initialEntry.paragraphs || []);
      const newRaw = {};
      initialEntry.paragraphs.forEach(p => {
        newRaw[`${p.id}-paraNo`] = toBengaliDigits(p.paraNo);
        newRaw[`${p.id}-involvedAmount`] = toBengaliDigits(p.involvedAmount);
        newRaw[`${p.id}-recoveredAmount`] = toBengaliDigits(p.recoveredAmount);
        newRaw[`${p.id}-adjustedAmount`] = toBengaliDigits(p.adjustedAmount);
      });
      if (initialEntry.manualRaisedCount) newRaw['entry-raised-count'] = toBengaliDigits(initialEntry.manualRaisedCount);
      if (initialEntry.manualRaisedAmount) newRaw['entry-raised-amount'] = toBengaliDigits(initialEntry.manualRaisedAmount);
      setRawInputs(newRaw); setWizardStep('details');
    }
  }, [initialEntry]);

  const handleBulkGenerate = () => {
    if (!bulkParaInput.trim()) return;
    const nums = bulkParaInput.split(/[,，\s]+/).map(s => s.trim()).filter(s => s);
    const newParas = nums.map(no => {
      const id = 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      setRawInputs(prev => ({ ...prev, [`${id}-paraNo`]: toBengaliDigits(no) }));
      return { id, paraNo: no, status: 'পূর্ণাঙ্গ', involvedAmount: 0, recoveredAmount: 0, adjustedAmount: 0, category: 'ভ্যাট', isAdvanced: false, vatRec: 0, vatAdj: 0, itRec: 0, itAdj: 0, othersRec: 0, othersAdj: 0 };
    });
    setParagraphs(prev => [...prev, ...newParas]); setBulkParaInput('');
  };

  const handleNumericInputChange = (id, field, val) => {
    const bVal = toBengaliDigits(val);
    setRawInputs(prev => ({ ...prev, [`${id}-${field}`]: bVal }));
    const num = parseBengaliNumber(val);
    if (id === 'entry') {
      if (field === 'raised-count') setFormData(prev => ({ ...prev, manualRaisedCount: val || null }));
      else if (field === 'raised-amount') setFormData(prev => ({ ...prev, manualRaisedAmount: val ? num : null }));
    }
    else if (id === 'meeting') setFormData(prev => ({ ...prev, [field]: num }));
    else setParagraphs(prev => prev.map(p => p.id === id ? { ...p, [field]: num } : p));
  };

  const totals = paragraphs.reduce((acc, p) => {
    if (p.category === 'ভ্যাট') { acc.vR += p.recoveredAmount; acc.vA += p.adjustedAmount; }
    else if (p.category === 'আয়কর') { acc.iR += p.recoveredAmount; acc.iA += p.adjustedAmount; }
    else { acc.oR += p.recoveredAmount; acc.oA += p.adjustedAmount; }
    return acc;
  }, { vR: 0, vA: 0, iR: 0, iA: 0, oR: 0, oA: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paragraphs.length === 0) { alert("অনুগ্রহ করে অনুচ্ছেদ যোগ করুন!"); return; }
    const actualEntryDate = new Date();
    let cycleLabel = '', isLate = false;
    if (formData.issueDateISO) {
      const issueDate = new Date(formData.issueDateISO);
      const cycleInfo = getCycleForDate(issueDate);
      cycleLabel = cycleInfo.label;
      isLate = isEntryLate(actualEntryDate, cycleInfo.end);
    }
    onAdd({ 
      ...formData, paragraphs, cycleLabel, isLate, actualEntryDate: actualEntryDate.toISOString(),
      involvedAmount: paragraphs.reduce((s, p) => s + p.involvedAmount, 0) + (formData.meetingUnsettledAmount || 0), 
      vatRec: totals.vR, vatAdj: totals.vA, itRec: totals.iR, itAdj: totals.iA, othersRec: totals.oR, othersAdj: totals.oA, 
      totalRec: totals.vR + totals.iR + totals.oR, totalAdj: totals.vA + totals.iA + totals.oA 
    });
    setWizardStep('selection');
  };

  if (wizardStep === 'selection') {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 mb-8 max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-3 mb-12"><h3 className="text-3xl font-black text-slate-900">নতুন এন্ট্রি শুরু করুন</h3><p className="text-slate-500 font-bold">নিচের অপশনগুলো থেকে চিঠির ধরন বাছাই করুন</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${tempParaType === 'এসএফআই' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`} onClick={() => setTempParaType('এসএফআই')}>
            <div className="flex items-center gap-4 mb-6"><div className={`p-3 rounded-2xl ${tempParaType === 'এসএফআই' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}><Building2 size={32} /></div><h4 className="text-2xl font-black">এসএফআই</h4></div>
            <select value={tempParaType === 'এসএফআই' ? selectedSubtype : ''} onChange={(e) => { setSelectedSubtype(e.target.value); setTempParaType('এসএফআই'); }} className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"><option value="" disabled>ধরন নির্বাচন করুন...</option><option value="বিএসআর">বিএসআর (BSR)</option><option value="ত্রিপক্ষীয় সভা">ত্রিপক্ষীয় সভা</option></select>
          </div>
          <div className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${tempParaType === 'নন এসএফআই' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`} onClick={() => setTempParaType('নন এসএফআই')}>
            <div className="flex items-center gap-4 mb-6"><div className={`p-3 rounded-2xl ${tempParaType === 'নন এসএফআই' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}><Building size={32} /></div><h4 className="text-2xl font-black">নন এসএফআই</h4></div>
            <select value={tempParaType === 'নন এসএফআই' ? selectedSubtype : ''} onChange={(e) => { setSelectedSubtype(e.target.value); setTempParaType('নন এসএফআই'); }} className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"><option value="" disabled>ধরন নির্বাচন করুন...</option><option value="বিএসআর">বিএসআর (BSR)</option><option value="দ্বিপক্ষীয় সভা">দ্বিপক্ষীয় সভা</option></select>
          </div>
        </div>
        <button onClick={() => { setFormData(f => ({ ...f, paraType: tempParaType, isMeeting: selectedSubtype !== 'বিএসআর', meetingType: selectedSubtype !== 'বিএসআর' ? selectedSubtype : '' })); setWizardStep('details'); }} disabled={!selectedSubtype} className={`w-full mt-10 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${selectedSubtype ? 'bg-slate-900 text-white shadow-xl hover:bg-black' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>তথ্য এন্ট্রি শুরু করুন <ArrowRightCircle size={24} /></button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b pb-5"><h3 className="text-2xl font-black flex items-center gap-4">{formData.paraType} | {formData.isMeeting ? formData.meetingType : 'বিএসআর'}<span className="text-xs font-black px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 uppercase tracking-widest shadow-sm">নতুন এন্ট্রি</span></h3>{onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all flex items-center gap-2"><X size={20} /> বাতিল</button>}</div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SearchableSelect label="মন্ত্রণালয়" groups={MINISTRIES_LIST} value={formData.ministryName} onChange={v => setFormData(f=>({...f, ministryName: v}))} required />
          <SearchableSelect label="এনটিটি" groups={formData.ministryName ? [{label: 'এনটিটি', options: MINISTRY_ENTITY_MAP[formData.ministryName]}] : []} value={formData.entityName} onChange={v => setFormData(f=>({...f, entityName: v}))} required />
          <SearchableSelect label="শাখা" groups={ENTITY_BRANCH_MAP[formData.entityName] ? [{label: 'শাখা', options: ENTITY_BRANCH_MAP[formData.entityName]}] : branchSuggestions} value={formData.branchName} onChange={v => setFormData(f=>({...f, branchName: v}))} required />
          <SearchableSelect label="নিরীক্ষা সাল" groups={AUDIT_YEARS_OPTIONS} value={formData.auditYear} onChange={v => setFormData(f=>({...f, auditYear: v}))} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">পত্র নং ও তারিখ</label><input type="text" className="w-full p-4 border border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-blue-500 shadow-sm" value={formData.letterNoDate} onChange={e => setFormData({...formData, letterNoDate: toBengaliDigits(e.target.value)})} placeholder="পত্র নং ও তারিখ" required /></div>
          <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">ডায়রি নং ও তারিখ</label><input type="text" className="w-full p-4 border border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-blue-500 shadow-sm" value={formData.workpaperNoDate} onChange={e => setFormData({...formData, workpaperNoDate: toBengaliDigits(e.target.value)})} placeholder="ডায়রি নং ও তারিখ" required /></div>
          <div className="space-y-2 lg:col-span-1"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">জারিপত্র নং ও তারিখ (টেক্সট)</label><input type="text" className="w-full p-4 border border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-blue-500 shadow-sm" value={formData.issueLetterNoDate} onChange={e => setFormData({...formData, issueLetterNoDate: toBengaliDigits(e.target.value)})} placeholder="জারিপত্র নং ও তারিখ" required /></div>
          <div className="space-y-2"><label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Calendar size={13} /> জারিপত্রের তারিখ</label><input type="date" className="w-full p-4 border border-blue-200 rounded-xl font-bold bg-white outline-none focus:border-blue-500 shadow-sm" value={formData.issueDateISO} onChange={e => setFormData({...formData, issueDateISO: e.target.value})} required /></div>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-100 p-6 rounded-2xl border border-slate-200"><div className="flex-1"><label className="block text-sm font-black text-slate-800 mb-2">অনুচ্ছেদ নং যোগ করুন</label><input type="text" className="w-full px-5 py-4 border border-slate-300 rounded-xl font-black text-slate-900 bg-white focus:border-blue-500 outline-none shadow-sm" value={bulkParaInput} onChange={e => setBulkParaInput(toBengaliDigits(e.target.value))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleBulkGenerate())} placeholder="৫, ৮, ১২... লিখে এন্টার দিন" /></div><button type="button" onClick={handleBulkGenerate} className="px-8 py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg h-[60px]"><Sparkles size={20} /> জেনারেট</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{paragraphs.map(p => (
            <div key={p.id} className="p-6 rounded-2xl relative transition-all group border-2 border-slate-200 bg-white hover:border-blue-500 hover:shadow-xl"><button type="button" onClick={() => setParagraphs(prev => prev.filter(x => x.id !== p.id))} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={20} /></button>
              <div className="flex gap-4 mb-6"><div className="flex items-center gap-2"><span className="text-[11px] font-black text-slate-400">নং</span><input type="text" className="w-20 h-10 border-2 border-slate-100 rounded-xl text-center font-black bg-slate-50 outline-none focus:border-blue-400 focus:bg-white" value={rawInputs[`${p.id}-paraNo`] || toBengaliDigits(p.paraNo)} onChange={e => handleNumericInputChange(p.id, 'paraNo', e.target.value)} /></div><button type="button" onClick={() => setParagraphs(prev => prev.map(x => x.id === p.id ? {...x, status: x.status === 'পূর্ণাঙ্গ' ? 'আংশিক' : 'পূর্ণাঙ্গ'} : x))} className={`h-10 px-4 rounded-xl text-[10px] font-black text-white shadow-md ${p.status === 'পূর্ণাঙ্গ' ? 'bg-emerald-600' : 'bg-red-600'}`}>{p.status}</button></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">জড়িত</label><input type="text" className="w-full h-11 px-3 border border-slate-200 rounded-xl text-center font-black bg-slate-50 outline-none focus:border-blue-400" value={rawInputs[`${p.id}-involvedAmount`] || toBengaliDigits(p.involvedAmount)} onChange={e => handleNumericInputChange(p.id, 'involvedAmount', e.target.value)} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pl-1">আদায়</label><input type="text" className="w-full h-11 px-3 border border-slate-200 rounded-xl text-center font-black bg-slate-50 outline-none focus:border-emerald-400" value={rawInputs[`${p.id}-recoveredAmount`] || toBengaliDigits(p.recoveredAmount)} onChange={e => handleNumericInputChange(p.id, 'recoveredAmount', e.target.value)} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-1">সমন্বয়</label><input type="text" className="w-full h-11 px-3 border border-slate-200 rounded-xl text-center font-black bg-slate-50 outline-none focus:border-indigo-400" value={rawInputs[`${p.id}-adjustedAmount`] || toBengaliDigits(p.adjustedAmount)} onChange={e => handleNumericInputChange(p.id, 'adjustedAmount', e.target.value)} /></div>
              </div>
            </div>
          ))}</div>
        </div>
        <button type="submit" disabled={paragraphs.length === 0} className={`w-full py-5 text-white text-xl font-black rounded-[2rem] transition-all shadow-2xl ${paragraphs.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>সংরক্ষণ করুন</button>
      </form>
    </div>
  );
};

// --- COMPONENTS (SettlementTable) ---
const SettlementTable = ({ entries, onDelete, onEdit, designMode }) => {
  const cycleInfo = useMemo(() => getCurrentCycle(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(cycleInfo.start, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(cycleInfo.end, 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const eDate = new Date(e.createdAt).toISOString().split('T')[0];
      const mDate = (!startDate || eDate >= startDate) && (!endDate || eDate <= endDate);
      const mSearch = searchTerm === '' || e.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || e.branchName.toLowerCase().includes(searchTerm.toLowerCase()) || e.issueLetterNoDate.toLowerCase().includes(searchTerm.toLowerCase());
      const eType = e.isMeeting ? e.meetingType : 'বিএসআর';
      const mType = filterType === '' || eType === filterType;
      return mDate && mSearch && mType;
    }).sort((a, b) => (b.issueDateISO || '0').localeCompare(a.issueDateISO || '0'));
  }, [entries, searchTerm, filterType, startDate, endDate]);

  const grandTotals = useMemo(() => filteredEntries.reduce((acc, e) => {
    acc.paraCount += e.paragraphs.filter(p => p.status === 'পূর্ণাঙ্গ').length;
    acc.inv += e.involvedAmount; acc.tRec += e.totalRec; acc.tAdj += e.totalAdj;
    acc.vR += e.vatRec; acc.vA += e.vatAdj; acc.iR += e.itRec; acc.iA += e.itAdj; acc.oR += e.othersRec; acc.oA += e.othersAdj;
    return acc;
  }, { paraCount: 0, inv: 0, tRec: 0, tAdj: 0, vR: 0, vA: 0, iR: 0, iA: 0, oR: 0, oA: 0 }), [filteredEntries]);

  const thBase = "border border-slate-300 px-0.5 font-black text-center text-slate-900 text-[10px] md:text-[11px] leading-tight align-middle h-[42px]";
  const tdBase = "border border-slate-300 px-0.5 py-1 text-center align-middle text-[11px] md:text-[12px] leading-tight transition-colors font-medium text-slate-700";
  const tdMoney = "border border-slate-300 px-0.5 py-1 text-center align-middle text-[11px] md:text-[12px] font-black text-slate-900";
  const grandLabelStyle = "p-1 text-center font-black text-white text-[11px] bg-slate-900";
  const grandValueStyle = "p-1 text-center font-black text-white text-[11px] bg-slate-900";

  let lastRenderedCycle = "";

  return (
    <div className="space-y-4 w-full">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-lg px-3 py-2 font-bold" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-lg px-3 py-2 font-bold" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-lg px-3 py-2 font-bold"><option value="">সকল ধরণ</option><option value="বিএসআর">বিএসআর (BSR)</option><option value="দ্বিপক্ষীয় সভা">দ্বিপক্ষীয় সভা</option><option value="ত্রিপক্ষীয় সভা">ত্রিপক্ষীয় সভা</option></select>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="অনুসন্ধান করুন..." className="bg-slate-50 border-2 border-slate-200 rounded-lg px-3 py-2 font-bold" />
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr><th rowSpan={2} className={thBase}>ক্র: নং</th><th colSpan={2} rowSpan={2} className={thBase}>বিস্তারিত বিবরণ</th><th colSpan={2} className={thBase}>উত্থাপিত আপত্তি</th><th rowSpan={2} className={thBase}>জড়িত টাকা</th><th rowSpan={2} className={thBase}>অনু:</th><th colSpan={2} className={thBase}>ভ্যাট</th><th colSpan={2} className={thBase}>আয়কর</th><th colSpan={2} className={thBase}>অন্যান্য</th><th colSpan={2} className={thBase}>মোট</th></tr>
            <tr><th className={thBase}>সংখ্যা</th><th className={thBase}>টাকা</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th></tr>
          </thead>
          <tbody>
            {filteredEntries.map((e, idx) => {
              const curC = e.cycleLabel || "অনির্ধারিত";
              const showH = curC !== lastRenderedCycle;
              if (showH) lastRenderedCycle = curC;
              return (
                <React.Fragment key={e.id}>
                  {showH && <tr className="bg-slate-100"><td colSpan={15} className="px-3 py-2 border font-black text-[12px]">সময় কাল: {toBengaliDigits(curC)}</td></tr>}
                  {e.paragraphs.map((p, pIdx) => (
                    <tr key={p.id} className="hover:bg-slate-50 group">
                      {pIdx === 0 && <><td rowSpan={e.paragraphs.length} className={tdBase + " font-black"}>{toBengaliDigits(idx + 1)}</td><td rowSpan={e.paragraphs.length} className={tdBase + " text-left text-[10px]"}>{e.entityName}<br/>{e.branchName}</td><td rowSpan={e.paragraphs.length} className={tdBase + " text-left text-[10px]"}>{e.issueLetterNoDate}</td><td rowSpan={e.paragraphs.length} className={tdBase}>{toBengaliDigits(e.manualRaisedCount || '')}</td><td rowSpan={e.paragraphs.length} className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(e.manualRaisedAmount || 0))}</td><td rowSpan={e.paragraphs.length} className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(e.involvedAmount))}</td></>}
                      <td className={tdBase}><div className="flex flex-col items-center leading-tight"><span className="font-black">{toBengaliDigits(p.paraNo)}</span><span className={`px-1 text-[8px] text-white font-black rounded ${p.status === 'পূর্ণাঙ্গ' ? 'bg-emerald-600' : 'bg-red-600'}`}>{p.status}</span></div></td>
                      <td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.category === 'ভ্যাট' ? p.recoveredAmount : 0))}</td><td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.category === 'ভ্যাট' ? p.adjustedAmount : 0))}</td>
                      <td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.category === 'আয়কর' ? p.recoveredAmount : 0))}</td><td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.category === 'আয়কর' ? p.adjustedAmount : 0))}</td>
                      <td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.category === 'অন্যান্য' ? p.recoveredAmount : 0))}</td><td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.category === 'অন্যান্য' ? p.adjustedAmount : 0))}</td>
                      <td className={tdMoney} data-type="amount">{toBengaliDigits(Math.round(p.recoveredAmount))}</td><td className={tdMoney + " relative"} data-type="amount">{toBengaliDigits(Math.round(p.adjustedAmount))}<div className="absolute right-0 top-0 hidden group-hover:flex gap-1 no-print p-0.5"><button onClick={() => onEdit(e)} className="p-1 text-blue-600 bg-white border rounded"><Pencil size={11} /></button><button onClick={() => onDelete(e.id)} className="p-1 text-red-500 bg-white border rounded"><Trash2 size={11} /></button></div></td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className={grandLabelStyle}>সর্বমোট (রিপোর্ট) | মীমাংসিত: {toBengaliDigits(grandTotals.paraCount)}</td><td className={grandValueStyle}>-</td><td className={grandValueStyle}>-</td><td className={grandValueStyle + " text-center text-amber-400"} data-type="amount">{toBengaliDigits(Math.round(grandTotals.inv))}</td><td className={grandValueStyle}>-</td><td className={grandValueStyle} data-type="amount">{toBengaliDigits(Math.round(grandTotals.vR))}</td><td className={grandValueStyle} data-type="amount">{toBengaliDigits(Math.round(grandTotals.vA))}</td><td className={grandValueStyle} data-type="amount">{toBengaliDigits(Math.round(grandTotals.iR))}</td><td className={grandValueStyle} data-type="amount">{toBengaliDigits(Math.round(grandTotals.iA))}</td><td className={grandValueStyle} data-type="amount">{toBengaliDigits(Math.round(grandTotals.oR))}</td><td className={grandValueStyle} data-type="amount">{toBengaliDigits(Math.round(grandTotals.oA))}</td><td className={grandValueStyle + " text-amber-400"} data-type="amount">{toBengaliDigits(Math.round(grandTotals.tRec))}</td><td className={grandValueStyle + " text-amber-400"} data-type="amount">{toBengaliDigits(Math.round(grandTotals.tAdj))}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// --- COMPONENTS (ReturnView) ---
const ReturnView = ({ entries, cycleLabel, prevStats, setPrevStats, onDemoLoad }) => {
  const [filterParaType, setFilterParaType] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupBranch, setSetupBranch] = useState(null);

  const ministryGroups = ['আর্থিক প্রতিষ্ঠান বিভাগ', 'পাট মন্ত্রণালয়', 'বস্ত্র মন্ত্রণালয়', 'শিল্প মন্ত্রণালয়', 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়', 'বাণিজ্য মন্ত্রণালয়'];

  const reportData = useMemo(() => {
    if (!filterParaType) return null;
    const branchPrevStats = filterParaType === 'এসএফআই' ? prevStats.entitiesSFI : prevStats.entitiesNonSFI;
    return ministryGroups.map(ministry => ({
      ministry,
      entityRows: (MINISTRY_ENTITY_MAP[ministry] || []).map(entity => {
        const entE = entries.filter(e => e.paraType === filterParaType && e.entityName === entity);
        const ePrev = branchPrevStats[entity] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        let curSC = 0, curSA = 0, curRC = 0, curRA = 0;
        entE.forEach(e => {
          e.paragraphs.forEach(p => { if (p.status === 'পূর্ণাঙ্গ') { curSC++; curSA += (p.recoveredAmount + p.adjustedAmount); } });
          if (e.manualRaisedCount) curRC += parseBengaliNumber(e.manualRaisedCount);
          if (e.manualRaisedAmount) curRA += e.manualRaisedAmount;
        });
        return { entity, currentRaisedCount: curRC, currentRaisedAmount: curRA, currentSettledCount: curSC, currentSettledAmount: curSA, prev: ePrev };
      })
    }));
  }, [entries, filterParaType, prevStats]);

  const grandTotals = useMemo(() => {
    if (!reportData) return null;
    return reportData.reduce((acc, m) => {
      m.entityRows.forEach(r => {
        acc.pUC += r.prev.unsettledCount; acc.pUA += r.prev.unsettledAmount; acc.cRC += (r.currentRaisedCount || 0); acc.cRA += (r.currentRaisedAmount || 0);
        acc.pSC += r.prev.settledCount; acc.pSA += r.prev.settledAmount; acc.cSC += r.currentSettledCount; acc.cSA += r.currentSettledAmount;
      });
      return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0 });
  }, [reportData]);

  if (!filterParaType) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-4xl mx-auto space-y-10 animate-in fade-in">
        <h2 className="text-3xl font-black text-slate-900">রিটার্ণ ম্যানেজমেন্ট ড্যাশবোর্ড</h2>
        <div className="grid grid-cols-2 gap-8 w-full">
          <button onClick={() => setFilterParaType('এসএফআই')} className="p-10 bg-white border-2 border-slate-100 rounded-3xl shadow hover:border-blue-600 flex flex-col items-center gap-4 transition-all"><Building2 size={48} className="text-blue-600" /><span className="text-2xl font-black">এসএফআই</span></button>
          <button onClick={() => setFilterParaType('নন এসএফআই')} className="p-10 bg-white border-2 border-slate-100 rounded-3xl shadow hover:border-indigo-600 flex flex-col items-center gap-4 transition-all"><Building size={48} className="text-indigo-600" /><span className="text-2xl font-black">নন এসএফআই</span></button>
        </div>
        <button onClick={onDemoLoad} className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black border border-emerald-100"><Sparkles /> টেস্ট ডাটা লোড করুন</button>
      </div>
    );
  }

  if (filterParaType && !selectedOption) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-10">
        <div className="flex items-center gap-4 w-full mb-4"><button onClick={() => setFilterParaType(null)} className="p-3 bg-white border rounded-2xl shadow-sm"><ChevronLeft/></button><h2 className="text-3xl font-black">{filterParaType} শাখা রিটার্ন</h2></div>
        {['মাসিক রিটার্ন: চিঠিপত্র সংক্রান্ত।', 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।', 'ত্রৈমাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।'].map((opt, i) => (
          <button key={i} onClick={() => setSelectedOption(opt)} className="w-full p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all"><span className="text-lg font-black text-slate-700">{opt}</span><ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500"/></button>
        ))}
      </div>
    );
  }

  if (selectedOption && reportData && grandTotals) {
    const thS = "border border-slate-300 px-0.5 py-1 font-black text-center text-[10px] md:text-[11px] bg-slate-100 text-slate-900 leading-tight align-middle h-[42px]";
    const tdS = "border border-slate-300 px-0.5 py-1 text-[11px] md:text-[12px] text-center font-black leading-tight bg-white h-[38px]";
    return (
      <div className="flex flex-col space-y-4 py-2 w-full animate-in fade-in duration-700">
        <button onClick={() => setSelectedOption(null)} className="w-fit p-3 bg-white border rounded-full shadow-sm mb-2 no-print"><ChevronLeft/></button>
        <div className="table-container">
          <table>
            <thead>
              <tr><th rowSpan={2} className={thS}>মন্ত্রণালয়</th><th rowSpan={2} className={thS}>সংস্থা</th><th colSpan={2} className={thS}>প্রারম্ভিক অমীমাংসিত</th><th colSpan={2} className={thS}>বর্তমান উত্থাপিত</th><th colSpan={2} className={thS}>মোট অমীমাংসিত</th><th colSpan={2} className={thS}>প্রারম্ভিক মীমাংসিত</th><th colSpan={2} className={thS}>চলতি মীমাংসিত</th><th colSpan={2} className={thS}>মোট মীমাংসিত</th><th colSpan={2} className={thS}>সর্বমোট অমীমাংসিত</th></tr>
              <tr><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th></tr>
            </thead>
            <tbody>
              {reportData.map(m => m.entityRows.map((r, ri) => {
                const tUC = r.prev.unsettledCount + r.currentRaisedCount;
                const tUA = r.prev.unsettledAmount + r.currentRaisedAmount;
                const tSC = r.prev.settledCount + r.currentSettledCount;
                const tSA = r.prev.settledAmount + r.currentSettledAmount;
                return (
                  <tr key={r.entity}>
                    {ri === 0 && <td rowSpan={m.entityRows.length} className={tdS + " bg-slate-50"}>{m.ministry}</td>}
                    <td className={tdS + " text-left"}>{r.entity}</td>
                    <td className={tdS}>{toBengaliDigits(r.prev.unsettledCount)}</td><td className={tdS + " text-center"} data-type="amount">{toBengaliDigits(Math.round(r.prev.unsettledAmount))}</td>
                    <td className={tdS}>{toBengaliDigits(r.currentRaisedCount)}</td><td className={tdS + " text-center"} data-type="amount">{toBengaliDigits(Math.round(r.currentRaisedAmount))}</td>
                    <td className={tdS}>{toBengaliDigits(tUC)}</td><td className={tdS + " text-center"} data-type="amount">{toBengaliDigits(Math.round(tUA))}</td>
                    <td className={tdS}>{toBengaliDigits(r.prev.settledCount)}</td><td className={tdS + " text-center"} data-type="amount">{toBengaliDigits(Math.round(r.prev.settledAmount))}</td>
                    <td className={tdS}>{toBengaliDigits(r.currentSettledCount)}</td><td className={tdS + " text-center"} data-type="amount">{toBengaliDigits(Math.round(r.currentSettledAmount))}</td>
                    <td className={tdS}>{toBengaliDigits(tSC)}</td><td className={tdS + " text-center"} data-type="amount">{toBengaliDigits(Math.round(tSA))}</td>
                    <td className={tdS + " bg-amber-50"}>{toBengaliDigits(tUC - tSC)}</td><td className={tdS + " text-center bg-amber-50"} data-type="amount">{toBengaliDigits(Math.round(tUA - tSA))}</td>
                  </tr>
                );
              }))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black"><td colSpan={2} className="p-2 text-center text-[11px]">সর্বমোট (শাখা)</td><td className="p-2 text-center text-[11px]">{toBengaliDigits(grandTotals.pUC)}</td><td className="p-2 text-center text-[11px]" data-type="amount">{toBengaliDigits(Math.round(grandTotals.pUA))}</td><td className="p-2 text-center text-[11px]">{toBengaliDigits(grandTotals.cRC)}</td><td className="p-2 text-center text-[11px]" data-type="amount">{toBengaliDigits(Math.round(grandTotals.cRA))}</td><td className="p-2 text-center text-[11px]">{toBengaliDigits(grandTotals.pUC + grandTotals.cRC)}</td><td className="p-2 text-center text-[11px]" data-type="amount">{toBengaliDigits(Math.round(grandTotals.pUA + grandTotals.cRA))}</td><td className="p-2 text-center text-[11px]">{toBengaliDigits(grandTotals.pSC)}</td><td className="p-2 text-center text-[11px]" data-type="amount">{toBengaliDigits(Math.round(grandTotals.pSA))}</td><td className="p-2 text-center text-[11px]">{toBengaliDigits(grandTotals.cSC)}</td><td className="p-2 text-center text-[11px]" data-type="amount">{toBengaliDigits(Math.round(grandTotals.cSA))}</td><td className="p-2 text-center text-[11px]">{toBengaliDigits(grandTotals.pSC + grandTotals.cSC)}</td><td className="p-2 text-center text-[11px]" data-type="amount">{toBengaliDigits(Math.round(grandTotals.pSA + grandTotals.cSA))}</td><td className="p-2 text-center text-[11px] bg-amber-600">{(grandTotals.pUC + grandTotals.cRC) - (grandTotals.pSC + grandTotals.cSC)}</td><td className="p-2 text-center text-[11px] bg-amber-600" data-type="amount">{toBengaliDigits(Math.round((grandTotals.pUA + grandTotals.cRA) - (grandTotals.pSA + grandTotals.cSA)))}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('landing');
  const [designMode, setDesignMode] = useState('classic');
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [prevStats, setPrevStats] = useState({ entitiesSFI: {}, entitiesNonSFI: {} });

  useEffect(() => {
    try {
      const s = localStorage.getItem('ledger_settlement_v10_stable'); if (s) setEntries(JSON.parse(s));
      const p = localStorage.getItem('ledger_prev_stats_v1'); if (p) setPrevStats(JSON.parse(p));
    } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('ledger_settlement_v10_stable', JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem('ledger_prev_stats_v1', JSON.stringify(prevStats)); }, [prevStats]);

  const cycleInfo = useMemo(() => getCurrentCycle(), []);
  const cycleLabelBN = toBengaliDigits(cycleInfo.label);

  const handleDemoLoad = () => {
    const demo = [{ id: 'id-' + Math.random(), ministryName: 'আর্থিক প্রতিষ্ঠান বিভাগ', entityName: 'সোনালী ব্যাংক পিএলসি', branchName: 'খুলনা কর্পোরেট শাখা', auditYear: '২০২৩-২৪', letterNoDate: 'পত্র-১০১', workpaperNoDate: 'ডায়রি-২০২', issueLetterNoDate: 'জারি-৩০৩', issueDateISO: new Date().toISOString().split('T')[0], paraType: 'এসএফআই', paragraphs: [{ id: 'p-1', paraNo: '৫', status: 'পূর্ণাঙ্গ', involvedAmount: 500000, recoveredAmount: 200000, adjustedAmount: 300000, category: 'ভ্যাট' }], involvedAmount: 500000, vatRec: 200000, vatAdj: 300000, itRec: 0, itAdj: 0, othersRec: 0, othersAdj: 0, totalRec: 200000, totalAdj: 300000, createdAt: new Date().toISOString(), cycleLabel: cycleInfo.label }];
    setEntries(p => [...p, ...demo]); setActiveTab('register');
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-['Hind_Siliguri']">
      <aside className={`w-64 bg-slate-900 h-screen text-slate-300 flex flex-col no-print ${!isSidebarVisible ? 'hidden' : ''}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between">
          <div className="flex items-center gap-3"><LayoutDashboard size={20} className="text-blue-600"/><span className="font-black text-white">অডিট রেজিস্টার</span></div>
          <button onClick={() => setIsSidebarVisible(false)}><ChevronLeft size={20}/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[{i: 'landing', l: 'হোম', ic: Home}, {i: 'entry', l: 'নতুন এন্ট্রি', ic: FilePlus2}, {i: 'register', l: 'রেজিস্টার', ic: ListFilter}, {i: 'return', l: 'রিটার্ণ ও সারাংশ', ic: PieChart}].map(m => (
            <button key={m.i} onClick={() => setActiveTab(m.i)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${activeTab === m.i ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><m.ic size={20}/>{m.l}</button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 h-full overflow-y-auto bg-slate-50">
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <header className="flex justify-between items-center mb-8 pb-4 border-b no-print">
            <div className="flex items-center gap-4">
              {!isSidebarVisible && <button onClick={() => setIsSidebarVisible(true)} className="p-2 bg-white border rounded shadow-sm"><Menu/></button>}
              <button onClick={() => setActiveTab('landing')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-black text-xs"><Home size={14}/> হোম</button>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-3"><Calendar size={18} className="text-blue-600"/><span className="text-sm font-bold">{cycleLabelBN}</span></div>
          </header>
          {activeTab === 'landing' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <h1 className="text-4xl font-black mb-4">মীমাংসা রেজিস্টার <span className="text-blue-500">মডিউল</span></h1>
                <p className="text-slate-400 mb-8 max-w-xl">বাণিজ্যিক অডিট অধিদপ্তর, খুলনা আঞ্চলিক কার্যালয়ের জন্য তৈরি একটি ডিজিটাল নিষ্পত্তি রেজিস্টার এবং রিপোর্টিং সিস্টেম।</p>
                <button onClick={() => setActiveTab('entry')} className="px-8 py-4 bg-blue-600 rounded-xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all">কাজ শুরু করুন <ArrowRight/></button>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {[{l: 'মোট অনুচ্ছেদ', v: toBengaliDigits(entries.reduce((a,e)=>a+e.paragraphs.length, 0))+' টি', ic: ListFilter, c: 'text-blue-600', bg: 'bg-blue-50'}, {l: 'জড়িত টাকা', v: formatBengaliAmount(entries.reduce((a,e)=>a+e.involvedAmount, 0)), ic: TrendingUp, c: 'text-slate-600', bg: 'bg-slate-50'}, {l: 'মোট আদায়', v: formatBengaliAmount(entries.reduce((a,e)=>a+e.totalRec, 0)), ic: Coins, c: 'text-emerald-600', bg: 'bg-emerald-50'}, {l: 'মোট সমন্বয়', v: formatBengaliAmount(entries.reduce((a,e)=>a+e.totalAdj, 0)), ic: CreditCard, c: 'text-indigo-600', bg: 'bg-indigo-50'}].map((s,i)=>(
                  <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center"><div className={`w-12 h-12 ${s.bg} ${s.c} rounded-full flex items-center justify-center mb-4`}><s.ic size={24}/></div><p className="text-xs font-black text-slate-400 uppercase">{s.l}</p><p className={`text-xl font-black ${s.c}`}>{s.v}</p></div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'entry' && <SettlementForm onAdd={(d) => { if(editingEntry) { setEntries(p=>p.map(e=>e.id===editingEntry.id?{...e,...d}:e)); setEditingEntry(null); } else { setEntries(p=>[...p,{...d, id: 'id-'+Date.now(), createdAt: new Date().toISOString()}]); } setActiveTab('register'); }} nextSl={entries.length+1} branchSuggestions={[]} initialEntry={editingEntry} onCancel={() => {setEditingEntry(null); setActiveTab('register');}} />}
          {activeTab === 'register' && <SettlementTable entries={entries} onDelete={(id)=>setEntries(p=>p.filter(e=>e.id!==id))} onEdit={(e)=>{setEditingEntry(e); setActiveTab('entry');}} designMode={designMode} />}
          {activeTab === 'return' && <ReturnView entries={entries} cycleLabel={cycleLabelBN} prevStats={prevStats} setPrevStats={setPrevStats} onDemoLoad={handleDemoLoad} />}
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);