import React from 'react';
import Hero from '../components/Hero';
import ServicesOverview from '../components/ServicesOverview';
import HowItWorks from '../components/HowItWorks';

const Home = () => {
  return (
    <div>
      <Hero />
      <ServicesOverview />
      <HowItWorks />
    </div>
  );
};

export default Home;