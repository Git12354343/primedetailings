// src/components/BookingJourney.jsx — redesigned, no connector line
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, MessageSquare, Car, Sparkles, ChevronRight } from 'lucide-react';

const GOLD  = 'linear-gradient(135deg,#c9a84c,#f5d376)';
const GOLD_S = '#c9a84c';

const STEPS = [
  {
    number: '01',
    icon: CalendarCheck,
    title: 'Book Online',
    desc: 'Pick your services, vehicle, date and time in under 3 minutes. No phone call needed.',
    color: '#c9a84c',
    bg: 'rgba(201,168,76,0.08)',
    border: 'rgba(201,168,76,0.2)',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'SMS Confirmation',
    desc: "You'll get an instant SMS with your confirmation code and appointment details.",
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.2)',
  },
  {
    number: '03',
    icon: Car,
    title: 'Detailer Arrives',
    desc: 'Your certified detailer arrives at your location with all equipment — fully equipped.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'Showroom Result',
    desc: "We don't leave until your vehicle looks its absolute best. Satisfaction guaranteed.",
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
];

const BookingJourney = () => {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(201,168,76,0.04) 0%,transparent 65%)' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className={`text-center mb-14 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            From Booking to{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Perfection
            </span>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Four simple steps — we handle everything else.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {STEPS.map(({ number, icon: Icon, title, desc, color, bg, border }, i) => (
            <div key={title}
              className={`relative p-6 rounded-2xl group transition-all duration-700 hover:-translate-y-1 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                transitionDelay: `${i * 100}ms`,
              }}>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 20%,${color}12 0%,transparent 65%)` }} />

              {/* Number badge — top right */}
              <div className="absolute top-4 right-4 text-xs font-black tabular-nums"
                style={{ color: `${color}40`, fontSize: '11px', letterSpacing: '0.05em' }}>
                {number}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>

              {/* Text */}
              <h3 className="text-white font-bold text-base mb-2 group-hover:text-yellow-300 transition-colors">
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {desc}
              </p>

              {/* Bottom accent bar */}
              <div className="absolute bottom-0 inset-x-0 h-px rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link to="/booking"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-black group transition-all hover:scale-105"
            style={{ background: GOLD, boxShadow: '0 0 30px rgba(201,168,76,0.25)' }}>
            Book Your Detail Now
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            No deposit required · Free cancellation 24h in advance
          </p>
        </div>

      </div>
    </section>
  );
};

export default BookingJourney;
