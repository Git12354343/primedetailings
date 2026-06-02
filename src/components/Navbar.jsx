import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import { Menu, X, Phone, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { ACTIVE_SOCIALS } from '../config/social';

const Navbar = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location  = useLocation();
  const moreRef   = useRef(null);
  const { t } = useTranslation();

  // Primary links — kept short and intentional
  const PRIMARY = [
    { label: t('nav.services'), to: '/services' },
    { label: t('nav.ceramic'),  to: '/ceramic-coating', featured: true },
    { label: t('nav.gallery'),  to: '/gallery' },
  ];
  // Everything else lives under "More"
  const MORE = [
    { label: t('nav.howItWorks'), to: '/how-it-works' },
    { label: t('nav.fleet'),      to: '/fleet' },
    { label: t('nav.contact'),    to: '/contact' },
    { label: t('nav.track'),      to: '/lookup' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); setMoreOpen(false); }, [location]);

  // Close "More" on outside click
  useEffect(() => {
    const onClick = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(11,15,26,0.95)' : 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(0,168,204,0.2)' : '1px solid rgba(255,255,255,0.05)',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            {/* Logo */}
            <Link to="/" className="md:flex-none absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 group">
              <img
                src="/logo.png" alt="Prestige Plus Services"
                style={{ height: '40px', width: 'auto', objectFit: 'contain', transition: 'opacity 0.2s' }}
                className="group-hover:opacity-80"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
              />
              <div className="items-center gap-2.5" style={{ display: 'none' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
                  <span className="text-black font-black text-xs">PP</span>
                </div>
                <span className="text-white font-bold text-base">Prestige Plus</span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {PRIMARY.map(({ label, to, featured }) => (
                <Link key={to} to={to} className="relative text-sm font-medium transition-all duration-200 py-1 group"
                  style={{ color: isActive(to) ? '#00d4ff' : 'rgba(255,255,255,0.75)' }}>
                  <span className="flex items-center gap-1.5">
                    {label}
                    {featured && !isActive(to) && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #00a8cc, #00d4ff)', boxShadow: '0 0 6px rgba(0,168,204,0.7)' }} />
                    )}
                  </span>
                  <span className="absolute bottom-0 left-0 h-px transition-all duration-300" style={{ background: 'linear-gradient(90deg, #00a8cc, #00d4ff)', width: isActive(to) ? '100%' : '0%' }} />
                </Link>
              ))}

              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button onClick={() => setMoreOpen(o => !o)}
                  className="flex items-center gap-1 text-sm font-medium py-1 transition-colors"
                  style={{ color: moreOpen ? '#00d4ff' : 'rgba(255,255,255,0.75)' }}>
                  {t('nav.more')}
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: moreOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-xl overflow-hidden py-2"
                    style={{ background: '#111827', border: '1px solid rgba(0,168,204,0.15)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                    {MORE.map(({ label, to }) => (
                      <Link key={to} to={to}
                        className="block px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ color: isActive(to) ? '#00d4ff' : 'rgba(255,255,255,0.8)' }}>
                        {label}
                      </Link>
                    ))}
                    <div className="my-2 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <Link to="/detailer-login" className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Lock className="w-3.5 h-3.5" /> {t('nav.staff')}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageToggle />
              <a href="tel:+14387968001" className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                <Phone className="w-3.5 h-3.5" /><span>(438) 796-8001</span>
              </a>
              <Link to="/booking" className="btn-luxury flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold tracking-wide group">
                {t('nav.bookNow')}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile phone */}
            <a href="tel:+14387968001" className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="Call us">
              <Phone className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden flex flex-col transition-transform duration-300 ease-out"
        style={{ background: '#111827', borderLeft: '1px solid rgba(0,168,204,0.15)', transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="flex items-center justify-between px-5 h-16" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center">
            <img src="/logo.png" alt="Prestige Plus Services" style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
            <div className="items-center gap-2" style={{ display:'none' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
                <span className="text-black font-black text-xs">PP</span>
              </div>
              <span className="text-white font-bold text-sm">Prestige Plus</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[...PRIMARY, ...MORE].map(({ label, to, featured }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ minHeight: '44px',
                background: isActive(to) ? 'rgba(0,168,204,0.1)' : 'transparent',
                color: isActive(to) ? '#00d4ff' : 'rgba(255,255,255,0.75)',
                border: isActive(to) ? '1px solid rgba(0,168,204,0.2)' : '1px solid transparent' }}>
              <span className="flex items-center gap-2">
                {label}
                {featured && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #00a8cc, #00d4ff)', boxShadow: '0 0 6px rgba(0,168,204,0.7)' }} />}
              </span>
              {isActive(to) && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-8 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem' }}>
          <div className="flex items-center justify-between px-1 mb-1">
            <LanguageToggle />
            <Link to="/detailer-login" className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <Lock className="w-3.5 h-3.5" /> {t('nav.staff')}
            </Link>
          </div>
          {ACTIVE_SOCIALS.length > 0 && (
            <div className="flex gap-2 px-1">
              {ACTIVE_SOCIALS.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Icon className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          )}
          <a href="tel:+14387968001" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium"
            style={{ minHeight: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
            <Phone className="w-4 h-4" /> (438) 796-8001
          </a>
          <Link to="/booking" className="btn-luxury flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold tracking-wide">
            {t('nav.bookNow')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
