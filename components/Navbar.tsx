
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, 
  ChevronDown, Sparkles, Lock, Unlock, CheckCircle2, Download, 
  Upload, ShieldCheck, LogOut, X, KeyRound, Settings, 
  Calendar, ShieldAlert, Filter, Printer, Menu, Fingerprint, 
  Bell, Check, XCircle, UserCheck, BellRing, ArrowRight
} from 'lucide-react';
import { SettlementEntry } from '../types';
import { toBengaliDigits } from '../utils/numberUtils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDemoLoad: () => void;
  isLockedMode: boolean;
  setIsLockedMode: (val: boolean) => void;
  isLayoutEditable: boolean;
  setIsLayoutEditable: (val: boolean) => void;
  onExportSystem: () => void;
  onImportSystem: (file: File) => void;
  isAdmin: boolean;
  setIsAdmin: (status: boolean) => void;
  cycleLabel: string;
  showRegisterFilters: boolean;
  setShowRegisterFilters: (val: boolean) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  pendingEntries?: SettlementEntry[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  setShowPendingOnly?: (val: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onDemoLoad,
  isLockedMode,
  setIsLockedMode,
  isLayoutEditable,
  setIsLayoutEditable,
  onExportSystem,
  onImportSystem,
  isAdmin,
  setIsAdmin,
  cycleLabel,
  showRegisterFilters,
  setShowRegisterFilters,
  onToggleSidebar,
  isSidebarOpen,
  pendingEntries = [],
  onApprove,
  onReject,
  setShowPendingOnly
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowToolsDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'landing', label: 'হোম', icon: Home },
    { id: 'register', label: 'রেজিস্টার', icon: ListFilter },
    { id: 'return', label: 'রিটার্ণ/সারাংশ', icon: PieChart },
    { id: 'voting', label: 'ভোট', icon: Fingerprint },
  ];

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

  return (
    <nav className="sticky top-0 z-[200] bg-slate-900 border-b border-slate-800 h-20 shadow-2xl no-print relative">
      <IDBadge id="premium-navbar-main" />
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onToggleSidebar} className={`p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white ${isSidebarOpen ? 'hidden lg:hidden' : 'flex'}`}><Menu size={24} /></button>
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <React.Fragment key={item.id}>
                <button onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-y-[-1px]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <item.icon size={18} /> {item.label}
                </button>
                {item.id === 'landing' && (
                  <div className="relative group mx-2">
                    <button 
                      onClick={() => setActiveTab('entry')} 
                      className={`hidden lg:flex items-center gap-2.5 px-6 h-12 bg-white text-slate-900 rounded-xl font-black text-sm shadow-xl hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all relative ${activeTab === 'entry' ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <IDBadge id="nav-quick-entry" /> 
                      <FilePlus2 size={20} className="text-blue-600" /> 
                      নতুন তথ্য এন্ট্রি
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2.5 rounded-xl border transition-all relative flex items-center justify-center ${showNotifDropdown || pendingEntries.length > 0 ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {pendingEntries.length > 0 ? <BellRing size={20} className="animate-pulse" /> : <Bell size={20} />}
                {pendingEntries.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-notif-scale">
                    {toBengaliDigits(pendingEntries.length)}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-80 bg-slate-900 border-2 border-amber-500/50 rounded-[2rem] shadow-2xl overflow-hidden z-[400] animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={14} className="text-amber-500" /> মডোরেশন পেন্ডিং
                    </h4>
                    <span className="bg-amber-500 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
                      {toBengaliDigits(pendingEntries.length)} টি এন্ট্রি
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto no-scrollbar py-2 bg-slate-900/50 backdrop-blur-xl">
                    {pendingEntries.length > 0 ? pendingEntries.map((entry) => (
                      <div key={entry.id} className="px-5 py-4 hover:bg-slate-800/80 border-b border-slate-800 last:border-0 group transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-slate-100 truncate group-hover:text-amber-400 transition-colors">{entry.entityName}</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{entry.branchName}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[8px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">{entry.paraType}</span>
                              <span className="text-[9px] text-blue-400 font-bold">{toBengaliDigits(entry.auditYear)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => onApprove?.(entry.id)}
                              className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20"
                              title="অনুমোদন দিন"
                            >
                              <Check size={16} strokeWidth={3} />
                            </button>
                            <button 
                              onClick={() => onReject?.(entry.id)}
                              className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                              title="বাতিল করুন"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center space-y-4 opacity-40">
                        <UserCheck size={36} className="mx-auto text-slate-600" />
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">বর্তমানে কোনো অপেক্ষমান<br/>এন্ট্রি নেই</p>
                      </div>
                    )}
                  </div>
                  {pendingEntries.length > 0 && (
                    <button 
                      onClick={() => { setActiveTab('register'); setShowPendingOnly?.(true); setShowNotifDropdown(false); }}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all border-t border-slate-700 flex items-center justify-center gap-2"
                    >
                      বিস্তারিত তালিকা দেখুন <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl relative">
            <IDBadge id="nav-cycle-badge" /> <Calendar size={16} className="text-blue-400" /> <span className="text-xs font-black text-slate-300 tracking-tight">{cycleLabel}</span>
          </div>
          
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl relative`}>
                <IDBadge id="nav-locked-status" /> <div className={`w-2 h-2 rounded-full ${isLockedMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div> <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isLockedMode ? 'Locked' : 'Edit'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {activeTab === 'register' && <button onClick={() => setShowRegisterFilters(!showRegisterFilters)} className={`p-2.5 rounded-xl border transition-all ${showRegisterFilters ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}><Filter size={20} /></button>}
            
            {isAdmin && (
              <div className="relative" ref={toolsRef}>
                <button onClick={() => setShowToolsDropdown(!showToolsDropdown)} className={`p-2.5 rounded-xl border transition-all ${showToolsDropdown ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}><Settings size={22} /></button>
                {showToolsDropdown && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 z-[300]">
                    <div className="space-y-3 animate-in fade-in duration-500">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">লেআউট টুলস</span>
                      <button onClick={() => setIsLayoutEditable(!isLayoutEditable)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-black text-[11px] transition-all border relative ${isLayoutEditable ? 'bg-amber-500/10 border-amber-400/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                        <IDBadge id="dropdown-layout-toggle" /> {isLayoutEditable ? <Unlock size={14} /> : <Lock size={14} />} লেআউট এডিট (ID ব্যাজ)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2.5 bg-slate-800 text-white rounded-xl border border-slate-700"><Menu size={24} /></button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
