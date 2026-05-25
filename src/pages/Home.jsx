import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import BrandBand from '../components/BrandBand';
import StatsCounter from '../components/StatsCounter';
import TrustStrip from '../components/TrustStrip';
import ServiceAreaMap from '../components/ServiceAreaMap';
import ServicesOverview from '../components/ServicesOverview';
import Testimonials from '../components/Testimonials';
import HowItWorks from '../components/HowItWorks';
import BookingJourney from '../components/BookingJourney';
import {
  Shield, Droplets, Zap, ChevronDown, ChevronRight,
  Star, Phone, Instagram, Facebook, MapPin, Clock, Mail
} from 'lucide-react';

/* ── BEFORE / AFTER SLIDER ─────────────────────────────────────────── */
const BeforeAfterSlider = () => {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getPos = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onMouseDown = () => setDragging(true);
  const onMouseMove = (e) => { if (dragging) getPos(e.clientX); };
  const onMouseUp   = () => setDragging(false);
  const onTouchMove = (e) => getPos(e.touches[0].clientX);

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">The Transformation</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            See the <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Difference</span>
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">Drag the slider to reveal the before and after</p>
        </div>

        {/* Slider */}
        <div
          ref={containerRef}
          className={`comparison-slider rounded-2xl overflow-hidden h-64 sm:h-96 select-none transition-all duration-700 delay-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
          style={{ cursor: 'col-resize' }}
        >
          {/* AFTER image (full width beneath) */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80"
              alt="After detailing"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(201,168,76,0.9)', color: '#0a0a0a' }}>
              AFTER
            </div>
          </div>

          {/* BEFORE image (clipped) */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80"
              alt="Before detailing"
              className="w-full h-full object-cover"
              style={{ minWidth: `${10000 / Math.max(position, 1)}%`, maxWidth: 'none' }}
              draggable={false}
            />
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              BEFORE
            </div>
          </div>

          {/* Handle */}
          <div
            className="comparison-handle"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          >
            <div className="comparison-btn">
              <span style={{ fontSize: 11, letterSpacing: 1 }}>⟨ ⟩</span>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          Actual results from Prestige Plus Detailing clients across Québec
        </p>
      </div>
    </section>
  );
};

/* ── CERAMIC COATING SECTION ────────────────────────────────────────── */
const CeramicSection = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    { icon: Droplets, title: 'Hydrophobic', desc: 'Water beads and rolls off instantly, taking dirt with it.', color: '#60a5fa' },
    { icon: Shield,   title: '9H Hardness', desc: 'Industry-leading hardness protects against light scratches.', color: '#c9a84c' },
    { icon: Zap,      title: 'Self-Cleaning', desc: 'Reduces washing frequency dramatically.', color: '#a78bfa' },
    { icon: Star,     title: '5-Year Protection', desc: 'One application protects your paint for years.', color: '#34d399' },
  ];

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#080808' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Shield className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Premium Protection</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Ceramic <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Coating</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            The ultimate paint protection. A nano-ceramic layer that bonds to your paint and lasts for years.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {benefits.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={i}
              className={`flex gap-4 p-5 rounded-2xl group hover:-translate-y-1 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1 group-hover:text-yellow-300 transition-colors">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <Link
            to="/booking"
            className="btn-luxury inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold tracking-wide group"
          >
            Get Your Ceramic Quote
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ── FAQ ─────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: 'Do you come to my location?', a: 'Yes! We are 100% mobile. We bring all professional equipment and come to your home, office, or anywhere in Greater Montreal.' },
  { q: 'How long does a full detail take?', a: 'A standard full detail takes 3–5 hours depending on the vehicle size and condition. Ceramic coating packages can take a full day.' },
  { q: 'What is ceramic coating and how long does it last?', a: 'Ceramic coating is a liquid polymer that chemically bonds to your vehicle\'s paint, creating a hard, protective shell. Our coatings last 3–5 years with proper maintenance.' },
  { q: 'Do I need to prepare my car before the appointment?', a: 'Just make sure we have access to your vehicle. We handle everything else. If possible, remove personal items from the interior.' },
  { q: 'What areas do you service in Québec?', a: 'We cover all of Québec — the greater Montréal area, Laval, Longueuil, South Shore, North Shore, Québec City and surrounding regions. We come to you wherever you are.' },
  { q: 'Do you offer any warranty?', a: 'Yes. We stand behind our work 100%. Our ceramic coatings come with a warranty, and we\'ll address any concerns immediately after the service.' },
];

const FAQSection = () => {
  const [open, setOpen] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0d0d0d' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">FAQ</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Common <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Questions</span>
          </h2>
        </div>

        {/* Items */}
        <div className={`space-y-2 transition-all duration-700 delay-100 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white font-semibold text-sm pr-4 group-hover:text-yellow-300 transition-colors">{q}</span>
                <ChevronDown
                  className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              <div style={{
                maxHeight: open === i ? '300px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <p className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── FOOTER ──────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className="relative pt-16 pb-8 overflow-hidden" style={{ background: '#060606' }}>
    <div className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />

    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}>
              <span className="text-black font-black text-xs">PD</span>
            </div>
            <span className="text-white font-bold text-lg">Prestige Plus Detailing</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Québec's premier mobile car detailing studio. Ceramic coatings, paint correction & premium detailing.
          </p>
          <div className="flex gap-3">
            {[
              { icon: Instagram, href: '#' },
              { icon: Facebook, href: '#' },
            ].map(({ icon: Icon, href }, i) => (
              <a key={i} href={href}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Icon className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Services</h4>
          <ul className="space-y-2">
            {['Ceramic Coating', 'Paint Correction', 'Interior Detailing', 'Exterior Detailing', 'Engine Bay'].map(s => (
              <li key={s}>
                <Link to="/services" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors">{s}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-gray-500 text-sm">
              <Phone className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <a href="tel:+15141234567" className="hover:text-yellow-400 transition-colors">(514) 123-4567</a>
            </li>
            <li className="flex items-center gap-2 text-gray-500 text-sm">
              <Mail className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <a href="mailto:info@Prestigeplusdetailing.ca" className="hover:text-yellow-400 transition-colors">info@Prestigeplusdetailing.ca</a>
            </li>
            <li className="flex items-start gap-2 text-gray-500 text-sm">
              <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Across Québec, Canada</span>
            </li>
            <li className="flex items-start gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Mon–Sat: 8AM – 7PM<br />Sunday: 9AM – 5PM</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4 text-xs text-gray-600"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span>© {new Date().getFullYear()} Prestige Plus Detailing. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
        </div>
      </div>
    </div>
  </footer>
);

/* ── HOME PAGE ───────────────────────────────────────────────────────── */
const Home = () => (
  <div style={{ background: '#0a0a0a' }}>
    <Hero />
    <BrandBand />
    <StatsCounter />
    <TrustStrip />
    <ServicesOverview />
    <BeforeAfterSlider />
    <CeramicSection />
    <ServiceAreaMap />
    <Testimonials />
    <BookingJourney />
    <FAQSection />
    <Footer />
  </div>
);

export default Home;