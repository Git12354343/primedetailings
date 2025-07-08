// src/components/Footer.jsx (Updated with Detailer Section)
import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, Clock, Users } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <Car className="w-8 h-8 text-blue-400 mr-2" />
              <h3 className="text-xl font-bold">Prime Detailing</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Professional car detailing services in Montreal. We bring the shine back to your vehicle with premium products and expert care.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C3.897 14.965 3.29 13.372 3.29 11.987c0-1.297.49-2.448 1.297-3.323.827-.827 1.92-1.297 3.323-1.297 1.297 0 2.448.49 3.323 1.297.827.827 1.297 1.92 1.297 3.323 0 1.297-.49 2.448-1.297 3.323-.827.827-1.92 1.297-3.323 1.297z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Exterior Detailing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Interior Detailing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Paint Protection</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Ceramic Coating</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Mobile Service</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-blue-400" />
                <span>(514) 437-4816</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-blue-400" />
                <span>info@primedetailing.ca</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                <span>Montreal, Quebec</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-400" />
                <div>
                  <div>Mon-Fri: 8AM-6PM</div>
                  <div>Sat-Sun: 9AM-5PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailer Section - NEW */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Book Appointment</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Our Services</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
            </ul>
            
            {/* Detailer Access */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center mb-2">
                <Users className="w-4 h-4 text-blue-400 mr-2" />
                <h5 className="font-medium text-blue-400">Are you a detailer?</h5>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Access your dashboard to manage appointments and view assigned jobs.
              </p>
              <Link
                to="/detailer-login"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors w-full text-center"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Prime Detailing Montreal. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">FAQ</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;