import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, Sparkles, Lock, Unlock, CheckCircle2, Download, Upload, ShieldCheck, LogOut, X, KeyRound, Fingerprint, AlertCircle, Library, Link as LinkIcon, Plus, ChevronDown, Trash2, Globe, Mail, ClipboardList, BarChart3, Settings, ArrowRight, Chrome } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { signInWithGoogle } from '../lib/supabase';
import { ModuleVisibility } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string, subModule?: any, reportType?: string) => void;
  onToggleVisibility?: () => void;
  onDemoLoad?: () => void;
  isLockedMode: boolean;
  setIsLockedMode: (val: boolean) => void;
  isLayoutEditable?: boolean;
  onExportSystem?: () => void;
  onImportSystem?: (file: File) => void;
  isAdmin: boolean;
  setIsAdmin: (status: boolean) => void;
  onLogout?: () => void;
  pendingCount?: number;
  entryModule?: 'settlement' | 'correspondence' | null;
  registerSubModule?: 'settlement' | 'correspondence' | null;
  reportType?: string | null;
  onOpenChangePassword?: () => void;
  moduleVisibility?: ModuleVisibility;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onToggleVisibility, 
  onDemoLoad,
  isLockedMode,
  setIsLockedMode,
  isLayoutEditable = false,
  onExportSystem,
  onImportSystem,
  isAdmin,
  setIsAdmin,
  onLogout,
  onOpenChangePassword,
  pendingCount = 0,
  entryModule,
  registerSubModule,
  reportType,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState('80093424LEdg@');
  const [storedRecoveryQuestion, setStoredRecoveryQuestion] = useState('আপনার প্রিয় রং কি?');
  const [storedRecoveryAnswer, setStoredRecoveryAnswer] = useState('সাদা');
  
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  // Load admin settings from storage
  useEffect(() => {
    const savedPass = localStorage.getItem('ledger_admin_password_v1');
    const savedQuestion = localStorage.getItem('ledger_admin_recovery_q_v1');
    const savedAnswer = localStorage.getItem('ledger_admin_recovery_a_v1');
    
    if (savedPass) setStoredPassword(savedPass);
    if (savedQuestion) setStoredRecoveryQuestion(savedQuestion);
    if (savedAnswer) setStoredRecoveryAnswer(savedAnswer);
  }, []);

  const saveAdminSettings = (pass: string, q: string, a: string) => {
    localStorage.setItem('ledger_admin_password_v1', pass);
    localStorage.setItem('ledger_admin_recovery_q_v1', q);
    localStorage.setItem('ledger_admin_recovery_a_v1', a);
    setStoredPassword(pass);
    setStoredRecoveryQuestion(q);
    setStoredRecoveryAnswer(a);
  };

  // --- Sub-menu States ---
  const [isEntryExpanded, setIsEntryExpanded] = useState(false);
  const [isRegisterExpanded, setIsRegisterExpanded] = useState(false);
  const [isReturnExpanded, setIsReturnExpanded] = useState(false);
  const [isMonthlyExpanded, setIsMonthlyExpanded] = useState(false);
  const [isMonthlyCorrExpanded, setIsMonthlyCorrExpanded] = useState(false);
  const [isSettlementExpanded, setIsSettlementExpanded] = useState(false);
  const [isOnlineExpanded, setIsOnlineExpanded] = useState(false);
  const [isQuarterlyExpanded, setIsQuarterlyExpanded] = useState(false);
  
  // Auto-expand based on activeTab
  useEffect(() => {
    if (activeTab === 'entry') setIsEntryExpanded(true);
    if (activeTab === 'register') setIsRegisterExpanded(true);
    if (activeTab === 'return') setIsReturnExpanded(true);
  }, [activeTab]);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current > 2000) clickCount.current = 0;
    clickCount.current += 1;
    lastClickTime.current = now;
    if (clickCount.current === 3) {
      clickCount.current = 0;
      setShowAdminModal(true);
    }
  };

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPassword === storedPassword) {
      setIsAdmin(true);
      localStorage.setItem('ledger_admin_access_v1', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryAnswer.trim().toLowerCase() === storedRecoveryAnswer.trim().toLowerCase()) {
      setRecoveredPassword(storedPassword);
    } else {
      alert("ভুল উত্তর! আবার চেষ্টা করুন।");
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (window.confirm("আপনি কি এডমিন একাউন্ট থেকে লগআউট করতে চান?")) {
        setIsAdmin(false);
        localStorage.removeItem('ledger_admin_access_v1');
      }
    }
  };

  const menuItems = [
    { id: 'landing', label: 'হোম', icon: Home, badgeId: 'side-nav-home' },
    { id: 'entry', label: 'নতুন এন্ট্রি', icon: FilePlus2, badgeId: 'side-nav-entry', isDropdown: true },
    { id: 'register', label: 'রেজিস্টার', icon: ListFilter, badgeId: 'side-nav-register', isDropdown: true },
    { id: 'return', label: 'রিটার্ণ ও সারাংশ', icon: PieChart, badgeId: 'side-nav-return', isDropdown: true },
    { id: 'archive', label: 'ডকুমেন্ট লাইব্রেরি', icon: Library, badgeId: 'side-nav-archive' },
  ];

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div onClick={handleCopy} className="absolute top-0 left-0 -translate-y-full z-[9995] pointer-events-auto no-print">
        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-black text-[9px] bg-black text-white border border-white/30 shadow-2xl transition-all duration-300 hover:scale-150 hover:bg-blue-600 hover:z-[99999] active:scale-95 cursor-copy origin-bottom-left ${copied ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30 !scale-125' : ''}`}>
          {copied ? <><CheckCircle2 size={10} /> COPIED</> : `#${id}`}
        </span>
      </div>
    );
  };

  // Helper for active styling
  const getSubItemCls = (isActive: boolean) => 
    `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-black transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`;

  const getSubIconCls = (isActive: boolean, hoverColor: string = 'emerald') => 
    `${isActive ? 'text-white' : `text-slate-400 group-hover:text-${hoverColor}-400`} transition-transform group-hover:scale-110`;

  return (
    <>
      <div id="sidebar-container" className="w-[140px] bg-slate-900 h-full text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl overflow-hidden relative z-[5000]">
        <IDBadge id="sidebar-container" />
        <div id="sidebar-header" className="p-1.5 border-b border-slate-800 flex items-center justify-between relative">
          <IDBadge id="sidebar-header" />
          <div id="sidebar-logo" onClick={handleLogoClick} className="flex items-center gap-1 relative cursor-pointer select-none active:scale-95 transition-transform">
            <IDBadge id="sidebar-logo" />
            <div className="w-4 h-4 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
            </div>
            <span className="font-black text-white tracking-tight text-[11px]">অডিট রেজিস্টার</span>
          </div>
          <button onClick={onToggleVisibility} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white relative">
            <IDBadge id="btn-sidebar-toggle" />
            <ChevronLeft size={12} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <nav id="sidebar-nav" className="py-1 px-1.5 space-y-0.5 relative">
            <IDBadge id="sidebar-nav" />
            {menuItems.map((item) => {
              const isVisible = isAdmin || (moduleVisibility as any)[item.id] !== false;
              if (!isVisible) return null;

              return (
                <div 
                  key={item.id}
                  className="relative"
                >
                  <button 
                    id={item.badgeId} 
                    onClick={() => {
                      if (item.id === 'entry') {
                        setIsEntryExpanded(!isEntryExpanded);
                        setActiveTab('entry');
                      } else if (item.id === 'register') {
                        setIsRegisterExpanded(!isRegisterExpanded);
                        setActiveTab('register');
                      } else if (item.id === 'return') {
                        setIsReturnExpanded(!isReturnExpanded);
                        setActiveTab('return');
                      } else if (item.id === 'change_pass') {
                        if (onOpenChangePassword) onOpenChangePassword();
                      } else {
                        setActiveTab(item.id);
                      }
                    }} 
                    className={`w-full flex items-center justify-between px-1.5 py-1 rounded-lg font-bold transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
                  >
                    <IDBadge id={item.badgeId} />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{item.label}</span>
                    </div>
                    {item.isDropdown && (
                      <ChevronDown size={10} className={`transition-transform duration-300 ${
                        (item.id === 'entry' && isEntryExpanded) || 
                        (item.id === 'register' && isRegisterExpanded) || 
                        (item.id === 'return' && isReturnExpanded) ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>

                  {/* Nested Sub-menu for Entry */}
                  {item.id === 'entry' && isEntryExpanded && (
                    <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      <button 
                        onClick={() => setActiveTab('entry', 'correspondence')}
                        className={getSubItemCls(activeTab === 'entry' && entryModule === 'correspondence')}
                      >
                        <span>চিঠিপত্র এন্ট্রি</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('entry', 'settlement')}
                        className={getSubItemCls(activeTab === 'entry' && entryModule === 'settlement')}
                      >
                        <span>মীমাংসা এন্ট্রি</span>
                      </button>
                    </div>
                  )}

                  {/* Nested Sub-menu for Register */}
                  {item.id === 'register' && isRegisterExpanded && (
                    <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      <button 
                        onClick={() => setActiveTab('register', 'correspondence')}
                        className={getSubItemCls(activeTab === 'register' && registerSubModule === 'correspondence')}
                      >
                        <span>চিঠিপত্র রেজি:</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('register', 'settlement')}
                        className={getSubItemCls(activeTab === 'register' && registerSubModule === 'settlement')}
                      >
                        <span>মীমাংসিত রেজি:</span>
                      </button>
                    </div>
                  )}

                  {/* Nested Sub-menu for Return & Summary */}
                  {item.id === 'return' && isReturnExpanded && (
                    <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {/* ১. মাসিক (Toggle) */}
                      <button 
                        onClick={() => setIsMonthlyExpanded(!isMonthlyExpanded)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black transition-all ${isMonthlyExpanded ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>মাসিক</span>
                        </div>
                        <ChevronDown size={6} className={`transition-transform duration-300 ${isMonthlyExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Monthly Sub-items */}
                      {isMonthlyExpanded && (
                        <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                          {/* ১. চিঠিপত্র (Toggle) */}
                          <button 
                            onClick={() => setIsMonthlyCorrExpanded(!isMonthlyCorrExpanded)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[9px] font-black transition-all ${isMonthlyCorrExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>চিঠিপত্র</span>
                            </div>
                            <ChevronDown size={6} className={`transition-transform duration-300 ${isMonthlyCorrExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Corr Sub-items */}
                          {isMonthlyCorrExpanded && (
                            <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                              {/* ১. ঢাকা */}
                              <button 
                                onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।')}
                                className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                ঢাকা
                              </button>

                              {/* ২. নিষ্পত্তি (Toggle) */}
                              <button 
                                onClick={() => setIsSettlementExpanded(!isSettlementExpanded)}
                                className={`w-full flex items-center justify-between px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${isSettlementExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>নিষ্পত্তি</span>
                                </div>
                                <ChevronDown size={6} className={`transition-transform duration-300 ${isSettlementExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isSettlementExpanded && (
                                <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                  <button 
                                    onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর')}
                                    className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                  >
                                    বিএসআর
                                  </button>
                                  <button 
                                    onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়')}
                                    className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                  >
                                    দ্বিপক্ষীয়
                                  </button>
                                </div>
                              )}

                              {/* ৩. অনলাইন প্রাপ্তি (Toggle) */}
                              <button 
                                onClick={() => setIsOnlineExpanded(!isOnlineExpanded)}
                                className={`w-full flex items-center justify-between px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${isOnlineExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>অনলাইন প্রাপ্তি</span>
                                </div>
                                <ChevronDown size={6} className={`transition-transform duration-300 ${isOnlineExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isOnlineExpanded && (
                                <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                  <button 
                                    onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর')}
                                    className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                  >
                                    বিএসআর
                                  </button>
                                  <button 
                                    onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়')}
                                    className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                  >
                                    দ্বিপক্ষীয়
                                  </button>
                                </div>
                              )}

                              {/* ৪. ডিডি স্যার ফরমেট */}
                              <button 
                                onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।')}
                                className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                ডিডি স্যার ফরমেট
                              </button>
                            </div>
                          )}

                          {/* ২. অনুচ্ছেদ */}
                          <button 
                            onClick={() => setActiveTab('return', null, 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                            className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-black transition-all ${reportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-400'}`}
                          >
                            <span>অনুচ্ছেদ</span>
                          </button>
                        </div>
                      )}

                      {/* ২. ত্রৈমাসিক (Toggle) */}
                      <button 
                        onClick={() => setIsQuarterlyExpanded(!isQuarterlyExpanded)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black transition-all ${isQuarterlyExpanded ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>ত্রৈমাসিক</span>
                        </div>
                        <ChevronDown size={6} className={`transition-transform duration-300 ${isQuarterlyExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Quarterly Sub-items */}
                      {isQuarterlyExpanded && (
                        <div className="pl-3 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <button 
                              key={num}
                              onClick={() => setActiveTab('return', null, `ত্রৈমাসিক রিটার্ন - ${toBengaliDigits(num.toString())}`)}
                              className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === `ত্রৈমাসিক রিটার্ন - ${toBengaliDigits(num.toString())}` ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                            >
                              রিটার্ন {toBengaliDigits(num.toString())}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* ৩. ষাণ্মাসিক */}
                      <button 
                        onClick={() => setActiveTab('return', null, 'ষাণ্মাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                        className={getSubItemCls(reportType === 'ষাণ্মাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                      >
                        <span>ষাণ্মাসিক</span>
                      </button>

                      {/* ৪. বাৎসরিক */}
                      <button 
                        onClick={() => setActiveTab('return', null, 'বাৎসরিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                        className={getSubItemCls(reportType === 'বাৎসরিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                      >
                        <span>বাৎসরিক</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Dashboard Section - Moved out of Settings */}
            {isAdmin && (
              <div className="pt-1 relative">
                <button 
                  id="side-nav-dashboard" 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`w-full flex items-center justify-between px-1.5 py-1 rounded-lg font-bold transition-all relative group ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
                >
                  <IDBadge id="side-nav-dashboard" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">ড্যাশবোর্ড</span>
                  </div>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Fixed Footer Section - Moved out of scrollable area to the very bottom */}
        <div id="sidebar-footer" className="p-1.5 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm space-y-1 relative shrink-0">
          <IDBadge id="sidebar-footer" />
          
          {isAdmin ? (
            <div className="grid grid-cols-1 gap-1">

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-1.5 py-1 rounded-lg bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold text-[9px] group border border-red-500/10 hover:border-red-400"
                >
                  লগআউট করুন
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAdminModal(true)}
                className="w-full flex items-center justify-center px-1.5 py-1.5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-850 text-slate-200 hover:from-blue-600 hover:to-blue-700 hover:text-white transition-all font-black text-[12px] group border border-slate-700 hover:border-blue-400 shadow-xl shadow-black/20"
              >
                <div className="flex items-center gap-1.5">
                  <span>এডমিন লগইন</span>
                </div>
              </button>
            )}
          </div>
      </div>
      {showAdminModal && (
        <div className="fixed inset-0 z-[20000] flex items-start justify-center p-4 pt-32 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 space-y-6 animate-in zoom-in-95 duration-500 relative overflow-y-auto max-h-[90vh] group no-scrollbar">
            {/* Decorative Glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full group-hover:bg-blue-600/30 transition-colors duration-700"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 blur-[80px] rounded-full group-hover:bg-emerald-600/20 transition-colors duration-700"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                    <Fingerprint size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight">সিকিউরিটি এক্সেস</h3>
                    <p className="text-blue-400/60 text-[9px] font-black uppercase tracking-[0.2em]">Administrator Portal</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-slate-300 text-sm font-bold ml-1">মালিকের সিক্রেট পাসওয়ার্ড দিন:</p>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="relative group/input">
                    <input 
                      autoFocus 
                      type="password" 
                      placeholder="••••••••" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-2xl outline-none focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-slate-700 tracking-[0.5em]" 
                    />
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity"></div>
                  </div>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => { setShowAdminModal(false); setShowRecoveryModal(true); }}
                      className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                    >
                      পাসওয়ার্ড ভুলে গেছেন? উদ্ধার করুন
                    </button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10"></span>
                    </div>
                    <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.3em]">
                      <span className="bg-slate-900 px-3 text-slate-500">অথবা</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      console.log("Calling signInWithGoogle from Sidebar");
                      window.alert("Calling signInWithGoogle from Sidebar");
                      signInWithGoogle();
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5"
                  >
                    <Chrome size={18} className="text-blue-600" />
                    গুগল দিয়ে লগইন করুন
                  </button>

                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} 
                      className="flex-1 py-3.5 bg-white/5 text-slate-300 rounded-2xl font-black text-xs hover:bg-white/10 transition-all active:scale-95 border border-white/5"
                    >
                      বাতিল
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20 ring-4 ring-blue-500/10"
                    >
                      প্রবেশ করুন
                    </button>
                  </div>
                  <div className="text-center pt-1">
                    <button 
                      type="button"
                      onClick={() => { setShowAdminModal(false); onOpenChangePassword && onOpenChangePassword(); }}
                      className="text-[8px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors"
                    >
                      পাসওয়ার্ড পরিবর্তন করতে চান?
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[20001] flex items-start justify-center p-4 pt-32 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative overflow-hidden group">
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-600/20 blur-[80px] rounded-full group-hover:bg-amber-600/30 transition-colors duration-700"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight">পাসওয়ার্ড উদ্ধার</h3>
                    <p className="text-amber-400/60 text-[9px] font-black uppercase tracking-[0.2em]">Security Recovery</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowRecoveryModal(false); setRecoveryAnswer(''); setRecoveredPassword(null); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {recoveredPassword ? (
                  <div className="space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center space-y-3 relative overflow-hidden group/pass">
                      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/pass:opacity-100 transition-opacity"></div>
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-10">আপনার পাসওয়ার্ড:</p>
                      <p className="text-white font-black text-4xl tracking-[0.3em] relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{recoveredPassword}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          setShowRecoveryModal(false);
                          setRecoveredPassword(null);
                          setRecoveryAnswer('');
                          if (onOpenChangePassword) onOpenChangePassword();
                        }}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                      >
                        নতুন পাসওয়ার্ড সেট করুন
                      </button>
                      <button 
                        onClick={() => {
                          setShowRecoveryModal(false);
                          setRecoveredPassword(null);
                          setRecoveryAnswer('');
                          setShowAdminModal(true);
                        }}
                        className="w-full py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-sm hover:bg-white/10 transition-all active:scale-95 border border-white/5"
                      >
                        লগইন পেজে ফিরে যান
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-amber-500" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">নিরাপত্তা প্রশ্ন:</p>
                      </div>
                      <p className="text-white font-bold text-lg leading-relaxed">{storedRecoveryQuestion}</p>
                    </div>

                    <form onSubmit={handleRecoverySubmit} className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-slate-300 text-sm font-bold ml-1">আপনার উত্তর দিন:</p>
                        <div className="relative group/input">
                          <input 
                            autoFocus
                            type="text" 
                            value={recoveryAnswer} 
                            onChange={(e) => setRecoveryAnswer(e.target.value)} 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-amber-500/50 focus:ring-8 focus:ring-amber-500/5 transition-all placeholder:text-slate-700" 
                            placeholder="উত্তর এখানে লিখুন..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => { setShowRecoveryModal(false); setRecoveryAnswer(''); }} 
                          className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-xs hover:bg-white/10 transition-all border border-white/5"
                        >
                          বাতিল
                        </button>
                        <button 
                          type="submit" 
                          className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black text-xs hover:from-amber-500 hover:to-orange-500 transition-all shadow-xl shadow-amber-600/20 active:scale-95 ring-4 ring-amber-500/10"
                        >
                          যাচাই করুন
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Sidebar;