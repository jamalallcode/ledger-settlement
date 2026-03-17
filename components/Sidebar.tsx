import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, Sparkles, Lock, Unlock, CheckCircle2, Download, Upload, ShieldCheck, LogOut, X, KeyRound, Fingerprint, AlertCircle, Library, Link as LinkIcon, Plus, ChevronDown, Trash2, Globe, Mail, ClipboardList, BarChart3, User, ArrowRight } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

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
  pendingCount = 0,
  entryModule,
  registerSubModule,
  reportType
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState('123');
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

  // Pre-fill change password fields
  useEffect(() => {
    if (showChangePasswordModal) {
      setNewQuestion(storedRecoveryQuestion);
      setNewAnswer(storedRecoveryAnswer);
    }
  }, [showChangePasswordModal, storedRecoveryQuestion, storedRecoveryAnswer]);

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
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);
  const [isInitialBalanceExpanded, setIsInitialBalanceExpanded] = useState(false);

  // Auto-expand menus based on active state
  useEffect(() => {
    if (activeTab === 'entry') setIsEntryExpanded(true);
    if (activeTab === 'register') setIsRegisterExpanded(true);
    if (activeTab === 'return') {
      setIsReturnExpanded(true);
      if (reportType) {
        if (reportType.includes('মাসিক')) {
          setIsMonthlyExpanded(true);
          if (reportType.includes('চিঠিপত্র')) {
            setIsMonthlyCorrExpanded(true);
            if (reportType.includes('নিষ্পত্তি')) setIsSettlementExpanded(true);
            if (reportType.includes('অনলাইন')) setIsOnlineExpanded(true);
          }
        }
        if (reportType.includes('ত্রৈমাসিক')) {
          setIsQuarterlyExpanded(true);
        }
        if (reportType.includes('জের সেটআপ')) {
          setIsInitialBalanceExpanded(true);
        }
      }
    }
  }, [activeTab, reportType]);

  // --- Important Links State ---
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [importantLinks, setImportantLinks] = useState<{name: string, url: string}[]>([]);

  // Load links from storage on mount
  useEffect(() => {
    const savedLinks = localStorage.getItem('ledger_important_links');
    if (savedLinks) {
      setImportantLinks(JSON.parse(savedLinks));
    } else {
      const defaultLinks = [
        { name: 'Archive.org', url: 'https://archive.org/' },
        { name: 'Gemini AI', url: 'https://gemini.google.com/app' },
        { name: 'CAG Website', url: 'https://cag.org.bd/' }
      ];
      setImportantLinks(defaultLinks);
      localStorage.setItem('ledger_important_links', JSON.stringify(defaultLinks));
    }
  }, []);

  const handleAddLink = () => {
    const name = prompt("লিঙ্কের নাম লিখুন (যেমন: Google):");
    if (!name) return;
    const url = prompt("লিঙ্কের ইউআরএল (URL) দিন:", "https://");
    if (!url || !url.startsWith('http')) {
      alert("সঠিক ইউআরএল প্রদান করুন।");
      return;
    }
    const nextLinks = [...importantLinks, { name, url }];
    setImportantLinks(nextLinks);
    localStorage.setItem('ledger_important_links', JSON.stringify(nextLinks));
  };

  const handleRemoveLink = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!window.confirm("আপনি কি এই লিঙ্কটি মুছে ফেলতে চান?")) return;
    const nextLinks = importantLinks.filter((_, i) => i !== index);
    setImportantLinks(nextLinks);
    localStorage.setItem('ledger_important_links', JSON.stringify(nextLinks));
  };

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

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 3) {
      alert("পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে।");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("পাসওয়ার্ড দুটি মিলেনি!");
      return;
    }
    
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert("অনুগ্রহ করে নিরাপত্তা প্রশ্ন এবং উত্তর প্রদান করুন।");
      return;
    }
    
    saveAdminSettings(newPassword, newQuestion, newAnswer);
    alert("পাসওয়ার্ড এবং নিরাপত্তা সেটিংস সফলভাবে পরিবর্তন করা হয়েছে।");
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setNewQuestion('');
    setNewAnswer('');
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
    ...(isAdmin ? [
      { id: 'voting', label: 'গোপন ব্যালট', icon: Fingerprint, badgeId: 'side-nav-voting' },
      { id: 'change_pass', label: 'পাসওয়ার্ড পরিবর্তন', icon: KeyRound, badgeId: 'side-nav-pass' },
      { id: 'setup', label: 'সেটআপ', icon: ShieldCheck, badgeId: 'side-nav-setup', isDropdown: true }
    ] : []),
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
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-black transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`;

  const getSubIconCls = (isActive: boolean, hoverColor: string = 'emerald') => 
    `${isActive ? 'text-white' : `text-slate-400 group-hover:text-${hoverColor}-400`} transition-transform group-hover:scale-110`;

  return (
    <>
      <div id="sidebar-container" className="w-48 bg-slate-900 h-screen text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl overflow-hidden relative z-[5000]">
        <IDBadge id="sidebar-container" />
        <div id="sidebar-header" className="p-6 border-b border-slate-800 flex items-center justify-between relative">
          <IDBadge id="sidebar-header" />
          <div id="sidebar-logo" onClick={handleLogoClick} className="flex items-center gap-3 relative cursor-pointer select-none active:scale-95 transition-transform">
            <IDBadge id="sidebar-logo" />
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <span className="font-black text-white tracking-tight text-xs">অডিট রেজিস্টার</span>
          </div>
          <button onClick={onToggleVisibility} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white relative">
            <IDBadge id="btn-sidebar-toggle" />
            <ChevronLeft size={20} />
          </button>
        </div>
        <nav id="sidebar-nav" className="flex-1 overflow-y-auto py-4 px-4 space-y-1 relative no-scrollbar">
          <IDBadge id="sidebar-nav" />
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className="relative"
            >
              <button 
                id={item.badgeId} 
                onClick={() => {
                  if (item.id === 'entry') {
                    setIsEntryExpanded(!isEntryExpanded);
                  } else if (item.id === 'register') {
                    setIsRegisterExpanded(!isRegisterExpanded);
                  } else if (item.id === 'return') {
                    setIsReturnExpanded(!isReturnExpanded);
                  } else if (item.id === 'setup') {
                    setIsSetupExpanded(!isSetupExpanded);
                  } else if (item.id === 'change_pass') {
                    setShowChangePasswordModal(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }} 
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
              >
                <IDBadge id={item.badgeId} />
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <item.icon size={18} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.isDropdown && <ChevronDown size={14} className={`transition-transform duration-300 ${(item.id === 'entry' && isEntryExpanded) || (item.id === 'register' && isRegisterExpanded) || (item.id === 'return' && isReturnExpanded) || (item.id === 'setup' && isSetupExpanded) ? 'rotate-180' : ''}`} />}
              </button>

              {/* Nested Sub-menu for Entry */}
              {item.id === 'entry' && isEntryExpanded && (
                <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <button 
                    onClick={() => setActiveTab('entry', 'correspondence')}
                    className={getSubItemCls(activeTab === 'entry' && entryModule === 'correspondence')}
                  >
                    <Mail size={14} className={getSubIconCls(activeTab === 'entry' && entryModule === 'correspondence', 'emerald')} />
                    <span>১. চিঠিপত্র এন্ট্রি</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('entry', 'settlement')}
                    className={getSubItemCls(activeTab === 'entry' && entryModule === 'settlement')}
                  >
                    <ClipboardList size={14} className={getSubIconCls(activeTab === 'entry' && entryModule === 'settlement', 'blue')} />
                    <span>২. মীমাংসা এন্ট্রি</span>
                  </button>
                </div>
              )}

              {/* Nested Sub-menu for Register */}
              {item.id === 'register' && isRegisterExpanded && (
                <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <button 
                    onClick={() => setActiveTab('register', 'correspondence')}
                    className={getSubItemCls(activeTab === 'register' && registerSubModule === 'correspondence')}
                  >
                    <Mail size={14} className={getSubIconCls(activeTab === 'register' && registerSubModule === 'correspondence', 'emerald')} />
                    <span>১. চিঠিপত্র রেজি:</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('register', 'settlement')}
                    className={getSubItemCls(activeTab === 'register' && registerSubModule === 'settlement')}
                  >
                    <ClipboardList size={14} className={getSubIconCls(activeTab === 'register' && registerSubModule === 'settlement', 'blue')} />
                    <span>২. মীমাংসিত রেজি:</span>
                  </button>
                </div>
              )}

              {/* Nested Sub-menu for Return & Summary */}
              {item.id === 'return' && isReturnExpanded && (
                <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {/* ১. মাসিক (Toggle) */}
                  <button 
                    onClick={() => setIsMonthlyExpanded(!isMonthlyExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[12px] font-black transition-all ${isMonthlyExpanded ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${reportType?.includes('মাসিক') ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-blue-500'}`}></div>
                      <span>১. মাসিক</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isMonthlyExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Monthly Sub-items */}
                  {isMonthlyExpanded && (
                    <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                      {/* ১. চিঠিপত্র (Toggle) */}
                      <button 
                        onClick={() => setIsMonthlyCorrExpanded(!isMonthlyCorrExpanded)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-black transition-all ${isMonthlyCorrExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Mail size={12} />
                          <span>১. চিঠিপত্র</span>
                        </div>
                        <ChevronDown size={10} className={`transition-transform duration-300 ${isMonthlyCorrExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Corr Sub-items */}
                      {isMonthlyCorrExpanded && (
                        <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                          {/* ১. ঢাকা */}
                          <button 
                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।')}
                            className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                          >
                            ১. ঢাকা
                          </button>

                          {/* ২. নিষ্পত্তি (Toggle) */}
                          <button 
                            onClick={() => setIsSettlementExpanded(!isSettlementExpanded)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${isSettlementExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span>২. নিষ্পত্তি</span>
                            </div>
                            <ChevronDown size={10} className={`transition-transform duration-300 ${isSettlementExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isSettlementExpanded && (
                            <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                              <button 
                                onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর')}
                                className={`w-full text-left px-3 py-1.5 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                ১. বিএসআর
                              </button>
                              <button 
                                onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়')}
                                className={`w-full text-left px-3 py-1.5 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                ২. দ্বিপক্ষীয়
                              </button>
                            </div>
                          )}

                          {/* ৩. অনলাইন প্রাপ্তি (Toggle) */}
                          <button 
                            onClick={() => setIsOnlineExpanded(!isOnlineExpanded)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${isOnlineExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span>৩. অনলাইন প্রাপ্তি</span>
                            </div>
                            <ChevronDown size={10} className={`transition-transform duration-300 ${isOnlineExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isOnlineExpanded && (
                            <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                              <button 
                                onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর')}
                                className={`w-full text-left px-3 py-1.5 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                ১. বিএসআর
                              </button>
                              <button 
                                onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়')}
                                className={`w-full text-left px-3 py-1.5 text-[9px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                ২. দ্বিপক্ষীয়
                              </button>
                            </div>
                          )}

                          {/* ৪. ডিডি স্যার */}
                          <button 
                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।')}
                            className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                          >
                            ৪. ডিডি স্যার
                          </button>
                        </div>
                      )}

                      {/* ২. অনুচ্ছেদ */}
                      <button 
                        onClick={() => setActiveTab('return', null, 'মাসিক রিটারন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-black transition-all ${reportType === 'মাসিক রিটারন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-400'}`}
                      >
                        <BarChart3 size={12} />
                        <span>২. অনুচ্ছেদ</span>
                      </button>
                    </div>
                  )}

                  {/* ২. ত্রৈমাসিক (Toggle) */}
                  <button 
                    onClick={() => setIsQuarterlyExpanded(!isQuarterlyExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[12px] font-black transition-all ${isQuarterlyExpanded ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${reportType?.includes('ত্রৈমাসিক') ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-amber-500'}`}></div>
                      <span>২. ত্রৈমাসিক</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isQuarterlyExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Quarterly Sub-items */}
                  {isQuarterlyExpanded && (
                    <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <button 
                          key={num}
                          onClick={() => setActiveTab('return', null, `ত্রৈমাসিক রিটার্ন - ${toBengaliDigits(num.toString())}`)}
                          className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === `ত্রৈমাসিক রিটার্ন - ${toBengaliDigits(num.toString())}` ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                        >
                          রিটার্ন - {toBengaliDigits(num.toString())}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ৩. ষাণ্মাসিক */}
                  <button 
                    onClick={() => setActiveTab('return', null, 'ষাণ্মাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                    className={getSubItemCls(reportType === 'ষাণ্মাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${reportType === 'ষাণ্মাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' ? 'bg-white' : 'bg-purple-500'}`}></div>
                    <span>৩. ষাণ্মাসিক</span>
                  </button>

                  {/* ৪. বাৎসরিক */}
                  <button 
                    onClick={() => setActiveTab('return', null, 'বাৎসরিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                    className={getSubItemCls(reportType === 'বাৎসরিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${reportType === 'বাৎসরিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' ? 'bg-white' : 'bg-rose-500'}`}></div>
                    <span>৪. বাৎসরিক</span>
                  </button>
                </div>
              )}
              {/* Nested Sub-menu for Setup */}
              {item.id === 'setup' && isSetupExpanded && (
                <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <button 
                    onClick={() => setActiveTab('setup_receivers')}
                    className={getSubItemCls(activeTab === 'setup_receivers')}
                  >
                    <User size={14} className={getSubIconCls(activeTab === 'setup_receivers', 'blue')} />
                    <span>১. প্রাপক ব্যবস্থাপনা</span>
                  </button>

                  {/* ২. প্রারম্ভিক জের সেটআপ (Nested Toggle) */}
                  <button 
                    onClick={() => setIsInitialBalanceExpanded(!isInitialBalanceExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[11px] font-black transition-all ${reportType?.includes('জের সেটআপ') ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock size={12} className={reportType?.includes('জের সেটআপ') ? 'text-blue-400' : 'text-slate-600'} />
                      <span>২. প্রারম্ভিক জের সেটআপ</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isInitialBalanceExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isInitialBalanceExpanded && (
                    <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                      <button 
                        onClick={() => setActiveTab('return', null, 'প্রারম্ভিক জের সেটআপ: মাসিক')}
                        className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'প্রারম্ভিক জের সেটআপ: মাসিক' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                      >
                        ১. মাসিক
                      </button>
                      <button 
                        onClick={() => setActiveTab('return', null, 'প্রারম্ভিক জের সেটআপ: ত্রৈমাসিক')}
                        className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'প্রারম্ভিক জের সেটআপ: ত্রৈমাসিক' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                      >
                        ২. ত্রৈমাসিক
                      </button>
                      <button 
                        onClick={() => setActiveTab('return', null, 'প্রারম্ভিক জের সেটআপ: ষাণ্মাসিক')}
                        className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'প্রারম্ভিক জের সেটআপ: ষাণ্মাসিক' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                      >
                        ৩. ষাণ্মাসিক
                      </button>
                      <button 
                        onClick={() => setActiveTab('return', null, 'প্রারম্ভিক জের সেটআপ: বাৎসরিক')}
                        className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'প্রারম্ভিক জের সেটআপ: বাৎসরিক' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                      >
                        ৪. বাৎসরিক
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setShowChangePasswordModal(true)}
                    className={getSubItemCls(false)}
                  >
                    <KeyRound size={14} className={getSubIconCls(false, 'amber')} />
                    <span>৩. পাসওয়ার্ড পরিবর্তন</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* New Important Links Section */}
          <div className="pt-4 space-y-1">
            <div 
              id="side-nav-links-header"
              onClick={() => setIsLinksOpen(!isLinksOpen)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold transition-all relative cursor-pointer group ${isLinksOpen ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <IDBadge id="side-nav-links-header" />
              <div className="flex items-center gap-3">
                <Globe size={18} />
                <span className="text-xs">প্রয়োজনীয় লিঙ্কসমূহ</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isLinksOpen ? 'rotate-180' : ''}`} />
            </div>

            {isLinksOpen && (
              <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                {importantLinks.map((link, idx) => (
                  <div key={idx} className="group/link flex items-center gap-2">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all truncate"
                    >
                      <LinkIcon size={12} className="shrink-0" />
                      <span className="truncate">{link.name}</span>
                    </a>
                    {isAdmin && (
                      <button 
                        onClick={(e) => handleRemoveLink(e, idx)}
                        className="opacity-0 group-hover/link:opacity-100 p-1 text-slate-600 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                
                {isAdmin && (
                  <button 
                    onClick={handleAddLink}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all mt-2"
                  >
                    <Plus size={14} />
                    <span>লিঙ্ক যুক্ত করুন</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
        <div id="sidebar-footer" className="p-4 border-t border-slate-800 space-y-4 relative bg-slate-900/50 backdrop-blur-sm">
          <IDBadge id="sidebar-footer" />
          
          {/* Security & Account Section - Premium Design */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Security & Account</span>
            </div>
            
            {isAdmin ? (
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-blue-600 hover:text-white transition-all font-bold text-[11px] group border border-slate-700/50 hover:border-blue-400 shadow-sm"
                >
                  <KeyRound size={14} className="group-hover:rotate-12 transition-transform text-blue-400 group-hover:text-white" />
                  পাসওয়ার্ড পরিবর্তন
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold text-[11px] group border border-red-500/10 hover:border-red-400"
                >
                  <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                  লগআউট করুন
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAdminModal(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-850 text-slate-200 hover:from-blue-600 hover:to-blue-700 hover:text-white transition-all font-black text-[11px] group border border-slate-700 hover:border-blue-400 shadow-xl shadow-black/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Lock size={14} className="text-blue-400 group-hover:text-white transition-colors" />
                  </div>
                  <span>এডমিন লগইন</span>
                </div>
                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 opacity-30">
             <ShieldCheck size={10} className="text-slate-500" />
             <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em]">Secure Node v1.0.4</p>
          </div>
        </div>
      </div>
      {showAdminModal && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-48 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
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
                      onClick={() => { setShowAdminModal(false); setShowChangePasswordModal(true); }}
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
        <div className="fixed inset-0 z-[1001] flex items-start justify-center p-4 pt-48 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
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
                          setShowChangePasswordModal(true);
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-[1001] flex items-start justify-center p-4 pt-48 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative overflow-hidden group">
            {/* Decorative Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full group-hover:bg-blue-600/30 transition-colors duration-700"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight">পাসওয়ার্ড পরিবর্তন</h3>
                    <p className="text-blue-400/60 text-[9px] font-black uppercase tracking-[0.2em]">Update Security</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChangePasswordModal(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড:</p>
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-700" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-1">নিশ্চিত করুন:</p>
                      <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-700" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={12} className="text-blue-400" />
                      <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">পাসওয়ার্ড উদ্ধারের জন্য সেটিংস</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-1">নিরাপত্তা প্রশ্ন:</p>
                      <input 
                        type="text" 
                        value={newQuestion} 
                        onChange={(e) => setNewQuestion(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-700" 
                        placeholder="যেমন: আপনার প্রিয় রং কি?"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-1">প্রশ্নের উত্তর:</p>
                      <input 
                        type="text" 
                        value={newAnswer} 
                        onChange={(e) => setNewAnswer(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-700" 
                        placeholder="উত্তরটি এখানে লিখুন"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowChangePasswordModal(false)} 
                    className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-xs hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 ring-4 ring-blue-500/10"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
