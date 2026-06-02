import React from 'react';
import Hero from '../components/Hero';
import ServicesOverview from '../components/ServicesOverview';
import ReviewsSection from '../components/ReviewsSection';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import CeramicTeaser from '../components/home/CeramicTeaser';
import ServiceAreaMap from '../components/ServiceAreaMap';

/* Homepage — lean, mobile-first flow:
   Hero → Services → Reviews → proof (before/after) → ceramic upsell → service area.
   "How It Works" and FAQ now live on the dedicated /how-it-works page. */
const Home = () => (
  <div style={{ background: '#0b0f1a' }}>
    <Hero />
    <ServicesOverview />
    <ReviewsSection />
    <BeforeAfterSlider />
    <CeramicTeaser />
    <ServiceAreaMap />
  </div>
);

export default Home;
