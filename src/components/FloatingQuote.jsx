import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X, ChevronRight, Zap } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';
const HIDDEN_ROUTES = ['/booking', '/detailer-login', '/detailer-dashboard', '/admin'];

const VEHICLES = [
  { id: 'Sedan',  label: 'Sedan',  icon: '🚗' },
  { id: 'SUV',    label: 'SUV',    icon: '🚙' },
  { id: 'Truck',  label: 'Truck',  icon: '🛻' },
  { id: 'Coupe',  label: 'Coupe',  icon: '🏎️' },
];

const TIERS = [
  { id: 'essential', label: 'Essential', from: 89 },
  { id: 'premium',   label: 'Premium',   from: 149 },
  { id: 'elite',     label: 'Elite',     from: 249 },
];

// Vehicle multipliers
const V_MULT = { Sedan: 1, Coupe: 1, SUV: 1.2, Truck: 1.35 };

const FloatingQuote = () => {
  const [open, setOpen]       = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [tier, setTier]       = useState(null);
  const [shown, setShown]     = useState(false);
  const location = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;

  const price = vehicle && tier
    ? Math.round(TIERS.find(t => t.id === tier).from * V_MULT[vehicle])
    : null;

  const bookUrl = vehicle && tier
    ? `/booking?vehicle=${vehicle}&tier=${tier}`
    : '/booking';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)} />
      )}

      {/* Widget */}
      <div
        className="fixed bottom-24 right-4 z-50 transition-all duration-500"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        {/* Expanded panel */}
        {open && (
          <div className="mb-3 w-72 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(12,12,12,0.98)', border: '1px solid rgba(0,168,204,0.3)', backdropFilter: 'blur(20px)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Instant Quote</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Step 1 — Vehicle */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: 'rgba(0,168,204,0.7)' }}>
                  1. Your vehicle
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {VEHICLES.map(v => (
                    <button key={v.id} onClick={() => setVehicle(v.id)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-center transition-all active:scale-95"
                      style={{
                        background: vehicle === v.id ? 'rgba(0,168,204,0.12)' : 'rgba(255,255,255,0.04)',
                        border: vehicle === v.id ? '1px solid rgba(0,168,204,0.45)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{v.icon}</span>
                      <span className="text-xs font-medium" style={{ color: vehicle === v.id ? '#00d4ff' : 'rgba(255,255,255,0.5)' }}>
                        {v.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 — Tier */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: 'rgba(0,168,204,0.7)' }}>
                  2. Service tier
                </p>
                <div className="space-y-1.5">
                  {TIERS.map(t => (
                    <button key={t.id} onClick={() => setTier(t.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
                      style={{
                        background: tier === t.id ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.04)',
                        border: tier === t.id ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <span className="text-sm font-medium" style={{ color: tier === t.id ? '#00d4ff' : 'rgba(255,255,255,0.7)' }}>
                        {t.label}
                      </span>
                      <span className="text-xs font-bold" style={{ color: GOLD_S }}>
                        from ${t.from}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              {price ? (
                <Link to={bookUrl}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-black font-bold text-sm"
                  style={{ background: GOLD, boxShadow: '0 0 20px rgba(0,168,204,0.3)' }}>
                  <div>
                    <div className="font-black">Book for ~${price}</div>
                    <div className="text-xs opacity-70 font-medium">Exact price at checkout</div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {!vehicle ? 'Pick a vehicle above ↑' : 'Pick a tier above ↑'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pill button */}
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all active:scale-95"
          style={{
            background: open ? 'rgba(20,20,20,0.95)' : GOLD,
            border: open ? '1px solid rgba(0,168,204,0.3)' : 'none',
            color: open ? GOLD_S : '#0b0f1a',
            boxShadow: '0 4px 30px rgba(0,168,204,0.4)',
          }}>
          <Zap className="w-4 h-4" />
          <span className="text-sm font-bold">{open ? 'Close' : 'Get a Quote'}</span>
        </button>
      </div>
    </>
  );
};

export default FloatingQuote;
