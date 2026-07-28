

import React from 'react';
import { Settings2, ChevronLeft, Pencil, LayoutGrid, Calendar, CheckCircle2 } from 'lucide-react';
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
  setupType: string;
  originalStats: Record<string, MinistryPrevStats>;
  dynamicSetupConfig?: {
    enabled: boolean;
    startDate: string;
    endDate: string;
  };
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
  IDBadge,
  setupType,
  originalStats,
  dynamicSetupConfig
}) => {
  const [customMonthText, setCustomMonthText] = React.useState<string>(() => {
    return localStorage.getItem('opening_balance_custom_month_text') || '';
  });
  const [showSavedToast, setShowSavedToast] = React.useState<boolean>(false);

  const isQuarterly = setupType.includes('ত্রৈমাসিক');

  const displayFields: { key: keyof MinistryPrevStats, label: string, subLabel?: string }[] = isQuarterly ? [
    { key: 'unsettledCount', label: 'উত্থাপিত অনুচ্ছেদ সংখ্যা' },
    { key: 'settledCount', label: 'মোট নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা' },
    { key: 'unsettledAmount', label: 'অনিষ্পন্ন অনুচ্ছেদে জড়িত টাকা' }
  ] : [
    { key: 'unsettledCount', label: 'অমী: সংখ্যা', subLabel: '(প্রারম্ভিক)' },
    { key: 'unsettledAmount', label: 'অমী: টাকা', subLabel: '(প্রারম্ভিক)' },
    { key: 'settledCount', label: 'মী: সংখ্যা', subLabel: '(প্রারম্ভিক)' },
    { key: 'settledAmount', label: 'মী: টাকা', subLabel: '(প্রারম্ভিক)' }
  ];

  const setupThCls = "p-4 text-center font-black text-slate-900 text-[12px] md:text-[13px] uppercase bg-slate-200 leading-tight h-20 align-middle z-[210]";
  const setupFooterTdCls = "p-4 text-center text-[15px] bg-slate-200 text-slate-900 font-black z-[190]";
  
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

      {/* Floating Success Toast */}
      {showSavedToast && (
        <div className="fixed top-6 right-6 z-[10000] flex items-center gap-3.5 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-emerald-300 animate-in slide-in-from-top-6 fade-in duration-300">
          <div className="bg-white/20 p-2 rounded-xl shrink-0">
            <CheckCircle2 size={24} className="text-white animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-white tracking-wide">ডাটা সফলভাবে সংরক্ষিত হয়েছে!</span>
            <span className="text-[11px] font-extrabold text-emerald-100">সকল তথ্য ও জের সফলভাবে লক করা হয়েছে।</span>
          </div>
        </div>
      )}

      <div id="container-setup-controls" className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xl gap-4 no-print relative">
        <IDBadge id="container-setup-controls" />
        <div className="flex items-center gap-4">
          <button onClick={() => { setIsSetupMode(false); setSelectedReportType(null); }} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all"><ChevronLeft size={22} /></button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Settings2 size={28} className="text-blue-600" /> {setupType ? setupType.replace('প্রারম্ভিক জের সেটআপ: মাসিক', 'পূর্ব জের সেটাপ').replace('প্রারম্ভিক জের সেটআপ', 'পূর্ব জের সেটাপ') : 'পূর্ব জের সেটাপ'}</h2>
            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">সমন্বিত (UNIFIED) ব্যালেন্স ইনপুট উইন্ডো</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className={`flex flex-wrap items-center gap-2.5 rounded-2xl px-4 py-2 shadow-sm text-xs transition-all ${
            isEditingSetup ? 'bg-amber-100/90 border-2 border-amber-400 ring-2 ring-amber-400/30' : 'bg-amber-50/90 border border-amber-300/90'
          }`}>
            <Calendar size={18} className="text-amber-700 shrink-0" />
            <span className="font-extrabold text-amber-950 text-[13px] whitespace-nowrap">জের-এর মাস:</span>
            <input
              type="text"
              placeholder="মাস/বছর (যেমন: ১৬/০৫/২০২৫ হতে ১৫/০৬/২০২৫)"
              value={customMonthText}
              readOnly={!isEditingSetup}
              onChange={(e) => {
                if (!isEditingSetup) return;
                const val = e.target.value;
                setCustomMonthText(val);
                localStorage.setItem('opening_balance_custom_month_text', val);
              }}
              className={`rounded-xl px-3 py-1.5 font-bold text-[13px] outline-none w-64 transition-all shadow-sm ${
                isEditingSetup
                  ? 'bg-white border-2 border-amber-400 text-slate-900 focus:ring-2 focus:ring-amber-500/30 placeholder:text-slate-400 cursor-text'
                  : 'bg-amber-100/70 border border-amber-200/80 text-amber-950 cursor-not-allowed select-none font-extrabold'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isEditingSetup ? (
            <button 
              onClick={() => setIsEditingSetup(true)} 
              className="px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all border-b-4 bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Pencil size={18} />
              <span>এডিট করুন</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                localStorage.setItem('opening_balance_custom_month_text', customMonthText);
                handleSaveSetup();
                setShowSavedToast(true);
                setTimeout(() => {
                  setShowSavedToast(false);
                }, 3500);
              }} 
              className="px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all border-b-4 bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700 active:scale-95 shadow-xl hover:shadow-2xl animate-in zoom-in-95 duration-200 cursor-pointer"
            >
              <CheckCircle2 size={19} className="text-emerald-100 animate-pulse" />
              <span>সংরক্ষণ করুন</span>
            </button>
          )}
        </div>
      </div>

      <div className={`table-container bg-white rounded-3xl relative w-full overflow-auto transition-all duration-500 ${showSavedToast ? 'ring-4 ring-emerald-500/80 shadow-emerald-500/30 shadow-2xl scale-[1.002]' : ''}`}>
         <table className="w-full text-sm border-separate border-spacing-0">
           <thead>
              <tr>
                <th className="p-5 text-left font-black text-slate-900 text-[12px] md:text-[13px] w-[35%] bg-slate-200 leading-tight h-20 align-middle z-[210]">মন্ত্রণালয় ও সংস্থা</th>
                {displayFields.map(f => (
                  <th key={f.key} className={setupThCls}>
                    {f.label} {f.subLabel && <><br/><span className="text-[10px] text-slate-500 font-black">{f.subLabel}</span></>}
                  </th>
                ))}
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
                   <tr className="bg-[#1e293b] no-hover-row"><td colSpan={isQuarterly ? 4 : 5} className="px-5 py-3 bg-[#1e293b]"><div className="flex items-center gap-2 font-black uppercase text-[12px] tracking-wide text-white"><LayoutGrid size={15} className="text-blue-400" /> {m}</div></td></tr>
                   {entities.map(ent => (
                     <tr key={ent} className="hover:bg-blue-50/40 transition-all group bg-white">
                       <td className="px-6 py-4 font-bold text-slate-800 text-[13px] bg-white group-hover:text-blue-700">{ent}</td>
                       {displayFields.map(f => (
                         <td key={f.key} className={`p-1.5 text-center align-middle h-14 transition-colors ${isEditingSetup ? 'bg-white group-hover:bg-blue-50' : 'bg-slate-50'}`}>
                           <input 
                             type="text" 
                             readOnly={!isEditingSetup}
                             className={`w-full h-11 text-center font-bold text-[15px] outline-none border-0 transition-all ${isEditingSetup ? 'bg-white text-slate-900 cursor-text hover:bg-blue-50/50 focus:bg-amber-50 focus:ring-2 focus:ring-blue-500 rounded-lg' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`} 
                             placeholder="০" 
                             value={tempPrevStats[ent]?.[f.key] !== undefined && tempPrevStats[ent]![f.key] !== 0 ? toBengaliDigits(tempPrevStats[ent]![f.key]) : ''} 
                             onPaste={(e) => handleSetupPaste(e, ent, f.key)} 
                             onChange={e => { 
                               if (!isEditingSetup) return;
                               const num = parseBengaliNumber(e.target.value); 
                               setTempPrevStats(prev => ({ ...prev, [ent]: { ...(prev[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), [f.key]: num } })); 
                             }} 
                           />
                         </td>
                       ))}
                     </tr>
                   ))}
                   <tr className="bg-sky-50/50 font-black italic text-slate-700 no-hover-row">
                      <td className="px-6 py-3 text-right text-[11px] uppercase">উপ-মোট: {m}</td>
                      {displayFields.map(f => {
                        const val = f.key === 'unsettledCount' ? mSubTotal.uC :
                                    f.key === 'unsettledAmount' ? mSubTotal.uA :
                                    f.key === 'settledCount' ? mSubTotal.sC : mSubTotal.sA;
                        const colorCls = f.key.startsWith('settled') ? 'text-emerald-600' : 'text-blue-600';
                        return <td key={f.key} className={`p-3 text-center ${colorCls}`}>{toBengaliDigits(Math.round(val))}</td>;
                      })}
                    </tr>
                 </React.Fragment>
               );
             })}
           </tbody>
           <tfoot>
             <tr className="bg-slate-200 text-slate-900 font-black">
               <td className="px-6 py-4 text-right text-[13px] uppercase tracking-tighter z-[190] bg-slate-200 text-slate-900">সর্বমোট সেটআপ তথ্য:</td>
               {displayFields.map(f => {
                  const val = f.key === 'unsettledCount' ? totalStats.uC :
                              f.key === 'unsettledAmount' ? totalStats.uA :
                              f.key === 'settledCount' ? totalStats.sC : totalStats.sA;
                  const colorCls = f.key.startsWith('settled') ? 'text-emerald-700 font-extrabold' : 'text-blue-700 font-extrabold';
                  return <td key={f.key} className={`${setupFooterTdCls} ${colorCls}`}>{toBengaliDigits(Math.round(val))}</td>;
                })}

             </tr>
           </tfoot>
         </table>
      </div>
    </div>
  );
};

export default OpeningBalanceSetup;
