
import React, { useState, useEffect } from 'react';
import { Settings2, ChevronLeft, Unlock, Pencil, LayoutGrid, Sparkles, Calendar, Plus, Trash2, Save, History } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP } from '../constants';
import { MinistryPrevStats, PeriodOpeningBalance, CumulativeStats } from '../types';

interface PeriodOpeningBalanceSetupProps {
  ministryGroups: string[];
  periodOpeningBalances: PeriodOpeningBalance[];
  setPeriodOpeningBalances: React.Dispatch<React.SetStateAction<PeriodOpeningBalance[]>>;
  setIsSetupMode: (val: boolean) => void;
  setSelectedReportType: (type: string | null) => void;
  IDBadge: React.FC<{ id: string }>;
  startInCreateMode?: boolean;
}

const PeriodOpeningBalanceSetup: React.FC<PeriodOpeningBalanceSetupProps> = ({
  ministryGroups,
  periodOpeningBalances,
  setPeriodOpeningBalances,
  setIsSetupMode,
  setSelectedReportType,
  IDBadge,
  startInCreateMode
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<PeriodOpeningBalance | null>(null);
  const [tempStats, setTempStats] = useState<Record<string, MinistryPrevStats>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const displayFields: { key: keyof MinistryPrevStats, label: string, subLabel?: string }[] = [
    { key: 'unsettledCount', label: 'অমী: সংখ্যা', subLabel: '(প্রারম্ভিক)' },
    { key: 'unsettledAmount', label: 'অমী: টাকা', subLabel: '(প্রারম্ভিক)' },
    { key: 'settledCount', label: 'মী: সংখ্যা', subLabel: '(প্রারম্ভিক)' },
    { key: 'settledAmount', label: 'মী: টাকা', subLabel: '(প্রারম্ভিক)' }
  ];

  const setupThCls = "p-4 text-center font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] uppercase bg-slate-200 leading-tight h-20 align-middle z-[210] shadow-[inset_0_-1px_0_#cbd5e1]";
  const setupFooterTdCls = "p-4 border border-slate-300 text-center text-[15px] bg-black text-white font-black z-[190] shadow-[inset_0_1px_0_#cbd5e1]";

  const handleCreateNew = React.useCallback(() => {
    setCurrentPeriod({
      id: 'period-' + Date.now(),
      startDate: '',
      endDate: '',
      stats: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
      createdAt: new Date().toISOString()
    });
    setTempStats({});
    setStartDate('');
    setEndDate('');
    setIsEditing(true);
  }, []);

  useEffect(() => {
    if (startInCreateMode) {
      handleCreateNew();
    }
  }, [startInCreateMode, handleCreateNew]);

  const handleEdit = (period: PeriodOpeningBalance) => {
    setCurrentPeriod(period);
    setStartDate(period.startDate);
    setEndDate(period.endDate);
    
    const rawStats: Record<string, MinistryPrevStats> = {};
    Object.keys(period.stats.entitiesSFI).forEach(ent => {
      rawStats[ent] = period.stats.entitiesSFI[ent];
    });
    setTempStats(rawStats);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই প্রারম্ভিক জেরটি মুছে ফেলতে চান?')) {
      setPeriodOpeningBalances(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!startDate || !endDate) {
      alert('অনুগ্রহ করে সময়কাল নির্বাচন করুন।');
      return;
    }

    const newPeriod: PeriodOpeningBalance = {
      id: currentPeriod?.id || 'period-' + Date.now(),
      startDate,
      endDate,
      stats: {
        inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0,
        entitiesSFI: tempStats,
        entitiesNonSFI: {}
      },
      createdAt: currentPeriod?.createdAt || new Date().toISOString()
    };

    setPeriodOpeningBalances(prev => {
      const exists = prev.find(p => p.id === newPeriod.id);
      if (exists) {
        return prev.map(p => p.id === newPeriod.id ? newPeriod : p);
      }
      return [newPeriod, ...prev];
    });

    setIsEditing(false);
    setCurrentPeriod(null);
  };

  const handleSetupPaste = (e: React.ClipboardEvent, startEntity: string, startField: keyof MinistryPrevStats) => {
    if (!isEditing) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const allEntities: string[] = [];
    ministryGroups.forEach(m => { (MINISTRY_ENTITY_MAP[m] || []).forEach(ent => allEntities.push(ent)); });
    const startIdx = allEntities.indexOf(startEntity);
    if (startIdx === -1) return;
    
    const fields: (keyof MinistryPrevStats)[] = ['unsettledCount', 'unsettledAmount', 'settledCount', 'settledAmount'];
    const fieldStartIdx = fields.indexOf(startField);
    const newStats = { ...tempStats };
    
    rows.forEach((row, rowOffset) => {
      const entityIdx = startIdx + rowOffset;
      if (entityIdx >= allEntities.length) return;
      const entityName = allEntities[entityIdx];
      const cells = row.split(/\t/);
      cells.forEach((cell, cellOffset) => {
        const fieldIdx = fieldStartIdx + cellOffset;
        if (fieldIdx >= fields.length) return;
        const fieldName = fields[fieldIdx];
        const value = parseBengaliNumber(cell.trim());
        newStats[entityName] = { ...(newStats[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), [fieldName]: value };
      });
    });
    setTempStats(newStats);
  };

  const totalStats = ministryGroups.reduce((acc, m) => {
    const entities = MINISTRY_ENTITY_MAP[m] || [];
    entities.forEach(ent => {
      const stats = tempStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
      acc.uC += stats.unsettledCount; acc.uA += Math.round(stats.unsettledAmount);
      acc.sC += stats.settledCount; acc.sA += Math.round(stats.settledAmount);
    });
    return acc;
  }, { uC: 0, uA: 0, sC: 0, sA: 0 });

  if (!isEditing) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-8 animate-table-entrance px-4">
        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          <div className="flex items-center gap-6 relative z-10">
            <button onClick={() => { setIsSetupMode(false); setSelectedReportType(null); }} className="p-4 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all active:scale-95"><ChevronLeft size={24} /></button>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4"><History size={32} className="text-blue-600" /> কাস্টম জের (সময়কাল ভিত্তিক)</h2>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">CUSTOM PERIOD-SPECIFIC OPENING BALANCE</span>
            </div>
          </div>
          <button onClick={handleCreateNew} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-700 shadow-xl transition-all border-b-4 border-blue-800 active:scale-95 relative z-10">
            <Plus size={20} /> নতুন সেটআপ তৈরি করুন
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {periodOpeningBalances.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-400">কোন সময়কাল ভিত্তিক প্রারম্ভিক জের পাওয়া যায়নি</h3>
              <p className="text-slate-400 font-bold mt-2">নতুন সেটআপ তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            periodOpeningBalances.map(period => (
              <div key={period.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={20} /></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(period)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(period.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-1">সময়কাল:</h4>
                  <p className="text-blue-600 font-black text-[15px] mb-4">
                    {toBengaliDigits(period.startDate.split('-').reverse().join('/'))} হতে {toBengaliDigits(period.endDate.split('-').reverse().join('/'))}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">তৈরি হয়েছে: {toBengaliDigits(new Date(period.createdAt).toLocaleDateString('bn-BD'))}</span>
                    <button onClick={() => handleEdit(period)} className="text-blue-600 font-black text-xs flex items-center gap-1 hover:underline">বিস্তারিত দেখুন <ChevronLeft size={14} className="rotate-180" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="section-period-setup-form" className="max-w-full mx-auto space-y-6 py-4 animate-table-entrance relative px-2">
      <IDBadge id="section-period-setup-form" />
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xl gap-4 no-print relative">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsEditing(false)} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all"><ChevronLeft size={22} /></button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Calendar size={28} className="text-blue-600" /> কাস্টম জের (সময়কাল ভিত্তিক) সেটআপ</h2>
            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">CUSTOM PERIOD-SPECIFIC BALANCE INPUT WINDOW</span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs font-black text-slate-500 uppercase">শুরু:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs font-black text-slate-500 uppercase">শেষ:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-2xl transition-all border-b-4 border-blue-800 active:scale-95">
          <Save size={18} /> সংরক্ষণ করুন
        </button>
      </div>

      <div className="table-container bg-white rounded-3xl border border-slate-300 shadow-2xl relative w-full overflow-auto">
         <table className="w-full text-sm border-separate border-spacing-0">
           <thead>
              <tr>
                <th className="p-5 text-left font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] w-[35%] bg-slate-200 leading-tight h-20 align-middle z-[210] shadow-[inset_0_-1px_0_#cbd5e1]">মন্ত্রণালয় ও সংস্থা</th>
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
                 const s = tempStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
                 acc.uC += s.unsettledCount; acc.uA += Math.round(s.unsettledAmount);
                 acc.sC += s.settledCount; acc.sA += Math.round(s.settledAmount);
                 return acc;
               }, { uC: 0, uA: 0, sC: 0, sA: 0 });

               return (
                 <React.Fragment key={m}>
                   <tr className="bg-[#1e293b] no-hover-row"><td colSpan={5} className="px-5 py-3 border border-slate-300 bg-[#1e293b]"><div className="flex items-center gap-2 font-black uppercase text-[12px] tracking-wide text-white"><LayoutGrid size={15} className="text-blue-400" /> {m}</div></td></tr>
                   {entities.map(ent => (
                     <tr key={ent} className="hover:bg-blue-50/40 transition-all group bg-white">
                       <td className="px-6 py-4 font-bold text-slate-800 border border-slate-300 text-[13px] bg-white group-hover:text-blue-700">{ent}</td>
                       {displayFields.map(f => (
                         <td key={f.key} className="p-1.5 border border-slate-300 text-center align-middle h-14 transition-colors bg-white group-hover:bg-blue-50">
                           <input 
                             type="text" 
                             className="w-full h-11 text-center font-bold text-[15px] outline-none border-0 transition-all bg-white text-slate-900 cursor-text" 
                             placeholder="০" 
                             value={tempStats[ent]?.[f.key] !== undefined && tempStats[ent]![f.key] !== 0 ? toBengaliDigits(tempStats[ent]![f.key]) : ''} 
                             onPaste={(e) => handleSetupPaste(e, ent, f.key)} 
                             onChange={e => { 
                               const num = parseBengaliNumber(e.target.value); 
                               setTempStats(prev => ({ ...prev, [ent]: { ...(prev[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), [f.key]: num } })); 
                             }} 
                           />
                         </td>
                       ))}
                     </tr>
                   ))}
                   <tr className="bg-sky-50/50 font-black italic text-slate-700 no-hover-row">
                      <td className="px-6 py-3 border border-slate-300 text-right text-[11px] uppercase">উপ-মোট: {m}</td>
                      {displayFields.map(f => {
                        const val = f.key === 'unsettledCount' ? mSubTotal.uC :
                                    f.key === 'unsettledAmount' ? mSubTotal.uA :
                                    f.key === 'settledCount' ? mSubTotal.sC : mSubTotal.sA;
                        const colorCls = f.key.startsWith('settled') ? 'text-emerald-600' : 'text-blue-600';
                        return <td key={f.key} className={`p-3 border border-slate-300 text-center ${colorCls}`}>{toBengaliDigits(Math.round(val))}</td>;
                      })}
                    </tr>
                 </React.Fragment>
               );
             })}
           </tbody>
           <tfoot>
             <tr className="bg-black text-white font-black border-t-2 border-slate-400">
               <td className="px-6 py-4 border border-slate-300 text-right text-[13px] uppercase tracking-tighter z-[190] bg-black text-white shadow-[inset_0_1px_0_#cbd5e1]">সর্বমোট সেটআপ তথ্য:</td>
               {displayFields.map(f => {
                  const val = f.key === 'unsettledCount' ? totalStats.uC :
                              f.key === 'unsettledAmount' ? totalStats.uA :
                              f.key === 'settledCount' ? totalStats.sC : totalStats.sA;
                  const colorCls = f.key.startsWith('settled') ? 'text-emerald-400' : 'text-amber-400';
                  return <td key={f.key} className={`${setupFooterTdCls} ${colorCls}`}>{toBengaliDigits(Math.round(val))}</td>;
                })}
             </tr>
           </tfoot>
         </table>
      </div>
    </div>
  );
};

export default PeriodOpeningBalanceSetup;
