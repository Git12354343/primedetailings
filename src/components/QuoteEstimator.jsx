import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MessageSquare, Car, Truck, Users, Zap, Loader2, RefreshCw } from 'lucide-react';
import useServicesCache from '../hooks/useServicesCache';

const VEHICLE_ICONS = { Sedan: Car, SUV: Users, Truck: Truck, Coupe: Zap };
const VEHICLE_DESCS = { Sedan: 'Standard cars', SUV: 'SUVs & Crossovers', Truck: 'Pickup Trucks', Coupe: 'Sports & Coupes' };
const CATEGORY_ORDER = ['PROTECTION', 'RESTORATION', 'DETAILING', 'MAINTENANCE', 'SPECIALTY'];

const CONTACT_METHODS = [
  { label: 'Call',     icon: Phone,         color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)', baseHref: 'tel:+15141234567' },
  { label: 'WhatsApp', icon: MessageSquare, color: '#25D366', bg: 'rgba(37,211,102,0.1)',  border: 'rgba(37,211,102,0.25)', baseHref: 'https://wa.me/15141234567' },
  { label: 'SMS',      icon: MessageSquare, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)', baseHref: 'sms:+15141234567' },
  { label: 'Email',    icon: Mail,          color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)', baseHref: 'mailto:info@primedetailing.ca' },
];

const getMinPrice = (pricing) => {
  const vals = Object.values(pricing || {}).filter(v => v > 0);
  return vals.length ? Math.min(...vals) : null;
};

const getPriceForVehicle = (pricing, vehicle) => {
  const p = pricing?.[vehicle];
  return (p && p > 0) ? p : getMinPrice(pricing);
};

const QuoteEstimator = () => {
  const { services: rawServices, loading, error, refresh: load } = useServicesCache();
  const [vehicle, setVehicle]     = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [visible, setVisible]     = useState(false);

  // Init vehicle and selected service when data arrives
  useEffect(() => {
    if (rawServices.length && !serviceId) {
      const sorted = [...rawServices].sort((a, b) => {
        const CATEGORY_ORDER = ['PROTECTION', 'RESTORATION', 'DETAILING', 'MAINTENANCE', 'SPECIALTY'];
        const ai = CATEGORY_ORDER.indexOf(a.category), bi = CATEGORY_ORDER.indexOf(b.category);
        return ai !== bi ? ai - bi : a.sortOrder - b.sortOrder;
      });
      setServiceId(sorted[0]?.id ?? null);
      const firstVehicle = Object.keys(sorted[0]?.pricing || {})[0] ?? 'Sedan';
      setVehicle(v => v ?? firstVehicle);
    }
  }, [rawServices]);

  const services = [...rawServices].sort((a, b) => {
    const CATEGORY_ORDER = ['PROTECTION', 'RESTORATION', 'DETAILING', 'MAINTENANCE', 'SPECIALTY'];
    const ai = CATEGORY_ORDER.indexOf(a.category), bi = CATEGORY_ORDER.indexOf(b.category);
    return ai !== bi ? ai - bi : a.sortOrder - b.sortOrder;
  });
  const [visible, setVisible]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  

  // Derive vehicle types dynamically from all service pricing keys
  const vehicleTypes = [...new Set(services.flatMap(s => Object.keys(s.pricing || {})))];
  const selectedService = services.find(s => s.id === serviceId);
  const displayVehicle = vehicle ?? vehicleTypes[0] ?? 'Sedan';
  const price = selectedService ? getPriceForVehicle(selectedService.pricing, displayVehicle) : null;

  // Build smart contact links with pre-filled context
  const quoteContext = selectedService
    ? `Hi! I'd like a quote for ${selectedService.name} on my ${displayVehicle}. Starting price I saw: $${price ?? 'TBD'}. Can you confirm?`
    : 'Hi! I'd like to get a detailing quote.';

  const contacts = CONTACT_METHODS.map(m => {
    const enc = encodeURIComponent(quoteContext);
    let href = m.baseHref;
    if (m.label === 'WhatsApp') href = `${m.baseHref}?text=${enc}`;
    if (m.label === 'SMS')      href = `${m.baseHref}?body=${enc}`;
    if (m.label === 'Email')    href = `${m.baseHref}?subject=Quote: ${selectedService?.name ?? 'Detailing'} – ${displayVehicle}&body=${quoteContext}`;
    return { ...m, href };
  });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Free Estimate</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Get a{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Quote</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Pick your vehicle and service — then reach out to confirm your exact price.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-yellow-500" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-3">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-2 text-yellow-400 text-sm hover:text-yellow-300">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <div
              className={`rounded-2xl p-6 sm:p-8 mb-8 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Vehicle selector — fully dynamic */}
              <div className="mb-8">
                <label className="block text-white font-semibold text-xs mb-3 uppercase tracking-widest">
                  1. Your Vehicle
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {vehicleTypes.map(v => {
                    const Icon = VEHICLE_ICONS[v] || Car;
                    const isSelected = displayVehicle === v;
                    return (
                      <button key={v} onClick={() => setVehicle(v)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 active:scale-95"
                        style={{
                          background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
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

              {/* Service selector — 100% from DB */}
              <div className="mb-8">
                <label className="block text-white font-semibold text-xs mb-3 uppercase tracking-widest">
                  2. Service
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map(svc => {
                    const p = getPriceForVehicle(svc.pricing, displayVehicle);
                    const isSelected = serviceId === svc.id;
                    return (
                      <button key={svc.id} onClick={() => setServiceId(svc.id)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 active:scale-95"
                        style={{
                          background: isSelected ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <span className="text-sm font-semibold pr-3" style={{ color: isSelected ? '#f5d376' : '#d1d5db' }}>
                          {svc.name}
                        </span>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: isSelected ? '#f5d376' : '#6b7280' }}>
                          {p ? `$${p}+` : 'Call'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price result */}
              <div className="rounded-2xl p-6 text-center"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                {selectedService ? (
                  <>
                    <p className="text-gray-400 text-sm mb-2">
                      <span className="text-white font-semibold">{selectedService.name}</span>
                      {' '}— <span className="text-white font-semibold">{displayVehicle}</span>
                    </p>
                    <div className="text-5xl font-black mb-1" style={{
                      background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                      {price ? `From $${price}` : 'Call for price'}
                    </div>
                    {selectedService.description && (
                      <p className="text-gray-500 text-xs mt-2 italic max-w-sm mx-auto">{selectedService.description}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-3">
                      * Final price confirmed after vehicle inspection.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Select a service above</p>
                )}
              </div>
            </div>

            {/* Contact buttons */}
            <div className={`transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-center text-gray-500 text-xs mb-4 uppercase tracking-widest font-semibold">
                Contact us to confirm your exact price
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {contacts.map(({ icon: Icon, label, href, color, bg, border }) => (
                  <a key={label} href={href}
                    target={label === 'WhatsApp' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:-translate-y-1 active:scale-95 text-center"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-white font-bold text-sm">{label}</span>
                  </a>
                ))}
              </div>
              <div className="text-center mt-5">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
                  We typically respond within 30 minutes
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default QuoteEstimator;
