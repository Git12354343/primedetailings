import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import { Menu, X, Phone, ChevronRight, Sparkles } from 'lucide-react';

const Navbar = () => {
  const [isOpen,  setIsOpen]  = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // ── Luxury structure: Logo | Services | Ceramic | Gallery | Contact
  // Fleet / Booking / FAQ moved to footer
  const NAV_LINKS = [
    { label: t('nav.services'), to: '/services'       },
    { label: t('nav.ceramic'),  to: '/ceramic-coating', featured: true },
    { label: t('nav.gallery'),  to: '/gallery'         },
    { label: t('nav.contact'),  to: '/contact'         },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background:    scrolled ? 'rgba(10,10,10,0.97)' : 'rgba(0,0,0,0.25)',
          backdropFilter:'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom:  scrolled
            ? '1px solid rgba(201,168,76,0.18)'
            : '1px solid rgba(255,255,255,0.04)',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.7)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center h-[68px] gap-8">

            {/* ── Logo ─────────────────────────────────────── */}
            <Link to="/" className="flex-shrink-0 group">
              <img
                src="/logo.png"
                alt="Prestige Plus Detailing"
                style={{ height: '42px', width: 'auto', objectFit: 'contain', transition: 'opacity 0.2s' }}
                className="group-hover:opacity-80"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              {/* Fallback if logo.png missing */}
              <div className="items-center gap-2.5" style={{ display: 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)' }}>
                  <span className="text-black font-black text-sm">PP</span>
                </div>
                <div>
                  <span className="text-white font-black text-base tracking-tight">Prestige</span>
                  <span className="font-black text-base tracking-tight ml-1"
                    style={{ background:'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                    Plus
                  </span>
                </div>
              </div>
            </Link>

            {/* ── Desktop nav links (center) ───────────────── */}
            <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
              {NAV_LINKS.map(({ label, to, featured }) => (
                <Link
                  key={to}
                  to={to}
                  className="relative text-sm font-medium py-1 group whitespace-nowrap transition-colors duration-200"
                  style={{ color: isActive(to) ? '#f5d376' : 'rgba(255,255,255,0.72)' }}
                >
                  <span className="flex items-center gap-1.5">
                    {label}
                    {featured && !isActive(to) && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', boxShadow: '0 0 6px rgba(201,168,76,0.8)' }}
                      />
                    )}
                  </span>
                  {/* Active underline */}
                  <span className="absolute bottom-0 left-0 h-px transition-all duration-300"
                    style={{ background: 'linear-gradient(90deg,#c9a84c,#f5d376)', width: isActive(to) ? '100%' : '0%' }} />
                  {/* Hover underline */}
                  <span className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                    style={{ background: 'linear-gradient(90deg,#c9a84c,#f5d376)', opacity: isActive(to) ? 0 : 0.7 }} />
                </Link>
              ))}
            </div>

            {/* ── Desktop right CTAs ───────────────────────── */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-auto">
              <LanguageToggle />

              {/* Phone — visible at lg+ */}
              <a
                href="tel:+15144374816"
                className="hidden lg:flex items-center gap-1.5 text-sm whitespace-nowrap transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f5d376'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
              >
                <Phone className="w-3.5 h-3.5" />
                (514) 437-4816
              </a>

              {/* Book Now CTA */}
              <Link
                to="/booking"
                className="btn-luxury flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide group whitespace-nowrap"
              >
                Book Now
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* ── Mobile: hamburger ────────────────────────── */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Toggle menu"
            >
              {isOpen
                ? <X className="w-5 h-5 text-white" />
                : <Menu className="w-5 h-5 text-white" />
              }
            </button>

          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ──────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-[300px] md:hidden flex flex-col transition-transform duration-300 ease-out"
        style={{
          background:  '#0c0c0c',
          borderLeft:  '1px solid rgba(201,168,76,0.12)',
          transform:    isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-[68px]"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <img src="/logo.png" alt="Prestige Plus"
            style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="items-center gap-2" style={{ display: 'none' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)' }}>
              <span className="text-black font-black text-xs">PP</span>
            </div>
            <span className="text-white font-bold text-sm">Prestige Plus</span>
          </div>
          <button onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {/* Primary nav */}
          {NAV_LINKS.map(({ label, to, featured }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive(to) ? 'rgba(201,168,76,0.1)' : 'transparent',
                color:      isActive(to) ? '#f5d376' : 'rgba(255,255,255,0.75)',
                border:     isActive(to) ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              }}>
              <span className="flex items-center gap-2">
                {label}
                {featured && (
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', boxShadow: '0 0 6px rgba(201,168,76,0.7)' }} />
                )}
              </span>
              {isActive(to) && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Secondary links in drawer */}
          {[
            { label: 'Fleet / B2B',       to: '/fleet' },
            { label: 'Track Booking',     to: '/lookup' },
            { label: 'Book Now',          to: '/booking' },
          ].map(({ label, to }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: isActive(to) ? '#f5d376' : 'rgba(255,255,255,0.45)',
                background: isActive(to) ? 'rgba(201,168,76,0.07)' : 'transparent',
              }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Drawer bottom CTAs */}
        <div className="px-4 pb-8 space-y-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem' }}>
          <a href="tel:+15144374816"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
            <Phone className="w-4 h-4" />
            (514) 437-4816
          </a>
          <Link to="/booking"
            className="btn-luxury flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold tracking-wide">
            Book Appointment
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
