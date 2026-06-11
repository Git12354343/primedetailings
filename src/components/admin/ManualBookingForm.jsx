/**
 * ManualBookingForm.jsx
 *
 * Complete replacement.
 *
 * Changes from original:
 *  - Uses AvailabilityCalendar + TimeSlotPicker (same pickers customers use)
 *    → slotId is sent in the API call, not a free-form time string
 *  - Pre-checks conflicts via GET /api/availability/conflicts before submit
 *  - Shows conflict warning + override checkbox if slot is occupied
 *  - On override, posts override:true to the backend (audited)
 *  - All required: firstName, lastName, phoneNumber, vehicleType, make, model,
 *    year, services[], date, time/slotId
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, User, Car, Calendar } from 'lucide-react';
import AvailabilityCalendar from '../AvailabilityCalendar';
import TimeSlotPicker       from '../TimeSlotPicker';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';

const iBase = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px', color: '#fff',
  padding: '9px 13px', fontSize: '14px',
  outline: 'none', width: '100%',
};
const lStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'rgba(0,168,204,0.75)', marginBottom: '5px',
};

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Other'];

const ManualBookingForm = ({ adminToken, onSuccess }) => {
  const [form, setForm]         = useState({
    firstName: '', lastName: '', phoneNumber: '', email: '',
    address: '', city: '', postalCode: '',
    vehicleType: '', vehicleCondition: '', make: '', model: '', year: '',
    services: [], notes: '', totalPrice: '',
    detailerId: '',
    specialInstructions: '',
  });
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('');
  const [slotId,      setSlotId]      = useState('');
  const [businessCfg, setBusinessCfg] = useState(null);
  const [services,    setServices]    = useState([]); // available services list
  const [submitting,  setSubmitting]  = useState(false);
  const [checking,    setChecking]    = useState(false);
  const [conflict,    setConflict]    = useState(null);
  const [override,    setOverride]    = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(null);

  useEffect(() => {
    // Load business config for the date/time pickers
    fetch(`${API}/availability/config`)
      .then(r => r.json())
      .then(d => { if (d.success) setBusinessCfg(d.config); })
      .catch(() => {});

    // Load available services
    fetch(`${API}/services`, { headers: { 'X-Admin-Secret': adminToken || '' } })
      .then(r => r.json())
      .then(d => { if (d.success || d.services) setServices(d.services || []); })
      .catch(() => {});
  }, [adminToken]);

  const set = (field) => (e) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const handleDateSelect = (d) => {
    setDate(d);
    setTime(''); setSlotId('');
    setConflict(null); setOverride(false); setError('');
  };

  const handleTimeSelect = (label) => {
    setTime(label);
    const slot = businessCfg?.timeSlots?.find(s => s.label === label);
    setSlotId(slot?.id || '');
    setConflict(null); setOverride(false); setError('');
  };

  const toggleService = (id) =>
    setForm(p => ({
      ...p,
      services: p.services.includes(id)
        ? p.services.filter(s => s !== id)
        : [...p.services, id],
    }));

  // Pre-check conflicts (fast, before submit)
  const checkConflicts = async () => {
    if (!date || !slotId) return;
    setChecking(true);
    try {
      const res  = await fetch(
        `${API}/availability/conflicts?date=${date}&slotId=${slotId}`,
        { headers: { 'X-Admin-Secret': adminToken || '' } }
      );
      const data = await res.json();
      if (data.hasConflict) {
        const c = data.conflicts[0];
        setConflict({ message: `Slot occupied by booking #${c.confirmationCode}`, conflictCode: c.confirmationCode });
        setOverride(false);
      } else {
        setConflict(null);
      }
    } catch {
      setConflict(null);
    } finally {
      setChecking(false);
    }
  };

  // Re-check when date+slot change
  useEffect(() => {
    if (date && slotId) checkConflicts();
  }, [date, slotId]);

  const validate = () => {
    const required = { firstName: 'First name', lastName: 'Last name', phoneNumber: 'Phone number',
                       vehicleType: 'Vehicle type', make: 'Make', model: 'Model', year: 'Year' };
    for (const [key, label] of Object.entries(required)) {
      if (!form[key]) return `${label} is required`;
    }
    if (form.services.length === 0) return 'Select at least one service';
    if (!date)   return 'Select a date';
    if (!slotId) return 'Select a time slot';
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (conflict && !override) {
      setError('Resolve the slot conflict before submitting, or check "Override".');
      return;
    }

    setSubmitting(true); setError('');
    try {
      const res  = await fetch(`${API}/admin/manual-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminToken || '' },
        body: JSON.stringify({
          ...form,
          date, time, slotId,
          year:     parseInt(form.year),
          override,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        setConflict({ message: data.message, conflictCode: data.conflictCode });
        setOverride(false);
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create booking');

      setSuccess(data.booking);
      if (onSuccess) onSuccess(data.booking);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: GOLD }}>
          <CheckCircle className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-xl font-black text-white">Booking Created</h3>
        <p className="text-gray-400">Confirmation code</p>
        <p className="text-3xl font-black tracking-widest"
          style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {success.confirmationCode}
        </p>
        <button
          onClick={() => { setSuccess(null); setForm({ firstName:'',lastName:'',phoneNumber:'',email:'',address:'',city:'',postalCode:'',vehicleType:'',vehicleCondition:'',make:'',model:'',year:'',services:[],notes:'',totalPrice:'',detailerId:'',specialInstructions:'' }); setDate(''); setTime(''); setSlotId(''); setConflict(null); setOverride(false); setError(''); }}
          className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-black"
          style={{ background: GOLD }}>
          Add Another
        </button>
      </div>
    );
  }

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' };

  return (
    <div className="max-w-2xl mx-auto space-y-5 p-4">
      <h2 className="text-xl font-black text-white">Manual Booking</h2>
      <p className="text-gray-500 text-sm">Phone-in clients. Conflict checking is automatic.</p>

      {/* Customer info */}
      <div style={cardStyle} className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4" style={{ color: '#00a8cc' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00a8cc' }}>Customer</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[['firstName','First Name'],['lastName','Last Name']].map(([f,l]) => (
            <div key={f}>
              <label style={lStyle}>{l} *</label>
              <input style={iBase} value={form[f]} onChange={set(f)} placeholder={l} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={lStyle}>Phone *</label>
            <input style={iBase} value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="(514) 555-0000" />
          </div>
          <div>
            <label style={lStyle}>Email</label>
            <input style={iBase} value={form.email} onChange={set('email')} placeholder="optional" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={lStyle}>Address</label>
            <input style={iBase} value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label style={lStyle}>City</label>
              <input style={iBase} value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label style={lStyle}>Postal</label>
              <input style={iBase} value={form.postalCode} onChange={set('postalCode')} />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle */}
      <div style={cardStyle} className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Car className="w-4 h-4" style={{ color: '#00a8cc' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00a8cc' }}>Vehicle</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={lStyle}>Type *</label>
            <select style={iBase} value={form.vehicleType} onChange={set('vehicleType')}>
              <option value="">Select…</option>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Year *</label>
            <input style={iBase} type="number" value={form.year} onChange={set('year')} placeholder="2021" />
          </div>
          <div>
            <label style={lStyle}>Make *</label>
            <input style={iBase} value={form.make} onChange={set('make')} placeholder="Toyota" />
          </div>
          <div>
            <label style={lStyle}>Model *</label>
            <input style={iBase} value={form.model} onChange={set('model')} placeholder="Camry" />
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={cardStyle}>
        <label style={lStyle}>Services *</label>
        <div className="space-y-1 mt-2">
          {services.length === 0 && <p className="text-gray-500 text-xs">No services loaded</p>}
          {services.map(s => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={form.services.includes(String(s.id))}
                onChange={() => toggleService(String(s.id))}
                className="w-4 h-4 accent-cyan-400"
              />
              <span className="text-white text-sm">{s.name}</span>
              {s.estimatedDuration && (
                <span className="text-gray-500 text-xs ml-auto">~{s.estimatedDuration}h</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Date + Time */}
      <div style={cardStyle} className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4" style={{ color: '#00a8cc' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00a8cc' }}>Date &amp; Time</span>
        </div>
        <AvailabilityCalendar
          selectedDate={date}
          businessConfig={businessCfg}
          onDateSelect={handleDateSelect}
        />
        {date && (
          <TimeSlotPicker
            selectedDate={date}
            selectedTime={time}
            businessConfig={businessCfg}
            onTimeSelect={handleTimeSelect}
          />
        )}
        {checking && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking for conflicts…
          </p>
        )}
      </div>

      {/* Conflict banner */}
      {conflict && (
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300 text-sm font-semibold">Slot already booked</p>
              <p className="text-red-400 text-xs mt-0.5">{conflict.message}</p>
              {conflict.conflictCode && (
                <p className="text-gray-500 text-xs mt-1">
                  Booking: <span className="font-mono text-amber-400">{conflict.conflictCode}</span>
                </p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)}
              className="w-4 h-4 accent-amber-400" />
            <span className="text-amber-300 text-sm">Override — create anyway (audited)</span>
          </label>
        </div>
      )}

      {/* Price + Notes */}
      <div style={cardStyle} className="grid grid-cols-2 gap-3">
        <div>
          <label style={lStyle}>Total Price ($)</label>
          <input style={iBase} type="number" step="0.01" value={form.totalPrice} onChange={set('totalPrice')} placeholder="0.00" />
        </div>
        <div>
          <label style={lStyle}>Internal Notes</label>
          <input style={iBase} value={form.notes} onChange={set('notes')} placeholder="Phone client, paid cash…" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm p-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-bold text-black text-sm disabled:opacity-40"
        style={{ background: GOLD }}>
        {submitting
          ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          : (conflict && override ? '⚠ Override & Create Booking' : 'Create Booking')}
      </button>
    </div>
  );
};

export default ManualBookingForm;
