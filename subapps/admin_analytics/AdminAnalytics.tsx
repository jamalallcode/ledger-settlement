import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toBengaliDigits, parseBengaliNumber, formatDateBN, toEnglishDigits } from '../../utils/numberUtils';
import { 
  BarChart3, Calendar, Users, FileText, 
  ArrowRight, Search, Download, Filter,
  ChevronLeft, ChevronRight, LayoutGrid, List,
  CalendarRange, X, Sparkles, XCircle, Inbox, CheckCircle2
} from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const formatCustomDate = (dateStr: string | undefined | null): string => {
  if (!dateStr || dateStr.trim() === '' || dateStr.startsWith('0000')) return '---';
  
  const cleanStr = dateStr.trim();
  
  // Try parsing standard YYYY-MM-DD
  const matchIso = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchIso) {
    const [_, y, m, d] = matchIso;
    return toBengaliDigits(`${d}/${m}/${y}`);
  }
  
  // Try parsing DD/MM/YYYY (English or Bengali digits)
  const engStr = toEnglishDigits(cleanStr);
  const matchSlash = engStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchSlash) {
    const [_, d, m, y] = matchSlash;
    const paddedD = d.padStart(2, '0');
    const paddedM = m.padStart(2, '0');
    return toBengaliDigits(`${paddedD}/${paddedM}/${y}`);
  }

  // Try parsing YYYY/MM/DD
  const matchSlashY = engStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (matchSlashY) {
    const [_, y, m, d] = matchSlashY;
    const paddedD = d.padStart(2, '0');
    const paddedM = m.padStart(2, '0');
    return toBengaliDigits(`${paddedD}/${paddedM}/${y}`);
  }

  // Try parsing ISO Date with timezone / time info
  if (cleanStr.includes('T') || cleanStr.includes(':') || cleanStr.includes('-')) {
    try {
      const date = new Date(engStr);
      if (!isNaN(date.getTime())) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear().toString();
        return toBengaliDigits(`${d}/${m}/${y}`);
      }
    } catch (e) {}
  }

  // Fallback: if it has / or -, just replace - with / and convert to Bengali
  return toBengaliDigits(cleanStr.replace(/-/g, '/'));
};

const findLetterForSettlement = (
  settlementEntry: any,
  allCorrespondence: any[]
): any | null => {
  if (!settlementEntry || !settlementEntry.letterNoDate) return null;
  
  const rawLetterNoDate = settlementEntry.letterNoDate;
  const engNoDate = toEnglishDigits(rawLetterNoDate).toLowerCase();
  
  for (const c of allCorrespondence) {
    if (!c.letterNo) continue;
    const cLetterNoEng = toEnglishDigits(c.letterNo).toLowerCase().trim();
    if (!cLetterNoEng) continue;

    const escaped = cLetterNoEng.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(?:^|[^0-9a-zA-Z])${escaped}(?:$|[^0-9a-zA-Z])`);
    
    if (pattern.test(engNoDate)) {
      if (settlementEntry.ministryName && c.ministryName) {
        const sMin = settlementEntry.ministryName.replace(/[\s\-\,]/g, '');
        const cMin = c.ministryName.replace(/[\s\-\,]/g, '');
        if (sMin && cMin && sMin === cMin) {
          return c;
        }
      }
    }
  }

  for (const c of allCorrespondence) {
    if (!c.letterNo) continue;
    const cLetterNoEng = toEnglishDigits(c.letterNo).toLowerCase().trim();
    if (!cLetterNoEng) continue;

    const escaped = cLetterNoEng.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(?:^|[^0-9a-zA-Z])${escaped}(?:$|[^0-9a-zA-Z])`);
    if (pattern.test(engNoDate)) {
      return c;
    }
  }

  return null;
};

const getAuditorForSettlement = (entry: any, correspondenceList: any[]): string => {
  const directName = entry.receiverName || entry.presentedToName;
  if (directName && directName.trim() !== '') {
    return directName;
  }
  
  const matchedLetter = findLetterForSettlement(entry, correspondenceList);
  if (matchedLetter) {
    return matchedLetter.receiverName || matchedLetter.presentedToName || 'অনির্ধারিত (Unassigned)';
  }
  
  return 'অনির্ধারিত (Unassigned)';
};

