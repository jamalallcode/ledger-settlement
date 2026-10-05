import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Printer, Sparkles, ChevronDown, ChevronLeft, ChevronRight, Calendar, FileSpreadsheet, LayoutGrid, Search, X, CheckCircle2, CalendarDays, Check, Landmark, ArrowLeftRight, FileText } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { normalizeDatesInText } from '../utils/syncHelper';
import { format as dateFnsFormat, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

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
  
  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(selectedCycleDate));
  const [endDate, setEndDate] = useState<Date>(() => endOfMonth(selectedCycleDate));
  const [selectingDateType, setSelectingDateType] = useState<'start' | 'end'>('start');
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date(selectedCycleDate));

  useEffect(() => {
    setStartDate(startOfMonth(selectedCycleDate));
    setEndDate(endOfMonth(selectedCycleDate));
    setCurrentViewDate(new Date(selectedCycleDate));
  }, [selectedCycleDate]);

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

  const startOfMonthDate = startDate;
  const endOfMonthDate = endDate;

  // Filter entries for Non-SFI and BSR matching selected date range (হতে - থেকে)
  const filteredEntries = useMemo(() => {
    const list: SettlementEntry[] = [];
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();
    
    entries.forEach(e => {
      // Filter out entries that don't have a ministry name
      if (!e.ministryName || !e.ministryName.trim()) return;

      // 1. Filter by Non-SFI branch
      if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return;
      
      // 2. Filter by BSR letter/meeting type
      const meetingType = robustNormalize(e.meetingType || e.letterType || '');
      if (!meetingType.includes(robustNormalize('বিএসআর'))) return;
      
      // 3. Filter by Date range
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const entryTime = new Date(issueDateStr).getTime();
      if (entryTime < startMidnight || entryTime > endMidnight) return;
      
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
  }, [entries, startDate, endDate, filterMinistry, searchTerm]);

  // Calculations for total statistics
  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      const rowSentCount = parseInt(toEnglishDigits(curr.meetingSentParaCount || '0')) || curr.paragraphs?.length || 0;
      const rowSettledCount = curr.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0;
      const rowUnsettledCount = parseInt(toEnglishDigits(curr.meetingUnsettledParas || '0')) || Math.max(0, rowSentCount - rowSettledCount);

      const sentPara = acc.sentPara + rowSentCount;
      const settledPara = acc.settledPara + rowSettledCount;

      const settledAmountValue = curr.paragraphs && curr.paragraphs.length > 0
        ? curr.paragraphs
            .reduce((sum, p) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0)
        : ((curr.totalRec || 0) + (curr.totalAdj || 0));

      const involvedAmount = acc.involvedAmount + settledAmountValue;
      const recoveredAmount = acc.recoveredAmount + (curr.totalRec || 0);
      const adjustedAmount = acc.adjustedAmount + (curr.totalAdj || 0);
      const othersAmount = 0; // Prevent redundant othersAmount in BSRMonthlySettlementDetail report
      const unsettledPara = acc.unsettledPara + rowUnsettledCount;
      
      const entryUnsettledAmount = curr.sentParaInvolvedAmount && curr.sentParaInvolvedAmount > 0
        ? Math.max(0, curr.sentParaInvolvedAmount - settledAmountValue)
        : Math.max(0, (curr.involvedAmount || 0) - (curr.totalRec || 0) - (curr.totalAdj || 0));
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
        totalSettled: recoveredAmount + adjustedAmount
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

  const getTimeframeLabel = (d: Date) => {
    const s = startOfMonth(d);
    const e = endOfMonth(d);
    return `০১/${toBengaliDigits(dateFnsFormat(s, 'MM/yyyy'))} হতে ${toBengaliDigits(dateFnsFormat(e, 'dd/MM/yyyy'))}`;
  };

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const thStyle = "px-1 py-1.5 font-black text-center text-slate-800 text-[9px] sm:text-[9.5px] leading-tight align-middle h-full bg-slate-100 bg-clip-border relative";
  const tdStyle = "px-1 py-1 text-[9.5px] sm:text-[10px] text-slate-700 align-middle text-center break-words bg-white";
  const numTdStyle = "px-1 py-1 text-[9.5px] sm:text-[10px] text-slate-700 align-middle text-center font-bold bg-white";

  const formatAmountBengali = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num) || num === 0) return '-';
    const str = Math.round(num).toLocaleString('en-IN');
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
    return normalizeDatesInText(val);
  };

  const formatArchiveNoForTable = (val: string | undefined | null) => {
    if (!val || val.trim() === '') return '-';
    
    const trimmed = val.trim();
    let prefix = "";
    let rest = trimmed;
    
    if (trimmed.toLowerCase().startsWith("kg-")) {
      const dashIdx = trimmed.indexOf("-");
      prefix = trimmed.substring(0, dashIdx + 1).trim() + " ";
      rest = trimmed.substring(dashIdx + 1).trim();
    }
    
    if (!rest) return prefix ? prefix.trim() : '-';
    
    // Split rest by commas
    const parts = rest.split(',').map(p => p.trim()).filter(p => p !== '');
    if (parts.length === 0) return prefix ? prefix.trim() : '-';
    
    // Group parts: max 3 per line
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      const chunk = parts.slice(i, i + 3);
      lines.push(chunk.join(', '));
    }
    
    return prefix + lines.join('\n');
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
          
          {/* Timeframe Date Range Picker (হতে - থেকে) */}
          <div className={`relative no-print select-none ${isCycleDropdownOpen ? 'z-[5000]' : 'z-[25]'}`} ref={dropdownRef}>
            <div 
              onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} 
              className={`flex items-center gap-1.5 px-3 h-[38px] bg-white border rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-md group shadow-sm ${isCycleDropdownOpen ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-300'}`}
              title={`${toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))} হতে ${toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))}`}
            >
               <CalendarDays size={14} className="text-blue-600 shrink-0" />
               <span className="text-slate-500 font-bold text-[11px] shrink-0">সময়কাল:</span>
               <span className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-800 tracking-tight shrink-0">
                 {toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))} হতে {toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))}
               </span>
               <ChevronDown size={13} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isCycleDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </div>

            {isCycleDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 sm:left-auto sm:right-0 lg:left-0 w-[320px] sm:w-[350px] max-w-[calc(100vw-32px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-3.5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <Calendar size={13} className="text-blue-600" />
                    <span>সময়কাল নির্বাচন (হতে - থেকে)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCycleDropdownOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Start & End Date Selection Cards */}
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  {/* Start Date Card */}
                  <div
                    onClick={() => {
                      setSelectingDateType('start');
                      setCurrentViewDate(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
                    }}
                    className={`relative p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectingDateType === 'start'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <span className="block text-[10px] font-bold text-slate-500">শুরুর তারিখ (হতে)</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-extrabold text-xs text-slate-800">
                        {toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))}
                      </span>
                      <div className="relative">
                        <input
                          type="date"
                          value={dateFnsFormat(startDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split('-').map(Number);
                              const newD = new Date(y, m - 1, d);
                              setStartDate(newD);
                              if (newD > endDate) setEndDate(newD);
                              setCurrentViewDate(new Date(y, m - 1, 1));
                            }
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          title="শুরুর তারিখ পরিবর্তন করুন"
                        />
                        <Calendar size={13} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* End Date Card */}
                  <div
                    onClick={() => {
                      setSelectingDateType('end');
                      setCurrentViewDate(new Date(endDate.getFullYear(), endDate.getMonth(), 1));
                    }}
                    className={`relative p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectingDateType === 'end'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <span className="block text-[10px] font-bold text-slate-500">শেষের তারিখ (পর্যন্ত)</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-extrabold text-xs text-slate-800">
                        {toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))}
                      </span>
                      <div className="relative">
                        <input
                          type="date"
                          value={dateFnsFormat(endDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split('-').map(Number);
                              const newD = new Date(y, m - 1, d);
                              setEndDate(newD);
                              if (newD < startDate) setStartDate(newD);
                              setCurrentViewDate(new Date(y, m - 1, 1));
                            }
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          title="শেষের তারিখ পরিবর্তন করুন"
                        />
                        <Calendar size={13} className="text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mb-2.5 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = startOfMonth(now);
                      const e = endOfMonth(now);
                      setStartDate(s);
                      setEndDate(e);
                      setCurrentViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    চলতি মাস
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = startOfMonth(subMonths(now, 1));
                      const e = endOfMonth(subMonths(now, 1));
                      setStartDate(s);
                      setEndDate(e);
                      setCurrentViewDate(new Date(s.getFullYear(), s.getMonth(), 1));
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    বিগত মাস
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = new Date(now.getFullYear(), 0, 1);
                      const e = new Date(now.getFullYear(), 11, 31);
                      setStartDate(s);
                      setEndDate(e);
                      setCurrentViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    চলতি বছর
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const s = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
                      setStartDate(s);
                      setEndDate(now);
                      setCurrentViewDate(new Date(s.getFullYear(), s.getMonth(), 1));
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    গত ৩০ দিন
                  </button>
                </div>

                {/* Calendar Header with Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                    title="পূর্ববর্তী মাস"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={currentViewDate.getMonth()}
                      onChange={(e) => {
                        const m = parseInt(e.target.value, 10);
                        setCurrentViewDate(new Date(currentViewDate.getFullYear(), m, 1));
                      }}
                      className="font-black text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 cursor-pointer outline-none focus:border-blue-500"
                    >
                      {BENGALI_MONTHS.map((mName, mIdx) => (
                        <option key={mIdx} value={mIdx}>{mName}</option>
                      ))}
                    </select>
                    <select
                      value={currentViewDate.getFullYear()}
                      onChange={(e) => {
                        const y = parseInt(e.target.value, 10);
                        setCurrentViewDate(new Date(y, currentViewDate.getMonth(), 1));
                      }}
                      className="font-black text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 cursor-pointer outline-none focus:border-blue-500"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(y => (
                        <option key={y} value={y}>{toBengaliDigits(y.toString())}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                    title="পরবর্তী মাস"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Calendar Week Days */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {BENGALI_WEEKDAYS.map((wd, i) => (
                    <span key={i} className="text-[10px] font-black text-slate-400 py-0.5">
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Days Grid with Range Highlight */}
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
                    const totalCells = cells.length > 35 ? 42 : 35;
                    const remaining = totalCells - cells.length;
                    for (let d = 1; d <= remaining; d++) {
                      const dateObj = new Date(Y, M + 1, d);
                      cells.push({ day: d, isCurrentMonth: false, dateObj });
                    }

                    const startStr = dateFnsFormat(startDate, 'yyyy-MM-dd');
                    const endStr = dateFnsFormat(endDate, 'yyyy-MM-dd');

                    return cells.map((cell, idx) => {
                      const dateStr = dateFnsFormat(cell.dateObj, 'yyyy-MM-dd');
                      const isStart = dateStr === startStr;
                      const isEnd = dateStr === endStr;
                      const isInRange = dateStr > startStr && dateStr < endStr;

                      let cellCls = "text-[11.5px] font-bold h-7 flex items-center justify-center transition-all cursor-pointer relative ";
                      if (isStart && isEnd) {
                        cellCls += "bg-blue-600 text-white font-black rounded-lg shadow-sm z-10";
                      } else if (isStart) {
                        cellCls += "bg-blue-600 text-white font-black rounded-l-lg shadow-sm z-10";
                      } else if (isEnd) {
                        cellCls += "bg-blue-600 text-white font-black rounded-r-lg shadow-sm z-10";
                      } else if (isInRange) {
                        cellCls += "bg-blue-100/70 text-blue-950 font-extrabold rounded-none";
                      } else if (cell.isCurrentMonth) {
                        cellCls += "text-slate-800 hover:bg-blue-50 hover:text-blue-700 rounded-lg";
                      } else {
                        cellCls += "text-slate-300 hover:bg-slate-50 hover:text-slate-400 rounded-lg";
                      }

                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            const clickedDate = cell.dateObj;
                            if (selectingDateType === 'start') {
                              if (clickedDate > endDate) {
                                setStartDate(clickedDate);
                                setEndDate(clickedDate);
                                setSelectingDateType('end');
                              } else {
                                setStartDate(clickedDate);
                                setSelectingDateType('end');
                              }
                            } else {
                              if (clickedDate < startDate) {
                                setStartDate(clickedDate);
                                setSelectingDateType('end');
                              } else {
                                setEndDate(clickedDate);
                              }
                            }
                          }}
                          className={cellCls}
                        >
                          <span>{toBengaliDigits(cell.day.toString())}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Ministry filter dropdown */}
          <div className={`relative select-none ${isMinistryDropdownOpen ? 'z-[5000]' : 'z-[20]'}`} ref={ministryDropdownRef}>
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
              <div className="absolute top-[110%] right-0 w-[220px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2 animate-in fade-in duration-200">
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
        </div>

        {/* Quick Stats Trigger */}
        <div className="relative no-print" ref={statsRef}>
          <button
            type="button"
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-black transition-all cursor-pointer"
          >
            <Sparkles size={11} className="text-blue-500 shrink-0" />
            <span>পরিসংখ্যান</span>
            <ChevronDown size={11} className={`text-blue-400 transition-transform ${isStatsOpen ? 'rotate-180' : ''}`} />
          </button>
          {isStatsOpen && (
            <div 
              className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
              onClick={() => setIsStatsOpen(false)}
            >
              <div 
                className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600" />
                    <span className="text-slate-900 font-extrabold text-[13px]">মাসিক বিএসআর নিষ্পত্তি পরিসংখ্যান</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStatsOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="p-4 sm:p-5 space-y-2.5 text-slate-700 text-xs font-bold overflow-y-auto">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>মোট ব্রডশিট জবাবের সংখ্যা:</span>
                    <span className="text-blue-700 font-black">{toBengaliDigits(filteredEntries.length.toString())} টি</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>জড়িত মোট টাকা:</span>
                    <span className="text-slate-900 font-black">{toBengaliDigits(Math.round(totals.involvedAmount))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <span>সর্বমোট আদায়কৃত টাকা:</span>
                    <span className="font-black">{toBengaliDigits(Math.round(totals.recoveredAmount))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-indigo-50 text-indigo-800">
                    <span>সর্বমোট সমন্বয়কৃত টাকা:</span>
                    <span className="font-black">{toBengaliDigits(Math.round(totals.adjustedAmount))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-emerald-100/70 text-emerald-950 font-black text-sm">
                    <span>মোট নিষ্পত্তি টাকা:</span>
                    <span className="text-emerald-700">{toBengaliDigits(Math.round(totals.totalSettled))} টাকা</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and counters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <h3 className="text-[13px] sm:text-[14px] font-black text-slate-800 tracking-tight">
            ব্রডশিট জবাবের উপর নিষ্পত্তিকৃত জারীপত্রের মাসিক প্রতিবেদন: ({toBengaliDigits(dateFnsFormat(startDate, 'dd/MM/yyyy'))} খ্রিঃ হতে {toBengaliDigits(dateFnsFormat(endDate, 'dd/MM/yyyy'))} খ্রিঃ তারিখ পর্যন্ত):
          </h3>
        </div>

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
      </div>

      {/* Main Table Section */}
      <div id="card-bsr-monthly-detail-table-container" className="table-container bg-white shadow-inner rounded-none overflow-visible w-full relative">
        <div className="w-full overflow-visible">
          <table id="table-bsr-monthly-detail" className="w-full border-separate border-spacing-0 !table-auto">
            <thead>
              <tr className="h-[44px] bg-slate-100">
                <th rowSpan={2} className={`${thStyle} w-[35px] rounded-none`}>ক্রঃ নং</th>
                <th rowSpan={2} className={`${thStyle} w-[180px]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
                <th rowSpan={2} className={`${thStyle} w-[60px]`}>ব্রডশিট জবাবের সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[90px]`}>ডায়েরি নম্বর ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[100px]`}>ব্রডশিট জবাবের স্মারক ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[65px]`}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[65px]`}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[100px]`}>মীমাংসা জারিপত্রের স্মারক ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[85px]`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th colSpan={3} className={`${thStyle} w-[240px]`}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
                <th rowSpan={2} className={`${thStyle} w-[65px]`}>অমীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={`${thStyle} w-[85px]`}>অমীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th rowSpan={2} className={`${thStyle} w-[70px] rounded-none`}>আর্কাইভ নং</th>
              </tr>
              <tr className="h-[38px] bg-slate-100">
                <th className={`${thStyle} w-[80px]`}>আদায়</th>
                <th className={`${thStyle} w-[80px]`}>সমন্বয়</th>
                <th className={`${thStyle} w-[80px]`}>অন্যান্য</th>
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
                  const col9Amount = row.paragraphs && row.paragraphs.length > 0
                    ? row.paragraphs.reduce((sum, p) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0)
                    : ((row.totalRec || 0) + (row.totalAdj || 0));
                  const entryUnsettledAmount = row.sentParaInvolvedAmount && row.sentParaInvolvedAmount > 0
                    ? Math.max(0, row.sentParaInvolvedAmount - col9Amount)
                    : Math.max(0, (row.involvedAmount || 0) - (row.totalRec || 0) - (row.totalAdj || 0));
                  const rowSentCount = parseInt(toEnglishDigits(row.meetingSentParaCount || '0')) || row.paragraphs?.length || 0;
                  const rowSettledCount = row.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(row.meetingSettledParaCount || '0')) || 0;
                  const rowUnsettledCount = parseInt(toEnglishDigits(row.meetingUnsettledParas || '0')) || Math.max(0, rowSentCount - rowSettledCount);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/75 bg-white transition-colors group">
                      <td className={`${numTdStyle} text-slate-700 group-hover:text-blue-600`}>
                        {toBengaliDigits((idx + 1).toString().padStart(2, '0'))}.
                      </td>
                      <td className={`${tdStyle} text-left font-bold text-slate-800`}>
                        {(() => {
                          const min = (row.ministryName || '').trim().replace(/,+$/, '').trim();
                          const ent = (row.entityName || '').trim().replace(/,+$/, '').trim();
                          const br = (row.branchName || '').trim().replace(/,+$/, '').trim();
                          const yr = toBengaliDigits((row.auditYear || '').trim().replace(/^\(|\)$/g, '').trim());

                          const parts: string[] = [];
                          if (min) parts.push(min);
                          if (ent && (!br || !robustNormalize(br).includes(robustNormalize(ent)))) {
                            parts.push(ent);
                          }
                          if (br) parts.push(br);

                          let combined = parts.join(', ');
                          const hasYearInText = /\([০-৯0-9\-\s,ও/]+\)\s*$/.test(combined) || (yr && robustNormalize(combined).includes(robustNormalize(yr)));
                          if (yr && !hasYearInText) {
                            combined = combined ? `${combined} (${yr})` : `(${yr})`;
                          }

                          return <HighlightText text={combined || '-'} searchTerm={searchTerm} />;
                        })()}
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
                        {formatAmountBengali(col9Amount)}
                      </td>
                      <td className={`${numTdStyle} text-emerald-600 bg-emerald-50/10 whitespace-nowrap`}>
                        {formatAmountBengali(row.totalRec)}
                      </td>
                      <td className={`${numTdStyle} text-indigo-600 bg-indigo-50/10 whitespace-nowrap`}>
                        {formatAmountBengali(row.totalAdj)}
                      </td>
                      <td className={`${numTdStyle} whitespace-nowrap`}>
                        {formatAmountBengali(0)}
                      </td>
                      <td className={numTdStyle}>
                        {formatCountBengali(rowUnsettledCount)}
                      </td>
                      <td className={numTdStyle}>
                        {entryUnsettledAmount === 0 ? toBengaliDigits('0') + '/-' : formatAmountBengali(entryUnsettledAmount)}
                      </td>
                      <td className={`${numTdStyle} whitespace-pre-line`}>
                        <HighlightText text={formatArchiveNoForTable(row.archiveNo)} searchTerm={searchTerm} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-extrabold shadow-2xl relative z-10">
                <tr className="h-[44px] bg-slate-900 border-t border-slate-700">
                  <td colSpan={2} className="border-r border-b border-slate-700 px-3 py-2 text-left text-[11px] font-black uppercase text-white rounded-none">সর্বমোট (ফিল্টারকৃত):</td>
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
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-emerald-400 font-black whitespace-nowrap">
                    {formatAmountBengali(totals.recoveredAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-indigo-400 font-black whitespace-nowrap">
                    {formatAmountBengali(totals.adjustedAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-slate-300 font-black whitespace-nowrap">
                    {formatAmountBengali(totals.othersAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {formatCountBengali(totals.unsettledPara)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {totals.unsettledAmount === 0 ? toBengaliDigits('0') + '/-' : formatAmountBengali(totals.unsettledAmount)}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 rounded-none"></td>
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
