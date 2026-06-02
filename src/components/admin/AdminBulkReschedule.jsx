// src/components/admin/AdminBulkReschedule.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AdminBulkReschedule = ({ adminToken }) => {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading,  setLoading]  = useState(true);
  const [action,   setAction]   = useState('reschedule'); // 'reschedule'|'cancel'
  const [newDate,  setNewDate]  = useState('');
  const [newTime,  setNewTime]  = useState('');
  const [shiftDays,setShiftDays]= useState(1);
  const [running,  setRunning]  = useState(false);
  const [results,  setResults]  = useState(null);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetchB = async () => {
      setLoading(true);
      try {
        const p = filterDate ? `?dateFrom=${filterDate}&dateTo=${filterDate}` : '';
        const res  = await fetch(`${API}/admin/all-bookings${p}`, { headers:{ 'x-admin-secret': adminToken } });
        const data = await res.json();
        if (data.success) setBookings((data.bookings || []).filter(b => !['COMPLETED','CANCELED','NO_SHOW'].includes(b.status)));
      } catch {} finally { setLoading(false); }
    };
    fetchB();
  }, [adminToken, filterDate]);

  const toggleAll  = () => setSelected(s => s.size === bookings.length ? new Set() : new Set(bookings.map(b => b.confirmationCode)));
  const toggleOne  = (code) => setSelected(s => { const n = new Set(s); n.has(code) ? n.delete(code) : n.add(code); return n; });

  const runBulk = async () => {
    if (!selected.size) return;
    if (action === 'reschedule' && !newDate && !shiftDays) return;
    setRunning(true); setResults(null);
    const codes = [...selected];
    const ok = [], fail = [];
    for (const code of codes) {
      try {
        let targetDate = newDate;
        if (!targetDate && shiftDays) {
          const booking = bookings.find(b => b.confirmationCode === code);
          if (booking?.date) {
            const d = new Date(booking.date.split('T')[0] + 'T12:00:00');
            d.setDate(d.getDate() + parseInt(shiftDays));
            targetDate = d.toISOString().split('T')[0];
          }
        }
        const endpoint = action === 'cancel' ? `/bookings/${code}/cancel` : `/bookings/${code}/reschedule`;
        const body = action === 'cancel' ? { adminOverride: true, reason: 'Bulk admin action' }
                                         : { date: targetDate, time: newTime || '09:00', adminOverride: true };
        const res = await fetch(`${API}${endpoint}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-secret':adminToken}, body:JSON.stringify(body) });
        const data = await res.json();
        if (data.success) ok.push(code); else fail.push({ code, msg: data.message });
      } catch (e) { fail.push({ code, msg: e.message }); }
    }
    setResults({ ok, fail });
    setRunning(false);
    setSelected(new Set());
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">Bulk Reschedule / Cancel</h2>
        <p className="text-gray-500 text-sm mt-0.5">Select bookings and apply an action to all at once.</p>
      </div>

      {results && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: results.fail.length ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${results.fail.length ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}` }}>
          <p className="font-bold text-sm" style={{ color: results.fail.length ? '#f87171' : '#34d399' }}>
            ✓ {results.ok.length} succeeded{results.fail.length ? `, ✗ ${results.fail.length} failed` : ''}
          </p>
          {results.fail.map(f => <p key={f.code} className="text-xs text-red-300 mt-1">{f.code}: {f.msg}</p>)}
        </div>
      )}

      {/* Controls */}
      <div className="rounded-2xl p-5 mb-5 space-y-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Filter by Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              style={{ width:'100%', padding:'9px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Action</label>
            <select value={action} onChange={e => setAction(e.target.value)} style={{ width:'100%', padding:'9px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }}>
              <option value="reschedule">Reschedule</option>
              <option value="cancel">Cancel All</option>
            </select>
          </div>
          {action === 'reschedule' && (
            <>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Shift by N days</label>
                <input type="number" value={shiftDays} onChange={e => setShiftDays(e.target.value)} min={1}
                  style={{ width:'100%', padding:'9px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Or set exact date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  style={{ width:'100%', padding:'9px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
              </div>
            </>
          )}
        </div>
        <button onClick={runBulk} disabled={running || !selected.size}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
          style={{ background: action === 'cancel' ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#00a8cc,#00d4ff)', border: action === 'cancel' ? '1px solid rgba(239,68,68,0.3)' : 'none', color: action === 'cancel' ? '#f87171' : '#0b0f1a' }}>
          {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Apply to ${selected.size} selected`}
        </button>
      </div>

      {/* Booking list */}
      <div className="mb-3 flex items-center gap-2">
        <input type="checkbox" checked={selected.size === bookings.length && bookings.length > 0} onChange={toggleAll} />
        <span className="text-gray-500 text-sm">Select all ({bookings.length} bookings)</span>
      </div>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-400" /></div>
      : bookings.length === 0 ? <p className="text-gray-500 text-sm text-center py-8">No bookings found.</p>
      : (
        <div className="space-y-2">
          {bookings.map(b => (
            <label key={b.confirmationCode} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
              style={{ background: selected.has(b.confirmationCode) ? 'rgba(0,168,204,0.08)' : 'rgba(255,255,255,0.02)', border:`1px solid ${selected.has(b.confirmationCode) ? 'rgba(0,168,204,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
              <input type="checkbox" checked={selected.has(b.confirmationCode)} onChange={() => toggleOne(b.confirmationCode)} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{b.customer?.firstName} {b.customer?.lastName} <span className="text-gray-500 font-mono text-xs ml-1">{b.confirmationCode}</span></p>
                <p className="text-gray-500 text-xs">{b.date?.split('T')[0]} at {b.time} · {b.vehicleType}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)' }}>{b.status}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBulkReschedule;
