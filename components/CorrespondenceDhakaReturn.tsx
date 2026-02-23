
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Printer, ChevronLeft, Search, X, ChevronDown, Check, LayoutGrid, FileText } from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';

interface CorrespondenceDhakaReturnProps {
  filteredCorrespondence: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
}

const CorrespondenceDhakaReturn: React.FC<CorrespondenceDhakaReturnProps> = ({
  filteredCorrespondence,
  activeCycle,
  setSelectedReportType,
  HistoricalFilter,
  IDBadge
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParaType, setFilterParaType] = useState('সকল');
  const [filterLetterType, setFilterLetterType] = useState('সকল');
  
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) setIsBranchDropdownOpen(false);
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) setIsTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const branchOptions = useMemo(() => {
    const unique = Array.from(new Set(filteredCorrespondence.map(e => e.paraType).filter(Boolean)));
    return ['সকল', ...unique];
  }, [filteredCorrespondence]);

  const typeOptions = useMemo(() => {
    const unique = Array.from(new Set(filteredCorrespondence.map(e => e.letterType).filter(Boolean)));
    return ['সকল', ...unique];
  }, [filteredCorrespondence]);

  const filteredData = useMemo(() => {
    let data = filteredCorrespondence;
    
    if (filterParaType !== 'সকল') {
      data = data.filter(e => e.paraType === filterParaType);
    }
    
    if (filterLetterType !== 'সকল') {
      data = data.filter(e => e.letterType === filterLetterType);
    }

    if (!searchTerm.trim()) return data;
    return data.filter(entry => 
      (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.diaryNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.letterNo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredCorrespondence, searchTerm, filterParaType, filterLetterType]);

  const thS = "border border-slate-300 px-1 py-1 font-black text-center text-[10px] md:text-[11px] bg-slate-200 text-slate-900 leading-tight align-middle h-full shadow-[inset_0_0_0_1px_#cbd5e1] bg-clip-border";
  const customDropdownCls = (isOpen: boolean) => `relative flex items-center gap-3 px-4 h-[44px] bg-slate-50 border rounded-xl cursor-pointer transition-all duration-300 ${isOpen ? 'border-emerald-600 ring-4 ring-emerald-50 shadow-md z-[1010]' : 'border-slate-300 shadow-sm hover:border-slate-300'}`;
  const tdS = "border border-slate-300 px-2 py-2 text-[10px] md:text-[11px] text-center font-bold leading-tight bg-white h-[40px] align-middle overflow-hidden break-words";
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
          {/* Branch Filter */}
          <div className="space-y-1" ref={branchDropdownRef}>
            <div 
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} 
              className={customDropdownCls(isBranchDropdownOpen) + " min-w-[160px]"}
            >
              <LayoutGrid size={16} className="text-emerald-600" />
              <span className="font-bold text-[12px] text-slate-900 truncate">
                {filterParaType === 'সকল' ? 'সকল শাখা' : filterParaType}
              </span>
              <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isBranchDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              
              {isBranchDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[180px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="max-h-[250px] overflow-y-auto no-scrollbar py-2">
                    {branchOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={(e) => { e.stopPropagation(); setFilterParaType(opt); setIsBranchDropdownOpen(false); }} 
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterParaType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[12px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'সকল শাখা' : opt}</span>
                        {filterParaType === opt && <Check size={14} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1" ref={typeDropdownRef}>
            <div 
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} 
              className={customDropdownCls(isTypeDropdownOpen) + " min-w-[160px]"}
            >
              <FileText size={16} className="text-emerald-600" />
              <span className="font-bold text-[12px] text-slate-900 truncate">
                {filterLetterType === 'সকল' ? 'সকল ধরণ' : filterLetterType}
              </span>
              <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              
              {isTypeDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[180px] bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="max-h-[250px] overflow-y-auto no-scrollbar py-2">
                    {typeOptions.map((opt, idx) => (
                      <div 
                        key={idx} 
                        onClick={(e) => { e.stopPropagation(); setFilterLetterType(opt); setIsTypeDropdownOpen(false); }} 
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${filterLetterType === opt ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700 font-bold text-[12px]'}`}
                      >
                        <span>{opt === 'সকল' ? 'সকল ধরণ' : opt}</span>
                        {filterLetterType === opt && <Check size={14} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative group min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="ডায়েরি, স্মারক বা বিবরণ দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
