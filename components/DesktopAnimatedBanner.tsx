import React, { useMemo, useRef, useState, useEffect } from 'react';

interface DesktopAnimatedBannerProps {
  prevCycleLabel: string;
  currentCycleLabel?: string;
  activeStage?: 1 | 2 | 3;
  onHoverChange?: (hovered: boolean) => void;
}

/**
 * DesktopAnimatedBanner
 * 
 * প্রাতিষ্ঠানিক ল্যান্ডিং পেজের ডেক্সটপ ফুটার হেডার ব্যানার:
 * ১. সর্ববামে অবস্থানকালে (Stage 1): সবুজ কালার (#047857), টেক্সট: পূর্ববর্তী মাস (তারিখ খ্রিঃ) পর্যন্ত
 * ২. মাঝখানে এসে থামলে (Stage 2): নীল কালার (#1d4ed8), টেক্সট: চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত
 * ৩. সর্বডানে গিয়ে থামলে (Stage 3): লাল কালার (#b91c1c), টেক্সট: চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত
 * 
 * - সম্পূর্ণ হার্ডওয়্যার অ্যাক্সিলারেটেড মসৃণ স্লাইড (100% Butter-smooth, zero jitter)
 * - Y-অক্ষে কোনো সাবপিক্সেল ফ্র্যাকশন নেই, যাতে ফন্ট কখনো কাঁপাকাঁপি বা ঝাপসা না হয়
 * - নিচের ৩টি কলামের সাথে ১০০% সিনক্রোনাইজড
 */
export const DesktopAnimatedBanner: React.FC<DesktopAnimatedBannerProps> = ({
  prevCycleLabel,
  currentCycleLabel,
  activeStage = 1,
  onHoverChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // পূর্ববর্তী ও চলতি সাইকেলের তারিখ থেকে অতিরিক্ত ডুপ্লিকেট শব্দ পরিচ্ছন্ন রাখা
  const cleanPrev = useMemo(() => {
    return (prevCycleLabel || '').replace(/খ্রিঃ/g, '').trim();
  }, [prevCycleLabel]);

  const cleanCurr = useMemo(() => {
    return (currentCycleLabel || 'চলমান কোয়ার্টার').replace(/খ্রিঃ/g, '').trim();
  }, [currentCycleLabel]);

  // কনটেইনার ও ট্র্যাকের সাইজ পরিমাপ যাতে নিখুঁত পূর্ণসংখ্যা পিক্সেলে ট্রানজিশন হয়
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // স্টেজ অনুযায়ী X অক্ষের নিখুঁত পূর্ণসংখ্যা (Integer) পিক্সেল অফসেট
  const currentX = useMemo(() => {
    if (!containerWidth || !trackWidth) return 0;
    if (activeStage === 1) {
      return 0; // সর্ববামে
    }
    if (activeStage === 2) {
      return Math.round((containerWidth - trackWidth) / 2); // ঠিক মাঝখানে
    }
    if (activeStage === 3) {
      return Math.max(0, Math.round(containerWidth - trackWidth)); // সর্বডানে
    }
    return 0;
  }, [activeStage, containerWidth, trackWidth]);

  // কালার থিম
  const stageTheme = useMemo(() => {
    if (activeStage === 1) {
      return {
        text: 'text-[#047857]',
        dot: 'bg-[#059669] shadow-[0_0_0_3px_rgba(5,150,105,0.25)]',
      };
    }
    if (activeStage === 2) {
      return {
        text: 'text-[#1d4ed8]',
        dot: 'bg-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.25)]',
      };
    }
    return {
      text: 'text-[#b91c1c]',
      dot: 'bg-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.25)]',
    };
  }, [activeStage]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-8 overflow-hidden flex items-center select-none cursor-pointer"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div 
        ref={trackRef}
        style={{
          transform: `translate3d(${currentX}px, 0px, 0px)`,
          transition: 'transform 4.4s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
        className={`inline-flex items-center gap-2 font-bold text-[13px] sm:text-[14px] lg:text-[15px] transition-colors duration-700 ${stageTheme.text}`}
      >
        {/* অ্যানিমেটেড কালার ইন্ডিকেটর ডট (সবুজ -> নীল -> লাল) */}
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-700 ${stageTheme.dot}`} />

        {/* টেক্সট ডিসপ্লে কনটেইনার: কোনো লাফানো বা ব্লার ছাড়া ক্রিস্প টেক্সট */}
        <div className="relative inline-flex items-center">
          <span 
            className={`transition-opacity duration-700 whitespace-nowrap ${
              activeStage === 1 ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
            }`}
          >
            পূর্ববর্তী মাস ({cleanPrev} খ্রিঃ) পর্যন্ত
          </span>
          <span 
            className={`transition-opacity duration-700 whitespace-nowrap ${
              activeStage !== 1 ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
            }`}
          >
            চলতি মাস ({cleanCurr} খ্রিঃ) পর্যন্ত
          </span>
        </div>
      </div>
    </div>
  );
};

export default DesktopAnimatedBanner;
