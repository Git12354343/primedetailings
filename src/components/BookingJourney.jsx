import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, MessageSquare, Car, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const GOLD   = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';

const STEP_COLORS = ['#00a8cc', '#60a5fa', '#a78bfa', '#34d399'];
const STEP_ICONS  = [CalendarCheck, MessageSquare, Car, Sparkles];

const BookingJourney = () => {
  const [active, setActive] = useState(false);
  const [lineW,  setLineW]  = useState(0);
  const ref = useRef(null);
  const { t } = useTranslation();

  const STEPS = [
    { icon: STEP_ICONS[0], title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc'), color: STEP_COLORS[0] },
    { icon: STEP_ICONS[1], title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc'), color: STEP_COLORS[1] },
    { icon: STEP_ICONS[2], title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc'), color: STEP_COLORS[2] },
    { icon: STEP_ICONS[3], title: t('howItWorks.step4Title'), desc: t('howItWorks.step4Desc'), color: STEP_COLORS[3] },
  ];

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      let w = 0;
      const id = setInterval(() => {
        w = Math.min(w + 2, 100);
        setLineW(w);
        if (w >= 100) clearInterval(id);
      }, 14);
      return () => clearInterval(id);
    }, 400);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <section ref={ref} className="py-20 relative overflow-hidden" style={{ background: '#0b0f1a' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,168,204,0.04) 0%, transparent 65%)' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className={`text-center mb-14 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)', color: GOLD_S }}>
            {t('howItWorks.badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            {t('howItWorks.title')}{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t('howItWorks.titleGold')}
            </span>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">

          {/* Desktop connecting line */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px mx-20"
            style={{ background: 'rgba(255,255,255,0.07)', zIndex: 0 }}>
            <div className="h-full"
              style={{ width: `${lineW}%`, background: GOLD, boxShadow: '0 0 8px rgba(0,168,204,0.5)' }} />
          </div>

          {/* Mobile vertical line */}
          <div className="lg:hidden absolute left-9 top-0 bottom-0 w-px"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="w-full transition-all duration-1000 ease-out"
              style={{ height: active ? '100%' : '0%', background: GOLD, transitionDelay: '400ms' }} />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i}
                  className={`flex lg:flex-col items-start lg:items-center lg:text-center gap-5 lg:gap-0 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 120}ms` }}>

                  <div className="relative flex-shrink-0">
                    {active && i === 0 && (
                      <div className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: 'rgba(0,168,204,0.2)', animationDuration: '2s' }} />
                    )}
                    <div className="w-[52px] h-[52px] lg:w-[60px] lg:h-[60px] rounded-2xl flex items-center justify-center relative z-10 lg:mx-auto lg:mb-5"
                      style={{
                        background: active ? `linear-gradient(135deg, ${step.color}22, ${step.color}11)` : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${active ? step.color + '55' : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.5s ease',
                        transitionDelay: `${i * 120 + 200}ms`,
                        boxShadow: active ? `0 0 20px ${step.color}22` : 'none',
                      }}>
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6"
                        style={{ color: active ? step.color : 'rgba(255,255,255,0.3)', transition: 'color 0.5s ease', transitionDelay: `${i * 120 + 200}ms` }} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: GOLD, color: '#0b0f1a', fontSize: '10px' }}>
                      {i + 1}
                    </div>
                  </div>

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
            style={{ background: GOLD, boxShadow: '0 0 30px rgba(0,168,204,0.3)' }}>
            {t('howItWorks.cta')}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {t('howItWorks.ctaSub')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BookingJourney;
