import React from 'react';
import HowItWorks from '../components/HowItWorks';
import FAQSection from '../components/FAQSection';

const HowItWorksPage = () => (
  <div style={{ background: '#0b0f1a', minHeight: '100vh' }}>
    <div className="pt-20 sm:pt-24">
      <HowItWorks />
      <FAQSection />
    </div>
  </div>
);

export default HowItWorksPage;
