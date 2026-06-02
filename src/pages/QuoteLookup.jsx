// src/pages/QuoteLookup.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CheckCircle, Clock, RefreshCw, AlertCircle, ChevronRight, Car, DollarSign, Loader2 } from 'lucide-react';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';

const STATUS_CONFIG = {
  NEW:       { label: 'Received',          desc: 'We received your quote request.',           color: '#60a5fa', step: 0 },
  REVIEWING: { label: 'Reviewing',         desc: 'We\'re reviewing your request.',            color: '#f59e0b', step: 1 },
  QUOTED:    { label: 'Quote Ready',       desc: 'Your quote is ready — see the price below.',color: '#00d4ff', step: 2 },
  ACCEPTED:  { label: 'Accepted',          desc: 'Quote accepted. We\'ll be in touch.',       color: '#34d399', step: 3 },
  DECLINED:  { label: 'Not Proceeding',    desc: 'Quote declined.',                           color: '#f87171', step: -1 },
  CONVERTED: { label: 'Booked',            desc: 'Converted to a confirmed booking!',         color: '#a78bfa', step: 4 },
};
const STEPS = ['NEW','REVIEWING','QUOTED','ACCEPTED','CONVERTED'];

const QuoteLookup = () => {
  const [searchParams] = useSearchParams();
  const [ref,     setRef]     = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [quote,   setQuote]   = useState(null);
  const [error,   setError]   = useState('');

  const lookup = async (refId) => {
    const id = (refId || ref).trim().toUpperCase();
    if (!id) return;
    setLoading(true); setError(''); setQuote(null);
    try {
      const res  = await fetch(`${API}/quotes/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Not found.');
      setQuote(data.quote);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (searchParams.get('ref')) lookup(searchParams.get('ref')); }, []);

  const cfg = quote ? (STATUS_CONFIG[quote.status] || STATUS_CONFIG.NEW) : null;
  const stepIdx = cfg ? STEPS.indexOf(quote.status) : -1;

  return (
    <div style={{ background: '#0b0f1a', minHeight: '100vh' }} className="pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background:'rgba(0,168,204,0.08)', border:'1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Quote Status</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Track Your Quote</h1>
          <p className="text-gray-400 text-sm">Enter your reference number to check the status.</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-8">
          <input value={ref} onChange={e => setRef(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="Q-XXXXXX"
            style={{ flex:1, padding:'14px 18px', borderRadius:'14px', fontSize:'16px',
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
              color:'#fff', fontFamily:'inherit', letterSpacing:'0.1em', fontWeight:700 }}
          />
          <button onClick={() => lookup()} disabled={loading}
            className="flex items-center gap-2 px-5 rounded-xl font-bold text-sm disabled:opacity-50"
            style={{ background: GOLD, color:'#0b0f1a', minHeight:'44px', minWidth:'44px' }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6"
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {quote && (
          <div className="space-y-5">
            {/* Status card */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${cfg.color}30` }}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background:`${cfg.color}10`, borderBottom:`1px solid ${cfg.color}20` }}>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <h2 className="text-xl font-black" style={{ color: cfg.color }}>{cfg.label}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">{cfg.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background:`${cfg.color}20`, border:`1px solid ${cfg.color}40` }}>
                  <CheckCircle className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
              </div>

              {/* Progress bar */}
              {quote.status !== 'DECLINED' && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {STEPS.map((s, i) => {
                      const active  = i <= stepIdx;
                      const current = i === stepIdx;
                      return (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                              style={{
                                background: active ? GOLD : 'rgba(255,255,255,0.05)',
                                border: current ? '2px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)',
                              }}>
                              {active ? <CheckCircle className="w-3.5 h-3.5 text-black" /> : <div className="w-2 h-2 rounded-full bg-gray-600" />}
                            </div>
                            <span className="text-[9px] text-gray-600 text-center leading-tight hidden sm:block" style={{ maxWidth:'48px' }}>
                              {STATUS_CONFIG[s]?.label}
                            </span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className="flex-1 h-0.5 rounded-full"
                              style={{ background: i < stepIdx ? 'linear-gradient(90deg, #00a8cc, #00d4ff)' : 'rgba(255,255,255,0.08)' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quote price (if quoted) */}
            {quote.quotedPrice && (
              <div className="rounded-2xl px-5 py-4 text-center"
                style={{ background:'rgba(0,168,204,0.05)', border:'1px solid rgba(0,168,204,0.2)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Your Quoted Price</p>
                <div className="text-4xl font-black mb-1" style={{ background: GOLD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  ${Number(quote.quotedPrice).toFixed(2)}
                </div>
                <p className="text-xs text-gray-600">Contact us to accept: <a href="tel:+14387968001" className="text-cyan-400">(438) 796-8001</a></p>
              </div>
            )}

            {/* Details */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-white font-bold text-sm mb-3">Request Details</h3>
              {[
                ['Reference', quote.referenceId],
                ['Vehicle', `${[quote.year, quote.make, quote.model].filter(Boolean).join(' ') || ''} ${quote.vehicleType}`.trim()],
                ['Condition', quote.vehicleCondition],
                quote.packageName && ['Package', quote.packageName],
                quote.services?.length && ['Services', quote.services.join(', ')],
                ['Submitted', new Date(quote.createdAt).toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' })],
              ].filter(Boolean).map(([label, value]) => value && (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wide flex-shrink-0">{label}</span>
                  <span className="text-white text-sm text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Booking link if converted */}
            {quote.bookingId && (
              <Link to={`/lookup`} className="btn-luxury flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold">
                Track Your Booking <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            <button onClick={() => lookup()} className="flex items-center gap-1.5 mx-auto text-gray-500 text-sm hover:text-gray-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteLookup;
