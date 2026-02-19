
import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { SettlementEntry, CumulativeStats, MinistryPrevStats } from '../types';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP, OFFICE_HEADER } from '../constants';
import { ChevronLeft, ArrowRightCircle, Printer, Database, Settings2, CheckCircle2, CalendarDays, ChevronDown, Check, LayoutGrid, PieChart, Search, CalendarSearch, X, Lock, KeyRound, Pencil, Unlock, Mail, Send, FileEdit, AlertCircle, BarChart3 } from 'lucide-react';
import { addMonths, format as dateFnsFormat, endOfDay, startOfDay } from 'date-fns';
import { getCycleForDate, isInCycle } from '../utils/cycleHelper';
import DDSirCorrespondenceReturn from './DDSirCorrespondenceReturn';

interface ReturnViewProps {
  entries: SettlementEntry[];
  correspondenceEntries?: any[];
  cycleLabel: string;
  onDownloadPDF?: () => void;
  isGeneratingPDF?: boolean;
  prevStats: CumulativeStats;
  setPrevStats: (stats: CumulativeStats) => void;
  onDemoLoad?: () => void;
  onJumpToRegister?: () => void;
  isLayoutEditable?: boolean;
  resetKey?: number;
  isAdmin?: boolean;
  selectedReportType: string | null;
  setSelectedReportType: (type: string | null) => void;
}

