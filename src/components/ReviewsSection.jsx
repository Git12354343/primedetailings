// src/components/ReviewsSection.jsx
// Public-facing reviews. Content is fully admin-editable: it fetches from
// GET /api/reviews/active. If that endpoint isn't live yet, it falls back to
// seed reviews so the page never looks empty during rollout.
//
// Drop <ReviewsSection /> into Home.jsx and/or CeramicCoating.jsx.
import React, { useEffect, useState, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import useInView from '../hooks/useInView';

const API = import.meta.env.VITE_API_URL;

// Fallback seed (used only if the API returns nothing). Edit/replace anytime
// from the admin panel once the reviews endpoint is live.
const SEED = [
  { id: 's1', name: 'Marc-André L.', rating: 5, vehicle: 'BMW M4', text: 'The ceramic coating is unreal — water just sheets off and the gloss is mirror-deep. Booked, they came to me, done in a day.', source: 'Google' },
  { id: 's2', name: 'Jessica T.',    rating: 5, vehicle: 'Tesla Model 3', text: 'Best detailing experience in Montreal. Professional, on time, and my white paint has never looked this clean.', source: 'Google' },
  { id: 's3', name: 'Karim B.',      rating: 5, vehicle: 'Audi Q5', text: 'Paid for the 5-year ceramic and it was worth every dollar. The depth on the paint after correction is incredible.', source: 'Facebook' },
  { id: 's4', name: 'Sophie R.',     rating: 5, vehicle: 'Range Rover', text: 'They treat your car like their own. Spotless interior, flawless exterior. Already booked my second car.', source: 'Google' },
];

const Stars = ({ n }) => (
  <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="w-4 h-4" style={{ color: i < n ? '#f5d376' : '#3f3f46', fill: i < n ? '#f5d376' : 'none' }} />
    ))}
  </div>
);

const ReviewCard = ({ r }) => (
  <div className="rounded-2xl p-6 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <Quote className="w-7 h-7 mb-3" style={{ color: 'rgba(201,168,76,0.4)' }} />
    <p className="text-gray-300 text-sm leading-relaxed mb-5 flex-1">"{r.text}"</p>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-white font-bold text-sm">{r.name}</div>
        {r.vehicle && <div className="text-gray-500 text-xs">{r.vehicle}</div>}
      </div>
      <div className="text-right">
        <Stars n={r.rating} />
        {r.source && <div className="text-gray-600 text-[10px] mt-1 uppercase tracking-wider">via {r.source}</div>}
      </div>
    </div>
  </div>
);

const ReviewsSection = () => {
  const [reviews, setReviews] = useState(SEED);
  const [page, setPage] = useState(0);
  const [ref, visible] = useInView({ threshold: 0.15 });
  const trackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/reviews/active`);
        const d = await res.json();
        if (!cancelled && d?.success && Array.isArray(d.reviews) && d.reviews.length) {
          setReviews(d.reviews);
        }
      } catch {
        /* keep SEED */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const perPage = 2; // mobile shows 1 via CSS, desktop 2
  const pages = Math.ceil(reviews.length / perPage);
  const go = (dir) => setPage((p) => (p + dir + pages) % pages);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0d0d0d' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12" style={{ transition: 'opacity .6s, transform .6s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(14px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Star className="w-3 h-3 text-yellow-400" style={{ fill: '#f5d376' }} />
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">{avg} average · {reviews.length} reviews</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            What Montreal{' '}
            <span style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>drivers say</span>
          </h2>
        </div>

        <div className="relative" style={{ transition: 'opacity .6s .15s', opacity: visible ? 1 : 0 }}>
          <div className="overflow-hidden">
            <div ref={trackRef} className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${page * 100}%)` }}>
              {Array.from({ length: pages }).map((_, p) => (
                <div key={p} className="min-w-full grid grid-cols-1 sm:grid-cols-2 gap-5 px-0.5">
                  {reviews.slice(p * perPage, p * perPage + perPage).map((r) => <ReviewCard key={r.id} r={r} />)}
                </div>
              ))}
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => go(-1)} aria-label="Previous reviews"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              </button>
              <div className="flex gap-1.5">
                {Array.from({ length: pages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i)} aria-label={`Go to review page ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === page ? 24 : 8, background: i === page ? 'linear-gradient(90deg,#c9a84c,#f5d376)' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
              <button onClick={() => go(1)} aria-label="Next reviews"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
