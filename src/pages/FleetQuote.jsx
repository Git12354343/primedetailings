// src/pages/FleetQuote.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Car, Wrench, Calendar, MapPin, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import useInView from '../hooks/useInView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD    = 'linear-gradient(135deg,#c9a84c,#f5d376)';
const GOLD_S  = '#c9a84c';

const FREQ_OPTIONS = [
  { value: 'ONE_TIME',   label: 'One-time',    labelFr: 'Unique' },
  { value: 'WEEKLY',     label: 'Weekly',      labelFr: 'Hebdomadaire' },
  { value: 'BI_WEEKLY',  label: 'Bi-weekly',   labelFr: 'Aux deux semaines' },
  { value: 'MONTHLY',    label: 'Monthly',     labelFr: 'Mensuel' },
  { value: 'QUARTERLY',  label: 'Quarterly',   labelFr: 'Trimestriel' },
];

const SERVICES = [
  'Full Exterior Detail', 'Full Interior Detail', 'Full Detail (In + Out)',
  'Ceramic Coating', 'Paint Correction', 'Engine Bay Clean',
  'Fleet Wash (Basic)', 'Window Tint', 'Other',
];

const VEHICLE_TYPES = ['Sedan', 'SUV / Crossover', 'Pickup Truck', 'Cargo Van', 'Minivan', 'Bus / Coach', 'Other'];

const FieldGroup = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: 'rgba(255,255,255,0.5)' }}>
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full px-4 py-3 rounded-xl text-white text-sm bg-transparent outline-none transition-all"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.12)',
    }}
    onFocus={e => e.target.style.borderColor = GOLD_S}
    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
  />
);

const TextArea = ({ ...props }) => (
  <textarea
    {...props}
    rows={4}
    className="w-full px-4 py-3 rounded-xl text-white text-sm bg-transparent outline-none resize-none transition-all"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.12)',
    }}
    onFocus={e => e.target.style.borderColor = GOLD_S}
    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
  />
);

