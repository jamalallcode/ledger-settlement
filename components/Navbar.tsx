import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const navItems: any[] = [];

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
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* All menu items removed as per request */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1.5 bg-slate-800 text-white rounded-xl border border-slate-700"><Menu size={20} /></button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;