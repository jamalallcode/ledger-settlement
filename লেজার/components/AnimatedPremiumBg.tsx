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
      className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0"
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

      {/* 5. Delicate decorative elements */}
      <div className="absolute top-[12%] left-[8%] z-10 w-2.5 h-2.5 border border-blue-500/20 rotate-45 animate-spin" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[35%] right-[15%] z-10 w-3.5 h-3.5 border border-emerald-500/20 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
    </div>
  );
};

export default AnimatedPremiumBg;
