import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
}

const QR_1: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
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

  const thCls = "border-r border-b border-slate-400 p-2 text-[11px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[11px] text-slate-700 text-center align-middle font-bold";

  return (
    <div id="qr-1-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-1-container" />
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black text-slate-900">বাণিজ্যিক অডিট অধিদপ্তর</h1>
        <h2 className="text-md font-bold text-slate-800">আঞ্চলিক কার্যালয় (সে-৬)</h2>
        <p className="text-sm font-bold text-slate-700">বিটিবিএল ভবন (৯ম ও ১০ম) তলা, খুলনা।</p>
        <div className="mt-2 inline-block border-b-2 border-slate-900 pb-0.5">
          <span className="text-md font-black text-slate-900">ছক: ৪(খ)</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[12px] font-bold text-slate-800">
        <div className="space-y-1">
          <p>অডিট অধিদপ্তরের নামঃ বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা।</p>
          <p className="pt-2">বিষয়ঃ নিরীক্ষা পরিদর্শন প্রতিবেদনে (AIR) অন্তর্ভুক্ত আপত্তি নিষ্পত্তির অগ্রগতি সংক্রান্ত ত্রৈমাসিক প্রতিবেদন (মন্ত্রণালয়ভিত্তিক)</p>
          <p>ক. দ্বি-পক্ষীয় সভার প্রেক্ষিতে নিষ্পত্তির সুপারিশ সংক্রান্ত (ত্রৈমাসিক) প্রতিবেদন</p>
        </div>
        <div className="text-right space-y-1">
          <p>শাখার নামঃ নন এসএফআই</p>
          <div className="pt-8">
            <p>মাসের নামঃ {formatDateBangla(startDate)} হতে {formatDateBangla(endDate)} খ্রি: তারিখ পর্যন্ত</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-auto border-t border-l border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[1200px] !table-auto">
          <thead className="bg-slate-100">
            <tr>
              <th rowSpan={2} className={thCls}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[25%]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={thCls}>দ্বি-পক্ষীয় সভার সংখ্যা</th>
              <th rowSpan={2} className={thCls}>সভা অনুষ্ঠানের তারিখ</th>
              <th rowSpan={2} className={thCls}>আলোচিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thCls}>সুপারিশকৃত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thCls}>কার্য বিবরণী প্রাপ্তির তারিখ</th>
              <th rowSpan={2} className={thCls}>মীমাংসাপত্র জারীর তারিখ</th>
              <th rowSpan={2} className={thCls}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={thCls}>সভার প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={thCls}>মন্তব্য</th>
            </tr>
            <tr>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>অন্যান্য</th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(n => (
                <th key={n} className={thCls + " text-[10px] font-bold text-slate-500"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ministries.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>{m}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("১") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("১৬-০৭-২৫") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("৩০") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("২৬") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("১৮-০৮-২৫") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("০৭-১০-২৫") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("১৪০৪৩২৬৬১") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("২৫৫৭৭৪৩") : ""}</td>
                <td className={numTdCls}>{idx === 4 ? toBengaliDigits("১৩৭৮৭৪৮১৮") : ""}</td>
                <td className={numTdCls}></td>
                <td className={tdCls}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-8 flex justify-between items-end text-[11px] font-bold text-slate-800">
        <div className="space-y-1">
          <p>নং- ১৭০৭/প্রশা/বাঅঅ/সমন্বয়/ডি:স:সু:মী:জারিপত্র/২০১১-১২/</p>
          <p>তারিখঃ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /২০২৩খ্রিঃ</p>
        </div>
        <div className="text-center pb-4">
          <div className="w-48 border-t border-slate-900 pt-1">
            <p className="font-black">স্বাক্ষর</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QR_1;
