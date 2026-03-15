import React from 'react';
import { 
  Fingerprint, 
  Settings, 
  ShieldCheck, 
  ArrowRight, 
  LayoutDashboard,
  Bell,
  History,
  Users,
  Database
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface AdminDashboardProps {
  setActiveTab: (tab: string, subModule?: any, reportType?: string) => void;
  pendingCount: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab, pendingCount }) => {
  const adminCards = [
    {
      id: 'voting',
      title: 'গোপন ব্যালট',
      description: 'নির্বাচন বা পোলিং সিস্টেম পরিচালনা করুন।',
      icon: Fingerprint,
      color: 'bg-purple-600',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      action: () => setActiveTab('voting')
    },
    {
      id: 'setup',
      title: 'পূর্ব জের সেটআপ',
      description: 'মন্ত্রণালয় ভিত্তিক প্রারম্ভিক জের বা ব্যালেন্স সেটআপ করুন।',
      icon: Settings,
      color: 'bg-blue-600',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      action: () => setActiveTab('return', null, 'পূর্ব জের সেটআপ: মাসিক')
    }
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <ShieldCheck size={240} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/40">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <span className="text-sm font-black tracking-[0.2em] text-blue-400 uppercase">Admin Control Center</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
              স্বাগতম, <span className="text-blue-400">এডমিন প্যানেলে</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
              এখান থেকে আপনি সিস্টেমের সকল গুরুত্বপূর্ণ ফিচার এবং সেটিংস নিয়ন্ত্রণ করতে পারবেন।
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Bell size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{toBengaliDigits(pendingCount)}</h3>
          <p className="text-sm font-bold text-slate-500">অপেক্ষমাণ এন্ট্রি</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Database size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">সক্রিয়</h3>
          <p className="text-sm font-bold text-slate-500">ডাটাবেজ স্ট্যাটাস</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <History size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">আপডেট</h3>
          <p className="text-sm font-bold text-slate-500">সিস্টেম লগ</p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">প্রধান ফিচারসমূহ</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {adminCards.map((card) => (
            <div 
              key={card.id}
              onClick={card.action}
              className="group relative bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className={`absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-1000 ${card.textColor}`}>
                <card.icon size={200} />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="space-y-4">
                  <div className={`w-16 h-16 ${card.lightColor} ${card.textColor} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <card.icon size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-black text-blue-600 group-hover:gap-4 transition-all">
                  প্রবেশ করুন <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
