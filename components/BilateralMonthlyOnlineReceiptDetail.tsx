import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Printer, ChevronDown, FileSpreadsheet, LayoutGrid, Search, X, Landmark, CalendarDays, Check, ArrowLeft } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format as dateFnsFormat, startOfMonth, endOfMonth } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

interface BilateralMonthlyOnlineReceiptDetailProps {
  entries: SettlementEntry[];
  selectedCycleDate: Date;
  setSelectedCycleDate: (date: Date) => void;
  activeCycle: any;
  cycleOptions: any[];
  ministryGroups: string[];
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  onToggleSummaryView?: () => void;
}

const BilateralMonthlyOnlineReceiptDetail: React.FC<BilateralMonthlyOnlineReceiptDetailProps> = ({
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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const ministryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCycleDropdownOpen(false);
      }
      if (ministryDropdownRef.current && !ministryDropdownRef.current.contains(e.target as Node)) {
        setIsMinistryDropdownOpen(false);
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

  // Filter entries for Non-SFI and Bilateral and Online Receipt matching selected calendar month
  const filteredEntries = useMemo(() => {
    const list: SettlementEntry[] = [];

    entries.forEach(e => {
      // Filter out entries that don't have a ministry name
      if (!e.ministryName || !e.ministryName.trim()) return;

      // 1. Filter by Non-SFI branch
      if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return;

      // 2. Filter by Bilateral letter/meeting type
      const meetingType = robustNormalize(e.meetingType || e.letterType || '');
      if (!meetingType.includes(robustNormalize('দ্বিপক্ষীয়')) && !meetingType.includes(robustNormalize('দ্বিপাক্ষিক'))) return;

      // 3. Filter by Online Receipt flags
      const isOnline = e.isSentOnline === 'হ্যাঁ' || e.isOnline === 'হ্যাঁ';
      if (!isOnline) return;

      // 4. Filter by Date range of the selected month
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const entryDate = new Date(issueDateStr);
      if (entryDate < startOfMonthDate || entryDate > endOfMonthDate) return;

      // 5. Ministry filter
      if (filterMinistry && filterMinistry !== 'সকল') {
        if (robustNormalize(e.ministryName || '') !== robustNormalize(filterMinistry)) return;
      }

      // 6. Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          (e.ministryName || '').toLowerCase().includes(term) ||
          (e.entityName || '').toLowerCase().includes(term) ||
          (e.remarks || '').toLowerCase().includes(term) ||
          (e.archiveNo || '').toLowerCase().includes(term) ||
          (e.letterNoDate || '').toLowerCase().includes(term) ||
          (e.workpaperNoDate || '').toLowerCase().includes(term) ||
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
      const rowRecommendedCount = parseInt(toEnglishDigits(curr.meetingRecommendedParaCount || curr.meetingSentParaCount || '0')) || curr.paragraphs?.length || 0;
      const rowSettledCount = curr.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0;
      const rowUnsettledCount = parseInt(toEnglishDigits(curr.meetingUnsettledParas || '0')) || Math.max(0, rowRecommendedCount - rowSettledCount);
      const rowRaisedCount = parseInt(toEnglishDigits(curr.manualRaisedCount || '1')) || 1;

      return {
        raisedCount: acc.raisedCount + rowRaisedCount,
        recommendedPara: acc.recommendedPara + rowRecommendedCount,
        settledPara: acc.settledPara + rowSettledCount,
        unsettledPara: acc.unsettledPara + rowUnsettledCount,
      };
    }, {
      raisedCount: 0,
      recommendedPara: 0,
      settledPara: 0,
      unsettledPara: 0,
    });
  }, [filteredEntries]);

  const downloadExcel = () => {
    const table = document.getElementById('table-bilateral-monthly-online-detail');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const formattedMonth = dateFnsFormat(selectedCycleDate, 'MMMM_yyyy');
    const filename = `দ্বিপক্ষীয়_অনলাইন_প্রাপ্তি_মাসিক_প্রতিবেদন_${formattedMonth}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>অনলাইন প্রাপ্তি</x:Name>
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
        <h2 style="text-align: center; margin-bottom: 10px; color: #1e3a8a;">Responsible Party হতে অনলাইনে ব্রডশিট জবাব প্রাপ্ত পত্রাদির মাসিক প্রতিবেদন</h2>
        <h3 style="text-align: center; margin-bottom: 20px; color: #475569;">সময়সীমা: ০১/${dateFnsFormat(startOfMonthDate, 'MM/yyyy')} হতে ${dateFnsFormat(endOfMonthDate, 'dd/MM/yyyy')}</h3>
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

  const thStyle = "border-r border-b border-slate-400 px-1 py-1.5 font-black text-center text-slate-800 text-[10px] sm:text-[10.5px] leading-tight align-middle h-full bg-slate-100 bg-clip-border relative";
  const tdStyle = "border-r border-b border-slate-400 px-1 py-2 text-[10px] sm:text-[11px] text-slate-700 align-middle text-center break-words bg-white";
  const numTdStyle = "border-r border-b border-slate-400 px-1 py-2 text-[10px] sm:text-[11px] text-slate-700 align-middle text-center font-bold bg-white";

  const formatTextValue = (val: string | undefined | null) => {
    if (val === undefined || val === null || val.trim() === '') return '-';
    return toBengaliDigits(val);
  };

  return (
    <div id="bilateral-monthly-online-detail-container" className="space-y-5 py-4 w-full animate-report-page relative bg-white p-5 rounded-3xl border border-slate-100 shadow-xl">
      <IDBadge id="bilateral-monthly-online-detail-container" />

      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100 w-full">
        {/* Title block */}
        <div className="flex items-stretch h-[44px] w-fit shadow-md select-none rounded-2xl overflow-hidden border border-slate-200/40 shrink-0">
          <button 
            onClick={onBack}
            className="flex items-center justify-center bg-[#f8fafc] hover:bg-slate-100 text-slate-700 border-r border-slate-200 w-12 transition-colors cursor-pointer"
            title="পেছনে যান"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <div className="flex flex-col h-full min-w-[240px] justify-center bg-[#1e40af] px-4">
            <span className="text-white font-[950] tracking-tight text-[13px]">
              অনলাইন প্রাপ্তি - দ্বিপক্ষীয় মাসিক রিটার্ন
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
              <div className="absolute top-[calc(100%+4px)] right-0 w-[260px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2.5 animate-in fade-in duration-200 max-h-[350px] overflow-y-auto scrollbar-thin">
                <div className="px-3 py-1 pb-2 border-b border-slate-100 text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1">
                  <LayoutGrid size={11} className="text-sky-500" /> মন্ত্রণালয় ফিল্টার
                </div>
                <div className="space-y-1 mt-1.5">
                  <div
                    onClick={() => {
                      setFilterMinistry('সকল');
                      setIsMinistryDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-xs font-bold ${
                      filterMinistry === 'সকল' ? 'bg-sky-600 text-white' : 'hover:bg-slate-50 text-slate-700 hover:text-sky-600 bg-white'
                    }`}
                  >
                    <span>সকল মন্ত্রণালয়</span>
                    {filterMinistry === 'সকল' && <Check size={13} className="text-white stroke-[3.5]" />}
                  </div>
                  {ministryGroups.map((m, idx) => {
                    const normM = robustNormalize(m);
                    const isActive = filterMinistry === normM;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setFilterMinistry(normM);
                          setIsMinistryDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-xs font-bold ${
                          isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-50 text-slate-700 hover:text-sky-600 bg-white'
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        {isActive && <Check size={13} className="text-white stroke-[3.5]" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Excel Export */}
          <button 
            onClick={downloadExcel}
            className="flex items-center justify-center gap-1.5 px-3 h-[38px] bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-100 hover:border-emerald-600 rounded-xl font-bold text-[11px] transition-all duration-300 cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="এক্সেল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={14} className="text-emerald-600 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">এক্সেল ডাউনলোড</span>
          </button>

          {/* Print */}
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 h-[38px] bg-slate-50 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-800 rounded-xl font-bold text-[11px] transition-all duration-300 cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="প্রিন্ট করুন"
          >
            <Printer size={14} className="text-slate-600 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">প্রিন্ট</span>
          </button>
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
            placeholder="বিবরণ, ডায়েরি নং, মন্তব্য দিয়ে খুঁজুন..."
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
          <span>মোট অনলাইন প্রাপ্তি এন্ট্রি:</span>
          <span className="bg-blue-600 text-white rounded-lg px-2 py-0.5 font-extrabold text-[11px]">
            {toBengaliDigits(filteredEntries.length.toString())} টি
          </span>
        </div>
      </div>

      {/* Main Table Section */}
      <div id="card-bilateral-monthly-online-detail-table-container" className="bg-white border border-slate-300 shadow-inner rounded-none overflow-hidden">
        
        {/* Print Header */}
        <div className="hidden print:block text-center space-y-2 mb-4">
          <h2 className="text-base font-black text-slate-900 leading-relaxed">
            Responsible Party হতে অনলাইনে দ্বিপক্ষীয় সভার প্রাপ্ত পত্রাদির মাসিক প্রতিবেদন: ({toBengaliDigits(dateFnsFormat(startOfMonthDate, 'dd-MM-yyyy'))} খ্রিঃ হতে {toBengaliDigits(dateFnsFormat(endOfMonthDate, 'dd-MM-yyyy'))} খ্রিঃ পর্যন্ত)
          </h2>
          <div className="text-[11px] font-bold text-slate-500">শাখাঃ নন এসএফআই।</div>
        </div>

        <div className="overflow-x-auto">
          <table id="table-bilateral-monthly-online-detail" className="w-full border-separate border-spacing-0 !table-auto border-l border-t border-slate-400">
            <thead>
              <tr className="bg-slate-50">
                <th rowSpan={2} className={`${thStyle} w-[50px]`}>ক্রমিক</th>
                <th rowSpan={2} className={`${thStyle} w-[240px]`}>প্রতিষ্ঠানের নাম ও নিরীক্ষা বছর</th>
                <th rowSpan={2} className={`${thStyle} w-[100px]`}>প্রাপ্ত জবাব<br/>(পত্র সংখ্যা)</th>
                <th rowSpan={2} className={`${thStyle} w-[180px]`}>প্রাপ্ত জবাবের ডায়েরি নং ও তারিখ</th>
                <th rowSpan={2} className={`${thStyle} w-[110px]`}>অনুচ্ছেদ সংখ্যা</th>
                <th colSpan={3} className={`${thStyle}`}>গৃহীত কার্যক্রম</th>
                <th rowSpan={2} className={`${thStyle} w-[140px] rounded-none`}>মন্তব্য</th>
              </tr>
              <tr className="bg-slate-50">
                <th className={`${thStyle} w-[180px]`}>প্রাপ্ত জবাবের Disposal সংক্রান্ত তথ্য</th>
                <th className={`${thStyle} w-[110px]`}>নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা</th>
                <th className={`${thStyle} w-[110px]`}>অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা</th>
              </tr>
              <tr className="bg-slate-50">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                  <th key={p} className={`${thStyle} text-[9px] sm:text-[10px] font-bold text-slate-500 py-1`}>
                    {toBengaliDigits(p.toString())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={9} className="text-center font-black text-slate-900 text-[14px] sm:text-[15px] py-16 border-r border-b border-slate-400 bg-white">
                    Responsible Party হতে অনলাইনে কোন দ্বিপক্ষীয় সভার প্রতিবেদন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row, idx) => {
                  const rowRecommendedCount = parseInt(toEnglishDigits(row.meetingRecommendedParaCount || row.meetingSentParaCount || '0')) || row.paragraphs?.length || 0;
                  const rowSettledCount = row.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(row.meetingSettledParaCount || '0')) || 0;
                  const rowUnsettledCount = parseInt(toEnglishDigits(row.meetingUnsettledParas || '0')) || Math.max(0, rowRecommendedCount - rowSettledCount);
                  const rowRaisedCount = parseInt(toEnglishDigits(row.manualRaisedCount || '1')) || 1;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/75 bg-white transition-colors group">
                      <td className={`${numTdStyle} text-slate-700 font-extrabold group-hover:text-blue-600`}>
                        {toBengaliDigits((idx + 1).toString())}
                      </td>
                      <td className={`${tdStyle} text-left font-bold text-slate-800 leading-relaxed`}>
                        <div className="font-extrabold text-slate-950 text-[11px] sm:text-[11.5px]">
                          <HighlightText text={row.ministryName} searchTerm={searchTerm} />
                        </div>
                        {row.entityName && (
                          <div className="text-slate-700 text-[10px] sm:text-[10.5px]">
                            <HighlightText text={row.entityName} searchTerm={searchTerm} />
                          </div>
                        )}
                        {row.branchName && (
                          <div className="text-blue-700 text-[10px] font-black">
                            <HighlightText text={row.branchName} searchTerm={searchTerm} />
                          </div>
                        )}
                        {row.auditYear && (
                          <div className="text-slate-500 font-bold text-[10px] mt-0.5">
                            অডিট আপত্তি বছর: {toBengaliDigits(row.auditYear)}
                          </div>
                        )}
                        {row.archiveNo && (
                          <div className="text-purple-700 font-extrabold text-[10px] mt-1 pt-1 border-t border-dashed border-slate-200 whitespace-pre-line leading-normal">
                            আর্কাইভ নং: {toBengaliDigits(row.archiveNo)}
                          </div>
                        )}
                      </td>
                      <td className={numTdStyle}>
                        {toBengaliDigits(rowRaisedCount.toString())}
                      </td>
                      <td className={`${tdStyle} font-bold text-slate-800`}>
                        <HighlightText text={formatTextValue(row.workpaperNoDate)} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdStyle}>
                        {toBengaliDigits(rowRecommendedCount.toString())}
                      </td>
                      <td className={`${tdStyle} font-bold text-slate-800`}>
                        <HighlightText text={formatTextValue(row.issueLetterNoDate)} searchTerm={searchTerm} />
                      </td>
                      <td className={`${numTdStyle} text-emerald-600 font-black`}>
                        {toBengaliDigits(rowSettledCount.toString())}
                      </td>
                      <td className={`${numTdStyle} text-red-600 font-black`}>
                        {toBengaliDigits(rowUnsettledCount.toString())}
                      </td>
                      <td className={`${tdStyle} text-left font-semibold text-slate-800`}>
                        <HighlightText text={row.remarks || ''} searchTerm={searchTerm} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-extrabold shadow-2xl relative z-10">
                <tr className="h-[40px] bg-slate-900 border-t border-slate-700">
                  <td colSpan={2} className="border-r border-b border-slate-700 px-3 py-2 text-left text-[11px] font-black uppercase text-white rounded-none">
                    সর্বমোট (ফিল্টারকৃত):
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {toBengaliDigits(totals.raisedCount.toString())} টি
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-white font-black">
                    {toBengaliDigits(totals.recommendedPara.toString())}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2"></td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-emerald-400 font-black">
                    {toBengaliDigits(totals.settledPara.toString())}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2 text-center text-[11px] text-red-400 font-black">
                    {toBengaliDigits(totals.unsettledPara.toString())}
                  </td>
                  <td className="border-r border-b border-slate-700 px-2 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default BilateralMonthlyOnlineReceiptDetail;
