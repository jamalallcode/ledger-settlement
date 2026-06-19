import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface BackToTopProps {
  scrollRef: React.RefObject<HTMLElement | null>;
}

const BackToTop: React.FC<BackToTopProps> = ({ scrollRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Show button if scrolled more than 300px
      if (container.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial scroll value
    handleScroll();

    // Periodically re-check (great for component tab shifts/content updates)
    const interval = setInterval(handleScroll, 300);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [scrollRef]);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div 
      className={`fixed bottom-8 right-8 z-[99999] transition-all duration-500 no-print flex items-center gap-2 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
      }`}
    >
      <div className="relative group flex items-center gap-2">
        {/* Hover Label */}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none absolute right-14 bg-slate-900/95 text-white text-[12px] font-black tracking-wider px-3.5 py-2 rounded-xl border border-white/10 shadow-2xl whitespace-nowrap leading-none select-none">
          উপরে যান
        </span>

        {/* Premium Floating Button */}
        <button
          onClick={scrollToTop}
          type="button"
          aria-label="Scroll to top"
          className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-slate-950 to-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-blue-400 hover:text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95 group/btn"
        >
          {/* Wave animation ring */}
          <span className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping opacity-0 group-hover/btn:opacity-100 duration-1000" />
          
          <ChevronUp 
            size={22} 
            className="stroke-[2.5] relative z-10 transition-transform duration-300 group-hover/btn:-translate-y-0.5" 
          />
        </button>
      </div>
    </div>
  );
};

export default BackToTop;
