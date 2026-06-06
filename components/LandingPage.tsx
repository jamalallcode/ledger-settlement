import React from 'react';
import { 
  ArrowRight, ShieldCheck, ShieldAlert, Landmark, Award, Lock, MapPin, FileCheck, User, Phone
} from 'lucide-react';
import { SettlementEntry, ModuleVisibility } from '../types.ts';
import { toBengaliDigits } from '../utils/numberUtils.ts';

interface LandingPageProps {
  entries: SettlementEntry[];
  setActiveTab: (tab: string) => void;
  cycleLabel: string;
  isLockedMode?: boolean;
  isAdmin?: boolean;
  pendingCount?: number;
  onShowPending?: () => void;
  moduleVisibility?: ModuleVisibility;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  setActiveTab, 
  cycleLabel, 
  isLockedMode = true,
  isAdmin = false,
  pendingCount = 0,
  onShowPending,
  moduleVisibility = {
    entry: true,
    register: true,
    return: true,
    archive: true,
    voting: true,
    setup_receivers: true,
    initial_balance: true,
    change_pass: true,
    admin_analytics: true,
    audit_details: true,
  }
}) => {
  return (
    <div className="animate-landing-premium relative space-y-3 pb-2 w-full max-w-5xl lg:max-w-6xl mx-auto px-4 md:px-6">
      {/* MODERATION ALERT FOR ADMIN */}
      {isAdmin && pendingCount > 0 && (
        <div 
          id="admin-moderation-alert" 
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 border border-amber-200 shadow-xs transition-all duration-300 w-full"
        >
          <div className="absolute -right-6 -bottom-6 opacity-5 text-amber-900 pointer-events-none transition-transform duration-500 group-hover:scale-110">
             <ShieldAlert size={80} />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20"></div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <ShieldAlert size={16} />
                </div>
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  রিভিউ অপেক্ষমাণ রয়েছে
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[8px] font-black">
                    {toBengaliDigits(pendingCount)} টি অনুচ্ছেদ
                  </span>
                </h2>
                <p className="text-amber-800/70 font-semibold text-[10px]">নতুন ডাটাগুলো স্থায়ীভাবে যুক্ত করার পূর্বে আপনার অনুমোদন আবশ্যক।</p>
              </div>
            </div>
            
            <button 
              onClick={onShowPending}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-black text-[11px] shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              এখনই অনুমোদন করুন
              <ArrowRight size={10} />
            </button>
          </div>
        </div>
      )}
      
      {/* Prime Master Institutional Showcase Card */}
      <div 
        id="hero-section" 
        className="landing-hero-card relative overflow-hidden rounded-[1.75rem] p-5 md:p-6 lg:p-8 transition-all duration-500 animate-fade-in w-full"
      >
        {/* Subtle patterned backdrop */}
        <div className="landing-grid-bg absolute inset-0 pointer-events-none" />
        
        {/* Subtle executive status tag overlay */}
        <div className="absolute top-3 right-4 z-10 hidden sm:block">
          {isLockedMode ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold border border-slate-200/50 shadow-2xs">
              <Lock size={8} className="text-slate-500" />
              নিরাপদ মোড
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold border border-emerald-200/45 shadow-2xs animate-pulse">
              <ShieldCheck size={8} className="text-emerald-500" />
              লাইভ মোড
            </span>
          )}
        </div>

        {/* Dynamic Split Layout to utilize left/right space and remain compact vertically */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-8 items-center">
          
          {/* LEFT PANEL: Branding & Executive Seals */}
          <div className="md:col-span-3 lg:col-span-3 flex flex-col items-center justify-center text-center space-y-3 md:border-r md:border-slate-200/70 md:pr-4 py-1">
            {/* Master Seal Shield - Government Themed */}
            <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-700 via-blue-800 to-emerald-800 text-white rounded-2xl shadow-md border-2 border-amber-400/90 p-0.5 transform hover:scale-105 transition-all">
              <div className="absolute inset-0 bg-slate-900/10 rounded-2xl"></div>
              <Landmark size={24} className="stroke-[2] text-white relative z-10" />
              <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white shadow-md font-black">
                ✓
              </div>
            </div>

            {/* Structured Institutional Identity Card */}
            <div className="space-y-1.5 w-full">
              <span className="landing-gov-tag inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
              </span>
              
              <h3 className="text-base md:text-[17px] font-black text-slate-800 tracking-tight leading-tight dark:text-gray-105">
                বাণিজ্যিক অডিট অধিদপ্তর
              </h3>
              
              <div className="flex flex-col items-center w-full">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200/40 text-[9px] font-bold">
                  <Award size={10} className="text-blue-600 shrink-0" />
                  খুলনা আঞ্চলিক কার্যালয়
                </span>
                <span className="landing-sector-text text-xs font-black mt-1">সেক্টর: ০৬</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: App Description & Interactive Portal Actions */}
          <div className="md:col-span-9 lg:col-span-9 flex flex-col justify-between space-y-3.5 w-full">
            
            {/* System Overview / Platform Description Panel */}
            <div className="landing-intro-panel w-full space-y-1.5 p-3.5 rounded-xl border">
              <div className="landing-tag-intro inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                💡 সিস্টেম পরিচিতি ও বিবরণ
              </div>
              <p className="landing-desc-text text-xs sm:text-[13px] leading-relaxed font-bold text-justify">
                বাণিজ্যিক অডিট অধিদপ্তরের খুলনা আঞ্চলিক কার্যালয়ের আওতাধীন ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি বা অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
              </p>
            </div>

            {/* LAUNCH ACTIONS DECK */}
            <div className="landing-action-deck w-full rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
              
              <div className="flex items-center gap-2.5 text-left shrink-0">
                <div className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </div>
                <div className="space-y-0.5">
                  <div className="landing-label-muted text-[8px] uppercase font-black tracking-wider">চলমান রিপোর্টিং সাইকেল</div>
                  <div className="landing-val-text text-[11px] font-black">{cycleLabel || "চলমান কোয়ার্টার"}</div>
                </div>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                {(isAdmin || moduleVisibility.entry) && (
                  <button 
                    id="btn-start-work"
                    onClick={() => setActiveTab('entry')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-850 text-white text-xs sm:text-sm font-black rounded-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md shadow-blue-500/25 cursor-pointer border border-blue-500/40 text-center"
                  >
                    <span className="text-white tracking-wide font-black">কাজ শুরু করুন</span>
                    <ArrowRight size={14} className="stroke-[3] text-white animate-bounce-horizontal" />
                  </button>
                )}
              </div>
              
            </div>

            {/* DEVELOPER CREDENTIALS ACCREDITATION */}
            <div className="landing-developer-panel w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl text-xs transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <User size={13} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <p className="landing-label-muted text-[8px] font-bold uppercase tracking-wider">অ্যাপলিকেশন নির্মাতা</p>
                  <p className="landing-val-text font-extrabold text-xs leading-none">জামাল উদ্দিন</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2.5 sm:pt-0 sm:pl-3 dark:border-slate-700">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 animate-pulse">
                  <Phone size={12} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <p className="landing-label-muted text-[8px] font-bold uppercase tracking-wider">কারিগরি সহায়তা ও মোবাইল</p>
                  <a href="tel:01789539494" className="landing-phone-link font-black text-xs sm:text-sm">
                    01789539494
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
