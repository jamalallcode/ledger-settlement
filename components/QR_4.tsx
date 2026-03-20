import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths, isWithinInterval, parseISO, isBefore } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP } from '../constants';

interface QRProps {
  activeCycle: any;
  entries: SettlementEntry[];
  IDBadge: React.FC<{ id: string; isLayoutEditable?: boolean }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  isLayoutEditable?: boolean;
}

const QR_4: React.FC<QRProps> = ({ activeCycle, entries, IDBadge, searchTerm = '', filterMinistry = '', isLayoutEditable }) => {
  const startDate = new Date(activeCycle.start);
  const endDate = new Date(activeCycle.end);
  const prevMonthDate = subMonths(startDate, 1);

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));
  const formatShortYearBN = (date: Date) => toBengaliDigits(format(date, 'yy'));

  const { table1Data, table2Data } = useMemo(() => {
    const processTableData = (ministries: string[]) => {
      return ministries.map(ministryName => {
        const entityNames = MINISTRY_ENTITY_MAP[ministryName] || [];
        const entities = entityNames.map(entityName => {
          const entityEntries = entries.filter(e => e.ministryName === ministryName && e.entityName === entityName);
          
          const pRaised = entityEntries.filter(e => e.issueDateISO && isBefore(parseISO(e.issueDateISO), startDate)).length;
          const cRaised = entityEntries.filter(e => e.issueDateISO && isWithinInterval(parseISO(e.issueDateISO), { start: startDate, end: endDate })).length;
          
          // For settlement, we'll assume if it's settled and the entry is in this cycle, it's cSettled.
          // This is a simplification as we don't have a separate settledDate.
          const cSettled = entityEntries.filter(e => 
            e.approvalStatus === 'approved' && 
            e.issueDateISO && isWithinInterval(parseISO(e.issueDateISO), { start: startDate, end: endDate })
          ).length;
          
          const pSettled = entityEntries.filter(e => 
            e.approvalStatus === 'approved' && 
            e.issueDateISO && isBefore(parseISO(e.issueDateISO), startDate)
          ).length;

          const cSettledAmount = entityEntries
            .filter(e => e.issueDateISO && isWithinInterval(parseISO(e.issueDateISO), { start: startDate, end: endDate }))
            .reduce((sum, e) => sum + (e.totalRec || 0) + (e.totalAdj || 0), 0);

          const pendingAmount = entityEntries
            .filter(e => e.approvalStatus !== 'approved')
            .reduce((sum, e) => sum + (e.involvedAmount || 0), 0);

          return {
            name: entityName,
            pRaised,
            cRaised,
            pSettled,
            cSettled,
            cSettledAmount,
            pendingAmount
          };
        });

        return {
          ministry: ministryName,
          entities: entities.filter(ent => ent.pRaised > 0 || ent.cRaised > 0 || ent.pSettled > 0 || ent.cSettled > 0)
        };
      }).filter(group => group.entities.length > 0);
    };

    const table1Ministries = ["শিল্প মন্ত্রণালয়", "বস্ত্র ও পাট মন্ত্রণালয়", "বাণিজ্য মন্ত্রণালয়", "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়"];
    const table2Ministries = ["আর্থিক প্রতিষ্ঠান বিভাগ"];

    return {
      table1Data: processTableData(table1Ministries),
      table2Data: processTableData(table2Ministries)
    };
  }, [entries, activeCycle, startDate, endDate]);

  const filterData = (data: any[]) => {
    return data.filter(mGroup => {
      const matchMinistry = filterMinistry === '' || mGroup.ministry.includes(filterMinistry);
      const matchSearch = searchTerm === '' || mGroup.ministry.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchMinistry && matchSearch) return true;
      
      if (searchTerm !== '') {
        return mGroup.entities.some((ent: any) => ent.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      
      return false;
    }).map(mGroup => ({
      ...mGroup,
      entities: mGroup.entities.filter((ent: any) => {
        if (searchTerm === '') return true;
        return ent.name.toLowerCase().includes(searchTerm.toLowerCase()) || mGroup.ministry.toLowerCase().includes(searchTerm.toLowerCase());
      })
    })).filter(mGroup => mGroup.entities.length > 0);
  };

  const filteredTable1Data = filterData(table1Data);
  const filteredTable2Data = filterData(table2Data);

  const thCls = "border-r border-b border-slate-400 p-1 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-700 text-center align-middle font-bold";
  
  // Footer-specific classes without borders to avoid double borders with inset box-shadow
  const footerTdCls = "p-1 text-[10px] text-slate-700 align-middle";
  const footerNumTdCls = "p-1 text-[10px] text-slate-700 text-center align-middle font-bold";

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
      <IDBadge id="qr-4-container" isLayoutEditable={isLayoutEditable} />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ৪
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

      <div className="flex justify-between items-center mb-4 text-[12px] font-bold text-slate-800">
        <p>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
        <p>নন এসএফআই</p>
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