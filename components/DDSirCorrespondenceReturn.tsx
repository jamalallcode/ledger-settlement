import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Printer, Mail, Calendar, RotateCcw } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format, startOfMonth, addDays, isBefore, subMonths, parseISO } from 'date-fns';

interface DDSirCorrespondenceReturnProps {
  entries: any[];
  activeCycle: { start: Date; end: Date; label: string };
  onBack: () => void;
  isLayoutEditable?: boolean;
}

const DDSirCorrespondenceReturn: React.FC<DDSirCorrespondenceReturnProps> = ({ 
  entries, 
  activeCycle, 
  onBack, 
  isLayoutEditable 
}) => {
  // --- Logic for 2nd Sunday Calculation (Default) ---
  const defaultReportingDate = useMemo(() => {
    const end = activeCycle.end;
    const firstDay = startOfMonth(end);
    let firstSunday = 1 + (7 - firstDay.getDay()) % 7;
    if (firstDay.getDay() === 0) firstSunday = 1; 
    const secondSundayDate = addDays(firstDay, firstSunday + 6);
    return format(secondSundayDate, 'yyyy-MM-dd');
  }, [activeCycle.end]);

  const [selectedReportingDate, setSelectedReportingDate] = useState<string>(defaultReportingDate);

  useEffect(() => {
    setSelectedReportingDate(defaultReportingDate);
  }, [defaultReportingDate]);

  const reportingDate = useMemo(() => new Date(selectedReportingDate), [selectedReportingDate]);

  const reportingDateBN = toBengaliDigits(format(reportingDate, 'dd/MM/yyyy'));
  const reportingMonthBN = toBengaliDigits(format(reportingDate, 'MMMM/yy'))
    .replace('January', 'জানুয়ারি').replace('February', 'ফেব্রুয়ারি').replace('March', 'মার্চ')
    .replace('April', 'এপ্রিল').replace('May', 'মে').replace('June', 'জুন')
    .replace('July', 'জুলাই').replace('August', 'আগস্ট').replace('September', 'সেপ্টেম্বর')
    .replace('October', 'অক্টোবর').replace('November', 'নভেম্বর').replace('December', 'ডিসেম্বর');

  // --- Grouping & Calculation Logic for Table 1 (Summary) ---
  const reportTableData = useMemo(() => {
    const grouped: Record<string, any> = {};
    const thresholdDate = subMonths(reportingDate, 1);

    entries.forEach(entry => {
      const auditor = entry.receiverName || entry.presentedToName || 'অনির্ধারিত';
      if (!grouped[auditor]) {
        grouped[auditor] = {
          name: auditor,
          karyapatra: { less: 0, more: 0 },
          karyabibarani: { less: 0, more: 0 },
          broadsheet: { less: 0, more: 0 },
          reconciliation: { less: 0, more: 0 },
          others: { less: 0, more: 0 }
        };
      }

      const diaryDate = new Date(entry.diaryDate);
      const isMoreThanMonth = isBefore(diaryDate, thresholdDate);
      const durationKey = isMoreThanMonth ? 'more' : 'less';

      const lType = entry.letterType || '';
      const desc = (entry.description || '').toLowerCase();

      if (lType === 'দ্বিপক্ষীয় সভা') {
        grouped[auditor].karyapatra[durationKey]++;
      } else if (lType === 'ত্রিপক্ষীয় সভা') {
        grouped[auditor].karyabibarani[durationKey]++;
      } else if (lType === 'বিএসআর') {
        grouped[auditor].broadsheet[durationKey]++;
      } else if (desc.includes('মিলিকরণ') || desc.includes('সমন্বয়')) {
        grouped[auditor].reconciliation[durationKey]++;
      } else {
        grouped[auditor].others[durationKey]++;
      }
    });

    return Object.values(grouped);
  }, [entries, reportingDate]);

  // --- Grouping & Logic for Table 2 (Detailed List) ---
  const detailedListData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const audA = a.receiverName || a.presentedToName || 'অনির্ধারিত';
      const audB = b.receiverName || b.presentedToName || 'অনির্ধারিত';
      return audA.localeCompare(audB);
    });

    const groups: { auditor: string; rows: any[] }[] = [];
    sorted.forEach(row => {
      const aud = row.receiverName || row.presentedToName || 'অনির্ধারিত';
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.auditor === aud) {
        lastGroup.rows.push(row);
      } else {
        groups.push({ auditor: aud, rows: [row] });
      }
    });
    return groups;
  }, [entries]);

  const totals = useMemo(() => {
    return reportTableData.reduce((acc, row) => {
      acc.kpL += row.karyapatra.less; acc.kpM += row.karyapatra.more;
      acc.kbL += row.karyabibarani.less; acc.kbM += row.karyabibarani.more;
      acc.bsL += row.broadsheet.less; acc.bsM += row.broadsheet.more;
      acc.rcL += row.reconciliation.less; acc.rcM += row.reconciliation.more;
      acc.otL += row.others.less; acc.otM += row.others.more;
      return acc;
    }, { kpL: 0, kpM: 0, kbL: 0, kbM: 0, bsL: 0, bsM: 0, rcL: 0, rcM: 0, otL: 0, otM: 0 });
  }, [reportTableData]);

  const grandTotalLess = totals.kpL + totals.kbL + totals.bsL + totals.rcL + totals.otL;
  const grandTotalMore = totals.kpM + totals.kbM + totals.bsM + totals.rcM + totals.otM;

  const thStyle = "border border-black px-1 py-2 font-bold text-center text-[13px] leading-tight align-middle bg-white";
  const tdStyle = "border border-black px-2 py-2 text-[14px] text-center font-bold leading-tight bg-white align-middle";
  
  // Sticky Styles for Table 2
  const stickyThStyle = "border border-black px-1 py-3 font-black text-center text-[11px] bg-slate-100 sticky top-[80px] z-[50] shadow-[inset_0_-1px_0_#000]";
  const stickyTdStyle = "border border-black px-2 py-2 text-[12px] text-center font-bold leading-tight bg-white align-middle";

  return (
    <div className="space-y-6 py-2 w-full animate-report-reveal relative font-['Hind_Siliguri'] bg-white">
      {/* Control Bar (No Print) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">স্পেশাল ভিউ:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">ডিডি স্যার ফরম্যাট</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 h-[44px] rounded-xl">
             <Calendar size={16} className="text-blue-600" />
             <label className="text-[11px] font-black text-slate-500 uppercase tracking-tighter mr-1">রিপোর্টিং তারিখ:</label>
             <input 
               type="date" 
               className="bg-transparent border-none outline-none font-black text-slate-900 text-xs cursor-pointer"
               value={selectedReportingDate}
               onChange={(e) => setSelectedReportingDate(e.target.value)}
             />
             {selectedReportingDate !== defaultReportingDate && (
               <button 
                onClick={() => setSelectedReportingDate(defaultReportingDate)}
                className="p-1 hover:bg-white rounded-md text-blue-400 hover:text-blue-600 transition-all"
                title="ডিফল্ট তারিখে ফিরুন"
               >
                 <RotateCcw size={14} />
               </button>
             )}
          </div>
          
          <button onClick={() => window.print()} className="h-[44px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
            <Printer size={18} /> প্রিন্ট করুন
          </button>
        </div>
      </div>

      <div className="w-full bg-white p-4 md:p-8 relative">
        {/* Office Header */}
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-[20px] font-bold text-black leading-tight">{OFFICE_HEADER.main}</h1>
          <h2 className="text-[18px] font-bold text-black leading-tight">{OFFICE_HEADER.sub}</h2>
          <h3 className="text-[17px] font-bold text-black leading-tight">{OFFICE_HEADER.address}</h3>
          <h4 className="text-[16px] font-bold text-black leading-tight">খুলনা-৯০০০</h4>
        </div>

        {/* SECTION 1: সারসংক্ষেপ টেবিল (Non-Sticky) */}
        <div className="mb-10">
          <div className="grid grid-cols-4 w-full border border-black mb-0">
            <div className="border-r border-black p-2 text-center font-bold text-[14px]">অনিষ্পন্ন কাজের তালিকা</div>
            <div className="border-r border-black p-2 text-center font-bold text-[14px]">শাখার নাম: {entries[0]?.paraType || 'অনির্ধারিত'}</div>
            <div className="border-r border-black p-2 text-center font-bold text-[14px]">মাস: {reportingMonthBN}</div>
            <div className="p-2 text-center font-bold text-[14px]">তারিখ: {reportingDateBN} খ্রি:</div>
          </div>

          <div className="table-container">
            <table className="w-full border-separate table-fixed border-collapse">
              <colgroup>
                <col className="w-[50px]" />
                <col className="w-[180px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className={thStyle}>ক্রমিক নং</th>
                  <th rowSpan={2} className={thStyle}>দায়িত্বপ্রাপ্ত অডিটরের নাম</th>
                  <th colSpan={2} className={thStyle}>দ্বিপক্ষীয় সভার কার্যপত্র</th>
                  <th colSpan={2} className={thStyle}>দ্বিপক্ষীয় সভার কার্যবিবরণী</th>
                  <th colSpan={2} className={thStyle}>ব্রডশীট জবাব</th>
                  <th colSpan={2} className={thStyle}>মিলিকরণ</th>
                  <th colSpan={2} className={thStyle}>অন্যান্য</th>
                </tr>
                <tr>
                  <th className={thStyle}>এক মাসের কম</th>
                  <th className={thStyle}>এক মাসের বেশি</th>
                  <th className={thStyle}>এক মাসের কম</th>
                  <th className={thStyle}>এক মাসের বেশি</th>
                  <th className={thStyle}>এক মাসের কম</th>
                  <th className={thStyle}>এক মাসের বেশি</th>
                  <th className={thStyle}>এক মাসের কম</th>
                  <th className={thStyle}>এক মাসের বেশি</th>
                  <th className={thStyle}>এক মাসের কম</th>
                  <th className={thStyle}>এক মাসের বেশি</th>
                </tr>
              </thead>
              <tbody>
                {reportTableData.length > 0 ? reportTableData.map((row, idx) => (
                  <tr key={idx}>
                    <td className={tdStyle}>{toBengaliDigits(idx + 1)}</td>
                    <td className={tdStyle + " text-left"}>{row.name}</td>
                    <td className={tdStyle}>{row.karyapatra.less > 0 ? toBengaliDigits(row.karyapatra.less) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.karyapatra.more > 0 ? toBengaliDigits(row.karyapatra.more) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.karyabibarani.less > 0 ? toBengaliDigits(row.karyabibarani.less) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.karyabibarani.more > 0 ? toBengaliDigits(row.karyabibarani.more) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.broadsheet.less > 0 ? toBengaliDigits(row.broadsheet.less) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.broadsheet.more > 0 ? toBengaliDigits(row.broadsheet.more) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.reconciliation.less > 0 ? toBengaliDigits(row.reconciliation.less) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.reconciliation.more > 0 ? toBengaliDigits(row.reconciliation.more) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.others.less > 0 ? toBengaliDigits(row.others.less) + ' টি' : '-'}</td>
                    <td className={tdStyle}>{row.others.more > 0 ? toBengaliDigits(row.others.more) + ' টি' : '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center italic border border-black font-bold text-slate-400">কোনো তথ্য পাওয়া যায়নি</td>
                  </tr>
                )}
                <tr className="bg-slate-50">
                  <td colSpan={2} className={tdStyle + " text-center"}>মোট</td>
                  <td className={tdStyle}>{totals.kpL > 0 ? toBengaliDigits(totals.kpL) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.kpM > 0 ? toBengaliDigits(totals.kpM) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.kbL > 0 ? toBengaliDigits(totals.kbL) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.kbM > 0 ? toBengaliDigits(totals.kbM) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.bsL > 0 ? toBengaliDigits(totals.bsL) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.bsM > 0 ? toBengaliDigits(totals.bsM) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.rcL > 0 ? toBengaliDigits(totals.rcL) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.rcM > 0 ? toBengaliDigits(totals.rcM) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.otL > 0 ? toBengaliDigits(totals.otL) + ' টি' : '-'}</td>
                  <td className={tdStyle}>{totals.otM > 0 ? toBengaliDigits(totals.otM) + ' টি' : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid grid-cols-3 border border-black">
            <div className="flex items-center">
              <div className="flex-1 p-3 border-r border-black font-bold text-[14px]">এক মাসের কম অনিষ্পন্ন কাজ</div>
              <div className="w-40 p-3 text-center font-bold text-[14px]">{toBengaliDigits(grandTotalLess)} টি</div>
            </div>
            <div className="flex items-center border-l border-black">
              <div className="flex-1 p-3 border-r border-black font-bold text-[14px]">এক মাসের বেশি অনিষ্পন্ন কাজ</div>
              <div className="w-40 p-3 text-center font-bold text-[14px]">{toBengaliDigits(grandTotalMore)} টি</div>
            </div>
            <div className="flex items-center border-l border-black">
              <div className="flex-1 p-3 border-r border-black font-bold text-[14px]">মোট কাজ</div>
              <div className="w-40 p-3 text-center font-bold text-[14px]">{toBengaliDigits(grandTotalLess + grandTotalMore)} টি</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: বিস্তারিত তালিকা টেবিল (Sticky Header/Footer) */}
        <div className="pt-10 border-t-4 border-double border-slate-300">
          <div className="text-center mb-6">
             <div className="inline-block px-10 py-1 bg-black text-white text-[16px] font-black tracking-widest uppercase mb-4">ছক</div>
             <div className="flex justify-between items-end border-b border-black pb-1">
                <span className="font-bold text-[15px]">বকেয়া চিঠিপত্রের তালিকা ({entries[0]?.paraType || 'অনির্ধারিত'} শাখা)</span>
                <span className="font-bold text-[15px]">তাং- {reportingDateBN} খ্রি:</span>
             </div>
          </div>

          <div className="table-container relative overflow-visible">
            <table className="w-full border-separate table-fixed border-spacing-0 border border-black">
              <colgroup>
                <col className="w-[45px]" />
                <col className="w-[120px]" />
                <col className="w-[220px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[160px]" />
                <col className="w-[90px]" />
                <col className="w-[85px]" />
                <col className="w-[80px]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={stickyThStyle}>ক্রমিক নং</th>
                  <th className={stickyThStyle}>দায়িত্বপ্রাপ্ত অডিটরের নাম</th>
                  <th className={stickyThStyle}>এনটিটি/প্রতিষ্ঠানের নাম</th>
                  <th className={stickyThStyle}>স্মারক নং ও তারিখ</th>
                  <th className={stickyThStyle}>শাখার ডায়েরি নং ও তারিখ</th>
                  <th className={stickyThStyle}>চিঠিপত্রের ধরণ ও অনুচ্ছেদের সংখ্যা</th>
                  <th className={stickyThStyle}>উপস্থাপনের তারিখ</th>
                  <th className={stickyThStyle}>বর্তমান অবস্থান</th>
                  <th className={stickyThStyle}>মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                {detailedListData.length > 0 ? (() => {
                  let globalIdx = 0;
                  return detailedListData.map((group) => group.rows.map((row, rowIdx) => {
                    globalIdx++;
                    return (
                      <tr key={row.id}>
                        <td className={stickyTdStyle}>{toBengaliDigits(globalIdx)}</td>
                        {rowIdx === 0 && (
                          <td rowSpan={group.rows.length} className={stickyTdStyle + " bg-slate-50/50"}>
                            <div className="font-black text-slate-900">{group.auditor}</div>
                          </td>
                        )}
                        <td className={stickyTdStyle + " text-left px-3 font-medium"}>{row.description}</td>
                        <td className={stickyTdStyle}>{row.letterNo}<br/><span className="text-[10px] text-slate-500 font-bold">{toBengaliDigits(row.letterDate)}</span></td>
                        <td className={stickyTdStyle}>{row.diaryNo}<br/><span className="text-[10px] text-slate-500 font-bold">{toBengaliDigits(row.diaryDate)}</span></td>
                        <td className={stickyTdStyle}>
                          <div className="flex flex-col gap-0.5">
                             <span className="text-blue-700">{row.letterType}</span>
                             <span className="text-[10px] bg-slate-100 rounded px-1">(অনু: {toBengaliDigits(row.totalParas)}টি)</span>
                          </div>
                        </td>
                        <td className={stickyTdStyle}>{toBengaliDigits(row.presentationDate) || '-'}</td>
                        <td className={stickyTdStyle}>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase">
                            {row.presentedToName || 'ডিডি'}
                          </span>
                        </td>
                        <td className={stickyTdStyle + " italic text-slate-400"}>{row.remarks || '-'}</td>
                      </tr>
                    );
                  }));
                })() : (
                  <tr>
                    <td colSpan={9} className="py-20 text-center font-bold text-slate-400 bg-slate-50 italic border border-black">
                      বর্তমানে বিস্তারিত তালিকায় কোনো তথ্য নেই।
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 z-[50]">
                <tr className="bg-slate-900 text-white font-black text-[13px] h-11 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
                  <td colSpan={2} className="px-6 text-left border-t border-slate-700 bg-slate-900">সর্বমোট চিঠিপত্র সংখ্যা:</td>
                  <td colSpan={1} className="px-4 text-center border-t border-slate-700 bg-slate-900 text-emerald-400">{toBengaliDigits(entries.length)} টি</td>
                  <td colSpan={6} className="border-t border-slate-700 bg-slate-900"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DDSirCorrespondenceReturn;
