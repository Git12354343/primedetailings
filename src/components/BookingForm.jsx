// src/components/BookingForm.jsx
// Pre-fill patch integrated: reads location.state.prefilled from InstantQuote,
// starts on step 2 when data is pre-filled.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import useServicesCache from '../hooks/useServicesCache';
import useBookingFormValidation from '../hooks/useFormValidation';
import { useNotifications } from '../hooks/useNotifications';
import AvailabilityCalendar from './AvailabilityCalendar';
import TimeSlotPicker from './TimeSlotPicker';
import ErrorBoundary from './ErrorBoundary';
import {
  Car, Users, Truck, CheckCircle, ChevronRight, ChevronLeft,
  Loader2, Package, Shield, Clock, MapPin, Phone, Mail, User,
  ChevronDown, ChevronUp, Star, AlertTriangle,
} from 'lucide-react';

const GOLD   = 'linear-gradient(135deg,#00a8cc,#00d4ff)';
const GOLD_S = '#00a8cc';

// ── Constants ─────────────────────────────────────────────────────────────────
const VEHICLE_OPTIONS = [
  { value: 'Sedan', labelKey: 'booking.vehSedan', descKey: 'booking.vehDescSedan', icon: Car   },
  { value: 'SUV',   labelKey: 'booking.vehSUV',   descKey: 'booking.vehDescSUV',   icon: Users },
  { value: 'Truck', labelKey: 'booking.vehTruck',  descKey: 'booking.vehDescTruck', icon: Truck },
];
const CONDITION_OPTIONS = [
  { value: 'LIGHT',    labelKey: 'booking.condLight',    descKey: 'booking.condLightDesc'    },
  { value: 'MODERATE', labelKey: 'booking.condModerate', descKey: 'booking.condModerateDesc' },
  { value: 'HEAVY',    labelKey: 'booking.condHeavy',    descKey: 'booking.condHeavyDesc'    },
];
const PROPERTY_OPTIONS = [
  { value: 'house',      key: 'booking.propHouse'      },
  { value: 'condo',      key: 'booking.propCondo'      },
  { value: 'apartment',  key: 'booking.propApartment'  },
  { value: 'commercial', key: 'booking.propCommercial' },
  { value: 'other',      key: 'booking.propOther'      },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPkgPrice = (pkg, vehicleType) => {
  if (!pkg || !vehicleType) return null;
  const p = pkg.pricing?.[vehicleType];
  if (p && Number(p) > 0) return Number(p);
  const vals = Object.values(pkg.pricing || {}).filter(v => Number(v) > 0);
  return vals.length ? Math.min(...vals.map(Number)) : null;
};

const iStyle = (hasError = false) => ({
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
  color: '#fff', outline: 'none', fontSize: '14px',
});

// Strip ref from getFieldProps to avoid React warnings
const safeProps = ({ ref: _ref, ...rest }) => rest;

// ── StepBar ───────────────────────────────────────────────────────────────────
const StepBar = ({ current, confirmed }) => {
  const { t } = useTranslation();
  const steps = [t('booking.stepVehicle'), t('booking.stepDate'), t('booking.stepInfo')];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num    = i + 1;
        const done   = confirmed || current > num;
        const active = !confirmed && current === num;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                style={{
                  background: done ? GOLD_S : active ? GOLD : 'rgba(255,255,255,0.08)',
                  color: done || active ? '#0b0f1a' : '#6b7280',
                  boxShadow: active ? '0 0 16px rgba(0,168,204,0.4)' : 'none',
                }}>
                {done ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              <span className="text-xs font-medium hidden sm:block"
                style={{ color: active ? '#00d4ff' : done ? GOLD_S : '#6b7280' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-12 sm:w-20 mx-1 transition-all duration-300"
                style={{ background: current > num ? GOLD_S : 'rgba(255,255,255,0.1)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Booking Summary sidebar (desktop) ─────────────────────────────────────────
const BookingSummary = ({ pkg, values, services, addOns, pricing }) => {
  const { t } = useTranslation();
  const pkgPrice   = pkg ? getPkgPrice(pkg, values.vehicleType) : null;
  const total      = pkgPrice || pricing?.total || 0;
  const selServices = (values.services || []).map(id => services.find(s => String(s.id) === String(id))).filter(Boolean);
  const selAddOns   = (values.addOns   || []).map(id => addOns.find(a => String(a.id) === String(id))).filter(Boolean);

  return (
    <div className="rounded-2xl p-5 sticky top-24"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
        <Package className="w-4 h-4" style={{ color: GOLD_S }} /> Summary
      </h3>
      {values.vehicleType && (
        <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-gray-400 text-sm">{values.vehicleType}</span>
          {values.vehicleCondition && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {values.vehicleCondition}
            </span>
          )}
        </div>
      )}
      {pkg && (
        <div className="mb-2">
          <div className="text-white text-sm font-semibold">{pkg.name}</div>
          {pkgPrice && <div className="text-cyan-400 font-bold">${pkgPrice}</div>}
        </div>
      )}
      {selServices.map(s => (
        <div key={s.id} className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{s.name}</span>
          <span className="text-white">{s.pricing?.[values.vehicleType] ? `$${s.pricing[values.vehicleType]}` : ''}</span>
        </div>
      ))}
      {selAddOns.map(a => (
        <div key={a.id} className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">+ {a.name}</span>
          <span className="text-white">${a.price}</span>
        </div>
      ))}
      {total > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-gray-400 text-xs">{t('booking.estimatedTotal')}</span>
          <span className="text-xl font-black" style={{
            background: GOLD, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>${total}</span>
        </div>
      )}
      {values.date && values.time && (
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-xs text-gray-500">{values.date} · {values.time}</div>
        </div>
      )}
    </div>
  );
};

// ── Main BookingForm ──────────────────────────────────────────────────────────
const BookingForm = () => {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Pre-fill from InstantQuote ──────────────────────────────────────────────
  const prefilled = location.state?.prefilled || null;

  const [step,           setStep]           = useState(prefilled ? 2 : 1);
  const [confirmed,      setConfirmed]      = useState(null);
  const [mode,           setMode]           = useState(prefilled?.mode || 'packages');
  const [selectedPkg,    setSelectedPkg]    = useState(null);
  const [pricing,        setPricing]        = useState({ services: [], addOns: [], total: 0 });
  const [businessConfig, setBusinessConfig] = useState(null);
  const [availErr,       setAvailErr]       = useState('');
  const [sms,            setSms]            = useState({ code: '', sent: false, attempts: 3 });
  const [apiLoading,     setApiLoading]     = useState(false);
  const [showMobSum,     setShowMobSum]     = useState(false);
  const [showVehDetails, setShowVehDetails] = useState(false);
  const topRef = useRef(null);

  const { services, addOns, packages, loading: pkgLoading } = useServicesCache();
  const { success, error: notifyErr } = useNotifications();

  const { values, errors, handleChange, getFieldProps } = useBookingFormValidation({
    displayName:      '',
    email:            '',
    phone:            '',
    address:          '',
    city:             '',
    postalCode:       '',
    vehicleType:      prefilled?.vehicleType  || '',
    make:             '',
    model:            '',
    year:             '',
    vehicleCondition: prefilled?.vehicleCondition || 'MODERATE',
    propertyType:     '',
    hasWaterPower:    true,
    services:         prefilled?.services?.map(String) || [],
    addOns:           prefilled?.addOns?.map(String)   || [],
    date:             '',
    time:             '',
    specialInstructions: '',
  });

  // Load business config
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/availability/config`)
      .then(r => r.json()).then(d => { if (d.success) setBusinessConfig(d.config); })
      .catch(() => {});
  }, []);

  // Auto-select pre-filled package once packages load
  useEffect(() => {
    if (!prefilled?.packageId || !packages.length || selectedPkg) return;
    const pkg = packages.find(p => String(p.id) === String(prefilled.packageId));
    if (pkg && !pkg.requiresQuote) selectPkg(pkg);
  }, [packages.length]); // eslint-disable-line

  // Live pricing for custom mode
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

  // Availability check when date + time change
  useEffect(() => {
    if (!values.date || !values.time) return;
    fetch(`${import.meta.env.VITE_API_URL}/availability/check?date=${values.date}&time=${encodeURIComponent(values.time)}`)
      .then(r => r.json()).then(d => {
        if (!d.available) setAvailErr(d.reason || 'Slot unavailable');
        else setAvailErr('');
      }).catch(() => {});
  }, [values.date, values.time]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleQuoteRedirect = () => {
    const p = new URLSearchParams();
    if (values.vehicleType)      p.set('vehicleType', values.vehicleType);
    if (values.vehicleCondition) p.set('vehicleCondition', values.vehicleCondition);
    if (values.services?.length) p.set('services', values.services.join(','));
    if (values.addOns?.length)   p.set('addOns',   values.addOns.join(','));
    navigate('/quote?' + p.toString());
  };

  const hasQuoteRequired = mode === 'custom' && (
    (values.services || []).some(id => services.find(sv => String(sv.id) === String(id))?.requiresQuote) ||
    (values.addOns   || []).some(id => addOns.find(ad => String(ad.id) === String(id))?.requiresQuote)
  );

  const canProceed = () => {
    if (step === 1) {
      if (!values.vehicleType) return false;
      if (!values.vehicleCondition) return false;
      if (mode === 'custom' && hasQuoteRequired) return false;
      return mode === 'packages' ? !!selectedPkg : values.services.length > 0;
    }
    if (step === 2) return !!(values.date && values.time && !availErr);
    if (step === 3) return !!(values.phone && values.address && values.city && values.postalCode && values.propertyType && values.hasWaterPower !== null);
    return false;
  };

  const nextStep = async () => {
    if (!canProceed()) return;
    if (step === 3) { await sendCode(); return; }
    setStep(s => s + 1);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendCode = async () => {
    setApiLoading(true);
    try {
      const pkgPrice = mode === 'packages' && selectedPkg ? getPkgPrice(selectedPkg, values.vehicleType) : null;
      const total    = pkgPrice || pricing.total || null;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: values.phone,
          bookingData: {
            ...values,
            firstName:   values.displayName?.split(' ')[0]          || 'Customer',
            lastName:    values.displayName?.split(' ').slice(1).join(' ') || '',
            packageId:   selectedPkg?.id   || null,
            packageName: selectedPkg?.name || null,
            totalPrice:  total,
          },
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSms(p => ({ ...p, sent: true }));
        success('Code sent!');
        if (d.devCode) notifyErr(`DEV: ${d.devCode}`, 10000);
      } else {
        notifyErr(d.error || 'Failed to send code.');
      }
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
          phoneNumber: values.phone,
          code:        sms.code,
          bookingData: {
            ...values,
            firstName:   values.displayName?.split(' ')[0]          || 'Customer',
            lastName:    values.displayName?.split(' ').slice(1).join(' ') || '',
            packageId:   selectedPkg?.id   || null,
            packageName: selectedPkg?.name || null,
            totalPrice:  pkgPrice || pricing.total || null,
          },
        }),
      });
      const d = await res.json();
      if (d.success) {
        setConfirmed(d.booking);
        success('Booking confirmed!');
      } else {
        setSms(p => ({ ...p, attempts: d.attemptsRemaining ?? p.attempts - 1 }));
        notifyErr(d.error || 'Invalid code.');
      }
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
    if (pkg.requiresQuote) {
      navigate(`/quote?packageId=${pkg.id}&packageName=${encodeURIComponent(pkg.name)}`);
      return;
    }
    const same = selectedPkg?.id === pkg.id;
    setSelectedPkg(same ? null : pkg);
    handleChange('services', same ? [] : (pkg.includedServices || []).map(String));
    handleChange('addOns',   same ? [] : (pkg.includedAddOns   || []).map(String));
  };
  const switchToCustom = () => {
    setMode('custom'); setSelectedPkg(null);
    handleChange('services', []); handleChange('addOns', []);
  };

  // ── Confirmed screen ─────────────────────────────────────────────────────────
  if (confirmed) {
    const pkgP  = selectedPkg ? getPkgPrice(selectedPkg, values.vehicleType) : null;
    const total = pkgP || pricing.total;
    return (
      <div className="max-w-lg mx-auto text-center px-4 py-12">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: GOLD, boxShadow: '0 0 40px rgba(0,168,204,0.4)' }}>
          <CheckCircle className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">{t('booking.confirmedTitle')}</h2>
        <p className="text-gray-400 mb-8">{t('booking.confirmedSub')}</p>
        <div className="rounded-2xl p-6 text-left mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t('booking.confirmationCode')}</div>
            <div className="text-3xl font-black tracking-widest" style={{
              background: GOLD, WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{confirmed.confirmationCode}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">{t('booking.dateLabel')}</span>
              <div className="text-white font-semibold">
                {new Date(confirmed.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">{t('booking.timeLabel')}</span>
              <div className="text-white font-semibold">{confirmed.time}</div>
            </div>
            {selectedPkg && (
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">{t('booking.packageLabel')}</span>
                <div className="text-white font-semibold">{selectedPkg.name}</div>
              </div>
            )}
            {total > 0 && (
              <div>
                <span className="text-gray-500 text-xs">{t('booking.estimate')}</span>
                <div className="text-cyan-400 font-bold">${total}</div>
              </div>
            )}
          </div>
        </div>
        <a href={`/lookup?code=${confirmed.confirmationCode}`}
          className="btn-ghost-luxury inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold">
          {t('booking.trackMyBooking')} <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // ── STEP 1 — Vehicle & Services ───────────────────────────────────────────────
  const step1 = (
    <div className="space-y-8">
      {/* Vehicle type */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ background: GOLD }}>1</span>
          {t('booking.yourVehicle')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VEHICLE_OPTIONS.map(({ value, labelKey, icon: Icon, descKey }) => {
            const sel = values.vehicleType === value;
            return (
              <button key={value} onClick={() => handleChange('vehicleType', value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 active:scale-95"
                style={{
                  minHeight: '80px',
                  background: sel ? 'rgba(0,168,204,0.12)' : 'rgba(255,255,255,0.03)',
                  border: sel ? '2px solid rgba(0,168,204,0.5)' : '2px solid rgba(255,255,255,0.07)',
                  transform: sel ? 'translateY(-2px)' : 'none',
                  boxShadow: sel ? '0 8px 24px rgba(0,168,204,0.15)' : 'none',
                }}>
                <Icon className="w-7 h-7" style={{ color: sel ? '#00d4ff' : '#6b7280' }} />
                <span className="text-sm font-bold" style={{ color: sel ? '#00d4ff' : '#9ca3af' }}>{t(labelKey)}</span>
                <span className="text-xs text-gray-600 text-center">{t(descKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicle condition */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3">{t('booking.conditionTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CONDITION_OPTIONS.map(({ value, labelKey, descKey }) => {
            const sel = values.vehicleCondition === value;
            return (
              <button key={value} onClick={() => handleChange('vehicleCondition', value)}
                className="flex flex-col items-start gap-1 p-4 rounded-2xl text-left transition-all duration-200 active:scale-95"
                style={{
                  minHeight: '60px',
                  background: sel ? 'rgba(0,168,204,0.12)' : 'rgba(255,255,255,0.03)',
                  border: sel ? '2px solid rgba(0,168,204,0.5)' : '2px solid rgba(255,255,255,0.07)',
                }}>
                <span className="text-sm font-bold" style={{ color: sel ? '#00d4ff' : '#9ca3af' }}>{t(labelKey)}</span>
                <span className="text-xs text-gray-500">{t(descKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service selection */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ background: GOLD }}>2</span>
          {t('booking.chooseServices')}
        </h3>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          {[['packages', t('booking.modePackages')], ['custom', t('booking.modeCustom')]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); if (m === 'packages') { setSelectedPkg(null); handleChange('services', []); handleChange('addOns', []); } else switchToCustom(); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: mode === m ? 'rgba(0,168,204,0.15)' : 'rgba(255,255,255,0.04)',
                border:     mode === m ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color:      mode === m ? '#00d4ff' : 'rgba(255,255,255,0.5)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {pkgLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
        ) : mode === 'packages' ? (
          <div className="space-y-3">
            {packages.filter(p => p.isActive !== false).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">{t('booking.noPackages')}</p>
            ) : (
              packages.filter(p => p.isActive !== false).map(pkg => {
                const price = getPkgPrice(pkg, values.vehicleType);
                const sel   = selectedPkg?.id === pkg.id;
                return (
                  <button key={pkg.id} onClick={() => selectPkg(pkg)}
                    className="relative w-full text-left p-4 rounded-2xl transition-all duration-200 active:scale-[0.99]"
                    style={{
                      background: sel ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.03)',
                      border:     sel ? '2px solid rgba(0,168,204,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {pkg.isMostPopular && (
                      <span className="absolute -top-2.5 left-3 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: GOLD, color: '#0b0f1a' }}>
                        {t('booking.mostPopular')}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold">{pkg.name}</p>
                        {pkg.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{pkg.description}</p>}
                        {pkg.requiresQuote && (
                          <p className="text-amber-400 text-xs mt-1 font-semibold">{t('booking.customQuote')}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!pkg.requiresQuote && values.vehicleType && price ? (
                          <span className="text-lg font-black" style={{
                            background: GOLD, WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                          }}>${price}</span>
                        ) : (!pkg.requiresQuote && !values.vehicleType) ? (
                          <span className="text-xs text-gray-500">{t('booking.selectVehicleForPrice')}</span>
                        ) : null}
                        {sel && !pkg.requiresQuote && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: GOLD_S }}>
                            <CheckCircle className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            <button onClick={switchToCustom} className="text-xs text-gray-500 hover:text-cyan-400 transition-colors pt-1">
              {t('booking.buildCustomArrow')}
            </button>
          </div>
        ) : (
          /* Custom / à la carte */
          <div className="space-y-4">
            {!values.vehicleType && (
              <p className="text-gray-500 text-sm text-center py-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {t('booking.gateTitle')}
              </p>
            )}
            {values.vehicleType && services.filter(s => s.isActive !== false).map(svc => {
              const price = svc.pricing?.[values.vehicleType];
              const sel   = (values.services || []).includes(String(svc.id));
              return (
                <button key={svc.id} onClick={() => toggleSvc(svc.id)}
                  className="flex items-center justify-between w-full p-3.5 rounded-xl transition-all active:scale-[0.99]"
                  style={{
                    background: sel ? 'rgba(0,168,204,0.08)' : 'rgba(255,255,255,0.02)',
                    border:     sel ? '1px solid rgba(0,168,204,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    minHeight:  '48px',
                  }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: sel ? GOLD_S : 'rgba(255,255,255,0.08)', border: sel ? 'none' : '1px solid rgba(255,255,255,0.15)' }}>
                      {sel && <CheckCircle className="w-3 h-3 text-black" />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-white text-sm font-medium">{svc.name}</span>
                      {svc.requiresQuote && <span className="ml-2 text-amber-400 text-xs">(quote required)</span>}
                    </div>
                  </div>
                  {price > 0 ? (
                    <span className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: '#00d4ff' }}>${price}</span>
                  ) : (
                    <span className="text-xs text-gray-600 flex-shrink-0 ml-3">Custom</span>
                  )}
                </button>
              );
            })}
            {/* Add-ons */}
            {values.vehicleType && addOns.filter(a => a.isActive !== false).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 mt-5">
                  {t('booking.addOnsTitle')} <span className="normal-case font-normal">{t('booking.optionalWord')}</span>
                </h4>
                <div className="space-y-2">
                  {addOns.filter(a => a.isActive !== false).map(addon => {
                    const sel = (values.addOns || []).includes(String(addon.id));
                    return (
                      <button key={addon.id} onClick={() => toggleAddon(addon.id)}
                        className="flex items-center justify-between w-full p-3 rounded-xl transition-all active:scale-[0.99]"
                        style={{
                          background: sel ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                          border:     sel ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.06)',
                          minHeight:  '44px',
                        }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: sel ? '#34d399' : 'rgba(255,255,255,0.08)', border: sel ? 'none' : '1px solid rgba(255,255,255,0.15)' }}>
                            {sel && <CheckCircle className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-sm text-white truncate">{addon.name}</span>
                        </div>
                        <span className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: '#34d399' }}>+${addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote-required warning */}
        {hasQuoteRequired && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">One or more selections require a custom quote. Clicking Continue will redirect you to the quote form.</p>
          </div>
        )}
      </div>

      {/* Optional vehicle details — collapsed by default to keep step 1 short */}
      <div>
        <button onClick={() => setShowVehDetails(s => !s)}
          className="flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: showVehDetails ? '#00d4ff' : 'rgba(255,255,255,0.45)' }}>
          {showVehDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {t('booking.vehicleDetails')} <span className="text-gray-600 normal-case font-normal text-xs">{t('booking.optionalSuffix')}</span>
        </button>
        {showVehDetails && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[['make',t('booking.make'),'text','BMW'],['model',t('booking.model'),'text','3 Series'],['year',t('booking.year'),'number','2022']].map(([f,l,typ,p]) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{l}</label>
                <input style={iStyle(errors[f])} type={typ} placeholder={p} {...safeProps(getFieldProps(f))} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── STEP 2 — Date & Time ──────────────────────────────────────────────────────
  const step2 = (
    <div className="space-y-6">
      {/* Pre-fill summary banner (shown when coming from InstantQuote) */}
      {prefilled && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(0,168,204,0.07)', border: '1px solid rgba(0,168,204,0.2)' }}>
          <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-white font-semibold">{prefilled.vehicleType}</span>
            {prefilled.packageName && <> · <span className="text-cyan-300">{prefilled.packageName}</span></>}
            {prefilled.totalPrice  && <> · <span className="text-cyan-400 font-bold">${prefilled.totalPrice}</span></>}
            <span className="text-gray-500 ml-1 text-xs">selected</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-white font-bold text-sm mb-3">{t('booking.pickDate')}</h3>
        <AvailabilityCalendar
          selectedDate={values.date}
          onDateSelect={(d) => { handleChange('date', d); handleChange('time', ''); }}
          config={businessConfig}
        />
      </div>
      {values.date && (
        <div>
          <h3 className="text-white font-bold text-sm mb-3">{t('booking.pickTime')}</h3>
          <TimeSlotPicker
            selectedTime={values.time}
            selectedDate={values.date}
            onTimeSelect={(time) => handleChange('time', time)}
            config={businessConfig}
          />
        </div>
      )}
      {availErr && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {availErr}
        </div>
      )}
    </div>
  );

  // ── STEP 3 — Contact info ─────────────────────────────────────────────────────
  const step3 = !sms.sent ? (
    <div className="space-y-6">
      {/* Name + email */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3">{t('booking.yourInformation')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {t('booking.fullName')} *
            </label>
            <input style={iStyle(errors.displayName)} placeholder="Jean Tremblay" {...safeProps(getFieldProps('displayName'))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('booking.email')} *
              </label>
              <input style={iStyle(errors.email)} type="email" placeholder="jean@email.com" {...safeProps(getFieldProps('email'))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('booking.phone')} *
              </label>
              <input style={iStyle(errors.phone)} type="tel" placeholder="(514) 555-0000" {...safeProps(getFieldProps('phone'))} />
            </div>
          </div>
        </div>
      </div>

      {/* Service address */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3">{t('booking.serviceAddress')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('booking.address')} *</label>
            <input style={iStyle(errors.address)} placeholder="123 Rue Sainte-Catherine" {...safeProps(getFieldProps('address'))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('booking.city')} *</label>
              <input style={iStyle(errors.city)} placeholder="Montréal" {...safeProps(getFieldProps('city'))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('booking.postalCode')} *</label>
              <input style={iStyle(errors.postalCode)} placeholder="H2X 1Y5" {...safeProps(getFieldProps('postalCode'))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('booking.propertyType')} *</label>
            <select style={iStyle(false)} value={values.propertyType} onChange={e => handleChange('propertyType', e.target.value)}>
              <option value="" disabled style={{ background: '#111827' }}>{t('booking.selectEllipsis')}</option>
              {PROPERTY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#111827' }}>{t(opt.key)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('booking.waterPowerQuestion')} *</label>
            <div className="flex gap-3">
              {[[t('booking.waterPowerYes'), true], [t('booking.waterPowerNo'), false]].map(([lbl, val]) => {
                const sel = values.hasWaterPower === val;
                return (
                  <button key={lbl} onClick={() => handleChange('hasWaterPower', val)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{
                      minHeight:  '44px',
                      background: sel ? (val ? GOLD : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                      border:     sel ? '2px solid rgba(0,168,204,0.5)' : '2px solid rgba(255,255,255,0.07)',
                      color:      sel ? (val ? '#0b0f1a' : '#fff') : '#9ca3af',
                    }}>
                    {lbl}
                  </button>
                );
              })}
            </div>
            {values.hasWaterPower === false && (
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('booking.waterPowerNoHint')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Special instructions */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          {t('booking.special')} <span className="normal-case font-normal">{t('booking.optionalSuffix')}</span>
        </label>
        <textarea style={{ ...iStyle(false), resize: 'vertical', minHeight: '72px' }}
          placeholder={t('booking.specialHint')} {...safeProps(getFieldProps('specialInstructions'))} />
      </div>

      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('booking.smsNote')}</p>
    </div>
  ) : (
    /* SMS verify */
    <div className="max-w-sm mx-auto text-center space-y-6">
      <div>
        <h3 className="text-white font-bold text-lg mb-1">{t('booking.verifyTitle')}</h3>
        <p className="text-gray-400 text-sm">{t('booking.verifySubtitle')} <span className="text-white font-semibold">{values.phone}</span></p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('booking.verifyCode')}</label>
        <input
          style={{ ...iStyle(false), textAlign: 'center', fontSize: '2rem', fontWeight: '900', letterSpacing: '0.3em', color: '#00d4ff' }}
          type="text" inputMode="numeric" maxLength={6} placeholder="000000"
          value={sms.code}
          onChange={e => setSms(p => ({ ...p, code: e.target.value.replace(/\D/g,'') }))}
        />
        {sms.attempts < 3 && (
          <p className="text-xs text-amber-400 mt-2">{sms.attempts} attempt{sms.attempts !== 1 ? 's' : ''} remaining</p>
        )}
      </div>
      <button onClick={verifyCode} disabled={sms.code.length < 6 || apiLoading}
        className="btn-luxury w-full py-4 rounded-2xl text-base font-black tracking-wide disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ minHeight: '56px' }}>
        {apiLoading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirming…</>
          : <><Shield className="w-5 h-5" /> {t('booking.confirmBookingBtn')}</>}
      </button>
      <button onClick={sendCode} disabled={apiLoading} className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">
        {t('booking.resend')}
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

        {/* Mobile summary toggle */}
        {step > 1 && hasSel && (
          <button onClick={() => setShowMobSum(s => !s)}
            className="lg:hidden w-full flex items-center justify-between p-3 rounded-xl mb-4 text-sm"
            style={{ background: 'rgba(0,168,204,0.06)', border: '1px solid rgba(0,168,204,0.15)' }}>
            <span className="text-cyan-400 font-semibold text-xs uppercase tracking-wide">Your selection</span>
            {showMobSum ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        )}
        {showMobSum && step > 1 && (
          <div className="lg:hidden mb-4"><BookingSummary {...sumProps} /></div>
        )}

        <div className="flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl p-5 sm:p-7"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {content}

              {/* Nav buttons */}
              {!sms.sent && (
                <div className="flex justify-between mt-8 pt-6"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => { setStep(s => Math.max(1, s - 1)); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', minHeight: '44px' }}>
                    <ChevronLeft className="w-4 h-4" /> {t('booking.back')}
                  </button>
                  <button
                    onClick={step === 1 && hasQuoteRequired ? handleQuoteRedirect : nextStep}
                    disabled={!(step === 1 && hasQuoteRequired) && (!canProceed() || apiLoading)}
                    className="btn-luxury flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold tracking-wide disabled:opacity-40 group"
                    style={{
                      minHeight: '44px',
                      ...(step === 1 && hasQuoteRequired ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0b0f1a' } : {}),
                    }}>
                    {apiLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('booking.sending')}</>
                      : step === 1 && hasQuoteRequired
                        ? <>Request Quote <ChevronRight className="w-4 h-4" /></>
                        : step === 3
                          ? <>{t('booking.sendCode')} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                          : <>{t('booking.next')} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                  </button>
                </div>
              )}

              {/* Trust microcopy at the decision point */}
              {!sms.sent && (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                  {[t('booking.trustCancellation'), t('booking.trustLocation'), t('booking.trustInsured')].map(txt => (
                    <span key={txt} className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <CheckCircle className="w-3 h-3" style={{ color: 'rgba(0,212,255,0.5)' }} /> {txt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop summary sidebar */}
          {hasSel && (
            <div className="hidden lg:block w-72 flex-shrink-0">
              <BookingSummary {...sumProps} />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BookingForm;
