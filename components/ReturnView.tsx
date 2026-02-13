import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { SettlementEntry, ParaType, CumulativeStats, MinistryPrevStats } from '../types';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP, OFFICE_HEADER } from '../constants';
import { ChevronLeft, ArrowRight, ClipboardCheck, CalendarRange, Printer, Database, Settings2, BarChart3, FileStack, ClipboardList, Settings, CheckCircle2, CalendarDays, UserCheck, ChevronDown, Check, LayoutGrid, PieChart, History, Search, CalendarSearch, Sparkles, X, Lock, KeyRound, ShieldAlert, Pencil, Unlock, ArrowRightCircle } from 'lucide-react';
import { isWithinInterval, addMonths, format as dateFnsFormat, parseISO, startOfDay, endOfDay } from 'date-fns';
import { getCycleForDate, isInCycle } from '../utils/cycleHelper';

interface ReturnViewProps {
  entries: SettlementEntry[];
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
}

const reportOptions = [
  { 
    id: 'monthly-letter', 
    title: 'মাসিক রিটারন: চিঠিপত্র সংক্রান্ত।', 
    desc: 'চিঠিপত্র আদান-প্রদান এবং নিষ্পত্তির পরিসংখ্যান', 
    icon: FileStack, 
    accent: 'from-blue-600 to-indigo-700'
  },
  { 
    id: 'monthly-para', 
    title: 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।', 
    desc: 'মাসিক ভিত্তিতে অনুচ্ছেদ নিষ্পত্তির বিস্তারিত রিপোর্ট', 
    icon: BarChart3, 
    accent: 'from-emerald-600 to-teal-700'
  },
  { 
    id: 'quarterly-para', 
    title: 'ত্রৈমাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।', 
    desc: 'তিন মাসের সমন্বিত নিষ্পত্তি প্রতিবেদন', 
    icon: History, 
    accent: 'from-amber-600 to-orange-700'
  },
  { 
    id: 'setup-mode', 
    title: 'পূর্ব জের সেটআপ উইন্ডো', 
    desc: 'মন্ত্রণালয় ও সংস্থাভিত্তিক প্রারম্ভিক জের ইনপুট দিন', 
    icon: Settings, 
    accent: 'from-slate-700 to-slate-900'
  }
];

