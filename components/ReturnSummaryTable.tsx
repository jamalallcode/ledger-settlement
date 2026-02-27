
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Printer, Database, CheckCircle2, Search, X, ChevronDown, Check, LayoutGrid, MapPin } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
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
}

const ReturnSummaryTable: React.FC<ReturnSummaryTableProps> = ({
  reportData,
  grandTotals,
  activeCycle,
  selectedReportType,
  setSelectedReportType,
  isAdmin,
  HistoricalFilter,
  IDBadge
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMinistry, setFilterMinistry] = useState('সকল');
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
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
    
    if (filterMinistry !== 'সকল') {
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
        return mAcc;
      }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0 });
      
      acc.pUC += mTotals.pUC; acc.pUA += mTotals.pUA;
      acc.cRC += mTotals.cRC; acc.cRA += mTotals.cRA;
      acc.pSC += mTotals.pSC; acc.pSA += mTotals.pSA;
      acc.cSC += mTotals.cSC; acc.cSA += mTotals.cSA;
      return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0 });
  }, [filteredReportData, searchTerm, grandTotals]);

  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8.5px] md:text-[9.5px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] md:text-[10px] text-center font-bold leading-tight bg-white group-hover:bg-blue-50/90 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-slate-900 text-[9.5px] bg-slate-100 z-[190] shadow-[inset_0_1px_0_#cbd5e1,inset_0_0_0_1px_#cbd5e1] h-[45px] align-middle whitespace-nowrap transition-all relative";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]' : 'border-slate-200 shadow-sm hover:border-slate-300'}`;

  return (
    <div id="section-report-summary" className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="section-report-summary" />
      <div id="summary-header-controls" className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print relative">
        <IDBadge id="summary-header-controls" />
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedReportType(null)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600 relative"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">রিপোর্ট টাইপ:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">{selectedReportType}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Ministry Filter */}
          <div className="space-y-1" ref={ministryDropdownRef}>
            <div 
              onClick={() => setIsMinistryDropdownOpen(!isMinistryDropdownOpen)} 
              className={customDropdownCls(isMinistryDropdownOpen) + " min-w-[180px]"}
            >
              <MapPin size={16} className="text-blue-600" />
              <span className="font-bold text-[12px] text-slate-900 truncate">
                {filterMinistry === 'সকল' ? 'সকল মন্ত্রণালয়' : filterMinistry}
              </span>
              <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isMinistryDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              
              {isMinistryDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="max-h-[250px] overflow-y-auto no-scrollbar py-2">
                    {ministryOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={(e) => { e.stopPropagation(); setFilterMinistry(opt); setIsMinistryDropdownOpen(false); }} 
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterMinistry === opt ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700 font-bold text-[12px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'সকল মন্ত্রণালয়' : opt}</span>
                        {filterMinistry === opt && <Check size={14} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative group min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="মন্ত্রণালয় বা সংস্থা দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
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
          <HistoricalFilter />
          <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
        </div>
      </div>

      <div id="card-report-table-container" className="bg-white border border-slate-300 shadow-2xl w-full overflow-x-auto p-1 relative animate-table-entrance">
        <div className="text-center py-3 bg-white border-b-2 border-slate-100">
          <h1 className="text-xl font-black uppercase text-slate-900">{OFFICE_HEADER.main}</h1>
          <h2 className="text-md font-black text-slate-800">{OFFICE_HEADER.sub}</h2>
          <div className="mt-2 inline-flex items-center gap-3 px-6 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black border border-slate-700 shadow-md">
            <span className="text-blue-400">{selectedReportType}</span> | {toBengaliDigits(activeCycle.label)}
          </div>
        </div>

        <div className="table-container border border-slate-300 overflow-auto relative rounded-lg">
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
                        <tr key={row.entity} className="group hover:bg-blue-50/50">
                          {rIdx === 0 && <td rowSpan={m.entityRows.length + 1} className={tdStyle + " bg-slate-50 border-l border-r border-slate-300 font-black"}>{m.ministry}</td>}
                          <td className={tdStyle + " text-left border-r border-slate-300 font-bold"}>{row.entity}</td>
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

    </div>
  );
};

export default ReturnSummaryTable;
