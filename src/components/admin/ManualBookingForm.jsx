import React, { useState, useEffect } from 'react';
import { X, User, Car, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { vehicleData } from '../../data/vehicleData';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

const iStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: '#fff', padding: '10px 14px', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
};
const lStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '5px',
};
const focus = e => e.target.style.borderColor = GOLD_S;
const blur  = e => e.target.style.borderColor = 'rgba(255,255,255,0.1)';

const Section = ({ icon: Icon, title, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color: GOLD_S }} />
      <h3 className="text-sm font-bold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const ManualBookingForm = ({ onClose, onSuccess, detailers = [] }) => {
  const [services, setServices] = useState([]);
  const [addOns, setAddOns]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', email: '',
    address: '', city: '', postalCode: '',
    vehicleType: '', make: '', model: '', year: '',
    services: [], extras: [],
    date: '', time: '8:00 AM',
    totalPrice: '', specialInstructions: '', notes: '',
    detailerId: ''
  });

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/services/active`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/services/addons/active`).then(r => r.json()),
    ]).then(([sd, ad]) => {
      if (sd.success) setServices(sd.services);
      if (ad.success) setAddOns(ad.addOns);
    }).catch(() => {});
  }, []);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const getAvailableMakes  = () => form.vehicleType ? Object.keys(vehicleData[form.vehicleType] || {}) : [];
  const getAvailableModels = () => form.vehicleType && form.make ? Object.keys(vehicleData[form.vehicleType][form.make] || {}) : [];
  const getAvailableYears  = () => form.vehicleType && form.make && form.model ? vehicleData[form.vehicleType][form.make][form.model] || [] : [];
  const toggleService = id => set('services', form.services.includes(id) ? form.services.filter(s => s !== id) : [...form.services, id]);
  const toggleAddOn   = id => set('extras',   form.extras.includes(id)   ? form.extras.filter(a => a !== id)   : [...form.extras,   id]);

  const handleSubmit = async () => {
    setError('');
    if (!form.firstName || !form.lastName || !form.phoneNumber) return setError('Name and phone number are required');
    if (!form.vehicleType || !form.make || !form.model || !form.year) return setError('Complete vehicle information is required');
    if (form.services.length === 0) return setError('At least one service must be selected');
    if (!form.date || !form.time) return setError('Date and time are required');

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/manual-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSuccess(data.booking); }
      else setError(data.message || 'Failed to create booking');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  // Render inline (not a modal overlay) — wraps in a styled panel
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <div>
          <h2 className="text-white font-bold">Add Manual Booking</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>For phone or walk-in clients</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Customer */}
        <Section icon={User} title="Customer Information">
          <div className="grid grid-cols-2 gap-3">
            {[
              { ph: 'First Name *', field: 'firstName' },
              { ph: 'Last Name *',  field: 'lastName'  },
              { ph: 'Phone *',      field: 'phoneNumber' },
              { ph: 'Email',        field: 'email'      },
            ].map(({ ph, field }) => (
              <div key={field}>
                <label style={lStyle}>{ph.replace(' *', '')}</label>
                <input style={iStyle} placeholder={ph} value={form[field]} onFocus={focus} onBlur={blur}
                  onChange={e => set(field, e.target.value)} />
              </div>
            ))}
            <div className="col-span-2">
              <label style={lStyle}>Address</label>
              <input style={iStyle} placeholder="Address" value={form.address} onFocus={focus} onBlur={blur}
                onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>City</label>
              <input style={iStyle} placeholder="City" value={form.city} onFocus={focus} onBlur={blur}
                onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>Postal Code</label>
              <input style={iStyle} placeholder="H1A 1A1" value={form.postalCode} onFocus={focus} onBlur={blur}
                onChange={e => set('postalCode', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* Vehicle */}
        <Section icon={Car} title="Vehicle Information">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lStyle}>Type *</label>
              <select style={{ ...iStyle, cursor: 'pointer' }} value={form.vehicleType}
                onChange={e => { set('vehicleType', e.target.value); set('make', ''); set('model', ''); set('year', ''); }}>
                <option value="" style={{ background: '#1a1a1a' }}>Select type</option>
                {Object.keys(vehicleData).map(t => <option key={t} value={t} style={{ background: '#1a1a1a' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>Make *</label>
              <select style={{ ...iStyle, cursor: 'pointer', opacity: !form.vehicleType ? 0.5 : 1 }} value={form.make}
                onChange={e => { set('make', e.target.value); set('model', ''); set('year', ''); }} disabled={!form.vehicleType}>
                <option value="" style={{ background: '#1a1a1a' }}>Select make</option>
                {getAvailableMakes().map(m => <option key={m} value={m} style={{ background: '#1a1a1a' }}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>Model *</label>
              <select style={{ ...iStyle, cursor: 'pointer', opacity: !form.make ? 0.5 : 1 }} value={form.model}
                onChange={e => { set('model', e.target.value); set('year', ''); }} disabled={!form.make}>
                <option value="" style={{ background: '#1a1a1a' }}>Select model</option>
                {getAvailableModels().map(m => <option key={m} value={m} style={{ background: '#1a1a1a' }}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>Year *</label>
              <select style={{ ...iStyle, cursor: 'pointer', opacity: !form.model ? 0.5 : 1 }} value={form.year}
                onChange={e => set('year', e.target.value)} disabled={!form.model}>
                <option value="" style={{ background: '#1a1a1a' }}>Select year</option>
                {getAvailableYears().map(y => <option key={y} value={y} style={{ background: '#1a1a1a' }}>{y}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* Services */}
        <Section icon={CheckCircle} title="Services *">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {services.map(s => {
              const sel = form.services.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleService(s.id)} type="button"
                  className="flex items-center justify-between p-3 rounded-xl text-left transition-all"
                  style={{
                    background: sel ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                    border: sel ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: sel ? '#f5d376' : 'rgba(255,255,255,0.8)' }}>{s.name}</p>
                    {form.vehicleType && s.pricing?.[form.vehicleType] && (
                      <p className="text-xs mt-0.5" style={{ color: sel ? GOLD_S : 'rgba(255,255,255,0.4)' }}>${s.pricing[form.vehicleType]}</p>
                    )}
                  </div>
                  {sel && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />}
                </button>
              );
            })}
          </div>
          {addOns.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Add-ons (optional)</p>
              <div className="grid grid-cols-2 gap-2">
                {addOns.map(a => {
                  const sel = form.extras.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggleAddOn(a.id)} type="button"
                      className="flex items-center justify-between p-3 rounded-xl text-left transition-all"
                      style={{
                        background: sel ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                        border: sel ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: sel ? '#6ee7b7' : 'rgba(255,255,255,0.7)' }}>{a.name}</p>
                        <p className="text-xs" style={{ color: sel ? '#34d399' : 'rgba(255,255,255,0.4)' }}>+${a.price}</p>
                      </div>
                      {sel && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Section>

        {/* Appointment */}
        <Section icon={Calendar} title="Appointment">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lStyle}>Date *</label>
              <input style={iStyle} type="date" value={form.date} onFocus={focus} onBlur={blur}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>Time *</label>
              <select style={{ ...iStyle, cursor: 'pointer' }} value={form.time} onChange={e => set('time', e.target.value)}>
                <option value="8:00 AM"  style={{ background: '#1a1a1a' }}>8:00 AM</option>
                <option value="12:00 PM" style={{ background: '#1a1a1a' }}>12:00 PM</option>
              </select>
            </div>
            <div>
              <label style={lStyle}>Total Price ($)</label>
              <input style={iStyle} type="number" placeholder="0.00" value={form.totalPrice} onFocus={focus} onBlur={blur}
                onChange={e => set('totalPrice', e.target.value)} />
            </div>
            <div>
              <label style={lStyle}>Assign Detailer</label>
              <select style={{ ...iStyle, cursor: 'pointer' }} value={form.detailerId} onChange={e => set('detailerId', e.target.value)}>
                <option value="" style={{ background: '#1a1a1a' }}>Unassigned</option>
                {detailers.map(d => <option key={d.id} value={d.id} style={{ background: '#1a1a1a' }}>{d.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label style={lStyle}>Special Instructions</label>
              <textarea style={{ ...iStyle, resize: 'vertical' }} rows={2} placeholder="Notes for the detailer..."
                value={form.notes} onChange={e => set('notes', e.target.value)}
                onFocus={focus} onBlur={blur} />
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        {onClose && (
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
        )}
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: GOLD }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle className="w-4 h-4" /> Create Booking</>}
        </button>
      </div>
    </div>
  );
};

export default ManualBookingForm;
