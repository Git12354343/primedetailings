import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight } from 'lucide-react';

const Services = () => {
  const allServices = [
    {
      category: "Exterior Services",
      services: [
        {
          name: "Basic Exterior Wash",
          description: "Complete hand wash, rinse, and dry with premium microfiber towels",
          price: "Starting at $49",
          features: ["Hand wash", "Wheel cleaning", "Tire dressing", "Exterior windows"]
        },
        {
          name: "Premium Exterior Detail",
          description: "Comprehensive exterior cleaning with clay bar treatment and wax protection",
          price: "Starting at $89",
          features: ["Everything in Basic", "Clay bar treatment", "Paint decontamination", "Carnauba wax", "Chrome polishing"]
        },
        {
          name: "Paint Correction",
          description: "Professional paint correction to remove swirl marks and restore shine",
          price: "Starting at $199",
          features: ["Single-stage correction", "Swirl mark removal", "Light scratch removal", "Paint enhancement"]
        },
        {
          name: "Ceramic Coating",
          description: "Long-lasting paint protection with ceramic coating technology",
          price: "Starting at $299",
          features: ["Paint preparation", "Ceramic coating application", "2-year protection", "Hydrophobic properties"]
        }
      ]
    },
    {
      category: "Interior Services",
      services: [
        {
          name: "Basic Interior Clean",
          description: "Thorough vacuuming and basic cleaning of all interior surfaces",
          price: "Starting at $69",
          features: ["Complete vacuuming", "Dashboard cleaning", "Interior windows", "Cup holders & console"]
        },
        {
          name: "Premium Interior Detail",
          description: "Deep cleaning and conditioning of all interior surfaces",
          price: "Starting at $119",
          features: ["Everything in Basic", "Leather conditioning", "Fabric protection", "Deep carpet cleaning", "Door jamb cleaning"]
        },
        {
          name: "Seat Shampoo",
          description: "Professional extraction cleaning for fabric seats and carpets",
          price: "Starting at $89",
          features: ["Hot water extraction", "Stain removal", "Fabric protection", "Fast drying"]
        },
        {
          name: "Odor Elimination",
          description: "Complete odor removal using ozone treatment and specialized products",
          price: "Starting at $79",
          features: ["Ozone treatment", "Odor neutralization", "Air freshening", "Sanitization"]
        }
      ]
    },
    {
      category: "Specialty Services",
      services: [
        {
          name: "Engine Bay Cleaning",
          description: "Safe and thorough cleaning of engine compartment",
          price: "Starting at $59",
          features: ["Degreasing", "Pressure washing", "Dressing application", "Detail work"]
        },
        {
          name: "Headlight Restoration",
          description: "Restore clarity to cloudy and yellowed headlights",
          price: "Starting at $79",
          features: ["Sanding process", "Polishing", "UV protection", "Improved visibility"]
        },
        {
          name: "Express Detail",
          description: "Quick refresh for vehicles needing light cleaning",
          price: "Starting at $39",
          features: ["Exterior rinse", "Quick vacuum", "Dashboard wipe", "Windows"]
        }
      ]
    }
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional car detailing services designed to keep your vehicle looking and feeling its best. 
            All services are performed by trained professionals using premium products.
          </p>
        </div>

        {allServices.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
              {category.category}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {category.services.map((service, serviceIndex) => (
                <div key={serviceIndex} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                    <span className="text-blue-600 font-bold text-lg">{service.price}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Book?</h2>
          <p className="text-gray-600 mb-6">
            Choose your services and schedule an appointment that works for you. We'll come to your location in Montreal.
          </p>
          <Link
            to="/booking"
            className="btn-primary inline-flex items-center"
          >
            Book Your Service
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;