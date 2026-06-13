// src/pages/CeramicCoating.jsx
// Dedicated ceramic landing page. Drop into src/pages/.
// Reuses your design system (glass-card, btn-luxury, divider-gold) and the
// shared useInView hook. All motion is GPU-friendly and reduced-motion safe.
//
// NOTE: Footer is rendered by PublicLayout in App.jsx — do NOT add one here.
import Seo from '../components/Seo';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronDown, Phone, MessageSquare, ArrowRight, Award } from 'lucide-react';

import WaterBeadHero      from '../components/ceramic/WaterBeadHero';
import CoatingCrossSection from '../components/ceramic/CoatingCrossSection';
import GlossCompare       from '../components/ceramic/GlossCompare';
import CeramicTiers       from '../components/ceramic/CeramicTiers';
import ProcessTimeline    from '../components/ceramic/ProcessTimeline';
import useInView          from '../hooks/useInView';

const FAQ = [
  { q: 'How long does ceramic coating last?', a: 'Our coatings last 3–5 years depending on the package, with proper maintenance. We back every coating with a warranty.' },
  { q: 'Is it really scratch-proof?', a: 'No coating is fully scratch-proof, but a 9H ceramic dramatically resists swirl marks, light scratches and wash-induced marring versus bare clearcoat.' },
  { q: 'Can you coat a new car?', a: 'New cars are ideal — the paint is fresh. We still do a full decontamination and light correction so the coating bonds to flawless paint.' },
  { q: 'How do I wash a coated car?', a: 'Just a pH-neutral shampoo and a gentle two-bucket wash. No waxing needed. Most clients wash far less often thanks to the self-cleaning effect.' },
  { q: 'Do you come to me?', a: 'Yes — we are fully mobile across Greater Montreal. Ceramic packages need a controlled, dry environment, which we arrange with you when booking.' },
];

const TRUST = [
  { value: '500+', label: 'Cars protected' },
  { value: '4.9★', label: 'Google rating' },
  { value: '5yr',  label: 'Warranty' },
  { value: '100%', label: 'Mobile service' },
];

const FaqRow = ({ q, a, open, onClick }) => (
  <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4 text-left group">
      <span className="text-white font-semibold text-sm pr-4 group-hover:text-cyan-300 transition-colors">{q}</span>
      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
    </button>
    <div style={{ maxHeight: open ? 320 : 0, overflow: 'hidden', transition: 'max-height .4s cubic-bezier(0.4,0,0.2,1)' }}>
      <p className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{a}</p>
    </div>
  </div>
);

const CeramicCoating = () => {
  const [open, setOpen] = useState(0);
  const [trustRef, trustVisible] = useInView({ threshold: 0.3 });
  const [faqRef, faqVisible] = useInView({ threshold: 0.1 });

  return (
    <div style={{ background: '#0b0f1a' }}>
      <Seo page="ceramic" path="/ceramic-coating" jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        serviceType: 'Ceramic Coating',
        name: 'Ceramic Coating',
        description: 'Professional ceramic coating with up to 5 years of protection. Mobile service across greater Montr\u00e9al and Qu\u00e9bec.',
        provider: { '@type': 'LocalBusiness', name: 'Prestige Plus Detailing', telephone: '+14387968001', url: 'https://prestigeplus.services' },
        areaServed: ['Montr\u00e9al', 'Laval', 'Longueuil', 'South Shore', 'North Shore'],
      }} />
      {/* 1. Cinematic hero (swap imageUrl/videoUrl for real assets when ready) */}
      <WaterBeadHero />

      {/* 2. Trust band */}
      <section ref={trustRef} className="relative py-10" style={{ background: '#0b0f1a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TRUST.map((t, i) => (
            <div key={t.label} className="text-center" style={{ transition: 'opacity .5s, transform .5s', transitionDelay: `${i * 0.08}s`, opacity: trustVisible ? 1 : 0, transform: trustVisible ? 'none' : 'translateY(10px)' }}>
              <div className="text-2xl sm:text-3xl font-black" style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t.value}</div>
              <div className="text-[11px] text-gray-500 tracking-widest uppercase mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Science / cross-section */}
      <CoatingCrossSection />

      {/* 4. Gloss before/after */}
      <GlossCompare />

      {/* 5. Process timeline */}
      <ProcessTimeline />

      {/* 6. Tiers + comparison (dynamic) */}
      <CeramicTiers />

      {/* 7. Warranty band */}
      <section className="relative py-16" style={{ background: '#111827' }}>
        <div className="divider-gold absolute top-0 inset-x-0" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 glass-card">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,168,204,0.12)', border: '1px solid rgba(0,168,204,0.3)' }}>
              <Award className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-xl font-black text-white mb-1">Backed by a written warranty</h3>
              <p className="text-gray-400 text-sm">Every ceramic package includes a multi-year warranty. If it doesn't perform, we make it right — no questions.</p>
            </div>
            <Link to="/booking?service=ceramic" className="btn-luxury inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap">
              Get protected <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section ref={faqRef} className="relative py-24" style={{ background: '#0b0f1a' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12" style={{ transition: 'opacity .6s', opacity: faqVisible ? 1 : 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
              <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Ceramic FAQ</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white">
              Good{' '}
              <span style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>questions</span>
            </h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <FaqRow key={i} {...item} open={open === i} onClick={() => setOpen(open === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="relative py-20" style={{ background: '#0b0f1a' }}>
        <div className="divider-gold absolute top-0 inset-x-0" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,168,204,0.08), transparent 60%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Lock in years of protection</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Tell us your vehicle and we'll recommend the right ceramic package. Free, no-pressure quote.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/booking?service=ceramic" className="btn-luxury inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold tracking-wide group">
              Get my ceramic quote <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="tel:+14387968001" className="btn-ghost-luxury inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold">
              <Phone className="w-4 h-4" /> (514) 123-4567
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CeramicCoating;
