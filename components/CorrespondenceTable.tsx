import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Mail, Calendar, Hash, FileText, User, MapPin, Inbox, Computer, CheckCircle2, ChevronRight, ArrowRightCircle, ListOrdered, Banknote, BookOpen, Clock, Printer, Pencil, Trash2, CalendarRange, Check, XCircle, Send, UserCheck, Plus, Search, ChevronDown, Sparkles, Save } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { getCurrentCycle } from '../utils/cycleHelper';

interface CorrespondenceEntry {
  id: string;
  description: string;
  paraType: string;
  letterType: string;
  letterNo: string;
  letterDate: string;
  totalParas: string;
  totalAmount: string;
  diaryNo: string;
  diaryDate: string;
  receiptDate: string;
  digitalFileNo: string;
  presentationDate: string;
  presentedToName?: string;
  sentParaCount: string;
  receiverName: string;
  receivedDate: string;
  isOnline: string;
  issueLetterNo: string;
  issueLetterDate: string;
  remarks?: string;
  createdAt: string;
  approvalStatus?: 'approved' | 'pending';
}

interface CorrespondenceTableProps {
  entries: CorrespondenceEntry[];
  onBack: () => void;
  isLayoutEditable?: boolean;
  isAdmin?: boolean;
  onEdit?: (entry: any) => void;
  onInlineUpdate?: (entry: any) => void; 
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

/**
 * Premium Dropdown Component for Inline Presentation Name Update
 */
const PremiumInlineSelect: React.FC<{
  value: string;
  onSelect: (val: string) => void;
}> = ({ value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ledger_correspondence_presented_to');
    const defaultList = ['সুপার', 'এএন্ডএও', 'উপপরিচালক']; 
    
    const filterUnwanted = (s: string) => 
      s !== 'শামীমা রহমান' && 
      s !== 'পরিচালক' && 
      s !== 'মহাপরিচালক' && 
      s !== 'উপ-পরিচালক';

    if (saved) {
      const parsed = JSON.parse(saved).filter(filterUnwanted);
      const merged = Array.from(new Set([...defaultList, ...parsed])).filter(filterUnwanted);
      setSuggestions(merged);
    } else {
      setSuggestions(defaultList);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNew = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed === 'শামীমা রহমান' || trimmed === 'পরিচালক' || trimmed === 'মহাপরিচালক' || trimmed === 'উপ-পরিচালক') return;
    const next = Array.from(new Set([trimmed, ...suggestions]));
    setSuggestions(next);
    localStorage.setItem('ledger_correspondence_presented_to', JSON.stringify(next));
    onSelect(trimmed);
    setIsOpen(false);
  };

  const filtered = suggestions.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        className={`w-full h-7 px-1.5 bg-slate-50 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-50 bg-white shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <span className={`text-[9px] font-black truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || 'বাছুন...'}
        </span>
        <ChevronDown size={10} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 border-t-2 border-t-blue-600">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
              <input 
                autoFocus type="text" placeholder="খুঁজুন..." 
                className="w-full h-7 pl-6 pr-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto no-scrollbar py-1">
            {filtered.map((opt, i) => (
              <div 
                key={i} onClick={() => { onSelect(opt); setIsOpen(false); }}
                className={`px-3 py-1.5 cursor-pointer flex items-center justify-between transition-all ${value === opt ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700 font-bold text-[9px]'}`}
              >
                <span>{opt}</span>
                {value === opt && <Check size={10} strokeWidth={3} />}
              </div>
            ))}
            {searchTerm && !suggestions.includes(searchTerm) && 
             searchTerm !== 'শামীমা রহমান' && 
             searchTerm !== 'পরিচালক' && 
             searchTerm !== 'মহাপরিচালক' && 
             searchTerm !== 'উপ-পরিচালক' && (
              <div 
                onClick={handleAddNew}
                className="px-3 py-1.5 cursor-pointer bg-emerald-50 text-emerald-600 font-black text-[9px] flex items-center gap-2 hover:bg-emerald-100"
              >
                <Plus size={10} /> নতুন পদবি: "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CorrespondenceTable: React.FC<CorrespondenceTableProps> = ({ entries, onBack, isLayoutEditable, isAdmin, onEdit, onInlineUpdate, onDelete, onApprove, onReject }) => {
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<CorrespondenceEntry>>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  const cycleInfo = useMemo(() => getCurrentCycle(), []);

  // Fix: Defined IDBadge to correctly handle layout editing logic and prevent "Cannot find name" error
  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    return (
      <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  const handleInlineChange = (entryId: string, field: keyof CorrespondenceEntry, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value
      }
    }));
  };

