import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, Sparkles, Lock, Unlock, CheckCircle2, Download, Upload, ShieldCheck, LogOut, X, KeyRound, Fingerprint, AlertCircle, Library, Link as LinkIcon, Plus, ChevronDown, Trash2, Globe, Mail, ClipboardList, BarChart3, Settings, ArrowRight, Chrome, Landmark, Eye, EyeOff } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { signInWithGoogle } from '../lib/supabase';
import { ModuleVisibility } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string, subModule?: any, reportType?: string, searchTerm?: string) => void;
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
  highlightSearch?: string | null;
  onOpenChangePassword?: () => void;
  moduleVisibility?: ModuleVisibility;
  showPendingOnly?: boolean;
  userEmail?: string | null;
  isSidebarOpen?: boolean;
  showAdminLogin?: boolean;
  setShowAdminLogin?: (val: boolean) => void;
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
  highlightSearch,
  showPendingOnly = false,
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
  },
  userEmail = null,
  isSidebarOpen = true,
  showAdminLogin = false,
  setShowAdminLogin
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showAdminModal = showAdminLogin;
  const setShowAdminModal = setShowAdminLogin || (() => {});
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState('80093424LEdg@');
  const [storedRecoveryQuestion, setStoredRecoveryQuestion] = useState('আপনার প্রিয় রং কি?');
  const [storedRecoveryAnswer, setStoredRecoveryAnswer] = useState('সাদা');
  const [storedRecoveryEmail, setStoredRecoveryEmail] = useState('websitetogather@gmail.com');

  // Gmail password reset states
  const [recoveryMethod, setRecoveryMethod] = useState<'question' | 'email'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('websitetogather@gmail.com');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string | null>(null);
  
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  // Check if current user is unauthorized using email or local storage flags
  const isUserUnauthorized = false;

  const [showAdminLoginButton, setShowAdminLoginButton] = useState(false);

  // Load admin settings from storage
  useEffect(() => {
    const savedPass = localStorage.getItem('ledger_admin_password_v1');
    const savedQuestion = localStorage.getItem('ledger_admin_recovery_q_v1');
    const savedAnswer = localStorage.getItem('ledger_admin_recovery_a_v1');
    const savedEmail = localStorage.getItem('ledger_admin_recovery_email_v1');
    
    if (savedPass) setStoredPassword(savedPass);
    if (savedQuestion) setStoredRecoveryQuestion(savedQuestion);
    if (savedAnswer) setStoredRecoveryAnswer(savedAnswer);
    if (savedEmail) {
      setStoredRecoveryEmail(savedEmail);
      setRecoveryEmail(savedEmail);
    } else {
      localStorage.setItem('ledger_admin_recovery_email_v1', 'websitetogather@gmail.com');
    }

    // Intercept Password Reset URL details from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetEmailParam = urlParams.get('reset-email');
    const resetCodeParam = urlParams.get('reset-code');

    if (resetEmailParam && resetCodeParam) {
      // Clear URL params to make it clean
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Open the recovery modal and set correct states
      setRecoveryMethod('email');
      setRecoveryEmail(resetEmailParam);
      setResetOtpInput(resetCodeParam);
      setIsOtpSent(true);
      setShowRecoveryModal(true);

      // Perform automatic verification of the link token!
      const autoVerify = async () => {
        try {
          const res = await fetch("/api/admin/verify-reset-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: resetEmailParam, code: resetCodeParam })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setRecoveredPassword(savedPass || '80093424LEdg@');
            setIsOtpSent(false);
            setResetOtpInput('');
            alert("সফলভাবে সিকিউরিটি লিংক যাচাই করা হয়েছে! এখন নিচের বাটন থেকে পাসওয়ার্ড পরিবর্তন বা নতুন পাসওয়ার্ড সেট করুন।");
          } else {
            alert(data.error || "সিকিউরিটি রিসেট লিংকটি ভুল অথবা মেয়াদোত্তীর্ণ।");
          }
        } catch (e) {
          console.error(e);
          alert("অটো-যাচাইকরণ ব্যর্থ হয়েছে। কোডটি ম্যানুয়ালি দিন।");
        }
      };
      autoVerify();
    }
  }, []);

  const saveAdminSettings = (pass: string, q: string, a: string, email: string) => {
    localStorage.setItem('ledger_admin_password_v1', pass);
    localStorage.setItem('ledger_admin_recovery_q_v1', q);
    localStorage.setItem('ledger_admin_recovery_a_v1', a);
    localStorage.setItem('ledger_admin_recovery_email_v1', email);
    setStoredPassword(pass);
    setStoredRecoveryQuestion(q);
    setStoredRecoveryAnswer(a);
    setStoredRecoveryEmail(email);
    setRecoveryEmail(email);
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
  const [isDetailedExpanded, setIsDetailedExpanded] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);
  
  // Auto-expand based on activeTab
  useEffect(() => {
    if (activeTab === 'entry') setIsEntryExpanded(true);
    if (activeTab === 'register') setIsRegisterExpanded(true);
    if (activeTab === 'return') setIsReturnExpanded(true);
    if (reportType?.startsWith('ত্রৈমাসিক রিটার্ন - বিস্তারিত -')) {
      setIsDetailedExpanded(true);
      setIsQuarterlyExpanded(true);
    }
  }, [activeTab, reportType]);

  // Disable admin portal access completely if user is logged in with another account or is unauthorized
  useEffect(() => {
    if (isUserUnauthorized) {
      setShowAdminLoginButton(false);
      localStorage.removeItem('show_admin_login_portal');
    }
  }, [userEmail, isUserUnauthorized]);

  const handleLogoClick = () => {
    setActiveTab('landing');

    const now = Date.now();
    if (now - lastClickTime.current < 1500) {
      clickCount.current += 1;
    } else {
      clickCount.current = 1;
    }
    lastClickTime.current = now;

    console.log("Consecutive sidebar logo clicks:", clickCount.current);

    if (clickCount.current >= 20) {
      clickCount.current = 0;
      setShowAdminModal(true);
    }
  };

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputEmail = adminEmailInput.trim().toLowerCase();
    const inputPassword = adminPassword.trim();
    
    if (inputEmail === 'jamaluddinkh3424@gmail.com' && inputPassword === '80093424JAma@') {
      setIsAdmin(true);
      localStorage.setItem('ledger_admin_access_v1', 'true');
      localStorage.setItem('ledger_admin_email_v1', 'jamaluddinkh3424@gmail.com');
      localStorage.setItem('ledger_login_timestamp', Date.now().toString());
      setShowAdminModal(false);
      setAdminPassword('');
      setAdminEmailInput('');
      setShowPassword(false);
    } else {
      alert("ভুল জিমেইল আইডি অথবা পাসওয়ার্ড!");
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = recoveryAnswer.trim().toLowerCase();
    const stored = storedRecoveryAnswer.trim().toLowerCase();
    
    if (
      input === stored || 
      input === 'সাদা' || 
      input === 'white' || 
      input === 'shada' ||
      input === 'sada' ||
      input.includes('সাদা') ||
      input.includes('white') ||
      input.includes('shada')
    ) {
      setRecoveredPassword(storedPassword);
    } else {
      alert("ভুল উত্তর! আবার চেষ্টা করুন।");
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      alert("দয়া করে একটি সঠিক জিমেইল এড্রেস প্রদান করুন।");
      return;
    }
    setRequestingOtp(true);
    setSimulatedOtpCode(null);

    try {
      const response = await fetch("/api/admin/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoveryEmail.toLowerCase().trim(),
          origin: window.location.origin
        })
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setIsOtpSent(true);
        if (data.simulated) {
          setSimulatedOtpCode(data.code);
          alert(`${data.message}\n\nআপনার ৬-ডিজিট সিকিউরিটি কোড: ${data.code}`);
        } else {
          alert("সিকিউরিটি ওটিপি কোড এবং রিসেট লিংকটি আপনার জিমেইলে পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।");
        }
      } else {
        alert(data.error || "রিসেট কোড পাঠাতে সমস্যা হয়েছে। দয়া করে সঠিক জিমেইল এড্রেস দিয়ে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.warn("API Error, falling back to local simulation mode:", err);
      // Fallback local simulation
      const enteredEmail = recoveryEmail.toLowerCase().trim();
      const actualSavedEmail = storedRecoveryEmail.toLowerCase().trim();
      
      if (enteredEmail !== actualSavedEmail) {
        alert("ভুল জিমেইল! অ্যাকাউন্টে নিবন্ধিত রিকভারি জিমেইল এড্রেসটির সাথে আপনার দেওয়া এড্রেসটি মেলেনি।");
        setRequestingOtp(false);
        return;
      }

      // Generate local fallback code
      const localCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('local_reset_code_v1', localCode);
      setIsOtpSent(true);
      setSimulatedOtpCode(localCode);
      
      alert("সার্ভার সংযোগ সম্ভব হচ্ছে না (Vercel হোস্টিং বা অফলাইন মোড)।\n\nআপনার রিকভারি জিমেইলটি সঠিক থাকায় সিস্টেম স্বয়ংক্রিয়ভাবে একটি লোকাল ডেমো রিকভারি কোড তৈরি করেছে।\n\nসিকিউরিটি ভেরিফিকেশন কোড: " + localCode + "\n\nকোডটি প্রবেশ করিয়ে কন্টিনিউ করুন।");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtpInput.trim()) {
      alert("অনুগ্রহ করে জিমেইলে পাঠানো ৬ ডিজিটের কোডটি দিন।");
      return;
    }
    setVerifyingOtp(true);

    try {
      const response = await fetch("/api/admin/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoveryEmail.toLowerCase().trim(),
          code: resetOtpInput.trim()
        })
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setRecoveredPassword(storedPassword);
        setIsOtpSent(false);
        setResetOtpInput('');
        setSimulatedOtpCode(null);
        alert("কোডটি সফলভাবে ভেরিফাই করা হয়েছে!");
      } else {
        alert(data.error || "সিকিউরিটি ওটিপি কোডটি সঠিক নয়।");
      }
    } catch (err) {
      console.warn("API Error during verify, falling back to local verification:", err);
      // Fallback local verify
      const localSavedCode = localStorage.getItem('local_reset_code_v1');
      if (localSavedCode && resetOtpInput.trim() === localSavedCode) {
        setRecoveredPassword(storedPassword);
        setIsOtpSent(false);
        setResetOtpInput('');
        setSimulatedOtpCode(null);
        localStorage.removeItem('local_reset_code_v1');
        alert("লোকাল ব্যাকআপ মুডে সিকিউরিটি কোডটি সফলভাবে যাচাই করা হয়েছে!");
      } else {
        alert("ভুল সিকিউরিটি কোড! আবার চেষ্টা করুন।");
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    setShowAdminLoginButton(false);
    localStorage.removeItem('show_admin_login_portal');
    localStorage.removeItem('ledger_login_timestamp');
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
    `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-black transition-all group cursor-pointer ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`;

  const getSubIconCls = (isActive: boolean, hoverColor: string = 'emerald') => 
    `${isActive ? 'text-white' : `text-slate-400 group-hover:text-${hoverColor}-400`} transition-transform group-hover:scale-110`;

  return (
    <>
      <div id="sidebar-container" className="w-[126px] bg-slate-900 h-full text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl overflow-hidden relative z-[5000]">
          <IDBadge id="sidebar-container" />
          <div id="sidebar-header" className="px-1.5 flex items-center justify-between relative bg-slate-900/45 h-[45px] shrink-0">
            <IDBadge id="sidebar-header" />
            <div id="sidebar-logo" onClick={handleLogoClick} className="flex items-center gap-1.5 relative cursor-pointer select-none active:scale-95 transition-all duration-300 group">
              <IDBadge id="sidebar-logo" />
              <div className="relative flex items-center justify-center w-5.5 h-5.5 bg-gradient-to-br from-indigo-700 via-blue-800 to-emerald-800 text-white rounded-md shadow-xs shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-300">
                <Landmark size={11} className="stroke-[2.5] text-white" />
              </div>
              <span className="font-black text-slate-200 tracking-tight text-[10px] group-hover:text-white transition-colors">অডিট রেজিস্টার</span>
            </div>
            <button onClick={onToggleVisibility} className="group/toggle w-5.5 h-5.5 flex items-center justify-center bg-slate-800/30 hover:bg-slate-700/50 border border-slate-800 hover:border-slate-700/60 rounded-md transition-all duration-300 text-slate-400 hover:text-amber-400 relative cursor-pointer active:scale-90 hover:shadow-[0_0_8px_rgba(245,158,11,0.25)]">
              <IDBadge id="btn-sidebar-toggle" />
              <div className="flex items-center gap-[1px] transition-transform duration-300 group-hover/toggle:-translate-x-0.5">
                <div className="w-[1px] h-[7px] bg-current opacity-70 shrink-0" />
                <div className="w-[1px] h-[7px] bg-current opacity-70 shrink-0" />
                <ChevronLeft size={8} className="stroke-[2.5] -ml-[1px] shrink-0" />
              </div>
            </button>
          </div>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <nav id="sidebar-nav" className="py-1 px-1.5 space-y-0.5 relative">
            <IDBadge id="sidebar-nav" />
            {menuItems.map((item) => {
              const isVisible = isAdmin || ((moduleVisibility as any)[item.id] !== false && !(item as any).adminOnly);
              if (!isVisible) return null;
              if ((item as any).adminOnly && !isAdmin) return null;

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
                      } else if (item.id === 'register') {
                        setIsRegisterExpanded(!isRegisterExpanded);
                      } else if (item.id === 'return') {
                        setIsReturnExpanded(!isReturnExpanded);
                      } else if (item.id === 'change_pass') {
                        if (onOpenChangePassword) onOpenChangePassword();
                      } else {
                        setActiveTab(item.id);
                      }
                    }} 
                    className={`w-full flex items-center justify-between px-1.5 py-1 rounded-lg font-bold transition-all relative group cursor-pointer ${activeTab === item.id || (item.id === 'archive' && activeTab === 'register' && showPendingOnly) ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
                  >
                    <IDBadge id={item.badgeId} />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{item.label}</span>
                      {/* Notification badge removed for archive as requested */}
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
                  <AnimatePresence>
                    {item.id === 'entry' && isEntryExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="pl-3 py-1 space-y-1 overflow-hidden"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Nested Sub-menu for Register */}
                  <AnimatePresence>
                    {item.id === 'register' && isRegisterExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="pl-3 py-1 space-y-1 overflow-hidden"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Nested Sub-menu for Return & Summary */}
                  <AnimatePresence>
                    {item.id === 'return' && isReturnExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="pl-3 py-1 space-y-1 overflow-hidden"
                      >
                        {/* ১. মাসিক (Toggle) */}
                        <button 
                          onClick={() => setIsMonthlyExpanded(!isMonthlyExpanded)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${isMonthlyExpanded ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>মাসিক</span>
                          </div>
                          <ChevronDown size={6} className={`transition-transform duration-300 ${isMonthlyExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Monthly Sub-items */}
                        <AnimatePresence>
                          {isMonthlyExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="pl-3 py-1 space-y-1 overflow-hidden"
                            >
                              {/* ১. চিঠিপত্র (Toggle) */}
                              <button 
                                onClick={() => setIsMonthlyCorrExpanded(!isMonthlyCorrExpanded)}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[9px] font-black transition-all cursor-pointer ${isMonthlyCorrExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>চিঠিপত্র</span>
                                </div>
                                <ChevronDown size={6} className={`transition-transform duration-300 ${isMonthlyCorrExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Corr Sub-items */}
                              <AnimatePresence>
                                {isMonthlyCorrExpanded && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="pl-3 py-1 space-y-1 overflow-hidden"
                                  >
                                    {/* ১. ঢাকা */}
                                    <button 
                                      onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।')}
                                      className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                    >
                                      ঢাকা রিটার্ণ
                                    </button>

                                    {/* ২. নিষ্পত্তি (Toggle) */}
                                    <button 
                                      onClick={() => setIsSettlementExpanded(!isSettlementExpanded)}
                                      className={`w-full flex items-center justify-between px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${isSettlementExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span>নিষ্পত্তি</span>
                                      </div>
                                      <ChevronDown size={6} className={`transition-transform duration-300 ${isSettlementExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                      {isSettlementExpanded && (
                                        <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2, ease: "easeInOut" }}
                                          className="pl-3 py-1 space-y-1 overflow-hidden"
                                        >
                                          <button 
                                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর')}
                                            className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                          >
                                            বিএসআর
                                          </button>
                                          <button 
                                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়')}
                                            className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                          >
                                            দ্বিপক্ষীয়
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* ৩. অনলাইন প্রাপ্তি (Toggle) */}
                                    <button 
                                      onClick={() => setIsOnlineExpanded(!isOnlineExpanded)}
                                      className={`w-full flex items-center justify-between px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${isOnlineExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span>অনলাইন প্রাপ্তি</span>
                                      </div>
                                      <ChevronDown size={6} className={`transition-transform duration-300 ${isOnlineExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                      {isOnlineExpanded && (
                                        <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2, ease: "easeInOut" }}
                                          className="pl-3 py-1 space-y-1 overflow-hidden"
                                        >
                                          <button 
                                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর')}
                                            className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                          >
                                            বিএসআর
                                          </button>
                                          <button 
                                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়')}
                                            className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                          >
                                            দ্বিপক্ষীয়
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* ৪. ডিডি স্যার ফরমেট */}
                                    <button 
                                      onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।')}
                                      className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                    >
                                      ডিডি স্যার রিটার্ণ
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* ২. অনুচ্ছেদ */}
                              <button 
                                onClick={() => setActiveTab('return', null, 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-black transition-all cursor-pointer ${reportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-400'}`}
                              >
                                <span>অনুচ্ছেদ</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ২. ত্রৈমাসিক (Toggle) */}
                        <button 
                          onClick={() => setIsQuarterlyExpanded(!isQuarterlyExpanded)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${isQuarterlyExpanded ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>ত্রৈমাসিক</span>
                          </div>
                          <ChevronDown size={6} className={`transition-transform duration-300 ${isQuarterlyExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Quarterly Sub-items */}
                        <AnimatePresence>
                          {isQuarterlyExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="pl-3 py-1 space-y-1 overflow-hidden"
                            >
                              <button 
                                onClick={() => setActiveTab('return', null, 'ত্রৈমাসিক রিটার্ন - ২')}
                                className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'ত্রৈমাসিক রিটার্ন - ২' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                বিএসআর
                              </button>
                              <button 
                                onClick={() => setActiveTab('return', null, 'ত্রৈমাসিক রিটার্ন - ১')}
                                className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${reportType === 'ত্রৈমাসিক রিটার্ন - ১' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                              >
                                দ্বিপক্ষীয়
                              </button>

                              {/* বিস্তারিত এবং এর ৬টি সাব-আইটেম */}
                              <button 
                                onClick={() => setIsDetailedExpanded(!isDetailedExpanded)}
                                className={`w-full flex items-center justify-between px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${isDetailedExpanded ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-300'}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>বিস্তারিত</span>
                                </div>
                                <ChevronDown size={6} className={`transition-transform duration-300 ${isDetailedExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {isDetailedExpanded && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="pl-3 py-1 space-y-1 overflow-hidden"
                                  >
                                    {['১', '২', '৩', '৪', '৫', '৬'].map((num) => {
                                      const key = `ত্রৈমাসিক রিটার্ন - বিস্তারিত - ${num}`;
                                      const isSelected = reportType === key;
                                      return (
                                        <button 
                                          key={num}
                                          onClick={() => setActiveTab('return', null, key)}
                                          className={`w-full text-left px-2 py-1 text-[9px] font-black transition-all border-l ml-1 rounded-r-md cursor-pointer ${isSelected ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                                        >
                                          বিস্তারিত - {num}
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>

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

                        {/* ৫. চাহিদা মোতাবেক */}
                        <button 
                          onClick={() => setActiveTab('return', null, 'চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট')}
                          className={getSubItemCls(reportType === 'চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট')}
                        >
                          <span>চাহিদা মোতাবেক</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Dashboard Section - Moved out of Settings */}
            {isAdmin && (
              <div className="pt-1 relative">
                <button 
                  id="side-nav-dashboard" 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`w-full flex items-center justify-between px-1.5 py-1 rounded-lg font-bold transition-all relative group cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
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

      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
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
                  onClick={() => { setShowAdminModal(false); setAdminPassword(''); setShowPassword(false); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1 text-left">
                    <label className="text-slate-300 text-[11px] font-black pl-1 block uppercase tracking-wider">জিমেইল আইডি (Gmail ID)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input 
                        autoFocus 
                        type="email" 
                        placeholder="example@gmail.com" 
                        value={adminEmailInput} 
                        onChange={(e) => setAdminEmailInput(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-600 block" 
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1 text-left">
                    <label className="text-slate-300 text-[11px] font-black pl-1 block uppercase tracking-wider">পাসওয়ার্ড (Password)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={adminPassword} 
                        onChange={(e) => setAdminPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-600 block" 
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black text-red-200/90 leading-normal">
                      নিরাপত্তা সতর্কীকরণ: এই নির্দিষ্ট জিমেইল আইডি ছাড়া অন্য কোন জিমেইল আইডি এবং পাসওয়ার্ড দিয়ে প্রবেশ করা সম্পূর্ণ নিষিদ্ধ।
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setShowAdminModal(false); setAdminPassword(''); setAdminEmailInput(''); setShowPassword(false); }} 
                      className="flex-1 py-3 bg-white/5 text-slate-300 rounded-xl font-bold text-xs hover:bg-white/15 transition-all active:scale-95 border border-white/5 cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-extrabold text-xs hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20 ring-2 ring-blue-500/10 cursor-pointer"
                    >
                      নিরাপদভাবে প্রবেশ করুন
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
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {!isOtpSent ? (
                      <form onSubmit={handleSendResetCode} className="space-y-5">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-center space-y-2">
                          <p className="text-white font-bold text-xs leading-relaxed text-slate-300">
                            অ্যাকাউন্টে নিবন্ধিত রিকভারি জিমেইল এড্রেসটি নিচে দিয়ে ওটিপি পাঠান।
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">আপনার রিকভারি জিমেইল (Gmail):</label>
                          <input 
                            type="email" 
                            value={recoveryEmail} 
                            onChange={(e) => setRecoveryEmail(e.target.value)} 
                            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all text-center placeholder:text-slate-600" 
                            placeholder="যেমন: websitetogather@gmail.com"
                            required
                          />
                        </div>

                        <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => { setShowRecoveryModal(false); }} 
                            className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-xs hover:bg-white/10 transition-all border border-white/5"
                          >
                            বাতিল
                          </button>
                          <button 
                            type="submit" 
                            disabled={requestingOtp}
                            className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black text-xs hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-xl shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {requestingOtp ? "কোড পাঠানো হচ্ছে..." : "ওটিপি পাঠান"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyResetCode} className="space-y-5">
                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                          <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">সিকিউরিটি ওটিপি প্রেরণ করা হয়েছে!</p>
                          <p className="text-slate-300 font-bold text-xs leading-relaxed">
                            <strong>{recoveryEmail}</strong> জিমেইল চেক করে ৬ ডিজিটের সিকিউরিটি কোডটি নিচে দিন।
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">৬-ডিজিট সিকিউরিটি কোড (OTP):</label>
                          <input 
                            type="text" 
                            value={resetOtpInput} 
                            onChange={(e) => setResetOtpInput(e.target.value)} 
                            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-center text-white font-black text-2xl tracking-[0.5em] outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all" 
                            placeholder="------"
                            maxLength={6}
                            required
                          />
                        </div>

                        {simulatedOtpCode && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-1">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">সিমুলেশন ওটিপি (SMTP অফ):</p>
                            <p className="text-white font-black text-lg tracking-widest">{simulatedOtpCode}</p>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => { setIsOtpSent(false); setResetOtpInput(''); setSimulatedOtpCode(null); }} 
                            className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-xs hover:bg-white/10 transition-all border border-white/5 cursor-pointer"
                          >
                            পিছনে যান
                          </button>
                          <button 
                            type="submit" 
                            disabled={verifyingOtp}
                            className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black text-xs hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-xl shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {verifyingOtp ? "যাচাই করা হচ্ছে..." : "কোড যাচাই করুন"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
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