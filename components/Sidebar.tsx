import React, { useRef } from 'react';
import { 
  LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, 
  ChevronDown, Sparkles, Lock, Unlock, CheckCircle2, Download, 
  Upload, ShieldCheck, LogOut, X, KeyRound, Settings, 
  Calendar, ShieldAlert, Filter, Printer, Menu, Fingerprint, 
  Bell, Check, XCircle, UserCheck, BellRing, ArrowRight, Library, Plus,
  Mail, ClipboardList, BarChart3, Globe, ChevronRight, Smartphone, Send,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toBengaliDigits } from '../utils/numberUtils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string, subModule?: any, reportType?: string) => void;
  onToggleVisibility: () => void;
  isLockedMode: boolean;
  setIsLockedMode: (val: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onLogout: () => void;
  pendingCount: number;
  entryModule: 'settlement' | 'correspondence';
  registerSubModule: 'settlement' | 'correspondence';
  reportType: string;
  isLayoutEditable: boolean;
  setIsLayoutEditable: (val: boolean) => void;
  showRegisterFilters: boolean;
  setShowRegisterFilters: (val: boolean) => void;
  onPrint: () => void;
  setShowPendingOnly: (val: boolean) => void;
  setShowAdminModal: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onToggleVisibility,
  isLockedMode,
  setIsLockedMode,
  isAdmin,
  setIsAdmin,
  onLogout,
  pendingCount,
  entryModule,
  registerSubModule,
  reportType,
  isLayoutEditable,
  setIsLayoutEditable,
  showRegisterFilters,
  setShowRegisterFilters,
  onPrint,
  setShowPendingOnly,
  setShowAdminModal
}) => {
  const logoClickCount = useRef(0);
  const lastLogoClickTime = useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickTime.current > 1000) {
      logoClickCount.current = 0;
    }
    logoClickCount.current += 1;
    lastLogoClickTime.current = now;
    if (logoClickCount.current >= 3) {
      setShowAdminModal(true);
      logoClickCount.current = 0;
    }
  };

  const menuGroups = [
    {
      title: 'প্রধান মেনু',
      items: [
        { id: 'landing', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
        { id: 'entry', label: 'নতুন এন্ট্রি', icon: FilePlus2 },
        { id: 'register', label: 'রেজিস্টার', icon: ListFilter },
        { id: 'return', label: 'রিপোর্ট ও রিটার্ন', icon: PieChart },
      ]
    },
    {
      title: 'অ্যাডমিন টুলস',
      adminOnly: true,
      items: [
        { id: 'admin-dashboard', label: 'অ্যাডমিন ড্যাশবোর্ড', icon: ShieldCheck },
        { id: 'layout-edit', label: 'লেআউট এডিট', icon: isLayoutEditable ? Unlock : Lock, action: () => setIsLayoutEditable(!isLayoutEditable) },
        { id: 'lock-mode', label: 'এডিট মোড', icon: isLockedMode ? Lock : Unlock, action: () => setIsLockedMode(!isLockedMode) },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 h-full flex flex-col border-r border-slate-800 no-print">
      {/* Sidebar Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
            <Library size={18} className="text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-white text-[14px] leading-none tracking-tight">অডিট</span>
            <span className="font-black text-white text-[14px] leading-none tracking-tight">রেজিস্টার</span>
          </div>
        </button>
        <button 
          onClick={onToggleVisibility}
          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto no-scrollbar">
        {menuGroups.map((group, idx) => {
          if (group.adminOnly && !isAdmin) return null;
          return (
            <div key={idx} className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button 
          onClick={onPrint}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <Printer size={18} /> প্রিন্ট করুন
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all"
        >
          <LogOut size={18} /> লগ আউট
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
