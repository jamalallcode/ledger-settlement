import React from 'react';
import { toBengaliDigits, formatBengaliAmount } from '../utils/numberUtils.ts';

interface DesktopFooterColumnsProps {
  openingCount: number;
  openingAmount: number;
  currentMonthSettledCount: number;
  currentMonthSettledAmount: number;
  totalUnsettledCount: number;
  totalUnsettledAmount: number;
}

/**
 * DesktopFooterColumns
 * 
 * প্রাতিষ্ঠানিক ল্যান্ডিং পেজের ডেক্সটপ ফুটার ৩-কলাম ডাটা সারি:
 * - চলমান অ্যানিমেটেড ব্যানারের অবস্থানের সাথে সম্পূর্ণ সিনক্রোনাইজড
 * - ১ম কলাম (সর্ববামে): সবুজ কালার ও সফট গ্রিন পিক গ্লো (#047857)
 * - ২য় কলাম (মাঝখানে): নীল কালার ও সফট ব্লু পিক গ্লো (#1d4ed8)
 * - ৩য় কলাম (সর্বডানে): লাল কালার ও সফট রেড পিক গ্লো (#b91c1c)
 * - হাই কনট্রাস্ট: ব্যাকগ্রাউন্ডে সফট ট্রান্সলুসেন্ট টিন্ট এবং টেক্সটে ডিপ ক্রিস্প রঙ, যাতে রিড্যাবিলিটি শতভাগ নিশ্চিত থাকে।
 */
export const DesktopFooterColumns: React.FC<DesktopFooterColumnsProps> = ({
  openingCount,
  openingAmount,
  currentMonthSettledCount,
  currentMonthSettledAmount,
  totalUnsettledCount,
  totalUnsettledAmount,
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 lg:gap-4">
      
      {/* ১ম কলাম (সর্ববামে): পূর্ববর্তী মাস পর্যন্ত - সবুজ গ্লো সিঙ্ক */}
      <div 
        id="desktop-footer-col-1"
        className="desktop-sync-col desktop-sync-col-1 flex flex-col items-stretch space-y-1.5 text-left min-w-0 p-2 sm:p-2.5 rounded-xl transition-all duration-300 border border-transparent"
      >
        {/* ১ম লাইন: মোট অমীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label truncate transition-colors">মোট অমীমাংসিত অনুচ্ছেদ সংখ্যা:</span>
          </div>
          <span className="sync-pill font-black px-2.5 py-0.5 rounded border text-xs sm:text-[13px] shrink-0 text-center min-w-[76px] transition-all">
            {toBengaliDigits(openingCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: মোট অমীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label truncate transition-colors">মোট অমীমাংসিত টাকার পরিমাণ:</span>
          </div>
          <span className="sync-pill font-black px-2 py-0.5 rounded border text-xs sm:text-[13px] shrink-0 text-center min-w-[76px] transition-all">
            {formatBengaliAmount(openingAmount)} টাকা
          </span>
        </div>
      </div>

      {/* ২য় কলাম (মাঝখানে): চলতি মাসে মীমাংসিত - নীল গ্লো সিঙ্ক */}
      <div 
        id="desktop-footer-col-2"
        className="desktop-sync-col desktop-sync-col-2 flex flex-col items-stretch space-y-1.5 text-left min-w-0 md:border-l md:border-slate-200/80 md:pl-3.5 lg:pl-4 p-2 sm:p-2.5 rounded-xl transition-all duration-300 border border-transparent"
      >
        {/* ১ম লাইন: চলতি মাসে মীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label truncate transition-colors">চলতি মাসে মীমাংসিত অনুচ্ছেদ সংখ্যা:</span>
          </div>
          <span className="sync-pill font-black px-2.5 py-0.5 rounded border text-xs sm:text-[13px] shrink-0 text-center min-w-[76px] transition-all">
            {toBengaliDigits(currentMonthSettledCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: চলতি মাসে মীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label truncate transition-colors">চলতি মাসে মীমাংসিত টাকার পরিমাণ:</span>
          </div>
          <span className="sync-pill font-black px-2 py-0.5 rounded border text-xs sm:text-[13px] shrink-0 text-center min-w-[76px] transition-all">
            {formatBengaliAmount(currentMonthSettledAmount)} টাকা
          </span>
        </div>
      </div>

      {/* ৩য় কলাম (ডানদিকে): সর্বমোট অমীমাংসিত - লাল গ্লো সিঙ্ক */}
      <div 
        id="desktop-footer-col-3"
        className="desktop-sync-col desktop-sync-col-3 flex flex-col items-stretch space-y-1.5 text-left min-w-0 md:border-l md:border-slate-200/80 md:pl-3.5 lg:pl-4 p-2 sm:p-2.5 rounded-xl transition-all duration-300 border border-transparent"
      >
        {/* ১ম লাইন: সর্বমোট অমীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label truncate transition-colors">সর্বমোট অমীমাংসিত অনুচ্ছেদ সংখ্যা:</span>
          </div>
          <span className="sync-pill font-black px-2.5 py-0.5 rounded border text-xs sm:text-[13px] shrink-0 text-center min-w-[76px] transition-all">
            {toBengaliDigits(totalUnsettledCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: সর্বমোট অমীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label truncate transition-colors">সর্বমোট অমীমাংসিত টাকার পরিমাণ:</span>
          </div>
          <span className="sync-pill font-black px-2 py-0.5 rounded border text-xs sm:text-[13px] shrink-0 text-center min-w-[76px] transition-all">
            {formatBengaliAmount(totalUnsettledAmount)} টাকা
          </span>
        </div>
      </div>

    </div>
  );
};

export default DesktopFooterColumns;
