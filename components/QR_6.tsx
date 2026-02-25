import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format } from 'date-fns';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
}

const QR_6: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
  const startDate = activeCycle.start;
  const endDate = activeCycle.end;

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));

  const sampleData = [
    { name: "বস্ত্র ও পাট মন্ত্রণালয়", involved: 28000, taxRec: 0, taxAdj: 0, otherRec: 15000, otherAdj: 0, remarks: "০" },
    { name: "শিল্প মন্ত্রণালয়", involved: 0, taxRec: 0, taxAdj: 0, otherRec: 0, otherAdj: 0, remarks: "০" },
    { name: "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়", involved: 0, taxRec: 0, taxAdj: 0, otherRec: 0, otherAdj: 0, remarks: "০" },
    { name: "বাণিজ্য মন্ত্রণালয়", involved: 0, taxRec: 0, taxAdj: 0, otherRec: 0, otherAdj: 0, remarks: "০" },
    { name: "আর্থিক প্রতিষ্ঠান বিভাগ", involved: 3307905, taxRec: 0, taxAdj: 0, otherRec: 3307905, otherAdj: 0, remarks: "০" },
  ];

  const totals = sampleData.reduce((acc, curr) => ({
    involved: acc.involved + curr.involved,
    taxRec: acc.taxRec + curr.taxRec,
    taxAdj: acc.taxAdj + curr.taxAdj,
    otherRec: acc.otherRec + curr.otherRec,
    otherAdj: acc.otherAdj + curr.otherAdj,
  }), { involved: 0, taxRec: 0, taxAdj: 0, otherRec: 0, otherAdj: 0 });

  const thCls = "border border-slate-400 p-1 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border border-slate-400 p-1 text-[10px] text-slate-700 align-middle";
  const numTdCls = "border border-slate-400 p-1 text-[10px] text-slate-700 text-center align-middle font-bold";

  return (
    <div id="qr-6-container" className="max-w-[1200px] mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-6-container" />
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black text-slate-900">বাণিজ্যিক অডিট অধিদপ্তর</h1>
        <h2 className="text-md font-bold text-slate-800">আঞ্চলিক কার্যালয়, (সে-৬) খুলনা।</h2>
      </div>

      <div className="flex justify-between items-start mb-4 text-[11px] font-bold text-slate-800">
        <p className="max-w-[70%]">মন্ত্রণালয়/সংস্থাভিত্তিক অডিট আপত্তির {getMonthNameBN(startDate)}/{formatYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত মাসের বিবরণ:</p>
        <p>শাখার নামঃ নন এসএফআই শাখা</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 shadow-sm">
          <thead>
            <tr>
              <th rowSpan={2} className={thCls}>ক্রঃ নং</th>
              <th rowSpan={2} className={thCls}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={thCls}>জড়িত টাকা</th>
              <th colSpan={2} className={thCls}>আয়কর ও ভ্যাট বাবদ</th>
              <th colSpan={2} className={thCls}>অন্যান্য বাবদ</th>
              <th colSpan={2} className={thCls}>সর্বমোট</th>
              <th rowSpan={2} className={thCls}>মন্তব্য</th>
            </tr>
            <tr>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
            </tr>
            <tr className="bg-slate-50">
              {[1, 2, 3, 4, 5, 6, 7, '৮=৪+৬', '৯=৫+৭', 10].map((n, i) => (
                <th key={i} className="border border-slate-400 p-1 text-[9px] font-bold text-slate-500 text-center">{typeof n === 'string' ? toBengaliDigits(n) : toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, idx) => {
              const totalRec = row.taxRec + row.otherRec;
              const totalAdj = row.taxAdj + row.otherAdj;
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                  <td className={tdCls}>{row.name}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.involved.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.taxRec.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.taxAdj.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.otherRec.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.otherAdj.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(totalRec.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(totalAdj.toString())}</td>
                  <td className={numTdCls}>{toBengaliDigits(row.remarks)}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-100 font-black">
              <td colSpan={2} className={tdCls + " text-center font-black"}>মোট</td>
              <td className={numTdCls}>{toBengaliDigits(totals.involved.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.taxRec.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.taxAdj.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.otherRec.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.otherAdj.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits((totals.taxRec + totals.otherRec).toString())}</td>
              <td className={numTdCls}>{toBengaliDigits((totals.taxAdj + totals.otherAdj).toString())}</td>
              <td className={tdCls}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-8 flex justify-between items-end text-[11px] font-bold text-slate-800">
        <div className="space-y-1">
          <p>নং- --------/বাঅঅ/সে-৬/খুলনা/রিটার্ণ/ত্রৈমাসিক/আয়কর ও অন্যান্য/আদায় ও সমন্বয়/২০০৮-০৯/</p>
        </div>
        <div className="text-right">
          <p>তাং- &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /{formatYearBN(new Date())}খ্রিঃ</p>
        </div>
      </div>
    </div>
  );
};

export default QR_6;
