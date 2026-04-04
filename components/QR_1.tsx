import React from 'react';
import { Printer, X } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

interface QRProps {
  entries: SettlementEntry[];
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
}

const QR_1: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, onBack, searchTerm = '', filterMinistry = '' }) => {
  // Date calculation based on user's logic: 
  // "তিন মাস বলতে পূর্ববর্তী মাসের ১৬ তারিখ হতে ৩য় মাসের ১৫ তারিখ পযন্ত"
  const startDate = setDate(subMonths(activeCycle.start, 1), 16);
  const endDate = setDate(addMonths(activeCycle.start, 2), 15);

  const formatDateBangla = (date: Date) => {
    return toBengaliDigits(format(date, 'dd/MM/yyyy'));
  };

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const filteredData = entries.filter(e => {
    // Filter by Non-SFI
    if (robustNormalize(e.paraType) !== robustNormalize('নন এসএফআই')) return false;
    
    // Filter by Bi-partite meeting
    const mType = robustNormalize(e.meetingType || '');
    if (!mType.includes(robustNormalize('দ্বিপক্ষীয়'))) return false;

    // Filter by Date Range (Issue Date)
    const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
    if (!issueDateStr) return false;
    const issueDate = new Date(issueDateStr);
    if (issueDate < startDate || issueDate > endDate) return false;

    // Filter by Ministry
    const matchMinistry = filterMinistry === '' || robustNormalize(e.ministryName).includes(robustNormalize(filterMinistry));
    
    // Filter by Search Term
    const matchSearch = searchTerm === '' || 
      robustNormalize(e.ministryName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      robustNormalize(e.entityName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      robustNormalize(e.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchMinistry && matchSearch;
  });

  const totals = filteredData.reduce((acc, curr) => ({
    sentPara: acc.sentPara + (parseInt(toEnglishDigits(curr.meetingSentParaCount || '0')) || 0),
    settledPara: acc.settledPara + (parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0),
    amount: acc.amount + (curr.involvedAmount || 0),
    recovery: acc.recovery + (curr.totalRec || 0),
    adjustment: acc.adjustment + (curr.totalAdj || 0),
    others: acc.others + 0, // Placeholder for others if needed
  }), { sentPara: 0, settledPara: 0, amount: 0, recovery: 0, adjustment: 0, others: 0 });

  const thCls = "border-r border-b border-slate-400 p-2 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white text-center align-middle font-bold bg-black";

  return (
    <div id="qr-1-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-1-container" />
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 text-slate-500 shadow-sm transition-all group z-[300] no-print"
        title="ফিরে যান"
      >
        <X size={18} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ১
          </h1>

          {/* Date Range Pill */}
          <div className="mt-4 mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-sm">
                ত্রৈমাসিক রিটার্ন - ১ | {activeCycle.label}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
          <div className="inline-block border-b-2 border-slate-900 pb-0.5">
            <span className="text-md font-black text-slate-900">ছক: ৪(খ)</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mb-4 text-[12px] font-bold text-slate-800 space-y-1">
        <p className="underline underline-offset-4 decoration-1">বিষয়ঃ নিরীক্ষা পরিদর্শন প্রতিবেদনে (AIR) অন্তর্ভুক্ত আপত্তি নিষ্পত্তির অগ্রগতি সংক্রান্ত ত্রৈমাসিক প্রতিবেদন (মন্ত্রণালয়ভিত্তিক)</p>
        <p>দ্বি-পক্ষীয় সভার প্রেক্ষিতে নিষ্পত্তির সুপারিশ সংক্রান্ত (ত্রৈমাসিক) প্রতিবেদন</p>
        <p>শাখার নামঃ নন এসএফআই</p>
        <p>মাসের নামঃ {formatDateBangla(startDate)} হতে {formatDateBangla(endDate)} খ্রি: তারিখ পর্যন্ত</p>
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
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>
                  <HighlightText text={`${row.ministryName}, ${row.entityName} (${toBengaliDigits(row.auditYear)})`} searchTerm={searchTerm} />
                </td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits("১")}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingDate || '')}</td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits(row.meetingSentParaCount || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingSettledParaCount || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingResponseDate || '')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.issueLetterNoDate || '')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.involvedAmount?.toString() || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalRec?.toString() || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalAdj?.toString() || '০')}</td>
                <td className={numTdCls}></td>
                <td className={tdCls.replace('p-2', 'p-1') + " w-[42px]"}>{row.remarks}</td>
              </tr>
            ))}
            {/* Empty rows if data is sparse */}
            {filteredData.length < 5 && Array.from({ length: 5 - filteredData.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-10">
                {Array.from({ length: 13 }).map((_, j) => (
                  <td key={j} className="border-r border-b border-slate-400"></td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="font-black h-[32px] qr-sticky-footer qr-sticky-footer-bottom">
            <tr className="bg-black text-white">
              <td className={footerNumTdCls} colSpan={2}>মোট</td>
              <td className={`${footerNumTdCls} w-[62px]`}>
                {toBengaliDigits(filteredData.length.toString())}
              </td>
              <td className={footerNumTdCls}></td>
              <td className={`${footerNumTdCls} w-[62px]`}>
                {toBengaliDigits(totals.sentPara.toString())}
              </td>
              <td className={footerNumTdCls}>
                {toBengaliDigits(totals.settledPara.toString())}
              </td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}>
                {toBengaliDigits(totals.amount.toString())}
              </td>
              <td className={footerNumTdCls}>
                {toBengaliDigits(totals.recovery.toString())}
              </td>
              <td className={footerNumTdCls}>
                {toBengaliDigits(totals.adjustment.toString())}
              </td>
              <td className={footerNumTdCls}></td>
              <td className={footerTdCls + " w-[42px]"}></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};

export default QR_1;