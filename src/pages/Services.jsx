import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useServicesCache from '../hooks/useServicesCache';
import {
  CheckCircle, ChevronRight, Loader2, Package, Star,
  Car, Truck, Users, Zap, Shield, Sparkles, Wrench,
  Phone, MessageSquare, Mail, RefreshCw
} from 'lucide-react';

// ── Config (display only, no prices) ──────────────────────────────────────
const VEHICLE_ICONS = { Sedan: Car, SUV: Users, Truck: Truck, Coupe: Zap };
const VEHICLE_DESCS = { Sedan: 'Standard', SUV: 'SUV / CUV', Truck: 'Truck', Coupe: 'Sports' };

const CATEGORY_CONFIG = {
  PROTECTION:  { icon: Shield,   color: '#c9a84c', label: 'Protection' },
  RESTORATION: { icon: Star,     color: '#a78bfa', label: 'Restoration' },
  DETAILING:   { icon: Sparkles, color: '#60a5fa', label: 'Detailing' },
  SPECIALTY:   { icon: Wrench,   color: '#f97316', label: 'Specialty' },
  MAINTENANCE: { icon: Zap,      color: '#34d399', label: 'Maintenance' },
  DEFAULT:     { icon: Package,  color: '#94a3b8', label: 'Service' },
};
const CATEGORY_ORDER = ['PROTECTION', 'RESTORATION', 'DETAILING', 'MAINTENANCE', 'SPECIALTY'];

const ADDON_LABELS = {
  ENHANCEMENT: 'Enhancement', PROTECTION: 'Protection',
  CLEANING: 'Cleaning',       RESTORATION: 'Restoration',
};

