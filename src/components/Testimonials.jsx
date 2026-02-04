import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "My car has never looked better! The attention to detail was incredible. They even cleaned parts I didn't know were dirty. Highly recommend Prime Detailing!",
      name: "Sarah L.",
      location: "Montreal, QC",
      rating: 5,
      service: "Full Detail Package"
    },
    {
      quote: "Professional, punctual, and worth every penny. The team arrived on time and transformed my SUV completely. Will definitely be using them again!",
      name: "Mike R.",
      location: "Laval, QC", 
      rating: 5,
      service: "Premium Exterior Detail"
    },
    {
      quote: "I was skeptical about mobile detailing, but Prime Detailing exceeded all my expectations. My truck looks brand new and the convenience is unmatched.",
      name: "Jessica M.",
      location: "Longueuil, QC",
      rating: 5,
      service: "Complete Care Package"
    }
  ];

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about our detailing services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 relative hover:shadow-lg transition-shadow duration-300">
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-blue-200">
                <Quote className="w-8 h-8" />
              </div>
              
              {/* Rating */}
              <div className="mb-4">
                {renderStars(testimonial.rating)}
              </div>
              
              {/* Quote */}
              <p className="text-gray-600 mb-6 italic leading-relaxed">
                "{testimonial.quote}"
              </p>
              
              {/* Customer Info */}
              <div className="border-t pt-4">
                <p className="font-semibold text-gray-900 mb-1">
                  {testimonial.name}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  {testimonial.location}
                </p>
                <p className="text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
                  {testimonial.service}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Social Proof */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-sm text-gray-600">Vehicles Detailed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">4.9</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Mobile Service</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Join Our Happy Customers?</h3>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Experience the same level of professional service and attention to detail that our customers rave about.
          </p>
          <a
            href="/booking"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            Book Your Service Today
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;