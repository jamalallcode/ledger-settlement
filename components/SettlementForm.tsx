import React, { useState, useEffect } from 'react';
import { SettlementEntry, GroupOption } from '../types.ts';
import { Layout, ClipboardList, Mail, ArrowRightCircle, CheckCircle2, ChevronRight, LayoutGrid, FileText, ArrowRight } from 'lucide-react';
import SettlementEntryModule from './SettlementEntryModule';
import CorrespondenceEntryModule from './CorrespondenceEntryModule';

interface SettlementFormProps {
  onAdd: (entry: Omit<SettlementEntry, 'id' | 'sl' | 'createdAt'> | SettlementEntry) => void;
  onViewRegister: (module: 'settlement' | 'correspondence') => void;
  nextSl: number;
  branchSuggestions: GroupOption[];
  initialEntry?: SettlementEntry | any | null;
  onCancel?: () => void;
  isLayoutEditable?: boolean;
  isAdmin?: boolean;
  preSelectedModule?: 'settlement' | 'correspondence' | null;
  correspondenceEntries?: any[];
  entries?: SettlementEntry[];
}

const SettlementForm: React.FC<SettlementFormProps> = ({ onAdd, onViewRegister, nextSl, branchSuggestions, initialEntry, onCancel, isLayoutEditable, isAdmin = false, preSelectedModule = null, correspondenceEntries, entries }) => {
  const [mainModule, setMainModule] = useState<'settlement' | 'correspondence' | null>(preSelectedModule);

  useEffect(() => {
    if (initialEntry) {
      // Determine module type based on entry structure or explicit 'type' field
      const isCorrespondence = initialEntry.type === 'correspondence' || !!initialEntry.description;
      setMainModule(isCorrespondence ? 'correspondence' : 'settlement');
    } else if (preSelectedModule) {
      setMainModule(preSelectedModule);
    }
  }, [initialEntry, preSelectedModule]);

  const IDBadge = ({ id, isLayoutEditable }: { id: string, isLayoutEditable?: boolean }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    return (
      <span onClick={handleCopy} title="Click to copy ID" className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  // INITIAL SELECTION MENU
  if (!mainModule) {
    return (
      <div id="section-entry-choice" className="w-full py-2 animate-in slide-in-from-left-10 duration-700 relative">
        <IDBadge id="section-entry-choice" isLayoutEditable={isLayoutEditable} />
        
        <div className="space-y-5 max-w-4xl text-left">
          {/* Option 1: Incoming Correspondence */}
          <div 
            onClick={() => setMainModule('correspondence')}
            className="group relative flex items-center h-[82px] w-full bg-slate-900 rounded-[1.25rem] shadow-lg hover:shadow-2xl hover:translate-x-1.5 transition-all duration-500 cursor-pointer overflow-hidden border border-white/10 animate-in slide-in-from-left-4 fill-mode-forwards"
          >
            <IDBadge id="opt-correspondence-row" />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
            
            <div className="flex items-center justify-center pl-7">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-500">
                <Mail size={24} className="text-emerald-500 group-hover:text-white" />
              </div>
            </div>

            <div className="flex flex-col justify-center pl-8 flex-1">
              <h3 className="text-[20px] font-black text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">১. প্রাপ্ত চিঠিপত্র এন্ট্রি</h3>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mt-0.5 group-hover:text-slate-300 transition-colors">নতুন চিঠিপত্র প্রাপ্তি এবং ডায়েরি এন্ট্রি করার জন্য এই মডিউলটি ব্যবহার করুন।</p>
            </div>

            <div className="pr-10 opacity-30 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
              <ArrowRight size={22} className="text-white" />
            </div>
          </div>

          {/* Option 2: Settlement Register */}
          <div 
            onClick={() => setMainModule('settlement')}
            className="group relative flex items-center h-[82px] w-full bg-slate-900 rounded-[1.25rem] shadow-lg hover:shadow-2xl hover:translate-x-1.5 transition-all duration-500 cursor-pointer overflow-hidden border border-white/10 animate-in slide-in-from-left-4 fill-mode-forwards delay-100"
          >
            <IDBadge id="opt-settlement-row" />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
            
            <div className="flex items-center justify-center pl-7">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                <ClipboardList size={24} className="text-blue-500 group-hover:text-white" />
              </div>
            </div>

            <div className="flex flex-col justify-center pl-8 flex-1">
              <h3 className="text-[20px] font-black text-white tracking-tight leading-tight group-hover:text-blue-400 transition-colors">২. মীমাংসা রেজিস্টার ডাটা এন্ট্রি</h3>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mt-0.5 group-hover:text-slate-300 transition-colors">অনুগ্রহ করে নিচের ১৮টি ফিল্ড সঠিকভাবে পূরণ করুন - যেটা বর্তমানে আছে।</p>
            </div>

            <div className="pr-10 opacity-30 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
              <ArrowRight size={22} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mainModule === 'correspondence') {
    return <CorrespondenceEntryModule onBackToMenu={() => setMainModule(null)} onViewRegister={() => onViewRegister('correspondence')} onAdd={onAdd} isLayoutEditable={isLayoutEditable} initialEntry={initialEntry} isAdmin={isAdmin} existingEntries={correspondenceEntries} />;
  }

  return (
    <SettlementEntryModule 
      onAdd={onAdd}
      onViewRegister={() => onViewRegister('settlement')}
      nextSl={nextSl}
      branchSuggestions={branchSuggestions}
      initialEntry={initialEntry}
      onCancel={onCancel}
      onBackToMenu={() => setMainModule(null)}
      isLayoutEditable={isLayoutEditable}
      isAdmin={isAdmin}
      existingEntries={entries}
    />
  );
};

export default SettlementForm;
