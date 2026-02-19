
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

/**
 * ReturnView - অডিট আপত্তি নিষ্পত্তি সংক্রান্ত রিটার্ণ ও সারাংশ ভিউ
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 */
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
            if (e.cycleLabel) return e.cycleLabel === activeCycle.label;
            const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
            return entryDate >= cycleStartStr && entryDate <= cycleEndStr;
          });
          
          let curRC = 0, curRA = 0, curSC = 0, curSA = 0, curFC = 0, curPC = 0;
          const processedParaIds = new Set<string>();

          // FIX: Resumed truncated logic for current statistics calculation
          matchingEntries.forEach(entry => {
            const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
            if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
                curRC += parseBengaliNumber(rCountRaw);
            }
            if (entry.manualRaisedAmount) curRA += (Number(entry.manualRaisedAmount) || 0);

            if (entry.paragraphs) {
              entry.paragraphs.forEach(p => {
                const cleanParaNo = String(p.paraNo || '').trim();
                const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
                if (p.id && !processedParaIds.has(p.id) && hasDigit) {
                  processedParaIds.add(p.id);
                  if (p.status === 'পূর্ণাঙ্গ') {
                      curSC++;
                      curSA += (Number(p.involvedAmount) || 0);
                      curFC++;
                  } else if (p.status === 'আংশিক') {
                      curSA += (Number(p.recoveredAmount) || 0) + (Number(p.adjustedAmount) || 0);
                      curPC++;
                  }
                }
              });
            }
          });

          return {
            entity: entityName,
            opening: ePrev,
            current: { rc: curRC, ra: curRA, sc: curSC, sa: curSA, fc: curFC, pc: curPC },
            closing: {
              unsettledCount: Math.max(0, ePrev.unsettledCount + curRC - curFC),
              unsettledAmount: Math.max(0, ePrev.unsettledAmount + curRA - curSA)
            }
          };
        })
      };
    });
  }, [entries, activeCycle, ministryGroups, prevStats, selectedReportType]);

  const grandTotals = useMemo(() => {
    return reportData.reduce((acc, min) => {
        min.entityRows.forEach(row => {
            acc.pUC += row.opening.unsettledCount; acc.pUA += row.opening.unsettledAmount;
            acc.cRC += row.current.rc; acc.cRA += row.current.ra;
            acc.cSC += row.current.sc; acc.cSA += row.current.sa;
            acc.pSC += row.opening.settledCount; acc.pSA += row.opening.settledAmount;
        });
        return acc;
    }, { pUC: 0, pUA: 0, cRC: 0, cRA: 0, cSC: 0, cSA: 0, pSC: 0, pSA: 0 });
  }, [reportData]);

  if (selectedReportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।') {
    const filtered = correspondenceEntries.filter(e => e.diaryDate && isInCycle(e.diaryDate, activeCycle.start, activeCycle.end));
    return <DDSirCorrespondenceReturn entries={filtered} activeCycle={activeCycle} onBack={() => setSelectedReportType(null)} isLayoutEditable={isLayoutEditable} />;
  }

  const thS = "border border-slate-300 px-1 py-1.5 font-bold text-center text-[10px] md:text-[11px] bg-slate-100 text-slate-900 leading-tight align-middle h-[42px]";
  const tdS = "border border-slate-300 px-1 py-1.5 text-[11px] md:text-[12px] text-center font-bold leading-tight bg-white h-[38px] transition-colors hover:bg-blue-50/30";

  return (
    <div className="flex flex-col space-y-6 py-2 w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedReportType(null)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"><ChevronLeft /></button>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedReportType || 'রিটার্ণ ভিউ'}</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Audit Settlement Summary Report</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> রিপোর্ট প্রিন্ট করুন</button>
      </div>

      <div className="table-container border border-slate-300 rounded-xl overflow-hidden shadow-2xl bg-white">
        <table className="w-full border-separate table-fixed">
          <thead>
            <tr><th rowSpan={2} className={thS + " w-[120px]"}>মন্ত্রণালয়</th><th rowSpan={2} className={thS + " w-[160px]"}>সংস্থা</th><th colSpan={2} className={thS}>প্রারম্ভিক অমীমাংসিত</th><th colSpan={2} className={thS}>বর্তমান উত্থাপিত</th><th colSpan={2} className={thS}>মোট অমীমাংসিত</th><th colSpan={2} className={thS}>প্রারম্ভিক মীমাংসিত</th><th colSpan={2} className={thS}>চলতি মীমাংসিত</th><th colSpan={2} className={thS}>মোট মীমাংসিত</th><th colSpan={2} className={thS}>সর্বমোট অমীমাংসিত</th></tr>
            <tr><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th><th className={thS}>সংখ্যা</th><th className={thS}>টাকা</th></tr>
          </thead>
          <tbody>
            {reportData.map(m => m.entityRows.map((r, ri) => {
              const tUC = r.opening.unsettledCount + r.current.rc;
              const tUA = r.opening.unsettledAmount + r.current.ra;
              const tSC = r.opening.settledCount + r.current.sc;
              const tSA = r.opening.settledAmount + r.current.sa;
              return (
                <tr key={r.entity} className="group">
                  {ri === 0 && <td rowSpan={m.entityRows.length} className={tdS + " bg-slate-50 font-black"}>{m.ministry}</td>}
                  <td className={tdS + " text-left px-3"}>{r.entity}</td>
                  <td className={tdS}>{toBengaliDigits(r.opening.unsettledCount)}</td><td className={tdS}>{toBengaliDigits(r.opening.unsettledAmount)}</td>
                  <td className={tdS + " text-blue-700"}>{toBengaliDigits(r.current.rc)}</td><td className={tdS + " text-blue-700"}>{toBengaliDigits(r.current.ra)}</td>
                  <td className={tdS + " font-black"}>{toBengaliDigits(tUC)}</td><td className={tdS + " font-black"}>{toBengaliDigits(tUA)}</td>
                  <td className={tdS}>{toBengaliDigits(r.opening.settledCount)}</td><td className={tdS}>{toBengaliDigits(r.opening.settledAmount)}</td>
                  <td className={tdS + " text-emerald-700"}>{toBengaliDigits(r.current.sc)}</td><td className={tdS + " text-emerald-700"}>{toBengaliDigits(r.current.sa)}</td>
                  <td className={tdS + " font-black"}>{toBengaliDigits(tSC)}</td><td className={tdS + " font-black"}>{toBengaliDigits(tSA)}</td>
                  <td className={tdS + " bg-amber-50"}>{toBengaliDigits(tUC - tSC)}</td><td className={tdS + " bg-amber-50"}>{toBengaliDigits(tUA - tSA)}</td>
                </tr>
              );
            }))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-black">
              <td colSpan={2} className="p-3 text-center text-[12px] uppercase tracking-widest">সর্বমোট (বিভাগ ভিত্তিক)</td>
              <td className="p-2 text-center">{toBengaliDigits(grandTotals.pUC)}</td><td className="p-2 text-center">{toBengaliDigits(grandTotals.pUA)}</td>
              <td className="p-2 text-center text-blue-300">{toBengaliDigits(grandTotals.cRC)}</td><td className="p-2 text-center text-blue-300">{toBengaliDigits(grandTotals.cRA)}</td>
              <td className="p-2 text-center text-amber-400">{toBengaliDigits(grandTotals.pUC + grandTotals.cRC)}</td><td className="p-2 text-center text-amber-400">{toBengaliDigits(grandTotals.pUA + grandTotals.cRA)}</td>
              <td className="p-2 text-center">{toBengaliDigits(grandTotals.pSC)}</td><td className="p-2 text-center">{toBengaliDigits(grandTotals.pSA)}</td>
              <td className="p-2 text-center text-emerald-400">{toBengaliDigits(grandTotals.cSC)}</td><td className="p-2 text-center text-emerald-400">{toBengaliDigits(grandTotals.cSA)}</td>
              <td className="p-2 text-center text-emerald-300">{toBengaliDigits(grandTotals.pSC + grandTotals.cSC)}</td><td className="p-2 text-center text-emerald-300">{toBengaliDigits(grandTotals.pSA + grandTotals.cSA)}</td>
              <td className="p-2 text-center bg-red-600">{(grandTotals.pUC + grandTotals.cRC) - (grandTotals.pSC + grandTotals.cSC)}</td><td className="p-2 text-center bg-red-600">{toBengaliDigits((grandTotals.pUA + grandTotals.cRA) - (grandTotals.pSA + grandTotals.cSA))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ReturnView;
