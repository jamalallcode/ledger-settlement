import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format } from 'date-fns';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
}

const QR_5: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
  const startDate = activeCycle.start;
  const endDate = activeCycle.end;

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));

  const sampleData = [
    { name: "বস্ত্র ও পাট মন্ত্রণালয়", amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 15000, oldAdj: 0, totalRec: 15000, totalAdj: 0, remarks: "০" },
    { name: "শিল্প মন্ত্রণালয়", amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 0, oldAdj: 0, totalRec: 0, totalAdj: 0, remarks: "০" },
    { name: "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়", amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 0, oldAdj: 0, totalRec: 0, totalAdj: 0, remarks: "০" },
    { name: "বাণিজ্য মন্ত্রণালয়", amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 0, oldAdj: 0, totalRec: 0, totalAdj: 0, remarks: "০" },
    { name: "আর্থিক প্রতিষ্ঠান বিভাগ", amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 3307905, oldAdj: 0, totalRec: 3307905, totalAdj: 0, remarks: "০" },
  ];

  const totals = sampleData.reduce((acc, curr) => ({
    amount: acc.amount + curr.amount,
    auditRec: acc.auditRec + curr.auditRec,
    auditAdj: acc.auditAdj + curr.auditAdj,
    currentRec: acc.currentRec + curr.currentRec,
    currentAdj: acc.currentAdj + curr.currentAdj,
    oldRec: acc.oldRec + curr.oldRec,
    oldAdj: acc.oldAdj + curr.oldAdj,
    totalRec: acc.totalRec + curr.totalRec,
    totalAdj: acc.totalAdj + curr.totalAdj,
  }), { amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 0, oldAdj: 0, totalRec: 0, totalAdj: 0 });

  const thCls = "border-r border-b border-slate-400 p-2 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-700 text-center align-middle font-bold";

  return (
    <div id="qr-5-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-5-container" />
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black text-slate-900">বাণিজ্যিক অডিট অধিদপ্তর</h1>
        <h2 className="text-md font-bold text-slate-800">আঞ্চলিক কার্যালয়, (সে-৬) খুলনা।</h2>
      </div>

      <div className="flex justify-between items-start mb-4 text-[11px] font-bold text-slate-800">
        <p className="max-w-[70%]">বিষয়ঃ অডিট আপত্তির ফলে আদায়কৃত/সমন্বয়কৃত অর্থের ত্রৈমাসিক প্রতিবেদন {getMonthNameBN(startDate)}/{formatYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত</p>
        <p>শাখার নামঃ নন এসএফআই শাখা।</p>
      </div>

      <div className="overflow-auto border-t border-l border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr>
              <th rowSpan={2} className={thCls}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={thCls}>প্রতিবেদনধীন সময়ে উত্থাপিত আপত্তিতে জড়িত টাকার পরিমাণ</th>
              <th colSpan={2} className={thCls}>অডিট কালীন আদায়/সমন্বয়</th>
              <th colSpan={2} className={thCls}>প্রতিবেদনধীন সময়ে উত্থাপিত অর্থের বিপরীতে আদায়/সমন্বয়</th>
              <th colSpan={2} className={thCls}>পুরাতন আপত্তিতে জড়িত অর্থ</th>
              <th colSpan={2} className={thCls}>মোট</th>
              <th rowSpan={2} className={thCls}>মন্তব্য</th>
            </tr>
            <tr>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <th key={n} className={thCls + " text-[9px] font-bold text-slate-500"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>{row.name}</td>
                <td className={numTdCls}>{toBengaliDigits(row.amount.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.auditRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.auditAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.currentRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.currentAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.oldRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.oldAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalRec.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalAdj.toString())}</td>
                <td className={numTdCls}>{toBengaliDigits(row.remarks)}</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-black sticky bottom-0 z-10">
              <td colSpan={2} className={tdCls + " text-center font-black"}>মোট</td>
              <td className={numTdCls}>{toBengaliDigits(totals.amount.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.auditRec.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.auditAdj.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.currentRec.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.currentAdj.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.oldRec.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.oldAdj.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.totalRec.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.totalAdj.toString())}</td>
              <td className={tdCls}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default QR_5;
