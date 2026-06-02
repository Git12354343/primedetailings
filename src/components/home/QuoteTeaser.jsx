// src/components/home/QuoteTeaser.jsx
// A SOFT estimate band — never an exact total. The visitor picks a vehicle
// type and a service; we show "Starting around $X" using the real minimum
// price from your dynamic services (useServicesCache). Copy reassures that
// the exact quote is confirmed at booking, so no one is scared off by a
// committed number.
//
// Pricing source: the same `pricing` map your Services page already uses.
// We deliberately show the LOWEST applicable price as a "starting at" anchor.
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, Truck, Zap, ArrowRight, Info } from 'lucide-react';
import useServicesCache from '../../hooks/useServicesCache';
import useInView from '../../hooks/useInView';

const VEHICLES = [
  { key: 'Sedan', label: 'Sedan', icon: Car },
  { key: 'SUV',   label: 'SUV',   icon: Users },
  { key: 'Truck', label: 'Truck', icon: Truck },
  { key: 'Coupe', label: 'Coupe', icon: Zap },
];

const QuoteTeaser = () => {
  const { services, loading } = useServicesCache();
  const [ref, visible] = useInView({ threshold: 0.2 });
  const [vehicle, setVehicle] = useState('Sedan');
  const [serviceId, setServiceId] = useState(null);

  // Active services that actually have pricing
  const priced = useMemo(
    () => (services || []).filter((s) => s.pricing && Object.values(s.pricing).some((v) => v > 0)),
    [services]
  );

  // Default to first service once loaded
  useEffect(() => {
    if (priced.length && serviceId == null) setServiceId(priced[0].id);
  }, [priced, serviceId]);

  const selected = priced.find((s) => s.id === serviceId);

  // "Starting at": the price for the chosen vehicle, or the min across vehicles.
  const startingAt = useMemo(() => {
    if (!selected?.pricing) return null;
    const forVehicle = selected.pricing[vehicle];
    if (forVehicle > 0) return forVehicle;
    const all = Object.values(selected.pricing).filter((v) => v > 0);
    return all.length ? Math.min(...all) : null;
  }, [selected, vehicle]);

  return (
    <section ref={ref} className="relative py-20" style={{ background: '#0b0f1a' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-7 sm:p-9 glass-card"
          style={{ transition: 'opacity .6s, transform .6s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)' }}>
          <div className="text-center mb-7">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Not sure what you need?</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Pick your vehicle and a service for a ballpark. No commitment — your exact quote is confirmed when you book.</p>
          </div>

          {/* Vehicle picker */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Your vehicle</label>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLES.map(({ key, label, icon: Icon }) => {
                const active = vehicle === key;
                return (
                  <button key={key} onClick={() => setVehicle(key)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                    style={{
                      background: active ? 'rgba(0,168,204,0.12)' : 'rgba(255,255,255,0.03)',
                      border: active ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    <Icon className="w-5 h-5" style={{ color: active ? '#00d4ff' : '#6b7280' }} />
                    <span className="text-xs font-bold" style={{ color: active ? '#00d4ff' : '#9ca3af' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service picker */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Service</label>
            <select
              value={serviceId ?? ''}
              onChange={(e) => setServiceId(Number(e.target.value))}
              disabled={loading || !priced.length}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {priced.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Estimate */}
          <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: 'rgba(0,168,204,0.05)', border: '1px solid rgba(0,168,204,0.15)' }}>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Starting around</div>
            <div className="text-4xl font-black" style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {loading ? '—' : startingAt ? `$${startingAt}` : 'Custom quote'}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs mt-2">
              <Info className="w-3.5 h-3.5" />
              Final price depends on your vehicle's size & condition
            </div>
          </div>

          <Link
            to={`/booking${serviceId ? `?service=${serviceId}&vehicle=${vehicle}` : ''}`}
            className="btn-luxury w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold tracking-wide group">
            Get my exact quote
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="text-center text-gray-600 text-xs mt-3">Free, no-obligation — takes about a minute</p>
        </div>
      </div>
    </section>
  );
};

export default QuoteTeaser;
