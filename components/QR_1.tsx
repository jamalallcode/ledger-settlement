import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Printer, Sparkles, ChevronDown, BarChart3, FileSpreadsheet, X, Building2, Landmark, Check, CalendarDays } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP } from '../constants';
import { getQuarterlyCycleForDate } from '../utils/cycleHelper';

interface QRProps {
  entries: SettlementEntry[];
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
}

const QR_1: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle }) => {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  // Standard calendar quarter date calculation:
  // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
  // Each quarter start date is the 16th of the month preceding the quarter's start month.
  // Each quarter end date is the 15th of the quarter's end month.
  const getQuarterInfo = (date: Date) => {
    const cycleEndMonth = date.getMonth(); // 0 to 11
    const year = date.getFullYear();
    let quarterStartMonth = 0;
    let quarterEndMonth = 2;
    let quarterYear = year;

    if (cycleEndMonth >= 0 && cycleEndMonth <= 2) {
      quarterStartMonth = 0; // Jan
      quarterEndMonth = 2;   // Mar
    } else if (cycleEndMonth >= 3 && cycleEndMonth <= 5) {
      quarterStartMonth = 3; // Apr
      quarterEndMonth = 5;   // Jun
    } else if (cycleEndMonth >= 6 && cycleEndMonth <= 8) {
      quarterStartMonth = 6; // Jul
      quarterEndMonth = 8;   // Sep
    } else {
      quarterStartMonth = 9; // Oct
      quarterEndMonth = 11;  // Dec
    }

    const start = new Date(quarterYear, quarterStartMonth, 1);
    const end = new Date(quarterYear, quarterEndMonth + 1, 0);
    
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const startMonthName = months[quarterStartMonth];
    const endMonthName = months[quarterEndMonth];
    
    const startYearShort = format(new Date(quarterYear, quarterStartMonth, 1), 'yy');
    const endYearShort = format(new Date(quarterYear, quarterEndMonth, 1), 'yy');

    const formattedRange = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;
    
    return {
      startDate: start,
      endDate: end,
      startMonthName,
      endMonthName,
      formattedRange
    };
  };

  const { startDate, endDate, startMonthName, endMonthName, formattedRange } = getQuarterInfo(activeCycle.end);

  const downloadExcel = () => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return;

    let tablesHtml = '';
    tables.forEach((table, tableIdx) => {
      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
      interactiveElements.forEach(el => el.remove());
      
      tablesHtml += `
        <div style="margin-bottom: 40px;">
          ${tableIdx > 0 ? '<br><hr><br>' : ''}
          ${clonedTable.outerHTML}
        </div>
      `;
    });

    const filename = `ত্রৈমাসিক_রিটার্ন_১_দ্বিপক্ষীয়_সভা_${format(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>রিপোর্ট</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .bg-sky-100 { background-color: #e0f2fe !important; }
          .bg-amber-50 { background-color: #fef3c7 !important; }
          .bg-black { background-color: #090d16 !important; color: #ffffff !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">ত্রৈমাসিক রিটার্ন - ১: দ্বিপক্ষীয় সভা (কাযবিবরনী)</h2>
        ${tablesHtml}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateBangla = (date: Date) => {
    return toBengaliDigits(format(date, 'dd/MM/yyyy'));
  };

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const isEntityMatch = (entryEntity: string = '', targetEntity: string = ''): boolean => {
    const normEntry = robustNormalize(entryEntity);
    const normTarget = robustNormalize(targetEntity);
    if (!normEntry || !normTarget) return false;
    if (normEntry === normTarget) return true;
    if (normEntry.includes(normTarget) || normTarget.includes(normEntry)) return true;
    return false;
  };

  // Multi-select filters state (Cycle, Ministry, Entity)
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  const [isCycleOpen, setIsCycleOpen] = useState(false);
  const [isMinOpen, setIsMinOpen] = useState(false);
  const [isEntOpen, setIsEntOpen] = useState(false);

  const cycleDropdownRef = useRef<HTMLDivElement>(null);
  const minDropdownRef = useRef<HTMLDivElement>(null);
  const entDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(e.target as Node)) {
        setIsCycleOpen(false);
      }
      if (minDropdownRef.current && !minDropdownRef.current.contains(e.target as Node)) {
        setIsMinOpen(false);
      }
      if (entDropdownRef.current && !entDropdownRef.current.contains(e.target as Node)) {
        setIsEntOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleOptions = useMemo(() => {
    const list: { label: string; start: Date; end: Date; startStr: string; endStr: string }[] = [];
    const baseDate = activeCycle?.end ? new Date(activeCycle.end) : new Date();
    for (let i = -3; i <= 3; i++) {
      const targetDate = addMonths(baseDate, i * 3);
      const c = getQuarterlyCycleForDate(targetDate);
      if (!list.some(item => item.label === c.label)) {
        list.push({
          label: c.label,
          start: c.start,
          end: c.end,
          startStr: format(c.start, 'yyyy-MM-dd'),
          endStr: format(c.end, 'yyyy-MM-dd')
        });
      }
    }
    return list;
  }, [activeCycle]);

  const ministryOptions = useMemo(() => {
    const set = new Set<string>();
    Object.keys(MINISTRY_ENTITY_MAP).forEach(m => set.add(m));
    entries.forEach(e => {
      if (e.ministryName && e.ministryName.trim()) {
        set.add(e.ministryName.trim());
      }
    });
    return Array.from(set);
  }, [entries]);

  const entityOptions = useMemo(() => {
    const set = new Set<string>();
    const ministriesToInclude = selectedMinistries.length > 0 ? selectedMinistries : ministryOptions;
    
    ministriesToInclude.forEach(m => {
      if (MINISTRY_ENTITY_MAP[m]) {
        MINISTRY_ENTITY_MAP[m].forEach(ent => set.add(ent));
      }
      entries.forEach(e => {
        if (e.entityName && e.entityName.trim()) {
          const matchMin = selectedMinistries.length === 0 || 
            selectedMinistries.some(sm => robustNormalize(e.ministryName || '').includes(robustNormalize(sm)));
          if (matchMin) {
            set.add(e.entityName.trim());
          }
        }
      });
    });
    return Array.from(set);
  }, [selectedMinistries, ministryOptions, entries]);

  const filteredData = entries.filter(e => {
    // Filter by Non-SFI
    if (robustNormalize(e.paraType) !== robustNormalize('নন এসএফআই')) return false;
    
    // Filter only by bilateral meetings
    const mType = robustNormalize(e.meetingType || e.letterType || '');
    const isValidType = mType.includes(robustNormalize('দ্বিপক্ষীয়')) || 
                        mType.includes(robustNormalize('দ্বিপাক্ষিক'));
    if (!isValidType) return false;

    // Filter by Date Range (Issue Date based on activeCycle or selectedCycles)
    const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
    if (!issueDateStr) return false;
    const entryDateOnly = issueDateStr.split('T')[0];
    
    if (selectedCycles.length > 0) {
      const matchedCycle = cycleOptions.find(c => selectedCycles.includes(c.label) && entryDateOnly >= c.startStr && entryDateOnly <= c.endStr);
      if (!matchedCycle) return false;
    } else if (activeCycle?.start && activeCycle?.end) {
      const cycleStartStr = format(activeCycle.start, 'yyyy-MM-dd');
      const cycleEndStr = format(activeCycle.end, 'yyyy-MM-dd');
      if (entryDateOnly < cycleStartStr || entryDateOnly > cycleEndStr) return false;
    } else {
      const issueDate = new Date(issueDateStr);
      if (issueDate < startDate || issueDate > endDate) return false;
    }

    // Filter by Ministry
    let matchMinistry = true;
    if (selectedMinistries.length > 0) {
      matchMinistry = selectedMinistries.some(m => robustNormalize(e.ministryName || '').includes(robustNormalize(m)) || robustNormalize(m).includes(robustNormalize(e.ministryName || '')));
    } else if (filterMinistry !== '') {
      matchMinistry = robustNormalize(e.ministryName).includes(robustNormalize(filterMinistry));
    }
    if (!matchMinistry) return false;

    // Filter by Entity
    if (selectedEntities.length > 0) {
      const matchEntity = selectedEntities.some(ent => isEntityMatch(e.entityName || '', ent));
      if (!matchEntity) return false;
    }
    
    // Filter by Search Term
    const matchSearch = searchTerm === '' || 
      robustNormalize(e.ministryName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      robustNormalize(e.entityName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      robustNormalize(e.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchSearch;
  });

  const totals = filteredData.reduce((acc, curr) => {
    const discussed = parseInt(toEnglishDigits(curr.meetingDiscussedParaCount || curr.meetingSentParaCount || '0')) || 0;
    const recommended = parseInt(toEnglishDigits(curr.meetingRecommendedParaCount || curr.meetingSettledParaCount || '0')) || 0;
    const settled = curr.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0;
    
    const settledAmount = curr.paragraphs && curr.paragraphs.length > 0
      ? curr.paragraphs
          .reduce((sum, p) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0)
      : ((curr.totalRec || 0) + (curr.totalAdj || 0));

    return {
      sentPara: acc.sentPara + discussed,
      recommendedPara: acc.recommendedPara + recommended,
      settledPara: acc.settledPara + settled,
      amount: acc.amount + settledAmount,
      recovery: acc.recovery + (curr.totalRec || 0),
      adjustment: acc.adjustment + (curr.totalAdj || 0),
      involvedAmount: acc.involvedAmount + (curr.involvedAmount || 0),
      others: acc.others + 0,
    };
  }, { sentPara: 0, recommendedPara: 0, settledPara: 0, amount: 0, recovery: 0, adjustment: 0, involvedAmount: 0, others: 0 });

  const thCls = "border-r border-b border-slate-400 p-1.5 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center leading-tight";
  const thClsWithTop = thCls + " border-t border-slate-400";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white text-center align-middle font-bold bg-black";

  return (
    <div id="qr-1-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-1-container" />

      {/* Action Bar (No Print) */}
      <div className="flex flex-wrap justify-end items-center gap-3 mb-4 no-print">
        <div className="flex items-center gap-2 flex-wrap">
          {monthPickerElement && (
            <div className="select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}

          {/* Cycle Multi-Select Filter */}
          <div className="relative select-none z-[300]" ref={cycleDropdownRef}>
            <div
              onClick={() => setIsCycleOpen(!isCycleOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-lg cursor-pointer text-[11px] font-bold shadow-xs ${
                selectedCycles.length > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <CalendarDays size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[130px]">
                {selectedCycles.length === 0
                  ? 'সকল সাইকেল'
                  : selectedCycles.length === 1
                  ? selectedCycles[0]
                  : `${toBengaliDigits(selectedCycles.length.toString())}টি সাইকেল`}
              </span>
              {selectedCycles.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px]">
                  {toBengaliDigits(selectedCycles.length.toString())}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${isCycleOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </div>

            {isCycleOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-[270px] bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarDays size={11} /> সাইকেল নির্বাচন
                  </span>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => setSelectedCycles([])}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                      selectedCycles.length === 0
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>সকল সাইকেল</span>
                    {selectedCycles.length === 0 && <Check size={13} />}
                  </div>
                  {cycleOptions.map((opt, idx) => {
                    const isSelected = selectedCycles.includes(opt.label);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCycles(selectedCycles.filter(c => c !== opt.label));
                          } else {
                            setSelectedCycles([...selectedCycles, opt.label]);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCycleOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ministry Multi-Select Filter */}
          <div className="relative select-none z-[290]" ref={minDropdownRef}>
            <div
              onClick={() => setIsMinOpen(!isMinOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-lg cursor-pointer text-[11px] font-bold shadow-xs ${
                selectedMinistries.length > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Building2 size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[130px]">
                {selectedMinistries.length === 0
                  ? 'সকল মন্ত্রণালয়'
                  : selectedMinistries.length === 1
                  ? selectedMinistries[0]
                  : `${toBengaliDigits(selectedMinistries.length.toString())}টি মন্ত্রণালয়`}
              </span>
              {selectedMinistries.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px]">
                  {toBengaliDigits(selectedMinistries.length.toString())}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${isMinOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </div>

            {isMinOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-[260px] bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 size={11} /> মন্ত্রণালয় নির্বাচন
                  </span>
                  {selectedMinistries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMinistries([])}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => {
                      setSelectedMinistries([]);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                      selectedMinistries.length === 0
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>সকল মন্ত্রণালয়</span>
                    {selectedMinistries.length === 0 && <Check size={13} />}
                  </div>
                  {ministryOptions.map((m, idx) => {
                    const isSelected = selectedMinistries.includes(m);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMinistries(selectedMinistries.filter(item => item !== m));
                          } else {
                            setSelectedMinistries([...selectedMinistries, m]);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMinOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Entity Multi-Select Filter */}
          <div className="relative select-none z-[280]" ref={entDropdownRef}>
            <div
              onClick={() => setIsEntOpen(!isEntOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all rounded-lg cursor-pointer text-[11px] font-bold shadow-xs ${
                selectedEntities.length > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Landmark size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[130px]">
                {selectedEntities.length === 0
                  ? 'সকল সংস্থা'
                  : selectedEntities.length === 1
                  ? selectedEntities[0]
                  : `${toBengaliDigits(selectedEntities.length.toString())}টি সংস্থা`}
              </span>
              {selectedEntities.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px]">
                  {toBengaliDigits(selectedEntities.length.toString())}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${isEntOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </div>

            {isEntOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-[260px] bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Landmark size={11} /> সংস্থা নির্বাচন
                  </span>
                  {selectedEntities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedEntities([])}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                  <div
                    onClick={() => {
                      setSelectedEntities([]);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                      selectedEntities.length === 0
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>সকল সংস্থা</span>
                    {selectedEntities.length === 0 && <Check size={13} />}
                  </div>
                  {entityOptions.map((ent, idx) => {
                    const isSelected = selectedEntities.includes(ent);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedEntities(selectedEntities.filter(item => item !== ent));
                          } else {
                            setSelectedEntities([...selectedEntities, ent]);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{ent}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEntOpen(false)}
                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>



          <button
            type="button"
            onClick={downloadExcel}
            className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 transition-all rounded-lg cursor-pointer shrink-0 shadow-xs"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-3 pt-1 relative z-[260]">
        <div className="inline-block relative">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {customTitle ? `${customTitle}: দ্বিপক্ষীয় সভা (কাযবিবরনী)` : "ত্রৈমাসিক রিটার্ন: দ্বিপক্ষীয় সভা (কাযবিবরনী)"}
          </h1>

          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
          <div className="inline-block border-b border-slate-900 pb-0.5">
            <span className="text-sm font-black text-slate-900">ছক: ৪(খ)</span>
          </div>
        </div>
      </div>

      {/* Info Section + Lowered statistics button */}
      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-x-4 gap-y-2 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p><span className="text-slate-500">বিষয়ঃ</span> দ্বিপক্ষীয় সভা (কাযবিবরনী) - AIR এ আপত্তি নিষ্পত্তির অগ্রগতি ও সুপারিশের ত্রৈমাসিক প্রতিবেদন</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">শাখাঃ</span> নন এসএফআই শাখা</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
        </div>

        {/* Statistics Button */}
        <div className="relative no-print shrink-0">
          <button
            type="button"
            onClick={() => setIsStatsOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-[11px] border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:border-blue-200 cursor-pointer"
          >
            <Sparkles size={13} className="text-blue-500" />
            পরিসংখ্যান
            <ChevronDown size={11} className={`text-blue-400 transition-transform duration-300 ${isStatsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isStatsOpen && (
            <div 
              className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
              onClick={() => setIsStatsOpen(false)}
            >
              <div 
                className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    <span className="text-blue-900 font-black text-sm">ত্রৈমাসিক রিপোর্ট পরিসংখ্যান</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStatsOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 space-y-2.5 text-slate-700 text-xs font-bold overflow-y-auto">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>সর্বমোট আলোচিত অনুচ্ছেদ:</span>
                    <span className="text-blue-700 font-black">{toBengaliDigits(totals.sentPara ?? 0)} টি</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>সর্বমোট সুপারিশকৃত অনুচ্ছেদ:</span>
                    <span className="text-amber-700 font-black">{toBengaliDigits(totals.recommendedPara ?? 0)} টি</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>মোট জড়িত টাকা:</span>
                    <span className="text-slate-900 font-black">{toBengaliDigits(Math.round(totals.involvedAmount ?? 0))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <span>সর্বমোট আদায়:</span>
                    <span className="font-black">{toBengaliDigits(Math.round(totals.recovery ?? 0))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-indigo-50 text-indigo-800">
                    <span>সর্বমোট সমন্বয়:</span>
                    <span className="font-black">{toBengaliDigits(Math.round(totals.adjustment ?? 0))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-teal-50 text-teal-800">
                    <span>মোট নিষ্পন্ন টাকা:</span>
                    <span className="font-black">{toBengaliDigits(Math.round(totals.amount ?? 0))} টাকা</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-emerald-100/70 text-emerald-950 font-black text-sm">
                    <span>সর্বমোট নিষ্পত্তিকৃত অনুচ্ছেদ:</span>
                    <span className="text-emerald-700">{toBengaliDigits(totals.settledPara ?? 0)} টি</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container qr-table-container overflow-visible shadow-sm rounded-lg">
        <style>{`
          #qr-1-table thead {
            position: -webkit-sticky !important;
            position: sticky !important;
            top: 0px !important;
            z-index: 140 !important;
            background-color: #e2e8f0 !important;
          }
          #qr-1-table thead th {
            position: -webkit-sticky !important;
            position: sticky !important;
            background-color: #e2e8f0 !important;
            background-clip: padding-box !important;
            vertical-align: middle !important;
            opacity: 1 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          #qr-1-table thead tr:first-child th {
            top: 0px !important;
            height: 40px !important;
            z-index: 145 !important;
          }
          #qr-1-table thead tr:first-child th[rowspan],
          #qr-1-table thead tr:first-child th[rowSpan] {
            top: 0px !important;
            height: 72px !important;
            z-index: 146 !important;
          }
          #qr-1-table thead tr:nth-child(2) th {
            top: 40px !important;
            height: 32px !important;
            z-index: 144 !important;
          }
          #qr-1-table thead tr:nth-child(3) th {
            top: 72px !important;
            height: 28px !important;
            z-index: 143 !important;
            white-space: nowrap !important;
          }
          #qr-1-table thead tr:first-child th:nth-child(9) {
            width: 90px !important;
            max-width: 95px !important;
            line-height: 1.25 !important;
          }
          #qr-1-table thead tr:nth-child(2) th:nth-child(1),
          #qr-1-table thead tr:nth-child(2) th:nth-child(2),
          #qr-1-table thead tr:nth-child(2) th:nth-child(3) {
            width: 78px !important;
            min-width: 78px !important;
          }
          #qr-1-table thead tr:nth-child(3) th:nth-child(9) {
            width: 90px !important;
            max-width: 95px !important;
          }
          #qr-1-table thead tr:nth-child(3) th:nth-child(10),
          #qr-1-table thead tr:nth-child(3) th:nth-child(11),
          #qr-1-table thead tr:nth-child(3) th:nth-child(12) {
            width: 78px !important;
            min-width: 78px !important;
          }
        `}</style>
        <table id="qr-1-table" className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[40px]">
              <th rowSpan={2} className={`${thClsWithTop} w-[34px]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[12%]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[62px]`}>দ্বি-পক্ষীয় সভার সংখ্যা</th>
              <th rowSpan={2} className={thClsWithTop}>সভা অনুষ্ঠানের তারিখ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[62px]`}>আলোচিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thClsWithTop}>সুপারিশকৃত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thClsWithTop}>কার্য বিবরণী প্রাপ্তির তারিখ</th>
              <th rowSpan={2} className={thClsWithTop}>মীমাংসাপত্র জারীর তারিখ</th>
              <th rowSpan={2} className={`${thClsWithTop} w-[90px] max-w-[95px] leading-tight`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={thClsWithTop}>সভার প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={`${thClsWithTop.replace('p-2', 'p-1')} w-[42px]`}>মন্তব্য</th>
            </tr>
            <tr className="h-[32px]">
              <th className={`${thCls} w-[78px] min-w-[78px]`}>আদায়</th>
              <th className={`${thCls} w-[78px] min-w-[78px]`}>সমন্বয়</th>
              <th className={`${thCls} w-[78px] min-w-[78px]`}>অন্যান্য</th>
            </tr>
            <tr className="h-[28px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(n => (
                <th key={n} className={`${
                  n === 13 ? thCls.replace('p-2', 'p-1') + " w-[42px]" : 
                  (n === 3 || n === 5) ? thCls + " w-[62px]" :
                  n === 9 ? thCls + " w-[90px] max-w-[95px]" :
                  (n === 10 || n === 11 || n === 12) ? thCls + " w-[78px] min-w-[78px]" :
                  thCls
                } text-[10px] font-bold text-slate-500`}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>
                  <HighlightText text={row.ministryName} searchTerm={searchTerm} />
                  {row.entityName && (
                    <>
                      ,<br />
                      <HighlightText text={row.entityName} searchTerm={searchTerm} />
                    </>
                  )}
                  {row.branchName && (
                    <>
                      ,<br />
                      <span className="text-blue-700 font-extrabold text-[10.5px]">
                        <HighlightText text={row.branchName} searchTerm={searchTerm} />
                      </span>
                    </>
                  )}
                  {row.auditYear && (
                    <>
                      <br />
                      <span className="font-bold text-slate-800">({toBengaliDigits(row.auditYear)})</span>
                    </>
                  )}
                </td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits("১")}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingDate || '')}</td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits(row.meetingDiscussedParaCount || row.meetingSentParaCount || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingRecommendedParaCount || row.meetingSettledParaCount || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingResponseDate || '')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.issueLetterNoDate || '')}</td>
                <td className={`${numTdCls} w-[90px] max-w-[95px]`}>
                  {toBengaliDigits(
                    (row.paragraphs && row.paragraphs.length > 0
                      ? row.paragraphs
                          .reduce((sum: number, p: any) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0)
                      : ((row.totalRec || 0) + (row.totalAdj || 0))
                    ).toString()
                  )}
                </td>
                <td className={`${numTdCls} w-[78px] min-w-[78px]`}>{toBengaliDigits(row.totalRec?.toString() || '০')}</td>
                <td className={`${numTdCls} w-[78px] min-w-[78px]`}>{toBengaliDigits(row.totalAdj?.toString() || '০')}</td>
                <td className={`${numTdCls} w-[78px] min-w-[78px]`}></td>
                <td className={tdCls.replace('p-2', 'p-1') + " w-[42px]"}>{row.remarks}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-black h-[32px] qr-sticky-footer qr-sticky-footer-bottom">
            <tr className="bg-black text-white no-hover-row">
              <td className={footerNumTdCls} colSpan={2}>মোট</td>
              <td className={`${footerNumTdCls} w-[62px]`}>
                {toBengaliDigits(filteredData.length.toString())}
              </td>
              <td className={footerNumTdCls}></td>
              <td className={`${footerNumTdCls} w-[62px]`}>
                {toBengaliDigits(totals.sentPara.toString())}
              </td>
              <td className={footerNumTdCls}>
                {toBengaliDigits(totals.recommendedPara.toString())}
              </td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}></td>
              <td className={`${footerNumTdCls} w-[90px] max-w-[95px]`}>
                {toBengaliDigits(totals.amount.toString())}
              </td>
              <td className={`${footerNumTdCls} w-[78px] min-w-[78px]`}>
                {toBengaliDigits(totals.recovery.toString())}
              </td>
              <td className={`${footerNumTdCls} w-[78px] min-w-[78px]`}>
                {toBengaliDigits(totals.adjustment.toString())}
              </td>
              <td className={`${footerNumTdCls} w-[78px] min-w-[78px]`}></td>
              <td className={footerTdCls + " w-[42px]"}></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};

export default QR_1;