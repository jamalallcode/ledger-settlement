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
    <div className="animate-landing-premium relative w-full h-full max-w-5xl lg:max-w-6xl mx-auto flex flex-col justify-center">
      {/* MODERATION ALERT FOR ADMIN */}
      {isAdmin && pendingCount > 0 && (
        <div 
          id="admin-moderation-alert" 
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 border border-amber-200 shadow-xs transition-all duration-300 w-full mb-4 shrink-0"
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
                বাণিজ্যিক অডিট অধিদপ্তরের খুলনা আঞ্চলিক কার্যালয়ের আওতাধীন ব্যাংক ও আর্থিক প্রতিষ্ঠানসমূহের অডিট আপত্তি বা অনুচ্ছেদের নিয়মতান্ত্রিক নিষ্পত্তি রেকর্ড সংরক্ষণ, স্বয়ংক্রিয় রিপোর্টিং ও ড্যাশবোর্ড ট্র্যাকিং প্লাটফর্ম।
              </p>
            </div>

            {/* LAUNCH ACTIONS (Enclosed inside Right Card) */}
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 transition-colors pt-2">
              
              {/* Centered label with premium yellow megaphone on the left, with green text appearing to emerge from its mouth */}
              <div className="flex flex-col items-center sm:items-stretch justify-center gap-2.5 text-center sm:text-left relative w-full sm:w-[43%] max-w-[280px]">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  {/* Premium Megaphone Icon matching user uploaded image */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 32 32" 
                      className="w-7 h-7 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)] hover:scale-105 transition-transform duration-200"
                    >
                      <defs>
                        {/* Yellow/Amber body gradient */}
                        <linearGradient id="body-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fef08a" /> {/* yellow-200 */}
                          <stop offset="50%" stopColor="#f59e0b" /> {/* amber-500 */}
                          <stop offset="100%" stopColor="#d97706" /> {/* amber-600 */}
                        </linearGradient>
                        {/* Red-maroon cone gradient */}
                        <linearGradient id="cone-white" x1="0%" y1="0%" x2="100%" y2="50%">
                          <stop offset="0%" stopColor="#7f1d1d" /> {/* red-900 / deep burgundy maroon */}
                          <stop offset="40%" stopColor="#ef4444" /> {/* red-500 / bright highlight */}
                          <stop offset="100%" stopColor="#991b1b" /> {/* red-800 / red-maroon */}
                        </linearGradient>
                        {/* Dark rubber rim gradient */}
                        <linearGradient id="rim-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        {/* Handle grey gradient */}
                        <linearGradient id="handle-grey" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#cbd5e1" />
                          <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                      </defs>

                      {/* Main rotated group to point mouth UPPER RIGHT (so it tilts up nicely towards the text) */}
                      <g transform="rotate(-15 16 16)">
                        
                        {/* 1. Handle (dark grey / plastic) */}
                        <path 
                          d="M 12 18 
                             L 10 26 
                             C 9.8 26.8, 10.3 27.5, 11 27.5 
                             L 13 27 
                             C 13.6 26.8, 14 26.2, 13.8 25.5 
                             L 13.5 19 
                             Z" 
                          fill="url(#handle-grey)" 
                          stroke="#475569" 
                          strokeWidth="0.75" 
                          strokeLinejoin="round" 
                        />
                        
                        {/* Small black trigger button */}
                        <path 
                          d="M 10.5 19.5 L 11.5 21" 
                          stroke="#1e293b" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                        />

                        {/* 2. Yellow back cylinder body */}
                        {/* Dome back cap */}
                        <path 
                          d="M 5 11 
                             C 3 11, 3 19, 5 19 
                             Z" 
                          fill="#b45309" 
                        />
                        {/* Main Yellow Cylinder */}
                        <path 
                          d="M 5 11 
                             L 12 11 
                             L 12 19 
                             L 5 19 
                             C 3.8 19, 3.8 11, 5 11 Z" 
                          fill="url(#body-yellow)" 
                          stroke="#d97706" 
                          strokeWidth="0.5" 
                        />
                        
                        {/* Yellow body horizontal ridges */}
                        <line x1="6" y1="13" x2="10" y2="13" stroke="#b45309" strokeWidth="0.75" />
                        <line x1="6" y1="15" x2="10" y2="15" stroke="#b45309" strokeWidth="0.75" />
                        <line x1="6" y1="17" x2="10" y2="17" stroke="#b45309" strokeWidth="0.75" />

                        {/* Strap loop hanger plate at top */}
                        <path 
                          d="M 6.5 11 Q 7.5 9 8.5 11" 
                          fill="none" 
                          stroke="#cbd5e1" 
                          strokeWidth="0.75" 
                        />

                        {/* 3. White Funnel (expanding towards the right) */}
                        <path 
                          d="M 12 11 
                             C 15.5 11, 18.5 8, 25 5 
                             L 25 25 
                             C 18.5 22, 15.5 19, 12 19 
                             Z" 
                          fill="url(#cone-white)" 
                          stroke="#7f1d1d" 
                          strokeWidth="0.5" 
                        />

                        {/* Inner shadow/reflection guide line */}
                        <path 
                          d="M 12 14 Q 17.5 14.5 25 10" 
                          fill="none" 
                          stroke="#ffffff" 
                          strokeWidth="1.2" 
                          opacity="0.8" 
                        />

                        {/* 4. Inside of the mouth flare */}
                        <ellipse 
                          cx="25" 
                          cy="15" 
                          rx="1" 
                          ry="10" 
                          fill="#fee2e2" 
                        />

                        {/* Center speaker driver dome */}
                        <ellipse 
                          cx="24.8" 
                          cy="15" 
                          rx="0.5" 
                          ry="2" 
                          fill="#94a3b8" 
                        />

                        {/* 5. Thick Grey Rubber Rim */}
                        <ellipse 
                          cx="25" 
                          cy="15" 
                          rx="1.2" 
                          ry="10.2" 
                          fill="none" 
                          stroke="url(#rim-dark)" 
                          strokeWidth="1.5" 
                        />

                      </g>
                    </svg>
                    {/* Visual pulse at the megaphone mouthpiece facing the text */}
                    <span className="absolute right-[1px] top-[3px] w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-85"></span>
                  </div>
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
