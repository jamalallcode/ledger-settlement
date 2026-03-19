
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Printer, Database, CheckCircle2, Search, X, ChevronDown, Check, LayoutGrid, MapPin, PieChart, BarChart3, Building2, Landmark, ListChecks } from 'lucide-react';
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
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
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
    if (!searchTerm.trim()) return grandTotals;
    
    return filteredReportData.reduce((acc: any, m: any) => {
      const mTotals = m.entityRows.reduce((mAcc: any, row: any) => {
        mAcc.pUC += (row.prev.unsettledCount || 0); mAcc.pUA += (row.prev.unsettledAmount || 0);
        mAcc.cRC += (row.currentRaisedCount || 0); mAcc.cRA += (row.currentRaisedAmount || 0);
        mAcc.pSC += (row.prev.settledCount || 0); mAcc.pSA += (row.prev.settledAmount || 0);
        mAcc.cSC += (row.currentSettledCount || 0); mAcc.cSA += (row.currentSettledAmount || 0);
        mAcc.cSFIC += (row.currentSFICount || 0); mAcc.cNonSFIC += (row.currentNonSFICount || 0);
        return mAcc;
      }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cSFIC: 0, cNonSFIC: 0 });
      
      acc.pUC += mTotals.pUC; acc.pUA += mTotals.pUA;
      acc.cRC += mTotals.cRC; acc.cRA += mTotals.cRA;
      acc.pSC += mTotals.pSC; acc.pSA += mTotals.pSA;
      acc.cSC += mTotals.cSC; acc.cSA += mTotals.cSA;
      acc.cSFIC += mTotals.cSFIC; acc.cNonSFIC += mTotals.cNonSFIC;
      return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cSFIC: 0, cNonSFIC: 0 });
  }, [filteredReportData, searchTerm, grandTotals]);

  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8.5px] md:text-[9.5px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] md:text-[10px] text-center font-bold leading-tight group-hover:bg-blue-50/90 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-slate-900 text-[9.5px] bg-slate-100 z-[190] shadow-[inset_0_1px_0_#cbd5e1,inset_0_0_0_1px_#cbd5e1] h-[45px] align-middle whitespace-nowrap transition-all relative";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]' : 'border-slate-200 shadow-sm hover:border-slate-300'}`;

  return (
    <div id="section-report-summary" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="section-report-summary" />
      {showFilters && (
        <div id="summary-header-controls" className="flex flex-col md:flex-row items-center justify-end gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print relative">
          <IDBadge id="summary-header-controls" />
          <div className="flex flex-wrap items-center gap-4">
            <HistoricalFilter />
            {selectedReportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত' && (
              <button
                onClick={() => setIsStatsModalOpen(true)}
                className="flex items-center gap-2 px-5 h-[48px] bg-emerald-600 text-white rounded-xl font-black text-[13.5px] shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all duration-300 no-print"
              >
                <PieChart size={18} />
                পরিসংখ্যান
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <BarChart3 className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">নিষ্পত্তি পরিসংখ্যান</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{toBengaliDigits(activeCycle.label)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsStatsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <ListChecks size={18} />
                    <span className="text-[10px] font-black uppercase tracking-wider">মোট নিষ্পত্তি</span>
                  </div>
                  <div className="text-4xl font-black text-blue-900">{toBengaliDigits(filteredGrandTotals.cSC)}</div>
                  <div className="text-[10px] font-bold text-blue-600/70">চলতি মাসে সম্পন্ন</div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Landmark size={18} />
                    <span className="text-[10px] font-black uppercase tracking-wider">এসএফআই শাখা</span>
                  </div>
                  <div className="text-4xl font-black text-emerald-900">{toBengaliDigits(filteredGrandTotals.cSFIC)}</div>
                  <div className="text-[10px] font-bold text-emerald-600/70">নিষ্পত্তিকৃত অনুচ্ছেদ</div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Building2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-wider">নন-এসএফআই শাখা</span>
                  </div>
                  <div className="text-4xl font-black text-amber-900">{toBengaliDigits(filteredGrandTotals.cNonSFIC)}</div>
                  <div className="text-[10px] font-bold text-amber-600/70">নিষ্পত্তিকৃত অনুচ্ছেদ</div>
                </div>
              </div>

              {/* Ministry Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-blue-600" />
                    মন্ত্রণালয় ভিত্তিক সারসংক্ষেপ
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">নিষ্পত্তি সংখ্যা</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {filteredReportData.map(m => {
                    const mSettled = m.entityRows.reduce((sum: number, row: any) => sum + (row.currentSettledCount || 0), 0);
                    const percentage = filteredGrandTotals.cSC > 0 ? (mSettled / filteredGrandTotals.cSC) * 100 : 0;
                    
                    return (
                      <div key={m.ministry} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-black text-slate-700 group-hover:text-blue-700 transition-colors">{m.ministry}</span>
                          <span className="px-3 py-1 bg-white rounded-lg text-xs font-black text-slate-900 border border-slate-200 shadow-sm">
                            {toBengaliDigits(mSettled)} টি
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsStatsModalOpen(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                বন্ধ করুন
              </button>
            </div>
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
                    {m.entityRows.map((row: any, rIdx: number) => {
                      const totalUC = (row.prev.unsettledCount || 0) + (row.currentRaisedCount || 0); 
                      const totalUA = (row.prev.unsettledAmount || 0) + (row.currentRaisedAmount || 0);
                      const totalSC = (row.prev.settledCount || 0) + (row.currentSettledCount || 0); 
                      const totalSA = (row.prev.settledAmount || 0) + (row.currentSettledAmount || 0);
                      const closingUC = totalUC - totalSC;
                      const closingUA = totalUA - totalSA;

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
                          <td className={tdStyle}>{toBengaliDigits(row.prev.unsettledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.unsettledAmount))}</td>
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
                      <td className={tdStyle + " font-black"}>{toBengaliDigits(mTotals.pUC)}</td><td className={tdStyle + " text-center border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.pUA))}</td>
                      <td className={tdStyle + " font-black"}>{toBengaliDigits(mTotals.cRC)}</td><td className={tdStyle + " text-center border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.cRA))}</td>
                      <td className={tdStyle + " bg-slate-200/50 font-black"}>{toBengaliDigits(mTotals.pUC + mTotals.cRC)}</td><td className={tdStyle + " text-center bg-slate-200/50 border-r border-slate-300 font-black"}>{toBengaliDigits(Math.round(mTotals.pUA + mTotals.cRA))}</td>
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
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.pUC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.pUA))}</td>
                <td className={grandStyle}>{toBengaliDigits(filteredGrandTotals.cRC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(filteredGrandTotals.cRA))}</td>
                <td className={grandStyle + " !bg-slate-200/80 font-black"}>{toBengaliDigits(filteredGrandTotals.pUC + filteredGrandTotals.cRC)}</td><td className={grandStyle + " text-center !bg-slate-200/80 font-black"}>{toBengaliDigits(Math.round(filteredGrandTotals.pUA + filteredGrandTotals.cRA))}</td>
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
