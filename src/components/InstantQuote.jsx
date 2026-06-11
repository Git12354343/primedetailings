// src/components/InstantQuote.jsx
// Redesign v2:
//  - Step headers with completion checkmarks
//  - Auto-scroll to services when vehicle selected
//  - "Most Popular" badge (isMostPopular / isFeatured)
//  - Bigger prices, compact rows, desc shows only when selected
//  - Pinned selection summary above CTA

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useServicesCache from '../hooks/useServicesCache';
import { ArrowRight, Check, Clock, Loader2, Sparkles, Star } from 'lucide-react';

const GOLD = 'linear-gradient(135deg,#00a8cc,#00d4ff)';

const VEHICLES = [
  {
    key: 'Sedan', label: 'Sedan', sub: 'Compact, sedan, hatchback, coupe',
    svg: <svg viewBox="0 0 64 32" fill="none" className="w-14 h-7"><rect x="2" y="16" width="60" height="10" rx="3" fill="currentColor" opacity=".15"/><path d="M8 16 Q16 6 28 6 L36 6 Q48 6 56 16Z" fill="currentColor" opacity=".35"/><circle cx="16" cy="26" r="4" fill="currentColor" opacity=".65"/><circle cx="48" cy="26" r="4" fill="currentColor" opacity=".65"/></svg>,
  },
  {
    key: 'SUV', label: 'SUV', sub: 'Crossover, minivan, midsize SUV',
    svg: <svg viewBox="0 0 64 32" fill="none" className="w-14 h-7"><rect x="2" y="14" width="60" height="12" rx="3" fill="currentColor" opacity=".15"/><rect x="8" y="6" width="44" height="10" rx="2" fill="currentColor" opacity=".35"/><circle cx="16" cy="26" r="4" fill="currentColor" opacity=".65"/><circle cx="48" cy="26" r="4" fill="currentColor" opacity=".65"/></svg>,
  },
  {
    key: 'Truck', label: 'Truck / Large SUV', sub: 'Pickup, Tahoe, Suburban, Escalade',
    svg: <svg viewBox="0 0 72 32" fill="none" className="w-16 h-7"><rect x="2" y="14" width="68" height="12" rx="3" fill="currentColor" opacity=".15"/><rect x="28" y="6" width="36" height="10" rx="2" fill="currentColor" opacity=".35"/><rect x="4" y="10" width="20" height="16" rx="2" fill="currentColor" opacity=".22"/><circle cx="18" cy="26" r="4" fill="currentColor" opacity=".65"/><circle cx="54" cy="26" r="4" fill="currentColor" opacity=".65"/></svg>,
  },
];

