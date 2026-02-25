import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Mail, Calendar, Hash, FileText, User, MapPin, Inbox, Computer, CheckCircle2, ChevronRight, ArrowRightCircle, ListOrdered, Banknote, BookOpen, Clock, Printer, Pencil, Trash2, CalendarRange, Check, XCircle, Send, UserCheck, Plus, Search, ChevronDown, Sparkles, Save, CalendarSearch, LayoutGrid, CalendarDays } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { getCurrentCycle, getCycleForDate } from '../utils/cycleHelper';
import { format, addMonths } from 'date-fns';

interface CorrespondenceEntry {
  id: string;
  description: string;
  paraType: string;
  letterType: string;
  letterNo: string;
  letterDate: string;
  totalParas: string;
  totalAmount: string;
  diaryNo: string;
  diaryDate: string;
  receiptDate: string;
  digitalFileNo: string;
  presentationDate: string;
  presentedToName?: string;
  sentParaCount: string;
  receiverName: string;
  receivedDate: string;
  isOnline: string;
  issueLetterNo: string;
  issueLetterDate: string;
  remarks?: string;
  createdAt: string;
  approvalStatus?: 'approved' | 'pending';
  type?: string;
}

interface CorrespondenceTableProps {
  entries: CorrespondenceEntry[];
  onBack: () => void;
  isLayoutEditable?: boolean;
  isAdmin?: boolean;
  onEdit?: (entry: any) => void;
  onInlineUpdate?: (entry: any) => void; 
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
}

/**
 * Segmented Table Date Input for Table Cells with Auto-focus
 */
const SegmentedTableDateInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  accent: 'blue' | 'amber';
}> = ({ value, onChange, accent }) => {
  // Expect value as YYYY-MM-DD
  const [y, m, d] = value ? value.split('-') : ['', '', ''];
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const update = (nD: string, nM: string, nY: string) => {
    const finalY = nY.padStart(4, '0');
    const finalM = nM.padStart(2, '0');
    const finalD = nD.padStart(2, '0');
    updateValue(`${finalY}-${finalM}-${finalD}`);
  };

  const updateValue = (val: string) => {
    onChange(val);
  };

  const dayVal = d && d !== '00' ? toBengaliDigits(d) : '';
  const monthVal = m && m !== '00' ? toBengaliDigits(m) : '';
  const yearVal = y && y !== '0000' ? toBengaliDigits(y) : '';

  const focusCls = accent === 'blue' 
    ? 'focus-within:border-blue-400 focus-within:ring-blue-50' 
    : 'focus-within:border-amber-400 focus-within:ring-amber-50';

  const inputCls = "w-full bg-transparent border-none outline-none text-center font-black text-[10px] p-0 placeholder:text-slate-300";

  return (
    <div className={`flex items-center gap-0.5 px-1 h-6 bg-white border border-slate-200 rounded-md ${focusCls} transition-all`}>
      <input 
        ref={dayRef} type="text" placeholder="দিন" 
        className={`${inputCls} flex-[1]`}
        value={dayVal} 
        onChange={e => {
          const v = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
          if (v && parseInt(v) > 31) return;
          update(v, m, y);
          if (v.length === 2) monthRef.current?.focus();
        }} 
      />
      <span className="text-slate-300 text-[8px] font-black">/</span>
      <input 
        ref={monthRef} type="text" placeholder="মাস" 
        className={`${inputCls} flex-[1]`}
        value={monthVal} 
        onChange={e => {
          const v = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
          if (v && parseInt(v) > 12) return;
          update(d, v, y);
          if (v.length === 2) yearRef.current?.focus();
        }} 
      />
      <span className="text-slate-300 text-[8px] font-black">/</span>
      <input 
        ref={yearRef} type="text" placeholder="বছর" 
        className={`${inputCls} flex-[1.8]`}
        value={yearVal} 
        onChange={e => {
          const v = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 4);
          update(d, m, v);
        }}
        onBlur={() => {
          if (y && y.length === 2) update(d, m, '20' + y);
        }}
      />
    </div>
  );
};

/**
 * Premium Dropdown Component for Inline Presentation Name Update
 */
