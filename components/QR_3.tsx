import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths, isWithinInterval, parseISO } from 'date-fns';
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

const QR_3: React.FC<QRProps> = ({ activeCycle, entries, IDBadge, searchTerm = '', filterMinistry = '', isLayoutEditable }) => {
  const startDate = activeCycle.start;
  const endDate = activeCycle.end;
  const prevMonthDate = subMonths(startDate, 1);

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));
  const formatShortYearBN = (date: Date) => toBengaliDigits(format(date, 'yy'));

  const { table1Data, table2Data } = useMemo(() => {
    const startDate = new Date(activeCycle.start);
    const endDate = new Date(activeCycle.end);

    const bsrEntries = entries.filter(entry => {
      try {
        const entryDate = parseISO(entry.date);
        const isWithin = isWithinInterval(entryDate, { start: startDate, end: endDate });
        const isBSR = entry.meetingType === 'বিএসআর' || entry.letterType === 'বিএসআর';
        return isWithin && isBSR;
      } catch (e) {
        return false;
      }
    });

    const processTableData = (ministries: string[]) => {
      return ministries.map(ministryName => {
        const entityNames = MINISTRY_ENTITY_MAP[ministryName] || [];
        const entities = entityNames.map(entityName => {
          const entityEntries = bsrEntries.filter(e => e.ministry === ministryName && e.entity === entityName);
          
          return {
            name: entityName,
            pCount: 0, // Opening (JER) - would need historical data or a specific field
            pAmount: 0,
            cCount: entityEntries.length,
            cAmount: entityEntries.reduce((sum, e) => sum + (e.amount || 0), 0),
            sCount: entityEntries.filter(e => e.status === 'নিষ্পন্ন').length,
            sAmount: entityEntries.filter(e => e.status === 'নিষ্পন্ন').reduce((sum, e) => sum + (e.settledAmount || 0), 0)
          };
        });

        return {
          ministry: ministryName,
          entities: entities.filter(ent => ent.cCount > 0 || ent.sCount > 0 || ent.pCount > 0)
        };
      }).filter(group => group.entities.length > 0);
    };

    const table1Ministries = ["শিল্প মন্ত্রণালয়", "বস্ত্র ও পাট মন্ত্রণালয়", "বাণিজ্য মন্ত্রণালয়", "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়"];
    const table2Ministries = ["আর্থিক প্রতিষ্ঠান বিভাগ"];

    return {
      table1Data: processTableData(table1Ministries),
      table2Data: processTableData(table2Ministries)
    };
  }, [entries, activeCycle]);

  const filterData = (data: any[]) => {
    return data.filter(mGroup => {
      const matchMinistry = filterMinistry === '' || mGroup.ministry.includes(filterMinistry);
      const matchSearch = searchTerm === '' || mGroup.ministry.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchMinistry && matchSearch) return true;
      
      // If ministry doesn't match, check if any entity matches search
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
              <td colSpan={3} className={tdCls + " text-right"}>মোট</td>
              <td className={numTdCls}>{toBengaliDigits(totals.pC.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.pA.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.cC.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.cA.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.tC.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.sC.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.sA.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.fC.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.fA.toString())}</td>
              <td className={tdCls}></td>
            </tr>
            {tableId === 'table-2' && (
               <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
                <td colSpan={3} className={tdCls + " text-right"}>সর্বমোট</td>
                <td colSpan={10} className={tdCls}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="qr-3-container" className="w-full mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-3-container" isLayoutEditable={isLayoutEditable} />
      
      <div className="flex justify-end mb-4 no-print">
      </div>

      {/* Header Section */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-block relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            ত্রৈমাসিক রিটার্ন - ৩
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