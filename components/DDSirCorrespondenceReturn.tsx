import { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronLeft, Printer, Mail, Calendar, RotateCcw, Search, X, User, ChevronDown, Check, Sparkles } from 'lucide-react';
import React from 'react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format, startOfMonth, addDays, isBefore, subMonths, parseISO } from 'date-fns';

interface DDSirCorrespondenceReturnProps {
  entries: any[];
  activeCycle: { start: Date; end: Date; label: string };
  onBack: () => void;
  isLayoutEditable?: boolean;
  IDBadge: React.FC<{ id: string }>;
}

const DDSirCorrespondenceReturn: React.FC<DDSirCorrespondenceReturnProps> = ({ 
  entries, 
  activeCycle, 
  onBack, 
  isLayoutEditable,
  IDBadge
}) => {
  const [filterBranch, setFilterBranch] = useState('সকল');
  const [filterAuditor, setFilterAuditor] = useState('সকল');
  const [showStats, setShowStats] = useState(false);
  const [isAuditorDropdownOpen, setIsAuditorDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const auditorDropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (auditorDropdownRef.current && !auditorDropdownRef.current.contains(e.target as Node)) {
        setIsAuditorDropdownOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const auditorOptions = useMemo(() => {
    const unique = Array.from(new Set(entries.map(e => e.receiverName || e.presentedToName).filter(Boolean)));
    return ['সকল', ...unique];
  }, [entries]);

  const reportingLimitDate = useMemo(() => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedMonthStart = new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth(), 1);
    
    if (selectedMonthStart.getTime() > currentMonthStart.getTime()) {
      // Next month selected: show up to today (Current Status)
      return today;
    } else {
      // Current or Past month selected: show up to the end of the month BEFORE the selected month
      return new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth(), 0, 23, 59, 59);
    }
  }, [activeCycle.start]);

  const [selectedReportingDate, setSelectedReportingDate] = useState<string>(format(reportingLimitDate, 'yyyy-MM-dd'));

  useEffect(() => {
    setSelectedReportingDate(format(reportingLimitDate, 'yyyy-MM-dd'));
  }, [reportingLimitDate]);

  const filteredEntries = useMemo(() => {
    let data = entries || [];
    
    const reportingDateObj = new Date(selectedReportingDate);
    if (isNaN(reportingDateObj.getTime())) return data;

    data = data.filter(e => {
      if (!e.diaryDate) return false;
      const dDateStr = toEnglishDigits(e.diaryDate);
      const dDate = new Date(dDateStr);
      if (isNaN(dDate.getTime())) return false;
      
      // Must be received ON OR BEFORE reportingDateObj
      if (dDate.getTime() > reportingDateObj.getTime()) return false;
      
      // Must NOT be issued (If it has a valid issue number and date, it's no longer pending)
      const rawNo = e.issueLetterNo ? String(e.issueLetterNo).trim() : '';
      const rawDate = e.issueLetterDate ? String(e.issueLetterDate).trim() : '';
      const hasValidNo = rawNo !== '' && rawNo !== '০' && rawNo !== '0' && !rawNo.includes('নং-');
      const hasValidDate = rawDate !== '' && rawDate !== '0000-00-00';
      
      if (hasValidNo && hasValidDate) {
        return false; 
      }
      
      return true;
    });

    if (filterAuditor !== 'সকল') {
      data = data.filter(e => (e.receiverName || e.presentedToName) === filterAuditor);
    }

    if (filterBranch !== 'সকল') {
      data = data.filter(e => e.paraType === filterBranch);
    }

    return data;
  }, [entries, filterAuditor, filterBranch, selectedReportingDate]);

  const reportingDate = new Date(selectedReportingDate);

  const reportingDateBN = toBengaliDigits(format(reportingDate, 'dd/MM/yyyy'));
  const reportingMonthBN = toBengaliDigits(format(reportingDate, 'MMMM/yy'))
    .replace('January', 'জানুয়ারি').replace('February', 'ফেব্রুয়ারি').replace('March', 'মার্চ')
    .replace('April', 'এপ্রিল').replace('May', 'মে').replace('June', 'জুন')
    .replace('July', 'জুলাই').replace('August', 'আগস্ট').replace('September', 'সেপ্টেম্বর')
    .replace('October', 'অক্টোবর').replace('November', 'নভেম্বর').replace('December', 'ডিসেম্বর');

  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]' : 'border-slate-300 shadow-sm hover:border-slate-300'}`;

  // --- Grouping & Calculation Logic for Table 1 (Summary) ---
  const reportTableData = useMemo(() => {
    const grouped: Record<string, any> = {};
    const thresholdDate = subMonths(reportingDate, 1);

    filteredEntries.forEach(entry => {
      const auditor = entry.receiverName || entry.presentedToName || 'অনির্ধারিত';
      if (!grouped[auditor]) {
        grouped[auditor] = {
          name: auditor,
          karyapatra: { less: 0, more: 0 },
          karyabibarani: { less: 0, more: 0 },
          broadsheet: { less: 0, more: 0 },
          reconciliation: { less: 0, more: 0 },
          others: { less: 0, more: 0 }
        };
      }

      const diaryDate = new Date(entry.diaryDate);
      const isMoreThanMonth = isBefore(diaryDate, thresholdDate);
      const durationKey = isMoreThanMonth ? 'more' : 'less';

      const lType = entry.letterType || '';
      const desc = (entry.description || '').toLowerCase();

      // UPDATED LOGIC: Categorize based on Workpaper (কার্যপত্র) or Minutes (কার্যবিবরণী)
      if (lType.includes('কার্যপত্র')) {
        grouped[auditor].karyapatra[durationKey]++;
      } else if (lType.includes('কার্যবিবরণী')) {
        grouped[auditor].karyabibarani[durationKey]++;
      } else if (lType === 'বিএসআর') {
        grouped[auditor].broadsheet[durationKey]++;
      } else if (lType === 'মিলিকরণ' || desc.includes('মিলিকরণ') || desc.includes('সমন্বয়')) {
        grouped[auditor].reconciliation[durationKey]++;
      } else {
        grouped[auditor].others[durationKey]++;
      }
    });

    return Object.values(grouped);
  }, [filteredEntries, reportingDate]);

  // --- Grouping & Logic for Table 2 (Detailed List) ---
  const detailedListData = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => {
      const audA = a.receiverName || a.presentedToName || 'অনির্ধারিত';
      const audB = b.receiverName || b.presentedToName || 'অনির্ধারিত';
      return audA.localeCompare(audB);
    });

    const groups: { auditor: string; rows: any[] }[] = [];
    sorted.forEach(row => {
      const aud = row.receiverName || row.presentedToName || 'অনির্ধারিত';
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.auditor === aud) {
        lastGroup.rows.push(row);
      } else {
        groups.push({ auditor: aud, rows: [row] });
      }
    });
    return groups;
  }, [filteredEntries]);

  const totals = useMemo(() => {
    return reportTableData.reduce((acc, row) => {
      acc.kpL += row.karyapatra.less; acc.kpM += row.karyapatra.more;
      acc.kbL += row.karyabibarani.less; acc.kbM += row.karyabibarani.more;
      acc.bsL += row.broadsheet.less; acc.bsM += row.broadsheet.more;
      acc.rcL += row.reconciliation.less; acc.rcM += row.reconciliation.more;
      acc.otL += row.others.less; acc.otM += row.others.more;
      return acc;
    }, { kpL: 0, kpM: 0, kbL: 0, kbM: 0, bsL: 0, bsM: 0, rcL: 0, rcM: 0, otL: 0, otM: 0 });
  }, [reportTableData]);

  const grandTotalLess = totals.kpL + totals.kbL + totals.bsL + totals.rcL + totals.otL;
  const grandTotalMore = totals.kpM + totals.kbM + totals.bsM + totals.rcM + totals.otM;

  const summaryStats = useMemo(() => {
    const stats = {
      total: entries.length,
      sfi: { total: 0, bsr: 0, kp: 0, kb: 0, reconciliation: 0 },
      nonSfi: { total: 0, bsr: 0, kp: 0, kb: 0, reconciliation: 0 }
    };
    entries.forEach(e => {
      if (e.paraType === 'এসএফআই') {
        stats.sfi.total++;
        if (e.letterType === 'বিএসআর') stats.sfi.bsr++;
        if (e.letterType?.includes('কার্যপত্র')) stats.sfi.kp++;
        if (e.letterType?.includes('কার্যবিবরণী')) stats.sfi.kb++;
        if (e.letterType === 'মিলিকরণ') stats.sfi.reconciliation++;
      } else if (e.paraType === 'নন এসএফআই') {
        stats.nonSfi.total++;
        if (e.letterType === 'বিএসআর') stats.nonSfi.bsr++;
        if (e.letterType?.includes('কার্যপত্র')) stats.nonSfi.kp++;
        if (e.letterType?.includes('কার্যবিবরণী')) stats.nonSfi.kb++;
        if (e.letterType === 'মিলিকরণ') stats.nonSfi.reconciliation++;
      }
    });
    return stats;
  }, [entries]);

  // Header font is font-bold
  const thStyle = "border border-slate-300 px-1 py-2 font-bold text-center text-[11px] leading-tight align-middle bg-slate-200";
  // Data cells reverted to font-bold (700 weight as per instruction)
  const tdStyle = "border border-slate-300 px-1.5 py-1.5 text-[12px] text-center font-bold leading-tight bg-white align-middle transition-colors group-hover:bg-blue-50";
  
  // Reverted sticky header from bold to black
  const stickyThStyle = "border border-slate-300 px-1 py-3 font-black text-center text-[10px] bg-slate-200";
  // Reverted sticky data from medium to bold
  const stickyTdStyle = "border border-slate-300 px-1.5 py-1.5 text-[11px] text-center font-bold leading-tight bg-white align-middle transition-colors group-hover:bg-blue-50";

  return (
    <div id="dd-sir-report-container" className="space-y-6 py-2 w-full animate-report-reveal relative font-['Hind_Siliguri'] bg-white multi-table-view">
      <IDBadge id="dd-sir-report-container" />
      {/* Control Bar (No Print) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">স্পেশাল ভিউ:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">ডিডি স্যার ফরম্যাট</span>
          </div>
          
          <div className="relative group ml-4">
            <button 
              className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 font-bold text-[12px] no-print ${showStats ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
            >
              <Sparkles size={14} className={showStats ? 'animate-pulse' : ''} />
              পরিসংখ্যান <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[2000]">
              <div className="min-w-[300px] p-5 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl">
                <div className="flex flex-col gap-3 font-black text-slate-700">
                  <div className="flex items-center gap-2 text-[14px]">
                    <span className="text-blue-700 font-black">মোট চিঠি:</span>
                    <span className="text-slate-900 font-black">{toBengaliDigits(summaryStats.total)} টি</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-blue-700 font-black">এসএফআই:</span>
                    <span className="text-slate-900 font-black">
                      {toBengaliDigits(summaryStats.sfi.total)} টি 
                      <span className="text-slate-700 font-black ml-1">
                        (বিএসআর: {toBengaliDigits(summaryStats.sfi.bsr)} টি, 
                        ত্রিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(summaryStats.sfi.kp)} টি, 
                        ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(summaryStats.sfi.kb)} টি,
                        মিলিকরণ: {toBengaliDigits(summaryStats.sfi.reconciliation)} টি।
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-blue-700 font-black">নন এসএফআই:</span>
                    <span className="text-slate-900 font-black">
                      {toBengaliDigits(summaryStats.nonSfi.total)} টি 
                      <span className="text-slate-700 font-black ml-1">
                        (বিএসআর: {toBengaliDigits(summaryStats.nonSfi.bsr)} টি, 
                        দ্বিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(summaryStats.nonSfi.kp)} টি, 
                        দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(summaryStats.nonSfi.kb)} টি,
                        মিলিকরণ: {toBengaliDigits(summaryStats.nonSfi.reconciliation)} টি।
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Branch Filter */}
          <div className="space-y-1 relative group" ref={branchDropdownRef}>
            <div 
              className={customDropdownCls(false) + " min-w-[150px] group-hover:border-blue-600 group-hover:ring-4 group-hover:ring-blue-50"}
            >
              <Mail size={16} className="text-blue-600" />
              <span className="font-bold text-[12px] text-slate-900 truncate">
                {filterBranch === 'সকল' ? 'সকল শাখা' : filterBranch}
              </span>
              <ChevronDown size={14} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-blue-600" />
            </div>
            
            <div className="absolute top-full left-0 w-full pt-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[2000]">
              <div className="min-w-[180px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                <div className="max-h-[250px] overflow-y-auto no-scrollbar py-2">
                  {['সকল', 'এসএফআই', 'নন এসএফআই'].map((opt, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setFilterBranch(opt)} 
                      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterBranch === opt ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700 font-bold text-[12px]'}`}
                    >
                      <span>{opt === 'সকল' ? 'সকল শাখা' : opt}</span>
                      {filterBranch === opt && <Check size={14} strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Auditor Filter */}
          <div className="space-y-1 relative group" ref={auditorDropdownRef}>
            <div 
              className={customDropdownCls(false) + " min-w-[180px] group-hover:border-blue-600 group-hover:ring-4 group-hover:ring-blue-50"}
            >
              <User size={16} className="text-blue-600" />
              <span className="font-bold text-[12px] text-slate-900 truncate">
                {filterAuditor === 'সকল' ? 'সকল অডিটর' : filterAuditor}
              </span>
              <ChevronDown size={14} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-blue-600" />
            </div>
            
            <div className="absolute top-full left-0 w-full pt-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[2000]">
              <div className="min-w-[200px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000] overflow-hidden">
                <div className="max-h-[250px] overflow-y-auto no-scrollbar py-2">
                  {auditorOptions.map((opt, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setFilterAuditor(opt)} 
                      className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterAuditor === opt ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700 font-bold text-[12px]'}`}
                    >
                      <span>{opt === 'সকল' ? 'সকল অডিটর' : opt}</span>
                      {filterAuditor === opt && <Check size={14} strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 h-[44px] rounded-xl relative group">
             <Calendar size={16} className="text-blue-600" />
             <label className="text-[11px] font-black text-slate-500 uppercase tracking-tighter mr-1">রিপোর্টিং তারিখ:</label>
             <div className="relative flex items-center">
               <span className="font-black text-slate-900 text-xs pointer-events-none">
                 {toBengaliDigits(format(reportingDate, 'dd/MM/yyyy'))}
               </span>
               <input 
                 type="date" 
                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                 value={selectedReportingDate}
                 onChange={(e) => setSelectedReportingDate(e.target.value)}
               />
             </div>
             {selectedReportingDate !== format(reportingLimitDate, 'yyyy-MM-dd') && (
               <button 
                onClick={() => setSelectedReportingDate(format(reportingLimitDate, 'yyyy-MM-dd'))}
                className="p-1 hover:bg-white rounded-md text-blue-400 hover:text-blue-600 transition-all"
                title="ডিফল্ট তারিখে ফিরুন"
               >
                 <RotateCcw size={14} />
               </button>
             )}
          </div>
          
          <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
            <Printer size={18} /> প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* Summary Stats Panel (Removed as it's now in hover) */}

      <div className="w-full bg-white p-2 md:p-6 relative">
        {/* Office Header */}
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-[19px] font-bold text-black leading-tight">{OFFICE_HEADER.main}</h1>
          <h2 className="text-[17px] font-bold text-black leading-tight">{OFFICE_HEADER.sub}</h2>
          <h3 className="text-[16px] font-bold text-black leading-tight">{OFFICE_HEADER.address}</h3>
          <h4 className="text-[15px] font-bold text-black leading-tight">খুলনা-৯০০০</h4>
        </div>

        {/* SECTION 1: সারসংক্ষেপ টেবিল */}
        <div className="mb-10 flex justify-center overflow-visible">
          <div className="table-container max-w-full w-full border border-slate-300 rounded-lg overflow-auto">
            <table className="w-full border-separate table-fixed border-spacing-0 !table-auto">
              <colgroup>
                <col className="w-[30px]" />
                <col className="w-[130px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
              </colgroup>
              <thead>
                <tr className="bg-white">
                  <th colSpan={2} className="border border-slate-300 p-1.5 text-center font-bold text-[13px]">অনিষ্পন্ন কাজের তালিকা (ফিল্টারকৃত)</th>
                  <th colSpan={4} className="border border-slate-300 p-1.5 text-center font-bold text-[13px]">শাখা: {filterBranch === 'সকল' ? 'সকল' : filterBranch}</th>
                  <th colSpan={3} className="border border-slate-300 p-1.5 text-center font-bold text-[13px]">মাস: {reportingMonthBN}</th>
                  <th colSpan={3} className="border border-slate-300 p-1.5 text-center font-bold text-[13px]">তারিখ: {reportingDateBN} খ্রি:</th>
                </tr>
                <tr>
                  <th rowSpan={2} className={thStyle}>ক্রমিক নং</th>
                  <th rowSpan={2} className={thStyle}>দায়িত্বপ্রাপ্ত অডিটর</th>
                  <th colSpan={2} className={thStyle}>
                    {filterBranch === 'এসএফআই' ? 'ত্রিপক্ষীয় সভার কার্যপত্র' : 
                     filterBranch === 'নন এসএফআই' ? 'দ্বিপক্ষীয় সভার কার্যপত্র' : 
                     'দ্বি/ত্রিপক্ষীয় সভার কার্যপত্র'}
                  </th>
                  <th colSpan={2} className={thStyle}>
                    {filterBranch === 'এসএফআই' ? 'ত্রিপক্ষীয় সভার কার্যবিবরণী' : 
                     filterBranch === 'নন এসএফআই' ? 'দ্বিপক্ষীয় সভার কার্যবিবরণী' : 
                     'দ্বি/ত্রিপক্ষীয় সভার কার্যবিবরণী'}
                  </th>
                  <th colSpan={2} className={thStyle}>ব্রডশীট জবাব</th>
                  <th colSpan={2} className={thStyle}>মিলিকরণ</th>
                  <th colSpan={2} className={thStyle}>অন্যান্য</th>
                </tr>
                <tr>
                  <th className={thStyle}>১ মাস-</th>
                  <th className={thStyle}>১ মাস+</th>
                  <th className={thStyle}>১ মাস-</th>
                  <th className={thStyle}>১ মাস+</th>
                  <th className={thStyle}>১ মাস-</th>
                  <th className={thStyle}>১ মাস+</th>
                  <th className={thStyle}>১ মাস-</th>
                  <th className={thStyle}>১ মাস+</th>
                  <th className={thStyle}>১ মাস-</th>
                  <th className={thStyle}>১ মাস+</th>
                </tr>
              </thead>
              <tbody>
                {reportTableData.length > 0 ? reportTableData.map((row, idx) => (
                  <tr key={idx} className="group">
                    <td className={tdStyle}>{toBengaliDigits(idx + 1)}</td>
                    <td className={tdStyle + " text-left text-[11px] font-bold"}>{row.name}</td>
                    <td className={tdStyle}>{row.karyapatra.less > 0 ? `${toBengaliDigits(row.karyapatra.less)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.karyapatra.more > 0 ? `${toBengaliDigits(row.karyapatra.more)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.karyabibarani.less > 0 ? `${toBengaliDigits(row.karyabibarani.less)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.karyabibarani.more > 0 ? `${toBengaliDigits(row.karyabibarani.more)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.broadsheet.less > 0 ? `${toBengaliDigits(row.broadsheet.less)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.broadsheet.more > 0 ? `${toBengaliDigits(row.broadsheet.more)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.reconciliation.less > 0 ? `${toBengaliDigits(row.reconciliation.less)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.reconciliation.more > 0 ? `${toBengaliDigits(row.reconciliation.more)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.others.less > 0 ? `${toBengaliDigits(row.others.less)} টি` : '-'}</td>
                    <td className={tdStyle}>{row.others.more > 0 ? `${toBengaliDigits(row.others.more)} টি` : '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center italic border border-slate-300 font-bold text-slate-400">কোনো তথ্য পাওয়া যায়নি</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="no-print">
                <tr className="bg-slate-900 text-white">
                  <td colSpan={4} className="border border-slate-700 p-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-bold text-[10px] text-white/80">১ মাসের কম:</span>
                      <span className="font-black text-[12px] text-white">{toBengaliDigits(grandTotalLess)} টি</span>
                    </div>
                  </td>
                  <td colSpan={4} className="border border-slate-700 p-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-bold text-[10px] text-white/80">১ মাসের বেশি:</span>
                      <span className="font-black text-[12px] text-white">{toBengaliDigits(grandTotalMore)} টি</span>
                    </div>
                  </td>
                  <td colSpan={4} className="border border-slate-700 p-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-bold text-[10px] text-white/80">মোট কাজ:</span>
                      <span className="font-black text-[12px] text-white">{toBengaliDigits(grandTotalLess + grandTotalMore)} টি</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 2: বিস্তারিত তালিকা টেবিল (Sticky by tableSticky.css logic) */}
        <div className="pt-10 border-t-4 border-double border-slate-200 flex flex-col items-center overflow-visible">
          <div className="text-center mb-6 w-full">
             <div className="inline-block px-10 py-1 bg-black text-white text-[15px] font-bold tracking-widest uppercase mb-4">ছক</div>
             <div className="flex justify-between items-end border-b border-slate-300 pb-1">
                <span className="font-bold text-[14px]">বকেয়া চিঠিপত্রের তালিকা ({filterBranch === 'সকল' ? 'সকল' : filterBranch} শাখা)</span>
                <span className="font-bold text-[14px]">তাং- {reportingDateBN} খ্রি:</span>
             </div>
          </div>

          <div className="table-container relative overflow-auto w-full border border-slate-300 rounded-lg">
            <table className="w-full border-separate table-fixed border-spacing-0 !table-auto">
              <colgroup>
                <col className="w-[30px]" />
                <col className="w-[80px]" />
                <col className="w-[160px]" />
                <col className="w-[95px]" />
                <col className="w-[95px]" />
                <col className="w-[120px]" />
                <col className="w-[80px]" />
                <col className="w-[100px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={stickyThStyle}>ক্রমিক নং</th>
                  <th className={stickyThStyle}>অডিটর</th>
                  <th className={stickyThStyle}>এনটিটি/প্রতিষ্ঠানের নাম</th>
                  <th className={stickyThStyle}>স্মারক নং ও তারিখ</th>
                  <th className={stickyThStyle}>ডায়েরি নং ও তারিখ</th>
                  <th className={stickyThStyle}>চিঠির ধরণ ও অনুচ্ছেদ</th>
                  <th className={stickyThStyle}>উপস্থাপনের তারিখ</th>
                  <th className={stickyThStyle}>বর্তমান অবস্থান</th>
                  <th className={stickyThStyle}>মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                {detailedListData.length > 0 ? (() => {
                  let globalIdx = 0;
                  return detailedListData.map((group) => group.rows.map((row, rowIdx) => {
                    globalIdx++;
                    return (
                      <tr key={row.id} className="group">
                        <td className={stickyTdStyle}>{toBengaliDigits(globalIdx)}</td>
                        {rowIdx === 0 && (
                          <td rowSpan={group.rows.length} className={stickyTdStyle + " bg-slate-50/50 group-hover:bg-blue-100"}>
                            {/* Auditor Name Weight set to 700 (font-bold) */}
                            <div className="font-bold text-slate-900 text-[10.5px] leading-tight">{group.auditor}</div>
                          </td>
                        )}
                        <td className={stickyTdStyle + " text-left px-2 font-bold text-[10.5px]"}>{row.description}</td>
                        <td className={stickyTdStyle}>{row.letterNo}<br/><span className="text-[9px] text-slate-500 font-bold">{formatDateBN(row.letterDate)}</span></td>
                        <td className={stickyTdStyle}>{row.diaryNo}<br/><span className="text-[9px] text-slate-500 font-bold">{formatDateBN(row.diaryDate)}</span></td>
                        <td className={stickyTdStyle}>
                          <div className="flex flex-col gap-0.5">
                             <span className="text-blue-700 text-[10.5px] font-bold">
                               {row.paraType === 'এসএফআই' ? (
                                 row.letterType === 'কার্যপত্র' ? 'ত্রিপক্ষীয় সভার কার্যপত্র' :
                                 row.letterType === 'কার্যবিবরণী' ? 'ত্রিপক্ষীয় সভার কার্যবিবরণী' :
                                 row.letterType
                               ) : row.paraType === 'নন এসএফআই' ? (
                                 row.letterType === 'কার্যপত্র' ? 'দ্বিপক্ষীয় সভার কার্যপত্র' :
                                 row.letterType === 'কার্যবিবরণী' ? 'দ্বিপক্ষীয় সভার কার্যবিবরণী' :
                                 row.letterType
                               ) : row.letterType}
                             </span>
                             <span className="text-[9.5px] font-bold">(অনু: {toBengaliDigits(row.totalParas)}টি)</span>
                          </div>
                        </td>
                        <td className={stickyTdStyle}>{formatDateBN(row.presentationDate) || '-'}</td>
                        <td className={stickyTdStyle}>
                          {/* Position Badge Weight set to 700 (font-bold) */}
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-bold uppercase group-hover:bg-white">
                            {row.presentedToName || 'অডিটর'}
                          </span>
                        </td>
                        <td className={stickyTdStyle + " italic text-slate-400 text-[9px]"}>{row.remarks || '-'}</td>
                      </tr>
                    );
                  }));
                })() : (
                  <tr>
                    <td colSpan={9} className="py-20 text-center font-bold text-slate-400 bg-slate-50 italic border border-slate-300">
                      বর্তমানে বিস্তারিত তালিকায় কোনো তথ্য নেই।
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-[12px] h-11 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-slate-700">
                  <td colSpan={2} className="px-6 text-left border-t border-slate-700 bg-slate-900">সর্বমোট চিঠিপত্র (ফিল্টারকৃত):</td>
                  <td colSpan={1} className="px-4 text-center border-t border-slate-700 bg-slate-900 text-white font-bold">{toBengaliDigits(filteredEntries.length)} টি</td>
                  <td colSpan={6} className="border-t border-slate-700 bg-slate-900"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DDSirCorrespondenceReturn;