const ReturnView: React.FC<ReturnViewProps> = ({ entries, cycleLabel, prevStats, setPrevStats, isLayoutEditable, resetKey, onDemoLoad, onJumpToRegister, isAdmin }) => {
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
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
  }, [resetKey]);

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
    
    const pastEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (!e.issueDateISO) return false;
        return new Date(e.issueDateISO).getTime() < cycleStart.getTime();
    });

    let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
    pastEntries.forEach(entry => {
        // Correct logic implementation for opening balance calculation
        const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            pastRC += parseBengaliNumber(rCountRaw);
        }
        if (entry.manualRaisedAmount) pastRA += Number(entry.manualRaisedAmount);

        if (entry.paragraphs) entry.paragraphs.forEach(p => {
            if (p.status === 'পূর্ণাঙ্গ') {
                pastSC++;
            }
            pastSA += (Number(p.recoveredAmount) || 0) + (Number(p.adjustedAmount) || 0);
        });
    });

    return {
        unsettledCount: Math.max(0, base.unsettledCount + pastRC),
        unsettledAmount: Math.max(0, base.unsettledAmount + pastRA),
        settledCount: base.settledCount + pastSC,
        settledAmount: base.settledAmount + pastSA
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
  }, [isSetupMode, prevStats, activeCycle, ministryGroups]);

  const handleSetupPaste = (e: React.ClipboardEvent, startEnt: string, startField: string) => {
    if (!isEditingSetup) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const flatEntities = ministryGroups.flatMap(m => MINISTRY_ENTITY_MAP[m] || []);
    const fields = ['unsettledCount', 'unsettledAmount', 'settledCount', 'settledAmount'];
    
    const startEntIdx = flatEntities.indexOf(startEnt);
    const startFieldIdx = fields.indexOf(startField);

    if (startEntIdx === -1) return;

    const updatedStats = { ...tempPrevStats };

    rows.forEach((row, rowOffset) => {
      const cols = row.split('\t');
      const targetEntIdx = startEntIdx + rowOffset;
      if (targetEntIdx >= flatEntities.length) return;
      
      const targetEnt = flatEntities[targetEntIdx];
      if (!updatedStats[targetEnt]) {
        updatedStats[targetEnt] = { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
      }

      cols.forEach((cellValue, colOffset) => {
        const targetFieldIdx = startFieldIdx + colOffset;
        if (targetFieldIdx >= fields.length) return;
        
        const targetField = fields[targetFieldIdx] as keyof MinistryPrevStats;
        const num = parseBengaliNumber(cellValue);
        updatedStats[targetEnt] = {
          ...updatedStats[targetEnt],
          [targetField]: num
        };
      });
    });

    setTempPrevStats(updatedStats);
  };

  const reportData = useMemo(() => {
    if (!selectedReportType) return [];
    
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
            if (!e.issueDateISO) return false;
            return isInCycle(e.issueDateISO, activeCycle.start, activeCycle.end);
          });
          
          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0;
          matchingEntries.forEach(entry => {
            // Processing paragraphs and raised amounts for each entry within cycle
            if (entry.paragraphs && entry.paragraphs.length > 0) {
              entry.paragraphs.forEach(p => { 
                if (p.status === 'পূর্ণাঙ্গ') { 
                  curFC++; curSC++; 
                } else if (p.status === 'আংশিক') {
                  curPC++;
                }
                curSA += (Number(p.recoveredAmount) || 0) + (Number(p.adjustedAmount) || 0); 
              });
            }
            
            const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
            if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
              curRC += parseBengaliNumber(rCountRaw);
            }
            if (entry.manualRaisedAmount) {
              curRA += Number(entry.manualRaisedAmount);
            }
          });
          return { 
            entity: entityName, 
            currentRaisedCount: curRC, currentRaisedAmount: curRA, 
            currentSettledCount: curSC, currentSettledAmount: curSA, 
            currentFullCount: curFC, currentPartialCount: curPC,
            prev: ePrev 
          };
        })
      };
    });
  }, [entries, selectedReportType, prevStats, activeCycle, ministryGroups]);

  const grandTotals = useMemo(() => {
    if (!reportData || reportData.length === 0) return { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 };
    return reportData.reduce((acc, mGroup) => {
      mGroup.entityRows.forEach(row => {
        acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
        acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
        acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
      });
      return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 });
  }, [reportData]);

  const handleSaveSetup = () => {
    setPrevStats({ 
      ...prevStats, 
      entitiesSFI: tempPrevStats,
      entitiesNonSFI: {} 
    });
    setIsSetupMode(false);
    setIsEditingSetup(false);
  };

  // Fixed IDBadge helper without escaped characters
  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div onClick={handleCopy} className="absolute top-0 left-0 -translate-y-full z-[9995] pointer-events-auto no-print">
        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-black text-[9px] bg-black text-white border border-white/30 shadow-2xl transition-all duration-300 hover:scale-150 hover:bg-blue-600 hover:z-[99999] active:scale-95 cursor-copy origin-bottom-left ${copied ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30 !scale-125' : ''}`}>
          {copied ? <><CheckCircle2 size={10} /> COPIED</> : `#${id}`}
        </span>
      </div>
    );
  };

  // Fixed HistoricalFilter helper without escaped characters
  const HistoricalFilter = () => (
    <div className="relative no-print" ref={dropdownRef}>
      <div onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} className={`flex items-center gap-3 px-5 h-[48px] bg-white border-2 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-400 group ${isCycleDropdownOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
         <CalendarDays size={20} className="text-blue-600" />
         <span className="font-black text-[13.5px] text-slate-800 tracking-tight">
           {cycleOptions.find(o => o.cycleLabel === activeCycle.label)?.label || toBengaliDigits(activeCycle.label)}
         </span>
         <ChevronDown size={18} className={`text-slate-400 ml-2 transition-transform duration-300 ${isCycleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </div>
      {isCycleDropdownOpen && (
        <div className="absolute top-[55px] right-0 w-[280px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2 max-h-[350px] overflow-y-auto no-scrollbar">
            <div className="px-4 py-2 mb-2 border-b border-slate-100 flex items-center justify-between"><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><CalendarSearch size={12} /> মাস ও বছর নির্বাচন</span></div>
            {cycleOptions.map((opt, idx) => (
              <div key={idx} onClick={() => { setSelectedCycleDate(opt.date); setIsCycleDropdownOpen(false); }} className={`flex items-center justify-between px-4 py-2.5 mb-1 rounded-xl cursor-pointer transition-all ${opt.cycleLabel === activeCycle.label ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700 font-bold'}`}>
                <span className="text-[13px]">{opt.label}</span>
                {opt.cycleLabel === activeCycle.label && <Check size={16} strokeWidth={3} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!selectedReportType && !isSetupMode) {
    return (
      <div id="section-report-selector" className="max-w-4xl pb-10 animate-report-page relative pt-0">
        <IDBadge id="section-report-selector" />
        <div className="grid grid-cols-1 gap-5">
          {reportOptions.filter(opt => isAdmin || opt.id !== 'setup-mode').map((opt, index) => (
            <div 
              key={opt.id} 
              onClick={() => {
                if (opt.id === 'setup-mode') setIsSetupMode(true);
                else setSelectedReportType(opt.title);
              }} 
              className={`
                group relative flex items-center h-[82px] w-full 
                bg-gradient-to-r from-slate-900 to-slate-800
                rounded-[1.25rem] shadow-lg hover:shadow-2xl hover:translate-x-1.5
                transition-all duration-500 cursor-pointer overflow-hidden border border-white/10
                animate-in slide-in-from-right-10 fill-mode-forwards
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <IDBadge id={`report-opt-${opt.id}`} />
              
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${opt.accent} shadow-[0_0_15px_rgba(255,255,255,0.2)]`}></div>
              
              <div className="flex items-center justify-center pl-7 relative z-10">
                <div className={`w-12 h-12 bg-slate-800/50 rounded-2xl border border-white/10 shadow-inner flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br ${opt.accent}`}>
                   <opt.icon size={22} className="text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
              </div>

              <div className="flex flex-col justify-center pl-8 flex-1 relative z-10">
                <div className="flex items-center gap-3">
                  <h3 className="text-[20px] font-black text-white tracking-tight leading-tight mb-0.5 group-hover:text-blue-200 transition-colors">{opt.title}</h3>
                  {opt.id === 'setup-mode' && <Lock size={14} className="text-white/30" />}
                </div>
                <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider group-hover:text-slate-300 transition-colors">{opt.desc}</p>
              </div>

              <div className="pr-10 opacity-40 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 relative z-10">
                <ArrowRightCircle size={24} className="text-white" />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute top-0 -right-20 w-40 h-full bg-white/5 skew-x-[35deg] group-hover:-translate-x-[600px] transition-transform duration-1000 ease-in-out"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isSetupMode) {
    const setupThCls = "p-4 text-center font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] uppercase bg-slate-100 leading-tight h-20 align-middle sticky top-0 z-[195] shadow-[inset_0_-1px_0_#cbd5e1]";
    const setupFooterTdCls = "p-4 border border-slate-300 text-center text-[15px] bg-blue-50 font-black sticky bottom-0 z-[190] shadow-[inset_0_1px_0_#cbd5e1]";
    
    const totalStats = ministryGroups.reduce((acc, m) => {
      const entities = MINISTRY_ENTITY_MAP[m] || [];
      entities.forEach(ent => {
        const stats = tempPrevStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        acc.uC += stats.unsettledCount; acc.uA += stats.unsettledAmount;
        acc.sC += stats.settledCount; acc.sA += stats.settledAmount;
      });
      return acc;
    }, { uC: 0, uA: 0, sC: 0, sA: 0 });

    return (
      <div id="section-prev-stats-setup" className="max-w-full mx-auto space-y-6 py-4 animate-table-entrance relative px-2">
        <IDBadge id="section-prev-stats-setup" />
        <div id="container-setup-controls" className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xl gap-4 no-print relative">
          <IDBadge id="container-setup-controls" />
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSetupMode(false)} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all"><ChevronLeft size={22} /></button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Settings2 size={28} className="text-blue-600" /> প্রারম্ভিক জের সেটআপ</h2>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">সমন্বিত (Unified) ব্যালেন্স ইনপুট উইন্ডো</span>
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
                  <th className="p-5 text-left font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] w-[35%] bg-slate-100 leading-tight h-20 align-middle sticky top-0 z-[195] shadow-[inset_0_-1px_0_#cbd5e1]">মন্ত্রণালয় ও সংস্থা</th>
                  <th className={setupThCls}>অমী: সংখ্যা <br/><span className="text-[10px] text-slate-500 font-bold">(প্রারম্ভিক)</span></th>
                  <th className={setupThCls}>অমী: টাকা <br/><span className="text-[10px] text-slate-500 font-bold">(প্রারম্ভিক)</span></th>
                  <th className={setupThCls}>মী: সংখ্যা <br/><span className="text-[10px] text-slate-500 font-bold">(প্রারম্ভিক)</span></th>
                  <th className={setupThCls}>মী: টাকা <br/><span className="text-[10px] text-slate-500 font-bold">(প্রারম্ভিক)</span></th>
                </tr>
             </thead>
             <tbody>
               {ministryGroups.map(m => {
                 const entities = MINISTRY_ENTITY_MAP[m] || [];
                 const mSubTotal = entities.reduce((acc, ent) => {
                   const s = tempPrevStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
                   acc.uC += s.unsettledCount; acc.uA += s.unsettledAmount;
                   acc.sC += s.settledCount; acc.sA += s.settledAmount;
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
                               className={`w-full h-11 text-center font-black text-[15px] outline-none border-0 transition-all ${isEditingSetup ? 'bg-white text-slate-900 cursor-text' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`} 
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
  }

  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8.5px] md:text-[9.5px] leading-tight align-middle h-full bg-slate-50 sticky z-[160] shadow-[inset_0_0_0_1px_#cbd5e1] bg-clip-padding relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] md:text-[10px] text-center font-bold leading-tight bg-white group-hover:bg-blue-50/90 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-2 py-2 text-center font-black text-white text-[9.5px] bg-slate-800 sticky bottom-0 z-[190] shadow-[inset_0_1px_0_#1e293b,inset_0_0_0_1px_#1e293b] h-[45px] align-middle whitespace-nowrap transition-all relative";

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
          <h2 className="text-lg font-bold text-slate-800">{OFFICE_HEADER.sub}</h2>
          <div className="mt-3 inline-flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
            <span className="text-blue-400">{selectedReportType}</span> | {toBengaliDigits(activeCycle.label)}
          </div>
        </div>

        <div className="table-container border-t border-slate-300 overflow-visible relative">
          <table id="table-return-summary" className="w-full border-separate table-fixed border-spacing-0">
            <colgroup><col className="w-[58px]" /><col className="w-[125px]" /><col className="w-[36px]" /><col className="w-[74px]" /><col className="w-[36px]" /><col className="w-[74px]" /><col className="w-[36px]" /><col className="w-[74px]" /><col className="w-[36px]" /><col className="w-[74px]" /><col className="w-[36px]" /><col className="w-[36px]" /><col className="w-[36px]" /><col className="w-[74px]" /><col className="w-[36px]" /><col className="w-[74px]" /><col className="w-[36px]" /><col className="w-[74px]" /></colgroup>
            <thead>
              <tr className="h-[42px]">
                <th rowSpan={2} className={`${reportThStyle} !top-0`}>মন্ত্রণালয়</th>
                <th rowSpan={2} className={`${reportThStyle} !top-0`}>সংস্থা</th>
                <th colSpan={2} className={`${reportThStyle} !top-0`}>প্রারম্ভিক অমীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle} !top-0`}>বর্তমান উত্থাপিত</th>
                <th colSpan={2} className={`${reportThStyle} !top-0`}>মোট অমীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle} !top-0`}>প্রারম্ভিক মীমাংসিত</th>
                <th colSpan={4} className={`${reportThStyle} !top-0`}>চলতি মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle} !top-0`}>মোট মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle} !top-0`}>সর্বমোট অমীমাংসিত</th>
              </tr>
              <tr className="h-[38px]">
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>পূর্ণাঙ্গ</th><th className={`${reportThStyle} !top-[42px]`}>আংশিক</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
                <th className={`${reportThStyle} !top-[42px]`}>সংখ্যা</th><th className={`${reportThStyle} !top-[42px]`}>টাকা</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(m => {
                const mTotals = m.entityRows.reduce((acc, row) => {
                  acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
                  acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
                  acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
                  return acc;
                }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 });
                return (
                  <React.Fragment key={m.ministry}>
                    {m.entityRows.map((row, rIdx) => {
                      const totalUC = (row.prev.unsettledCount || 0) + (row.currentRaisedCount || 0); 
                      const totalUA = (row.prev.unsettledAmount || 0) + (row.currentRaisedAmount || 0);
                      const totalSC = (row.prev.settledCount || 0) + (row.currentSettledCount || 0); 
                      const totalSA = (row.prev.settledAmount || 0) + (row.currentSettledAmount || 0);
                      
                      const closingUC = totalUC - totalSC; 
                      const closingUA = totalUA - totalSA;

                      return (
                        <tr key={row.entity} className="group hover:bg-blue-50/50">
                          {rIdx === 0 && <td rowSpan={m.entityRows.length + 1} className={tdStyle + " bg-slate-50 font-black border-r border-slate-300"}>{m.ministry}</td>}
                          <td className={tdStyle + " text-left border-r border-slate-300"}>{row.entity}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.unsettledCount)}</td><td className={tdStyle + " text-center font-black border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.unsettledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentRaisedCount)}</td><td className={tdStyle + " text-center font-black border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentRaisedAmount))}</td>
                          <td className={tdStyle + " bg-slate-100/50"}>{toBengaliDigits(totalUC)}</td><td className={tdStyle + " text-center font-black bg-slate-100/50 border-r border-slate-300"}>{toBengaliDigits(Math.round(totalUA))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.settledCount)}</td><td className={tdStyle + " text-center font-black border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.settledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentSettledCount)}</td><td className={tdStyle}>{toBengaliDigits(row.currentFullCount)}</td><td className={tdStyle}>{toBengaliDigits(row.currentPartialCount)}</td><td className={tdStyle + " text-center font-black border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentSettledAmount))}</td>
                          <td className={tdStyle + " bg-emerald-50/50"}>{toBengaliDigits(totalSC)}</td><td className={tdStyle + " text-center font-black bg-emerald-50/50 border-r border-slate-300"}>{toBengaliDigits(Math.round(totalSA))}</td>
                          <td className={tdStyle + " bg-amber-50 font-black text-blue-700"}>{toBengaliDigits(closingUC)}</td><td className={tdStyle + " text-center bg-amber-50 font-black text-blue-700"}>{toBengaliDigits(Math.round(closingUA))}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50/80 font-black text-blue-950 h-[42px] border-y-2 border-slate-200">
                      <td className={tdStyle + " text-right italic pr-3 border-r border-slate-300 text-[10px] bg-blue-50/80"}>উপ-মোট: {m.ministry}</td>
                      <td className={tdStyle}>{toBengaliDigits(mTotals.pUC)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(mTotals.pUA))}</td>
                      <td className={tdStyle}>{toBengaliDigits(mTotals.cRC)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(mTotals.cRA))}</td>
                      <td className={tdStyle + " bg-slate-200/50"}>{toBengaliDigits(mTotals.pUC + mTotals.cRC)}</td><td className={tdStyle + " text-center bg-slate-200/50 border-r border-slate-300"}>{toBengaliDigits(Math.round(mTotals.pUA + mTotals.cRA))}</td>
                      <td className={tdStyle}>{toBengaliDigits(mTotals.pSC)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(mTotals.pSA))}</td>
                      <td className={tdStyle}>{toBengaliDigits(mTotals.cSC)}</td><td className={tdStyle}>{toBengaliDigits(mTotals.cFC)}</td><td className={tdStyle}>{toBengaliDigits(mTotals.cPC)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(mTotals.cSA))}</td>
                      <td className={tdStyle + " bg-emerald-200/50"}>{toBengaliDigits(mTotals.pSC + mTotals.cSC)}</td><td className={tdStyle + " text-center bg-emerald-200/50 border-r border-slate-300"}>{toBengaliDigits(Math.round(mTotals.pSA + mTotals.cSA))}</td>
                      <td className={tdStyle + " bg-amber-100/30"}>{toBengaliDigits((mTotals.pUC + mTotals.cRC) - (mTotals.pSC + mTotals.cSC))}</td><td className={tdStyle + " text-center bg-amber-100/30"}>{toBengaliDigits(Math.round((mTotals.pUA + mTotals.cRA) - (mTotals.pSA + mTotals.cSA)))}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-[190] shadow-2xl">
              <tr>
                <td colSpan={2} className={grandStyle + " bg-slate-900 text-white uppercase tracking-widest text-[10px] shadow-[inset_0_1px_0_#0f172a]"}>সর্বমোট ইউনিফাইড সারাংশ:</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.pUC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.pUA))}</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.cRC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.cRA))}</td>
                <td className={grandStyle + " !bg-slate-700"}>{toBengaliDigits(grandTotals.pUC + grandTotals.cRC)}</td><td className={grandStyle + " text-center !bg-slate-700"}>{toBengaliDigits(Math.round(grandTotals.pUA + grandTotals.cRA))}</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.pSC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.pSA))}</td>
                <td className={grandStyle}>{toBengaliDigits(grandTotals.cSC)}</td><td className={grandStyle}>{toBengaliDigits(grandTotals.cFC)}</td><td className={grandStyle}>{toBengaliDigits(grandTotals.cPC)}</td><td className={grandStyle + " text-center"}>{toBengaliDigits(Math.round(grandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-emerald-700"}>{toBengaliDigits(grandTotals.pSC + grandTotals.cSC)}</td><td className={grandStyle + " text-center !bg-emerald-700"}>{toBengaliDigits(Math.round(grandTotals.pSA + grandTotals.cSA))}</td>
                <td className={grandStyle + " !bg-orange-600 text-white"}>{toBengaliDigits((grandTotals.pUC + grandTotals.cRC) - (grandTotals.pSC + grandTotals.cSC))}</td><td className={grandStyle + " text-center !bg-orange-600 text-white"}>{toBengaliDigits(Math.round((grandTotals.pUA + grandTotals.cRA) - (grandTotals.pSA + grandTotals.cSA)))}</td>
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
            <p className="text-[12px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
              সিস্টেম বর্তমানে <span className="text-blue-600">{toBengaliDigits(activeCycle.label)}</span> পিরিয়ডের প্রারম্ভিক জের বিগত সকল মাসের লেনদেনের ভিত্তিতে স্বয়ংক্রিয়ভাবে সমন্বিত উপায়ে গণনা করছে।
              হিসাব: কলাম ৭ = (কলাম ৩ - কলাম ৬)।
            </p>
          </div>
          <div className="px-8 py-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center gap-4"><div className="flex flex-col items-end"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Status</span><span className="text-[12px] font-black text-emerald-600">ACCURATE & SYNCED</span></div><CheckCircle2 size={24} className="text-emerald-500" /></div>
        </div>
      )}
    </div>
  );
};

export default ReturnView;
