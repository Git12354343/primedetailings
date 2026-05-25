// src/components/home/TrustStrip.jsx
// Slim trust band shown directly under the hero. Numbers count up once on
// scroll-in (cheap, transform/opacity-free). Edit the TRUST values to match
// your real figures. Uses the shared useInView hook (reduced-motion safe).
import React, { useEffect, useState } from 'react';
import { Car, Star, ShieldCheck, MapPin } from 'lucide-react';
import useInView from '../../hooks/useInView';

const TRUST = [
  { icon: Car,         target: 500, suffix: '+', label: 'Cars detailed' },
  { icon: Star,        target: 4.9, decimals: 1, suffix: '★', label: 'Google rating' },
  { icon: ShieldCheck, target: 5,   suffix: 'yr', label: 'Warranty' },
  { icon: MapPin,      target: 100, suffix: '%', label: 'Mobile service' },
];

const useCountUp = (target, run, decimals = 0, ms = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, target, ms]);
  return decimals ? val.toFixed(decimals) : Math.round(val);
};

const Stat = ({ icon: Icon, target, suffix, decimals, label, run, delay }) => {
  const value = useCountUp(target, run, decimals);
  return (
    <div className="flex flex-col items-center text-center"
      style={{ transition: 'opacity .5s, transform .5s', transitionDelay: `${delay}s`, opacity: run ? 1 : 0, transform: run ? 'none' : 'translateY(10px)' }}>
      <Icon className="w-5 h-5 mb-2 text-yellow-500" />
      <div className="text-2xl sm:text-3xl font-black" style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {value}{suffix}
      </div>
      <div className="text-[11px] text-gray-500 tracking-widest uppercase mt-1">{label}</div>
    </div>
  );
};

const TrustStrip = () => {
  const [ref, visible] = useInView({ threshold: 0.3 });
  return (
    <section ref={ref} className="relative py-10" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {TRUST.map((t, i) => <Stat key={t.label} {...t} run={visible} delay={i * 0.08} />)}
      </div>
    </section>
  );
};

export default TrustStrip;
