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
  { label: 'Book Appointment', to: '/booking',        icon: Calendar },
  { label: 'Our Services',     to: '/services',       icon: null },
  { label: 'Contact Us',       to: '/contact',        icon: null },
  { label: 'Track Booking',    to: '/lookup',         icon: Search },
];

const Footer = () => (
  <footer className="relative overflow-hidden" style={{ background: '#060606' }}>
    {/* Top gold divider */}
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }}
    />

    {/* Pre-footer CTA band */}
    <div
      className="relative py-12 px-4 sm:px-6 text-center"
      style={{ background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}
    >
      <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
        Ready for a{' '}
        <span style={{
          background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Showroom Finish?
        </span>
      </h3>
      <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
        Book online in 2 minutes. We come to you anywhere in Montreal.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/booking"
          className="btn-luxury inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold tracking-wide group"
        >
          Book Appointment
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <a
          href="tel:+15144374816"
          className="btn-ghost-luxury inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold"
        >
          <Phone className="w-4 h-4" />
          (514) 437-4816
        </a>
      </div>
    </div>

    {/* Main footer grid */}
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

        {/* Brand */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}
            >
              <span className="text-black font-black text-sm">PD</span>
            </div>
            <div>
              <span className="text-white font-bold text-base">Prime</span>
              <span
                className="font-bold text-base ml-1"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
              >
                Detailing
              </span>
            </div>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Montreal's premier mobile detailing studio. Ceramic coatings, paint correction & premium detailing — we come to you.
          </p>

          {/* Social icons */}
          <div className="flex gap-2">
            {[
              { icon: Instagram, href: '#', label: 'Instagram' },
              { icon: Facebook,  href: '#', label: 'Facebook' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Icon className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Services</h4>
          <ul className="space-y-2.5">
            {SERVICES.map(s => (
              <li key={s}>
                <Link
                  to="/services"
                  className="text-gray-500 text-sm hover:text-yellow-400 transition-colors duration-200"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Contact</h4>
          <ul className="space-y-3">
            {[
              { icon: Phone, content: <a href="tel:+15144374816" className="hover:text-yellow-400 transition-colors">(514) 437-4816</a> },
              { icon: Mail,  content: <a href="mailto:info@Prestigeplusdetailing.ca" className="hover:text-yellow-400 transition-colors">info@Prestigeplusdetailing.ca</a> },
              { icon: MapPin, content: <span>Greater Montreal, QC</span> },
              { icon: Clock,  content: (
                  <span>Mon–Sat: 8AM–7PM<br /><span className="text-gray-600">Sun: 9AM–5PM</span></span>
                )
              },
            ].map(({ icon: Icon, content }, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-500 text-sm">
                <Icon className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>{content}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links + Portal cards */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Quick Links</h4>
          <ul className="space-y-2.5 mb-5">
            {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-yellow-400 transition-colors duration-200"
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Track booking card */}
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Search className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-yellow-400 text-xs font-semibold">Track Your Booking</span>
            </div>
            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
              Check your appointment status anytime.
            </p>
            <Link
              to="/lookup"
              className="block w-full text-center py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#f5d376', border: '1px solid rgba(201,168,76,0.25)' }}
            >
              Track Appointment
            </Link>
          </div>

          {/* Staff login card */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-400 text-xs font-semibold">Staff Portal</span>
            </div>
            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
              Access your detailer dashboard.
            </p>
            <Link
              to="/detailer-login"
              className="block w-full text-center py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Staff Login
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-gray-600 text-xs">
          © {new Date().getFullYear()} Prestige Plus Detailing Montreal. All rights reserved.
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
