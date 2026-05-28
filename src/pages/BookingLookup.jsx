import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Phone, CheckCircle, Clock, AlertCircle, Calendar,
  MapPin, Car, Wrench, User, Mail, ChevronRight, Loader2,
  RefreshCw, Send, ArrowLeft, X, AlertTriangle
} from 'lucide-react';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376, #c9a84c)';
const GOLD_S = '#c9a84c';

const STATUS_STEPS = [
  { key: 'PENDING',     label: 'Pending',     desc: 'Booking received, awaiting confirmation' },
  { key: 'CONFIRMED',   label: 'Confirmed',   desc: 'Appointment confirmed — see you soon!' },
  { key: 'EN_ROUTE',    label: 'En Route',    desc: 'Your detailer is on the way' },
  { key: 'IN_PROGRESS', label: 'In Progress', desc: 'Detailing in progress' },
  { key: 'COMPLETED',   label: 'Completed',   desc: 'Your vehicle is looking pristine' },
];

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED'];
const getStepIndex = (s) => s === 'STARTED' ? STATUS_ORDER.indexOf('IN_PROGRESS') - 0.5 : STATUS_ORDER.indexOf(s);

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d + (String(d).includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatPhone = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length >= 6) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  if (d.length >= 3) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return d;
};

const resolveNames = (raw, list, key = 'id') => {
  try {
    const ids = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
    const areIds = ids.length > 0 && ids.every(i => !isNaN(parseInt(i)));
    if (areIds && list.length > 0) return ids.map(id => list.find(s => s[key] === parseInt(id))?.name || `#${id}`);
    return ids;
  } catch { return []; }
};

