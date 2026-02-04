import React from 'react';
import { Phone, Mail, MapPin, Clock, Star } from 'lucide-react';
import ContactForm from '../components/ContactForm';

const Contact = () => {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            Get in touch with us for questions, quotes, or to schedule your service
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <ContactForm />
          
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">(514) 555-0123</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">info@primedetailing.ca</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Service Area</p>
                    <p className="text-gray-600">Montreal & Greater Montreal Area</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Hours</p>
                    <p className="text-gray-600">Monday - Saturday: 8:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Why Choose Prime Detailing?</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-blue-600 mr-2" />
                  Professional, trained technicians
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-blue-600 mr-2" />
                  Premium products and equipment
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-blue-600 mr-2" />
                  Mobile service - we come to you
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-blue-600 mr-2" />
                  Satisfaction guaranteed
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;