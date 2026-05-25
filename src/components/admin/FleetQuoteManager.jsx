// src/components/admin/FleetQuoteManager.jsx
import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, Car, RefreshCw, ChevronDown, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD_S  = '#c9a84c';

const STATUS_STYLES = {
  NEW:       { bg:'rgba(201,168,76,0.12)',  color:'#f5d376',  label:'New'       },
  CONTACTED: { bg:'rgba(96,165,250,0.12)',  color:'#60a5fa',  label:'Contacted' },
  QUOTED:    { bg:'rgba(167,139,250,0.12)', color:'#a78bfa',  label:'Quoted'    },
  ACCEPTED:  { bg:'rgba(52,211,153,0.12)',  color:'#34d399',  label:'Accepted'  },
  DECLINED:  { bg:'rgba(239,68,68,0.12)',   color:'#ef4444',  label:'Declined'  },
  ARCHIVED:  { bg:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.35)', label:'Archived' },
};

const STATUS_OPTIONS = Object.entries(STATUS_STYLES).map(([value, s]) => ({ value, label: s.label }));

const FleetQuoteManager = ({ adminToken }) => {
  const [quotes,   setQuotes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const headers = { 'X-Admin-Secret': adminToken, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/fleet/admin/quotes`, { headers });
      const data = await res.json();
      if (data.success) setQuotes(data.quotes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res  = await fetch(`${API_URL}/fleet/admin/quotes/${id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setQuotes(prev => prev.map(q => q.id === id ? data.quote : q));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const updateNotes = async (id, adminNotes) => {
    try {
      const res  = await fetch(`${API_URL}/fleet/admin/quotes/${id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (data.success) setQuotes(prev => prev.map(q => q.id === id ? data.quote : q));
    } catch {}
  };

  const visible = quotes.filter(q => q.status !== 'ARCHIVED');

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Fleet Quotes</h2>
          <p className="text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>
            {visible.length} active quote{visible.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw className="w-4 h-4 text-white" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color:'rgba(255,255,255,0.2)' }} />
          <p className="text-gray-500 text-sm">No fleet quote requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(q => {
            const style = STATUS_STYLES[q.status] || STATUS_STYLES.NEW;
            const isOpen = expanded === q.id;

            return (
              <div key={q.id} className="rounded-2xl overflow-hidden"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>

                {/* Row header */}
                <button onClick={() => setExpanded(isOpen ? null : q.id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)' }}>
                      <Building2 className="w-4 h-4" style={{ color: GOLD_S }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{q.companyName}</p>
                      <p className="text-xs" style={{ color:'rgba(255,255,255,0.45)' }}>
                        {q.contactName} · {q.vehicleCount} vehicles · {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: style.bg, color: style.color }}>{style.label}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4" style={{ color:'rgba(255,255,255,0.4)', transform:'rotate(180deg)' }} />
                             : <ChevronDown className="w-4 h-4" style={{ color:'rgba(255,255,255,0.4)' }} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
                          <a href={`tel:${q.phone}`} className="text-sm text-white hover:text-yellow-400">{q.phone}</a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
                          <a href={`mailto:${q.email}`} className="text-sm text-white hover:text-yellow-400">{q.email}</a>
                        </div>
                        <div className="flex items-start gap-2">
                          <Car className="w-3.5 h-3.5 mt-0.5" style={{ color: GOLD_S }} />
                          <span className="text-sm" style={{ color:'rgba(255,255,255,0.7)' }}>
                            {Array.isArray(q.vehicleTypes) ? q.vehicleTypes.join(', ') : JSON.stringify(q.vehicleTypes)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.4)' }}>Services Requested</p>
                        <p className="text-sm" style={{ color:'rgba(255,255,255,0.75)' }}>{q.servicesRequested}</p>
                        <p className="text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>Frequency: {q.frequency}</p>
                        {q.locationAddress && <p className="text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>Location: {q.locationAddress}</p>}
                      </div>
                    </div>

                    {q.additionalNotes && (
                      <div className="mb-4 px-3 py-2.5 rounded-xl"
                        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>Notes from client</p>
                        <p className="text-sm" style={{ color:'rgba(255,255,255,0.7)' }}>{q.additionalNotes}</p>
                      </div>
                    )}

                    {/* Update status */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {STATUS_OPTIONS.filter(s => s.value !== 'ARCHIVED').map(s => (
                        <button key={s.value}
                          disabled={q.status === s.value || updating === q.id}
                          onClick={() => updateStatus(q.id, s.value)}
                          className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-40"
                          style={{
                            background: q.status === s.value ? STATUS_STYLES[s.value].bg : 'rgba(255,255,255,0.05)',
                            color: q.status === s.value ? STATUS_STYLES[s.value].color : 'rgba(255,255,255,0.5)',
                            border: `1px solid ${q.status === s.value ? STATUS_STYLES[s.value].color + '40' : 'rgba(255,255,255,0.1)'}`,
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Admin notes */}
                    <textarea
                      defaultValue={q.adminNotes || ''}
                      placeholder="Add admin notes..."
                      rows={2}
                      onBlur={e => updateNotes(q.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-white text-xs resize-none outline-none"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}
                    />

                    <div className="flex justify-end mt-2">
                      <button onClick={() => updateStatus(q.id, 'ARCHIVED')}
                        className="text-xs px-3 py-1.5 rounded-xl"
                        style={{ color:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.07)' }}>
                        Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FleetQuoteManager;
