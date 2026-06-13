// src/pages/Services.jsx
//
// Mobile UX improvements:
//   • Sticky category jump-nav (pills scroll to section, highlight tracks scroll)
//   • Service/Package card descriptions clamped to 2 lines on mobile + Read more
//   • Includes accordion (hidden by default, tap to expand)
//   • Cleaner mobile card layout: name → desc → price+dur row → CTA
//   • Section IDs wired to jump-nav
//   • Full bilingual support preserved
//   • All booking links / service IDs untouched

import Seo from '../components/Seo';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import useServicesCache from '../hooks/useServicesCache';
import CategoryJumpNav from '../components/CategoryJumpNav';
import {
  CheckCircle, ChevronRight, ChevronDown, Loader2, Package, Star,
  Car, Truck, Users, Zap, Shield, Sparkles, Wrench,
  Phone, MessageSquare, Mail, RefreshCw, Clock, ArrowRight,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const ALLOWED_VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck'];
const VEHICLE_ICONS = { Sedan: Car, SUV: Users, Truck: Truck };
const VEHICLE_DESCS = { Sedan: 'Standard', SUV: 'SUV / CUV', Truck: 'Truck' };

const CATEGORY_CONFIG = {
  PROTECTION:  { icon: Shield,   color: '#00a8cc', labelKey: 'services.catProtection'  },
  RESTORATION: { icon: Star,     color: '#a78bfa', labelKey: 'services.catRestoration' },
  DETAILING:   { icon: Sparkles, color: '#60a5fa', labelKey: 'services.catDetailing'   },
  SPECIALTY:   { icon: Wrench,   color: '#f97316', labelKey: 'services.catSpecialty'   },
  MAINTENANCE: { icon: Zap,      color: '#34d399', labelKey: 'services.catMaintenance' },
  DEFAULT:     { icon: Package,  color: '#94a3b8', labelKey: 'services.catService'     },
};

const CATEGORY_ORDER = ['PROTECTION', 'RESTORATION', 'DETAILING', 'MAINTENANCE', 'SPECIALTY'];

const ADDON_LABELS = {
  ENHANCEMENT: 'services.addonEnhancement',
  PROTECTION:  'services.addonProtection',
  CLEANING:    'services.addonCleaning',
  RESTORATION: 'services.addonRestoration',
};

const CONTACT_QUICK = [
  { icon: Phone,         id: 'call',     labelKey: 'services.contactCall',  href: 'tel:+14387968001',                  color: '#34d399' },
  { icon: MessageSquare, id: 'whatsapp', label: 'WhatsApp',                 href: 'https://wa.me/14387968001',         color: '#25D366' },
  { icon: MessageSquare, id: 'sms',      label: 'SMS',                      href: 'sms:+14387968001',                  color: '#60a5fa' },
  { icon: Mail,          id: 'email',    labelKey: 'services.contactEmail', href: 'mailto:info@prestigeplus.services', color: '#f97316' },
];

// Navbar height + jump-nav height (used for scroll offset)
const SCROLL_OFFSET = 64 + 52;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getMinPrice = (pricing) => {
  const vals = Object.values(pricing || {}).filter(v => v > 0);
  return vals.length ? Math.min(...vals) : null;
};
const getPriceForVehicle = (pricing, vehicle) => {
  const p = pricing?.[vehicle];
  return (p && p > 0) ? p : getMinPrice(pricing);
};
const getPriceLabel = (pricing, vehicle) => {
  const p = getPriceForVehicle(pricing, vehicle);
  if (!p) return { text: null, isExact: false };
  return { text: `$${p}`, isExact: !!(pricing?.[vehicle] > 0) };
};
const formatDuration = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h)      return `${h}h`;
  return `${m}m`;
};
const parseIncludes = (raw) => {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.map(String).filter(Boolean);
  } catch { /* not JSON; fall through to delimiter parsing */ }
  return raw.split(/\n|,\s*/).map(s => s.trim()).filter(Boolean);
};

