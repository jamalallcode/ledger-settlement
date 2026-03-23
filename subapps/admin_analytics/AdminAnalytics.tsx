import React, { useState, useMemo } from 'react';
import { toBengaliDigits, parseBengaliNumber } from '../../utils/numberUtils';
import { 
  BarChart3, Calendar, Users, FileText, 
  ArrowRight, Search, Download, Filter,
  ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';

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

  const receiverProfiles = useMemo(() => {
    const sfi = JSON.parse(localStorage.getItem('ledger_correspondence_receivers_sfi') || '[]');
    const nonSfi = JSON.parse(localStorage.getItem('ledger_correspondence_receivers_nonsfi') || '[]');
    const all = [...sfi, ...nonSfi];
    const map: Record<string, { designation?: string, image?: string }> = {};
    all.forEach((p: any) => {
      if (typeof p === 'object' && p.name) {
        map[p.name] = { designation: p.designation, image: p.image };
      }
    });
    return map;
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

  const auditorStats = useMemo(() => {
    const stats: Record<string, { name: string, letterCount: number, paraCount: number, designation?: string, image?: string }> = {};

    filteredData.forEach(entry => {
      const name = entry.receiverName || 'অনির্ধারিত (Unassigned)';
      if (!stats[name]) {
        const profile = receiverProfiles[name] || {};
        stats[name] = { 
          name, 
          letterCount: 0, 
          paraCount: 0,
          designation: profile.designation,
          image: profile.image
        };
      }
      
      stats[name].letterCount += 1;
      
      // Count paragraphs from correspondence entries
      stats[name].paraCount += parseBengaliNumber(entry.totalParas || '0');
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">অডিটর পারফরম্যান্স রিপোর্ট</h1>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em]">Auditor Productivity Analytics</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            <Download size={16} /> এক্সপোর্ট রিপোর্ট
          </button>
        </div>
      </div>

      {/* Filters & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Card */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-black text-slate-800">ফিল্টার</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">শুরুর তারিখ</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">শেষ তারিখ</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                নির্বাচিত সময়ের মধ্যে মোট <span className="font-black underline">{toBengaliDigits(filteredData.length.toString())}টি</span> এন্ট্রি পাওয়া গেছে।
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/20 text-white relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest">মোট অডিটর</p>
                <h3 className="text-5xl font-black">{toBengaliDigits(auditorStats.length.toString())}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">মোট চিঠি</p>
                <h3 className="text-5xl font-black text-slate-800">{toBengaliDigits(totalLetters.toString())}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">মোট অনুচ্ছেদ</p>
                <h3 className="text-5xl font-black text-slate-800">{toBengaliDigits(totalParas.toString())}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Table/Grid */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">বিস্তারিত রিপোর্ট</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="অডিটর খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-500 outline-none transition-all w-64"
              />
            </div>
          </div>
        </div>

        <div className="p-8">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-3xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">অডিটরের নাম</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">মোট চিঠি</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">মোট অনুচ্ছেদ</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAuditorStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-600 transition-all shadow-sm">
                            {stat.image ? (
                              <img src={stat.image} alt={stat.name} className="w-full h-full object-cover" />
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
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-black">
                          {toBengaliDigits(stat.letterCount.toString())}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-black">
                          {toBengaliDigits(stat.paraCount.toString())}
                        </span>
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
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-600 transition-all shadow-sm">
                      {stat.image ? (
                        <img src={stat.image} alt={stat.name} className="w-full h-full object-cover" />
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
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">চিঠি</p>
                        <p className="text-2xl font-black text-slate-800">{toBengaliDigits(stat.letterCount.toString())}</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">অনুচ্ছেদ</p>
                        <p className="text-2xl font-black text-slate-800">{toBengaliDigits(stat.paraCount.toString())}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
