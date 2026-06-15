// src/components/InstantQuote.jsx
// Clean, professional quote estimator (no icon-cars, no emoji-style flourishes).
// Sections: Vehicle → Package → Add-ons → Optional advanced services →
// running estimate bar → trust columns. Fully data-driven from the catalog.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useServicesCache from '../hooks/useServicesCache';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowRight, Check } from 'lucide-react';

const ACCENT = '#00a8cc';
const GOLD   = 'linear-gradient(135deg,#00a8cc,#00d4ff)';
const ADVANCED_CATS = ['PROTECTION', 'RESTORATION'];

const VEHICLE_KEYS = [
  { key: 'Sedan', labelKey: 'iq.vehSedan' },
  { key: 'SUV',   labelKey: 'iq.vehSUV'   },
  { key: 'Truck', labelKey: 'iq.vehTruck' },
];

const getMinPrice = (p) => {
  const v = Object.values(p || {}).filter(x => Number(x) > 0);
  return v.length ? Math.min(...v.map(Number)) : null;
};
const getPriceFor = (p, veh) => {
  const x = p?.[veh];
  return (x && Number(x) > 0) ? Number(x) : getMinPrice(p);
};

// ── Section heading: "1. VEHICLE TYPE" ────────────────────────────────────────
const SectionLabel = ({ n, children }) => (
  <div className="flex items-baseline gap-2 mb-4">
    <span className="text-xs font-black" style={{ color: ACCENT }}>{n}.</span>
    <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
      {children}
    </span>
  </div>
);

// ── Feature pill ──────────────────────────────────────────────────────────────
const Pill = ({ children }) => (
  <span className="inline-block text-[12px] font-medium px-3 py-1 rounded-full"
    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }}>
    {children}
  </span>
);

