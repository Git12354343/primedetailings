// src/components/VehicleSelector.jsx
// Drop-in replacement for the vehicle type buttons in BookingForm step 1.
// Usage: <VehicleSelector selected={values.vehicleType} onChange={(v) => handleChange('vehicleType', v)} />

import React, { useState } from 'react';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

// ── SVG silhouettes ───────────────────────────────────────────────────────────
const SedanSVG = ({ selected }) => (
  <svg viewBox="0 0 120 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxHeight: '44px' }}>
    <path d="M8 36 C8 36 14 36 18 35 L28 22 C30 19 36 16 50 16 L72 16 C84 16 90 19 96 24 L108 35 C112 36 114 36 114 36 L114 40 C114 43 112 44 109 44 L98 44 C97 43 95 40 90 40 C85 40 83 43 82 44 L40 44 C39 43 37 40 32 40 C27 40 25 43 24 44 L13 44 C10 44 8 43 8 40 Z"
      fill={selected ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M30 22 L44 17 L78 17 L94 25" stroke={selected ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)'} strokeWidth="1" fill="none" />
    <circle cx="32" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <circle cx="90" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <rect x="36" y="19" width="18" height="10" rx="1.5" fill={selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'} />
    <rect x="58" y="19" width="22" height="10" rx="1.5" fill={selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'} />
  </svg>
);

const SUVSVG = ({ selected }) => (
  <svg viewBox="0 0 120 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxHeight: '44px' }}>
    <path d="M8 36 C8 36 12 36 16 35 L22 18 C24 15 30 13 46 13 L76 13 C90 13 96 15 102 20 L108 35 C112 36 114 36 114 36 L114 40 C114 43 112 44 109 44 L98 44 C97 43 95 40 90 40 C85 40 83 43 82 44 L38 44 C37 43 35 40 30 40 C25 40 23 43 22 44 L13 44 C10 44 8 43 8 40 Z"
      fill={selected ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="24" y="15" width="72" height="16" rx="2"
      fill={selected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)'}
      stroke={selected ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)'} strokeWidth="1" />
    <circle cx="30" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <circle cx="90" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <rect x="28" y="17" width="28" height="11" rx="1.5" fill={selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'} />
    <rect x="60" y="17" width="32" height="11" rx="1.5" fill={selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'} />
  </svg>
);

const TruckSVG = ({ selected }) => (
  <svg viewBox="0 0 120 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxHeight: '44px' }}>
    <path d="M8 36 L8 18 C8 15 10 13 14 13 L52 13 L52 35 L8 35 Z"
      fill={selected ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M52 18 L52 35 L112 35 L112 24 L112 22 L104 13 L52 13"
      fill={selected ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M52 36 L8 36 L8 40 C8 43 10 44 13 44 L20 44 C21 43 23 40 28 40 C33 40 35 43 36 44 L52 44 Z"
      fill={selected ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" />
    <path d="M52 36 L52 44 L80 44 C81 43 83 40 88 40 C93 40 95 43 96 44 L110 44 C113 44 114 43 114 40 L114 36 Z"
      fill={selected ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" />
    <circle cx="28" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <circle cx="88" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <rect x="12" y="17" width="34" height="13" rx="2" fill={selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'} />
  </svg>
);

const CoupeSVG = ({ selected }) => (
  <svg viewBox="0 0 120 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxHeight: '44px' }}>
    <path d="M10 36 C10 36 16 36 20 35 L34 20 C38 16 46 14 58 14 L72 14 C86 14 95 18 104 28 L108 35 C112 36 112 36 112 36 L112 40 C112 43 110 44 107 44 L96 44 C95 43 93 40 88 40 C83 40 81 43 80 44 L38 44 C37 43 35 40 30 40 C25 40 23 43 22 44 L15 44 C12 44 10 43 10 40 Z"
      fill={selected ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}
      stroke={selected ? GOLD_S : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M36 21 L50 16 L72 16 L90 26" stroke={selected ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)'} strokeWidth="1" fill="none" />
    <circle cx="30" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <circle cx="88" cy="41" r="5" fill={selected ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)'} stroke={selected ? GOLD_S : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
    <path d="M38 21 L52 17 L72 17 L86 26 L38 26 Z" fill={selected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)'} />
  </svg>
);

const VEHICLES = [
  { value: 'Sedan', label: 'Sedan',  desc: 'Standard & compact', SVG: SedanSVG },
  { value: 'SUV',   label: 'SUV',    desc: 'SUV & crossover',    SVG: SUVSVG   },
  { value: 'Truck', label: 'Truck',  desc: 'Pickup truck',       SVG: TruckSVG },
  { value: 'Coupe', label: 'Coupe',  desc: 'Sports & coupe',     SVG: CoupeSVG },
];

const VehicleSelector = ({ selected, onChange }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Select your vehicle
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {VEHICLES.map(({ value, label, desc, SVG }) => {
          const isSelected = selected === value;
          const isHovered  = hovered === value;
          return (
            <button key={value}
              onClick={() => onChange(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: isSelected ? 'rgba(201,168,76,0.1)' : isHovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '2px solid rgba(201,168,76,0.5)' : '2px solid rgba(255,255,255,0.07)',
                boxShadow: isSelected ? '0 0 24px rgba(201,168,76,0.15)' : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none',
              }}>
              {/* SVG silhouette */}
              <div className="w-full px-1">
                <SVG selected={isSelected} />
              </div>
              {/* Label */}
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: isSelected ? '#f5d376' : 'rgba(255,255,255,0.7)' }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{desc}</p>
              </div>
              {/* Selected dot */}
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD_S }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleSelector;
