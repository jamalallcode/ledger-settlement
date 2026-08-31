import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, Camera,
  ChevronDown, Sparkles, Lock, Unlock, CheckCircle2, Download, 
  Upload, ShieldCheck, LogOut, X, KeyRound, Settings, 
  Calendar, ShieldAlert, Filter, Printer, Menu, Fingerprint, 
  Bell, Check, XCircle, UserCheck, BellRing, ArrowRight, Library, Plus,
  Mail, ClipboardList, AlertTriangle, Sun, Moon, Link2, Send,
  ChevronLeft, ExternalLink, Users, Scale, BarChart3, Database, FileText
} from 'lucide-react';
import { SettlementEntry } from '../types';
import { toBengaliDigits } from '../utils/numberUtils';
import { SavedLinksModal, SavedLink, getSavedLinksFromStorage } from './SavedLinksModal';

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
  onGoBack?: () => void;
  hasHistory?: boolean;
  onOpenChangePassword?: () => void;
  moduleVisibility?: any;
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
  contactLink = 'https://wa.me/8801700000000',
  onGoBack,
  hasHistory = false,
  onOpenChangePassword,
  moduleVisibility
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showEntryDropdown, setShowEntryDropdown] = useState(false);
  const [isEntryHovered, setIsEntryHovered] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [isLinksHovered, setIsLinksHovered] = useState(false);
  const [savedLinksList, setSavedLinksList] = useState<SavedLink[]>([]);
  
  const adminClickCount = useRef(0);
  const lastAdminClickTime = useRef(0);

  const handleAdminLoginClick = () => {
    const now = Date.now();
    if (now - lastAdminClickTime.current < 2500) {
      adminClickCount.current += 1;
    } else {
      adminClickCount.current = 1;
    }
    lastAdminClickTime.current = now;

    if (adminClickCount.current >= 20) {
      adminClickCount.current = 0;
      if (onOpenLogin) onOpenLogin();
      setIsMobileMenuOpen(false);
    }
  };
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const entryDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLinksMouseEnter = () => {
    setSavedLinksList(getSavedLinksFromStorage());
    setIsLinksHovered(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowToolsDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (entryDropdownRef.current && !entryDropdownRef.current.contains(e.target as Node)) {
        setShowEntryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isEntryActive = activeTab === 'entry';
  const isArchiveActive = activeTab === 'archive';

  return (
    <nav className="sticky top-0 z-[9991] bg-slate-900 border-b border-slate-800 h-[45px] shadow-2xl no-print relative">
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className={`p-1 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white ${isSidebarOpen ? 'hidden lg:hidden' : 'flex'}`}><Menu size={16} /></button>
          
          {hasHistory && onGoBack && activeTab !== 'landing' && activeTab !== 'dashboard' && (
            <button 
              id="navbar-back-btn"
              onClick={onGoBack} 
              className="flex items-center justify-center w-7 h-7 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-300 animate-in zoom-in-95 shrink-0"
              title="পূর্ববর্তী পেজে ফিরে যান"
            >
              <ChevronLeft size={14} strokeWidth={3} />
            </button>
          )}
          
          {/* Custom Capsule/Pill Navigation Bar */}
          <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 h-9 px-1.5 rounded-full shadow-lg select-none">
            {/* Left brand/Logo/Home Circle Button */}
            <button
              onClick={() => setActiveTab('landing')}
              className={`group relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95
                ${activeTab === 'landing'
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-md'}`}
              title="হোম"
            >
              <Home size={13} className="stroke-[3]" />
            </button>

            {/* Vertical capsule separator */}
            <div className="h-4 w-[1px] bg-slate-800 mx-2" />

            {/* Nav Link Buttons inside Capsule */}
            <div className="flex items-center gap-1">
              {/* 1. নতুন এন্ট্রি (Dropdown) */}
              {(isAdmin || moduleVisibility?.entry !== false) && (
                <div 
                  ref={entryDropdownRef}
                  className="relative"
                  onMouseEnter={() => setIsEntryHovered(true)}
                  onMouseLeave={() => setIsEntryHovered(false)}
                >
                  <button
                    onClick={() => setShowEntryDropdown(!showEntryDropdown)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5 border border-transparent
                      ${isEntryActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-black'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}`}
                  >
                    <FilePlus2 size={12} className={`stroke-[2.5] ${isEntryActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>নতুন এন্ট্রি</span>
                    <ChevronDown size={10} className={`transition-transform duration-200 ${isEntryHovered || showEntryDropdown ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
                  </button>

                  {/* Entry Dropdown Menu */}
                  {(isEntryHovered || showEntryDropdown) && (
                    <div className="absolute top-full left-0 pt-[10px] z-[10000]">
                      <div className="w-48 bg-slate-900 border border-slate-800 rounded-none shadow-2xl p-1.5 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-xl">
                        <button
                          onClick={() => {
                            setActiveTab('entry', 'correspondence');
                            setShowEntryDropdown(false);
                            setIsEntryHovered(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-none transition-all text-left ${
                            activeTab === 'entry' && entryModule === 'correspondence'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <Mail size={13} className="text-emerald-400" />
                          <span>চিঠিপত্র এন্ট্রি</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('entry', 'settlement');
                            setShowEntryDropdown(false);
                            setIsEntryHovered(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-none transition-all text-left mt-0.5 ${
                            activeTab === 'entry' && entryModule === 'settlement'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <Plus size={13} className="text-blue-400" />
                          <span>মীমাংসা এন্ট্রি</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. অডিট ক্রাইটেরিয়া */}
              {(isAdmin || moduleVisibility?.archive !== false) && (
                <button
                  onClick={() => setActiveTab('archive')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5 border border-transparent
                    ${isArchiveActive
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}`}
                >
                  <Library size={12} className={`stroke-[2.5] ${isArchiveActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>অডিট ক্রাইটেরিয়া</span>
                </button>
              )}
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
                <div className="absolute top-[calc(100%+12px)] right-0 w-80 sm:w-96 bg-slate-900 border-2 border-amber-500/50 rounded-none shadow-2xl overflow-hidden z-[5010] animate-in fade-in slide-in-from-top-4 duration-300">
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
                        {pendingEntries.map((entry) => {
                          const isCorrespondence = 'diaryNo' in entry || 'letterNo' in entry;
                          const title = isCorrespondence 
                            ? (entry.description || entry.subject || "নতুন চিঠিপত্র এন্ট্রি")
                            : (entry.entityName || "নতুন মীমাংসা এন্ট্রি");
                          const subtitle = isCorrespondence
                            ? `ডায়েরি নং- ${toBengaliDigits(entry.diaryNo || "")} ${entry.diaryDate ? `(${entry.diaryDate})` : ''}`
                            : `${entry.branchName || ''} ${entry.auditYear ? `(${toBengaliDigits(entry.auditYear)})` : ''}`;

                          return (
                            <div 
                              key={entry.id} 
                              onClick={() => {
                                setActiveTab('register', isCorrespondence ? 'correspondence' : 'settlement');
                                setShowPendingOnly(true);
                                setShowNotifDropdown(false);
                              }}
                              className="px-5 py-3 hover:bg-slate-800/80 border-b border-slate-850 last:border-0 group transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-black text-slate-100 truncate group-hover:text-amber-400 transition-colors">{title}</p>
                                  <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{subtitle}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[8px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">
                                      {entry.paraType || (isCorrespondence ? "চিঠিপত্র" : "মীমাংসা")}
                                    </span>
                                    <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                      অপেক্ষমাণ এন্ট্রি
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={() => onApprove?.(entry.id)}
                                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20 cursor-pointer"
                                    title="অনুমোদন দিন"
                                  >
                                    <Check size={14} strokeWidth={3} />
                                  </button>
                                  <button 
                                    onClick={() => onReject?.(entry.id)}
                                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20 cursor-pointer"
                                    title="বাতিল করুন"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                              <span>ডায়েরি নং- {toBengaliDigits(entry.diaryNo || "")}</span>
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
                      onClick={() => { 
                        const firstPending = pendingEntries[0];
                        const isCorr = firstPending && ('diaryNo' in firstPending || 'letterNo' in firstPending);
                        setActiveTab('register', isCorr ? 'correspondence' : 'settlement');
                        setShowPendingOnly(true);
                        setShowNotifDropdown(false); 
                      }}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all border-t border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
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
                  <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-slate-900 border border-slate-800 rounded-none shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 z-[5010]">
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
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className={`lg:hidden p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                isMobileMenuOpen 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
              }`}
              title="মেনু খুলুন"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[45px] max-h-[calc(100vh-45px)] overflow-y-auto bg-slate-900/98 backdrop-blur-2xl border-b border-slate-800 p-4 shadow-2xl z-[9990] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          
          {/* 1. মূল ন্যাভিগেশন */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">মূল মেনু</span>
            <div className={`grid ${
              ((isAdmin || moduleVisibility?.archive !== false) && (isAdmin || moduleVisibility?.links !== false))
                ? 'grid-cols-3'
                : ((isAdmin || moduleVisibility?.archive !== false) || (isAdmin || moduleVisibility?.links !== false))
                ? 'grid-cols-2'
                : 'grid-cols-1'
            } gap-2`}>
              <button
                onClick={() => {
                  setActiveTab('landing');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                  activeTab === 'landing'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                }`}
              >
                <Home size={16} />
                <span>হোম</span>
              </button>

              {(isAdmin || moduleVisibility?.archive !== false) && (
                <button
                  onClick={() => {
                    setActiveTab('archive');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 border transition-all ${
                    isArchiveActive
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-black'
                      : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                  }`}
                >
                  <Library size={16} />
                  <span className="truncate">ক্রাইটেরিয়া</span>
                </button>
              )}

              {(isAdmin || moduleVisibility?.links !== false) && (
                <button
                  onClick={() => {
                    setShowLinksModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 border transition-all bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-700"
                >
                  <Link2 size={16} />
                  <span>লিংকসমূহ</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. নতুন এন্ট্রি ও রেজিস্টার */}
          {((isAdmin || moduleVisibility?.entry !== false) || (isAdmin || moduleVisibility?.register !== false)) && (
            <div className={`grid ${
              ((isAdmin || moduleVisibility?.entry !== false) && (isAdmin || moduleVisibility?.register !== false))
                ? 'grid-cols-2'
                : 'grid-cols-1'
            } gap-3`}>
              {/* নতুন এন্ট্রি */}
              {(isAdmin || moduleVisibility?.entry !== false) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block px-1 flex items-center gap-1">
                    <FilePlus2 size={11} /> নতুন এন্ট্রি
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setActiveTab('entry', 'correspondence');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-[11px] font-bold flex items-center gap-2 border transition-all text-left ${
                        activeTab === 'entry' && entryModule === 'correspondence'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700'
                      }`}
                    >
                      <Mail size={13} className="text-emerald-400 shrink-0" />
                      <span>চিঠিপত্র এন্ট্রি</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('entry', 'settlement');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-[11px] font-bold flex items-center gap-2 border transition-all text-left ${
                        activeTab === 'entry' && entryModule === 'settlement'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-black'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700'
                      }`}
                    >
                      <Plus size={13} className="text-blue-400 shrink-0" />
                      <span>মীমাংসা এন্ট্রি</span>
                    </button>
                  </div>
                </div>
              )}

              {/* রেজিস্টারসমূহ */}
              {(isAdmin || moduleVisibility?.register !== false) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block px-1 flex items-center gap-1">
                    <ListFilter size={11} /> রেজিস্টারসমূহ
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setActiveTab('register', 'correspondence');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-[11px] font-bold flex items-center gap-2 border transition-all text-left ${
                        activeTab === 'register' && registerSubModule === 'correspondence'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-black'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700'
                      }`}
                    >
                      <ClipboardList size={13} className="text-blue-400 shrink-0" />
                      <span>চিঠিপত্র রেজি:</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('register', 'settlement');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-[11px] font-bold flex items-center gap-2 border transition-all text-left ${
                        activeTab === 'register' && registerSubModule === 'settlement'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-black'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700'
                      }`}
                    >
                      <FileText size={13} className="text-indigo-400 shrink-0" />
                      <span>মীমাংসিত রেজি:</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. রিটার্ণ ও সারাংশ */}
          {(isAdmin || moduleVisibility?.return !== false) && (
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <PieChart size={12} /> রিটার্ণ ও সারাংশ রিপোর্ট
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ঢাকায় প্রেরণ।'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>১. ঢাকা প্রেরণ রিটার্ণ</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: ডিডি স্যারের জন্য।'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>২. ডিডি স্যার চিঠিপত্র রিটার্ণ</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - বিএসআর'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>৩. নিষ্পত্তি - বিএসআর</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: নিষ্পত্তি - দ্বিপক্ষীয়'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>৪. নিষ্পত্তি - দ্বিপক্ষীয়</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - বিএসআর'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>৫. অনলাইন প্রাপ্তি (বিএসআর)</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('return', null, 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন: অনলাইন প্রাপ্তি - দ্বিপক্ষীয়'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>৬. অনলাইন প্রাপ্তি (দ্বিপক্ষীয়)</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('return', null, 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                    reportType === 'মাসিক রিটার্ন: অনুচ্ছেদ নিষ্পত্তি সংক্রান্ত।'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>৭. অনুচ্ছেদ নিষ্পত্তি রিটার্ণ</span>
                  <ArrowRight size={11} className="opacity-50" />
                </button>
              </div>
            </div>
          )}

          {/* 4. এডমিন ও সেটিংস অপশন */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {isAdmin ? (
              <>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block px-1 flex items-center gap-1">
                  <ShieldCheck size={12} /> এডমিন নিয়ন্ত্রণ ও সেটিংস
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('setup_receivers');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all text-left ${
                      activeTab === 'setup_receivers'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                    }`}
                  >
                    <Users size={13} className="text-indigo-400 shrink-0" />
                    <span>রিসিভার ব্যবস্থাপনা</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('initial_balance');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all text-left ${
                      activeTab === 'initial_balance'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                    }`}
                  >
                    <Scale size={13} className="text-emerald-400 shrink-0" />
                    <span>প্রারম্ভিক জের</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('admin_analytics');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all text-left ${
                      activeTab === 'admin_analytics'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                    }`}
                  >
                    <BarChart3 size={13} className="text-blue-400 shrink-0" />
                    <span>এনালাইটিক্স</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenChangePassword) onOpenChangePassword();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 text-left"
                  >
                    <KeyRound size={13} className="text-amber-400 shrink-0" />
                    <span>পাসওয়ার্ড পরিবর্তন</span>
                  </button>

                  <button
                    onClick={onExportSystem}
                    className="p-2 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 text-left"
                  >
                    <Download size={13} className="text-teal-400 shrink-0" />
                    <span>ডাটা এক্সপোর্ট</span>
                  </button>

                  <label className="p-2 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 text-left cursor-pointer">
                    <Upload size={13} className="text-teal-400 shrink-0" />
                    <span>ডাটা ইম্পোর্ট</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onImportSystem?.(file);
                          e.target.value = '';
                          setIsMobileMenuOpen(false);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setIsLockedMode(!isLockedMode)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-black border flex items-center justify-center gap-1.5 transition-all ${
                      isLockedMode 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}
                  >
                    {isLockedMode ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{isLockedMode ? 'মোড: Locked' : 'মোড: Editing'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-black bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <LogOut size={12} />
                    <span>লগআউট</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleAdminLoginClick}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none"
              >
                <ShieldCheck size={14} />
                <span>এডমিন লগইন</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saved Links Modal */}
      <SavedLinksModal 
        isOpen={showLinksModal} 
        onClose={() => setShowLinksModal(false)} 
      />
    </nav>
  );
};

export default Navbar;