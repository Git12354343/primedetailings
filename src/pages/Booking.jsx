import Seo from '../components/Seo';
import React from 'react';
import BookingForm from '../components/BookingForm';
import { Shield, Zap, MapPin, Phone } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Booking = () => {
  const { t } = useTranslation();

  const TRUST_BADGES = [
    { icon: Shield, text: t('booking.trustInsured')      },
    { icon: Zap,    text: t('booking.trustCancellation') },
    { icon: MapPin, text: t('booking.trustLocation')     },
    { icon: Phone,  text: t('booking.trustSms')          },
  ];

  return (
  <div style={{ background: '#0b0f1a', minHeight: '100vh' }}>
      <Seo page="booking" path="/booking" />

    {/* Page header */}
    <div className="relative pt-28 pb-10 px-4 text-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #111827 0%, #0b0f1a 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,168,204,0.07) 0%, transparent 60%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,168,204,0.3), transparent)' }} />

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
          <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">{t('booking.headerBadge')}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
          {t('booking.title')}
        </h1>
        <p className="text-gray-400 text-base mb-6">
          {t('booking.subtitle')}
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {TRUST_BADGES.map(({ icon: Icon, text }) => (
            <div key={text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9ca3af' }}>
              <Icon className="w-3.5 h-3.5 text-cyan-500" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Form */}
    <div className="pb-32 sm:pb-12">
      <BookingForm />
    </div>

  </div>
  );
};

export default Booking;
