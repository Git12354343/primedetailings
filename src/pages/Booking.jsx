import React from 'react';
import BookingForm from '../components/BookingForm';

const Booking = () => {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Your Service</h1>
          <p className="text-xl text-gray-600">
            Schedule your car detailing appointment in just a few easy steps
          </p>
        </div>
        <BookingForm />
      </div>
    </div>
  );
};

export default Booking;