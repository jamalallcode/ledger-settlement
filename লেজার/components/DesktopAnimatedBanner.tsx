import React, { useMemo } from 'react';

interface DesktopAnimatedBannerProps {
  prevCycleLabel: string;
  currentCycleLabel?: string;
}

/**
 * DesktopAnimatedBanner
 * 
 * প্রাতিষ্ঠানিক ল্যান্ডিং পেজের ডেক্সটপ ফুটার কলামসমূহের ফিক্সড শিরোনাম:
 * ১. ১ম কলাম (সর্ববামে): সবুজ কালার (#047857), টেক্সট: পূর্ববর্তী মাস (তারিখ খ্রিঃ) পর্যন্ত
 * ২. ২য় কলাম (মাঝখানে): নীল কালার (#1d4ed8), টেক্সট: চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত
 * ৩. ৩য় কলাম (সর্বডানে): লাল কালার (#b91c1c), টেক্সট: চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত
 * 
 * - সম্পূর্ণ স্ট্যাটিক ও ফিক্সড (কোনো অ্যানিমেশন নেই)
 * - নিচের ৩টি কলামের সাথে ১০০% সমান্তরাল ও নিখুঁত গ্রিড অ্যালাইনমেন্ট
 */
export const DesktopAnimatedBanner: React.FC<DesktopAnimatedBannerProps> = ({
  prevCycleLabel,
  currentCycleLabel,
}) => {
  // পূর্ববর্তী ও চলতি সাইকেলের তারিখ থেকে অতিরিক্ত ডুপ্লিকেট শব্দ পরিচ্ছন্ন রাখা
  const cleanPrev = useMemo(() => {
    return (prevCycleLabel || '').replace(/খ্রিঃ/g, '').trim();
  }, [prevCycleLabel]);

  const cleanCurr = useMemo(() => {
    return (currentCycleLabel || 'চলমান কোয়ার্টার').replace(/খ্রিঃ/g, '').trim();
  }, [currentCycleLabel]);

  return (
    <div className="w-full grid grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3.5 select-none font-bold text-[10.5px] min-[900px]:text-[12px] lg:text-[13px] xl:text-[14px]">
      {/* ১ম কলাম শিরোনাম (সর্ববামে - সবুজ) */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[#047857] min-w-0 px-1 sm:px-2 py-0.5">
        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#059669] shadow-[0_0_0_2px_rgba(5,150,105,0.25)] shrink-0" />
        <span className="truncate whitespace-nowrap">
          পূর্ববর্তী মাস ({cleanPrev} খ্রিঃ) পর্যন্ত
        </span>
      </div>

      {/* ২য় কলাম শিরোনাম (মাঝখানে - নীল) */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[#1d4ed8] min-w-0 px-1 sm:px-2 py-0.5">
        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#2563eb] shadow-[0_0_0_2px_rgba(37,99,235,0.25)] shrink-0" />
        <span className="truncate whitespace-nowrap">
          চলতি মাস ({cleanCurr} খ্রিঃ) পর্যন্ত
        </span>
      </div>

      {/* ৩য় কলাম শিরোনাম (সর্বডানে - লাল) */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[#b91c1c] min-w-0 px-1 sm:px-2 py-0.5">
        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#dc2626] shadow-[0_0_0_2px_rgba(220,38,38,0.25)] shrink-0" />
        <span className="truncate whitespace-nowrap">
          চলতি মাস ({cleanCurr} খ্রিঃ) পর্যন্ত
        </span>
      </div>
    </div>
  );
};

export default DesktopAnimatedBanner;
