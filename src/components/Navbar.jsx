// src/components/Navbar.jsx
// Simplified: Logo | Phone | Book Now — that's it.
// Mobile: same layout, hamburger reveals all links in a drawer.

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';
import { Menu, X, Phone, ChevronRight, Lock } from 'lucide-react';
import { ACTIVE_SOCIALS } from '../config/social';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const NAV_LINKS = [
    { label: t('nav.services'),    to: '/services',        desktop: true },
    { label: t('nav.ceramic'),     to: '/ceramic-coating', desktop: true },
    { label: t('nav.gallery'),     to: '/gallery',         desktop: true },
    { label: t('nav.howItWorks'),  to: '/how-it-works',    desktop: true },
    { label: t('nav.fleet'),       to: '/fleet'           },
    { label: t('nav.contact'),     to: '/contact',         desktop: true },
    { label: t('nav.track'),       to: '/lookup'          },
  ];

  const DESKTOP_LINKS = NAV_LINKS.filter(l => l.desktop);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setDrawerOpen(false), [location]);

  return (
    <>
      {/* ── Main bar ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background:     scrolled ? 'rgba(11,15,26,0.97)' : 'rgba(11,15,26,0.85)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom:   scrolled ? '1px solid rgba(0,168,204,0.18)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.png" alt="Prestige Plus Services"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='flex'; }} />
            <div className="items-center gap-2" style={{ display: 'none' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
                <span className="text-black font-black text-xs">PP</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-sm leading-tight">Prestige Plus</div>
                <div className="text-xs leading-tight" style={{ color: 'rgba(0,168,204,0.7)' }}>Services</div>
              </div>
            </div>
          </Link>

          {/* Desktop inline links */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {DESKTOP_LINKS.map(({ label, to }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  style={{
                    color:      active ? '#00d4ff' : 'rgba(255,255,255,0.65)',
                    background: active ? 'rgba(0,168,204,0.1)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side — phone + Book Now + hamburger */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Phone — hidden on small and squeezed screens */}
            <a href="tel:+14387968001"
              className="hidden sm:flex lg:hidden xl:flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => e.currentTarget.style.color='#00d4ff'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.65)'}>
              <Phone className="w-3.5 h-3.5" />
              (438) 796-8001
            </a>

            {/* Phone icon only on mobile */}
            <a href="tel:+14387968001"
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Call us">
              <Phone className="w-4 h-4 text-white" />
            </a>

            {/* Book Now */}
            <Link to="/booking"
              className="btn-luxury flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide group"
              style={{ minHeight: '40px' }}>
              {t('nav.bookNow')}
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Hamburger */}
            <button onClick={() => setDrawerOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Menu">
              {drawerOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Drawer overlay ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-out"
        style={{
          background:   '#0f1624',
          borderLeft:   '1px solid rgba(0,168,204,0.15)',
          transform:    drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        }}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-white font-bold text-sm">Menu</span>
          <button onClick={() => setDrawerOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            aria-label="Close menu">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                minHeight:  '44px',
                background: location.pathname === to ? 'rgba(0,168,204,0.1)' : 'transparent',
                color:      location.pathname === to ? '#00d4ff' : 'rgba(255,255,255,0.7)',
                border:     location.pathname === to ? '1px solid rgba(0,168,204,0.2)' : '1px solid transparent',
              }}>
              {label}
              {location.pathname === to && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}

          {/* Staff login at bottom */}
          <div className="pt-3 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <Link to="/detailer-login"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
              style={{ color: 'rgba(255,255,255,0.35)', minHeight: '44px' }}>
              <Lock className="w-3.5 h-3.5" /> {t('nav.staff')}
            </Link>
          </div>
        </nav>

        {/* Bottom bar */}
        <div className="px-4 pb-6 space-y-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
          <div className="flex items-center justify-between px-1">
            <LanguageToggle />
          </div>
          <a href="tel:+14387968001"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', minHeight: '44px' }}>
            <Phone className="w-4 h-4" /> (438) 796-8001
          </a>
          <Link to="/booking"
            className="btn-luxury flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold tracking-wide"
            style={{ minHeight: '44px' }}>
            {t('nav.bookNow')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
