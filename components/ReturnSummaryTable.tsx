
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Printer, Database, CheckCircle2, Search, X, ChevronDown, Check, LayoutGrid, MapPin, PieChart, BarChart3, Building2, Landmark, ListChecks, Sparkles, Calendar, FileSpreadsheet } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import HighlightText from './HighlightText';
import { OFFICE_HEADER } from '../constants';

interface ReturnSummaryTableProps {
  reportData: any[];
  grandTotals: any;
  activeCycle: any;
  selectedReportType: string | null;
  setSelectedReportType: (type: string | null) => void;
  isAdmin: boolean;
  historicalFilterElement?: React.ReactNode;
  monthPickerElement?: React.ReactNode;
  IDBadge: React.FC<{ id: string }>;
  showFilters: boolean;
  searchTerm: string;
  filterMinistry: string;
  statsReportData?: any[];
  statsGrandTotals?: any;
  isSearchExpanded?: boolean;
  onDownloadExcel?: () => void;
  onToggleDetailedView?: () => void;
}

const ReturnSummaryTable: React.FC<ReturnSummaryTableProps> = ({
  reportData,
  grandTotals,
  activeCycle,
  selectedReportType,
  setSelectedReportType,
  isAdmin,
  historicalFilterElement,
  monthPickerElement,
  IDBadge,
  showFilters,
  searchTerm,
  filterMinistry,
  statsReportData,
  statsGrandTotals,
  isSearchExpanded = false,
  onDownloadExcel,
  onToggleDetailedView
}) => {
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const ministryDropdownRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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

  useEffect(() => {
    // Intercepted scroll-locking via data-scroll-locked attribute to prevent layout shifts and flickering (flickering/কাপাকাপি)
    if (isStatsOpen) {
      document.body.setAttribute('data-scroll-locked', 'true');
    } else {
      document.body.removeAttribute('data-scroll-locked');
    }
    return () => {
      document.body.removeAttribute('data-scroll-locked');
    };
  }, [isStatsOpen]);

  const ministryOptions = useMemo(() => {
    const unique = Array.from(new Set(reportData.map(m => m.ministry)));
    return ['সকল', ...unique];
  }, [reportData]);

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const filteredReportData = useMemo(() => {
    let data = reportData;
    
    if (filterMinistry && filterMinistry !== 'সকল') {
      const normFilter = robustNormalize(filterMinistry);
      data = data.filter(m => robustNormalize(m.ministry) === normFilter);
    }

    if (!searchTerm.trim()) return data;
    
    return data.map(m => {
      const filteredRows = m.entityRows.filter((row: any) => 
        row.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.ministry.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...m, entityRows: filteredRows };
    }).filter(m => m.entityRows.length > 0);
  }, [reportData, searchTerm, filterMinistry]);

  const filteredGrandTotals = useMemo(() => {
    if (!searchTerm.trim() && (!filterMinistry || filterMinistry === 'সকল')) return grandTotals;
    
    return filteredReportData.reduce((acc: any, m: any) => {
      const mTotals = m.entityRows.reduce((mAcc: any, row: any) => {
        mAcc.pUC += (row.prev.unsettledCount || 0); mAcc.pUA += (row.prev.unsettledAmount || 0);
        mAcc.cRC += (row.currentRaisedCount || 0); mAcc.cRA += (row.currentRaisedAmount || 0);
        mAcc.pSC += (row.prev.settledCount || 0); mAcc.pSA += (row.prev.settledAmount || 0);
        mAcc.cSC += (row.currentSettledCount || 0); mAcc.cSA += (row.currentSettledAmount || 0);
        mAcc.cSFIC += (row.currentSFICount || 0); mAcc.cNonSFIC += (row.currentNonSFICount || 0);
        mAcc.cSFIA += (row.currentSFIAmount || 0); mAcc.cNonSFIA += (row.currentNonSFIAmount || 0);
        
        mAcc.sfiBSR = (mAcc.sfiBSR || 0) + (row.sfiBreakdown?.bsr || 0);
        mAcc.sfiTriWork = (mAcc.sfiTriWork || 0) + (row.sfiBreakdown?.triWork || 0);
        mAcc.sfiTriMin = (mAcc.sfiTriMin || 0) + (row.sfiBreakdown?.triMin || 0);
        mAcc.sfiRecon = (mAcc.sfiRecon || 0) + (row.sfiBreakdown?.recon || 0);
        
        mAcc.nonSfiBSR = (mAcc.nonSfiBSR || 0) + (row.nonSfiBreakdown?.bsr || 0);
        mAcc.nonSfiBiWork = (mAcc.nonSfiBiWork || 0) + (row.nonSfiBreakdown?.biWork || 0);
        mAcc.nonSfiBiMin = (mAcc.nonSfiBiMin || 0) + (row.nonSfiBreakdown?.biMin || 0);
        mAcc.nonSfiRecon = (mAcc.nonSfiRecon || 0) + (row.nonSfiBreakdown?.recon || 0);
        
        return mAcc;
      }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0, sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0, nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0 });
      
      acc.pUC += mTotals.pUC; acc.pUA += mTotals.pUA;
      acc.cRC += mTotals.cRC; acc.cRA += mTotals.cRA;
      acc.pSC += mTotals.pSC; acc.pSA += mTotals.pSA;
      acc.cSC += mTotals.cSC; acc.cSA += mTotals.cSA;
      acc.cSFIC += mTotals.cSFIC; acc.cNonSFIC += mTotals.cNonSFIC;
      acc.cSFIA += mTotals.cSFIA; acc.cNonSFIA += mTotals.cNonSFIA;
      
      acc.sfiBSR = (acc.sfiBSR || 0) + mTotals.sfiBSR;
      acc.sfiTriWork = (acc.sfiTriWork || 0) + mTotals.sfiTriWork;
      acc.sfiTriMin = (acc.sfiTriMin || 0) + mTotals.sfiTriMin;
      acc.sfiRecon = (acc.sfiRecon || 0) + mTotals.sfiRecon;
      
      acc.nonSfiBSR = (acc.nonSfiBSR || 0) + mTotals.nonSfiBSR;
      acc.nonSfiBiWork = (acc.nonSfiBiWork || 0) + mTotals.nonSfiBiWork;
      acc.nonSfiBiMin = (acc.nonSfiBiMin || 0) + mTotals.nonSfiBiMin;
      acc.nonSfiRecon = (acc.nonSfiRecon || 0) + mTotals.nonSfiRecon;
      
      return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0, sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0, nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0 });
  }, [filteredReportData, searchTerm, grandTotals, filterMinistry]);

  const filteredStatsReportData = useMemo(() => {
    let data = statsReportData || reportData;
    
    if (filterMinistry && filterMinistry !== 'সকল') {
      const normFilter = robustNormalize(filterMinistry);
      data = data.filter(m => robustNormalize(m.ministry) === normFilter);
    }

    if (!searchTerm.trim()) return data;
    
    return data.map(m => {
      const filteredRows = m.entityRows.filter((row: any) => 
        row.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.ministry.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...m, entityRows: filteredRows };
    }).filter(m => m.entityRows.length > 0);
  }, [statsReportData, reportData, searchTerm, filterMinistry]);

  const filteredStatsGrandTotals = useMemo(() => {
    if (!searchTerm.trim() && (!filterMinistry || filterMinistry === 'সকল')) {
      return statsGrandTotals || grandTotals;
    }
    
    return filteredStatsReportData.reduce((acc: any, m: any) => {
      const mTotals = m.entityRows.reduce((mAcc: any, row: any) => {
        mAcc.pUC += (row.prev.unsettledCount || 0); mAcc.pUA += (row.prev.unsettledAmount || 0);
        mAcc.cRC += (row.currentRaisedCount || 0); mAcc.cRA += (row.currentRaisedAmount || 0);
        mAcc.pSC += (row.prev.settledCount || 0); mAcc.pSA += (row.prev.settledAmount || 0);
        mAcc.cSC += (row.currentSettledCount || 0); mAcc.cSA += (row.currentSettledAmount || 0);
        mAcc.cSFIC += (row.currentSFICount || 0); mAcc.cNonSFIC += (row.currentNonSFICount || 0);
        mAcc.cSFIA += (row.currentSFIAmount || 0); mAcc.cNonSFIA += (row.currentNonSFIAmount || 0);
        
        mAcc.sfiBSR = (mAcc.sfiBSR || 0) + (row.sfiBreakdown?.bsr || 0);
        mAcc.sfiTriWork = (mAcc.sfiTriWork || 0) + (row.sfiBreakdown?.triWork || 0);
        mAcc.sfiTriMin = (mAcc.sfiTriMin || 0) + (row.sfiBreakdown?.triMin || 0);
        mAcc.sfiRecon = (mAcc.sfiRecon || 0) + (row.sfiBreakdown?.recon || 0);
        
        mAcc.nonSfiBSR = (mAcc.nonSfiBSR || 0) + (row.nonSfiBreakdown?.bsr || 0);
        mAcc.nonSfiBiWork = (mAcc.nonSfiBiWork || 0) + (row.nonSfiBreakdown?.biWork || 0);
        mAcc.nonSfiBiMin = (mAcc.nonSfiBiMin || 0) + (row.nonSfiBreakdown?.biMin || 0);
        mAcc.nonSfiRecon = (mAcc.nonSfiRecon || 0) + (row.nonSfiBreakdown?.recon || 0);
        
        return mAcc;
      }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0, sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0, nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0 });
      
      acc.pUC += mTotals.pUC; acc.pUA += mTotals.pUA;
      acc.cRC += mTotals.cRC; acc.cRA += mTotals.cRA;
      acc.pSC += mTotals.pSC; acc.pSA += mTotals.pSA;
      acc.cSC += mTotals.cSC; acc.cSA += mTotals.cSA;
      acc.cSFIC += mTotals.cSFIC; acc.cNonSFIC += mTotals.cNonSFIC;
      acc.cSFIA += mTotals.cSFIA; acc.cNonSFIA += mTotals.cNonSFIA;
      
      acc.sfiBSR = (acc.sfiBSR || 0) + mTotals.sfiBSR;
      acc.sfiTriWork = (acc.sfiTriWork || 0) + mTotals.sfiTriWork;
      acc.sfiTriMin = (acc.sfiTriMin || 0) + mTotals.sfiTriMin;
      acc.sfiRecon = (acc.sfiRecon || 0) + mTotals.sfiRecon;
      
      acc.nonSfiBSR = (acc.nonSfiBSR || 0) + mTotals.nonSfiBSR;
      acc.nonSfiBiWork = (acc.nonSfiBiWork || 0) + mTotals.nonSfiBiWork;
      acc.nonSfiBiMin = (acc.nonSfiBiMin || 0) + mTotals.nonSfiBiMin;
      acc.nonSfiRecon = (acc.nonSfiRecon || 0) + mTotals.nonSfiRecon;
      
      return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0, sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0, nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0 });
  }, [filteredStatsReportData, searchTerm, statsGrandTotals, grandTotals, filterMinistry]);

  const reportThStyle1 = "sticky top-0 xl:top-[45px] z-[240] px-0.5 py-2 font-black text-center text-slate-900 text-[8px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const reportThStyle2 = "sticky top-[42px] xl:top-[87px] z-[240] px-0.5 py-2 font-black text-center text-slate-900 text-[8px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] text-center font-bold leading-tight group-hover:bg-blue-100/80 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const subTotalTdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] text-center font-bold leading-tight text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-slate-900 text-[10px] bg-slate-200 z-[190] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_0_0_1px_#cbd5e1] h-[45px] align-middle whitespace-nowrap transition-all relative";
  const grandStyleTfoot = "px-0.5 py-2 text-center font-black !text-white !bg-black text-[10px] z-[190] shadow-[inset_0_1px_0_#1e293b,inset_0_0_0_1px_#1e293b] h-[45px] align-middle whitespace-nowrap transition-all relative";

  const isSfiNonSfiReport = selectedReportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' || selectedReportType === 'ষাণ্মাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' || selectedReportType === 'বাৎসরিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।';
  const isBsrBiReport = selectedReportType?.includes('বিএসআর') || selectedReportType?.includes('দ্বিপক্ষীয়');
  const showStatsButton = isSfiNonSfiReport || isBsrBiReport;

  const displayTitle = isSearchExpanded 
    ? selectedReportType?.replace('মাসিক রিটার্ন: ', 'রিটার্ন: ').replace('ষাণ্মাসিক রিটার্ণ: ', 'রিটার্ণ: ').replace('বাৎসরিক রিটার্ণ: ', 'রিটার্ণ: ')
    : selectedReportType;

  return (
    <div id="section-report-summary" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="section-report-summary" />

      {/* Header container for Title block, cycle badge and statistics in a single line on desktop/xl screens OUTSIDE card-report-table-container to guarantee stickiness */}
      <div className="bg-white flex flex-col xl:flex-row items-center justify-between gap-4 mb-8 pt-4 pb-6 border-b border-slate-200/80 w-full px-4 sm:px-6 transition-all duration-300">
          
          {/* Left: Title Header styled as split-block button */}
          <div className="flex items-stretch h-[38px] w-fit max-w-[95%] shadow-md select-none rounded-xl overflow-hidden border border-slate-200/50 shrink-0 transition-all duration-300">
            {/* Left Icon Area: Off-white bg & gray bottom border */}
            <div className="flex flex-col w-9 sm:w-10 shrink-0 h-full transition-all duration-300">
              <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                <Landmark className="text-red-700 w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="h-[2.5px] bg-[#94a3b8]" />
            </div>
            
            {/* Right Text Area: Solid Royal Blue / Deep Blue with dark blue bottom bar */}
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSearchExpanded ? 'min-w-[110px] sm:min-w-[120px]' : 'min-w-[160px] sm:min-w-[200px]'}`}>
              <div className="flex-1 bg-[#1e40af] flex items-center justify-center px-2.5 sm:px-3.5">
                <span className={`text-white font-[950] tracking-tight text-center transition-all duration-300 whitespace-nowrap ${isSearchExpanded ? 'text-[9.5px]' : 'text-[11px] sm:text-[11.5px] md:text-[12px]'}`}>
                  {displayTitle}
                </span>
              </div>
              <div className="h-[2.5px] bg-[#1e3a8a]" />
            </div>
          </div>

          {/* Right Group: Reporting cycle, month picker, and statistics button in a flex-wrap container */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center xl:justify-end shrink-0 z-[1010] xl:mr-2">
            
            {/* Cycle / Reporting Period badge */}
            <div className="flex items-center justify-center shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 bg-sky-50 text-sky-800 rounded-xl text-[11px] sm:text-[11.5px] font-bold border border-sky-100 shadow-md h-[38px] leading-none">
                <span className="text-sky-600">সাইকেল:</span> 
                <span className="text-sky-900 font-extrabold">{toBengaliDigits(activeCycle.label)}</span>
              </div>
            </div>

            {/* Month/Time Picker Dropdown */}
            {monthPickerElement && (
              <div className="shrink-0">
                {monthPickerElement}
              </div>
            )}

            {/* Statistics Dropdown */}
            {showStatsButton && (
              <div 
                className="relative z-[1050] no-print shrink-0"
                ref={statsRef}
              >
                <button
                  type="button"
                  onClick={() => setIsStatsOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-2.5 h-[38px] bg-sky-50 text-sky-800 rounded-xl font-bold text-[11px] sm:text-[11.5px] border border-sky-100 hover:border-sky-300 transition-all duration-300 hover:bg-white hover:shadow-md cursor-pointer shrink-0 leading-none animate-in fade-in"
                >
                  <Sparkles size={13} className="text-sky-600 animate-pulse shrink-0" />
                  <span>পরিসংখ্যান</span>
                  <ChevronDown size={13} className={`text-sky-500 transition-transform duration-300 shrink-0 ${isStatsOpen ? 'rotate-180' : ''}`} />
                </button>

              <div 
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className={`absolute top-full right-0 mt-2 w-[320px] sm:w-[450px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[9999] transition-all duration-300 pointer-events-auto text-left max-h-[80vh] overflow-y-auto overscroll-contain scrollbar-thin ${
                  isStatsOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}
              >
                <div className="space-y-6">
                  {/* Overall Header */}
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <BarChart3 size={24} className="text-blue-600" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-blue-900 font-black text-[18px]">সর্বমোট নিষ্পত্তি: {toBengaliDigits(filteredStatsGrandTotals.cSFIC + filteredStatsGrandTotals.cNonSFIC || filteredStatsGrandTotals.cSC)} টি</span>
                      <span className="text-emerald-600 font-black text-[14px]">মোট নিষ্পত্তিকৃত টাকা: {toBengaliDigits(Math.round(filteredStatsGrandTotals.cSA))} টাকা</span>
                    </div>
                  </div>

                  {/* Ministry List */}
                  <div className="space-y-4">
                    {filteredStatsReportData.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 font-bold text-xs">কোনো তথ্য পাওয়া যায়নি</div>
                    ) : (
                      filteredStatsReportData.map((m: any) => {
                        const mSfiC = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentSFICount || 0), 0);
                        const mNonSfiC = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentNonSFICount || 0), 0);
                        const mSfiA = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentSFIAmount || 0), 0);
                        const mNonSfiA = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentNonSFIAmount || 0), 0);
                        const mTotalC = mSfiC + mNonSfiC || m.entityRows.reduce((sum: number, r: any) => sum + (r.currentSettledCount || 0), 0);
                        const mTotalA = mSfiA + mNonSfiA || m.entityRows.reduce((sum: number, r: any) => sum + (r.currentSettledAmount || 0), 0);

                        if (mTotalC === 0) return null;

                        return (
                          <div key={m.ministry} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300 text-left">
                            <div className="flex items-center gap-3 mb-3">
                              <Building2 size={18} className="text-slate-400" />
                              <span className="text-slate-900 font-black text-[14px]">{m.ministry}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1 text-left">
                                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">মোট নিষ্পত্তি: <span className="text-blue-700">{toBengaliDigits(mTotalC)} টি</span></div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">মোট টাকা: <span className="text-emerald-600">{toBengaliDigits(Math.round(mTotalA))}</span></div>
                              </div>
                              <div className="space-y-1 border-l border-slate-200 pl-4 text-left">
                                <div className="text-[10px] font-bold text-slate-500">এসএফআই: <span className="text-slate-900">{toBengaliDigits(mSfiC)} টি ({toBengaliDigits(Math.round(mSfiA))})</span></div>
                                <div className="text-[10px] font-bold text-slate-500">নন এসএফআই: <span className="text-slate-900">{toBengaliDigits(mNonSfiC)} টি ({toBengaliDigits(Math.round(mNonSfiA))})</span></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Summary Breakdowns */}
                  {isBsrBiReport ? (
                    <div className="pt-4 border-t border-slate-100 space-y-4 text-left">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-left">
                          <div className="text-[12px] font-black text-blue-700 mb-1">নতুন প্রাপ্তি / উত্থাপিত (চলতি):</div>
                          <div className="text-[14px] font-black text-slate-900">{toBengaliDigits(filteredStatsGrandTotals.cRC)} টি</div>
                          <div className="text-[11px] font-bold text-slate-500">{toBengaliDigits(Math.round(filteredStatsGrandTotals.cRA))} টাকা</div>
                        </div>
                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 text-left">
                          <div className="text-[12px] font-black text-emerald-700 mb-1">নিষ্পত্তি / মীমাংসিত (চলতি):</div>
                          <div className="text-[14px] font-black text-slate-900">{toBengaliDigits(filteredStatsGrandTotals.cSC)} টি</div>
                          <div className="text-[11px] font-bold text-slate-500">{toBengaliDigits(Math.round(filteredStatsGrandTotals.cSA))} টাকা</div>
                        </div>
                      </div>
                      <div className="bg-amber-50/30 rounded-2xl p-4 border border-amber-100/40 text-left">
                        <div className="text-[12px] font-black text-amber-700 mb-1">অবशिष्ट অমীমাংসিত:</div>
                        <div className="text-[14px] font-black text-slate-900">
                          {toBengaliDigits((filteredStatsGrandTotals.pUC + filteredStatsGrandTotals.cRC) - (filteredStatsGrandTotals.pSC + filteredStatsGrandTotals.cSC))} টি
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          {toBengaliDigits(Math.round((filteredStatsGrandTotals.pUA + filteredStatsGrandTotals.cRA) - (filteredStatsGrandTotals.pSA + filteredStatsGrandTotals.cSA)))} টাকা
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-100 space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-black text-[14px]">এসএফআই (মোট):</span>
                          <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(filteredStatsGrandTotals.cSFIC)} টি</span>
                        </div>
                        <div className="text-slate-500 font-bold text-[11px] leading-relaxed bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                          বিএসআর: {toBengaliDigits(filteredStatsGrandTotals.sfiBSR)} টি, ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(filteredStatsGrandTotals.sfiTriMin)} টি
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-black text-[14px]">নন এসএফআই (মোট):</span>
                          <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(filteredStatsGrandTotals.cNonSFIC)} টি</span>
                        </div>
                        <div className="text-slate-500 font-bold text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          বিএসআর: {toBengaliDigits(filteredStatsGrandTotals.nonSfiBSR)} টি, দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(filteredStatsGrandTotals.nonSfiBiMin)} টি
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            {onDownloadExcel && (
              <button
                type="button"
                onClick={onDownloadExcel}
                className="flex items-center justify-center w-10 h-[38px] bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
                title="এক্সেল ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet size={16} className="stroke-[2.5]" />
              </button>
            )}

            {selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর' && onToggleDetailedView && (
              <button
                type="button"
                onClick={onToggleDetailedView}
                className="flex items-center gap-1.5 px-3 h-[38px] bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-100 hover:border-blue-300 transition-all duration-300 rounded-xl cursor-pointer shrink-0 shadow-sm font-black text-[11px]"
                title="বিস্তারিত অনুচ্ছেদ ছক দেখুন"
              >
                <ListChecks size={13} className="stroke-[2.5]" />
                <span>বিস্তারিত ছক দেখুন</span>
              </button>
            )}

            {/* Search and Ministry elements directly in the same row on the extreme right! */}
            {historicalFilterElement}
          </div>
        </div>

        <div id="card-report-table-container" className="bg-white w-full p-1 relative animate-table-entrance overflow-x-auto xl:overflow-visible">
          <div className="table-container qr-table-container border border-slate-300 overflow-auto xl:overflow-visible relative z-[10] rounded-lg">
          <table id="table-return-summary" className="w-full border-separate table-fixed border-spacing-0 !table-auto">
            <colgroup>
              <col className="w-[50px]" />
              <col className="w-[110px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
              <col className="w-[30px]" />
              <col className="w-[55px]" />
            </colgroup>
            <thead className="z-[240] bg-slate-200">
              <tr className="h-[42px]">
                <th rowSpan={2} className={`${reportThStyle1}`}>মন্ত্রণালয়</th>
                <th rowSpan={2} className={`${reportThStyle1}`}>সংস্থা</th>
                <th colSpan={2} className={`${reportThStyle1}`}>প্রারম্ভিক অমীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle1}`}>বর্তমান উত্থাপিত</th>
                <th colSpan={2} className={`${reportThStyle1}`}>মোট অমীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle1}`}>প্রারম্ভিক মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle1}`}>চলতি মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle1}`}>মোট মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle1}`}>সর্বমোট অমীমাংসিত</th>
              </tr>
              <tr className="h-[38px]">
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
                <th className={`${reportThStyle2}`}>সংখ্যা</th><th className={`${reportThStyle2}`}>টাকা</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData.map(m => {
                const mTotals = m.entityRows.reduce((acc: any, row: any) => {
                  acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
                  acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
                  acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
                  return acc;
                }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 });
                
                return (
                  <React.Fragment key={m.ministry}>
                    {m.entityRows.map((row: any, rIdx: number) => {
                      const totalUC = (row.prev.unsettledCount || 0) + (row.currentRaisedCount || 0); 
                      const totalUA = (row.prev.unsettledAmount || 0) + (row.currentRaisedAmount || 0);
                      const totalSC = (row.prev.settledCount || 0) + (row.currentSettledCount || 0); 
                      const totalSA = (row.prev.settledAmount || 0) + (row.currentSettledAmount || 0);
                      const closingUC = totalUC - totalSC;
                      const closingUA = totalUA - totalSA;

                      return (
                        <tr key={row.entity} className="group hover:bg-blue-100/40 bg-white transition-colors">
                          {rIdx === 0 && (
                            <td rowSpan={m.entityRows.length + 1} className={tdStyle + " bg-slate-50 border-l border-r border-slate-300 font-black align-middle"}>
                              <div className="flex items-center justify-center h-full py-4">
                                <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[11px] tracking-widest">
                                  <HighlightText text={m.ministry} searchTerm={searchTerm} />
                                </div>
                              </div>
                            </td>
                          )}
                          <td className={tdStyle + " text-left border-r border-slate-300 font-bold"}>
                            <HighlightText text={row.entity} searchTerm={searchTerm} />
                          </td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.unsettledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.unsettledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentRaisedCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentRaisedAmount))}</td>
                          <td className={tdStyle + " bg-slate-200 font-bold"}>{toBengaliDigits(totalUC)}</td><td className={tdStyle + " text-center bg-slate-200 border-r border-slate-300 font-bold"}>{toBengaliDigits(Math.round(totalUA))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.settledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.settledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentSettledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentSettledAmount))}</td>
                          <td className={tdStyle + " bg-slate-200 font-bold"}>{toBengaliDigits(totalSC)}</td><td className={tdStyle + " text-center bg-slate-200 border-r border-slate-300 font-bold"}>{toBengaliDigits(Math.round(totalSA))}</td>
                          <td className={tdStyle + " bg-amber-50 text-blue-700 font-bold"}>{toBengaliDigits(closingUC)}</td><td className={tdStyle + " text-center bg-amber-50 text-blue-700 font-bold"}>{toBengaliDigits(Math.round(closingUA))}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-sky-100 font-black text-blue-950 h-[42px] border-y-2 border-slate-200 no-hover-row">
                      <td className={subTotalTdStyle + " text-right italic pr-3 border-l border-r border-slate-300 text-[10px] bg-sky-100 font-black"}>উপ-মোট: {m.ministry}</td>
                      <td className={subTotalTdStyle + " font-black bg-sky-100"}>{toBengaliDigits(mTotals.pUC)}</td><td className={subTotalTdStyle + " text-center border-r border-slate-300 font-black bg-sky-100"}>{toBengaliDigits(Math.round(mTotals.pUA))}</td>
                      <td className={subTotalTdStyle + " font-black bg-sky-100"}>{toBengaliDigits(mTotals.cRC)}</td><td className={subTotalTdStyle + " text-center border-r border-slate-300 font-black bg-sky-100"}>{toBengaliDigits(Math.round(mTotals.cRA))}</td>
                      <td className={subTotalTdStyle + " bg-sky-100 font-black"}>{toBengaliDigits(mTotals.pUC + mTotals.cRC)}</td><td className={subTotalTdStyle + " text-center bg-sky-100 border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.pUA + mTotals.cRA))}</td>
                      <td className={subTotalTdStyle + " font-black bg-sky-100"}>{toBengaliDigits(mTotals.pSC)}</td><td className={subTotalTdStyle + " text-center border-r border-slate-300 font-black bg-sky-100"}>{toBengaliDigits(Math.round(mTotals.pSA))}</td>
                      <td className={subTotalTdStyle + " font-black bg-sky-100"}>{toBengaliDigits(mTotals.cSC)}</td><td className={subTotalTdStyle + " text-center border-r border-slate-300 font-black bg-sky-100"}>{toBengaliDigits(Math.round(mTotals.cSA))}</td>
                      <td className={subTotalTdStyle + " bg-sky-100 font-black"}>{toBengaliDigits(mTotals.pSC + mTotals.cSC)}</td><td className={subTotalTdStyle + " text-center bg-sky-100 border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.pSA + mTotals.cSA))}</td>
                      <td className={subTotalTdStyle + " bg-sky-100 font-black"}>{toBengaliDigits((mTotals.pUC + mTotals.cRC) - (mTotals.pSC + mTotals.cSC))}</td><td className={subTotalTdStyle + " text-center bg-sky-100 font-black"}>{toBengaliDigits(Math.round((mTotals.pUA + mTotals.cRA) - (mTotals.pSA + mTotals.cSA)))}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="z-[230] shadow-2xl">
              <tr>
                <td colSpan={2} className={grandStyleTfoot + " uppercase tracking-widest text-[10px] border-l border-slate-400 font-black"}>সর্বমোট (ফিল্টারকৃত):</td>
                <td className={grandStyleTfoot}>{toBengaliDigits(filteredGrandTotals.pUC)}</td><td className={grandStyleTfoot + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.pUA))}</td>
                <td className={grandStyleTfoot}>{toBengaliDigits(filteredGrandTotals.cRC)}</td><td className={grandStyleTfoot + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cRA))}</td>
                <td className={grandStyleTfoot + " font-extrabold"}>{toBengaliDigits(filteredGrandTotals.pUC + filteredGrandTotals.cRC)}</td><td className={grandStyleTfoot + " text-center font-extrabold"}>{toBengaliDigits(Math.round(filteredGrandTotals.pUA + filteredGrandTotals.cRA))}</td>
                <td className={grandStyleTfoot}>{toBengaliDigits(filteredGrandTotals.pSC)}</td><td className={grandStyleTfoot + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.pSA))}</td>
                <td className={grandStyleTfoot}>{toBengaliDigits(filteredGrandTotals.cSC)}</td><td className={grandStyleTfoot + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cSA))}</td>
                <td className={grandStyleTfoot + " font-extrabold"}>{toBengaliDigits(filteredGrandTotals.pSC + filteredGrandTotals.cSC)}</td><td className={grandStyleTfoot + " text-center font-extrabold"}>{toBengaliDigits(Math.round(filteredGrandTotals.pSA + filteredGrandTotals.cSA))}</td>
                <td className={grandStyleTfoot + " font-black"}>{toBengaliDigits((filteredGrandTotals.pUC + filteredGrandTotals.cRC) - (filteredGrandTotals.pSC + filteredGrandTotals.cSC))}</td><td className={grandStyleTfoot + " text-center font-black"}>{toBengaliDigits(Math.round((filteredGrandTotals.pUA + filteredGrandTotals.cRA) - (filteredGrandTotals.pSA + filteredGrandTotals.cSA)))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReturnSummaryTable;