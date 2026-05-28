import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Phone, Zap } from 'lucide-react';

const HIDDEN_ROUTES = ['/booking', '/detailer-login', '/detailer-dashboard', '/admin'];

const StickyBookBar = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    // Check immediately on mount
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        // Only on mobile
        display: 'block',
      }}
      className="md:hidden"
    >
      {/* Fade top edge */}
      <div style={{
        height: '16px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'rgba(8,8,8,0.98)',
        borderTop: '1px solid rgba(201,168,76,0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Urgency row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Zap style={{ width:'12px', height:'12px', color:'#f59e0b' }} />
            <span style={{ fontSize:'12px', fontWeight:600, color:'#f59e0b' }}>Available today</span>
          </div>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>
            Starting at <span style={{ color:'#fff', fontWeight:700 }}>$89</span>
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 12px 12px' }}>
          <a
            href="tel:+14387968001"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
              padding:'12px 16px', borderRadius:'12px', fontSize:'14px', fontWeight:600,
              background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.8)', textDecoration:'none', flexShrink:0,
            }}
          >
            <Phone style={{ width:'16px', height:'16px' }} />
            Call
          </a>

          <Link
            to="/booking"
            style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              padding:'12px', borderRadius:'12px', fontSize:'14px', fontWeight:700,
              background:'linear-gradient(135deg,#c9a84c,#f5d376)', color:'#0a0a0a',
              textDecoration:'none',
            }}
          >
            Book Appointment
            <ChevronRight style={{ width:'16px', height:'16px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StickyBookBar;
