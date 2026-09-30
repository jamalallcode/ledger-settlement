import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Printer, Download, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SettlementEntry } from '../types';
import { toBengaliDigits } from '../utils/numberUtils';
import { extractEntryDate } from '../utils/halfYearlyHelper';

interface HRSettledParagraphsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryId: number | null;
  cycleLabel: string;
  cycleSubLabel: string;
  selectedMinistry: string;
  selectedBranchType?: string;
  selectedEntity?: string;
  entries: SettlementEntry[];
  activeCycle: { start: Date; end: Date; label: string; subLabel?: string };
}

export const HRSettledParagraphsModal: React.FC<HRSettledParagraphsModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  categoryId,
  cycleLabel,
  cycleSubLabel,
  selectedMinistry,
  selectedBranchType,
  selectedEntity,
  entries,
  activeCycle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'rec' | 'adj'>('all');

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleAppGoBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('app:goback', handleAppGoBack);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app:goback', handleAppGoBack);
    };
  }, [isOpen, onClose]);

  // Track sidebar width to keep it uncovered
  const [sidebarOffset, setSidebarOffset] = useState<number>(0);

  useEffect(() => {
    const updateOffset = () => {
      const el = document.getElementById('sidebar-container');
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > 0) {
          setSidebarOffset(rect.right);
          return;
        }
      }
      // Desktop default fallback if sidebar container is present in DOM
      if (window.innerWidth >= 1024) {
        setSidebarOffset(126);
      } else {
        setSidebarOffset(0);
      }
    };

    updateOffset();
    const timer = setTimeout(updateOffset, 50);
    window.addEventListener('resize', updateOffset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateOffset);
    };
  }, [isOpen]);

  // Extract all settled paragraphs in the active cycle for selected ministry
  const settledItems = useMemo(() => {
    if (!isOpen || !activeCycle?.start || !activeCycle?.end) return [];

    const startOfDay = new Date(activeCycle.start);
    startOfDay.setHours(0, 0, 0, 0);
    const startTime = startOfDay.getTime();

    const endOfDay = new Date(activeCycle.end);
    endOfDay.setHours(23, 59, 59, 999);
    const endTime = endOfDay.getTime();

    const list: {
      id: string;
      entryId: string;
      entrySl: number;
      ministryName: string;
      entityName: string;
      branchName: string;
      auditYear: string;
      paraNo: string;
      status: string;
      involvedAmount: number;
      recoveryAmount: number;
      adjustmentAmount: number;
      letterNoDate: string;
      meetingType: string;
      remarks: string;
      isRec: boolean;
      isAdj: boolean;
    }[] = [];

    const normTargetMinistry = selectedMinistry && selectedMinistry !== 'সকল'
      ? selectedMinistry.normalize('NFC').replace(/\s+/g, ' ').trim()
      : null;

    (entries || []).forEach(e => {
      if (e.approvalStatus === 'pending') return;
      if (normTargetMinistry) {
        const eMin = (e.ministryName || '').normalize('NFC').replace(/\s+/g, ' ').trim();
        if (eMin && !eMin.includes(normTargetMinistry) && !normTargetMinistry.includes(eMin)) {
          return;
        }
      }

      // Branch Type filter: এসএফআই vs নন-এসএফআই
      if (selectedBranchType && selectedBranchType !== 'সকল' && selectedBranchType !== 'সকল শাখা') {
        const isSFI = selectedBranchType.includes('এসএফআই') && !selectedBranchType.includes('নন');
        const eParaType = (e.paraType || '').trim();
        if (isSFI) {
          if (eParaType && eParaType.includes('নন')) return;
        } else {
          if (eParaType && !eParaType.includes('নন') && eParaType.includes('এসএফআই')) return;
        }
      }

      // Entity filter: যেমন "সোনালী ব্যাংক পিএলসি", "আলীম জুট মিলস লিমিটেড"
      if (selectedEntity && selectedEntity !== 'সকল' && selectedEntity !== 'সকল প্রতিষ্ঠান') {
        const normTargetEntity = selectedEntity.normalize('NFC').replace(/\s+/g, ' ').trim();
        const eEntity = (e.entityName || '').normalize('NFC').replace(/\s+/g, ' ').trim();
        if (eEntity && !eEntity.includes(normTargetEntity) && !normTargetEntity.includes(eEntity)) {
          return;
        }
      }

      const entryDate = extractEntryDate(e);
      if (!entryDate) return;
      const t = entryDate.getTime();
      if (t < startTime || t > endTime) return;

      const letterDate = e.issueLetterNoDate || e.letterNoDate || e.meetingDate || '—';
      const meetingInfo = e.meetingType || e.letterType || 'মীমাংসা সভা';
      const entity = e.entityName || '—';
      const yr = e.auditYear || '—';

      const totalRec = Number(e.totalRec) || 0;
      const totalAdj = Number(e.totalAdj) || 0;

      if (e.paragraphs && e.paragraphs.length > 0) {
        e.paragraphs.forEach((p, pIdx) => {
          const pRec = Number(p.recoveredAmount) || (totalRec > 0 ? totalRec / e.paragraphs.length : 0);
          const pAdj = Number(p.adjustedAmount) || (totalAdj > 0 ? totalAdj / e.paragraphs.length : 0);
          const pInv = Number(p.involvedAmount) || 0;

          list.push({
            id: `${e.id}_${p.id || pIdx}`,
            entryId: e.id,
            entrySl: e.sl || 0,
            ministryName: e.ministryName || '',
            entityName: entity,
            branchName: e.branchName || '',
            auditYear: yr,
            paraNo: p.paraNo || `${pIdx + 1}`,
            status: p.status || 'পূর্ণাঙ্গ',
            involvedAmount: pInv,
            recoveryAmount: pRec,
            adjustmentAmount: pAdj,
            letterNoDate: letterDate,
            meetingType: meetingInfo,
            remarks: e.remarks || '',
            isRec: pRec > 0 || (totalRec > 0 && totalAdj === 0),
            isAdj: pAdj > 0 || (totalAdj > 0 && totalRec === 0)
          });
        });
      } else {
        list.push({
          id: e.id,
          entryId: e.id,
          entrySl: e.sl || 0,
          ministryName: e.ministryName || '',
          entityName: entity,
          branchName: e.branchName || '',
          auditYear: yr,
          paraNo: '১',
          status: 'পূর্ণাঙ্গ',
          involvedAmount: Number(e.involvedAmount) || 0,
          recoveryAmount: totalRec,
          adjustmentAmount: totalAdj,
          letterNoDate: letterDate,
          meetingType: meetingInfo,
          remarks: e.remarks || '',
          isRec: totalRec > 0,
          isAdj: totalAdj > 0
        });
      }
    });

    return list;
  }, [entries, activeCycle, selectedMinistry, selectedBranchType, selectedEntity, isOpen]);

  // Tab counts (excluding partial settlements from paragraph counts)
  const tabCounts = useMemo(() => {
    const isFull = (i: any) => i.status !== 'আংশিক';
    return {
      all: settledItems.filter(isFull).length,
      rec: settledItems.filter(i => isFull(i) && (i.isRec || !i.isAdj)).length,
      adj: settledItems.filter(i => isFull(i) && (i.isAdj || !i.isRec)).length,
    };
  }, [settledItems]);

  // Set initial tab based on clicked category and available data
  useEffect(() => {
    if (!isOpen) return;

    if (categoryId === 6) {
      setActiveTab(tabCounts.rec > 0 ? 'rec' : (tabCounts.all > 0 ? 'all' : 'rec'));
    } else if (categoryId === 5) {
      setActiveTab(tabCounts.adj > 0 ? 'adj' : (tabCounts.all > 0 ? 'all' : 'adj'));
    } else {
      setActiveTab('all');
    }
    setSearchTerm('');
  }, [categoryId, isOpen, tabCounts.rec, tabCounts.adj, tabCounts.all]);

  // Filter items by tab and search
  const filteredItems = useMemo(() => {
    return settledItems.filter(item => {
      // Tab filter
      if (activeTab === 'rec' && !item.isRec && item.isAdj) return false;
      if (activeTab === 'adj' && !item.isAdj && item.isRec) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          item.entityName.toLowerCase().includes(q) ||
          item.branchName.toLowerCase().includes(q) ||
          item.auditYear.toLowerCase().includes(q) ||
          item.paraNo.toLowerCase().includes(q) ||
          item.letterNoDate.toLowerCase().includes(q) ||
          item.remarks.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [settledItems, activeTab, searchTerm]);

  // Totals of filtered items (partial settlements excluded from count, included in amounts)
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        count: acc.count + (item.status === 'আংশিক' ? 0 : 1),
        involved: acc.involved + item.involvedAmount,
        recovered: acc.recovered + item.recoveryAmount,
        adjusted: acc.adjusted + item.adjustmentAmount
      }),
      { count: 0, involved: 0, recovered: 0, adjusted: 0 }
    );
  }, [filteredItems]);

  const partialItemsCount = useMemo(() => {
    return filteredItems.filter(i => i.status === 'আংশিক').length;
  }, [filteredItems]);

  // Group filteredItems by issue letter (entryId and letterNoDate) for cell merging & subtotals
  const groupedData = useMemo(() => {
    const groups: {
      groupId: string;
      entryId: string;
      entityName: string;
      branchName: string;
      auditYear: string;
      letterNoDate: string;
      meetingType: string;
      items: typeof filteredItems;
      fullCount: number;
      partialCount: number;
      totalInvolved: number;
      totalRecovered: number;
      totalAdjusted: number;
    }[] = [];

    let currentGroup: typeof groups[0] | null = null;

    filteredItems.forEach((item, idx) => {
      const isSameGroup =
        currentGroup &&
        currentGroup.entryId === item.entryId &&
        currentGroup.letterNoDate === item.letterNoDate;

      if (isSameGroup && currentGroup) {
        currentGroup.items.push(item);
        if (item.status === 'পূর্ণাঙ্গ') currentGroup.fullCount++;
        else if (item.status === 'আংশিক') currentGroup.partialCount++;
        currentGroup.totalInvolved += item.involvedAmount;
        currentGroup.totalRecovered += item.recoveryAmount;
        currentGroup.totalAdjusted += item.adjustmentAmount;
      } else {
        currentGroup = {
          groupId: `${item.entryId}_${idx}`,
          entryId: item.entryId,
          entityName: item.entityName,
          branchName: item.branchName,
          auditYear: item.auditYear,
          letterNoDate: item.letterNoDate,
          meetingType: item.meetingType,
          items: [item],
          fullCount: item.status === 'পূর্ণাঙ্গ' ? 1 : 0,
          partialCount: item.status === 'আংশিক' ? 1 : 0,
          totalInvolved: item.involvedAmount,
          totalRecovered: item.recoveryAmount,
          totalAdjusted: item.adjustmentAmount
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [filteredItems]);

  const getYearSpans = (items: typeof filteredItems) => {
    const spans: number[] = new Array(items.length).fill(1);
    let i = 0;
    while (i < items.length) {
      let j = i + 1;
      while (j < items.length && items[j].auditYear === items[i].auditYear) {
        j++;
      }
      spans[i] = j - i;
      for (let k = i + 1; k < j; k++) {
        spans[k] = 0;
      }
      i = j;
    }
    return spans;
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = filteredItems.map((item, idx) => ({
      'ক্রমিক': idx + 1,
      'প্রতিষ্ঠান / দপ্তর': item.entityName,
      'অর্থবছর': item.auditYear,
      'অনুচ্ছেদ নং': item.paraNo,
      'নিষ্পত্তির অবস্থা': item.status,
      'জড়িত টাকা': item.involvedAmount,
      'আদায়কৃত টাকা': item.recoveryAmount,
      'সমন্বিত টাকা': item.adjustmentAmount,
      'চিঠির স্মারক ও তারিখ / সভা': item.letterNoDate,
      'মন্তব্য': item.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Settled_Paragraphs');
    XLSX.writeFile(wb, `Settled_Paragraphs_${selectedMinistry}_${cycleLabel.replace(/[\/\s]/g, '_')}.xlsx`);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed top-[45px] bottom-0 right-0 z-[9980] flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 transition-all"
      style={{ left: `${sidebarOffset}px` }}
      onClick={onClose}
    >
      <div 
        className="w-full h-full flex flex-col bg-white border-l border-slate-300 shadow-2xl rounded-none overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Scrollable Body: Header + Tabs + KPI Cards + Table */}
        <div className="flex-1 overflow-y-auto bg-white relative flex flex-col">
          {/* Modal Header (Scrolls away) */}
          <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-none">
                  <FileText size={16} />
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-wide text-white">
                  আলোচ্য ৬ মাসে নিষ্পন্ন অনুচ্ছেদসমূহের বিস্তারিত বিবরণী
                </h2>
                {categoryName && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-none">
                    {categoryName}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Building2 size={12} className="text-blue-400" /> {selectedMinistry}
                </span>
                {selectedEntity && selectedEntity !== 'সকল' && selectedEntity !== 'সকল প্রতিষ্ঠান' && (
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    • প্রতিষ্ঠান: {selectedEntity}
                  </span>
                )}
                {selectedBranchType && selectedBranchType !== 'সকল' && selectedBranchType !== 'সকল শাখা' && (
                  <span className="flex items-center gap-1 font-bold text-indigo-300 bg-indigo-900/60 px-1.5 py-0.5 border border-indigo-500/40">
                    {selectedBranchType}
                  </span>
                )}
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar size={12} className="text-emerald-400" /> সময়কাল: {toBengaliDigits(cycleLabel)} ({cycleSubLabel})
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded-none text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="প্রিন্ট করুন"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 rounded-none text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="এক্সেল ডাউনলোড"
              >
                <Download size={13} />
                <span className="hidden sm:inline">এক্সেল</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 bg-rose-700 hover:bg-rose-600 text-white border border-rose-600 rounded-none transition-all cursor-pointer shadow-xs"
                title="বন্ধ করুন"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          {/* Category Tabs & Search Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-xs font-bold rounded-none border transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                সকল অনুচ্ছেদ ({toBengaliDigits(tabCounts.all.toString())})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rec')}
                className={`px-3 py-1 text-xs font-bold rounded-none border transition-all cursor-pointer ${
                  activeTab === 'rec'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                সরকারি অর্থ আদায়ে ব্যর্থতা / আদায় ({toBengaliDigits(tabCounts.rec.toString())})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('adj')}
                className={`px-3 py-1 text-xs font-bold rounded-none border transition-all cursor-pointer ${
                  activeTab === 'adj'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                বিধি বহির্ভূত পরিশোধ / সমন্বয় ({toBengaliDigits(tabCounts.adj.toString())})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="প্রতিষ্ঠান, অর্থবছর বা অনুচ্ছেদ খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 focus:border-blue-600 rounded-none text-xs outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Quick KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-xs">
            <div className="bg-white p-2 border border-slate-200 text-center">
              <span className="text-[10.5px] font-semibold text-slate-500 block">মোট অনুচ্ছেদ</span>
              <span className="text-sm font-black text-slate-900">{toBengaliDigits(totals.count.toString())} টি</span>
              {partialItemsCount > 0 && (
                <span className="text-[9.5px] font-bold text-amber-700 block mt-0.5">
                  (আংশিক: {toBengaliDigits(partialItemsCount.toString())} টি — সংখ্যায় গণনাযোগ্য নয়)
                </span>
              )}
            </div>
            <div className="bg-white p-2 border border-slate-200 text-center">
              <span className="text-[10.5px] font-semibold text-slate-500 block">জড়িত টাকা (টাকায়)</span>
              <span className="text-sm font-black text-slate-900">৳ {toBengaliDigits(totals.involved.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="bg-white p-2 border border-emerald-200 text-center bg-emerald-50/30">
              <span className="text-[10.5px] font-semibold text-emerald-700 block">আদায়কৃত টাকা</span>
              <span className="text-sm font-black text-emerald-800">৳ {toBengaliDigits(totals.recovered.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="bg-white p-2 border border-indigo-200 text-center bg-indigo-50/30">
              <span className="text-[10.5px] font-semibold text-indigo-700 block">সমন্বিত টাকা</span>
              <span className="text-sm font-black text-indigo-800">৳ {toBengaliDigits(totals.adjusted.toLocaleString('bn-BD'))}</span>
            </div>
          </div>

          {/* Table Content Area (Flush with KPI Strip, Zero Gap) */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 p-4">
              <FileText size={36} className="mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-bold text-slate-600">কোনো নিষ্পন্ন অনুচ্ছেদ পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-0.5">
                সংশ্লিষ্ট ৬ মাসের সময়কালের ভেতর কোনো অনুচ্ছেদ অনুমোদন বা মীমাংসিত হয়ে থাকলে তা এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <table className="w-full text-center border-collapse border-b border-slate-300 text-xs">
              <thead className="sticky top-0 z-20 shadow-xs">
                <tr className="border-b border-slate-300 text-[10.5px] font-bold text-slate-800 bg-slate-100">
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 text-center w-12 min-w-[45px] max-w-[50px]">ক্রমিক</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 text-left w-[170px] min-w-[150px] max-w-[190px]">প্রতিষ্ঠান / দপ্তর</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 w-44 min-w-[145px] whitespace-nowrap">অর্থবছর</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 w-20 min-w-[75px]">অনুচ্ছেদ নং</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 w-28 min-w-[95px]">অবস্থা</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 text-center w-32 min-w-[115px]">জড়িত টাকা</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 text-center w-36 min-w-[140px]">আদায়কৃত টাকা</th>
                  <th className="p-2 border-r border-b border-slate-300 bg-slate-100 text-center w-36 min-w-[140px]">সমন্বিত টাকা</th>
                  <th className="p-2 border-b border-slate-300 bg-slate-100 text-center min-w-[260px]">সভার ধরন / স্মারক ও তারিখ</th>
                </tr>
                {/* কলাম ক্রমিক নম্বর সারি (Column Serial Row) */}
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-600 bg-slate-200/90">
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">১</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">২</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">৩</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">৪</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">৫</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">৬</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">৭</th>
                  <th className="py-1 px-2 border-r border-b border-slate-300 bg-slate-200/90 text-center">৮</th>
                  <th className="py-1 px-2 border-b border-slate-300 bg-slate-200/90 text-center">৯</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let globalIdx = 0;
                  return groupedData.map(group => {
                    const yearSpans = getYearSpans(group.items);

                    return (
                      <React.Fragment key={group.groupId}>
                        {group.items.map((item, itemIdx) => {
                          globalIdx++;
                          const currentNum = globalIdx;

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-blue-50/30 transition-colors border-b border-slate-200"
                            >
                              <td className="p-2 border-r border-slate-200 font-bold text-slate-700 bg-white/40">
                                {toBengaliDigits(currentNum.toString())}
                              </td>

                              {/* কলাম ২: প্রতিষ্ঠান / দপ্তর (Merged across entire issue letter with sticky top) */}
                              {itemIdx === 0 && (
                                <td
                                  rowSpan={group.items.length}
                                  className="p-2 border-r border-slate-200 text-left font-bold text-slate-900 w-[170px] max-w-[190px] break-words bg-white align-top"
                                >
                                  <div className="sticky top-[60px]">
                                    <div>{group.entityName}</div>
                                    {group.branchName && (
                                      <div className="text-[10.5px] font-semibold text-slate-600 mt-1 leading-snug">
                                        {group.branchName}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              )}

                              {/* কলাম ৩: অর্থবছর (Merged across identical audit year, stays in 1 line with sticky top) */}
                              {yearSpans[itemIdx] > 0 && (
                                <td
                                  rowSpan={yearSpans[itemIdx]}
                                  className="p-2 border-r border-slate-200 font-semibold text-slate-700 bg-white align-top whitespace-nowrap"
                                >
                                  <div className="sticky top-[60px]">
                                    {toBengaliDigits(item.auditYear)}
                                  </div>
                                </td>
                              )}

                              {/* কলাম ৪: অনুচ্ছেদ নং */}
                              <td className="p-2 border-r border-slate-200 font-black text-blue-900">
                                {toBengaliDigits(item.paraNo)}
                              </td>

                              {/* কলাম ৫: অবস্থা */}
                              <td className="p-2 border-r border-slate-200">
                                <span
                                  className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-none ${
                                    item.status === 'পূর্ণাঙ্গ'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>

                              {/* কলাম ৬: জড়িত টাকা */}
                              <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-800 tabular-nums">
                                {item.involvedAmount > 0 ? toBengaliDigits(item.involvedAmount.toLocaleString('bn-BD')) : '০'}
                              </td>

                              {/* কলাম ৭: আদায়কৃত টাকা */}
                              <td className="p-2 border-r border-slate-200 text-center font-black text-emerald-700 tabular-nums bg-emerald-50/20">
                                {item.recoveryAmount > 0 ? toBengaliDigits(item.recoveryAmount.toLocaleString('bn-BD')) : '০'}
                              </td>

                              {/* কলাম ৮: সমন্বিত টাকা */}
                              <td className="p-2 border-r border-slate-200 text-center font-black text-indigo-700 tabular-nums bg-indigo-50/20">
                                {item.adjustmentAmount > 0 ? toBengaliDigits(item.adjustmentAmount.toLocaleString('bn-BD')) : '০'}
                              </td>

                              {/* কলাম ৯: সভার ধরন / স্মারক ও তারিখ (Merged across entire issue letter with sticky top) */}
                              {itemIdx === 0 && (
                                <td
                                  rowSpan={group.items.length}
                                  className="p-2.5 text-center text-[11px] text-slate-700 font-medium bg-white align-top"
                                >
                                  <div className="sticky top-[60px]">
                                    <div className="font-bold text-slate-900">{group.meetingType}</div>
                                    <div className="text-[10.5px] text-slate-600 mt-0.5 leading-relaxed font-semibold">
                                      {toBengaliDigits(group.letterNoDate)}
                                    </div>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}

                        {/* সংশ্লিষ্ট জারিপত্রের অধীন সকল ডাটার নিচে একটি মোট সারি (Subtotal Row) */}
                        <tr className="bg-slate-100/95 font-bold border-b-2 border-slate-300 text-slate-800 text-[11px]">
                          {/* জারিপত্র মোট লেখাটি আরো বাম পাশে বিন্যস্ত */}
                          <td colSpan={4} className="p-2.5 text-left pl-4 font-black text-slate-800 bg-slate-200/80 border-r border-slate-300">
                            <div className="flex items-center justify-start gap-2">
                              <span className="text-blue-900 font-black text-xs">জারিপত্র মোট:</span>
                              <span className="text-[10.5px] text-slate-700 font-semibold">
                                ({toBengaliDigits(group.letterNoDate.split(',')[0] || '')})
                              </span>
                            </div>
                          </td>
                          {/* কলাম ৫: পূর্ণাঙ্গ ও আংশিক - মাঝখানে থাকবে এবং ২ লাইনে সুন্দরভাবে বসবে */}
                          <td className="p-2 text-center border-r border-slate-300 bg-slate-200/80 align-middle">
                            <div className="inline-flex flex-col items-center justify-center px-2 py-0.5 bg-blue-100/90 text-blue-900 border border-blue-300">
                              <span className="text-[10px] font-black whitespace-nowrap">
                                পূর্ণাঙ্গ: {toBengaliDigits(group.fullCount.toString())} টি
                              </span>
                              {group.partialCount > 0 && (
                                <span className="text-[9px] text-amber-800 font-bold whitespace-nowrap mt-0.5">
                                  (+ {toBengaliDigits(group.partialCount.toString())}টি আংশিক)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-center tabular-nums font-black text-slate-900 border-r border-slate-300 bg-slate-100">
                            {toBengaliDigits(group.totalInvolved.toLocaleString('bn-BD'))}
                          </td>
                          <td className="p-2 text-center tabular-nums font-black text-emerald-800 border-r border-slate-300 bg-emerald-50/60">
                            {toBengaliDigits(group.totalRecovered.toLocaleString('bn-BD'))}
                          </td>
                          <td className="p-2 text-center tabular-nums font-black text-indigo-800 border-r border-slate-300 bg-indigo-50/60">
                            {toBengaliDigits(group.totalAdjusted.toLocaleString('bn-BD'))}
                          </td>
                          <td className="p-2 text-center text-[10px] text-slate-600 bg-slate-100 font-semibold">
                            <span className="text-slate-700 font-bold block">{group.meetingType}</span>
                            <span className="block text-slate-500 text-[9.5px]">
                              {toBengaliDigits(group.fullCount.toString())} টি পূর্ণাঙ্গ নিষ্পন্ন
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.25)]">
                <tr className="border-t-2 border-slate-700 text-[11px] bg-slate-900">
                  <td colSpan={5} className="p-2 text-center uppercase tracking-wider text-slate-200">
                    সর্বমোট:
                  </td>
                  <td className="p-2 text-center tabular-nums text-white">
                    {toBengaliDigits(totals.involved.toLocaleString('bn-BD'))}
                  </td>
                  <td className="p-2 text-center tabular-nums text-emerald-300">
                    {toBengaliDigits(totals.recovered.toLocaleString('bn-BD'))}
                  </td>
                  <td className="p-2 text-center tabular-nums text-indigo-300">
                    {toBengaliDigits(totals.adjusted.toLocaleString('bn-BD'))}
                  </td>
                  <td className="p-2 text-center text-slate-300 text-[10px]">
                    <div>মোট {toBengaliDigits(totals.count.toString())} টি অনুচ্ছেদ</div>
                    {partialItemsCount > 0 && (
                      <div className="text-amber-300 text-[9px] font-normal">
                        ({toBengaliDigits(partialItemsCount.toString())} টি আংশিক নিষ্পন্ন — সংখ্যায় বাদ)
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
