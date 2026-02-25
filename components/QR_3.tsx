import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';
import { format, subMonths } from 'date-fns';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
}

const QR_3: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
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
        { name: "চিনি ও খাদ্য সংস্থা", pCount: 621, pAmount: 17330266370, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "ক্ষুদ্র ও কুটির শিল্প", pCount: 85, pAmount: 166675293, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "বিটাক", pCount: 0, pAmount: 0, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "রসায়ন শিল্প সংস্থা", pCount: 2, pAmount: 553176, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
      ]
    },
    {
      ministry: "বস্ত্র ও পাট মন্ত্রণালয়",
      entities: [
        { name: "পাটকল সংস্থা", pCount: 1778, pAmount: 21918286207, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "পাট সংস্থা", pCount: 3, pAmount: 32016629, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "বস্ত্রকল সংস্থা", pCount: 160, pAmount: 16231079081, cCount: 0, cAmount: 0, sCount: 1, sAmount: 15000 },
        { name: "রেশম বোর্ড", pCount: 7, pAmount: 2751732, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
      ]
    },
    {
      ministry: "বাণিজ্য মন্ত্রণালয়",
      entities: [
        { name: "টিসিবি", pCount: 57, pAmount: 230832525, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "আমদানি ও রপ্তানি", pCount: 3, pAmount: 1577323, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
      ]
    },
    {
      ministry: "বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়",
      entities: [
        { name: "বাংলাদেশ বিমান", pCount: 60, pAmount: 460866121, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "পর্যটন কর্পোরেশন", pCount: 53, pAmount: 3355279, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
      ]
    }
  ];

  const table2Data = [
    {
      ministry: "আর্থিক প্রতিষ্ঠান বিভাগ",
      entities: [
        { name: "সোনালী ব্যাংক পিএলসি", pCount: 2680, pAmount: 39827509886, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "জনতা ব্যাংক পিএলসি", pCount: 1818, pAmount: 17363929591, cCount: 0, cAmount: 0, sCount: 29, sAmount: 141343683 },
        { name: "অগ্রণী ব্যাংক পিএলসি", pCount: 1954, pAmount: 16238136822, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "বাংলাদেশ কৃষি ব্যাংক", pCount: 2018, pAmount: 1830197716, cCount: 0, cAmount: 0, sCount: 1, sAmount: 2410046 },
        { name: "রূপালী ব্যাংক পিএলসি", pCount: 1109, pAmount: 34816801304, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "বাংলাদেশ ব্যাংক", pCount: 318, pAmount: 5278296389, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "বাংলাদেশ ডেভেলপমেন্ট ব্যাংক লিঃ", pCount: 117, pAmount: 1673007818, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "গৃহনির্মাণ ঋণদান সংস্থা", pCount: 52, pAmount: 220803333, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "কর্মসংস্থান ব্যাংক", pCount: 111, pAmount: 72967576, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "বেসিক ব্যাংক লিঃ", pCount: 195, pAmount: 3021693705, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "আনসার ভিডিপি উন্নয়ন ব্যাংক লিঃ", pCount: 53, pAmount: 44416195, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ", pCount: 29, pAmount: 220711456, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "সাধারণ বীমা কর্পোরেশন", pCount: 44, pAmount: 669179270, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "জীবন বীমা কর্পোরেশন", pCount: 131, pAmount: 1588032223, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
        { name: "প্রবাসী কল্যাণ ব্যাংক", pCount: 1, pAmount: 1011000, cCount: 0, cAmount: 0, sCount: 0, sAmount: 0 },
      ]
    }
  ];

  const thCls = "border border-slate-400 p-1 text-[10px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border border-slate-400 p-1 text-[10px] text-slate-700 align-middle";
  const numTdCls = "border border-slate-400 p-1 text-[10px] text-slate-700 text-center align-middle font-bold";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pC: 0, pA: 0, cC: 0, cA: 0, tC: 0, sC: 0, sA: 0, fC: 0, fA: 0 };

    return (
      <div className="overflow-x-auto mb-10">
        <table className="w-full border-collapse border border-slate-400 shadow-sm">
          <thead>
            <tr>
              <th rowSpan={3} className={thCls}>ক্রঃ নং</th>
              <th rowSpan={3} className={thCls}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={3} className={thCls}>সংস্থার নাম</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত উত্থাপিত অডিট আপত্তি</th>
              <th rowSpan={3} className={thCls}>মোট অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মীমাংসিত অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তি</th>
              <th rowSpan={3} className={thCls}>মন্তব্য</th>
            </tr>
            <tr>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
            </tr>
            <tr className="bg-slate-50">
              {[1, 2, 3, 4, 5, 6, 7, '৮ = ৪+৬', 9, 10, '১১ = ৮-৯', '১২ = ৫+৭-১০', 13].map((n, i) => (
                <th key={i} className="border border-slate-400 p-1 text-[9px] font-bold text-slate-500 text-center">{typeof n === 'string' ? toBengaliDigits(n) : toBengaliDigits(n.toString())}</th>
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
                        <td rowSpan={mGroup.entities.length} className={tdCls + " font-black"}>{mGroup.ministry}</td>
                      )}
                      <td className={tdCls}>{ent.name}</td>
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
            <tr className="bg-slate-100 font-black">
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
               <tr className="bg-slate-200 font-black">
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
    <div id="qr-3-container" className="max-w-[1200px] mx-auto p-8 bg-white rounded-xl border border-slate-300 shadow-2xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-3-container" />
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-lg font-black text-slate-900">বাণিজ্যিক অডিট অধিদপ্তর</h1>
        <h2 className="text-md font-bold text-slate-800">আঞ্চলিক কার্যালয় (সে-৬) খুলনা।</h2>
      </div>

      <div className="flex justify-between items-center mb-4 text-[12px] font-bold text-slate-800">
        <p>মন্ত্রণালয়/সংস্থা ভিত্তিক {getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
        <p>নন এসএফআই</p>
      </div>

      {renderTable(table1Data, 'table-1')}
      
      <div className="mb-4 text-[12px] font-bold text-slate-800">
        <p>মন্ত্রণালয়/সংস্থা ভিত্তিক {getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
      </div>
      {renderTable(table2Data, 'table-2')}

      {/* Footer Section */}
      <div className="mt-8 flex justify-between items-end text-[11px] font-bold text-slate-800">
        <div className="space-y-1">
          <p>নং- ১৭০৬/প্রশা/বাঅঅ/সমন্বয়/র:জ:প্র:নি:শু:/২০১১-১২/</p>
          <p>তারিখঃ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /২০২৩খ্রিঃ</p>
        </div>
        <div className="text-center pb-4">
          <div className="w-48 border-t border-slate-900 pt-1">
            <p className="font-black">স্বাক্ষর</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QR_3;
