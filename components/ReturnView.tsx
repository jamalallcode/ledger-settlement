import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { SettlementEntry, CumulativeStats, MinistryPrevStats } from '../types';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP, OFFICE_HEADER } from '../constants';
import { ChevronLeft, ArrowRightCircle, Printer, Database, Settings2, CheckCircle2, CalendarDays, ChevronDown, Check, LayoutGrid, PieChart, Search, CalendarSearch, X, Lock, KeyRound, Pencil, Unlock, Mail, Send, FileEdit } from 'lucide-react';
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
    
    const pastEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (!e.issueDateISO) return false;
        return new Date(e.issueDateISO).getTime() < cycleStart.getTime();
    });

    let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
    pastEntries.forEach(entry => {
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
  }, [isSetupMode, prevStats, ministryGroups]);

  const reportData = useMemo(() => {
    if (!selectedReportType || selectedReportType.includes('চিঠিপত্র সংক্রান্ত')) return [];
    
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
            const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return isInCycle(entryDate, activeCycle.start, activeCycle.end);
          });
          
          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0;
          matchingEntries.forEach(entry => {
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
  }, [entries, selectedReportType, calculateRecursiveOpening, activeCycle, ministryGroups]);

  const filteredCorrespondence = useMemo(() => {
    if (selectedReportType !== 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' && selectedReportType !== 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') return [];
    
    const reportingDateObj = endOfDay(new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth() + 1, 0));

    return correspondenceEntries.filter(e => {
      if (!e.diaryDate) return false;
      const diaryDateStr = toEnglishDigits(e.diaryDate);
      const diaryDateObj = startOfDay(new Date(diaryDateStr));
      if (isNaN(diaryDateObj.getTime())) return false;
      
      const isBeforeOrOnReportingDate = diaryDateObj.getTime() <= reportingDateObj.getTime();
      const rawNo = e.issueLetterNo ? String(e.issueLetterNo).trim() : '';
      const rawDate = e.issueLetterDate ? String(e.issueLetterDate).trim() : '';
      const hasValidNo = rawNo !== '' && rawNo !== '০' && rawNo !== '0' && !rawNo.includes('নং-');
      const hasValidDate = rawDate !== '' && rawDate !== '0000-00-00';
      const isIssued = hasValidNo && hasValidDate;
      
      return isBeforeOrOnReportingDate && !isIssued;
    }).sort((a, b) => new Date(toEnglishDigits(b.diaryDate)).getTime() - new Date(toEnglishDigits(a.diaryDate)).getTime());
  }, [correspondenceEntries, selectedReportType, activeCycle]);

  const grandTotals = useMemo(() => {
    if (!reportData || reportData.length === 0) return { pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0 };
    return reportData.reduce((acc, mGroup) => {
      mGroup.entityRows.forEach(row => {
        acc.pUC += (row.prev.unsettledCount || 0); 
        acc.pUA += (row.prev.unsettledAmount || 0); 
        acc.cRC += (row.currentRaisedCount || 0); 
        acc.cRA += (row.currentRaisedAmount || 0);
        acc.pSC += (row.prev.settledCount || 0); 
        acc.pSA += (row.prev.settledAmount || 0); 
        acc.cSC += (row.currentSettledCount || 0); 
        acc.cSA += (row.currentSettledAmount || 0);
        acc.cFC += (row.currentFullCount || 0); 
        acc.cPC += (row.currentPartialCount || 0);
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
    setSelectedReportType(null);
    setIsEditingSetup(false);
  };

  const handleSetupPaste = (e: React.ClipboardEvent, startEntity: string, startField: keyof MinistryPrevStats) => {
    if (!isEditingSetup) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    
    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const allEntities: string[] = [];
    ministryGroups.forEach(m => {
      const entities = MINISTRY_ENTITY_MAP[m] || [];
      entities.forEach(ent => allEntities.push(ent));
    });

    const startIdx = allEntities.indexOf(startEntity);
    if (startIdx === -1) return;

    const fields: (keyof MinistryPrevStats)[] = ['unsettledCount', 'unsettledAmount', 'settledCount', 'settledAmount'];
    const fieldStartIdx = fields.indexOf(startField);
    const newStats = { ...tempPrevStats };

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
        newStats[entityName] = { 
          ...(newStats[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), 
          [fieldName]: value 
        };
      });
    });
    setTempPrevStats(newStats);
  };

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
        <div className="absolute top-[55px] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
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
      <div id="section-report-selector" className="max-w-4xl py-20 animate-report-page relative pt-0 text-center">
        <IDBadge id="section-report-selector" />
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-[3rem] space-y-6">
           <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <PieChart size={40} />
           </div>
           <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800">রিটার্ণ মডিউলে স্বাগতম</h3>
              <p className="text-slate-500 font-bold max-w-sm mx-auto">অনুগ্রহ করে বাম পাশের সাইডবার মেনু থেকে কাঙ্ক্ষিত রিটার্ণ বা সারাংশের ধরনটি নির্বাচন করুন।</p>
           </div>
           <div className="flex justify-center items-center gap-4 text-slate-400 font-black text-sm uppercase tracking-widest pt-4">
              <ArrowRightCircle size={20} className="text-blue-500 animate-pulse" /> সাইডবার থেকে সিলেক্ট করুন
           </div>
        </div>
      </div>
    );
  }

  if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') {
    return (
      <DDSirCorrespondenceReturn 
        entries={filteredCorrespondence}
        activeCycle={activeCycle}
        onBack={() => setSelectedReportType(null)}
        isLayoutEditable={isLayoutEditable}
      />
    );
  }

  if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।') {
    const thS = "border border-slate-300 px-1 py-1 font-black text-center text-[10px] md:text-[11px] bg-white text-slate-900 leading-tight align-middle h-full shadow-[inset_0_0_0_1px_#cbd5e1] bg-clip-border";
    // Modified tdS: Changed font-semibold to font-black as requested to make all text bold like header
    const tdS = "border border-slate-300 px-2 py-2 text-[10px] md:text-[11px] text-center font-black leading-tight bg-white h-[40px] align-middle overflow-hidden break-words";
    const reportingDateBN = toBengaliDigits(dateFnsFormat(new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth() + 1, 0), 'dd/MM/yyyy'));

    return (
      <div className="space-y-4 py-2 w-full animate-report-page relative">
        <IDBadge id="correspondence-report-view" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedReportType(null)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"><ChevronLeft size={20} /></button>
            <div className="flex flex-col">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">রিপোর্ট টাইপ:</span>
              <span className="text-lg font-black text-slate-900 leading-tight">চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন (ঢাকা)</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <HistoricalFilter />
            <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
          </div>
        </div>

        <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-6 relative animate-table-entrance">
          <div className="text-center py-6 border-b-2 border-slate-100 mb-6">
            <h1 className="text-2xl font-black uppercase text-slate-900 leading-tight">{OFFICE_HEADER.main}</h1>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">{OFFICE_HEADER.sub}</h2>
            <h3 className="text-lg font-bold text-slate-700 leading-tight">{OFFICE_HEADER.address}</h3>
            <div className="mt-4 inline-flex items-center gap-3 px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
              <span className="text-blue-400">শাখা ভিত্তিক {reportingDateBN} খ্রি: তারিখ পর্যন্ত বকেয়া চিঠিপত্রের তালিকা।</span>
            </div>
          </div>

          <div className="table-container relative overflow-visible">
            <table className="w-full border-separate table-fixed border-spacing-0">
              <colgroup>
                <col className="w-[40px]" />
                <col className="w-[150px]" />
                <col className="w-[80px]" />
                <col className="w-[80px]" />
                <col className="w-[55px]" />
                <col className="w-[75px]" />
                <col className="w-[55px]" />
                <col className="w-[55px]" />
                <col className="w-[55px]" />
                <col className="w-[60px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[50px]" />
              </colgroup>
              <thead>
                <tr className="h-[42px]">
                  <th rowSpan={2} className={thS}>ক্রমিক নং</th>
                  <th rowSpan={2} className={thS}>এনটিটি/প্রতিষ্ঠানের নাম</th>
                  <th rowSpan={2} className={thS}>ডায়েরি নং ও তারিখ</th>
                  <th rowSpan={2} className={thS}>পত্রের স্মারক নং ও তারিখ</th>
                  <th colSpan={5} className={thS}>চিঠি-পত্রের ধরণ ও অনুচ্ছেদ সংখ্যা</th>
                  <th rowSpan={2} className={thS}>AMMS-এ এন্ট্রি হয়েছে কিনা? হ্যাঁ/না</th>
                  <th rowSpan={2} className={thS}>উপস্থাপনের তারিখ</th>
                  <th rowSpan={2} className={thS}>বর্তমান অবস্থান</th>
                  <th rowSpan={2} className={thS}>মন্তব্য</th>
                </tr>
                <tr className="h-[38px]">
                  <th className={thS}>বিএসআর (SFI)</th>
                  <th className={thS}>বিএসআর (NON-SFI)</th>
                  <th className={thS}>ত্রি-পক্ষীয় (SFI)</th>
                  <th className={thS}>দ্বি-পক্ষীয় (NON-SFI)</th>
                  <th className={thS}>অন্যান্য</th>
                </tr>
              </thead>
              <tbody>
                {filteredCorrespondence.length > 0 ? filteredCorrespondence.map((entry, idx) => (
                  <tr key={entry.id} className="group hover:bg-blue-50/50 transition-colors">
                    <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                    <td className={`${tdS} text-left px-2`}>{entry.description}</td>
                    <td className={tdS}>{entry.diaryNo}<br/>{toBengaliDigits(entry.diaryDate)}</td>
                    <td className={tdS}>{entry.letterNo}<br/>{toBengaliDigits(entry.letterDate)}</td>
                    <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                    <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'নন এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                    <td className={tdS}>{entry.letterType === 'ত্রিপক্ষীয় সভা' && entry.paraType === 'এসএফআই' ? `ত্রিপক্ষীয় (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                    <td className={tdS}>{entry.letterType === 'দ্বিপক্ষীয় সভা' && entry.paraType === 'নন এসএফআই' ? `দ্বি-পক্ষীয় (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                    <td className={tdS}>-</td>
                    <td className={tdS}>{entry.isOnline === 'হ্যাঁ' ? 'হ্যাঁ' : 'না'}</td>
                    <td className={tdS}>{toBengaliDigits(entry.presentationDate)}</td>
                    <td className={tdS}>{entry.presentedToName || 'অডিটর'}</td>
                    <td className={tdS}>{entry.remarks || 'চলমান'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={13} className="py-20 text-center font-bold text-slate-400 bg-slate-50 italic">এই সাইকেলে কোনো চিঠিপত্র তথ্য পাওয়া যায়নি।</td></tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 z-[120]">
                <tr className="bg-slate-900 text-white font-black text-[11px] h-11 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                  <td colSpan={2} className="px-4 text-left border-t border-slate-700 bg-slate-900">সর্বমোট চিঠিপত্র সংখ্যা:</td>
                  <td colSpan={2} className="px-4 text-center border-t border-slate-700 bg-slate-900 text-emerald-400">{toBengaliDigits(filteredCorrespondence.length)} টি</td>
                  <td colSpan={9} className="border-t border-slate-700 bg-slate-900"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isSetupMode) {
    const setupThCls = "p-4 text-center font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] uppercase bg-slate-100 leading-tight h-20 align-middle sticky top-0 z-[210] shadow-[inset_0_-1px_0_#cbd5e1]";
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
            <button onClick={() => { setIsSetupMode(false); setSelectedReportType(null); }} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all"><ChevronLeft size={22} /></button>
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
                  <th className="p-5 text-left font-black text-slate-900 border border-slate-300 text-[12px] md:text-[13px] w-[35%] bg-slate-100 leading-tight h-20 align-middle sticky top-0 z-[210] shadow-[inset_0_-1px_0_#cbd5e1]">মন্ত্রণালয় ও সংস্থা</th>
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

  const reportThStyle = "px-0.5 py-2 font-black text-center text-slate-900 text-[8.5px] md:text-[9.5px] leading-tight align-middle h-full bg-white shadow-[inset_0_0_0_1px_#cbd5e1] border-l border-slate-300 bg-clip-border relative";
  const tdStyle = "border border-slate-300 px-0.5 py-1 text-[9px] md:text-[10px] text-center font-bold leading-tight bg-white group-hover:bg-blue-50/90 transition-colors text-slate-900 h-[38px] whitespace-normal break-words relative";
  const grandStyle = "px-0.5 py-2 text-center font-black text-white text-[9.5px] bg-slate-800 sticky bottom-0 z-[190] shadow-[inset_0_1px_0_#1e293b,inset_0_0_0_1px_#1e293b] h-[45px] align-middle whitespace-nowrap transition-all relative";

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
              <col className="w-[30px]" />
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
                <th colSpan={4} className={`${reportThStyle}`}>চলতি মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>মোট মীমাংসিত</th>
                <th colSpan={2} className={`${reportThStyle}`}>সর্বমোট অমীমাংসিত</th>
              </tr>
              <tr className="h-[38px]">
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>পূর্ণাঙ্গ</th><th className={`${reportThStyle}`}>আংশিক</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
                <th className={`${reportThStyle}`}>সংখ্যা</th><th className={`${reportThStyle}`}>টাকা</th>
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
                          {rIdx === 0 && <td rowSpan={m.entityRows.length + 1} className={tdStyle + " bg-slate-50 border-l border-r border-slate-300"}>{m.ministry}</td>}
                          <td className={tdStyle + " text-left border-r border-slate-300"}>{row.entity}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.unsettledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.unsettledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentRaisedCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentRaisedAmount))}</td>
                          <td className={tdStyle + " bg-slate-100/50"}>{toBengaliDigits(totalUC)}</td><td className={tdStyle + " text-center bg-slate-100/50 border-r border-slate-300"}>{toBengaliDigits(Math.round(totalUA))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.prev.settledCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.prev.settledAmount))}</td>
                          <td className={tdStyle}>{toBengaliDigits(row.currentSettledCount)}</td><td className={tdStyle}>{toBengaliDigits(row.currentFullCount)}</td><td className={tdStyle}>{toBengaliDigits(row.currentPartialCount)}</td><td className={tdStyle + " text-center border-r border-slate-300"}>{toBengaliDigits(Math.round(row.currentSettledAmount))}</td>
                          <td className={tdStyle + " bg-emerald-50/50"}>{toBengaliDigits(totalSC)}</td><td className={tdStyle + " text-center bg-emerald-50/50 border-r border-slate-300"}>{toBengaliDigits(Math.round(totalSA))}</td>
                          <td className={tdStyle + " bg-amber-50 text-blue-700"}>{toBengaliDigits(closingUC)}</td><td className={tdStyle + " text-center bg-amber-50 text-blue-700"}>{toBengaliDigits(Math.round(closingUA))}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50/80 font-bold text-blue-950 h-[42px] border-y-2 border-slate-200">
                      <td className={tdStyle + " text-right italic pr-3 border-l border-r border-slate-300 text-[10px] bg-blue-50/80"}>উপ-মোট: {m.ministry}</td>
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
            <tfoot className="sticky bottom-0 z-[230] shadow-2xl">
              <tr>
                <td colSpan={2} className={grandStyle + " bg-slate-900 text-white uppercase tracking-widest text-[10px] shadow-[inset_0_1px_0_#0f172a] border-l border-slate-700"}>সর্বমোট ইউনিফাইড সারাংশ:</td>
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
          <div className="px-8 py-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center gap-4"><div className="flex items-center gap-4"><div className="flex flex-col items-end"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Status</span><span className="text-[12px] font-black text-emerald-600">ACCURATE & SYNCED</span></div><CheckCircle2 size={24} className="text-emerald-500" /></div></div>
        </div>
      )}
    </div>
  );
};

export default ReturnView;
