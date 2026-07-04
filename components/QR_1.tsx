import React from 'react';
import { Printer, Sparkles, ChevronDown, BarChart3, FileSpreadsheet } from 'lucide-react';
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
}

const QR_1: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement }) => {
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

    const filename = `ত্রৈমাসিক_রিটার্ন_১_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">ত্রৈমাসিক রিটার্ন - ১</h2>
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

  const formatDateBangla = (date: Date) => {
    return toBengaliDigits(format(date, 'dd/MM/yyyy'));
  };

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const filteredData = entries.filter(e => {
    // Filter by Non-SFI
    if (robustNormalize(e.paraType) !== robustNormalize('নন এসএফআই')) return false;
    
    // Filter only by bilateral meetings
    const mType = robustNormalize(e.meetingType || e.letterType || '');
    const isValidType = mType.includes(robustNormalize('দ্বিপক্ষীয়')) || 
                        mType.includes(robustNormalize('দ্বিপাক্ষিক'));
    if (!isValidType) return false;

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

  const totals = filteredData.reduce((acc, curr) => {
    const discussed = parseInt(toEnglishDigits(curr.meetingDiscussedParaCount || curr.meetingSentParaCount || '0')) || 0;
    const settled = parseInt(toEnglishDigits(curr.meetingRecommendedParaCount || curr.meetingSettledParaCount || '0')) || 0;
    
    const settledAmount = curr.paragraphs && curr.paragraphs.length > 0
      ? curr.paragraphs
          .reduce((sum, p) => sum + (p.status === 'পূর্ণাঙ্গ' ? (p.involvedAmount || (p.recoveredAmount + p.adjustedAmount) || 0) : ((p.recoveredAmount + p.adjustedAmount) || 0)), 0)
      : (curr.involvedAmount || 0);

    return {
      sentPara: acc.sentPara + discussed,
      settledPara: acc.settledPara + settled,
      amount: acc.amount + settledAmount,
      recovery: acc.recovery + (curr.totalRec || 0),
      adjustment: acc.adjustment + (curr.totalAdj || 0),
      others: acc.others + 0,
    };
  }, { sentPara: 0, settledPara: 0, amount: 0, recovery: 0, adjustment: 0, others: 0 });

  const thCls = "border-r border-b border-slate-400 p-2 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-white text-center align-middle font-bold bg-black";

  return (
    <div id="qr-1-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-1-container" />

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
            ত্রৈমাসিক রিটার্ন - ১
          </h1>

          {/* Date Range Pill */}
          <div className="mt-1 mb-2 flex items-center justify-center gap-3 no-print flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 border border-blue-100 rounded-full shadow-sm scale-95 origin-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-[12px]">
                ত্রৈমাসিক রিটার্ন - ১ | {activeCycle.label}
              </span>
            </div>
            {monthPickerElement && (
              <div className="scale-95 origin-center select-none relative z-[300]">
                {monthPickerElement}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
          <div className="inline-block border-b border-slate-900 pb-0.5">
            <span className="text-sm font-black text-slate-900">ছক: ৪(খ)</span>
          </div>
        </div>
      </div>

      {/* Info Section + Lowered statistics button */}
      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-x-4 gap-y-2 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p><span className="text-slate-500">বিষয়ঃ</span> AIR এ আপত্তি নিষ্পত্তির অগ্রগতি ও সুপারিশের ত্রৈমাসিক প্রতিবেদন</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">শাখাঃ</span> নন এসএফআই শাখা</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
        </div>

        {/* Statistics Button (Lowered into subject bar) */}
        <div className="relative group no-print shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-[11px] border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:border-blue-200"
          >
            <Sparkles size={13} className="text-blue-500" />
            পরিসংখ্যান
            <ChevronDown size={11} className="text-blue-400 transition-transform duration-300 group-hover:rotate-180" />
          </button>
          
          <div className="absolute top-[calc(100%+4px)] right-0 w-[330px] bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[1000] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <BarChart3 size={16} className="text-blue-600" />
                <span className="text-blue-900 font-black text-[13px]">ত্রৈমাসিক রিপোর্ট পরিসংখ্যান</span>
              </div>
              <div className="space-y-1.5 text-slate-700 text-[11px] font-bold leading-normal">
                <div className="flex justify-between">
                  <span>সর্বমোট আলোচিত অনুচ্ছেদ:</span>
                  <span className="text-blue-700">{toBengaliDigits(totals.sentPara ?? 0)} টি</span>
                </div>
                <div className="flex justify-between">
                  <span>সর্বমোট সুপারিশকৃত অনুচ্ছেদ:</span>
                  <span className="text-emerald-600">{toBengaliDigits(totals.settledPara ?? 0)} টি</span>
                </div>
                <div className="flex justify-between">
                  <span>জড়িত মোট টাকা:</span>
                  <span className="text-slate-900">{toBengaliDigits(Math.round(totals.amount ?? 0))} টাকা</span>
                </div>
                <div className="flex justify-between">
                  <span>মোট আদায় সমন্বয়ের পরিমাণ:</span>
                  <span className="text-emerald-700">{toBengaliDigits(Math.round((totals.recovery ?? 0) + (totals.adjustment ?? 0)))} টাকা</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container qr-table-container overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
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
                  <HighlightText text={row.ministryName} searchTerm={searchTerm} />
                  {row.entityName && (
                    <>
                      ,<br />
                      <HighlightText text={row.entityName} searchTerm={searchTerm} />
                    </>
                  )}
                  {row.branchName && (
                    <>
                      ,<br />
                      <span className="text-blue-700 font-extrabold text-[10.5px]">
                        <HighlightText text={row.branchName} searchTerm={searchTerm} />
                      </span>
                    </>
                  )}
                  {row.auditYear && (
                    <>
                      <br />
                      <span className="font-bold text-slate-800">({toBengaliDigits(row.auditYear)})</span>
                    </>
                  )}
                </td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits("১")}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingDate || '')}</td>
                <td className={`${numTdCls} w-[62px]`}>{toBengaliDigits(row.meetingDiscussedParaCount || row.meetingSentParaCount || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingRecommendedParaCount || row.meetingSettledParaCount || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.meetingResponseDate || '')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.issueLetterNoDate || '')}</td>
                <td className={numTdCls}>
                  {toBengaliDigits(
                    (row.paragraphs && row.paragraphs.length > 0
                      ? row.paragraphs
                          .reduce((sum: number, p: any) => sum + (p.status === 'পূর্ণাঙ্গ' ? (p.involvedAmount || (p.recoveredAmount + p.adjustedAmount) || 0) : ((p.recoveredAmount + p.adjustedAmount) || 0)), 0)
                      : (row.involvedAmount || 0)
                    ).toString()
                  )}
                </td>
                <td className={numTdCls}>{toBengaliDigits(row.totalRec?.toString() || '০')}</td>
                <td className={numTdCls}>{toBengaliDigits(row.totalAdj?.toString() || '০')}</td>
                <td className={numTdCls}></td>
                <td className={tdCls.replace('p-2', 'p-1') + " w-[42px]"}>{row.remarks}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-black h-[32px] qr-sticky-footer qr-sticky-footer-bottom">
            <tr className="bg-black text-white no-hover-row">
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