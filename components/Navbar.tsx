import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, Camera,
  ChevronDown, Sparkles, Lock, Unlock, CheckCircle2, Download, 
  Upload, ShieldCheck, LogOut, X, KeyRound, Settings, 
  Calendar, ShieldAlert, Filter, Printer, Menu, Fingerprint, 
  Bell, Check, XCircle, UserCheck, BellRing, ArrowRight, Library, Plus,
  Mail, ClipboardList
} from 'lucide-react';
import { SettlementEntry } from '../types';
import { toBengaliDigits } from '../utils/numberUtils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, subModule?: 'settlement' | 'correspondence', rType?: string) => void;
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
  const [showEntryDropdown, setShowEntryDropdown] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const entryDropdownRef = useRef<HTMLDivElement>(null);
  const registerDropdownRef = useRef<HTMLDivElement>(null);

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
  ];

  return (
    <nav className="sticky top-0 z-[9991] bg-slate-900 border-b border-slate-800 h-[45px] shadow-2xl no-print relative">
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className={`p-1 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white ${isSidebarOpen ? 'hidden lg:hidden' : 'flex'}`}><Menu size={16} /></button>
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <React.Fragment key={item.id}>
                {item.id === 'landing' ? (
                  <button 
                    onClick={() => setActiveTab(item.id)} 
                    className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 overflow-hidden
                      ${activeTab === item.id 
                        ? 'scale-110 z-10 shadow-[0_5px_15px_rgba(0,0,0,0.4)]' 
                        : 'opacity-90 hover:opacity-100 hover:scale-105 active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'}
                    `}
                    title={item.label}
                  >
                    {/* The Multi-color Glass Sphere Base - Refined to match image */}
                    <div className="absolute inset-0 bg-[conic-gradient(from_225deg,#2dd4bf,#3b82f6,#ef4444,#f97316,#2dd4bf)]" />
                    
                    {/* Inner Shadow for depth */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_-3px_8px_rgba(0,0,0,0.5),inset_0_3px_8px_rgba(255,255,255,0.4)]" />
                    
                    {/* Top Glossy Highlight (The white arc at the top) */}
                    <div className="absolute top-[4%] left-[12%] w-[76%] h-[48%] bg-gradient-to-b from-white/90 to-transparent rounded-[100%] pointer-events-none" />
                    
                    {/* Bottom Reflection */}
                    <div className="absolute bottom-[6%] left-[22%] w-[56%] h-[18%] bg-white/30 blur-[1px] rounded-[100%] pointer-events-none" />
                    
                    {/* Active State Glow */}
                    <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${activeTab === item.id ? 'bg-white/10' : 'opacity-0'}`} />
                    
                    <div className="relative z-10 flex items-center justify-center">
                      <item.icon size={14} className="text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]" />
                    </div>
                  </button>
                ) : (
                  <div 
                    className="relative"
                    onMouseEnter={() => item.id === 'register' && setShowRegisterDropdown(true)}
                    onMouseLeave={() => item.id === 'register' && setShowRegisterDropdown(false)}
                  >
                    <button 
                      onClick={() => setActiveTab(item.id)} 
                      className={`flex items-center gap-1 px-[11px] py-[5px] bg-white text-slate-900 rounded-lg font-bold text-[11px] shadow-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all relative ${activeTab === item.id ? 'ring-1 ring-blue-500' : ''}`}
                    >
                      <item.icon size={13} className="text-blue-600" /> {item.label}
                      {item.id === 'register' && <ChevronDown size={11} className={`ml-0.5 transition-transform ${showRegisterDropdown ? 'rotate-180' : ''}`} />}
                    </button>

                    {item.id === 'register' && showRegisterDropdown && (
                      <div className="absolute top-full left-0 pt-2 w-64 z-[5010] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2">
                          <button 
                            onClick={() => { setActiveTab('register', 'correspondence'); setShowRegisterDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-left font-bold text-sm"
                          >
                            <Mail size={16} className="text-emerald-500" />
                            ১. চিঠিপত্র রেজিস্টার
                          </button>
                          <button 
                            onClick={() => { setActiveTab('register', 'settlement'); setShowRegisterDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-left font-bold text-sm"
                          >
                            <ClipboardList size={16} className="text-blue-500" />
                            ২. মীমাংসা রেজিস্টার
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {item.id === 'landing' && (
                  <div 
                    className="relative mx-1"
                    onMouseEnter={() => setShowEntryDropdown(true)}
                    onMouseLeave={() => setShowEntryDropdown(false)}
                  >
                    <button 
                      onClick={() => setActiveTab('entry')} 
                      className={`hidden lg:flex items-center gap-1 px-[11px] py-[5px] bg-white text-slate-900 rounded-lg font-bold text-[11px] shadow-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all relative ${activeTab === 'entry' ? 'ring-1 ring-blue-500' : ''}`}
                    >
                      <FilePlus2 size={14} className="text-blue-600" /> 
                      নতুন এন্ট্রি
                      <ChevronDown size={11} className={`ml-0.5 transition-transform ${showEntryDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showEntryDropdown && (
                      <div className="absolute top-full left-0 pt-2 w-64 z-[5010] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2">
                          <button 
                            onClick={() => { setActiveTab('entry', 'correspondence'); setShowEntryDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-left font-bold text-sm"
                          >
                            <Mail size={16} className="text-emerald-500" />
                            ১. চিঠিপত্র এন্ট্রি
                          </button>
                          <button 
                            onClick={() => { setActiveTab('entry', 'settlement'); setShowEntryDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-left font-bold text-sm"
                          >
                            <ClipboardList size={16} className="text-blue-500" />
                            ২. মীমাংসা এন্ট্রি
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-1 rounded-lg border transition-all relative flex items-center justify-center ${showNotifDropdown || pendingEntries.length > 0 ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {pendingEntries.length > 0 ? <BellRing size={16} className="animate-pulse" /> : <Bell size={16} />}
                {pendingEntries.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-slate-900 shadow-sm animate-notif-scale">
                    {toBengaliDigits(pendingEntries.length)}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-80 bg-slate-900 border-2 border-amber-500/50 rounded-[2rem] shadow-2xl overflow-hidden z-[5010] animate-in fade-in slide-in-from-top-4 duration-300">
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

          {/* Cycle badge removed as per request */}
          
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 border border-slate-700 rounded-xl relative`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isLockedMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div> <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isLockedMode ? 'Locked' : 'Edit'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {(activeTab === 'register' || activeTab === 'return') && <button onClick={() => setShowRegisterFilters(!showRegisterFilters)} className={`p-1 rounded-lg border transition-all ${showRegisterFilters ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}><Filter size={16} /></button>}
            
            {isAdmin && (
              <div className="relative" ref={toolsRef}>
                <button onClick={() => setShowToolsDropdown(!showToolsDropdown)} className={`p-1 rounded-lg border transition-all ${showToolsDropdown ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}><Settings size={16} /></button>
                {showToolsDropdown && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 z-[5010]">
                    <div className="space-y-3 animate-in fade-in duration-500">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">সিস্টেম টুলস</span>
                      <button onClick={onExportSystem} className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-black text-[11px] text-slate-400 hover:text-white transition-all">
                        <Download size={14} /> এক্সপোর্ট ডাটাবেস
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
