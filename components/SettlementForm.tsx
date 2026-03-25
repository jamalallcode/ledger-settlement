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
  userEmail?: string | null;
  preSelectedModule?: 'settlement' | 'correspondence' | null;
  correspondenceEntries?: any[];
  entries?: SettlementEntry[];
  navigateToEntry?: (id: string, type: 'settlement' | 'correspondence', searchNo?: string) => void;
  showAuditDetails?: boolean;
}

const SettlementForm: React.FC<SettlementFormProps> = ({ onAdd, onViewRegister, nextSl, branchSuggestions, initialEntry, onCancel, isLayoutEditable, isAdmin = false, userEmail, preSelectedModule = null, correspondenceEntries, entries, navigateToEntry, showAuditDetails = true }) => {
  const [mainModule, setMainModule] = useState<'settlement' | 'correspondence' | null>(() => {
    if (initialEntry) {
      return (initialEntry.type === 'correspondence' || !!initialEntry.description) ? 'correspondence' : 'settlement';
    }
    return preSelectedModule;
  });

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

  if (mainModule === 'correspondence') {
    return <CorrespondenceEntryModule onBackToMenu={onCancel || (() => setMainModule(null))} onViewRegister={() => onViewRegister('correspondence')} onAdd={onAdd} isLayoutEditable={isLayoutEditable} initialEntry={initialEntry} isAdmin={isAdmin} userEmail={userEmail} existingEntries={correspondenceEntries} navigateToEntry={navigateToEntry} />;
  }

  if (mainModule === 'settlement') {
    return (
      <SettlementEntryModule 
        onAdd={onAdd}
        onViewRegister={() => onViewRegister('settlement')}
        nextSl={nextSl}
        branchSuggestions={branchSuggestions}
        initialEntry={initialEntry}
        onCancel={onCancel}
        onBackToMenu={onCancel || (() => setMainModule(null))}
        isLayoutEditable={isLayoutEditable}
        isAdmin={isAdmin}
        existingEntries={entries}
        navigateToEntry={navigateToEntry}
        showAuditDetails={showAuditDetails}
      />
    );
  }

  return null;
};

export default SettlementForm;