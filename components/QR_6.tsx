import React, { useMemo } from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';
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
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
  paraType?: 'এসএফআই' | 'নন এসএফআই';
}

const QR_6: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle, paraType = 'এসএফআই' }) => {
  // Standard calendar quarter date calculation:
  // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
  // Each quarter start date is the 16th of the month preceding the quarter's start month.
  // Each quarter end date is the 15th of the quarter's end month.
  const getQuarterInfo = (date: Date) => {
    const cycleEndMonth = date.getMonth(); // 0 to 11
    const year = date.getFullYear();
    let quarterStartMonth = 0;
    let quarterEndMonth = 2;
    let quarterYear = year;

    if (cycleEndMonth >= 0 && cycleEndMonth <= 2) {
      quarterStartMonth = 0; // Jan
      quarterEndMonth = 2;   // Mar
    } else if (cycleEndMonth >= 3 && cycleEndMonth <= 5) {
      quarterStartMonth = 3; // Apr
      quarterEndMonth = 5;   // Jun
    } else if (cycleEndMonth >= 6 && cycleEndMonth <= 8) {
      quarterStartMonth = 6; // Jul
      quarterEndMonth = 8;   // Sep
    } else {
      quarterStartMonth = 9; // Oct
      quarterEndMonth = 11;  // Dec
    }

    const start = new Date(quarterYear, quarterStartMonth, 1);
    const end = new Date(quarterYear, quarterEndMonth + 1, 0);
    
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const startMonthName = months[quarterStartMonth];
    const endMonthName = months[quarterEndMonth];
    
    const startYearShort = format(new Date(quarterYear, quarterStartMonth, 1), 'yy');
    const endYearShort = format(new Date(quarterYear, quarterEndMonth, 1), 'yy');

    const formattedRange = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;
    
    return {
      startDate: start,
      endDate: end,
      startMonthName,
      endMonthName,
      formattedRange
    };
  };

  const { startDate, endDate, startMonthName, endMonthName, formattedRange } = getQuarterInfo(activeCycle.end);

  const downloadExcel = () => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return;

    let tablesHtml = '';
    tables.forEach((table, tableIdx) => {
      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
      interactiveElements.forEach(el => el.remove());
      
      tablesHtml += `
        <div style="margin-bottom: 40px;">
          ${tableIdx > 0 ? '<br><hr><br>' : ''}
          ${clonedTable.outerHTML}
        </div>
      `;
    });

    const filename = `${(customTitle || 'ত্রৈমাসিক_রিটার্ন_৬').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>রিপোর্ট</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .bg-sky-100 { background-color: #e0f2fe !important; }
          .bg-amber-50 { background-color: #fef3c7 !important; }
          .bg-black { background-color: #090d16 !important; color: #ffffff !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${customTitle || 'ত্রৈমাসিক রিটার্ন - ৬'}</h2>
        ${tablesHtml}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      // Filter by SFI / Non-SFI
      if (robustNormalize(e.paraType) !== robustNormalize(paraType)) return;

      // Filter by Date Range (Issue Date)
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);
      if (issueDate < startDate || issueDate > endDate) return;

      const mName = e.ministryName;
      if (!ministryMap.has(mName)) {
        ministryMap.set(mName, {
          name: mName,
          involved: 0,
          taxRec: 0,
          taxAdj: 0,
          otherRec: 0,
          otherAdj: 0,
          remarks: "০"
        });
      }

      const data = ministryMap.get(mName);
      data.involved += (e.involvedAmount || 0);
      data.taxRec += (e.vatRec || 0) + (e.itRec || 0);
      data.taxAdj += (e.vatAdj || 0) + (e.itAdj || 0);
      data.otherRec += (e.othersRec || 0);
      data.otherAdj += (e.othersAdj || 0);
    });

    return Array.from(ministryMap.values()).filter(row => {
      const matchMinistry = filterMinistry === '' || robustNormalize(row.name).includes(robustNormalize(filterMinistry));
      const matchSearch = searchTerm === '' || robustNormalize(row.name).toLowerCase().includes(searchTerm.toLowerCase());
      return matchMinistry && matchSearch;
    });
  }, [entries, startDate, endDate, filterMinistry, searchTerm, paraType]);

  const totals = useMemo(() => filteredData.reduce((acc, curr) => ({
    involved: acc.involved + curr.involved,
    taxRec: acc.taxRec + curr.taxRec,
    taxAdj: acc.taxAdj + curr.taxAdj,
    otherRec: acc.otherRec + curr.otherRec,
    otherAdj: acc.otherAdj + curr.otherAdj,
  }), { involved: 0, taxRec: 0, taxAdj: 0, otherRec: 0, otherAdj: 0 }), [filteredData]);

  const thCls = "border-r border-b border-slate-400 p-2 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white text-center align-middle font-bold bg-black";

  return (
    <div id="qr-6-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-6-container" />
      
      <div className="flex justify-end mb-4 no-print">
        <button
          type="button"
          onClick={downloadExcel}
          className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
          title="এক্সেল ফাইল ডাউনলোড করুন"
        >
          <FileSpreadsheet size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Header Section */}
      <div className="text-center mb-3 pt-1 relative z-[260]">
        <div className="inline-block relative">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {customTitle || "ত্রৈমাসিক রিটার্ন - ৬"}
          </h1>

          {/* Date Range Pill */}
          <div className="mt-1 mb-2 flex items-center justify-center gap-3 no-print flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 border border-blue-100 rounded-full shadow-sm scale-95 origin-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-[12px]">
                {customTitle || "ত্রৈমাসিক রিটার্ন - ৬"} | {activeCycle.label}
              </span>
            </div>
            {monthPickerElement && (
              <div className="scale-95 origin-center select-none relative z-[300]">
                {monthPickerElement}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
        </div>
      </div>

      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থাভিত্তিক অডিট আপত্তির বিবরণ</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p className="shrink-0"><span className="text-slate-500">শাখাঃ</span> {paraType === 'এসএফআই' ? 'এসএফআই শাখা' : 'নন এসএফআই শাখা'}</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>

      <div className="table-container qr-table-container overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[850px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-[calc(5%-2px)]`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[calc(12%-2px)]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={thCls}>জড়িত টাকা</th>
              <th colSpan={2} className={thCls}>আয়কর ও ভ্যাট বাবদ</th>
              <th colSpan={2} className={thCls}>অন্যান্য বাবদ</th>
              <th colSpan={2} className={thCls}>সর্বমোট</th>
              <th rowSpan={2} className={thCls}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, '৮=৪+৬', '৯=৫+৭', 10].map((n, i) => (
                <th key={i} className={thCls + " text-[9px] font-bold text-slate-500"}>
                  {typeof n === 'string' ? toBengaliDigits(n) : toBengaliDigits(n.toString())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => {
              const totalRec = row.taxRec + row.otherRec;
              const totalAdj = row.taxAdj + row.otherAdj;
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className={numTdCls}>{toBengaliDigits((idx + 1).toString())}</td>
                  <td className={tdCls}>
                    <HighlightText text={row.name} searchTerm={searchTerm} />
                  </td>
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
            <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
              <td colSpan={2} className={footerTdCls + " text-center font-black"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.involved.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.taxRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.taxAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.otherRec.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.otherAdj.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits((totals.taxRec + totals.otherRec).toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits((totals.taxAdj + totals.otherAdj).toString())}</td>
              <td className={footerTdCls}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default QR_6;