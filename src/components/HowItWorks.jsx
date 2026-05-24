import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Sparkles, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: CalendarDays,
    title: 'Book Online',
    description: 'Choose your service, pick a date and time. Takes less than 2 minutes. Instant SMS confirmation.',
    color: '#c9a84c',
  },
  {
    number: '02',
    icon: MapPin,
    title: 'We Come to You',
    description: 'Our team arrives at your home, office, or anywhere in Montreal — fully equipped, on time.',
    color: '#60a5fa',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Showroom Results',
    description: 'Sit back and relax. We transform your vehicle to perfection while you carry on with your day.',
    color: '#a78bfa',
  },
];

const HowItWorks = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0f0f0f' }}>

      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">The Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            How It <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            Getting a showroom-quality detail has never been simpler.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {STEPS.map(({ number, icon: Icon, title, description, color }, i) => (
            <div
              key={i}
              className={`relative p-7 rounded-2xl group hover:-translate-y-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                transitionDelay: `${i * 120}ms`,
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${color}0a 0%, transparent 60%)` }}
              />

              {/* Step number */}
              <div
                className="text-5xl font-black mb-4 leading-none select-none"
                style={{
                  background: `linear-gradient(135deg, ${color}60, ${color}20)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}
              >
                {number}
              </div>

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}18` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                {title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {description}
              </p>

              {/* Connector arrow (desktop only) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
                  >
                    <ArrowRight className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <Link
            to="/booking"
            className="btn-luxury inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold tracking-wide group"
          >
            Start Your Booking
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-gray-600 text-xs mt-4">No deposit required. Free cancellation 24h in advance.</p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
