import React from 'react';

// ── Brand logos — text-based with optional SVG marks ─────────────────────────
// Replace logoUrl with real image paths once you have the actual logo files.
// For now uses a clean text + category badge fallback.
const BRANDS = [
  {
    name: 'Simoniz',
    category: 'Paint Protection',
    color: '#e63946',
    logoUrl: null,
  },
  {
    name: 'Meguiar\'s',
    category: 'Detailing Products',
    color: '#0077b6',
    logoUrl: null,
  },
  {
    name: 'Chemical Guys',
    category: 'Car Care',
    color: '#2d6a4f',
    logoUrl: null,
  },
  {
    name: '3M',
    category: 'Surface Protection',
    color: '#e63946',
    logoUrl: null,
  },
  {
    name: 'Gtechniq',
    category: 'Ceramic Coating',
    color: '#6a4c93',
    logoUrl: null,
  },
  {
    name: 'Gyeon',
    category: 'Quartz Coatings',
    color: '#1b4332',
    logoUrl: null,
  },
  {
    name: 'Koch-Chemie',
    category: 'Professional Grade',
    color: '#c77dff',
    logoUrl: null,
  },
  {
    name: 'Sonax',
    category: 'German Engineering',
    color: '#d62828',
    logoUrl: null,
  },
];

// ── Single brand card ─────────────────────────────────────────────────────────
const BrandCard = ({ brand }) => (
  <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 mx-3 rounded-xl select-none"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      minWidth: '160px',
    }}>
    {/* Logo circle or initial */}
    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
      style={{ background: `${brand.color}18`, border: `1px solid ${brand.color}35` }}>
      {brand.logoUrl
        ? <img src={brand.logoUrl} alt={brand.name} className="w-6 h-6 object-contain" />
        : <span style={{ color: brand.color, fontSize: '11px', letterSpacing: '-0.02em' }}>
            {brand.name.slice(0, 2).toUpperCase()}
          </span>
      }
    </div>
    {/* Name + category */}
    <div className="min-w-0">
      <p className="text-white font-bold text-sm leading-none">{brand.name}</p>
      <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{brand.category}</p>
    </div>
  </div>
);

// ── Main band ─────────────────────────────────────────────────────────────────
const BrandBand = () => {
  // Double the array so the seamless loop works
  const doubled = [...BRANDS, ...BRANDS];

  return (
    <section className="relative overflow-hidden py-8"
      style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Left + right fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #0a0a0a, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #0a0a0a, transparent)' }} />

      {/* Label */}
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] mb-5"
        style={{ color: 'rgba(201,168,76,0.6)' }}>
        Proudly Using
      </p>

      {/* Scrolling track */}
      <div className="flex" style={{ animation: 'brandScroll 28s linear infinite' }}>
        {doubled.map((brand, i) => (
          <BrandCard key={`${brand.name}-${i}`} brand={brand} />
        ))}
      </div>

      {/* Keyframe */}
      <style>{`
        @keyframes brandScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-track { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default BrandBand;
