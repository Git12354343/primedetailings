import React from 'react';
import BookingForm from '../components/BookingForm';
import { Shield, Zap, MapPin, Phone } from 'lucide-react';

const TRUST_BADGES = [
  { icon: Shield,  text: 'Fully Insured' },
  { icon: Zap,     text: 'Same-Day Available' },
  { icon: MapPin,  text: 'We Come To You' },
  { icon: Phone,   text: 'SMS Confirmation' },
];

const Booking = () => (
  <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>

    {/* Page header */}
    <div className="relative pt-28 pb-10 px-4 text-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Online Booking</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
          Book Your{' '}
          <span style={{
            background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Detail</span>
        </h1>
        <p className="text-gray-400 text-base mb-6">
          Takes 2 minutes. We come to you anywhere in Montreal.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {TRUST_BADGES.map(({ icon: Icon, text }) => (
            <div key={text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9ca3af' }}>
              <Icon className="w-3.5 h-3.5 text-yellow-500" />
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

export default Booking;
