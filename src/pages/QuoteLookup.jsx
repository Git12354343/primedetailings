// src/pages/QuoteLookup.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CheckCircle, RefreshCw, AlertCircle, ChevronRight, Loader2, X, Calendar } from 'lucide-react';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';

const STATUS_CONFIG = {
  NEW:              { label: 'Received',           desc: "We received your quote request and will review it shortly.",  color: '#60a5fa', step: 0 },
  REVIEWING:        { label: 'Reviewing',           desc: "We're reviewing your request and will send a price soon.",    color: '#f59e0b', step: 1 },
  QUOTED:           { label: 'Quote Ready',         desc: "Your quote is ready — see the price below and accept or decline.", color: '#00d4ff', step: 2 },
  CHANGE_REQUESTED: { label: 'Changes Requested',   desc: "We received your change request and are reviewing it.",      color: '#a78bfa', step: 1 },
  ACCEPTED:         { label: 'Accepted',             desc: "Quote accepted! We'll contact you soon to confirm the appointment.", color: '#34d399', step: 3 },
  DECLINED:         { label: 'Declined',             desc: "Quote declined. Feel free to reach out anytime.",           color: '#f87171', step: -1 },
  CONVERTED:        { label: 'Booked!',              desc: "Your quote was converted to a confirmed booking.",           color: '#a78bfa', step: 4 },
};
const STEPS = ['NEW','REVIEWING','QUOTED','ACCEPTED','CONVERTED'];

