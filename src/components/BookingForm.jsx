import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, ChevronLeft, ChevronRight, Loader2, MapPin, Calendar, Clock, AlertTriangle, DollarSign, Sparkles, Shield, Car } from 'lucide-react';
import { vehicleData } from '../data/vehicleData';
import { useBookingFormValidation, ValidatedInput, ValidatedSelect, formatPhoneNumber } from '../hooks/useFormValidation';
import { useBookingsApi } from '../hooks/useApi';
import { useNotifications } from '../components/NotificationSystem';
import { BookingFormSkeleton } from '../components/LoadingSkeleton';
import ErrorBoundary from '../components/ErrorBoundary';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import PricingCalculator from '../components/PricingCalculator';

const BookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [smsState, setSmsState] = useState({
    bookingId: '',
    verificationCode: '',
    codeSent: false,
    attemptsRemaining: 3
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  
  // Services and add-ons
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [dynamicPricing, setDynamicPricing] = useState({ services: [], addOns: [], total: 0 });
  const [loadingServices, setLoadingServices] = useState(true);

  // NEW: Enhanced availability state
  const [businessConfig, setBusinessConfig] = useState(null);
  const [selectedDateAvailability, setSelectedDateAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  // Enhanced step configuration with icons
  const steps = [
    { number: 1, title: 'Contact & Address', icon: <MapPin className="w-4 h-4" />, description: 'Your details and service location' },
    { number: 2, title: 'Vehicle Info', icon: <Car className="w-4 h-4" />, description: 'Tell us about your vehicle' },
    { number: 3, title: 'Services', icon: <Sparkles className="w-4 h-4" />, description: 'Choose your detailing services' },
    { number: 4, title: 'Schedule', icon: <Calendar className="w-4 h-4" />, description: 'Pick your preferred date & time' },
    { number: 5, title: 'Confirm', icon: <Shield className="w-4 h-4" />, description: 'Verify and complete booking' }
  ];

  // API hooks
  const { createBooking, verifyBooking, loading: apiLoading } = useBookingsApi();
  const { success, error: notifyError } = useNotifications();

  // Enhanced form validation
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

  // Fetch business configuration
  useEffect(() => {
    const fetchBusinessConfig = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/availability/config`);
        const data = await response.json();
        
        if (data.success) {
          setBusinessConfig(data.config);
        }
      } catch (error) {
        console.error('Error fetching business config:', error);
      }
    };

    fetchBusinessConfig();
  }, []);

  // Fetch services and add-ons
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

  // Calculate dynamic pricing
  useEffect(() => {
    if (values.vehicleType && (values.services.length > 0 || values.addOns.length > 0)) {
      calculateDynamicPricing();
    }
  }, [values.services, values.addOns, values.vehicleType]);

  // NEW: Validate selected time slot when date/time changes
  useEffect(() => {
    if (values.date && values.time) {
      validateTimeSlot();
    }
  }, [values.date, values.time]);

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

  // NEW: Real-time availability validation
  const validateTimeSlot = async () => {
    if (!values.date || !values.time) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/availability/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: values.date,
            time: values.time,
            services: values.services,
            addOns: values.addOns,
            vehicleType: values.vehicleType
          })
        }
      );

      const data = await response.json();

      if (data.success && data.validation) {
        setEstimatedDuration(data.validation.estimatedDuration);
        setAvailabilityError('');
      } else {
        setAvailabilityError(data.message || 'Selected time slot is no longer available');
        handleChange('time', '');
        notifyError('Time slot is no longer available. Please select another time.');
      }
    } catch (error) {
      console.error('Error validating time slot:', error);
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

  const handleVehicleTypeChange = (vehicleType) => {
    handleChange('vehicleType', vehicleType);
    handleChange('make', '');
    handleChange('model', '');
    handleChange('year', '');
  };

  // NEW: Enhanced date selection with availability
  const handleDateSelect = (selectedDate, availability) => {
    handleChange('date', selectedDate);
    handleChange('time', ''); // Reset time when date changes
    setSelectedDateAvailability(availability);
    setAvailabilityError('');
  };

  // NEW: Enhanced time selection
  const handleTimeSelect = (selectedTime) => {
    handleChange('time', selectedTime);
    setAvailabilityError('');
  };

  const nextStep = async () => {
    // Enhanced validation before proceeding
    if (currentStep === 4 && availabilityError) {
      notifyError('Please resolve availability issues before proceeding');
      return;
    }

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
    console.log('=== BOOKING FORM: Starting SMS verification ===');
    console.log('Current form values:', JSON.stringify(values, null, 2));
    
    // Prepare the booking data - make sure phone is properly formatted
    const bookingData = {
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
      email: values.email?.trim(),
      phone: values.phone?.replace(/\D/g, ''), // Remove all non-digits
      address: values.address?.trim(),
      city: values.city?.trim(),
      postalCode: values.postalCode?.trim(),
      vehicleType: values.vehicleType,
      make: values.make,
      model: values.model,
      year: parseInt(values.year),
      services: values.services || [],
      addOns: values.addOns || [],
      date: values.date,
      time: values.time,
      specialInstructions: values.specialInstructions?.trim() || ''
    };

    console.log('📋 Processed booking data:', JSON.stringify(bookingData, null, 2));

    // Final validation check before API call
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'address', 
      'city', 'postalCode', 'vehicleType', 'make', 'model', 
      'year', 'date', 'time'
    ];

    console.log('🔍 Final validation check:');
    for (const field of requiredFields) {
      const value = bookingData[field];
      const isEmpty = value === null || value === undefined || value === '' || 
                     (Array.isArray(value) && value.length === 0);
      
      console.log(`${field}: ${isEmpty ? '❌ EMPTY' : '✅ OK'} - Value:`, value);
      
      if (isEmpty) {
        const error = `${field} is required`;
        console.error(`❌ Final validation failed: ${error}`);
        notifyError(`Please fill in the ${field} field`);
        return;
      }
    }

    // Check services array specifically
    if (!Array.isArray(bookingData.services) || bookingData.services.length === 0) {
      console.error('❌ Services validation failed:', bookingData.services);
      notifyError('Please select at least one service');
      return;
    }

    console.log('✅ All validations passed');

    // Real-time availability check before submission
    if (availabilityError) {
      console.error('❌ Availability error exists:', availabilityError);
      notifyError('Please resolve availability issues before proceeding');
      return;
    }

    console.log('📡 Calling createBooking API...');
    const result = await createBooking(bookingData);

    if (result && result.success) {
      console.log('✅ Booking initiation successful:', result);
      
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
    } else {
      console.error('❌ Unexpected API response:', result);
      notifyError('Unexpected response from server. Please try again.');
    }

  } catch (error) {
    console.error('❌ BookingForm initiateSMSVerification error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response
    });
    
    // Handle specific error types
    if (error.message && error.message.includes('Time slot unavailable')) {
      setAvailabilityError(error.message);
      notifyError('Selected time slot is no longer available. Please choose another time.');
    } else if (error.message && error.message.includes('Network error')) {
      notifyError('Network connection failed. Please check your internet connection.');
    } else if (error.message && error.message.includes('Please fill in')) {
      // Validation error already handled
      return;
    } else if (error.status === 400) {
      // Bad request - show the specific error from server
      notifyError(error.message || 'Please check your information and try again.');
    } else {
      notifyError('Failed to send verification code. Please try again.');
    }
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

  // Enhanced validation logic
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
        return values.date && values.time && !errors.date && !errors.time && !availabilityError;
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

  const getServicePrice = (service) => {
    if (!values.vehicleType || !service.pricing) return 0;
    return service.pricing[values.vehicleType] || 0;
  };

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
    setSelectedDateAvailability(null);
    setEstimatedDuration('');
    setAvailabilityError('');
  };

  if (apiLoading && currentStep === 1) {
    return <BookingFormSkeleton />;
  }

  if (loadingServices) {
    return (
      <div className="max-w-4xl mx-auto">
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
            {/* Enhanced header with step description */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-gray-600">We'll need your contact information and service location to get started.</p>
            </div>

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

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-900">Service Address</h4>
              </div>
              <p className="text-sm text-blue-800 mb-4">
                🚗 <strong>Mobile Detailing Service</strong> - We come to you! Enter the address where you'd like your vehicle detailed.
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
            {/* Enhanced header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-gray-600">Tell us about your vehicle so we can provide accurate pricing and service.</p>
            </div>

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
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {values.vehicleType === 'Sedan' && '🚗'}
                    {values.vehicleType === 'SUV' && '🚙'}
                    {values.vehicleType === 'Truck' && '🚚'}
                    {values.vehicleType === 'Coupe' && '🏎️'}
                  </div>
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Great choice!</strong> Our pricing is optimized for your {values.vehicleType.toLowerCase()}.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {values.vehicleType === 'Sedan' && 'Compact vehicles are quick and efficient to detail with our best rates.'}
                      {values.vehicleType === 'SUV' && 'SUVs have more surface area but we love the extra space to work with!'}
                      {values.vehicleType === 'Truck' && 'Trucks require extra attention but the results are always impressive.'}
                      {values.vehicleType === 'Coupe' && 'Sporty coupes get our precision detailing treatment.'}
                    </p>
                  </div>
                </div>
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

            {values.vehicleType && values.make && values.model && values.year && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Perfect! We'll detail your {values.year} {values.make} {values.model}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Services and Add-ons Selection - Left Columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Enhanced header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600">Choose the services that will make your vehicle shine!</p>
              </div>

              {/* Services Selection */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  Select Services *
                </h3>
                
                {!values.vehicleType && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                      <p className="text-blue-800 text-sm font-medium">
                        Please complete vehicle information first to see accurate pricing.
                      </p>
                    </div>
                  </div>
                )}
                
                {errors.services && (
                  <p className="text-red-600 text-sm mb-4 font-medium">{errors.services}</p>
                )}
                
                <div className="grid gap-4">
                  {services.map(service => {
                    const price = getServicePrice(service);
                    const isSelected = values.services.includes(service.id);
                    
                    return (
                      <div 
                        key={service.id} 
                        className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300 group-hover:border-blue-400'
                            }`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {service.name}
                              </h4>
                              {service.description && (
                                <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right ml-6">
                            <div className="text-2xl font-bold text-blue-600">
                              ${price > 0 ? price : '—'}
                            </div>
                            {values.vehicleType && (
                              <p className="text-xs text-gray-500 mt-1">{values.vehicleType} pricing</p>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Selected ✓
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add-ons Selection */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Optional Add-ons
                </h3>
                <p className="text-gray-600 mb-6">Enhance your service with these premium add-ons</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {addOns.map(addOn => {
                    const isSelected = values.addOns.includes(addOn.id);
                    
                    return (
                      <div 
                        key={addOn.id}
                        onClick={() => handleAddOnToggle(addOn.id)}
                        className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'border-green-500 bg-green-50 shadow-lg transform scale-[1.02]' 
                            : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{addOn.name}</h4>
                            {addOn.description && (
                              <p className="text-sm text-gray-600 leading-relaxed">{addOn.description}</p>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-lg font-bold text-green-600">+${addOn.price}</div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-green-500 text-white p-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Pricing Calculator - Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <PricingCalculator
                  vehicleType={values.vehicleType}
                  selectedServices={values.services}
                  selectedAddOns={values.addOns}
                  services={services}
                  addOns={addOns}
                  onPricingUpdate={(pricing) => setDynamicPricing(pricing)}
                  showBreakdown={true}
                  showEstimate={true}
                  className="shadow-lg"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {/* Enhanced header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-gray-600">Choose your preferred date and time for the detailing service.</p>
            </div>

            {/* Business Hours Info */}
            {businessConfig && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-semibold text-blue-900 text-lg">Business Hours & Service Information</h4>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="font-medium">Operating Hours</p>
                    <p>{businessConfig.operatingHours?.start}:00 AM - {businessConfig.operatingHours?.end}:00 PM</p>
                    <p className="text-xs text-blue-600">Every day of the week</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="font-medium">Service Duration</p>
                    <p>{businessConfig.serviceDuration} hours of detailing</p>
                    <p className="text-xs text-blue-600">Professional quality work</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="font-medium">Advance Notice</p>
                    <p>Minimum {businessConfig.minAdvanceHours} hours</p>
                    <p className="text-xs text-blue-600">For scheduling preparation</p>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Error Alert */}
            {availabilityError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Availability Issue</p>
                    <p className="text-sm text-red-700">{availabilityError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Calendar Component */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Select Date
                </h3>
                <AvailabilityCalendar
                  selectedDate={values.date}
                  onDateSelect={handleDateSelect}
                  businessConfig={businessConfig}
                  className="shadow-lg"
                />
              </div>

              {/* Time Slot Picker Component */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Select Time
                </h3>
                <TimeSlotPicker
                  selectedDate={values.date}
                  selectedTime={values.time}
                  onTimeSelect={handleTimeSelect}
                  availability={selectedDateAvailability}
                  businessConfig={businessConfig}
                  loading={loadingAvailability}
                  className="shadow-lg"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions (Optional)</h3>
              <textarea
                value={values.specialInstructions}
                onChange={(e) => handleChange('specialInstructions', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Any specific instructions for our team? Examples:
• Gate codes or building access instructions
• Parking location details
• Pet considerations
• Preferred cleaning products
• Areas that need special attention"
              />
              <p className="text-sm text-gray-500 mt-2">
                Help us provide the best service by sharing any relevant details about your location or preferences.
              </p>
            </div>

            {/* Enhanced Booking Summary */}
            {values.date && values.time && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Booking Summary
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-blue-900">Customer</p>
                      <p className="text-blue-800">{values.firstName} {values.lastName}</p>
                      <p className="text-sm text-blue-700">{values.email} • {values.phone}</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Service Location</p>
                      <p className="text-blue-800">{values.address}</p>
                      <p className="text-sm text-blue-700">{values.city}, {values.postalCode}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-blue-900">Vehicle</p>
                      <p className="text-blue-800">{values.year} {values.make} {values.model}</p>
                      <p className="text-sm text-blue-700">{values.vehicleType}</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Appointment</p>
                      <p className="text-blue-800">{new Date(values.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      <p className="text-sm text-blue-700">{values.time} • {estimatedDuration || '4 hours'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">Services & Add-ons</p>
                      <p className="text-sm text-blue-700">
                        {dynamicPricing.services?.map(s => s.name).join(', ') || 'No services selected'}
                        {dynamicPricing.addOns?.length > 0 && (
                          <span> + {dynamicPricing.addOns.map(a => a.name).join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">${getTotalPrice()}</p>
                      <p className="text-sm text-blue-700">Total price</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        if (bookingConfirmed) {
          return (
            <div className="text-center space-y-8">
              {/* Success Animation */}
              <div className="relative">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p className="text-lg text-gray-600">Your detailing appointment has been successfully scheduled</p>
              </div>

              {/* Confirmation Details */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-center mb-4">
                  <p className="text-green-800 text-lg font-bold">
                    Confirmation Code: #{bookingConfirmed.confirmationCode}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    📧 Confirmation email sent • 📱 SMS notification sent
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">What happens next?</h4>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>We'll call you 24 hours before your appointment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Our team will arrive at your specified time</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Professional detailing service at your location</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-left">
                <h4 className="font-bold text-blue-900 mb-4 text-center">📅 Appointment Details</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-blue-900">Date & Time</p>
                    <p className="text-blue-800">{new Date(bookingConfirmed.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p className="text-blue-700">{bookingConfirmed.time}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Service Location</p>
                    <p className="text-blue-800">{values.address}</p>
                    <p className="text-blue-700">{values.city}, {values.postalCode}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Vehicle</p>
                    <p className="text-blue-800">{values.year} {values.make} {values.model}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Total Investment</p>
                    <p className="text-blue-800 text-lg font-bold">${getTotalPrice()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                  onClick={startNewBooking}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Book Another Service</span>
                </button>
                <a
                  href={`/lookup`}
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium text-center"
                >
                  Track This Booking
                </a>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  Questions about your booking? Contact us at{' '}
                  <a href="tel:+15144374816" className="text-blue-600 hover:text-blue-700 font-medium">
                    (514) 437-4816
                  </a>
                  {' '}or{' '}
                  <a href="mailto:info@primedetailing.ca" className="text-blue-600 hover:text-blue-700 font-medium">
                    info@primedetailing.ca
                  </a>
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="text-center space-y-8">
            {/* SMS Verification */}
            <div>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">SMS Verification</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {smsState.codeSent ? (
                  <>We've sent a 6-digit verification code to <strong>{values.phone}</strong>. Please enter it below to confirm your booking.</>
                ) : (
                  <>We'll send a verification code to <strong>{values.phone}</strong> to secure your booking.</>
                )}
              </p>
            </div>

            {smsState.codeSent && (
              <div className="max-w-sm mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={smsState.verificationCode}
                  onChange={(e) => setSmsState(prev => ({ 
                    ...prev, 
                    verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength="6"
                  disabled={apiLoading}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-500">
                    {smsState.attemptsRemaining} attempts remaining
                  </p>
                  <p className="text-xs text-gray-500">
                    Code expires in 10 minutes
                  </p>
                </div>
              </div>
            )}

            {smsState.codeSent ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={verifySMSCode}
                  disabled={apiLoading || smsState.verificationCode.length !== 6}
                  className={`w-full max-w-sm mx-auto bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg transition-all duration-200 ${
                    (apiLoading || smsState.verificationCode.length !== 6) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-blue-700 transform hover:scale-105'
                  }`}
                >
                  {apiLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Confirm Booking</span>
                    </div>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  disabled={apiLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm underline disabled:opacity-50 transition-colors"
                >
                  Didn't receive the code? Resend SMS
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800 font-medium">
                    Ready to confirm your booking? Click the button below to receive your verification code.
                  </p>
                </div>
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
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Progress Steps with Icons */}
        <div className="flex items-center justify-between mb-12 overflow-x-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center min-w-0 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step.number <= currentStep 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                } ${step.number === currentStep ? 'ring-4 ring-blue-200' : ''}`}>
                  {currentStep > step.number || bookingConfirmed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.icon || step.number
                  )}
                </div>
                <div className={`mt-2 text-center ${
                  step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  <div className="text-sm font-medium hidden sm:block">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 hidden md:block mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 transition-colors duration-300 ${
                  step.number < currentStep || (step.number === 4 && bookingConfirmed) 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Enhanced Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              {currentStep === 1 && <><MapPin className="w-6 h-6 mr-3 text-blue-600" /> Contact & Service Address</>}
              {currentStep === 2 && <><Car className="w-6 h-6 mr-3 text-blue-600" /> Vehicle Information</>}
              {currentStep === 3 && <><Sparkles className="w-6 h-6 mr-3 text-blue-600" /> Select Services</>}
              {currentStep === 4 && <><Calendar className="w-6 h-6 mr-3 text-blue-600" /> Choose Date & Time</>}
              {currentStep === 5 && <><Shield className="w-6 h-6 mr-3 text-blue-600" /> {bookingConfirmed ? "Booking Confirmed" : "Verification"}</>}
            </h2>
            <p className="text-gray-600 mt-2">
              Step {currentStep} of 5 • {steps[currentStep - 1]?.description}
            </p>
          </div>

          {renderStep()}

          {/* Enhanced Navigation Buttons */}
          {!bookingConfirmed && (
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transform hover:scale-105'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || apiLoading}
                  className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                    canProceed() && !apiLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {apiLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {currentStep === 4 ? 'Sending...' : 'Loading...'}
                    </>
                  ) : (
                    <>
                      {currentStep === 4 ? 'Send Verification Code' : 'Continue'}
                      <ChevronRight className="w-5 h-5 ml-2" />
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