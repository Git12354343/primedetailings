import Seo from '../components/Seo';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Clock, Star, CheckCircle,
  AlertCircle, Loader2, ChevronRight, MessageSquare, Send
} from 'lucide-react';
import useInView from '../hooks/useInView';
import ServiceAreaMap from '../components/ServiceAreaMap';

const GOLD  = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';

/* ── Quick-contact channel cards ─────────────────────────────────────── */
const CHANNELS = [
  {
    label: 'Call us',
    sub: 'Mon–Sat, 8 AM–7 PM',
    icon: Phone,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
    href: 'tel:+14387968001',
    cta: '(438) 796-8001',
  },
  {
    label: 'WhatsApp',
    sub: 'Fastest response',
    icon: MessageSquare,
    color: '#25d366',
    bg: 'rgba(37,211,102,0.08)',
    border: 'rgba(37,211,102,0.2)',
    href: 'https://wa.me/14387968001',
    cta: 'Open WhatsApp',
  },
  {
    label: 'Email',
    sub: 'Reply within 24 h',
    icon: Mail,
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.2)',
    href: 'mailto:info@prestigeplus.services',
    cta: 'info@prestigeplus.services',
  },
];

const ChannelCard = ({ ch, visible, delay }) => (
  <a
    href={ch.href}
    target={ch.href.startsWith('http') ? '_blank' : undefined}
    rel="noreferrer"
    className="group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5"
    style={{
      background: ch.bg,
      border: `1px solid ${ch.border}`,
      transition: 'opacity .5s, transform .5s',
      transitionDelay: `${delay}s`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(12px)',
      minHeight: '100px',
    }}
  >
    {/* Top row: icon + label + arrow */}
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}33` }}>
        <ch.icon className="w-4 h-4" style={{ color: ch.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">{ch.label}</p>
        <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{ch.sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
        style={{ color: ch.color }} />
    </div>
    {/* CTA value on its own line */}
    <p className="text-sm font-semibold truncate" style={{ color: ch.color }}>
      {ch.cta}
    </p>
  </a>
);

/* ── Reusable input style helpers ────────────────────────────────────── */
const inputCls = 'w-full bg-transparent text-white text-sm outline-none placeholder-gray-600';
const wrapStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '12px 16px',
  transition: 'border-color .2s',
};
const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(0,168,204,0.8)',
  marginBottom: '8px',
};

const Field = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

/* ── Main component ──────────────────────────────────────────────────── */
const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId]         = useState(null);
  const [error, setError]         = useState('');

  const [heroRef,     heroVis]     = useInView({ threshold: 0.1 });
  const [channelsRef, channelsVis] = useInView({ threshold: 0.2 });
  const [formRef,     formVis]     = useInView({ threshold: 0.1 });

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); if (error) setError(''); };

  const focus = e => (e.target.parentElement || e.target).style.borderColor = GOLD_S;
  const blur  = e => (e.target.parentElement || e.target).style.borderColor = 'rgba(255,255,255,0.1)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setRefId(data.referenceId); }
      else setError(data.error || 'Failed to send message. Please try again.');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0b0f1a' }}>
      <Seo page="contact" path="/contact" />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,168,204,0.3), transparent)' }} />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl"
            style={{ background: 'rgba(0,168,204,0.04)' }} />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full blur-3xl"
            style={{ background: 'rgba(0,168,204,0.03)' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10"
          style={{ transition: 'opacity .7s, transform .7s', opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(20px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)', color: GOLD_S }}>
            <MessageSquare className="w-3.5 h-3.5" /> Get in Touch
          </div>
          <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-[1.02]" style={{ letterSpacing: '-0.02em' }}>
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              We'd love
            </span>{' '}
            <span className="text-white">to hear from you.</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Questions, quotes, or just curious about what we can do for your vehicle — pick any channel that works for you.
          </p>
        </div>
      </section>

      {/* ── Channel cards ─────────────────────────────────────────────── */}
      <section ref={channelsRef} className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {CHANNELS.map((ch, i) => (
            <ChannelCard key={ch.label} ch={ch} visible={channelsVis} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>or send a message</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>
      </div>

      {/* ── Main grid: form + info ─────────────────────────────────────── */}
      <section ref={formRef} className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ── Form (3 cols) ────────────────────────────────────────── */}
          <div className="lg:col-span-3"
            style={{ transition: 'opacity .6s, transform .6s', opacity: formVis ? 1 : 0, transform: formVis ? 'none' : 'translateY(16px)' }}>
            <div className="rounded-2xl p-7 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.3)' }}>
                    <CheckCircle className="w-10 h-10" style={{ color: GOLD_S }} />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-3">Message Received</h2>
                  <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    We'll get back to you within 24 hours.
                  </p>
                  {refId && (
                    <p className="text-sm mb-8" style={{ color: 'rgba(0,168,204,0.5)' }}>
                      Reference: #{refId}
                    </p>
                  )}
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); setRefId(null); }}
                    className="btn-luxury px-8 py-3 rounded-xl font-bold text-sm">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-white mb-6">Send a Message</h2>

                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label="Name *">
                        <div style={wrapStyle}>
                          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)}
                            placeholder="Jean-Pierre Tremblay" required disabled={loading}
                            onFocus={e => focus({target:e.target.parentElement})}
                            onBlur={e => blur({target:e.target.parentElement})} />
                        </div>
                      </Field>
                      <Field label="Email *">
                        <div style={wrapStyle}>
                          <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)}
                            placeholder="jean@example.com" required disabled={loading}
                            onFocus={e => focus({target:e.target.parentElement})}
                            onBlur={e => blur({target:e.target.parentElement})} />
                        </div>
                      </Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label={<>Phone <span style={{ color:'rgba(255,255,255,0.3)', textTransform:'none', letterSpacing:0, fontWeight:400 }}>(optional)</span></>}>
                        <div style={wrapStyle}>
                          <input className={inputCls} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                            placeholder="(438) 796-8001" disabled={loading}
                            onFocus={e => focus({target:e.target.parentElement})}
                            onBlur={e => blur({target:e.target.parentElement})} />
                        </div>
                      </Field>
                      <Field label="Subject">
                        <div style={wrapStyle}>
                          <select className={inputCls} style={{ cursor:'pointer' }} value={form.subject}
                            onChange={e => set('subject', e.target.value)} disabled={loading}
                            onFocus={e => focus({target:e.target.parentElement})}
                            onBlur={e => blur({target:e.target.parentElement})}>
                            <option value="" style={{ background:'#1a1a1a' }}>Select a subject</option>
                            {['General Inquiry','Booking Question','Service Information','Pricing','Complaint','Compliment','Other'].map(s => (
                              <option key={s} value={s} style={{ background:'#1a1a1a' }}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </Field>
                    </div>
                    <Field label="Message *">
                      <div style={wrapStyle}>
                        <textarea className={inputCls} style={{ resize:'vertical', minHeight:'130px' }}
                          value={form.message} onChange={e => set('message', e.target.value)}
                          placeholder="Tell us about your vehicle and what you're looking for…"
                          required disabled={loading} rows={5}
                          onFocus={e => focus({target:e.target.parentElement})}
                          onBlur={e => blur({target:e.target.parentElement})} />
                      </div>
                    </Field>

                    <button type="submit" disabled={loading}
                      className="w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
                      style={loading
                        ? { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.3)', cursor:'not-allowed' }
                        : { background: GOLD, color:'#0b0f1a', boxShadow:'0 0 30px rgba(0,168,204,0.25)' }}>
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                        : <><Send className="w-4 h-4" /> Send Message</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* ── Info sidebar (2 cols) ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5"
            style={{ transition: 'opacity .6s .15s, transform .6s .15s', opacity: formVis ? 1 : 0, transform: formVis ? 'none' : 'translateY(16px)' }}>

            {/* Hours + location */}
            <div className="rounded-2xl p-6 space-y-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD_S }}>Hours & Location</p>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.2)' }}>
                  <Clock className="w-4 h-4" style={{ color: GOLD_S }} />
                </div>
                <div className="space-y-1.5 flex-1">
                  {[['Mon – Fri', '8:00 AM – 7:00 PM'], ['Saturday', '8:00 AM – 6:00 PM'], ['Sunday', '9:00 AM – 5:00 PM']].map(([day, hrs]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{day}</span>
                      <span className="text-sm font-medium text-white">{hrs}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.2)' }}>
                  <MapPin className="w-4 h-4" style={{ color: GOLD_S }} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Montréal & Greater Area</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>100% mobile — we come to you</p>
                </div>
              </div>
            </div>

            {/* Why us */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(0,168,204,0.04)', border: '1px solid rgba(0,168,204,0.15)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD_S }}>Why Prestige Plus Services</p>
              <div className="space-y-2.5">
                {[
                  'Professional, certified technicians',
                  'Premium products & equipment',
                  'Mobile — we come to you',
                  'Satisfaction guaranteed',
                  'Fully insured service',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Star className="w-3 h-3 flex-shrink-0" style={{ color: GOLD_S }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Book CTA */}
            <Link to="/booking"
              className="flex items-center justify-between p-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: GOLD, color: '#0b0f1a' }}>
              <div>
                <p className="font-black text-base">Ready to book?</p>
                <p className="text-xs font-medium opacity-60 mt-0.5">Schedule your detail in 3 minutes</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>
      <ServiceAreaMap />
    </div>
  );
};

export default ContactPage;
