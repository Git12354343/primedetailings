// src/components/admin/AdminQuoteManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Phone, Mail, MapPin, Car, DollarSign, Calendar, Loader2, Check, X, ExternalLink } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUS_STYLES = {
  NEW:       'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  REVIEWING: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  QUOTED:    'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  ACCEPTED:  'bg-green-500/15 text-green-300 border border-green-500/30',
  DECLINED:  'bg-red-500/15 text-red-300 border border-red-500/30',
  CONVERTED: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
};
const ALL_STATUSES = ['NEW','REVIEWING','QUOTED','ACCEPTED','DECLINED','CONVERTED'];
const CONDITION_LABELS = { LIGHT:'Light', MODERATE:'Moderate', HEAVY:'Heavy' };

const iStyle = {
  width:'100%', padding:'10px 14px', borderRadius:'10px', fontSize:'14px',
  outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)',
  border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit',
};

// ── Convert Modal ─────────────────────────────────────────────────────────────
const ConvertModal = ({ quote, adminToken, onClose, onDone }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const convert = async () => {
    if (!date || !time) { setError('Date and time required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/quotes/admin/${quote.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-admin-secret': adminToken },
        body: JSON.stringify({ date, time }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      onDone(data.confirmationCode);
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background:'#111827', border:'1px solid rgba(0,168,204,0.25)' }}>
        <h3 className="text-white font-bold text-lg mb-1">Convert to Booking</h3>
        <p className="text-gray-500 text-sm mb-5">Set the appointment date and time to create the booking.</p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Time *</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={iStyle} />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          <button onClick={convert} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0b0f1a] disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Quote Card ────────────────────────────────────────────────────────────────
const QuoteCard = ({ quote, adminToken, onRefresh }) => {
  const [open,         setOpen]         = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPrice,  setSavingPrice]  = useState(false);
  const [price,        setPrice]        = useState(quote.quotedPrice || '');
  const [adminNotes,   setAdminNotes]   = useState(quote.adminNotes || '');
  const [convertModal, setConvertModal] = useState(false);
  const [convertedCode, setConvertedCode] = useState(null);

  const headers = { 'Content-Type':'application/json', 'x-admin-secret': adminToken };

  const updateStatus = async (status) => {
    setSavingStatus(true);
    await fetch(`${API}/quotes/admin/${quote.id}`, {
      method:'PUT', headers, body: JSON.stringify({ status }),
    });
    setSavingStatus(false); onRefresh();
  };

  const savePrice = async () => {
    setSavingPrice(true);
    await fetch(`${API}/quotes/admin/${quote.id}`, {
      method:'PUT', headers,
      body: JSON.stringify({ quotedPrice: price, adminNotes, status: price ? 'QUOTED' : undefined }),
    });
    setSavingPrice(false); onRefresh();
  };

  const services = (() => { try { return JSON.parse(quote.services); } catch { return []; } })();
  const vehicleLine = [quote.year, quote.make, quote.model].filter(Boolean).join(' ') || quote.vehicleType;
  const createdAt = new Date(quote.createdAt).toLocaleDateString('en-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
      {/* Header row */}
      <button className="w-full flex items-start justify-between gap-3 p-5 text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-white font-bold">{quote.customerName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[quote.status] || ''}`}>{quote.status}</span>
            <span className="text-gray-600 text-xs font-mono">{quote.referenceId}</span>
          </div>
          <p className="text-gray-400 text-sm truncate">{vehicleLine} · {CONDITION_LABELS[quote.vehicleCondition] || quote.vehicleCondition}</p>
          {services.length > 0 && <p className="text-gray-500 text-xs mt-0.5 truncate">{services.join(', ')}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {quote.quotedPrice && (
            <span className="text-cyan-400 font-bold">${Number(quote.quotedPrice).toFixed(2)}</span>
          )}
          <span className="text-gray-600 text-xs">{createdAt}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">
          {/* Customer + vehicle details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs text-gray-500 uppercase tracking-widest">Customer</h4>
              <div className="flex items-center gap-2 text-sm text-gray-300"><Phone className="w-3.5 h-3.5 text-gray-500" />{quote.phoneNumber}</div>
              {quote.email && <div className="flex items-center gap-2 text-sm text-gray-300"><Mail className="w-3.5 h-3.5 text-gray-500" />{quote.email}</div>}
              <div className="flex items-center gap-2 text-sm text-gray-300"><MapPin className="w-3.5 h-3.5 text-gray-500" />{quote.address}, {quote.city} {quote.postalCode}</div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs text-gray-500 uppercase tracking-widest">Vehicle</h4>
              <div className="flex items-center gap-2 text-sm text-gray-300"><Car className="w-3.5 h-3.5 text-gray-500" />{vehicleLine}</div>
              <div className="text-sm text-gray-400">{quote.vehicleType} · <span className="capitalize">{(CONDITION_LABELS[quote.vehicleCondition] || quote.vehicleCondition)?.toLowerCase()} condition</span></div>
              {quote.packageName && <div className="text-sm text-cyan-400">Package: {quote.packageName}</div>}
              {services.length > 0 && <div className="text-sm text-gray-300">{services.join(', ')}</div>}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-1">Customer Notes</h4>
              <p className="text-gray-300 text-sm">{quote.notes}</p>
            </div>
          )}

          {/* Price & admin notes */}
          <div className="p-4 rounded-xl space-y-3" style={{ background:'rgba(0,168,204,0.04)', border:'1px solid rgba(0,168,204,0.15)' }}>
            <h4 className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Set Price & Notes</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quoted Price ($)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" type="number" style={iStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Admin Notes</label>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} style={{ ...iStyle, resize:'vertical' }} placeholder="Internal notes…" />
            </div>
            <button onClick={savePrice} disabled={savingPrice}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-[#0b0f1a] disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
              {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {price ? 'Save Price & Notify Customer' : 'Save Notes'}
            </button>
          </div>

          {/* Status controls */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.filter(s => s !== quote.status).map(s => (
                <button key={s} onClick={() => updateStatus(s)} disabled={savingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)' }}>
                  → {s}
                </button>
              ))}
            </div>
          </div>

          {/* Convert to booking */}
          {(quote.status === 'QUOTED' || quote.status === 'ACCEPTED') && !quote.bookingId && (
            <button onClick={() => setConvertModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.3)', color:'#a78bfa' }}>
              <ExternalLink className="w-4 h-4" /> Convert to Booking
            </button>
          )}
          {quote.bookingId && (
            <div className="text-center text-purple-300 text-sm">✓ Converted — Booking #{quote.bookingId}</div>
          )}

          {/* Convert modal */}
          {convertModal && (
            <ConvertModal quote={quote} adminToken={adminToken} onClose={() => setConvertModal(false)}
              onDone={(code) => { setConvertModal(false); setConvertedCode(code); onRefresh(); }} />
          )}
          {convertedCode && (
            <div className="text-center text-green-400 text-sm">✓ Booking created — Code: <span className="font-mono font-bold">{convertedCode}</span></div>
          )}
        </div>
      )}
    </div>
  );
};

// ── AdminQuoteManager ─────────────────────────────────────────────────────────
const AdminQuoteManager = ({ adminToken }) => {
  const [quotes,     setQuotes]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const url = filter && filter !== 'ALL'
        ? `${API}/quotes/admin/all?status=${filter}`
        : `${API}/quotes/admin/all`;
      const res  = await fetch(url, { headers: { 'x-admin-secret': adminToken } });
      const data = await res.json();
      if (data.success) setQuotes(data.quotes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [adminToken, filter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const FILTERS = ['ALL', ...ALL_STATUSES];
  const pendingCount = quotes.filter(q => ['NEW','REVIEWING'].includes(q.status)).length;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            Quote Requests
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">{pendingCount} pending</span>
            )}
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage retail custom-quote requests</p>
        </div>
        <button onClick={() => fetchQuotes(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: filter === f ? 'rgba(0,168,204,0.15)' : 'rgba(255,255,255,0.04)',
              border: filter === f ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: filter === f ? '#00d4ff' : 'rgba(255,255,255,0.6)',
            }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" /> Loading quotes…
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-medium text-white mb-1">No quote requests yet</p>
          <p className="text-sm">{filter !== 'ALL' ? `No ${filter} quotes.` : 'Quote requests will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map(q => <QuoteCard key={q.id} quote={q} adminToken={adminToken} onRefresh={() => fetchQuotes(true)} />)}
        </div>
      )}
    </div>
  );
};

export default AdminQuoteManager;
