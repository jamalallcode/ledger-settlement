import React from 'react';
import { 
  LayoutDashboard, Users, ShieldCheck, BarChart3, 
  PieChart, FileText, Mail, PlusCircle, ArrowRight,
  Settings, KeyRound, Fingerprint, Library, BellRing,
  Sparkles, CheckCircle2, AlertCircle, Clock, Eye, EyeOff
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { supabase } from '../lib/supabase';
import { ModuleVisibility } from '../types';

interface AdminDashboardProps {
  isAdmin: boolean;
  entries: any[];
  correspondenceEntries: any[];
  pendingCount: number;
  setActiveTab: (tab: string, subModule?: any, reportType?: string, searchTerm?: string) => void;
  onOpenChangePassword: () => void;
  moduleVisibility: ModuleVisibility;
  setModuleVisibility: (val: ModuleVisibility) => void;
}

const colorClasses: Record<string, any> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600', border: 'hover:border-blue-500/30', shadow: 'hover:shadow-blue-500/5', lightBg: 'bg-blue-500/5', accent: 'text-blue-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-600', border: 'hover:border-indigo-500/30', shadow: 'hover:shadow-indigo-500/5', lightBg: 'bg-indigo-500/5', accent: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600', border: 'hover:border-emerald-500/30', shadow: 'hover:shadow-emerald-500/5', lightBg: 'bg-emerald-500/5', accent: 'text-emerald-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600', border: 'hover:border-purple-500/30', shadow: 'hover:shadow-purple-500/5', lightBg: 'bg-purple-500/5', accent: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600', border: 'hover:border-amber-500/30', shadow: 'hover:shadow-amber-500/5', lightBg: 'bg-amber-500/5', accent: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', hoverBg: 'group-hover:bg-rose-600', border: 'hover:border-rose-500/30', shadow: 'hover:shadow-rose-500/5', lightBg: 'bg-rose-500/5', accent: 'text-rose-600' },
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdmin,
  entries,
  correspondenceEntries,
  pendingCount,
  setActiveTab,
  onOpenChangePassword,
  moduleVisibility,
  setModuleVisibility
}) => {
  if (!isAdmin) return null;

  const handleToggleModule = async (moduleKey: keyof ModuleVisibility) => {
    const newValue = !moduleVisibility[moduleKey];
    const newVisibility = { ...moduleVisibility, [moduleKey]: newValue };
    setModuleVisibility(newVisibility);
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: `show_${moduleKey}`, value: newValue }, { onConflict: 'key' });
      
      if (error) {
        console.error(`Error updating ${moduleKey} visibility:`, error);
        alert('সেটিংস আপডেট করতে সমস্যা হয়েছে।');
        // Revert local state on error
        setModuleVisibility(moduleVisibility);
      }
    } catch (err) {
      console.error(`Failed to update ${moduleKey} visibility:`, err);
      alert('সেটিংস আপডেট করতে সমস্যা হয়েছে।');
      setModuleVisibility(moduleVisibility);
    }
  };

  const totalSettlement = entries.length;
  const totalCorrespondence = correspondenceEntries.length;
  const totalEntries = totalSettlement + totalCorrespondence;

  const stats = [
    { 
      label: 'মোট এন্ট্রি', 
      value: toBengaliDigits(totalEntries.toString()), 
      icon: BarChart3, 
      color: 'blue',
      desc: 'সিস্টেমে সংরক্ষিত মোট তথ্য'
    },
    { 
      label: 'অপেক্ষমাণ', 
      value: toBengaliDigits(pendingCount.toString()), 
      icon: Clock, 
      color: 'amber',
      desc: 'অনুমোদনের অপেক্ষায় থাকা এন্ট্রি'
    },
    { 
      label: 'চিঠিপত্র', 
      value: toBengaliDigits(totalCorrespondence.toString()), 
      icon: Mail, 
      color: 'emerald',
      desc: 'প্রাপ্ত চিঠিপত্র ও ডায়েরি'
    },
    { 
      label: 'নিষ্পত্তি', 
      value: toBengaliDigits(totalSettlement.toString()), 
      icon: CheckCircle2, 
      color: 'indigo',
      desc: 'নিষ্পত্তি সংক্রান্ত এন্ট্রি'
    }
  ];

  const quickActions = [
    { id: 'admin_analytics', label: 'অডিটর পারফরম্যান্স', icon: BarChart3, color: 'indigo', desc: 'অডিটরদের কাজের রিপোর্ট ও পরিসংখ্যান' },
    { id: 'entry', label: 'নতুন এন্ট্রি', icon: PlusCircle, color: 'blue', desc: 'নতুন তথ্য যোগ করুন' },
    { id: 'register', label: 'রেজিস্টার দেখুন', icon: FileText, color: 'emerald', desc: 'সকল রেজিস্টার ব্রাউজ করুন' },
    { id: 'voting', label: 'গোপন ব্যালট', icon: Fingerprint, color: 'purple', desc: 'ভোট প্রদান ও ফলাফল' },
    { id: 'setup_receivers', label: 'প্রাপক ব্যবস্থাপনা', icon: Users, color: 'amber', desc: 'প্রাপক তালিকা আপডেট করুন' },
    { id: 'initial_balance', label: 'জের সেটআপ', icon: ShieldCheck, color: 'blue', desc: 'প্রারম্ভিক জের সেটআপ করুন' },
    { id: 'change_pass', label: 'পাসওয়ার্ড পরিবর্তন', icon: KeyRound, color: 'indigo', desc: 'সিকিউরিটি সেটিংস আপডেট করুন' },
    { id: 'archive', label: 'ডকুমেন্ট লাইব্রেরি', icon: Library, color: 'rose', desc: 'সংরক্ষিত ফাইলসমূহ' },
    { id: 'return', label: 'রিপোর্ট ও সারাংশ', icon: PieChart, color: 'indigo', desc: 'মাসিক ও বাৎসরিক রিটার্ন' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl overflow-hidden group shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full group-hover:bg-blue-600/30 transition-colors duration-1000"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full group-hover:bg-emerald-600/20 transition-colors duration-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10">
                <LayoutDashboard size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">এডমিন ড্যাশবোর্ড</h1>
                <p className="text-blue-600/60 text-[10px] font-black uppercase tracking-[0.3em]">Administrator Command Center</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm font-bold max-w-xl">
              স্বাগতম! এখান থেকে আপনি সিস্টেমের সকল প্রশাসনিক কাজ পরিচালনা করতে পারবেন। আপনার সকল তথ্য সুরক্ষিত এবং এনক্রিপ্টেড।
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex items-center gap-3 group/status">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">System Online</span>
            </div>
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <BellRing size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const colors = colorClasses[stat.color] || colorClasses.blue;
          return (
            <div key={idx} className="relative p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 group overflow-hidden">
              <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${colors.lightBg} blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={20} />
                  </div>
                  <Sparkles size={14} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <h3 className={`text-4xl font-black ${colors.accent}`}>{stat.value}</h3>
                </div>
                <p className="text-slate-400 text-[10px] font-bold">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">দ্রুত অ্যাকশন</h2>
            </div>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">সকল মডিউল</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, idx) => {
              const colors = colorClasses[action.color] || colorClasses.blue;
              return (
                <button 
                  key={idx}
                  onClick={() => {
                    if (action.id === 'change_pass') {
                      onOpenChangePassword();
                    } else if (action.id === 'initial_balance') {
                      setActiveTab('return', null, 'প্রারম্ভিক জের সেটআপ: মাসিক');
                    } else if (action.id === 'unassigned') {
                      setActiveTab('register', 'correspondence', undefined, '__UNASSIGNED__');
                    } else {
                      setActiveTab(action.id);
                    }
                  }}
                  className={`group relative p-5 rounded-2xl bg-white border border-slate-200 ${colors.border} ${colors.shadow} transition-all duration-300 text-left overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${colors.lightBg} blur-2xl rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform`}></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} ${colors.hoverBg} group-hover:text-white transition-all duration-500`}>
                      <action.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{action.label}</h4>
                      <p className="text-[10px] font-bold text-slate-500">{action.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & System Status */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">সিস্টেম স্ট্যাটাস</h2>
          </div>

          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-2xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-4 bg-slate-900/5 rounded-2xl border border-slate-200/50">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">সিকিউরিটি লেভেল</span>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest">Maximum</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/5 rounded-2xl border border-slate-200/50">
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">ডাটাবেজ সিঙ্ক</span>
                </div>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-widest">Active</span>
              </div>

              {/* Module Visibility Controls */}
              <div className="pt-2 pb-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">মডিউল ভিজিবিলিটি কন্ট্রোল</h3>
                <div className="space-y-2">
                  {[
                    { key: 'entry', label: 'নতুন এন্ট্রি', icon: PlusCircle, color: 'blue' },
                    { key: 'register', label: 'রেজিস্টার দেখুন', icon: FileText, color: 'emerald' },
                    { key: 'return', label: 'রিপোর্ট ও সারাংশ', icon: PieChart, color: 'indigo' },
                    { key: 'archive', label: 'ডকুমেন্ট লাইব্রেরি', icon: Library, color: 'rose' },
                    { key: 'audit_details', label: 'অডিট ডিটেইলস (ফিল্ড ১০-১৫)', icon: Settings, color: 'purple' },
                  ].map((module) => (
                    <div key={module.key} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${moduleVisibility[module.key as keyof ModuleVisibility] ? `bg-${module.color}-600/5 border-${module.color}-200/50` : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        {moduleVisibility[module.key as keyof ModuleVisibility] ? <Eye size={16} className={`text-${module.color}-600`} /> : <EyeOff size={16} className="text-slate-400" />}
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800">{module.label}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleModule(module.key as keyof ModuleVisibility)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none ${moduleVisibility[module.key as keyof ModuleVisibility] ? `bg-${module.color}-600 shadow-lg shadow-${module.color}-500/30` : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 ${moduleVisibility[module.key as keyof ModuleVisibility] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/5 rounded-2xl border border-slate-200/50">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="text-xs font-bold text-slate-700">অপেক্ষমাণ কাজ</span>
                </div>
                <span className="text-amber-600 font-black text-sm">{toBengaliDigits(pendingCount.toString())}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={() => setActiveTab('register')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                বিস্তারিত দেখুন <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Admin Tip</span>
            </div>
            <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
              সিস্টেমের নিরাপত্তা বজায় রাখতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন এবং কাজ শেষে অবশ্যই লগআউট করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;