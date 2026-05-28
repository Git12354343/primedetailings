import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, CheckCircle, ChevronLeft, ChevronRight, Loader2,
  Calendar, Shield, Car, Truck, Users, Zap, Sparkles,
  DollarSign, Clock, Star, Package, Wrench
} from 'lucide-react';
import { useBookingFormValidation } from '../hooks/useFormValidation';
import { useNotifications } from '../components/NotificationSystem';
import ErrorBoundary from '../components/ErrorBoundary';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import useServicesCache from '../hooks/useServicesCache';

const VEHICLE_OPTIONS = [
  { value: 'Sedan', label: 'Sedan',  icon: Car,   desc: 'Standard & compact' },
  { value: 'SUV',   label: 'SUV',    icon: Users, desc: 'SUV & crossover' },
  { value: 'Truck', label: 'Truck',  icon: Truck, desc: 'Pickup truck' },
  { value: 'Coupe', label: 'Coupe',  icon: Zap,   desc: 'Sports & coupe' },
];
const GOLD  = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const STEPS = [
  { number: 1, label: 'Vehicle & Services', icon: Sparkles },
  { number: 2, label: 'Date & Time',        icon: Calendar },
  { number: 3, label: 'Info & Confirm',     icon: Shield },
];

// ── helpers ──────────────────────────────────────────────────────────────────
const Tick = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const getMinPrice = (p) => {
  const v = Object.values(p || {}).filter(x => x > 0);
  return v.length ? Math.min(...v) : null;
};
const getPkgPrice = (pkg, vehicle) => {
  if (!pkg?.pricing) return null;
  if (vehicle && pkg.pricing[vehicle] > 0) return pkg.pricing[vehicle];
  return getMinPrice(pkg.pricing);
};
const fmtDur = (m) => {
  if (!m) return null;
  const h = Math.floor(m / 60), min = m % 60;
  return h ? (min ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
};
const iStyle = (err) => ({
  display: 'block', width: '100%', padding: '12px 16px',
  borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#fff',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
});
// Strip hasError/error before spreading onto DOM elements
const safeProps = ({ hasError, error, ...rest }) => rest;

// ── StepBar ───────────────────────────────────────────────────────────────────
const StepBar = ({ current, confirmed }) => (
  <div className="flex items-center justify-center mb-10 px-4">
    {STEPS.map((s, i) => {
      const done = current > s.number || confirmed;
      const active = current === s.number && !confirmed;
      const Icon = s.icon;
      return (
        <React.Fragment key={s.number}>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: done || active ? GOLD : 'rgba(255,255,255,0.07)',
                border: active ? '2px solid #f5d376' : '2px solid transparent',
                boxShadow: active ? '0 0 20px rgba(201,168,76,0.4)' : 'none',
              }}>
              {done ? <CheckCircle className="w-5 h-5 text-black" />
                    : <Icon className="w-5 h-5" style={{ color: active ? '#0a0a0a' : '#4b5563' }} />}
            </div>
            <span className="text-xs mt-1.5 font-medium hidden sm:block"
              style={{ color: active ? '#f5d376' : done ? '#a0a0a0' : '#4b5563' }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-2 mb-5 transition-all duration-500"
              style={{ background: current > s.number ? GOLD : 'rgba(255,255,255,0.1)' }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── PackageCard ───────────────────────────────────────────────────────────────
const PackageCard = ({ pkg, vehicle, selected, onSelect, svcMap, addonMap }) => {
  const price    = getPkgPrice(pkg, vehicle);
  const minPrice = getMinPrice(pkg.pricing);
  const dur      = fmtDur(pkg.estimatedDuration);
  const svcNames = (pkg.includedServices || []).map(id => svcMap[id]?.name).filter(Boolean);
  const addNames = (pkg.includedAddOns   || []).map(id => addonMap[id]?.name).filter(Boolean);
  const extra    = svcNames.length - 4;

  return (
    <div onClick={() => onSelect(pkg)}
      className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 group"
      style={{
        background: selected ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
        border: selected ? '2px solid rgba(201,168,76,0.5)' : '2px solid rgba(255,255,255,0.08)',
        boxShadow: selected ? '0 0 30px rgba(201,168,76,0.15)' : 'none',
        transform: selected ? 'translateY(-2px)' : 'none',
      }}>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {pkg.isMostPopular && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: GOLD, color: '#0a0a0a' }}>
            <Star className="w-3 h-3" /> Most Popular
          </span>
        )}
        {pkg.tagline && <span className="text-xs text-gray-400 italic">{pkg.tagline}</span>}
      </div>

      {/* Name */}
      <h3 className="text-white font-bold text-lg mb-1 group-hover:text-yellow-300 transition-colors">
        {pkg.name}
      </h3>
      {pkg.description && (
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{pkg.description}</p>
      )}

      {/* Included */}
      {svcNames.slice(0, 4).map(n => (
        <div key={n} className="flex items-center gap-2 mb-1.5">
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
            <Tick />
          </div>
          <span className="text-gray-300 text-sm">{n}</span>
        </div>
      ))}
      {extra > 0 && <span className="text-gray-500 text-xs pl-6 block mb-2">+{extra} more</span>}

      {addNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
          {addNames.slice(0, 3).map(n => (
            <span key={n} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(96,165,250,0.1)', color: '#93c5fd' }}>
              + {n}
            </span>
          ))}
        </div>
      )}

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          {pkg.requiresQuote ? (
            <div className="text-yellow-400 font-bold text-sm">Custom Quote</div>
          ) : (
            <>
              <div className="text-2xl font-black" style={{
                background: GOLD, WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {vehicle && price ? `$${price}` : minPrice ? `From $${minPrice}` : 'Call'}
              </div>
              {!vehicle && <div className="text-gray-500 text-xs">Select vehicle for exact price</div>}
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {dur && (
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock className="w-3 h-3" /> {dur}
            </div>
          )}
          <div className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{
              background: selected ? GOLD : 'rgba(201,168,76,0.1)',
              color: selected ? '#0a0a0a' : '#f5d376',
              border: selected ? 'none' : '1px solid rgba(201,168,76,0.25)',
            }}>
            {selected ? '✓ Selected' : 'Select'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── BookingSummary ─────────────────────────────────────────────────────────────
const BookingSummary = ({ mode, pkg, values, services, addOns, pricing }) => {
  const selSvcs = services.filter(s => (values.services || []).includes(String(s.id)));
  const selAdds = addOns.filter(a => (values.addOns   || []).includes(String(a.id)));
  const pkgPrice = pkg ? getPkgPrice(pkg, values.vehicleType) : null;
  const total    = pkgPrice || (pricing?.total > 0 ? pricing.total : null);

  if (!values.vehicleType && !pkg && !selSvcs.length) return null;

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)' }}>
      <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">
        {mode === 'packages' && pkg ? pkg.name : 'Custom Detail'}
      </div>
      {values.vehicleType && (
        <div className="flex items-center gap-2 mb-2">
          <Car className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-white text-sm font-medium">{values.vehicleType}</span>
        </div>
      )}
      {mode === 'packages' && pkg ? (
        <>
          {(pkg.includedServices || []).length > 0 && (
            <p className="text-gray-400 text-xs mb-1">{pkg.includedServices.length} service(s) included</p>
          )}
          {pkg.estimatedDuration && (
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
              <Clock className="w-3 h-3" /> {fmtDur(pkg.estimatedDuration)} est.
            </div>
          )}
        </>
      ) : (
        <>
          {selSvcs.map(s => (
            <div key={s.id} className="flex items-center justify-between mb-1">
              <span className="text-gray-300 text-sm truncate pr-2">{s.name}</span>
              <span className="text-yellow-400 text-sm font-bold flex-shrink-0">
                {s.pricing?.[values.vehicleType] ? `$${s.pricing[values.vehicleType]}` : '—'}
              </span>
            </div>
          ))}
          {selAdds.map(a => (
            <div key={a.id} className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs truncate pr-2">+ {a.name}</span>
              <span className="text-green-400 text-xs font-bold flex-shrink-0">+${a.price}</span>
            </div>
          ))}
        </>
      )}
      {values.date && (
        <div className="flex items-center gap-2 mt-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-300 text-xs">
            {new Date(values.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
            {values.time && ` · ${values.time}`}
          </span>
        </div>
      )}
      {total > 0 && (
        <div className="flex items-center justify-between pt-3 mt-2"
          style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="text-gray-400 text-sm">{mode === 'packages' ? 'Package Price' : 'Estimate'}</span>
          <span className="text-xl font-black" style={{
            background: GOLD, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>${total}</span>
        </div>
      )}
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
const BookingForm = () => {
  const [step, setStep]                     = useState(1);
  const [confirmed, setConfirmed]           = useState(null);
  const [mode, setMode]                     = useState('packages');
  const [selectedPkg, setSelectedPkg]       = useState(null);
  const [pricing, setPricing]               = useState({ services: [], addOns: [], total: 0 });
  const [businessConfig, setBusinessConfig] = useState(null);
  const [availErr, setAvailErr]             = useState('');
  const [sms, setSms]                       = useState({ code: '', sent: false, attempts: 3 });
  const [apiLoading, setApiLoading]         = useState(false);
  const [showMobSum, setShowMobSum]         = useState(false);
  const topRef = useRef(null);

  const { services, addOns, packages, loading: pkgLoading } = useServicesCache();
  const { success, error: notifyErr } = useNotifications();

  const { values, errors, handleChange, getFieldProps } = useBookingFormValidation({
    displayName: '', email: '', phone: '',
    address: '', city: '', postalCode: '',
    vehicleType: '', make: '', model: '', year: '',
    services: [], addOns: [], date: '', time: '',
    specialInstructions: '',
  });

  const svcMap   = Object.fromEntries(services.map(s => [s.id, s]));
  const addonMap = Object.fromEntries(addOns.map(a => [a.id, a]));

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/availability/config`)
      .then(r => r.json()).then(d => { if (d.success) setBusinessConfig(d.config); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'custom' && values.vehicleType && (values.services.length || values.addOns.length)) {
      fetch(`${import.meta.env.VITE_API_URL}/services/calculate-pricing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: values.services, addOns: values.addOns, vehicleType: values.vehicleType }),
      }).then(r => r.json()).then(d => { if (d.success) setPricing(d.pricing); }).catch(() => {});
    } else if (mode === 'custom') {
      setPricing({ services: [], addOns: [], total: 0 });
    }
  }, [values.services, values.addOns, values.vehicleType, mode]);

  useEffect(() => {
    if (!values.date || !values.time) return;
    fetch(`${import.meta.env.VITE_API_URL}/availability/check?date=${values.date}&time=${encodeURIComponent(values.time)}`)
      .then(r => r.json()).then(d => {
        if (!d.available) setAvailErr(d.reason || 'Slot unavailable');
        else setAvailErr('');
      }).catch(() => {});
  }, [values.date, values.time]);

  const canProceed = () => {
    if (step === 1) {
      if (!values.vehicleType) return false;
      return mode === 'packages' ? !!selectedPkg : values.services.length > 0;
    }
    if (step === 2) return values.date && values.time && !availErr;
    if (step === 3) return values.phone &&
                          values.address && values.city && values.postalCode &&
                          values.make && values.model && values.year;
    return false;
  };

  const nextStep = async () => {
    if (!canProceed()) return;
    if (step === 3) { await sendCode(); return; }
    setStep(s => s + 1); topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendCode = async () => {
    setApiLoading(true);
    try {
      const pkgPrice  = mode === 'packages' && selectedPkg ? getPkgPrice(selectedPkg, values.vehicleType) : null;
      const total     = pkgPrice || pricing.total || null;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: values.phone,
          bookingData: { ...values, firstName: values.displayName?.split(' ')[0] || 'Customer', lastName: values.displayName?.split(' ').slice(1).join(' ') || '', packageId: selectedPkg?.id || null, packageName: selectedPkg?.name || null, totalPrice: total },
        }),
      });
      const d = await res.json();
      if (d.success) { setSms(p => ({ ...p, sent: true })); success('Code sent!'); if (d.devCode) notifyErr(`DEV: ${d.devCode}`, 10000); }
      else notifyErr(d.error || 'Failed to send code.');
    } catch { notifyErr('Network error.'); }
    finally { setApiLoading(false); }
  };

  const verifyCode = async () => {
    setApiLoading(true);
    try {
      const pkgPrice = mode === 'packages' && selectedPkg ? getPkgPrice(selectedPkg, values.vehicleType) : null;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: values.phone, code: sms.code,
          bookingData: { ...values, firstName: values.displayName?.split(' ')[0] || 'Customer', lastName: values.displayName?.split(' ').slice(1).join(' ') || '', packageId: selectedPkg?.id || null, packageName: selectedPkg?.name || null, totalPrice: pkgPrice || pricing.total || null },
        }),
      });
      const d = await res.json();
      if (d.success) { setConfirmed(d.booking); success('Booking confirmed!'); }
      else { setSms(p => ({ ...p, attempts: d.attemptsRemaining ?? p.attempts - 1 })); notifyErr(d.error || 'Invalid code.'); }
    } catch { notifyErr('Network error.'); }
    finally { setApiLoading(false); }
  };

  const toggleSvc = (id) => {
    const s = String(id), cur = values.services || [];
    handleChange('services', cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
  };
  const toggleAddon = (id) => {
    const a = String(id), cur = values.addOns || [];
    handleChange('addOns', cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a]);
  };
  const selectPkg = (pkg) => {
    const same = selectedPkg?.id === pkg.id;
    setSelectedPkg(same ? null : pkg);
    handleChange('services', same ? [] : (pkg.includedServices || []).map(String));
    handleChange('addOns',   same ? [] : (pkg.includedAddOns   || []).map(String));
  };
  const switchToCustom = () => {
    setMode('custom'); setSelectedPkg(null);
    handleChange('services', []); handleChange('addOns', []);
  };

  // ── CONFIRMED ─────────────────────────────────────────────────────────────
  if (confirmed) {
    const pkgP  = selectedPkg ? getPkgPrice(selectedPkg, values.vehicleType) : null;
    const total = pkgP || pricing.total;
    return (
      <div className="max-w-lg mx-auto text-center px-4 py-12">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: GOLD, boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}>
          <CheckCircle className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-400 mb-8">We'll see you soon. SMS confirmation sent.</p>
        <div className="rounded-2xl p-6 text-left mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Confirmation Code</div>
            <div className="text-3xl font-black tracking-widest" style={{
              background: GOLD, WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{confirmed.confirmationCode}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Date</span>
              <div className="text-white font-semibold">
                {new Date(confirmed.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Time</span>
              <div className="text-white font-semibold">{confirmed.time}</div>
            </div>
            {selectedPkg && (
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">Package</span>
                <div className="text-white font-semibold">{selectedPkg.name}</div>
              </div>
            )}
            {total > 0 && (
              <div>
                <span className="text-gray-500 text-xs">Estimate</span>
                <div className="text-yellow-400 font-bold">${total}</div>
              </div>
            )}
          </div>
        </div>
        <a href={`/lookup?code=${confirmed.confirmationCode}`}
          className="btn-ghost-luxury inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold">
          Track My Booking
        </a>
      </div>
    );
  }

  // ── STEP 1 ────────────────────────────────────────────────────────────────
  const step1 = (
    <div className="space-y-6">
      {/* Vehicle */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ background: GOLD }}>1</span>
          Your Vehicle
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VEHICLE_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
            const sel = values.vehicleType === value;
            return (
              <button key={value} onClick={() => handleChange('vehicleType', value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 active:scale-95"
                style={{
                  background: sel ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                  border: sel ? '2px solid rgba(201,168,76,0.5)' : '2px solid rgba(255,255,255,0.07)',
                  transform: sel ? 'translateY(-2px)' : 'none',
                  boxShadow: sel ? '0 8px 24px rgba(201,168,76,0.15)' : 'none',
                }}>
                <Icon className="w-7 h-7" style={{ color: sel ? '#f5d376' : '#6b7280' }} />
                <span className="text-sm font-bold" style={{ color: sel ? '#f5d376' : '#9ca3af' }}>{label}</span>
                <span className="text-xs text-gray-600">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode tabs */}
      <div>
        {/* Vehicle gate — prompt until a type is chosen */}
        {!values.vehicleType && (
          <div className="flex flex-col items-center justify-center py-10 rounded-2xl text-center"
            style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.25)' }}>
            <Car className="w-8 h-8 mb-3" style={{ color: 'rgba(201,168,76,0.5)' }} />
            <p className="text-sm font-semibold text-white mb-1">Select your vehicle type above</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>We'll show exact pricing once you pick a vehicle</p>
          </div>
        )}

        {/* Mode tabs — only visible once vehicle is chosen */}
        {values.vehicleType && (
          <>
            <div className="flex rounded-xl overflow-hidden mb-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[{ id: 'packages', label: 'Packages', icon: Package }, { id: 'custom', label: 'Build Your Own', icon: Wrench }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setMode(id); if (id === 'custom') switchToCustom(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all"
                  style={{ background: mode === id ? GOLD : 'transparent', color: mode === id ? '#0a0a0a' : '#6b7280' }}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

        {/* Packages */}
        {mode === 'packages' && (
          <div className="space-y-4">
            {pkgLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-yellow-500" /></div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">No packages available yet.</p>
                <button onClick={() => setMode('custom')} className="text-yellow-400 text-sm underline">Build custom →</button>
              </div>
            ) : (
              <>
                {packages.map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} vehicle={values.vehicleType}
                    selected={selectedPkg?.id === pkg.id} onSelect={selectPkg}
                    svcMap={svcMap} addonMap={addonMap} />
                ))}
                <div className="text-center pt-2 pb-1">
                  <p className="text-gray-500 text-sm mb-2">Don't see what you need?</p>
                  <button onClick={switchToCustom}
                    className="btn-ghost-luxury px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Customize My Detail
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Custom */}
        {mode === 'custom' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold text-sm">Choose Services</h4>
                {values.vehicleType && <span className="text-xs text-gray-500">Prices for {values.vehicleType}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map(s => {
                  const sel = (values.services || []).includes(String(s.id));
                  const p   = s.pricing?.[values.vehicleType];
                  const min = getMinPrice(s.pricing);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)}
                      className="flex items-center justify-between p-3.5 rounded-xl text-left transition-all active:scale-95"
                      style={{
                        background: sel ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                        border: sel ? '2px solid rgba(201,168,76,0.4)' : '2px solid rgba(255,255,255,0.07)',
                      }}>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: sel ? GOLD : 'rgba(255,255,255,0.1)', color: sel ? '#000' : '#fff' }}>
                          {sel && <Tick />}
                        </div>
                        <span className="text-sm font-semibold truncate" style={{ color: sel ? '#f5d376' : '#e5e7eb' }}>
                          {s.name}
                        </span>
                      </div>
                      <span className="text-sm font-black flex-shrink-0 ml-2" style={{
                        background: GOLD, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      }}>
                        {values.vehicleType && p ? `$${p}` : min ? `$${min}+` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {addOns.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold text-sm">Add-Ons</h4>
                  <span className="text-gray-500 text-xs">Optional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addOns.map(a => {
                    const sel = (values.addOns || []).includes(String(a.id));
                    return (
                      <button key={a.id} onClick={() => toggleAddon(a.id)}
                        className="flex items-center justify-between p-3 rounded-xl text-left transition-all"
                        style={{
                          background: sel ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)',
                          border: sel ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded flex items-center justify-center"
                            style={{ background: sel ? '#34d399' : 'rgba(255,255,255,0.08)', color: sel ? '#000' : '#fff' }}>
                            {sel && <Tick />}
                          </div>
                          <span className="text-sm" style={{ color: sel ? '#6ee7b7' : '#9ca3af' }}>{a.name}</span>
                        </div>
                        <span className="text-xs font-bold text-green-400">+${a.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {pricing.total > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                <span className="text-gray-400 text-sm">Estimated Total</span>
                <span className="text-2xl font-black" style={{
                  background: GOLD, WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>${pricing.total}</span>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );

  // ── STEP 2 ────────────────────────────────────────────────────────────────
  const step2 = (
    <div className="space-y-6">
      <h3 className="text-white font-bold text-sm mb-2">Pick a Date</h3>
      <AvailabilityCalendar selectedDate={values.date} businessConfig={businessConfig}
        onDateSelect={(d) => { handleChange('date', d); handleChange('time', ''); setAvailErr(''); }} />
      {values.date && (
        <>
          <h3 className="text-white font-bold text-sm mt-6 mb-2">Pick a Time</h3>
          <TimeSlotPicker selectedDate={values.date} selectedTime={values.time}
            businessConfig={businessConfig}
            onTimeSelect={(t) => handleChange('time', t)} />
        </>
      )}
      {availErr && (
        <div className="p-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {availErr}
        </div>
      )}
    </div>
  );

  // ── STEP 3 ────────────────────────────────────────────────────────────────
  const step3 = !sms.sent ? (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-bold text-sm mb-4">Your Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Name or Nickname <span className="text-gray-600 normal-case font-normal">— optional</span>
              </label>
              <input style={iStyle(false)} placeholder="How should we call you?" {...safeProps(getFieldProps('displayName'))} />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[['phone','Phone','tel','(438) 796-8001'],['email','Email','email','you@email.com']].map(([f,l,t,p]) => (
            <div key={f}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{l}{f==='phone'?' *':''}</label>
              <input style={iStyle(errors[f])} type={t} placeholder={p} {...safeProps(getFieldProps(f))} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-white font-bold text-sm mb-4">Service Address</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Street Address *</label>
            <input style={iStyle(errors.address)} placeholder="123 Main St" {...safeProps(getFieldProps('address'))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['city','City','Montreal'],['postalCode','Postal Code','H2X 1Y4']].map(([f,l,p]) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{l} *</label>
                <input style={iStyle(errors[f])} placeholder={p} {...safeProps(getFieldProps(f))} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-white font-bold text-sm mb-4">Vehicle Details</h3>
        <div className="grid grid-cols-3 gap-3">
          {[['make','Make','text','BMW'],['model','Model','text','3 Series'],['year','Year','number','2022']].map(([f,l,t,p]) => (
            <div key={f}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{l} *</label>
              <input style={iStyle(errors[f])} type={t} placeholder={p} {...safeProps(getFieldProps(f))} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Special Instructions <span className="text-gray-600 normal-case font-normal">— optional</span>
        </label>
        <textarea style={{ ...iStyle(false), resize: 'none' }} rows={3}
          placeholder="Gate code, parking, specific concerns..."
          {...safeProps(getFieldProps('specialInstructions'))} />
      </div>
    </div>
  ) : (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
        <Phone className="w-8 h-8 text-yellow-400" />
      </div>
      <h3 className="text-white font-black text-xl mb-2">Verify Your Number</h3>
      <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
        We sent a 6-digit code to <span className="text-white font-semibold">{values.phone}</span>
      </p>
      <div className="max-w-xs mx-auto mb-6">
        <input type="text" inputMode="numeric" value={sms.code}
          onChange={e => setSms(p => ({ ...p, code: e.target.value.replace(/\D/g,'').slice(0,6) }))}
          style={{ ...iStyle(false), textAlign: 'center', fontSize: '28px', fontWeight: 900, letterSpacing: '0.4em', padding: '16px', border: '2px solid rgba(201,168,76,0.3)', color: '#f5d376' }}
          placeholder="000000" maxLength={6} />
        <div className="flex justify-between text-xs text-gray-600 mt-2 px-1">
          <span>{sms.attempts} attempts remaining</span>
          <span>Expires in 10 min</span>
        </div>
      </div>
      <button onClick={verifyCode} disabled={apiLoading || sms.code.length !== 6}
        className="btn-luxury w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold tracking-wide disabled:opacity-40">
        {apiLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><Shield className="w-5 h-5" /> Confirm Booking</>}
      </button>
      <button onClick={sendCode} disabled={apiLoading} className="mt-4 text-gray-500 text-sm hover:text-yellow-400 transition-colors">
        Resend code
      </button>
    </div>
  );

  const content  = [step1, step2, step3][step - 1];
  const sumProps = { mode, pkg: selectedPkg, values, services, addOns, pricing };
  const hasSel   = values.vehicleType || selectedPkg || values.services?.length > 0;

  return (
    <ErrorBoundary>
      <div ref={topRef} className="max-w-6xl mx-auto px-4 py-8" style={{ minHeight: '100vh' }}>
        <StepBar current={step} confirmed={!!confirmed} />
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {content}
              {!sms.sent && (
                <div className="flex justify-between mt-10 pt-6"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={() => { setStep(s => Math.max(1, s-1)); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={nextStep} disabled={!canProceed() || apiLoading}
                    className="btn-luxury flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold tracking-wide disabled:opacity-40 group">
                    {apiLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {step === 3 ? 'Sending...' : 'Loading...'}</>
                      : <>{step === 3 ? 'Send Code & Confirm' : 'Continue'} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasSel && (
            <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24">
              <BookingSummary {...sumProps} />
              <div className="mt-4 space-y-1.5">
                {['Free cancellation 24h before','SMS confirmation instantly','We come to your location','Insured & certified detailers'].map(t => (
                  <div key={t} className="text-xs text-gray-500 flex items-center gap-2">
                    <span style={{ color: '#c9a84c' }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bar */}
      {hasSel && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{ background: 'rgba(8,8,8,0.97)', borderTop: '1px solid rgba(201,168,76,0.2)', backdropFilter: 'blur(20px)' }}>
          {showMobSum && <div className="px-4 pt-4 pb-2"><BookingSummary {...sumProps} /></div>}
          <div className="flex items-center gap-2 px-3 py-3">
            <button onClick={() => setShowMobSum(s => !s)}
              className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
              {(() => {
                const p = selectedPkg ? getPkgPrice(selectedPkg, values.vehicleType) : null;
                const t = p || (pricing.total > 0 ? pricing.total : null);
                return t ? <span style={{ color: '#f5d376', fontWeight: 800 }}>${t}</span> : null;
              })()}
              <DollarSign className="w-4 h-4" />
            </button>
            <button onClick={nextStep} disabled={!canProceed() || apiLoading}
              className="btn-luxury flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-wide disabled:opacity-40">
              {apiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : step < 3 ? <>Continue <ChevronRight className="w-4 h-4" /></>
                : sms.sent ? <><Shield className="w-4 h-4" /> Confirm</>
                : <><Phone className="w-4 h-4" /> Send Code</>}
            </button>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom)', background: 'rgba(8,8,8,0.97)' }} />
        </div>
      )}
    </ErrorBoundary>
  );
};

export default BookingForm;
