import React, { useState } from 'react';
import { 
  LayoutDashboard, ArrowRight, ShieldCheck, CheckCircle2, CalendarRange, Bell, ShieldAlert, Sparkles, UserCheck, AlertTriangle, ArrowRightCircle
} from 'lucide-react';
import { SettlementEntry } from '../types.ts';
import { toBengaliDigits } from '../utils/numberUtils.ts';

interface LandingPageProps {
  entries: SettlementEntry[];
  setActiveTab: (tab: string) => void;
  cycleLabel: string;
  isLockedMode?: boolean;
  isLayoutEditable?: boolean;
  isAdmin?: boolean;
  pendingCount?: number;
  onShowPending?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  entries, 
  setActiveTab, 
  cycleLabel, 
  isLockedMode = true,
  isLayoutEditable = false,
  isAdmin = false,
  pendingCount = 0,
  onShowPending
}) => {
  // Added isLayoutEditable as an optional prop to match usage on line 117
  const IDBadge = ({ id, isLayoutEditable: manualEditable }: { id: string, isLayoutEditable?: boolean }) => {
    const [copied, setCopied] = useState(false);
    // Use manual prop if provided, otherwise fallback to parent scope value
    const showBadge = manualEditable !== undefined ? manualEditable : isLayoutEditable;
    if (!showBadge) return null;
    
    const handleCopy = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div 
        onClick={handleCopy}
        className="absolute top-0 left-0 -translate-y-full z-[9995] pointer-events-auto no-print"
      >
        <span 
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md font-black text-[9px]
            bg-black text-white border border-white/30 shadow-2xl transition-all duration-300
            hover:scale-150 hover:bg-blue-600 hover:z-[99999] active:scale-95 cursor-copy origin-bottom-left
            ${copied ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30 !scale-125' : ''}
          `}
        >
          {copied ? <><CheckCircle2 size={10} /> COPIED</> : `#${id}`}
        </span>
      </div>
    );
  };

  return (
    <div className="animate-landing-premium relative space-y-8 pb-20">
      <IDBadge id="view-landing-home" />

      {/* MODERATION ALERT FOR ADMIN - MOVED TO TOP AS PER INSTRUCTION */}
      {isAdmin && pendingCount > 0 && (
        <div id="admin-moderation-alert" className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50 p-8 border-2 border-amber-200/60 shadow-xl shadow-amber-900/5 animate-in slide-in-from-bottom-6 duration-700">
          <IDBadge id="admin-moderation-alert" isLayoutEditable={isLayoutEditable} />
          
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-1000">
             <ShieldAlert size={260} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                  <ShieldAlert size={32} />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-amber-950 flex items-center gap-3">
                  রিভিউ এর জন্য তথ্য অপেক্ষমাণ আছে!
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-black">
                    {toBengaliDigits(pendingCount)} টি নতুন এন্ট্রি
                  </span>
                </h2>
                <p className="text-amber-800/70 font-bold text-sm">অন্যান্য ব্যবহারকারী দ্বারা প্রেরিত নতুন ডাটাগুলো রেজিস্টারে যুক্ত করার পূর্বে আপনার অনুমোদন প্রয়োজন।</p>
              </div>
            </div>
            
            <button 
              onClick={onShowPending}
              className="flex items-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-600/30 transition-all active:scale-95 whitespace-nowrap"
            >
              এখনই মডোরেশন করুন <ArrowRightCircle size={18} />
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div id="hero-section" className="relative overflow-hidden rounded-[2.5rem] bg-white p-10 text-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200">
        <IDBadge id="hero-section" />
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-8 text-slate-100 opacity-40">
          <ShieldCheck size={200} />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <span className="text-sm font-black tracking-widest text-blue-600 uppercase">Settlement Register</span>
            
            {isAdmin && isLockedMode && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-200 flex items-center gap-1.5 ml-auto shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                LOCKED MODE
              </span>
            )}
          </div>
          
          <h1 className="text-5xl font-black mb-6 leading-tight text-slate-900 tracking-tight">
            মীমাংসা রেজিস্টার <span className="text-blue-600">মডিউল</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mb-10 leading-relaxed">
            বাণিজ্যিক অডিট অধিদপ্তর, খুলনা আঞ্চলিক কার্যালয়ের জন্য তৈরি একটি ডিজিটাল নিষ্পত্তি রেজিস্টার এবং রিপোর্টিং সিস্টেম।
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              id="btn-start-work"
              onClick={() => setActiveTab('entry')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base flex items-center gap-3 transition-all shadow-xl shadow-blue-600/30 active:scale-95 relative"
            >
              <IDBadge id="btn-start-work" />
              কাজ শুরু করুন <ArrowRight size={20} />
            </button>
            <div id="cycle-badge-hero" className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm relative">
               <IDBadge id="cycle-badge-hero" />
               <CalendarRange size={20} className="text-slate-400" />
               <span className="text-sm font-black text-slate-600">সাইকেল: {cycleLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
