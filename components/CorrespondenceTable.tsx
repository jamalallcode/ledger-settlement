import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Mail, Calendar, Hash, FileText, User, MapPin, Inbox, Computer, CheckCircle2, ChevronRight, ArrowRightCircle, ListOrdered, Banknote, BookOpen, Clock, Printer, Pencil, Trash2, CalendarRange, Check, XCircle, Send, UserCheck, Plus, Search, ChevronDown, Sparkles } from 'lucide-react';
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
    if (saved) setSuggestions(JSON.parse(saved));
    else setSuggestions(['উপ-পরিচালক', 'পরিচালক', 'মহাপরিচালক']);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNew = () => {
    if (!searchTerm.trim()) return;
    const next = Array.from(new Set([searchTerm.trim(), ...suggestions]));
    setSuggestions(next);
    localStorage.setItem('ledger_correspondence_presented_to', JSON.stringify(next));
    onSelect(searchTerm.trim());
    setIsOpen(false);
  };

  const filtered = suggestions.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        className={`w-full h-8 px-2 bg-slate-50 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-50 bg-white shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <span className={`text-[10px] font-black truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || 'নাম নির্বাচন করুন...'}
        </span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 border-t-2 border-t-blue-600">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
              <input 
                autoFocus type="text" placeholder="খুঁজুন বা নতুন লিখুন..." 
                className="w-full h-7 pl-6 pr-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto no-scrollbar py-1">
            {filtered.map((opt, i) => (
              <div 
                key={i} onClick={() => { onSelect(opt); setIsOpen(false); }}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-all ${value === opt ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700 font-bold text-[10px]'}`}
              >
                <span>{opt}</span>
                {value === opt && <Check size={12} strokeWidth={3} />}
              </div>
            ))}
            {searchTerm && !suggestions.includes(searchTerm) && (
              <div 
                onClick={handleAddNew}
                className="px-3 py-2 cursor-pointer bg-emerald-50 text-emerald-600 font-black text-[9px] flex items-center gap-2 hover:bg-emerald-100"
              >
                <Plus size={10} /> নতুন যুক্ত করুন: "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CorrespondenceTable: React.FC<CorrespondenceTableProps> = ({ entries, onBack, isLayoutEditable, isAdmin, onEdit, onDelete, onApprove, onReject }) => {
  
  const cycleInfo = useMemo(() => getCurrentCycle(), []);

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = React.useState(false);
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

  const handleInlineUpdate = (entry: CorrespondenceEntry, field: string, value: any) => {
    if (!onEdit) return;
    onEdit({ ...entry, [field]: value });
  };

  const thCls = "border border-slate-300 px-1 py-3 text-center align-middle font-black text-slate-900 text-[11px] bg-slate-100 sticky top-0 z-[100] shadow-[inset_0_-1px_0_#cbd5e1] leading-tight";
  const tdCls = "border border-slate-300 px-2 py-2 text-[11px] text-slate-800 font-bold leading-tight align-top bg-white transition-colors group-hover:bg-blue-50/50 overflow-hidden break-words";
  const labelCls = "text-[10px] font-black text-emerald-700 mr-1 shrink-0";
  const valCls = "text-[10px] font-bold text-slate-900";

  return (
    <div id="section-correspondence-register" className="w-full space-y-6 animate-premium-page relative">
      <IDBadge id="section-correspondence-register" />
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm no-print relative">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all shadow-sm"><ChevronRight className="rotate-180" size={20} /></button>
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Mail className="text-emerald-600" /> প্রাপ্ত চিঠিপত্র সংক্রান্ত রেজিস্টার
            </h3>
            <div className="flex items-center gap-3 mt-1">
               <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Incoming Correspondence Ledger</p>
               <div className="h-4 w-[1.5px] bg-slate-300"></div>
               <div className="flex items-center gap-1.5 text-blue-600 font-black text-xs">
                  <CalendarRange size={14} /> সাইকেল: {toBengaliDigits(cycleInfo.label)}
               </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট করুন</button>
        </div>
      </div>

      {/* Table Container - Width Optimized */}
      <div className="table-container border border-slate-300 rounded-sm overflow-visible relative shadow-2xl bg-white max-w-full">
        <IDBadge id="table-correspondence-ledger" />
        <table className="w-full border-separate border-spacing-0 table-fixed">
          <colgroup>
            <col className="w-[40px]" />  {/* ক্রমিক নং */}
            <col className="w-[160px]" /> {/* পত্রের বিবরণ */}
            <col className="w-[180px]" /> {/* পত্রের অন্যান্য তথ্য */}
            <col className="w-[180px]" /> {/* অত্র অফিসের তথ্য */}
            <col className="w-[100px]" /> {/* চিঠির ধরণ */}
            <col className="w-[85px]" />  {/* প্রেরিত অনুচ্ছেদ */}
            <col className="w-[100px]" /> {/* জড়িত টাকা */}
            <col className="w-[150px]" /> {/* গ্রহণ ও উপস্থাপন (Updated size) */}
            <col className="w-[70px]" />  {/* অনলাইন */}
            <col className="w-[120px]" /> {/* জারিপত্র নং ও তারিখ */}
            <col className="w-[100px]" /> {/* মন্তব্য */}
          </colgroup>
          <thead>
            <tr>
              <th className={thCls}>ক্রমিক নং</th>
              <th className={thCls}>পত্রের বিবরণ</th>
              <th className={thCls}>পত্রের অন্যান্য তথ্য</th>
              <th className={thCls}>অত্র অফিসের তথ্য</th>
              <th className={thCls}>চিঠির ধরণ (SFI/NON-SFI)</th>
              <th className={thCls}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
              <th className={thCls}>মোট জড়িত টাকা</th>
              <th className={thCls}>গ্রহণ ও উপস্থাপন</th>
              <th className={thCls}>অনলাইনে প্রাপ্তি (হ্যাঁ/না)</th>
              <th className={thCls}>জারিপত্র নং ও তারিখ</th>
              <th className={thCls}>মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((entry, idx) => (
              <tr key={entry.id} className="group transition-all">
                <td className={tdCls + " text-center font-black"}>{toBengaliDigits(idx + 1)}</td>
                <td className={tdCls}>{entry.description}</td>
                <td className={tdCls}>
                   <div className="space-y-1">
                      <div className="flex items-start"><span className={labelCls}>শাখার ধরণ:</span> <span className={valCls}>{entry.paraType}</span></div>
                      <div className="flex items-start"><span className={labelCls}>পত্র নং ও তারিখ:</span> <span className={valCls}>{entry.letterNo} ({toBengaliDigits(entry.letterDate)})</span></div>
                      <div className="flex items-start"><span className={labelCls}>প্রেরিত মোট অনুচ্ছেদ সংখ্যা:</span> <span className={valCls}>{toBengaliDigits(entry.totalParas)} টি</span></div>
                      <div className="flex items-start"><span className={labelCls}>মোট জড়িত টাকা।</span> <span className={valCls}>{toBengaliDigits(entry.totalAmount)}</span></div>
                   </div>
                </td>
                <td className={tdCls}>
                   <div className="space-y-1">
                      <div className="flex items-start"><span className={labelCls}>ডায়েরি নং ও তারিখ:</span> <span className={valCls}>{entry.diaryNo} ({toBengaliDigits(entry.diaryDate)})</span></div>
                      <div className="flex items-start"><span className={labelCls}>শাখায় প্রাপ্তির তারিখ:</span> <span className={valCls}>{toBengaliDigits(entry.receiptDate)}</span></div>
                      <div className="flex items-start"><span className={labelCls}>ডিজিটাল নথি নং-:</span> <span className={valCls}>{entry.digitalFileNo}</span></div>
                      {/* Presentation Date removed from here as per instruction */}
                   </div>
                </td>
                <td className={tdCls + " text-center"}>{entry.paraType}</td>
                <td className={tdCls + " text-center font-black text-blue-700"}>{toBengaliDigits(entry.sentParaCount)} টি</td>
                <td className={tdCls + " text-center font-black"}>{toBengaliDigits(entry.totalAmount)}</td>
                <td className={tdCls}>
                   <div className="space-y-4">
                      {/* Part 1: Receipt Info */}
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                         <div className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter mb-1 flex items-center gap-1"><Inbox size={10} /> ১. গ্রহণকারীর তথ্য</div>
                         <div className="font-black text-slate-900 text-[11px] leading-tight mb-1">{entry.receiverName || '-'}</div>
                         <div className="text-[9px] text-slate-500 font-bold">{toBengaliDigits(entry.receivedDate)}</div>
                      </div>

                      {/* Part 2: Presentation Info (Interactive) */}
                      <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-1 h-full bg-blue-600"></div>
                         <div className="text-[9px] font-black text-blue-700 uppercase tracking-tighter mb-2 flex items-center gap-1"><UserCheck size={10} /> ২. উপস্থাপনের তথ্য</div>
                         
                         <div className="space-y-2">
                           <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase">উপস্থাপনের তারিখ</span>
                              <input 
                                type="date" 
                                className="w-full h-7 px-2 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400 focus:bg-white transition-all bg-white" 
                                value={entry.presentationDate || ''} 
                                onChange={e => handleInlineUpdate(entry, 'presentationDate', e.target.value)}
                              />
                           </div>
                           <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase">যার কাছে উপস্থাপন করা হবে</span>
                              <PremiumInlineSelect 
                                value={entry.presentedToName || ''} 
                                onSelect={val => handleInlineUpdate(entry, 'presentedToName', val)}
                              />
                           </div>
                         </div>
                      </div>
                   </div>
                </td>
                <td className={tdCls + " text-center"}>
                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${entry.isOnline === 'হ্যাঁ' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {entry.isOnline}
                   </span>
                </td>
                <td className={tdCls + " text-center"}>
                   <div className="text-center space-y-1">
                      <div className="font-black text-amber-700 text-[10px]">{entry.issueLetterNo || '-'}</div>
                      {entry.issueLetterDate && <div className="text-[9px] bg-amber-50 rounded-lg px-2 py-0.5 inline-block text-amber-600 font-bold border border-amber-100">{toBengaliDigits(entry.issueLetterDate)}</div>}
                   </div>
                </td>
                <td className={tdCls + " relative group/action"}>
                   {entry.remarks || '-'}
                   {isAdmin && (
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all no-print">
                       {entry.approvalStatus === 'pending' && onApprove && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onApprove(entry.id); }}
                           className="p-1 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-400"
                           title="অনুমোদন দিন"
                         >
                           <Check size={11} strokeWidth={3} />
                         </button>
                       )}
                       {entry.approvalStatus === 'pending' && onReject && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); onReject(entry.id); }}
                           className="p-1 bg-rose-600 text-white rounded-lg shadow-lg hover:bg-rose-700 transition-all active:scale-95 border border-rose-400"
                           title="বাতিল করুন"
                         >
                           <XCircle size={11} />
                         </button>
                       )}
                       <button 
                         onClick={(e) => { e.stopPropagation(); onEdit?.(entry); }}
                         className="p-1 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 border border-blue-400"
                         title="এডিট করুন"
                       >
                         <Pencil size={11} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); onDelete?.(entry.id); }}
                         className="p-1 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-all active:scale-95 border border-red-400"
                         title="মুছে ফেলুন"
                       >
                         <Trash2 size={11} />
                       </button>
                     </div>
                   )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={11} className="py-20 text-center bg-white">
                   <div className="flex flex-col items-center gap-4 opacity-30">
                      <Mail size={48} />
                      <p className="text-lg font-black text-slate-900 tracking-widest">রেজিস্টারে কোনো তথ্য পাওয়া যায়নি</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-[110]">
            <tr className="bg-slate-900 text-white font-black text-[11px] h-11 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
              <td colSpan={2} className="px-4 text-left border-t border-slate-700">সর্বমোট (এন্ট্রি সংখ্যা):</td>
              <td colSpan={1} className="px-4 text-center border-t border-slate-700 text-emerald-400">{toBengaliDigits(entries.length)} টি</td>
              <td colSpan={3} className="border-t border-slate-700"></td>
              <td className="px-4 text-center border-t border-slate-700 text-blue-400">
                {toBengaliDigits(entries.reduce((sum, e) => sum + parseBengaliNumber(e.totalAmount), 0))}
              </td>
              <td colSpan={4} className="border-t border-slate-700"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CorrespondenceTable;