// ── Selectable option card (package / add-on / advanced) ──────────────────────
const OptionCard = ({ title, desc, priceLabel, pills, selected, popular, onClick }) => (
  <button onClick={onClick} aria-pressed={selected}
    className="relative w-full text-left rounded-2xl p-5 transition-all duration-200 active:scale-[0.995]"
    style={{
      background: selected ? 'rgba(0,168,204,0.08)' : 'rgba(255,255,255,0.025)',
      border:     selected ? '1.5px solid rgba(0,168,204,0.55)' : '1.5px solid rgba(255,255,255,0.08)',
      boxShadow:  selected ? '0 0 30px rgba(0,168,204,0.12)' : 'none',
    }}>
    {popular && (
      <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
        style={{ background: GOLD, color: '#0b0f1a' }}>POPULAR</span>
    )}
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {selected && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: ACCENT }}>
              <Check className="w-3 h-3 text-black" strokeWidth={3.5} />
            </span>
          )}
          <span className="text-white font-bold text-lg leading-tight">{title}</span>
        </div>
        {desc && <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>}
      </div>
      {priceLabel && (
        <span className="text-xl font-black flex-shrink-0" style={{ color: ACCENT }}>{priceLabel}</span>
      )}
    </div>
    {pills && pills.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-4">
        {pills.map((p, i) => <Pill key={i}>{p}</Pill>)}
      </div>
    )}
  </button>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const InstantQuote = () => {
  const navigate = useNavigate();
  const { t, isFr } = useTranslation();
  const { services, addOns, packages, loading } = useServicesCache();

  const [vehicle, setVehicle] = useState('Sedan');
  const [mainSel, setMainSel] = useState(null);          // { item, isPackage }
  const [addonSel, setAddonSel] = useState(() => new Set());
  const [advSel, setAdvSel]   = useState(() => new Set());
  const [visible, setVisible] = useState(false);

  const sectionRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const nm   = (o) => (isFr && o?.nameFr) ? o.nameFr : o?.name;
  const desc = (o) => (isFr && o?.descriptionFr) ? o.descriptionFr : o?.description;

  // ── Catalog buckets ─────────────────────────────────────────────────────────
  const serviceById = Object.fromEntries(services.map(s => [String(s.id), s]));
  const activePackages = packages.filter(p => p.isActive !== false);
  const advancedServices = services.filter(s =>
    s.isActive !== false && (s.requiresQuote || ADVANCED_CATS.includes(s.category)));
  const baseServices = services.filter(s =>
    s.isActive !== false && !s.requiresQuote && !ADVANCED_CATS.includes(s.category));

  // Section 2 shows packages; if the catalog has none yet, fall back to base services
  const mainOptions = activePackages.length
    ? activePackages.map(p => ({ item: p, isPackage: true }))
    : baseServices.map(s => ({ item: s, isPackage: false }));

  const activeAddOns = addOns.filter(a => a.isActive !== false);

  // Tags come straight from the catalog: a package lists its included
  // services; everything else uses its `includes` / `includesFr` field
  // (comma- or newline-separated, or a JSON array).
  const parseIncludes = (raw) => {
    if (!raw) return [];
    try { const j = JSON.parse(raw); if (Array.isArray(j)) return j.map(String).filter(Boolean); }
    catch { /* not JSON — fall through */ }
    return String(raw).split(/\n|,\s*/).map(s => s.trim()).filter(Boolean);
  };

  const itemTags = (item, isPackage) => {
    if (isPackage && (item.includedServices || []).length) {
      return (item.includedServices || [])
        .map(id => serviceById[String(id)]).filter(Boolean).slice(0, 6).map(nm);
    }
    const inc = isFr ? (item.includesFr || item.includes) : item.includes;
    return parseIncludes(inc).slice(0, 6);
  };

  // ── Estimate ────────────────────────────────────────────────────────────────
  const mainPrice = mainSel && !mainSel.item.requiresQuote
    ? (getPriceFor(mainSel.item.pricing || {}, vehicle) || 0) : 0;
  const addOnTotal = [...addonSel].reduce((sum, id) => {
    const a = activeAddOns.find(x => String(x.id) === String(id));
    return sum + (a ? Number(a.price) || 0 : 0);
  }, 0);
  const advTotal = [...advSel].reduce((sum, id) => {
    const s = advancedServices.find(x => String(x.id) === String(id));
    return sum + (s && !s.requiresQuote ? (getPriceFor(s.pricing || {}, vehicle) || 0) : 0);
  }, 0);
  const total = mainPrice + addOnTotal + advTotal;
  const hasQuoteItem = (mainSel?.item.requiresQuote) ||
    [...advSel].some(id => advancedServices.find(x => String(x.id) === String(id))?.requiresQuote);

  const toggleSet = (setter) => (id) => setter(prev => {
    const next = new Set(prev);
    next.has(String(id)) ? next.delete(String(id)) : next.add(String(id));
    return next;
  });
  const toggleAddon = toggleSet(setAddonSel);
  const toggleAdv   = toggleSet(setAdvSel);
  const selectMain  = (opt) => setMainSel(prev =>
    prev?.item.id === opt.item.id && prev?.isPackage === opt.isPackage ? null : opt);

  const handleBook = () => {
    const pkg = mainSel?.isPackage ? mainSel.item : null;
    const svc = mainSel && !mainSel.isPackage ? mainSel.item : null;
    const advIds   = [...advSel].map(String);
    const addonIds = [...addonSel].map(String);
    navigate('/booking', {
      state: {
        prefilled: {
          vehicleType: vehicle,
          packageId:   pkg?.id   || null,
          packageName: pkg ? nm(pkg) : null,
          services:    [...(svc ? [String(svc.id)] : []), ...advIds],
          addOns:      addonIds,
          totalPrice:  total > 0 ? total : null,
          mode:        pkg ? 'packages' : 'custom',
        },
      },
    });
  };

  const fmt = (n) => `$${n}`;
  const estimateText = total > 0
    ? fmt(total)
    : hasQuoteItem ? t('iq.quote') : '$0';

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 px-4"
      style={{ background: 'linear-gradient(180deg,#0b0f1a 0%,#0e1522 100%)' }}>
      <div className={`max-w-5xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
            {t('iq.eyebrow')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">{t('iq.title')}</h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('iq.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-5 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Card header */}
          <div className="flex items-start justify-between gap-3 mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">{t('iq.cardTitle')}</h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('iq.cardSub')}</p>
            </div>
            <span className="hidden sm:inline-block text-xs font-bold px-4 py-2 rounded-full flex-shrink-0"
              style={{ background: 'rgba(0,168,204,0.1)', border: '1px solid rgba(0,168,204,0.3)', color: '#00d4ff' }}>
              {t('iq.badge')}
            </span>
          </div>

          {/* Section 1 — Vehicle */}
          <div className="mb-8">
            <SectionLabel n={1}>{t('iq.secVehicle')}</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VEHICLE_KEYS.map(v => {
                const active = vehicle === v.key;
                return (
                  <button key={v.key} onClick={() => setVehicle(v.key)} aria-pressed={active}
                    className="py-4 px-4 rounded-2xl text-center font-bold transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: active ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.025)',
                      border:     active ? '1.5px solid rgba(0,168,204,0.55)' : '1.5px solid rgba(255,255,255,0.08)',
                      color:      active ? '#fff' : 'rgba(255,255,255,0.55)',
                    }}>
                    {t(v.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('iq.loading')}</p>
          ) : (
            <>
              {/* Section 2 — Package / main service */}
              <div className="mb-8">
                <SectionLabel n={2}>{t('iq.secPackage')}</SectionLabel>
                {mainOptions.length === 0 ? (
                  <p className="text-sm rounded-2xl px-5 py-6 text-center"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                    {t('iq.noPackages')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mainOptions.map(opt => {
                      const p = getPriceFor(opt.item.pricing || {}, vehicle);
                      return (
                        <OptionCard key={`${opt.isPackage ? 'p' : 's'}-${opt.item.id}`}
                          title={nm(opt.item)}
                          desc={desc(opt.item)}
                          priceLabel={opt.item.requiresQuote ? t('iq.quote') : (p ? fmt(p) : null)}
                          pills={itemTags(opt.item, opt.isPackage)}
                          popular={opt.item.isMostPopular || opt.item.isFeatured}
                          selected={mainSel?.item.id === opt.item.id && mainSel?.isPackage === opt.isPackage}
                          onClick={() => selectMain(opt)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3 — Add-ons */}
              {activeAddOns.length > 0 && (
                <div className="mb-8">
                  <SectionLabel n={3}>{t('iq.secAddon')}</SectionLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeAddOns.map(a => (
                      <OptionCard key={`a-${a.id}`}
                        title={nm(a)}
                        desc={desc(a)}
                        priceLabel={a.requiresQuote ? t('iq.quote') : `+${fmt(Number(a.price) || 0)}`}
                        pills={itemTags(a, false)}
                        selected={addonSel.has(String(a.id))}
                        onClick={() => toggleAddon(a.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4 — Optional advanced services */}
              {advancedServices.length > 0 && (
                <div className="mb-8">
                  <SectionLabel n={activeAddOns.length > 0 ? 4 : 3}>{t('iq.secAdvanced')}</SectionLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advancedServices.map(s => {
                      const p = getPriceFor(s.pricing || {}, vehicle);
                      return (
                        <OptionCard key={`adv-${s.id}`}
                          title={nm(s)}
                          desc={desc(s)}
                          priceLabel={s.requiresQuote ? t('iq.quote') : (p ? `+${fmt(p)}` : null)}
                          selected={advSel.has(String(s.id))}
                          onClick={() => toggleAdv(s.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Estimate bar */}
          <div className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg,#eef6f9,#ffffff)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#475569' }}>{t('iq.estimateLabel')}</div>
              <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{t('iq.estimateSub')}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black leading-none" style={{ color: ACCENT }}>
                {estimateText}{total > 0 && hasQuoteItem ? <span className="text-sm font-semibold align-middle" style={{ color: '#94a3b8' }}> {t('iq.plusQuote')}</span> : null}
              </div>
              <button onClick={handleBook}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-base transition-all duration-200 active:scale-[0.98]"
                style={{ background: GOLD, color: '#0b0f1a', boxShadow: '0 4px 20px rgba(0,168,204,0.3)' }}>
                {t('iq.book')} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Trust columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { tt: t('iq.trust1Title'), dd: t('iq.trust1Desc') },
              { tt: t('iq.trust2Title'), dd: t('iq.trust2Desc') },
              { tt: t('iq.trust3Title'), dd: t('iq.trust3Desc') },
            ].map(({ tt, dd }) => (
              <div key={tt} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="font-bold text-sm mb-1" style={{ color: '#00d4ff' }}>{tt}</div>
                <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{dd}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default InstantQuote;
