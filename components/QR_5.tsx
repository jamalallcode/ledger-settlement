import React, { useMemo } from 'react';
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

const QR_5: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, onBack, searchTerm = '', filterMinistry = '' }) => {
  const startDate = setDate(subMonths(activeCycle.start, 1), 16);
  const endDate = setDate(addMonths(activeCycle.start, 2), 15);

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const filteredData = useMemo(() => {
    const ministryMap = new Map<string, any>();

    entries.forEach(e => {
      // Filter by SFI
      if (robustNormalize(e.paraType) !== robustNormalize('এসএফআই')) return;

      // Filter by Date Range (Issue Date)
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);
      if (issueDate < startDate || issueDate > endDate) return;

      const mName = e.ministryName;
      if (!ministryMap.has(mName)) {
        ministryMap.set(mName, {
          name: mName,
          amount: 0,
          auditRec: 0,
          auditAdj: 0,
          currentRec: 0,
          currentAdj: 0,
          oldRec: 0,
          oldAdj: 0,
          totalRec: 0,
          totalAdj: 0,
          remarks: "০"
        });
      }

      const data = ministryMap.get(mName);
      data.amount += (e.involvedAmount || 0);
      data.auditRec += (e.vatRec || 0);
      data.auditAdj += (e.vatAdj || 0);
      data.currentRec += (e.itRec || 0);
      data.currentAdj += (e.itAdj || 0);
      data.oldRec += (e.othersRec || 0);
      data.oldAdj += (e.othersAdj || 0);
      data.totalRec += (e.totalRec || 0);
      data.totalAdj += (e.totalAdj || 0);
    });

    return Array.from(ministryMap.values()).filter(row => {
      const matchMinistry = filterMinistry === '' || robustNormalize(row.name).includes(robustNormalize(filterMinistry));
      const matchSearch = searchTerm === '' || robustNormalize(row.name).toLowerCase().includes(searchTerm.toLowerCase());
      return matchMinistry && matchSearch;
    });
  }, [entries, startDate, endDate, filterMinistry, searchTerm]);

  const totals = useMemo(() => filteredData.reduce((acc, curr) => ({
    amount: acc.amount + curr.amount,
    auditRec: acc.auditRec + curr.auditRec,
    auditAdj: acc.auditAdj + curr.auditAdj,
    currentRec: acc.currentRec + curr.currentRec,
    currentAdj: acc.currentAdj + curr.currentAdj,
    oldRec: acc.oldRec + curr.oldRec,
    oldAdj: acc.oldAdj + curr.oldAdj,
    totalRec: acc.totalRec + curr.totalRec,
    totalAdj: acc.totalAdj + curr.totalAdj,
  }), { amount: 0, auditRec: 0, auditAdj: 0, currentRec: 0, currentAdj: 0, oldRec: 0, oldAdj: 0, totalRec: 0, totalAdj: 0 }), [filteredData]);

  const thCls = "border-r border-b border-slate-400 p-2 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white text-center align-middle font-bold bg-black";

  return (
    <div id="qr-5-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-5-container" />
      
      <div className="flex justify-between items-center mb-4 no-print">
        <button 
          onClick={onBack}
          className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-red-50 hover:text-red-600 text-slate-600 shadow-sm transition-all group"
          title="ফিরে যান"
        >
          <X size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="flex gap-2">
        </div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ৫
          </h1>

          {/* Date Range Pill */}
          <div className="mt-4 mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-sm">
                ত্রৈমাসিক রিটার্ন - ৫ | {activeCycle.label}
              </span>
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
        <p>শাখার নামঃ এসএফআই শাখা।</p>
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
              <td colSpan={2} className={footerTdCls + " text-center font-black"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.amount.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.auditRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.auditAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.currentRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.currentAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.oldRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.oldAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.totalRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.totalAdj.toString())}</td>
              <td className={footerTdCls}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default QR_5;