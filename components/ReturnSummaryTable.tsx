
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Printer, Database, CheckCircle2, Search, X, ChevronDown, Check, LayoutGrid, MapPin, PieChart, BarChart3, Building2, Landmark, ListChecks, Sparkles } from 'lucide-react';
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
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
  showFilters: boolean;
  searchTerm: string;
  filterMinistry: string;
}

const ReturnSummaryTable: React.FC<ReturnSummaryTableProps> = ({
  reportData,
  grandTotals,
  activeCycle,
  selectedReportType,
  setSelectedReportType,
  isAdmin,
  HistoricalFilter,
  IDBadge,
  showFilters,
  searchTerm,
  filterMinistry
}) => {
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showSettlementData, setShowSettlementData] = useState(false);
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

  const ministryOptions = useMemo(() => {
    const unique = Array.from(new Set(reportData.map(m => m.ministry)));
    return ['সকল', ...unique];
  }, [reportData]);

  const filteredReportData = useMemo(() => {
    let data = reportData;
    
    if (filterMinistry && filterMinistry !== 'সকল') {
      data = data.filter(m => m.ministry === filterMinistry);
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
        mAcc.cSFIC += (row.currentSFICount || 0); mAcc.cNonSFIC += (row.currentNonSFICount || 0);
        mAcc.cSFIA += (row.currentSFIAmount || 0); mAcc.cNonSFIA += (row.currentNonSFIAmount || 0);
        mAcc.cSC += (row.currentSFICount || 0) + (row.currentNonSFICount || 0);
        mAcc.cSA += (row.currentSFIAmount || 0) + (row.currentNonSFIAmount || 0);
        
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

  const ministryStats = useMemo(() => {
    return filteredReportData.map(m => {
      const stats = m.entityRows.reduce((acc: any, row: any) => {
        acc.count += (row.currentSFICount || 0) + (row.currentNonSFICount || 0);
        acc.amount += (row.currentSFIAmount || 0) + (row.currentNonSFIAmount || 0);
        acc.sfiCount += (row.currentSFICount || 0);
        acc.nonSfiCount += (row.currentNonSFICount || 0);
        acc.sfiAmount += (row.currentSFIAmount || 0);
        acc.nonSfiAmount += (row.currentNonSFIAmount || 0);
        return acc;
      }, { count: 0, amount: 0, sfiCount: 0, nonSfiCount: 0, sfiAmount: 0, nonSfiAmount: 0 });
      return { ministry: m.ministry, ...stats };
    }).filter(m => m.count > 0);
  }, [filteredReportData]);

  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8.5px] md:text-[9.5px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] md:text-[10px] text-center font-bold leading-tight group-hover:bg-blue-50/90 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-slate-900 text-[9.5px] bg-slate-100 z-[190] shadow-[inset_0_1px_0_#cbd5e1,inset_0_0_0_1px_#cbd5e1] h-[45px] align-middle whitespace-nowrap transition-all relative";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]' : 'border-slate-200 shadow-sm hover:border-slate-300'}`;

  return (
    <div id="section-report-summary" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="section-report-summary" />
      {showFilters && (
        <div id="summary-header-controls" className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print relative">
          <IDBadge id="summary-header-controls" />
          
          <div className="flex items-center">
            {selectedReportType === 'মাসিক রিটারন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' && (
              <div 
                className="relative"
                ref={statsRef}
              >
                <button
                  onClick={() => setIsStatsOpen(!isStatsOpen)}
                  className={`flex items-center gap-2 px-4 h-[40px] bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] border border-slate-200 transition-all duration-300 no-print ${isStatsOpen ? 'bg-white shadow-md border-blue-200 ring-2 ring-blue-50' : ''}`}
                >
                  <Sparkles size={16} className="text-blue-500" />
                  পরিসংখ্যান
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isStatsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatsOpen && (
                  <div className="absolute top-full left-0 w-[350px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} className="text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-blue-900 font-black text-[16px]">সর্বমোট নিষ্পত্তি: {toBengaliDigits(filteredGrandTotals.cSFIC + filteredGrandTotals.cNonSFIC)} টি</span>
                            <span className="text-emerald-600 font-bold text-[13px]">মোট নিষ্পত্তিকৃত টাকা: {toBengaliDigits(Math.round(filteredGrandTotals.cSA))} টাকা</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                        {ministryStats.length > 0 ? (
                          ministryStats.map((ms, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Building2 size={14} className="text-slate-500" />
                                <span className="text-slate-900 font-black text-[13.5px]">{ms.ministry}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1 pb-2 border-b border-slate-100">
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                                    <span>মোট নিষ্পত্তি:</span>
                                    <span className="text-blue-700 font-black">{toBengaliDigits(ms.count)} টি</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                                    <span>মোট টাকা:</span>
                                    <span className="text-emerald-600 font-black">{toBengaliDigits(Math.round(ms.amount))}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                    <span>এসএফআই:</span>
                                    <span className="text-slate-700 font-black">{toBengaliDigits(ms.sfiCount)} টি ({toBengaliDigits(Math.round(ms.sfiAmount))})</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                    <span>নন এসএফআই:</span>
                                    <span className="text-slate-700 font-black">{toBengaliDigits(ms.nonSfiCount)} টি ({toBengaliDigits(Math.round(ms.nonSfiAmount))})</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-400 font-bold text-[13px]">কোন নিষ্পত্তির তথ্য পাওয়া যায়নি</div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black text-[13px]">এসএফআই (মোট):</span>
                            <span className="text-slate-900 font-black text-[13px]">{toBengaliDigits(filteredGrandTotals.cSFIC)} টি</span>
                          </div>
                          <div className="text-slate-500 font-bold text-[10px] leading-relaxed">
                            (বিএসআর: {toBengaliDigits(filteredGrandTotals.sfiBSR)}, ত্রিপক্ষীয় (প): {toBengaliDigits(filteredGrandTotals.sfiTriWork)}, ত্রিপক্ষীয় (বি): {toBengaliDigits(filteredGrandTotals.sfiTriMin)}, মিলিকরণ: {toBengaliDigits(filteredGrandTotals.sfiRecon)})
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black text-[13px]">নন এসএফআই (মোট):</span>
                            <span className="text-slate-900 font-black text-[13px]">{toBengaliDigits(filteredGrandTotals.cNonSFIC)} টি</span>
                          </div>
                          <div className="text-slate-500 font-bold text-[10px] leading-relaxed">
                            (বিএসআর: {toBengaliDigits(filteredGrandTotals.nonSfiBSR)}, দ্বিপক্ষীয় (প): {toBengaliDigits(filteredGrandTotals.nonSfiBiWork)}, দ্বিপক্ষীয় (বি): {toBengaliDigits(filteredGrandTotals.nonSfiBiMin)}, মিলিকরণ: {toBengaliDigits(filteredGrandTotals.nonSfiRecon)})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <HistoricalFilter />
          </div>
        </div>
      )}

      {/* Collapsible Settlement Data Section - Premium Design */}
      <div className="no-print w-full px-4 mb-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowSettlementData(!showSettlementData)}
            className={`w-full group relative flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 border overflow-hidden ${
              showSettlementData 
                ? 'bg-slate-900 border-slate-800 shadow-2xl' 
                : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200'
            }`}
          >
            {/* Background Glows */}
            {showSettlementData && (
              <>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"></div>
              </>
            )}

            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                showSettlementData ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 rotate-12' : 'bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-100'
              }`}>
                <Database size={28} />
              </div>
              <div className="text-left">
                <h3 className={`text-[20px] font-black tracking-tight transition-colors duration-500 ${
                  showSettlementData ? 'text-white' : 'text-slate-800 group-hover:text-blue-700'
                }`}>
                  মীমাংসা রেজিস্টার থেকে পাওয়া ডাটা
                </h3>
                <p className={`text-[12px] font-bold transition-colors duration-500 ${
                  showSettlementData ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {showSettlementData ? 'বিস্তারিত তথ্য বন্ধ করতে ক্লিক করুন' : 'বিস্তারিত সারসংক্ষেপ এবং পরিসংখ্যান দেখতে এখানে ক্লিক করুন'}
                </p>
              </div>
            </div>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${
              showSettlementData 
                ? 'bg-white/10 text-white rotate-180 backdrop-blur-md border border-white/10' 
                : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
            }`}>
              <ChevronDown size={24} />
            </div>
          </button>

          {showSettlementData && (
            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SFI Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group hover:border-blue-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <CheckCircle2 className="text-white" size={24} />
                      </div>
                      <div>
                        <h4 className="text-[18px] font-black text-slate-900">এসএফআই (SFI)</h4>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">নিষ্পত্তি সংক্রান্ত তথ্য</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[13px] font-black text-slate-600">মোট নিষ্পত্তি:</span>
                        <div className="text-right">
                          <div className="text-[20px] font-black text-blue-700">{toBengaliDigits(filteredGrandTotals.cSFIC)} টি</div>
                          <div className="text-[11px] font-bold text-emerald-600">{toBengaliDigits(Math.round(filteredGrandTotals.cSFIA))} টাকা</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">বিএসআর</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.sfiBSR)} টি</div>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">ত্রিপক্ষীয় (প)</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.sfiTriWork)} টি</div>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">ত্রিপক্ষীয় (বি)</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.sfiTriMin)} টি</div>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">মিলিকরণ</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.sfiRecon)} টি</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Non-SFI Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group hover:border-emerald-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <ListChecks className="text-white" size={24} />
                      </div>
                      <div>
                        <h4 className="text-[18px] font-black text-slate-900">নন এসএফআই (Non-SFI)</h4>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">নিষ্পত্তি সংক্রান্ত তথ্য</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[13px] font-black text-slate-600">মোট নিষ্পত্তি:</span>
                        <div className="text-right">
                          <div className="text-[20px] font-black text-emerald-700">{toBengaliDigits(filteredGrandTotals.cNonSFIC)} টি</div>
                          <div className="text-[11px] font-bold text-emerald-600">{toBengaliDigits(Math.round(filteredGrandTotals.cNonSFIA))} টাকা</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">বিএসআর</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.nonSfiBSR)} টি</div>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">দ্বিপক্ষীয় (প)</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.nonSfiBiWork)} টি</div>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">দ্বিপক্ষীয় (বি)</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.nonSfiBiMin)} টি</div>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">মিলিকরণ</div>
                          <div className="text-[15px] font-black text-slate-800">{toBengaliDigits(filteredGrandTotals.nonSfiRecon)} টি</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grand Total Summary Bar */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-inner">
                      <PieChart className="text-blue-400" size={32} />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-[22px] tracking-tight">সর্বমোট নিষ্পত্তির সারসংক্ষেপ</h4>
                      <p className="text-slate-400 text-[13px] font-bold">সকল মন্ত্রণালয় ও সংস্থার সম্মিলিত তথ্য</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12">
                    <div className="text-center">
                      <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">মোট সংখ্যা</div>
                      <div className="text-white text-[32px] font-black leading-none">{toBengaliDigits(filteredGrandTotals.cSC)} <span className="text-[16px] text-blue-400 ml-1">টি</span></div>
                    </div>
                    <div className="w-px h-12 bg-slate-700"></div>
                    <div className="text-center">
                      <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">মোট টাকা</div>
                      <div className="text-emerald-400 text-[32px] font-black leading-none">{toBengaliDigits(Math.round(filteredGrandTotals.cSA))} <span className="text-[16px] text-emerald-500/60 ml-1">টাকা</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="card-report-table-container" className="bg-white border border-slate-300 shadow-2xl w-full overflow-x-auto p-1 relative animate-table-entrance">
        <div className="text-center mb-8 pt-4">
          <div className="inline-block relative">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {selectedReportType}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
            </div>
          </div>
        </div>


          {/* Ministry-wise Summary Table */}
          <div className="mb-8 px-4">
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm max-w-2xl mx-auto">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-[12px] font-black text-slate-700">মন্ত্রণালয় ভিত্তিক সারসংক্ষেপ</h3>
                <span className="text-[10px] text-slate-500 font-bold">নিষ্পত্তি (পূর্ণাঙ্গ)</span>
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="border-b border-r border-slate-200 p-2 text-left font-black text-slate-600">মন্ত্রণালয়/বিভাগ</th>
                    <th className="border-b border-r border-slate-200 p-2 text-center font-black text-slate-600">সংখ্যা (টি)</th>
                    <th className="border-b border-slate-200 p-2 text-right font-black text-slate-600">টাকার পরিমাণ (টাকা)</th>
                  </tr>
                </thead>
                <tbody>
                  {ministryStats
                    .sort((a, b) => b.count - a.count)
                    .map((m) => (
                      <tr key={m.ministry} className="hover:bg-white transition-colors">
                        <td className="border-b border-r border-slate-100 p-2 font-bold text-slate-700">
                          {m.ministry}
                        </td>
                        <td className="border-b border-r border-slate-100 p-2 text-center font-black text-blue-700">
                          {toBengaliDigits(m.count)}
                        </td>
                        <td className="border-b border-slate-100 p-2 text-right font-black text-slate-900">
                          {toBengaliDigits(m.amount)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-slate-100/80 font-black">
                    <td className="p-2 text-center text-slate-700">সর্বমোট</td>
                    <td className="p-2 text-center text-blue-800 border-r border-slate-200">
                      {toBengaliDigits(filteredGrandTotals.cSC)}
                    </td>
                    <td className="p-2 text-right text-slate-900">
                      {toBengaliDigits(filteredGrandTotals.cSA)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="table-container qr-table-container border border-slate-300 overflow-auto relative rounded-lg">
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
                <th rowSpan={2} className={`${reportThStyle}`}>মন্ত্রণালয়</th>
                <th rowSpan={2} className={`${reportThStyle}`}>সংস্থা</th>
                <th colSpan={2} className={`${reportThStyle}`}>প্রারম্ভিক অমীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>বর্তমান উত্থাপিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>মোট অমীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>প্রারম্ভিক মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>চলতি মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>মোট মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>সর্বমোট অমীমাংসিত</th>
              </tr>
              <tr className="h-[38px]">
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData.map(m => {
                const mTotals = m.entityRows.reduce((acc: any, row: any) => {
                  acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
                  acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); 
                  acc.cSC += (row.currentSFICount || 0) + (row.currentNonSFICount || 0); 
                  acc.cSA += (row.currentSFIAmount || 0) + (row.currentNonSFIAmount || 0);
                  acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
                  return acc;
                }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 });
                
                return (
                  <React.Fragment key={m.ministry}>
                    {m.entityRows.map((row, rIdx) => {
                      const currentSC = (row.currentSFICount || 0) + (row.currentNonSFICount || 0);
                      const currentSA = (row.currentSFIAmount || 0) + (row.currentNonSFIAmount || 0);
                      const openingUC = Math.max(0, (row.prev.unsettledCount || 0) - (row.prev.settledCount || 0));
                      const openingUA = Math.max(0, (row.prev.unsettledAmount || 0) - (row.prev.settledAmount || 0));
                      const totalUC = openingUC + (row.currentRaisedCount || 0); 
                      const totalUA = openingUA + (row.currentRaisedAmount || 0);
                      const totalSC = (row.prev.settledCount || 0) + currentSC; 
                      const totalSA = (row.prev.settledAmount || 0) + currentSA;
                      const closingUC = totalUC - currentSC;
                      const closingUA = totalUA - currentSA;

                      return (
                        <tr key={row.entity} className="group hover:bg-blue-50/50 bg-white">
                          {rIdx === 0 && (
                            <td rowSpan={m.entityRows.length + 1} className={tdStyle + " bg-slate-50 border-l border-r border-slate-300 font-black"}>
                              <HighlightText text={m.ministry} searchTerm={searchTerm} />
                            </td>
                          )}
                          <td className={tdStyle + " text-left border-r border-slate-300 font-bold"}>
                            <HighlightText text={row.entity} searchTerm={searchTerm} />
                          </td>
                          <td className={tdStyle}>{toBengaliDigits(openingUC)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(openingUA))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentRaisedCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentRaisedAmount))}</td>
                          <td className={tdStyle + " bg-slate-100/50 font-bold"}>{toBengaliDigits(totalUC)}</td><td className={tdStyle + " text-center bg-slate-100/50 border-r border-slate-300 font-bold"}>{toBengaliDigits(Math.round(totalUA))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.settledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.settledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(currentSC)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(currentSA))}</td>
                          <td className={tdStyle + " bg-emerald-50/50 font-bold"}>{toBengaliDigits(totalSC)}</td><td className={tdStyle + " text-center bg-emerald-50/50 border-r border-slate-300 font-bold"}>{toBengaliDigits(Math.round(totalSA))}</td>
                          <td className={tdStyle + " bg-amber-50 text-blue-700 font-bold"}>{toBengaliDigits(closingUC)}</td><td className={tdStyle + " text-center bg-amber-50 text-blue-700 font-bold"}>{toBengaliDigits(Math.round(closingUA))}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50/80 font-black text-blue-950 h-[42px] border-y-2 border-slate-200">
                      <td className={tdStyle + " text-right italic pr-3 border-l border-r border-slate-300 text-[10px] bg-blue-50/80 font-black"}>উপ-মোট: {m.ministry}</td>
                      <td className={tdStyle + " font-black"}>{toBengaliDigits(Math.max(0, mTotals.pUC - mTotals.pSC))}</td><td className={tdStyle + " text-center border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(Math.max(0, mTotals.pUA - mTotals.pSA)))}</td>
                      <td className={tdStyle + " font-black"}>{toBengaliDigits(mTotals.cRC)}</td><td className={tdStyle + " text-center border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.cRA))}</td>
                      <td className={tdStyle + " bg-slate-200/50 font-black"}>{toBengaliDigits(Math.max(0, mTotals.pUC - mTotals.pSC) + mTotals.cRC)}</td><td className={tdStyle + " text-center bg-slate-200/50 border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(Math.max(0, mTotals.pUA - mTotals.pSA) + mTotals.cRA))}</td>
                      <td className={tdStyle + " font-black"}>{toBengaliDigits(mTotals.pSC)}</td><td className={tdStyle + " text-center border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.pSA))}</td>
                      <td className={tdStyle + " font-black"}>{toBengaliDigits(mTotals.cSC)}</td><td className={tdStyle + " text-center border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.cSA))}</td>
                      <td className={tdStyle + " bg-emerald-200/50 font-black"}>{toBengaliDigits(mTotals.pSC + mTotals.cSC)}</td><td className={tdStyle + " text-center bg-emerald-200/50 border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.pSA + mTotals.cSA))}</td>
                      <td className={tdStyle + " bg-amber-100/30 font-black"}>{toBengaliDigits((mTotals.pUC + mTotals.cRC) - (mTotals.pSC + mTotals.cSC))}</td><td className={tdStyle + " text-center bg-amber-100/30 font-black"}>{toBengaliDigits(Math.round((mTotals.pUA + mTotals.cRA) - (mTotals.pSA + mTotals.cSA)))}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="z-[230] shadow-2xl">
              <tr>
                <td colSpan={2} className={grandStyle + " !bg-slate-200 text-slate-900 uppercase tracking-widest text-[10px] shadow-[inset_0_1px_0_#cbd5e1] border-l border-slate-400 font-black"}>সর্বমোট (ফিল্টারকৃত):</td>
                <td className={grandStyle}>{toBengaliDigits(Math.max(0, filteredGrandTotals.pUC - filteredGrandTotals.pSC))}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(Math.max(0, filteredGrandTotals.pUA - filteredGrandTotals.pSA)))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.cRC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cRA))}</td>
                <td className={grandStyle + " !bg-slate-200/80 font-black"}>{toBengaliDigits(Math.max(0, filteredGrandTotals.pUC - filteredGrandTotals.pSC) + filteredGrandTotals.cRC)}</td><td className={grandStyle + " text-center !bg-slate-200/80 font-black"}>{toBengaliDigits(Math.round(Math.max(0, filteredGrandTotals.pUA - filteredGrandTotals.pSA) + filteredGrandTotals.cRA))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.pSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.pSA))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.cSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-emerald-100/80 font-black"}>{toBengaliDigits(filteredGrandTotals.pSC + filteredGrandTotals.cSC)}</td><td className={grandStyle + " text-center !bg-emerald-100/80 font-black"}>{toBengaliDigits(Math.round(filteredGrandTotals.pSA + filteredGrandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-orange-100 text-slate-900 font-black"}>{toBengaliDigits((filteredGrandTotals.pUC + filteredGrandTotals.cRC) - (filteredGrandTotals.pSC + filteredGrandTotals.cSC))}</td><td className={grandStyle + " text-center !bg-orange-100 text-slate-900 font-black"}>{toBengaliDigits(Math.round((filteredGrandTotals.pUA + filteredGrandTotals.cRA) - (filteredGrandTotals.pSA + filteredGrandTotals.cSA)))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  export default ReturnSummaryTable;
