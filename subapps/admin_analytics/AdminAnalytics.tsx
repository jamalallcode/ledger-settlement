import React, { useState, useMemo, useEffect } from 'react';
import { toBengaliDigits, parseBengaliNumber, formatDateBN } from '../../utils/numberUtils';
import { 
  BarChart3, Calendar, Users, FileText, 
  ArrowRight, Search, Download, Filter,
  ChevronLeft, ChevronRight, LayoutGrid, List,
  CalendarRange, X, Sparkles, XCircle, Inbox, CheckCircle2
} from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiverAvatar from '../../components/ReceiverAvatar';

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
    type: 'letters' | 'paragraphs';
    data: any[];
  } | null>(null);

  const [storageTick, setStorageTick] = useState(0);

  const receiverProfiles = useMemo(() => {
    const sfi = JSON.parse(localStorage.getItem('ledger_correspondence_receivers_sfi') || '[]');
    const nonSfi = JSON.parse(localStorage.getItem('ledger_correspondence_receivers_nonsfi') || '[]');
    const all = [...sfi, ...nonSfi];
    const map: Record<string, { designation?: string, image?: string }> = {};
    all.forEach((p: any) => {
      if (typeof p === 'object' && p.name) {
        const normalizedName = p.name.trim();
        map[normalizedName] = { designation: p.designation, image: p.image };
      }
    });
    return map;
  }, [correspondenceEntries, storageTick]);

  useEffect(() => {
    const handleStorage = () => setStorageTick(t => t + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

  const calculateParaCount = (entry: any) => {
    const pNos = entry.paraNo ? entry.paraNo.split(',').map((p: string) => p.trim()).filter((p: string) => p) : [];
    return pNos.length > 0 ? pNos.length : parseBengaliNumber(entry.totalParas || '0');
  };

  const auditorStats = useMemo(() => {
    const stats: Record<string, { name: string, letterCount: number, paraCount: number, paraNos: string[], designation?: string, image?: string }> = {};

    filteredData.forEach(entry => {
      const rawName = entry.receiverName || 'অনির্ধারিত (Unassigned)';
      const name = rawName.trim();
      
      if (!stats[name]) {
        const profile = receiverProfiles[name] || {};
        stats[name] = { 
          name, 
          letterCount: 0, 
          paraCount: 0,
          paraNos: [],
          designation: profile.designation,
          image: profile.image
        };
      }
      
      stats[name].letterCount += 1;
      
      // Count paragraphs from correspondence entries
      stats[name].paraCount += calculateParaCount(entry);
      if (entry.paraNo) {
        stats[name].paraNos.push(entry.paraNo);
      }
    });

    return Object.values(stats).sort((a, b) => b.letterCount - a.letterCount);
  }, [filteredData, receiverProfiles]);

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

  const handleShowDetails = (auditorName: string, type: 'letters' | 'paragraphs') => {
    const data = filteredData.filter(entry => {
      const entryName = (entry.receiverName || 'অনির্ধারিত (Unassigned)').trim();
      return entryName === auditorName.trim();
    });
    setSelectedAuditorDetails({ name: auditorName, type, data });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative z-50 group">
        {/* Decorative Blur Circle - Wrapped in a clipping container */}
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-start gap-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-2xl text-slate-600 transition-all shadow-sm group"
              title="ফিরে যান"
            >
              <X size={20} className="group-hover:scale-110 transition-transform duration-300" />
            </button>
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-500/20 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                <BarChart3 size={28} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Analytics</span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">Performance Report</h1>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-[1.5px] h-10 bg-slate-200/80 rounded-full"></div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Premium Date Range Picker in Header */}
            <div className="flex items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner group/date">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <Calendar size={14} className="text-blue-500" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-[11px] font-black text-slate-700 w-28 cursor-pointer"
                />
              </div>
              
              <div className="px-1">
                <div className="w-4 h-[2px] bg-slate-300 rounded-full"></div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <Calendar size={14} className="text-indigo-500" />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-[11px] font-black text-slate-700 w-28 cursor-pointer"
                />
              </div>
            </div>

            {/* Search in Header */}
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="অডিটর খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all w-48 shadow-sm"
              />
            </div>

            {/* Stats Toggle Button */}
            <div className="relative">
              <button 
                onClick={() => setShowStats(!showStats)}
                className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${showStats ? 'bg-blue-700 text-white shadow-blue-500/40' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'}`}
              >
                <Sparkles size={16} className={showStats ? 'text-blue-100' : 'text-white'} /> পরিসংখ্যান
              </button>

              <AnimatePresence>
                {showStats && (
                  <div 
                    className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setShowStats(false)}
                  >
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        duration: 0.25,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className="bg-white rounded-[2rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] border border-slate-200 overflow-y-auto max-h-[90vh] text-left w-full max-w-[450px] no-scrollbar"
                      onClick={(e) => e.stopPropagation()}
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
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Table/Grid */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100">
        <div className="p-8">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="sticky top-0 bg-slate-50 px-12 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest z-40 first:rounded-tl-3xl shadow-sm min-w-[280px]">অডিটরের নাম</th>
                    <th className="sticky top-0 bg-slate-50 px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center z-40 shadow-sm">মোট চিঠি</th>
                    <th className="sticky top-0 bg-slate-50 px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center z-40 shadow-sm">মোট অনুচ্ছেদ</th>
                    <th className="sticky top-0 bg-slate-50 px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right z-40 last:rounded-tr-3xl shadow-sm">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAuditorStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-6">
                      <div className="flex flex-col items-start gap-1">
                        <ReceiverAvatar name={stat.name} size="md" />
                        <div>
                          <span className="text-sm font-black text-slate-700 block">{stat.name}</span>
                          {stat.designation && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.designation}</span>
                          )}
                        </div>
                      </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleShowDetails(stat.name, 'letters')}
                          className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-black hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          {toBengaliDigits(stat.letterCount.toString())}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button 
                            onClick={() => handleShowDetails(stat.name, 'paragraphs')}
                            className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-black hover:bg-purple-100 transition-all cursor-pointer relative group/para"
                          >
                            {toBengaliDigits(stat.paraCount.toString())}
                          </button>
                          {stat.paraNos.length > 0 && (
                            <span className="text-[9px] font-bold text-slate-400 max-w-[120px] truncate" title={stat.paraNos.join(', ')}>
                              ({stat.paraNos.join(', ')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAuditorStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
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
                    <ReceiverAvatar name={stat.name} size="lg" />
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
                        className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-300 transition-all text-left"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">চিঠি</p>
                        <p className="text-2xl font-black text-slate-800">{toBengaliDigits(stat.letterCount.toString())}</p>
                      </button>
                      <button 
                        onClick={() => handleShowDetails(stat.name, 'paragraphs')}
                        className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-purple-300 transition-all text-left"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">অনুচ্ছেদ</p>
                        <p className="text-2xl font-black text-slate-800">{toBengaliDigits(stat.paraCount.toString())}</p>
                      </button>
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
          <div 
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedAuditorDetails(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-7xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 md:p-8 flex items-center justify-between shrink-0">
                <div className="flex flex-col items-start gap-4">
                  <ReceiverAvatar name={selectedAuditorDetails.name} size="md" />
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
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ডায়েরি নম্বর</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">তারিখ</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">পত্রের বিবরণ</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">অনুচ্ছেদ</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">অনুচ্ছেদ নং</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">উৎস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedAuditorDetails.data.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-slate-700">{toBengaliDigits(item.diaryNo || '---')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-slate-500">
                              {formatDateBN(item.receivedDate || item.diaryDate || item.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-700 max-w-md line-clamp-2">{item.description || item.subject || '---'}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                              selectedAuditorDetails.type === 'paragraphs' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {toBengaliDigits(calculateParaCount(item).toString())} টি
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-slate-600">
                              {item.paraNo || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {item.senderName || '---'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  মোট: {toBengaliDigits(selectedAuditorDetails.data.length.toString())} টি চিঠি
                </p>
                <button 
                  onClick={() => setSelectedAuditorDetails(null)}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
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
