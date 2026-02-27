import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths } from 'date-fns';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
}

const QR_4: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
  const startDate = activeCycle.start;
  const endDate = activeCycle.end;
  const prevMonthDate = subMonths(startDate, 1);

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));
  const formatShortYearBN = (date: Date) => toBengaliDigits(format(date, 'yy'));

  const table1Data = [
    {
      ministry: "শিল্প মন্ত্রণালয়",
      entities: [
        { name: "চিনি ও খাদ্য সংস্থা", pRaised: 1064, cRaised: 0, pSettled: 373, cSettled: 0, cSettledAmount: 0, pendingAmount: 17330266370 },
        { name: "ক্ষুদ্র ও কুটির শিল্প সংস্থা", pRaised: 133, cRaised: 0, pSettled: 49, cSettled: 0, cSettledAmount: 0, pendingAmount: 166675293 },
        { name: "বিটাক", pRaised: 0, cRaised: 0, pSettled: 0, cSettled: 0, cSettledAmount: 0, pendingAmount: 0 },
        { name: "রসায়ন শিল্প সংস্থা", pRaised: 2, cRaised: 0, pSettled: 0, cSettled: 0, cSettledAmount: 0, pendingAmount: 553176 },
      ]
    },
    {
      ministry: "বস্ত্র ও পাট মন্ত্রণালয়",
      entities: [
        { name: "পাটকল সংস্থা", pRaised: 2608, cRaised: 0, pSettled: 830, cSettled: 9, cSettledAmount: 15000, pendingAmount: 21918286207 },
        { name: "পাট সংস্থা", pRaised: 9, cRaised: 0, pSettled: 6, cSettled: 0, cSettledAmount: 0, pendingAmount: 32016629 },
        { name: "বস্ত্রকল সংস্থা", pRaised: 295, cRaised: 0, pSettled: 135, cSettled: 0, cSettledAmount: 0, pendingAmount: 16231079081 },
        { name: "রেশম বোর্ড", pRaised: 7, cRaised: 0, pSettled: 0, cSettled: 0, cSettledAmount: 0, pendingAmount: 2751732 },
      ]
    },
    {
      ministry: "বাণিজ্য মন্ত্রণালয়",
      entities: [
        { name: "টিসিবি", pRaised: 72, cRaised: 0, pSettled: 15, cSettled: 0, cSettledAmount: 0, pendingAmount: 230832525 },
        { name: "আমদানি ও রপ্তানি", pRaised: 4, cRaised: 0, pSettled: 1, cSettled: 0, cSettledAmount: 0, pendingAmount: 1577323 },
      ]
    },
    {
      ministry: "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়",
      entities: [
        { name: "বাংলাদেশ বিমান", pRaised: 76, cRaised: 0, pSettled: 16, cSettled: 0, cSettledAmount: 0, pendingAmount: 460866121 },
        { name: "পর্যটন কর্পোরেশন", pRaised: 63, cRaised: 0, pSettled: 10, cSettled: 0, cSettledAmount: 0, pendingAmount: 3355279 },
      ]
    }
  ];

  const table2Data = [
    {
      ministry: "আর্থিক প্রতিষ্ঠান বিভাগ",
      entities: [
        { name: "সোনালী ব্যাংক পিএলসি", pRaised: 3058, cRaised: 0, pSettled: 378, cSettled: 0, cSettledAmount: 0, pendingAmount: 39827509886 },
        { name: "জনতা ব্যাংক পিএলসি", pRaised: 2223, cRaised: 0, pSettled: 206, cSettled: 29, cSettledAmount: 141343683, pendingAmount: 17222585908 },
        { name: "অগ্রণী ব্যাংক পিএলসি", pRaised: 2282, cRaised: 0, pSettled: 328, cSettled: 0, cSettledAmount: 0, pendingAmount: 16238136822 },
        { name: "বাংলাদেশ কৃষি ব্যাংক", pRaised: 2008, cRaised: 0, pSettled: 330, cSettled: 1, cSettledAmount: 2410046, pendingAmount: 1827787670 },
        { name: "রূপালী ব্যাংক পিএলসি", pRaised: 1446, cRaised: 0, pSettled: 337, cSettled: 0, cSettledAmount: 0, pendingAmount: 34816801304 },
        { name: "বাংলাদেশ ব্যাংক", pRaised: 334, cRaised: 0, pSettled: 16, cSettled: 0, cSettledAmount: 0, pendingAmount: 5278296389 },
        { name: "বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লিঃ", pRaised: 123, cRaised: 0, pSettled: 6, cSettled: 0, cSettledAmount: 0, pendingAmount: 1673007818 },
        { name: "গৃহনির্মাণ ঋণদান সংস্থা", pRaised: 73, cRaised: 0, pSettled: 21, cSettled: 0, cSettledAmount: 0, pendingAmount: 220803333 },
        { name: "কর্মসংস্থান ব্যাংক", pRaised: 127, cRaised: 0, pSettled: 16, cSettled: 0, cSettledAmount: 0, pendingAmount: 72967576 },
        { name: "বেসিক ব্যাংক লিঃ", pRaised: 231, cRaised: 0, pSettled: 36, cSettled: 0, cSettledAmount: 0, pendingAmount: 3021693705 },
        { name: "আনসার ভিডিপি উন্নয়ন ব্যাংক লিঃ", pRaised: 53, cRaised: 0, pSettled: 0, cSettled: 0, cSettledAmount: 0, pendingAmount: 44416195 },
        { name: "ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ", pRaised: 32, cRaised: 0, pSettled: 3, cSettled: 0, cSettledAmount: 0, pendingAmount: 220711456 },
        { name: "সাধারণ বীমা কর্পোরেশন", pRaised: 55, cRaised: 0, pSettled: 11, cSettled: 0, cSettledAmount: 0, pendingAmount: 669179270 },
        { name: "জীবন বীমা কর্পোরেশন", pRaised: 138, cRaised: 0, pSettled: 7, cSettled: 0, cSettledAmount: 0, pendingAmount: 1588032223 },
        { name: "প্রবাসী কল্যাণ ব্যাংক", pRaised: 1, cRaised: 0, pSettled: 0, cSettled: 0, cSettledAmount: 0, pendingAmount: 1011000 },
      ]
    }
  ];

  const thCls = "border-r border-b border-slate-400 p-1 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-700 text-center align-middle font-bold";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pR: 0, cR: 0, tR: 0, pS: 0, cS: 0, tS: 0, pnd: 0, cSA: 0, pndA: 0 };

    return (
      <div className="mb-10 overflow-auto border-t border-l border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[1100px] !table-auto">
          <thead className="bg-slate-100">
            <tr>
              <th className={thCls + " w-10"}>ক্রঃ নং</th>
              <th className={`${thCls} w-[15%]`}>মন্ত্রণালয়ের নাম</th>
              <th className={`${thCls} w-[15%]`}>প্রতিষ্ঠানের নাম</th>
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
                        <td rowSpan={mGroup.entities.length} className={tdCls + " font-black"}>{mGroup.ministry}</td>
                      )}
                      <td className={tdCls}>{ent.name}</td>
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
            <tr className="bg-slate-100 font-black sticky bottom-0 z-10">
              <td colSpan={3} className={tdCls + " text-right"}>মোট</td>
              <td className={numTdCls}>{toBengaliDigits(totals.pR.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.cR.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.tR.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.pS.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.cS.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.tS.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.pnd.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.cSA.toString())}</td>
              <td className={numTdCls}>{toBengaliDigits(totals.pndA.toString())}</td>
            </tr>
            {tableId === 'table-2' && (
               <tr className="bg-slate-200 font-black">
                <td colSpan={3} className={tdCls + " text-right"}>সর্বমোট</td>
                <td className={numTdCls}>{toBengaliDigits((totals.pR).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.cR).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.tR).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.pS).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.cS).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.tS).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.pnd).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.cSA).toString())}</td>
                <td className={numTdCls}>{toBengaliDigits((totals.pndA).toString())}</td>
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
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black text-slate-900">বাণিজ্যিক অডিট অধিদপ্তর</h1>
        <h2 className="text-md font-bold text-slate-800">আঞ্চলিক কার্যালয় (সে-৬) খুলনা।</h2>
      </div>

      <div className="flex justify-between items-center mb-4 text-[12px] font-bold text-slate-800">
        <p>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
        <p>নন এসএফআই</p>
      </div>

      {renderTable(table1Data, 'table-1')}
      
      <div className="mb-4 text-[12px] font-bold text-slate-800">
        <p>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
      </div>
      {renderTable(table2Data, 'table-2')}

      {/* Footer Section */}
      <div className="mt-20 flex justify-between items-start text-[11px] font-bold text-slate-800">
        <div className="flex items-center gap-6">
          <p>নং- ১৭০৬/প্রশা/বাঅঅ/সমন্বয়/র:জ:প্র:নি:শু:/২০১১-১২/</p>
          <p>তারিখঃ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /২০২৩খ্রিঃ</p>
        </div>
        <div className="flex gap-16">
          <div className="text-center w-32 border-t border-slate-900 pt-1">
            <p className="font-black">স্বাক্ষর</p>
          </div>
          <div className="text-center w-32 border-t border-slate-900 pt-1">
            <p className="font-black">স্বাক্ষর</p>
          </div>
          <div className="text-center w-32 border-t border-slate-900 pt-1">
            <p className="font-black">স্বাক্ষর</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QR_4;