const PremiumInlineSelect: React.FC<{
  value: string;
  onSelect: (val: string) => void;
}> = ({ value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ledger_correspondence_presented_to');
    const defaultList = ['সুপার', 'এএন্ডএও', 'উপপরিচালক']; 
    
    const filterUnwanted = (s: string) => 
      s !== 'শামীমা রহমান' && 
      s !== 'পরিচালক' && 
      s !== 'মহাপরিচালক' && 
      s !== 'উপ-পরিচালক';

    if (saved) {
      const parsed = JSON.parse(saved).filter(filterUnwanted);
      const merged = Array.from(new Set([...defaultList, ...parsed])).filter(filterUnwanted);
      setSuggestions(merged);
    } else {
      setSuggestions(defaultList);
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 250);
    }
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNew = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed === 'শামীমা রহমান' || trimmed === 'পরিচালক' || trimmed === 'মহাপরিচালক' || trimmed === 'উপ-পরিচালক') return;
    const next = Array.from(new Set([trimmed, ...suggestions]));
    setSuggestions(next);
    localStorage.setItem('ledger_correspondence_presented_to', JSON.stringify(next));
    onSelect(trimmed);
    setIsOpen(false);
  };

  const filtered = suggestions.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={handleToggle}
        className={`w-full h-7 px-1.5 bg-slate-50 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-50 bg-white shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <span className={`text-[10px] font-black truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || 'বাছুন...'}
        </span>
        <ChevronDown size={10} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute ${openUp ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]'} left-0 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 border-t-2 border-t-blue-600`}>
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
              <input 
                autoFocus type="text" placeholder="খুঁজুন..." 
                className="w-full h-7 pl-6 pr-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black outline-none focus:border-blue-400"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto no-scrollbar py-1">
            {value && (
              <div 
                onClick={() => { onSelect(''); setIsOpen(false); }}
                className="px-3 py-1.5 mx-1 mb-1 rounded-lg cursor-pointer flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
              >
                <XCircle size={10} />
                <span className="text-[10px] font-black uppercase tracking-tighter">সিলেকশন মুছুন</span>
              </div>
            )}
            {filtered.map((opt, i) => (
              <div 
                key={i} 
                onClick={() => { 
                  const nextVal = value === opt ? '' : opt;
                  onSelect(nextVal); 
                  setIsOpen(false); 
                }}
                className={`px-3 py-1.5 cursor-pointer flex items-center justify-between transition-all ${value === opt ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700 font-black text-[10px]'}`}
              >
                <span>{opt}</span>
                {value === opt && <Check size={10} strokeWidth={3} />}
              </div>
            ))}
            {searchTerm && !suggestions.includes(searchTerm) && 
             searchTerm !== 'শামীমা রহমান' && 
             searchTerm !== 'পরিচালক' && 
             searchTerm !== 'মহাপরিচালক' && 
             searchTerm !== 'উপ-পরিচালক' && (
              <div 
                onClick={handleAddNew}
                className="px-3 py-1.5 cursor-pointer bg-emerald-50 text-emerald-600 font-black text-[10px] flex items-center gap-2 hover:bg-emerald-100"
              >
                <Plus size={10} /> নতুন পদবি: "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CorrespondenceTable: React.FC<CorrespondenceTableProps> = ({ entries, onBack, isLayoutEditable, isAdmin, onEdit, onInlineUpdate, onDelete, onApprove, onReject, showFilters, setShowFilters }) => {
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<CorrespondenceEntry>>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [expandedCycles, setExpandedCycles] = useState<Record<string, boolean>>({});
  const lastActiveLabel = useRef<string>("");
  const cycleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParaType, setFilterParaType] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedCycleDate, setSelectedCycleDate] = useState<Date | null>(null);
  
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const cycleDropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const cycleInfo = useMemo(() => getCurrentCycle(), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(event.target as Node)) setIsCycleDropdownOpen(false);
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) setIsBranchDropdownOpen(false);
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) setIsTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchSearch = !searchTerm || 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.letterNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.diaryNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchBranch = !filterParaType || entry.paraType === filterParaType;
      const matchType = !filterType || entry.letterType === filterType;
      
      let matchCycle = true;
      if (activeCycle && entry.diaryDate) {
        matchCycle = entry.diaryDate >= format(activeCycle.start, 'yyyy-MM-dd') && entry.diaryDate <= format(activeCycle.end, 'yyyy-MM-dd');
      }

      return matchSearch && matchBranch && matchType && matchCycle;
    }).sort((a, b) => {
      const dateA = a.diaryDate || '';
      const dateB = b.diaryDate || '';
      if (dateA === dateB) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return dateB.localeCompare(dateA);
    });
  }, [entries, searchTerm, filterParaType, filterType, activeCycle]);

  const stats = useMemo(() => {
    const total = filteredEntries.length;
    const sfi = filteredEntries.filter(e => e.paraType === 'এসএফআই');
    const nonSfi = filteredEntries.filter(e => e.paraType === 'নন এসএফআই');

    const getLetterTypeCount = (list: CorrespondenceEntry[], type: string) => 
      list.filter(e => e.letterType === type).length;

    return {
      total,
      sfi: {
        total: sfi.length,
        bsr: getLetterTypeCount(sfi, 'বিএসআর'),
        triWork: getLetterTypeCount(sfi, 'ত্রিপক্ষীয় সভা (কার্যপত্র)'),
        triMin: getLetterTypeCount(sfi, 'ত্রিপক্ষীয় সভা (কার্যবিবরণী)'),
      },
      nonSfi: {
        total: nonSfi.length,
        bsr: getLetterTypeCount(nonSfi, 'বিএসআর'),
        biWork: getLetterTypeCount(nonSfi, 'দ্বিপক্ষীয় সভা (কার্যপত্র)'),
        biMin: getLetterTypeCount(nonSfi, 'দ্বিপক্ষীয় সভা (কার্যবিবরণী)'),
      }
    };
  }, [filteredEntries]);

  const { cycleStats, groupedEntries } = useMemo(() => {
    const groupsMap: Record<string, CorrespondenceEntry[]> = {};
    const groupsList: { label: string; entries: CorrespondenceEntry[] }[] = [];
    
    filteredEntries.forEach(entry => {
      let label = "Unknown";
      if (entry.diaryDate) {
        try {
          const dateObj = new Date(entry.diaryDate);
          if (!isNaN(dateObj.getTime())) {
            label = getCycleForDate(dateObj).label;
          }
        } catch (e) {}
      }
      
      if (!groupsMap[label]) {
        groupsMap[label] = [];
        groupsList.push({ label, entries: groupsMap[label] });
      }
      groupsMap[label].push(entry);
    });

    const statsMap: Record<string, any> = {};
    groupsList.forEach(group => {
      const sfi = group.entries.filter(e => e.paraType === 'এসএফআই');
      const nonSfi = group.entries.filter(e => e.paraType === 'নন এসএফআই');
      const getCount = (list: CorrespondenceEntry[], type: string) => list.filter(e => e.letterType === type).length;
      
      statsMap[group.label] = {
        total: group.entries.length,
        sfi: {
          total: sfi.length,
          bsr: getCount(sfi, 'বিএসআর'),
          triWork: getCount(sfi, 'ত্রিপক্ষীয় সভা (কার্যপত্র)'),
          triMin: getCount(sfi, 'ত্রিপক্ষীয় সভা (কার্যবিবরণী)'),
        },
        nonSfi: {
          total: nonSfi.length,
          bsr: getCount(nonSfi, 'বিএসআর'),
          biWork: getCount(nonSfi, 'দ্বিপক্ষীয় সভা (কার্যপত্র)'),
          biMin: getCount(nonSfi, 'দ্বিপক্ষীয় সভা (কার্যবিবরণী)'),
        }
      };
    });

    return { cycleStats: statsMap, groupedEntries: groupsList };
  }, [filteredEntries]);

  useEffect(() => {
    const handleScroll = () => {
      // Only sync if at least one cycle is currently expanded
      const isAnyExpanded = Object.values(expandedCycles).some(v => v);
      if (!isAnyExpanded) return;

      let activeLabel = "";
      const stickyTop = 42; // The CSS top position of sticky headers (Row 1 height)

      // Find the cycle header that is currently "active" (sticky at the top)
      // Standard scroll-spy: iterate and find the last element that has passed the trigger point
      for (const group of groupedEntries) {
        const el = cycleRefs.current[group.label];
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the header's top is at or above the sticky threshold (with a small buffer)
          // Using a slightly larger buffer for better detection during fast scroll
          if (rect.top <= stickyTop + 10) {
            activeLabel = group.label;
          }
        }
      }

      // Update expansion to the new active cycle if it changed
      if (activeLabel && activeLabel !== lastActiveLabel.current) {
        lastActiveLabel.current = activeLabel;
        setExpandedCycles({ [activeLabel]: true });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedCycles, groupedEntries]);

  // IDBadge definition inside component
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

  const handleInlineChange = (entryId: string, field: keyof CorrespondenceEntry, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value
      }
    }));
  };

  const saveAllChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsUpdating(true);
    
    try {
      for (const entryId in pendingChanges) {
        const entry = entries.find(e => e.id === entryId);
        if (entry && onInlineUpdate) {
          await onInlineUpdate({ ...entry, ...pendingChanges[entryId] });
        }
      }
      setPendingChanges({});
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const saveRowChanges = async (entryId: string) => {
    const rowChanges = pendingChanges[entryId];
    if (!rowChanges) return;
    setIsUpdating(true);
    
    try {
      const entry = entries.find(e => e.id === entryId);
      if (entry && onInlineUpdate) {
        await onInlineUpdate({ ...entry, ...rowChanges });
      }
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Header font-black
  const thCls = "border border-slate-300 px-1 py-2 text-center align-middle font-black text-slate-900 text-[11px] bg-slate-200 sticky top-0 z-[100] shadow-[inset_0_-1px_0_#cbd5e1] leading-tight";
  // Data cells reverted to font-bold
  const tdCls = "border border-slate-300 px-1.5 py-1.5 text-[11px] text-slate-800 font-bold leading-tight align-top bg-white transition-colors group-hover:bg-blue-50/50 break-words";
  const labelCls = "text-[10px] font-bold text-emerald-700 shrink-0";
  const valCls = "text-[10px] font-black text-slate-900";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[48px] bg-white border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]' : 'border-slate-300 shadow-sm hover:border-slate-400'}`;

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div id="section-correspondence-register" className="w-full space-y-4 animate-premium-page relative">
      <IDBadge id="section-correspondence-register" />
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print relative">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all shadow-sm"><ChevronRight className="rotate-180" size={18} /></button>
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Mail className="text-emerald-600" size={20} /> প্রাপ্ত চিঠিপত্র সংক্রান্ত রেজিস্টার
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Correspondence Ledger</p>
               <div className="h-3 w-[1px] bg-slate-300"></div>
               <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px]">
                  <CalendarRange size={12} /> সাইকেল: {toBengaliDigits(cycleInfo.label)}
               </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowSummary(!showSummary)} 
             className={`px-4 py-2.5 rounded-xl font-black text-[11px] flex items-center gap-2 transition-all shadow-lg active:scale-95 ${showSummary ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'}`}
           >
             <Sparkles size={16} /> রেজিস্টার সারসংক্ষেপ
           </button>
           {hasChanges && (
             <button 
              onClick={saveAllChanges}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-[11px] flex items-center gap-2 hover:shadow-xl hover:scale-105 active:scale-95 transition-all animate-in zoom-in-95 duration-300 border border-emerald-400 shadow-lg shadow-emerald-200/50"
             >
               {isUpdating ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
               আপডেট করুন {toBengaliDigits(Object.keys(pendingChanges).length)} টি এন্ট্রি
             </button>
           )}
           <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[11px] flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={16} /> প্রিন্ট</button>
        </div>
      </div>

      {/* Filter UI for Correspondence */}
      {showFilters && (
        <div id="correspondence-filters" className="!bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 no-print mb-6 animate-in slide-in-from-top-4 duration-300 relative z-[1000] isolate">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Cycle Selection */}
            <div className="space-y-1.5" ref={cycleDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">সময়কাল নির্বাচন (সাইকেল)</label>
              <div 
                onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} 
                className={customDropdownCls(isCycleDropdownOpen)}
              >
                <CalendarDays size={18} className="text-blue-600" />
                <span className="font-bold text-[13px] text-slate-900 truncate">
                  {!selectedCycleDate ? 'সকল সাইকেল' : (cycleOptions.find(o => o.cycleLabel === activeCycle?.label)?.label || toBengaliDigits(activeCycle?.label || ''))}
                </span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isCycleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                
                {isCycleDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <CalendarSearch size={12} /> সাইকেল নির্বাচন
                        </span>
                      </div>
                      <div className="p-2 space-y-1">
                        <div 
                          key="all" 
                          onClick={(e) => { e.stopPropagation(); setSelectedCycleDate(null); setIsCycleDropdownOpen(false); }} 
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${!selectedCycleDate ? '!bg-blue-600 !text-white shadow-lg' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}
                        >
                          <span className="text-[13px]">সকল সাইকেল</span>
                          {!selectedCycleDate && <Check size={16} strokeWidth={3} />}
                        </div>
                        {cycleOptions.map((opt, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setSelectedCycleDate(opt.date); setIsCycleDropdownOpen(false); }} 
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${opt.cycleLabel === activeCycle?.label ? '!bg-blue-600 !text-white shadow-lg' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}
                          >
                            <span className="text-[13px]">{opt.label}</span>
                            {opt.cycleLabel === activeCycle?.label && <Check size={16} strokeWidth={3} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Branch Selection */}
            <div className="space-y-1.5" ref={branchDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">শাখা</label>
              <div 
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} 
                className={customDropdownCls(isBranchDropdownOpen)}
              >
                <LayoutGrid className="text-blue-600" size={16} />
                <span className="font-bold text-[13px] text-slate-900 truncate">
                  {filterParaType === '' ? 'সকল শাখা' : filterParaType}
                </span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isBranchDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                
                {isBranchDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <LayoutGrid size={12} /> শাখা নির্বাচন
                        </span>
                      </div>
                      <div className="p-2 space-y-1">
                        {[
                          { val: '', label: 'সকল শাখা' },
                          { val: 'এসএফআই', label: 'এসএফআই' },
                          { val: 'নন এসএফআই', label: 'নন এসএফআই' }
                        ].map((opt, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setFilterParaType(opt.val); setIsBranchDropdownOpen(false); }} 
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${filterParaType === opt.val ? '!bg-blue-600 !text-white shadow-lg' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}
                          >
                            <span className="text-[13px]">{opt.label}</span>
                            {filterParaType === opt.val && <Check size={16} strokeWidth={3} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Letter Type Selection */}
            <div className="space-y-1.5" ref={typeDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">চিঠির ধরণ</label>
              <div 
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} 
                className={customDropdownCls(isTypeDropdownOpen)}
              >
                <FileText className="text-blue-600" size={16} />
                <span className="font-bold text-[13px] text-slate-900 truncate">
                  {filterType === '' ? 'সকল ধরণ' : filterType}
                </span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                
                {isTypeDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                          <FileText size={12} /> ধরণ নির্বাচন
                        </span>
                      </div>
                      <div className="p-2 space-y-1">
                        {[
                          { val: '', label: 'সকল ধরণ' },
                          { val: 'বিএসআর', label: 'বিএসআর (BSR)' },
                          { val: 'দ্বিপক্ষীয় সভা (কার্যপত্র)', label: 'দ্বিপক্ষীয় সভা (কার্যপত্র)' },
                          { val: 'দ্বিপক্ষীয় সভা (কার্যবিবরণী)', label: 'দ্বিপক্ষীয় সভা (কার্যবিবরণী)' },
                          { val: 'ত্রিপক্ষীয় সভা (কার্যপত্র)', label: 'ত্রিপক্ষীয় সভা (কার্যপত্র)' },
                          { val: 'ত্রিপক্ষীয় সভা (কার্যবিবরণী)', label: 'ত্রিপক্ষীয় সভা (কার্যবিবরণী)' },
                          { val: 'মিলিকরণ', label: 'মিলিকরণ' }
                        ].map((opt, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setFilterType(opt.val); setIsTypeDropdownOpen(false); }} 
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${filterType === opt.val ? '!bg-blue-600 !text-white shadow-lg' : 'hover:bg-slate-100 text-slate-700 font-bold bg-white'}`}
                          >
                            <span className="text-[13px]">{opt.label}</span>
                            {filterType === opt.val && <Check size={16} strokeWidth={3} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">অনুসন্ধান</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={16} />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="বিবরণ বা নং দিয়ে খুঁজুন..." 
                  className="w-full pl-9 pr-4 h-[48px] bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-[13px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-bold" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="table-container border border-slate-300 rounded-sm overflow-x-auto relative shadow-xl bg-white max-w-full">
        <IDBadge id="table-correspondence-ledger" />
        <table className="w-full border-separate border-spacing-0 table-fixed">
          <colgroup>
            <col className="w-[30px]" />
            <col className="w-[130px]" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[145px]" />
            <col className="w-[135px]" />
            <col className="w-[50px]" />
          </colgroup>
          <thead>
            <tr>
              <th className={thCls}>ক্র: নং</th>
              <th className={thCls}>পত্রের বিবরণ</th>
              <th className={thCls}>পত্রের অন্যান্য তথ্য</th>
              <th className={thCls}>অত্র অফিসের তথ্য</th>
              <th className={thCls}>গ্রহণ ও উপস্থাপন</th>
              <th className={thCls}>জারিপত্র নং ও তারিখ</th>
              <th className={thCls}>মন্তব্য</th>
            </tr>
          </thead>
          {showSummary && (
            <tbody className="no-print">
              <tr>
                <td colSpan={7} className="p-0 border border-slate-300">
                  <div className="bg-blue-50/80 p-4 animate-in fade-in slide-in-from-top-2 duration-500 border-b border-blue-200">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-blue-900">রেজিস্টার সারসংক্ষেপ</h4>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Register Summary Statistics</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">মোট চিঠি</span>
                          <span className="text-lg font-black text-slate-900">{toBengaliDigits(stats.total)} টি</span>
                        </div>
                        <div className="h-8 w-[1px] bg-blue-200 hidden md:block"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">এসএফআই: {toBengaliDigits(stats.sfi.total)} টি</span>
                          <span className="text-[11px] font-black text-slate-700">
                            (বিএসআর: {toBengaliDigits(stats.sfi.bsr)} টি, ত্রিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(stats.sfi.triWork)} টি, ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(stats.sfi.triMin)} টি)
                          </span>
                        </div>
                        <div className="h-8 w-[1px] bg-blue-200 hidden md:block"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-amber-600 uppercase">নন এসএফআই: {toBengaliDigits(stats.nonSfi.total)} টি</span>
                          <span className="text-[11px] font-black text-slate-700">
                            (বিএসআর: {toBengaliDigits(stats.nonSfi.bsr)} টি, দ্বিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(stats.nonSfi.biWork)} টি, দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(stats.nonSfi.biMin)} টি)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
          {groupedEntries.length > 0 ? (
            (() => {
              let globalIdx = 0;
              return groupedEntries.map((group) => (
                <tbody key={group.label}>
                  {/* Sticky Cycle Header */}
                  <tr className="sticky top-[42px] z-[90] no-print">
                    <td colSpan={7} className="p-0 border border-slate-300">
                      <div 
                        ref={el => { cycleRefs.current[group.label] = el; }}
                        onClick={() => {
                          const nextState = !expandedCycles[group.label];
                          setExpandedCycles({ [group.label]: nextState });
                          if (nextState) lastActiveLabel.current = group.label;
                          else lastActiveLabel.current = "";
                        }}
                        className="bg-slate-100/95 backdrop-blur-sm border-b border-slate-300 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all group/cycle-header shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md group-hover/cycle-header:scale-110 transition-transform">
                            <CalendarDays size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-[13px] text-slate-800 tracking-tight uppercase">
                              সময়কাল: <span className="text-blue-700 font-black">{toBengaliDigits(group.label)}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cycle Statistics</span>
                              <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                              <span className="text-[9px] font-black text-blue-600">মোট {toBengaliDigits(cycleStats[group.label]?.total || 0)} টি চিঠি</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${expandedCycles[group.label] ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-blue-600 border border-blue-200 hover:border-blue-400'}`}>
                            {expandedCycles[group.label] ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত দেখুন'}
                            <ChevronDown size={12} className={`transition-transform duration-300 ${expandedCycles[group.label] ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedCycles[group.label] && (
                    <tr className="sticky top-[82px] z-[85] no-print">
                      <td colSpan={7} className="p-0 border border-slate-300">
                        <div className="bg-white p-4 border-b border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200 shadow-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SFI Stats */}
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 space-y-2">
                              <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                                <span className="text-[11px] font-black text-emerald-900 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  এসএফআই (SFI)
                                </span>
                                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                                  {toBengaliDigits(cycleStats[group.label]?.sfi.total || 0)} টি
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase">বিএসআর</span>
                                  <span className="text-[12px] font-black text-slate-800">{toBengaliDigits(cycleStats[group.label]?.sfi.bsr || 0)} টি</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase">ত্রিপক্ষীয় (কার্যপত্র)</span>
                                  <span className="text-[12px] font-black text-slate-800">{toBengaliDigits(cycleStats[group.label]?.sfi.triWork || 0)} টি</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase">ত্রিপক্ষীয় (বিবরণী)</span>
                                  <span className="text-[12px] font-black text-slate-800">{toBengaliDigits(cycleStats[group.label]?.sfi.triMin || 0)} টি</span>
                                </div>
                              </div>
                            </div>

                            {/* Non-SFI Stats */}
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3 space-y-2">
                              <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                                <span className="text-[11px] font-black text-amber-900 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                  নন এসএফআই (Non-SFI)
                                </span>
                                <span className="bg-amber-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                                  {toBengaliDigits(cycleStats[group.label]?.nonSfi.total || 0)} টি
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-amber-600 uppercase">বিএসআর</span>
                                  <span className="text-[12px] font-black text-slate-800">{toBengaliDigits(cycleStats[group.label]?.nonSfi.bsr || 0)} টি</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-amber-600 uppercase">দ্বিপক্ষীয় (কার্যপত্র)</span>
                                  <span className="text-[12px] font-black text-slate-800">{toBengaliDigits(cycleStats[group.label]?.nonSfi.biWork || 0)} টি</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-amber-600 uppercase">দ্বিপক্ষীয় (বিবরণী)</span>
                                  <span className="text-[12px] font-black text-slate-800">{toBengaliDigits(cycleStats[group.label]?.nonSfi.biMin || 0)} টি</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Print-only cycle header */}
                  <tr className="hidden print:table-row bg-slate-100 border-y border-slate-300">
                    <td colSpan={7} className="px-4 py-2 border border-slate-300">
                      <span className="font-black text-[13px] text-slate-800 tracking-tight uppercase">
                        সময়কাল: <span className="text-blue-700 font-black">{toBengaliDigits(group.label)}</span>
                      </span>
                    </td>
                  </tr>
                  {group.entries.map((entry) => {
                    const idx = globalIdx++;
                    const pending = pendingChanges[entry.id] || {};
                    const currentPresDate = pending.presentationDate !== undefined ? pending.presentationDate : (entry.presentationDate || '');
                    const currentPresName = pending.presentedToName !== undefined ? pending.presentedToName : (entry.presentedToName || '');
                    const currentIssueNo = pending.issueLetterNo !== undefined ? pending.issueLetterNo : (entry.issueLetterNo || '');
                    const currentIssueDate = pending.issueLetterDate !== undefined ? pending.issueLetterDate : (entry.issueLetterDate || '');
                    const isPendingForApproval = entry.approvalStatus === 'pending';

                    return (
                      <tr key={entry.id} className="group transition-all">
                        <td className={tdCls + " text-center font-black"}>{toBengaliDigits(idx + 1)}</td>
                        <td className={tdCls}>{entry.description}</td>
                        <td className={tdCls}>
                           <div className="space-y-2">
                              <div className="flex flex-col">
                                <span className={labelCls}>১. শাখার ধরণ:</span> 
                                <span className={valCls + " pl-3"}>{entry.paraType}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>২. পত্রের ধরণ:</span> 
                                <span className={valCls + " pl-3"}>{entry.letterType}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>৩. পত্র নং ও তারিখ:</span> 
                                <span className={valCls + " pl-3"}>{entry.letterNo}, {formatDateBN(entry.letterDate)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>৪. প্রেরিত অনু: সংখ্যা:</span> 
                                <span className={valCls + " pl-3"}>{toBengaliDigits(entry.totalParas)} টি</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>৫. মোট জড়িত টাকা:</span> 
                                <span className={valCls + " pl-3"}>{toBengaliDigits(entry.totalAmount)}</span>
                              </div>
                           </div>
                        </td>
                        <td className={tdCls}>
                           <div className="space-y-2">
                              <div className="flex flex-col">
                                <span className={labelCls}>১. ডায়েরি নং ও তারিখ:</span> 
                                <span className={valCls + " pl-3"}>{entry.diaryNo}, {formatDateBN(entry.diaryDate)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>২. শাখায় প্রাপ্তির তারিখ:</span> 
                                <span className={valCls + " pl-3"}>{formatDateBN(entry.receiptDate)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>৩. ডিজিটাল নথি নং-:</span> 
                                <span className={valCls + " pl-3"}>{entry.digitalFileNo}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>৪. গ্রহণের তারিখ:</span> 
                                <span className={valCls + " pl-3"}>{formatDateBN(entry.receivedDate)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={labelCls}>৫. অনলাইনে প্রাপ্তি:</span> 
                                <span className={valCls + " pl-3"}>{entry.isOnline}</span>
                              </div>
                           </div>
                        </td>
                        <td className={tdCls}>
                           <div className="space-y-2">
                              <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg relative">
                                 <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-tighter mb-0.5 flex items-center gap-1"><Inbox size={8} /> গ্রহণকারী</div>
                                 <div className="font-bold text-slate-900 text-[10px] leading-tight truncate">{entry.receiverName || '-'}</div>
                                 <div className="text-[9px] text-slate-500 font-bold">{formatDateBN(entry.receivedDate)}</div>
                              </div>

                              <div className={`p-1.5 border rounded-lg space-y-1.5 transition-colors ${pending.presentationDate || pending.presentedToName ? 'bg-blue-600/10 border-blue-400 ring-2 ring-blue-50' : 'bg-blue-50/50 border-blue-100'}`}>
                                 <div className="flex items-center justify-between">
                                    <div className="text-[9px] font-bold text-blue-700 uppercase tracking-tighter flex items-center gap-1"><UserCheck size={8} /> উপস্থাপন</div>
                                    {(currentPresDate || currentPresName) && (
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          handleInlineChange(entry.id, 'presentationDate', '');
                                          handleInlineChange(entry.id, 'presentedToName', '');
                                        }}
                                        className="p-1 hover:bg-red-100 text-red-400 hover:text-red-600 rounded transition-all animate-in zoom-in duration-300 ml-1"
                                        title="তথ্য মুছুন"
                                      >
                                        <XCircle size={10} />
                                      </button>
                                    )}
                                    <div className="flex items-center gap-1.5 ml-auto">
                                       {formatDateBN(currentPresDate) && <span className="text-[8px] font-black text-blue-600">{formatDateBN(currentPresDate)}</span>}
                                       <div className="relative flex items-center h-3 w-3">
                                          <Calendar 
                                            size={11} 
                                            className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors" 
                                            onClick={(e) => {
                                              const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                                              if (input) input.showPicker();
                                            }}
                                          />
                                          <input 
                                            type="date" 
                                            className="absolute inset-0 opacity-0 w-3 h-3 cursor-pointer"
                                            value={currentPresDate}
                                            onChange={e => handleInlineChange(entry.id, 'presentationDate', e.target.value)}
                                          />
                                       </div>
                                    </div>
                                 </div>
                                 <PremiumInlineSelect 
                                    value={currentPresName} 
                                    onSelect={val => handleInlineChange(entry.id, 'presentedToName', val)}
                                 />
                              </div>
                           </div>
                        </td>
                        <td className={tdCls}>
                           <div className="space-y-2">
                              {(() => {
                                const isIssueComplete = !!currentIssueNo && !!currentIssueDate;
                                const issueColorCls = isIssueComplete 
                                  ? 'bg-emerald-600/10 border-emerald-400 ring-2 ring-emerald-50' 
                                  : (pending.issueLetterNo || pending.issueLetterDate)
                                    ? 'bg-amber-600/10 border-amber-400 ring-2 ring-amber-50' 
                                    : 'bg-amber-50/50 border-amber-100';
                                
                                const labelColorCls = isIssueComplete ? 'text-emerald-700' : 'text-amber-700';
                                const iconColorCls = isIssueComplete ? 'text-emerald-500' : 'text-amber-500';

                                return (
                                  <>
                                    <div className={`p-1.5 border rounded-lg space-y-1 transition-colors ${issueColorCls}`}>
                                       <div className={`text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1 ${labelColorCls}`}><Hash size={8} /> জারিপত্র নং</div>
                                       <input 
                                         type="text" 
                                         placeholder="নং"
                                         className="w-full h-6 px-1.5 border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:border-emerald-400 bg-white" 
                                         value={currentIssueNo} 
                                         onChange={e => handleInlineChange(entry.id, 'issueLetterNo', toBengaliDigits(e.target.value))}
                                       />
                                    </div>

                                    <div className={`p-1.5 border rounded-lg space-y-1 transition-colors ${issueColorCls}`}>
                                       <div className="flex items-center justify-between">
                                          <div className={`text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1 ${labelColorCls}`}><Calendar size={8} /> জারিপত্র তারিখ</div>
                                          <div className="flex items-center gap-1.5">
                                             {formatDateBN(currentIssueDate) && <span className={`text-[8px] font-black ${isIssueComplete ? 'text-emerald-600' : 'text-amber-600'}`}>{formatDateBN(currentIssueDate)}</span>}
                                             <div className="relative flex items-center h-3 w-3">
                                                <Calendar 
                                                  size={11} 
                                                  className={`${iconColorCls} cursor-pointer hover:opacity-80 transition-colors`} 
                                                  onClick={(e) => {
                                                    const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                                                    if (input) input.showPicker();
                                                  }}
                                                />
                                                <input 
                                                  type="date" 
                                                  className="absolute inset-0 opacity-0 w-3 h-3 cursor-pointer"
                                                  value={currentIssueDate}
                                                  onChange={e => handleInlineChange(entry.id, 'issueLetterDate', e.target.value)}
                                                />
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                  </>
                                );
                              })()}
                           </div>
                        </td>
                        <td className={tdCls + " relative group/action text-center"}>
                           <span className="text-[9px] opacity-70 font-bold">{entry.remarks || '-'}</span>
                           {isAdmin && (
                             <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all no-print z-[500] bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-xl border border-slate-200">
                               {pendingChanges[entry.id] && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); saveRowChanges(entry.id); }} 
                                    className="p-1.5 bg-emerald-600 text-white rounded-md shadow-md hover:bg-emerald-700 transition-all animate-bounce"
                                    title="আপডেট করুন"
                                  >
                                    <Save size={12} />
                                  </button>
                               )}
                               {isPendingForApproval && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onApprove?.(entry.id); }} 
                                    className="p-1.5 bg-emerald-500 text-white rounded-md shadow-md hover:bg-emerald-600 transition-colors"
                                    title="অনুমোদন দিন"
                                  >
                                    <Check size={12} strokeWidth={3} />
                                  </button>
                               )}
                               {isPendingForApproval && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onReject?.(entry.id); }} 
                                    className="p-1.5 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition-colors"
                                    title="বাতিল করুন"
                                  >
                                    <XCircle size={12} />
                                  </button>
                               )}
                               <button onClick={(e) => { e.stopPropagation(); onEdit?.(entry); }} className="p-1.5 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors" title="এডিট করুন"><Pencil size={12} /></button>
                               <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if(window.confirm("আপনি কি নিশ্চিতভাবে এই এন্ট্রিটি মুছে ফেলতে চান?")) {
                                    onDelete?.(entry.id); 
                                  }
                                }} 
                                className="p-1.5 bg-rose-600 text-white rounded-md shadow-md hover:bg-rose-700 transition-colors" 
                                title="মুছে ফেলুন"
                               >
                                <Trash2 size={12} />
                               </button>
                             </div>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ));
            })()
          ) : (
            <tbody>
              <tr>
                <td colSpan={7} className="py-20 text-center bg-white">
                   <div className="flex flex-col items-center gap-3 opacity-30">
                      <Mail size={40} />
                      <p className="text-sm font-black text-slate-900 tracking-widest">রেজিস্টার খালি</p>
                   </div>
                </td>
              </tr>
            </tbody>
          )}
          <tfoot className="sticky bottom-0 z-[110]">
            <tr className="bg-slate-900 text-white font-black text-[11px] h-9 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
              <td colSpan={2} className="px-4 text-left border-t border-slate-700">সর্বমোট:</td>
              <td colSpan={1} className="px-2 text-center border-t border-slate-700 text-emerald-400">{toBengaliDigits(filteredEntries.length)} টি</td>
              <td colSpan={4} className="border-t border-slate-700"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CorrespondenceTable;
