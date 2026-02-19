import { useState, useMemo, useRef, useEffect } from 'react';
import React from 'react';
import { SettlementEntry } from '../types.ts';
import { Trash2, Pencil, Calendar, Printer, CheckCircle2, ChevronDown, ChevronUp, FileText, Fingerprint, Banknote, ListOrdered, Archive, MapPin, CalendarDays, Sparkles, ClipboardList, Filter, X, Search, LayoutGrid, CalendarSearch, Check, ShieldCheck, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils.ts';
import { OFFICE_HEADER } from '../constants.ts';
import { getCurrentCycle, getCycleForDate } from '../utils/cycleHelper.ts';
import { format, addMonths } from 'date-fns';

interface SettlementTableProps {
  entries: SettlementEntry[];
  onDelete: (id: string, paraId?: string) => void;
  onEdit: (entry: SettlementEntry) => void;
  isLayoutEditable?: boolean;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  isAdminView?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAdmin?: boolean;
}

const SettlementTable: React.FC<SettlementTableProps> = ({ 
  entries, onDelete, onEdit, isLayoutEditable, showFilters, setShowFilters,
  isAdminView = false, onApprove, onReject, isAdmin = false 
}) => {
  const cycleInfo = useMemo(() => getCurrentCycle(), []);
  const tableRef = useRef<HTMLTableElement>(null);
  const cycleDropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterParaType, setFilterParaType] = useState(''); 
  const [filterType, setFilterType] = useState('');
  const [selectedCycleDate, setSelectedCycleDate] = useState<Date | null>(null);
  
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
        if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(event.target as Node)) setIsCycleDropdownOpen(false);
        if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) setIsBranchDropdownOpen(false);
        if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) setIsTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const cycleOptions = useMemo(() => {
    const options = [];
    const banglaMonths: Record<string, string> = {
      'January': 'জানুয়ারি', 'February': 'ফেব্রুয়ারি', 'March': 'মার্চ', 'April': 'এপ্রিল',
      'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
      'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর'
    };
    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const refDate = addMonths(today, -i);
      const firstOfTargetMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      const cycle = getCycleForDate(firstOfTargetMonth);
      const monthNameEng = format(firstOfTargetMonth, 'MMMM');
      const yearEng = format(firstOfTargetMonth, 'yyyy');
      const label = `${banglaMonths[monthNameEng]} ${toBengaliDigits(yearEng)} সাইকেল`;
      options.push({ date: firstOfTargetMonth, label, cycleLabel: cycle.label });
    }
    return options;
  }, []);

  const activeCycle = useMemo(() => {
    if (!selectedCycleDate) return null;
    return getCycleForDate(selectedCycleDate);
  }, [selectedCycleDate]);

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const hasRaisedCount = entry.manualRaisedCount !== null && entry.manualRaisedCount !== "" && entry.manualRaisedCount !== "0" && entry.manualRaisedCount !== "০";
      const hasRaisedAmount = entry.manualRaisedAmount !== null && entry.manualRaisedAmount !== 0;
      const hasMeaningfulContent = (entry.paragraphs && entry.paragraphs.length > 0) || (entry.isMeeting && (entry.meetingUnsettledAmount || 0) > 0) || hasRaisedCount || hasRaisedAmount;
      if (!hasMeaningfulContent) return false;

      const entryDate = entry.issueDateISO || new Date(entry.createdAt).toISOString().split('T')[0];
      
      // IMPROVED FILTERING LOGIC: Checks both Date Range AND Cycle Label
      let matchCycle = !activeCycle;
      if (activeCycle) {
        const matchByLabel = entry.cycleLabel && robustNormalize(toEnglishDigits(entry.cycleLabel)) === robustNormalize(toEnglishDigits(activeCycle.label));
        const matchByDate = entryDate >= format(activeCycle.start, 'yyyy-MM-dd') && entryDate <= format(activeCycle.end, 'yyyy-MM-dd');
        matchCycle = matchByLabel || matchByDate;
      }
      
      const matchSearch = searchTerm === '' || 
        (entry.entityName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (entry.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (entry.issueLetterNoDate || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const entryType = entry.isMeeting ? entry.meetingType : 'বিএসআর';
      const matchType = filterType === '' || entryType === filterType;
      const matchParaType = filterParaType === '' || entry.paraType === filterParaType;
      
      return matchCycle && matchSearch && matchType && matchParaType;
    }).sort((a, b) => {
      const timeB = b.issueDateISO ? new Date(b.issueDateISO).getTime() : 0;
      const timeA = a.issueDateISO ? new Date(a.issueDateISO).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [entries, searchTerm, filterParaType, filterType, activeCycle]);

  const grandTotals = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const paras = entry.paragraphs || [];
      acc.paraCount += paras.filter(p => p.status === 'পূর্ণাঙ্গ').length;
      acc.inv += paras.reduce((sum, p) => sum + (p.involvedAmount || 0), 0);
      const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
      const rCount = (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") ? parseBengaliNumber(rCountRaw) : 0;
      const rAmount = (entry.manualRaisedAmount !== null && entry.manualRaisedAmount !== undefined && entry.manualRaisedAmount !== 0) ? Number(entry.manualRaisedAmount) : 0;
      acc.raisedCount += rCount; acc.raisedAmount += rAmount;
      acc.vRec += (entry.vatRec || 0); acc.vAdj += (entry.vatAdj || 0);
      acc.iRec += (entry.itRec || 0); acc.iAdj += (entry.itAdj || 0);
      acc.oRec += (entry.othersRec || 0); acc.oAdj += (entry.othersAdj || 0);
      acc.tRec += (entry.totalRec || 0); acc.tAdj += (entry.totalAdj || 0);
      return acc;
    }, { paraCount: 0, inv: 0, raisedCount: 0, raisedAmount: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, tRec: 0, tAdj: 0 });
  }, [filteredEntries]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedEntries);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedEntries(next);
  };

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation(); navigator.clipboard.writeText(id);
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    };
    return <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded border border-white/30 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>{copied ? 'COPIED!' : `#${id}`}</span>;
  };

  const formatIssueInfoForDisplay = (info: string) => info ? info.replace(/জারিপত্র নং-/g, '').replace(/জারিপত্রের তারিখ-/g, '').trim() + " খ্রি:" : "";
  const thBase = "border border-slate-300 px-1 py-1 font-black text-center text-slate-900 text-[10px] md:text-[11px] leading-tight align-middle h-full bg-slate-200 relative";
  const tdBase = "border border-slate-300 px-0.5 py-1.5 text-center align-middle text-[10px] leading-tight font-bold text-slate-900 relative";
  const tdMoney = "border border-slate-300 px-0.5 py-1 text-center align-middle text-[10px] font-black text-slate-950 relative";

  const renderMetadataGrid = (entry: SettlementEntry) => {
    const paras = entry.paragraphs || [];
    const fullMoney = paras.filter(p => p.status === 'পূর্ণাঙ্গ').reduce((s, p) => s + p.involvedAmount, 0);
    const partialMoney = paras.filter(p => p.status === 'আংশিক').reduce((s, p) => s + p.involvedAmount, 0);
    return (
      <div className="bg-slate-50/80 p-6 border-x border-b border-slate-200 rounded-b-xl animate-in slide-in-from-top-4 duration-500 shadow-inner">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '১. শাখা ধরণ', value: entry.paraType, icon: Fingerprint, col: 'sky' },
            { label: '২. চিঠির ধরণ', value: entry.isMeeting ? entry.meetingType : 'বিএসআর', icon: FileText, col: 'emerald' },
            { label: '৩. মন্ত্রণালয়', value: entry.ministryName, icon: MapPin, col: 'amber' },
            { label: '৪. সংস্থা', value: entry.entityName, icon: FileText, col: 'purple' },
            { label: '৫. বিস্তারিত শাখা', value: entry.branchName, icon: MapPin, col: 'sky' },
            { label: '৬. নিরীক্ষা সাল', value: toBengaliDigits(entry.auditYear), icon: Calendar, col: 'emerald' },
            { label: '৭. পত্র নং ও তারিখ', value: entry.letterNoDate, icon: FileText, col: 'amber' },
            { label: '৮. কার্যপত্র নং', value: entry.meetingWorkpaper || 'N/A', icon: FileText, col: 'purple' },
            { label: '৯. কার্যবিবরণী নং', value: entry.minutesNoDate || 'N/A', icon: FileText, col: 'sky' },
            { label: '১০. ডায়েরি নং ও তারিখ', value: entry.workpaperNoDate, icon: FileText, col: 'emerald' },
            { label: '১১. জারিপত্র নং', value: formatIssueInfoForDisplay(entry.issueLetterNoDate), icon: FileText, col: 'amber' },
            { label: '১২. আর্কাইভ নং', value: entry.archiveNo || 'N/A', icon: Archive, col: 'purple' },
            { label: '১৩. প্রেরিত অনুচ্ছেদ', value: toBengaliDigits(entry.meetingSentParaCount || '০'), icon: ListOrdered, col: 'sky' },
            { label: '১৪. মীমাংসিত অনুচ্ছেদ', value: toBengaliDigits(entry.meetingSettledParaCount || '০'), icon: CheckCircle2, col: 'emerald' },
            { label: '১৫. অমীমাংসিত সংখ্যা', value: toBengaliDigits(entry.meetingUnsettledParas || '০'), icon: ListOrdered, col: 'amber' },
            { label: '১৬. অমীমাংসিত টাকা', value: toBengaliDigits(entry.meetingUnsettledAmount ?? 0), icon: Banknote, col: 'purple' },
            { label: '১৭. পূর্ণাঙ্গ আদায়', value: toBengaliDigits(Math.round(fullMoney)), icon: CheckCircle2, col: 'sky' },
            { label: '১৮. আংশিক আদায়', value: toBengaliDigits(Math.round(partialMoney)), icon: CheckCircle2, col: 'emerald' },
            { label: '১৯. সভার তারিখ', value: toBengaliDigits(entry.meetingDate || 'N/A'), icon: Calendar, col: 'amber' },
            { label: '২০. মন্তব্য', value: entry.remarks || 'N/A', icon: MessageSquare, col: 'purple' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-${item.col}-50 text-${item.col}-600`}><item.icon size={14} /></div>
              <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</p><p className="text-[11px] font-bold text-slate-900 leading-tight">{item.value}</p></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  let lastRenderedCycle = "";
  const footerTdCls = "p-1 text-center font-black text-[10px] bg-slate-900 border border-slate-700";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[48px] bg-white border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]' : 'border-slate-300 shadow-sm hover:border-slate-400'}`;

  return (
    <div id="table-register-container" className="w-full relative animate-premium-page">
      <IDBadge id="view-register-table" />
      {!isAdminView && (
        <div className="relative mb-4 no-print text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-50 rounded-[1.2rem] text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100 mx-auto relative">
            <ClipboardList size={30} strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm">মীমাংসা রেজিস্টার</h2>
          <div className="inline-flex items-center gap-4 px-8 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold text-[14px] shadow-lg border-2 border-emerald-400">
            <span>চলমান সাইকেল:</span><span className="text-emerald-50 tracking-tight">{toBengaliDigits(cycleInfo.label)}</span>
          </div>
        </div>
      )}

      {showFilters && !isAdminView && (
        <div id="register-filters" className="!bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 no-print mb-6 relative z-[1000] isolate">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5" ref={cycleDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">সময়কাল নির্বাচন (সাইকেল)</label>
              <div onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} className={customDropdownCls(isCycleDropdownOpen)}>
                <CalendarDays size={18} className="text-blue-600" />
                <span className="font-bold text-[13px] text-slate-900 truncate">{!selectedCycleDate ? 'সকল সাইকেল' : (cycleOptions.find(o => o.cycleLabel === activeCycle?.label)?.label || toBengaliDigits(activeCycle?.label || ''))}</span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform ${isCycleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                {isCycleDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000] overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white">
                      <div className="p-2 space-y-1">
                        <div onClick={(e) => { e.stopPropagation(); setSelectedCycleDate(null); setIsCycleDropdownOpen(false); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${!selectedCycleDate ? '!bg-blue-600 !text-white' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}>সকল সাইকেল</div>
                        {cycleOptions.map((opt, idx) => (<div key={idx} onClick={(e) => { e.stopPropagation(); setSelectedCycleDate(opt.date); setIsCycleDropdownOpen(false); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${opt.cycleLabel === activeCycle?.label ? '!bg-blue-600 !text-white' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}>{opt.label}</div>))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5" ref={branchDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">শাখা</label>
              <div onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} className={customDropdownCls(isBranchDropdownOpen)}>
                <LayoutGrid size={16} className="text-blue-600" />
                <span className="font-bold text-[13px] text-slate-900 truncate">{filterParaType === '' ? 'সকল শাখা' : filterParaType}</span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform ${isBranchDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                {isBranchDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000]">
                    <div className="p-2 space-y-1">
                      {[{v: '', l: 'সকল শাখা'}, {v: 'এসএফআই', l: 'এসএফআই'}, {v: 'নন এসএফআই', l: 'নন এসএফআই'}].map(o => (<div key={o.v} onClick={(e) => { e.stopPropagation(); setFilterParaType(o.v); setIsBranchDropdownOpen(false); }} className={`flex items-center justify-center px-4 py-2.5 rounded-xl cursor-pointer transition-all ${filterParaType === o.v ? '!bg-blue-600 !text-white' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}>{o.l}</div>))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5" ref={typeDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">চিঠির ধরণ</label>
              <div onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className={customDropdownCls(isTypeDropdownOpen)}>
                <FileText size={16} className="text-blue-600" />
                <span className="font-bold text-[13px] text-slate-900 truncate">{filterType === '' ? 'সকল ধরণ' : filterType}</span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform ${isTypeDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                {isTypeDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000]">
                    <div className="p-2 space-y-1">
                      {[{v: '', l: 'সকল ধরণ'}, {v: 'বিএসআর', l: 'বিএসআর'}, {v: 'ত্রিপক্ষীয় সভা', l: 'ত্রিপক্ষীয় সভা'}, {v: 'দ্বিপক্ষীয় সভা', l: 'দ্বিপক্ষীয় সভা'}].map(o => (<div key={o.v} onClick={(e) => { e.stopPropagation(); setFilterType(o.v); setIsTypeDropdownOpen(false); }} className={`flex items-center justify-center px-4 py-2.5 rounded-xl cursor-pointer transition-all ${filterType === o.v ? '!bg-blue-600 !text-white' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}>{o.l}</div>))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">অনুসন্ধান</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="নাম বা নম্বর দিয়ে খুঁজুন..." className="w-full pl-9 pr-4 h-[48px] bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-[13px] outline-none focus:border-blue-600 shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container border border-slate-300 rounded-sm overflow-visible relative">
        <table id="table-main-ledger" ref={tableRef} className="w-full border-separate">
          <colgroup><col className="w-[30px]" /><col className="w-[170px]" /><col className="w-[45px]" /><col className="w-[65px]" /><col className="w-[40px]" /><col className="w-[65px]" /><col className="w-[50px]" /><col className="w-[50px]" /><col className="w-[50px]" /><col className="w-[50px]" /><col className="w-[50px]" /><col className="w-[50px]" /><col className="w-[50px]" /><col className="w-[50px]" /></colgroup>
          <thead>
            <tr className="h-[42px]"><th rowSpan={2} className={thBase}>ক্র: নং</th><th rowSpan={2} className={thBase}>বিস্তারিত বিবরণ (২০ ফিল্ড দেখতে ক্লিক)</th><th rowSpan={2} className={thBase}>অনু: নং</th><th rowSpan={2} className={thBase}>জড়িত টাকা</th><th colSpan={2} className={thBase}>উত্থাপিত আপত্তি</th><th colSpan={2} className={thBase}>ভ্যাট</th><th colSpan={2} className={thBase}>আয়কর</th><th colSpan={2} className={thBase}>অন্যান্য</th><th colSpan={2} className={thBase}>মোট মীমাংসিত</th></tr>
            <tr className="h-[38px]"><th className={thBase}>সংখ্যা</th><th className={thBase}>টাকা</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th><th className={thBase}>আদায়</th><th className={thBase}>সমন্বয়</th></tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, idx) => {
              const currentCycle = entry.cycleLabel || "অনির্ধারিত";
              const showCycleHeader = currentCycle !== lastRenderedCycle;
              if (showCycleHeader) lastRenderedCycle = currentCycle;
              const isExpanded = expandedEntries.has(entry.id);
              const paras = entry.paragraphs || [];
              const entrySettledCount = paras.filter(p => p.status === 'পূর্ণাঙ্গ').length;
              const entryInvolvedAmount = paras.reduce((sum, p) => sum + (p.involvedAmount || 0), 0);
              const mRaisedCountRaw = entry.manualRaisedCount?.toString().trim() || "";
              const mRaisedCount = (mRaisedCountRaw === "" || mRaisedCountRaw === "0" || mRaisedCountRaw === "০") ? "০" : toBengaliDigits(mRaisedCountRaw);
              const mRaisedAmount = (entry.manualRaisedAmount !== null && entry.manualRaisedAmount !== undefined && entry.manualRaisedAmount !== 0) ? entry.manualRaisedAmount : 0;
              return (
                <React.Fragment key={entry.id}>
                  {showCycleHeader && (
                    <tr className="bg-slate-100/80 border-y border-slate-300 relative">
                      <td colSpan={14} className="px-4 py-3 border border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md"><CalendarDays size={18} /></div>
                          <span className="font-black text-[13px] text-slate-800 tracking-tight uppercase">সময়কাল: <span className="text-blue-700 font-black">{toBengaliDigits(currentCycle)}</span></span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {paras.length > 0 ? paras.map((p, pIdx) => (
                    <tr key={p.id} className="transition-colors group hover:bg-blue-50/30">
                      {pIdx === 0 && (
                        <><td rowSpan={paras.length} className={tdBase + " font-black bg-white"}>{toBengaliDigits(idx + 1)}</td><td rowSpan={paras.length} onClick={() => toggleExpand(entry.id)} className={tdBase + " cursor-pointer bg-white group-hover:bg-blue-50/50 transition-all text-left p-3"}><div className="flex items-start justify-between flex-1 space-y-1 text-left min-w-0"><div className="truncate w-full"><p className="text-[10px] leading-tight"><span className="font-black text-emerald-700">সংস্থা:</span> <span className="font-bold text-slate-900">{entry.entityName}</span></p><p className="text-[10px] leading-tight"><span className="font-black text-emerald-700">শাখা:</span> <span className="font-bold text-slate-900">{entry.branchName}</span></p><p className="text-[10px] leading-tight"><span className="font-black text-emerald-700">জারিপত্র:</span> <span className="font-bold text-slate-900">{formatIssueInfoForDisplay(entry.issueLetterNoDate)}</span></p></div>{isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}</div></td></>
                      )}
                      <td className={tdBase}><span className="font-bold">{toBengaliDigits(p.paraNo)}</span><br/><span className={`px-1 text-[8px] text-white font-black rounded ${p.status === 'পূর্ণাঙ্গ' ? 'bg-emerald-600' : 'bg-red-600'}`}>{p.status}</span></td>
                      <td className={tdMoney}>{toBengaliDigits(Math.round(p.involvedAmount))}</td>
                      {pIdx === 0 && (<><td rowSpan={paras.length} className={tdBase + " text-blue-700 bg-white"}>{mRaisedCount}</td><td rowSpan={paras.length} className={tdMoney + " text-blue-800 bg-white"}>{toBengaliDigits(Math.round(mRaisedAmount))}</td></>)}
                      <td className={tdMoney}>{toBengaliDigits(Math.round(p.category === 'ভ্যাট' ? p.recoveredAmount : 0))}</td><td className={tdMoney}>{toBengaliDigits(Math.round(p.category === 'ভ্যাট' ? p.adjustedAmount : 0))}</td>
                      <td className={tdMoney}>{toBengaliDigits(Math.round(p.category === 'আয়কর' ? p.recoveredAmount : 0))}</td><td className={tdMoney}>{toBengaliDigits(Math.round(p.category === 'আয়কর' ? p.adjustedAmount : 0))}</td>
                      <td className={tdMoney}>{toBengaliDigits(Math.round(p.category === 'অন্যান্য' ? p.recoveredAmount : 0))}</td><td className={tdMoney}>{toBengaliDigits(Math.round(p.category === 'অন্যান্য' ? p.adjustedAmount : 0))}</td>
                      <td className={tdMoney}>{toBengaliDigits(Math.round(p.recoveredAmount))}</td>
                      <td className={tdMoney + " relative"}>{toBengaliDigits(Math.round(p.adjustedAmount))}{!isAdminView && isAdmin && (<div className="absolute right-0 bottom-0.5 hidden group-hover:flex gap-0.5 no-print p-0.5"><button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="p-1 text-blue-600 bg-white border rounded shadow-sm"><Pencil size={11}/></button><button onClick={(e) => { e.stopPropagation(); if (window.confirm("আপনি কি নিশ্চিত?")) onDelete(entry.id, p.id); }} className="p-1 text-red-600 bg-white border rounded shadow-sm ml-0.5"><Trash2 size={11}/></button></div>)}</td>
                    </tr>
                  )) : (
                    <tr className="hover:bg-blue-50/30 group">
                      <td className={tdBase + " font-black bg-white"}>{toBengaliDigits(idx + 1)}</td>
                      <td onClick={() => toggleExpand(entry.id)} className={tdBase + " cursor-pointer bg-white group-hover:bg-blue-50/50 p-3 text-left"}><div className="flex items-start justify-between min-w-0 flex-1"><div className="truncate"><p className="text-[10px] leading-tight font-black text-red-600 underline">উত্থাপিত (কোন অনুচ্ছেদ নেই)</p><p className="text-[10px]"><span className="font-black">সংস্থা:</span> {entry.entityName}</p></div>{isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}</div></td>
                      <td className={tdBase}>-</td><td className={tdMoney}>০</td><td className={tdBase + " text-blue-700"}>{mRaisedCount}</td><td className={tdMoney + " text-blue-800"}>{toBengaliDigits(Math.round(mRaisedAmount))}</td>
                      <td className={tdMoney}>০</td><td className={tdMoney}>০</td><td className={tdMoney}>০</td><td className={tdMoney}>০</td><td className={tdMoney}>০</td><td className={tdMoney}>০</td><td className={tdMoney}>০</td>
                      <td className={tdMoney + " relative"}>০{!isAdminView && isAdmin && (<div className="absolute right-0 bottom-0.5 hidden group-hover:flex gap-0.5 no-print p-0.5"><button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="p-1 text-blue-600 bg-white border rounded shadow-sm"><Pencil size={11}/></button><button onClick={(e) => { e.stopPropagation(); if (window.confirm("নিশ্চিত?")) onDelete(entry.id); }} className="p-1 text-red-600 bg-white border rounded shadow-sm ml-0.5"><Trash2 size={11}/></button></div>)}</td>
                    </tr>
                  )}
                  <tr className="bg-blue-50/60 font-black border-t border-slate-300 h-[38px]"><td colSpan={2} className="px-4 text-left italic text-[10px] text-blue-900 border border-slate-300">মোট মিমাংসিত: <span className="text-emerald-700">{toBengaliDigits(entrySettledCount)} টি</span> | মোট জড়িত: <span className="text-blue-700">{toBengaliDigits(Math.round(entryInvolvedAmount))}</span></td><td className="text-center text-[10px] border border-slate-300 bg-emerald-50/30">{toBengaliDigits(entrySettledCount)}</td><td className="text-center text-[10px] border border-slate-300 bg-blue-50/30">{toBengaliDigits(Math.round(entryInvolvedAmount))}</td><td className="text-center text-[10px] border border-slate-300">{mRaisedCount}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(mRaisedAmount))}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(entry.vatRec || 0))}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(entry.vatAdj || 0))}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(entry.itRec || 0))}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(entry.itAdj || 0))}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(entry.othersRec || 0))}</td><td className="text-center text-[10px] border border-slate-300">{toBengaliDigits(Math.round(entry.othersAdj || 0))}</td><td className="text-center text-[10px] border border-slate-300 bg-emerald-100/30 font-black">{toBengaliDigits(Math.round(entry.totalRec))}</td><td className="text-center text-[10px] border border-slate-300 bg-emerald-100/30 font-black">{toBengaliDigits(Math.round(entry.totalAdj))}</td></tr>
                  {isExpanded && (<tr className="no-print"><td colSpan={14} className="p-0 border-none">{renderMetadataGrid(entry)}</td></tr>)}
                </React.Fragment>
              );
            })}
          </tbody>
          {!isAdminView && (
            <tfoot className="sticky bottom-0 z-[100]"><tr className="h-[45px] bg-slate-900 text-white"><td colSpan={2} className={footerTdCls + " text-white uppercase"}>সর্বমোট (ফিল্টার ডাটা):</td><td className={footerTdCls + " text-amber-400"}>{toBengaliDigits(grandTotals.paraCount)}</td><td className={footerTdCls + " text-amber-400"}>{toBengaliDigits(Math.round(grandTotals.inv))}</td><td className={footerTdCls + " text-amber-400"}>{toBengaliDigits(grandTotals.raisedCount)}</td><td className={footerTdCls + " text-amber-400"}>{toBengaliDigits(Math.round(grandTotals.raisedAmount))}</td><td className={footerTdCls}>{toBengaliDigits(Math.round(grandTotals.vRec))}</td><td className={footerTdCls}>{toBengaliDigits(Math.round(grandTotals.vAdj))}</td><td className={footerTdCls}>{toBengaliDigits(Math.round(grandTotals.iRec))}</td><td className={footerTdCls}>{toBengaliDigits(Math.round(grandTotals.iAdj))}</td><td className={footerTdCls}>{toBengaliDigits(Math.round(grandTotals.oRec))}</td><td className={footerTdCls}>{toBengaliDigits(Math.round(grandTotals.oAdj))}</td><td className={footerTdCls + " text-amber-400 font-black"}>{toBengaliDigits(Math.round(grandTotals.tRec))}</td><td className={footerTdCls + " text-amber-400 font-black"}>{toBengaliDigits(Math.round(grandTotals.tAdj))}</td></tr></tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default SettlementTable;
