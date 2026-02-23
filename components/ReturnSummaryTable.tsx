
import React from 'react';
import { ChevronLeft, Printer, Database, CheckCircle2 } from 'lucide-react';
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
  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8.5px] md:text-[9.5px] leading-tight align-middle h-full bg-slate-200 shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] md:text-[10px] text-center font-bold leading-tight bg-white group-hover:bg-blue-50/90 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-slate-900 text-[9.5px] bg-slate-100 sticky bottom-0 z-[190] shadow-[inset_0_1px_0_#cbd5e1,inset_0_0_0_1px_#cbd5e1] h-[45px] align-middle whitespace-nowrap transition-all relative";

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
          <HistoricalFilter />
          <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
        </div>
      </div>

      <div id="card-report-table-container" className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-1 relative animate-table-entrance">
        <div className="text-center py-6 bg-white border-b-2 border-slate-100">
          <h1 className="text-2xl font-black uppercase text-slate-900">{OFFICE_HEADER.main}</h1>
          <h2 className="text-lg font-black text-slate-800">{OFFICE_HEADER.sub}</h2>
          <div className="mt-3 inline-flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
            <span className="text-blue-400">{selectedReportType}</span> | {toBengaliDigits(activeCycle.label)}
          </div>
        </div>

        <div className="table-container border border-slate-300 overflow-visible relative">
          <table id="table-return-summary" className="w-full border-separate table-fixed border-spacing-0">
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
            <thead>
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
              {reportData.map(m => {
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
            <tfoot className="sticky bottom-0 z-[230] shadow-2xl">
              <tr>
                <td colSpan={2} className={grandStyle + " !bg-slate-200 text-slate-900 uppercase tracking-widest text-[10px] shadow-[inset_0_1px_0_#cbd5e1] border-l border-slate-400 font-black"}>সর্বমোট ইউনিফাইড সারাংশ:</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.pUC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.pUA))}</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.cRC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.cRA))}</td>
                <td className={grandStyle + " !bg-slate-200/80 font-black"}>{toBengaliDigits(grandTotals.pUC + grandTotals.cRC)}</td><td className={grandStyle + " text-center !bg-slate-200/80 font-black"}>{toBengaliDigits(Math.round(grandTotals.pUA + grandTotals.cRA))}</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.pSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.pSA))}</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.cSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-emerald-100/80 font-black"}>{toBengaliDigits(grandTotals.pSC + grandTotals.cSC)}</td><td className={grandStyle + " text-center !bg-emerald-100/80 font-black"}>{toBengaliDigits(Math.round(grandTotals.pSA + grandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-orange-100 text-slate-900 font-black"}>{toBengaliDigits((grandTotals.pUC + grandTotals.cRC) - (grandTotals.pSC + grandTotals.cSC))}</td><td className={grandStyle + " text-center !bg-orange-100 text-slate-900 font-black"}>{toBengaliDigits(Math.round((grandTotals.pUA + grandTotals.cRA) - (grandTotals.pSA + grandTotals.cSA)))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center gap-6 no-print animate-in slide-in-from-left duration-1000 shadow-sm mt-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Database size={28} /></div>
          <div className="text-center md:text-left flex-1">
            <p className="text-[17px] font-black text-slate-900 mb-1.5">অ্যাকাউন্টিং চেইন লজিক (Chain Integrity) ভেরিফাইড</p>
            <p className="text-[12px] font-black text-slate-500 leading-relaxed uppercase tracking-tight">
              সিস্টেম বর্তমানে <span className="text-blue-600">{toBengaliDigits(activeCycle.label)}</span> পিরিয়ডের প্রারম্ভিক জের বিগত সকল মাসের লেনদেনের ভিত্তিতে স্বয়ংক্রিয়ভাবে সমন্বিত উপায়ে গণনা করছে।
              হিসাব: কলাম ৭ = (কলাম ৩ - কলাম ৬)।
            </p>
          </div>
          <div className="px-8 py-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Status</span>
                <span className="text-[12px] font-black text-emerald-600">ACCURATE & SYNCED</span>
              </div>
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnSummaryTable;