interface AdminAnalyticsProps {
  entries: any[];
  correspondenceEntries: any[];
  onBack: () => void;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ entries, correspondenceEntries, onBack }) => {
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [selectedAuditorDetails, setSelectedAuditorDetails] = useState<{
    name: string;
    type: 'letters' | 'paragraphs' | 'settled_paragraphs';
    data: any[];
  } | null>(null);

  const [headerHeight, setHeaderHeight] = useState(65);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeaderHeight(entry.target.clientHeight);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const normalizeName = (name: string | null | undefined) => {
    if (!name) return 'অনির্ধারিত';
    return name
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
  };

  const [receiverProfiles, setReceiverProfiles] = useState<Record<string, { designation?: string, image?: string }>>({});

  useEffect(() => {
    const fetchReceiverProfiles = async () => {
      const map: Record<string, { designation?: string, image?: string }> = {};

      const addProfile = (name: string, img: string | null, desig: string | null) => {
        if (!name) return;
        const nameTrim = name.trim();
        const norm = normalizeName(nameTrim);
        const profileData = { 
          designation: desig || undefined, 
          image: img || undefined 
        };
        map[nameTrim] = profileData;
        map[norm] = profileData;
      };

      // 1. Fetch from database (Supabase)
      if (isSupabaseConfigured) {
        try {
          const { data: dbReceivers } = await supabase
            .from('receivers')
            .select('name, image, designation');
          if (dbReceivers) {
            dbReceivers.forEach(r => {
              addProfile(r.name, r.image, r.designation);
            });
          }
        } catch (err) {
          console.error("Error fetching db receivers in Analytics:", err);
        }
      }

      // 2. Fetch from local storage keys
      const localKeys = [
        'ledger_correspondence_receivers_admin',
        'ledger_correspondence_receivers_sfi',
        'ledger_correspondence_receivers_nonsfi'
      ];
      localKeys.forEach(key => {
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const items = JSON.parse(saved);
            if (Array.isArray(items)) {
              items.forEach((item: any) => {
                addProfile(item.name, item.image, item.designation);
              });
            }
          }
        } catch (e) {
          console.error("Error parsing local receivers in Analytics:", e);
        }
      });

      setReceiverProfiles(map);
    };

    fetchReceiverProfiles();
  }, [correspondenceEntries]);

  const allData = useMemo(() => [...entries, ...correspondenceEntries], [entries, correspondenceEntries]);

  const filteredData = useMemo(() => {
    return correspondenceEntries.filter(entry => {
      const dateToUse = entry.receivedDate || entry.diaryDate || entry.createdAt;
      if (!dateToUse) return false;
      
      try {
        const entryDate = parseISO(dateToUse);
        return isWithinInterval(entryDate, {
          start: parseISO(startDate),
          end: parseISO(endDate + 'T23:59:59')
        });
      } catch (e) {
        return false;
      }
    });
  }, [correspondenceEntries, startDate, endDate]);

  const filteredSettlementEntries = useMemo(() => {
    return (entries || []).filter(entry => {
      const entryDate = entry.issueDateISO || (entry.createdAt ? entry.createdAt.split('T')[0] : '');
      if (!entryDate) return false;
      
      try {
        const parsedDate = parseISO(entryDate);
        return isWithinInterval(parsedDate, {
          start: parseISO(startDate),
          end: parseISO(endDate + 'T23:59:59')
        });
      } catch (e) {
        return entryDate >= startDate && entryDate <= endDate;
      }
    });
  }, [entries, startDate, endDate]);

  const auditorStats = useMemo(() => {
    const stats: Record<string, { name: string, letterCount: number, paraCount: number, settledCount: number, designation?: string, image?: string }> = {};

    filteredData.forEach(entry => {
      const rawName = entry.receiverName || 'অনির্ধারিত (Unassigned)';
      const normName = normalizeName(rawName);
      const nameKey = rawName === 'অনির্ধারিত (Unassigned)' ? 'অনির্ধারিত (Unassigned)' : normName;

      if (!stats[nameKey]) {
        const profile = receiverProfiles[rawName] || receiverProfiles[normName] || {};
        stats[nameKey] = { 
          name: rawName, 
          letterCount: 0, 
          paraCount: 0,
          settledCount: 0,
          designation: profile.designation,
          image: profile.image
        };
      }
      
      stats[nameKey].letterCount += 1;
      
      // Count paragraphs from correspondence entries
      stats[nameKey].paraCount += parseBengaliNumber(entry.totalParas || '0');
    });

    filteredSettlementEntries.forEach(entry => {
      const rawName = getAuditorForSettlement(entry, correspondenceEntries);
      const normName = normalizeName(rawName);
      const nameKey = rawName === 'অনির্ধারিত (Unassigned)' ? 'অনির্ধারিত (Unassigned)' : normName;

      if (!stats[nameKey]) {
        const profile = receiverProfiles[rawName] || receiverProfiles[normName] || {};
        stats[nameKey] = { 
          name: rawName, 
          letterCount: 0, 
          paraCount: 0,
          settledCount: 0,
          designation: profile.designation,
          image: profile.image
        };
      }

      const rowSettledCount = entry.paragraphs?.filter((p: any) => p.status === 'পূর্ণাঙ্গ').length 
        || parseInt(toEnglishDigits(entry.meetingSettledParaCount || '0')) 
        || 0;
      stats[nameKey].settledCount += rowSettledCount;
    });

    return Object.values(stats).sort((a, b) => b.letterCount - a.letterCount);
  }, [filteredData, filteredSettlementEntries, receiverProfiles, correspondenceEntries]);

  const filteredAuditorStats = useMemo(() => {
    if (!searchQuery.trim()) return auditorStats;
    const query = searchQuery.toLowerCase();
    return auditorStats.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.designation && s.designation.toLowerCase().includes(query))
    );
  }, [auditorStats, searchQuery]);

  const totalLetters = filteredAuditorStats.reduce((sum, s) => sum + s.letterCount, 0);
  const totalParas = filteredAuditorStats.reduce((sum, s) => sum + s.paraCount, 0);

  const getPercentage = (settled: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((settled / total) * 100 * 10) / 10;
  };

  const handleShowDetails = (auditorName: string, type: 'letters' | 'paragraphs' | 'settled_paragraphs') => {
    let data: any[] = [];
    if (type === 'settled_paragraphs') {
      data = filteredSettlementEntries.filter(entry => {
        const rawName = getAuditorForSettlement(entry, correspondenceEntries);
        const normName = normalizeName(rawName);
        return rawName === auditorName || normName === normalizeName(auditorName);
      });
    } else {
      data = filteredData.filter(entry => {
        const rawName = entry.receiverName || 'অনির্ধারিত (Unassigned)';
        const normName = normalizeName(rawName);
        return rawName === auditorName || normName === normalizeName(auditorName);
      });
    }
    setSelectedAuditorDetails({ name: auditorName, type, data });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-3 space-y-1 md:space-y-1.5 animate-in fade-in duration-700">
      {/* Header */}
      <div 
        ref={headerRef}
        className="bg-white py-1.5 px-3 md:px-4 rounded-none shadow-md border border-slate-100 sticky top-0 z-[100] group"
      >
        {/* Decorative Blur Circle - Wrapped in a clipping container */}
        <div className="absolute inset-0 overflow-hidden rounded-none pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onBack}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-95 z-50 group/close"
          title="বন্ধ করুন"
        >
          <X size={15} className="transition-transform duration-300 group-hover/close:rotate-90" />
        </button>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-start gap-2.5 md:gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md border border-white/10 group-hover:scale-105 transition-transform duration-500">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-blue-600 text-[9px] font-black uppercase tracking-[0.3em] mb-0.5">Analytics</span>
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tighter leading-none">Performance Report</h1>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-[1.5px] h-6 bg-slate-200/80 rounded-full"></div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Premium Date Range Picker in Header */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-inner group/date">
              <div className="relative flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-pointer">
                <Calendar size={12} className="text-blue-500 pointer-events-none" />
                <span className="text-[11px] font-black text-slate-700 pointer-events-none min-w-[72px] text-center select-none">
                  {formatCustomDate(startDate)}
                </span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
              
              <div className="px-0.5">
                <div className="w-3 h-[2px] bg-slate-300 rounded-full"></div>
              </div>

              <div className="relative flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-pointer">
                <Calendar size={12} className="text-indigo-500 pointer-events-none" />
                <span className="text-[11px] font-black text-slate-700 pointer-events-none min-w-[72px] text-center select-none">
                  {formatCustomDate(endDate)}
                </span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
            </div>

            {/* Stats Toggle Button */}
            <div className="relative">
              <button 
                onClick={() => setShowStats(!showStats)}
                className={`px-4 py-2 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${showStats ? 'bg-blue-700 text-white shadow-blue-500/40' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'}`}
              >
                <Sparkles size={14} className={showStats ? 'text-blue-100' : 'text-white'} /> পরিসংখ্যান
              </button>

              <AnimatePresence>
                {showStats && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ 
                      duration: 0.25,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    style={{ 
                      position: 'absolute', 
                      top: 'calc(100% + 12px)', 
                      right: 0, 
                      width: '450px', 
                      zIndex: 9999999 
                    }}
                    className="bg-white rounded-[2rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] border border-slate-200 overflow-hidden text-left"
                  >
                    {/* Modal Header - Blue Gradient */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                          <Sparkles size={22} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-black tracking-tight">পরিসংখ্যান</h4>
                          <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em]">STATISTICS OVERVIEW</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowStats(false)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full text-white transition-all duration-300"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6">
                      {/* Top Large Card - Total Correspondence */}
                      <div className="relative overflow-hidden bg-slate-50 rounded-2xl p-5 border border-slate-200 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
                        <div className="relative flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">সর্বমোট চিঠিপত্র</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                              {toBengaliDigits(totalLetters.toString())} <span className="text-sm font-bold text-slate-500">টি</span>
                            </h2>
                          </div>
                          <Inbox className="text-blue-200" size={40} />
                        </div>
                      </div>

                      {/* Auditor & Paragraph Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-[2px] flex-1 bg-emerald-100"></div>
                          <h5 className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.15em] flex items-center gap-2">
                            <CheckCircle2 size={14} /> অডিটর ও অনুচ্ছেদ
                          </h5>
                          <div className="h-[2px] flex-1 bg-emerald-100"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-4 hover:bg-emerald-50 transition-colors">
                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1 tracking-wider">মোট অডিটর</p>
                            <p className="text-xl font-black text-slate-800">{toBengaliDigits(auditorStats.length.toString())} জন</p>
                          </div>
                          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-4 hover:bg-emerald-50 transition-colors">
                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1 tracking-wider">মোট অনুচ্ছেদ</p>
                            <p className="text-xl font-black text-slate-800">{toBengaliDigits(totalParas.toString())} টি</p>
                          </div>
                        </div>
                      </div>

                      {/* Green Summary Bar */}
                      <div className="bg-[#00a65a] p-4 rounded-xl text-center shadow-lg shadow-emerald-500/20">
                        <p className="text-white font-black text-xs tracking-wide">
                          মোট পারফরম্যান্স: {toBengaliDigits(totalLetters.toString())} টি
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Ledger Management System</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Table/Grid */}
      <div 
        style={{ 
          ['--sticky-top' as any]: `${headerHeight}px` 
        }}
        className="bg-white rounded-none shadow-2xl border border-slate-100 relative z-10"
      >
        <div className="pt-2 md:pt-3 pb-1.5 px-2 md:px-3">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto md:overflow-visible rounded-none border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th 
                      className="bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-left"
                    >
                      অডিটরের নাম
                    </th>
                    <th 
                      className="bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center border border-slate-200"
                    >
                      মোট চিঠি
                    </th>
                    <th 
                      className="bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center border border-slate-200"
                    >
                      মোট অনুচ্ছেদ
                    </th>
                    <th 
                      className="bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center border border-slate-200"
                    >
                      নিষ্পন্নকৃত অনুচ্ছেদ
                    </th>
                    <th 
                      className="bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center border border-slate-200"
                    >
                      নিষ্পত্তির হার (%)
                    </th>
                    <th 
                      className="bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest text-right border border-slate-200"
                    >
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAuditorStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3 border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-600 transition-all shadow-sm">
                            {stat.image ? (
                              <img src={stat.image} alt={stat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Users size={20} className="text-slate-400 group-hover:text-white" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-700 block">{stat.name}</span>
                            {stat.designation && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.designation}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border border-slate-200">
                        <button 
                          onClick={() => handleShowDetails(stat.name, 'letters')}
                          className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-black hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          {toBengaliDigits(stat.letterCount.toString())}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center border border-slate-200">
                        <button 
                          onClick={() => handleShowDetails(stat.name, 'paragraphs')}
                          className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-black hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          {toBengaliDigits(stat.paraCount.toString())}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center border border-slate-200">
                        <button 
                          onClick={() => handleShowDetails(stat.name, 'settled_paragraphs')}
                          className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-black hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          {toBengaliDigits(stat.settledCount.toString())}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center font-black text-slate-700 border border-slate-200">
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-full text-sm font-black border border-slate-100">
                          {toBengaliDigits(getPercentage(stat.settledCount, stat.paraCount).toString())}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right border border-slate-200">
                        <button 
                          onClick={() => handleShowDetails(stat.name, 'settled_paragraphs')}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all cursor-pointer active:scale-95"
                          title="বিস্তারিত বিবরণ"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAuditorStats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center border border-slate-200">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <Search size={40} />
                          </div>
                          <p className="text-slate-400 font-bold">কোন তথ্য পাওয়া যায়নি।</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuditorStats.map((stat, idx) => (
                <div key={idx} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-600 transition-all shadow-sm">
                      {stat.image ? (
                        <img src={stat.image} alt={stat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Users size={28} className="text-slate-300 group-hover:text-white" />
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">র‍্যাঙ্ক</span>
                      <span className="text-xl font-black text-blue-600">#{toBengaliDigits((idx + 1).toString())}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-800 truncate">{stat.name}</h4>
                      {stat.designation && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.designation}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleShowDetails(stat.name, 'letters')}
                        className="p-3 bg-white rounded-2xl border border-slate-100 hover:border-blue-300 transition-all text-left cursor-pointer"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">চিঠি</p>
                        <p className="text-xl font-black text-slate-800">{toBengaliDigits(stat.letterCount.toString())}</p>
                      </button>
                      <button 
                        onClick={() => handleShowDetails(stat.name, 'paragraphs')}
                        className="p-3 bg-white rounded-2xl border border-slate-100 hover:border-purple-300 transition-all text-left cursor-pointer"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">অনুচ্ছেদ</p>
                        <p className="text-xl font-black text-slate-800">{toBengaliDigits(stat.paraCount.toString())}</p>
                      </button>
                      <button 
                        onClick={() => handleShowDetails(stat.name, 'settled_paragraphs')}
                        className="p-3 bg-white rounded-2xl border border-slate-100 hover:border-emerald-300 transition-all text-left cursor-pointer"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">নিষ্পন্নকৃত</p>
                        <p className="text-xl font-black text-emerald-600">{toBengaliDigits(stat.settledCount.toString())}</p>
                      </button>
                      <div 
                        className="p-3 bg-white rounded-2xl border border-slate-100 text-left"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">হার (%)</p>
                        <p className="text-xl font-black text-emerald-600">{toBengaliDigits(getPercentage(stat.settledCount, stat.paraCount).toString())}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAuditorDetails && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAuditorDetails(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 md:p-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      {selectedAuditorDetails.name} - এর বিস্তারিত তথ্য
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      {selectedAuditorDetails.type === 'letters' ? 'চিঠিপত্রের তালিকা' : 'অনুচ্ছেদের বিস্তারিত তালিকা'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAuditorDetails(null)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  {selectedAuditorDetails.type === 'settled_paragraphs' ? (
                    <table className="w-full text-left border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-center">ক্র: নং</th>
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-left">স্মারক ও তারিখ</th>
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-left">মন্ত্রণালয় ও প্রতিষ্ঠান</th>
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-center">অডিট বছর</th>
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-left">শাখা ও নিষ্পত্তির ধরন</th>
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-center">নিষ্পন্নকৃত অনুচ্ছেদ</th>
                          <th className="px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200 text-right">নিষ্পত্তিকৃত টাকা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedAuditorDetails.data.map((item, i) => {
                          const rowSettledCount = item.paragraphs?.filter((p: any) => p.status === 'পূর্ণাঙ্গ').length 
                            || parseInt(toEnglishDigits(item.meetingSettledParaCount || '0')) 
                            || 0;

                          const rowSettledAmount = item.paragraphs && item.paragraphs.length > 0 
                            ? item.paragraphs.reduce((sum: number, p: any) => sum + ((p.recoveredAmount || 0) + (p.adjustedAmount || 0)), 0) 
                            : ((item.totalRec || 0) + (item.totalAdj || 0));

                          return (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 py-3 text-center border border-slate-200">
                                <span className="text-xs font-black text-slate-700">{toBengaliDigits(i + 1)}</span>
                              </td>
                              <td className="px-4 py-3 text-left border border-slate-200">
                                <div className="flex flex-col space-y-0.5">
                                  <span className="text-xs font-bold text-slate-700">{item.letterNoDate || '---'}</span>
                                  {item.workpaperNoDate && <span className="text-[10px] text-slate-500">{item.workpaperNoDate}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-left border border-slate-200">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-800">{item.ministryName}</span>
                                  <span className="text-[10px] text-slate-400">{item.entityName} ({item.branchName})</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center border border-slate-200">
                                <span className="text-xs font-bold text-slate-600">{toBengaliDigits(item.auditYear)}</span>
                              </td>
                              <td className="px-4 py-3 text-left border border-slate-200">
                                <div className="flex flex-col space-y-0.5">
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600 self-start">
                                    {item.paraType}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-700">
                                    {item.isMeeting ? (item.meetingType || 'ত্রিপক্ষীয় সভা') : 'সাধারণ নিষ্পত্তি'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center border border-slate-200">
                                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                                  {toBengaliDigits(rowSettledCount)} টি
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right border border-slate-200">
                                <span className="text-xs font-black text-slate-800">{toBengaliDigits(rowSettledAmount || '০')}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">পত্র ও ডায়েরি বিবরণ</th>
                          <th className="px-6 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">বিষয়</th>
                          <th className="px-6 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center border border-slate-200">অনুচ্ছেদ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedAuditorDetails.data.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 border border-slate-200">
                              <div className="flex flex-col space-y-1.5">
                                <div className="text-xs font-black text-blue-600">
                                  <span>পত্র নং:</span> {toBengaliDigits(item.letterNo || '---')} | <span>তারিখ:</span> {formatCustomDate(item.letterDate)}
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                  <span>ডায়েরি নং:</span> {toBengaliDigits(item.diaryNo || '---')} | <span>তারিখ:</span> {formatCustomDate(item.receivedDate || item.diaryDate || item.createdAt)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 border border-slate-200">
                              <p className="text-xs font-bold text-slate-600 max-w-md line-clamp-2">{item.description || '---'}</p>
                            </td>
                            <td className="px-6 py-4 text-center border border-slate-200">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                selectedAuditorDetails.type === 'paragraphs' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {toBengaliDigits(item.totalParas || '০')} টি
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {selectedAuditorDetails.type === 'settled_paragraphs' ? 'মোট নিষ্পত্তিকৃত চিঠিপত্র:' : 'মোট:'} {toBengaliDigits(selectedAuditorDetails.data.length.toString())} টি
                </p>
                <button 
                  onClick={() => setSelectedAuditorDetails(null)}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnalytics;
