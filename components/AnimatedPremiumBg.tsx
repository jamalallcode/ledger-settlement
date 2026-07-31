import React from 'react';
import { Sparkles } from 'lucide-react';

const AnimatedPremiumBg: React.FC = () => {
  // Generate some random values for sparkle/particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 12}s`,
    size: Math.random() * 4 + 1.5,
    duration: `${Math.random() * 15 + 12}s`,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      style={{
        background: 'linear-gradient(135deg, var(--landing-bg-start, #93c5fd) 0%, var(--landing-bg-mid, #e0f2fe) 50%, var(--landing-bg-end, #bae6fd) 100%)'
      }}
    >
      {/* 1. Theme-Adaptive Soft Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-100"
          style={{
            background: 'linear-gradient(135deg, var(--landing-bg-inner-start, #7dd3fc) 0%, var(--landing-bg-inner-mid, #f0f9ff) 50%, var(--landing-bg-inner-end, #e0f2fe) 100%)'
          }}
        />
        {/* Soft elegant radial shine in the center to highlight content */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0)_80%)]" />
      </div>

      {/* 2. Premium Light Soft Grid Overlay (very light, elegant) */}
      <div className="absolute inset-0 z-10 premium-grid-panning opacity-[0.25]" />

      {/* 3. Infinite Floating Vector Waves (Beautiful, flowing ledger paths) */}
      <svg className="absolute inset-0 w-full h-full z-15 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-theme-start, #2563eb)" />
            <stop offset="50%" stopColor="var(--primary-theme-color, #0d9488)" />
            <stop offset="100%" stopColor="var(--primary-theme-end, #4f46e5)" />
          </linearGradient>
          <linearGradient id="gradient-wave-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-theme-hover, #10b981)" />
            <stop offset="100%" stopColor="var(--primary-theme-start, #3b82f6)" />
          </linearGradient>
        </defs>
        
        {/* Wave 1 */}
        <path 
          d="M-100 200 C 300 280, 400 80, 900 150 C 1400 220, 1500 120, 2000 250" 
          fill="none" 
          stroke="url(#gradient-wave-1)" 
          strokeWidth="3" 
          strokeLinecap="round"
          className="animate-wave-slow-1"
        />

        {/* Wave 2 */}
        <path 
          d="M-50 450 C 400 350, 600 550, 1100 400 C 1600 250, 1700 480, 2100 350" 
          fill="none" 
          stroke="url(#gradient-wave-2)" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="animate-wave-slow-2"
        />
      </svg>

      {/* 4. Soft Floating Star/Sparkle Particles & Bokeh */}
      <div className="absolute inset-0 z-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-white rounded-full animate-float-particles"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: p.delay,
              animationDuration: p.duration,
              boxShadow: p.size > 4 ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none',
              bottom: '-20px',
            }}
          />
        ))}
      </div>

      {/* 5. Delicate decorative elements to replace the coarse global text overlays */}
      <div className="absolute top-[12%] left-[8%] z-10 w-2.5 h-2.5 border border-blue-500/20 rotate-45 animate-spin" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[35%] right-[15%] z-10 w-3.5 h-3.5 border border-emerald-500/20 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-[20%] left-[18%] z-10 w-2 h-2 bg-amber-500/10 rounded-xs" />

      {/* 6. Premium Artistic Gold/Orange Corner Designs (Anchored to the content grid width to remain static under sidebar toggle) */}
      <div className="w-full h-full max-w-[1880px] xl:max-w-[1880px] mx-auto relative px-[10px] pointer-events-none transition-all duration-300">
        {/* Top-Left Corner Bracket - Locked to the top-left corner of the content card area */}
        <div className="absolute top-0 left-[-10px] w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 z-20 pointer-events-none overflow-hidden">
          {/* Soft atmospheric ambient warm lighting shadow */}
          <div className="absolute -top-1/4 -left-1/4 w-[120%] h-[120%] rounded-full bg-amber-500/20 blur-3xl" />
          {/* Main luxury gradient crescent structure */}
          <div className="absolute -top-[50%] -left-[50%] w-[140%] h-[140%] rounded-br-[5rem] sm:rounded-br-[7rem] bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 shadow-xl border-r-[6px] border-b-[6px] border-amber-300/65" />
          {/* Secondary inner floating highlight contour */}
          <div className="absolute -top-[60%] -left-[60%] w-[130%] h-[130%] rounded-br-[4rem] sm:rounded-br-[5.5rem] bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 border-r-2 border-b-2 border-white/45 opacity-85" />
          {/* Fine gold accent line */}
          <div className="absolute -top-[42%] -left-[42%] w-[120%] h-[120%] rounded-br-[6rem] sm:rounded-br-[8rem] border-r border-b border-yellow-200/50" />
        </div>

        {/* Bottom-Right Corner Bracket - Locked to the bottom-right corner of the content card area */}
        <div className="absolute bottom-0 right-[-10px] w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 z-20 pointer-events-none overflow-hidden">
          {/* Soft atmospheric ambient warm lighting shadow */}
          <div className="absolute -bottom-1/4 -right-1/4 w-[120%] h-[120%] rounded-full bg-amber-500/20 blur-3xl" />
          {/* Main luxury gradient crescent structure */}
          <div className="absolute -bottom-[50%] -right-[50%] w-[140%] h-[140%] rounded-tl-[5rem] sm:rounded-tl-[7rem] bg-gradient-to-tl from-orange-600 via-amber-500 to-yellow-400 shadow-xl border-l-[6px] border-t-[6px] border-amber-300/65" />
          {/* Secondary inner floating highlight contour */}
          <div className="absolute -bottom-[60%] -right-[60%] w-[130%] h-[130%] rounded-tl-[4rem] sm:rounded-tl-[5.5rem] bg-gradient-to-tl from-yellow-400 via-amber-400 to-orange-500 border-l-2 border-t-2 border-white/45 opacity-85" />
          {/* Fine gold accent line */}
          <div className="absolute -bottom-[42%] -right-[42%] w-[120%] h-[120%] rounded-tl-[6rem] sm:rounded-tl-[8rem] border-l border-t border-yellow-200/50" />
        </div>
      </div>
    </div>
  );
};

export default AnimatedPremiumBg;
