// src/components/FAQSection.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const API = import.meta.env.VITE_API_URL;

const FAQSection = () => {
  const { t }             = useTranslation();
  const [items, setItems] = useState([]);
  const [open,  setOpen]  = useState(null);

  useEffect(() => {
    fetch(`${API}/faq`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.items?.length) {
          setItems(d.items);
        } else {
          // fallback to translation strings
          setItems(t('faq.items') || []);
        }
      })
      .catch(() => setItems(t('faq.items') || []));
  }, []);

  if (!items.length) return null;

  return (
    <section className="py-24 px-4" style={{ background: '#0b0f1a' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('faq.badge')}</span>
          </div>
          <h2 className="text-4xl font-black text-white">{t('faq.title')}</h2>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div key={item.id || idx}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: isOpen ? 'rgba(0,168,204,0.06)' : 'rgba(255,255,255,0.03)',
                  border: isOpen ? '1px solid rgba(0,168,204,0.25)' : '1px solid rgba(255,255,255,0.07)',
                }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  onClick={() => setOpen(isOpen ? null : idx)}>
                  <span className="text-white font-semibold text-sm sm:text-base leading-snug">
                    {item.q}
                  </span>
                  {isOpen
                    ? <ChevronUp  className="w-5 h-5 flex-shrink-0" style={{ color: '#00d4ff' }} />
                    : <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-500" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
