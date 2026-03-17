import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, Sparkles, Lock, Unlock, CheckCircle2, Download, Upload, ShieldCheck, LogOut, X, KeyRound, Fingerprint, AlertCircle, Library, Link as LinkIcon, Plus, ChevronDown, Trash2, Globe, Mail, ClipboardList, BarChart3, User, Eye, EyeOff } from 'lucide-react';
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
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPass, setShowConfirmPass] = useState(false);
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

  const IDBadge = ({ id }: { id: string }) => (
    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="text-[6px] font-mono text-slate-700 bg-slate-800/50 px-1 rounded border border-slate-700/30">
        #{id}
      </span>
    </div>
  );

  const getSubItemCls = (isActive: boolean) => `
    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold transition-all relative group
    ${isActive 
      ? 'bg-blue-500/10 text-blue-400 shadow-sm shadow-blue-500/5' 
      : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
  `;

  const getSubIconCls = (isActive: boolean) => `
    transition-transform duration-300 group-hover:scale-110
    ${isActive ? 'text-blue-400' : 'text-slate-600'}
  `;

  return (
    <>
      <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col relative z-50">
        <div 
          onClick={handleLogoClick}
          className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer group relative"
        >
          <IDBadge id="sidebar-logo" />
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-white font-black text-lg tracking-tight">ডিজিটাল লেজার</h1>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Smart Accounting</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            if (item.id === 'change_pass') {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowChangePasswordModal(true)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all relative group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <IDBadge id={item.badgeId} />
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </button>
              );
            }

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (item.isDropdown) {
                      if (item.id === 'entry') setIsEntryExpanded(!isEntryExpanded);
                      if (item.id === 'register') setIsRegisterExpanded(!isRegisterExpanded);
                      if (item.id === 'return') setIsReturnExpanded(!isReturnExpanded);
                      if (item.id === 'setup') setIsSetupExpanded(!isSetupExpanded);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all relative group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <IDBadge id={item.badgeId} />
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.isDropdown && (
                    <ChevronDown size={16} className={`transition-transform duration-300 ${(item.id === 'entry' && isEntryExpanded) || (item.id === 'register' && isRegisterExpanded) || (item.id === 'return' && isReturnExpanded) || (item.id === 'setup' && isSetupExpanded) ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Sub-menus */}
                {item.id === 'entry' && isEntryExpanded && (
                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    <button onClick={() => setActiveTab('entry', 'settlement')} className={getSubItemCls(entryModule === 'settlement')}>
                      <IDBadge id="sub-entry-settlement" />
                      <CheckCircle2 size={14} className={getSubIconCls(entryModule === 'settlement')} />
                      নিষ্পত্তি এন্ট্রি
                    </button>
                    <button onClick={() => setActiveTab('entry', 'correspondence')} className={getSubItemCls(entryModule === 'correspondence')}>
                      <IDBadge id="sub-entry-correspondence" />
                      <Mail size={14} className={getSubIconCls(entryModule === 'correspondence')} />
                      চিঠিপত্র এন্ট্রি
                    </button>
                  </div>
                )}

                {item.id === 'register' && isRegisterExpanded && (
                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    <button onClick={() => setActiveTab('register', 'settlement')} className={getSubItemCls(registerSubModule === 'settlement')}>
                      <IDBadge id="sub-reg-settlement" />
                      <ClipboardList size={14} className={getSubIconCls(registerSubModule === 'settlement')} />
                      নিষ্পত্তি রেজিস্টার
                    </button>
                    <button onClick={() => setActiveTab('register', 'correspondence')} className={getSubItemCls(registerSubModule === 'correspondence')}>
                      <IDBadge id="sub-reg-correspondence" />
                      <Mail size={14} className={getSubIconCls(registerSubModule === 'correspondence')} />
                      চিঠিপত্র রেজিস্টার
                    </button>
                  </div>
                )}

                {item.id === 'return' && isReturnExpanded && (
                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    <button 
                      onClick={() => setIsMonthlyExpanded(!isMonthlyExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 size={14} className="text-slate-600" />
                        মাসিক রিটার্ণ
                      </div>
                      <ChevronDown size={12} className={`transition-transform ${isMonthlyExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isMonthlyExpanded && (
                      <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                        <button 
                          onClick={() => setIsMonthlyCorrExpanded(!isMonthlyCorrExpanded)}
                          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-600 hover:text-slate-400 transition-all"
                        >
                          চিঠিপত্র রিটার্ণ
                          <ChevronDown size={10} className={`transition-transform ${isMonthlyCorrExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isMonthlyCorrExpanded && (
                          <div className="pl-4 space-y-1">
                            <button onClick={() => setActiveTab('return', null, 'মাসিক চিঠিপত্র নিষ্পত্তি')} className={getSubItemCls(reportType === 'মাসিক চিঠিপত্র নিষ্পত্তি')}>
                              নিষ্পত্তি
                            </button>
                            <button onClick={() => setActiveTab('return', null, 'মাসিক চিঠিপত্র অনলাইন')} className={getSubItemCls(reportType === 'মাসিক চিঠিপত্র অনলাইন')}>
                              অনলাইন
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      onClick={() => setIsQuarterlyExpanded(!isQuarterlyExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <PieChart size={14} className="text-slate-600" />
                        ত্রৈমাসিক রিটার্ণ
                      </div>
                      <ChevronDown size={12} className={`transition-transform ${isQuarterlyExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isQuarterlyExpanded && (
                      <div className="pl-4 space-y-1">
                        <button onClick={() => setActiveTab('return', null, 'ত্রৈমাসিক রিটার্ণ')} className={getSubItemCls(reportType === 'ত্রৈমাসিক রিটার্ণ')}>
                          রিপোর্ট দেখুন
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={() => setIsInitialBalanceExpanded(!isInitialBalanceExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={14} className="text-slate-600" />
                        জের সেটআপ
                      </div>
                      <ChevronDown size={12} className={`transition-transform ${isInitialBalanceExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isInitialBalanceExpanded && (
                      <div className="pl-4 space-y-1">
                        <button onClick={() => setActiveTab('return', null, 'জের সেটআপ')} className={getSubItemCls(reportType === 'জের সেটআপ')}>
                          জের এন্ট্রি
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {item.id === 'setup' && isSetupExpanded && (
                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    <button onClick={() => setActiveTab('setup')} className={getSubItemCls(activeTab === 'setup')}>
                      <IDBadge id="sub-setup-main" />
                      <ShieldCheck size={14} className={getSubIconCls(activeTab === 'setup')} />
                      মাস্টার সেটআপ
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-800">
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

        <div id="sidebar-footer" className="p-4 border-t border-slate-800 space-y-4 relative">
          <IDBadge id="sidebar-footer" />
          {isAdmin ? (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              লগআউট করুন
            </button>
          ) : (
            <div className="px-2 py-4 text-center">
              <div className="flex flex-col items-center gap-2 opacity-20 group hover:opacity-40 transition-opacity cursor-default">
                 <ShieldCheck size={24} className="text-slate-600" />
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Secure Node</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 space-y-6 animate-in zoom-in-95 duration-500 relative overflow-hidden group">
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
                      type={showAdminPass ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-2xl outline-none focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-slate-700 tracking-[0.5em]" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showAdminPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[1.5rem] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center">
                  <Fingerprint size={16} />
                </div>
                <div>
                  <h3 className="text-white font-black text-base">পাসওয়ার্ড উদ্ধার</h3>
                  <p className="text-blue-400/60 text-[8px] font-black uppercase tracking-widest">Security Recovery</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowRecoveryModal(false); setRecoveryAnswer(''); setRecoveredPassword(null); }}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {recoveredPassword ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2 animate-in zoom-in duration-300">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-slate-300 text-xs font-bold">আপনার পাসওয়ার্ড হলো:</p>
                  <p className="text-white text-2xl font-black tracking-widest">{recoveredPassword}</p>
                  <button 
                    onClick={() => { setShowRecoveryModal(false); setRecoveredPassword(null); setRecoveryAnswer(''); }}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-black text-xs mt-2"
                  >
                    বুঝেছি
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">নিরাপত্তা প্রশ্ন:</p>
                    <p className="text-white font-bold text-sm">{storedRecoveryQuestion}</p>
                  </div>

                  <form onSubmit={handleRecoverySubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-slate-300 text-[10px] font-bold ml-1">আপনার উত্তর:</p>
                      <input 
                        autoFocus
                        type="text" 
                        value={recoveryAnswer} 
                        onChange={(e) => setRecoveryAnswer(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-sm" 
                        placeholder="উত্তরটি এখানে লিখুন"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
                    >
                      যাচাই করুন
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[1.5rem] p-5 space-y-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <div>
                <h3 className="text-white font-black text-base">পাসওয়ার্ড পরিবর্তন</h3>
                <p className="text-blue-400/60 text-[8px] font-black uppercase tracking-widest">Update Security</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-slate-300 text-[10px] font-bold ml-1">নতুন পাসওয়ার্ড:</p>
                    <div className="relative">
                      <input 
                        type={showNewPass ? "text" : "password"} 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-xs" 
                        placeholder="কমপক্ষে ৩ অক্ষর"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-300 text-[10px] font-bold ml-1">নিশ্চিত করুন:</p>
                    <div className="relative">
                      <input 
                        type={showConfirmPass ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-xs" 
                        placeholder="আবার লিখুন"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <p className="text-blue-400 text-[8px] font-black uppercase tracking-widest mb-2">পাসওয়ার্ড উদ্ধারের জন্য সেটিংস</p>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-slate-300 text-[10px] font-bold ml-1">নিরাপত্তা প্রশ্ন:</p>
                      <input 
                        type="text" 
                        value={newQuestion} 
                        onChange={(e) => setNewQuestion(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-xs" 
                        placeholder="যেমন: আপনার প্রিয় রং কি?"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-300 text-[10px] font-bold ml-1">প্রশ্নের উত্তর:</p>
                      <input 
                        type="text" 
                        value={newAnswer} 
                        onChange={(e) => setNewAnswer(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-xs" 
                        placeholder="উত্তরটি এখানে লিখুন"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowChangePasswordModal(false)} 
                  className="flex-1 py-2 bg-white/5 text-slate-300 rounded-lg font-black text-[10px] hover:bg-white/10 transition-all"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
