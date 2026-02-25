import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, Sparkles, Lock, Unlock, CheckCircle2, Download, Upload, ShieldCheck, LogOut, X, KeyRound, Fingerprint, AlertCircle, Library, Link as LinkIcon, Plus, ChevronDown, Trash2, Globe, Mail, ClipboardList, BarChart3 } from 'lucide-react';
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
  pendingCount = 0,
  entryModule,
  registerSubModule,
  reportType
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  // --- Sub-menu States ---
  const [isEntryExpanded, setIsEntryExpanded] = useState(false);
  const [isRegisterExpanded, setIsRegisterExpanded] = useState(false);
  const [isReturnExpanded, setIsReturnExpanded] = useState(false);
  const [isMonthlyExpanded, setIsMonthlyExpanded] = useState(false);
  const [isMonthlyCorrExpanded, setIsMonthlyCorrExpanded] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);

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
          }
        }
        if (reportType.includes('জের সেটআপ')) {
          setIsSetupExpanded(true);
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
    if (adminPassword === '123') {
      setIsAdmin(true);
      localStorage.setItem('ledger_admin_access_v1', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  const menuItems = [
    { id: 'landing', label: 'হোম', icon: Home, badgeId: 'side-nav-home' },
    { id: 'entry', label: 'নতুন এন্ট্রি', icon: FilePlus2, badgeId: 'side-nav-entry', isDropdown: true },
    { id: 'register', label: 'রেজিস্টার', icon: ListFilter, badgeId: 'side-nav-register', isDropdown: true },
    { id: 'return', label: 'রিটার্ণ ও সারাংশ', icon: PieChart, badgeId: 'side-nav-return', isDropdown: true },
    { id: 'archive', label: 'ডকুমেন্ট লাইব্রেরি', icon: Library, badgeId: 'side-nav-archive' },
    { id: 'voting', label: 'গোপন ব্যালট', icon: Fingerprint, badgeId: 'side-nav-voting' },
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
      <div id="sidebar-container" className="w-48 bg-slate-900 h-screen text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl overflow-hidden relative">
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
            <React.Fragment key={item.id}>
              <button 
                id={item.badgeId} 
                onClick={() => {
                  if (item.id === 'entry') {
                    setIsEntryExpanded(!isEntryExpanded);
                  } else if (item.id === 'register') {
                    setIsRegisterExpanded(!isRegisterExpanded);
                  } else if (item.id === 'return') {
                    setIsReturnExpanded(!isReturnExpanded);
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
                {item.isDropdown && <ChevronDown size={14} className={`transition-transform duration-300 ${(item.id === 'entry' && isEntryExpanded) || (item.id === 'register' && isRegisterExpanded) || (item.id === 'return' && isReturnExpanded) ? 'rotate-180' : ''}`} />}
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
                    <span>২. অনুচ্ছেদ এন্ট্রি</span>
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
                          <button 
                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।')}
                            className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                          >
                            ১. ঢাকা
                          </button>
                          <button 
                            onClick={() => setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।')}
                            className={`w-full text-left px-3 py-1.5 text-[10px] font-black transition-all border-l ml-1 rounded-r-md ${reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-500 hover:text-white border-slate-700'}`}
                          >
                            ২. ডিডি স্যার
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

                  {/* ২. ত্রৈমাসিক */}
                  <button 
                    onClick={() => setActiveTab('return', null, 'ত্রৈমাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                    className={getSubItemCls(reportType === 'ত্রৈমাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${reportType === 'ত্রৈমাসিক রিটার্ণ: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।' ? 'bg-white' : 'bg-amber-500'}`}></div>
                    <span>২. ত্রৈমাসিক</span>
                  </button>

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

                  {/* Setup Mode for Admin only */}
                  {isAdmin && (
                    <button 
                      onClick={() => setIsSetupExpanded(!isSetupExpanded)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[11px] font-black transition-all border-t border-slate-800 mt-2 ${reportType?.includes('জের সেটআপ') ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Lock size={12} className={reportType?.includes('জের সেটআপ') ? 'text-blue-400' : 'text-slate-600'} />
                        <span>প্রারম্ভিক জের সেটআপ</span>
                      </div>
                      <ChevronDown size={12} className={`transition-transform duration-300 ${isSetupExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {isAdmin && isSetupExpanded && (
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
                </div>
              )}
            </React.Fragment>
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
        <div id="sidebar-footer" className="p-4 border-t border-slate-800 space-y-4 relative">
          <IDBadge id="sidebar-footer" />
          {!isAdmin && (
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-sm bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 text-blue-500 rounded-xl flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <h3 className="text-white font-black text-lg">সিকিউরিটি এক্সেস</h3>
              </div>
              <button onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <p className="text-slate-400 text-sm font-bold leading-relaxed">মালিকের সিক্রেট পাসওয়ার্ড দিন:</p>
            <form onSubmit={handleAdminSubmit} className="space-y-6">
              <input autoFocus type="password" placeholder="••••••••" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white font-black text-center text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600" />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-black text-sm hover:bg-slate-700 transition-all active:scale-95">বাতিল</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20">প্রবেশ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
