import React from 'react';
import { 
  ArrowRight, ShieldCheck, ShieldAlert, Landmark, Award, Lock, MapPin, FileCheck, User, Phone, Megaphone, Calendar
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
  return (
    <div className="animate-landing-premium relative w-full h-full max-w-[1880px] xl:max-w-[1880px] mx-auto flex flex-col justify-center">
      {/* Prime Master Institutional Showcase Card */}
      <div 
        id="hero-section" 
        className="landing-hero-card relative overflow-hidden rounded-[2rem] p-4 sm:p-5 md:p-6 lg:p-7 transition-all duration-500 animate-fade-in w-full shadow-lg flex-1 flex flex-col justify-center"
      >
        {/* Subtle patterned backdrop */}
        <div className="landing-grid-bg absolute inset-0 pointer-events-none" />
        
        {/* Top Split Identity Area - using stretch to match left and right column heights */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-8 items-stretch">
          
          {/* LEFT PANEL: Branding & Executive Seals */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col justify-between items-center text-center md:border-r md:border-slate-200/70 md:pr-6 lg:pr-8 pt-2 pb-5 md:pb-6 lg:pb-7">
            {/* Master Seal Shield - Government Themed */}
            <div className="flex flex-col items-center space-y-3.5">
              <div 
                className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-indigo-700 via-blue-800 to-emerald-800 text-white rounded-[2rem] shadow-xl border-3 border-amber-400 transform hover:scale-[1.03] transition-all duration-300 select-none"
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
                </div>
              </div>
            </div>

            {/* খুলনা Tag (Placed perfectly at the bottom of the left column) */}
            <div className="mt-4 flex items-center justify-center">
              <span className="landing-sector-text text-sm md:text-base font-black px-6 py-1.5 rounded-xl border border-blue-200 transition-all shadow-md animate-pulse-green">
                খুলনা
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: App Description & Interactive Portal Actions - Seamlessly integrated on the parent background */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col justify-between p-3 md:p-5 lg:p-6 space-y-4 md:space-y-6 w-full">
            
            {/* System Overview / Platform Description */}
            <div className="w-full space-y-2.5">
              <div className="landing-tag-intro inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider">
                💡 সিস্টেম পরিচিতি ও বিবরণ
              </div>
              <p className="landing-desc-text text-sm sm:text-base md:text-[17px] leading-relaxed md:leading-loose font-extrabold text-slate-800 text-justify">
                বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, সেক্টর: ০৬, খুলনার আওতাধীন শিল্প, ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি/ অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
              </p>
            </div>

            {/* LAUNCH ACTIONS (Enclosed inside Right Card) */}
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 transition-colors pt-2">
              
              {/* Centered label with premium yellow megaphone on the left, with green text appearing to emerge from its mouth */}
              <div className="flex flex-col items-center sm:items-stretch justify-center gap-2.5 text-center sm:text-left relative w-full sm:w-[43%] max-w-[280px]">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">

                  <span className="landing-label-muted text-[11px] md:text-xs uppercase font-black tracking-wider block text-center sm:text-left animate-colorful-slide">
                    চলমান রিপোর্টিং সাইকেল
                  </span>
                </div>
                <div className="flex items-stretch h-11 sm:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] select-none rounded-[4px] overflow-hidden">
                  {/* Left Icon Area: Off-white bg & gray bottom border */}
                  <div className="flex flex-col w-11 sm:w-12 shrink-0 h-full">
                    <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                      <Calendar className="text-emerald-700 w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <div className="h-[4px] bg-[#94a3b8]" />
                  </div>
                  
                  {/* Right Text Area: Solid Emerald Green with dark green bottom bar */}
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex-1 bg-[#059669] flex items-center justify-center px-3">
                      <span className="text-white font-[950] text-[11px] sm:text-xs md:text-[13px] tracking-wide text-center whitespace-nowrap">
                        {cycleLabel || "চলমান কোয়ার্টার"}
                      </span>
                    </div>
                    <div className="h-[4px] bg-[#047857]" />
                  </div>
                </div>
              </div>

              {/* Launch Action Button */}
              <div className="w-full sm:w-[43%] max-w-[280px] flex justify-center sm:justify-end">
                {(isAdmin || moduleVisibility.entry) && (
                  <button 
                    id="btn-start-work"
                    onClick={() => setActiveTab('entry')}
                    className="group flex items-stretch h-11 sm:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] active:translate-y-[1px] transition-transform duration-100 select-none cursor-pointer text-left font-inherit outline-none border-none p-0 rounded-[4px] overflow-hidden"
                  >
                    {/* Left Icon Area: Off-white bg & gray bottom border */}
                    <div className="flex flex-col w-11 sm:w-12 shrink-0 h-full">
                      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                        <ArrowRight className="text-red-800 w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="h-[4px] bg-[#94a3b8]" />
                    </div>
                    
                    {/* Right Text Area: Solid Maroon with dark maroon bottom bar */}
                    <div className="flex-1 flex flex-col h-full">
                      <div className="flex-1 bg-[#991b1b] group-hover:bg-[#851616] transition-colors flex items-center justify-center px-3">
                        <span className="text-white font-[950] text-[11px] sm:text-xs md:text-[13px] tracking-wide text-center uppercase whitespace-nowrap">
                          কাজ শুরু করুন
                        </span>
                      </div>
                      <div className="h-[4px] bg-[#450a0a]" />
                    </div>
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