const FleetQuote = () => {
  const [ref, visible] = useInView({ threshold: 0.1 });
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(null);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    vehicleCount: '', vehicleTypes: [], servicesRequested: [],
    frequency: 'ONE_TIME', preferredDays: '', locationAddress: '', additionalNotes: '',
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const toggleArr = (field, val) => setForm(f => ({
    ...f,
    [field]: f[field].includes(val) ? f[field].filter(v => v !== val) : [...f[field], val],
  }));

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/fleet/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vehicleCount: parseInt(form.vehicleCount),
          servicesRequested: form.servicesRequested.join(', '),
        }),
      });
      const data = await res.json();
      if (data.success) setDone(data.referenceId);
      else setError(data.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
          <CheckCircle className="w-8 h-8" style={{ color: '#34d399' }} />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Quote Request Submitted!</h2>
        <p className="text-gray-400 mb-2">We'll contact you within 24 hours to discuss your fleet needs.</p>
        <div className="inline-block px-4 py-2 rounded-full mb-6"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD_S }}>
            Reference: {done}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-luxury px-6 py-3 rounded-xl text-sm font-bold">Back to Home</Link>
          <a href="tel:+14387968001" className="btn-ghost-luxury px-6 py-3 rounded-xl text-sm font-semibold">Call Us Now</a>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>

      {/* Hero */}
      <section ref={ref} className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(201,168,76,0.07),transparent 60%)' }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10"
          style={{ transition:'opacity .7s,transform .7s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)' }}>
            <Building2 className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD_S }}>Fleet & B2B</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing:'-0.02em' }}>
            Fleet Detailing{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Custom Quotes
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Managing 2 vehicles or 200 — we have tailored pricing for business fleets in Montréal.
          </p>

          {/* Why fleet */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { icon: Car,      label: 'Any fleet size' },
              { icon: Calendar, label: 'Flexible schedule' },
              { icon: MapPin,   label: 'We come to you' },
              { icon: Wrench,   label: 'All services' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 py-4 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <Icon className="w-5 h-5" style={{ color: GOLD_S }} />
                <span className="text-xs text-white font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-6 sm:p-8"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: step >= s ? GOLD : 'rgba(255,255,255,0.08)',
                      color: step >= s ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                    }}>{s}</div>
                  {s < 3 && <div className="flex-1 h-px" style={{ background: step > s ? GOLD_S : 'rgba(255,255,255,0.1)' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1 — Company info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-white font-bold text-lg mb-6">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="Company Name *">
                    <Input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Corp" />
                  </FieldGroup>
                  <FieldGroup label="Contact Name *">
                    <Input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="John Smith" />
                  </FieldGroup>
                  <FieldGroup label="Email *">
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" />
                  </FieldGroup>
                  <FieldGroup label="Phone *">
                    <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(514) 555-0000" />
                  </FieldGroup>
                </div>
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      if (!form.companyName || !form.contactName || !form.email || !form.phone)
                        return setError('Please fill all required fields.');
                      setError(''); setStep(2);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                    style={{ background: GOLD, color: '#0a0a0a' }}>
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Fleet details */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-white font-bold text-lg mb-6">Fleet Details</h3>

                <FieldGroup label="Number of Vehicles *">
                  <Input type="number" min="1" value={form.vehicleCount} onChange={e => set('vehicleCount', e.target.value)} placeholder="e.g. 12" />
                </FieldGroup>

                <FieldGroup label="Vehicle Types (select all that apply)">
                  <div className="flex flex-wrap gap-2">
                    {VEHICLE_TYPES.map(v => (
                      <button key={v} onClick={() => toggleArr('vehicleTypes', v)}
                        className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: form.vehicleTypes.includes(v) ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${form.vehicleTypes.includes(v) ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: form.vehicleTypes.includes(v) ? '#f5d376' : 'rgba(255,255,255,0.6)',
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                <FieldGroup label="Service Frequency">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FREQ_OPTIONS.map(f => (
                      <button key={f.value} onClick={() => set('frequency', f.value)}
                        className="py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: form.frequency === f.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${form.frequency === f.value ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
                          color: form.frequency === f.value ? '#f5d376' : 'rgba(255,255,255,0.6)',
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl text-sm font-semibold"
                    style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)' }}>
                    Back
                  </button>
                  <button
                    onClick={() => { if (!form.vehicleCount) return setError('Enter vehicle count.'); setError(''); setStep(3); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                    style={{ background: GOLD, color: '#0a0a0a' }}>
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Services + notes */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-white font-bold text-lg mb-6">Services & Details</h3>

                <FieldGroup label="Services Needed (select all that apply)">
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map(s => (
                      <button key={s} onClick={() => toggleArr('servicesRequested', s)}
                        className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: form.servicesRequested.includes(s) ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${form.servicesRequested.includes(s) ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: form.servicesRequested.includes(s) ? '#f5d376' : 'rgba(255,255,255,0.6)',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                <FieldGroup label="Location / Garage Address">
                  <Input value={form.locationAddress} onChange={e => set('locationAddress', e.target.value)} placeholder="123 Fleet St, Montréal, QC" />
                </FieldGroup>

                <FieldGroup label="Preferred Days / Schedule">
                  <Input value={form.preferredDays} onChange={e => set('preferredDays', e.target.value)} placeholder="e.g. Weekends, Mon-Wed mornings" />
                </FieldGroup>

                <FieldGroup label="Additional Notes">
                  <TextArea value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)}
                    placeholder="Anything else we should know about your fleet or requirements..." />
                </FieldGroup>

                {error && (
                  <p className="text-sm text-red-400 px-3 py-2 rounded-xl"
                    style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl text-sm font-semibold"
                    style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)' }}>
                    Back
                  </button>
                  <button onClick={submit} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-60"
                    style={{ background: GOLD, color: '#0a0a0a' }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Submitting...' : 'Request Fleet Quote'}
                  </button>
                </div>
              </div>
            )}

            {error && step < 3 && (
              <p className="text-sm text-red-400 mt-3">{error}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FleetQuote;