  const saveAllChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsUpdating(true);
    
    try {
      for (const entryId in pendingChanges) {
        const entry = entries.find(e => e.id === entryId);
        if (entry && onInlineUpdate) {
          await onInlineUpdate({ ...entry, ...pendingChanges[entryId] });
        }
      }
      setPendingChanges({});
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const thCls = "border border-slate-300 px-1 py-2 text-center align-middle font-black text-slate-900 text-[10px] bg-slate-100 sticky top-0 z-[100] shadow-[inset_0_-1px_0_#cbd5e1] leading-tight";
  const tdCls = "border border-slate-300 px-1.5 py-1.5 text-[10px] text-slate-800 font-bold leading-tight align-top bg-white transition-colors group-hover:bg-blue-50/50 break-words";
  const labelCls = "text-[9px] font-black text-emerald-700 mr-1 shrink-0";
  const valCls = "text-[9px] font-bold text-slate-900";

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    // Fix: Corrected syntax error by removing escaped backslashes and ensuring proper JSX structure
    <div id="section-correspondence-register" className="w-full space-y-4 animate-premium-page relative">
      <IDBadge id="section-correspondence-register" />
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print relative">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all shadow-sm"><ChevronRight className="rotate-180" size={18} /></button>
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Mail className="text-emerald-600" size={20} /> প্রাপ্ত চিঠিপত্র সংক্রান্ত রেজিস্টার
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Correspondence Ledger</p>
               <div className="h-3 w-[1px] bg-slate-300"></div>
               <div className="flex items-center gap-1 text-blue-600 font-black text-[10px]">
                  <CalendarRange size={12} /> সাইকেল: {toBengaliDigits(cycleInfo.label)}
               </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {hasChanges && (
             <button 
              onClick={saveAllChanges}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-[11px] flex items-center gap-2 hover:shadow-xl hover:scale-105 active:scale-95 transition-all animate-in zoom-in-95 duration-300 border border-emerald-400 shadow-lg shadow-emerald-200/50"
             >
               {isUpdating ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
               আপডেট করুন {toBengaliDigits(Object.keys(pendingChanges).length)} টি এন্ট্রি
             </button>
           )}
           <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[11px] flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={16} /> প্রিন্ট</button>
        </div>
      </div>

      {/* Table Container - Optimized for Width */}
      <div className="table-container border border-slate-300 rounded-sm overflow-visible relative shadow-xl bg-white max-w-full">
        <IDBadge id="table-correspondence-ledger" />
        <table className="w-full border-separate border-spacing-0 table-fixed">
          <colgroup>
            <col className="w-[30px]" />  
            <col className="w-[130px]" /> 
            <col className="w-[150px]" /> 
            <col className="w-[150px]" /> 
            <col className="w-[80px]" />  
            <col className="w-[60px]" />  
            <col className="w-[85px]" />  
            <col className="w-[60px]" />  
            <col className="w-[145px]" /> 
            <col className="w-[135px]" /> 
            <col className="w-[50px]" />  
          </colgroup>
          <thead>
            <tr>
              <th className={thCls}>ক্র: নং</th>
              <th className={thCls}>পত্রের বিবরণ</th>
              <th className={thCls}>পত্রের অন্যান্য তথ্য</th>
              <th className={thCls}>অত্র অফিসের তথ্য</th>
              <th className={thCls}>শাখা ধরণ</th>
              <th className={thCls}>প্রেরিত অনুচ্ছেদ</th>
              <th className={thCls}>জড়িত টাকা</th>
              <th className={thCls}>অনলাইন</th>
              <th className={thCls}>গ্রহণ ও উপস্থাপন</th>
              <th className={thCls}>জারিপত্র নং ও তারিখ</th>
              <th className={thCls}>মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((entry, idx) => {
              const pending = pendingChanges[entry.id] || {};
              const currentPresDate = pending.presentationDate !== undefined ? pending.presentationDate : (entry.presentationDate || '');
              const currentPresName = pending.presentedToName !== undefined ? pending.presentedToName : (entry.presentedToName || '');
              const currentIssueNo = pending.issueLetterNo !== undefined ? pending.issueLetterNo : (entry.issueLetterNo || '');
              const currentIssueDate = pending.issueLetterDate !== undefined ? pending.issueLetterDate : (entry.issueLetterDate || '');
              
              return (
              <tr key={entry.id} className="group transition-all">
                <td className={tdCls + " text-center font-black"}>{toBengaliDigits(idx + 1)}</td>
                <td className={tdCls}>{entry.description}</td>
                <td className={tdCls}>
                   <div className="space-y-0.5">
                      <div className="flex items-start"><span className={labelCls}>শাখা:</span> <span className={valCls}>{entry.paraType}</span></div>
                      <div className="flex items-start"><span className={labelCls}>নং:</span> <span className={valCls}>{entry.letterNo}</span></div>
                      <div className="flex items-start"><span className={labelCls}>তারিখ:</span> <span className={valCls}>{toBengaliDigits(entry.letterDate)}</span></div>
                      <div className="flex items-start"><span className={labelCls}>অনুচ্ছেদ:</span> <span className={valCls}>{toBengaliDigits(entry.totalParas)} টি</span></div>
                      <div className="flex items-start"><span className={labelCls}>টাকা:</span> <span className={valCls}>{toBengaliDigits(entry.totalAmount)}</span></div>
                   </div>
                </td>
                <td className={tdCls}>
                   <div className="space-y-0.5">
                      <div className="flex items-start"><span className={labelCls}>ডায়েরি:</span> <span className={valCls}>{entry.diaryNo}</span></div>
                      <div className="flex items-start"><span className={labelCls}>ড: তারিখ:</span> <span className={valCls}>{toBengaliDigits(entry.diaryDate)}</span></div>
                      <div className="flex items-start"><span className={labelCls}>প্রাপ্তি:</span> <span className={valCls}>{toBengaliDigits(entry.receiptDate)}</span></div>
                      <div className="flex items-start"><span className={labelCls}>নথি:</span> <span className={valCls}>{entry.digitalFileNo}</span></div>
                   </div>
                </td>
                <td className={tdCls + " text-center"}>{entry.paraType}</td>
                <td className={tdCls + " text-center font-black text-blue-700"}>{toBengaliDigits(entry.sentParaCount)}</td>
                <td className={tdCls + " text-center font-black"}>{toBengaliDigits(entry.totalAmount)}</td>
                <td className={tdCls + " text-center"}>
                   <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${entry.isOnline === 'হ্যাঁ' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {entry.isOnline}
                   </span>
                </td>
                <td className={tdCls}>
                   <div className="space-y-2">
                      <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg relative">
                         <div className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter mb-0.5 flex items-center gap-1"><Inbox size={8} /> গ্রহণকারী</div>
                         <div className="font-black text-slate-900 text-[9px] leading-tight truncate">{entry.receiverName || '-'}</div>
                         <div className="text-[8px] text-slate-500 font-bold">{toBengaliDigits(entry.receivedDate)}</div>
                      </div>

                      <div className={`p-1.5 border rounded-lg space-y-1.5 transition-colors ${pending.presentationDate || pending.presentedToName ? 'bg-blue-600/10 border-blue-400 ring-2 ring-blue-50' : 'bg-blue-50/50 border-blue-100'}`}>
                         <div className="text-[8px] font-black text-blue-700 uppercase tracking-tighter flex items-center gap-1"><UserCheck size={8} /> উপস্থাপন</div>
                         <div className="space-y-1">
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[7px] font-black text-slate-400 uppercase">তারিখ</span>
                              <input 
                                type="date" 
                                className="w-full h-6 px-1.5 border border-slate-200 rounded-md text-[9px] font-bold outline-none focus:border-blue-400 bg-white" 
                                value={currentPresDate} 
                                onChange={e => handleInlineChange(entry.id, 'presentationDate', e.target.value)}
                              />
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[7px] font-black text-slate-400 uppercase">বরাবর</span>
                              <PremiumInlineSelect 
                                value={currentPresName} 
                                onSelect={val => handleInlineChange(entry.id, 'presentedToName', val)}
                              />
                           </div>
                         </div>
                      </div>
                   </div>
                </td>
                <td className={tdCls}>
                   <div className={`p-1.5 border rounded-lg space-y-1.5 transition-colors ${pending.issueLetterNo || pending.issueLetterDate ? 'bg-amber-600/10 border-amber-400 ring-2 ring-amber-50' : 'bg-amber-50/50 border-amber-100'}`}>
                      <div className="text-[8px] font-black text-amber-700 uppercase tracking-tighter flex items-center gap-1"><Send size={8} /> জারিপত্র</div>
                      <div className="space-y-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] font-black text-slate-400 uppercase">নং</span>
                          <input 
                            type="text" 
                            placeholder="নং"
                            className="w-full h-6 px-1.5 border border-slate-200 rounded-md text-[9px] font-bold outline-none focus:border-amber-400 bg-white" 
                            value={currentIssueNo} 
                            onChange={e => handleInlineChange(entry.id, 'issueLetterNo', toBengaliDigits(e.target.value))}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] font-black text-slate-400 uppercase">তারিখ</span>
                          <input 
                            type="date" 
                            className="w-full h-6 px-1.5 border border-slate-200 rounded-md text-[9px] font-bold outline-none focus:border-amber-400 bg-white" 
                            value={currentIssueDate} 
                            onChange={e => handleInlineChange(entry.id, 'issueLetterDate', e.target.value)}
                          />
                        </div>
                      </div>
                   </div>
                </td>
                <td className={tdCls + " relative group/action text-center"}>
                   <span className="text-[8px] opacity-70">{entry.remarks || '-'}</span>
                   {isAdmin && (
                     <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all no-print">
                       <button onClick={(e) => { e.stopPropagation(); onEdit?.(entry); }} className="p-1 bg-blue-600 text-white rounded-md shadow-md"><Pencil size={10} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDelete?.(entry.id); }} className="p-1 bg-red-600 text-white rounded-md shadow-md"><Trash2 size={10} /></button>
                     </div>
                   )}
                </td>
              </tr>
            )}) : (
              <tr>
                <td colSpan={11} className="py-20 text-center bg-white">
                   <div className="flex flex-col items-center gap-3 opacity-30">
                      <Mail size={40} />
                      <p className="text-sm font-black text-slate-900 tracking-widest">রেজিস্টার খালি</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-[110]">
            <tr className="bg-slate-900 text-white font-black text-[10px] h-9 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
              <td colSpan={2} className="px-4 text-left border-t border-slate-700">সর্বমোট:</td>
              <td colSpan={1} className="px-2 text-center border-t border-slate-700 text-emerald-400">{toBengaliDigits(entries.length)} টি</td>
              <td colSpan={4} className="border-t border-slate-700"></td>
              <td className="px-2 text-center border-t border-slate-700 text-blue-400">
                {toBengaliDigits(entries.reduce((sum, e) => sum + parseBengaliNumber(e.totalAmount), 0))}
              </td>
              <td colSpan={3} className="border-t border-slate-700"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CorrespondenceTable;
