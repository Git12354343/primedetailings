import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Shield, Star, Package, Wrench, Zap, ChevronRight,
  Clock, ArrowRight, Loader2
} from 'lucide-react';
import useServicesCache from '../hooks/useServicesCache';
import { useServiceTranslation } from '../utils/serviceUtils';
import { useTranslation } from '../hooks/useTranslation';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';

const CATEGORY_CONFIG = {
  PROTECTION:  { icon: Shield,   color: '#00a8cc', bg: 'rgba(0,168,204,0.12)' },
  RESTORATION: { icon: Star,     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  DETAILING:   { icon: Sparkles, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  SPECIALTY:   { icon: Wrench,   color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  MAINTENANCE: { icon: Zap,      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  DEFAULT:     { icon: Package,  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const FALLBACK_SERVICES = [
  { id: 1, name: 'Ceramic Coating',   category: 'PROTECTION',  description: 'Industry-leading 9H ceramic protection.' },
  { id: 2, name: 'Paint Correction',  category: 'RESTORATION', description: 'Multi-stage machine polishing.' },
  { id: 3, name: 'Interior Detailing',category: 'DETAILING',   description: 'Deep clean and conditioning.' },
  { id: 4, name: 'Exterior Detailing',category: 'DETAILING',   description: 'Hand wash, clay bar, wax protection.' },
  { id: 5, name: 'Engine Bay',        category: 'SPECIALTY',   description: 'Professional degreasing.' },
  { id: 6, name: 'Express Detail',    category: 'MAINTENANCE', description: 'Quick maintenance detail.' },
];

const getMinPrice = (p) => {
  const v = Object.values(p || {}).filter(x => x > 0);
  return v.length ? Math.min(...v) : null;
};

const fmtDur = (m) => {
  if (!m) return null;
  const h = Math.floor(m / 60), min = m % 60;
  return h ? (min ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
};

// ── Package card (homepage) ────────────────────────────────────────────────
const HomePkgCard = ({ pkg, index, visible }) => {
  const { t } = useTranslation();
  const min = getMinPrice(pkg.pricing);
  const dur = fmtDur(pkg.estimatedDuration);

  return (
    <div className={`relative rounded-2xl p-6 flex flex-col transition-all duration-700 group hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        background: pkg.isMostPopular ? 'rgba(0,168,204,0.06)' : 'rgba(255,255,255,0.03)',
        border: pkg.isMostPopular ? '1px solid rgba(0,168,204,0.25)' : '1px solid rgba(255,255,255,0.08)',
        transitionDelay: `${index * 80}ms`,
        boxShadow: pkg.isMostPopular ? '0 0 40px rgba(0,168,204,0.1)' : 'none',
      }}>

      {/* Badges */}
      {pkg.isMostPopular && (
        <div className="absolute -top-3 left-5 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: GOLD, color: '#0b0f1a' }}>
          <Star className="w-3 h-3" /> {t('overview.mostPopular')}
        </div>
      )}

      {pkg.tagline && (
        <div className="text-xs text-gray-500 italic mb-2">{pkg.tagline}</div>
      )}

      <h3 className="text-white font-bold text-xl mb-2 group-hover:text-cyan-300 transition-colors">
        {pkg.name}
      </h3>
      {pkg.description && (
        <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{pkg.description}</p>
      )}

      {/* Highlights */}
      {(pkg.includedServices || []).slice(0, 3).map((_, i) => null)}

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          {pkg.requiresQuote ? (
            <div className="text-cyan-400 font-bold text-sm">{t('overview.customQuote')}</div>
          ) : min ? (
            <>
              <div className="text-2xl font-black" style={{
                background: GOLD, WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{t('overview.from')} ${min}</div>
              {dur && (
                <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                  <Clock className="w-3 h-3" /> {dur}
                </div>
              )}
            </>
          ) : null}
        </div>
        <Link
          to={pkg.requiresQuote ? `/quote?packageId=${pkg.id}&packageName=${encodeURIComponent(pkg.name)}` : `/booking`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group-hover:gap-3"
          style={{
            background: pkg.isMostPopular ? GOLD : 'rgba(0,168,204,0.1)',
            color: pkg.isMostPopular ? '#0b0f1a' : '#00d4ff',
            border: pkg.isMostPopular ? 'none' : '1px solid rgba(0,168,204,0.25)',
          }}>
          {pkg.requiresQuote ? 'Request Quote' : t('overview.book')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

// ── Service card (homepage overview) ──────────────────────────────────────
const ServiceCard = ({ service, index, visible }) => {
  const { tField } = useServiceTranslation();
  const { t } = useTranslation();
  const cfg = CATEGORY_CONFIG[service.category] || CATEGORY_CONFIG.DEFAULT;
  const Icon = cfg.icon;
  const min = getMinPrice(service.pricing);

  return (
    <div className={`service-card relative rounded-2xl p-5 cursor-pointer transition-all duration-700 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        transitionDelay: `${index * 70}ms`,
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 service-icon"
        style={{ background: cfg.bg }}>
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
      </div>
      <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
        {tField(service, 'name')}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
        {tField(service, 'description') || t('overview.defaultServiceDesc')}
      </p>
      <div className="flex items-center justify-between mt-auto">
        {min ? (
          <span className="text-cyan-400 font-bold text-sm">{t('overview.from')} ${min}</span>
        ) : (
          <span className="text-gray-500 text-xs">{t('overview.priceOnRequest')}</span>
        )}
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-all" style={{ color: cfg.color }}>
          {t('overview.bookArrow')}
        </span>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ServicesOverview = () => {
  const { t } = useTranslation();
  const { services: rawServices, loading } = useServicesCache();
  const [packages, setPackages]           = useState([]);
  const [pkgLoading, setPkgLoading]       = useState(true);
  const [visible, setVisible]             = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/packages/active`)
      .then(r => r.json())
      .then(d => { if (d.success) setPackages(d.packages); })
      .catch(() => {})
      .finally(() => setPkgLoading(false));
  }, []);

  const services = rawServices.length
    ? rawServices.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6)
    : FALLBACK_SERVICES;

  const featuredPackages = packages.filter(p => p.isActive).slice(0, 3);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#111827' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,168,204,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Popular Packages section ── */}
        {(pkgLoading || featuredPackages.length > 0) && (
          <div className="mb-20">
            <div className={`text-center mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
                <Package className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('overview.pkgBadge')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
                {t('overview.pkgTitle')}{' '}
                <span style={{ color: '#fff' }}>
                  {t('overview.pkgTitleAccent')}
                </span>
              </h2>
              <p className="text-gray-400 text-base max-w-lg mx-auto">
                {t('overview.pkgSubtitle')}
              </p>
            </div>

            {pkgLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {featuredPackages.map((pkg, i) => (
                  <HomePkgCard key={pkg.id} pkg={pkg} index={i} visible={visible} />
                ))}
              </div>
            )}

            {/* Dual CTA */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
              <Link to="/booking"
                className="btn-luxury inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide group">
                {t('overview.bookPackage')}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/booking"
                className="btn-ghost-luxury inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold">
                {t('overview.buildOwn')}
              </Link>
            </div>
          </div>
        )}

        {/* ── Individual Services section ── */}
        <div>
          <div className={`text-center mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('overview.svcBadge')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {t('overview.svcTitlePre')}{' '}
              <span style={{ color: '#fff' }}>
                {t('overview.svcTitleAccent')}
              </span>{' '}
              {t('overview.svcTitlePost')}
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              {t('overview.svcSubtitle')}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} visible={visible} />
              ))}
            </div>
          )}

          <div className={`text-center mt-10 transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <Link to="/services"
              className="btn-luxury inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold tracking-wide group">
              {t('overview.viewAll')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ServicesOverview;
