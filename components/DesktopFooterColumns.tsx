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
 * - ১ম কলাম (সর্ববামে): সবুজ প্রাতিষ্ঠানিক থিম (দৃশ্যমান ব্যাকগ্রাউন্ড ও কার্সরে সমৃদ্ধ গ্লো)
 * - ২য় কলাম (মাঝখানে): নীল প্রাতিষ্ঠানিক থিম (দৃশ্যমান ব্যাকগ্রাউন্ড ও কার্সরে সমৃদ্ধ গ্লো)
 * - ৩য় কলাম (সর্বডানে): লাল প্রাতিষ্ঠানিক থিম (দৃশ্যমান ব্যাকগ্রাউন্ড ও কার্সরে সমৃদ্ধ গ্লো)
 * - হাই কনট্রাস্ট: ক্রিস্প হোয়াইট ব্যাজ পিল ও ডিপ টেক্সট কালার
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
      
      {/* ১ম কলাম (সর্ববামে): পূর্ববর্তী মাস পর্যন্ত (সবুজ) */}
      <div 
        id="desktop-footer-col-1"
        className="flex flex-col items-stretch space-y-1 sm:space-y-1.5 text-left min-w-0 p-2 sm:p-2.5 md:p-3 rounded-xl transition-all duration-300 bg-emerald-500/[0.08] border border-emerald-300/70 shadow-xs hover:bg-emerald-500/[0.16] hover:border-emerald-500 hover:shadow-[0_0_24px_5px_rgba(5,150,105,0.28)] hover:-translate-y-0.5 cursor-pointer"
      >
        {/* ১ম লাইন: মোট অমীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11.5px] sm:text-xs xl:text-[13px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#059669]" />
            <span className="whitespace-nowrap text-[#064e3b]">
              মোট অমীমাংসিত অনুচ্ছেদ:
            </span>
          </div>
          <span className="font-black px-2 py-0.5 rounded border text-[11px] sm:text-xs xl:text-[13px] shrink-0 text-center whitespace-nowrap min-w-[65px] bg-white text-[#064e3b] border-emerald-300/80 shadow-xs">
            {toBengaliDigits(openingCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: মোট অমীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[11.5px] xl:text-[12.5px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#059669]" />
            <span className="whitespace-nowrap text-[#064e3b]">
              মোট টাকার পরিমাণ:
            </span>
          </div>
          <span className="font-black px-1.5 sm:px-2 py-0.5 rounded border text-[10.5px] sm:text-[11px] xl:text-[12px] shrink-0 text-center whitespace-nowrap min-w-[70px] bg-white text-[#064e3b] border-emerald-300/80 shadow-xs">
            {formatBengaliAmount(openingAmount)} টাকা
          </span>
        </div>
      </div>

      {/* ২য় কলাম (মাঝখানে): চলতি মাসে মীমাংসিত (নীল) */}
      <div 
        id="desktop-footer-col-2"
        className="flex flex-col items-stretch space-y-1 sm:space-y-1.5 text-left min-w-0 p-2 sm:p-2.5 md:p-3 rounded-xl transition-all duration-300 bg-blue-500/[0.08] border border-blue-300/70 shadow-xs hover:bg-blue-500/[0.16] hover:border-blue-500 hover:shadow-[0_0_24px_5px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 cursor-pointer"
      >
        {/* ১ম লাইন: চলতি মাসে মীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11.5px] sm:text-xs xl:text-[13px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#2563eb]" />
            <span className="whitespace-nowrap text-[#1e3a8a]">
              চলতি মাসে মীমাংসিত:
            </span>
          </div>
          <span className="font-black px-2 py-0.5 rounded border text-[11px] sm:text-xs xl:text-[13px] shrink-0 text-center whitespace-nowrap min-w-[65px] bg-white text-[#1e3a8a] border-blue-300/80 shadow-xs">
            {toBengaliDigits(currentMonthSettledCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: চলতি মাসে মীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[11.5px] xl:text-[12.5px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#2563eb]" />
            <span className="whitespace-nowrap text-[#1e3a8a]">
              মীমাংসিত টাকার পরিমাণ:
            </span>
          </div>
          <span className="font-black px-1.5 sm:px-2 py-0.5 rounded border text-[10.5px] sm:text-[11px] xl:text-[12px] shrink-0 text-center whitespace-nowrap min-w-[70px] bg-white text-[#1e3a8a] border-blue-300/80 shadow-xs">
            {formatBengaliAmount(currentMonthSettledAmount)} টাকা
          </span>
        </div>
      </div>

      {/* ৩য় কলাম (ডানদিকে): সর্বমোট অমীমাংসিত (লাল) */}
      <div 
        id="desktop-footer-col-3"
        className="flex flex-col items-stretch space-y-1 sm:space-y-1.5 text-left min-w-0 p-2 sm:p-2.5 md:p-3 rounded-xl transition-all duration-300 bg-red-500/[0.08] border border-red-300/70 shadow-xs hover:bg-red-500/[0.16] hover:border-red-500 hover:shadow-[0_0_24px_5px_rgba(220,38,38,0.28)] hover:-translate-y-0.5 cursor-pointer"
      >
        {/* ১ম লাইন: সর্বমোট অমীমাংসিত অনুচ্ছেদ সংখ্যা: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11.5px] sm:text-xs xl:text-[13px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#dc2626]" />
            <span className="whitespace-nowrap text-[#7f1d1d]">
              সর্বমোট অমীমাংসিত:
            </span>
          </div>
          <span className="font-black px-2 py-0.5 rounded border text-[11px] sm:text-xs xl:text-[13px] shrink-0 text-center whitespace-nowrap min-w-[65px] bg-white text-[#7f1d1d] border-red-300/80 shadow-xs">
            {toBengaliDigits(totalUnsettledCount.toString())} টি
          </span>
        </div>

        {/* ২য় লাইন: সর্বমোট অমীমাংসিত টাকার পরিমাণ: */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-[11.5px] xl:text-[12.5px] font-bold w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#dc2626]" />
            <span className="whitespace-nowrap text-[#7f1d1d]">
              সর্বমোট টাকার পরিমাণ:
            </span>
          </div>
          <span className="font-black px-1.5 sm:px-2 py-0.5 rounded border text-[10.5px] sm:text-[11px] xl:text-[12px] shrink-0 text-center whitespace-nowrap min-w-[70px] bg-white text-[#7f1d1d] border-red-300/80 shadow-xs">
            {formatBengaliAmount(totalUnsettledAmount)} টাকা
          </span>
        </div>
      </div>

    </div>
  );
};

export default DesktopFooterColumns;
