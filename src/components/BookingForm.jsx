import React, { useState } from 'react';
import { Phone, CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { vehicleData } from '../data/vehicleData';

const BookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    vehicleType: '',
    make: '',
    model: '',
    year: '',
    services: [],
    addOns: [],
    date: '',
    time: '',
    smsVerified: false
  });

  // SMS verification specific state
  const [smsState, setSmsState] = useState({
    bookingId: '',
    verificationCode: '',
    codeSent: false,
    attemptsRemaining: 3
  });

  // Booking confirmation state
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  const services = [
    { id: 'exterior', name: 'Exterior Detailing', price: 89 },
    { id: 'interior', name: 'Interior Detailing', price: 119 },
    { id: 'paint-protection', name: 'Paint Protection', price: 299 },
    { id: 'express', name: 'Express Detail', price: 49 }
  ];

  const addOns = [
    { id: 'engine-bay', name: 'Engine Bay Cleaning', price: 59 },
    { id: 'headlight-restoration', name: 'Headlight Restoration', price: 79 },
    { id: 'tire-shine', name: 'Tire Shine & Dressing', price: 29 },
    { id: 'odor-elimination', name: 'Odor Elimination', price: 49 }
  ];

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  // Vite uses import.meta.env instead of process.env
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleAddOnToggle = (addOnId) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.includes(addOnId)
        ? prev.addOns.filter(id => id !== addOnId)
        : [...prev.addOns, addOnId]
    }));
  };

  const nextStep = async () => {
    if (currentStep === 3) {
      // Initiate SMS verification
      await initiateSMSVerification();
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setSuccess('');
    }
  };

  const initiateSMSVerification = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          vehicleType: formData.vehicleType,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          services: formData.services,
          addOns: formData.addOns,
          date: formData.date,
          time: formData.time
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSmsState(prev => ({
          ...prev,
          bookingId: data.bookingId,
          codeSent: true,
          attemptsRemaining: 3
        }));
        setCurrentStep(4);
        
        // Show development code if in development mode
        if (data.developmentMode && data.verificationCode) {
          setSuccess(`Development Mode: Your verification code is ${data.verificationCode}`);
        } else {
          setSuccess('Verification code sent to your phone!');
        }
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('Error initiating SMS verification:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySMSCode = async () => {
    if (!smsState.verificationCode || smsState.verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: smsState.bookingId,
          verificationCode: smsState.verificationCode
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingConfirmed(data.booking);
        setSuccess('Booking confirmed successfully!');
        setFormData(prev => ({ ...prev, smsVerified: true }));
      } else {
        setError(data.error || 'Invalid verification code');
        
        // Update attempts remaining if provided
        if (data.error.includes('attempts remaining')) {
          const match = data.error.match(/(\d+) attempts remaining/);
          if (match) {
            setSmsState(prev => ({
              ...prev,
              attemptsRemaining: parseInt(match[1])
            }));
          }
        }
        
        // Clear the verification code input
        setSmsState(prev => ({
          ...prev,
          verificationCode: ''
        }));
      }
    } catch (err) {
      console.error('Error verifying SMS code:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.phone && 
               formData.vehicleType && formData.make && formData.model && formData.year;
      case 2:
        return formData.services.length > 0;
      case 3:
        return formData.date && formData.time;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getAvailableMakes = () => {
    return formData.vehicleType ? Object.keys(vehicleData[formData.vehicleType] || {}) : [];
  };

  const getAvailableModels = () => {
    return formData.vehicleType && formData.make 
      ? Object.keys(vehicleData[formData.vehicleType][formData.make] || {}) 
      : [];
  };

  const getAvailableYears = () => {
    return formData.vehicleType && formData.make && formData.model
      ? vehicleData[formData.vehicleType][formData.make][formData.model] || []
      : [];
  };

  const getTotalPrice = () => {
    const serviceTotal = formData.services.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service ? service.price : 0);
    }, 0);

    const addOnTotal = formData.addOns.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price : 0);
    }, 0);

    return serviceTotal + addOnTotal;
  };

  const resendVerificationCode = async () => {
    setSmsState(prev => ({
      ...prev,
      verificationCode: '',
      attemptsRemaining: 3
    }));
    setError('');
    await initiateSMSVerification();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="input-field"
                placeholder="(514) 555-0123"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type *
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => {
                  handleInputChange('vehicleType', e.target.value);
                  handleInputChange('make', '');
                  handleInputChange('model', '');
                  handleInputChange('year', '');
                }}
                className="input-field"
                required
              >
                <option value="">Select vehicle type</option>
                {Object.keys(vehicleData).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <select
                  value={formData.make}
                  onChange={(e) => {
                    handleInputChange('make', e.target.value);
                    handleInputChange('model', '');
                    handleInputChange('year', '');
                  }}
                  className="input-field"
                  required
                  disabled={!formData.vehicleType}
                >
                  <option value="">Select make</option>
                  {getAvailableMakes().map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => {
                    handleInputChange('model', e.target.value);
                    handleInputChange('year', '');
                  }}
                  className="input-field"
                  required
                  disabled={!formData.make}
                >
                  <option value="">Select model</option>
                  {getAvailableModels().map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="input-field"
                  required
                  disabled={!formData.model}
                >
                  <option value="">Select year</option>
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Services</h3>
              <div className="space-y-3">
                {services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={service.id}
                        checked={formData.services.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={service.id} className="ml-3 text-sm font-medium text-gray-700">
                        {service.name}
                      </label>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      ${service.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional Add-ons</h3>
              <div className="space-y-3">
                {addOns.map(addOn => (
                  <div key={addOn.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={addOn.id}
                        checked={formData.addOns.includes(addOn.id)}
                        onChange={() => handleAddOnToggle(addOn.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={addOn.id} className="ml-3 text-sm font-medium text-gray-700">
                        {addOn.name}
                      </label>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      +${addOn.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-blue-600">${getTotalPrice()}</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleInputChange('time', time)}
                    className={`p-3 text-sm font-medium rounded-md border transition-colors ${
                      formData.time === time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><span className="font-medium">Customer:</span> {formData.firstName} {formData.lastName}</p>
                <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                <p><span className="font-medium">Vehicle:</span> {formData.year} {formData.make} {formData.model}</p>
                <p><span className="font-medium">Services:</span> {formData.services.map(id => services.find(s => s.id === id)?.name).join(', ')}</p>
                {formData.addOns.length > 0 && (
                  <p><span className="font-medium">Add-ons:</span> {formData.addOns.map(id => addOns.find(a => a.id === id)?.name).join(', ')}</p>
                )}
                <p><span className="font-medium">Date & Time:</span> {formData.date} at {formData.time}</p>
                <p><span className="font-medium">Total:</span> ${getTotalPrice()}</p>
              </div>
            </div>
          </div>
        );

      case 4:
        if (bookingConfirmed) {
          return (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Booking Confirmed!</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 mb-2">
                  <strong>Confirmation Code:</strong> #{bookingConfirmed.confirmationCode}
                </p>
                <p className="text-sm text-green-700">
                  We've sent you a confirmation SMS. Save your confirmation code for reference.
                  We'll contact you 24 hours before your appointment.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Appointment Details</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Date:</span> {new Date(bookingConfirmed.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Time:</span> {bookingConfirmed.time}</p>
                  <p><span className="font-medium">Services:</span> {bookingConfirmed.services.map(id => services.find(s => s.id === id)?.name).join(', ')}</p>
                  {bookingConfirmed.extras.length > 0 && (
                    <p><span className="font-medium">Add-ons:</span> {bookingConfirmed.extras.map(id => addOns.find(a => a.id === id)?.name).join(', ')}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  // Reset form for new booking
                  setCurrentStep(1);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    vehicleType: '',
                    make: '',
                    model: '',
                    year: '',
                    services: [],
                    addOns: [],
                    date: '',
                    time: '',
                    smsVerified: false
                  });
                  setSmsState({
                    bookingId: '',
                    verificationCode: '',
                    codeSent: false,
                    attemptsRemaining: 3
                  });
                  setBookingConfirmed(null);
                  setError('');
                  setSuccess('');
                }}
              >
                Book Another Service
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">SMS Verification</h3>
            <p className="text-gray-600">
              {smsState.codeSent ? (
                <>Enter the 6-digit verification code sent to <strong>{formData.phone}</strong></>
              ) : (
                <>We'll send a verification code to <strong>{formData.phone}</strong> to confirm your booking.</>
              )}
            </p>

            {smsState.codeSent && (
              <div className="max-w-sm mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={smsState.verificationCode}
                  onChange={(e) => setSmsState(prev => ({ ...prev, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  className="input-field text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {smsState.attemptsRemaining} attempts remaining
                </p>
              </div>
            )}

            {smsState.codeSent ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={verifySMSCode}
                  disabled={isLoading || smsState.verificationCode.length !== 6}
                  className={`btn-primary w-full ${
                    (isLoading || smsState.verificationCode.length !== 6) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Click "Send Verification Code" to receive your SMS verification code.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step < currentStep || (step === 4 && bookingConfirmed) ? <CheckCircle className="w-5 h-5" /> : step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 mx-2 ${
                step < currentStep || (step === 3 && bookingConfirmed) ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentStep === 1 && "Personal & Vehicle Information"}
            {currentStep === 2 && "Select Services"}
            {currentStep === 3 && "Choose Date & Time"}
            {currentStep === 4 && (bookingConfirmed ? "Booking Confirmed" : "Verification")}
          </h2>
          <p className="text-gray-600 mt-1">
            Step {currentStep} of 4
          </p>
        </div>

        {renderStep()}

        {/* Navigation Buttons */}
        {!bookingConfirmed && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || isLoading}
                className={`flex items-center px-6 py-2 rounded-md font-medium ${
                  canProceed() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    {currentStep === 3 ? 'Sending...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    {currentStep === 3 ? 'Send Verification Code' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;