import React, { useRef } from 'react';
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
  onOpenSpecialLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  setActiveTab, 
  cycleLabel, 
  isLockedMode = true,
  isAdmin = false,
  pendingCount = 0,
  onShowPending,
  onOpenSpecialLogin,
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
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  const handleLogoSequentialClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 1500) {
      clickCount.current += 1;
    } else {
      clickCount.current = 1;
    }
    lastClickTime.current = now;

    console.log("Consecutive logo clicks:", clickCount.current);

    if (clickCount.current >= 20) {
      clickCount.current = 0;
      if (onOpenSpecialLogin) {
        onOpenSpecialLogin();
      }
    }
  };
  return (
    <div className="animate-landing-premium relative w-full max-w-5xl lg:max-w-6xl mx-auto">
      {/* MODERATION ALERT FOR ADMIN */}
      {isAdmin && pendingCount > 0 && (
        <div 
          id="admin-moderation-alert" 
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 border border-amber-200 shadow-xs transition-all duration-300 w-full mb-6"
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
        className="landing-hero-card relative overflow-hidden rounded-[2rem] p-4 sm:p-5 md:p-6 lg:p-7 transition-all duration-500 animate-fade-in w-full shadow-lg"
      >
        {/* Subtle patterned backdrop */}
        <div className="landing-grid-bg absolute inset-0 pointer-events-none" />
        
        {/* Dynamic Split Layout to utilize left/right space and remain compact vertically */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-8 items-center">
          
          {/* LEFT PANEL: Branding & Executive Seals */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col items-center justify-center text-center space-y-3.5 md:border-r md:border-slate-200/70 md:pr-6 lg:pr-8 py-1">
            {/* Master Seal Shield - Government Themed (Significantly enlarged) */}
            <div 
              onClick={handleLogoSequentialClick}
              role="button"
              className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-indigo-700 via-blue-800 to-emerald-800 text-white rounded-[2rem] shadow-xl border-3 border-amber-400 transform hover:scale-110 hover:shadow-[0_0_25px_rgba(245,158,11,0.7)] transition-all duration-300 cursor-pointer select-none active:scale-95"
            >
              <div className="absolute inset-0 bg-slate-900/10 rounded-[2rem]"></div>
              <Landmark className="stroke-[2.5] text-white relative z-10 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[12px] text-white shadow-md font-black">
                ✓
              </div>
            </div>

            {/* Structured Institutional Identity Card */}
            <div className="space-y-2 w-full">
              <span className="landing-gov-tag inline-block px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-wider">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
              </span>
              
              <h3 className="landing-hero-title text-xl md:text-2xl lg:text-[23px] font-black tracking-tight leading-tight">
                বাণিজ্যিক অডিট অধিদপ্তর
              </h3>
              
              <div className="flex flex-col items-center w-full space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200/40 text-[10px] md:text-xs font-bold shadow-2xs">
                  <Award size={13} className="text-blue-600 shrink-0" />
                  আঞ্চলিক কার্যালয়, সেক্টর: ০৬
                </span>
                <span className="landing-sector-text text-sm md:text-base font-black mt-2 bg-blue-50 text-blue-800 px-4 py-1 rounded-full border border-blue-105">
                  খুলনা
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: App Description & Interactive Portal Actions in a single cohesive card */}
          <div className="md:col-span-8 lg:col-span-8 landing-right-card flex flex-col justify-between rounded-3xl border p-5 md:p-6 lg:p-7 space-y-4 md:space-y-5 w-full shadow-xs">
            
            {/* System Overview / Platform Description (Inside cohesive container) */}
            <div className="w-full space-y-2.5">
              <div className="landing-tag-intro inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider">
                💡 সিস্টেম পরিচিতি ও বিবরণ
              </div>
              <p className="landing-desc-text text-sm sm:text-base md:text-[17px] leading-relaxed md:leading-loose font-extrabold text-slate-800 text-justify">
                বাণিজ্যিক অডিট অধিদপ্তরের খুলনা আঞ্চলিক কার্যালয়ের আওতাধীন ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি বা অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
              </p>
            </div>

            {/* LAUNCH ACTIONS (Inside cohesive container) */}
            <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors">
              
              <div className="flex items-center gap-3 text-left shrink-0">
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <div className="space-y-1">
                  <div className="landing-label-muted text-[10px] md:text-xs uppercase font-black tracking-wider">চলমান রিপোর্টিং সাইকেল</div>
                  <div className="landing-val-text text-xs sm:text-sm md:text-base font-black text-blue-700 bg-blue-50/50 px-3 py-1 rounded-lg border border-blue-100/50">
                    {cycleLabel || "চলমান কোয়ার্টার"}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto shrink-0 flex justify-start">
                {(isAdmin || moduleVisibility.entry) && (
                  <button 
                    id="btn-start-work"
                    onClick={() => setActiveTab('entry')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-850 text-white text-xs sm:text-sm md:text-base font-black rounded-xl hover:scale-[1.03] active:scale-95 transition-all duration-200 shadow-lg shadow-blue-500/20 cursor-pointer border border-blue-500/40 text-center"
                  >
                    <span className="text-white tracking-wide font-black">কাজ শুরু করুন</span>
                    <ArrowRight size={16} className="stroke-[3] text-white animate-bounce-horizontal" />
                  </button>
                )}
              </div>
              
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