const CONTACT_QUICK = [
  { icon: Phone,         label: 'Call',     href: 'tel:+15144374816',              color: '#34d399' },
  { icon: MessageSquare, label: 'WhatsApp', href: 'https://wa.me/15144374816',     color: '#25D366' },
  { icon: MessageSquare, label: 'SMS',      href: 'sms:+15144374816',              color: '#60a5fa' },
  { icon: Mail,          label: 'Email',    href: 'mailto:info@Prestigeplusdetailing.ca', color: '#f97316' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
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
  if (!p) return { text: 'Call for price', isExact: false };
  const exact = pricing?.[vehicle] > 0;
  return { text: `$${p}`, isExact: exact };
};

// ── Service Card ──────────────────────────────────────────────────────────
const ServiceCard = ({ service, vehicleType, index, visible }) => {
  const cfg = CATEGORY_CONFIG[service.category] || CATEGORY_CONFIG.DEFAULT;
  const Icon = cfg.icon;
  const { text: priceText, isExact } = getPriceLabel(service.pricing, vehicleType);
  const minPrice = getMinPrice(service.pricing);

  return (
    <div
      className={`service-card relative rounded-2xl p-6 flex flex-col transition-all duration-700 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        transitionDelay: `${index * 80}ms`,
      }}
    >
      {/* Popular badge (first 2 by sortOrder) */}
      {service.sortOrder <= 2 && (
        <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)', color: '#0a0a0a' }}>
          Popular
        </div>
      )}

      {/* Icon + category */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center service-icon"
          style={{ background: `${cfg.color}18` }}>
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: `${cfg.color}12`, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
        {service.name}
      </h3>

      <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">
        {service.description || 'Professional detailing service tailored to your needs.'}
      </p>

      {/* Price block */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">
            {isExact ? `${vehicleType} price` : 'Starting from'}
          </div>
          <div className="text-xl font-black" style={{
            background: minPrice ? 'linear-gradient(135deg, #c9a84c, #f5d376)' : 'none',
            WebkitBackgroundClip: minPrice ? 'text' : 'unset',
            WebkitTextFillColor: minPrice ? 'transparent' : 'unset',
            backgroundClip: minPrice ? 'text' : 'unset',
            color: minPrice ? 'unset' : '#6b7280',
          }}>
            {priceText}
          </div>
        </div>
        {!isExact && minPrice && (
          <span className="text-xs text-gray-600 text-right max-w-[90px]">varies by vehicle</span>
        )}
      </div>

      <Link
        to={`/booking?service=${service.id}&vehicle=${vehicleType}`}
        className="btn-luxury w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-wide group"
      >
        Book This Service
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

// ── Add-on Card ───────────────────────────────────────────────────────────
const AddOnCard = ({ addOn, index, visible }) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:-translate-y-0.5 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      transitionDelay: `${index * 50}ms`,
    }}
  >
    <div className="flex items-center gap-3">
      <CheckCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <div>
        <div className="text-white font-semibold text-sm">{addOn.name}</div>
        {addOn.description && <div className="text-gray-500 text-xs mt-0.5">{addOn.description}</div>}
      </div>
    </div>
    <span className="text-sm font-black flex-shrink-0 ml-3" style={{
      background: 'linear-gradient(135deg, #34d399, #6ee7b7)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>
      +${addOn.price}
    </span>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────
const Services = () => {
  const { services, addOns, loading, error, refresh: load } = useServicesCache();
  const [vehicleType, setVehicleType] = useState(null);
  const [visible, setVisible]         = useState(false);
  const ref = useRef(null);

  // Auto-select first vehicle type when data loads
  useEffect(() => {
    if (services.length && !vehicleType) {
      const first = Object.keys(services[0]?.pricing || {})[0] ?? 'Sedan';
      setVehicleType(first);
    }
  }, [services]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Derive vehicle types from all services' pricing keys
  const vehicleTypes = [...new Set(services.flatMap(s => Object.keys(s.pricing || {})))];
  const activeVehicle = vehicleType ?? vehicleTypes[0] ?? 'Sedan';

  // Group + sort services by category
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

  // Group add-ons by category
  const groupedAddOns = addOns.reduce((acc, a) => {
    const cat = a.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div ref={ref} style={{ background: '#0a0a0a', minHeight: '100vh' }}>

      {/* Hero banner */}
      <div className="relative pt-32 pb-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Our Services</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            Premium{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Packages</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Professional-grade detailing with premium products. We come to you anywhere in Montreal.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">

        {/* Vehicle selector — fully dynamic */}
        {vehicleTypes.length > 0 && (
          <div
            className={`rounded-2xl p-5 mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-white font-semibold text-xs mb-4 uppercase tracking-widest">
              Select your vehicle for exact pricing
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(vehicleTypes.length, 4)}, 1fr)` }}>
              {vehicleTypes.map(v => {
                const Icon = VEHICLE_ICONS[v] || Car;
                const isSelected = activeVehicle === v;
                return (
                  <button key={v} onClick={() => setVehicleType(v)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 active:scale-95"
                    style={{
                      background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: isSelected ? '#f5d376' : '#6b7280' }} />
                    <span className="text-sm font-bold" style={{ color: isSelected ? '#f5d376' : '#9ca3af' }}>{v}</span>
                    <span className="text-xs text-gray-600">{VEHICLE_DESCS[v] || v}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="w-7 h-7 animate-spin text-yellow-500" />
            <span className="text-gray-500 text-sm">Loading services...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl p-6 text-center mb-8"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-red-400 mb-3">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-2 text-yellow-400 text-sm hover:text-yellow-300">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {/* Service groups */}
        {!loading && !error && sortedCategories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.DEFAULT;
          const items = grouped[cat].sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <div key={cat} className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${cfg.color}18` }}>
                  <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <h2 className="text-xl font-bold text-white">{cfg.label} Services</h2>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((service, i) => (
                  <ServiceCard key={service.id} service={service} vehicleType={activeVehicle} index={i} visible={visible} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!loading && !error && sortedCategories.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Services Coming Soon</h3>
            <p className="text-gray-500">Contact us directly for pricing and availability.</p>
          </div>
        )}

        {/* Add-ons */}
        {!loading && Object.keys(groupedAddOns).length > 0 && (
          <div className="mb-16">
            <div className="rounded-2xl p-6 sm:p-8"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.15)' }}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Add-On Services</h2>
                <span className="text-gray-500 text-sm">— add to any package</span>
              </div>
              {Object.entries(groupedAddOns)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, items]) => (
                  <div key={cat} className="mb-6 last:mb-0">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      {ADDON_LABELS[cat] || cat}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.sort((a, b) => a.sortOrder - b.sortOrder).map((addon, i) => (
                        <AddOnCard key={addon.id} addOn={addon} index={i} visible={visible} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          className={`rounded-2xl p-8 text-center transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
        >
          <h3 className="text-2xl font-black text-white mb-2">Not sure which package?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Contact us — we'll recommend the best service for your vehicle and budget.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-6">
            {CONTACT_QUICK.map(({ icon: Icon, label, href, color }) => (
              <a key={label} href={href}
                target={label === 'WhatsApp' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200 hover:-translate-y-1 active:scale-95"
                style={{ background: `${color}10`, border: `1px solid ${color}25` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
                <span className="text-white text-xs font-bold">{label}</span>
              </a>
            ))}
          </div>
          <Link
            to={`/booking${activeVehicle ? `?vehicle=${activeVehicle}` : ''}`}
            className="btn-luxury inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold tracking-wide group"
          >
            Book Your {activeVehicle} Now
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
