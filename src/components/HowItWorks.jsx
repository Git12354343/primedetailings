import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Book Online",
      description: "Choose your services and schedule an appointment that fits your schedule"
    },
    {
      step: "2",
      title: "We Come to You",
      description: "Our professional team arrives at your location with all equipment needed"
    },
    {
      step: "3",
      title: "Enjoy the Results",
      description: "Relax while we transform your vehicle to showroom condition"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Getting your car detailed has never been easier
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4 mx-auto">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;