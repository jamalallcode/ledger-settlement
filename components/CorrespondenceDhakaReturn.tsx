
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, ChevronLeft, Search, X, ChevronDown, Check, LayoutGrid, FileText, ChevronRight } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';

interface CorrespondenceDhakaReturnProps {
  correspondenceEntries: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
}

const CorrespondenceDhakaReturn: React.FC<CorrespondenceDhakaReturnProps> = ({
  correspondenceEntries,
  activeCycle,
  setSelectedReportType,
  HistoricalFilter,
  IDBadge
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParaType, setFilterParaType] = useState('সকল');
  const [filterLetterType, setFilterLetterType] = useState('সকল');
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date(activeCycle.end));
  
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

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

    // 2. Filter by selected month (Pending Logic)
    // User Requirement: 
    // - If past month selected: Show letters received UP TO THE PREVIOUS MONTH end.
    // - If current month selected: Show letters received UP TO TODAY.
    // - Never exceed current date.
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedMonthStart = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1);
    
    const reportingLimitDate = selectedMonthStart.getTime() > currentMonthStart.getTime()
      ? today
      : new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 0, 23, 59, 59);
    
    data = data.filter(e => {
      if (!e.diaryDate) return false;
      const dDateStr = toEnglishDigits(e.diaryDate);
      const dDate = new Date(dDateStr);
      if (isNaN(dDate.getTime())) return false;
      
      // Must be received ON OR BEFORE reportingLimitDate
      if (dDate.getTime() > reportingLimitDate.getTime()) return false;
      
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

  const thS = "border border-slate-300 px-1 py-1 font-black text-center text-[10px] md:text-[11px] bg-slate-200 text-slate-900 leading-tight align-middle h-full shadow-[inset_0_0_0_1px_#cbd5e1] bg-clip-border";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-emerald-600 ring-4 ring-emerald-50 shadow-md z-[1010]' : 'border-slate-300 shadow-sm hover:border-slate-300'}`;
  const tdS = "border border-slate-300 px-2 py-2 text-[10px] md:text-[11px] text-center font-bold leading-tight bg-white h-[40px] align-middle overflow-hidden break-words";
  
  const reportingLimitDate = useMemo(() => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedMonthStart = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1);
    
    if (selectedMonthStart.getTime() > currentMonthStart.getTime()) {
      // Next month selected: show up to today (Current Status)
      return today;
    } else {
      // Current or Past month selected: show up to the end of the month BEFORE the selected month
      return new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 0, 23, 59, 59);
    }
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

  return (
    <div id="correspondence-dhaka-container" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="correspondence-dhaka-container" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedReportType(null)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">রিপোর্ট টাইপ:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">ঢাকা রিটার্ন</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Branch Filter */}
          <div className="space-y-1 relative group" ref={branchDropdownRef}>
            <div 
              className={customDropdownCls(false) + " min-w-[160px] group-hover:border-emerald-600 group-hover:ring-4 group-hover:ring-emerald-50 shadow-sm transition-all duration-300"}
            >
              <LayoutGrid size={16} className="text-emerald-600" />
              <span className="font-bold text-[12px] text-slate-900 truncate">
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
              <span className="font-bold text-[12px] text-slate-900 truncate">
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
              placeholder="ডায়েরি, স্মারক বা বিবরণ দিয়ে খুঁজুন..."
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
          
          {/* Month Selector Dropdown */}
          <div className="space-y-1 relative group">
            <div className="flex items-center gap-3 px-5 h-[44px] bg-white border border-slate-300 rounded-xl shadow-sm group-hover:border-emerald-600 group-hover:ring-4 group-hover:ring-emerald-50 transition-all duration-300 cursor-pointer">
               <span className="font-bold text-[13px] text-slate-800">{currentSelectedLabel}</span>
               <ChevronDown size={14} className="text-slate-400 ml-auto transition-transform duration-300 group-hover:rotate-180 group-hover:text-emerald-600" />
            </div>

            <div className="absolute top-full right-0 w-full pt-2 opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-[2000]">
              <div className="min-w-[160px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2">
                  {cycleOptions.map((opt, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setSelectedMonthDate(opt.date);
                      }} 
                      className={`flex items-center justify-center px-4 py-2.5 cursor-pointer transition-all ${currentSelectedLabel === opt.label ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[12px]'}`}
                    >
                      <span>{opt.label}</span>
                      {currentSelectedLabel === opt.label && <Check size={14} strokeWidth={3} className="ml-2" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-6 relative animate-table-entrance">
        <div className="text-center py-6 border-b-2 border-slate-100 mb-6">
          <h1 className="text-2xl font-black uppercase text-slate-900 leading-tight">{OFFICE_HEADER.main}</h1>
          <h2 className="text-xl font-black text-slate-800 leading-tight">{OFFICE_HEADER.sub}</h2>
          <h3 className="text-lg font-black text-slate-700 leading-tight">{OFFICE_HEADER.address}</h3>
          <div className="mt-4 inline-flex items-center gap-3 px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
            <span className="text-blue-400">শাখা ভিত্তিক {reportingDateBN} খ্রি: তারিখ পর্যন্ত বকেয়া চিঠিপত্রের তালিকা।</span>
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
                <tr key={entry.id} className="group hover:bg-blue-50/50 transition-colors">
                  <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                  <td className={`${tdS} text-left px-2`}>{entry.description}</td>
                  <td className={tdS}>{entry.diaryNo}<br/>{formatDateBN(entry.diaryDate)}</td>
                  <td className={tdS}>{entry.letterNo}<br/>{formatDateBN(entry.letterDate)}</td>
                  <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'নন এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{(entry.letterType.includes('ত্রিপক্ষীয় সভা') || entry.letterType === 'কার্যপত্র' || entry.letterType === 'কার্যবিবরণী') && entry.paraType === 'এসএফআই' ? `${entry.letterType} (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{(entry.letterType.includes('দ্বিপক্ষীয় সভা') || entry.letterType === 'কার্যপত্র' || entry.letterType === 'কার্যবিবরণী') && entry.paraType === 'নন এসএফআই' ? `${entry.letterType} (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>-</td>
                  <td className={tdS}>{entry.isOnline === 'হ্যাঁ' ? 'হ্যাঁ' : 'না'}</td>
                  <td className={tdS}>{formatDateBN(entry.presentationDate)}</td>
                  <td className={tdS}>{entry.presentedToName || 'অডিটর'}</td>
                  <td className={tdS}>{entry.remarks || 'চলমান'}</td>
                </tr>
              )) : (
                <tr><td colSpan={13} className="py-20 text-center font-black text-slate-400 bg-slate-50 italic">এই সাইকেলে কোনো চিঠিপত্র তথ্য পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
            <tfoot className="z-[120]">
              <tr className="bg-slate-50 text-slate-900 font-black text-[11px] h-11 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t-2 border-slate-300">
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
