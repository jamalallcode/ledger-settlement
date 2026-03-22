
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, ChevronLeft, Search, X, ChevronDown, Check, LayoutGrid, FileText, ChevronRight, Sparkles, BarChart3, Calendar } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';

interface CorrespondenceDhakaReturnProps {
  correspondenceEntries: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
  showFilters: boolean;
}

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
    const reportingLimitDate = selectedMonthDate;
    
    data = data.filter(e => {
      if (!e.diaryDate) return false;
      const dDateStr = toEnglishDigits(e.diaryDate);
      const dDate = new Date(dDateStr);
      if (isNaN(dDate.getTime())) return false;
      
      // Must be received ON OR BEFORE reportingLimitDate
      if (dDate.getTime() > reportingLimitDate.getTime()) return false;
      
      // If it was issued AFTER reportingLimitDate, it was still pending AT THAT TIME
      const issueDateStr = e.issueLetterDate ? toEnglishDigits(e.issueLetterDate) : null;
      const issueDate = issueDateStr ? new Date(issueDateStr) : null;
      
      const hasIssueNo = e.issueLetterNo && 
                         e.issueLetterNo !== '০' && 
                         e.issueLetterNo !== '0' && 
                         !e.issueLetterNo.includes('নং-');

      if (hasIssueNo && issueDate && !isNaN(issueDate.getTime())) {
        if (issueDate.getTime() > reportingLimitDate.getTime()) {
          return true; // Still pending at reporting time
        }
        return false; // Already issued by reporting time
      }
      
      return true; // Not issued yet
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

  const summaryStats = useMemo(() => {
    const stats = {
      total: correspondenceEntries.length,
      totalParas: 0,
      sfi: { total: 0, bsr: 0, kp: 0, kb: 0, reconciliation: 0, paras: 0 },
      nonSfi: { total: 0, bsr: 0, kp: 0, kb: 0, reconciliation: 0, paras: 0 }
    };
    correspondenceEntries.forEach(e => {
      const paras = parseInt(toEnglishDigits(e.totalParas || '0')) || 0;
      stats.totalParas += paras;

      if (e.paraType === 'এসএফআই') {
        stats.sfi.total++;
        stats.sfi.paras += paras;
        if (e.letterType === 'বিএসআর') stats.sfi.bsr++;
        if (e.letterType?.includes('কার্যপত্র')) stats.sfi.kp++;
        if (e.letterType?.includes('কার্যবিবরণী')) stats.sfi.kb++;
        if (e.letterType === 'মিলিকরণ') stats.sfi.reconciliation++;
      } else if (e.paraType === 'নন এসএফআই') {
        stats.nonSfi.total++;
        stats.nonSfi.paras += paras;
        if (e.letterType === 'বিএসআর') stats.nonSfi.bsr++;
        if (e.letterType?.includes('কার্যপত্র')) stats.nonSfi.kp++;
        if (e.letterType?.includes('কার্যবিবরণী')) stats.nonSfi.kb++;
        if (e.letterType === 'মিলিকরণ') stats.nonSfi.reconciliation++;
      }
    });
    return stats;
  }, [correspondenceEntries]);

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
                        (বিএসআর: {toBengaliDigits(summaryStats.sfi.bsr)} টি, ত্রিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(summaryStats.sfi.kp)} টি, ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(summaryStats.sfi.kb)} টি, মিলিকরণ: {toBengaliDigits(summaryStats.sfi.reconciliation)} টি)
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-black text-[14px]">নন এসএফআই:</span>
                        <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(summaryStats.nonSfi.total)} টি</span>
                        <span className="text-emerald-600 font-bold text-[12px] ml-1">({toBengaliDigits(summaryStats.nonSfi.paras)} টি অনুচ্ছেদ)</span>
                      </div>
                      <div className="text-slate-600 font-bold text-[11px] leading-relaxed pl-4">
                        (বিএসআর: {toBengaliDigits(summaryStats.nonSfi.bsr)} টি, দ্বিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(summaryStats.nonSfi.kp)} টি, দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(summaryStats.nonSfi.kb)} টি, মিলিকরণ: {toBengaliDigits(summaryStats.nonSfi.reconciliation)} টি)
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

      <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-6 relative animate-table-entrance flex flex-col min-h-[calc(100vh-120px)]">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
            চিঠিপত্র সংক্রান্ত রিটার্ণ (ঢাকা)
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
        </div>

        <div className="table-container relative overflow-auto border border-slate-300 rounded-lg flex-grow min-h-[600px]">
          <table className="w-full border-separate table-fixed border-spacing-0 !table-auto min-h-full">
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
                <tr key={entry.id} className="group bg-white hover:bg-blue-100/70 transition-all duration-200 cursor-default">
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
              <tr className="bg-slate-50 text-slate-900 font-black text-[12px] h-11 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t-2 border-slate-300">
                <td colSpan={2} className="px-4 text-left border-t border-slate-300 bg-slate-50">সর্বমোট চিঠিপত্র (ফিল্টারকৃত):</td>
                <td colSpan={2} className="px-4 text-center border-t border-slate-300 bg-slate-50 text-emerald-600">{toBengaliDigits(filteredData.length)} টি</td>
                <td colSpan={9} className="border-t border-slate-300 bg-slate-50"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

  export default CorrespondenceDhakaReturn;
