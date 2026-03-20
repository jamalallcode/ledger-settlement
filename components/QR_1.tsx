import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate, isWithinInterval, parseISO } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { formatDateBN } from '../utils/numberUtils';

interface QRProps {
  entries: SettlementEntry[];
  activeCycle: any;
  IDBadge: React.FC<{ id: string; isLayoutEditable?: boolean }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  isLayoutEditable?: boolean;
}

const QR_1: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', isLayoutEditable }) => {
  // Date calculation based on user's logic: 
  // "তিন মাস বলতে পূর্ববর্তী মাসের ১৬ তারিখ হতে ৩য় মাসের ১৫ তারিখ পযন্ত"
  const startDate = setDate(subMonths(activeCycle.start, 1), 16);
  const endDate = setDate(addMonths(activeCycle.start, 2), 15);

  const reportData = useMemo(() => {
    // Filter entries for bilateral meetings within the date range
    const filtered = entries.filter(e => {
      if (e.meetingType !== 'দ্বিপক্ষীয় সভা') return false;
      if (!e.meetingDate) return false;
      
      try {
        const mDate = parseISO(e.meetingDate);
        return isWithinInterval(mDate, { start: startDate, end: endDate });
      } catch (err) {
        return false;
      }
    });

    // Group by ministry
    const groups: Record<string, any> = {};
    filtered.forEach(e => {
      const min = e.ministryName || 'অন্যান্য';
      if (!groups[min]) {
        groups[min] = {
          ministry: min,
          meetingCount: 0,
          meetingDates: [] as string[],
          discussedParas: 0,
          recommendedParas: 0,
          minutesDate: '', // Usually from minutesNoDate or similar
          settlementLetterDate: e.issueLetterNoDate || '',
          settledAmount: 0,
          recovery: 0,
          adjustment: 0,
          others: 0
        };
      }
      groups[min].meetingCount += 1;
      if (e.meetingDate) groups[min].meetingDates.push(e.meetingDate);
      groups[min].discussedParas += parseBengaliNumber(e.meetingSentParaCount || '0');
      groups[min].recommendedParas += parseBengaliNumber(e.meetingRecommendedParaCount || '0');
      groups[min].settledAmount += (e.totalRec || 0) + (e.totalAdj || 0);
      groups[min].recovery += (e.totalRec || 0);
      groups[min].adjustment += (e.totalAdj || 0);
    });

    return Object.values(groups).filter(g => {
      const matchMinistry = filterMinistry === '' || g.ministry.includes(filterMinistry);
      const matchSearch = searchTerm === '' || g.ministry.toLowerCase().includes(searchTerm.toLowerCase());
      return matchMinistry && matchSearch;
    });
  }, [entries, startDate, endDate, filterMinistry, searchTerm]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => ({
      meetingCount: acc.meetingCount + curr.meetingCount,
      discussedParas: acc.discussedParas + curr.discussedParas,
      recommendedParas: acc.recommendedParas + curr.recommendedParas,
      settledAmount: acc.settledAmount + curr.settledAmount,
      recovery: acc.recovery + curr.recovery,
      adjustment: acc.adjustment + curr.adjustment
    }), {
      meetingCount: 0, discussedParas: 0, recommendedParas: 0, settledAmount: 0, recovery: 0, adjustment: 0
    });
  }, [reportData]);

  const thCls = "border-r border-b border-slate-400 p-2 text-[11px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-700 text-center align-middle font-bold";

  return (
    <div id="qr-1-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-1-container" isLayoutEditable={isLayoutEditable} />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ১
          </h1>
          
          <div className="mt-4 flex justify-center mb-4">
            <div className="inline-flex items-center gap-3 px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
              <span className="text-blue-400">ছক: ৪(খ)</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mb-4 text-[12px] font-bold text-slate-800 space-y-1">
        <p className="underline underline-offset-4 decoration-1">বিষয়ঃ নিরীক্ষা পরিদর্শন প্রতিবেদনে (AIR) অন্তর্ভুক্ত আপত্তি নিষ্পত্তির অগ্রগতি সংক্রান্ত ত্রৈমাসিক প্রতিবেদন (মন্ত্রণালয়ভিত্তিক)</p>
        <p>দ্বি-পক্ষীয় সভার প্রেক্ষিতে নিষ্পত্তির সুপারিশ সংক্রান্ত (ত্রৈমাসিক) প্রতিবেদন</p>
        <p>শাখার নামঃ নন এসএফআই</p>
        <p>মাসের নামঃ {formatDateBN(format(startDate, 'yyyy-MM-dd'))} হতে {formatDateBN(format(endDate, 'yyyy-MM-dd'))} খ্রি: তারিখ পর্যন্ত</p>
      </div>

      {/* Table Section */}
      <div className="table-container qr-table-container overflow-auto border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-[34px]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={`${thCls} w-[62px]`}>দ্বি-পক্ষীয় সভার সংখ্যা</th>
              <th rowSpan={2} className={thCls}>সভা অনুষ্ঠানের তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[62px]`}>আলোচিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thCls}>সুপারিশকৃত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thCls}>কার্য বিবরণী প্রাপ্তির তারিখ</th>
              <th rowSpan={2} className={thCls}>মীমাংসাপত্র জারীর তারিখ</th>
              <th rowSpan={2} className={thCls}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={thCls}>সভার প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={`${thCls.replace('p-2', 'p-1')} w-[42px]`}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>অন্যান্য</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(n => (
                <th key={n} className={`${
                  n === 13 ? thCls.replace('p-2', 'p-1') + " w-[42px]" : 
                  (n === 3 || n === 5) ? thCls + " w-[62px]" :
                  thCls
                } text-[10px] font-bold text-slate-500`}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>
                  <HighlightText text={row.ministry} searchTerm={searchTerm} />
                </td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits(row.meetingCount.toString())}</td>
                <td className={numTdCls}>
                  {row.meetingDates.map(d => toBengaliDigits(format(parseISO(d), 'dd-MM-yy'))).join(', ')}
                </td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits(row.discussedParas.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.recommendedParas.toString())}</td>
                <td className={numTdCls}>{row.minutesDate ? toBengaliDigits(row.minutesDate) : ""}</td>
                <td className={numTdCls}>{row.settlementLetterDate ? toBengaliDigits(row.settlementLetterDate) : ""}</td>
                <td className={numTdCls}>{toBengaliDigits(row.settledAmount.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.recovery.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.adjustment.toString())}</td>
                <td className={numTdCls}></td>
                <td className={tdCls.replace('p-2', 'p-1') + " w-[42px]"}></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-bold">
              <td className={numTdCls} colSpan={2}>মোট</td>
              <td className={`${numTdCls} w-[62px]`}>
                {toBengaliDigits(totals.meetingCount.toString())}
              </td>
              <td className={numTdCls}></td>
              <td className={`${numTdCls} w-[62px]`}>
                {toBengaliDigits(totals.discussedParas.toString())}
              </td>
              <td className={numTdCls}>
                {toBengaliDigits(totals.recommendedParas.toString())}
              </td>
              <td className={numTdCls}></td>
              <td className={numTdCls}></td>
              <td className={numTdCls}>
                {toBengaliDigits(totals.settledAmount.toString())}
              </td>
              <td className={numTdCls}>
                {toBengaliDigits(totals.recovery.toString())}
              </td>
              <td className={numTdCls}>
                {toBengaliDigits(totals.adjustment.toString())}
              </td>
              <td className={numTdCls}></td>
              <td className={tdCls.replace('p-2', 'p-1') + " w-[42px]"}></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};

export default QR_1;