// ── Expandable description (mobile clamp + Read more) ─────────────────────────
const ExpandableDesc = ({ text, className = '' }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const isLong = text.length > 90;
  return (
    <div>
      <p
        className={`text-gray-400 text-sm leading-relaxed transition-all ${
          !open && isLong ? 'line-clamp-2 sm:line-clamp-none' : ''
        } ${className}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          className="sm:hidden text-xs font-semibold mt-1 focus:outline-none focus-visible:underline"
          style={{ color: '#00a8cc' }}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          {open ? '↑ Show less' : '↓ Read more'}
        </button>
      )}
    </div>
  );
};

// ── Includes accordion ────────────────────────────────────────────────────────
const IncludesAccordion = ({ items, openLabel, closeLabel }) => {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="pt-2 mt-2">
      <button
        className="flex items-center gap-1.5 w-full py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded"
        style={{ color: open ? '#00d4ff' : 'rgba(255,255,255,0.4)' }}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
        {open ? (closeLabel || 'Hide details') : (openLabel || `What's included (${items.length})`)}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 pb-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#00a8cc' }} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Paint Correction spotlight ────────────────────────────────────────────────
// Dedicated marketing section for the highest-margin restoration service.
const PaintCorrectionSpotlight = () => {
  const { t } = useTranslation();
  const stages = [
    { n: '01', title: t('services.pcStage1'), desc: t('services.pcStage1d') },
    { n: '02', title: t('services.pcStage2'), desc: t('services.pcStage2d') },
    { n: '03', title: t('services.pcStage3'), desc: t('services.pcStage3d') },
  ];
  return (
    <section id="section-paint-correction" aria-label="Paint correction"
      className="rounded-2xl p-6 sm:p-8 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, rgba(0,168,204,0.07), rgba(255,255,255,0.02))', border: '1px solid rgba(0,168,204,0.2)' }}>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
        style={{ background: 'rgba(0,168,204,0.12)', border: '1px solid rgba(0,168,204,0.3)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('services.pcBadge')}</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">{t('services.pcTitle')}</h2>
      <p className="text-sm leading-relaxed max-w-2xl mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {t('services.pcDesc')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {stages.map(({ n, title, desc }) => (
          <div key={n} className="p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs font-black mb-1" style={{ color: 'rgba(0,212,255,0.5)' }}>{n}</div>
            <div className="text-white font-bold text-sm mb-1">{title}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</div>
          </div>
        ))}
      </div>
      <Link to="/quote" className="btn-luxury inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide">
        {t('services.pcCta')} <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  );
};

