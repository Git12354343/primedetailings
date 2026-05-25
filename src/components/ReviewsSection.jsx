// src/components/ReviewsSection.jsx — MERGED
// Uses the Testimonials card style (avatar initials, colored accents, service
// badge, stats row, hover glow) but fetches live from GET /api/reviews/active.
// Falls back to seed reviews if the API returns nothing.
import React, { useEffect, useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import useInView from '../hooks/useInView';

const API  = import.meta.env.VITE_API_URL;
const GOLD = 'linear-gradient(135deg,#c9a84c,#f5d376)';

const CARD_COLORS = ['#c9a84c','#60a5fa','#a78bfa','#34d399','#f472b6','#fb923c'];

const SEED = [
  { id:'s1', name:'Marc-André L.',  rating:5, vehicle:'BMW M4',        text:'The ceramic coating is unreal — water just sheets off and the gloss is mirror-deep. Booked, they came to me, done in a day.',             source:'Google'   },
  { id:'s2', name:'Jessica T.',     rating:5, vehicle:'Tesla Model 3', text:'Best detailing experience in Montréal. Professional, on time, and my white paint has never looked this clean.',                           source:'Google'   },
  { id:'s3', name:'Karim B.',       rating:5, vehicle:'Audi Q5',       text:'Paid for the 5-year ceramic and it was worth every dollar. The depth on the paint after correction is incredible.',                        source:'Facebook' },
  { id:'s4', name:'Sophie R.',      rating:5, vehicle:'Range Rover',   text:'They treat your car like their own. Spotless interior, flawless exterior. Already booked my second car.',                                  source:'Google'   },
  { id:'s5', name:'David C.',       rating:5, vehicle:'Porsche 911',   text:'Best detailing service in Montréal, no question. Quick to respond, on time, and the results speak for themselves.',                        source:'Google'   },
  { id:'s6', name:'Sarah M.',       rating:5, vehicle:'Mercedes C300', text:'My car has never looked better. The ceramic coating is absolutely flawless — water just beads right off. True professionals.',             source:'Google'   },
];

const STATS = [
  { value:'5★',    label:'Trusted by Montréal drivers' },
  { value:'100%',  label:'Mobile — we come to you'     },
  { value:'Real',  label:'Verified customer results'   },
  { value:'MTL',   label:'Across Greater Montréal'     },
];

// Derive initials + consistent color from name
const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const accentColor = (id, idx) => CARD_COLORS[idx % CARD_COLORS.length];

const StarRow = ({ n }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="w-4 h-4"
        style={{ color: i < n ? '#f5d376' : '#3f3f46', fill: i < n ? '#f5d376' : 'none' }} />
    ))}
  </div>
);

const ReviewCard = ({ review, color }) => (
  <div className="relative p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>

    {/* Hover glow */}
    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background:`radial-gradient(circle at 50% 100%,${color}10 0%,transparent 65%)` }} />

    <Quote className="w-7 h-7 mb-3 opacity-20" style={{ color }} />
    <StarRow n={review.rating} />
    <p className="text-gray-300 mt-3 mb-5 leading-relaxed text-sm italic flex-1">
      "{review.text}"
    </p>

    {/* Footer */}
    <div className="flex items-center gap-3 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background:`${color}22`, color, border:`1px solid ${color}44` }}>
        {initials(review.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm">{review.name}</div>
        <div className="text-gray-500 text-xs">{review.vehicle || review.location || ''}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {(review.serviceType || review.service) && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background:`${color}18`, color }}>
            {review.serviceType || review.service}
          </span>
        )}
        {review.source && (
          <span className="text-[10px] uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.25)' }}>
            via {review.source}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ReviewsSection = () => {
  const [reviews, setReviews]   = useState(SEED);
  const [current, setCurrent]   = useState(0);
  const [paused, setPaused]     = useState(false);
  const [ref, visible]          = useInView({ threshold: 0.1 });

  /* Fetch live reviews */
  useEffect(() => {
    fetch(`${API}/reviews/active`)
      .then(r => r.json())
      .then(d => { if (d?.success && d.reviews?.length) setReviews(d.reviews); })
      .catch(() => {});
  }, []);

  /* Auto-advance carousel (mobile) */
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [paused, reviews.length]);

  const prev = () => { setCurrent(c => (c - 1 + reviews.length) % reviews.length); setPaused(true); };
  const next = () => { setCurrent(c => (c + 1) % reviews.length); setPaused(true); };

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background:'#080808' }}>

      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(201,168,76,0.05) 0%,transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14"
          style={{ transition:'opacity .7s, transform .7s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)' }}>
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Client Reviews</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing:'-0.02em' }}>
            What Montréal drivers{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              say
            </span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Don't just take our word for it — here's what our clients are saying.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14"
          style={{ transition:'opacity .7s .1s', opacity: visible ? 1 : 0 }}>
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center py-6 rounded-2xl"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-3xl font-black mb-1"
                style={{ background: GOLD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {value}
              </div>
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Desktop: 2-col grid (up to 4 reviews) */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-5 mb-12"
          style={{ transition:'opacity .7s .2s', opacity: visible ? 1 : 0 }}>
          {reviews.slice(0, 4).map((r, i) => (
            <ReviewCard key={r.id || i} review={r} color={accentColor(r.id, i)} />
          ))}
        </div>

        {/* Mobile: single-card carousel */}
        <div className="sm:hidden mb-8">
          <ReviewCard review={reviews[current]} color={accentColor(reviews[current]?.id, current)} />
          <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={prev}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => { setCurrent(i); setPaused(true); }}
                  className="rounded-full transition-all duration-300"
                  style={{ height:'6px', width: i === current ? '20px' : '6px', background: i === current ? '#f5d376' : 'rgba(255,255,255,0.2)' }} />
              ))}
            </div>
            <button onClick={next}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center"
          style={{ transition:'opacity .7s .4s', opacity: visible ? 1 : 0 }}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl"
            style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)' }}>
            <div className="text-center sm:text-left">
              <div className="text-white font-bold text-lg">Ready to join them?</div>
              <div className="text-gray-400 text-sm">Book your detail today. We come to you.</div>
            </div>
            <a href="/booking" className="btn-luxury px-6 py-3 rounded-xl text-sm font-bold tracking-wide whitespace-nowrap">
              Book Now
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ReviewsSection;
