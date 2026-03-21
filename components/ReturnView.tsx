import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { SettlementEntry, CumulativeStats, MinistryPrevStats } from '../types';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP } from '../constants';
import { Printer, ChevronDown, Check, CalendarDays, CalendarSearch, PieChart, ArrowRightCircle, CheckCircle2, Search, X, LayoutGrid } from 'lucide-react';
import { addMonths, format as dateFnsFormat, endOfDay, startOfDay } from 'date-fns';
import { getCycleForDate } from '../utils/cycleHelper';
import DDSirCorrespondenceReturn from './DDSirCorrespondenceReturn';
import CorrespondenceDhakaReturn from './CorrespondenceDhakaReturn';
import OpeningBalanceSetup from './OpeningBalanceSetup';
import ReturnSummaryTable from './ReturnSummaryTable';
import QR_1 from './QR_1';
import QR_2 from './QR_2';
import QR_3 from './QR_3';
import QR_4 from './QR_4';
import QR_5 from './QR_5';
import QR_6 from './QR_6';

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
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
}

const ReturnView: React.FC<ReturnViewProps> = ({ 
  entries, correspondenceEntries = [], cycleLabel, prevStats, setPrevStats, 
  isLayoutEditable, resetKey, onDemoLoad, onJumpToRegister, isAdmin,
  selectedReportType, setSelectedReportType,
  showFilters, setShowFilters
}) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [tempPrevStats, setTempPrevStats] = useState<Record<string, MinistryPrevStats>>({});
  
  const [selectedCycleDate, setSelectedCycleDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMinistry, setFilterMinistry] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ministryDropdownRef = useRef<HTMLDivElement>(null);

  const ministryGroups = useMemo(() => ['আর্থিক প্রতিষ্ঠান বিভাগ', 'পাট মন্ত্রণালয়', 'বস্ত্র মন্ত্রণালয়', 'শিল্প মন্ত্রণালয়', 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়', 'বাণিজ্য মন্ত্রণালয়'], []);

  useEffect(() => {
    if (resetKey && resetKey > 0) {
      setSelectedReportType(null);
      setIsSetupMode(false);
      setSelectedCycleDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
  }, [resetKey, setSelectedReportType]);

  useEffect(() => {
    if (selectedReportType?.includes('প্রারম্ভিক জের সেটআপ')) {
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
      if (ministryDropdownRef.current && !ministryDropdownRef.current.contains(event.target as Node)) {
        setIsMinistryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleOptions = useMemo(() => {
    const options = [];
    const banglaMonths: Record<string, string> = {
      'January': 'জানুয়ারি', 'February': 'ফেব্রুয়ারি', 'March': 'মার্চ', 'April': 'এপ্রিল',
      'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
      'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর'
    };

    const today = new Date();
    for (let i = -1; i < 23; i++) {
      const refDate = addMonths(today, -i);
      const firstOfTargetMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      const cycle = getCycleForDate(firstOfTargetMonth);
      const monthNameEng = dateFnsFormat(firstOfTargetMonth, 'MMMM');
      const yearEng = dateFnsFormat(firstOfTargetMonth, 'yyyy');
      const label = `${banglaMonths[monthNameEng]}/${toBengaliDigits(yearEng)}`;
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
    const activeLabelCanon = toEnglishDigits(activeCycle.label).trim();
    
    const pastEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (e.cycleLabel && toEnglishDigits(e.cycleLabel).trim() === activeLabelCanon) return false;
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
        if (entry.manualRaisedAmount) pastRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

        if (entry.paragraphs) {
          entry.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              const status = robustNormalize(p.status || '');
              const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
              if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  pastSC++; 
              }
              pastSA += settledAmt;
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
    const activeLabelCanon = toEnglishDigits(activeCycle.label).trim();

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
            if (e.cycleLabel) return toEnglishDigits(e.cycleLabel).trim() === activeLabelCanon;
            const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return entryDate >= cycleStartStr && entryDate <= cycleEndStr;
          });
          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0, curSFIC = 0, curNonSFIC = 0, sfiSA = 0, nonSfiSA = 0;
          let sfiBSR = 0, sfiTriWork = 0, sfiTriMin = 0, sfiRecon = 0;
          let nonSfiBSR = 0, nonSfiBiWork = 0, nonSfiBiMin = 0, nonSfiRecon = 0;

          const processedParaIds = new Set<string>();
          matchingEntries.forEach(entry => {
            const isSFI = robustNormalize(entry.paraType || '') === robustNormalize('এসএফআই');
            const letterType = entry.letterType || '';

            if (entry.paragraphs && entry.paragraphs.length > 0) {
              entry.paragraphs.forEach(p => { 
                const cleanParaNo = String(p.paraNo || '').trim();
                const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
                if (p.id && !processedParaIds.has(p.id) && hasDigit) {
                  processedParaIds.add(p.id);
                  const status = robustNormalize(p.status || '');
                  const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                  
                  if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                    curFC++; curSC++; 
                    
                    if (isSFI) {
                      curSFIC++;
                      if (letterType === 'বিএসআর') sfiBSR++;
                      else if (letterType === 'ত্রিপক্ষীয় সভা (কার্যপত্র)') sfiTriWork++;
                      else if (letterType === 'ত্রিপক্ষীয় সভা (কার্যবিবরণী)') sfiTriMin++;
                      else if (letterType === 'মিলিকরণ') sfiRecon++;
                      sfiSA += settledAmt;
                    } else {
                      curNonSFIC++;
                      if (letterType === 'বিএসআর') nonSfiBSR++;
                      else if (letterType === 'দ্বিপক্ষীয় সভা (কার্যপত্র)') nonSfiBiWork++;
                      else if (letterType === 'দ্বিপক্ষীয় সভা (কার্যবিবরণী)') nonSfiBiMin++;
                      else if (letterType === 'মিলিকরণ') nonSfiRecon++;
                      nonSfiSA += settledAmt;
                    }
                    curSA += settledAmt;
                  } else if (status === robustNormalize('আংশিক')) {
                    curPC++;
                  }
                }
              });
            }
            const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
            if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") curRC += parseBengaliNumber(rCountRaw);
            if (entry.manualRaisedAmount) curRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));
          });
          return { 
            entity: entityName, 
            currentRaisedCount: curRC, currentRaisedAmount: curRA,
            currentSettledCount: curSC, currentSettledAmount: curSA,
            currentFullCount: curFC, currentPartialCount: curPC,
            currentSFICount: curSFIC, currentNonSFICount: curNonSFIC,
            currentSFIAmount: sfiSA, currentNonSFIAmount: nonSfiSA,
            sfiBreakdown: { bsr: sfiBSR, triWork: sfiTriWork, triMin: sfiTriMin, recon: sfiRecon },
            nonSfiBreakdown: { bsr: nonSfiBSR, biWork: nonSfiBiWork, biMin: nonSfiBiMin, recon: nonSfiRecon },
            prev: ePrev 
          };
        })
      };
    });
  }, [entries, selectedReportType, calculateRecursiveOpening, activeCycle, ministryGroups]);

  const filteredCorrespondence = useMemo(() => {
    if (selectedReportType !== 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' && selectedReportType !== 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') return [];
    
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedMonthStart = new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth(), 1);
    
    let reportingLimitDate: Date;
    if (selectedMonthStart.getTime() > currentMonthStart.getTime()) {
      // Next month selected: show up to today (Current Status)
      reportingLimitDate = today;
    } else if (selectedMonthStart.getTime() === currentMonthStart.getTime()) {
      // Current month selected: show up to today
      reportingLimitDate = today;
    } else {
      // Past month selected: show up to the end of that month
      reportingLimitDate = new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth() + 1, 0, 23, 59, 59);
    }

    return (correspondenceEntries || []).filter(e => {
      if (!e.diaryDate) return false;
      const diaryDateStr = toEnglishDigits(e.diaryDate);
      const diaryDateObj = startOfDay(new Date(diaryDateStr));
      if (isNaN(diaryDateObj.getTime())) return false;
      
      // Must be received ON OR BEFORE reportingLimitDate
      const isBeforeOrOnReportingDate = diaryDateObj.getTime() <= reportingLimitDate.getTime();
      
      // Exclude specific letter types as requested (Milikaran, Karjapatra)
      const isExcludedType = e.letterType === 'মিলিকরণ' || e.letterType.includes('কার্যপত্র');
      if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' && isExcludedType) return false;

      const rawNo = e.issueLetterNo ? String(e.issueLetterNo).trim() : '';
      const rawDate = e.issueLetterDate ? String(e.issueLetterDate).trim() : '';
      const hasValidNo = rawNo !== '' && rawNo !== '০' && rawNo !== '0' && !rawNo.includes('নং-');
      const hasValidDate = rawDate !== '' && rawDate !== '0000-00-00';
      
      let isIssued = false;
      if (hasValidNo && hasValidDate) {
        isIssued = true;
      }
      
      return isBeforeOrOnReportingDate && !isIssued;
    }).sort((a, b) => new Date(toEnglishDigits(b.diaryDate)).getTime() - new Date(toEnglishDigits(a.diaryDate)).getTime());
  }, [correspondenceEntries, selectedReportType, activeCycle]);

  const grandTotals = useMemo(() => {
    const initial = { 
      pUC: 0, pUA: 0, cRC: 0, cRA: 0, pSC: 0, pSA: 0, cSC: 0, cSA: 0, cFC: 0, cPC: 0, 
      cSFIC: 0, cNonSFIC: 0, cSFIA: 0, cNonSFIA: 0,
      sfiBSR: 0, sfiTriWork: 0, sfiTriMin: 0, sfiRecon: 0,
      nonSfiBSR: 0, nonSfiBiWork: 0, nonSfiBiMin: 0, nonSfiRecon: 0
    };
    if (!reportData || reportData.length === 0) return initial;
    return reportData.reduce((acc, mGroup) => {
      mGroup.entityRows.forEach((row: any) => {
        acc.pUC += (row.prev.unsettledCount || 0); acc.pUA += (row.prev.unsettledAmount || 0); 
        acc.cRC += (row.currentRaisedCount || 0); acc.cRA += (row.currentRaisedAmount || 0);
        acc.pSC += (row.prev.settledCount || 0); acc.pSA += (row.prev.settledAmount || 0); 
        acc.cSC += (row.currentSettledCount || 0); acc.cSA += (row.currentSettledAmount || 0);
        acc.cFC += (row.currentFullCount || 0); acc.cPC += (row.currentPartialCount || 0);
        acc.cSFIC += (row.currentSFICount || 0); acc.cNonSFIC += (row.currentNonSFICount || 0);
        acc.cSFIA += (row.currentSFIAmount || 0); acc.cNonSFIA += (row.currentNonSFIAmount || 0);
        
        acc.sfiBSR += (row.sfiBreakdown?.bsr || 0);
        acc.sfiTriWork += (row.sfiBreakdown?.triWork || 0);
        acc.sfiTriMin += (row.sfiBreakdown?.triMin || 0);
        acc.sfiRecon += (row.sfiBreakdown?.recon || 0);
        
        acc.nonSfiBSR += (row.nonSfiBreakdown?.bsr || 0);
        acc.nonSfiBiWork += (row.nonSfiBreakdown?.biWork || 0);
        acc.nonSfiBiMin += (row.nonSfiBreakdown?.biMin || 0);
        acc.nonSfiRecon += (row.nonSfiBreakdown?.recon || 0);
      });
      return acc;
    }, initial);
  }, [reportData]);

  const handleSaveSetup = () => {
    setPrevStats({ ...prevStats, entitiesSFI: tempPrevStats, entitiesNonSFI: {} });
    setIsSetupMode(false); setSelectedReportType(null); setIsEditingSetup(false);
  };

  const handleSetupPaste = (e: React.ClipboardEvent, startEntity: string, startField: keyof MinistryPrevStats) => {
    if (!isEditingSetup) return;
    e.preventDefault(); const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const allEntities: string[] = [];
    ministryGroups.forEach(m => { (MINISTRY_ENTITY_MAP[m] || []).forEach(ent => allEntities.push(ent)); });
    const startIdx = allEntities.indexOf(startEntity);
    if (startIdx === -1) return;
    
    const isQuarterly = selectedReportType?.includes('ত্রৈমাসিক');
    const fields: (keyof MinistryPrevStats)[] = isQuarterly 
      ? ['unsettledCount', 'settledCount', 'unsettledAmount']
      : ['unsettledCount', 'unsettledAmount', 'settledCount', 'settledAmount'];
      
    const fieldStartIdx = fields.indexOf(startField);
    const newStats = { ...tempPrevStats };
    rows.forEach((row, rowOffset) => {
      const entityIdx = startIdx + rowOffset; if (entityIdx >= allEntities.length) return;
      const entityName = allEntities[entityIdx]; const cells = row.split(/\t/); 
      cells.forEach((cell, cellOffset) => {
        const fieldIdx = fieldStartIdx + cellOffset; if (fieldIdx >= fields.length) return;
        const fieldName = fields[fieldIdx]; const value = parseBengaliNumber(cell.trim());
        newStats[entityName] = { ...(newStats[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), [fieldName]: value };
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
      setCopied(true); setTimeout(() => setCopied(false), 2000);
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
    <div className="flex items-center gap-3 no-print">
      {showFilters && (
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-3">
            <div onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)} className={`flex items-center gap-3 px-5 h-[48px] bg-white border-2 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-400 group ${isCycleDropdownOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
               <CalendarDays size={20} className="text-blue-600" />
               <span className="font-black text-[13.5px] text-slate-800 tracking-tight">
                 {cycleOptions.find(o => o.cycleLabel === activeCycle.label)?.label || toBengaliDigits(activeCycle.label)}
               </span>
               <ChevronDown size={18} className={`text-slate-400 ml-2 transition-transform duration-300 ${isCycleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </div>
          </div>
          {isCycleDropdownOpen && (
            <div className="absolute top-[55px] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-2 max-h-[350px] overflow-y-auto no-scrollbar">
                <div className="px-4 py-2 mb-2 border-b border-slate-100 flex items-center justify-between"><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><CalendarSearch size={12} /> মাস ও বছর নির্বাচন</span></div>
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
      )}

      {showFilters && (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="সার্চ করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 h-[48px] w-[260px] bg-white border-2 border-slate-200 rounded-xl text-[13.5px] font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative" ref={ministryDropdownRef}>
            <div 
              onClick={() => setIsMinistryDropdownOpen(!isMinistryDropdownOpen)}
              className={`flex items-center gap-3 px-5 h-[48px] min-w-[220px] bg-white border-2 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-400 group ${isMinistryDropdownOpen ? 'border-blue-600 ring-4 ring-blue-50 shadow-lg' : 'border-slate-200 shadow-sm'}`}
            >
              <LayoutGrid size={18} className="text-blue-600" />
              <span className="font-black text-[13.5px] text-slate-800 tracking-tight flex-1">
                {filterMinistry || 'সকল মন্ত্রণালয়'}
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isMinistryDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </div>

            {isMinistryDropdownOpen && (
              <div className="absolute top-[55px] right-0 w-[280px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-2 max-h-[350px] overflow-y-auto no-scrollbar">
                  <div className="px-4 py-2 mb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid size={12} /> মন্ত্রণালয় নির্বাচন
                    </span>
                  </div>
                  <div 
                    onClick={() => { setFilterMinistry(''); setIsMinistryDropdownOpen(false); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${filterMinistry === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <span className="text-[13px] font-black">সকল মন্ত্রণালয়</span>
                    {filterMinistry === '' && <Check size={14} />}
                  </div>
                  {ministryGroups.map((m, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => { setFilterMinistry(m); setIsMinistryDropdownOpen(false); }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${filterMinistry === m ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <span className="text-[13px] font-black">{m}</span>
                      {filterMinistry === m && <Check size={14} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => { setSearchTerm(''); setFilterMinistry(''); }}
            className="flex items-center justify-center w-[48px] h-[48px] bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-300 shadow-sm border border-slate-200"
            title="ফিল্টার রিসেট করুন"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );

  if (!selectedReportType && !isSetupMode) {
    return (
      <div id="section-report-selector" className="max-w-4xl py-20 animate-report-page relative pt-0 text-center">
        <IDBadge id="section-report-selector" />
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-[3rem] space-y-6">
           <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><PieChart size={40} /></div>
           <div className="space-y-2"><h3 className="text-3xl font-black text-slate-800">রিটার্ণ মডিউলে স্বাগতম</h3><p className="text-slate-500 font-bold max-w-sm mx-auto">অনুগ্রহ করে বাম পাশের সাইডবার মেনু থেকে কাঙ্ক্ষিত রিটার্ণ বা সারাংশের ধরনটি নির্বাচন করুন।</p></div>
           <div className="flex justify-center items-center gap-4 text-slate-400 font-black text-sm uppercase tracking-widest pt-4"><ArrowRightCircle size={20} className="text-blue-500 animate-pulse" /> সাইডবার থেকে সিলেক্ট করুন</div>
        </div>
      </div>
    );
  }

  if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') {
    return <DDSirCorrespondenceReturn entries={correspondenceEntries} activeCycle={activeCycle} onBack={() => setSelectedReportType(null)} isLayoutEditable={isLayoutEditable} IDBadge={IDBadge} showFilters={showFilters} />;
  }

  if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।') {
    return <CorrespondenceDhakaReturn correspondenceEntries={correspondenceEntries} activeCycle={activeCycle} setSelectedReportType={setSelectedReportType} HistoricalFilter={HistoricalFilter} IDBadge={IDBadge} showFilters={showFilters} />;
  }

  if (isSetupMode) {
    return <OpeningBalanceSetup ministryGroups={ministryGroups} tempPrevStats={tempPrevStats} setTempPrevStats={setTempPrevStats} isEditingSetup={isEditingSetup} setIsEditingSetup={setIsEditingSetup} handleSaveSetup={handleSaveSetup} handleSetupPaste={handleSetupPaste} setIsSetupMode={setIsSetupMode} setSelectedReportType={setSelectedReportType} IDBadge={IDBadge} setupType={selectedReportType || ''} />;
  }

  if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ১') return <QR_1 activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} />;
  if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ২') return <QR_2 activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} />;
  if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৩') return <QR_3 activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} />;
  if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৪') return <QR_4 activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} />;
  if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৫') return <QR_5 activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} />;
  if (selectedReportType === 'ত্রৈমাসিক রিটার্ন - ৬') return <QR_6 activeCycle={activeCycle} IDBadge={IDBadge} onBack={() => setSelectedReportType(null)} searchTerm={searchTerm} filterMinistry={filterMinistry} />;

  return <ReturnSummaryTable reportData={reportData} grandTotals={grandTotals} activeCycle={activeCycle} selectedReportType={selectedReportType} setSelectedReportType={setSelectedReportType} isAdmin={isAdmin || false} HistoricalFilter={HistoricalFilter} IDBadge={IDBadge} showFilters={showFilters} searchTerm={searchTerm} filterMinistry={filterMinistry} />;
};

export default ReturnView;
