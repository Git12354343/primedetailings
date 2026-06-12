// src/components/admin/CustomerManagement.jsx
// CRM view: searchable customer list with lifetime value, VIP status,
// vehicles, full booking history, and editable notes. Includes the one-time
// "Build from booking history" backfill for existing data.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Star, Car, Loader2, ChevronRight, X,
  Phone, Mail, StickyNote, Database, CheckCircle, TrendingUp,
} from 'lucide-react';

const GOLD   = 'linear-gradient(135deg,#00a8cc,#00d4ff)';
const GOLD_S = '#00a8cc';
const cardD  = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const STATUS_COLORS = {
  COMPLETED:   '#34d399', CONFIRMED: '#00d4ff', PENDING: '#fbbf24',
  IN_PROGRESS: '#fb923c', EN_ROUTE:  '#fb923c', STARTED: '#fb923c',
  CANCELED:    '#f87171', NO_SHOW:   '#f87171',
};

const CustomerManagement = ({ adminToken }) => {
  const API = import.meta.env.VITE_API_URL;
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Secret': adminToken || '' };

  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(null);   // full profile
  const [profileBusy, setProfileBusy] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchCustomers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/customers${q ? `?search=${encodeURIComponent(q)}` : ''}`, { headers });
      const d   = await res.json();
      if (d.success) setCustomers(d.customers || []);
    } catch { /* surface via empty state */ }
    finally { setLoading(false); }
  }, [API, adminToken]); // eslint-disable-line

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => fetchCustomers(search), 350);
    return () => clearTimeout(id);
  }, [search]); // eslint-disable-line

  const openProfile = async (id) => {
    setProfileBusy(true);
    try {
      const res = await fetch(`${API}/customers/${id}`, { headers });
      const d   = await res.json();
      if (d.success) { setSelected(d.customer); setNotesDraft(d.customer.notes || ''); }
    } catch { /* ignore */ }
    finally { setProfileBusy(false); }
  };

  const updateCustomer = async (id, data) => {
    try {
      const res = await fetch(`${API}/customers/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
      const d   = await res.json();
      if (d.success) {
        setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
        setSelected(prev => (prev?.id === id ? { ...prev, ...data } : prev));
      }
      return d.success;
    } catch { return false; }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    await updateCustomer(selected.id, { notes: notesDraft });
    setSavingNotes(false);
  };

  const runBackfill = async () => {
    setBackfilling(true); setBackfillMsg('');
    try {
      const res = await fetch(`${API}/customers/backfill`, { method: 'POST', headers });
      const d   = await res.json();
      if (d.success) {
        setBackfillMsg(`Done — ${d.customersCreated} customers created, ${d.bookingsLinked} bookings linked.`);
        fetchCustomers();
      } else {
        setBackfillMsg(d.message || 'Backfill failed.');
      }
    } catch { setBackfillMsg('Network error.'); }
    finally { setBackfilling(false); }
  };

  // ── Aggregate header stats ────────────────────────────────────────────────
  const totalLtv  = customers.reduce((s, c) => s + (c.lifetimeValue || 0), 0);
  const vipCount  = customers.filter(c => c.isVip).length;
  const repeatCount = customers.filter(c => c.totalBookings > 1).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl" style={cardD}>
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: GOLD_S }} /> Customers
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {customers.length} customers · {repeatCount} repeat · {vipCount} VIP · {fmtMoney(totalLtv)} lifetime value
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email…"
            className="pl-9 pr-3 py-2 rounded-xl text-sm w-64"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-14 rounded-2xl" style={cardD}>
          <Database className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-white font-semibold mb-1">{search ? 'No customers match your search.' : 'No customer records yet'}</p>
          {!search && (
            <>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Build customer profiles from your existing booking history — takes a few seconds.
              </p>
              <button onClick={runBackfill} disabled={backfilling}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50"
                style={{ background: GOLD }}>
                {backfilling ? <><Loader2 className="w-4 h-4 animate-spin" /> Building…</> : <><Database className="w-4 h-4" /> Build from booking history</>}
              </button>
            </>
          )}
          {backfillMsg && <p className="text-sm mt-4" style={{ color: GOLD_S }}>{backfillMsg}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {backfillMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
              <CheckCircle className="w-4 h-4" /> {backfillMsg}
            </div>
          )}
          {customers.map(c => (
            <button key={c.id} onClick={() => openProfile(c.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-white/[0.05]"
              style={cardD}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                style={{ background: c.isVip ? GOLD : 'rgba(255,255,255,0.07)', color: c.isVip ? '#0b0f1a' : 'rgba(255,255,255,0.5)' }}>
                {(c.firstName?.[0] || '') + (c.lastName?.[0] || '') || '?'}
              </div>
              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm truncate">
                    {c.firstName} {c.lastName}
                  </span>
                  {c.isVip && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                      style={{ background: 'rgba(0,168,204,0.15)', color: '#00d4ff' }}>
                      <Star className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                  {c.marketingConsent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>opted-in</span>
                  )}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {c.phone}{c.email ? ` · ${c.email}` : ''}
                  {c.vehicles?.length > 0 && ` · ${c.vehicles.map(v => v.make ? `${v.make} ${v.model || ''}`.trim() : v.type).join(', ')}`}
                </div>
              </div>
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-right">
                <div>
                  <div className="text-white font-bold text-sm">{c.totalBookings}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>bookings</div>
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#34d399' }}>{fmtMoney(c.lifetimeValue)}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>lifetime</div>
                </div>
                <div className="w-20">
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{fmtDate(c.lastBooking)}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>last visit</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </button>
          ))}
        </div>
      )}

      {/* ── Profile drawer ──────────────────────────────────────────────────── */}
      {(selected || profileBusy) && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md h-full overflow-y-auto custom-scrollbar p-5"
            style={{ background: '#0f1624', borderLeft: '1px solid rgba(0,168,204,0.15)' }}
            onClick={e => e.stopPropagation()}>

            {profileBusy || !selected ? (
              <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} /></div>
            ) : (
              <>
                {/* Drawer header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-white font-black text-xl">{selected.firstName} {selected.lastName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <a href={`tel:${selected.phone}`} className="flex items-center gap-1 hover:text-cyan-400"><Phone className="w-3 h-3" /> {selected.phone}</a>
                      {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-1 hover:text-cyan-400"><Mail className="w-3 h-3" /> {selected.email}</a>}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Lifetime value', value: fmtMoney(selected.lifetimeValue), icon: TrendingUp, color: '#34d399' },
                    { label: 'Bookings',       value: selected.bookings?.length || 0,   icon: Car,        color: '#00d4ff' },
                    { label: 'Completed',      value: selected.completedBookings || 0,  icon: CheckCircle, color: GOLD_S  },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="p-3 rounded-xl text-center" style={cardD}>
                      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                      <div className="text-white font-black text-base leading-none">{value}</div>
                      <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* VIP + consent toggles */}
                <div className="flex gap-2 mb-5">
                  <button onClick={() => updateCustomer(selected.id, { isVip: !selected.isVip })}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={selected.isVip
                      ? { background: GOLD, color: '#0b0f1a' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    <Star className="w-4 h-4" /> {selected.isVip ? 'VIP Customer' : 'Mark as VIP'}
                  </button>
                  <button onClick={() => updateCustomer(selected.id, { marketingConsent: !selected.marketingConsent })}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={selected.marketingConsent
                      ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {selected.marketingConsent ? 'Marketing: opted in' : 'Marketing: opted out'}
                  </button>
                </div>

                {/* Vehicles */}
                {selected.vehicles?.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(0,168,204,0.7)' }}>Vehicles</h4>
                    <div className="space-y-2">
                      {selected.vehicles.map(v => (
                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl" style={cardD}>
                          <Car className="w-4 h-4" style={{ color: GOLD_S }} />
                          <span className="text-sm text-white font-medium">
                            {[v.year, v.make, v.model].filter(Boolean).join(' ') || v.type}
                          </span>
                          <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>{v.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'rgba(0,168,204,0.7)' }}>
                    <StickyNote className="w-3 h-3" /> Notes
                  </h4>
                  <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)}
                    placeholder="Gate codes, preferences, special requests…"
                    className="w-full p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', minHeight: '80px', resize: 'vertical' }} />
                  {notesDraft !== (selected.notes || '') && (
                    <button onClick={saveNotes} disabled={savingNotes}
                      className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-black disabled:opacity-50"
                      style={{ background: GOLD }}>
                      {savingNotes ? 'Saving…' : 'Save notes'}
                    </button>
                  )}
                </div>

                {/* Booking history */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(0,168,204,0.7)' }}>
                    Booking history ({selected.bookings?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(selected.bookings || []).map(b => (
                      <div key={b.id} className="p-3 rounded-xl" style={cardD}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white text-sm font-semibold">
                            {fmtDate(b.date)} · {b.time}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${STATUS_COLORS[b.status] || '#9ca3af'}1f`, color: STATUS_COLORS[b.status] || '#9ca3af' }}>
                            {b.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {b.package?.name || b.vehicleType}{b.make ? ` · ${b.make} ${b.model || ''}` : ''} · #{b.confirmationCode}
                          </span>
                          {b.totalPrice && <span className="text-xs font-bold" style={{ color: '#34d399' }}>{fmtMoney(b.totalPrice)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
