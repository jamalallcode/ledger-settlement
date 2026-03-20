import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, isWithinInterval, parseISO, isBefore } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

interface QRProps {
  activeCycle: any;
  entries: SettlementEntry[];
  IDBadge: React.FC<{ id: string; isLayoutEditable?: boolean }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  isLayoutEditable?: boolean;
}

const QR_5: React.FC<QRProps> = ({ activeCycle, entries, IDBadge, searchTerm = '', filterMinistry = '', isLayoutEditable }) => {
  const startDate = new Date(activeCycle.start);
  const endDate = new Date(activeCycle.end);

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));

  const processedData = useMemo(() => {
    const ministries = ["বস্ত্র ও পাট মন্ত্রণালয়", "শিল্প মন্ত্রণালয়", "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়", "বাণিজ্য মন্ত্রণালয়", "আর্থিক প্রতিষ্ঠান বিভাগ"];
    
    return ministries.map(mName => {
      const mEntries = entries.filter(e => e.ministryName === mName);
      const currentEntries = mEntries.filter(e => e.issueDateISO && isWithinInterval(parseISO(e.issueDateISO), { start: startDate, end: endDate }));
      const oldEntries = mEntries.filter(e => e.issueDateISO && isBefore(parseISO(e.issueDateISO), startDate));

      const amount = currentEntries.reduce((sum, e) => sum + (e.involvedAmount || 0), 0);
      const auditRec = 0; // Placeholder
      const auditAdj = 0; // Placeholder
      const currentRec = currentEntries.reduce((sum, e) => sum + (e.totalRec || 0), 0);
      const currentAdj = currentEntries.reduce((sum, e) => sum + (e.totalAdj || 0), 0);
      const oldRec = oldEntries.reduce((sum, e) => sum + (e.totalRec || 0), 0);
      const oldAdj = oldEntries.reduce((sum, e) => sum + (e.totalAdj || 0), 0);

      return {
        name: mName,
        amount,
        auditRec,
        auditAdj,
        currentRec,
        currentAdj,
        oldRec,
        oldAdj,
        totalRec: currentRec + oldRec,
        totalAdj: currentAdj + oldAdj,
        remarks: "০"
      };
    });
  }, [entries, activeCycle, startDate, endDate]);

  const filteredData = processedData.filter(row => {
    const matchMinistry = filterMinistry === '' || row.name.includes(filterMinistry);
    const matchSearch = searchTerm === '' || row.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchMinistry && matchSearch;
  });

  const totals = filteredData.reduce((acc, curr) => ({
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
      <IDBadge id="qr-5-container" isLayoutEditable={isLayoutEditable} />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ৫
          </h1>
          
          <div className="mt-4 flex justify-center mb-4">
            <div className="inline-flex items-center gap-3 px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border border-slate-700 shadow-md">
              <span className="text-blue-400">ত্রৈমাসিক প্রতিবেদন</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-4 text-[11px] font-bold text-slate-800">
        <p className="max-w-[70%]">বিষয়ঃ অডিট আপত্তির ফলে আদায়কৃত/সমন্বয়কৃত অর্থের ত্রৈমাসিক প্রতিবেদন {getMonthNameBN(startDate)}/{formatYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত</p>
        <p>শাখার নামঃ নন এসএফআই শাখা।</p>
      </div>

      <div className="table-container qr-table-container overflow-auto border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-[calc(5%-2px)]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[calc(15%-2px)]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>প্রতিবেদনধীন সময়ে উত্থাপিত আপত্তিতে জড়িত টাকার পরিমাণ</th>
              <th colSpan={2} className={thCls}>অডিট কালীন আদায়/সমন্বয়</th>
              <th colSpan={2} className={thCls}>প্রতিবেদনধীন সময়ে উত্থাপিত অর্থের বিপরীতে আদায়/সমন্বয়</th>
              <th colSpan={2} className={thCls}>পুরাতন আপত্তিতে জড়িত অর্থ</th>
              <th colSpan={2} className={thCls}>মোট</th>
              <th rowSpan={2} className={`${thCls} w-[12%]`}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
              <th className={`${thCls} w-[7%]`}>আদায়</th>
              <th className={`${thCls} w-[7%]`}>সমন্বয়</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <th key={n} className={thCls + " text-[9px] font-bold text-slate-500"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                <td className={tdCls}>
                  <HighlightText text={row.name} searchTerm={searchTerm} />
                </td>
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
            <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
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