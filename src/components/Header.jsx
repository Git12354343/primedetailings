import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Car, Search } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600';
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Prime Detailing</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={`py-2 px-1 border-b-2 border-transparent font-medium text-sm transition-colors ${isActive('/')}`}>
              Home
            </Link>
            <Link to="/services" className={`py-2 px-1 border-b-2 border-transparent font-medium text-sm transition-colors ${isActive('/services')}`}>
              Services
            </Link>
            <Link to="/gallery" className={`py-2 px-1 border-b-2 border-transparent font-medium text-sm transition-colors ${isActive('/gallery')}`}>
              Gallery
            </Link>
            <Link to="/booking" className={`py-2 px-1 border-b-2 border-transparent font-medium text-sm transition-colors ${isActive('/booking')}`}>
              Book Now
            </Link>
            <Link to="/contact" className={`py-2 px-1 border-b-2 border-transparent font-medium text-sm transition-colors ${isActive('/contact')}`}>
              Contact
            </Link>
          </nav>

          {/* Track Booking Button (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/lookup"
              className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
              title="Track your booking"
            >
              <Search className="w-4 h-4 mr-1" />
              Track Booking
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/services"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/gallery"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link
                to="/booking"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Book Now
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {/* Track Booking for Mobile */}
              <div className="border-t pt-2 mt-2">
                <Link
                  to="/lookup"
                  className="flex items-center px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Track Your Booking
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;