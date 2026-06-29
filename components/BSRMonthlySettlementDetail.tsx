import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, ChevronDown, FileSpreadsheet, LayoutGrid, Search, X, CheckCircle2, CalendarDays, Check, Landmark, ArrowLeftRight } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format as dateFnsFormat, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

interface BSRMonthlySettlementDetailProps {
  entries: SettlementEntry[];
  selectedCycleDate: Date;
  setSelectedCycleDate: (date: Date) => void;
  activeCycle: any;
  cycleOptions: any[];
  ministryGroups: string[];
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  onToggleSummaryView?: () => void; // Option to switch back to summary
}

const BSRMonthlySettlementDetail: React.FC<BSRMonthlySettlementDetailProps> = ({
  entries,
  selectedCycleDate,
  setSelectedCycleDate,
  activeCycle,
  cycleOptions,
  ministryGroups,
  IDBadge,
  onBack,
  onToggleSummaryView
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMinistry, setFilterMinistry] = useState('সকল');
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ministryDropdownRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCycleDropdownOpen(false);
      }
      if (ministryDropdownRef.current && !ministryDropdownRef.current.contains(e.target as Node)) {
        setIsMinistryDropdownOpen(false);
      }
      if (statsRef.current && !statsRef.current.contains(e.target as Node)) {
        setIsStatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const startOfMonthDate = startOfMonth(selectedCycleDate);
  const endOfMonthDate = endOfMonth(selectedCycleDate);

  // Filter entries for Non-SFI and BSR matching selected calendar month
  const filteredEntries = useMemo(() => {
    const list: SettlementEntry[] = [];
    
    entries.forEach(e => {
      // 1. Filter by Non-SFI branch
      if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return;
      
      // 2. Filter by BSR letter/meeting type
      const meetingType = robustNormalize(e.meetingType || e.letterType || '');
      if (!meetingType.includes(robustNormalize('বিএসআর'))) return;
      
      // 3. Filter by Date range of the selected month
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const entryDate = new Date(issueDateStr);
      if (entryDate < startOfMonthDate || entryDate > endOfMonthDate) return;
      
      // 4. Ministry filter
      if (filterMinistry && filterMinistry !== 'সকল') {
        if (robustNormalize(e.ministryName || '') !== robustNormalize(filterMinistry)) return;
      }
      
      // 5. Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match = 
          (e.ministryName || '').toLowerCase().includes(term) ||
          (e.entityName || '').toLowerCase().includes(term) ||
          (e.remarks || '').toLowerCase().includes(term) ||
          (e.archiveNo || '').toLowerCase().includes(term) ||
          (e.letterNoDate || '').toLowerCase().includes(term) ||
          (e.issueLetterNoDate || '').toLowerCase().includes(term);
        if (!match) return;
      }
      
      list.push(e);
    });
    
    return list;
  }, [entries, selectedCycleDate, filterMinistry, searchTerm]);

  // Calculations for total statistics
  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      const rowSentCount = parseInt(toEnglishDigits(curr.meetingSentParaCount || '0')) || curr.paragraphs?.length || 0;
      const rowSettledCount = curr.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0;
      const rowUnsettledCount = parseInt(toEnglishDigits(curr.meetingUnsettledParas || '0')) || Math.max(0, rowSentCount - rowSettledCount);

      const sentPara = acc.sentPara + rowSentCount;
      const settledPara = acc.settledPara + rowSettledCount;
      const involvedAmount = acc.involvedAmount + (curr.involvedAmount || 0);
      const recoveredAmount = acc.recoveredAmount + (curr.totalRec || 0);
      const adjustedAmount = acc.adjustedAmount + (curr.totalAdj || 0);
      const othersAmount = acc.othersAmount + (curr.othersRec || 0) + (curr.othersAdj || 0);
      const unsettledPara = acc.unsettledPara + rowUnsettledCount;
      
      const entryUnsettledAmount = Math.max(0, (curr.involvedAmount || 0) - (curr.totalRec || 0) - (curr.totalAdj || 0) - (curr.othersRec || 0) - (curr.othersAdj || 0));
      const unsettledAmount = acc.unsettledAmount + entryUnsettledAmount;
      
      return {
        sentPara,
        settledPara,
        involvedAmount,
        recoveredAmount,
        adjustedAmount,
        othersAmount,
        unsettledPara,
        unsettledAmount,
        totalSettled: recoveredAmount + adjustedAmount + othersAmount
      };
    }, {
      sentPara: 0,
      settledPara: 0,
      involvedAmount: 0,
      recoveredAmount: 0,
      adjustedAmount: 0,
      othersAmount: 0,
      unsettledPara: 0,
      unsettledAmount: 0,
      totalSettled: 0
    });
  }, [filteredEntries]);

  const downloadExcel = () => {
    const table = document.getElementById('table-bsr-monthly-detail');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());
    
    const formattedMonth = dateFnsFormat(selectedCycleDate, 'MMMM_yyyy');
    const filename = `বিএসআর_মাসিক_নিষ্পত্তি_বিস্তারিত_${formattedMonth}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>নিষ্পত্তি বিস্তারিত</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #94a3b8 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .font-bold { font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 10px; color: #1e3a8a;">চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর (বিস্তারিত অনুচ্ছেদ ছক)</h2>
        <h3 style="text-align: center; margin-bottom: 20px; color: #475569;">মাস: ${dateFnsFormat(selectedCycleDate, 'MMMM, yyyy')} | সময়সীমা: ০১/${dateFnsFormat(startOfMonthDate, 'MM/yyyy')} হতে ${dateFnsFormat(endOfMonthDate, 'dd/MM/yyyy')}</h3>
        ${clonedTable.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const thStyle = "border-r border-b border-slate-400 px-1 py-1.5 font-black text-center text-slate-800 text-[9px] sm:text-[9.5px] leading-tight align-middle h-full bg-slate-100 bg-clip-border relative";
  const tdStyle = "border-r border-b border-slate-400 px-1 py-1 text-[9.5px] sm:text-[10px] text-slate-700 align-middle text-center break-words bg-white";
  const numTdStyle = "border-r border-b border-slate-400 px-1 py-1 text-[9.5px] sm:text-[10px] text-slate-700 align-middle text-center font-bold bg-white";

  const formatAmountBengali = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num) || num === 0) return '-';
    const str = Math.round(num).toLocaleString('bn-BD');
    return toBengaliDigits(str) + '/-';
  };

  const formatCountBengali = (count: string | number | undefined | null) => {
    if (count === undefined || count === null) return '-';
    const cStr = count.toString().trim();
    if (cStr === '0' || cStr === '০' || cStr === '') return '-';
    return toBengaliDigits(cStr);
  };

  const formatTextValue = (val: string | undefined | null) => {
    if (val === undefined || val === null || val.trim() === '') return '-';
    return toBengaliDigits(val);
  };

  return (
    <div id="bsr-monthly-detail-container" className="space-y-5 py-4 w-full animate-report-page relative bg-white p-5 rounded-3xl border border-slate-100 shadow-xl">
      <IDBadge id="bsr-monthly-detail-container" />

      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100 w-full">
        {/* Title block */}
        <div className="flex items-stretch h-[44px] w-fit shadow-md select-none rounded-2xl overflow-hidden border border-slate-200/40 shrink-0">
          <div className="flex flex-col w-10 shrink-0 h-full">
            <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
              <Landmark className="text-blue-700 w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="h-[2.5px] bg-[#3b82f6]" />
          </div>
          
          <div className="flex flex-col h-full min-w-[240px] justify-center bg-[#1e40af] px-4">
            <span className="text-white font-[950] tracking-tight text-[13px]">
              চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর
            </span>
          </div>
        </div>

        {/* Dynamic Filters & Control buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center xl:justify-end shrink-0 z-[1010]">
          
          {/* Cycle Label Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 bg-sky-50 text-sky-800 rounded-xl text-[11px] font-bold border border-sky-100 shadow-sm h-[38px]">
            <span className="text-sky-600">সাইকেল:</span> 
            <span className="text-sky-900 font-extrabold">{toBengaliDigits(activeCycle.label)}</span>
          </div>

          {/* Month Picker dropdown */}
          <div className="relative no-print" ref={dropdownRef}>
            <div 
              onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} 
              className={`flex items-center gap-1.5 px-3 h-[38px] bg-white border rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-md group shadow-sm ${isCycleDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-300'}`}
            >
               <CalendarDays size={14} className="text-blue-600 shrink-0" />
               <span className="font-extrabold text-[11px] text-slate-800 tracking-tight shrink-0">
                 {cycleOptions.find(o => o.cycleLabel === activeCycle.label)?.label || toBengaliDigits(activeCycle.label)}
               </span>
               <ChevronDown size={13} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isCycleDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </div>
            {isCycleDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 lg:left-0 w-[240px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-3 animate-in fade-in duration-200">
                <div className="px-3 py-1 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <CalendarDays size={11} className="text-blue-500" /> মাস নির্বাচন করুন
                  </span>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
                  {cycleOptions.map((opt, idx) => {
                    const matchesActive = opt.cycleLabel === activeCycle.label;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedCycleDate(opt.date);
                          setIsCycleDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          matchesActive 
                            ? "bg-blue-600 text-white font-extrabold"
                            : "hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold bg-white"
                        }`}
                      >
                        <span className="text-[12px]">{opt.label}</span>
                        {matchesActive && <Check size={13} className="text-white stroke-[3.5]" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ministry filter dropdown */}
          <div className="relative select-none z-[400]" ref={ministryDropdownRef}>
            <div 
               onClick={() => setIsMinistryDropdownOpen(!isMinistryDropdownOpen)}
               className={`flex items-center gap-1.5 px-3 h-[38px] bg-sky-50 border hover:border-sky-300 hover:bg-white transition-all rounded-xl cursor-pointer shadow-sm ${isMinistryDropdownOpen ? 'border-sky-300 bg-white ring-2 ring-sky-50' : 'border-sky-100'}`}
            >
              <LayoutGrid size={14} className="text-sky-600 shrink-0" />
              <span className="font-extrabold text-[11px] text-sky-800 tracking-tight shrink-0 max-w-[140px] truncate">
                {filterMinistry || 'সকল মন্ত্রণালয়'}
              </span>
              <ChevronDown size={13} className={`text-sky-500 shrink-0 transition-transform duration-300 ${isMinistryDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
            </div>

            {isMinistryDropdownOpen && (
              <div className="absolute top-[110%] right-0 lg:left-1/2 lg:-translate-x-1/2 w-[220px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2 animate-in fade-in duration-200">
                <div className="px-3 py-1 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <LayoutGrid size={10} /> মন্ত্রণালয় নির্বাচন
                  </span>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-1 p-0.5 scrollbar-thin">
                  <div
                    onClick={() => {
                      setFilterMinistry('সকল');
                      setIsMinistryDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-150 text-[11px] ${filterMinistry === 'সকল' ? 'bg-sky-500 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-700 font-bold'}`}
                  >
                    সকল মন্ত্রণালয়
                  </div>
                  {ministryGroups.map((m, idx) => {
                    const matches = filterMinistry === m;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setFilterMinistry(m);
                          setIsMinistryDropdownOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-150 text-[11px] truncate ${matches ? 'bg-sky-500 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-700 font-bold'}`}
                        title={m}
                      >
                        {m}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center justify-center w-10 h-[38px] bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0 shadow-sm"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
          </button>

          {/* Toggle Summary View Button */}
          {onToggleSummaryView && (
            <button
              type="button"
              onClick={onToggleSummaryView}
              className="flex items-center gap-1.5 px-3 h-[38px] bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-100 hover:border-blue-300 transition-all duration-300 rounded-xl cursor-pointer shrink-0 shadow-sm font-black text-[11px]"
              title="সারাংশ ছক দেখুন (ব্যাংকভিত্তিক)"
            >
              <ArrowLeftRight size={13} className="stroke-[2.5]" />
              <span>সারাংশ ছক দেখুন</span>
            </button>
          )}

        </div>
      </div>

      {/* Info strip */}
      <div className="text-[11px] font-bold text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-x-4 gap-y-2 border border-slate-200/60 py-2.5 px-3 bg-slate-50/50 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p><span className="text-slate-500">অধিদপ্তরঃ</span> বাণিজ্যিক অডিট অধিদপ্তর, খুলনা</p>
          <span className="text-slate-300 hidden md:inline">|</span>
          <p><span className="text-slate-500">প্রতিবেদনঃ</span> চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর</p>
          <span className="text-slate-300 hidden md:inline">|</span>
          <p><span className="text-slate-500">শাখা ও ধরণঃ</span> নন এসএফআই শাখা, বিএসআর (BSR)</p>
          <span className="text-slate-300 hidden md:inline">|</span>
          <p><span className="text-slate-500">সময়সীমাঃ</span> ০১/{toBengaliDigits(dateFnsFormat(startOfMonthDate, 'MM/yyyy'))} হতে {toBengaliDigits(dateFnsFormat(endOfMonthDate, 'dd/MM/yyyy'))} খ্রিঃ</p>
        </div>

        {/* Quick Stats Trigger */}
        <div className="relative no-print" ref={statsRef}>
          <button
            type="button"
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-black transition-all"
          >
            <Sparkles size={11} className="text-blue-500 shrink-0" />
            <span>পরিসংখ্যান</span>
            <ChevronDown size={11} className={`text-blue-400 transition-transform ${isStatsOpen ? 'rotate-180' : ''}`} />
          </button>
          {isStatsOpen && (
            <div className="absolute top-[110%] right-0 w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[500] animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Sparkles size={14} className="text-blue-600" />
                  <span className="text-slate-900 font-extrabold text-[12px]">মাসিক বিএসআর নিষ্পত্তি পরিসংখ্যান</span>
                </div>
                <div className="space-y-2 text-slate-700 text-[11px] font-bold">
                  <div className="flex justify-between">
                    <span>মোট ব্রডশিট जवाबের সংখ্যা:</span>
                    <span className="text-blue-700 font-extrabold">{toBengaliDigits(filteredEntries.length.toString())} টি</span>
                  </div>
                  <div className="flex justify-between">
                    <span>জড়িত মোট টাকা:</span>
                    <span className="text-slate-900 font-extrabold">{toBengaliDigits(Math.round(totals.involvedAmount))} টাকা</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-emerald-700">
                    <span>সর্বমোট আদায়কৃত টাকা:</span>
                    <span className="font-extrabold">{toBengaliDigits(Math.round(totals.recoveredAmount))} টাকা</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>সর্বমোট সমন্বয়কৃত টাকা:</span>
                    <span className="font-extrabold">{toBengaliDigits(Math.round(totals.adjustedAmount))} টাকা</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 text-[11.5px] font-black">
                    <span>মোট নিষ্পত্তি টাকা:</span>
                    <span className="text-emerald-600">{toBengaliDigits(Math.round(totals.totalSettled))} টাকা</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and counters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="অনুচ্ছেদ, সংস্হা, স্মারক দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl px-3 py-1.5 font-bold text-xs">
          <span>প্রাপ্ত ব্রডশিট জবাবের সংখ্যা:</span>
          <span className="bg-blue-600 text-white rounded-lg px-2 py-0.5 font-extrabold text-[11px]">
            {toBengaliDigits(filteredEntries.length.toString())} টি
          </span>
        </div>
      </div>

      {/* Main Table Section */}
      <div id="card-bsr-monthly-detail-table-container" className="bg-white border border-slate-300 shadow-inner rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-bsr-monthly-detail" className="w-full border-separate border-spacing-0 !table-auto border-l border-t border-slate-400">
            <thead>
              <tr className="h-[44px] bg-slate-100">
                <th rowSpan={2} className={`${thStyle} w-[35px] rounded-tl-2xl`}>ক্রঃ নং</th>
                <th rowSpan={2} className={`${thStyle} w-[180px]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
                <th rowSpan={2} className={`${thStyle} w-[60px]`}>ব্রডশিট জবাবের সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[100px]`}>ডায়েরি নম্বর ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[110px]`}>ব্রডশিট জবাবের স্মারক ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[65px]`}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[65px]`}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[110px]`}>মীমাংসা জারিপত্রের স্মারক ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[85px]`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th colSpan={3} className={`${thStyle}`}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
                <th rowSpan={2} className={`${thStyle} w-[65px]`}>অমীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[85px]`}>অমীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th rowSpan={2} className={`${thStyle} w-[70px] rounded-tr-2xl`}>আর্কাইভ নং</th>
              </tr>
              <tr className="h-[38px] bg-slate-100">
                <th className={thStyle}>আদায়</th>
                <th className={thStyle}>সমন্বয়</th>
                <th className={thStyle}>অন্যান্য</th>
              </tr>
              <tr className="h-[32px] bg-slate-100">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                  <th key={n} className={`${thStyle} text-[9px] font-bold text-slate-500 py-1`}>{toBengaliDigits(n.toString())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr className="h-28 bg-white hover:bg-slate-50/50">
                  <td colSpan={15} className="text-center font-bold text-slate-400 text-xs py-8 border-r border-b border-slate-400">
                    কোনো তথ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row, idx) => {
                  const entryUnsettledAmount = Math.max(0, (row.involvedAmount || 0) - (row.totalRec || 0) - (row.totalAdj || 0) - (row.othersRec || 0) - (row.othersAdj || 0));
                  const rowSentCount = parseInt(toEnglishDigits(row.meetingSentParaCount || '0')) || row.paragraphs?.length || 0;
                  const rowSettledCount = row.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(row.meetingSettledParaCount || '0')) || 0;
                  const rowUnsettledCount = parseInt(toEnglishDigits(row.meetingUnsettledParas || '0')) || Math.max(0, rowSentCount - rowSettledCount);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/75 bg-white transition-colors group">
                      <td className={`${numTdStyle} text-slate-700 group-hover:text-blue-600`}>
                        {toBengaliDigits((idx + 1).toString().padStart(2, '0'))}.
                      </td>
                      <td className={`${tdStyle} text-left font-bold text-slate-800`}>
                        <HighlightText text={row.ministryName} searchTerm={searchTerm} />
                        {row.entityName && (
                          <>
                            ,<br />
                            <HighlightText text={row.entityName} searchTerm={searchTerm} />
                          </>
                        )}
                        {row.branchName && (
                          <>
                            ,<br />
                            <span className="text-blue-700 font-extrabold text-[10.5px]">
                              <HighlightText text={row.branchName} searchTerm={searchTerm} />
                            </span>
                          </>
                        )}
                        {row.auditYear && (
                          <>
                            <br />
                            <span className="font-normal text-slate-500">({toBengaliDigits(row.auditYear)})</span>
                          </>
                        )}
                      </td>
                      <td className={numTdStyle}>
                        {toBengaliDigits((idx + 1).toString().padStart(2, '0'))}
                      </td>
                      <td className={numTdStyle}>
                        <HighlightText text={formatTextValue(row.workpaperNoDate)} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdStyle}>
                        <HighlightText text={formatTextValue(row.letterNoDate)} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdStyle}>
                        {formatCountBengali(rowSentCount)}
                      </td>
                      <td className={numTdStyle}>
                        {formatCountBengali(rowSettledCount)}
                      </td>
                      <td className={numTdStyle}>
                        <HighlightText text={formatTextValue(row.issueLetterNoDate)} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdStyle}>
                        {formatAmountBengali(row.involvedAmount)}
                      </td>
                      <td className={`${numTdStyle} text-emerald-600 bg-emerald-50/10`}>
                        {formatAmountBengali(row.totalRec)}
                      </td>
                      <td className={`${numTdStyle} text-indigo-600 bg-indigo-50/10`}>
                        {formatAmountBengali(row.totalAdj)}
                      </td>
                      <td className={numTdStyle}>
                        {formatAmountBengali((row.othersRec || 0) + (row.othersAdj || 0))}
                      </td>
                      <td className={numTdStyle}>
                        {formatCountBengali(rowUnsettledCount)}
                      </td>
                      <td className={numTdStyle}>
                        {entryUnsettledAmount === 0 ? toBengaliDigits('0') + '/-' : formatAmountBengali(entryUnsettledAmount)}
                      </td>
                      <td className={numTdStyle}>
                        <HighlightText text={formatTextValue(row.archiveNo)} searchTerm={searchTerm} />
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Pad empty rows if sparse */}
              {filteredEntries.length > 0 && filteredEntries.length < 5 && (
                Array.from({ length: 5 - filteredEntries.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10 bg-white">
                    {Array.from({ length: 15 }).map((_, j) => (
                      <td key={j} className="border-r border-b border-slate-400"></td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-extrabold shadow-2xl relative z-10">
                <tr className="h-[44px] bg-slate-900 border-t border-slate-700">
                  <td colSpan={2} className="border-r border-b border-slate-700 px-3 py-2 text-left text-[11px] font-black uppercase text-white rounded-bl-2xl">সর্বমোট (ফিল্টারকৃত):</td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {toBengaliDigits(filteredEntries.length.toString())} টি
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-b border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {formatCountBengali(totals.sentPara)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {formatCountBengali(totals.settledPara)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {formatAmountBengali(totals.involvedAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-emerald-400 font-black">
                    {formatAmountBengali(totals.recoveredAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-indigo-400 font-black">
                    {formatAmountBengali(totals.adjustedAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-slate-300 font-black">
                    {formatAmountBengali(totals.othersAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {formatCountBengali(totals.unsettledPara)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {totals.unsettledAmount === 0 ? toBengaliDigits('0') + '/-' : formatAmountBengali(totals.unsettledAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 rounded-br-2xl"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default BSRMonthlySettlementDetail;
