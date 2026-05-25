// src/components/PricingCalculator.jsx — dark/gold luxury redesign
import React, { useState, useEffect } from 'react';
import { Calculator, Package, Wrench, AlertCircle, CheckCircle, Loader2, Clock, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD = 'linear-gradient(135deg,#c9a84c,#f5d376)';
const GOLD_S = '#c9a84c';

const PricingCalculator = ({
  vehicleType, selectedServices, selectedAddOns,
  services, addOns, onPricingUpdate,
  showBreakdown = true, showEstimate = true, className = ''
}) => {
  const [pricing, setPricing]               = useState({ services: [], addOns: [], subtotal: 0, total: 0 });
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  useEffect(() => {
    if (vehicleType && (selectedServices.length > 0 || selectedAddOns.length > 0)) {
      calculatePricing();
    } else {
      resetPricing();
    }
  }, [vehicleType, selectedServices, selectedAddOns]);

  const resetPricing = () => {
    const empty = { services: [], addOns: [], subtotal: 0, total: 0 };
    setPricing(empty);
    setEstimatedDuration('');
    onPricingUpdate?.(empty);
  };

  const calculatePricing = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/services/calculate-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: selectedServices, addOns: selectedAddOns, vehicleType }),
      });
      const data = await res.json();
      if (data.success) {
        setPricing(data.pricing);
        setEstimatedDuration(`${4 + selectedAddOns.length * 0.5} hours`);
        onPricingUpdate?.(data.pricing);
      } else {
        setError('Could not fetch live pricing — showing estimate.');
        calculateLocalPricing();
      }
    } catch {
      setError('Offline — showing local estimate.');
      calculateLocalPricing();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalPricing = () => {
    const svcList = [], addList = [];
    let total = 0;
    selectedServices.forEach(id => {
      const s = services.find(s => s.id === id);
      if (s?.pricing?.[vehicleType]) {
        svcList.push({ id: s.id, name: s.name, price: s.pricing[vehicleType] });
        total += s.pricing[vehicleType];
      }
    });
    selectedAddOns.forEach(id => {
      const a = addOns.find(a => a.id === id);
      if (a) {
        const p = parseFloat(a.price);
        addList.push({ id: a.id, name: a.name, price: p });
        total += p;
      }
    });
    const local = { services: svcList, addOns: addList, subtotal: total, total };
    setPricing(local);
    onPricingUpdate?.(local);
  };

  // ── Empty states ──────────────────────────────────────────────────────────
  const emptyBase = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
  };

  if (!vehicleType) return (
    <div className={className} style={emptyBase}>
      <Calculator className="w-8 h-8 mx-auto mb-2" style={{ color: GOLD_S }} />
      <p className="text-white font-semibold text-sm">Select your vehicle</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Pricing varies by size & complexity</p>
    </div>
  );

  if (!selectedServices.length && !selectedAddOns.length) return (
    <div className={className} style={emptyBase}>
      <Calculator className="w-8 h-8 mx-auto mb-2" style={{ color: GOLD_S }} />
      <p className="text-white font-semibold text-sm">Select services to see pricing</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Choose from our available services and add-ons</p>
    </div>
  );

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className={className} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Calculator className="w-4 h-4" style={{ color: GOLD_S }} />
          </div>
          <span className="text-white font-bold text-sm">Pricing Summary</span>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD_S }} />}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-xs"
          style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Breakdown */}
      {showBreakdown && (pricing.services.length > 0 || pricing.addOns.length > 0) && (
        <div className="space-y-3 mb-5">

          {/* Services */}
          {pricing.services.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Wrench className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Services</span>
              </div>
              <div className="space-y-1.5">
                {pricing.services.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <span className="text-white text-sm font-medium">{s.name}</span>
                      <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{vehicleType}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: GOLD_S }}>${s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {pricing.addOns.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Package className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Add-ons</span>
              </div>
              <div className="space-y-1.5">
                {pricing.addOns.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-white text-sm font-medium">{a.name}</span>
                    <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>+${a.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Estimated Total</span>
          <div className="flex items-center gap-1.5">
            {!loading && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#34d399' }} />}
            <span className="text-2xl font-black" style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ${pricing.total}
            </span>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Final price may vary based on vehicle condition.
        </p>
      </div>

      {/* Duration + service info */}
      {showEstimate && estimatedDuration && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Estimated duration</span>
            </div>
            <span className="text-xs font-semibold text-white">{estimatedDuration}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Service type</span>
            </div>
            <span className="text-xs font-semibold text-white">Mobile — we come to you</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Prices include all materials & equipment. Weather-dependent services may be rescheduled. Final price confirmed after booking.
        </p>
      </div>
    </div>
  );
};

export default PricingCalculator;
