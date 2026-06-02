// src/components/ServiceAreaMap.jsx
// Interactive Québec map replacing the circle-based service area section.
// Clicking a zone row OR the map shape highlights both.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import useInView from '../hooks/useInView';

const GOLD  = 'linear-gradient(135deg,#00a8cc,#00d4ff)';
const GOLD_S = '#00a8cc';

const ZONES = [
  { id: 'montreal', label: 'Montréal Island', desc: 'Full coverage',                         color: '#00a8cc', badge: 'Included',   badgeStyle: { background:'rgba(52,211,153,0.12)', color:'#34d399', border:'1px solid rgba(52,211,153,0.25)' } },
  { id: 'laval',    label: 'Laval',           desc: 'Full coverage',                         color: '#e8c46a', badge: 'Included',   badgeStyle: { background:'rgba(52,211,153,0.12)', color:'#34d399', border:'1px solid rgba(52,211,153,0.25)' } },
  { id: 'south',    label: 'South Shore',     desc: 'Longueuil · Brossard · St-Bruno',       color: '#a07830', badge: 'Available',  badgeStyle: { background:'rgba(0,168,204,0.12)', color:'#00a8cc', border:'1px solid rgba(0,168,204,0.25)' } },
  { id: 'north',    label: 'North Shore',     desc: 'Terrebonne · Repentigny · Mascouche',   color: '#7a5c24', badge: 'Available',  badgeStyle: { background:'rgba(0,168,204,0.12)', color:'#00a8cc', border:'1px solid rgba(0,168,204,0.25)' } },
  { id: 'quebec',   label: 'Greater Québec',  desc: 'Available on request',                  color: 'rgba(255,255,255,0.3)', badge: 'On request', badgeStyle: { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.1)' } },
];

/* ── SVG map shapes ─────────────────────────────────────────────────── */
const MAP_FILLS = {
  montreal: '#00a8cc',
  laval:    '#e8c46a',
  south:    '#a07830',
  north:    '#7a5c24',
  quebec:   'rgba(255,255,255,0.08)',
};

const QMap = ({ active, onZone }) => {
  const opacity = (id) => active === id ? 1 : id === 'quebec' ? 0.5 : 0.65;
  const bright  = (id) => active === id ? 'brightness(1.35)' : 'brightness(1)';

  return (
    <svg viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '360px', display: 'block' }}>

      {/* Province outline */}
      <path fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"
        d="M80 20 L200 10 L260 30 L280 60 L290 100 L300 140 L295 180 L285 200 L270 210 L275 230 L260 250 L240 260 L230 280 L220 300 L200 310 L190 330 L180 350 L170 370 L160 390 L150 400 L130 390 L110 370 L90 350 L80 320 L70 290 L60 260 L50 230 L40 200 L35 170 L30 140 L40 110 L50 80 L60 50 Z"/>

      {/* Greater Québec */}
      <path id="qmap-quebec" onClick={() => onZone('quebec')} style={{ cursor:'pointer', transition:'all 0.25s', filter: bright('quebec') }}
        fill={MAP_FILLS.quebec} stroke="rgba(255,255,255,0.15)" strokeWidth="1" opacity={opacity('quebec')}
        d="M120 120 L240 100 L270 130 L265 170 L250 190 L230 210 L210 220 L190 230 L170 240 L150 235 L130 225 L115 205 L110 180 L112 155 Z"/>

      {/* North Shore */}
      <path id="qmap-north" onClick={() => onZone('north')} style={{ cursor:'pointer', transition:'all 0.25s', filter: bright('north') }}
        fill={MAP_FILLS.north} opacity={opacity('north')}
        d="M130 225 L150 235 L170 240 L190 230 L210 220 L195 255 L175 265 L155 265 L135 255 Z"/>

      {/* South Shore */}
      <path id="qmap-south" onClick={() => onZone('south')} style={{ cursor:'pointer', transition:'all 0.25s', filter: bright('south') }}
        fill={MAP_FILLS.south} opacity={opacity('south')}
        d="M115 265 L135 255 L155 265 L175 265 L195 255 L185 285 L165 295 L145 295 L125 285 Z"/>

      {/* Laval */}
      <ellipse id="qmap-laval" onClick={() => onZone('laval')} style={{ cursor:'pointer', transition:'all 0.25s', filter: bright('laval') }}
        cx="155" cy="278" rx="28" ry="14" fill={MAP_FILLS.laval} opacity={opacity('laval')}/>

      {/* Montréal */}
      <ellipse id="qmap-montreal" onClick={() => onZone('montreal')} style={{ cursor:'pointer', transition:'all 0.25s', filter: bright('montreal') }}
        cx="155" cy="300" rx="22" ry="12" fill={MAP_FILLS.montreal} opacity={opacity('montreal')}/>

      {/* St Lawrence hint */}
      <path d="M90 310 Q155 322 220 308" fill="none" stroke="rgba(96,165,250,0.18)" strokeWidth="6"/>

      {/* Labels */}
      {[
        { x:200, y:165,  t:'Greater Québec', dark:false },
        { x:165, y:249,  t:'North Shore',    dark:false },
        { x:155, y:278,  t:'Laval',          dark:true  },
        { x:155, y:302,  t:'Montréal',       dark:true  },
        { x:155, y:330,  t:'South Shore',    dark:false },
      ].map(({ x, y, t, dark }) => (
        <text key={t} x={x} y={y} textAnchor="middle" pointerEvents="none"
          style={{ fontSize:'9px', fontFamily:'Arial,sans-serif', fill: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.55)' }}>
          {t}
        </text>
      ))}

      {/* Pulse dot on Montréal */}
      <circle cx="155" cy="300" r="4" fill="#00d4ff"/>
      <circle cx="155" cy="300" r="4" fill="none" stroke="#00d4ff" strokeWidth="1.5">
        <animate attributeName="r" from="4" to="16" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
};

/* ── Main component ─────────────────────────────────────────────────── */
const ServiceAreaMap = () => {
  const [active, setActive] = useState('montreal');
  const [ref, visible] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden"
      style={{ background: '#111827' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%,rgba(0,168,204,0.04) 0%,transparent 65%)' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-12"
          style={{ transition:'opacity .7s, transform .7s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-widest"
            style={{ background:'rgba(0,168,204,0.08)', border:'1px solid rgba(0,168,204,0.2)', color: GOLD_S }}>
            <MapPin className="w-3.5 h-3.5" /> Service Area
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing:'-0.02em' }}>
            We Come to{' '}
            <span style={{ color: '#fff' }}>
              You
            </span>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color:'rgba(255,255,255,0.4)' }}>
            Mobile detailing across Québec. No shop, no commute — just results at your door.
          </p>
        </div>

        {/* Map + zone list */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 justify-center"
          style={{ transition:'opacity .7s .15s', opacity: visible ? 1 : 0 }}>

          {/* Map */}
          <div style={{ width:'100%', maxWidth:'340px', flexShrink: 0 }}>
            <QMap active={active} onZone={setActive} />
          </div>

          {/* Zone list */}
          <div style={{ flex: 1, minWidth: '260px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {ZONES.map(({ id, label, desc, color, badge, badgeStyle }) => (
              <div key={id} onClick={() => setActive(id)}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 cursor-pointer transition-all"
                style={{
                  background: active === id ? 'rgba(0,168,204,0.07)' : 'rgba(255,255,255,0.03)',
                  border: active === id ? '1px solid rgba(0,168,204,0.3)' : '1px solid rgba(255,255,255,0.07)',
                }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full flex-shrink-0"
                    style={{ width:'10px', height:'10px', background: color }} />
                  <div>
                    <p className="text-white font-bold text-sm">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.4)' }}>{desc}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-3" style={badgeStyle}>
                  {badge}
                </span>
              </div>
            ))}

            {/* CTA */}
            <Link to="/booking"
              className="flex items-center justify-between px-5 py-4 rounded-2xl mt-1 transition-all hover:scale-[1.01]"
              style={{ background: GOLD, color:'#0b0f1a' }}>
              <div>
                <p className="font-black text-sm">Book in your area</p>
                <p className="text-xs font-medium opacity-60 mt-0.5">We'll confirm availability by SMS</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreaMap;
