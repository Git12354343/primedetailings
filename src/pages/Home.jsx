import React from 'react';
import Hero from '../components/Hero';
import ServicesOverview from '../components/ServicesOverview';
import Testimonials from '../components/Testimonials';
import HowItWorks from '../components/HowItWorks';

const Home = () => {
  return (
    <div>
      <Hero />
      <ServicesOverview />
      <Testimonials />
      <HowItWorks />
    </div>
  );
};

export default Home;