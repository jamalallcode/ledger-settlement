import React, { useState, useRef } from 'react';
import { LayoutDashboard, FilePlus2, ListFilter, PieChart, Home, ChevronLeft, Sparkles, Lock, Unlock, CheckCircle2, Download, Upload, ShieldCheck, LogOut, X, KeyRound, Fingerprint, AlertCircle, Library } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  pendingCount = 0
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

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
      // Persist admin status to prevent re-entry requirement
      localStorage.setItem('ledger_admin_access_v1', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  const menuItems = [
    { id: 'landing', label: 'হোম', icon: Home, badgeId: 'side-nav-home' },
    { id: 'entry', label: 'নতুন এন্ট্রি', icon: FilePlus2, badgeId: 'side-nav-entry' },
    { id: 'register', label: 'রেজিস্টার', icon: ListFilter, badgeId: 'side-nav-register' },
    { id: 'return', label: 'রিটার্ণ ও সারাংশ', icon: PieChart, badgeId: 'side-nav-return' },
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
        <nav id="sidebar-nav" className="flex-1 overflow-y-auto py-4 px-4 space-y-2 relative no-scrollbar">
          <IDBadge id="sidebar-nav" />
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              id={item.badgeId} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
            >
              <IDBadge id={item.badgeId} />
              <div className="relative">
                <item.icon size={18} />
              </div>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
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
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
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
