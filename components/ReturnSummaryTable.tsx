
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
  const [isStatsHovered, setIsStatsHovered] = useState(false);
  const ministryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ministryDropdownRef.current && !ministryDropdownRef.current.contains(e.target as Node)) {
        setIsMinistryDropdownOpen(false);
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
                onMouseEnter={() => setIsStatsHovered(true)}
                onMouseLeave={() => setIsStatsHovered(false)}
              >
                <button
                  className={`flex items-center gap-2 px-4 h-[40px] bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] border border-slate-200 transition-all duration-300 no-print ${isStatsHovered ? 'bg-white shadow-md border-blue-200' : ''}`}
                >
                  <Sparkles size={16} className="text-blue-500" />
                  পরিসংখ্যান
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isStatsHovered ? 'rotate-180' : ''}`} />
                </button>

                {isStatsHovered && (
                  <div className="absolute top-full left-0 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <BarChart3 size={16} className="text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-blue-700 font-black text-[15px]">মোট নিষ্পত্তি: {toBengaliDigits(filteredGrandTotals.cSFIC + filteredGrandTotals.cNonSFIC)} টি</span>
                            <span className="text-emerald-600 font-bold text-[12px]">মোট নিষ্পত্তিকৃত টাকা: {toBengaliDigits(Math.round(filteredGrandTotals.cSA))} টাকা</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black text-[14px]">এসএফআই:</span>
                            <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(filteredGrandTotals.cSFIC)} টি</span>
                            <span className="text-emerald-600 font-bold text-[12px] ml-1">({toBengaliDigits(Math.round(filteredGrandTotals.cSFIA))} টাকা)</span>
                          </div>
                          <div className="text-slate-600 font-bold text-[11px] leading-relaxed pl-4">
                            (বিএসআর: {toBengaliDigits(filteredGrandTotals.sfiBSR)} টি, ত্রিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(filteredGrandTotals.sfiTriWork)} টি, ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(filteredGrandTotals.sfiTriMin)} টি, মিলিকরণ: {toBengaliDigits(filteredGrandTotals.sfiRecon)} টি)
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black text-[14px]">নন এসএফআই:</span>
                            <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(filteredGrandTotals.cNonSFIC)} টি</span>
                            <span className="text-emerald-600 font-bold text-[12px] ml-1">({toBengaliDigits(Math.round(filteredGrandTotals.cNonSFIA))} টাকা)</span>
                          </div>
                          <div className="text-slate-600 font-bold text-[11px] leading-relaxed pl-4">
                            (বিএসআর: {toBengaliDigits(filteredGrandTotals.nonSfiBSR)} টি, দ্বিপক্ষীয় সভা (কার্যপত্র): {toBengaliDigits(filteredGrandTotals.nonSfiBiWork)} টি, দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(filteredGrandTotals.nonSfiBiMin)} টি, মিলিকরণ: {toBengaliDigits(filteredGrandTotals.nonSfiRecon)} টি)
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
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black border border-slate-700 shadow-md">
              <span className="text-blue-400">{selectedReportType}</span> | {toBengaliDigits(activeCycle.label)}
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
                  acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
                  acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
                  return acc;
                }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 });
                
                return (
                  <React.Fragment key={m.ministry}>
                    {m.entityRows.map((row, rIdx) => {
                      const openingUC = Math.max(0, (row.prev.unsettledCount || 0) - (row.prev.settledCount || 0));
                      const openingUA = Math.max(0, (row.prev.unsettledAmount || 0) - (row.prev.settledAmount || 0));
                      const totalUC = openingUC + (row.currentRaisedCount || 0); 
                      const totalUA = openingUA + (row.currentRaisedAmount || 0);
                      const totalSC = (row.prev.settledCount || 0) + (row.currentSettledCount || 0); 
                      const totalSA = (row.prev.settledAmount || 0) + (row.currentSettledAmount || 0);
                      const closingUC = totalUC - (row.currentSettledCount || 0);
                      const closingUA = totalUA - (row.currentSettledAmount || 0);

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
                          <td className={tdStyle}>{toBengaliDigits(row.currentSettledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentSettledAmount))}</td>
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
