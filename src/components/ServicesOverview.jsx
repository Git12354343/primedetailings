// src/components/ServicesOverview.jsx
// Individual services section removed — packages section only.
// "View All Services & Pricing" link directs to /services for full catalogue.

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import {
  ChevronRight, Package, Loader2, Star, Clock, Sparkles, ArrowRight
} from 'lucide-react';

const GOLD   = 'linear-gradient(135deg,#00a8cc,#00d4ff)';
const GOLD_S = '#00a8cc';
const API    = import.meta.env.VITE_API_URL;

// ── Price helper ──────────────────────────────────────────────────────────────
const getMinPrice = (pricing) => {
  const vals = Object.values(pricing || {}).filter(v => Number(v) > 0);
  return vals.length ? Math.min(...vals.map(Number)) : null;
};

// ── Package card ──────────────────────────────────────────────────────────────
const HomePkgCard = ({ pkg, index, visible }) => {
  const { t } = useTranslation();
  const min = getMinPrice(pkg.pricing || {});
  const dur = pkg.estimatedDuration
    ? pkg.estimatedDuration >= 60
      ? `${Math.floor(pkg.estimatedDuration / 60)}h${pkg.estimatedDuration % 60 ? ` ${pkg.estimatedDuration % 60}m` : ''}`
      : `${pkg.estimatedDuration}m`
    : null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition-all duration-700 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        background:      pkg.isMostPopular ? 'rgba(0,168,204,0.07)' : 'rgba(255,255,255,0.03)',
        border:          pkg.isMostPopular ? '1px solid rgba(0,168,204,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow:       pkg.isMostPopular ? '0 0 40px rgba(0,168,204,0.08)' : 'none',
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {pkg.isMostPopular && (
        <div className="absolute -top-3 left-5 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: GOLD, color: '#0b0f1a' }}>
          <Star className="w-3 h-3" /> {t('overview.mostPopular')}
        </div>
      )}

      {pkg.tagline && (
        <p className="text-xs text-gray-500 italic mb-2">{pkg.tagline}</p>
      )}

      <h3 className="text-white font-bold text-xl mb-2 leading-snug group-hover:text-cyan-300 transition-colors">
        {pkg.name}
      </h3>

      {pkg.description && (
        <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1 line-clamp-3">
          {pkg.description}
        </p>
      )}

      {/* Price + duration */}
      <div className="flex items-center justify-between pt-4 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          {pkg.requiresQuote ? (
            <span className="text-cyan-400 font-bold text-sm">{t('overview.customQuote')}</span>
          ) : min ? (
            <>
              <div className="text-xs text-gray-500 mb-0.5">{t('overview.from')}</div>
              <div className="text-2xl font-black" style={{
                background: GOLD,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                ${min}
              </div>
            </>
          ) : null}
        </div>
        {dur && (
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <Clock className="w-3.5 h-3.5" /> {dur}
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        to={pkg.requiresQuote
          ? `/quote?packageId=${pkg.id}&packageName=${encodeURIComponent(pkg.name)}`
          : '/booking'}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-4 transition-all"
        style={{
          background: pkg.isMostPopular ? GOLD : 'rgba(0,168,204,0.1)',
          color:      pkg.isMostPopular ? '#0b0f1a' : '#00d4ff',
          border:     pkg.isMostPopular ? 'none' : '1px solid rgba(0,168,204,0.25)',
          minHeight:  '44px',
        }}
      >
        {pkg.requiresQuote ? 'Get Quote' : t('overview.bookPackage')}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ServicesOverview = () => {
  const { t } = useTranslation();
  const [packages,   setPackages]   = useState([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [visible,    setVisible]    = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API}/packages/active`)
      .then(r => r.json())
      .then(d => { if (d.success) setPackages(d.packages); })
      .catch(() => {})
      .finally(() => setPkgLoading(false));
  }, []);

  const featuredPackages = packages.filter(p => p.isActive !== false).slice(0, 3);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#111827' }}>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,168,204,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Packages ────────────────────────────────────────────────────── */}
        <div className={`text-center mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <Package className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('overview.pkgBadge')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            {t('overview.pkgTitle')}{' '}
            <span style={{
              background: GOLD,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {t('overview.pkgTitleAccent')}
            </span>
          </h2>
          <p className="text-gray-400 text-base max-w-lg mx-auto">{t('overview.pkgSubtitle')}</p>
        </div>

        {pkgLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        ) : featuredPackages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {featuredPackages.map((pkg, i) => (
              <HomePkgCard key={pkg.id} pkg={pkg} index={i} visible={visible} />
            ))}
          </div>
        ) : (
          /* No packages in DB yet — show a CTA to services page */
          <div className="text-center py-10 mb-10">
            <p className="text-gray-500 text-sm mb-4">Browse all our services and pricing.</p>
          </div>
        )}

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <Link to="/booking"
            className="btn-luxury inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide group"
            style={{ minHeight: '44px' }}>
            {t('overview.bookPackage')}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/services"
            className="btn-ghost-luxury inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold"
            style={{ minHeight: '44px' }}>
            {t('overview.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default ServicesOverview;
