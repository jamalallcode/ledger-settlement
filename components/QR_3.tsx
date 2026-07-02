import React, { useMemo } from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate, format as dateFnsFormat } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP, ENTRY_START_DATE } from '../constants';

interface QRProps {
  entries: SettlementEntry[];
  prevStats: any;
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
}

const QR_3: React.FC<QRProps> = ({ entries, prevStats, activeCycle, IDBadge, searchTerm = '', filterMinistry = '' }) => {
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
  const prevMonthDate = subMonths(startDate, 1);

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

    const filename = `ত্রৈমাসিক_রিটার্ন_৩_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">ত্রৈমাসিক রিটার্ন - ৩</h2>
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
  const formatShortYearBN = (date: Date) => toBengaliDigits(format(date, 'yy'));

  const robustNormalize = (str: string = '') => {
    return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  };

  // Categorization helper
  const isFinancialInstitution = (ministryName: string) => {
    return robustNormalize(ministryName).includes(robustNormalize('আর্থিক প্রতিষ্ঠান বিভাগ'));
  };

  const processData = (isFI: boolean) => {
    const map = new Map<string, any>();
    const paraType = 'নন এসএফআই';
    const cycleStartStr = dateFnsFormat(startDate, 'yyyy-MM-dd');

    // Initialize with all entities from MINISTRY_ENTITY_MAP
    Object.entries(MINISTRY_ENTITY_MAP).forEach(([mName, entities]) => {
      if (isFI !== isFinancialInstitution(mName)) return;

      entities.forEach(entityName => {
        const key = `${mName}|${entityName}`;
        
        // Calculate recursive opening for this entity
        const baseMap = prevStats.entitiesNonSFI || {};
        const base = baseMap[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        
        const pastEntries = entries.filter(e => {
          if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;
          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate < cycleStartStr && entryDate >= ENTRY_START_DATE;
        });

        let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
        const processedParaIds = new Set<string>();

        pastEntries.forEach(entry => {
          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            pastRC += parseBengaliNumber(rCountRaw);
          }
          if (entry.manualRaisedAmount) pastRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

          if (entry.paragraphs) {
            entry.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedParaIds.has(p.id) && hasDigit) {
                processedParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  pastSC++; 
                }
                pastSA += settledAmt;
              }
            });
          }
        });

        map.set(key, {
          ministryName: mName,
          entityName: entityName,
          pCount: Math.max(0, base.unsettledCount + pastRC),
          pAmount: Math.max(0, base.unsettledAmount + Math.round(pastRA)),
          cCount: 0,
          cAmount: 0,
          sCount: 0,
          sAmount: 0,
        });
      });
    });

    // Process entries for the current range
    entries.forEach(e => {
      if (robustNormalize(e.paraType) !== robustNormalize(paraType)) return;
      if (isFI !== isFinancialInstitution(e.ministryName)) return;

      const key = `${e.ministryName}|${e.entityName}`;
      if (!map.has(key)) return; // Should already be in the map if it's in MINISTRY_ENTITY_MAP

      const data = map.get(key);
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);

      if (issueDate >= startDate && issueDate <= endDate) {
        const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          data.cCount += parseBengaliNumber(rCountRaw);
        }
        if (e.manualRaisedAmount) data.cAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));
        
        if (e.paragraphs) {
          const processedParaIds = new Set<string>();
          e.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              const status = robustNormalize(p.status || '');
              const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
              if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                data.sCount++; 
                data.sAmount += settledAmt;
              }
            }
          });
        }
      }
    });

    // Group by Ministry for the two-level display
    const ministryGroups: any[] = [];
    const ministryMap = new Map<string, any[]>();

    Array.from(map.values()).forEach(item => {
      if (!ministryMap.has(item.ministryName)) {
        ministryMap.set(item.ministryName, []);
      }
      ministryMap.get(item.ministryName)?.push(item);
    });

    ministryMap.forEach((entities, ministry) => {
      const matchMinistry = filterMinistry === '' || robustNormalize(ministry).includes(robustNormalize(filterMinistry));
      const matchSearch = searchTerm === '' || 
        robustNormalize(ministry).toLowerCase().includes(searchTerm.toLowerCase()) ||
        entities.some(ent => robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()));

      if (matchMinistry && matchSearch) {
        ministryGroups.push({
          ministry,
          entities: entities.filter(ent => {
            if (searchTerm === '') return true;
            return robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                   robustNormalize(ministry).toLowerCase().includes(searchTerm.toLowerCase());
          })
        });
      }
    });

    return ministryGroups;
  };

  const filteredTable1Data = useMemo(() => processData(false), [entries, prevStats, searchTerm, filterMinistry]);
  const filteredTable2Data = useMemo(() => processData(true), [entries, prevStats, searchTerm, filterMinistry]);

  const thCls = "border-r border-b border-slate-400 p-1 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-1 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-1 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 align-middle bg-slate-200 font-extrabold";
  const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-200";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pC: 0, pA: 0, cC: 0, cA: 0, tC: 0, sC: 0, sA: 0, fC: 0, fA: 0 };

    return (
      <div className="table-container qr-table-container mb-10 overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-10`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[calc(12%-2px)]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${thCls} w-[calc(12%-2px)]`}>সংস্থার নাম</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত উত্থাপিত অডিট আপত্তি</th>
              <th rowSpan={2} className={thCls}>মোট অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মীমাংসিত অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তি</th>
              <th rowSpan={2} className={`${thCls} w-[calc(8%-2px)]`}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, '৮ = ৪+৬', 9, 10, '১১ = ৮-৯', '১২ = ৫+৭-১০', 13].map((n, i) => (
                <th key={i} className={thCls + " text-[9px] font-bold text-slate-500"}>{typeof n === 'string' ? toBengaliDigits(n) : toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((mGroup, mIdx) => (
              <React.Fragment key={mIdx}>
                {mGroup.entities.map((ent, eIdx) => {
                  const totalObjectionCount = ent.pCount + ent.cCount;
                  const finalObjectionCount = totalObjectionCount - ent.sCount;
                  const finalObjectionAmount = ent.pAmount + ent.cAmount - ent.sAmount;

                  totals.pC += ent.pCount; totals.pA += ent.pAmount;
                  totals.cC += ent.cCount; totals.cA += ent.cAmount;
                  totals.tC += totalObjectionCount;
                  totals.sC += ent.sCount; totals.sA += ent.sAmount;
                  totals.fC += finalObjectionCount; totals.fA += finalObjectionAmount;

                  return (
                    <tr key={`${mIdx}-${eIdx}`} className="hover:bg-slate-50 transition-colors">
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={numTdCls}>{toBengaliDigits((globalIdx++).toString())}</td>
                      )}
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={tdCls + " font-black"}>
                          <HighlightText text={mGroup.ministry} searchTerm={searchTerm} />
                        </td>
                      )}
                      <td className={tdCls}>
                        <HighlightText text={ent.name} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(totalObjectionCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.sCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.sAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(finalObjectionCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(finalObjectionAmount.toString())}</td>
                      <td className={tdCls}></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className={`font-black h-[28px] qr-sticky-footer ${tableId === 'table-2' ? 'qr-sticky-footer-offset' : 'qr-sticky-footer-bottom'}`}>
              <td colSpan={3} className={footerTdCls + " text-right"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.tC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.sC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.sA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.fC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.fA.toString())}</td>
              <td className={footerTdCls}></td>
            </tr>
            {tableId === 'table-2' && (
               <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
                <td colSpan={3} className={footerTdCls + " text-right"}>সর্বমোট</td>
                <td colSpan={10} className={footerTdCls}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="qr-3-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-3-container" />
      
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
      <div className="text-center mb-3 pt-1">
        <div className="inline-block relative">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            ত্রৈমাসিক রিটার্ন - ৩
          </h1>

          {/* Date Range Pill */}
          <div className="mt-1 mb-2 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 border border-blue-100 rounded-full shadow-sm scale-95 origin-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-[12px]">
                ত্রৈমাসিক রিটার্ন - ৩ | {activeCycle.label}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
        </div>
      </div>

      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থা ভিত্তিক অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">শাখাঃ</span> নন এসএফআই শাখা</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">সময়সীমাঃ</span> {getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত</p>
      </div>

      {renderTable(filteredTable1Data, 'table-1')}
      
      <div className="my-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থা ভিত্তিক অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">সময়সীমাঃ</span> {getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত</p>
      </div>
      {renderTable(filteredTable2Data, 'table-2')}

    </div>
  );
};

export default QR_3;