const getMinPrice = (p) => {
  const v = Object.values(p || {}).filter(x => Number(x) > 0);
  return v.length ? Math.min(...v.map(Number)) : null;
};
const getPriceFor = (p, veh) => {
  const x = p?.[veh];
  return (x && Number(x) > 0) ? Number(x) : getMinPrice(p);
};
const fmtDur = (m) => {
  if (!m) return null;
  const h = Math.floor(m / 60), min = m % 60;
  return h ? (min ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
};

// ── Step header with completion state ─────────────────────────────────────────
const StepHeader = ({ n, label, done, active }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
      style={{
        background: done ? GOLD : active ? 'rgba(0,168,204,0.2)' : 'rgba(255,255,255,0.06)',
        color:      done ? '#0b0f1a' : active ? '#00d4ff' : 'rgba(255,255,255,0.25)',
      }}>
      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
    </div>
    <span className="text-xs font-bold uppercase tracking-widest"
      style={{ color: done || active ? 'rgba(0,212,255,0.8)' : 'rgba(255,255,255,0.25)' }}>
      {label}
    </span>
  </div>
);

// ── Service row ───────────────────────────────────────────────────────────────
const SvcRow = ({ item, vehicle, selected, onSelect, popular }) => {
  const price = getPriceFor(item.pricing || {}, vehicle);
  const exact = !!(item.pricing?.[vehicle] && Number(item.pricing[vehicle]) > 0);
  const dur   = fmtDur(item.estimatedDuration);
  return (
    <button
      onClick={() => onSelect(item)}
      className="relative w-full flex items-center gap-3.5 px-5 text-left transition-all active:scale-[0.995]"
      style={{
        background:    selected ? 'rgba(0,168,204,0.1)' : 'transparent',
        borderBottom:  '1px solid rgba(255,255,255,0.05)',
        borderLeft:    selected ? '3px solid #00d4ff' : '3px solid transparent',
        paddingTop:    selected ? '16px' : '14px',
        paddingBottom: selected ? '16px' : '14px',
        minHeight:     '60px',
      }}
      aria-pressed={selected}
    >
      <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: selected ? GOLD : 'transparent',
          border:     selected ? 'none' : '2px solid rgba(255,255,255,0.18)',
        }}>
        {selected && <Check className="w-3 h-3 text-black" strokeWidth={3.5} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-[15px] leading-snug">{item.name}</span>
          {popular && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: GOLD, color: '#0b0f1a' }}>
              <Star className="w-2.5 h-2.5" /> Popular
            </span>
          )}
        </div>
        {selected && item.description && (
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.description}</p>
        )}
        {dur && (
          <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Clock className="w-3 h-3" />{dur}
          </div>
        )}
      </div>

      <div className="text-right flex-shrink-0 w-[72px]">
        {item.requiresQuote ? (
          <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Quote</span>
        ) : price ? (
          <>
            {!exact && <div className="text-[10px] text-gray-600 leading-none mb-0.5">from</div>}
            <div className="text-[22px] font-black leading-none" style={{
              background: GOLD,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>${price}</div>
          </>
        ) : (
          <span className="text-[11px] text-gray-600">—</span>
        )}
      </div>
    </button>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const InstantQuote = () => {
  const navigate = useNavigate();
  const { services, packages, loading } = useServicesCache();

  const [vehicle,  setVehicle]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [visible,  setVisible]  = useState(false);

  const sectionRef = useRef(null);
  const svcRef     = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const handleVehicle = (key) => {
    const isNew = vehicle !== key;
    setVehicle(key);
    if (isNew) setSelected(null);
    setTimeout(() => {
      svcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelect = (item, isPackage) =>
    setSelected(prev => prev?.item.id === item.id ? null : { item, isPackage });

  const bookablePackages = packages.filter(p => p.isActive !== false);
  const bookableServices = services.filter(s => s.isActive !== false);
  const allItems = [
    ...bookablePackages.map(p => ({ item: p, isPackage: true })),
    ...bookableServices.map(s => ({ item: s, isPackage: false })),
  ];
  const hasItems = allItems.length > 0;

  const price   = selected && vehicle ? getPriceFor(selected.item.pricing || {}, vehicle) : null;
  const canBook = vehicle && selected;

  const handleBook = () => {
    if (!vehicle) return;
    const item = selected?.item;
    navigate('/booking', {
      state: {
        prefilled: {
          vehicleType: vehicle,
          packageId:   selected?.isPackage ? item?.id   : null,
          packageName: selected?.isPackage ? item?.name : null,
          services:    selected?.isPackage
            ? (item?.includedServices || []).map(String)
            : item ? [String(item.id)] : [],
          addOns:      selected?.isPackage ? (item?.includedAddOns || []).map(String) : [],
          totalPrice:  price,
          mode:        selected?.isPackage ? 'packages' : 'services',
        },
      },
    });
  };

  return (
    <section ref={sectionRef} className="py-20 px-4"
      style={{ background: 'linear-gradient(180deg,#0b0f1a 0%,#0e1522 100%)' }}>
      <div className={`max-w-xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Header */}
        <div className="text-center mb-9">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.25)' }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Instant Price</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">What will it cost?</h2>
          <p className="text-gray-400 text-sm">Pick your vehicle and service — see the price right now.</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>

          {/* Step 1 */}
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <StepHeader n={1} label="Your vehicle" done={!!vehicle} active={!vehicle} />
            <div className="grid grid-cols-3 gap-3">
              {VEHICLES.map(v => {
                const active = vehicle === v.key;
                return (
                  <button key={v.key} onClick={() => handleVehicle(v.key)}
                    className="flex flex-col items-center gap-2.5 px-2 py-5 rounded-2xl transition-all duration-200 active:scale-95"
                    style={{
                      background: active ? 'rgba(0,168,204,0.12)' : 'rgba(255,255,255,0.04)',
                      border:     active ? '2px solid rgba(0,168,204,0.55)' : '2px solid rgba(255,255,255,0.07)',
                      boxShadow:  active ? '0 0 24px rgba(0,168,204,0.18)' : 'none',
                      minHeight:  '104px',
                    }}
                    aria-pressed={active}>
                    <div style={{ color: active ? '#00d4ff' : 'rgba(255,255,255,0.35)' }}>{v.svg}</div>
                    <span className="text-[13px] font-bold text-center leading-tight"
                      style={{ color: active ? '#00d4ff' : 'rgba(255,255,255,0.7)' }}>
                      {v.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {vehicle && (
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {VEHICLES.find(v => v.key === vehicle)?.sub}
              </p>
            )}
          </div>

          {/* Step 2 */}
          <div ref={svcRef}>
            <div className="px-5 pt-5 pb-1">
              <StepHeader n={2} label="Choose a service" done={!!selected} active={!!vehicle && !selected} />
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-cyan-400" /></div>
            ) : !vehicle ? (
              <div className="px-5 pb-6 text-center">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>← Select your vehicle first</p>
              </div>
            ) : !hasItems ? (
              <div className="px-5 pb-5 text-center"><p className="text-sm text-gray-600">No services available yet.</p></div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto">
                {allItems.map(({ item, isPackage }) => (
                  <SvcRow key={`${isPackage ? 'p' : 's'}-${item.id}`}
                    item={item} vehicle={vehicle}
                    selected={selected?.item.id === item.id && selected?.isPackage === isPackage}
                    onSelect={(i) => handleSelect(i, isPackage)}
                    popular={item.isMostPopular || item.isFeatured}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-5 py-5"
            style={{
              borderTop:  '1px solid rgba(255,255,255,0.07)',
              background: canBook ? 'rgba(0,168,204,0.05)' : 'transparent',
            }}>

            {canBook && (
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {selected.item.name} · {vehicle}
                  </div>
                  <div className="text-[34px] font-black leading-none" style={{
                    background: GOLD,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    {price ? `$${price}` : 'Custom'}
                  </div>
                  <div className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Final price confirmed at service
                  </div>
                </div>
                {fmtDur(selected.item.estimatedDuration) && (
                  <div className="text-right pb-1">
                    <div className="text-[11px] text-gray-600 mb-0.5">Duration</div>
                    <div className="text-sm font-bold text-white">{fmtDur(selected.item.estimatedDuration)}</div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!vehicle}
              className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-black text-base tracking-wide transition-all duration-200 disabled:opacity-30 active:scale-[0.98]"
              style={{
                background: vehicle ? GOLD : 'rgba(255,255,255,0.05)',
                color:      vehicle ? '#0b0f1a' : 'rgba(255,255,255,0.3)',
                minHeight:  '60px',
                boxShadow:  vehicle ? '0 4px 24px rgba(0,168,204,0.35)' : 'none',
              }}>
              {!vehicle
                ? 'Select a vehicle to start'
                : canBook
                  ? <>Book Now{price ? ` — $${price}` : ''} <ArrowRight className="w-5 h-5" /></>
                  : <>Continue to Booking <ArrowRight className="w-5 h-5" /></>}
            </button>

            {vehicle && (
              <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No payment required to book · SMS confirmation
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default InstantQuote;
