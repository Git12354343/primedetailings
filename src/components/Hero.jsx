import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Professional Car Detailing in{' '}
            <span className="text-blue-300">Montreal</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-blue-100">
            Premium interior and exterior detailing services that make your vehicle look and feel brand new
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              Book Now
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/services"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              View Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;