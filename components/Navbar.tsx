import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, Camera,
  ChevronDown, Sparkles, Lock, Unlock, CheckCircle2, Download, 
  Upload, ShieldCheck, LogOut, X, KeyRound, Settings, 
  Calendar, ShieldAlert, Filter, Printer, Menu, Fingerprint, 
  Bell, Check, XCircle, UserCheck, BellRing, ArrowRight, Library, Plus,
  Mail, ClipboardList, AlertTriangle, Sun, Moon, MessageCircle
} from 'lucide-react';
import { SettlementEntry } from '../types';
import { toBengaliDigits } from '../utils/numberUtils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, subModule?: 'settlement' | 'correspondence', rType?: string, searchTerm?: string) => void;
  onDemoLoad: () => void;
  isLockedMode: boolean;
  setIsLockedMode: (val: boolean) => void;
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
  unassignedEntries?: any[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  setShowPendingOnly?: (val: boolean) => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  entryModule?: 'settlement' | 'correspondence' | null;
  registerSubModule?: 'settlement' | 'correspondence' | null;
  reportType?: string | null;
  contactLink?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onDemoLoad,
  isLockedMode,
  setIsLockedMode,
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
  unassignedEntries = [],
  onApprove,
  onReject,
  setShowPendingOnly,
  onOpenLogin,
  onLogout,
  isDarkMode = false,
  onToggleDarkMode,
  entryModule = null,
  registerSubModule = null,
  reportType = null,
  contactLink = 'https://facebook.com'
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showEntryDropdown, setShowEntryDropdown] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const entryDropdownRef = useRef<HTMLDivElement>(null);
  const registerDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const customNavButtons = [
    {
      id: 'landing',
      label: 'হোম',
      icon: Home,
      isActive: activeTab === 'landing',
      onClick: () => setActiveTab('landing')
    },
    {
      id: 'correspondence-entry',
      label: 'চিঠিপত্র এন্ট্রি',
      icon: Mail,
      isActive: activeTab === 'entry' && entryModule === 'correspondence',
      activeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-black',
      onClick: () => setActiveTab('entry', 'correspondence')
    },
    {
      id: 'settlement-entry',
      label: 'মীমাংসা এন্ট্রি',
      icon: Plus,
      isActive: activeTab === 'entry' && entryModule === 'settlement',
      activeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)] font-black',
      onClick: () => setActiveTab('entry', 'settlement')
    },
    {
      id: 'correspondence-register',
      label: 'চিঠিপত্র রেজি:',
      icon: Library,
      isActive: activeTab === 'register' && registerSubModule === 'correspondence',
      activeClass: 'bg-violet-500/15 text-violet-400 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-black',
      onClick: () => setActiveTab('register', 'correspondence')
    },
    {
      id: 'settlement-register',
      label: 'মীমাংসিত রেজি:',
      icon: CheckCircle2,
      isActive: activeTab === 'register' && registerSubModule === 'settlement',
      activeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] font-black',
      onClick: () => setActiveTab('register', 'settlement')
    },
    {
      id: 'paragraphs',
      label: 'অনুচ্ছেদ',
      icon: ClipboardList,
      isActive: activeTab === 'return' && reportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।',
      activeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-black',
      onClick: () => setActiveTab('return', undefined, 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।')
    },
    {
      id: 'contact',
      label: 'যোগাযোগ',
      icon: MessageCircle,
      isActive: false,
      activeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)] font-black',
      onClick: () => {
        if (contactLink) {
          window.open(contactLink, '_blank');
        }
      }
    }
  ];

  return (
    <nav className="sticky top-0 z-[9991] bg-slate-900 border-b border-slate-800 h-[45px] shadow-2xl no-print relative">
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className={`p-1 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white ${isSidebarOpen ? 'hidden lg:hidden' : 'flex'}`}><Menu size={16} /></button>
          
          {/* Custom Capsule/Pill Navigation Bar (Exact clone of user's requested style) */}
          <div className="hidden lg:flex items-center bg-zinc-950 border border-zinc-800/80 h-9 px-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none">
            {/* Left brand/Logo/Home Circle Button */}
            <button
              onClick={() => setActiveTab('landing')}
              className={`group relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95
                ${activeTab === 'landing'
                  ? 'bg-white text-zinc-950 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                  : 'bg-white hover:bg-slate-100 text-zinc-900 shadow-md'}`}
              title="হোম"
            >
              <Home size={13} className="stroke-[3]" />
            </button>

            {/* Vertical capsule separator */}
            <div className="h-4 w-[1px] bg-zinc-800/80 mx-2" />

            {/* Nav Link Buttons inside Capsule */}
            <div className="flex items-center gap-1">
              {customNavButtons.slice(1).map((btn) => {
                const IconComp = btn.icon;
                return (
                  <button
                    key={btn.id}
                    onClick={btn.onClick}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 border border-transparent
                      ${btn.isActive 
                        ? `${btn.activeClass}` 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
                  >
                    <IconComp size={11} className={`stroke-[2.5] ${btn.isActive ? '' : 'text-zinc-500'}`} />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-1 rounded-lg border transition-all relative flex items-center justify-center ${showNotifDropdown || (pendingEntries.length + unassignedEntries.length) > 0 ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {(pendingEntries.length + unassignedEntries.length) > 0 ? <BellRing size={16} className="animate-pulse" /> : <Bell size={16} />}
                {(pendingEntries.length + unassignedEntries.length) > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-slate-900 shadow-sm animate-notif-scale">
                    {toBengaliDigits(pendingEntries.length + unassignedEntries.length)}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-80 sm:w-96 bg-slate-900 border-2 border-amber-500/50 rounded-[2rem] shadow-2xl overflow-hidden z-[5010] animate-in fade-in slide-in-from-top-4 duration-300">
                  {/* Moderation Pending (Admin Only) */}
                  {pendingEntries.length > 0 && (
                    <div className="flex flex-col">
                      <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <ShieldAlert size={14} className="text-amber-500" /> মডোরেশন পেন্ডিং
                        </h4>
                        <span className="bg-amber-500 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          {toBengaliDigits(pendingEntries.length)} টি এন্ট্রি
                        </span>
                      </div>
                      <div className="max-h-[180px] overflow-y-auto no-scrollbar py-1 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
                        {pendingEntries.map((entry) => (
                          <div key={entry.id} className="px-5 py-3 hover:bg-slate-800/80 border-b border-slate-850 last:border-0 group transition-all">
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
                                  <Check size={14} strokeWidth={3} />
                                </button>
                                <button 
                                  onClick={() => onReject?.(entry.id)}
                                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                                  title="বাতিল করুন"
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unassigned Entries notifications */}
                  {unassignedEntries.length > 0 && (
                    <div className="flex flex-col">
                      <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle size={14} className="text-rose-400 animate-pulse" /> অনির্ধারিত চিঠিপত্র
                        </h4>
                        <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          {toBengaliDigits(unassignedEntries.length)} টি চিঠি
                        </span>
                      </div>
                      <div className="max-h-[220px] overflow-y-auto no-scrollbar py-2 bg-slate-900/50 backdrop-blur-xl">
                        {unassignedEntries.map((entry) => (
                          <div 
                            key={entry.id} 
                            onClick={() => {
                              setActiveTab('register', 'correspondence', undefined, entry.diaryNo);
                              setShowNotifDropdown(false);
                            }}
                            className="px-5 py-3 hover:bg-slate-800/80 border-b border-slate-800/30 last:border-0 group cursor-pointer transition-all flex flex-col gap-1 text-left"
                          >
                            <p className="text-[12px] font-black text-slate-100 truncate group-hover:text-rose-400 transition-colors">
                              {entry.description || "কোনো বিবরণ নেই"}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <span>ডায়েরি নং: {toBengaliDigits(entry.diaryNo || "")}</span>
                              <span className="text-blue-400">{entry.diaryDate}</span>
                            </div>
                            <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md w-fit mt-1">প্রাপক নির্ধারণ করুন</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-slate-950 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setActiveTab('register', 'correspondence', undefined, '__UNASSIGNED__');
                            setShowNotifDropdown(false);
                          }}
                          className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl font-black text-[10.5px] transition-all flex items-center justify-center gap-1.5"
                        >
                          সব অনির্ধারিত চিঠিপত্র দেখুন <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {pendingEntries.length === 0 && unassignedEntries.length === 0 && (
                    <div className="p-12 text-center space-y-4 opacity-40">
                      <UserCheck size={36} className="mx-auto text-slate-600" />
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">বর্তমানে কোনো অপেক্ষমান বা<br/>অনির্ধারিত এন্ট্রি নেই</p>
                    </div>
                  )}

                  {pendingEntries.length > 0 && (
                    <button 
                      onClick={() => { setActiveTab('archive'); setShowNotifDropdown(false); }}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all border-t border-slate-700 flex items-center justify-center gap-2"
                    >
                      বিস্তারিত তালিকা দেখুন <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cycle badge removed as per request */}
          
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 border border-slate-700 rounded-xl relative`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isLockedMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div> <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isLockedMode ? 'Locked' : 'Edit'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            
            {isAdmin && (
              <div className="relative" ref={toolsRef}>
                <button 
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)} 
                  className={`p-1 rounded-lg border transition-all ${showToolsDropdown ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                  title="সেটিংস"
                >
                  <Settings size={16} />
                </button>
                {showToolsDropdown && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 z-[5010]">
                    {/* System Tools (Admin Only) */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">সিস্টেম টুলস</span>
                      <button onClick={onExportSystem} className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-black text-[11px] text-slate-400 hover:text-white transition-all cursor-pointer">
                        <Download size={14} /> এক্সপোর্ট ডাটাবেস
                      </button>
                      <label className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-black text-[11px] text-slate-400 hover:text-white transition-all cursor-pointer">
                        <Upload size={14} /> ইম্পোর্ট ডাটাবেস
                        <input 
                          type="file" 
                          accept=".json" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onImportSystem?.(file);
                              e.target.value = '';
                              setShowToolsDropdown(false);
                            }
                          }}
                        />
                      </label>
                      <button 
                        onClick={() => {
                          setShowToolsDropdown(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl font-black text-[11px] hover:bg-red-550 hover:text-white transition-all active:scale-95"
                      >
                        <LogOut size={14} /> লগআউট করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1.5 bg-slate-800 text-white rounded-xl border border-slate-700"><Menu size={20} /></button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;