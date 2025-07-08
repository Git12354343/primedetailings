import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Sparkles, Shield, Zap, ChevronRight } from 'lucide-react';

const ServicesOverview = () => {
  const services = [
    {
      icon: <Droplets className="w-8 h-8 text-blue-600" />,
      title: "Exterior Detailing",
      description: "Complete exterior wash, clay bar treatment, polish, and protective wax coating",
      price: "Starting at $89"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-blue-600" />,
      title: "Interior Detailing",
      description: "Deep cleaning of seats, carpets, dashboard, and all interior surfaces",
      price: "Starting at $119"
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Paint Protection",
      description: "Ceramic coating and paint protection film for long-lasting shine",
      price: "Starting at $299"
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Express Detail",
      description: "Quick wash and vacuum service for busy schedules",
      price: "Starting at $49"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional car detailing services tailored to your vehicle's needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                {service.description}
              </p>
              <p className="text-blue-600 font-semibold text-center">
                {service.price}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/services"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            View All Services
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;