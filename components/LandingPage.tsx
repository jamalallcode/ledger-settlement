import React, { useState } from 'react';
import { 
  ArrowRight, ShieldCheck, ShieldAlert, Landmark, Award, Lock, MapPin, FileCheck, User, Phone, Megaphone, Calendar,
  Home, Mail, FileCheck2, Inbox, ClipboardCheck, X, Plus, Sparkles, PieChart, Library, LayoutDashboard,
  Scale, FileText, Link2, ChevronRight, BarChart3, Users, Clock, CheckCircle2, FileSpreadsheet
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
  // Mobile circular radial fan menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="animate-landing-premium relative w-full max-w-[1880px] xl:max-w-[1880px] mx-auto flex flex-col justify-start h-auto pt-1 sm:pt-2 md:pt-2 pb-2 sm:pb-3">
      {/* Prime Master Institutional Showcase Card */}
      <div 
        id="hero-section" 
        className="landing-hero-card relative rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] p-4 sm:p-6 md:p-7 lg:p-8 transition-all duration-500 animate-fade-in w-full h-auto flex flex-col justify-start sm:justify-center border"
      >
        {/* Subtle patterned backdrop */}
        <div className="landing-grid-bg absolute inset-0 pointer-events-none rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem]" />
        
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
          <div className="md:col-span-8 lg:col-span-8 flex flex-col justify-between p-0.5 sm:p-3 md:p-5 lg:p-6 w-full flex-1">
            
            {/* System Overview / Platform Description */}
            <div className="w-full relative flex items-center md:items-start justify-center md:justify-start">
              {/* Short text description for Mobile */}
              <div 
                className={`w-full max-w-lg mx-auto md:hidden transition-all duration-400 ease-out ${
                  isMenuOpen 
                    ? 'opacity-0 -translate-y-2 pointer-events-none' 
                    : 'opacity-100 translate-y-0'
                }`}
              >
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/95 via-slate-50/90 to-blue-50/40 border border-blue-200/60 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] px-3.5 py-2 sm:px-5 sm:py-2.5 flex flex-col items-center justify-center text-center">
                  <div className="landing-tag-intro inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                    <span>💡</span>
                    <span>সিস্টেম পরিচিতি</span>
                  </div>
                  {/* মোবাইল ভিউয়ের জন্য সংক্ষিপ্ত লেখা (অক্ষুণ্ণ রাখা হয়েছে) */}
                  <p className="landing-desc-text text-[12px] min-[380px]:text-[12.5px] sm:text-[13.5px] leading-relaxed font-bold text-slate-700 text-center mt-1 sm:mt-1.5">
                    অডিট আপত্তি ও অনুচ্ছেদ নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ট্র্যাকিং।
                  </p>
                </div>
              </div>

              {/* Desktop / Laptop: Clean left-aligned layout matching exact user design */}
              <div className="hidden md:flex flex-col items-start text-left w-full max-w-2xl lg:max-w-3xl pt-1">
                <div className="landing-tag-intro inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                  <span>💡</span>
                  <span>সিস্টেম পরিচিতি ও বিবরণ</span>
                </div>
                {/* ল্যাপটপ ও ডেস্কটপ ভিউয়ের জন্য স্ক্রিনশটের হুবহু প্রাতিষ্ঠানিক লেখা */}
                <p className="text-slate-800 font-extrabold text-[15px] lg:text-[16px] xl:text-[16.5px] leading-relaxed tracking-normal text-left mt-3">
                  বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, সেক্টর: ০৬, খুলনার আওতাধীন শিল্প, ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি/ অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
                </p>
              </div>
            </div>

            {/* MOBILE ONLY: Circular Radial Fan Menu with Central '+' Button (Fixed container height so bottom never shifts) */}
            <div className="block md:hidden w-full select-none my-1">
              <div className="w-full flex flex-col items-center justify-center">
                
                {/* Active Tooltip Label with smooth fade */}
                <div className="h-4 flex items-center justify-center mb-0.5">
                  <span className={`bg-slate-900 text-white text-[10.5px] font-bold px-3 py-0.5 rounded-full shadow-md transition-all duration-200 text-center ${
                    isMenuOpen && activeTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                  }`}>
                    {activeTooltip || ''}
                  </span>
                </div>

                {/* Arc Stage Container: Constant fixed height container, so launch buttons below NEVER move */}
                <div className="relative w-[280px] min-[380px]:w-[300px] h-[110px] mx-auto flex items-end justify-center">

                  {/* 1. Home Button (Bottom-Left) - expands upwards/outwards from center bottom */}
                  <button
                    id="mobile-fan-home"
                    onClick={() => setActiveTab('landing')}
                    onTouchStart={() => setActiveTooltip('🏠 হোম')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('🏠 হোম')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{
                      transform: isMenuOpen 
                        ? 'translate(0px, 0px) scale(1)' 
                        : 'translate(95px, 0px) scale(0.2)',
                    }}
                    className={`absolute left-[14px] min-[380px]:left-[18px] bottom-[10px] w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white shadow-xl shadow-indigo-500/35 border-2 border-white/80 flex items-center justify-center active:scale-95 transition-all duration-400 ease-out ${
                      isMenuOpen ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    title="হোম"
                  >
                    <Home className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* 2. চিঠিপত্র এন্ট্রি (Upper-Left) - expands upwards/outwards from center bottom */}
                  <button
                    id="mobile-fan-corr-entry"
                    onClick={() => setActiveTab('entry', 'correspondence')}
                    onTouchStart={() => setActiveTooltip('✉️ চিঠিপত্র এন্ট্রি')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('✉️ চিঠিপত্র এন্ট্রি')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{
                      transform: isMenuOpen 
                        ? 'translate(0px, 0px) scale(1)' 
                        : 'translate(65px, 50px) scale(0.2)',
                    }}
                    className={`absolute left-[48px] min-[380px]:left-[54px] top-[14px] min-[380px]:top-[10px] w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/35 border-2 border-white/80 flex items-center justify-center active:scale-95 transition-all duration-400 ease-out ${
                      isMenuOpen ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    title="চিঠিপত্র এন্ট্রি"
                  >
                    <Mail className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* 3. মীমাংসা এন্ট্রি (Top-Center) - shoots straight up from center bottom */}
                  <button
                    id="mobile-fan-settle-entry"
                    onClick={() => setActiveTab('entry', 'settlement')}
                    onTouchStart={() => setActiveTooltip('📝 মীমাংসা এন্ট্রি')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('📝 মীমাংসা এন্ট্রি')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{
                      transform: isMenuOpen 
                        ? 'translate(-50%, 0px) scale(1)' 
                        : 'translate(-50%, 55px) scale(0.2)',
                    }}
                    className={`absolute left-1/2 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-2xl shadow-emerald-500/40 border-2 border-white/90 flex items-center justify-center active:scale-95 transition-all duration-400 ease-out z-10 ${
                      isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    title="মীমাংসা এন্ট্রি"
                  >
                    <FileCheck2 className="w-6 h-6 stroke-[2.5]" />
                  </button>

                  {/* 4. চিঠিপত্র রেজিস্টার (Upper-Right) - expands upwards/outwards from center bottom */}
                  <button
                    id="mobile-fan-corr-register"
                    onClick={() => setActiveTab('register', 'correspondence')}
                    onTouchStart={() => setActiveTooltip('📬 চিঠিপত্র রেজিস্টার')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('📬 চিঠিপত্র রেজিস্টার')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{
                      transform: isMenuOpen 
                        ? 'translate(0px, 0px) scale(1)' 
                        : 'translate(-65px, 50px) scale(0.2)',
                    }}
                    className={`absolute right-[48px] min-[380px]:right-[54px] top-[14px] min-[380px]:top-[10px] w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-xl shadow-cyan-500/35 border-2 border-white/80 flex items-center justify-center active:scale-95 transition-all duration-400 ease-out ${
                      isMenuOpen ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    title="চিঠিপত্র রেজিস্টার"
                  >
                    <Inbox className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* 5. মীমাংসা রেজিস্টার (Bottom-Right) - expands upwards/outwards from center bottom */}
                  <button
                    id="mobile-fan-settle-register"
                    onClick={() => setActiveTab('register', 'settlement')}
                    onTouchStart={() => setActiveTooltip('📋 মীমাংসা রেজিস্টার')}
                    onTouchEnd={() => setActiveTooltip(null)}
                    onMouseEnter={() => setActiveTooltip('📋 মীমাংসা রেজিস্টার')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    style={{
                      transform: isMenuOpen 
                        ? 'translate(0px, 0px) scale(1)' 
                        : 'translate(-95px, 0px) scale(0.2)',
                    }}
                    className={`absolute right-[14px] min-[380px]:right-[18px] bottom-[10px] w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700 text-white shadow-xl shadow-teal-500/35 border-2 border-white/80 flex items-center justify-center active:scale-95 transition-all duration-400 ease-out ${
                      isMenuOpen ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    title="মীমাংসা রেজিস্টার"
                  >
                    <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* Center Hub Trigger Button */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[2px] z-20">
                    <button
                      id="mobile-fan-hub"
                      onClick={() => {
                        setIsMenuOpen(!isMenuOpen);
                        setActiveTooltip(null);
                      }}
                      className={`w-13 h-13 min-[380px]:w-14 min-[380px]:h-14 rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white border-2 border-white flex items-center justify-center active:scale-95 transition-all duration-300 cursor-pointer ${
                        !isMenuOpen ? 'shadow-xl shadow-emerald-600/40 hover:scale-105' : 'shadow-2xl shadow-emerald-700/50'
                      }`}
                      title={isMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
                    >
                      <span className={`transition-transform duration-400 ease-out flex items-center justify-center ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`}>
                        {isMenuOpen ? (
                          <X className="w-6 h-6 stroke-[3]" />
                        ) : (
                          <Plus className="w-6 h-6 stroke-[3]" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LAUNCH ACTIONS (Enclosed inside Right Card) */}
            <div className="w-full flex flex-col lg:flex-row items-center lg:items-end justify-between gap-3 min-[380px]:gap-3 sm:gap-4 lg:gap-5 transition-colors pt-2 min-[380px]:pt-2.5 sm:pt-4">
              
              {/* Date Box */}
              <div className="flex flex-col items-center lg:items-stretch justify-center gap-1.5 sm:gap-2 text-center lg:text-left relative w-full lg:w-[54%] max-w-full lg:max-w-[340px]">
                <div className="hidden lg:flex items-center gap-2 justify-start">
                  <span className="landing-label-muted text-[11px] sm:text-xs uppercase font-black tracking-wider block text-left animate-colorful-slide">
                    চলমান রিপোর্টিং সাইকেল
                  </span>
                </div>
                <div className="flex items-stretch h-10 min-[380px]:h-10.5 sm:h-11 md:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] select-none rounded-[4px] overflow-hidden">
                  {/* Left Icon Area: Off-white bg & gray bottom border */}
                  <div className="flex flex-col w-9 min-[380px]:w-9.5 sm:w-10 md:w-11 shrink-0 h-full">
                    <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                      <Calendar className="text-emerald-700 w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <div className="h-[3px] sm:h-[4px] bg-[#94a3b8]" />
                  </div>
                  
                  {/* Right Text Area: Solid Emerald Green with dark green bottom bar */}
                  <div className="flex-1 flex flex-col h-full min-w-0">
                    <div className="flex-1 bg-[#059669] flex items-center justify-center px-2 sm:px-3">
                      <span className="text-white font-[950] text-[11px] min-[360px]:text-[12px] sm:text-[12.5px] md:text-[13px] tracking-tight text-center whitespace-nowrap leading-tight">
                        {cycleLabel || "চলমান কোয়ার্টার"}
                      </span>
                    </div>
                    <div className="h-[3px] sm:h-[4px] bg-[#047857]" />
                  </div>
                </div>
              </div>

              {/* Launch Action Button */}
              <div className="w-full lg:w-[44%] max-w-full lg:max-w-[260px] flex justify-center lg:justify-end">
                {(isAdmin || moduleVisibility.entry) && (
                  <button 
                    id="btn-start-work"
                    onClick={() => setActiveTab('entry')}
                    className="group flex items-stretch h-10 min-[380px]:h-10.5 sm:h-11 md:h-12 w-full shadow-[0_3px_8px_rgba(0,0,0,0.08)] active:translate-y-[1px] transition-transform duration-100 select-none cursor-pointer text-left font-inherit outline-none border-none p-0 rounded-[4px] overflow-hidden"
                  >
                    {/* Left Icon Area: Off-white bg & gray bottom border */}
                    <div className="flex flex-col w-9 min-[380px]:w-9.5 sm:w-10 md:w-11 shrink-0 h-full">
                      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
                        <ArrowRight className="text-red-800 w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="h-[3px] sm:h-[4px] bg-[#94a3b8]" />
                    </div>
                    
                    {/* Right Text Area: Solid Maroon with dark maroon bottom bar */}
                    <div className="flex-1 flex flex-col h-full min-w-0">
                      <div className="flex-1 bg-[#991b1b] group-hover:bg-[#851616] transition-colors flex items-center justify-center px-2 sm:px-3">
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

      {/* Aesthetic Institutional Footer */}
      <footer 
        id="landing-aesthetic-footer" 
        className="hidden md:flex mt-3 sm:mt-4 md:mt-5 w-full rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs px-3.5 sm:px-5 md:px-6 py-2.5 sm:py-3 flex-col md:flex-row items-center justify-between gap-2.5 transition-all select-none"
      >
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 hidden sm:block" />
          <div className="text-[11px] sm:text-[12px] font-bold text-slate-700 leading-snug">
            <span>© ২০২৬ <span className="text-blue-700 font-black">বাণিজ্যিক অডিট অধিদপ্তর, খুলনা আঞ্চলিক কার্যালয় (সেক্টর: ০৬)</span> । সর্বস্বত্ব সংরক্ষিত।</span>
            <span className="hidden lg:inline text-slate-300 mx-2">|</span>
            <span className="text-slate-500 font-bold hidden lg:inline">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
          </div>
        </div>

        <div className="flex items-center flex-wrap justify-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 bg-slate-100/90 text-slate-700 rounded-lg border border-slate-200/80 text-[10.5px] sm:text-[11px] font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>নিরাপদ ডাটাবেজ সক্রিয়</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 bg-blue-50/90 text-blue-700 rounded-lg border border-blue-200/60 text-[10.5px] sm:text-[11px] font-black shadow-2xs">
            <span>সংস্করণ: ১.০.০</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

