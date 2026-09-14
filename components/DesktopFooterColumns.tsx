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
    <div className="w-full grid grid-cols-1 min-[900px]:grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3.5">
      
      {/* ১ম কলাম (সর্ববামে): পূর্ববর্তী মাস পর্যন্ত - সবুজ গ্লো সিঙ্ক */}
      <div 
        id="desktop-footer-col-1"
        className="desktop-sync-col desktop-sync-col-1 flex flex-col items-stretch space-y-1 sm:space-y-1.5 text-left min-w-0 p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-transparent"
      >
        {/* ১ম লাইন: মোট অমীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11.5px] sm:text-xs xl:text-[13px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label whitespace-nowrap transition-colors">মোট অমীমাংসিত অনুচ্ছেদ:</span>
          </div>
          <span className="sync-pill font-black px-2 py-0.5 rounded border text-[11px] sm:text-xs xl:text-[13px] shrink-0 text-center whitespace-nowrap min-w-[65px] transition-all">
            {toBengaliDigits(openingCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: মোট অমীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[11.5px] xl:text-[12.5px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label whitespace-nowrap transition-colors">মোট টাকার পরিমাণ:</span>
          </div>
          <span className="sync-pill font-black px-1.5 sm:px-2 py-0.5 rounded border text-[10.5px] sm:text-[11px] xl:text-[12px] shrink-0 text-center whitespace-nowrap min-w-[70px] transition-all">
            {formatBengaliAmount(openingAmount)} টাকা
          </span>
        </div>
      </div>

      {/* ২য় কলাম (মাঝখানে): চলতি মাসে মীমাংসিত - নীল গ্লো সিঙ্ক */}
      <div 
        id="desktop-footer-col-2"
        className="desktop-sync-col desktop-sync-col-2 flex flex-col items-stretch space-y-1 sm:space-y-1.5 text-left min-w-0 min-[900px]:border-l min-[900px]:border-slate-200/80 min-[900px]:pl-2.5 lg:pl-3.5 xl:pl-4 p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-transparent"
      >
        {/* ১ম লাইন: চলতি মাসে মীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11.5px] sm:text-xs xl:text-[13px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label whitespace-nowrap transition-colors">চলতি মাসে মীমাংসিত:</span>
          </div>
          <span className="sync-pill font-black px-2 py-0.5 rounded border text-[11px] sm:text-xs xl:text-[13px] shrink-0 text-center whitespace-nowrap min-w-[65px] transition-all">
            {toBengaliDigits(currentMonthSettledCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: চলতি মাসে মীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[11.5px] xl:text-[12.5px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label whitespace-nowrap transition-colors">মীমাংসিত টাকার পরিমাণ:</span>
          </div>
          <span className="sync-pill font-black px-1.5 sm:px-2 py-0.5 rounded border text-[10.5px] sm:text-[11px] xl:text-[12px] shrink-0 text-center whitespace-nowrap min-w-[70px] transition-all">
            {formatBengaliAmount(currentMonthSettledAmount)} টাকা
          </span>
        </div>
      </div>

      {/* ৩য় কলাম (ডানদিকে): সর্বমোট অমীমাংসিত - লাল গ্লো সিঙ্ক */}
      <div 
        id="desktop-footer-col-3"
        className="desktop-sync-col desktop-sync-col-3 flex flex-col items-stretch space-y-1 sm:space-y-1.5 text-left min-w-0 min-[900px]:border-l min-[900px]:border-slate-200/80 min-[900px]:pl-2.5 lg:pl-3.5 xl:pl-4 p-1.5 sm:p-2 md:p-2.5 rounded-xl transition-all duration-300 border border-transparent"
      >
        {/* ১ম লাইন: সর্বমোট অমীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11.5px] sm:text-xs xl:text-[13px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label whitespace-nowrap transition-colors">সর্বমোট অমীমাংসিত:</span>
          </div>
          <span className="sync-pill font-black px-2 py-0.5 rounded border text-[11px] sm:text-xs xl:text-[13px] shrink-0 text-center whitespace-nowrap min-w-[65px] transition-all">
            {toBengaliDigits(totalUnsettledCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: সর্বমোট অমীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[11.5px] xl:text-[12.5px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="sync-dot w-1.5 h-1.5 rounded-full shrink-0 transition-colors" />
            <span className="sync-label whitespace-nowrap transition-colors">সর্বমোট টাকার পরিমাণ:</span>
          </div>
          <span className="sync-pill font-black px-1.5 sm:px-2 py-0.5 rounded border text-[10.5px] sm:text-[11px] xl:text-[12px] shrink-0 text-center whitespace-nowrap min-w-[70px] transition-all">
            {formatBengaliAmount(totalUnsettledAmount)} টাকা
          </span>
        </div>
      </div>

    </div>
  );
};

export default DesktopFooterColumns;
