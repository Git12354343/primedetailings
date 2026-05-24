import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

const ZONES = [
  { label: 'Montréal Island',    color: '#c9a84c', desc: 'Full coverage' },
  { label: 'Laval',              color: '#e8c46a', desc: 'Full coverage' },
  { label: 'South Shore',        color: '#a07830', desc: 'Longueuil · Brossard · St-Bruno' },
  { label: 'North Shore',        color: '#7a5c24', desc: 'Terrebonne · Repentigny · Mascouche' },
  { label: 'Greater Québec',     color: 'rgba(255,255,255,0.3)', desc: 'Available on request' },
];

const ServiceAreaMap = () => {
  const [active, setActive] = useState(false);
  const [pulse, setPulse]   = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setActive(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Pulse rings
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setPulse(p => p + 1), 1800);
    return () => clearInterval(id);
  }, [active]);

  return (
    <section ref={ref} className="py-20 relative overflow-hidden"
      style={{ background: '#0d0d0d' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
            <MapPin className="w-3.5 h-3.5" /> Service Area
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            We Come to <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>You</span>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Mobile detailing across Québec. No shop, no commute — just results at your door.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* SVG Map */}
          <div className="flex justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Outer Quebec region */}
                <ellipse cx="150" cy="150" rx="138" ry="130" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />
                {/* North Shore */}
                <ellipse cx="150" cy="120" rx="100" ry="70" fill="rgba(122,92,36,0.15)" stroke="rgba(122,92,36,0.4)" strokeWidth="1" />
                {/* South Shore */}
                <ellipse cx="150" cy="185" rx="90" ry="55" fill="rgba(160,120,48,0.15)" stroke="rgba(160,120,48,0.4)" strokeWidth="1" />
                {/* Laval */}
                <ellipse cx="150" cy="130" rx="65" ry="42" fill="rgba(232,196,106,0.15)" stroke="rgba(232,196,106,0.4)" strokeWidth="1.5" />
                {/* Montreal Island */}
                <ellipse cx="150" cy="155" rx="52" ry="35" fill="rgba(201,168,76,0.18)" stroke={GOLD_S} strokeWidth="2" />

                {/* Pulse rings */}
                {[0,1,2].map(i => (
                  <circle key={`${pulse}-${i}`} cx="150" cy="155" r={20 + i * 22}
                    fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="1"
                    style={{
                      opacity: active ? 0 : 0,
                      animation: active ? `mapPulse 2.4s ${i * 0.6}s ease-out infinite` : 'none',
                    }} />
                ))}

                {/* Center dot */}
                <circle cx="150" cy="155" r="7" fill={GOLD_S} />
                <circle cx="150" cy="155" r="3.5" fill="#0a0a0a" />

                {/* Labels */}
                <text x="150" y="240" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="sans-serif">Greater Québec</text>
                <text x="150" y="102" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8.5" fontFamily="sans-serif">North Shore</text>
                <text x="150" y="215" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8.5" fontFamily="sans-serif">South Shore</text>
                <text x="150" y="122" textAnchor="middle" fill="#e8c46a" fontSize="8" fontFamily="sans-serif">Laval</text>
                <text x="150" y="162" textAnchor="middle" fill={GOLD_S} fontSize="9.5" fontFamily="sans-serif" fontWeight="700">Montréal</text>
              </svg>

              <style>{`
                @keyframes mapPulse {
                  0%   { r: 12; opacity: 0.6; }
                  100% { r: 70; opacity: 0; }
                }
              `}</style>
            </div>
          </div>

          {/* Zone list */}
          <div className="space-y-3">
            {ZONES.map((z, i) => (
              <div key={z.label}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transitionDelay: `${i * 80}ms`,
                }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold">{z.label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{z.desc}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: i < 2 ? 'rgba(52,211,153,0.1)' : i < 4 ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
                           color: i < 2 ? '#34d399' : i < 4 ? GOLD_S : 'rgba(255,255,255,0.4)' }}>
                  {i < 2 ? 'Included' : i < 4 ? 'Available' : 'On request'}
                </span>
              </div>
            ))}

            <Link to="/booking"
              className="flex items-center justify-between p-4 rounded-xl mt-4 group transition-all"
              style={{ background: GOLD, color: '#0a0a0a' }}>
              <div>
                <p className="font-black text-sm">Book in your area</p>
                <p className="text-xs opacity-70 mt-0.5">We'll confirm availability by SMS</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreaMap;
