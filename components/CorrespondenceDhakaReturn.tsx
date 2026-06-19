
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ChevronLeft, Search, X, ChevronDown, Check, LayoutGrid, FileText, ChevronRight, Sparkles, BarChart3, Calendar } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import LetterDetailsModal from './LetterDetailsModal';

interface CorrespondenceDhakaReturnProps {
  correspondenceEntries: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
  showFilters: boolean;
}

const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const cleanStr = toEnglishDigits(dateStr).trim();
  // Support DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY AND YYYY-MM-DD
  const parts = cleanStr.split(/[-/.]/);
  if (parts.length === 3) {
    let d, m, y;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = parseInt(parts[0]);
      m = parseInt(parts[1]) - 1;
      d = parseInt(parts[2]);
    } else {
      // DD/MM/YYYY
      d = parseInt(parts[0]);
      m = parseInt(parts[1]) - 1;
      y = parseInt(parts[2]);
    }
    const fullY = y < 100 ? 2000 + y : y;
    const date = new Date(fullY, m, d);
    if (!isNaN(date.getTime())) {
      // Return date normalized to midnight
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  }
  const fallback = new Date(cleanStr);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  return null;
};

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

const CorrespondenceDhakaReturn: React.FC<CorrespondenceDhakaReturnProps> = ({
  correspondenceEntries,
  activeCycle,
  setSelectedReportType,
  HistoricalFilter,
  IDBadge,
  showFilters
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParaType, setFilterParaType] = useState('সকল');
  const [filterLetterType, setFilterLetterType] = useState('সকল');
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date(activeCycle.end));
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date(selectedMonthDate));
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentViewDate(new Date(selectedMonthDate));
  }, [selectedMonthDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [dateInputText, setDateInputText] = useState(dateFnsFormat(selectedMonthDate, 'dd/MM/yyyy'));
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);
  
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDateInputText(dateFnsFormat(selectedMonthDate, 'dd/MM/yyyy'));
  }, [selectedMonthDate]);

  const handleDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateInputText(val);
    
    // Simple DD/MM/YYYY parser
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      if (y > 1900 && y < 2100 && m >= 0 && m < 12 && d > 0 && d <= 31) {
        const newDate = new Date(y, m, d);
        if (!isNaN(newDate.getTime())) {
          setSelectedMonthDate(newDate);
        }
      }
    }
  };

  useEffect(() => {
    setFilterLetterType('সকল');
  }, [filterParaType]);

  const [showAuditorStatsModal, setShowAuditorStatsModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsModalTitle, setDetailsModalTitle] = useState('');
  const [detailsModalLetters, setDetailsModalLetters] = useState<any[]>([]);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  const [receiverImages, setReceiverImages] = useState<Record<string, string>>({});
  const [receiverDesignations, setReceiverDesignations] = useState<Record<string, string>>({});

  const normalizeName = (name: string | null | undefined) => {
    if (!name) return 'অনির্ধারিত';
    return name
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
  };

  useEffect(() => {
    const fetchReceiverProfiles = async () => {
      const imagesMap: Record<string, string> = {};
      const designationsMap: Record<string, string> = {};

      const addProfile = (name: string, img: string | null, desig: string | null) => {
        if (!name) return;
        const nameTrim = name.trim();
        const norm = normalizeName(nameTrim);
        if (img) {
          imagesMap[nameTrim] = img;
          imagesMap[norm] = img;
        }
        if (desig) {
          designationsMap[nameTrim] = desig;
          designationsMap[norm] = desig;
        }
      };

      // 1. Fetch from database (Supabase)
      if (isSupabaseConfigured) {
        try {
          const { data: dbReceivers } = await supabase
            .from('receivers')
            .select('name, image, designation');
          if (dbReceivers) {
            dbReceivers.forEach(r => {
              addProfile(r.name, r.image, r.designation);
            });
          }
        } catch (err) {
          console.error("Error fetching db receivers in Return:", err);
        }
      }

      // 2. Fetch from local storage keys
      const localKeys = [
        'ledger_correspondence_receivers_admin',
        'ledger_correspondence_receivers_sfi',
        'ledger_correspondence_receivers_nonsfi'
      ];
      localKeys.forEach(key => {
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const items = JSON.parse(saved);
            if (Array.isArray(items)) {
              items.forEach((item: any) => {
                addProfile(item.name, item.image, item.designation);
              });
            }
          }
        } catch (e) {
          console.error("Error parsing local receivers:", e);
        }
      });

      setReceiverImages(imagesMap);
      setReceiverDesignations(designationsMap);
    };

    fetchReceiverProfiles();
  }, [correspondenceEntries]);

  const handleCountClick = (title: string, letters: any[]) => {
    if (letters.length === 0) return;
    setDetailsModalTitle(title);
    setDetailsModalLetters(letters);
    setIsDetailsModalOpen(true);
    setHighlightedKey(title);
  };

  const getHighlightClass = (key: string) => {
    return highlightedKey === key ? 'clicked-cell-highlight' : '';
  };

  const branchOptions = useMemo(() => ['সকল', 'এসএফআই', 'নন এসএফআই'], []);

  const typeOptions = useMemo(() => {
    if (filterParaType === 'এসএফআই') {
      
      return ['সকল', 'বিএসআর', 'কার্যবিবরণী (ত্রি-সভা)'];
    }
    if (filterParaType === 'নন এসএফআই') {
      return ['সকল', 'বিএসআর', 'কার্যবিবরণী (দ্বি-সভা)'];

    }
    return ['সকল', 'বিএসআর', 'কার্যবিবরণী (ত্রি-সভা)', 'কার্যবিবরণী (দ্বি-সভা)'];
  }, [filterParaType]);

  const cycleOptions = useMemo(() => {
    const options = [];
    const banglaMonths: Record<string, string> = {
      'January': 'জানুয়ারি', 'February': 'ফেব্রুয়ারি', 'March': 'মার্চ', 'April': 'এপ্রিল',
      'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
      'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর'
    };
    const today = new Date();
    for (let i = -1; i < 23; i++) {
      const refDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNameEng = dateFnsFormat(refDate, 'MMMM');
      const yearEng = dateFnsFormat(refDate, 'yyyy');
      const label = `${banglaMonths[monthNameEng]}/${toBengaliDigits(yearEng)}`;
      options.push({ date: refDate, label });
    }
    return options;
  }, []);

  const currentSelectedLabel = useMemo(() => {
    const banglaMonths: Record<string, string> = {
      'January': 'জানুয়ারি', 'February': 'ফেব্রুয়ারি', 'March': 'মার্চ', 'April': 'এপ্রিল',
      'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
      'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর'
    };
    const monthNameEng = dateFnsFormat(selectedMonthDate, 'MMMM');
    const yearEng = dateFnsFormat(selectedMonthDate, 'yyyy');
    return `${banglaMonths[monthNameEng]}/${toBengaliDigits(yearEng)}`;
  }, [selectedMonthDate]);

  const filteredData = useMemo(() => {
    let data = correspondenceEntries || [];

    // 1. Basic exclusions for Dhaka Return
    data = data.filter(e => {
      const isExcludedType = e.letterType === 'মিলিকরণ' || (e.letterType || '').includes('কার্যপত্র');
      return !isExcludedType;
    });

    // 2. Filter by selected date (As of Date)
    const reportingDateObj = selectedMonthDate;
    if (!reportingDateObj) return data;
    
    data = data.filter(e => {
      // 1. Check if it's settled (has valid issue no AND date)
      const issueNo = (e.issueLetterNo || '').trim();
      const hasValidIssueNo = issueNo !== '' && 
                              issueNo !== '০' && 
                              issueNo !== '0' && 
                              issueNo !== 'নং' && 
                              issueNo !== 'নং-' && 
                              issueNo !== 'নং -' &&
                              !/^নং\s*$/.test(issueNo);

      const hasValidIssueDate = e.issueLetterDate && 
                                e.issueLetterDate.trim() !== '' && 
                                e.issueLetterDate !== '০' && 
                                e.issueLetterDate !== '0';

      if (hasValidIssueNo && hasValidIssueDate) {
        const iDate = parseDate(e.issueLetterDate);
        if (iDate) {
          // If issued on or before reporting date, it's SETTLED (not pending)
          if (iDate.getTime() <= reportingDateObj.getTime()) {
            return false; 
          }
        }
      }

      // 2. If not settled, it must have a diary date to be considered
      const dDate = parseDate(e.diaryDate);
      if (!dDate) return false;
      
      // 3. Must be received ON OR BEFORE reportingDateObj
      if (dDate.getTime() > reportingDateObj.getTime()) return false;
      
      return true; // Still Pending
    });
    
    if (filterParaType !== 'সকল') {
      data = data.filter(e => e.paraType === filterParaType);
    }
    
    if (filterLetterType !== 'সকল') {
      if (filterLetterType === 'বিএসআর') {
        data = data.filter(e => e.letterType === 'বিএসআর');
      } else if (filterLetterType === 'কার্যবিবরণী (ত্রি-সভা)') {
        data = data.filter(e => (e.letterType || '').includes('কার্যবিবরণী') && e.paraType === 'এসএফআই');
      } else if (filterLetterType === 'কার্যবিবরণী (দ্বি-সভা)') {
        data = data.filter(e => (e.letterType || '').includes('কার্যবিবরণী') && e.paraType === 'নন এসএফআই');
      } else {
        data = data.filter(e => e.letterType === filterLetterType);
      }
    }

    if (!searchTerm.trim()) return data;
    return data.filter(entry => 
      (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.diaryNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.letterNo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [correspondenceEntries, searchTerm, filterParaType, filterLetterType, selectedMonthDate]);

  const thS = "border border-slate-300 px-1 py-1 font-black text-center text-[10px] bg-slate-200 text-slate-900 leading-tight align-middle h-full shadow-[inset_0_0_0_1px_#cbd5e1] bg-clip-border";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-emerald-600 ring-4 ring-emerald-50 shadow-md z-[1010]' : 'border-slate-300 shadow-sm hover:border-slate-300'}`;
  const tdS = "border border-slate-300 px-2 py-2 text-[11px] text-center font-bold leading-tight min-h-[40px] align-middle break-words";
  
  const reportingLimitDate = useMemo(() => {
    return selectedMonthDate;
  }, [selectedMonthDate]);

  const reportingDateBN = useMemo(() => 
    toBengaliDigits(dateFnsFormat(reportingLimitDate, 'dd/MM/yyyy')),
    [reportingLimitDate]
  );

  const reportingMonthYearBN = toBengaliDigits(dateFnsFormat(new Date(activeCycle.end), 'MMMM/yyyy'))
    .replace('January', 'জানুয়ারি').replace('February', 'ফেব্রুয়ারি').replace('March', 'মার্চ')
    .replace('April', 'এপ্রিল').replace('May', 'মে').replace('June', 'জুন')
    .replace('July', 'জুলাই').replace('August', 'আগস্ট').replace('September', 'সেপ্টেম্বর')
    .replace('October', 'অক্টোবর').replace('November', 'নভেম্বর').replace('December', 'ডিসেম্বর');

  const auditorWiseStats = useMemo(() => {
    const stats: Record<string, { 
      total: number; auditor: number; aao: number; dd: number; others: number;
      auditorLetters: any[]; aaoLetters: any[]; ddLetters: any[]; othersLetters: any[]; totalLetters: any[]
    }> = {};
    
    filteredData.forEach(entry => {
      const auditor = normalizeName(entry.receiverName || entry.presentedToName);
      if (!stats[auditor]) {
        stats[auditor] = { 
          total: 0, auditor: 0, aao: 0, dd: 0, others: 0,
          auditorLetters: [], aaoLetters: [], ddLetters: [], othersLetters: [], totalLetters: []
        };
      }
      
      stats[auditor].total++;
      stats[auditor].totalLetters.push(entry);
      const pos = (entry.presentedToName || 'অডিটর');
      
      if (pos.includes('অডিটর')) {
        stats[auditor].auditor++;
        stats[auditor].auditorLetters.push(entry);
      } else if (pos.includes('এএন্ডএও')) {
        stats[auditor].aao++;
        stats[auditor].aaoLetters.push(entry);
      } else if (pos.includes('উপপরিচালক')) {
        stats[auditor].dd++;
        stats[auditor].ddLetters.push(entry);
      } else {
        stats[auditor].others++;
        stats[auditor].othersLetters.push(entry);
      }
    });
    
    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [filteredData]);

  const summaryStats = useMemo(() => {
    const stats = {
      total: 0,
      totalParas: 0,
      sfi: { total: 0, bsr: 0, kb: 0, paras: 0 },
      nonSfi: { total: 0, bsr: 0, kb: 0, paras: 0 }
    };
    
    filteredData.forEach(e => {
      stats.total++;
      const paras = parseInt(toEnglishDigits(e.totalParas || '0')) || 0;
      stats.totalParas += paras;

      if (e.paraType === 'এসএফআই') {
        stats.sfi.total++;
        stats.sfi.paras += paras;
        if (e.letterType === 'বিএসআর') stats.sfi.bsr++;
        if (e.letterType?.includes('কার্যবিবরণী')) stats.sfi.kb++;
      } else if (e.paraType === 'নন এসএফআই') {
        stats.nonSfi.total++;
        stats.nonSfi.paras += paras;
        if (e.letterType === 'বিএসআর') stats.nonSfi.bsr++;
        if (e.letterType?.includes('কার্যবিবরণী')) stats.nonSfi.kb++;
      }
    });
    return stats;
  }, [filteredData]);

  const getPositionColor = (name: string) => {
    const pos = name || 'অডিটর';
    if (pos.includes('অডিটর')) return 'bg-red-500 text-white';
    if (pos.includes('সুপার')) return 'bg-yellow-400 text-black';
    if (pos.includes('এএন্ডএও')) return 'bg-blue-600 text-white';
    if (pos.includes('উপপরিচালক')) return 'bg-green-600 text-white';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div id="correspondence-dhaka-container" className="space-y-4 py-2 px-[4px] w-full animate-report-page relative">
      <IDBadge id="correspondence-dhaka-container" />

      <div className="bg-white w-full overflow-visible px-0 py-6 relative animate-table-entrance">
        {/* Header container for Title, Reporting Period and Statistics in a single line on desktop/lg screens */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8 pt-4 pb-6 border-b border-slate-100 w-full px-6">
          
          {/* Left: Title Header styled as split-block button */}
          <div className="flex items-stretch h-11 w-fit max-w-[95%] shadow-[0_4px_12px_rgba(0,0,0,0.1)] select-none rounded-lg overflow-hidden border border-slate-200/50 shrink-0 transition-all duration-300">
            {/* Left Icon Area: Off-white bg & gray bottom border */}
            <div className={`flex flex-col shrink-0 h-full transition-all duration-300 ${isSearchExpanded ? 'w-8' : 'w-11'}`}>
              <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                <FileText className={`text-red-700 stroke-[2.5] transition-all duration-300 ${isSearchExpanded ? 'w-4 h-4' : 'w-4.5 h-4.5'}`} />
              </div>
              <div className="h-[4px] bg-[#94a3b8]" />
            </div>
            
            {/* Right Text Area: Rich Royal Blue/Indigo with dark bottom bar */}
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSearchExpanded ? 'min-w-[130px] sm:min-w-[150px]' : 'min-w-[180px] sm:min-w-[220px]'}`}>
              <div className="flex-1 bg-[#1e40af] flex items-center justify-center px-3 sm:px-6">
                <span className={`text-white font-bold tracking-wide text-center transition-all duration-300 whitespace-nowrap ${isSearchExpanded ? 'text-[10px] sm:text-[11.5px]' : 'text-xs sm:text-[13px]'}`}>
                  {isSearchExpanded ? 'চিঠিপত্র রিটার্ণ (ঢাকা)' : 'চিঠিপত্র সংক্রান্ত রিটার্ণ (ঢাকা)'}
                </span>
              </div>
              <div className="h-[4px] bg-[#1e3a8a]" />
            </div>
          </div>

          {/* Right/Middle: Group of Compact Controls */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
            {/* 1. Reporting Period Date Picker */}
            <div className="relative shrink-0 select-none z-[400]" ref={calendarRef}>
              <div 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="relative inline-flex items-center gap-2 px-3 h-[35px] bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 transition-all text-white rounded-xl text-[11px] sm:text-[11.5px] font-bold shadow-md cursor-pointer"
              >
                <span className={`text-blue-400 leading-none transition-all duration-300 ${isSearchExpanded ? 'hidden xl:inline' : 'hidden sm:inline'}`}>রিপোর্টিং সময়কাল:</span> 
                <span className="text-white flex items-center gap-1 font-black leading-none">
                  {toBengaliDigits(dateFnsFormat(selectedMonthDate, 'dd/MM/yyyy'))} খ্রি: তারিখ পর্যন্ত।
                  <Calendar size={11} className="text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                </span>
                <ChevronDown size={11} className={`text-slate-400 transition-transform duration-300 lg:inline shrink-0 ${isCalendarOpen ? 'rotate-180 text-emerald-400' : ''}`} />
              </div>

              {isCalendarOpen && (
                <div className="absolute top-[110%] right-0 lg:left-1/2 lg:-translate-x-1/2 w-[300px] bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      type="button"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="font-extrabold text-[14px] text-slate-800">
                      {BENGALI_MONTHS[currentViewDate.getMonth()]} {toBengaliDigits(currentViewDate.getFullYear().toString())}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      type="button"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Calendar Week Days */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {BENGALI_WEEKDAYS.map((wd, i) => (
                      <span key={i} className="text-[11px] font-black text-slate-400">
                        {wd}
                      </span>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const Y = currentViewDate.getFullYear();
                      const M = currentViewDate.getMonth();
                      const firstDay = new Date(Y, M, 1);
                      
                      let startOffset = (firstDay.getDay() + 1) % 7; 
                      
                      const daysInMonth = new Date(Y, M + 1, 0).getDate();
                      const prevMonthDays = new Date(Y, M, 0).getDate();
                      
                      const cells = [];
                      
                      // Trailing days
                      for (let i = startOffset - 1; i >= 0; i--) {
                        const d = prevMonthDays - i;
                        const dateObj = new Date(Y, M - 1, d);
                        cells.push({ day: d, isCurrentMonth: false, dateObj });
                      }
                      
                      // Current month days
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateObj = new Date(Y, M, d);
                        cells.push({ day: d, isCurrentMonth: true, dateObj });
                      }
                      
                      // Lead days
                      const remaining = 42 - cells.length;
                      for (let d = 1; d <= remaining; d++) {
                        const dateObj = new Date(Y, M + 1, d);
                        cells.push({ day: d, isCurrentMonth: false, dateObj });
                      }

                      return cells.map((cell, idx) => {
                        const dateStr = dateFnsFormat(cell.dateObj, 'yyyy-MM-dd');
                        const isSelected = dateFnsFormat(cell.dateObj, 'yyyy-MM-dd') === dateFnsFormat(selectedMonthDate, 'yyyy-MM-dd');
                        
                        let cellCls = "text-[12px] font-bold h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ";
                        if (isSelected) {
                          cellCls += "bg-blue-600 text-white font-extrabold shadow-md";
                        } else if (cell.isCurrentMonth) {
                          cellCls += "text-slate-800 hover:bg-blue-50 hover:text-blue-600";
                        } else {
                          cellCls += "text-slate-300 hover:bg-slate-50";
                        }

                        // Check if today
                        const todayStr = dateFnsFormat(new Date(), 'yyyy-MM-dd');
                        const isToday = dateStr === todayStr;

                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMonthDate(cell.dateObj);
                              setIsCalendarOpen(false);
                            }}
                            className={`${cellCls} relative`}
                          >
                            <span>{toBengaliDigits(cell.day.toString())}</span>
                            {isToday && !isSelected && (
                              <span className="absolute bottom-[2px] w-1 h-1 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Branch Filter Dropdown */}
            <div className="relative group shrink-0 no-print" ref={branchDropdownRef}>
              <div 
                className="relative flex items-center gap-1.5 px-2.5 h-[35px] bg-slate-50 border border-slate-300 rounded-xl cursor-pointer transition-all duration-300 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-50 shadow-sm min-w-[115px] sm:min-w-[130px]"
              >
                <LayoutGrid size={13} className="text-emerald-600 shrink-0" />
                <span className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-800 break-words leading-none">
                  {filterParaType === 'সকল' ? 'সকল শাখা' : filterParaType}
                </span>
                <ChevronDown size={11} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-emerald-600 shrink-0" />
              </div>
              
              <div className="absolute top-full left-0 w-full pt-1 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-[2000]">
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-[220px] overflow-y-auto no-scrollbar">
                    {branchOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setFilterParaType(opt)} 
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${filterParaType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[11.5px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'সকল শাখা' : opt}</span>
                        {filterParaType === opt && <Check size={12} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Type Filter Dropdown */}
            <div className="relative group shrink-0 no-print" ref={typeDropdownRef}>
              <div 
                className="relative flex items-center gap-1.5 px-2.5 h-[35px] bg-slate-50 border border-slate-300 rounded-xl cursor-pointer transition-all duration-300 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-50 shadow-sm min-w-[125px] sm:min-w-[145px]"
              >
                <FileText size={13} className="text-emerald-600 shrink-0" />
                <span className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-800 break-words leading-none">
                  {filterLetterType === 'সকল' ? 'চিঠির ধরন' : filterLetterType}
                </span>
                <ChevronDown size={11} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-emerald-600 shrink-0" />
              </div>
              
              <div className="absolute top-full left-0 w-full pt-1 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-[2000]">
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="py-0">
                    {typeOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setFilterLetterType(opt)} 
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${filterLetterType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[11.5px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'চিঠির ধরন' : opt}</span>
                        {filterLetterType === opt && <Check size={12} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Search Filter */}
            <div className={`relative flex items-center transition-all duration-300 shrink-0 no-print ${isSearchExpanded ? 'w-[140px] sm:w-[170px]' : 'w-[35px]'}`}>
              {!isSearchExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(true)}
                  className="flex items-center justify-center w-[35px] h-[35px] bg-slate-50 border border-slate-300 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-600 transition-all cursor-pointer shadow-sm"
                  title="অনুসন্ধান করুন"
                >
                  <Search size={14} />
                </button>
              ) : (
                <div className="relative w-full group animate-in fade-in zoom-in-95 duration-200">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600" size={12} />
                  <input 
                    ref={searchInputRef}
                    type="text"
                    placeholder="অনুসন্ধান..."
                    className="w-full pl-7.5 pr-6 h-[35px] bg-white border border-emerald-600 rounded-xl text-[11px] font-bold text-slate-800 outline-none shadow-md transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      if (!searchTerm) {
                        setIsSearchExpanded(false);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* 5. Statistics Trigger Button */}
            <button 
              onClick={() => setShowAuditorStatsModal(true)}
              className="flex items-center justify-center gap-1 px-2.5 h-[35px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] sm:text-[11.5px] font-black transition-all shadow-md hover:shadow-blue-200/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 no-print"
            >
              <BarChart3 size={12} />
              <span className="leading-none">পরিসংখ্যান</span>
            </button>
          </div>
        </div>

        <div className="table-container relative overflow-auto border border-slate-300 rounded-lg">
          <table className="w-full border-separate table-fixed border-spacing-0 !table-auto">
            <colgroup>
              <col className="w-[40px]" />
              <col className="w-[150px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[55px]" />
              <col className="w-[75px]" />
              <col className="w-[55px]" />
              <col className="w-[55px]" />
              <col className="w-[55px]" />
              <col className="w-[60px]" />
              <col className="w-[70px]" />
              <col className="w-[70px]" />
              <col className="w-[50px]" />
            </colgroup>
            <thead>
              <tr className="h-[42px]">
                <th rowSpan={2} className={thS}>ক্রমিক নং</th>
                <th rowSpan={2} className={thS}>এনটিটি/প্রতিষ্ঠানের নাম</th>
                <th rowSpan={2} className={thS}>ডায়েরি নং ও তারিখ</th>
                <th rowSpan={2} className={thS}>পত্রের স্মারক নং ও তারিখ</th>
                <th colSpan={5} className={thS}>চিঠি-পত্রের ধরণ ও অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={thS}>AMMS-এ এন্ট্রি হয়েছে কিনা? হ্যাঁ/না</th>
                <th rowSpan={2} className={thS}>উপস্থাপনের তারিখ</th>
                <th rowSpan={2} className={thS}>বর্তমান অবস্থান</th>
                <th rowSpan={2} className={thS}>মন্তব্য</th>
              </tr>
              <tr className="h-[38px]">
                <th className={thS}>বিএসআর (SFI)</th>
                <th className={thS}>বিএসআর (NON-SFI)</th>
                <th className={thS}>ত্রি-পক্ষীয় (SFI)</th>
                <th className={thS}>দ্বি-পক্ষীয় (NON-SFI)</th>
                <th className={thS}>অন্যান্য</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((entry, idx) => (
                <tr key={entry.id} className="no-hover-row group bg-white hover:bg-blue-100/70 transition-all duration-200 cursor-default">
                  <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                  <td className={`${tdS} text-left px-2 transition-colors`}>{entry.description}</td>
                  <td className={tdS}>{entry.diaryNo}<br/>{formatDateBN(entry.diaryDate)}</td>
                  <td className={tdS}>{entry.letterNo}<br/>{formatDateBN(entry.letterDate)}</td>
                  <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'নন এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{(entry.letterType.includes('ত্রিপক্ষীয় সভা') || entry.letterType === 'কার্যপত্র' || entry.letterType === 'কার্যবিবরণী') && entry.paraType === 'এসএফআই' ? `${entry.letterType} (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{(entry.letterType.includes('দ্বিপক্ষীয় সভা') || entry.letterType === 'কার্যপত্র' || entry.letterType === 'কার্যবিবরণী') && entry.paraType === 'নন এসএফআই' ? `${entry.letterType} (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>-</td>
                  <td className={tdS}>{entry.isOnline === 'হ্যাঁ' ? 'হ্যাঁ' : 'না'}</td>
                  <td className={tdS}>{formatDateBN(entry.presentationDate)}</td>
                  <td className={`${tdS} p-1`}>
                    <div className={`w-full h-[26px] flex items-center justify-center font-black rounded-md shadow-sm ${getPositionColor(entry.presentedToName)}`}>
                      {entry.presentedToName || 'অডিটর'}
                    </div>
                  </td>
                  <td className={tdS}>{entry.remarks || 'চলমান'}</td>
                </tr>
              )) : (
                <tr><td colSpan={13} className="py-20 text-center font-black text-slate-400 bg-slate-50 italic">এই সাইকেলে কোনো চিঠিপত্র তথ্য পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
            <tfoot className="z-[120]">
              <tr className="bg-black text-white font-black text-[12px] h-11 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t-2 border-slate-400">
                <td colSpan={2} className="px-4 text-left border-t border-slate-400 bg-black text-white">সর্বমোট চিঠিপত্র (ফিল্টারকৃত):</td>
                <td colSpan={2} className="px-4 text-center border-t border-slate-400 bg-black text-emerald-400">{toBengaliDigits(filteredData.length)} টি</td>
                <td colSpan={9} className="border-t border-slate-400 bg-black"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      {/* Auditor Statistics Modal */}
      {showAuditorStatsModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 xl:p-8 animate-in fade-in duration-200">
          <div className={`w-full ${isDetailsModalOpen ? 'max-w-[95%] lg:max-w-7xl h-[85vh]' : 'max-w-2xl max-h-[90vh]'} flex flex-col lg:flex-row items-stretch gap-4 transition-all duration-300`}>
            
            {/* Auditor Stats Card */}
            <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isDetailsModalOpen ? 'w-full lg:w-[29%] shrink-0 h-full' : 'w-full max-h-full'}`}>
               <div className="bg-slate-900 px-6 py-3.5 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                     <BarChart3 size={20} className="text-blue-400" />
                   </div>
                   <div>
                     <h3 className="text-white font-bold text-[16px]">অডিটর ভিত্তিক পরিসংখ্যান</h3>
                     <p className="text-slate-400 text-[11px] font-bold">কার কাছে কয়টি চিঠি আছে তার বিস্তারিত হিসাব</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => {
                    setShowAuditorStatsModal(false);
                    setIsDetailsModalOpen(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className={`overflow-y-auto no-scrollbar flex-1 min-h-0 ${isDetailsModalOpen ? 'p-2' : 'p-4 sm:p-6'}`}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[9.5px]' : 'px-1 py-1.5 text-[10px] sm:text-[11px]'} text-center font-black text-slate-700 leading-tight`}>অডিটর</th>
                      <th className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[9.5px]' : 'px-1 py-1.5 text-[10px] sm:text-[11px]'} text-center font-black text-slate-700 leading-tight`}>অডিটরের</th>
                      <th className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[9.5px]' : 'px-1 py-1.5 text-[10px] sm:text-[11px]'} text-center font-black text-slate-700 leading-tight`}>এএন্ডএও</th>
                      <th className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[9.5px]' : 'px-1 py-1.5 text-[10px] sm:text-[11px]'} text-center font-black text-slate-700 leading-tight`}>উপপরিচালক</th>
                      <th className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[9.5px]' : 'px-1 py-1.5 text-[10px] sm:text-[11px]'} text-center font-black text-slate-700 leading-tight`}>মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditorWiseStats.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                        <td className={`border border-slate-200 ${isDetailsModalOpen ? 'p-0.5' : 'px-1 py-2'} text-center align-middle`}>
                          <div className={`flex flex-col items-center justify-center gap-1 w-full mx-auto ${isDetailsModalOpen ? 'max-w-[65px]' : 'min-w-[80px]'}`}>
                            {receiverImages[stat.name] || receiverImages[normalizeName(stat.name)] ? (
                              <img 
                                src={receiverImages[stat.name] || receiverImages[normalizeName(stat.name)]} 
                                alt={stat.name} 
                                className={`${isDetailsModalOpen ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-lg' : 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl'} object-cover border border-slate-100 shrink-0 shadow-sm`} 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`${isDetailsModalOpen ? 'w-6 h-6 sm:w-7 sm:h-7 text-[8px] rounded-lg' : 'w-9 h-9 sm:w-10 sm:h-10 text-xs rounded-xl'} bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0 uppercase shadow-sm`}>
                                {stat.name.slice(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-col items-center min-w-0 w-full">
                              <span className={`${isDetailsModalOpen ? 'text-[7.5px] sm:text-[8px] tracking-tight' : 'text-[10px] sm:text-[11.5px]'} font-extrabold text-slate-800 leading-tight text-center break-words w-full`}>{stat.name}</span>
                              <span className={`${isDetailsModalOpen ? 'text-[6.5px] sm:text-[7px]' : 'text-[8px] sm:text-[9.5px]'} font-bold text-slate-400 leading-none mt-0.5 text-center break-words w-full`}>
                                {receiverDesignations[stat.name] || receiverDesignations[normalizeName(stat.name)] || "অডিটর"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td 
                          className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[10px]' : 'px-1 py-1.5 text-[10px] sm:text-[11.5px]'} text-center font-black text-red-600 bg-red-50/30 cursor-pointer hover:bg-red-100/50 transition-all ${getHighlightClass(`${stat.name} - অডিটরের কাছে`)}`}
                          onClick={() => handleCountClick(`${stat.name} - অডিটরের কাছে`, stat.auditorLetters)}
                        >
                          {toBengaliDigits(stat.auditor)} টি
                        </td>
                        <td 
                          className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[10px]' : 'px-1 py-1.5 text-[10px] sm:text-[11.5px]'} text-center font-black text-blue-600 bg-blue-50/30 cursor-pointer hover:bg-blue-100/50 transition-all ${getHighlightClass(`${stat.name} - এএন্ডএও`)}`}
                          onClick={() => handleCountClick(`${stat.name} - এএন্ডএও`, stat.aaoLetters)}
                        >
                          {toBengaliDigits(stat.aao)} টি
                        </td>
                        <td 
                          className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[10px]' : 'px-1 py-1.5 text-[10px] sm:text-[11.5px]'} text-center font-black text-green-600 bg-green-50/30 cursor-pointer hover:bg-green-100/50 transition-all ${getHighlightClass(`${stat.name} - উপপরিচালক`)}`}
                          onClick={() => handleCountClick(`${stat.name} - উপপরিচালক`, stat.ddLetters)}
                        >
                          {toBengaliDigits(stat.dd)} টি
                        </td>
                        <td 
                          className={`border border-slate-200 ${isDetailsModalOpen ? 'px-0.5 py-1 text-[8.5px] sm:text-[10px]' : 'px-1 py-1.5 text-[10px] sm:text-[11.5px]'} text-center font-black text-slate-900 bg-slate-50 cursor-pointer hover:bg-slate-200/50 transition-all ${getHighlightClass(`${stat.name} - মোট`)}`}
                          onClick={() => handleCountClick(`${stat.name} - মোট`, stat.totalLetters)}
                        >
                          {toBengaliDigits(stat.total)} টি
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {auditorWiseStats.length === 0 && (
                  <div className="py-10 text-center text-slate-400 font-bold italic">
                    কোনো তথ্য পাওয়া যায়নি।
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 px-6 py-3.5 flex justify-end border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => {
                    setShowAuditorStatsModal(false);
                    setIsDetailsModalOpen(false);
                  }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-[12px] hover:bg-slate-800 transition-all shadow-md"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>

            {/* Embedded letters detail card */}
            {isDetailsModalOpen && (
              <div className="w-full lg:flex-1 h-full flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
                <LetterDetailsModal 
                  isOpen={isDetailsModalOpen}
                  onClose={() => setIsDetailsModalOpen(false)}
                  title={detailsModalTitle}
                  letters={detailsModalLetters}
                  isEmbedded={true}
                />
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
      {/* Letter Details Modal (fallback only) */}
      {!showAuditorStatsModal && (
        <LetterDetailsModal 
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={detailsModalTitle}
          letters={detailsModalLetters}
        />
      )}
    </div>
  );
};

  export default CorrespondenceDhakaReturn;