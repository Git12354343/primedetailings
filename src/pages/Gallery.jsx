import React from 'react';

const Gallery = () => {
  const galleryItems = [
    {
      id: 1,
      title: "Luxury Sedan Exterior Detail",
      beforeImage: "https://placehold.co/600x400/8B5A2B/FFFFFF?text=Before%3A+Dirty+Sedan",
      afterImage: "https://placehold.co/600x400/1E3A8A/FFFFFF?text=After%3A+Pristine+Sedan",
      service: "Premium Exterior Detail"
    },
    {
      id: 2,
      title: "SUV Interior Deep Clean",
      beforeImage: "https://placehold.co/600x400/8B5A2B/FFFFFF?text=Before%3A+Messy+Interior",
      afterImage: "https://placehold.co/600x400/1E3A8A/FFFFFF?text=After%3A+Clean+Interior",
      service: "Premium Interior Detail"
    },
    {
      id: 3,
      title: "Sports Car Paint Correction",
      beforeImage: "https://placehold.co/600x400/8B5A2B/FFFFFF?text=Before%3A+Swirl+Marks",
      afterImage: "https://placehold.co/600x400/1E3A8A/FFFFFF?text=After%3A+Mirror+Finish",
      service: "Paint Correction"
    },
    {
      id: 4,
      title: "Truck Full Detail Package",
      beforeImage: "https://placehold.co/600x400/8B5A2B/FFFFFF?text=Before%3A+Muddy+Truck",
      afterImage: "https://placehold.co/600x400/1E3A8A/FFFFFF?text=After%3A+Showroom+Ready",
      service: "Full Detail Package"
    },
    {
      id: 5,
      title: "Vintage Car Restoration Detail",
      beforeImage: "https://placehold.co/600x400/8B5A2B/FFFFFF?text=Before%3A+Weathered+Classic",
      afterImage: "https://placehold.co/600x400/1E3A8A/FFFFFF?text=After%3A+Restored+Beauty",
      service: "Complete Care Package"
    },
    {
      id: 6,
      title: "Family Van Interior Transformation",
      beforeImage: "https://placehold.co/600x400/8B5A2B/FFFFFF?text=Before%3A+Family+Chaos",
      afterImage: "https://placehold.co/600x400/1E3A8A/FFFFFF?text=After%3A+Fresh+%26+Clean",
      service: "Seat Shampoo & Odor Elimination"
    }
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Work</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See the incredible transformations we achieve with our professional detailing services. 
            Every vehicle tells a story of renewal and care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <div className="relative">
                {/* Before/After Image Container */}
                <div className="group">
                  {/* Before Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={item.beforeImage}
                      alt={`Before - ${item.title}`}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      Before
                    </div>
                  </div>
                  
                  {/* After Image - Shows on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <img
                      src={item.afterImage}
                      alt={`After - ${item.title}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                      After
                    </div>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Hover to see transformation
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-blue-600 text-sm font-medium">{item.service}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready for Your Vehicle's Transformation?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Every vehicle has the potential to look amazing. Let our expert team bring out the best in your car, 
            truck, or SUV with our professional detailing services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/booking"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Book Your Detail
            </a>
            <a
              href="/services"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Services
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">100+</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vehicles Transformed</h3>
            <p className="text-gray-600">Each one a testament to our quality and attention to detail.</p>
          </div>
          
          <div>
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">5★</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Satisfaction</h3>
            <p className="text-gray-600">Consistently rated 5 stars for our professional service.</p>
          </div>
          
          <div>
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">48h</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Turnaround</h3>
            <p className="text-gray-600">Most services completed within 48 hours of booking.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;