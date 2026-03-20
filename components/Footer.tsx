import React, { useState } from 'react';
import { 
  ShieldCheck, LayoutDashboard, MapPin, ExternalLink, 
  Github, Mail, Globe, CheckCircle2, ShieldHalf, Cpu
} from 'lucide-react';
import { OFFICE_HEADER } from '../constants.ts';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
  isLayoutEditable: boolean;
}

const Footer: React.FC<FooterProps> = ({ setActiveTab, activeTab, isLayoutEditable }) => {
  
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
      <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  const quickLinks = [
    { id: 'landing', label: 'হোম পেজ' },
    { id: 'register', label: 'মীমাংসা রেজিস্টার' },
    { id: 'return', label: 'রিটার্ণ ও সারাংশ' },
    { id: 'entry', label: 'নতুন তথ্য এন্ট্রি' }
  ];

  return (
    <footer id="site-premium-footer" className="mt-20 border-t border-slate-800 bg-slate-950 text-slate-400 no-print relative">
      <IDBadge id="site-premium-footer" />
      
      {/* Upper Footer: Branding & Navigation */}
      <div className="max-w-[1600px] mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Column 1: Office Info */}
        <div className="space-y-6 relative">
          <IDBadge id="footer-col-office" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white tracking-tight text-base leading-none">অডিট রেজিস্টার</span>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1.5">Settlement Ledger</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-black text-sm uppercase">{OFFICE_HEADER.main}</h4>
            <p className="text-xs font-bold leading-relaxed">{OFFICE_HEADER.sub}</p>
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <MapPin size={14} className="shrink-0 text-slate-600 mt-0.5" />
              <span>{OFFICE_HEADER.address}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Navigation */}
        <div className="space-y-6 relative">
          <IDBadge id="footer-col-nav" />
          <h4 className="text-white font-black text-xs uppercase tracking-widest border-l-4 border-blue-600 pl-3">দ্রুত নেভিগেশন</h4>
          <ul className="space-y-3">
            {quickLinks.map((link) => (
              <li key={link.id}>
                <button 
                  onClick={() => setActiveTab(link.id)}
                  className={`text-xs font-bold flex items-center gap-2 transition-all hover:text-white group ${activeTab === link.id ? 'text-blue-400' : ''}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-all ${activeTab === link.id ? 'bg-blue-400 scale-125' : ''}`}></div>
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Security & Compliance */}
        <div className="space-y-6 relative">
          <IDBadge id="footer-col-security" />
          <h4 className="text-white font-black text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">নিরাপত্তা ও প্রটোকল</h4>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-tight">Data Integrity</span>
                <span className="text-[9px] font-bold text-slate-500">স্বয়ংক্রিয় জের গণনা সক্রিয়</span>
              </div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Cpu size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-tight">Encrypted Storage</span>
                <span className="text-[9px] font-bold text-slate-500">সুপাবেজ সিকিউর ক্লাউড সিঙ্ক</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Links & Resources */}
        <div className="space-y-6 relative">
          <IDBadge id="footer-col-resources" />
          <h4 className="text-white font-black text-xs uppercase tracking-widest border-l-4 border-amber-600 pl-3">রিসোর্স ও সহায়তা</h4>
          <div className="space-y-3">
             <a href="#" className="flex items-center gap-2 text-xs font-bold hover:text-white transition-colors group">
               <Globe size={14} className="text-slate-600 group-hover:text-blue-400" />
               CAG ওয়েবসাইট
               <ExternalLink size={10} className="text-slate-700" />
             </a>
             <a href="#" className="flex items-center gap-2 text-xs font-bold hover:text-white transition-colors group">
               <Mail size={14} className="text-slate-600 group-hover:text-amber-400" />
               যোগাযোগ করুন
             </a>
             <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-500 uppercase">System Status</span>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[11px] font-black text-emerald-500">STABLE</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Lower Footer: Copyright & Metadata */}
      <div className="bg-black py-8 relative">
        <IDBadge id="footer-copyright-bar" />
        <div className="max-w-[1600px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-bold tracking-tight">
            © {new Date().getFullYear()} <span className="text-blue-500">বাণিজ্যিক অডিট অধিদপ্তর, খুলনা</span> । সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
               <ShieldHalf size={12} className="text-slate-500" />
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Version 1.0.0 Stable</span>
            </div>
            <div className="text-[10px] font-black text-slate-700 tracking-widest">
              DEPLOYED: DG-CAG-KHL-R06
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;