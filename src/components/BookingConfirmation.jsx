// src/components/BookingConfirmation.jsx
// Drop-in replacement for the confirmed state in BookingForm.jsx
// Usage: replace the `if (confirmed) { return (...) }` block with <BookingConfirmation confirmed={confirmed} pkg={selectedPkg} vehicleType={values.vehicleType} total={total} />

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, Calendar, Clock, Car } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376, #c9a84c)';
const GOLD_S = '#c9a84c';

// ── Gold particle canvas ──────────────────────────────────────────────────────
const ParticleBurst = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    const COLORS = ['#f5d376', '#c9a84c', '#e8c46a', '#fff8e1', '#ffd700'];
    const particles = Array.from({ length: 80 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const size  = 3 + Math.random() * 5;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        alpha: 1,
        size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        gravity: 0.12 + Math.random() * 0.08,
        spin: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI * 2,
        isSquare: Math.random() > 0.5,
      };
    });

    let rafId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x     += p.vx;
        p.y     += p.vy;
        p.vy    += p.gravity;
        p.alpha -= 0.014;
        p.angle += p.spin;
        if (p.alpha <= 0) return;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        if (p.isSquare) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (alive) rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
  );
};

// ── Main confirmation screen ──────────────────────────────────────────────────
const BookingConfirmation = ({ confirmed, pkg, vehicleType, total }) => {
  const [burst, setBurst] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    setTimeout(() => setBurst(false), 2800);
  }, []);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + (String(d).includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-CA', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Particle burst */}
      {burst && <ParticleBurst />}

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.12) 0%, transparent 65%)' }} />

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ maxWidth: '440px', width: '100%' }}>

        {/* Check icon with pulse ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(201,168,76,0.2)', animationDuration: '1.6s' }} />
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10"
            style={{ background: GOLD, boxShadow: '0 0 50px rgba(201,168,76,0.5)' }}>
            <CheckCircle className="w-10 h-10 text-black" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-2">You're All Set!</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Booking confirmed. SMS confirmation sent to your phone.
        </p>

        {/* Confirmation code card */}
        <div className="w-full rounded-2xl p-6 mb-5"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Confirmation Code
          </p>
          <p className="text-4xl font-black tracking-[0.15em] mb-4"
            style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {confirmed.confirmationCode}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Save this code to track your appointment</p>
        </div>

        {/* Booking summary */}
        <div className="w-full rounded-2xl p-5 mb-6 text-left space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {confirmed.date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />
              <span className="text-sm text-white">{formatDate(confirmed.date)}</span>
            </div>
          )}
          {confirmed.time && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />
              <span className="text-sm text-white">{confirmed.time}</span>
            </div>
          )}
          {pkg && (
            <div className="flex items-center gap-3">
              <Car className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />
              <span className="text-sm text-white">{pkg.name}{vehicleType ? ` · ${vehicleType}` : ''}</span>
            </div>
          )}
          {total > 0 && (
            <div className="flex items-center justify-between pt-2 mt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Total</span>
              <span className="text-lg font-black"
                style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ${total}
              </span>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <Link to={`/lookup?code=${confirmed.confirmationCode}`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all"
            style={{ background: GOLD, color: '#0a0a0a', boxShadow: '0 0 25px rgba(201,168,76,0.3)' }}>
            Track My Appointment <ChevronRight className="w-4 h-4" />
          </Link>
          <Link to="/"
            className="flex-1 flex items-center justify-center py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
