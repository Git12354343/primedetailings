import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const FAQSection = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const items = t('faq.items');
  const list = Array.isArray(items) ? items : [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="faq" ref={ref} className="relative py-20 sm:py-24 overflow-hidden" style={{ background: '#111827' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-10 sm:mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('faq.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">{t('faq.title')}</h2>
        </div>
        <div className="space-y-2">
          {list.map(({ q, a }, i) => (
            <div key={i} className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button className="w-full flex items-center justify-between px-5 py-4 text-left group"
                style={{ minHeight: '44px' }}
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-white font-semibold text-sm pr-4 group-hover:text-cyan-300 transition-colors">{q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              <div style={{ maxHeight: open === i ? '320px' : '0', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <p className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
