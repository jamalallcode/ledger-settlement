import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
}

const QR_2: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
  // Date calculation based on user's logic: 
  // "তিন মাস বলতে পূর্ববর্তী মাসের ১৬ তারিখ হতে ৩য় মাসের ১৫ তারিখ পযন্ত"
  const startDate = setDate(subMonths(activeCycle.start, 1), 16);
  const endDate = setDate(addMonths(activeCycle.start, 2), 15);

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const sampleData = [
    {
      ministry: "বস্ত্র ও পাট মন্ত্রণালয়, দৌলতপুর জুট মিলস লিমিটেড, খালিশপুর, খুলনা (২০১৭-১৮)",
      bsCount: "১",
      memo: "২৬৬, ১৬/০৯/২৫",
      sentPara: "৪",
      settledPara: "১",
      diary: "১৮১, ২৩/০৯/২৫",
      issueDate: "৭৪২, ১৬/১০/২৫",
      amount: "২৮৮০০",
      recovery: "১৫০০০",
      adjustment: "-",
      others: "-",
      remarks: "পূর্বের আদায় ১৩৮০০",
      archive: "KG -1004"
    },
    {
      ministry: "আর্থিক প্রতিষ্ঠান বিভাগ, জনতা ব্যাংক পিএলসি এর বিভিন্ন শাখা (১৯৯৭-১৩)",
      bsCount: "১",
      memo: "৫৮৬, ২৯/১০/২৫",
      sentPara: "১৮",
      settledPara: "৮",
      diary: "১৭৪, ০৬/১১/২৫",
      issueDate: "৭৪৩, ১৭/১০/২৫",
      amount: "২১১২১১",
      recovery: "২১১২১১",
      adjustment: "-",
      others: "-",
      remarks: "",
      archive: "KG-0136, KG-0067, KG-0053"
    }
  ];

  const thCls = "border-r border-b border-slate-400 p-1 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-700 text-center align-middle font-bold";

  return (
    <div id="qr-2-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-2-container" />
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black text-slate-900">বাণিজ্যিক অডিট অধিদপ্তর</h1>
        <h2 className="text-md font-bold text-slate-800">আঞ্চলিক কার্যালয় (সে-৬)</h2>
        <p className="text-sm font-bold text-slate-700">বিটিবিএল ভবন (৯ম ও ১০ম) তলা, খুলনা।</p>
        <div className="mt-2 inline-block border-b-2 border-slate-900 pb-0.5">
          <span className="text-md font-black text-slate-900">ছক: ৪(ক)</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="mb-4 text-[11px] font-bold text-slate-800 space-y-1">
        <p>অডিট অধিদপ্তরের নামঃ বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা।</p>
        <p className="underline underline-offset-4 decoration-1">বিষয়ঃ নিরীক্ষা পরিদর্শন প্রতিবেদনে (AIR) অন্তর্ভুক্ত আপত্তি নিষ্পত্তির অগ্রগতি সংক্রান্ত মাসিক প্রতিবেদন (মন্ত্রণালয়ভিত্তিক)</p>
        <p>ক. ব্রডশিট জবাবের প্রেক্ষিতে নিষ্পত্তির সুপারিশ সংক্রান্ত ত্রৈমাসিক প্রতিবেদন</p>
        <p>শাখার নামঃ নন এসএফআই</p>
        <p>মাসের নামঃ {getMonthNameBN(startDate)}/{toBengaliDigits(format(startDate, 'yy'))} হতে {getMonthNameBN(endDate)}/{toBengaliDigits(format(endDate, 'yy'))} খ্রি: তারিখ পর্যন্ত</p>
      </div>

      {/* Table Section */}
      <div className="overflow-auto border-t border-l border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[1000px] !table-auto">
          <thead className="bg-slate-100">
            <tr>
              <th rowSpan={2} className={thCls}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={thCls}>ব্রডশিট জবাবের সংখ্যা</th>
              <th rowSpan={2} className={thCls}>পত্রের স্মারক নং ও তারিখ</th>
              <th rowSpan={2} className={thCls}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thCls}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={thCls}>ডায়েরি নং ও তারিখ</th>
              <th rowSpan={2} className={thCls}>মীমাংসাপত্র জারীর তারিখ</th>
              <th rowSpan={2} className={thCls}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={thCls}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={thCls}>মন্তব্য</th>
              <th rowSpan={2} className={thCls}>আর্কাইভ নং</th>
            </tr>
            <tr>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>অন্যান্য</th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(n => (
                <th key={n} className={thCls + " text-[9px] font-bold text-slate-500"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>{row.ministry}</td>
                <td className={numTdCls}>{toBengaliDigits(row.bsCount)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.memo)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.sentPara)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.settledPara)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.diary)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.issueDate)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.amount)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.recovery)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.adjustment)}</td>
                <td className={numTdCls}>{toBengaliDigits(row.others)}</td>
                <td className={tdCls}>{row.remarks}</td>
                <td className={numTdCls}>{row.archive}</td>
              </tr>
            ))}
            {/* Empty rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-10">
                {Array.from({ length: 14 }).map((_, j) => (
                  <td key={j} className="border-r border-b border-slate-400"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-20 flex justify-between items-start text-[11px] font-bold text-slate-800">
        <div className="flex items-center gap-6">
          <p>নং- ১৭০৬/প্রশা/বাঅঅ/সমন্বয়/র:জ:প্র:নি:শু:/২০১১-১২/</p>
          <p>তারিখঃ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /২০২৩খ্রিঃ</p>
        </div>
      </div>
    </div>
  );
};

export default QR_2;