// ── Accept modal ──────────────────────────────────────────────────────────────
const AcceptModal = ({ quote, onClose, onDone }) => {
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const accept = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/quotes/${quote.referenceId}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredDate, preferredTime }),
      });
      const data = await res.json();
      if (data.success) onDone();
      else setError(data.message || 'Failed to accept quote.');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background:'#111827', border:'1px solid rgba(52,211,153,0.3)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background:'rgba(52,211,153,0.12)' }}>
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="font-bold text-white text-center text-lg mb-1">Accept Quote</h3>
        <p className="text-gray-500 text-sm text-center mb-5">Price: <strong className="text-cyan-400">${Number(quote.quotedPrice).toFixed(2)}</strong></p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Preferred Date <span className="normal-case">(optional)</span></label>
            <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', fontSize:'16px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Preferred Time <span className="normal-case">(optional)</span></label>
            <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', fontSize:'16px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }}>
              <option value="">Any time</option>
              {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t => (
                <option key={t} value={t}>{t.replace(':','h')}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-4">We'll confirm your exact appointment time within 24h.</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>Back</button>
          <button onClick={accept} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0b0f1a] disabled:opacity-50" style={{ background:'linear-gradient(135deg,#34d399,#10b981)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '✓ Accept Quote'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Decline modal ─────────────────────────────────────────────────────────────
const DeclineModal = ({ quote, onClose, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const decline = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/quotes/${quote.referenceId}/decline`, { method: 'POST' });
      const data = await res.json();
      if (data.success) onDone();
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background:'#111827', border:'1px solid rgba(239,68,68,0.25)' }}>
        <h3 className="font-bold text-white text-center text-lg mb-2">Decline Quote?</h3>
        <p className="text-gray-500 text-sm text-center mb-5">This will decline the quote. You can always request a new one.</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          <button onClick={decline} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, Decline'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Change request modal ──────────────────────────────────────────────────────
const ChangeModal = ({ quote, onClose, onDone }) => {
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!note.trim()) { setError('Please describe what you want changed.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/quotes/${quote.referenceId}/request-changes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success) onDone();
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background:'#111827', border:'1px solid rgba(167,139,250,0.25)' }}>
        <h3 className="font-bold text-white text-center text-lg mb-2">Request Changes</h3>
        <p className="text-gray-500 text-sm text-center mb-4">Tell us what you'd like adjusted.</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="e.g. I'd like to add paint correction to the package…"
          style={{ width:'100%', padding:'12px', borderRadius:'10px', fontSize:'14px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit', resize:'vertical', marginBottom:'12px' }} />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          <button onClick={submit} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0b0f1a] disabled:opacity-50" style={{ background:'linear-gradient(135deg,#a78bfa,#8b5cf6)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const QuoteLookup = () => {
  const [searchParams] = useSearchParams();
  const [ref,     setRef]     = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [quote,   setQuote]   = useState(null);
  const [error,   setError]   = useState('');
  const [modal,   setModal]   = useState(null); // 'accept'|'decline'|'change'
  const [toast,   setToast]   = useState('');

  const lookup = async (refId) => {
    const id = (refId || ref).trim().toUpperCase();
    if (!id) return;
    setLoading(true); setError(''); setQuote(null);
    try {
      const res  = await fetch(`${API}/quotes/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Not found.');
      setQuote(data.quote);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (searchParams.get('ref')) lookup(searchParams.get('ref')); }, []);

  const handleActionDone = (msg) => {
    setModal(null);
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
    lookup(quote.referenceId);
  };

  const cfg = quote ? (STATUS_CONFIG[quote.status] || STATUS_CONFIG.NEW) : null;
  const stepIdx = cfg ? STEPS.indexOf(quote.status) : -1;
  const canAct = quote && quote.status === 'QUOTED';

  return (
    <div style={{ background: '#0b0f1a', minHeight: '100vh' }} className="pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background:'rgba(0,168,204,0.08)', border:'1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Quote Status</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Track Your Quote</h1>
          <p className="text-gray-400 text-sm">Enter your reference number to check status and take action.</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input value={ref} onChange={e => setRef(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="Q-XXXXXX"
            style={{ flex:1, padding:'14px 18px', borderRadius:'14px', fontSize:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontFamily:'inherit', letterSpacing:'0.1em', fontWeight:700 }} />
          <button onClick={() => lookup()} disabled={loading} className="flex items-center gap-2 px-5 rounded-xl font-bold text-sm disabled:opacity-50" style={{ background: GOLD, color:'#0b0f1a', minHeight:'44px' }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {toast && <div className="px-4 py-3 rounded-xl mb-4 text-sm text-green-300" style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)' }}>{toast}</div>}
        {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}><AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /><p className="text-red-300 text-sm">{error}</p></div>}

        {quote && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${cfg.color}30` }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ background:`${cfg.color}10`, borderBottom:`1px solid ${cfg.color}20` }}>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <h2 className="text-xl font-black" style={{ color: cfg.color }}>{cfg.label}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">{cfg.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:`${cfg.color}20`, border:`1px solid ${cfg.color}40` }}>
                  <CheckCircle className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
              </div>

              {/* Progress */}
              {!['DECLINED','CHANGE_REQUESTED'].includes(quote.status) && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {STEPS.map((s, i) => (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: i <= stepIdx ? GOLD : 'rgba(255,255,255,0.05)', border: i === stepIdx ? '2px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)' }}>
                            {i <= stepIdx ? <CheckCircle className="w-3.5 h-3.5 text-black" /> : <div className="w-2 h-2 rounded-full bg-gray-600" />}
                          </div>
                          <span className="text-[9px] text-gray-600 hidden sm:block" style={{ maxWidth:'48px', textAlign:'center' }}>{STATUS_CONFIG[s]?.label}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className="flex-1 h-0.5 rounded-full" style={{ background: i < stepIdx ? 'linear-gradient(90deg,#00a8cc,#00d4ff)' : 'rgba(255,255,255,0.08)' }} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quoted price */}
            {quote.quotedPrice && (
              <div className="rounded-2xl px-5 py-4 text-center" style={{ background:'rgba(0,168,204,0.05)', border:'1px solid rgba(0,168,204,0.2)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Quoted Price</p>
                <div className="text-4xl font-black mb-1" style={{ background: GOLD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  ${Number(quote.quotedPrice).toFixed(2)}
                </div>
              </div>
            )}

            {/* Customer actions — only when QUOTED */}
            {canAct && (
              <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-500">Your Decision</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setModal('accept')} className="w-full py-3 rounded-xl text-sm font-bold text-[#0b0f1a]" style={{ background:'linear-gradient(135deg,#34d399,#10b981)', minHeight:'44px' }}>
                    ✓ Accept Quote
                  </button>
                  <button onClick={() => setModal('change')} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)', color:'#a78bfa', minHeight:'44px' }}>
                    Request Changes
                  </button>
                  <button onClick={() => setModal('decline')} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.4)', minHeight:'44px' }}>
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="rounded-2xl p-5 space-y-2.5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-white font-bold text-sm mb-3">Request Details</h3>
              {[
                ['Reference', quote.referenceId],
                ['Vehicle', `${[quote.year, quote.make, quote.model].filter(Boolean).join(' ') || ''} ${quote.vehicleType}`.trim()],
                ['Condition', quote.vehicleCondition],
                quote.packageName && ['Package', quote.packageName],
                quote.services?.length && ['Services', Array.isArray(quote.services) ? quote.services.join(', ') : quote.services],
                ['Submitted', new Date(quote.createdAt).toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' })],
              ].filter(Boolean).map(([label, value]) => value && (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wide flex-shrink-0">{label}</span>
                  <span className="text-white text-sm text-right">{value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => lookup(quote.referenceId)} className="flex items-center gap-1.5 mx-auto text-gray-500 text-sm hover:text-gray-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'accept'  && <AcceptModal  quote={quote} onClose={() => setModal(null)} onDone={() => handleActionDone('Quote accepted! We will contact you shortly.')} />}
      {modal === 'decline' && <DeclineModal quote={quote} onClose={() => setModal(null)} onDone={() => handleActionDone('Quote declined. Thank you.')} />}
      {modal === 'change'  && <ChangeModal  quote={quote} onClose={() => setModal(null)} onDone={() => handleActionDone('Change request sent! We will review and update your quote.')} />}
    </div>
  );
};

export default QuoteLookup;
