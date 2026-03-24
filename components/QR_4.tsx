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

const QR_4: React.FC<QRProps> = ({ entries, prevStats, activeCycle, IDBadge, searchTerm = '', filterMinistry = '' }) => {
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
              pRaised: eData.count || 0,
              cRaised: 0,
              pSettled: 0,
              cSettled: 0,
              cSettledAmount: 0,
              pendingAmount: eData.amount || 0,
            });
          });
        }
      });
    }

    // Process entries
    entries.forEach(e => {
      if (robustNormalize(e.paraType) !== robustNormalize('এসএফআই')) return;
      if (isFI !== isFinancialInstitution(e.ministryName)) return;

      const key = `${e.ministryName}|${e.entityName}`;
      if (!map.has(key)) {
        map.set(key, {
          ministryName: e.ministryName,
          entityName: e.entityName,
          pRaised: 0,
          cRaised: 0,
          pSettled: 0,
          cSettled: 0,
          cSettledAmount: 0,
          pendingAmount: 0,
        });
      }

      const data = map.get(key);
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);

      if (issueDate >= startDate && issueDate <= endDate) {
        data.cRaised += (parseInt(toEnglishDigits(e.manualRaisedCount || '0')) || 0);
        data.cSettled += (parseInt(toEnglishDigits(e.meetingSettledParaCount || '0')) || 0);
        data.cSettledAmount += (e.involvedAmount || 0);
        // Note: pendingAmount is handled in the render loop (Total - Settled)
      }
    });

    // Group by Ministry
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
  
  // Footer-specific classes without borders to avoid double borders with inset box-shadow
  const footerTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-white text-center align-middle font-bold bg-black";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pR: 0, cR: 0, tR: 0, pS: 0, cS: 0, tS: 0, pnd: 0, cSA: 0, pndA: 0 };

    return (
      <div className="table-container qr-table-container mb-10 overflow-y-scroll overflow-x-auto border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[1000px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th className={thCls + " w-10"}>ক্রঃ নং</th>
              <th className={`${thCls} w-[8%]`}>মন্ত্রণালয়ের নাম</th>
              <th className={`${thCls} w-[8%]`}>প্রতিষ্ঠানের নাম</th>
              <th className={thCls}>১৯৭১-৭২ হতে {getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} মাস পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মোট উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thCls}>১৯৭১-৭২ হতে {getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত নিষ্পত্তিকৃত আপত্তিতে জড়িত টাকা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
            </tr>
          </thead>
          <tbody>
            {data.map((mGroup, mIdx) => (
              <React.Fragment key={mIdx}>
                {mGroup.entities.map((ent, eIdx) => {
                  const totalRaised = ent.pRaised + ent.cRaised;
                  const totalSettled = ent.pSettled + ent.cSettled;
                  const pendingCount = totalRaised - totalSettled;

                  totals.pR += ent.pRaised; totals.cR += ent.cRaised; totals.tR += totalRaised;
                  totals.pS += ent.pSettled; totals.cS += ent.cSettled; totals.tS += totalSettled;
                  totals.pnd += pendingCount; totals.cSA += ent.cSettledAmount; totals.pndA += ent.pendingAmount;

                  return (
                    <tr key={`${mIdx}-${eIdx}`} className="hover:bg-slate-50 transition-colors">
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={numTdCls + " w-10"}>{toBengaliDigits((globalIdx++).toString())}</td>
                      )}
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={tdCls + " font-black"}>
                          <HighlightText text={mGroup.ministry} searchTerm={searchTerm} />
                        </td>
                      )}
                      <td className={tdCls}>
                        <HighlightText text={ent.name} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pRaised.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cRaised.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(totalRaised.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pSettled.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cSettled.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(totalSettled.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(pendingCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cSettledAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pendingAmount.toString())}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className={`font-black h-[28px] qr-sticky-footer ${tableId === 'table-2' ? 'qr-sticky-footer-offset' : 'qr-sticky-footer-bottom'}`}>
              <td colSpan={3} className={footerTdCls + " text-right"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pR.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cR.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.tR.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pS.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cS.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.tS.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pnd.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cSA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pndA.toString())}</td>
            </tr>
            {tableId === 'table-2' && (
               <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
                <td colSpan={3} className={footerTdCls + " text-right"}>সর্বমোট</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pR).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.cR).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.tR).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pS).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.cS).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.tS).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pnd).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.cSA).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pndA).toString())}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="qr-4-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-4-container" />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ৪
          </h1>

          {/* Date Range Pill */}
          <div className="mt-4 mb-6 flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-sm">
                ত্রৈমাসিক রিটার্ন - ৪ | {activeCycle.label}
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
        <p>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
        <p>এসএফআই</p>
      </div>

      {renderTable(filteredTable1Data, 'table-1')}
      
      <div className="mb-4 text-[12px] font-bold text-slate-800">
        <p>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
      </div>
      {renderTable(filteredTable2Data, 'table-2')}

    </div>
  );
};

export default QR_4;