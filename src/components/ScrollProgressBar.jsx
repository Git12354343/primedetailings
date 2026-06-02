import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HIDDEN_ROUTES = ['/detailer-dashboard', '/admin', '/detailer-login'];

const ScrollProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset on route change
  useEffect(() => { setProgress(0); }, [location]);

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none"
      style={{ background: 'rgba(0,0,0,0)' }}
    >
      <div
        className="h-full transition-all duration-100 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #00a8cc, #00d4ff, #00a8cc)',
          boxShadow: '0 0 8px rgba(0,168,204,0.6)',
        }}
      />
    </div>
  );
};

export default ScrollProgressBar;
