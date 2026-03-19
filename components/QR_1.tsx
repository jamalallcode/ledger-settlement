import React from 'react';
import { Printer } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import HighlightText from './HighlightText';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
}

const QR_1: React.FC<QRProps> = ({ activeCycle, IDBadge, searchTerm = '', filterMinistry = '' }) => {
  // Date calculation based on user's logic: 
  // "তিন মাস বলতে পূর্ববর্তী মাসের ১৬ তারিখ হতে ৩য় মাসের ১৫ তারিখ পযন্ত"
  // If activeCycle.start is the beginning of the quarter (e.g., Oct 1st)
  const startDate = setDate(subMonths(activeCycle.start, 1), 16);
  const endDate = setDate(addMonths(activeCycle.start, 2), 15);

  const formatDateBangla = (date: Date) => {
    const d = toBengaliDigits(format(date, 'dd/MM/yyyy'));
    return d;
  };

  const ministries = [
    "বস্ত্র ও পাট মন্ত্রণালয়",
    "শিল্প মন্ত্রণালয়",
    "বেসামরিক বিমান ও পর্যটন মন্ত্রণালয়",
    "বাণিজ্য মন্ত্রণালয়",
    "আর্থিক প্রতিষ্ঠান বিভাগ, জনতা ব্যাংক পিএলসি, বিভাগীয় কার্যালয়, খুলনা ও এর আওতাধীন শাখাসমূহ (২০০৫-০৬ ও ২-১৬-১৭)"
  ];

  const filteredMinistries = ministries.filter(m => {
    const matchMinistry = filterMinistry === '' || m.includes(filterMinistry);
    const matchSearch = searchTerm === '' || m.toLowerCase().includes(searchTerm.toLowerCase());
    return matchMinistry && matchSearch;
  });

  const thCls = "border-r border-b border-slate-400 p-2 text-[11px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-700 text-center align-middle font-bold";

  return (
    <div id="qr-1-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-1-container" />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ১
          </h1>
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
            {filteredMinistries.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>
                  <HighlightText text={m} searchTerm={searchTerm} />
                </td>
                <td className={`${numTdCls} w-[62px]`}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("১") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("১৬-০৭-২৫") : ""}</td>
                <td className={`${numTdCls} w-[62px]`}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("৩০") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("২৬") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("১৮-০৮-২৫") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("০৭-১০-২৫") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("১৪০৪৩২৬৬১") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("২৫৫৭৭৪৩") : ""}</td>
                <td className={numTdCls}>{m.includes('আর্থিক প্রতিষ্ঠান বিভাগ') ? toBengaliDigits("১৩৭৮৭৪৮১৮") : ""}</td>
                <td className={numTdCls}></td>
                <td className={tdCls.replace('p-2', 'p-1') + " w-[42px]"}></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-bold">
              <td className={numTdCls} colSpan={2}>মোট</td>
              <td className={`${numTdCls} w-[62px]`}>
                {toBengaliDigits(filteredMinistries.filter(m => m.includes('আর্থিক প্রতিষ্ঠান বিভাগ')).length.toString())}
              </td>
              <td className={numTdCls}></td>
              <td className={`${numTdCls} w-[62px]`}>
                {toBengaliDigits((filteredMinistries.filter(m => m.includes('আর্থিক প্রতিষ্ঠান বিভাগ')).length * 30).toString())}
              </td>
              <td className={numTdCls}>
                {toBengaliDigits((filteredMinistries.filter(m => m.includes('আর্থিক প্রতিষ্ঠান বিভাগ')).length * 26).toString())}
              </td>
              <td className={numTdCls}></td>
              <td className={numTdCls}></td>
              <td className={numTdCls}>
                {toBengaliDigits((filteredMinistries.filter(m => m.includes('আর্থিক প্রতিষ্ঠান বিভাগ')).length * 140432661).toString())}
              </td>
              <td className={numTdCls}>
                {toBengaliDigits((filteredMinistries.filter(m => m.includes('আর্থিক প্রতিষ্ঠান বিভাগ')).length * 2557743).toString())}
              </td>
              <td className={numTdCls}>
                {toBengaliDigits((filteredMinistries.filter(m => m.includes('আর্থিক প্রতিষ্ঠান বিভাগ')).length * 137874818).toString())}
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
