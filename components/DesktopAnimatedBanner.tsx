import React, { useMemo } from 'react';

interface DesktopAnimatedBannerProps {
  prevCycleLabel: string;
  currentCycleLabel?: string;
}

/**
 * DesktopAnimatedBanner
 * 
 * প্রাতিষ্ঠানিক ল্যান্ডিং পেজের ডেক্সটপ ফুটার হেডার ব্যানার:
 * ১. সর্ববামে অবস্থানকালে: সবুজ কালার (#047857), টেক্সট: পূর্ববর্তী মাস (তারিখ খ্রিঃ) পর্যন্ত
 * ২. মাঝখানে এসে থামলে: নীল কালার (#1d4ed8), টেক্সট: চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত
 * ৩. সর্বডানে গিয়ে থামলে: লাল কালার (#b91c1c), টেক্সট: চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত
 */
export const DesktopAnimatedBanner: React.FC<DesktopAnimatedBannerProps> = ({
  prevCycleLabel,
  currentCycleLabel
}) => {
  // পূর্ববর্তী ও চলতি সাইকেলের তারিখ থেকে অতিরিক্ত ডুপ্লিকেট শব্দ পরিচ্ছন্ন রাখা
  const cleanPrev = useMemo(() => {
    return (prevCycleLabel || '').replace(/খ্রিঃ/g, '').trim();
  }, [prevCycleLabel]);

  const cleanCurr = useMemo(() => {
    return (currentCycleLabel || 'চলমান কোয়ার্টার').replace(/খ্রিঃ/g, '').trim();
  }, [currentCycleLabel]);

  return (
    <div 
      className="desktop-banner-track select-none font-bold tracking-tight text-[13px] sm:text-[14px] lg:text-[15px] font-['Noto_Sans_Bengali',_'Hind_Siliguri',_sans-serif]"
    >
      {/* অ্যানিমেটেড কালার ইন্ডিকেটর ডট (সবুজ -> নীল -> লাল) */}
      <span className="desktop-banner-dot shrink-0" />

      {/* টেক্সট ডিসপ্লে কনটেইনার: গ্রিড এরিয়া ব্যবহার করে কোনো লাফানো ছাড়া স্মুথ পরিবর্তন */}
      <span className="desktop-banner-text-box">
        {/* পর্যায় ১: সর্ববামে - পূর্ববর্তী মাস */}
        <span className="desktop-banner-text-prev">
          পূর্ববর্তী মাস ({cleanPrev} খ্রিঃ) পর্যন্ত
        </span>

        {/* পর্যায় ২ ও ৩: মাঝখানে ও সর্বডানে - চলতি মাস */}
        <span className="desktop-banner-text-curr">
          চলতি মাস ({cleanCurr} খ্রিঃ) পর্যন্ত
        </span>
      </span>
    </div>
  );
};

export default DesktopAnimatedBanner;
