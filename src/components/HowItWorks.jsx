import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const ICONS = [CalendarDays, MapPin, Sparkles];
const COLORS = ['#00a8cc', '#60a5fa', '#a78bfa'];

const HowItWorks = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const rawSteps = t('howItWorks.steps');
  const steps = (Array.isArray(rawSteps) ? rawSteps : []).map((s, i) => ({
    number: String(i + 1).padStart(2, '0'),
    icon: ICONS[i] || Sparkles,
    color: COLORS[i] || '#00a8cc',
    title: s.title,
    description: s.description,
  }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-20 sm:py-24 overflow-hidden" style={{ background: '#0f0f0f' }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,168,204,0.3), transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,168,204,0.3), transparent)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('howItWorks.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">{t('howItWorks.title')}</h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto">{t('howItWorks.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
          {steps.map(({ number, icon: Icon, title, description, color }, i) => (
            <div key={i}
              className={`relative p-7 rounded-2xl group hover:-translate-y-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', transitionDelay: `${i * 120}ms` }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${color}0a 0%, transparent 60%)` }} />
              <div className="text-5xl font-black mb-4 leading-none select-none"
                style={{ background: `linear-gradient(135deg, ${color}60, ${color}20)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {number}
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,168,204,0.15)', border: '1px solid rgba(0,168,204,0.3)' }}>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <Link to="/booking" className="btn-luxury inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold tracking-wide group">
            {t('howItWorks.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-gray-600 text-xs mt-4">{t('howItWorks.ctaNote')}</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
