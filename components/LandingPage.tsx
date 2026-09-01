import React, { useState } from 'react';
import { 
  ArrowRight, ShieldCheck, ShieldAlert, Landmark, Award, Lock, MapPin, FileCheck, User, Phone, Megaphone, Calendar,
  Home, Mail, FileCheck2, Inbox, ClipboardCheck, X, Plus, Sparkles
} from 'lucide-react';
import { SettlementEntry, ModuleVisibility } from '../types.ts';
import { toBengaliDigits } from '../utils/numberUtils.ts';

interface LandingPageProps {
  entries: SettlementEntry[];
  setActiveTab: (tab: string, subModule?: any, reportType?: any) => void;
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
  // Mobile fan menu state: initially closed (false) so it shows '+' and floating bob animation
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="animate-landing-premium relative w-full max-w-[1880px] xl:max-w-[1880px] mx-auto flex flex-col justify-between sm:justify-center h-full sm:h-auto py-0 sm:py-2 md:py-4">
      {/* Floating Bob Animation for Mobile Hub Button */}
      <style>{`
        @keyframes floatBobAnim {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.05);
          }
        }
        .animate-hub-float {
          animation: floatBobAnim 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Prime Master Institutional Showcase Card */}
      <div 
        id="hero-section" 
        className="landing-hero-card relative overflow-hidden rounded-none sm:rounded-[2rem] p-3 min-[380px]:p-3.5 sm:p-5 md:p-6 lg:p-7 transition-all duration-500 animate-fade-in w-full h-full sm:h-auto shadow-lg flex flex-col justify-between sm:justify-center border-x-0 border-t-0 sm:border"
      >
        {/* Subtle patterned backdrop */}
        <div className="landing-grid-bg absolute inset-0 pointer-events-none" />
        
        {/* Top Split Identity Area - using stretch to match left and right column heights */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-2 min-[380px]:gap-2.5 sm:gap-6 lg:gap-8 items-stretch flex-1 flex flex-col md:grid justify-between">
          
          {/* LEFT PANEL: Branding & Executive Seals */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col items-center text-center md:border-r md:border-slate-200/70 md:pr-6 lg:pr-8 pt-0.5 sm:pt-1 pb-1 sm:pb-3 md:pb-6 lg:pb-7">
            {/* Master Seal Shield - Government Themed */}
            <div className="flex flex-col items-center space-y-1.5 sm:space-y-3 w-full">
              <div 
                className="landing-shield-bg relative flex items-center justify-center w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 text-white rounded-2xl sm:rounded-[2rem] shadow-xl border-2 sm:border-3 border-amber-400 transform hover:scale-[1.03] transition-all duration-300 select-none shrink-0"
              >
                <div className="absolute inset-0 bg-slate-900/10 rounded-2xl sm:rounded-[2rem]"></div>
                <Landmark className="stroke-[2.5] text-white relative z-10 w-6 h-6 min-[380px]:w-7 min-[380px]:h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 min-[380px]:w-6 min-[380px]:h-6 sm:w-7 sm:h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] sm:text-[12px] text-white shadow-md font-black">
                  ✓
                </div>
              </div>

              {/* Structured Institutional Identity Card */}
              <div className="space-y-1 sm:space-y-2 w-full">
                <span className="landing-gov-tag inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md text-[9.5px] min-[380px]:text-[10.5px] sm:text-xs font-black uppercase tracking-wider">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                </span>
                
                <h3 className="landing-hero-title text-lg min-[380px]:text-xl sm:text-2xl md:text-2xl lg:text-[23px] font-black tracking-tight leading-tight">
                  বাণিজ্যিক অডিট অধিদপ্তর
                </h3>
                
                <div className="flex flex-col items-center w-full space-y-1 sm:space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200/40 text-[9.5px] min-[380px]:text-[10.5px] sm:text-xs font-bold shadow-2xs">
                    <Award size={12} className="text-blue-600 shrink-0" />
                    আঞ্চলিক কার্যালয়, সেক্টর: ০৬
                  </span>
                </div>

                {/* খুলনা Tag (Placed right below Regional Office tag) */}
                <div className="mt-0.5 sm:mt-2 flex items-center justify-center">
                  <span className="landing-sector-text text-xs min-[380px]:text-sm sm:text-base font-black px-5 min-[380px]:px-6 sm:px-7 py-0.5 sm:py-1.5 rounded-xl border border-blue-200 transition-all shadow-md animate-pulse-green">
                    খুলনা
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: App Description & Interactive Portal Actions - Seamlessly integrated on the parent background */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col justify-between p-0.5 sm:p-3 md:p-5 lg:p-6 space-y-2 min-[380px]:space-y-2.5 sm:space-y-4 md:space-y-6 w-full flex-1">
            
            {/* System Overview / Platform Description */}
            {/* Desktop View: Full detailed description (100% Intact) */}
            <div className="hidden md:block w-full space-y-2">
              <div className="landing-tag-intro inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                💡 সিস্টেম পরিচিতি ও বিবরণ
              </div>
              <p className="landing-desc-text text-base md:text-[17px] leading-relaxed md:leading-loose font-extrabold text-slate-800 text-justify">
                বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, সেক্টর: ০৬, খুলনার আওতাধীন শিল্প, ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি/ অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
              </p>
            </div>

            {/* MOBILE ONLY: Beautiful Brief Description Card (Visible when menu is closed, hides when open) */}
            {!isMenuOpen && (
              <div className="block md:hidden w-full max-w-sm mx-auto transition-all duration-300 animate-in fade-in zoom-in-95">
                <div className="bg-gradient-to-br from-emerald-50/95 via-blue-50/80 to-teal-50/90 border border-emerald-200/90 rounded-2xl p-2.5 min-[380px]:p-3 shadow-2xs space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6.5 h-6.5 min-[380px]:w-7 min-[380px]:h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Sparkles size={13} className="text-amber-300 fill-amber-300" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-[11.5px] min-[380px]:text-[12px] font-black text-slate-800 tracking-tight leading-tight">
                        💡 সিস্টেম পরিচিতি ও বিবরণ
                      </h4>
                      <p className="text-[9.5px] font-extrabold text-emerald-800">
                        আঞ্চলিক কার্যালয়, সেক্টর: ০৬, খুলনা
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] min-[380px]:text-[11.5px] leading-snug font-bold text-slate-700 text-center px-1">
                    শিল্প, ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি নিষ্পত্তির তথ্য সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও সহজ ট্র্যাকিং প্লাটফর্ম।
                  </p>

                  {/* Guidance callout for the button below */}
                  <div className="pt-1 border-t border-emerald-200/70 flex items-center justify-center text-center bg-emerald-100/70 py-1 px-2 rounded-xl">
                    <span className="text-[10px] min-[380px]:text-[10.5px] font-black text-emerald-900 animate-pulse flex items-center gap-1">
                      👇 প্রয়োজনীয় অপশনসমূহ পেতে নিচের বাটনে স্পর্শ করুন
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE ONLY: Circular Radial Fan Menu */}
            <div className="block md:hidden w-full my-1.5 select-none">
              <div className="w-full flex flex-col items-center justify-center">
                
                {/* Active Tooltip Label */}
                <div className="h-5 flex items-center justify-center mb-0.5">
                  {isMenuOpen && activeTooltip && (
                    <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-md animate-in fade-in zoom-in-95 text-center">
                      {activeTooltip}
                    </span>
                  )}
                </div>

                {/* Arc Stage Container */}
                <div className={`relative w-[280px] min-[380px]:w-[300px] mx-auto transition-all duration-300 flex items-center justify-center ${
                  isMenuOpen ? 'h-[110px] min-[380px]:h-[120px]' : 'h-[54px]'
                }`}>

                  {/* 1. Home Button (Bottom-Left) */}
                  <button
                    id="mobile-fan-home"
                    onClick={() => setActiveTab('landing')}
                    onTouchStart={() => setActiveTooltip('🏠 হোম / ল্যান্ডিং')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('🏠 হোম / ল্যান্ডিং')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`absolute left-[14px] min-[380px]:left-[18px] bottom-[2px] w-10 h-10 min-[380px]:w-10.5 min-[380px]:h-10.5 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 border border-white/40 flex items-center justify-center active:scale-95 transition-all duration-300 ${
                      isMenuOpen ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                    title="হোম"
                  >
                    <Home className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>

                  {/* 2. চিঠিপত্র এন্ট্রি (Upper-Left) */}
                  <button
                    id="mobile-fan-corr-entry"
                    onClick={() => setActiveTab('entry', 'correspondence')}
                    onTouchStart={() => setActiveTooltip('✉️ চিঠিপত্র এন্ট্রি')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('✉️ চিঠিপত্র এন্ট্রি')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`absolute left-[54px] min-[380px]:left-[60px] top-[10px] min-[380px]:top-[6px] w-10 h-10 min-[380px]:w-10.5 min-[380px]:h-10.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 border border-white/40 flex items-center justify-center active:scale-95 transition-all duration-300 ${
                      isMenuOpen ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                    title="চিঠিপত্র এন্ট্রি"
                  >
                    <Mail className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>

                  {/* 3. মীমাংসা এন্ট্রি (Top-Center) */}
                  <button
                    id="mobile-fan-settle-entry"
                    onClick={() => setActiveTab('entry', 'settlement')}
                    onTouchStart={() => setActiveTooltip('📝 মীমাংসা এন্ট্রি')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('📝 মীমাংসা এন্ট্রি')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`absolute left-1/2 -translate-x-1/2 top-0 w-11 h-11 min-[380px]:w-11.5 min-[380px]:h-11.5 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/35 border-2 border-white/50 flex items-center justify-center active:scale-95 transition-all duration-300 z-10 ${
                      isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                    title="মীমাংসা এন্ট্রি"
                  >
                    <FileCheck2 className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* 4. চিঠিপত্র রেজিস্টার (Upper-Right) */}
                  <button
                    id="mobile-fan-corr-register"
                    onClick={() => setActiveTab('register', 'correspondence')}
                    onTouchStart={() => setActiveTooltip('📬 চিঠিপত্র রেজিস্টার')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('📬 চিঠিপত্র রেজিস্টার')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`absolute right-[54px] min-[380px]:right-[60px] top-[10px] min-[380px]:top-[6px] w-10 h-10 min-[380px]:w-10.5 min-[380px]:h-10.5 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-lg shadow-cyan-500/30 border border-white/40 flex items-center justify-center active:scale-95 transition-all duration-300 ${
                      isMenuOpen ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                    title="চিঠিপত্র রেজিস্টার"
                  >
                    <Inbox className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>

                  {/* 5. মীমাংসা রেজিস্টার (Bottom-Right) */}
                  <button
                    id="mobile-fan-settle-register"
                    onClick={() => setActiveTab('register', 'settlement')}
                    onTouchStart={() => setActiveTooltip('📋 মীমাংসা রেজিস্টার')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('📋 মীমাংসা রেজিস্টার')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`absolute right-[14px] min-[380px]:right-[18px] bottom-[2px] w-10 h-10 min-[380px]:w-10.5 min-[380px]:h-10.5 rounded-full bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700 text-white shadow-lg shadow-teal-500/30 border border-white/40 flex items-center justify-center active:scale-95 transition-all duration-300 ${
                      isMenuOpen ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-50 pointer-events-none'
                    }`}
                    title="মীমাংসা রেজিস্টার"
                  >
                    <ClipboardCheck className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>

                  {/* Center Hub Trigger Button: 100% Green, Floating/Bobbing animation when closed */}
                  <div className={`absolute left-1/2 -translate-x-1/2 bottom-[0px] z-20 ${!isMenuOpen ? 'animate-hub-float' : ''}`}>
                    <button
                      id="mobile-fan-hub"
                      onClick={() => {
                        setIsMenuOpen(!isMenuOpen);
                        setActiveTooltip(null);
                      }}
                      className={`w-12 h-12 min-[380px]:w-13 min-[380px]:h-13 rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white border-2 border-white flex items-center justify-center active:scale-95 transition-transform duration-200 cursor-pointer ${
                        !isMenuOpen ? 'shadow-xl shadow-emerald-600/40' : 'shadow-2xl shadow-emerald-700/50'
                      }`}
                      title={isMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
                    >
                      {isMenuOpen ? (
                        <X className="w-6 h-6 stroke-[3] transition-transform duration-300 rotate-0 hover:rotate-90" />
                      ) : (
                        <Plus className="w-6 h-6 stroke-[3] transition-transform duration-300 rotate-0 hover:rotate-90" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LAUNCH ACTIONS (Enclosed inside Right Card) */}
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2 min-[380px]:gap-2.5 sm:gap-5 transition-colors pt-1 min-[380px]:pt-1.5 sm:pt-4">
              
              {/* Centered label with premium yellow megaphone on the left, with green text appearing to emerge from its mouth */}
              <div className="flex flex-col items-center sm:items-stretch justify-center gap-1 sm:gap-2.5 text-center sm:text-left relative w-full sm:w-[48%] md:w-[45%] max-w-full sm:max-w-[300px]">
                <div className="hidden sm:flex items-center gap-2 justify-center sm:justify-start">
                  <span className="landing-label-muted text-[10px] min-[380px]:text-[11px] sm:text-xs uppercase font-black tracking-wider block text-center sm:text-left animate-colorful-slide">
                    চলমান রিপোর্টিং সাইকেল
                  </span>
                </div>
                <div className="flex items-stretch h-9.5 min-[380px]:h-10.5 sm:h-11 md:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] select-none rounded-[4px] overflow-hidden">
                  {/* Left Icon Area: Off-white bg & gray bottom border */}
                  <div className="flex flex-col w-8.5 min-[380px]:w-9 sm:w-10 md:w-12 shrink-0 h-full">
                    <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                      <Calendar className="text-emerald-700 w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 stroke-[2.5]" />
                    </div>
                    <div className="h-[3px] sm:h-[4px] bg-[#94a3b8]" />
                  </div>
                  
                  {/* Right Text Area: Solid Emerald Green with dark green bottom bar */}
                  <div className="flex-1 flex flex-col h-full min-w-0">
                    <div className="flex-1 bg-[#059669] flex items-center justify-center px-2 sm:px-2.5 md:px-3 overflow-hidden">
                      <span className="text-white font-[950] text-[10px] min-[360px]:text-[11px] sm:text-xs md:text-[13px] tracking-tight text-center whitespace-nowrap leading-tight">
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
                    className="group flex items-stretch h-9.5 min-[380px]:h-10.5 sm:h-11 md:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] active:translate-y-[1px] transition-transform duration-100 select-none cursor-pointer text-left font-inherit outline-none border-none p-0 rounded-[4px] overflow-hidden"
                  >
                    {/* Left Icon Area: Off-white bg & gray bottom border */}
                    <div className="flex flex-col w-8.5 min-[380px]:w-9 sm:w-10 md:w-12 shrink-0 h-full">
                      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                        <ArrowRight className="text-red-800 w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="h-[3px] sm:h-[4px] bg-[#94a3b8]" />
                    </div>
                    
                    {/* Right Text Area: Solid Maroon with dark maroon bottom bar */}
                    <div className="flex-1 flex flex-col h-full min-w-0">
                      <div className="flex-1 bg-[#991b1b] group-hover:bg-[#851616] transition-colors flex items-center justify-center px-2 sm:px-2.5 md:px-3">
                        <span className="text-white font-[950] text-[10.5px] min-[360px]:text-[11.5px] sm:text-xs md:text-[13px] tracking-wide text-center uppercase whitespace-nowrap leading-tight">
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

