import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, MessageSquare, Car, Sparkles, ChevronRight } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

const STEPS = [
  {
    icon: CalendarCheck,
    title: 'Book Online',
    desc: 'Pick your services, vehicle, date and time in under 3 minutes. No phone call needed.',
    color: '#c9a84c',
  },
  {
    icon: MessageSquare,
    title: 'SMS Confirmation',
    desc: "You'll get an instant SMS with your confirmation code and appointment details.",
    color: '#60a5fa',
  },
  {
    icon: Car,
    title: 'Detailer Arrives',
    desc: 'Your certified detailer arrives at your location with all equipment — fully equipped.',
    color: '#a78bfa',
  },
  {
    icon: Sparkles,
    title: 'Showroom Result',
    desc: "We don't leave until your vehicle looks its absolute best. Satisfaction guaranteed.",
    color: '#34d399',
  },
];

const BookingJourney = () => {
  const [active, setActive] = useState(false);
  const [lineW, setLineW]   = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Animate the connecting line after cards appear
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      let w = 0;
      const id = setInterval(() => {
        w = Math.min(w + 2, 100);
        setLineW(w);
        if (w >= 100) clearInterval(id);
      }, 14);
      return () => clearInterval(id);
    }, 400);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <section ref={ref} className="py-20 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.04) 0%, transparent 65%)' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className={`text-center mb-14 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            From Booking to{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Perfection
            </span>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Four simple steps — we handle everything else.
          </p>
        </div>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        <div className="relative">

          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px mx-20"
            style={{ background: 'rgba(255,255,255,0.07)', zIndex: 0 }}>
            <div className="h-full transition-none"
              style={{
                width: `${lineW}%`,
                background: GOLD,
                transition: active ? 'none' : 'none',
                boxShadow: '0 0 8px rgba(201,168,76,0.5)',
              }} />
          </div>

          {/* Vertical line — mobile only */}
          <div className="lg:hidden absolute left-9 top-0 bottom-0 w-px"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="w-full transition-all duration-1000 ease-out"
              style={{
                height: active ? '100%' : '0%',
                background: GOLD,
                transitionDelay: '400ms',
              }} />
          </div>

          {/* Step cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title}
                  className={`flex lg:flex-col items-start lg:items-center lg:text-center gap-5 lg:gap-0 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 120}ms` }}>

                  {/* Icon circle */}
                  <div className="relative flex-shrink-0">
                    {/* Pulse ring */}
                    {active && i === 0 && (
                      <div className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: 'rgba(201,168,76,0.2)', animationDuration: '2s' }} />
                    )}
                    <div className="w-[52px] h-[52px] lg:w-[60px] lg:h-[60px] rounded-2xl flex items-center justify-center relative z-10 lg:mx-auto lg:mb-5"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${step.color}22, ${step.color}11)`
                          : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${active ? step.color + '55' : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.5s ease',
                        transitionDelay: `${i * 120 + 200}ms`,
                        boxShadow: active ? `0 0 20px ${step.color}22` : 'none',
                      }}>
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6"
                        style={{ color: active ? step.color : 'rgba(255,255,255,0.3)', transition: 'color 0.5s ease', transitionDelay: `${i * 120 + 200}ms` }} />
                    </div>

                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: GOLD, color: '#0a0a0a', fontSize: '10px' }}>
                      {i + 1}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 lg:flex-none">
                    <h3 className="text-white font-bold text-base mb-1.5 lg:mb-2">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 transition-all duration-700 delay-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link to="/booking"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-black group"
            style={{ background: GOLD, boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}>
            Book Your Detail Now
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BookingJourney;
