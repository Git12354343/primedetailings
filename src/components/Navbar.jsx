import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import { Menu, X, Phone, ChevronRight } from 'lucide-react';

// NAV_LINKS moved inside component to support translations

const Navbar = () => {
  const [isOpen, setIsOpen]       = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const location                  = useLocation();
  const { t } = useTranslation();
  const NAV_LINKS = [
    { label: t('nav.home'),     to: '/' },
    { label: t('nav.ceramic'),  to: '/ceramic-coating', featured: true },
    { label: t('nav.services'), to: '/services' },
    { label: t('nav.bookNow'),  to: '/booking' },
    { label: t('nav.gallery'),  to: '/gallery' },
    { label: t('nav.fleet'),    to: '/fleet' },
    { label: t('nav.contact'),  to: '/contact' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [location]);

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? 'rgba(10,10,10,0.95)'
            : 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(201,168,76,0.2)'
            : '1px solid rgba(255,255,255,0.05)',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Mobile: hamburger (left) — hidden on desktop */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Toggle menu"
            >
              {isOpen
                ? <X className="w-5 h-5 text-white" />
                : <Menu className="w-5 h-5 text-white" />
              }
            </button>

            {/* Logo — centered on mobile, left on desktop */}
            <Link to="/"
              className="md:flex-none absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 group">
              <img
                src="/logo.png"
                alt="Prime Detailing"
                style={{ height: '40px', width: 'auto', objectFit: 'contain', transition: 'opacity 0.2s' }}
                className="group-hover:opacity-80"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="items-center gap-2.5" style={{ display: 'none' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)' }}>
                  <span className="text-black font-black text-xs">PD</span>
                </div>
                <span className="text-white font-bold text-base">Prime Detailing</span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ label, to, featured }) => (
                <Link
                  key={to}
                  to={to}
                  className="relative text-sm font-medium transition-all duration-200 py-1 group"
                  style={{ color: isActive(to) ? '#f5d376' : 'rgba(255,255,255,0.75)' }}
                >
                  <span className="flex items-center gap-1.5">
                    {label}
                    {/* Featured (Ceramic) gold dot */}
                    {featured && !isActive(to) && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)', boxShadow: '0 0 6px rgba(201,168,76,0.7)' }}
                      />
                    )}
                  </span>
                  {/* Underline */}
                  <span
                    className="absolute bottom-0 left-0 h-px transition-all duration-300"
                    style={{
                      background: 'linear-gradient(90deg, #c9a84c, #f5d376)',
                      width: isActive(to) ? '100%' : '0%',
                    }}
                  />
                  <span
                    className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                    style={{ background: 'linear-gradient(90deg, #c9a84c, #f5d376)', opacity: isActive(to) ? 0 : 1 }}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageToggle />
              <a
                href="tel:+15144374816"
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f5d376'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>(514) 437-4816</span>
              </a>
              <Link
                to="/booking"
                className="btn-luxury flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold tracking-wide group"
              >
                Book Now
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile: phone icon (right) — hidden on desktop */}
            <a href="tel:+15144374816"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Call us">
              <Phone className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden flex flex-col transition-transform duration-300 ease-out"
        style={{
          background: '#0d0d0d',
          borderLeft: '1px solid rgba(201,168,76,0.15)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 h-16"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center">
            <img src="/logo.png" alt="Prime Detailing"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="items-center gap-2" style={{ display:'none' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)' }}>
                <span className="text-black font-black text-xs">PD</span>
              </div>
              <span className="text-white font-bold text-sm">Prime Detailing</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_LINKS.map(({ label, to, featured }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive(to) ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: isActive(to) ? '#f5d376' : 'rgba(255,255,255,0.75)',
                border: isActive(to) ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              }}
            >
              <span className="flex items-center gap-2">
                {label}
                {featured && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)', boxShadow: '0 0 6px rgba(201,168,76,0.7)' }}
                  />
                )}
              </span>
              {isActive(to) && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </nav>

        {/* Drawer bottom */}
        <div className="px-4 pb-8 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem' }}>
          <a
            href="tel:+15144374816"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <Phone className="w-4 h-4" />
            (514) 437-4816
          </a>
          <Link
            to="/booking"
            className="btn-luxury flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold tracking-wide"
          >
            Book Appointment
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
