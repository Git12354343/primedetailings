import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "My car has never looked better. The ceramic coating is absolutely flawless — water just beads right off. These guys are true professionals.",
    name: "Sarah L.",
    location: "Westmount, QC",
    rating: 5,
    service: "Ceramic Coating",
    initials: "SL",
    color: '#00a8cc'
  },
  {
    quote: "Had a full paint correction done on my BMW. The swirl marks are completely gone. Looks better than when I bought it. Worth every penny.",
    name: "Mike R.",
    location: "Laval, QC",
    rating: 5,
    service: "Paint Correction",
    initials: "MR",
    color: '#60a5fa'
  },
  {
    quote: "They came to my house, worked for 6 hours and the car looked like it just left the showroom. Incredible service, will book again.",
    name: "Jessica M.",
    location: "Longueuil, QC",
    rating: 5,
    service: "Full Detail Package",
    initials: "JM",
    color: '#a78bfa'
  },
  {
    quote: "Best detailing service in Montreal, no question. Quick to respond, on time, and the results speak for themselves. Highly recommended.",
    name: "David C.",
    location: "Brossard, QC",
    rating: 5,
    service: "Premium Exterior",
    initials: "DC",
    color: '#34d399'
  },
];

const STATS = [
  { value: '500+', label: 'Vehicles Detailed' },
  { value: '4.9★', label: 'Google Rating' },
  { value: '98%',  label: 'Satisfaction Rate' },
  { value: '100%', label: 'Mobile Service' },
];

const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-cyan-400 fill-cyan-400' : 'text-gray-600'}`} />
    ))}
  </div>
);

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance on mobile
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent(c => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setCurrent(c => (c + 1) % TESTIMONIALS.length);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0b0f1a' }}>
      {/* Ambient glow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,168,204,0.05) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <Star className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Client Reviews</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            What Clients <span style={{
              background: 'linear-gradient(135deg, #00a8cc, #00d4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Say</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Don't just take our word for it. Here's what Montreal drivers are saying.
          </p>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {STATS.map(({ value, label }, i) => (
            <div
              key={i}
              className="text-center py-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-3xl font-black mb-1" style={{
                background: 'linear-gradient(135deg, #00a8cc, #00d4ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>{value}</div>
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Desktop: 2-col grid */}
        <div className={`hidden sm:grid sm:grid-cols-2 gap-5 mb-12 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 100%, ${t.color}08 0%, transparent 60%)` }} />

              <Quote className="w-8 h-8 mb-4 opacity-20" style={{ color: t.color }} />
              <StarRow rating={t.rating} />
              <p className="text-gray-300 mt-3 mb-5 leading-relaxed text-sm italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.location}</div>
                </div>
                <div className="ml-auto">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${t.color}18`, color: t.color }}
                  >
                    {t.service}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: carousel */}
        <div className="sm:hidden mb-8">
          <div
            className="relative p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Quote className="w-7 h-7 mb-3 opacity-20" style={{ color: TESTIMONIALS[current].color }} />
            <StarRow rating={TESTIMONIALS[current].rating} />
            <p className="text-gray-300 mt-3 mb-5 leading-relaxed text-sm italic">
              "{TESTIMONIALS[current].quote}"
            </p>
            <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: `${TESTIMONIALS[current].color}22`,
                  color: TESTIMONIALS[current].color,
                  border: `1px solid ${TESTIMONIALS[current].color}44`
                }}
              >
                {TESTIMONIALS[current].initials}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{TESTIMONIALS[current].name}</div>
                <div className="text-gray-500 text-xs">{TESTIMONIALS[current].location}</div>
              </div>
            </div>
          </div>
          {/* Carousel controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={prev} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i === current ? '#00d4ff' : 'rgba(255,255,255,0.2)', width: i === current ? '20px' : '6px' }}
                />
              ))}
            </div>
            <button onClick={next} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={`text-center transition-all duration-700 delay-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl"
            style={{ background: 'rgba(0,168,204,0.06)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <div className="text-center sm:text-left">
              <div className="text-white font-bold text-lg">Ready to join them?</div>
              <div className="text-gray-400 text-sm">Book your detail today. We come to you.</div>
            </div>
            <a
              href="/booking"
              className="btn-luxury px-6 py-3 rounded-xl text-sm font-bold tracking-wide whitespace-nowrap"
            >
              Book Now
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
