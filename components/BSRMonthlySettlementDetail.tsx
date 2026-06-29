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

  // Filter settled paragraphs for Non-SFI and BSR matching selected calendar month
  const filteredParagraphs = useMemo(() => {
    const list: any[] = [];
    
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
      
      // Loop through paragraphs and extract settled ones (status === 'পূর্ণাঙ্গ')
      if (e.paragraphs && e.paragraphs.length > 0) {
        e.paragraphs.forEach(p => {
          if (robustNormalize(p.status || '') === robustNormalize('পূর্ণাঙ্গ')) {
            list.push({
              id: `${e.id}-${p.id}`,
              entry: e,
              paragraph: p,
              ministryName: e.ministryName,
              entityName: e.entityName,
              auditYear: e.auditYear,
              letterNoDate: e.letterNoDate,
              meetingWorkpaper: e.meetingWorkpaper || e.workpaperNoDate || '',
              issueLetterNoDate: e.issueLetterNoDate || e.issueDateISO || '',
              paraNo: p.paraNo,
              involvedAmount: p.involvedAmount || 0,
              recoveredAmount: p.recoveredAmount || 0,
              adjustedAmount: p.adjustedAmount || 0,
              othersAmount: (p.othersRec || 0) + (p.othersAdj || 0),
              archiveNo: e.archiveNo || '',
              remarks: e.remarks || p.category || ''
            });
          }
        });
      } else {
        // Fallback for entries with no paragraph breakdown but marked as settled
        const hasSettlement = (e.totalRec || 0) > 0 || (e.totalAdj || 0) > 0 || (parseInt(toEnglishDigits(e.meetingSettledParaCount || '0')) > 0);
        if (hasSettlement) {
          list.push({
            id: `${e.id}-fallback`,
            entry: e,
            paragraph: null,
            ministryName: e.ministryName,
            entityName: e.entityName,
            auditYear: e.auditYear,
            letterNoDate: e.letterNoDate,
            meetingWorkpaper: e.meetingWorkpaper || e.workpaperNoDate || '',
            issueLetterNoDate: e.issueLetterNoDate || e.issueDateISO || '',
            paraNo: e.meetingSettledParaCount ? `${toBengaliDigits(e.meetingSettledParaCount)} টি` : '১',
            involvedAmount: e.involvedAmount || 0,
            recoveredAmount: e.totalRec || 0,
            adjustedAmount: e.totalAdj || 0,
            othersAmount: (e.othersRec || 0) + (e.othersAdj || 0),
            archiveNo: e.archiveNo || '',
            remarks: e.remarks || ''
          });
        }
      }
    });
    
    return list;
  }, [entries, selectedCycleDate, filterMinistry, searchTerm]);

  // Calculations for total statistics
  const totals = useMemo(() => {
    return filteredParagraphs.reduce((acc, curr) => ({
      involvedAmount: acc.involvedAmount + curr.involvedAmount,
      recoveredAmount: acc.recoveredAmount + curr.recoveredAmount,
      adjustedAmount: acc.adjustedAmount + curr.adjustedAmount,
      othersAmount: acc.othersAmount + curr.othersAmount,
      totalSettled: acc.totalSettled + curr.recoveredAmount + curr.adjustedAmount
    }), { involvedAmount: 0, recoveredAmount: 0, adjustedAmount: 0, othersAmount: 0, totalSettled: 0 });
  }, [filteredParagraphs]);

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
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
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

  const thStyle = "border-r border-b border-slate-300 px-2 py-3 font-black text-center text-slate-800 text-[10px] leading-tight align-middle h-full bg-slate-100 bg-clip-border relative";
  const tdStyle = "border-r border-b border-slate-200 px-2 py-2.5 text-[11px] text-slate-700 align-middle text-center break-words";
  const numTdStyle = "border-r border-b border-slate-200 px-2 py-2.5 text-[11px] text-slate-700 align-middle text-center font-bold";

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
                    <span>মোট নিষ্পত্তিকৃত অনুচ্ছেদ:</span>
                    <span className="text-blue-700 font-extrabold">{toBengaliDigits(filteredParagraphs.length.toString())} টি</span>
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
          <span>প্রাপ্ত অনুচ্ছেদ সংখ্যা:</span>
          <span className="bg-blue-600 text-white rounded-lg px-2 py-0.5 font-extrabold text-[11px]">
            {toBengaliDigits(filteredParagraphs.length.toString())} টি
          </span>
        </div>
      </div>

      {/* Main Table Section */}
      <div id="card-bsr-monthly-detail-table-container" className="bg-white border border-slate-300 shadow-inner rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-bsr-monthly-detail" className="w-full border-separate border-spacing-0 !table-auto min-w-[1200px]">
            <thead>
              <tr className="h-[44px] bg-slate-100">
                <th className={`${thStyle} w-[50px] rounded-tl-2xl`}>ক্রঃ নং</th>
                <th className={`${thStyle} w-[180px]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
                <th className={`${thStyle} w-[100px]`}>ব্রডশিট জবাবের সংখ্যা</th>
                <th className={`${thStyle} w-[120px]`}>পত্রের স্মারক নং ও তারিখ</th>
                <th className={`${thStyle} w-[80px]`}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th className={`${thStyle} w-[120px]`}>ডায়েরি নং ও তারিখ</th>
                <th className={`${thStyle} w-[120px]`}>মীমাংসাপত্র জারীর তারিখ</th>
                <th className={`${thStyle} w-[80px]`}>মীমাংসিত অনুচ্ছেদ নং</th>
                <th className={`${thStyle} w-[100px]`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th className={`${thStyle} w-[100px]`}>আদায়কৃত টাকা</th>
                <th className={`${thStyle} w-[100px]`}>সমন্বয়কৃত টাকা</th>
                <th className={`${thStyle} w-[100px]`}>অন্যান্য আদায়/সমন্বয়</th>
                <th className={`${thStyle} w-[100px]`}>মোট নিষ্পত্তি টাকা</th>
                <th className={`${thStyle} w-[150px]`}>মন্তব্য</th>
                <th className={`${thStyle} w-[90px] rounded-tr-2xl`}>আর্কাইভ নং</th>
              </tr>
            </thead>
            <tbody>
              {filteredParagraphs.length === 0 ? (
                <tr className="h-28 bg-white hover:bg-slate-50/50">
                  <td colSpan={15} className="text-center font-bold text-slate-400 text-xs py-8">
                    কোনো তথ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredParagraphs.map((row, idx) => {
                  const totalRowSettled = row.recoveredAmount + row.adjustedAmount;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/75 bg-white transition-colors group">
                      <td className={`${numTdStyle} text-slate-400 group-hover:text-blue-600`}>{toBengaliDigits((idx + 1).toString())}</td>
                      <td className={`${tdStyle} text-left font-bold text-slate-800`}>
                        <HighlightText text={`${row.ministryName}, ${row.entityName}`} searchTerm={searchTerm} />
                        <div className="text-[10px] text-slate-400 mt-0.5">রিপোর্টের বৎসর: {toBengaliDigits(row.auditYear)}</div>
                      </td>
                      <td className={numTdStyle}>{toBengaliDigits("১")}</td>
                      <td className={numTdStyle}>
                        <HighlightText text={row.letterNoDate || 'নেই'} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdStyle}>{toBengaliDigits("১")}</td>
                      <td className={numTdStyle}>
                        <HighlightText text={row.meetingWorkpaper || 'নেই'} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdStyle}>
                        <HighlightText text={row.issueLetterNoDate || 'নেই'} searchTerm={searchTerm} />
                      </td>
                      <td className={`${numTdStyle} text-blue-600 font-extrabold bg-blue-50/20`}>
                        {toBengaliDigits(row.paraNo || '')}
                      </td>
                      <td className={`${numTdStyle} text-slate-800`}>
                        {toBengaliDigits(Math.round(row.involvedAmount))}
                      </td>
                      <td className={`${numTdStyle} text-emerald-600 bg-emerald-50/10`}>
                        {toBengaliDigits(Math.round(row.recoveredAmount))}
                      </td>
                      <td className={`${numTdStyle} text-indigo-600 bg-indigo-50/10`}>
                        {toBengaliDigits(Math.round(row.adjustedAmount))}
                      </td>
                      <td className={numTdStyle}>
                        {toBengaliDigits(Math.round(row.othersAmount))}
                      </td>
                      <td className={`${numTdStyle} text-blue-700 bg-blue-50/30 font-black`}>
                        {toBengaliDigits(Math.round(totalRowSettled))}
                      </td>
                      <td className={`${tdStyle} text-left text-slate-500 italic text-[10px]`}>
                        <HighlightText text={row.remarks || ''} searchTerm={searchTerm} />
                      </td>
                      <td className={`${numTdStyle} text-purple-700 bg-purple-50/10`}>
                        <HighlightText text={row.archiveNo || 'নেই'} searchTerm={searchTerm} />
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Pad empty rows if sparse */}
              {filteredParagraphs.length > 0 && filteredParagraphs.length < 5 && (
                Array.from({ length: 5 - filteredParagraphs.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10 bg-white">
                    {Array.from({ length: 15 }).map((_, j) => (
                      <td key={j} className="border-r border-b border-slate-100"></td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {filteredParagraphs.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-extrabold shadow-2xl relative z-10">
                <tr className="h-[44px] bg-slate-900 border-t border-slate-700">
                  <td colSpan={2} className="border-r border-slate-700 px-3 py-2 text-left text-[11px] font-black uppercase text-white rounded-bl-2xl">সর্বমোট (ফিল্টারকৃত):</td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">{toBengaliDigits(filteredParagraphs.length.toString())} টি</td>
                  <td className="border-r border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">{toBengaliDigits(filteredParagraphs.length.toString())}</td>
                  <td className="border-r border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">{toBengaliDigits(Math.round(totals.involvedAmount))}</td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-emerald-400 font-black">{toBengaliDigits(Math.round(totals.recoveredAmount))}</td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-indigo-400 font-black">{toBengaliDigits(Math.round(totals.adjustedAmount))}</td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-slate-300 font-black">{toBengaliDigits(Math.round(totals.othersAmount))}</td>
                  <td className="border-r border-slate-700 px-2 py-2 text-center text-[11px] text-sky-400 font-black">{toBengaliDigits(Math.round(totals.totalSettled))}</td>
                  <td className="border-r border-slate-700 px-2 py-2 rounded-br-2xl" colSpan={2}></td>
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
