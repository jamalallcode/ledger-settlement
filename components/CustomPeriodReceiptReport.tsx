import React, { useState, useMemo, useRef } from 'react';
import { 
  Calendar, FileText, User, Printer, Search, RefreshCw, 
  ChevronLeft, LayoutGrid, Sparkles, FileSpreadsheet, ArrowRight,
  ShieldCheck, Mail, Info, FileEdit
} from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, formatDateBN } from '../utils/numberUtils';
import { isSFI, isNonSFI } from '../utils/branchUtils';
import { format } from 'date-fns';

interface CustomPeriodReceiptReportProps {
  entries: any[]; // These are approved correspondenceEntries passed from ReturnView
  onBack: () => void;
  IDBadge: React.FC<{ id: string }>;
}

export const CustomPeriodReceiptReport: React.FC<CustomPeriodReceiptReportProps> = ({
  entries = [],
  onBack,
  IDBadge
}) => {
  // Set default dates to 1/07/2025 - 30/06/2026 as requested by user's sir
  const [startDate, setStartDate] = useState('2025-07-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('সকল');

  // Filter entries based on selected dates and other controls
  const filteredEntries = useMemo(() => {
    // Robust normalization for Bengali and English string matching
    const normalizeForSearch = (str: string = '') => {
      if (!str) return '';
      let normalized = str.normalize('NFC').toLowerCase();
      
      // Remove zero-width characters and special diacritics
      normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
      
      // Replace Bengali digits with English digits to search numbers easily
      const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      for (let i = 0; i < 10; i++) {
        normalized = normalized.replace(new RegExp(bengaliDigits[i], 'g'), englishDigits[i]);
      }
      
      // Normalize common spelling typos / variations in Bengali
      // 1. "কায" -> "কার্য" (handle Ref-less typo)
      normalized = normalized.replace(/কায/g, 'কার্য');
      
      // 2. Handle 'য়' (ya-with-dot) and 'য' (ya) equivalence
      normalized = normalized.replace(/য়/g, 'য');
      
      // 3. Handle 'ী' (dirgho-i) and 'ি' (hrosso-i) equivalence
      normalized = normalized.replace(/ী/g, 'ি');
      
      // 4. Handle "মিলিকরণ" vs "মিলকরণ" equivalence
      normalized = normalized.replace(/মিলিকরণ/g, 'মিলকরণ');

      // 5. English term expansions for cross-lingual searching
      if (normalized.includes('bsr')) {
        normalized += ' বিএসআর';
      }
      if (normalized.includes('bilateral')) {
        normalized += ' দ্বিপক্ষীয় দ্বিপক্ষীয় সভা';
      }
      if (normalized.includes('trilateral')) {
        normalized += ' ত্রিপক্ষীয় ত্রিপক্ষীয় সভা';
      }
      if (normalized.includes('working') || normalized.includes('work')) {
        normalized += ' কার্যপত্র';
      }
      if (normalized.includes('minutes')) {
        normalized += ' কার্যবিবরণী';
      }
      if (normalized.includes('recon')) {
        normalized += ' মিলিকরণ মিলকরণ';
      }
      
      return normalized.replace(/\s+/g, ' ').trim();
    };

    return entries.filter(entry => {
      // 1. Date Range Filter using diaryDate (receipt date) or letterDate if diaryDate is empty
      const entryDate = entry.diaryDate || entry.letterDate || '';
      if (!entryDate) return false;

      const isWithinDateRange = entryDate >= startDate && entryDate <= endDate;
      if (!isWithinDateRange) return false;

      // Check if search query contains any letter-type keywords
      const lowerSearch = searchTerm.toLowerCase().trim();
      const isLetterTypeKeyword = 
        lowerSearch.includes('বিএসআর') || lowerSearch.includes('bsr') ||
        lowerSearch.includes('দ্বিপক্ষ') || lowerSearch.includes('দ্বিপাক্ষ') || lowerSearch.includes('bilateral') ||
        lowerSearch.includes('ত্রিপক্ষ') || lowerSearch.includes('ত্রিপাক্ষ') || lowerSearch.includes('trilateral') ||
        lowerSearch.includes('কার্যপত্র') || lowerSearch.includes('কাযপত্র') || lowerSearch.includes('working') ||
        lowerSearch.includes('কার্যবিবরণী') || lowerSearch.includes('কাযবিবরণী') || lowerSearch.includes('minutes') ||
        lowerSearch.includes('মিলিকরণ') || lowerSearch.includes('মিলকরণ') || lowerSearch.includes('reconciliation') ||
        lowerSearch.includes('অবগতি') || lowerSearch.includes('প্রত্যয়ন');

      // 2. Branch/ParaType Filter
      // If the user searches for a specific letter-type keyword, we bypass the branch filter 
      // so they can find the letters across SFI/Non-SFI branches easily.
      if (filterBranch !== 'সকল' && !isLetterTypeKeyword) {
        if (filterBranch === 'এসএফআই' && !isSFI(entry.paraType)) return false;
        if (filterBranch === 'নন এসএফআই' && !isNonSFI(entry.paraType)) return false;
      }

      // 3. Search Term Filter
      if (searchTerm.trim() !== '') {
        const query = normalizeForSearch(searchTerm);
        
        const desc = normalizeForSearch(entry.description || '');
        const letterNo = normalizeForSearch(entry.letterNo || '');
        const diaryNo = normalizeForSearch(entry.diaryNo || '');
        const letterType = normalizeForSearch(entry.letterType || '');
        const receiver = normalizeForSearch(entry.receiverName || '');
        const paraType = normalizeForSearch(entry.paraType || '');

        const matches = desc.includes(query) || 
                        letterNo.includes(query) || 
                        diaryNo.includes(query) || 
                        letterType.includes(query) ||
                        receiver.includes(query) ||
                        paraType.includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [entries, startDate, endDate, filterBranch, searchTerm]);

  // Calculate statistics for BSR, Bilateral meetings, and Working papers
  const stats = useMemo(() => {
    let bsrCount = 0;
    let bilateralCount = 0;
    let workingPaperCount = 0;

    filteredEntries.forEach(entry => {
      const type = entry.letterType || '';
      
      // BSR count (বিএসআর)
      if (type === 'বিএসআর' || type.includes('বিএসআর')) {
        bsrCount++;
      }
      
      // Bilateral count (দ্বিপক্ষীয় সভা)
      if (type.includes('দ্বিপক্ষীয়')) {
        bilateralCount++;
      }

      // Working papers count (কার্যপত্র)
      if (type.includes('কার্যপত্র')) {
        workingPaperCount++;
      }
    });

    return {
      bsr: bsrCount,
      bilateral: bilateralCount,
      workingPaper: workingPaperCount,
      total: filteredEntries.length
    };
  }, [filteredEntries]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download as Excel (.xls) file
  const downloadExcel = () => {
    const table = document.getElementById('custom-period-report-table');
    if (!table) return;

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    interactiveElements.forEach(el => el.remove());

    const filename = `চাহিদা_মোতাবেক_প্রাপ্তি_রিপোর্ট_${startDate}_হতে_${endDate}.xls`;

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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 10px 14px !important; text-align: left; font-size: 12px; }
          th { background-color: #1e3a8a !important; color: #ffffff !important; font-weight: bold !important; text-align: center; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .text-center { text-align: center !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 5px; color: #1e3a8a;">চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট</h2>
        <p style="text-align: center; margin-top: 0; font-size: 14px; color: #475569;">
          সময়কাল: ${formatDateBN(startDate)} হতে ${formatDateBN(endDate)}
        </p>
        <table style="width: 50%; margin: 10px auto; border: 1px solid #cbd5e1;">
          <tr style="background-color: #e2e8f0;">
            <th style="padding: 6px; text-align: left; color: #000; background: #e2e8f0 !important; border: 1px solid #cbd5e1;">পত্রের প্রকারভেদ</th>
            <th style="padding: 6px; text-align: center; color: #000; background: #e2e8f0 !important; border: 1px solid #cbd5e1;">মোট সংখ্যা</th>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">মোট বিএসআর (BSR)</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">${toBengaliDigits(stats.bsr)} টি</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">মোট দ্বিপক্ষীয় সভা</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">${toBengaliDigits(stats.bilateral)} টি</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">মোট কার্যপত্র</td>
            <td style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">${toBengaliDigits(stats.workingPaper)} টি</td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td style="padding: 6px; border: 1px solid #cbd5e1;">সর্বমোট প্রাপ্ত পত্র</td>
            <td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">${toBengaliDigits(stats.total)} টি</td>
          </tr>
        </table>
        ${clonedTable.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 relative">
      <IDBadge id="custom-period-receipt-report-panel" />

      {/* TOP HEADER / BACK BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <button 
            onClick={onBack}
            className="group px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
            পেছনে ফিরুন
          </button>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-amber-500 shrink-0" />
            চাহিদা মোতাবেক প্রাপ্তি রিপোর্ট
          </h2>
          <p className="text-slate-500 font-bold text-xs">
            যেকোনো নির্দিষ্ট সময়কালের জন্য বিএসআর, দ্বিপক্ষীয় সভা এবং কার্যপত্রের তাৎক্ষণিক রিপোর্ট
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={downloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11.5px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet size={15} />
            এক্সেল ডাউনলোড
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11.5px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BOX */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 shadow-xl no-print space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar size={18} className="text-blue-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">রিপোর্ট ফিল্টারিং ও সময়কাল নির্বাচন</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              শুরুর তারিখ
            </label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 px-3 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              শেষের তারিখ
            </label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-11 px-3 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs"
            />
          </div>

          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              শাখা নির্বাচন
            </label>
            <select 
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full h-11 px-3 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs cursor-pointer"
            >
              <option value="সকল">সকল শাখা</option>
              <option value="এসএফআই">এসএফআই (SFI)</option>
              <option value="নন এসএফআই">নন এসএফআই (Non-SFI)</option>
            </select>
          </div>

          {/* Search Term */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
              অনুসন্ধান (কীওয়ার্ড)
            </label>
            <div className="relative">
              <input 
                type="text"
                placeholder="পত্র নং, বিষয় বা প্রেরক দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-9 pr-3 border-2 border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xs"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* STATISTICS CARDS (Bento Grid Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* BSR Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-md">BSR</span>
            <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[11px] font-bold text-emerald-600">মোট বিএসআর সংখ্যা</p>
            <p className="text-3xl md:text-4xl font-black text-slate-900">
              {toBengaliDigits(stats.bsr)} <span className="text-sm font-black text-slate-500">টি</span>
            </p>
          </div>
        </div>

        {/* Bilateral Meetings Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest bg-blue-100 px-2 py-1 rounded-md">Bilateral</span>
            <div className="w-9 h-9 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <User size={18} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[11px] font-bold text-blue-600">মোট দ্বিপক্ষীয় সভা</p>
            <p className="text-3xl md:text-4xl font-black text-slate-900">
              {toBengaliDigits(stats.bilateral)} <span className="text-sm font-black text-slate-500">টি</span>
            </p>
          </div>
        </div>

        {/* Working Papers Card */}
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-violet-800 uppercase tracking-widest bg-violet-100 px-2 py-1 rounded-md">Working Paper</span>
            <div className="w-9 h-9 bg-violet-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <FileEdit size={18} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[11px] font-bold text-violet-600">মোট কার্যপত্র</p>
            <p className="text-3xl md:text-4xl font-black text-slate-900">
              {toBengaliDigits(stats.workingPaper)} <span className="text-sm font-black text-slate-500">টি</span>
            </p>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-950 rounded-3xl p-5 md:p-6 shadow-xl text-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md">Total</span>
            <div className="w-9 h-9 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <Mail size={18} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-400">সর্বমোট প্রাপ্ত পত্র</p>
            <p className="text-3xl md:text-4xl font-black text-white">
              {toBengaliDigits(stats.total)} <span className="text-sm font-black text-slate-400">টি</span>
            </p>
          </div>
        </div>
      </div>

      {/* PRINT BANNER / REPORT CARD (Visible both on screen and print) */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden">
        {/* Print Header */}
        <div className="hidden print:block text-center space-y-2 p-6 border-b border-slate-300">
          <h1 className="text-2xl font-black text-slate-900 uppercase">হিসাব মহানিয়ন্ত্রক এর কার্যালয়</h1>
          <p className="text-xs font-bold text-slate-600">প্রাপ্ত চিঠিপত্র ও সভার সারসংক্ষেপ রিপোর্ট</p>
          <div className="text-[11px] font-bold text-slate-700 bg-slate-100 py-1.5 px-4 rounded-lg inline-block">
            সময়কাল: {formatDateBN(startDate)} হতে {formatDateBN(endDate)}
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 no-print">
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} className="text-blue-600" />
              <h3 className="font-black text-slate-800 text-sm uppercase">প্রাপ্ত তথ্যের তালিকা ({toBengaliDigits(filteredEntries.length)} টি)</h3>
            </div>
            
            <div className="text-[11px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
              সময়কাল: {formatDateBN(startDate)} হতে {formatDateBN(endDate)}
            </div>
          </div>

          {/* TABLE */}
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-inner">
              <table id="custom-period-report-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="px-4 py-3 text-center text-xs font-black w-[60px] border-r border-slate-200">ক্র: নং</th>
                    <th className="px-4 py-3 text-center text-xs font-black w-[100px] border-r border-slate-200">প্রাপ্তির তারিখ</th>
                    <th className="px-4 py-3 text-left text-xs font-black w-[150px] border-r border-slate-200">ডায়রি নং ও তারিখ</th>
                    <th className="px-4 py-3 text-left text-xs font-black w-[120px] border-r border-slate-200">শাখা ও পত্রের ধরন</th>
                    <th className="px-4 py-3 text-left text-xs font-black border-r border-slate-200">বিষয় / বিবরণ</th>
                    <th className="px-4 py-3 text-center text-xs font-black w-[100px] border-r border-slate-200">অনুচ্ছেদ সংখ্যা</th>
                    <th className="px-4 py-3 text-right text-xs font-black w-[130px]">জড়িত টাকা (টাকা)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry, index) => {
                    return (
                      <tr key={entry.id || index} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-3 text-center text-[11px] font-black text-slate-800 border-r border-slate-200">
                          {toBengaliDigits(index + 1)}
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] font-bold text-slate-600 border-r border-slate-200">
                          {formatDateBN(entry.diaryDate || entry.letterDate)}
                        </td>
                        <td className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 border-r border-slate-200">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900">ডায়রি: {toBengaliDigits(entry.diaryNo)}</span>
                            <span className="text-[10px] text-slate-500">তারিখ: {formatDateBN(entry.diaryDate)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left text-[11px] font-bold text-slate-700 border-r border-slate-200">
                          <div className="space-y-1">
                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600">
                              {entry.paraType}
                            </span>
                            <span className="block font-black text-slate-900 text-[10.5px]">
                              {entry.letterType}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left text-[11px] font-semibold text-slate-800 leading-relaxed border-r border-slate-200">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] font-black text-slate-700 border-r border-slate-200">
                          {toBengaliDigits(entry.totalParas || '০')} টি
                        </td>
                        <td className="px-4 py-3 text-right text-[11.5px] font-black text-slate-900">
                          {toBengaliDigits(entry.totalAmount || '০')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Info className="mx-auto text-slate-400" size={32} />
              <p className="text-slate-500 font-bold text-sm">নির্বাচিত সময়কাল এবং ফিল্টার অনুযায়ী কোনো চিঠি পাওয়া যায়নি।</p>
              <p className="text-[11px] text-slate-400">অনুগ্রহ করে সময়কাল বা ফিল্টার অপশন পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
