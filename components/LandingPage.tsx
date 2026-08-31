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
    <div className="animate-landing-premium relative w-full max-w-[1880px] xl:max-w-[1880px] mx-auto flex flex-col justify-between sm:justify-center h-full sm:h-auto py-0 sm:py-2 md:py-4">
      {/* Prime Master Institutional Showcase Card */}
      <div 
        id="hero-section" 
        className="landing-hero-card relative overflow-hidden rounded-none sm:rounded-[2rem] p-3.5 min-[380px]:p-4 sm:p-5 md:p-6 lg:p-7 transition-all duration-500 animate-fade-in w-full h-full sm:h-auto shadow-lg flex flex-col justify-between sm:justify-center border-x-0 border-t-0 sm:border"
      >
        {/* Subtle patterned backdrop */}
        <div className="landing-grid-bg absolute inset-0 pointer-events-none" />
        
        {/* Top Split Identity Area - using stretch to match left and right column heights */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 min-[380px]:gap-4 sm:gap-6 lg:gap-8 items-stretch flex-1 flex flex-col md:grid justify-between">
          
          {/* LEFT PANEL: Branding & Executive Seals */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col items-center text-center md:border-r md:border-slate-200/70 md:pr-6 lg:pr-8 pt-1 sm:pt-1 pb-1 sm:pb-3 md:pb-6 lg:pb-7">
            {/* Master Seal Shield - Government Themed */}
            <div className="flex flex-col items-center space-y-2 sm:space-y-3 w-full">
              <div 
                className="landing-shield-bg relative flex items-center justify-center w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 text-white rounded-2xl sm:rounded-[2rem] shadow-xl border-2 sm:border-3 border-amber-400 transform hover:scale-[1.03] transition-all duration-300 select-none shrink-0"
              >
                <div className="absolute inset-0 bg-slate-900/10 rounded-2xl sm:rounded-[2rem]"></div>
                <Landmark className="stroke-[2.5] text-white relative z-10 w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
                <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 min-[380px]:w-6.5 min-[380px]:h-6.5 sm:w-7 sm:h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] sm:text-[12px] text-white shadow-md font-black">
                  ✓
                </div>
              </div>

              {/* Structured Institutional Identity Card */}
              <div className="space-y-1.5 sm:space-y-2 w-full">
                <span className="landing-gov-tag inline-block px-3 py-0.5 sm:px-3 sm:py-1 rounded-md text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs font-black uppercase tracking-wider">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                </span>
                
                <h3 className="landing-hero-title text-xl min-[380px]:text-2xl sm:text-2xl md:text-2xl lg:text-[23px] font-black tracking-tight leading-tight">
                  বাণিজ্যিক অডিট অধিদপ্তর
                </h3>
                
                <div className="flex flex-col items-center w-full space-y-1.5 sm:space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200/40 text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs font-bold shadow-2xs">
                    <Award size={13} className="text-blue-600 shrink-0" />
                    আঞ্চলিক কার্যালয়, সেক্টর: ০৬
                  </span>
                </div>
              </div>

              {/* খুলনা Tag (Placed right below Regional Office tag) */}
              <div className="mt-1 sm:mt-2 flex items-center justify-center">
                <span className="landing-sector-text text-sm min-[380px]:text-base font-black px-6 min-[380px]:px-7 sm:px-7 py-1 sm:py-1.5 rounded-xl border border-blue-200 transition-all shadow-md animate-pulse-green">
                  খুলনা
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: App Description & Interactive Portal Actions - Seamlessly integrated on the parent background */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col justify-between p-0.5 sm:p-3 md:p-5 lg:p-6 space-y-3 min-[380px]:space-y-4 sm:space-y-4 md:space-y-6 w-full flex-1">
            
            {/* System Overview / Platform Description */}
            <div className="w-full space-y-1.5 min-[380px]:space-y-2 sm:space-y-2">
              <div className="landing-tag-intro inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs font-black uppercase tracking-wider">
                💡 সিস্টেম পরিচিতি ও বিবরণ
              </div>
              <p className="landing-desc-text text-[13.5px] min-[380px]:text-[14.5px] sm:text-base md:text-[17px] leading-relaxed sm:leading-relaxed md:leading-loose font-extrabold text-slate-800 text-justify">
                বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, সেক্টর: ০৬, খুলনার আওতাধীন শিল্প, ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি/ অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
              </p>
            </div>

            {/* LAUNCH ACTIONS (Enclosed inside Right Card) */}
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2.5 min-[380px]:gap-3 sm:gap-5 transition-colors pt-2 min-[380px]:pt-3 sm:pt-4">
              
              {/* Centered label with premium yellow megaphone on the left, with green text appearing to emerge from its mouth */}
              <div className="flex flex-col items-center sm:items-stretch justify-center gap-1 sm:gap-2.5 text-center sm:text-left relative w-full sm:w-[48%] md:w-[45%] max-w-full sm:max-w-[300px]">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="landing-label-muted text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs uppercase font-black tracking-wider block text-center sm:text-left animate-colorful-slide">
                    চলমান রিপোর্টিং সাইকেল
                  </span>
                </div>
                <div className="flex items-stretch h-10 min-[380px]:h-11 sm:h-11 md:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] select-none rounded-[4px] overflow-hidden">
                  {/* Left Icon Area: Off-white bg & gray bottom border */}
                  <div className="flex flex-col w-9 sm:w-10 md:w-12 shrink-0 h-full">
                    <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                      <Calendar className="text-emerald-700 w-4.5 h-4.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 stroke-[2.5]" />
                    </div>
                    <div className="h-[3px] sm:h-[4px] bg-[#94a3b8]" />
                  </div>
                  
                  {/* Right Text Area: Solid Emerald Green with dark green bottom bar */}
                  <div className="flex-1 flex flex-col h-full min-w-0">
                    <div className="flex-1 bg-[#059669] flex items-center justify-center px-2 sm:px-2.5 md:px-3 overflow-hidden">
                      <span className="text-white font-[950] text-[10.5px] min-[360px]:text-[11.5px] sm:text-xs md:text-[13px] tracking-tight text-center whitespace-nowrap leading-tight">
                        {cycleLabel || "চলমান কোয়ার্টার"}
                      </span>
                    </div>
                    <div className="h-[3px] sm:h-[4px] bg-[#047857]" />
                  </div>
                </div>
              </div>

              {/* Launch Action Button */}
              <div className="w-full sm:w-[48%] md:w-[45%] max-w-full sm:max-w-[300px] flex justify-center sm:justify-end">
                {(isAdmin || moduleVisibility.entry) && (
                  <button 
                    id="btn-start-work"
                    onClick={() => setActiveTab('entry')}
                    className="group flex items-stretch h-10 min-[380px]:h-11 sm:h-11 md:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] active:translate-y-[1px] transition-transform duration-100 select-none cursor-pointer text-left font-inherit outline-none border-none p-0 rounded-[4px] overflow-hidden"
                  >
                    {/* Left Icon Area: Off-white bg & gray bottom border */}
                    <div className="flex flex-col w-9 sm:w-10 md:w-12 shrink-0 h-full">
                      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                        <ArrowRight className="text-red-800 w-4.5 h-4.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="h-[3px] sm:h-[4px] bg-[#94a3b8]" />
                    </div>
                    
                    {/* Right Text Area: Solid Maroon with dark maroon bottom bar */}
                    <div className="flex-1 flex flex-col h-full min-w-0">
                      <div className="flex-1 bg-[#991b1b] group-hover:bg-[#851616] transition-colors flex items-center justify-center px-2 sm:px-2.5 md:px-3">
                        <span className="text-white font-[950] text-[11px] min-[360px]:text-[12px] sm:text-xs md:text-[13px] tracking-wide text-center uppercase whitespace-nowrap leading-tight">
                          কাজ শুরু করুন
                        </span>
                      </div>
                      <div className="h-[3px] sm:h-[4px] bg-[#450a0a]" />
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
