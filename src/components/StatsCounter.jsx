import React, { useState, useEffect, useRef } from 'react';

const STATS = [
  { end: 500, suffix: '+', label: 'Vehicles Detailed', prefix: '' },
  { end: 4.9,  suffix: '★', label: 'Average Rating',   prefix: '', decimals: 1 },
  { end: 3,    suffix: 'yr', label: 'Ceramic Warranty', prefix: '' },
  { end: 100,  suffix: '%', label: 'Mobile Service',   prefix: '' },
];

const useCountUp = (end, duration, active, decimals = 0) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(parseFloat((ease * end).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, end, duration, decimals]);
  return count;
};

const Counter = ({ stat, active, index }) => {
  const val = useCountUp(stat.end, 1400 + index * 120, active, stat.decimals || 0);
  return (
    <div className="text-center px-4 py-2">
      <div className="text-4xl sm:text-5xl font-black leading-none mb-2"
        style={{
          background: 'linear-gradient(135deg, #00a8cc, #00d4ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          textShadow: 'none',
          filter: active ? 'drop-shadow(0 0 20px rgba(0,168,204,0.4))' : 'none',
          transition: 'filter 0.6s ease',
        }}>
        {stat.prefix}{stat.decimals ? val.toFixed(stat.decimals) : Math.floor(val)}{stat.suffix}
      </div>
      <div className="text-xs sm:text-sm font-medium uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.45)' }}>
        {stat.label}
      </div>
    </div>
  );
};

const StatsCounter = () => {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-14 relative overflow-hidden"
      style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Subtle gold glow center */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,168,204,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Label */}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] mb-8"
          style={{ color: 'rgba(0,168,204,0.5)' }}>
          Trusted Across Québec
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x"
          style={{ '--tw-divide-opacity': 1, '--divider-color': 'rgba(255,255,255,0.08)' }}>
          {STATS.map((stat, i) => (
            <div key={stat.label} style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,0.08)' } : {}}>
              <Counter stat={stat} active={active} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
