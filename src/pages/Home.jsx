// src/pages/Home.jsx
// Structure inspired by Onyx:
//   Hero → InstantQuote → Trust strip → Reviews → FAQ → CTA

import React from 'react';
import Hero from '../components/Hero';
import InstantQuote from '../components/InstantQuote';
import ReviewsSection from '../components/ReviewsSection';
import FAQSection from '../components/FAQSection';
import { MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

// ── 3-point trust strip ───────────────────────────────────────────────────────
const TrustStrip = () => {
  const { t } = useTranslation();
  return (
  <section style={{ background: '#0b0f1a', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
      {[
        {
          icon: MapPin,
          color: '#00d4ff',
          title: t('home.trust1Title'),
          desc:  t('home.trust1Desc'),
        },
        {
          icon: CreditCard,
          color: '#34d399',
          title: t('home.trust2Title'),
          desc:  t('home.trust2Desc'),
        },
        {
          icon: ShieldCheck,
          color: '#a78bfa',
          title: t('home.trust3Title'),
          desc:  t('home.trust3Desc'),
        },
      ].map(({ icon: Icon, color, title, desc }) => (
        <div key={title} className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <div className="text-white font-bold text-sm mb-1">{title}</div>
            <div className="text-gray-500 text-sm leading-relaxed">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Home = () => (
  <div style={{ background: '#0b0f1a' }}>
    <Hero />
    <InstantQuote />
    <TrustStrip />
    <ReviewsSection />
    <FAQSection />
  </div>
);

export default Home;