const InfoSection = ({ icon: Icon, label, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4" style={{ color: GOLD_S }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD_S }}>{label}</span>
    </div>
    <div className="text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{children}</div>
  </div>
);

// ─── Reschedule modal ─────────────────────────────────────────────────────────
const RescheduleModal = ({ booking, onClose, onSuccess }) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleReschedule = async () => {
    if (!newDate || !newTime) { setError('Please select both a date and time.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking.confirmationCode}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });
      const data = await res.json();
      if (data.success) onSuccess(data.booking);
      else setError(data.message || 'Failed to reschedule');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-white">Reschedule Appointment</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Current: {formatDate(booking.date)} at {booking.time}
          </p>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <AvailabilityCalendar selectedDate={newDate} onDateSelect={(d) => { setNewDate(d); setNewTime(''); }} />
          {newDate && (
            <TimeSlotPicker selectedDate={newDate} selectedTime={newTime}
              onTimeSelect={setNewTime} businessConfig={null} />
          )}
        </div>
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            Keep Original
          </button>
          <button onClick={handleReschedule} disabled={loading || !newDate || !newTime}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={(!newDate || !newTime || loading)
              ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
              : { background: GOLD, color: '#0a0a0a' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Rescheduling...</> : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Cancel confirm modal ─────────────────────────────────────────────────────
const CancelModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCancel = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking.confirmationCode}/cancel`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) onSuccess();
      else setError(data.message || 'Failed to cancel');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.1)' }}>
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="font-bold text-white text-center text-lg mb-2">Cancel Appointment?</h3>
        <p className="text-sm text-center mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {formatDate(booking.date)} at {booking.time}
        </p>
        <p className="text-xs text-center mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          This action cannot be undone. You'll receive an SMS confirmation.
        </p>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            Keep Appointment
          </button>
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const BookingLookup = () => {
  const [code, setCode]           = useState('');
  const [phone, setPhone]         = useState('');
  const [booking, setBooking]     = useState(null);
  const [services, setServices]   = useState([]);
  const [addOns, setAddOns]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [resentOk, setResentOk]   = useState(false);
  const [error, setError]         = useState('');
  const [autoRefresh, setAutoRefresh]     = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel]         = useState(false);
  const [cancelledOk, setCancelledOk]       = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/services/active`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/services/addons/active`).then(r => r.json()),
    ]).then(([s, a]) => {
      if (s.success) setServices(s.services);
      if (a.success) setAddOns(a.addOns);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (autoRefresh && booking?.confirmationCode) {
      intervalRef.current = setInterval(() => fetchBooking(booking.confirmationCode, true), 30000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, booking?.confirmationCode]);

  const fetchBooking = async (confirmCode, silent = false) => {
    if (!silent) { setLoading(true); setError(''); setBooking(null); }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${confirmCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.success) {
        if (!silent && phone) {
          const searchDigits  = phone.replace(/\D/g, '');
          const bookingDigits = (data.booking.phoneNumber || data.booking.customer?.phoneNumber || '').replace(/\D/g, '');
          if (searchDigits && !bookingDigits.endsWith(searchDigits.slice(-10))) {
            setError('Phone number does not match our records for this booking.');
            return;
          }
        }
        setBooking(data.booking);
        setAutoRefresh(['EN_ROUTE','STARTED','IN_PROGRESS'].includes(data.booking.status));
      } else {
        if (!silent) setError('Booking not found. Double-check your confirmation code.');
      }
    } catch {
      if (!silent) setError('Unable to look up your booking. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter your confirmation code.'); return; }
    fetchBooking(code);
  };

  const handleResend = async () => {
    if (!booking?.confirmationCode) return;
    setResending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking.confirmationCode}/resend-email`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { setResentOk(true); setTimeout(() => setResentOk(false), 4000); }
    } catch {}
    finally { setResending(false); }
  };

  const canModify = booking && !['COMPLETED','CANCELED','NO_SHOW','IN_PROGRESS','STARTED','EN_ROUTE'].includes(booking.status);
  const stepIdx   = booking ? getStepIndex(booking.status) : -1;
  const isCancelled = booking?.status === 'CANCELED' || booking?.status === 'NO_SHOW';

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: '#fff', padding: '13px 16px', fontSize: '14px',
    outline: 'none', width: '100%', fontFamily: 'inherit', transition: 'border-color 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'rgba(201,168,76,0.8)', marginBottom: '8px'
  };

  if (cancelledOk) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Appointment Cancelled</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          We've sent you an SMS confirmation. We hope to see you again soon.
        </p>
        <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: GOLD, color: '#0a0a0a' }}>
          Book Again <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Modals */}
      {showReschedule && booking && (
        <RescheduleModal booking={booking}
          onClose={() => setShowReschedule(false)}
          onSuccess={(updated) => { setBooking(b => ({ ...b, ...updated })); setShowReschedule(false); }} />
      )}
      {showCancel && booking && (
        <CancelModal booking={booking}
          onClose={() => setShowCancel(false)}
          onSuccess={() => { setShowCancel(false); setCancelledOk(true); }} />
      )}

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)' }} />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(201,168,76,0.03)' }} />
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
            <Search className="w-3.5 h-3.5" /> Track Your Booking
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Your Appointment,
            </span>
            <br /><span className="text-white">At a Glance</span>
          </h1>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Enter your confirmation code to view status, reschedule, or cancel.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">

        {/* Search form */}
        <form onSubmit={handleSearch} className="rounded-2xl p-6 mb-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Confirmation Code</label>
              <input style={{ ...inputStyle, textTransform: 'uppercase' }}
                value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="e.g. AB12CD" maxLength={10}
                onFocus={e => e.target.style.borderColor = GOLD_S}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} type="tel"
                value={phone} onChange={e => { setPhone(formatPhone(e.target.value)); setError(''); }}
                placeholder="(514) 555-0123"
                onFocus={e => e.target.style.borderColor = GOLD_S}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
            style={loading
              ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
              : { background: GOLD, color: '#0a0a0a', boxShadow: '0 0 25px rgba(201,168,76,0.25)' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Looking up...</> : <><Search className="w-4 h-4" /> Find My Booking</>}
          </button>
        </form>

        {/* Result */}
        {booking && (
          <div className="space-y-5">

            {/* Status timeline */}
            {!isCancelled ? (
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-white text-base">Appointment Status</h2>
                  {autoRefresh && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: GOLD_S }}>
                      <RefreshCw className="w-3 h-3 animate-spin" /> Live
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="absolute left-4 top-4 w-0.5 transition-all duration-700"
                    style={{ background: GOLD, height: `${Math.min(100, (stepIdx / (STATUS_STEPS.length - 1)) * 100)}%` }} />
                  <div className="space-y-5 relative">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i < stepIdx, current = Math.floor(stepIdx) === i;
                      return (
                        <div key={step.key} className="flex items-start gap-4 pl-1">
                          <div className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                            style={{
                              background: done || current ? GOLD : 'rgba(255,255,255,0.08)',
                              border: current ? '2px solid rgba(201,168,76,0.8)' : done ? 'none' : '1px solid rgba(255,255,255,0.12)',
                              boxShadow: current ? '0 0 16px rgba(201,168,76,0.5)' : 'none',
                            }}>
                            {done ? <CheckCircle className="w-3.5 h-3.5 text-black" />
                              : <div className="w-2 h-2 rounded-full" style={{ background: current ? '#0a0a0a' : 'rgba(255,255,255,0.3)' }} />}
                          </div>
                          <div className="pt-0.5">
                            <p className="text-sm font-semibold" style={{ color: done || current ? '#fff' : 'rgba(255,255,255,0.35)' }}>{step.label}</p>
                            {current && <p className="text-xs mt-0.5" style={{ color: 'rgba(201,168,76,0.7)' }}>{step.desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: '#f87171' }} />
                <p className="font-bold text-white">Booking {booking.status === 'NO_SHOW' ? 'No Show' : 'Cancelled'}</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Please contact us if you need to reschedule.</p>
              </div>
            )}

            {/* Booking details */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD_S }}>Confirmation Code</p>
                  <p className="text-2xl font-black text-white tracking-widest">{booking.confirmationCode}</p>
                </div>
                {booking.totalPrice > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD_S }}>Total</p>
                    <p className="text-2xl font-black text-white">${parseFloat(booking.totalPrice || 0).toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoSection icon={User} label="Customer">
                  <p className="font-semibold text-white">{booking.firstName} {booking.lastName}</p>
                  {booking.email && <p style={{ color: 'rgba(255,255,255,0.5)' }}>{booking.email}</p>}
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>{booking.phoneNumber}</p>
                </InfoSection>
                <InfoSection icon={Calendar} label="Appointment">
                  <p className="font-semibold text-white">{formatDate(booking.date)}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>{booking.time}</p>
                </InfoSection>
                <InfoSection icon={MapPin} label="Location">
                  <p className="text-white">{booking.address}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>{booking.city}, {booking.postalCode}</p>
                </InfoSection>
                <InfoSection icon={Car} label="Vehicle">
                  <p className="font-semibold text-white">{booking.year} {booking.make} {booking.model}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>{booking.vehicleType}</p>
                </InfoSection>
              </div>
              {(() => {
                // Use pre-resolved names from API when available; fall back to frontend lookup
                const svcNames = (booking.resolvedServices?.length > 0)
                  ? booking.resolvedServices
                  : resolveNames(booking.services, services);
                const addNames = (booking.resolvedAddOns?.length > 0)
                  ? booking.resolvedAddOns
                  : resolveNames(booking.extras, addOns);
                if (!svcNames.length && !addNames.length) return null;
                return (
                  <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-4 h-4" style={{ color: GOLD_S }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD_S }}>Services</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {svcNames.map((s, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: 'rgba(201,168,76,0.1)', color: '#f5d376', border: '1px solid rgba(201,168,76,0.2)' }}>{s}</span>
                      ))}
                      {addNames.map((a, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>+ {a}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action buttons */}
            <div className="grid sm:grid-cols-3 gap-3">
              <button onClick={handleResend} disabled={resending || resentOk || !booking.email}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={resentOk
                  ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                {resentOk ? <><CheckCircle className="w-4 h-4" /> Sent!</> : resending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending</> : <><Send className="w-4 h-4" /> Resend Email</>}
              </button>
              <a href="tel:+14387968001" className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <Phone className="w-4 h-4" /> Call Us
              </a>
              <Link to="/booking" className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: GOLD, color: '#0a0a0a' }}>
                Book Again <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Reschedule / Cancel — only shown for modifiable bookings */}
            {canModify && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Manage Appointment
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setShowReschedule(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
                    <Calendar className="w-4 h-4" /> Reschedule
                  </button>
                  <button onClick={() => setShowCancel(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <X className="w-4 h-4" /> Cancel Appointment
                  </button>
                </div>
                <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Cancellations must be made 24+ hours in advance
                </p>
              </div>
            )}
          </div>
        )}

        {!booking && !loading && (
          <div className="text-center pt-4">
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Can't find your booking? We're happy to help.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="tel:+14387968001" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <Phone className="w-4 h-4" /> (514) 437-4816
              </a>
              <Link to="/contact" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <Mail className="w-4 h-4" /> Contact Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingLookup;