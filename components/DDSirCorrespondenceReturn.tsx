import React from 'react';
import { ChevronLeft, Printer, Mail, CalendarRange, Search, FileEdit, UserCheck } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format } from 'date-fns';

interface DDSirCorrespondenceReturnProps {
  entries: any[];
  activeCycle: { start: Date; end: Date; label: string };
  onBack: () => void;
  isLayoutEditable?: boolean;
}

const DDSirCorrespondenceReturn: React.FC<DDSirCorrespondenceReturnProps> = ({ 
  entries, 
  activeCycle, 
  onBack, 
  isLayoutEditable 
}) => {
  const reportingDateBN = toBengaliDigits(format(new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth() + 1, 0), 'dd/MM/yyyy'));

  const thS = "border border-slate-300 px-1 py-3 font-black text-center text-[11px] bg-slate-100 text-slate-900 leading-tight align-middle sticky top-0 z-[100] shadow-[inset_0_-1px_0_#cbd5e1]";
  const tdS = "border border-slate-300 px-3 py-2.5 text-[11px] text-center font-bold leading-tight bg-white align-middle break-words";

  const IDBadge = ({ id }: { id: string }) => {
    if (!isLayoutEditable) return null;
    return (
      <span className="absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] shadow-xl">
        #{id}
      </span>
    );
  };

  return (
    <div className="space-y-6 py-2 w-full animate-report-page relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">স্পেশাল রিপোর্ট:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন (ডিডি স্যার)</span>
          </div>
        </div>
        <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
          <Printer size={18} /> প্রিন্ট করুন
        </button>
      </div>

      <div className="bg-white border border-slate-300 shadow-2xl w-full p-8 relative animate-table-entrance">
        <IDBadge id="dd-sir-report-table" />
        <div className="text-center py-6 border-b-2 border-slate-100 mb-8">
          <h1 className="text-2xl font-black uppercase text-slate-900 leading-tight">{OFFICE_HEADER.main}</h1>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">{OFFICE_HEADER.sub}</h2>
          <div className="mt-4 inline-flex items-center gap-3 px-8 py-2 bg-indigo-900 text-white rounded-xl text-xs font-black border border-indigo-700 shadow-md">
            <span>ডিডি স্যারের নিকট উপস্থাপনের জন্য বকেয়া চিঠিপত্রের তালিকা ({reportingDateBN})</span>
          </div>
        </div>

        <div className="table-container relative">
          <table className="w-full border-separate table-fixed border-spacing-0">
            <colgroup>
              <col className="w-[50px]" />
              <col className="w-[250px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[100px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead>
              <tr>
                <th className={thS}>ক্র: নং</th>
                <th className={thS}>পত্রের সংক্ষিপ্ত বিবরণ ও নিরীক্ষা সাল</th>
                <th className={thS}>ডায়েরি নং ও তারিখ</th>
                <th className={thS}>পত্রের স্মারক নং ও তারিখ</th>
                <th className={thS}>অনলাইনে প্রাপ্তি</th>
                <th className={thS}>বর্তমান অবস্থান</th>
                <th className={thS}>মন্তব্য</th>
              </tr>
            </thead>
            <tbody>
              {entries.length > 0 ? entries.map((entry, idx) => (
                <tr key={entry.id} className="group hover:bg-indigo-50/30 transition-colors">
                  <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                  <td className={tdS + " text-left px-4"}>{entry.description}</td>
                  <td className={tdS}>{entry.diaryNo}<br/><span className="text-[10px] text-slate-500">{toBengaliDigits(entry.diaryDate)}</span></td>
                  <td className={tdS}>{entry.letterNo}<br/><span className="text-[10px] text-slate-500">{toBengaliDigits(entry.letterDate)}</span></td>
                  <td className={tdS}>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${entry.isOnline === 'হ্যাঁ' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {entry.isOnline}
                    </span>
                  </td>
                  <td className={tdS}>
                    <div className="flex flex-col items-center gap-1">
                      <UserCheck size={12} className="text-indigo-500" />
                      <span>{entry.presentedToName || 'শাখা প্রধান'}</span>
                    </div>
                  </td>
                  <td className={tdS + " italic text-slate-400"}>{entry.remarks || 'নিষ্পত্তি কার্যক্রম চলমান'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center font-bold text-slate-400 bg-slate-50 italic">
                    বর্তমানে ডিডি স্যারের নিকট উপস্থাপনের জন্য কোনো চিঠি বকেয়া নেই।
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-[11px] h-12 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                <td colSpan={2} className="px-6 text-left border-t border-slate-700 bg-slate-900">মোট উপস্থাপিত চিঠিপত্র:</td>
                <td colSpan={1} className="px-4 text-center border-t border-slate-700 bg-slate-900 text-indigo-400">{toBengaliDigits(entries.length)} টি</td>
                <td colSpan={4} className="border-t border-slate-700 bg-slate-900"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DDSirCorrespondenceReturn;
