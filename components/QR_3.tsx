import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';

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
  const startDate = setDate(subMonths(activeCycle.start, 1), 16);
  const endDate = setDate(addMonths(activeCycle.start, 2), 15);
  const prevMonthDate = subMonths(startDate, 1);

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

    // Initialize with prevStats
    if (prevStats && prevStats.ministries) {
      Object.entries(prevStats.ministries).forEach(([mKey, mData]: [string, any]) => {
        if (isFI !== isFinancialInstitution(mKey)) return;

        if (mData.entities) {
          Object.entries(mData.entities).forEach(([eKey, eData]: [string, any]) => {
            const key = `${mKey}|${eKey}`;
            map.set(key, {
              ministryName: mKey,
              entityName: eKey,
              pCount: eData.count || 0,
              pAmount: eData.amount || 0,
              cCount: 0,
              cAmount: 0,
              sCount: 0,
              sAmount: 0,
            });
          });
        }
      });
    }

    // Process entries
    entries.forEach(e => {
      if (robustNormalize(e.paraType) !== robustNormalize('নন এসএফআই')) return;
      if (isFI !== isFinancialInstitution(e.ministryName)) return;

      const key = `${e.ministryName}|${e.entityName}`;
      if (!map.has(key)) {
        map.set(key, {
          ministryName: e.ministryName,
          entityName: e.entityName,
          pCount: 0,
          pAmount: 0,
          cCount: 0,
          cAmount: 0,
          sCount: 0,
          sAmount: 0,
        });
      }

      const data = map.get(key);
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);

      if (issueDate >= startDate && issueDate <= endDate) {
        data.cCount += (parseInt(toEnglishDigits(e.manualRaisedCount || '0')) || 0);
        data.cAmount += (e.manualRaisedAmount || 0);
        data.sCount += (parseInt(toEnglishDigits(e.meetingSettledParaCount || '0')) || 0);
        data.sAmount += (e.involvedAmount || 0);
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
  const footerTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-white text-center align-middle font-bold bg-black";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pC: 0, pA: 0, cC: 0, cA: 0, tC: 0, sC: 0, sA: 0, fC: 0, fA: 0 };

    return (
      <div className="table-container qr-table-container mb-10 overflow-auto border border-slate-400 shadow-sm rounded-lg">
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
    <div id="qr-3-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-3-container" />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ৩
          </h1>

          {/* Date Range Pill */}
          <div className="mt-4 mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-sm">
                ত্রৈমাসিক রিটার্ন - ৩ | {activeCycle.label}
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

      <div className="flex justify-between items-center mb-4 text-[12px] font-bold text-slate-800">
        <p>মন্ত্রণালয়/সংস্থা ভিত্তিক {getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
        <p>নন এসএফআই</p>
      </div>

      {renderTable(filteredTable1Data, 'table-1')}
      
      <div className="mb-4 text-[12px] font-bold text-slate-800">
        <p>মন্ত্রণালয়/সংস্থা ভিত্তিক {getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
      </div>
      {renderTable(filteredTable2Data, 'table-2')}

    </div>
  );
};

export default QR_3;