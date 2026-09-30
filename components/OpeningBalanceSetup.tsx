import React, { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { Settings2, ChevronLeft, Pencil, LayoutGrid, Calendar, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber, toEnglishDigits } from '../utils/numberUtils';
import { MINISTRY_ENTITY_MAP } from '../constants';
import { MinistryPrevStats, SettlementEntry } from '../types';
import { HR1_CATEGORIES, getHalfYearlyRollingData } from '../utils/halfYearlyHelper';

export const HALF_YEARLY_MINISTRIES = [
  'আর্থিক প্রতিষ্ঠান বিভাগ',
  'বস্ত্র ও পাট মন্ত্রণালয়',
  'শিল্প মন্ত্রণালয়',
  'বাণিজ্য মন্ত্রণালয়',
  'বেসামরিক বিমান, পরিবহন ও পর্যটন মন্ত্রণালয়'
];

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
  entries?: SettlementEntry[];
  activeCycle?: any;
}

type BalanceTab = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';

const OpeningBalanceSetup: React.FC<OpeningBalanceSetupProps> = ({
  ministryGroups,
  tempPrevStats,
  setTempPrevStats,
  isEditingSetup,
  setIsEditingSetup,
  handleSaveSetup,
  setIsSetupMode,
  setSelectedReportType,
  IDBadge,
  entries,
  activeCycle
}) => {
  const [activeTab, setActiveTab] = useState<BalanceTab>('monthly');
  const [selectedHalfYearlyMinistry, setSelectedHalfYearlyMinistry] = useState<string>('আর্থিক প্রতিষ্ঠান বিভাগ');
  const [isHalfYearlyMenuOpen, setIsHalfYearlyMenuOpen] = useState<boolean>(false);
  const halfYearlyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (halfYearlyMenuRef.current && !halfYearlyMenuRef.current.contains(e.target as Node)) {
        setIsHalfYearlyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getHalfYearlyStats = (catName: string) => {
    const isFinancialInst = selectedHalfYearlyMinistry.includes('আর্থিক প্রতিষ্ঠান');
    const isTextileJute = selectedHalfYearlyMinistry.includes('বস্ত্র') || selectedHalfYearlyMinistry.includes('পাট');
    const specificKey = `${selectedHalfYearlyMinistry}_${catName}`;

    if (tempPrevStats[specificKey]) {
      return tempPrevStats[specificKey];
    }
    if (isFinancialInst && tempPrevStats[catName]) {
      return tempPrevStats[catName];
    }
    if (isTextileJute) {
      const combined = tempPrevStats[`বস্ত্র ও পাট মন্ত্রণালয়_${catName}`];
      if (combined) return combined;

      const j = tempPrevStats[`পাট মন্ত্রণালয়_${catName}`];
      const t = tempPrevStats[`বস্ত্র মন্ত্রণালয়_${catName}`];
      if (j || t) {
        const pCount = (parseBengaliNumber(j?.halfYearlyPrevUnsettledCount) || 0) + (parseBengaliNumber(t?.halfYearlyPrevUnsettledCount) || 0);
        const pAmount = (parseBengaliNumber(j?.halfYearlyPrevUnsettledAmount) || 0) + (parseBengaliNumber(t?.halfYearlyPrevUnsettledAmount) || 0);
        const rCount = (parseBengaliNumber(j?.halfYearlyRaisedCount) || 0) + (parseBengaliNumber(t?.halfYearlyRaisedCount) || 0);
        const rAmount = (parseBengaliNumber(j?.halfYearlyRaisedAmount) || 0) + (parseBengaliNumber(t?.halfYearlyRaisedAmount) || 0);
        const sCount = (parseBengaliNumber(j?.halfYearlySettledCount) || 0) + (parseBengaliNumber(t?.halfYearlySettledCount) || 0);
        const sAmount = (parseBengaliNumber(j?.halfYearlySettledAmount) || 0) + (parseBengaliNumber(t?.halfYearlySettledAmount) || 0);
        return {
          halfYearlyPrevUnsettledCount: toBengaliDigits(pCount),
          halfYearlyPrevUnsettledAmount: toBengaliDigits(pAmount),
          halfYearlyRaisedCount: toBengaliDigits(rCount),
          halfYearlyRaisedAmount: toBengaliDigits(rAmount),
          halfYearlySettledCount: toBengaliDigits(sCount),
          halfYearlySettledAmount: toBengaliDigits(sAmount),
        };
      }
    }
    return {};
  };

  const [customMonthText, setCustomMonthText] = useState<string>(() => {
    return localStorage.getItem('opening_balance_custom_month_text') || '১৬/০৫/২০২৫ হতে ১৫/০৬/২০২৫';
  });
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic header offset measurement to prevent header breaking on scroll
  useLayoutEffect(() => {
    const updateHeaderOffsets = () => {
      const container = tableContainerRef.current;
      if (!container) return;
      container.style.setProperty('--hdr-r2-top', '40px');
      container.style.setProperty('--hdr-r3-top', '74px');
    };

    updateHeaderOffsets();
  }, [activeTab]);

  // Field configurations for each independent tab
  const monthlyFields: { key: keyof MinistryPrevStats; label: string }[] = [
    { key: 'unsettledCount', label: 'সংখ্যা' },
    { key: 'unsettledAmount', label: 'টাকা' },
    { key: 'settledCount', label: 'সংখ্যা' },
    { key: 'settledAmount', label: 'টাকা' }
  ];

  const quarterlyFields: { key: keyof MinistryPrevStats; label: string }[] = [
    { key: 'unsettledQuarterlyAmount', label: 'টাকা' },
    { key: 'recoveryAdjustmentQuarterlyCount', label: 'সংখ্যা' },
    { key: 'recoveryAdjustmentQuarterlyAmount', label: 'টাকা' }
  ];

  const halfYearlyFields: { key: keyof MinistryPrevStats; label: string }[] = [
    { key: 'halfYearlyPrevUnsettledCount', label: 'সংখ্যা' },
    { key: 'halfYearlyPrevUnsettledAmount', label: 'টাকা (কোটি)' },
    { key: 'halfYearlyRaisedCount', label: 'সংখ্যা' },
    { key: 'halfYearlyRaisedAmount', label: 'টাকা (কোটি)' },
    { key: 'halfYearlySettledCount', label: 'সংখ্যা' },
    { key: 'halfYearlySettledAmount', label: 'টাকা (কোটি)' }
  ];

  const yearlyFields: { key: keyof MinistryPrevStats; label: string }[] = [
    { key: 'yearlyPrevUnsettledCount', label: 'সংখ্যা' },
    { key: 'yearlyPrevUnsettledAmount', label: 'টাকা (কোটি)' },
    { key: 'yearlySettledCount', label: 'সংখ্যা' },
    { key: 'yearlySettledAmount', label: 'টাকা (কোটি)' }
  ];

  // Smart multi-cell copy & paste handler for Excel data
  const handleTabPaste = (
    e: React.ClipboardEvent,
    startEntity: string,
    startField: keyof MinistryPrevStats,
    fieldsList: { key: keyof MinistryPrevStats }[]
  ) => {
    if (!isEditingSetup) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/).filter(r => r.trim() !== '');
    const allEntities: string[] = [];
    if (activeTab === 'halfYearly') {
      HR1_CATEGORIES.forEach(c => allEntities.push(c.name));
    } else {
      ministryGroups.forEach(m => {
        (MINISTRY_ENTITY_MAP[m] || []).forEach(ent => allEntities.push(ent));
      });
    }

    const startIdx = allEntities.indexOf(startEntity);
    if (startIdx === -1) return;

    const fieldKeys = fieldsList.map(f => f.key);
    const fieldStartIdx = fieldKeys.indexOf(startField);
    if (fieldStartIdx === -1) return;

    const newStats = { ...tempPrevStats };

    rows.forEach((row, rowOffset) => {
      const entityIdx = startIdx + rowOffset;
      if (entityIdx >= allEntities.length) return;
      const entityName = allEntities[entityIdx];
      const cells = row.split(/\t/);

      cells.forEach((cell, cellOffset) => {
        const fIdx = fieldStartIdx + cellOffset;
        if (fIdx >= fieldKeys.length) return;
        const fieldName = fieldKeys[fIdx];
        const trimmed = cell.trim();
        const value = trimmed.includes('.') || trimmed.includes(',')
          ? toBengaliDigits(trimmed.replace(/,/g, '.'))
          : parseBengaliNumber(trimmed);

        if (activeTab === 'halfYearly') {
          const isFinancialInst = selectedHalfYearlyMinistry.includes('আর্থিক প্রতিষ্ঠান');
          const specificKey = `${selectedHalfYearlyMinistry}_${entityName}`;
          newStats[specificKey] = {
            ...(newStats[specificKey] || {}),
            [fieldName]: value
          };
          if (isFinancialInst) {
            newStats[entityName] = {
              ...(newStats[entityName] || {}),
              [fieldName]: value
            };
          }
        } else {
          newStats[entityName] = {
            ...(newStats[entityName] || {
              unsettledCount: 0,
              unsettledAmount: 0,
              settledCount: 0,
              settledAmount: 0
            }),
            [fieldName]: value
          };
        }
      });
    });

    setTempPrevStats(newStats);
  };

  // Dynamic half-yearly rolling data based on active cycle and Settlement Register entries
  const halfYearlyCalculatedData = useMemo(() => {
    let targetDate = activeCycle?.start ? new Date(activeCycle.start) : new Date();
    if (customMonthText.includes('২০২৫') && (customMonthText.includes('০৫') || customMonthText.includes('০৬'))) {
      targetDate = new Date(2025, 5, 1);
    } else if (customMonthText.includes('২০২৫') && (customMonthText.includes('০৭') || customMonthText.includes('১২'))) {
      targetDate = new Date(2025, 8, 1);
    } else if (customMonthText.includes('২০২৬') && (customMonthText.includes('০১') || customMonthText.includes('০৬'))) {
      targetDate = new Date(2026, 2, 1);
    }
    return getHalfYearlyRollingData(targetDate, entries || [], tempPrevStats, selectedHalfYearlyMinistry);
  }, [activeCycle, customMonthText, entries, tempPrevStats, selectedHalfYearlyMinistry]);

  // Half-yearly category-specific totals
  const halfYearlyTotals = useMemo(() => {
    return HR1_CATEGORIES.reduce((acc, cat) => {
      const calc = halfYearlyCalculatedData[cat.id] || {
        col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0, col9_finalCount: 0, col10_finalAmount: 0
      };
      const s = getHalfYearlyStats(cat.name);

      const pCount = isEditingSetup
        ? (parseBengaliNumber(s.halfYearlyPrevUnsettledCount) || 0)
        : (calc.col3_pCount ?? 0);
      const pAmount = isEditingSetup
        ? (parseBengaliNumber(s.halfYearlyPrevUnsettledAmount) || 0)
        : (calc.col4_pAmount ?? 0);
      const rCount = isEditingSetup
        ? (parseBengaliNumber(s.halfYearlyRaisedCount) || 0)
        : (calc.col5_cCount ?? 0);
      const rAmount = isEditingSetup
        ? (parseBengaliNumber(s.halfYearlyRaisedAmount) || 0)
        : (calc.col6_cAmount ?? 0);
      const sCount = isEditingSetup
        ? (parseBengaliNumber(s.halfYearlySettledCount) || 0)
        : (calc.col7_sCount ?? 0);
      const sAmount = isEditingSetup
        ? (parseBengaliNumber(s.halfYearlySettledAmount) || 0)
        : (calc.col8_sAmount ?? 0);

      const fCount = (pCount + rCount) - sCount;
      const fAmount = (pAmount + rAmount) - sAmount;

      acc.hyPUC += pCount;
      acc.hyPUA += pAmount;
      acc.hyRC += rCount;
      acc.hyRA += rAmount;
      acc.hySC += sCount;
      acc.hySA += sAmount;
      acc.hyFC += fCount;
      acc.hyFA += fAmount;
      return acc;
    }, { hyPUC: 0, hyPUA: 0, hyRC: 0, hyRA: 0, hySC: 0, hySA: 0, hyFC: 0, hyFA: 0 });
  }, [tempPrevStats, isEditingSetup, halfYearlyCalculatedData, selectedHalfYearlyMinistry]);

  // Calculated totals across all ministries and entities
  const totalStats = ministryGroups.reduce((acc, m) => {
    const entities = MINISTRY_ENTITY_MAP[m] || [];
    entities.forEach(ent => {
      const stats = tempPrevStats[ent] || {
        unsettledCount: 0,
        unsettledAmount: 0,
        unsettledQuarterlyAmount: 0,
        recoveryAdjustmentQuarterlyCount: 0,
        recoveryAdjustmentQuarterlyAmount: 0,
        settledCount: 0,
        settledAmount: 0
      };
      // Monthly
      acc.uC += stats.unsettledCount || 0;
      acc.uA += Math.round(stats.unsettledAmount || 0);
      acc.sC += stats.settledCount || 0;
      acc.sA += Math.round(stats.settledAmount || 0);
      // Quarterly
      acc.uQA += Math.round(stats.unsettledQuarterlyAmount || 0);
      acc.rAQC += stats.recoveryAdjustmentQuarterlyCount || 0;
      acc.rAQA += Math.round(stats.recoveryAdjustmentQuarterlyAmount || 0);
      // Half-Yearly
      acc.hyPUC += parseBengaliNumber(stats.halfYearlyPrevUnsettledCount) || 0;
      acc.hyPUA += parseBengaliNumber(stats.halfYearlyPrevUnsettledAmount) || 0;
      acc.hyRC += parseBengaliNumber(stats.halfYearlyRaisedCount) || 0;
      acc.hyRA += parseBengaliNumber(stats.halfYearlyRaisedAmount) || 0;
      acc.hySC += parseBengaliNumber(stats.halfYearlySettledCount) || 0;
      acc.hySA += parseBengaliNumber(stats.halfYearlySettledAmount) || 0;
      // Yearly
      acc.yPUC += parseBengaliNumber(stats.yearlyPrevUnsettledCount) || 0;
      acc.yPUA += parseBengaliNumber(stats.yearlyPrevUnsettledAmount) || 0;
      acc.ySC += parseBengaliNumber(stats.yearlySettledCount) || 0;
      acc.ySA += parseBengaliNumber(stats.yearlySettledAmount) || 0;
    });
    return acc;
  }, {
    uC: 0, uA: 0, sC: 0, sA: 0,
    uQA: 0, rAQC: 0, rAQA: 0,
    hyPUC: 0, hyPUA: 0, hyRC: 0, hyRA: 0, hySC: 0, hySA: 0,
    yPUC: 0, yPUA: 0, ySC: 0, ySA: 0
  });

  return (
    <div id="section-prev-stats-setup" className="max-w-full mx-auto py-1 px-2 font-sans rounded-none pb-0 mb-0">
      <IDBadge id="section-prev-stats-setup" />

      {/* Floating Success Toast */}
      {showSavedToast && (
        <div className="fixed top-6 right-6 z-[10000] flex items-center gap-3.5 bg-emerald-600 text-white px-6 py-4 rounded-none shadow-2xl border-2 border-emerald-300 animate-in slide-in-from-top-6 fade-in duration-300">
          <div className="bg-white/20 p-2 rounded-none shrink-0">
            <CheckCircle2 size={24} className="text-white animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-white tracking-wide">ডাটা সফলভাবে সংরক্ষিত হয়েছে!</span>
            <span className="text-[11px] font-extrabold text-emerald-100">সকল তথ্য ও জের সফলভাবে লক করা হয়েছে।</span>
          </div>
        </div>
      )}

      {/* Header Bar: Left Title | Left-aligned "জের-এর মাস" | 4 Individual Buttons | Right Edit/Save (Scrolls up naturally) */}
      <div id="container-setup-controls" className="flex flex-wrap items-center justify-between bg-white p-2.5 md:p-3 rounded-none border border-slate-300 shadow-xs gap-2 md:gap-3 no-print relative mb-2 w-full box-border">
        <IDBadge id="container-setup-controls" />
        
        {/* Left Side: Back button + Title */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => { setIsSetupMode(false); setSelectedReportType(null); }} 
            className="p-1.5 md:p-2 bg-slate-100 border border-slate-300 rounded-none hover:bg-slate-200 text-slate-700 shadow-xs transition-all cursor-pointer"
            title="ফিরে যান"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-1.5">
              <Settings2 size={18} className="text-blue-600 shrink-0" /> 
              <span>পূর্ব জের সেটআপ</span>
            </h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">সমন্বিত (UNIFIED) ব্যালেন্স ইনপুট উইন্ডো</span>
          </div>
        </div>

        {/* Moved Left: জের-এর মাস */}
        <div className={`flex items-center gap-1.5 rounded-none px-2.5 py-1 shadow-xs text-xs transition-all shrink-0 ${
          isEditingSetup ? 'bg-amber-100/90 border-2 border-amber-400 ring-2 ring-amber-400/30' : 'bg-amber-50/90 border border-amber-300/90'
        }`}>
          <Calendar size={15} className="text-amber-700 shrink-0" />
          <span className="font-extrabold text-amber-950 text-[11px] md:text-[12px] whitespace-nowrap">জের-এর মাস:</span>
          <input
            type="text"
            placeholder="যেমন: ১৬/০৫/২০২৫ হতে ১৫/০৬/২০২৫"
            value={customMonthText}
            readOnly={!isEditingSetup}
            onChange={(e) => {
              if (!isEditingSetup) return;
              const val = e.target.value;
              setCustomMonthText(val);
              localStorage.setItem('opening_balance_custom_month_text', val);
            }}
            className={`rounded-none px-2 py-0.5 font-bold text-[11px] md:text-[12px] outline-none w-48 transition-all shadow-xs ${
              isEditingSetup
                ? 'bg-white border-2 border-amber-400 text-slate-900 focus:ring-2 focus:ring-amber-500/30 placeholder:text-slate-400 cursor-text'
                : 'bg-amber-100/70 border border-amber-200/80 text-amber-950 cursor-not-allowed select-none font-extrabold'
            }`}
          />
        </div>

        {/* Right side of "জের-এর মাস": 4 Individual Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-300 rounded-none shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('monthly'); setIsHalfYearlyMenuOpen(false); }}
            className={`px-2.5 py-1.5 rounded-none font-black text-[11px] md:text-[12px] transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            মাসিক জের
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('quarterly'); setIsHalfYearlyMenuOpen(false); }}
            className={`px-2.5 py-1.5 rounded-none font-black text-[11px] md:text-[12px] transition-all cursor-pointer ${
              activeTab === 'quarterly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            ত্রৈমাসিক জের
          </button>
          {/* ষাণ্মাসিক জের Tab with Ministry Dropdown */}
          <div className="relative" ref={halfYearlyMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsHalfYearlyMenuOpen(prev => !prev);
              }}
              className={`px-2.5 py-1.5 rounded-none font-black text-[11px] md:text-[12px] transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'halfYearly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span>ষাণ্মাসিক জের</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isHalfYearlyMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isHalfYearlyMenuOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-300 shadow-2xl z-[99999] py-1">
                <div className="px-3 py-1.5 text-[11px] font-black text-slate-500 border-b border-slate-100 bg-slate-50">
                  মন্ত্রণালয় নির্বাচন করুন
                </div>
                {HALF_YEARLY_MINISTRIES.map(min => {
                  const isSelected = activeTab === 'halfYearly' && selectedHalfYearlyMinistry === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setSelectedHalfYearlyMinistry(min);
                        setActiveTab('halfYearly');
                        setIsHalfYearlyMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-black'
                          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <span>{min}</span>
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setActiveTab('yearly'); setIsHalfYearlyMenuOpen(false); }}
            className={`px-2.5 py-1.5 rounded-none font-black text-[11px] md:text-[12px] transition-all cursor-pointer ${
              activeTab === 'yearly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            বাৎসরিক জের
          </button>
        </div>

        {/* Action Button: Edit / Save */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditingSetup ? (
            <button 
              type="button"
              onClick={() => setIsEditingSetup(true)} 
              className="px-4 py-2 rounded-none font-black text-xs md:text-sm flex items-center gap-1.5 transition-all border-b-2 bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700 active:scale-95 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Pencil size={15} />
              <span>এডিট করুন</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('opening_balance_custom_month_text', customMonthText);
                  localStorage.setItem('opening_balance_setup_stats_v1', JSON.stringify(tempPrevStats));
                } catch (e) {
                  console.error("Failed to save opening balance stats to localStorage:", e);
                }
                try {
                  handleSaveSetup();
                } catch (e) {
                  console.error("handleSaveSetup error:", e);
                }
                setIsEditingSetup(false);
                setShowSavedToast(true);
                setTimeout(() => {
                  setShowSavedToast(false);
                }, 3500);
              }} 
              className="px-5 py-2 rounded-none font-black text-xs md:text-sm flex items-center gap-1.5 transition-all border-b-2 bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700 active:scale-95 shadow-md cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 size={16} className="text-emerald-100 animate-pulse" />
              <span>সংরক্ষণ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Name Strip (Always present with fixed height so table never jitters/shakes) */}
      <div className="flex items-center justify-between bg-white border border-slate-300 px-3 py-1.5 mb-2 rounded-none shadow-xs h-9">
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-800 text-xs md:text-sm">টেবিলের নাম:</span>
          {activeTab === 'halfYearly' ? (
            <div className="flex items-center gap-1.5 text-xs md:text-sm">
              <span className="font-bold text-slate-700">ষাণ্মাসিক জের:</span>
              <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 border border-blue-200">
                {selectedHalfYearlyMinistry}
              </span>
            </div>
          ) : activeTab === 'monthly' ? (
            <span className="font-bold text-slate-700 text-xs md:text-sm">
              মাসিক পূর্ব জের
            </span>
          ) : activeTab === 'quarterly' ? (
            <span className="font-bold text-slate-700 text-xs md:text-sm">
              ত্রৈমাসিক পূর্ব জের
            </span>
          ) : (
            <span className="font-bold text-slate-700 text-xs md:text-sm">
              বাৎসরিক পূর্ব জের
            </span>
          )}
        </div>
      </div>

      {/* Scoped Strict Sticky CSS (Solves Header Breaking on Scroll & Fixes Footer at Screen Bottom) */}
      <style>{`
        #opening-setup-table-container {
          width: 100% !important;
          overflow: visible !important;
          position: relative !important;
          border-radius: 0px !important;
          --hdr-r2-top: 40px;
          --hdr-r3-top: 74px;
        }
        #opening-setup-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          width: 100%;
        }
        #opening-setup-table thead {
          position: static !important;
          background-color: #e2e8f0 !important;
        }
        #opening-setup-table thead th {
          position: -webkit-sticky !important;
          position: sticky !important;
          background-color: #e2e8f0 !important;
          background-clip: padding-box !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          opacity: 1 !important;
          box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.6) !important;
        }
        #opening-setup-table thead tr.hdr-row-1 {
          height: 40px !important;
        }
        #opening-setup-table thead tr.hdr-row-1 th {
          top: 0px !important;
          height: 40px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          z-index: 160 !important;
        }
        #opening-setup-table thead tr.hdr-row-2 {
          height: 34px !important;
        }
        #opening-setup-table thead tr.hdr-row-2 th {
          top: 40px !important;
          height: 34px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          z-index: 158 !important;
        }
        #opening-setup-table thead tr.hdr-row-3 {
          height: 28px !important;
        }
        #opening-setup-table thead tr.hdr-row-3 th {
          top: 74px !important;
          height: 28px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          z-index: 156 !important;
        }
        #opening-setup-table thead tr.hdr-row-1 th[rowspan="2"] {
          top: 0px !important;
          height: 74px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          z-index: 165 !important;
        }
        #opening-setup-table tfoot {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          z-index: 170 !important;
        }
        #opening-setup-table tfoot tr {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          background-color: #e2e8f0 !important;
        }
        #opening-setup-table tfoot tr td {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          z-index: 170 !important;
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
          border-top: 2px solid #64748b !important;
          box-shadow: 0 -3px 8px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>

      {/* Individual Table Container with Unbreakable Sticky Header and Fixed Footer */}
      <div 
        id="opening-setup-table-container" 
        ref={tableContainerRef}
        className={`bg-white rounded-none border border-slate-300 shadow-md transition-all duration-300 ${
          showSavedToast ? 'ring-2 ring-emerald-500 shadow-emerald-500/30' : ''
        }`}
      >
        {/* ============================================================== */}
        {/* TAB 1: মাসিক জের (Monthly Balance Table) */}
        {/* ============================================================== */}
        {activeTab === 'monthly' && (
          <table id="opening-setup-table" className="text-sm">
            <thead className="bg-slate-200">
              {/* লেভেল ১: গ্রুপ হেডার */}
              <tr className="hdr-row-1 bg-slate-200">
                <th rowSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] w-[26%] bg-slate-200 border-b border-r border-slate-300">
                  মন্ত্রণালয় ও সংস্থা
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  অমীমাংসিত
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  মীমাংসিত
                </th>
              </tr>
              {/* লেভেল ২: কলামের নাম (সংখ্যা / টাকা) */}
              <tr className="hdr-row-2 bg-slate-200">
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[18.5%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[18.5%]">
                  টাকা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[18.5%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[18.5%]">
                  টাকা
                </th>
              </tr>
              {/* লেভেল ৩: কলাম ক্রমিক নম্বর */}
              <tr className="hdr-row-3 bg-slate-200 text-slate-900 font-black text-[12px] text-center border-b border-slate-300">
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(১)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(২)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৩)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৪)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৫)</th>
              </tr>
            </thead>

            <tbody>
              {ministryGroups.map(m => {
                const entities = MINISTRY_ENTITY_MAP[m] || [];
                const mSubTotal = entities.reduce((acc, ent) => {
                  const s = tempPrevStats[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
                  acc.uC += s.unsettledCount || 0;
                  acc.uA += Math.round(s.unsettledAmount || 0);
                  acc.sC += s.settledCount || 0;
                  acc.sA += Math.round(s.settledAmount || 0);
                  return acc;
                }, { uC: 0, uA: 0, sC: 0, sA: 0 });

                return (
                  <React.Fragment key={m}>
                    <tr className="bg-[#1e293b] no-hover-row">
                      <td colSpan={5} className="px-5 py-3 bg-[#1e293b]">
                        <div className="flex items-center gap-2 font-black uppercase text-[12px] tracking-wide text-white">
                          <LayoutGrid size={15} className="text-blue-400" /> {m}
                        </div>
                      </td>
                    </tr>
                    {entities.map(ent => (
                      <tr key={ent} className="hover:bg-blue-50/40 transition-all group bg-white">
                        <td className="px-6 py-3.5 font-bold text-slate-800 text-[13px] bg-white group-hover:text-blue-700 border-r border-b border-slate-200">
                          {ent}
                        </td>
                        {monthlyFields.map(f => (
                          <td key={f.key} className={`p-1.5 text-center align-middle h-14 border-r border-b border-slate-100 ${isEditingSetup ? 'bg-white group-hover:bg-blue-50' : 'bg-slate-50'}`}>
                            <input 
                              type="text" 
                              readOnly={!isEditingSetup}
                              className={`w-full h-11 text-center font-bold text-[14px] md:text-[15px] outline-none border-0 transition-all ${
                                isEditingSetup 
                                  ? 'bg-white text-slate-900 cursor-text hover:bg-blue-50/50 focus:bg-amber-50 focus:ring-2 focus:ring-blue-500 rounded-lg' 
                                  : 'bg-slate-50 text-slate-700 cursor-not-allowed'
                              }`} 
                              placeholder="০" 
                              value={tempPrevStats[ent]?.[f.key] !== undefined && tempPrevStats[ent]![f.key] !== 0 ? toBengaliDigits(tempPrevStats[ent]![f.key]) : ''} 
                              onPaste={(e) => handleTabPaste(e, ent, f.key, monthlyFields)} 
                              onChange={e => { 
                                if (!isEditingSetup) return;
                                const num = parseBengaliNumber(e.target.value); 
                                setTempPrevStats(prev => ({ 
                                  ...prev, 
                                  [ent]: { 
                                    ...(prev[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), 
                                    [f.key]: num 
                                  } 
                                })); 
                              }} 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-sky-50/60 font-black italic text-slate-800 no-hover-row border-b-2 border-slate-300">
                      <td className="px-6 py-3 text-right text-[11px] uppercase border-r border-slate-200">উপ-মোট: {m}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-blue-700 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.uC))}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-blue-700 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.uA))}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-emerald-700 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.sC))}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-emerald-700 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.sA))}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-400">
                <td className="px-6 py-4 text-right text-[13px] uppercase tracking-tighter bg-slate-200 text-slate-900 border-r border-slate-300 font-black">
                  সর্বমোট সেটআপ তথ্য:
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-blue-800 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.uC))}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-blue-800 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.uA))}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-emerald-800 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.sC))}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-emerald-800 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.sA))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ত্রৈমাসিক জের (Quarterly Balance Table) */}
        {/* ============================================================== */}
        {activeTab === 'quarterly' && (
          <table id="opening-setup-table" className="text-sm">
            <thead className="bg-slate-200">
              <tr className="hdr-row-1 bg-slate-200">
                <th rowSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] w-[28%] bg-slate-200 border-b border-r border-slate-300">
                  মন্ত্রণালয় ও সংস্থা
                </th>
                <th className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide w-[24%]">
                  অমীমাংসিত (ত্রৈমাসিক- ৩)
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide w-[48%]">
                  সংস্থাভিত্তিক (ত্রৈমাসিক- ৪)
                </th>
              </tr>
              <tr className="hdr-row-2 bg-slate-200">
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300">
                  টাকা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[24%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[24%]">
                  টাকা
                </th>
              </tr>
              <tr className="hdr-row-3 bg-slate-200 text-slate-900 font-black text-[12px] text-center border-b border-slate-300">
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(১)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(২)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৩)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৪)</th>
              </tr>
            </thead>

            <tbody>
              {ministryGroups.map(m => {
                const entities = MINISTRY_ENTITY_MAP[m] || [];
                const mSubTotal = entities.reduce((acc, ent) => {
                  const s = tempPrevStats[ent] || { unsettledQuarterlyAmount: 0, recoveryAdjustmentQuarterlyCount: 0, recoveryAdjustmentQuarterlyAmount: 0 };
                  acc.uQA += Math.round(s.unsettledQuarterlyAmount || 0);
                  acc.rAQC += s.recoveryAdjustmentQuarterlyCount || 0;
                  acc.rAQA += Math.round(s.recoveryAdjustmentQuarterlyAmount || 0);
                  return acc;
                }, { uQA: 0, rAQC: 0, rAQA: 0 });

                return (
                  <React.Fragment key={m}>
                    <tr className="bg-[#1e293b] no-hover-row">
                      <td colSpan={4} className="px-5 py-3 bg-[#1e293b]">
                        <div className="flex items-center gap-2 font-black uppercase text-[12px] tracking-wide text-white">
                          <LayoutGrid size={15} className="text-amber-400" /> {m}
                        </div>
                      </td>
                    </tr>
                    {entities.map(ent => (
                      <tr key={ent} className="hover:bg-amber-50/40 transition-all group bg-white">
                        <td className="px-6 py-3.5 font-bold text-slate-800 text-[13px] bg-white group-hover:text-amber-800 border-r border-b border-slate-200">
                          {ent}
                        </td>
                        {quarterlyFields.map(f => (
                          <td key={f.key} className={`p-1.5 text-center align-middle h-14 border-r border-b border-slate-100 ${isEditingSetup ? 'bg-white group-hover:bg-amber-50' : 'bg-slate-50'}`}>
                            <input 
                              type="text" 
                              readOnly={!isEditingSetup}
                              className={`w-full h-11 text-center font-bold text-[14px] md:text-[15px] outline-none border-0 transition-all ${
                                isEditingSetup 
                                  ? 'bg-white text-slate-900 cursor-text hover:bg-amber-50/50 focus:bg-amber-50 focus:ring-2 focus:ring-amber-500 rounded-lg' 
                                  : 'bg-slate-50 text-slate-700 cursor-not-allowed'
                              }`} 
                              placeholder="০" 
                              value={tempPrevStats[ent]?.[f.key] !== undefined && tempPrevStats[ent]![f.key] !== 0 ? toBengaliDigits(tempPrevStats[ent]![f.key]) : ''} 
                              onPaste={(e) => handleTabPaste(e, ent, f.key, quarterlyFields)} 
                              onChange={e => { 
                                if (!isEditingSetup) return;
                                const num = parseBengaliNumber(e.target.value); 
                                setTempPrevStats(prev => ({ 
                                  ...prev, 
                                  [ent]: { 
                                    ...(prev[ent] || { unsettledCount: 0, unsettledAmount: 0, unsettledQuarterlyAmount: 0, recoveryAdjustmentQuarterlyCount: 0, recoveryAdjustmentQuarterlyAmount: 0, settledCount: 0, settledAmount: 0 }), 
                                    [f.key]: num 
                                  } 
                                })); 
                              }} 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-amber-50/60 font-black italic text-slate-800 no-hover-row border-b-2 border-slate-300">
                      <td className="px-6 py-3 text-right text-[11px] uppercase border-r border-slate-200">উপ-মোট: {m}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-amber-900 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.uQA))}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-amber-900 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.rAQC))}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-amber-900 font-extrabold">{toBengaliDigits(Math.round(mSubTotal.rAQA))}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-400">
                <td className="px-6 py-4 text-right text-[13px] uppercase tracking-tighter bg-slate-200 text-slate-900 border-r border-slate-300 font-black">
                  সর্বমোট সেটআপ তথ্য:
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-amber-950 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.uQA))}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-amber-950 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.rAQC))}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-amber-950 font-black border-r border-slate-300">
                  {toBengaliDigits(Math.round(totalStats.rAQA))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ষাণ্মাসিক জের (Half-Yearly Balance Table with Categories) */}
        {/* ============================================================== */}
        {activeTab === 'halfYearly' && (
          <table id="opening-setup-table" className="text-sm">
            <thead className="bg-slate-200">
              {/* লেভেল ১: গ্রুপ হেডার */}
              <tr className="hdr-row-1 bg-slate-200">
                <th rowSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] w-[6%] bg-slate-200 border-b border-r border-slate-300">
                  ক্রমিক নং
                </th>
                <th rowSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] w-[18%] bg-slate-200 border-b border-r border-slate-300">
                  শ্রেণী
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  পূর্ববর্তী ৬ মাস পর্যন্ত অনিষ্পন্ন
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  আলোচ্য ৬ মাসে উত্থাপিত
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  আলোচ্য ৬ মাসে নিষ্পত্তি
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  ষাণ্মাসিক শেষে অনিষ্পন্ন
                </th>
              </tr>
              {/* লেভেল ২: কলামের নাম (সংখ্যা / টাকা) */}
              <tr className="hdr-row-2 bg-slate-200">
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[9%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[10%]">
                  টাকা (কোটি)
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[9%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[10%]">
                  টাকা (কোটি)
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[9%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[10%]">
                  টাকা (কোটি)
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[9%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[10%]">
                  টাকা (কোটি)
                </th>
              </tr>
              {/* লেভেল ৩: কলাম ক্রমিক নম্বর */}
              <tr className="hdr-row-3 bg-slate-200 text-slate-900 font-black text-[12px] text-center border-b border-slate-300">
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(১)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(২)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৩)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৪)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৫)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৬)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৭)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৮)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৯: (৩+৫)-৭)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(১০: (৪+৬)-৮)</th>
              </tr>
            </thead>

            <tbody>
              {HR1_CATEGORIES.map(cat => {
                const calc = halfYearlyCalculatedData[cat.id] || {
                  col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0, col9_finalCount: 0, col10_finalAmount: 0
                };
                const s = getHalfYearlyStats(cat.name);

                const pCount = parseBengaliNumber(s.halfYearlyPrevUnsettledCount) || 0;
                const pAmount = parseBengaliNumber(s.halfYearlyPrevUnsettledAmount) || 0;
                const rCount = parseBengaliNumber(s.halfYearlyRaisedCount) || 0;
                const rAmount = parseBengaliNumber(s.halfYearlyRaisedAmount) || 0;
                const sCount = parseBengaliNumber(s.halfYearlySettledCount) || 0;
                const sAmount = parseBengaliNumber(s.halfYearlySettledAmount) || 0;

                const editFinalCount = (pCount + rCount) - sCount;
                const editFinalAmount = (pAmount + rAmount) - sAmount;

                return (
                  <tr key={cat.id} className="hover:bg-indigo-50/40 transition-all group bg-white">
                    <td className="px-3 py-3.5 text-center font-black text-slate-800 text-[13px] bg-white border-r border-b border-slate-200">
                      {toBengaliDigits(cat.id)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 text-[13px] bg-white group-hover:text-indigo-800 border-r border-b border-slate-200">
                      {cat.name}
                    </td>

                    {isEditingSetup ? (
                      <>
                        {halfYearlyFields.map(f => (
                          <td key={f.key} className="p-1.5 text-center align-middle h-14 border-r border-b border-slate-100 bg-white group-hover:bg-indigo-50">
                            <input 
                              type="text" 
                              className="w-full h-11 text-center font-bold text-[14px] md:text-[15px] outline-none border-0 transition-all bg-white text-slate-900 cursor-text hover:bg-indigo-50/50 focus:bg-amber-50 focus:ring-2 focus:ring-blue-500 rounded-lg" 
                              placeholder="০" 
                              value={
                                s[f.key] !== undefined &&
                                s[f.key] !== '' &&
                                s[f.key] !== 0
                                  ? toBengaliDigits(s[f.key])
                                  : ''
                              } 
                              onPaste={(e) => handleTabPaste(e, cat.name, f.key, halfYearlyFields)} 
                              onChange={e => { 
                                let raw = e.target.value.replace(/,/g, '.');
                                const eng = toEnglishDigits(raw);
                                if (raw !== '' && !/^[0-9]*\.?[0-9]*$/.test(eng)) {
                                  return;
                                }
                                const valToStore = raw === '' ? 0 : toBengaliDigits(raw);
                                const isFinancialInst = selectedHalfYearlyMinistry.includes('আর্থিক প্রতিষ্ঠান');
                                const specificKey = `${selectedHalfYearlyMinistry}_${cat.name}`;
                                setTempPrevStats(prev => {
                                  const next = { ...prev };
                                  next[specificKey] = {
                                    ...(next[specificKey] || {}),
                                    [f.key]: valToStore
                                  };
                                  if (isFinancialInst) {
                                    next[cat.name] = {
                                      ...(next[cat.name] || {}),
                                      [f.key]: valToStore
                                    };
                                  }
                                  return next;
                                });
                              }} 
                            />
                          </td>
                        ))}
                        {/* Auto-computed Closing in Edit Mode */}
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-indigo-50/40 text-indigo-950 font-black text-[13px]">
                          {toBengaliDigits(editFinalCount)}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-indigo-50/40 text-indigo-950 font-black text-[13px]">
                          {toBengaliDigits(editFinalAmount.toFixed(4).replace(/\.?0+$/, ''))}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-slate-50 font-bold text-slate-800 text-[13px]">
                          {toBengaliDigits(calc.col3_pCount)}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-slate-50 font-bold text-slate-800 text-[13px]">
                          {toBengaliDigits(calc.col4_pAmount.toFixed(4).replace(/\.?0+$/, ''))}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-amber-50/30 font-bold text-amber-900 text-[13px]">
                          {toBengaliDigits(calc.col5_cCount)}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-amber-50/30 font-bold text-amber-900 text-[13px]">
                          {toBengaliDigits(calc.col6_cAmount.toFixed(4).replace(/\.?0+$/, ''))}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-emerald-50/40 font-extrabold text-emerald-900 text-[13px]">
                          {toBengaliDigits(calc.col7_sCount)}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-emerald-50/40 font-extrabold text-emerald-900 text-[13px]">
                          {toBengaliDigits(calc.col8_sAmount.toFixed(4).replace(/\.?0+$/, ''))}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-indigo-50/50 font-black text-indigo-950 text-[13px]">
                          {toBengaliDigits(calc.col9_finalCount)}
                        </td>
                        <td className="p-2 text-center align-middle h-14 border-r border-b border-slate-200 bg-indigo-50/50 font-black text-indigo-950 text-[13px]">
                          {toBengaliDigits(calc.col10_finalAmount.toFixed(4).replace(/\.?0+$/, ''))}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Sticky Table Footer */}
            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-400">
                <td colSpan={2} className="px-6 py-4 text-center text-[13px] uppercase tracking-tighter bg-slate-200 text-slate-900 border-r border-slate-300 font-black">
                  মোট
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-slate-900 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hyPUC)}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-slate-900 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hyPUA.toFixed(4).replace(/\.?0+$/, ''))}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-amber-950 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hyRC)}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-amber-950 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hyRA.toFixed(4).replace(/\.?0+$/, ''))}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-emerald-950 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hySC)}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-emerald-950 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hySA.toFixed(4).replace(/\.?0+$/, ''))}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-indigo-950 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hyFC)}
                </td>
                <td className="p-3 text-center text-[14px] bg-slate-200 text-indigo-950 font-black border-r border-slate-300">
                  {toBengaliDigits(halfYearlyTotals.hyFA.toFixed(4).replace(/\.?0+$/, ''))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* ============================================================== */}
        {/* TAB 4: বাৎসরিক জের (Yearly Balance Table with Excel Paste Support) */}
        {/* ============================================================== */}
        {activeTab === 'yearly' && (
          <table id="opening-setup-table" className="text-sm">
            <thead className="bg-slate-200">
              <tr className="hdr-row-1 bg-slate-200">
                <th rowSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] w-[32%] bg-slate-200 border-b border-r border-slate-300">
                  মন্ত্রণালয় ও সংস্থা
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  পূর্ববর্তী অর্থবছর পর্যন্ত অবশিষ্ট জের
                </th>
                <th colSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 text-[13px] md:text-[14px] bg-slate-200 border-b border-r border-slate-300 tracking-wide">
                  চলতি অর্থবছর মোট নিষ্পত্তি/আদায়
                </th>
              </tr>
              <tr className="hdr-row-2 bg-slate-200">
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[17%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[17%]">
                  টাকা (কোটি)
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[17%]">
                  সংখ্যা
                </th>
                <th className="py-2 px-3 text-center font-black text-slate-900 text-[12px] bg-slate-200 border-b border-r border-slate-300 w-[17%]">
                  টাকা (কোটি)
                </th>
              </tr>
              <tr className="hdr-row-3 bg-slate-200 text-slate-900 font-black text-[12px] text-center border-b border-slate-300">
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(১)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(২)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৩)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৪)</th>
                <th className="py-1 px-3 text-center font-black text-slate-800 bg-slate-200 border-r border-b border-slate-300 text-[11px]">(৫)</th>
              </tr>
            </thead>

            <tbody>
              {ministryGroups.map(m => {
                const entities = MINISTRY_ENTITY_MAP[m] || [];
                const mSubTotal = entities.reduce((acc, ent) => {
                  const s = tempPrevStats[ent] || {};
                  acc.yPUC += s.yearlyPrevUnsettledCount || 0;
                  acc.yPUA += Number(s.yearlyPrevUnsettledAmount || 0);
                  acc.ySC += s.yearlySettledCount || 0;
                  acc.ySA += Number(s.yearlySettledAmount || 0);
                  return acc;
                }, { yPUC: 0, yPUA: 0, ySC: 0, ySA: 0 });

                return (
                  <React.Fragment key={m}>
                    <tr className="bg-[#1e293b] no-hover-row">
                      <td colSpan={5} className="px-5 py-3 bg-[#1e293b]">
                        <div className="flex items-center gap-2 font-black uppercase text-[12px] tracking-wide text-white">
                          <LayoutGrid size={15} className="text-teal-400" /> {m}
                        </div>
                      </td>
                    </tr>
                    {entities.map(ent => (
                      <tr key={ent} className="hover:bg-teal-50/40 transition-all group bg-white">
                        <td className="px-6 py-3.5 font-bold text-slate-800 text-[13px] bg-white group-hover:text-teal-800 border-r border-b border-slate-200">
                          {ent}
                        </td>
                        {yearlyFields.map(f => (
                          <td key={f.key} className={`p-1.5 text-center align-middle h-14 border-r border-b border-slate-100 ${isEditingSetup ? 'bg-white group-hover:bg-teal-50' : 'bg-slate-50'}`}>
                            <input 
                              type="text" 
                              readOnly={!isEditingSetup}
                              className={`w-full h-11 text-center font-bold text-[14px] md:text-[15px] outline-none border-0 transition-all ${
                                isEditingSetup 
                                  ? 'bg-white text-slate-900 cursor-text hover:bg-teal-50/50 focus:bg-amber-50 focus:ring-2 focus:ring-blue-500 rounded-lg' 
                                  : 'bg-slate-50 text-slate-700 cursor-not-allowed'
                              }`} 
                              placeholder="০" 
                              value={
                                tempPrevStats[ent]?.[f.key] !== undefined &&
                                tempPrevStats[ent]![f.key] !== '' &&
                                tempPrevStats[ent]![f.key] !== 0
                                  ? toBengaliDigits(tempPrevStats[ent]![f.key])
                                  : ''
                              } 
                              onPaste={(e) => handleTabPaste(e, ent, f.key, yearlyFields)} 
                              onChange={e => { 
                                if (!isEditingSetup) return;
                                let raw = e.target.value.replace(/,/g, '.');
                                const eng = toEnglishDigits(raw);
                                if (raw !== '' && !/^[0-9]*\.?[0-9]*$/.test(eng)) {
                                  return;
                                }
                                const valToStore = raw === '' ? 0 : toBengaliDigits(raw);
                                setTempPrevStats(prev => ({ 
                                  ...prev, 
                                  [ent]: { 
                                    ...(prev[ent] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 }), 
                                    [f.key]: valToStore 
                                  } 
                                })); 
                              }} 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-teal-50/60 font-black italic text-slate-800 no-hover-row border-b-2 border-slate-300">
                      <td className="px-6 py-3 text-right text-[11px] uppercase border-r border-slate-200">উপ-মোট: {m}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-teal-900 font-extrabold">{toBengaliDigits(mSubTotal.yPUC)}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-teal-900 font-extrabold">{toBengaliDigits(mSubTotal.yPUA.toFixed(4).replace(/\.?0+$/, ''))}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-teal-900 font-extrabold">{toBengaliDigits(mSubTotal.ySC)}</td>
                      <td className="p-3 text-center border-r border-slate-200 text-teal-900 font-extrabold">{toBengaliDigits(mSubTotal.ySA.toFixed(4).replace(/\.?0+$/, ''))}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-400">
                <td className="px-6 py-4 text-right text-[13px] uppercase tracking-tighter bg-slate-200 text-slate-900 border-r border-slate-300 font-black">
                  সর্বমোট সেটআপ তথ্য:
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-teal-950 font-black border-r border-slate-300">
                  {toBengaliDigits(totalStats.yPUC)}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-teal-950 font-black border-r border-slate-300">
                  {toBengaliDigits(totalStats.yPUA.toFixed(4).replace(/\.?0+$/, ''))}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-teal-950 font-black border-r border-slate-300">
                  {toBengaliDigits(totalStats.ySC)}
                </td>
                <td className="p-4 text-center text-[15px] bg-slate-200 text-teal-950 font-black border-r border-slate-300">
                  {toBengaliDigits(totalStats.ySA.toFixed(4).replace(/\.?0+$/, ''))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default OpeningBalanceSetup;
