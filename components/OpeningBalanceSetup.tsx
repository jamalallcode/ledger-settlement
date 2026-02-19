import React from 'react';
import { Settings2, ChevronLeft, Unlock, Pencil, LayoutGrid } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP } from '../constants';
import { MinistryPrevStats } from '../types';

interface OpeningBalanceSetupProps {
  ministryGroups: string[];
  tempPrevStats: Record<string, MinistryPrevStats>;
  setTempPrevStats: React.Dispatch<React.SetStateAction<Record<string, MinistryPrevStats>>>;
  isEditingSetup: boolean;
  setIsEditingSetup: (val: boolean) => void;
  handleSaveSetup: () => void;
  handleSetupPaste: (e: React.ClipboardEvent, startEntity: string, startField: keyof MinistryPrevStats) => void;
  setIsSetupMode: (val: boolean) => void;
  setSelectedReportType: (type: string | null) => void;
  IDBadge: React.FC<{ id: string }>;
}

const OpeningBalanceSetup: React.FC<OpeningBalanceSetupProps> = ({
  ministryGroups,
  tempPrevStats,
  setTempPrevStats,
  isEditingSetup,
  setIsEditingSetup,
  handleSaveSetup,
  handleSetupPaste,
  setIsSetupMode,
  setSelectedReportType,
  IDBadge
}) => {
  const setupThCls = "p-4 text-center font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] uppercase bg-slate-200 leading-tight h-20 align-middle sticky top-0 z-[210] shadow-[inset_0_-1px_0_#cbd5e1]";
  const setupFooterTdCls = "p-4 border border-slate-300 text-center text-[15px] bg-blue-50 font-black sticky bottom-0 z-[190] shadow-[inset_0_1px_0_#cbd5e1]";
  
  const totalStats = ministryGroups.reduce((acc, m) => {
    const entities = MINISTRY_ENTITY_MAP[m] || [];
    entities.forEach(ent => {
      const stats = tempPrevStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
      acc.uC += stats.unsettledCount; acc.uA += Math.round(stats.unsettledAmount);
      acc.sC += stats.settledCount; acc.sA += Math.round(stats.settledAmount);
    });
    return acc;
  }, { uC: 0, uA: 0, sC: 0, sA: 0 });

  return (
    <div id="section-prev-stats-setup" className="max-w-full mx-auto space-y-6 py-4 animate-table-entrance relative px-2">
      <IDBadge id="section-prev-stats-setup" />
      <div id="container-setup-controls" className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xl gap-4 no-print relative">
        <IDBadge id="container-setup-controls" />
        <div className="flex items-center gap-4">
          <button onClick={() => { setIsSetupMode(false); setSelectedReportType(null); }} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all"><ChevronLeft size={22} /></button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Settings2 size={28} className="text-blue-600" /> প্রারম্ভিক জের সেটআপ</h2>
            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">সমন্বিত (Unified) ব্যালেন্স ইনপুট উইন্ডো</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsEditingSetup(!isEditingSetup)} 
             className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all border-b-4 active:scale-95 ${isEditingSetup ? 'bg-amber-500 text-white border-amber-700 hover:bg-amber-600' : 'bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700'}`}
           >
             {isEditingSetup ? <Unlock size={18} /> : <Pencil size={18} />}
             {isEditingSetup ? 'এডিট মোড বন্ধ' : 'এডিট করুন'}
           </button>
           <button onClick={handleSaveSetup} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-2xl transition-all border-b-4 border-blue-800 active:scale-95">সংরক্ষণ করুন</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl relative w-full overflow-visible">
         <table className="w-full text-sm border-separate border-spacing-0">
           <thead>
              <tr>
                <th className="p-5 text-left font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] w-[35%] bg-slate-200 leading-tight h-20 align-middle sticky top-0 z-[210] shadow-[inset_0_-1px_0_#cbd5e1]">মন্ত্রণালয় ও সংস্থা</th>
                <th className={setupThCls}>অমী: সংখ্যা <br/><span className="text-[10px] text-slate-500 font-black">(প্রারম্ভিক)</span></th>
                <th className={setupThCls}>অমী: টাকা <br/><span className="text-[10px] text-slate-500 font-black">(প্রারম্ভিক)</span></th>
                <th className={setupThCls}>মী: সংখ্যা <br/><span className="text-[10px] text-slate-500 font-black">(প্রারম্ভিক)</span></th>
                <th className={setupThCls}>মী: টাকা <br/><span className="text-[10px] text-slate-500 font-black">(প্রারম্ভিক)</span></th>
              </tr>
           </thead>
           <tbody>
             {ministryGroups.map(m => {
               const entities = MINISTRY_ENTITY_MAP[m] || [];
               const mSubTotal = entities.reduce((acc, ent) => {
                 const s = tempPrevStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
                 acc.uC += s.unsettledCount; acc.uA += Math.round(s.unsettledAmount);
                 acc.sC += s.settledCount; acc.sA += Math.round(s.settledAmount);
                 return acc;
               }, { uC: 0, uA: 0, sC: 0, sA: 0 });

               return (
                 <React.Fragment key={m}>
                   <tr className="bg-[#1e293b]"><td colSpan={5} className="px-5 py-3 border border-slate-300 bg-[#1e293b]"><div className="flex items-center gap-2 font-black uppercase text-[12px] tracking-wide text-white"><LayoutGrid size={15} className="text-blue-400" /> {m}</div></td></tr>
                   {entities.map(ent => (
                     <tr key={ent} className="hover:bg-blue-50/40 transition-all group bg-white">
                       <td className="px-6 py-4 font-bold text-slate-800 border border-slate-300 text-[13px] bg-white group-hover:text-blue-700">{ent}</td>
                       {(['unsettledCount', 'unsettledAmount', 'settledCount', 'settledAmount'] as const).map(field => (
                         <td key={field} className={`p-1.5 border border-slate-300 text-center align-middle h-14 transition-colors ${isEditingSetup ? 'bg-white group-hover:bg-blue-50' : 'bg-slate-50'}`}>
                           <input 
                             type="text" 
                             readOnly={!isEditingSetup}
                             className={`w-full h-11 text-center font-bold text-[15px] outline-none border-0 transition-all ${isEditingSetup ? 'bg-white text-slate-900 cursor-text' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`} 
                             placeholder="০" 
                             value={tempPrevStats[ent]?.[field] !== undefined && tempPrevStats[ent]![field] !== 0 ? toBengaliDigits(tempPrevStats[ent]![field]) : ''} 
                             onPaste={(e) => handleSetupPaste(e, ent, field)} 
                             onChange={e => { 
                               if (!isEditingSetup) return;
                               const num = parseBengaliNumber(e.target.value); 
                               setTempPrevStats(prev => ({ ...prev, [ent]: { ...(prev[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), [field]: num } })); 
                             }} 
                           />
                         </td>
                       ))}
                     </tr>
                   ))}
                   <tr className="bg-sky-50/50 font-black italic text-slate-700"><td className="px-6 py-3 border border-slate-300 text-right text-[11px] uppercase">উপ-মোট: {m}</td><td className="p-3 border border-slate-300 text-center text-blue-600">{toBengaliDigits(mSubTotal.uC)}</td><td className="p-3 border border-slate-300 text-center text-blue-600">{toBengaliDigits(Math.round(mSubTotal.uA))}</td><td className="p-3 border border-slate-300 text-center text-emerald-600">{toBengaliDigits(mSubTotal.sC)}</td><td className="p-3 border border-slate-300 text-center text-emerald-600">{toBengaliDigits(Math.round(mSubTotal.sA))}</td></tr>
                 </React.Fragment>
               );
             })}
           </tbody>
           <tfoot>
             <tr className="bg-blue-50 font-black text-slate-900 border-t-2 border-slate-400">
               <td className="px-6 py-4 border border-slate-300 text-right text-[13px] uppercase tracking-tighter sticky bottom-0 z-[190] bg-blue-50 shadow-[inset_0_1px_0_#cbd5e1]">সর্বমোট সেটআপ তথ্য:</td>
               <td className={`${setupFooterTdCls} text-blue-700`}>{toBengaliDigits(totalStats.uC)}</td><td className={`${setupFooterTdCls} text-blue-700`}>{toBengaliDigits(Math.round(totalStats.uA))}</td>
               <td className={`${setupFooterTdCls} text-emerald-700`}>{toBengaliDigits(totalStats.sC)}</td><td className={`${setupFooterTdCls} text-emerald-700`}>{toBengaliDigits(Math.round(totalStats.sA))}</td>
             </tr>
           </tfoot>
         </table>
      </div>
    </div>
  );
};

export default OpeningBalanceSetup;
