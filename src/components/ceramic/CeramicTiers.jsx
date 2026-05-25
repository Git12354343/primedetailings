// src/components/ceramic/CeramicTiers.jsx
// Pulls live PROTECTION-category services from your existing useServicesCache,
// so pricing stays 100% admin-controlled. Falls back to nothing breaking if
// none exist yet. Includes a wax vs sealant vs ceramic comparison table.
import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, ChevronRight, Loader2 } from 'lucide-react';
import useServicesCache from '../../hooks/useServicesCache';
import useInView from '../../hooks/useInView';

const getMinPrice = (p) => {
  const v = Object.values(p || {}).filter((x) => x > 0);
  return v.length ? Math.min(...v) : null;
};

const COMPARE = [
  { label: 'Durability',        wax: '4–6 weeks',  sealant: '4–6 months', ceramic: '3–5 years' },
  { label: 'Gloss & depth',     wax: 'Good',       sealant: 'Better',     ceramic: 'Best' },
  { label: 'Hydrophobic',       wax: 'Mild',       sealant: 'Moderate',   ceramic: 'Extreme' },
  { label: 'Scratch resistance', wax: 'None',      sealant: 'Low',        ceramic: '9H hardness' },
  { label: 'UV / oxidation',    wax: 'Minimal',    sealant: 'Some',       ceramic: 'Full' },
  { label: 'Cost per year',     wax: 'High',       sealant: 'Medium',     ceramic: 'Lowest' },
];

const TierCard = ({ svc, featured, i, visible }) => {
  const min = getMinPrice(svc.pricing);
  return (
    <div className="relative rounded-2xl p-6 flex flex-col"
      style={{
        background: featured ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.03)',
        border: featured ? '2px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: featured ? '0 0 40px rgba(201,168,76,0.15)' : 'none',
        transition: 'opacity .6s, transform .6s',
        transitionDelay: `${i * 0.1}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', color: '#0a0a0a' }}>
          <Star className="w-3 h-3" /> Most Popular
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-1">{svc.name}</h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">
        {svc.description || 'Premium ceramic protection package.'}
      </p>
      <div className="mb-5">
        <span className="text-xs text-gray-500">From</span>
        <div className="text-3xl font-black" style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {min ? `$${min}` : 'Call for price'}
        </div>
      </div>
      <Link to={`/booking?service=${svc.id}`}
        className={`${featured ? 'btn-luxury' : 'btn-ghost-luxury'} w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-wide group`}>
        Choose {svc.name.split(' ')[0]}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

const CeramicTiers = () => {
  const { services, loading } = useServicesCache();
  const [ref, visible] = useInView({ threshold: 0.15 });

  // Dynamic: any active PROTECTION service whose name hints at ceramic/coating.
  const tiers = (services || [])
    .filter((s) => s.category === 'PROTECTION')
    .filter((s) => /ceram|coat|protect/i.test(`${s.name} ${s.description || ''}`))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const featuredIndex = tiers.length === 3 ? 1 : tiers.findIndex((t) => t.isFeatured);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#080808' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14" style={{ transition: 'opacity .6s, transform .6s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(14px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Coating Packages</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Choose your{' '}
            <span style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>protection</span>
          </h2>
          <p className="text-gray-400 text-base max-w-lg mx-auto">Every package is managed live from our system — current pricing always shown.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-7 h-7 animate-spin text-yellow-500" />
            <span className="text-gray-500 text-sm">Loading packages…</span>
          </div>
        ) : tiers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {tiers.slice(0, 3).map((svc, i) => (
              <TierCard key={svc.id} svc={svc} featured={i === featuredIndex} i={i} visible={visible} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-gray-400 mb-4">Ceramic packages are being finalized. Contact us for a custom quote.</p>
            <Link to="/booking?service=ceramic" className="btn-luxury inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold">Request a quote <ChevronRight className="w-4 h-4" /></Link>
          </div>
        )}

        {/* Comparison table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', transition: 'opacity .6s .2s', opacity: visible ? 1 : 0 }}>
          <div className="grid grid-cols-4 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Compare</div>
            <div className="text-center text-gray-400 text-sm font-bold">Wax</div>
            <div className="text-center text-gray-400 text-sm font-bold">Sealant</div>
            <div className="text-center text-sm font-bold" style={{ color: '#f5d376' }}>Ceramic</div>
          </div>
          {COMPARE.map((row, i) => (
            <div key={row.label} className="grid grid-cols-4 px-5 py-3.5 items-center"
              style={{ borderBottom: i < COMPARE.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
              <div className="text-gray-300 text-sm font-medium">{row.label}</div>
              <div className="text-center text-gray-500 text-sm">{row.wax}</div>
              <div className="text-center text-gray-400 text-sm">{row.sealant}</div>
              <div className="text-center text-sm font-semibold flex items-center justify-center gap-1" style={{ color: '#f5d376' }}>
                <Check className="w-3.5 h-3.5" /> {row.ceramic}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CeramicTiers;
