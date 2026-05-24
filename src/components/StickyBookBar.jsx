import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Phone, Zap } from 'lucide-react';

const HIDDEN_ROUTES = ['/booking', '/detailer-login', '/detailer-dashboard', '/admin'];

const StickyBookBar = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ease-out"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(110%)' }}
    >
      {/* Fade top edge */}
      <div className="h-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div
        style={{
          background: 'rgba(8,8,8,0.98)',
          borderTop: '1px solid rgba(201,168,76,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Urgency + price row */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
              Available today
            </span>
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Starting at <span className="text-white font-bold">$89</span>
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 px-3 pb-3">
          <a
            href="tel:+15144374816"
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </a>

          <Link
            to="/booking"
            className="btn-luxury flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-wide active:scale-95 transition-all"
          >
            Book Appointment
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StickyBookBar;
