
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, ChevronLeft, Search, X, ChevronDown, Check, LayoutGrid, FileText, ChevronRight, Sparkles, BarChart3, Calendar } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';
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
  
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [dateInputText, setDateInputText] = useState(dateFnsFormat(selectedMonthDate, 'dd/MM/yyyy'));
  
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

  const handleCountClick = (title: string, letters: any[]) => {
    if (letters.length === 0) return;
    setDetailsModalTitle(title);
    setDetailsModalLetters(letters);
    setIsDetailsModalOpen(true);
  };

  const normalizeName = (name: string | null | undefined) => {
    if (!name) return 'অনির্ধারিত';
    return name
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
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
    <div id="correspondence-dhaka-container" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="correspondence-dhaka-container" />
      {showFilters && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button 
                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 font-bold text-[12px] no-print ${showStats ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
              >
                <Sparkles size={14} className={showStats ? 'animate-pulse' : ''} />
                পরিসংখ্যান <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all">
                <div className="space-y-5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <BarChart3 size={16} className="text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-blue-700 font-black text-[15px]">মোট চিঠি: {toBengaliDigits(summaryStats.total)} টি</span>
                        <span className="text-emerald-600 font-bold text-[12px]">মোট অনুচ্ছেদ: {toBengaliDigits(summaryStats.totalParas)} টি</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-black text-[14px]">এসএফআই:</span>
                        <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(summaryStats.sfi.total)} টি</span>
                        <span className="text-emerald-600 font-bold text-[12px] ml-1">({toBengaliDigits(summaryStats.sfi.paras)} টি অনুচ্ছেদ)</span>
                      </div>
                      <div className="text-slate-600 font-bold text-[11px] leading-relaxed pl-4">
                        (বিএসআর: {toBengaliDigits(summaryStats.sfi.bsr)} টি, ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(summaryStats.sfi.kb)} টি)
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-black text-[14px]">নন এসএফআই:</span>
                        <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(summaryStats.nonSfi.total)} টি</span>
                        <span className="text-emerald-600 font-bold text-[12px] ml-1">({toBengaliDigits(summaryStats.nonSfi.paras)} টি অনুচ্ছেদ)</span>
                      </div>
                      <div className="text-slate-600 font-bold text-[11px] leading-relaxed pl-4">
                        (বিএসআর: {toBengaliDigits(summaryStats.nonSfi.bsr)} টি, দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(summaryStats.nonSfi.kb)} টি)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Branch Filter */}
            <div className="space-y-1 relative group" ref={branchDropdownRef}>
              <div 
                className={customDropdownCls(false) + " min-w-[160px] group-hover:border-emerald-600 group-hover:ring-4 group-hover:ring-emerald-50 shadow-sm transition-all duration-300"}
              >
                <LayoutGrid size={16} className="text-emerald-600" />
                <span className="font-bold text-[12px] text-slate-900 break-words">
                  {filterParaType === 'সকল' ? 'সকল শাখা' : filterParaType}
                </span>
                <ChevronDown size={14} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-emerald-600" />
              </div>
              
              <div className="absolute top-full left-0 w-full pt-2 opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-[2000]">
                <div className="min-w-[180px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="max-h-[250px] overflow-y-auto no-scrollbar py-2">
                    {branchOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setFilterParaType(opt)} 
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterParaType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[12px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'সকল শাখা' : opt}</span>
                        {filterParaType === opt && <Check size={14} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-1 relative group" ref={typeDropdownRef}>
              <div 
                className={customDropdownCls(false) + " min-w-[160px] group-hover:border-emerald-600 group-hover:ring-4 group-hover:ring-emerald-50 shadow-sm transition-all duration-300"}
              >
                <FileText size={16} className="text-emerald-600" />
                <span className="font-bold text-[12px] text-slate-900 break-words">
                  {filterLetterType === 'সকল' ? 'চিঠির ধরন' : filterLetterType}
                </span>
                <ChevronDown size={14} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-emerald-600" />
              </div>
              
              <div className="absolute top-full left-0 w-full pt-2 opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-[2000]">
                <div className="min-w-[180px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-visible">
                  <div className="py-2">
                    {typeOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setFilterLetterType(opt)} 
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterLetterType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[12px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'চিঠির ধরন' : opt}</span>
                        {filterLetterType === opt && <Check size={14} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="ডায়েরি, স্মারক বা বিবরণ..."
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Date Picker */}
            <div className="relative group flex items-center">
              <div className="relative flex items-center w-[180px] h-[44px] bg-white border border-slate-300 rounded-xl shadow-sm hover:border-emerald-600 transition-all duration-300 overflow-hidden">
                <input 
                  type="text"
                  value={dateInputText}
                  onChange={handleDateTextChange}
                  placeholder="DD/MM/YYYY"
                  className="pl-4 pr-10 w-full h-full bg-transparent outline-none font-bold text-[14px] text-slate-800"
                  title="বাম পাশে টাইপ করুন"
                />
                <div className="absolute right-3 pointer-events-none text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <Calendar size={18} />
                </div>
                {/* Interaction Layer: Covers the right 60% of the area to capture clicks for the calendar */}
                <input 
                  ref={dateInputRef}
                  type="date"
                  value={dateFnsFormat(selectedMonthDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setSelectedMonthDate(newDate);
                    }
                  }}
                  className="absolute top-0 right-0 bottom-0 w-[60%] opacity-0 cursor-pointer z-10"
                  title="ক্যালেন্ডার ওপেন করতে এখানে ক্লিক করুন"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-6 relative animate-table-entrance">
        <div className="text-center mb-8 pt-4 relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
            চিঠিপত্র সংক্রান্ত রিটার্ণ (ঢাকা)।
          </h1>
          
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
              <span className="text-blue-400">চিঠিপত্র সংক্রান্ত রিটার্ণ (ঢাকা) | {toBengaliDigits(dateFnsFormat(selectedMonthDate, 'dd/MM/yyyy'))} খ্রি: তারিখ পর্যন্ত।</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>

          {/* New Statistics Button */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 no-print">
            <button 
              onClick={() => setShowAuditorStatsModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-black transition-all shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5"
            >
              <BarChart3 size={16} />
              পরিসংখ্যান
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
      {showAuditorStatsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
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
                onClick={() => setShowAuditorStatsModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 p-2 text-left text-[12px] font-black text-slate-700">অডিটর</th>
                    <th className="border border-slate-200 p-2 text-center text-[12px] font-black text-slate-700">অডিটরের কাছে</th>
                    <th className="border border-slate-200 p-2 text-center text-[12px] font-black text-slate-700">এএন্ডএও</th>
                    <th className="border border-slate-200 p-2 text-center text-[12px] font-black text-slate-700">উপপরিচালক</th>
                    <th className="border border-slate-200 p-2 text-center text-[12px] font-black text-slate-700">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {auditorWiseStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="border border-slate-200 p-2 text-[12px] font-bold text-slate-900">{stat.name}</td>
                      <td 
                        className="border border-slate-200 p-2 text-center text-[12px] font-black text-red-600 bg-red-50/30 cursor-pointer hover:bg-red-100/50 transition-all"
                        onClick={() => handleCountClick(`${stat.name} - অডিটরের কাছে`, stat.auditorLetters)}
                      >
                        {toBengaliDigits(stat.auditor)} টি
                      </td>
                      <td 
                        className="border border-slate-200 p-2 text-center text-[12px] font-black text-blue-600 bg-blue-50/30 cursor-pointer hover:bg-blue-100/50 transition-all"
                        onClick={() => handleCountClick(`${stat.name} - এএন্ডএও`, stat.aaoLetters)}
                      >
                        {toBengaliDigits(stat.aao)} টি
                      </td>
                      <td 
                        className="border border-slate-200 p-2 text-center text-[12px] font-black text-green-600 bg-green-50/30 cursor-pointer hover:bg-green-100/50 transition-all"
                        onClick={() => handleCountClick(`${stat.name} - উপপরিচালক`, stat.ddLetters)}
                      >
                        {toBengaliDigits(stat.dd)} টি
                      </td>
                      <td 
                        className="border border-slate-200 p-2 text-center text-[12px] font-black text-slate-900 bg-slate-50 cursor-pointer hover:bg-slate-200/50 transition-all"
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
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setShowAuditorStatsModal(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-[12px] hover:bg-slate-800 transition-all shadow-md"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Letter Details Modal */}
      <LetterDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={detailsModalTitle}
        letters={detailsModalLetters}
      />
    </div>
  );
};

  export default CorrespondenceDhakaReturn;