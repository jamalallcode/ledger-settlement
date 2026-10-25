import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Printer, FileSpreadsheet, Building2, Search, ChevronDown, Check, HelpCircle, ExternalLink, Tag, Layers } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP } from '../constants';
import HRLogicModal from './HRLogicModal';
import { getHalfYearlyRollingData } from '../utils/halfYearlyHelper';
import { HRSettledParagraphsModal } from './HRSettledParagraphsModal';

interface HRProps {
  entries: SettlementEntry[];
  prevStats?: any;
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
}

export interface HRRowData {
  col3_pCount: number;
  col4_pAmount: number;
  col5_cCount: number;
  col6_cAmount: number;
  col7_sCount: number;
  col8_sAmount: number;
}

// ৭টি সুনির্দিষ্ট অডিট আপত্তির শ্রেণীবিন্যাস (ছবির হুবহু অনুযায়ী)
export const HR1_CATEGORIES = [
  { id: 1, name: 'চুরি' },
  { id: 2, name: 'আত্মসাৎ' },
  { id: 3, name: 'ঘাটতি' },
  { id: 4, name: 'অপচয়' },
  { id: 5, name: 'বিধি বহির্ভূত পরিশোধ' },
  { id: 6, name: 'সরকারি অর্থ আদায়ে ব্যর্থতা' },
  { id: 7, name: 'অন্যান্য অনিয়ম' }
];

