// src/hooks/useFormValidation.js
import { useState, useMemo } from 'react';

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'Please select at least one option';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },

  phone: (value) => {
    if (!value) return null;
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length >= min ? null : `Must be at least ${min} characters`;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length <= max ? null : `Must be no more than ${max} characters`;
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  custom: (validator) => (value) => {
    return validator(value);
  },

  // Booking-specific validations
  futureDate: (value) => {
    if (!value) return null;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate >= today ? null : 'Please select a future date';
  },

  businessHours: (value) => {
    if (!value) return null;
    const [hours] = value.split(':').map(Number);
    return (hours >= 8 && hours <= 17) ? null : 'Please select a time during business hours (8 AM - 5 PM)';
  },

  vehicleYear: (value) => {
    if (!value) return null;
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    const minYear = 1990;
    
    if (year < minYear || year > currentYear + 1) {
      return `Vehicle year must be between ${minYear} and ${currentYear + 1}`;
    }
    return null;
  }
};

// Field configuration for different forms
export const formConfigs = {
  booking: {
    firstName: [validationRules.required, validationRules.minLength(2)],
    lastName: [validationRules.required, validationRules.minLength(2)],
    phone: [validationRules.required, validationRules.phone],
    vehicleType: [validationRules.required],
    make: [validationRules.required],
    model: [validationRules.required],
    year: [validationRules.required, validationRules.vehicleYear],
    services: [validationRules.required],
    date: [validationRules.required, validationRules.futureDate],
    time: [validationRules.required, validationRules.businessHours]
  },

  contact: {
    name: [validationRules.required, validationRules.minLength(2)],
    email: [validationRules.required, validationRules.email],
    phone: [validationRules.phone],
    message: [validationRules.required, validationRules.minLength(10)]
  },

  detailerLogin: {
    email: [validationRules.required, validationRules.email],
    password: [validationRules.required, validationRules.minLength(6)]
  }
};

// Main validation hook
export const useFormValidation = (initialValues = {}, config = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = (name, value) => {
    const fieldRules = config[name] || [];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(config).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle field change
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Validate on change if field was previously touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(config).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    try {
      const isValid = validateForm();
      
      if (isValid && onSubmit) {
        await onSubmit(values);
      }
      
      return isValid;
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const reset = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  // Set field error manually (useful for server-side errors)
  const setFieldError = (name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Check if form has errors
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error !== null && error !== undefined);
  }, [errors]);

  // Check if form is valid (no errors and all required fields have values)
  const isValid = useMemo(() => {
    return !hasErrors && Object.keys(config).every(fieldName => {
      const fieldRules = config[fieldName] || [];
      const hasRequiredRule = fieldRules.some(rule => rule === validationRules.required);
      const value = values[fieldName];
      
      if (hasRequiredRule) {
        return value !== null && value !== undefined && value !== '' && 
               (!Array.isArray(value) || value.length > 0);
      }
      return true;
    });
  }, [values, errors, config, hasErrors]);

  // Get field props for easy integration with components
  const getFieldProps = (name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => {
      const value = e.target ? e.target.value : e;
      handleChange(name, value);
    },
    onBlur: () => handleBlur(name),
    error: touched[name] ? errors[name] : null,
    hasError: touched[name] && !!errors[name]
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    hasErrors,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    validateField,
    reset,
    setFieldError,
    getFieldProps
  };
};

// Enhanced hook for specific forms
export const useBookingFormValidation = (initialValues) => {
  return useFormValidation(initialValues, formConfigs.booking);
};

export const useContactFormValidation = (initialValues) => {
  return useFormValidation(initialValues, formConfigs.contact);
};

export const useDetailerLoginValidation = (initialValues) => {
  return useFormValidation(initialValues, formConfigs.detailerLogin);
};

// Utility function to format phone numbers
export const formatPhoneNumber = (value) => {
  if (!value) return value;
  
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

// Validation error display component
export const ValidationError = ({ error, className = "" }) => {
  if (!error) return null;
  
  return (
    <div className={`text-red-600 text-sm mt-1 ${className}`}>
      {error}
    </div>
  );
};

// Enhanced input component with validation
export const ValidatedInput = ({ 
  label, 
  required = false, 
  type = "text",
  className = "",
  ...fieldProps 
}) => {
  const { hasError, error, ...inputProps } = fieldProps;
  
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        {...inputProps}
        className={`input-field ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      <ValidationError error={error} />
    </div>
  );
};

// Enhanced select component with validation
export const ValidatedSelect = ({ 
  label, 
  required = false, 
  options = [], 
  placeholder = "Select an option",
  className = "",
  ...fieldProps 
}) => {
  const { hasError, error, ...selectProps } = fieldProps;
  
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        {...selectProps}
        className={`input-field ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      <ValidationError error={error} />
    </div>
  );
};

export default useFormValidation;