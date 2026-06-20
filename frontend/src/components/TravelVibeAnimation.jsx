import React from 'react';

export const TravelVibeAnimation = () => {
  return (
    <div style={{
      width: '100%',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, #111827, #1e1b4b, #311042)',
      border: '1px solid var(--border-color)',
      position: 'relative',
      height: '240px',
      boxShadow: 'var(--glass-shadow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Dynamic CSS Styles for SVG Animations */}
      <style>{`
        @keyframes float-cloud-slow {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(950px); }
        }
        @keyframes float-cloud-fast {
          0% { transform: translateX(-200px); }
          100% { transform: translateX(1000px); }
        }
        @keyframes river-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes waterfall-flow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes water-splash {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
          50% { transform: scale(1.3) translateY(-3px); opacity: 0.4; }
        }
        @keyframes sun-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(251, 146, 60, 0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(251, 146, 60, 0.7)); }
        }
        .cloud-slow {
          animation: float-cloud-slow 45s linear infinite;
        }
        .cloud-fast {
          animation: float-cloud-fast 25s linear infinite;
        }
        .river-animated {
          stroke-dasharray: 10, 15;
          animation: river-flow 4s linear infinite;
        }
        .waterfall-animated {
          stroke-dasharray: 8, 12;
          animation: waterfall-flow 1.5s linear infinite;
        }
        .splash-particle {
          transform-origin: center;
          animation: water-splash 1s ease-in-out infinite;
        }
      `}</style>

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 800 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* Definitions for Gradients */}
        <defs>
          {/* Sun Glow */}
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffedd5" />
            <stop offset="60%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          {/* Far Mountains */}
          <linearGradient id="farMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#431407" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          {/* Mid Mountains */}
          <linearGradient id="midMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e1065" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          {/* Foreground Hills */}
          <linearGradient id="foreHillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          {/* River Gradient */}
          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        {/* 1. Starry Sky background */}
        <g opacity="0.3">
          <circle cx="120" cy="40" r="1" fill="white" />
          <circle cx="280" cy="70" r="1.5" fill="white" />
          <circle cx="450" cy="30" r="0.8" fill="white" />
          <circle cx="620" cy="50" r="1.2" fill="white" />
          <circle cx="750" cy="25" r="1" fill="white" />
          <circle cx="60" cy="80" r="1" fill="white" />
          <circle cx="530" cy="65" r="1.5" fill="white" />
        </g>

        {/* 2. Sunset Glowing Sun */}
        <circle
          cx="400"
          cy="120"
          r="65"
          fill="url(#sunGrad)"
          style={{ animation: 'sun-glow 8s ease-in-out infinite' }}
        />

        {/* 3. Floating Clouds */}
        {/* Cloud Group 1 - Slow */}
        <g className="cloud-slow" opacity="0.15">
          <path d="M50 70 a15 15 0 0 1 20 -10 a20 20 0 0 1 35 5 a15 15 0 0 1 10 15 h-65 z" fill="#ffffff" />
          <path d="M600 50 a12 12 0 0 1 15 -8 a18 18 0 0 1 30 4 a12 12 0 0 1 8 12 h-53 z" fill="#ffffff" />
        </g>
        {/* Cloud Group 2 - Fast */}
        <g className="cloud-fast" opacity="0.25">
          <path d="M220 85 a10 10 0 0 1 15 -5 a15 15 0 0 1 25 3 a10 10 0 0 1 8 10 h-48 z" fill="#ffffff" />
          <path d="M780 75 a12 12 0 0 1 18 -6 a16 16 0 0 1 26 4 a12 12 0 0 1 8 10 h-52 z" fill="#ffffff" />
        </g>

        {/* 4. Far Mountains */}
        <path d="M0 160 L180 80 L320 150 L480 60 L620 140 L800 70 L800 240 L0 240 Z" fill="url(#farMountainGrad)" opacity="0.9" />

        {/* 5. Mid Mountains */}
        <path d="M0 190 L120 130 L250 180 L380 110 L520 190 L680 100 L800 170 L800 240 L0 240 Z" fill="url(#midMountainGrad)" />

        {/* 6. Cascading Waterfall */}
        {/* Stream down the mid mountain (L380 110 to L395 160) */}
        <path d="M380 110 C382 125, 390 140, 393 161" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <path
          d="M380 110 C382 125, 390 140, 393 161"
          stroke="#e0f2fe"
          strokeWidth="3"
          strokeLinecap="round"
          className="waterfall-animated"
        />

        {/* Waterfall Splash Particles */}
        <ellipse cx="393" cy="162" rx="6" ry="2" fill="#e0f2fe" className="splash-particle" />
        <ellipse cx="390" cy="164" rx="4" ry="1.5" fill="#38bdf8" className="splash-particle" style={{ animationDelay: '0.5s' }} />

        {/* 7. Winding River through Valleys */}
        {/* River outline */}
        <path
          d="M393 162 C400 175, 370 190, 420 205 C470 220, 520 230, 560 240"
          stroke="url(#riverGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        {/* River animation accents */}
        <path
          d="M393 162 C400 175, 370 190, 420 205 C470 220, 520 230, 560 240"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          className="river-animated"
          opacity="0.6"
        />

        {/* 8. Pine Trees on Midground Hills */}
        <g fill="#064e3b" opacity="0.8">
          {/* Tree 1 */}
          <polygon points="80,150 75,160 85,160" />
          <polygon points="80,145 76,152 84,152" />
          <rect x="79" y="160" width="2" height="6" fill="#78350f" />
          {/* Tree 2 */}
          <polygon points="100,160 94,172 106,172" />
          <polygon points="100,153 96,162 104,162" />
          <rect x="99" y="172" width="2.5" height="7" fill="#78350f" />
          {/* Tree 3 */}
          <polygon points="480,185 476,193 484,193" />
          <rect x="479" y="193" width="1.5" height="4" fill="#78350f" />
          {/* Tree 4 */}
          <polygon points="620,165 615,175 625,175" />
          <polygon points="620,160 617,167 623,167" />
          <rect x="619" y="175" width="2" height="5" fill="#78350f" />
        </g>

        {/* 9. Foreground Valleys & Hills */}
        <path d="M0 210 Q200 170 450 215 T800 200 L800 240 L0 240 Z" fill="url(#foreHillGrad)" />

        {/* 10. More Pine Trees in Foreground */}
        <g fill="#022c22">
          {/* Large Tree 1 */}
          <polygon points="50,195 40,212 60,212" />
          <polygon points="50,185 43,198 57,198" />
          <polygon points="50,175 46,187 54,187" />
          <rect x="48.5" y="212" width="3" height="12" fill="#451a03" />

          {/* Large Tree 2 */}
          <polygon points="720,195 712,210 728,210" />
          <polygon points="720,186 715,197 725,197" />
          <rect x="718.5" y="210" width="3" height="10" fill="#451a03" />
        </g>
      </svg>
    </div>
  );
};

export default TravelVibeAnimation;
