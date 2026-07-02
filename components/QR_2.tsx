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

const QR_2: React.FC<QRProps> = ({ entries, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement }) => {
  // Standard calendar quarter date calculation:
  // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
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

    const start = new Date(quarterStartMonth === 0 ? quarterYear - 1 : quarterYear, quarterStartMonth === 0 ? 11 : quarterStartMonth - 1, 16);
    const end = new Date(quarterYear, quarterEndMonth, 15);
    
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

    const filename = `ত্রৈমাসিক_রিটার্ন_২_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">ত্রৈমাসিক রিটার্ন - ২ (ব্রডশীট)</h2>
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

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  const filteredData = entries.filter(e => {
    // Filter by Non-SFI
    if (robustNormalize(e.paraType) !== robustNormalize('নন এসএফআই')) return false;
    
    // Filter by BSR
    const mType = robustNormalize(e.meetingType || '');
    if (!mType.includes(robustNormalize('বিএসআর'))) return false;

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
    const sCount = parseInt(toEnglishDigits(curr.meetingSentParaCount || '0')) || curr.paragraphs?.length || 0;
    const setlCount = curr.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(curr.meetingSettledParaCount || '0')) || 0;
    const unsetlCount = parseInt(toEnglishDigits(curr.meetingUnsettledParas || '0')) || Math.max(0, sCount - setlCount);
    const unsAmount = Math.max(0, (curr.involvedAmount || 0) - (curr.totalRec || 0) - (curr.totalAdj || 0));
    
    return {
      sentPara: acc.sentPara + sCount,
      settledPara: acc.settledPara + setlCount,
      unsettledPara: acc.unsettledPara + unsetlCount,
      amount: acc.amount + (curr.involvedAmount || 0),
      recovery: acc.recovery + (curr.totalRec || 0),
      adjustment: acc.adjustment + (curr.totalAdj || 0),
      unsettledAmount: acc.unsettledAmount + unsAmount,
      others: 0,
    };
  }, { sentPara: 0, settledPara: 0, unsettledPara: 0, amount: 0, recovery: 0, adjustment: 0, unsettledAmount: 0, others: 0 });

  const formatAmountBengali = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '-';
    if (val === 0) return '-';
    return toBengaliDigits(Math.round(val).toString()) + '/-';
  };

  const formatCountBengali = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '০';
    return toBengaliDigits(val.toString());
  };

  const formatTextValue = (val: string | undefined | null) => {
    if (!val || val.trim() === '') return '-';
    return toBengaliDigits(val);
  };

  const formatArchiveNoForTable = (val: string | undefined | null) => {
    if (!val || val.trim() === '') return '-';
    
    const trimmed = val.trim();
    let prefix = "";
    let rest = trimmed;
    
    if (trimmed.toLowerCase().startsWith("kg-")) {
      const dashIdx = trimmed.indexOf("-");
      prefix = trimmed.substring(0, dashIdx + 1).trim() + " ";
      rest = trimmed.substring(dashIdx + 1).trim();
    }
    
    if (!rest) return prefix ? prefix.trim() : '-';
    
    // Split rest by commas
    const parts = rest.split(',').map(p => p.trim()).filter(p => p !== '');
    if (parts.length === 0) return prefix ? prefix.trim() : '-';
    
    // Group parts: max 3 per line
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      const chunk = parts.slice(i, i + 3);
      lines.push(chunk.join(', '));
    }
    
    return prefix + lines.join('\n');
  };

  const thCls = "border-r border-b border-slate-400 p-1 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center leading-normal";
  const tdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 align-middle leading-normal";
  const numTdCls = "border-r border-b border-slate-400 p-2 text-[9px] text-slate-700 text-center align-middle font-bold leading-normal";
  const footerTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-900 align-middle bg-slate-200 font-extrabold";
  const footerNumTdCls = "border-r border-b border-slate-400 p-2 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-200";

  return (
    <div id="qr-2-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-2-container" />

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
            ত্রৈমাসিক রিটার্ন - ২
          </h1>

          {/* Date Range Pill */}
          <div className="mt-1 mb-2 flex items-center justify-center gap-3 no-print flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 border border-blue-100 rounded-full shadow-sm scale-95 origin-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-[12px]">
                ত্রৈমাসিক রিটার্ন - ২ | {activeCycle.label}
              </span>
            </div>
            {monthPickerElement && (
              <div className="scale-95 origin-center select-none">
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
            <span className="text-sm font-black text-slate-900">ছক: ৪(ক)</span>
          </div>
        </div>
      </div>

      {/* Info Section + Lowered statistics button */}
      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-x-4 gap-y-2 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p><span className="text-slate-500">অধিদপ্তরঃ</span> বাণিজ্যিক অডিট অধিদপ্তর, খুলনা</p>
          <span className="text-slate-300 hidden md:inline font-normal">|</span>
          <p><span className="text-slate-500">বিষয়ঃ</span> ব্রডশিট জবাবের বিপরীতে নিষ্পত্তির সুপারিশের ত্রৈমাসিক প্রতিবেদন</p>
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
        <table className="w-full border-separate border-spacing-0 min-w-[1200px] !table-auto border-l border-t border-slate-400">
          <thead className="bg-slate-100">
            <tr className="h-[44px]">
              <th rowSpan={2} className={`${thCls} w-[35px] rounded-none`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[180px]`}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
              <th rowSpan={2} className={`${thCls} w-[60px]`}>ব্রডশিট জবাবের সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[100px]`}>ডায়েরি নম্বর ও তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[110px]`}>ব্রডশিট জবাবের স্মারক ও তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[65px]`}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[65px]`}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[110px]`}>মীমাংসা জারিপত্রের স্মারক ও তারিখ</th>
              <th rowSpan={2} className={`${thCls} w-[85px]`}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th colSpan={3} className={`${thCls}`}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
              <th rowSpan={2} className={`${thCls} w-[65px]`}>অমীমাংসিত অনুচ্ছেদ সংখ্যা</th>
              <th rowSpan={2} className={`${thCls} w-[85px]`}>অমীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
              <th rowSpan={2} className={`${thCls} w-[70px] rounded-none`}>আর্কাইভ নং</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>আদায়</th>
              <th className={thCls}>সমন্বয়</th>
              <th className={thCls}>অন্যান্য</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                <th key={n} className={thCls + " text-[9px] font-bold text-slate-500 py-1"}>{toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => {
              const entryUnsettledAmount = Math.max(0, (row.involvedAmount || 0) - (row.totalRec || 0) - (row.totalAdj || 0));
              const rowSentCount = parseInt(toEnglishDigits(row.meetingSentParaCount || '0')) || row.paragraphs?.length || 0;
              const rowSettledCount = row.paragraphs?.filter(p => p.status === 'পূর্ণাঙ্গ').length || parseInt(toEnglishDigits(row.meetingSettledParaCount || '0')) || 0;
              const rowUnsettledCount = parseInt(toEnglishDigits(row.meetingUnsettledParas || '0')) || Math.max(0, rowSentCount - rowSettledCount);

              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
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
                  <td className={numTdCls}>{toBengaliDigits("১")}</td>
                  <td className={numTdCls}>
                    <HighlightText text={formatTextValue(row.workpaperNoDate)} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>
                    <HighlightText text={formatTextValue(row.letterNoDate)} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>
                    {formatCountBengali(rowSentCount)}
                  </td>
                  <td className={numTdCls}>
                    {formatCountBengali(rowSettledCount)}
                  </td>
                  <td className={numTdCls}>
                    <HighlightText text={formatTextValue(row.issueLetterNoDate)} searchTerm={searchTerm} />
                  </td>
                  <td className={numTdCls}>
                    {formatAmountBengali(row.involvedAmount)}
                  </td>
                  <td className={`${numTdCls} text-emerald-600 bg-emerald-50/10`}>
                    {formatAmountBengali(row.totalRec)}
                  </td>
                  <td className={`${numTdCls} text-indigo-600 bg-indigo-50/10`}>
                    {formatAmountBengali(row.totalAdj)}
                  </td>
                  <td className={numTdCls}>
                    {formatAmountBengali(0)}
                  </td>
                  <td className={numTdCls}>
                    {formatCountBengali(rowUnsettledCount)}
                  </td>
                  <td className={numTdCls}>
                    {entryUnsettledAmount === 0 ? toBengaliDigits('0') + '/-' : formatAmountBengali(entryUnsettledAmount)}
                  </td>
                  <td className={`${numTdCls} whitespace-pre-line font-bold`}>
                    <HighlightText text={formatArchiveNoForTable(row.archiveNo)} searchTerm={searchTerm} />
                  </td>
                </tr>
              );
            })}
            {/* Empty rows if data is sparse */}
            {filteredData.length < 5 && Array.from({ length: 5 - filteredData.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-10">
                {Array.from({ length: 15 }).map((_, j) => (
                  <td key={j} className="border-r border-b border-slate-400"></td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="qr-sticky-footer-bottom">
            <tr className="h-[40px]">
              <td colSpan={2} className={footerTdCls}>সর্বমোট (ফিল্টারকৃত):</td>
              <td className={footerNumTdCls}>{toBengaliDigits(filteredData.length.toString())} টি</td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.sentPara.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.settledPara.toString())}</td>
              <td className={footerNumTdCls}></td>
              <td className={footerNumTdCls}>{totals.amount === 0 ? '-' : toBengaliDigits(Math.round(totals.amount).toString()) + "/-"}</td>
              <td className={footerNumTdCls}>{totals.recovery === 0 ? '-' : toBengaliDigits(Math.round(totals.recovery).toString()) + "/-"}</td>
              <td className={footerNumTdCls}>{totals.adjustment === 0 ? '-' : toBengaliDigits(Math.round(totals.adjustment).toString()) + "/-"}</td>
              <td className={footerNumTdCls}>-</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.unsettledPara.toString())}</td>
              <td className={footerNumTdCls}>{totals.unsettledAmount === 0 ? '-' : toBengaliDigits(Math.round(totals.unsettledAmount).toString()) + "/-"}</td>
              <td className={footerTdCls}></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};

export default QR_2;
