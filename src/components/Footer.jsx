import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Search, Users, Calendar, Instagram, Facebook, ChevronRight } from 'lucide-react';

const SERVICES = [
  'Ceramic Coating',
  'Paint Correction',
  'Interior Detailing',
  'Exterior Detailing',
  'Engine Bay Cleaning',
  'Express Detail',
];

const QUICK_LINKS = [
  { label: 'Book Appointment', to: '/booking', icon: Calendar },
  { label: 'Our Services',     to: '/services', icon: null    },
  { label: 'Gallery',          to: '/gallery',  icon: null    },
  { label: 'Contact Us',       to: '/contact',  icon: null    },
];

// Moved from navbar per luxury structure recommendation
const MORE_LINKS = [
  { label: 'Fleet & B2B',        to: '/fleet'   },
  { label: 'Track Your Booking', to: '/lookup'  },
  { label: 'FAQ',                to: '/#faq'    },
];

const FAQ_ITEMS = [
  { q: 'Do you come to my location?',        a: 'Yes — we\'re fully mobile across Greater Montreal.' },
  { q: 'How long does a detail take?',       a: 'Express: 1–2h. Full detail: 3–5h. Ceramic: 1–2 days.' },
  { q: 'Is ceramic coating worth it?',       a: 'Absolutely — it protects for 3–5 years and keeps your car cleaner longer.' },
  { q: 'Do you work in winter?',             a: 'Yes, for interior services. Exterior and ceramic require +5°C.' },
];

const Footer = () => (
  <footer className="relative overflow-hidden" style={{ background: '#060606' }}>

    {/* Top gold divider */}
    <div className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />

    {/* ── Pre-footer CTA band ─────────────────────────── */}
    <div className="relative py-12 px-4 sm:px-6 text-center"
      style={{ background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
      <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
        Ready for a{' '}
        <span style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          Showroom Finish?
        </span>
      </h3>
      <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
        Book online in 2 minutes. We come to you anywhere in Montreal.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/booking"
          className="btn-luxury inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold tracking-wide group">
          Book Appointment
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <a href="tel:+15144374816"
          className="btn-ghost-luxury inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold">
          <Phone className="w-4 h-4" />
          (514) 437-4816
        </a>
      </div>
    </div>

    {/* ── Main footer grid ────────────────────────────── */}
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">

        {/* Brand — spans 2 cols on lg */}
        <div className="col-span-2 lg:col-span-2">
          {/* Logo */}
          <div className="mb-4">
            <img src="/logo.png" alt="Prestige Plus"
              style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="items-center gap-2.5" style={{ display: 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)' }}>
                <span className="text-black font-black text-sm">PP</span>
              </div>
              <div>
                <span className="text-white font-black text-base">Prestige</span>
                <span className="font-black text-base ml-1"
                  style={{ background:'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  Plus
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed mb-5 max-w-xs">
            Montreal's premier mobile detailing studio. Ceramic coatings, paint correction & premium detailing — we come to you.
          </p>

          <div className="flex gap-2 mb-6">
            {[
              { icon: Instagram, href: '#', label: 'Instagram' },
              { icon: Facebook,  href: '#', label: 'Facebook'  },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Icon className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>

          {/* Contact info */}
          <ul className="space-y-2.5">
            {[
              { icon: Phone, content: <a href="tel:+15144374816" className="hover:text-yellow-400 transition-colors">(514) 437-4816</a> },
              { icon: Mail,  content: <a href="mailto:info@prestigeplus.services" className="hover:text-yellow-400 transition-colors">info@prestigeplus.services</a> },
              { icon: MapPin, content: <span>Greater Montreal, QC</span> },
              { icon: Clock,  content: <span>Mon–Sat 8AM–7PM · Sun 9AM–5PM</span> },
            ].map(({ icon: Icon, content }, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-500 text-sm">
                <Icon className="w-3.5 h-3.5 text-yellow-700 flex-shrink-0 mt-0.5" />
                <span>{content}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Services</h4>
          <ul className="space-y-2.5">
            {SERVICES.map(s => (
              <li key={s}>
                <Link to="/services" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors duration-200">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links + More */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Quick Links</h4>
          <ul className="space-y-2.5 mb-6">
            {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <Link to={to}
                  className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-yellow-400 transition-colors duration-200">
                  {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">More</h4>
          <ul className="space-y-2.5">
            {MORE_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to}
                  className="text-gray-500 text-sm hover:text-yellow-400 transition-colors duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Track booking + Staff portal */}
        <div className="space-y-3">
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Portals</h4>

          <div className="rounded-xl p-4"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Search className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-yellow-400 text-xs font-semibold">Track Your Booking</span>
            </div>
            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
              Check your appointment status anytime.
            </p>
            <Link to="/lookup"
              className="block w-full text-center py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#f5d376', border: '1px solid rgba(201,168,76,0.25)' }}>
              Track Appointment
            </Link>
          </div>

          <div className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-400 text-xs font-semibold">Staff Portal</span>
            </div>
            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
              Access your detailer dashboard.
            </p>
            <Link to="/detailer-login"
              className="block w-full text-center py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Staff Login
            </Link>
          </div>
        </div>

      </div>

      {/* ── FAQ Section ─────────────────────────────────── */}
      <div className="mb-10 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-6">
          Frequently Asked Questions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white text-sm font-semibold mb-1.5">{q}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-gray-600 text-xs">
          © {new Date().getFullYear()} Prestige Plus Detailing Montréal. All rights reserved.
        </span>
        <div className="flex gap-5 text-xs text-gray-600">
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          <Link to="/lookup" className="hover:text-gray-400 transition-colors">Track Booking</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
