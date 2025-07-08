import React, { useState } from 'react';
import { Menu, X, Car, Phone, MapPin } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                <span>(514) 437-4816</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>Montreal, QC</span>
              </div>
            </div>
            <div className="hidden md:block">
              <span>Premium Mobile Detailing Services</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-full">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prime Detailing</h1>
              <p className="text-xs text-gray-500">Mobile Car Care</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="/services" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Services
            </a>
            <a href="/booking" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Book Now
            </a>
            <a href="/contact" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </a>
            <a
              href="/booking"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Quote
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <a href="/" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </a>
              <a href="/services" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Services
              </a>
              <a href="/booking" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Book Now
              </a>
              <a href="/contact" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Contact
              </a>
              <a
                href="/booking"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Get Quote
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;