export const HR_1: React.FC<HRProps> = ({
  entries,
  prevStats,
  activeCycle,
  IDBadge,
  searchTerm: initialSearchTerm = '',
  filterMinistry: initialMinistry = '',
  monthPickerElement,
  customTitle = 'ষাণ্মাসিক - ১'
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedMinistry, setSelectedMinistry] = useState<string>(
    initialMinistry && initialMinistry !== 'সকল' ? initialMinistry : 'আর্থিক প্রতিষ্ঠান বিভাগ'
  );
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
  const [isLogicModalOpen, setIsLogicModalOpen] = useState(false);
  const minDropdownRef = useRef<HTMLDivElement>(null);

  // ১. শাখার ধরন স্টেট (এসএফআই / নন-এসএফআই / সকল)
  const [selectedBranchType, setSelectedBranchType] = useState<string>('নন-এসএফআই');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  // ২. এনটিটি / প্রতিষ্ঠানের নাম স্টেট
  const [selectedEntity, setSelectedEntity] = useState<string>('সকল');
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const entityDropdownRef = useRef<HTMLDivElement>(null);

  // স্মার্ট ড্রপডাউন অ্যালাইনমেন্ট (বামে সমান্তরাল, ডানপাশে জায়গা কম থাকলে ডানে সমান্তরাল)
  const [minDropdownAlign, setMinDropdownAlign] = useState<'left' | 'right'>('left');
  const [branchDropdownAlign, setBranchDropdownAlign] = useState<'left' | 'right'>('left');
  const [entityDropdownAlign, setEntityDropdownAlign] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (isMinistryDropdownOpen && minDropdownRef.current) {
      const rect = minDropdownRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      setMinDropdownAlign(spaceRight < 270 && rect.right > spaceRight ? 'right' : 'left');
    }
  }, [isMinistryDropdownOpen]);

  useEffect(() => {
    if (isBranchDropdownOpen && branchDropdownRef.current) {
      const rect = branchDropdownRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      setBranchDropdownAlign(spaceRight < 200 && rect.right > spaceRight ? 'right' : 'left');
    }
  }, [isBranchDropdownOpen]);

  useEffect(() => {
    if (isEntityDropdownOpen && entityDropdownRef.current) {
      const rect = entityDropdownRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      setEntityDropdownAlign(spaceRight < 300 && rect.right > spaceRight ? 'right' : 'left');
    }
  }, [isEntityDropdownOpen]);

  // Reset selectedEntity to 'সকল' when ministry changes
  useEffect(() => {
    setSelectedEntity('সকল');
  }, [selectedMinistry]);

  // Handle outside clicks for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (minDropdownRef.current && !minDropdownRef.current.contains(e.target as Node)) {
        setIsMinistryDropdownOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setIsEntityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available ministries
  const ministryList = useMemo(() => {
    return [
      'আর্থিক প্রতিষ্ঠান বিভাগ',
      'বস্ত্র ও পাট মন্ত্রণালয়',
      'শিল্প মন্ত্রণালয়',
      'বাণিজ্য মন্ত্রণালয়',
      'বেসামরিক বিমান, পরিবহন ও পর্যটন মন্ত্রণালয়'
    ];
  }, []);

  // Available entities for the selected ministry and branch type
  const availableEntities = useMemo(() => {
    const set = new Set<string>();
    const isTextileJute = selectedMinistry && (selectedMinistry.includes('বস্ত্র') || selectedMinistry.includes('পাট'));

    if (isTextileJute) {
      (MINISTRY_ENTITY_MAP['পাট মন্ত্রণালয়'] || []).forEach(ent => set.add(ent));
      (MINISTRY_ENTITY_MAP['বস্ত্র মন্ত্রণালয়'] || []).forEach(ent => set.add(ent));
    } else if (selectedMinistry && MINISTRY_ENTITY_MAP[selectedMinistry]) {
      MINISTRY_ENTITY_MAP[selectedMinistry].forEach(ent => set.add(ent));
    }

    (entries || []).forEach(e => {
      if (e.entityName && e.entityName.trim()) {
        const eMin = (e.ministryName || '').trim();
        const eIsTextileJute = eMin.includes('বস্ত্র') || eMin.includes('পাট');

        const matchesMin = !selectedMinistry || selectedMinistry === 'সকল' ||
          (isTextileJute && eIsTextileJute) ||
          eMin.includes(selectedMinistry);

        if (matchesMin) {
          if (selectedBranchType && selectedBranchType !== 'সকল' && selectedBranchType !== 'সকল শাখা') {
            const isSFI = selectedBranchType.includes('এসএফআই') && !selectedBranchType.includes('নন');
            const eParaType = (e.paraType || '').trim();
            if (isSFI && eParaType && eParaType.includes('নন')) return;
            if (!isSFI && eParaType && !eParaType.includes('নন') && eParaType.includes('এসএফআই')) return;
          }
          set.add(e.entityName.trim());
        }
      }
    });

    return Array.from(set).sort();
  }, [selectedMinistry, selectedBranchType, entries]);

  // ৬ মাস ভিত্তিক সময়কাল নির্ধারণ
  const cyclePeriods = useMemo(() => {
    const baseDate = activeCycle?.end ? new Date(activeCycle.end) : new Date();
    const month = baseDate.getMonth();
    const year = baseDate.getFullYear();
    const isFirstHalfOfYear = month <= 5;

    if (isFirstHalfOfYear) {
      const prevYear = year - 1;
      const prevYearShort = toBengaliDigits((prevYear % 100).toString().padStart(2, '0'));
      const fullPrevYear = toBengaliDigits(prevYear.toString());
      const currYearShort = toBengaliDigits((year % 100).toString().padStart(2, '0'));
      const fullCurrYear = toBengaliDigits(year.toString());
      return {
        prevRangeLine1: `১৫/১২/${fullPrevYear} পর্যন্ত`,
        prevRangeLine2: `ডিসেম্বর/${prevYearShort} পর্যন্ত`,
        rangeLine1: `১৬/১২/${fullPrevYear} হতে ১৫/০৬/${fullCurrYear}`,
        rangeLine2: `জানুয়ারি/${currYearShort} হতে জুন/${currYearShort}`,
        currRangeLine1: `১৫/০৬/${fullCurrYear} পর্যন্ত অনিষ্পন্ন`,
        currRangeLine2: `জুন/${currYearShort} পর্যন্ত`
      };
    } else {
      const currYearShort = toBengaliDigits((year % 100).toString().padStart(2, '0'));
      const fullCurrYear = toBengaliDigits(year.toString());
      return {
        prevRangeLine1: `১৫/০৬/${fullCurrYear} পর্যন্ত`,
        prevRangeLine2: `জুন/${currYearShort} পর্যন্ত`,
        rangeLine1: `১৬/০৬/${fullCurrYear} হতে ১৫/১২/${fullCurrYear}`,
        rangeLine2: `জুলাই/${currYearShort} হতে ডিসেম্বর/${currYearShort}`,
        currRangeLine1: `১৫/১২/${fullCurrYear} পর্যন্ত অনিষ্পন্ন`,
        currRangeLine2: `ডিসেম্বর/${currYearShort} পর্যন্ত`
      };
    }
  }, [activeCycle]);

  // Rolling data computed dynamically from baseline & Settlement Register entries
  const rollingData = useMemo(() => {
    let localStats: Record<string, any> = {};
    try {
      const local = localStorage.getItem('opening_balance_setup_stats_v1');
      if (local) localStats = JSON.parse(local);
    } catch {}

    const propStats = selectedBranchType === 'এসএফআই'
      ? (prevStats?.entitiesSFI || {})
      : (prevStats?.entitiesNonSFI || prevStats?.entitiesSFI || {});

    const mergedStats = { ...propStats, ...localStats };

    const cycleDate = activeCycle?.start ? new Date(activeCycle.start) : new Date();
    return getHalfYearlyRollingData(cycleDate, entries || [], mergedStats, selectedMinistry, selectedBranchType, selectedEntity);
  }, [activeCycle, entries, prevStats, selectedMinistry, selectedBranchType, selectedEntity]);

  // Modal state for viewing settled paragraphs
  const [isSettledModalOpen, setIsSettledModalOpen] = useState(false);
  const [selectedSettledCategory, setSelectedSettledCategory] = useState<{
    id: number | null;
    name: string;
  }>({ id: null, name: 'সর্বমোট' });

  const handleOpenSettledModal = (catId: number | null, catName: string) => {
    setSelectedSettledCategory({ id: catId, name: catName });
    setIsSettledModalOpen(true);
  };

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return HR1_CATEGORIES;
    return HR1_CATEGORIES.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [searchTerm]);

  // Dynamic 10-column table rows (100% Automatic from rollingData & Settlement Register)
  const tableRows = useMemo(() => {
    return filteredCategories.map(cat => {
      const rolled = rollingData[cat.id] || {
        col3_pCount: 0, col4_pAmount: 0, col5_cCount: 0, col6_cAmount: 0, col7_sCount: 0, col8_sAmount: 0, col9_finalCount: 0, col10_finalAmount: 0
      };

      const col3_pCount = rolled.col3_pCount;
      const col4_pAmount = rolled.col4_pAmount;
      const col5_cCount = rolled.col5_cCount;
      const col6_cAmount = rolled.col6_cAmount;
      const col7_sCount = rolled.col7_sCount;
      const col8_sAmount = rolled.col8_sAmount;

      // Dynamic calculation: ৯ = (৩+৫)-৭, ১০ = (৪+৬)-৮
      const col9_finalCount = (col3_pCount + col5_cCount) - col7_sCount;
      const col10_finalAmount = Number(((col4_pAmount + col6_cAmount) - col8_sAmount).toFixed(4));

      return {
        sl: cat.id,
        categoryName: cat.name,
        col3_pCount,
        col4_pAmount,
        col5_cCount,
        col6_cAmount,
        col7_sCount,
        col8_sAmount,
        col9_finalCount,
        col10_finalAmount
      };
    });
  }, [filteredCategories, rollingData]);

  // Totals for table footer (মোট)
  const totals = useMemo(() => {
    return tableRows.reduce(
      (acc, r) => ({
        col3_pCount: acc.col3_pCount + r.col3_pCount,
        col4_pAmount: acc.col4_pAmount + r.col4_pAmount,
        col5_cCount: acc.col5_cCount + r.col5_cCount,
        col6_cAmount: acc.col6_cAmount + r.col6_cAmount,
        col7_sCount: acc.col7_sCount + r.col7_sCount,
        col8_sAmount: acc.col8_sAmount + r.col8_sAmount,
        col9_finalCount: acc.col9_finalCount + r.col9_finalCount,
        col10_finalAmount: acc.col10_finalAmount + r.col10_finalAmount
      }),
      {
        col3_pCount: 0,
        col4_pAmount: 0.0,
        col5_cCount: 0,
        col6_cAmount: 0.0,
        col7_sCount: 0,
        col8_sAmount: 0.0,
        col9_finalCount: 0,
        col10_finalAmount: 0.0
      }
    );
  }, [tableRows]);

  const formatCount = (val: number) => {
    if (!val || val === 0) return '০';
    return toBengaliDigits(Math.round(val).toLocaleString('en-IN'));
  };

  const formatAmount = (val: number, forceDecimal = false) => {
    if (!val || val === 0) {
      return forceDecimal ? '০.০০০০' : '০';
    }
    const fixed = val.toFixed(4);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = Number(intPart).toLocaleString('en-IN');
    return toBengaliDigits(`${formattedInt}.${decPart}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const filename = `Half_Yearly_Return_1_${selectedMinistry.replace(/\s+/g, '_')}.xls`;
    const rowsHtml = tableRows
      .map(
        r => `
        <tr>
          <td>${toBengaliDigits(r.sl.toString())}</td>
          <td style="text-align: left;">${r.categoryName}</td>
          <td>${formatCount(r.col3_pCount)}</td>
          <td>${formatAmount(r.col4_pAmount)}</td>
          <td>${formatCount(r.col5_cCount)}</td>
          <td>${formatAmount(r.col6_cAmount, true)}</td>
          <td>${formatCount(r.col7_sCount)}</td>
          <td>${formatAmount(r.col8_sAmount, true)}</td>
          <td>${formatCount(r.col9_finalCount)}</td>
          <td>${formatAmount(r.col10_finalAmount)}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; text-align: center; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .bg-total { background-color: #0f172a; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center;">ষাণ্মাসিক অডিট আপত্তি/নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ</h2>
        <h4 style="text-align: center;">মন্ত্রণালয়: ${selectedMinistry}${selectedEntity !== 'সকল' ? ` | প্রতিষ্ঠান: ${selectedEntity}` : ''} | ${selectedBranchType}</h4>
        <h5 style="text-align: center;">সময়কাল: ${cyclePeriods.rangeLine1} (${cyclePeriods.rangeLine2})</h5>
        <table>
          <thead>
            <tr>
              <th rowspan="2">১</th>
              <th rowspan="2">২</th>
              <th colspan="2">${cyclePeriods.prevRangeLine1} (${cyclePeriods.prevRangeLine2})</th>
              <th colspan="4">${cyclePeriods.rangeLine1} (${cyclePeriods.rangeLine2})</th>
              <th colspan="2">${cyclePeriods.currRangeLine1} (${cyclePeriods.currRangeLine2})</th>
            </tr>
            <tr>
              <th>পূর্ববর্তী ৬ মাস পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th>আলোচ্য ৬ মাসে উত্থাপিত আপত্তির সংখ্যা</th>
              <th>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th>আলোচ্য ৬ মাসে নিষ্পত্তির সংখ্যা</th>
              <th>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th>ষাণ্মাসিক শেষে অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th>অনিষ্পন্ন আপত্তিতে জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
            </tr>
            <tr>
              <th>১</th><th>২</th><th>৩</th><th>৪</th><th>৫</th><th>৬</th><th>৭</th><th>৮</th><th>৯: (৩+৫)-৭</th><th>১০: (৪+৬)-৮</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="bg-total">
              <td colspan="2">মোট</td>
              <td>${formatCount(totals.col3_pCount)}</td>
              <td>${formatAmount(totals.col4_pAmount)}</td>
              <td>${formatCount(totals.col5_cCount)}</td>
              <td>${formatAmount(totals.col6_cAmount, true)}</td>
              <td>${formatCount(totals.col7_sCount)}</td>
              <td>${formatAmount(totals.col8_sAmount, true)}</td>
              <td>${formatCount(totals.col9_finalCount)}</td>
              <td>${formatAmount(totals.col10_finalAmount)}</td>
            </tr>
          </tfoot>
        </table>
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

  const thCls = "border-r border-b border-slate-300 p-1.5 text-[9.5px] font-bold text-slate-800 bg-[#f8fafc] align-middle text-center";
  const thClsWithTop = thCls + " border-t border-slate-300";
  const tdCls = "p-1.5 text-[10px] text-slate-700 align-middle border-r border-b border-slate-300";
  const numTdCls = "p-1 text-[10px] text-slate-800 text-center align-middle font-bold border-r border-b border-slate-300 tabular-nums";

  return (
    <div id="hr-1-container" className="w-full mx-auto py-3 px-2 bg-white rounded-none relative animate-in fade-in duration-300 font-sans">
      <IDBadge id="hr-1-container" />

      {/* Top Action Bar (100% Square Corners & High Z-Index so it floats securely over sticky table headers) */}
      <div className="relative z-[500] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-slate-300 no-print">
        {/* Left Side: Branch Selector, Ministry Selector, Period Selector & Entity Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ১. শাখার ধরন ড্রপডাউন (Branch Type: এসএফআই / নন-এসএফআই / সকল শাখা) - সর্ব বামে */}
          <div className="relative z-[600]" ref={branchDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsBranchDropdownOpen(!isBranchDropdownOpen);
                setIsMinistryDropdownOpen(false);
                setIsEntityDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 h-9 bg-white border border-slate-300 hover:border-slate-400 rounded-none text-xs font-black text-slate-800 shadow-xs transition-all cursor-pointer box-border"
              title="শাখার ধরন ফিল্টার"
            >
              <Tag size={13} className="text-indigo-600" />
              <span>{selectedBranchType}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {isBranchDropdownOpen && (
              <div className={`absolute ${branchDropdownAlign === 'right' ? 'right-0' : 'left-0'} mt-1 w-full min-w-full bg-white border border-slate-200 rounded-none shadow-2xl z-[99999] p-1.5 space-y-1`}>
                {['নন-এসএফআই', 'এসএফআই', 'সকল শাখা'].map(bType => {
                  const isSelected = selectedBranchType === bType;
                  return (
                    <button
                      key={bType}
                      type="button"
                      onClick={() => {
                        setSelectedBranchType(bType);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-none transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-extrabold shadow-md' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold bg-white'
                      }`}
                    >
                      <span className="truncate">{bType}</span>
                      {isSelected && <Check size={13} className="text-white stroke-[3.5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ministry Dropdown */}
          <div className="relative z-[600]" ref={minDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMinistryDropdownOpen(!isMinistryDropdownOpen)}
              className="flex items-center gap-2 px-3 h-9 bg-white border border-slate-300 hover:border-slate-400 rounded-none text-xs font-black text-slate-800 shadow-xs transition-all cursor-pointer box-border"
            >
              <Building2 size={14} className="text-blue-600" />
              <span>{selectedMinistry}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isMinistryDropdownOpen && (
              <div className={`absolute ${minDropdownAlign === 'right' ? 'right-0' : 'left-0'} mt-1 w-full min-w-full bg-white border border-slate-200 rounded-none shadow-2xl z-[99999] max-h-72 overflow-y-auto p-1.5 space-y-1`}>
                {ministryList.map(min => {
                  const isSelected = selectedMinistry === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setSelectedMinistry(min);
                        setIsMinistryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-none transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-extrabold shadow-md' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold bg-white'
                      }`}
                    >
                      <span className="truncate">{min}</span>
                      {isSelected && <Check size={14} className="text-white stroke-[3.5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Month / Period Picker (Unified height & rounded-none & highest z-index) */}
          {monthPickerElement && (
            <div className="relative z-[600] flex items-center [&>div>div:first-child]:!h-9 [&>div>div:first-child]:!rounded-none [&>div>div:first-child]:!shadow-xs [&>div>div:first-child]:!box-border">
              {monthPickerElement}
            </div>
          )}

          {/* ২. এনটিটি / প্রতিষ্ঠানের নাম ড্রপডাউন */}
          <div className="relative z-[600]" ref={entityDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsEntityDropdownOpen(!isEntityDropdownOpen);
                setIsMinistryDropdownOpen(false);
                setIsBranchDropdownOpen(false);
              }}
              className="flex items-center justify-between gap-1.5 px-3 h-9 bg-white border border-slate-300 hover:border-slate-400 rounded-none text-xs font-black text-slate-800 shadow-xs transition-all cursor-pointer w-[275px] min-w-[275px] box-border"
              title="প্রতিষ্ঠান / এনটিটি ফিল্টার"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers size={13} className="text-emerald-600 shrink-0" />
                <span className="truncate">{selectedEntity === 'সকল' ? 'সকল প্রতিষ্ঠান' : selectedEntity}</span>
              </div>
              <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isEntityDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            {isEntityDropdownOpen && (
              <div className={`absolute ${entityDropdownAlign === 'right' ? 'right-0' : 'left-0'} mt-1 w-full min-w-full bg-white border border-slate-200 rounded-none shadow-2xl z-[99999] max-h-72 overflow-y-auto p-1.5 space-y-1 box-border`}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEntity('সকল');
                    setIsEntityDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-none transition-all cursor-pointer ${
                    selectedEntity === 'সকল' 
                      ? 'bg-blue-600 text-white font-extrabold shadow-md' 
                      : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold bg-white'
                  }`}
                >
                  <span className="whitespace-nowrap pr-2">সকল প্রতিষ্ঠান</span>
                  {selectedEntity === 'সকল' && <Check size={13} className="text-white stroke-[3.5] shrink-0" />}
                </button>

                {availableEntities.map(ent => {
                  const isSelected = selectedEntity === ent;
                  return (
                    <button
                      key={ent}
                      type="button"
                      onClick={() => {
                        setSelectedEntity(ent);
                        setIsEntityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-none transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-extrabold shadow-md' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold bg-white'
                      }`}
                    >
                      <span className="whitespace-nowrap pr-2">{ent}</span>
                      {isSelected && <Check size={13} className="text-white stroke-[3.5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Excel, Print (All h-9 height) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all rounded-none cursor-pointer shrink-0 shadow-xs box-border"
            title="এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet size={15} className="stroke-[2.5]" />
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center w-9 h-9 bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 transition-all rounded-none cursor-pointer shrink-0 shadow-xs box-border"
            title="প্রিন্ট করুন"
          >
            <Printer size={15} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-3">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight underline underline-offset-4 decoration-slate-400">
          ষাণ্মাসিক অডিট আপত্তি/নিষ্পত্তির শ্রেণীবিন্যাসকৃত সারাংশ
        </h1>
      </div>

      {/* Scoped Sticky Table Container with Screen Bottom Fixed Footer */}
      <style>{`
        #hr-1-table-container {
          width: 100% !important;
          overflow: visible !important;
          position: relative !important;
          border-radius: 0px !important;
        }
        #hr-1-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          width: 100%;
        }
        #hr-1-table thead {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0px !important;
          z-index: 150 !important;
        }
        #hr-1-table thead th {
          position: -webkit-sticky !important;
          position: sticky !important;
          background-clip: padding-box !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          opacity: 1 !important;
        }
        #hr-1-table thead tr:first-child {
          height: 46px !important;
        }
        #hr-1-table thead tr:first-child th {
          top: 0px !important;
          height: 46px !important;
          z-index: 160 !important;
        }
        #hr-1-table thead tr:nth-child(2) {
          height: 46px !important;
        }
        #hr-1-table thead tr:nth-child(2) th {
          top: 46px !important;
          height: 46px !important;
          z-index: 155 !important;
        }
        #hr-1-table thead tr:nth-child(3) {
          height: 32px !important;
        }
        #hr-1-table thead tr:nth-child(3) th {
          top: 92px !important;
          height: 32px !important;
          z-index: 150 !important;
        }
        #hr-1-table thead tr:first-child th[rowspan="2"] {
          top: 0px !important;
          height: 92px !important;
          z-index: 165 !important;
        }
        #hr-1-table tfoot {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          z-index: 170 !important;
        }
        #hr-1-table tfoot tr {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          background-color: #0f172a !important;
        }
        #hr-1-table tfoot th,
        #hr-1-table tfoot td {
          position: -webkit-sticky !important;
          position: sticky !important;
          bottom: 0px !important;
          z-index: 170 !important;
          background-color: #0f172a !important;
          color: #ffffff !important;
          box-shadow: 0 -3px 8px rgba(0, 0, 0, 0.45) !important;
        }
      `}</style>

      {/* Table Section (Editable & Pasteable from Excel just like Monthly/Quarterly Returns) */}
      <div id="hr-1-table-container" className="table-container qr-table-container shadow-xs rounded-none border border-slate-400 bg-white">
        <table id="hr-1-table" className="w-full text-center border-collapse">
          <thead>
            {/* Header Row 1 */}
            <tr className="h-[46px] bg-[#f8fafc]">
              <th rowSpan={2} className={`${thClsWithTop} w-[42px]`}>
                ক্রমিক
              </th>
              <th rowSpan={2} className={`${thClsWithTop} min-w-[170px]`}>
                শ্রেণী
              </th>
              <th colSpan={2} className={`${thClsWithTop} min-w-[210px] py-1`}>
                <div className="font-extrabold text-slate-900 text-[11px]">{cyclePeriods.prevRangeLine1}</div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">“{cyclePeriods.prevRangeLine2}”</div>
              </th>
              <th colSpan={4} className={`${thClsWithTop} min-w-[420px] py-1 bg-blue-50/60`}>
                <div className="font-black text-blue-950 text-[12px] tracking-wide">{cyclePeriods.rangeLine1}</div>
                <div className="text-[10.5px] font-bold text-blue-800 mt-0.5">“{cyclePeriods.rangeLine2}”</div>
              </th>
              <th colSpan={2} className={`${thClsWithTop} min-w-[220px] py-1`}>
                <div className="font-extrabold text-slate-900 text-[11px]">{cyclePeriods.currRangeLine1}</div>
                <div className="text-[10px] font-bold text-slate-600 mt-0.5">“{cyclePeriods.currRangeLine2}”</div>
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="h-[46px] bg-[#f8fafc]">
              <th className={`${thCls} min-w-[105px]`}>পূর্ববর্তী ৬ মাস পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[110px]`}>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th className={`${thCls} min-w-[95px]`}>আলোচ্য ৬ মাসে উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[110px]`}>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th className={`${thCls} min-w-[95px]`}>আলোচ্য ৬ মাসে নিষ্পত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[110px]`}>জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
              <th className={`${thCls} min-w-[105px]`}>ষাণ্মাসিক শেষে অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th className={`${thCls} min-w-[125px]`}>অনিষ্পন্ন আপত্তিতে জড়িত টাকার পরিমাণ (কোটি টাকায়)</th>
            </tr>

            {/* Header Row 3: Column Numbers and Formulas */}
            <tr className="h-[32px] bg-[#f8fafc] font-bold text-[9.5px] text-slate-800">
              <th className={thCls}>১</th>
              <th className={thCls}>২</th>
              <th className={thCls}>৩</th>
              <th className={thCls}>৪</th>
              <th className={thCls}>৫</th>
              <th className={thCls}>৬</th>
              <th className={thCls}>৭</th>
              <th className={thCls}>৮</th>
              <th className={thCls}>
                <div className="font-black text-[10px]">৯</div>
                <div className="text-[8.5px] text-slate-600 font-bold">(৩+৫)-৭</div>
              </th>
              <th className={thCls}>
                <div className="font-black text-[10px]">১০</div>
                <div className="text-[8.5px] text-slate-600 font-bold">(৪+৬)-৮</div>
              </th>
            </tr>
          </thead>

          <tbody>
            {tableRows.map((row, idx) => (
              <tr key={row.sl} className="hover:bg-amber-50/20 transition-colors">
                <td className={numTdCls}>{toBengaliDigits(row.sl.toString())}</td>
                <td className={`${tdCls} text-left pl-3 font-semibold text-slate-900`}>
                  <HighlightText text={row.categoryName} searchTerm={searchTerm} />
                </td>
                
                {/* Column 3: পূর্ববর্তী অনিষ্পন্ন সংখ্যা (স্বয়ংক্রিয়) */}
                <td className={`${numTdCls} bg-amber-50/15`}>
                  {row.col3_pCount === 0 ? <span className="text-slate-400 font-normal">০</span> : toBengaliDigits(row.col3_pCount.toLocaleString())}
                </td>

                {/* Column 4: পূর্ববর্তী অনিষ্পন্ন টাকা (স্বয়ংক্রিয়) */}
                <td className={`${numTdCls} bg-amber-50/15`}>
                  {row.col4_pAmount === 0 ? <span className="text-slate-400 font-normal">০.০০</span> : toBengaliDigits(row.col4_pAmount.toFixed(4))}
                </td>

                {/* Column 5: উত্থাপিত সংখ্যা (স্বয়ংক্রিয়) */}
                <td className={`${numTdCls} bg-blue-50/20`}>
                  {row.col5_cCount === 0 ? <span className="text-slate-400 font-normal">০</span> : toBengaliDigits(row.col5_cCount.toLocaleString())}
                </td>

                {/* Column 6: উত্থাপিত টাকা (স্বয়ংক্রিয়) */}
                <td className={`${numTdCls} bg-blue-50/20`}>
                  {row.col6_cAmount === 0 ? <span className="text-slate-400 font-normal">০.০০</span> : toBengaliDigits(row.col6_cAmount.toFixed(4))}
                </td>

                {/* Column 7: নিষ্পত্তি সংখ্যা (ক্লিক করলে বিস্তারিত দেখা যাবে) */}
                <td className={`${numTdCls} bg-emerald-50/20`}>
                  {row.col7_sCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleOpenSettledModal(row.sl, row.categoryName)}
                      className="group inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-300 hover:border-emerald-600 rounded-none font-black text-xs transition-all shadow-xs cursor-pointer"
                      title="ক্লিক করে এই শ্রেণীর নিষ্পন্ন অনুচ্ছেদসমূহের বিস্তারিত বিবরণী দেখুন"
                    >
                      <span>{toBengaliDigits(row.col7_sCount.toLocaleString())}</span>
                      <ExternalLink size={10} className="text-emerald-700 group-hover:text-white transition-colors" />
                    </button>
                  ) : (
                    <span className="text-slate-400 font-normal">০</span>
                  )}
                </td>

                {/* Column 8: নিষ্পত্তি টাকা (স্বয়ংক্রিয়) */}
                <td className={`${numTdCls} bg-emerald-50/20`}>
                  {row.col8_sAmount === 0 ? <span className="text-slate-400 font-normal">০.০০</span> : toBengaliDigits(row.col8_sAmount.toFixed(4))}
                </td>

                {/* Column 9: Auto Calculated (৩+৫)-৭ */}
                <td className={`${numTdCls} bg-slate-50 font-black text-blue-950`}>
                  {formatCount(row.col9_finalCount)}
                </td>

                {/* Column 10: Auto Calculated (৪+৬)-৮ */}
                <td className={`${numTdCls} bg-slate-50 font-black text-blue-950`}>
                  {formatAmount(row.col10_finalAmount)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Table Footer: Fixed to screen bottom */}
          <tfoot className="qr-sticky-footer-bottom">
            <tr className="h-[40px] font-black text-white bg-slate-900 border-t-2 border-slate-700">
              <td colSpan={2} className="p-2 text-right text-xs sm:text-[13px] font-black uppercase tracking-wider border border-slate-700 bg-slate-900 text-white">
                মোট
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatCount(totals.col3_pCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatAmount(totals.col4_pAmount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatCount(totals.col5_cCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatAmount(totals.col6_cAmount, true)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {totals.col7_sCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleOpenSettledModal(null, 'সর্বমোট')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-none font-black text-xs transition-all cursor-pointer shadow-xs"
                    title="ক্লিক করে সকল নিষ্পন্ন অনুচ্ছেদের বিস্তারিত বিবরণী দেখুন"
                  >
                    <span>{toBengaliDigits(totals.col7_sCount.toLocaleString())}</span>
                    <ExternalLink size={11} />
                  </button>
                ) : (
                  <span className="text-slate-400">০</span>
                )}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-900 text-white tabular-nums">
                {formatAmount(totals.col8_sAmount, true)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-950 text-amber-300 tabular-nums shadow-inner">
                {formatCount(totals.col9_finalCount)}
              </td>
              <td className="p-2 text-center text-xs sm:text-[13px] font-black border border-slate-700 bg-slate-950 text-amber-300 tabular-nums shadow-inner">
                {formatAmount(totals.col10_finalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Calculation Logic Details Modal */}
      <HRLogicModal
        isOpen={isLogicModalOpen}
        onClose={() => setIsLogicModalOpen(false)}
        reportName={customTitle}
        ministryName={selectedMinistry}
        cyclePeriods={cyclePeriods}
      />

      {/* Modal for Settled Paragraphs Details */}
      <HRSettledParagraphsModal
        isOpen={isSettledModalOpen}
        onClose={() => setIsSettledModalOpen(false)}
        categoryName={selectedSettledCategory.name}
        categoryId={selectedSettledCategory.id}
        cycleLabel={cyclePeriods.rangeLine1}
        cycleSubLabel={cyclePeriods.rangeLine2}
        selectedMinistry={selectedMinistry}
        selectedBranchType={selectedBranchType}
        selectedEntity={selectedEntity}
        entries={entries || []}
        activeCycle={activeCycle}
      />
    </div>
  );
};

export default HR_1;
