import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Shield, Zap } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Hero = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

      {/* Background image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80"
          alt="Luxury car"
          className="w-full h-full object-cover opacity-40"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        {/* Multi-layer dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* Animated gold shimmer lines */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse-slow" />
        <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse-slow delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20 pb-32 sm:pb-32">

        {/* Eyebrow tag */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ background: 'rgba(0,168,204,0.12)', border: '1px solid rgba(0,168,204,0.3)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-slow" />
          <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">
            Québec's Premier Mobile Detailing
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
        >
          <span className="text-white">{t('hero.title')}</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #00a8cc 0%, #00d4ff 50%, #00a8cc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Perfected.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className={`text-lg sm:text-xl text-gray-300 max-w-xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          Ceramic coatings, paint correction & premium detailing.
          We come to <strong className="text-white">you</strong> — anywhere in Québec.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <Link
            to="/booking"
            className="btn-luxury px-8 py-4 rounded-xl text-base font-bold tracking-wide inline-flex items-center justify-center gap-2 group"
          >
            Book Appointment
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/services"
            className="btn-ghost-luxury px-8 py-4 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2"
          >
            View Packages
          </Link>
        </div>

        {/* Trust badges */}
        <div
          className={`flex flex-wrap justify-center gap-3 sm:gap-6 mb-12 transition-all duration-700 delay-400 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {[
            { icon: Star, label: '4.9 Stars', sub: '200+ Reviews' },
            { icon: Shield, label: '5-Year Warranty', sub: 'Ceramic Coating' },
            { icon: Zap, label: 'Same Day', sub: 'Available' },
          ].map(({ icon: Icon, label, sub }, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-left">
                <div className="text-white text-xs font-bold leading-tight">{label}</div>
                <div className="text-gray-400 text-xs leading-tight">{sub}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

    </section>
  );
};

export default Hero;