// ── Package Comparison table ──────────────────────────────────────────────────
// Side-by-side view of what each package includes — the fastest way for an
// undecided visitor to pick a tier. Rows = union of included services.
const PackageComparison = ({ packages, services, vehicleType }) => {
  const { t, isFr } = useTranslation();

  const parseIds = (raw) => {
    try { return (Array.isArray(raw) ? raw : JSON.parse(raw || '[]')).map(String); }
    catch { return []; }
  };

  const pkgIncluded = packages.map(p => new Set(parseIds(p.includedServices)));

  // Rows: services included in at least one package, in catalog order
  const rows = services.filter(s => pkgIncluded.some(set => set.has(String(s.id))));
  if (rows.length === 0 || packages.length < 2) return null;

  return (
    <div className="mt-10 rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-white font-bold text-base">{t('services.compareTitle')}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('services.compareSubtitle')}</p>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm" style={{ minWidth: `${280 + packages.length * 130}px` }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}>{t('services.compareService')}</th>
              {packages.map(p => (
                <th key={p.id} className="px-3 py-3 text-center">
                  <div className="text-white font-bold text-sm leading-tight">
                    {(isFr && p.nameFr) ? p.nameFr : p.name}
                  </div>
                  {p.isMostPopular && (
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', color: '#0b0f1a' }}>
                      {t('services.popularBadge')}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                <td className="px-5 py-2.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {(isFr && s.nameFr) ? s.nameFr : s.name}
                </td>
                {packages.map((p, pi) => (
                  <td key={p.id} className="px-3 py-2.5 text-center">
                    {pkgIncluded[pi].has(String(s.id))
                      ? <CheckCircle className="w-4 h-4 mx-auto" style={{ color: '#00d4ff' }} aria-label={t('services.included')} />
                      : <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.15)' }}>{'\u2014'}</span>}
                  </td>
                ))}
              </tr>
            ))}
            {/* Price + CTA row */}
            <tr>
              <td className="px-5 py-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}>{t('services.comparePrice')}</td>
              {packages.map(p => {
                const { text, isExact } = getPriceLabel(p.pricing || {}, vehicleType);
                return (
                  <td key={p.id} className="px-3 py-4 text-center">
                    {p.requiresQuote ? (
                      <div className="text-amber-400 text-xs font-semibold">{t('services.quote')}</div>
                    ) : text ? (
                      <div className="font-black text-base" style={{
                        background: 'linear-gradient(135deg,#00a8cc,#00d4ff)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      }}>{!isExact && `${t('services.from')} `}{text}</div>
                    ) : null}
                    <Link to="/booking"
                      className="inline-block mt-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={p.isMostPopular
                        ? { background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', color: '#0b0f1a' }
                        : { border: '1px solid rgba(0,168,204,0.4)', color: '#00d4ff' }}>
                      {t('services.bookNow')}
                    </Link>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Package Card ──────────────────────────────────────────────────────────────
const PackageCard = ({ pkg, vehicleType, index, visible }) => {
  const { isFr } = useTranslation();
  const price  = vehicleType ? getPriceForVehicle(pkg.pricing || {}, vehicleType) : getMinPrice(pkg.pricing || {});
  const dur    = formatDuration(pkg.estimatedDuration);
  const name   = (isFr && pkg.nameFr)   ? pkg.nameFr   : pkg.name;
  const desc   = (isFr && pkg.descriptionFr) ? pkg.descriptionFr : pkg.description;
  const tagline = (isFr && pkg.taglineFr) ? pkg.taglineFr : pkg.tagline;

  // Parse included services/add-ons for the accordion
  const includedList = (() => {
    try { return Array.isArray(pkg.includedServices) ? pkg.includedServices : JSON.parse(pkg.includedServices || '[]'); }
    catch { return []; }
  })();

  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col transition-all duration-700 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        background:      pkg.isMostPopular ? 'rgba(0,168,204,0.06)' : 'rgba(255,255,255,0.03)',
        border:          pkg.isMostPopular ? '1px solid rgba(0,168,204,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow:       pkg.isMostPopular ? '0 0 40px rgba(0,168,204,0.08)' : 'none',
        transitionDelay: `${index * 70}ms`,
      }}
    >
      {pkg.isMostPopular && (
        <div className="absolute -top-3 left-5 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', color: '#0b0f1a' }}>
          <Star className="w-3 h-3" /> Most Popular
        </div>
      )}

      {tagline && <p className="text-xs text-gray-500 italic mb-2">{tagline}</p>}

      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-300 transition-colors leading-snug">
        {name}
      </h3>

      <ExpandableDesc text={desc} className="mb-4 flex-1" />

      {/* Price + duration row */}
      <div className="flex items-center gap-3 mb-4 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
        <div className="flex-1">
          {pkg.requiresQuote ? (
            <span className="text-sm font-bold" style={{ color: '#00d4ff' }}>Custom Quote</span>
          ) : price ? (
            <span className="text-xl font-black" style={{
              background: 'linear-gradient(135deg,#00a8cc,#00d4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              From ${price}
            </span>
          ) : null}
        </div>
        {dur && (
          <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Clock className="w-3 h-3" /> {dur}
          </div>
        )}
      </div>

      {/* Included services accordion */}
      {includedList.length > 0 && (
        <IncludesAccordion
          items={includedList}
          openLabel={`View included services (${includedList.length})`}
          closeLabel="Hide included services"
        />
      )}

      {/* CTA */}
      <Link
        to={pkg.requiresQuote
          ? `/quote?packageId=${pkg.id}&packageName=${encodeURIComponent(pkg.name)}`
          : `/booking`}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-4 transition-all"
        style={{
          background: pkg.isMostPopular ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'rgba(0,168,204,0.1)',
          color:      pkg.isMostPopular ? '#0b0f1a' : '#00d4ff',
          border:     pkg.isMostPopular ? 'none'    : '1px solid rgba(0,168,204,0.25)',
          minHeight:  '44px',
        }}
      >
        {pkg.requiresQuote ? 'Get Quote' : 'Book Now'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

// ── Service Card ──────────────────────────────────────────────────────────────
const ServiceCard = ({ service, vehicleType, index, visible }) => {
  const { t, isFr } = useTranslation();
  const cfg  = CATEGORY_CONFIG[service.category] || CATEGORY_CONFIG.DEFAULT;
  const Icon = cfg.icon;

  const { text: priceText, isExact } = getPriceLabel(service.pricing, vehicleType);
  const minPrice = getMinPrice(service.pricing);
  const dur      = formatDuration(service.estimatedDuration);

  const name = (isFr && service.nameFr)        ? service.nameFr        : service.name;
  const desc = (isFr && service.descriptionFr) ? service.descriptionFr : service.description;

  const rawIncludes = isFr ? (service.includesFr || service.includes) : service.includes;
  const includes    = parseIncludes(rawIncludes);

  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col transition-all duration-700 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        background:      'rgba(255,255,255,0.03)',
        border:          '1px solid rgba(255,255,255,0.08)',
        transitionDelay: `${index * 70}ms`,
      }}
    >
      {/* Featured badge */}
      {service.isFeatured && (
        <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', color: '#0b0f1a' }}>
          {t('services.popularBadge')}
        </div>
      )}

      {/* Icon + category pill */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${cfg.color}18` }}>
          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${cfg.color}12`, color: cfg.color }}>
          {t(cfg.labelKey)}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-white font-bold text-base mb-2 leading-snug group-hover:text-cyan-300 transition-colors">
        {name}
      </h3>

      {/* Description — 2-line clamp on mobile, full on desktop */}
      <ExpandableDesc text={desc} className="mb-4 flex-1" />

      {/* Price + duration inline row */}
      <div
        className="flex items-center justify-between rounded-xl px-3 py-2.5 mb-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {isExact ? `${vehicleType} price` : t('services.startingFrom')}
          </div>
          <div className="text-lg font-black" style={{
            background: minPrice ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'none',
            WebkitBackgroundClip: minPrice ? 'text' : 'unset',
            WebkitTextFillColor:  minPrice ? 'transparent' : '#6b7280',
            backgroundClip:       minPrice ? 'text' : 'unset',
          }}>
            {priceText || t('services.callForPrice')}
          </div>
        </div>
        {dur && (
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Clock className="w-3.5 h-3.5" /> {dur}
          </div>
        )}
      </div>

      {/* Includes accordion */}
      <IncludesAccordion items={includes} />

      {/* CTA — full width, 44px touch target */}
      <Link
        to={service.requiresQuote ? `/quote?serviceId=${service.id}` : `/booking`}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-3 transition-all"
        style={service.requiresQuote
          ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', minHeight: '44px' }
          : { background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.25)', color: '#00d4ff', minHeight: '44px' }}
      >
        {service.requiresQuote ? 'Request Quote' : t('services.bookThis')}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

// ── Add-on Card ───────────────────────────────────────────────────────────────
const AddOnCard = ({ addOn, index, visible }) => {
  const { isFr } = useTranslation();
  const name = (isFr && addOn.nameFr)        ? addOn.nameFr        : addOn.name;
  const desc = (isFr && addOn.descriptionFr) ? addOn.descriptionFr : addOn.description;
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{
        background:      'rgba(255,255,255,0.03)',
        border:          '1px solid rgba(255,255,255,0.07)',
        transitionDelay: `${index * 40}ms`,
        minHeight:       '52px',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00a8cc' }} />
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm leading-snug">{name}</div>
          {desc && <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{desc}</div>}
        </div>
      </div>
      <span className="text-sm font-black flex-shrink-0 ml-3" style={{
        background: 'linear-gradient(135deg,#34d399,#6ee7b7)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        +${addOn.price}
      </span>
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, iconColor, iconBg, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: iconBg }}>
      <Icon className="w-4 h-4" style={{ color: iconColor }} />
    </div>
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {subtitle && <span className="text-gray-500 text-xs hidden sm:block">{subtitle}</span>}
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const Services = () => {
  const { t }        = useTranslation();
  const { services, addOns, packages, loading, error, refresh: load } = useServicesCache();

  const [vehicleType,    setVehicleType]    = useState(null);
  const [visible,        setVisible]        = useState(false);
  const [activeSection,  setActiveSection]  = useState('');

  const pageRef = useRef(null);

  // Set default vehicle type when data arrives
  useEffect(() => {
    if (services.length && !vehicleType) {
      const first = Object.keys(services[0]?.pricing || {})[0] ?? 'Sedan';
      setVehicleType(first);
    }
  }, [services, vehicleType]);

  // Trigger entrance animation
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.02 }
    );
    if (pageRef.current) obs.observe(pageRef.current);
    return () => obs.disconnect();
  }, []);

  // Derived data
  const vehicleTypes   = ALLOWED_VEHICLE_TYPES.filter(t =>
    services.some(s => Object.keys(s.pricing || {}).includes(t)));
  const activeVehicle  = vehicleType ?? vehicleTypes[0] ?? 'Sedan';

  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'DEFAULT';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a), bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const groupedAddOns = addOns.reduce((acc, a) => {
    const cat = a.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  // Build jump-nav items from available data (only sections that exist)
  const navItems = [
    packages.length > 0     && { id: 'section-packages', label: 'Packages',  icon: Package      },
    addOns.length > 0        && { id: 'section-addons',   label: 'Add-ons',   icon: CheckCircle  },
    ...sortedCategories.map(cat => {
      const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.DEFAULT;
      return { id: `section-${cat.toLowerCase()}`, label: t(cfg.labelKey), icon: cfg.icon };
    }),
  ].filter(Boolean);

  // IntersectionObserver — updates active nav pill while scrolling
  useEffect(() => {
    if (!navItems.length || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (intersecting.length > 0) setActiveSection(intersecting[0].target.id);
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -55% 0px`, threshold: 0 }
    );
    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [navItems.length, loading]);

  // Smooth scroll to section with navbar + jump-nav offset
  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  return (
    <div ref={pageRef} style={{ background: '#0b0f1a', minHeight: '100vh' }}>
      <Seo page="services" path="/services" />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative pt-32 pb-16 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#111827 0%,#0b0f1a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(0,168,204,0.07) 0%,transparent 60%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(0,168,204,0.3),transparent)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('services.badge')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            {t('services.title')}{' '}
            <span style={{
              background: 'linear-gradient(135deg,#00a8cc,#00d4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {t('services.pageTitleAccent')}
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">{t('services.pageSubtitle')}</p>
        </div>
      </div>

      {/* ── Category jump-nav (sticky, below navbar) ────────────────────── */}
      <CategoryJumpNav
        items={navItems}
        activeId={activeSection}
        onNavigate={scrollToSection}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-6">

        {/* ── Vehicle selector ──────────────────────────────────────────── */}
        {vehicleTypes.length > 0 && (
          <div className={`rounded-2xl p-4 sm:p-5 mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{t('services.vehiclePrompt')}</p>
            <div className="flex flex-wrap gap-2.5">
              {vehicleTypes.map(v => {
                const VIcon  = VEHICLE_ICONS[v] || Car;
                const active = activeVehicle === v;
                return (
                  <button key={v} onClick={() => setVehicleType(v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? 'rgba(0,168,204,0.15)' : 'rgba(255,255,255,0.04)',
                      border:     active ? '1px solid rgba(0,168,204,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color:      active ? '#00d4ff' : 'rgba(255,255,255,0.6)',
                      minHeight:  '44px',
                    }}>
                    <VIcon className="w-4 h-4" />
                    {v}
                    {VEHICLE_DESCS[v] && <span className="text-xs opacity-50 hidden sm:inline">· {VEHICLE_DESCS[v]}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            {t('services.loading')}
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{t('services.loadError')}</p>
            <button onClick={() => load(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mx-auto"
              style={{ background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.25)', color: '#00d4ff' }}>
              <RefreshCw className="w-4 h-4" /> {t('services.retry')}
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-16">

            {/* ── 1. PACKAGES ───────────────────────────────────────────── */}
            {packages.length > 0 && (
              <section id="section-packages" aria-label="Packages">
                <SectionHeader
                  icon={Package}
                  iconColor="#00d4ff"
                  iconBg="rgba(0,168,204,0.15)"
                  title="Packages"
                  subtitle="— complete detailing bundles"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {packages.map((pkg, i) => (
                    <PackageCard key={pkg.id} pkg={pkg} vehicleType={activeVehicle} index={i} visible={visible} />
                  ))}
                </div>
                <PackageComparison packages={packages} services={services} vehicleType={activeVehicle} />
              </section>
            )}

            {/* ── 2. ADD-ONS ────────────────────────────────────────────── */}
            {Object.keys(groupedAddOns).length > 0 && (
              <section id="section-addons" aria-label="Add-ons">
                <div className="rounded-2xl p-5 sm:p-7"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <SectionHeader
                    icon={CheckCircle}
                    iconColor="#34d399"
                    iconBg="rgba(52,211,153,0.15)"
                    title={t('services.addOnTitle')}
                    subtitle={t('services.addOnSuffix')}
                  />
                  {Object.entries(groupedAddOns)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cat, items]) => (
                      <div key={cat} className="mb-6 last:mb-0">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                          {ADDON_LABELS[cat] ? t(ADDON_LABELS[cat]) : cat}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map((a, i) => (
                            <AddOnCard key={a.id} addOn={a} index={i} visible={visible} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* ── 2b. PAINT CORRECTION SPOTLIGHT ────────────────────────── */}
            <PaintCorrectionSpotlight />

            {/* ── 3. SERVICE CATEGORIES ─────────────────────────────────── */}
            {sortedCategories.map(cat => {
              const cfg   = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.DEFAULT;
              const items = [...(grouped[cat] || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
              return (
                <section key={cat} id={`section-${cat.toLowerCase()}`} aria-label={t(cfg.labelKey)}>
                  <SectionHeader
                    icon={cfg.icon}
                    iconColor={cfg.color}
                    iconBg={`${cfg.color}18`}
                    title={`${t(cfg.labelKey)} ${t('services.categorySuffix')}`}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {items.map((service, i) => (
                      <ServiceCard key={service.id} service={service} vehicleType={activeVehicle} index={i} visible={visible} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* ── Empty state ────────────────────────────────────────────── */}
            {sortedCategories.length === 0 && packages.length === 0 && (
              <div className="text-center py-20">
                <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t('services.comingSoonTitle')}</h3>
                <p className="text-gray-500">{t('services.comingSoonDesc')}</p>
              </div>
            )}

            {/* ── CTA strip ─────────────────────────────────────────────── */}
            <div className="rounded-2xl p-7 text-center"
              style={{ background: 'rgba(0,168,204,0.04)', border: '1px solid rgba(0,168,204,0.15)' }}>
              <h3 className="text-xl font-bold text-white mb-2">{t('services.ctaTitle')}</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{t('services.ctaDesc')}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {CONTACT_QUICK.map(({ icon: Icon, id, labelKey, label, href, color }) => (
                  <a key={id} href={href}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      background: `${color}12`, border: `1px solid ${color}30`, color,
                      minHeight: '44px',
                    }}>
                    <Icon className="w-4 h-4" />
                    {labelKey ? t(labelKey) : label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