/**
 * ReturnView - অডিট আপত্তি নিষ্পত্তি সংক্রান্ত রিটার্ণ ও সারাংশ ভিউ
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 */
// FIX: Completed the truncated component and added the missing return statement and export default.
const ReturnView: React.FC<ReturnViewProps> = ({ 
  entries, correspondenceEntries = [], cycleLabel, prevStats, setPrevStats, 
  isLayoutEditable, resetKey, onDemoLoad, onJumpToRegister, isAdmin,
  selectedReportType, setSelectedReportType
}) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [tempPrevStats, setTempPrevStats] = useState<Record<string, MinistryPrevStats>>({});
  
  const [selectedCycleDate, setSelectedCycleDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const ministryGroups = useMemo(() => ['আর্থিক প্রতিষ্ঠান বিভাগ', 'পাট মন্ত্রণালয়', 'বস্ত্র মন্ত্রণালয়', 'শিল্প মন্ত্রণালয়', 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়', 'বাণিজ্য মন্ত্রণালয়'], []);

  useEffect(() => {
    if (resetKey && resetKey > 0) {
      setSelectedReportType(null);
      setIsSetupMode(false);
      setSelectedCycleDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
  }, [resetKey, setSelectedReportType]);

  useEffect(() => {
    if (selectedReportType === 'পূর্ব জের সেটআপ উইন্ডো') {
      setIsSetupMode(true);
    } else if (selectedReportType !== null) {
      setIsSetupMode(false);
    }
  }, [selectedReportType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCycleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleOptions = useMemo(() => {
    const options = [];
    const banglaMonths: Record<string, string> = {
      'January': 'জানুয়ারি', 'February': 'ফেব্রুয়ারি', 'March': 'মার্চ', 'April': 'এপ্রিল',
      'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
      'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর'
    };

    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const refDate = addMonths(today, -i);
      const firstOfTargetMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      const cycle = getCycleForDate(firstOfTargetMonth);
      const monthNameEng = dateFnsFormat(firstOfTargetMonth, 'MMMM');
      const yearEng = dateFnsFormat(firstOfTargetMonth, 'yyyy');
      const label = `${banglaMonths[monthNameEng]} ${toBengaliDigits(yearEng)} সাইকেল`;
      options.push({ date: firstOfTargetMonth, label, cycleLabel: cycle.label });
    }
    return options;
  }, []);

  const activeCycle = useMemo(() => getCycleForDate(selectedCycleDate), [selectedCycleDate]);

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const calculateRecursiveOpening = (entityName: string, cycleStart: Date) => {
    const base = prevStats.entitiesSFI[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
    const cycleStartStr = dateFnsFormat(cycleStart, 'yyyy-MM-dd');
    
    const pastEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
        return entryDate !== '' && entryDate < cycleStartStr;
    });

    let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
    const processedParaIds = new Set<string>();

    pastEntries.forEach(entry => {
        const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            pastRC += parseBengaliNumber(rCountRaw);
        }
        if (entry.manualRaisedAmount) pastRA += (Number(entry.manualRaisedAmount) || 0);

        if (entry.paragraphs) {
          entry.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              if (p.status === 'পূর্ণাঙ্গ') {
                  pastSC++;
                  pastSA += (Number(p.involvedAmount) || 0);
              } else if (p.status === 'আংশিক') {
                  pastSA += (Number(p.recoveredAmount) || 0) + (Number(p.adjustedAmount) || 0);
              }
            }
          });
        }
    });

    return {
        unsettledCount: Math.max(0, base.unsettledCount + pastRC),
        unsettledAmount: Math.max(0, base.unsettledAmount + Math.round(pastRA)),
        settledCount: base.settledCount + pastSC,
        settledAmount: base.settledAmount + Math.round(pastSA)
    };
  };

  useEffect(() => {
    if (isSetupMode) {
      const rawMasterStats: Record<string, MinistryPrevStats> = {};
      ministryGroups.forEach(m => {
        const entities = MINISTRY_ENTITY_MAP[m] || [];
        entities.forEach(ent => {
          rawMasterStats[ent] = prevStats.entitiesSFI[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        });
      });
      setTempPrevStats(rawMasterStats);
    }
  }, [isSetupMode, prevStats, ministryGroups]);

  const reportData = useMemo(() => {
    if (!selectedReportType || selectedReportType.includes('চিঠিপত্র সংক্রান্ত')) return [];
    
    const cycleStartStr = dateFnsFormat(activeCycle.start, 'yyyy-MM-dd');
    const cycleEndStr = dateFnsFormat(activeCycle.end, 'yyyy-MM-dd');

    return ministryGroups.map(ministryName => {
      const normMinistry = robustNormalize(ministryName);
      const mapKey = Object.keys(MINISTRY_ENTITY_MAP).find(k => robustNormalize(k) === normMinistry);
      const entities = mapKey ? (MINISTRY_ENTITY_MAP[mapKey] || []) : [];
      return {
        ministry: normMinistry,
        entityRows: entities.map(entityName => {
          const normEntity = robustNormalize(entityName);
          const ePrev = calculateRecursiveOpening(entityName, activeCycle.start);

          const matchingEntries = entries.filter(e => {
            const eMin = robustNormalize(e.ministryName || '');
            const eEnt = robustNormalize(e.entityName || '');
            if (eMin !== normMinistry || eEnt !== normEntity) return false;
            
            // FIX: Aligning with Register parity using strict Date Range filtering
            const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return entryDate >= cycleStartStr && entryDate <= cycleEndStr;
          });
          
          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0;
          const processedParaIds = new Set<string>();

          matchingEntries.forEach(entry => {
            // Manual Raised Count/Amount
            const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
            if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
                curRC += parseBengaliNumber(rCountRaw);
            }
            if (entry.manualRaisedAmount) curRA += (Number(entry.manualRaisedAmount) || 0);

            // Paragraphs
            if (entry.paragraphs) {
              entry.paragraphs.forEach(p => {
                const cleanParaNo = String(p.paraNo || '').trim();
                const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
                if (p.id && !processedParaIds.has(p.id) && hasDigit) {
                  processedParaIds.add(p.id);
                  if (p.status === 'পূর্ণাঙ্গ') {
                      curSC++;
                      curFC++;
                      curSA += (Number(p.involvedAmount) || 0);
                  } else if (p.status === 'আংশিক') {
                      curSC++;
                      curPC++;
                      curSA += (Number(p.recoveredAmount) || 0) + (Number(p.adjustedAmount) || 0);
                  }
                }
              });
            }
          });

          return { 
            entity: entityName, 
            prev: ePrev, 
            currentRaisedCount: curRC, 
            currentRaisedAmount: curRA, 
            currentSettledCount: curSC, 
            currentSettledAmount: curSA,
            fullCount: curFC,
            partialCount: curPC
          };
        })
      };
    });
  }, [entries, activeCycle, prevStats, selectedReportType, ministryGroups]);

  // FIX: Added logic for Special DD Sir Correspondence Report
  if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') {
    return (
      <DDSirCorrespondenceReturn 
        entries={correspondenceEntries} 
        activeCycle={activeCycle} 
        onBack={() => setSelectedReportType(null)} 
        isLayoutEditable={isLayoutEditable} 
      />
    );
  }

  // Selection Menu if no report is active
  if (!selectedReportType) {
    return (
      <div className="flex flex-col items-center justify-center py-10 max-w-4xl mx-auto space-y-10 animate-in fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
             <PieChart size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">রিটার্ণ ম্যানেজমেন্ট ড্যাশবোর্ড</h2>
          <p className="text-slate-500 font-bold">অনুগ্রহ করে সাইডবার থেকে রিপোর্টের ধরণ নির্বাচন করুন</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
           <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Mail size={40} /></div>
              <h4 className="text-xl font-black text-slate-800">চিঠিপত্র রিটার্ন</h4>
              <p className="text-sm text-slate-500 font-bold text-center">প্রাপ্ত চিঠিপত্র এবং ডায়েরি এন্ট্রি সংক্রান্ত পরিসংখ্যানমূলক রিপোর্ট।</p>
           </div>
           <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileEdit size={40} /></div>
              <h4 className="text-xl font-black text-slate-800">নিষ্পত্তি রিটার্ন</h4>
              <p className="text-sm text-slate-500 font-bold text-center">অডিট আপত্তি নিষ্পত্তি (SFI/Non-SFI) সংক্রান্ত বিস্তারিত মাসিক ও ত্রৈমাসিক রিপোর্ট।</p>
           </div>
        </div>
      </div>
    );
  }

  // Setup Mode UI
  if (isSetupMode) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedReportType(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><ChevronLeft /></button>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Lock size={20} className="text-blue-600" /> প্রারম্ভিক জের সেটিংস</h3>
                </div>
                {!isEditingSetup ? (
                    <button onClick={() => setIsEditingSetup(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-2"><Pencil size={14} /> এডিট মোড সক্রিয় করুন</button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditingSetup(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-all">বাতিল</button>
                        <button 
                            onClick={async () => {
                                const nextStats = { ...prevStats, entitiesSFI: { ...prevStats.entitiesSFI, ...tempPrevStats } };
                                setPrevStats(nextStats);
                                setIsEditingSetup(false);
                                alert("প্রারম্ভিক জের সফলভাবে সংরক্ষিত হয়েছে।");
                            }} 
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2"
                        ><Check size={14} /> পরিবর্তন সংরক্ষণ করুন</button>
                    </div>
                )}
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-amber-600 shrink-0 mt-1" />
                <div className="space-y-1">
                    <p className="text-sm font-black text-amber-900">সতর্কতা: প্রারম্ভিক জের পরিবর্তন করলে সকল রিপোর্টের টোটাল পরিবর্তন হয়ে যাবে।</p>
                    <p className="text-xs font-bold text-amber-700">এখানে যে ডাটা দিবেন তা ১লা জুলাই (বা অর্থবছরের শুরু) এর হিসাব হিসেবে গণ্য হবে। সিস্টেমের এন্ট্রিগুলো এর সাথে স্বয়ংক্রিয়ভাবে যোগ হবে।</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {ministryGroups.map(m => (
                    <div key={m} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="bg-slate-900 p-5 px-8 flex items-center justify-between">
                            <h4 className="text-white font-black text-lg">{m}</h4>
                            <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-[10px] font-black uppercase tracking-widest">এনটিটি তালিকা</span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left p-4 font-black text-slate-400 text-xs uppercase">এনটিটির নাম</th>
                                        <th className="p-4 font-black text-slate-400 text-xs uppercase">প্রারম্ভিক অমীমাংসিত সংখ্যা</th>
                                        <th className="p-4 font-black text-slate-400 text-xs uppercase">প্রারম্ভিক অমীমাংসিত টাকা</th>
                                        <th className="p-4 font-black text-slate-400 text-xs uppercase">প্রারম্ভিক মীমাংসিত সংখ্যা</th>
                                        <th className="p-4 font-black text-slate-400 text-xs uppercase">প্রারম্ভিক মীমাংসিত টাকা</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(MINISTRY_ENTITY_MAP[m] || []).map(ent => {
                                        const stats = tempPrevStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
                                        return (
                                            <tr key={ent} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-black text-slate-800 text-sm">{ent}</td>
                                                <td className="p-2">
                                                    <input 
                                                        disabled={!isEditingSetup}
                                                        type="text" 
                                                        className={`w-full h-10 text-center rounded-xl font-black text-sm transition-all ${isEditingSetup ? 'bg-white border-2 border-blue-100 focus:border-blue-500' : 'bg-transparent border-none'}`}
                                                        value={toBengaliDigits(stats.unsettledCount)}
                                                        onChange={e => {
                                                            const val = parseBengaliNumber(e.target.value);
                                                            setTempPrevStats(prev => ({ ...prev, [ent]: { ...stats, unsettledCount: val } }));
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input 
                                                        disabled={!isEditingSetup}
                                                        type="text" 
                                                        className={`w-full h-10 text-center rounded-xl font-black text-sm transition-all ${isEditingSetup ? 'bg-white border-2 border-blue-100 focus:border-blue-500' : 'bg-transparent border-none'}`}
                                                        value={toBengaliDigits(stats.unsettledAmount)}
                                                        onChange={e => {
                                                            const val = parseBengaliNumber(e.target.value);
                                                            setTempPrevStats(prev => ({ ...prev, [ent]: { ...stats, unsettledAmount: val } }));
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input 
                                                        disabled={!isEditingSetup}
                                                        type="text" 
                                                        className={`w-full h-10 text-center rounded-xl font-black text-sm transition-all ${isEditingSetup ? 'bg-white border-2 border-blue-100 focus:border-blue-500' : 'bg-transparent border-none'}`}
                                                        value={toBengaliDigits(stats.settledCount)}
                                                        onChange={e => {
                                                            const val = parseBengaliNumber(e.target.value);
                                                            setTempPrevStats(prev => ({ ...prev, [ent]: { ...stats, settledCount: val } }));
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input 
                                                        disabled={!isEditingSetup}
                                                        type="text" 
                                                        className={`w-full h-10 text-center rounded-xl font-black text-sm transition-all ${isEditingSetup ? 'bg-white border-2 border-blue-100 focus:border-blue-500' : 'bg-transparent border-none'}`}
                                                        value={toBengaliDigits(stats.settledAmount)}
                                                        onChange={e => {
                                                            const val = parseBengaliNumber(e.target.value);
                                                            setTempPrevStats(prev => ({ ...prev, [ent]: { ...stats, settledAmount: val } }));
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // Grand Totals Calculation for the Main Table
  const grandTotals = reportData.reduce((acc, m) => {
    m.entityRows.forEach(r => {
      const tUC = r.prev.unsettledCount + r.currentRaisedCount;
      const tUA = r.prev.unsettledAmount + r.currentRaisedAmount;
      const tSC = r.prev.settledCount + r.currentSettledCount;
      const tSA = r.prev.settledAmount + r.currentSettledAmount;
      
      acc.pUC += r.prev.unsettledCount; acc.pUA += r.prev.unsettledAmount;
      acc.cRC += r.currentRaisedCount; acc.cRA += r.currentRaisedAmount;
      acc.tUC += tUC; acc.tUA += tUA;
      acc.pSC += r.prev.settledCount; acc.pSA += r.prev.settledAmount;
      acc.cSC += r.currentSettledCount; acc.cSA += r.currentSettledAmount;
      acc.tSC += tSC; acc.tSA += tSA;
    });
    return acc;
  }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, tUC: 0, tUA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, tSC: 0, tSA: 0 });

  const thS = "border border-slate-300 px-0.5 py-1 font-black text-center text-[10px] md:text-[11px] bg-slate-100 text-slate-900 leading-tight align-middle h-[42px]";
  const tdS = "border border-slate-300 px-0.5 py-1 text-[11px] md:text-[12px] text-center font-bold leading-tight bg-white h-[38px]";

  return (
    <div className="space-y-6 py-2 w-full animate-premium-page relative">
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
             <button onClick={() => setSelectedReportType(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><ChevronLeft /></button>
             <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedReportType}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Audit Settlement Performance Report</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3" ref={dropdownRef}>
            <div 
                onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} 
                className={`relative flex items-center gap-3 px-4 h-[44px] bg-white border rounded-xl cursor-pointer transition-all duration-300 ${isCycleDropdownOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-md' : 'border-slate-300 shadow-sm hover:border-slate-400'}`}
            >
                <CalendarDays size={18} className="text-blue-600" />
                <span className="font-bold text-[13px] text-slate-900 truncate">
                  {cycleOptions.find(o => dateFnsFormat(o.date, 'yyyy-MM') === dateFnsFormat(selectedCycleDate, 'yyyy-MM'))?.label || toBengaliDigits(activeCycle.label)}
                </span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isCycleDropdownOpen ? 'rotate-180' : ''}`} />
                
                {isCycleDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                        {cycleOptions.map((opt, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setSelectedCycleDate(opt.date); setIsCycleDropdownOpen(false); }} 
                            className={`px-5 py-3 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${dateFnsFormat(opt.date, 'yyyy-MM') === dateFnsFormat(selectedCycleDate, 'yyyy-MM') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-slate-700 font-bold'}`}
                          >
                            <span className="text-[13px]">{opt.label}</span>
                            {dateFnsFormat(opt.date, 'yyyy-MM') === dateFnsFormat(selectedCycleDate, 'yyyy-MM') && <Check size={16} strokeWidth={3} />}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
            <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
          </div>
       </div>

       <div className="table-container border border-slate-300 rounded-sm overflow-visible relative bg-white shadow-xl">
          <table className="w-full border-separate table-fixed">
            <colgroup>
               <col className="w-[120px]" />
               <col className="w-[150px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
               <col className="w-[50px]" /><col className="w-[80px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50">
                 <th colSpan={2} className="border border-slate-300 p-2 text-center font-black text-[13px]">অডিট আপত্তি নিষ্পত্তি সংক্রান্ত মাসিক রিটার্ণ</th>
                 <th colSpan={4} className="border border-slate-300 p-2 text-center font-black text-[13px]">সময়কাল: {toBengaliDigits(activeCycle.label)}</th>
                 <th colSpan={10} className="border border-slate-300 p-2 text-center font-black text-[13px]">{OFFICE_HEADER.sub}, {OFFICE_HEADER.address}</th>
              </tr>
              <tr>
                <th rowSpan={2} className={thS}>মন্ত্রণালয়</th>
                <th rowSpan={2} className={thS}>সংস্থা</th>
                <th colSpan={2} className={thS}>প্রারম্ভিক অমীমাংসিত</th>
                <th colSpan={2} className={thS}>বর্তমান উত্থাপিত</th>
                <th colSpan={2} className={thS}>মোট অমীমাংসিত</th>
                <th colSpan={2} className={thS}>প্রারম্ভিক মীমাংসিত</th>
                <th colSpan={2} className={thS}>চলতি মীমাংসিত</th>
                <th colSpan={2} className={thS}>মোট মীমাংসিত</th>
                <th colSpan={2} className={thS}>অবশিষ্ট অমীমাংসিত</th>
              </tr>
              <tr>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
                <th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(m => m.entityRows.map((r, ri) => {
                const tUC = r.prev.unsettledCount + r.currentRaisedCount;
                const tUA = r.prev.unsettledAmount + r.currentRaisedAmount;
                const tSC = r.prev.settledCount + r.currentSettledCount;
                const tSA = r.prev.settledAmount + r.currentSettledAmount;
                return (
                  <tr key={r.entity} className="group hover:bg-blue-50/30 transition-colors">
                    {ri === 0 && <td rowSpan={m.entityRows.length} className={tdS + " bg-slate-50/50 leading-tight px-2"}>{m.ministry}</td>}
                    <td className={tdS + " text-left px-3 text-[11px]"}>{r.entity}</td>
                    <td className={tdS}>{toBengaliDigits(r.prev.unsettledCount)}</td><td className={tdS}>{toBengaliDigits(Math.round(r.prev.unsettledAmount))}</td>
                    <td className={tdS + " text-blue-600"}>{toBengaliDigits(r.currentRaisedCount)}</td><td className={tdS + " text-blue-600"}>{toBengaliDigits(Math.round(r.currentRaisedAmount))}</td>
                    <td className={tdS + " bg-slate-50"}>{toBengaliDigits(tUC)}</td><td className={tdS + " bg-slate-50"}>{toBengaliDigits(Math.round(tUA))}</td>
                    <td className={tdS}>{toBengaliDigits(r.prev.settledCount)}</td><td className={tdS}>{toBengaliDigits(Math.round(r.prev.settledAmount))}</td>
                    <td className={tdS + " text-emerald-600"}>{toBengaliDigits(r.currentSettledCount)}</td><td className={tdS + " text-emerald-600"}>{toBengaliDigits(Math.round(r.currentSettledAmount))}</td>
                    <td className={tdS + " bg-emerald-50/30"}>{toBengaliDigits(tSC)}</td><td className={tdS + " bg-emerald-50/30"}>{toBengaliDigits(Math.round(tSA))}</td>
                    <td className={tdS + " bg-amber-50/50 text-red-600"}>{toBengaliDigits(tUC - tSC)}</td><td className={tdS + " bg-amber-50/50 text-red-600"}>{toBengaliDigits(Math.round(tUA - tSA))}</td>
                  </tr>
                );
              }))}
            </tbody>
            <tfoot className="sticky bottom-0 z-[100]">
               <tr className="bg-slate-900 text-white font-black h-[45px]">
                  <td colSpan={2} className="px-4 text-center text-[11px] uppercase tracking-widest border border-slate-700">সর্বমোট (বিভাগীয় ফলাফল)</td>
                  <td className="text-center text-[10px] border border-slate-700">{toBengaliDigits(grandTotals.pUC)}</td><td className="text-center text-[10px] border border-slate-700">{toBengaliDigits(Math.round(grandTotals.pUA))}</td>
                  <td className="text-center text-[10px] border border-slate-700 text-blue-400">{toBengaliDigits(grandTotals.cRC)}</td><td className="text-center text-[10px] border border-slate-700 text-blue-400">{toBengaliDigits(Math.round(grandTotals.cRA))}</td>
                  <td className="text-center text-[10px] border border-slate-700 bg-slate-800">{toBengaliDigits(grandTotals.tUC)}</td><td className="text-center text-[10px] border border-slate-700 bg-slate-800">{toBengaliDigits(Math.round(grandTotals.tUA))}</td>
                  <td className="text-center text-[10px] border border-slate-700">{toBengaliDigits(grandTotals.pSC)}</td><td className="text-center text-[10px] border border-slate-700">{toBengaliDigits(Math.round(grandTotals.pSA))}</td>
                  <td className="text-center text-[10px] border border-slate-700 text-emerald-400">{toBengaliDigits(grandTotals.cSC)}</td><td className="text-center text-[10px] border border-slate-700 text-emerald-400">{toBengaliDigits(Math.round(grandTotals.cSA))}</td>
                  <td className="text-center text-[10px] border border-slate-700 bg-emerald-900/50">{toBengaliDigits(grandTotals.tSC)}</td><td className="text-center text-[10px] border border-slate-700 bg-emerald-900/50">{toBengaliDigits(Math.round(grandTotals.tSA))}</td>
                  <td className="text-center text-[11px] border border-slate-700 bg-amber-600">{toBengaliDigits(grandTotals.tUC - grandTotals.tSC)}</td><td className="text-center text-[11px] border border-slate-700 bg-amber-600">{toBengaliDigits(Math.round(grandTotals.tUA - grandTotals.tSA))}</td>
               </tr>
            </tfoot>
          </table>
       </div>
    </div>
  );
};

export default ReturnView;
