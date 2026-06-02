import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onDone }) => {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    // hold for 1.2s then fade out
    const hold = setTimeout(() => setPhase('out'), 1200);
    const done = setTimeout(() => onDone?.(), 1700);
    return () => { clearTimeout(hold); clearTimeout(done); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500"
      style={{
        background: '#0b0f1a',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,168,204,0.08) 0%, transparent 60%)' }}
      />

      <div className="flex flex-col items-center gap-5">
        {/* Logo mark */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-gold"
          style={{
            background: 'linear-gradient(135deg, #00a8cc, #00d4ff)',
            boxShadow: '0 0 40px rgba(0,168,204,0.4)',
            animation: 'pulseGold 1.5s ease-in-out infinite',
          }}
        >
          <span className="text-black font-black text-2xl tracking-tight">PP</span>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <div className="text-white font-black text-xl tracking-wide">
            Prestige Plus{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00a8cc, #00d4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Services
            </span>
          </div>
          <div className="text-gray-600 text-xs tracking-widest uppercase mt-1">Montreal</div>
        </div>

        {/* Loading bar */}
        <div
          className="w-32 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00a8cc, #00d4ff)',
              animation: 'loadBar 1.1s ease-out forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
