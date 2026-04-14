
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

  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] text-center font-bold leading-tight group-hover:bg-blue-100/80 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const subTotalTdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] text-center font-bold leading-tight text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-white text-[10px] bg-black z-[190] shadow-[inset_0_1px_0_#1e293b,inset_0_0_0_1px_#1e293b] h-[45px] align-middle whitespace-nowrap transition-all relative";

  return (
    <div id="section-report-summary" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="section-report-summary" />
      {showFilters && (
        <div id="summary-header-controls" className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print relative">
          <IDBadge id="summary-header-controls" />
          
          <div className="flex items-center">
            {selectedReportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' && (
              <div 
                className="relative"
                ref={statsRef}
              >
                <button
                  onClick={() => setIsStatsOpen(!isStatsOpen)}
                  className={`flex items-center gap-2 px-4 h-[40px] bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] border border-slate-200 transition-all duration-300 no-print ${isStatsOpen ? 'bg-white shadow-md border-blue-200' : ''}`}
                >
                  <Sparkles size={16} className="text-blue-500" />
                  পরিসংখ্যান
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isStatsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatsOpen && (
                  <div className="absolute top-full left-0 w-[450px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-6">
                      {/* Overall Header */}
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <BarChart3 size={24} className="text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-900 font-black text-[18px]">সর্বমোট নিষ্পত্তি: {toBengaliDigits(filteredGrandTotals.cSFIC + filteredGrandTotals.cNonSFIC)} টি</span>
                          <span className="text-emerald-600 font-black text-[14px]">মোট নিষ্পত্তিকৃত টাকা: {toBengaliDigits(Math.round(filteredGrandTotals.cSA))} টাকা</span>
                        </div>
                      </div>

                      {/* Ministry List */}
                      <div className="space-y-4">
                        {filteredReportData.map((m: any) => {
                          const mSfiC = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentSFICount || 0), 0);
                          const mNonSfiC = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentNonSFICount || 0), 0);
                          const mSfiA = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentSFIAmount || 0), 0);
                          const mNonSfiA = m.entityRows.reduce((sum: number, r: any) => sum + (r.currentNonSFIAmount || 0), 0);
                          const mTotalC = mSfiC + mNonSfiC;
                          const mTotalA = mSfiA + mNonSfiA;

                          if (mTotalC === 0) return null;

                          return (
                            <div key={m.ministry} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                              <div className="flex items-center gap-3 mb-3">
                                <Building2 size={18} className="text-slate-400" />
                                <span className="text-slate-900 font-black text-[14px]">{m.ministry}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">মোট নিষ্পত্তি: <span className="text-blue-700">{toBengaliDigits(mTotalC)} টি</span></div>
                                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">মোট টাকা: <span className="text-emerald-600">{toBengaliDigits(Math.round(mTotalA))}</span></div>
                                </div>
                                <div className="space-y-1 border-l border-slate-200 pl-4">
                                  <div className="text-[10px] font-bold text-slate-500">এসএফআই: <span className="text-slate-900">{toBengaliDigits(mSfiC)} টি ({toBengaliDigits(Math.round(mSfiA))})</span></div>
                                  <div className="text-[10px] font-bold text-slate-500">নন এসএফআই: <span className="text-slate-900">{toBengaliDigits(mNonSfiC)} টি ({toBengaliDigits(Math.round(mNonSfiA))})</span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary Breakdowns */}
                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black text-[14px]">এসএফআই (মোট):</span>
                            <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(filteredGrandTotals.cSFIC)} টি</span>
                          </div>
                          <div className="text-slate-500 font-bold text-[11px] leading-relaxed bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                            বিএসআর: {toBengaliDigits(filteredGrandTotals.sfiBSR)} টি, ত্রিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(filteredGrandTotals.sfiTriMin)} টি
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black text-[14px]">নন এসএফআই (মোট):</span>
                            <span className="text-slate-900 font-black text-[14px]">{toBengaliDigits(filteredGrandTotals.cNonSFIC)} টি</span>
                          </div>
                          <div className="text-slate-500 font-bold text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            বিএসআর: {toBengaliDigits(filteredGrandTotals.nonSfiBSR)} টি, দ্বিপক্ষীয় সভা (কার্যবিবরণী): {toBengaliDigits(filteredGrandTotals.nonSfiBiMin)} টি
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
            {selectedReportType}
          </h1>
          <div className="mb-4 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-3 px-6 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black border border-slate-700 shadow-md">
              <span className="text-blue-400">{selectedReportType}</span> | {toBengaliDigits(activeCycle.label)}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
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
                <td colSpan={2} className={grandStyle + " !bg-black text-white uppercase tracking-widest text-[10px] shadow-[inset_0_1px_0_#cbd5e1] border-l border-slate-400 font-black"}>সর্বমোট (ফিল্টারকৃত):</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.pUC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.pUA))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.cRC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cRA))}</td>
                <td className={grandStyle + " !bg-black text-white font-black"}>{toBengaliDigits(filteredGrandTotals.pUC + filteredGrandTotals.cRC)}</td><td className={grandStyle + " text-center !bg-black text-white font-black"}>{toBengaliDigits(Math.round(filteredGrandTotals.pUA + filteredGrandTotals.cRA))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.pSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.pSA))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.cSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-black text-white font-black"}>{toBengaliDigits(filteredGrandTotals.pSC + filteredGrandTotals.cSC)}</td><td className={grandStyle + " text-center !bg-black text-white font-black"}>{toBengaliDigits(Math.round(filteredGrandTotals.pSA + filteredGrandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-black text-white font-black"}>{toBengaliDigits((filteredGrandTotals.pUC + filteredGrandTotals.cRC) - (filteredGrandTotals.pSC + filteredGrandTotals.cSC))}</td><td className={grandStyle + " text-center !bg-black text-white font-black"}>{toBengaliDigits(Math.round((filteredGrandTotals.pUA + filteredGrandTotals.cRA) - (filteredGrandTotals.pSA + filteredGrandTotals.cSA)))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReturnSummaryTable;