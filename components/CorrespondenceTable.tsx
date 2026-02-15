import React, { useMemo } from 'react';
import { Mail, Calendar, Hash, FileText, User, MapPin, Inbox, Computer, CheckCircle2, ChevronRight, ArrowRightCircle, ListOrdered, Banknote, BookOpen, Clock, Printer } from 'lucide-react';
// Added parseBengaliNumber to imports to fix the error on line 160
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';

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
  sentParaCount: string;
  receiverName: string;
  receivedDate: string;
  isOnline: string;
  remarks?: string;
  createdAt: string;
}

interface CorrespondenceTableProps {
  entries: CorrespondenceEntry[];
  onBack: () => void;
  isLayoutEditable?: boolean;
}

const CorrespondenceTable: React.FC<CorrespondenceTableProps> = ({ entries, onBack, isLayoutEditable }) => {
  
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
      <span onClick={handleCopy} className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  const thCls = "border border-slate-300 px-2 py-3 text-center align-middle font-black text-slate-900 text-[12px] bg-slate-100 sticky top-0 z-[100] shadow-[inset_0_-1px_0_#cbd5e1]";
  const tdCls = "border border-slate-300 px-3 py-3 text-[12px] text-slate-800 font-bold leading-relaxed align-top bg-white transition-colors group-hover:bg-blue-50/50";
  const labelCls = "text-[11px] font-black text-emerald-700 mr-1 shrink-0";
  const valCls = "text-[12px] font-bold text-slate-900";

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
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Incoming Correspondence Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট করুন</button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container border border-slate-300 rounded-sm overflow-visible relative shadow-2xl bg-white">
        <IDBadge id="table-correspondence-ledger" />
        <table className="w-full border-separate border-spacing-0 table-fixed">
          <colgroup>
            <col className="w-[45px]" />
            <col className="w-[200px]" />
            <col className="w-[240px]" />
            <col className="w-[240px]" />
            <col className="w-[110px]" />
            <col className="w-[90px]" />
            <col className="w-[110px]" />
            <col className="w-[140px]" />
            <col className="w-[80px]" />
            <col className="w-[120px]" />
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
              <th className={thCls}>গৃহীতার নাম ও গ্রহণের তারিখ</th>
              <th className={thCls}>অনলাইনে প্রাপ্তি (হ্যাঁ/না)</th>
              <th className={thCls}>মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((entry, idx) => (
              <tr key={entry.id} className="group transition-all">
                <td className={tdCls + " text-center font-black"}>{toBengaliDigits(idx + 1)}</td>
                <td className={tdCls}>{entry.description}</td>
                <td className={tdCls}>
                   <div className="space-y-1.5">
                      <div className="flex items-start"><span className={labelCls}>শাখার ধরণ:</span> <span className={valCls}>{entry.paraType}</span></div>
                      <div className="flex items-start"><span className={labelCls}>পত্র নং ও তারিখ:</span> <span className={valCls}>{entry.letterNo} ({toBengaliDigits(entry.letterDate)})</span></div>
                      <div className="flex items-start"><span className={labelCls}>প্রেরিত মোট অনুচ্ছেদ সংখ্যা:</span> <span className={valCls}>{toBengaliDigits(entry.totalParas)} টি</span></div>
                      <div className="flex items-start"><span className={labelCls}>মোট জড়িত টাকা।</span> <span className={valCls}>{toBengaliDigits(entry.totalAmount)}</span></div>
                   </div>
                </td>
                <td className={tdCls}>
                   <div className="space-y-1.5">
                      <div className="flex items-start"><span className={labelCls}>ডায়েরি নং ও তারিখ:</span> <span className={valCls}>{entry.diaryNo} ({toBengaliDigits(entry.diaryDate)})</span></div>
                      <div className="flex items-start"><span className={labelCls}>শাখায় প্রাপ্তির তারিখ:</span> <span className={valCls}>{toBengaliDigits(entry.receiptDate)}</span></div>
                      <div className="flex items-start"><span className={labelCls}>ডিজিটাল নথি নং-:</span> <span className={valCls}>{entry.digitalFileNo}</span></div>
                      <div className="flex items-start"><span className={labelCls}>উপস্থাপনের তারিখ:</span> <span className={valCls}>{toBengaliDigits(entry.presentationDate)}</span></div>
                   </div>
                </td>
                <td className={tdCls + " text-center"}>{entry.paraType}</td>
                <td className={tdCls + " text-center font-black text-blue-700"}>{toBengaliDigits(entry.sentParaCount)} টি</td>
                <td className={tdCls + " text-center font-black"}>{toBengaliDigits(entry.totalAmount)}</td>
                <td className={tdCls}>
                   <div className="text-center space-y-1">
                      <div className="font-black text-slate-900">{entry.receiverName}</div>
                      <div className="text-[10px] bg-slate-100 rounded-lg px-2 py-1 inline-block text-slate-500 font-bold">{toBengaliDigits(entry.receivedDate)}</div>
                   </div>
                </td>
                <td className={tdCls + " text-center"}>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${entry.isOnline === 'হ্যাঁ' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {entry.isOnline}
                   </span>
                </td>
                <td className={tdCls}>{entry.remarks || '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="py-20 text-center bg-white">
                   <div className="flex flex-col items-center gap-4 opacity-30">
                      <Mail size={48} />
                      <p className="text-lg font-black text-slate-900 tracking-widest">রেজিস্টারে কোনো তথ্য পাওয়া যায়নি</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-[110]">
            <tr className="bg-slate-900 text-white font-black text-[12px] h-12 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
              <td colSpan={2} className="px-4 text-left border-t border-slate-700">সর্বমোট (এন্ট্রি সংখ্যা):</td>
              <td colSpan={1} className="px-4 text-center border-t border-slate-700 text-emerald-400">{toBengaliDigits(entries.length)} টি</td>
              <td colSpan={3} className="border-t border-slate-700"></td>
              <td className="px-4 text-center border-t border-slate-700 text-blue-400">
                {/* Fixed reference error by importing parseBengaliNumber from utils/numberUtils */}
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
