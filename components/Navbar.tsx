import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, 
  ChevronDown, Sparkles, Lock, Unlock, CheckCircle2, Download, 
  Upload, ShieldCheck, LogOut, X, KeyRound, Settings, 
  Calendar, ShieldAlert, Filter, Printer, Menu, Fingerprint, 
  Bell, Check, XCircle, UserCheck, BellRing, ArrowRight, Library, Plus,
  Mail, ClipboardList, BarChart3, Globe, ChevronRight
} from 'lucide-react';
import { SettlementEntry } from '../types';
import { toBengaliDigits } from '../utils/numberUtils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, subModule?: any, reportType?: string) => void;
  isAdmin: boolean;
  pendingEntries: any[];
  showRegisterFilters: boolean;
  setShowRegisterFilters: (val: boolean) => void;
  onLogout?: () => void;
  isLockedMode?: boolean;
  setIsLockedMode?: (val: boolean) => void;
  isLayoutEditable?: boolean;
  setIsLayoutEditable?: (val: boolean) => void;
  setIsAdmin?: (val: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  setShowPendingOnly?: (val: boolean) => void;
  onPrint?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isAdmin,
  pendingEntries = [],
  showRegisterFilters,
  setShowRegisterFilters,
  onLogout,
  isLockedMode = true,
  setIsLockedMode = () => {},
  isLayoutEditable = false,
  setIsLayoutEditable = () => {},
  setIsAdmin = () => {},
  onApprove = () => {},
  onReject = () => {},
  setShowPendingOnly = () => {},
  onPrint = () => window.print()
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null);
  const [activeSubSubDropdown, setActiveSubSubDropdown] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  const navRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const logoClickCount = useRef(0);
  const lastLogoClickTime = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setActiveSubDropdown(null);
        setActiveSubSubDropdown(null);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickTime.current > 2000) logoClickCount.current = 0;
    logoClickCount.current += 1;
    lastLogoClickTime.current = now;
    if (logoClickCount.current === 3) {
      logoClickCount.current = 0;
      setShowAdminModal(true);
    }
  };

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPassword === '8009JAma@') {
      setIsAdmin(true);
      localStorage.setItem('ledger_admin_access_v1', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
      setActiveTab('admin-dashboard');
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[9999] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  const menuItems = [
    { 
      id: 'entry', 
      label: 'নতুন এন্ট্রি', 
      icon: FilePlus2,
      subItems: [
        { id: 'correspondence', label: '১. চিঠিপত্র এন্ট্রি', icon: Mail, type: 'entry' },
        { id: 'settlement', label: '২. মীমাংসা এন্ট্রি', icon: ClipboardList, type: 'entry' },
      ]
    },
    { 
      id: 'register', 
      label: 'রেজিস্টার', 
      icon: ListFilter,
      subItems: [
        { id: 'correspondence', label: '১. চিঠিপত্র রেজি:', icon: Mail, type: 'register' },
        { id: 'settlement', label: '২. মীমাংসিত রেজি:', icon: ClipboardList, type: 'register' },
      ]
    },
  ];

  const [importantLinks, setImportantLinks] = useState<{name: string, url: string}[]>([]);

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

  return (
    <nav className="sticky top-0 z-[5000] bg-[#005a9c] h-14 shadow-xl no-print select-none" ref={navRef}>
      <IDBadge id="premium-navbar-main" />
      <div className="max-w-[1600px] mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center h-full">
          {/* Home Icon */}
          <button 
            onClick={() => setActiveTab('landing')}
            className={`h-full px-4 flex items-center justify-center transition-colors ${activeTab === 'landing' ? 'bg-[#003366]' : 'hover:bg-[#004a80]'}`}
          >
            <Home size={20} className="text-white" />
          </button>

          {/* Main Menu Items */}
          <div className="flex items-center h-full">
            {menuItems.map((item) => (
              <div 
                key={item.id} 
                className="relative h-full group"
                onMouseEnter={() => setActiveDropdown(item.id)}
                onMouseLeave={() => {
                  setActiveDropdown(null);
                  setActiveSubDropdown(null);
                  setActiveSubSubDropdown(null);
                }}
              >
                <button 
                  onClick={() => {
                    if (!item.subItems) setActiveTab(item.id);
                  }}
                  className={`h-full px-4 flex items-center gap-1.5 text-white font-bold text-[13px] uppercase tracking-wide transition-colors ${activeTab === item.id || activeDropdown === item.id ? 'bg-[#003366]' : 'hover:bg-[#004a80]'}`}
                >
                  {item.label}
                  {item.subItems && <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : ''}`} />}
                </button>

                {/* Dropdown Menu */}
                {(item.subItems || item.id === 'links') && activeDropdown === item.id && (
                  <div className="absolute top-full left-0 w-56 bg-white shadow-2xl border-t-2 border-[#005a9c] animate-in fade-in slide-in-from-top-1 duration-200">
                    {item.id === 'links' ? (
                      <div className="p-1">
                        {importantLinks.map((link, idx) => (
                          <div key={idx} className="group/link flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 text-[12px] font-bold text-slate-700 hover:text-[#005a9c] truncate"
                            >
                              {link.name}
                            </a>
                            {isAdmin && (
                              <button 
                                onClick={(e) => handleRemoveLink(e, idx)}
                                className="opacity-0 group-hover/link:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        {isAdmin && (
                          <button 
                            onClick={handleAddLink}
                            className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-black text-blue-600 hover:bg-blue-50 transition-all border-t border-slate-100 mt-1"
                          >
                            <Plus size={14} /> লিঙ্ক যুক্ত করুন
                          </button>
                        )}
                      </div>
                    ) : (
                      item.subItems?.map((sub: any) => {
                        if (sub.adminOnly && !isAdmin) return null;
                        return (
                          <div 
                            key={sub.id} 
                            className="relative group/sub"
                            onMouseEnter={() => sub.hasSub && setActiveSubDropdown(sub.id)}
                          >
                            <button 
                              onClick={() => {
                                if (!sub.hasSub) {
                                  if (sub.type === 'entry') setActiveTab('entry', sub.id);
                                  else if (sub.type === 'register') setActiveTab('register', sub.id);
                                  else if (sub.reportType) setActiveTab('return', null, sub.reportType);
                                  setActiveDropdown(null);
                                }
                              }}
                              className={`w-full px-4 py-3 text-left text-[13px] font-bold flex items-center justify-between transition-colors ${activeSubDropdown === sub.id ? 'bg-slate-100 text-[#005a9c]' : 'text-slate-700 hover:bg-slate-50 hover:text-[#005a9c]'}`}
                            >
                              <span className="flex items-center gap-2">
                                {sub.icon && <sub.icon size={14} />}
                                {sub.label}
                              </span>
                              {sub.hasSub && <ChevronRight size={14} />}
                            </button>

                            {/* Sub-Dropdown Menu */}
                            {sub.hasSub && activeSubDropdown === sub.id && (
                              <div className="absolute top-0 left-full w-56 bg-white shadow-2xl border-l-2 border-[#005a9c] animate-in fade-in slide-in-from-left-1 duration-200">
                                {sub.subSubItems?.map((ss: any) => (
                                  <div 
                                    key={ss.id} 
                                    className="relative group/ss"
                                    onMouseEnter={() => ss.hasSub && setActiveSubSubDropdown(ss.id)}
                                  >
                                    <button 
                                      onClick={() => {
                                        if (!ss.hasSub) {
                                          if (ss.reportType) setActiveTab('return', null, ss.reportType);
                                          setActiveDropdown(null);
                                          setActiveSubDropdown(null);
                                          setActiveSubSubDropdown(null);
                                        }
                                      }}
                                      className="w-full px-4 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#005a9c] flex items-center justify-between transition-colors"
                                    >
                                      {ss.label}
                                      {ss.hasSub && <ChevronRight size={14} />}
                                    </button>

                                    {/* Sub-Sub-Dropdown Menu */}
                                    {ss.hasSub && activeSubSubDropdown === ss.id && (
                                      <div className="absolute top-0 left-full w-56 bg-white shadow-2xl border-l-2 border-[#005a9c] animate-in fade-in slide-in-from-left-1 duration-200">
                                        {ss.subSubSubItems?.map((sss: any) => (
                                          <button 
                                            key={sss.id} 
                                            onClick={() => {
                                              if (sss.reportType) setActiveTab('return', null, sss.reportType);
                                              setActiveDropdown(null);
                                              setActiveSubDropdown(null);
                                              setActiveSubSubDropdown(null);
                                            }}
                                            className="w-full px-4 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#005a9c] transition-colors"
                                          >
                                            {sss.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter Toggle Button */}
          {(activeTab === 'register' || activeTab === 'return') && (
            <button 
              onClick={() => setShowRegisterFilters(!showRegisterFilters)}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${showRegisterFilters ? 'bg-amber-500 text-white shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10 border border-white/20'}`}
              title="ফিল্টার অপশন"
            >
              <Filter size={20} />
            </button>
          )}

          {/* Print Button */}
          {(activeTab === 'register' || activeTab === 'return') && (
            <button 
              onClick={onPrint}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/20"
              title="প্রিন্ট করুন"
            >
              <Printer size={20} />
            </button>
          )}

          {/* Admin Notifications */}
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2 rounded-lg transition-all relative flex items-center justify-center ${showNotifDropdown || pendingEntries.length > 0 ? 'bg-amber-500 text-white shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                {pendingEntries.length > 0 ? <BellRing size={20} className="animate-pulse" /> : <Bell size={20} />}
                {pendingEntries.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#005a9c]">
                    {toBengaliDigits(pendingEntries.length)}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[5010] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={14} className="text-amber-500" /> মডোরেশন পেন্ডিং
                    </h4>
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      {toBengaliDigits(pendingEntries.length)} টি
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto no-scrollbar py-1">
                    {pendingEntries.length > 0 ? pendingEntries.map((entry) => (
                      <div key={entry.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 group transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-slate-900 truncate">{entry.entityName}</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate">{entry.branchName}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => onApprove?.(entry.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Check size={14} strokeWidth={3} /></button>
                            <button onClick={() => onReject?.(entry.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><XCircle size={14} /></button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center opacity-40">
                        <UserCheck size={32} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">কোনো অপেক্ষমান এন্ট্রি নেই</p>
                      </div>
                    )}
                  </div>
                  {pendingEntries.length > 0 && (
                    <button 
                      onClick={() => { setActiveTab('register'); setShowPendingOnly?.(true); setShowNotifDropdown(false); }}
                      className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-[#005a9c] text-[10px] font-black uppercase tracking-widest transition-all border-t border-slate-100 flex items-center justify-center gap-2"
                    >
                      বিস্তারিত দেখুন <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin Tools */}
          {isAdmin && (
            <div className="relative group">
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <Settings size={20} />
              </button>
              <div className="absolute top-full right-0 w-56 bg-white shadow-2xl border-t-2 border-[#005a9c] hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="p-2 space-y-1">
                  <button onClick={() => setIsLayoutEditable(!isLayoutEditable)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-[12px] transition-all ${isLayoutEditable ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {isLayoutEditable ? <Unlock size={14} /> : <Lock size={14} />} লেআউট এডিট
                  </button>
                  <button onClick={() => setIsLockedMode(!isLockedMode)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-[12px] transition-all ${!isLockedMode ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {isLockedMode ? <Lock size={14} /> : <Unlock size={14} />} এডিট মোড: {isLockedMode ? 'বন্ধ' : 'চালু'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audit Register Logo/Login Button */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 group"
          >
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Library size={18} className="text-white" />
            </div>
            <span className="font-black text-[14px] tracking-tight">অডিট রেজিস্টার</span>
          </button>
        </div>
      </div>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-black text-lg flex items-center gap-2"><KeyRound size={20} className="text-blue-600" /> সিকিউরিটি এক্সেস</h3>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <input autoFocus type="password" placeholder="পাসওয়ার্ড দিন" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-black text-center text-lg outline-none focus:border-blue-500 transition-all" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdminModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-200">বাতিল</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20">প্রবেশ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
