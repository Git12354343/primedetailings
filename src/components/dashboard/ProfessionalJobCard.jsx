import React, { useState } from 'react';
import {
  User, Phone, Car, Wrench, Package, MapPin, Navigation,
  MessageSquare, CheckCircle, AlertCircle, Clock,
  StickyNote, Route, Play, Camera, Activity, Loader2,
  ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';

const STATUS_CONFIG = {
  CONFIRMED:   { label: 'Confirmed',   color: GOLD_S,      bg: 'rgba(0,168,204,0.1)',   border: 'rgba(0,168,204,0.25)' },
  EN_ROUTE:    { label: 'En Route',    color: '#60a5fa',   bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  STARTED:     { label: 'Started',     color: '#f97316',   bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)' },
  IN_PROGRESS: { label: 'In Progress', color: '#f97316',   bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.25)' },
  COMPLETED:   { label: 'Completed',   color: '#34d399',   bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)' },
  PENDING:     { label: 'Pending',     color: '#9ca3af',   bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)' },
};

const parse = (v) => {
  try { return Array.isArray(v) ? v : JSON.parse(v || '[]'); }
  catch { return []; }
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });

const ActionBtn = ({ onClick, disabled, gold, children, small }) => (
  <button onClick={onClick} disabled={disabled}
    className={`flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all active:scale-95 ${small ? 'text-xs py-2 px-3' : 'text-sm py-2.5 px-4'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    style={gold
      ? { background: GOLD, color: '#0b0f1a' }
      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
    {children}
  </button>
);

const ProfessionalJobCard = ({ booking, onStatusUpdate, onEditNotes, timeTracking, calculateWorkTime, isActive, onStartNavigation }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [expanded, setExpanded]     = useState(false);

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const services = parse(booking.services);
  const extras   = parse(booking.extras);
  const customer = booking.customer || booking;
  const vehicle  = booking.vehicle  || booking;

  const custName  = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  const custPhone = customer.phoneNumber || customer.phone || '';
  const custAddr  = `${customer.address || ''}, ${customer.city || ''}`.trim().replace(/^,\s*/, '');
  const vehLabel  = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();

  const update = async (newStatus) => {
    if (booking.status === newStatus || isUpdating) return;
    setIsUpdating(true);
    try { await onStatusUpdate(booking.id, newStatus); }
    finally { setIsUpdating(false); }
  };

  const getDirections = () => {
    const addr = encodeURIComponent(custAddr);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    window.open(isMobile
      ? `https://www.google.com/maps/dir/?api=1&destination=${addr}`
      : `https://maps.google.com/maps?q=${addr}`, '_blank');
    if (onStartNavigation) onStartNavigation(booking);
  };

  const sms = (msg) => window.open(`sms:${custPhone}?body=${encodeURIComponent(msg)}`, '_self');

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: isActive ? 'rgba(0,168,204,0.06)' : 'rgba(255,255,255,0.03)',
        border: isActive ? '1px solid rgba(0,168,204,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? '0 0 30px rgba(0,168,204,0.1)' : 'none',
      }}>

      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          {/* Status badge */}
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color }}>
            {status.label}
          </span>
          {/* Time badge */}
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Clock className="w-3 h-3" />
            <span>{booking.time}</span>
          </div>
        </div>

        {/* Customer */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(0,168,204,0.12)', color: GOLD_S }}>
            {custName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{custName}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatDate(booking.date)}</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>{custAddr}</p>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-2">
          <Car className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD_S }} />
          <p className="text-xs font-semibold text-white">{vehLabel}</p>
          {vehicle.type && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>· {vehicle.type}</span>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

      {/* Services preview */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {services.slice(0, 3).map((s, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(0,168,204,0.08)', color: GOLD_S, border: '1px solid rgba(0,168,204,0.15)' }}>
              {typeof s === 'string' ? s : `Service #${s}`}
            </span>
          ))}
          {services.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
              +{services.length - 3} more
            </span>
          )}
          {extras.slice(0, 2).map((a, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(52,211,153,0.08)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.15)' }}>
              +{typeof a === 'string' ? a : `Add-on #${a}`}
            </span>
          ))}
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {/* Contact row */}
          <div className="flex gap-2">
            <a href={`tel:${custPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            <button onClick={() => sms("Hi! I'll be arriving for your detailing appointment soon.")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <MessageSquare className="w-3.5 h-3.5" /> SMS
            </button>
            <button onClick={() => onEditNotes(booking)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <StickyNote className="w-3.5 h-3.5" /> Notes
            </button>
          </div>

          {/* Special instructions */}
          {booking.specialInstructions && (
            <div className="p-3 rounded-xl text-xs leading-relaxed"
              style={{ background: 'rgba(0,168,204,0.06)', border: '1px solid rgba(0,168,204,0.15)', color: 'rgba(255,255,255,0.65)' }}>
              <span className="font-semibold" style={{ color: GOLD_S }}>Note: </span>
              {booking.specialInstructions}
            </div>
          )}

          {/* Active timer */}
          {isActive && (
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(0,168,204,0.06)', border: '1px solid rgba(0,168,204,0.2)' }}>
              <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: GOLD_S }} />
              <span className="text-xs font-semibold" style={{ color: GOLD_S }}>Active · {calculateWorkTime()}</span>
            </div>
          )}

          {/* Job value */}
          {booking.totalPrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Job value</span>
              <span className="text-sm font-black" style={{
                background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>${parseFloat(booking.totalPrice).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Expand toggle */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs transition-all"
        style={{ color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> More</>}
      </button>

      {/* Action buttons */}
      <div className="px-4 pb-4 space-y-2">
        {booking.status === 'CONFIRMED' && (
          <>
            <ActionBtn gold onClick={() => { getDirections(); update('EN_ROUTE'); }} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              Start Navigation · Go En Route
            </ActionBtn>
            <ActionBtn onClick={() => update('STARTED')} disabled={isUpdating} small>
              <Play className="w-3.5 h-3.5" /> Skip to Started
            </ActionBtn>
          </>
        )}

        {booking.status === 'EN_ROUTE' && (
          <>
            <ActionBtn gold onClick={() => update('STARTED')} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Arrived — Start Job
            </ActionBtn>
            <ActionBtn onClick={() => sms("I've arrived and will begin shortly.")} small>
              <MapPin className="w-3.5 h-3.5" /> Notify Arrival
            </ActionBtn>
          </>
        )}

        {(booking.status === 'STARTED' || booking.status === 'IN_PROGRESS') && (
          <>
            <ActionBtn gold onClick={() => update('COMPLETED')} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Complete Job
            </ActionBtn>
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn onClick={() => sms("Work is progressing well. Will update when complete!")} small>
                <MessageSquare className="w-3.5 h-3.5" /> Progress SMS
              </ActionBtn>
              <ActionBtn small><Camera className="w-3.5 h-3.5" /> Before Photo</ActionBtn>
            </div>
          </>
        )}

        {booking.status === 'COMPLETED' && (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }}>
            <CheckCircle className="w-4 h-4" /> Completed
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalJobCard;
