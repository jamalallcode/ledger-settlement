import React from 'react';
import { Sparkles } from 'lucide-react';

const AnimatedPremiumBg: React.FC = () => {
  // Generate some random values for sparkle/particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 12}s`,
    size: Math.random() * 6 + 2,
    duration: `${Math.random() * 15 + 12}s`,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-slate-50/55">
      {/* 1. Dynamic Moving Smooth Gradient Mesh Background */}
      <div className="absolute inset-0 z-0">
        {/* Deep luxurious blue gradient orb - top left */}
        <div 
          className="absolute -top-32 -left-32 w-[35rem] h-[35rem] rounded-full bg-blue-500/10 blur-[90px] animate-float-1" 
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Soft, refreshing emerald orb - bottom right */}
        <div 
          className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full bg-emerald-500/8 blur-[100px] animate-float-2" 
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Subtle, premium gold/warm orb - center left */}
        <div 
          className="absolute top-1/3 -left-20 w-[30rem] h-[30rem] rounded-full bg-amber-400/6 blur-[80px] animate-float-3" 
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Ultra-soft celestial indigo orb - center right */}
        <div 
          className="absolute top-1/4 right-[10%] w-[35rem] h-[35rem] rounded-full bg-indigo-500/5 blur-[90px] animate-float-1" 
          style={{ animationDelay: '-8s' }}
        />
      </div>

      {/* 2. Premium Grid Overlay with Custom Diagonal Continuous Panning */}
      <div className="absolute inset-0 z-10 premium-grid-panning opacity-[0.80]" />

      {/* 3. Infinite Floating Vector Waves (Beautiful, flowing ledger paths) */}
      <svg className="absolute inset-0 w-full h-full z-15 opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="gradient-wave-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
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
    </div>
  );
};

export default AnimatedPremiumBg;
