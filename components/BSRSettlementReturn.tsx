
import React, { useState, useMemo } from 'react';
import { Printer, ChevronLeft, Search, X } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { OFFICE_HEADER } from '../constants';
import { format as dateFnsFormat, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { SettlementEntry } from '../types';

interface BSRSettlementReturnProps {
  entries: SettlementEntry[];
  correspondenceEntries: any[];
  activeCycle: any;
  setSelectedReportType: (type: string | null) => void;
  HistoricalFilter: React.FC;
  IDBadge: React.FC<{ id: string }>;
}

const BSRSettlementReturn: React.FC<BSRSettlementReturnProps> = ({
  entries,
  correspondenceEntries,
  activeCycle,
  setSelectedReportType,
  HistoricalFilter,
  IDBadge
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const reportMonthDate = useMemo(() => subMonths(activeCycle.end, 1), [activeCycle.end]);
  const reportMonthStart = useMemo(() => startOfMonth(reportMonthDate), [reportMonthDate]);
  const reportMonthEnd = useMemo(() => endOfMonth(reportMonthDate), [reportMonthDate]);

  const table1Data = useMemo(() => {
    let data = entries || [];
    
    // Filter for BSR type letters settled in the previous month
    data = data.filter(e => {
      if (e.meetingType !== 'বিএসআর') return false;
      if (!e.issueDateISO) return false;
      
      const issueDate = new Date(e.issueDateISO);
      if (isNaN(issueDate.getTime())) return false;
      
      // Check if settled within the previous month
      return issueDate >= reportMonthStart && issueDate <= reportMonthEnd;
    });

    if (!searchTerm.trim()) return data;
    return data.filter(entry => 
      (entry.entityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.ministryName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.workpaperNoDate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.letterNoDate || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm, reportMonthStart, reportMonthEnd]);

  const filteredData = useMemo(() => {
    let data = correspondenceEntries || [];
    data = data.filter(e => e.letterType === 'বিএসআর');

    if (!searchTerm.trim()) return data;
    return data.filter(entry => 
      (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.diaryNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.letterNo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [correspondenceEntries, searchTerm]);

  const thS = "border border-slate-400 px-1 py-1 font-black text-center text-[10px] md:text-[11px] bg-slate-100 text-slate-900 leading-tight align-middle h-full !shadow-none";
  const tdS = "border border-slate-400 px-2 py-2 text-[10px] md:text-[11px] text-center font-bold leading-tight bg-white h-[40px] align-middle overflow-hidden break-words !shadow-none";

  const cycleLabelBN = toBengaliDigits(dateFnsFormat(reportMonthDate, 'MMMM/yyyy'))
    .replace('January', 'জানুয়ারি').replace('February', 'ফেব্রুয়ারি').replace('March', 'মার্চ')
    .replace('April', 'এপ্রিল').replace('May', 'মে').replace('June', 'জুন')
    .replace('July', 'জুলাই').replace('August', 'আগস্ট').replace('September', 'সেপ্টেম্বর')
    .replace('October', 'অক্টোবর').replace('November', 'নভেম্বর').replace('December', 'ডিসেম্বর');

  return (
    <div id="bsr-settlement-container" className="space-y-8 py-2 w-full animate-report-page relative">
      <IDBadge id="bsr-settlement-container" />
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedReportType(null)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">রিপোর্ট টাইপ:</span>
            <span className="text-lg font-black text-slate-900 leading-tight">বিএসআর নিষ্পত্তি রিটার্ন</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="ডায়েরি, স্মারক বা বিবরণ দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <HistoricalFilter />

          <button onClick={() => window.print()} className="h-[48px] px-6 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Printer size={18} /> প্রিন্ট</button>
        </div>
      </div>

      {/* Table 1: Broadsheet Settlement Recommendation */}
      <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-8 relative animate-table-entrance">
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-xl font-black text-slate-900 leading-tight">{OFFICE_HEADER.main}</h1>
          <h2 className="text-lg font-black text-slate-800 leading-tight">{OFFICE_HEADER.sub}</h2>
          <h3 className="text-md font-black text-slate-700 leading-tight">{OFFICE_HEADER.address}</h3>
          
          <div className="flex justify-between items-end pt-4">
            <div className="text-left space-y-1">
              <p className="text-[11px] font-black">অডিট অধিদপ্তরের নাম: {OFFICE_HEADER.main}, {OFFICE_HEADER.sub}</p>
              <p className="text-[11px] font-black">বিষয়: নিরীক্ষা পরিদর্শন প্রতিবেদনে (AIR) অন্তর্ভুক্ত আপত্তি নিষ্পত্তির অগ্রগতি সংক্রান্ত মাসিক প্রতিবেদন (মন্ত্রণালয় ভিত্তিক)</p>
              <p className="text-[11px] font-black underline">ক. ব্রডশিট জবাবের প্রেক্ষিতে নিষ্পত্তির সুপারিশ সংক্রান্ত (মাসিক) প্রতিবেদন।</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[11px] font-black">ছক: ক</p>
              <p className="text-[11px] font-black">শাখা: নন এসএফআই</p>
              <p className="text-[11px] font-black">মাসের নাম: {cycleLabelBN}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr>
                <th rowSpan={2} className={thS}>ক্র. নং</th>
                <th rowSpan={2} className={thS}>মন্ত্রণালয়ের নাম/প্রতিষ্ঠানের নাম এবং রিপোর্টের বৎসর</th>
                <th rowSpan={2} className={thS}>ব্রডশিট জবাবের সংখ্যা</th>
                <th rowSpan={2} className={thS}>ডায়েরি নম্বর ও তারিখ</th>
                <th rowSpan={2} className={thS}>ব্রডশিট জবাবের স্মারক ও তারিখ</th>
                <th rowSpan={2} className={thS}>প্রেরিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={thS}>মীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={thS}>মীমাংসা জারিপত্রের স্মারক ও তারিখ</th>
                <th rowSpan={2} className={thS}>মীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th colSpan={3} className={thS}>ব্রডশিট জবাবের প্রেক্ষিতে আদায় সমন্বয়ের পরিমাণ</th>
                <th rowSpan={2} className={thS}>অমীমাংসিত অনুচ্ছেদ সংখ্যা</th>
                <th rowSpan={2} className={thS}>অমীমাংসিত অনুচ্ছেদে জড়িত টাকার পরিমাণ</th>
                <th rowSpan={2} className={thS}>আর্কাইভ নং</th>
              </tr>
              <tr>
                <th className={thS}>আদায়</th>
                <th className={thS}>সমন্বয়</th>
                <th className={thS}>অন্যান্য</th>
              </tr>
              <tr className="bg-slate-50">
                {[...Array(15)].map((_, i) => (
                  <th key={i} className={`${thS} py-0.5 text-[9px]`}>{toBengaliDigits(i + 1)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table1Data.length > 0 ? table1Data.map((entry, idx) => {
                const totalSettled = (entry.totalRec || 0) + (entry.totalAdj || 0);
                const othersAmount = (entry.othersRec || 0) + (entry.othersAdj || 0);
                const totalSettledWithOthers = totalSettled + othersAmount;
                const unsettledAmount = (entry.involvedAmount || 0) - totalSettledWithOthers;

                return (
                  <tr key={entry.id}>
                    <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                    <td className={`${tdS} text-left`}>
                      {entry.ministryName} / {entry.entityName}
                      <br />
                      <span className="text-[10px] opacity-70">{entry.auditYear}</span>
                    </td>
                    <td className={tdS}>{toBengaliDigits(1)}</td>
                    <td className={tdS}>{entry.workpaperNoDate}</td>
                    <td className={tdS}>{entry.letterNoDate}</td>
                    <td className={tdS}>{toBengaliDigits(entry.meetingSentParaCount || 0)}</td>
                    <td className={tdS}>{toBengaliDigits(entry.meetingSettledParaCount || 0)}</td>
                    <td className={tdS}>{entry.issueLetterNoDate}</td>
                    <td className={tdS}>{toBengaliDigits(entry.involvedAmount || 0)}</td>
                    <td className={tdS}>{toBengaliDigits(entry.totalRec || 0)}</td>
                    <td className={tdS}>{toBengaliDigits(entry.totalAdj || 0)}</td>
                    <td className={tdS}>{toBengaliDigits(othersAmount)}</td>
                    <td className={tdS}>{toBengaliDigits(entry.meetingUnsettledParas || 0)}</td>
                    <td className={tdS}>{toBengaliDigits(unsettledAmount > 0 ? unsettledAmount : 0)}</td>
                    <td className={tdS}>{entry.archiveNo || '-'}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={15} className="py-10 text-center font-bold text-slate-400 bg-slate-50">কোনো তথ্য পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Letters Received from Responsible Party */}
      <div className="bg-white border border-slate-300 shadow-2xl w-full overflow-visible p-8 relative animate-table-entrance">
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-xl font-black text-slate-900 leading-tight">মহাপরিচালকের কার্যালয়</h1>
          <h1 className="text-xl font-black text-slate-900 leading-tight">বাণিজ্যিক অডিট অধিদপ্তর</h1>
          <h2 className="text-lg font-black text-slate-800 leading-tight">আঞ্চলিক কার্যালয় (সেক্টর-৬)</h2>
          <h3 className="text-md font-black text-slate-700 leading-tight">বিডিবিএল ভবন (৯ম ও ১০ম তলা), খুলনা।</h3>
          
          <div className="pt-6 space-y-2">
            <p className="text-[12px] font-black">শাখা: নন এসএফআই।</p>
            <p className="text-[12px] font-black">Responsible Party হতে প্রাপ্ত পত্রাদির মাসিক প্রতিবেদন: ({toBengaliDigits(dateFnsFormat(reportMonthStart, 'dd-MM-yyyy'))} হতে {toBengaliDigits(dateFnsFormat(reportMonthEnd, 'dd-MM-yyyy'))} খ্রিঃ তারিখ পর্যন্ত)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr>
                <th rowSpan={2} className={thS}>ক্রমিক নং</th>
                <th rowSpan={2} className={thS}>বিবরণ</th>
                <th rowSpan={2} className={thS}>প্রাপ্ত জবাব (পত্র সংখ্যা)</th>
                <th rowSpan={2} className={thS}>প্রাপ্ত জবাবের ডায়েরি নং ও তারিখ</th>
                <th rowSpan={2} className={thS}>অনুচ্ছেদ সংখ্যা</th>
                <th colSpan={3} className={thS}>গৃহীত কার্যক্রম</th>
              </tr>
              <tr>
                <th className={thS}>প্রাপ্ত জবাবের Disposal/জারিপত্র ও তারিখ</th>
                <th className={thS}>নিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা</th>
                <th className={thS}>অনিষ্পত্তিকৃত অনুচ্ছেদ সংখ্যা</th>
              </tr>
              <tr className="bg-slate-50">
                {[...Array(8)].map((_, i) => (
                  <th key={i} className={`${thS} py-0.5 text-[9px]`}>{toBengaliDigits(i + 1)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((entry, idx) => (
                <tr key={entry.id}>
                  <td className={tdS}>{toBengaliDigits(idx + 1)}</td>
                  <td className={`${tdS} text-left`}>{entry.description}</td>
                  <td className={tdS}>{toBengaliDigits(1)} টি</td>
                  <td className={tdS}>{entry.diaryNo}<br/>{formatDateBN(entry.diaryDate)}</td>
                  <td className={tdS}>{toBengaliDigits(entry.totalParas || 0)}</td>
                  <td className={tdS}>{entry.issueLetterNo || 'চলমান'}<br/>{formatDateBN(entry.issueLetterDate)}</td>
                  <td className={tdS}>-</td>
                  <td className={tdS}>{toBengaliDigits(entry.totalParas || 0)} টি</td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="py-10 text-center font-bold text-slate-400 bg-slate-50">কোনো তথ্য পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BSRSettlementReturn;
