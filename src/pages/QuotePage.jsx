// src/pages/QuotePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Car, User, Phone, Mail, MapPin, CheckCircle,
  Loader2, ChevronRight, Info, Wrench, Home as HomeIcon,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import useServicesCache from '../hooks/useServicesCache';
import PhotoUpload from '../components/PhotoUpload';

const API    = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const GOLD   = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';

const VEHICLE_TYPES  = ['Sedan', 'SUV', 'Truck', 'Coupe'];
const CONDITIONS     = [
  { value: 'LIGHT',    label: 'Light',    desc: 'Well maintained — light dust & dirt' },
  { value: 'MODERATE', label: 'Moderate', desc: 'Normal use — visible dirt & grime' },
  { value: 'HEAVY',    label: 'Heavy',    desc: 'Heavily soiled / overdue for a detail' },
];

const iStyle = {
  display: 'block', width: '100%', padding: '12px 16px',
  borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#fff',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit',
};
const errStyle = { ...iStyle, border: '1px solid rgba(239,68,68,0.5)' };

const Label = ({ children, required }) => (
  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.5)',
    textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px' }}>
    {children}{required && ' *'}
  </label>
);

// ── Success Screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ referenceId }) => (
  <div className="text-center py-16 px-6">
    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
      style={{ background: 'rgba(0,212,255,0.1)', border: '2px solid rgba(0,212,255,0.3)' }}>
      <CheckCircle className="w-10 h-10 text-cyan-400" />
    </div>
    <h2 className="text-3xl font-black text-white mb-3">Quote Request Sent!</h2>
    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
      We'll review your request and get back to you with a price, usually within a few hours.
    </p>
    <div className="inline-block px-6 py-4 rounded-2xl mb-8"
      style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.25)' }}>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Your Reference</p>
      <p className="text-2xl font-black" style={{ background: GOLD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
        {referenceId}
      </p>
    </div>
    <div className="flex flex-col gap-3 max-w-xs mx-auto">
      <Link to={`/quote/lookup?ref=${referenceId}`} className="btn-luxury flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold">
        Track Quote Status <ChevronRight className="w-4 h-4" />
      </Link>
      <Link to="/" className="py-3 rounded-xl text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Back to Home
      </Link>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const QuotePage = () => {
  const { t }   = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { packages, services, addOns } = useServicesCache();

  const [loading,   setLoading]   = useState(false);
  const [quoteId,   setQuoteId]   = useState(null); // set after initial quote created
  const [submitted, setSubmitted] = useState(null); // referenceId on success
  const [errors,    setErrors]    = useState({});
  // Pre-fill from URL params (coming from booking flow or service cards)
  const initServices  = params.get('services')?.split(',').map(Number).filter(Boolean) || [];
  const initAddOns    = params.get('addOns')?.split(',').map(Number).filter(Boolean)   || [];
  const initVehicle   = params.get('vehicleType')   || '';
  const initCondition = params.get('vehicleCondition') || '';

  const [form, setForm] = useState({
    customerName: '', phoneNumber: '', email: '',
    address: '', city: '', postalCode: '',
    vehicleType:      initVehicle,
    vehicleCondition: initCondition,
    make: '', model: '', year: '',
    packageId:   params.get('packageId')   || '',
    packageName: params.get('packageName') || '',
    services: initServices,
    addOns:   initAddOns,
    notes: '',
    quoteMode: params.get('packageId') ? 'package' : (initServices.length ? 'services' : 'services'),
  });

  // Resolve URL-prefilled IDs once catalog data loads
  useEffect(() => {
    if (params.get('packageId') && packages.length) {
      const pkg = packages.find(p => String(p.id) === params.get('packageId'));
      if (pkg) setForm(f => ({ ...f, packageName: pkg.name, packageId: String(pkg.id) }));
    }
  }, [params, packages]);

  // Keep only service/addOn IDs that actually exist in the catalog
  useEffect(() => {
    if (!services.length && !addOns.length) return;
    setForm(f => ({
      ...f,
      services: f.services.filter(id => services.some(s => s.id === id)),
      addOns:   f.addOns.filter(id   => addOns.some(a => a.id === id)),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.length, addOns.length]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleService = (id) => {
    setForm(f => ({ ...f, services: f.services.includes(id) ? f.services.filter(s => s !== id) : [...f.services, id] }));
  };
  const toggleAddOn = (id) => {
    setForm(f => ({ ...f, addOns: f.addOns.includes(id) ? f.addOns.filter(a => a !== id) : [...f.addOns, id] }));
  };

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = true;
    if (!form.phoneNumber.trim())  e.phoneNumber  = true;
    if (!form.address.trim())      e.address      = true;
    if (!form.city.trim())         e.city         = true;
    if (!form.postalCode.trim())   e.postalCode   = true;
    if (!form.vehicleType)         e.vehicleType  = true;
    if (!form.vehicleCondition)    e.vehicleCondition = true;
    if (form.quoteMode === 'services' && form.services.length === 0) e.services = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const serviceNames = form.services
        .map(id => services.find(s => s.id === id)?.name || id).filter(Boolean);
      const addOnNames = form.addOns
        .map(id => addOns.find(a => a.id === id)?.name || id).filter(Boolean);

      const payload = {
        ...form,
        services:  serviceNames,
        addOns:    addOnNames,
        packageId: form.packageId ? parseInt(form.packageId) : null,
        year:      form.year ? parseInt(form.year) : null,
      };

      const res = await fetch(`${API}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');
      setSubmitted(data.referenceId);
    } catch (err) {
      setErrors(e => ({ ...e, _submit: err.message }));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div style={{ background: '#0b0f1a', minHeight: '100vh' }} className="pt-20">
      <div className="max-w-lg mx-auto px-4">
        <SuccessScreen referenceId={submitted} />
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0b0f1a', minHeight: '100vh' }} className="pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Custom Quote</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Request a Quote</h1>
          <p className="text-gray-400 text-sm">We'll review your request and reply with a price, usually within a few hours.</p>
        </div>

        <div className="space-y-6">

          {/* ── 1. What you need ─────────────────────────────────────────── */}
          <Section title="What do you need?" icon={Wrench}>
            <div className="flex gap-2 mb-4">
              {['package','services'].map(mode => (
                <button key={mode} onClick={() => set('quoteMode', mode)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ minHeight:'44px',
                    background: form.quoteMode === mode ? GOLD : 'rgba(255,255,255,0.04)',
                    color: form.quoteMode === mode ? '#0b0f1a' : '#9ca3af',
                    border: form.quoteMode === mode ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  {mode === 'package' ? 'A Package' : 'Specific Services'}
                </button>
              ))}
            </div>

            {form.quoteMode === 'package' ? (
              <div className="space-y-2">
                {packages.filter(p => p.requiresQuote).map(pkg => (
                  <button key={pkg.id} onClick={() => set('packageId', String(pkg.id))}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all"
                    style={{ minHeight:'44px',
                      background: form.packageId === String(pkg.id) ? 'rgba(0,168,204,0.12)' : 'rgba(255,255,255,0.03)',
                      border: form.packageId === String(pkg.id) ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <span style={{ color: form.packageId === String(pkg.id) ? '#00d4ff' : '#e2e8f0', fontWeight:600 }}>{pkg.name}</span>
                    {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
                  </button>
                ))}
                {packages.filter(p => p.requiresQuote).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No custom-quote packages configured yet.</p>
                )}
              </div>
            ) : (
              <>
                <Label>Services *</Label>
                <div className="space-y-1.5">
                  {services.filter(s => s.isActive).map(svc => (
                    <button key={svc.id} onClick={() => toggleService(svc.id)}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between"
                      style={{ minHeight:'44px',
                        background: form.services.includes(svc.id) ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.03)',
                        border: form.services.includes(svc.id) ? '1px solid rgba(0,168,204,0.35)' : '1px solid rgba(255,255,255,0.07)',
                      }}>
                      <span style={{ color: form.services.includes(svc.id) ? '#00d4ff' : '#e2e8f0', fontWeight:500 }}>{svc.name}</span>
                      {form.services.includes(svc.id) && <span className="text-cyan-400 text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
                {errors.services && <p className="text-red-400 text-xs mt-1">Please select at least one service.</p>}

                {addOns.filter(a => a.isActive).length > 0 && (
                  <div className="mt-4">
                    <Label>Add-Ons (optional)</Label>
                    <div className="space-y-1.5">
                      {addOns.filter(a => a.isActive).map(ao => (
                        <button key={ao.id} onClick={() => toggleAddOn(ao.id)}
                          className="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between"
                          style={{ minHeight:'44px',
                            background: form.addOns.includes(ao.id) ? 'rgba(0,168,204,0.08)' : 'rgba(255,255,255,0.02)',
                            border: form.addOns.includes(ao.id) ? '1px solid rgba(0,168,204,0.3)' : '1px solid rgba(255,255,255,0.06)',
                          }}>
                          <span style={{ color: form.addOns.includes(ao.id) ? '#00d4ff' : '#9ca3af', fontWeight:500, fontSize:'14px' }}>{ao.name}</span>
                          {form.addOns.includes(ao.id) && <span className="text-cyan-400 text-xs font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>

          {/* ── 2. Vehicle ────────────────────────────────────────────────── */}
          <Section title="Your Vehicle" icon={Car}>
            <Label required>Vehicle Type</Label>
            {errors.vehicleType && <p className="text-red-400 text-xs mb-1">Required</p>}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {VEHICLE_TYPES.map(v => (
                <button key={v} onClick={() => set('vehicleType', v)}
                  className="py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ minHeight:'44px',
                    background: form.vehicleType === v ? GOLD : 'rgba(255,255,255,0.04)',
                    color: form.vehicleType === v ? '#0b0f1a' : '#9ca3af',
                    border: form.vehicleType === v ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>{v}</button>
              ))}
            </div>

            <Label required>Condition</Label>
            {errors.vehicleCondition && <p className="text-red-400 text-xs mb-1">Required</p>}
            <div className="space-y-2 mb-4">
              {CONDITIONS.map(c => (
                <button key={c.value} onClick={() => set('vehicleCondition', c.value)}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all"
                  style={{ minHeight:'44px',
                    background: form.vehicleCondition === c.value ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.03)',
                    border: form.vehicleCondition === c.value ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <span style={{ fontWeight:600, color: form.vehicleCondition === c.value ? '#00d4ff' : '#e2e8f0' }}>{c.label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[['make','Make','BMW'],['model','Model','3 Series'],['year','Year','2020']].map(([key,lbl,ph]) => (
                <div key={key}>
                  <Label>{lbl} <span className="normal-case font-normal opacity-50">opt.</span></Label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)}
                    placeholder={ph} style={iStyle}
                    type={key === 'year' ? 'number' : 'text'} />
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. Contact & Address ─────────────────────────────────────── */}
          <Section title="Your Information" icon={User}>
            <div className="space-y-3">
              <div>
                <Label required>Name</Label>
                <input value={form.customerName} onChange={e => set('customerName', e.target.value)}
                  placeholder="Full name" style={errors.customerName ? errStyle : iStyle} />
              </div>
              <div>
                <Label required>Phone</Label>
                <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
                  placeholder="(438) 555-0100" style={errors.phoneNumber ? errStyle : iStyle} type="tel" />
              </div>
              <div>
                <Label>Email <span className="normal-case font-normal opacity-50">— optional (for quote-ready notification)</span></Label>
                <input value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@email.com" style={iStyle} type="email" />
              </div>
            </div>
          </Section>

          {/* ── 4. Location ────────────────────────────────────────────────── */}
          <Section title="Service Location" icon={HomeIcon}>
            <div className="space-y-3">
              <div>
                <Label required>Street Address</Label>
                <input value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="123 Rue Principale" style={errors.address ? errStyle : iStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>City</Label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="Montréal" style={errors.city ? errStyle : iStyle} />
                </div>
                <div>
                  <Label required>Postal Code</Label>
                  <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)}
                    placeholder="H2X 1Y4" style={errors.postalCode ? errStyle : iStyle} />
                </div>
              </div>
            </div>
          </Section>

          {/* ── 5. Notes ──────────────────────────────────────────────────── */}
          <Section title="Additional Notes" icon={Info} optional>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Gate code, parking situation, specific concerns about your vehicle…"
              rows={3} style={{ ...iStyle, resize:'vertical' }} />
            {/* Photo uploads */}
            {quoteId && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Photos — paint, condition, concerns</p>
                <PhotoUpload quoteId={quoteId} onUploadComplete={() => {}} />
              </div>
            )}
            {!quoteId && (
              <p className="text-xs text-gray-500 mt-3">📷 You can upload photos after submitting your request to help us quote accurately.</p>
            )}
          </Section>

          {/* Error */}
          {errors._submit && (
            <div className="px-4 py-3 rounded-xl text-red-300 text-sm"
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
              {errors._submit}
            </div>
          )}

          {/* Submit */}
          <button onClick={submit} disabled={loading}
            className="btn-luxury w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold tracking-wide disabled:opacity-40">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : <>Submit Quote Request <ChevronRight className="w-5 h-5" /></>}
          </button>

          <p className="text-center text-gray-600 text-xs">
            We'll review and reply, usually within a few hours. No payment required.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, optional, children }) => (
  <div className="rounded-2xl overflow-hidden"
    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
    <div className="flex items-center gap-2 px-5 py-4"
      style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
      <h3 className="text-white font-bold text-sm">{title}</h3>
      {optional && <span className="text-xs text-gray-600 ml-1">— optional</span>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default QuotePage;
