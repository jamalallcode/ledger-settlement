
import React from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat } from 'date-fns';

interface CorrespondenceDhakaReturnProps {
  filteredCorrespondence: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
}

const CorrespondenceDhakaReturn: React.FC<CorrespondenceDhakaReturnProps> = ({
  filteredCorrespondence,
  activeCycle,
  setSelectedReportType,
  HistoricalFilter,
  IDBadge
}) => {
  const thS = "border border-slate-300 px-1 py-1 font-black text-center text-[10px] md:text-[11px] bg-slate-200 text-slate-900 leading-tight align-middle h-full shadow-[inset_0_0_0_1px_#cbd5e1] bg-clip-border";
  const tdS = "border border-slate-300 px-2 py-2 text-[10px] md:text-[11px] text-center font-bold leading-tight bg-white h-[40px] align-middle overflow-hidden break-words";
  const reportingDateBN = toBengaliDigits(dateFnsFormat(new Date(activeCycle.start.getFullYear(), activeCycle.start.getMonth() + 1, 0), 'dd/MM/yyyy'));

  return (
    <div className="space-y-4 py-2 w-full animate-report-page relative">
      <IDBadge id="correspondence-report-view" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedReportType(null)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">রিপোর্ট টাইপ:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">চিঠিপত্র সংক্রান্ত মাসিক রিটার্ন (ঢাকা)</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <HistoricalFilter />
          <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-6 relative animate-table-entrance">
        <div className="text-center py-6 border-b-2 border-slate-100 mb-6">
          <h1 className="text-2xl font-black uppercase text-slate-900 leading-tight">{OFFICE_HEADER.main}</h1>
          <h2 className="text-xl font-black text-slate-800 leading-tight">{OFFICE_HEADER.sub}</h2>
          <h3 className="text-lg font-black text-slate-700 leading-tight">{OFFICE_HEADER.address}</h3>
          <div className="mt-4 inline-flex items-center gap-3 px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
            <span className="text-blue-400">শাখা ভিত্তিক {reportingDateBN} খ্রি: তারিখ পর্যন্ত বকেয়া চিঠিপত্রের তালিকা।</span>
          </div>
        </div>

        <div className="table-container relative overflow-visible">
          <table className="w-full border-separate table-fixed border-spacing-0">
            <colgroup>
              <col className="w-[40px]" />
              <col className="w-[150px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[55px]" />
              <col className="w-[75px]" />
              <col className="w-[55px]" />
              <col className="w-[55px]" />
              <col className="w-[55px]" />
              <col className="w-[60px]" />
              <col className="w-[70px]" />
              <col className="w-[70px]" />
              <col className="w-[50px]" />
            </colgroup>
            <thead>
              <tr className="h-[42px]">
                <th rowSpan={2} className={thS}>ক্রমিক নং</th>
                <th rowSpan={2} className={thS}>এনটিটি/প্রতিষ্ঠানের নাম</th>
                <th rowSpan={2} className={thS}>ডায়েরি নং ও তারিখ</th>
                <th rowSpan={2} className={thS}>পত্রের স্মারক নং ও তারিখ</th>
                <th colSpan={5} className={thS}>চিঠি-পত্রের ধরণ ও অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={thS}>AMMS-এ এন্ট্রি হয়েছে কিনা? হ্যাঁ/না</th>
                <th rowSpan={2} className={thS}>উপস্থাপনের তারিখ</th>
                <th rowSpan={2} className={thS}>বর্তমান অবস্থান</th>
                <th rowSpan={2} className={thS}>মন্তব্য</th>
              </tr>
              <tr className="h-[38px]">
                <th className={thS}>বিএসআর (SFI)</th>
                <th className={thS}>বিএসআর (NON-SFI)</th>
                <th className={thS}>ত্রি-পক্ষীয় (SFI)</th>
                <th className={thS}>দ্বি-পক্ষীয় (NON-SFI)</th>
                <th className={thS}>অন্যান্য</th>
              </tr>
            </thead>
            <tbody>
              {filteredCorrespondence.length > 0 ? filteredCorrespondence.map((entry, idx) => (
                <tr key={entry.id} className="group hover:bg-blue-50/50 transition-colors">
                  <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                  <td className={`${tdS} text-left px-2`}>{entry.description}</td>
                  <td className={tdS}>{entry.diaryNo}<br/>{toBengaliDigits(entry.diaryDate)}</td>
                  <td className={tdS}>{entry.letterNo}<br/>{toBengaliDigits(entry.letterDate)}</td>
                  <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{entry.letterType === 'বিএসআর' && entry.paraType === 'নন এসএফআই' ? `(অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{entry.letterType.includes('ত্রিপক্ষীয় সভা') && entry.paraType === 'এসএফআই' ? `ত্রিপক্ষীয় (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>{entry.letterType.includes('দ্বিপক্ষীয় সভা') && entry.paraType === 'নন এসএফআই' ? `দ্বি-পক্ষীয় (অনু: ${toBengaliDigits(entry.totalParas)}টি)` : ''}</td>
                  <td className={tdS}>-</td>
                  <td className={tdS}>{entry.isOnline === 'হ্যাঁ' ? 'হ্যাঁ' : 'না'}</td>
                  <td className={tdS}>{toBengaliDigits(entry.presentationDate)}</td>
                  <td className={tdS}>{entry.presentedToName || 'অডিটর'}</td>
                  <td className={tdS}>{entry.remarks || 'চলমান'}</td>
                </tr>
              )) : (
                <tr><td colSpan={13} className="py-20 text-center font-black text-slate-400 bg-slate-50 italic">এই সাইকেলে কোনো চিঠিপত্র তথ্য পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-[120]">
              <tr className="bg-slate-50 text-slate-900 font-black text-[11px] h-11 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t-2 border-slate-300">
                <td colSpan={2} className="px-4 text-left border-t border-slate-300 bg-slate-50">সর্বমোট চিঠিপত্র সংখ্যা:</td>
                <td colSpan={2} className="px-4 text-center border-t border-slate-300 bg-slate-50 text-emerald-600">{toBengaliDigits(filteredCorrespondence.length)} টি</td>
                <td colSpan={9} className="border-t border-slate-300 bg-slate-50"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CorrespondenceDhakaReturn;
