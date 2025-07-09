import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { vehicleData } from '../data/vehicleData';
import { useBookingFormValidation, ValidatedInput, ValidatedSelect, formatPhoneNumber } from '../hooks/useFormValidation';
import { useBookingsApi } from '../hooks/useApi';
import { useNotifications } from '../components/NotificationSystem';
import { BookingFormSkeleton } from '../components/LoadingSkeleton';
import ErrorBoundary from '../components/ErrorBoundary';

const BookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [smsState, setSmsState] = useState({
    bookingId: '',
    verificationCode: '',
    codeSent: false,
    attemptsRemaining: 3
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  
  // NEW: Dynamic services and add-ons from database
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [dynamicPricing, setDynamicPricing] = useState({ services: [], addOns: [], total: 0 });
  const [loadingServices, setLoadingServices] = useState(true);

  // Step configuration for progress bar
  const steps = [
    { number: 1, title: 'Contact & Address' },
    { number: 2, title: 'Vehicle Info' },
    { number: 3, title: 'Services' },
    { number: 4, title: 'Schedule' },
    { number: 5, title: 'Confirm' }
  ];

  // API hooks
  const { createBooking, verifyBooking, loading: apiLoading } = useBookingsApi();
  const { success, error: notifyError } = useNotifications();

  // Enhanced form validation with address fields
  const {
    values,
    errors,
    isValid,
    isSubmitting,
    handleChange,
    handleSubmit,
    getFieldProps,
    reset
  } = useBookingFormValidation({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    vehicleType: '',
    make: '',
    model: '',
    year: '',
    services: [],
    addOns: [],
    date: '',
    time: '',
    specialInstructions: ''
  });

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  // NEW: Fetch services and add-ons on component mount
  useEffect(() => {
    const fetchServicesAndAddOns = async () => {
      setLoadingServices(true);
      try {
        const [servicesResponse, addOnsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/services/active`),
          fetch(`${import.meta.env.VITE_API_URL}/services/addons/active`)
        ]);

        const servicesData = await servicesResponse.json();
        const addOnsData = await addOnsResponse.json();

        if (servicesData.success) {
          setServices(servicesData.services);
        }

        if (addOnsData.success) {
          setAddOns(addOnsData.addOns);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        notifyError('Failed to load services. Please refresh the page.');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServicesAndAddOns();
  }, []);

  // NEW: Calculate dynamic pricing when services, add-ons, or vehicle type changes
  useEffect(() => {
    if (values.vehicleType && (values.services.length > 0 || values.addOns.length > 0)) {
      calculateDynamicPricing();
    }
  }, [values.services, values.addOns, values.vehicleType]);

  const calculateDynamicPricing = async () => {
    if (!values.vehicleType) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/calculate-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: values.services,
          addOns: values.addOns,
          vehicleType: values.vehicleType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setDynamicPricing(data.pricing);
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  // Enhanced input handlers
  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    handleChange('phone', formatted);
  };

  const handleServiceToggle = (serviceId) => {
    const newServices = values.services.includes(serviceId)
      ? values.services.filter(id => id !== serviceId)
      : [...values.services, serviceId];
    handleChange('services', newServices);
  };

  const handleAddOnToggle = (addOnId) => {
    const newAddOns = values.addOns.includes(addOnId)
      ? values.addOns.filter(id => id !== addOnId)
      : [...values.addOns, addOnId];
    handleChange('addOns', newAddOns);
  };

  // NEW: Handle vehicle type change and recalculate pricing
  const handleVehicleTypeChange = (vehicleType) => {
    handleChange('vehicleType', vehicleType);
    handleChange('make', '');
    handleChange('model', '');
    handleChange('year', '');
    
    // Recalculate pricing for new vehicle type
    if (values.services.length > 0 || values.addOns.length > 0) {
      setTimeout(() => calculateDynamicPricing(), 100);
    }
  };

  const nextStep = async () => {
    if (currentStep === 4) {
      await initiateSMSVerification();
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const initiateSMSVerification = async () => {
    try {
      const result = await createBooking({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone.replace(/\D/g, ''),
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        vehicleType: values.vehicleType,
        make: values.make,
        model: values.model,
        year: parseInt(values.year),
        services: values.services,
        addOns: values.addOns,
        date: values.date,
        time: values.time,
        specialInstructions: values.specialInstructions
      });

      if (result.success) {
        setSmsState(prev => ({
          ...prev,
          bookingId: result.bookingId,
          codeSent: true,
          attemptsRemaining: 3
        }));
        setCurrentStep(5);
        
        if (result.developmentMode && result.verificationCode) {
          success(`Development Mode: Your verification code is ${result.verificationCode}`);
        } else {
          success('Verification code sent to your phone!');
        }
      }
    } catch (error) {
      notifyError('Failed to send verification code. Please try again.');
    }
  };

  const verifySMSCode = async () => {
    if (!smsState.verificationCode || smsState.verificationCode.length !== 6) {
      notifyError('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      const result = await verifyBooking({
        bookingId: smsState.bookingId,
        verificationCode: smsState.verificationCode
      });

      if (result.success) {
        setBookingConfirmed(result.booking);
      } else {
        if (result.error.includes('attempts remaining')) {
          const match = result.error.match(/(\d+) attempts remaining/);
          if (match) {
            setSmsState(prev => ({
              ...prev,
              attemptsRemaining: parseInt(match[1])
            }));
          }
        }
        setSmsState(prev => ({ ...prev, verificationCode: '' }));
      }
    } catch (error) {
      setSmsState(prev => ({ ...prev, verificationCode: '' }));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return values.firstName && values.lastName && values.email && values.phone && 
               values.address && values.city && values.postalCode &&
               !errors.firstName && !errors.lastName && !errors.email && !errors.phone;
      case 2:
        return values.vehicleType && values.make && values.model && values.year && 
               !errors.year;
      case 3:
        return values.services.length > 0;
      case 4:
        return values.date && values.time && !errors.date && !errors.time;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getAvailableMakes = () => {
    return values.vehicleType ? Object.keys(vehicleData[values.vehicleType] || {}) : [];
  };

  const getAvailableModels = () => {
    return values.vehicleType && values.make 
      ? Object.keys(vehicleData[values.vehicleType][values.make] || {}) 
      : [];
  };

  const getAvailableYears = () => {
    return values.vehicleType && values.make && values.model
      ? vehicleData[values.vehicleType][values.make][values.model] || []
      : [];
  };

  // NEW: Get service price for current vehicle type
  const getServicePrice = (service) => {
    if (!values.vehicleType || !service.pricing) return 0;
    return service.pricing[values.vehicleType] || 0;
  };

  // NEW: Updated total price calculation using dynamic pricing
  const getTotalPrice = () => {
    return dynamicPricing.total || 0;
  };

  const resendVerificationCode = async () => {
    setSmsState(prev => ({
      ...prev,
      verificationCode: '',
      attemptsRemaining: 3
    }));
    await initiateSMSVerification();
  };

  const startNewBooking = () => {
    reset();
    setCurrentStep(1);
    setSmsState({
      bookingId: '',
      verificationCode: '',
      codeSent: false,
      attemptsRemaining: 3
    });
    setBookingConfirmed(null);
    setDynamicPricing({ services: [], addOns: [], total: 0 });
  };

  if (apiLoading && currentStep === 1) {
    return <BookingFormSkeleton />;
  }

  if (loadingServices) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading available services...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ValidatedInput
                label="First Name"
                required
                {...getFieldProps('firstName')}
              />
              <ValidatedInput
                label="Last Name"
                required
                {...getFieldProps('lastName')}
              />
            </div>

            <ValidatedInput
              label="Email Address"
              required
              type="email"
              placeholder="your@email.com"
              {...getFieldProps('email')}
            />

            <ValidatedInput
              label="Phone Number"
              required
              type="tel"
              placeholder="(514) 555-0123"
              value={values.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => {}}
              error={errors.phone}
              hasError={!!errors.phone}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-900">Service Address</h4>
              </div>
              <p className="text-sm text-blue-800 mb-4">
                Where should our team come to detail your vehicle? We service the Greater Montreal area.
              </p>
              
              <div className="space-y-4">
                <ValidatedInput
                  label="Street Address"
                  required
                  placeholder="123 Main Street, Apt 4B"
                  {...getFieldProps('address')}
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <ValidatedInput
                    label="City"
                    required
                    placeholder="Montreal"
                    {...getFieldProps('city')}
                  />
                  <ValidatedInput
                    label="Postal Code"
                    required
                    placeholder="H1A 1A1"
                    {...getFieldProps('postalCode')}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <ValidatedSelect
              label="Vehicle Type"
              required
              placeholder="Select vehicle type"
              options={Object.keys(vehicleData)}
              value={values.vehicleType}
              onChange={(e) => handleVehicleTypeChange(e.target.value)}
              error={errors.vehicleType}
              hasError={!!errors.vehicleType}
            />

            {values.vehicleType && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Good to know:</strong> Our pricing is tailored to your vehicle type. 
                  {values.vehicleType === 'Sedan' && ' Sedans typically require less time and materials.'}
                  {values.vehicleType === 'SUV' && ' SUVs have more surface area and may take additional time.'}
                  {values.vehicleType === 'Truck' && ' Trucks require more time and materials due to their size.'}
                  {values.vehicleType === 'Coupe' && ' Coupes are compact and efficient to detail.'}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <ValidatedSelect
                label="Make"
                required
                placeholder="Select make"
                options={getAvailableMakes()}
                disabled={!values.vehicleType}
                {...getFieldProps('make')}
                onChange={(e) => {
                  handleChange('make', e.target.value);
                  handleChange('model', '');
                  handleChange('year', '');
                }}
              />

              <ValidatedSelect
                label="Model"
                required
                placeholder="Select model"
                options={getAvailableModels()}
                disabled={!values.make}
                {...getFieldProps('model')}
                onChange={(e) => {
                  handleChange('model', e.target.value);
                  handleChange('year', '');
                }}
              />

              <ValidatedSelect
                label="Year"
                required
                placeholder="Select year"
                options={getAvailableYears()}
                disabled={!values.model}
                {...getFieldProps('year')}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Services *</h3>
              {!values.vehicleType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    💡 Please select your vehicle type in the previous step to see accurate pricing.
                  </p>
                </div>
              )}
              {errors.services && (
                <p className="text-red-600 text-sm mb-4">{errors.services}</p>
              )}
              <div className="space-y-3">
                {services.map(service => {
                  const price = getServicePrice(service);
                  return (
                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          id={service.id}
                          checked={values.services.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor={service.id} className="text-sm font-medium text-gray-700 cursor-pointer block">
                            {service.name}
                          </label>
                          {service.description && (
                            <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-sm font-semibold text-blue-600">
                          ${price > 0 ? price : '—'}
                        </span>
                        {values.vehicleType && (
                          <p className="text-xs text-gray-500">{values.vehicleType}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional Add-ons</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {addOns.map(addOn => (
                  <div 
                    key={addOn.id} 
                    onClick={() => handleAddOnToggle(addOn.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      values.addOns.includes(addOn.id) 
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 block">{addOn.name}</span>
                        {addOn.description && (
                          <p className="text-xs text-gray-500 mt-1">{addOn.description}</p>
                        )}
                      </div>
                      <span className="font-semibold text-blue-600 ml-3">+${addOn.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced pricing display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              {values.vehicleType && (values.services.length > 0 || values.addOns.length > 0) ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Services subtotal:</span>
                    <span>${dynamicPricing.services?.reduce((sum, s) => sum + s.price, 0) || 0}</span>
                  </div>
                  {dynamicPricing.addOns?.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Add-ons subtotal:</span>
                      <span>${dynamicPricing.addOns.reduce((sum, a) => sum + a.price, 0)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">${getTotalPrice()}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {values.vehicleType ? '$0' : 'Select vehicle type first'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <ValidatedInput
              label="Select Date"
              required
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...getFieldProps('date')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time *
              </label>
              {errors.time && (
                <p className="text-red-600 text-sm mb-2">{errors.time}</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleChange('time', time)}
                    className={`p-3 text-sm font-medium rounded-md border transition-colors ${
                      values.time === time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={values.specialInstructions}
                onChange={(e) => handleChange('specialInstructions', e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Any specific instructions for our team? (e.g., gate code, parking instructions, pet considerations)"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><span className="font-medium">Customer:</span> {values.firstName} {values.lastName}</p>
                <p><span className="font-medium">Email:</span> {values.email}</p>
                <p><span className="font-medium">Phone:</span> {values.phone}</p>
                <p><span className="font-medium">Address:</span> {values.address}, {values.city} {values.postalCode}</p>
                <p><span className="font-medium">Vehicle:</span> {values.year} {values.make} {values.model} ({values.vehicleType})</p>
                <p><span className="font-medium">Services:</span> {dynamicPricing.services?.map(s => s.name).join(', ') || 'None selected'}</p>
                {dynamicPricing.addOns?.length > 0 && (
                  <p><span className="font-medium">Add-ons:</span> {dynamicPricing.addOns.map(a => a.name).join(', ')}</p>
                )}
                <p><span className="font-medium">Date & Time:</span> {values.date} at {values.time}</p>
                <p><span className="font-medium">Total:</span> ${getTotalPrice()}</p>
              </div>
            </div>
          </div>
        );

      case 5:
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
                  We've sent you a confirmation email and SMS. Our team will contact you 24 hours before your appointment.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Appointment Details</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Date:</span> {new Date(bookingConfirmed.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Time:</span> {bookingConfirmed.time}</p>
                  <p><span className="font-medium">Address:</span> {values.address}, {values.city}</p>
                  <p><span className="font-medium">Total:</span> ${getTotalPrice()}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={startNewBooking}
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
                <>Enter the 6-digit verification code sent to <strong>{values.phone}</strong></>
              ) : (
                <>We'll send a verification code to <strong>{values.phone}</strong> to confirm your booking.</>
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
                  onChange={(e) => setSmsState(prev => ({ 
                    ...prev, 
                    verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="input-field text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  disabled={apiLoading}
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
                  disabled={apiLoading || smsState.verificationCode.length !== 6}
                  className={`btn-primary w-full ${
                    (apiLoading || smsState.verificationCode.length !== 6) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {apiLoading ? (
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
                  disabled={apiLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm underline disabled:opacity-50"
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
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto">
        {/* Enhanced Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.number <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.number || bookingConfirmed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className={`ml-2 text-sm font-medium ${
                  step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'
                } hidden sm:block`}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-colors ${
                  step.number < currentStep || (step.number === 4 && bookingConfirmed) 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStep === 1 && "Contact & Service Address"}
              {currentStep === 2 && "Vehicle Information"}
              {currentStep === 3 && "Select Services"}
              {currentStep === 4 && "Choose Date & Time"}
              {currentStep === 5 && (bookingConfirmed ? "Booking Confirmed" : "Verification")}
            </h2>
            <p className="text-gray-600 mt-1">
              Step {currentStep} of 5
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
                className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || apiLoading}
                  className={`flex items-center px-6 py-2 rounded-md font-medium transition-colors ${
                    canProceed() && !apiLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {apiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {currentStep === 4 ? 'Sending...' : 'Loading...'}
                    </>
                  ) : (
                    <>
                      {currentStep === 4 ? 'Send Verification Code' : 'Next'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BookingForm;