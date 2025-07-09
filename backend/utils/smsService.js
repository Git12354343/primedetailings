// utils/smsService.js - Twilio Only
const twilio = require('twilio');

// Twilio SMS Service
class TwilioSMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.init();
  }

  // Initialize Twilio client
  init() {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('Twilio credentials not found in environment variables');
      }

      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
      this.isConfigured = true;
      
      console.log('✅ Twilio SMS service configured successfully');
      console.log(`📱 Sending from: ${this.fromNumber}`);
      
    } catch (error) {
      console.error('❌ Twilio service initialization failed:', error.message);
      console.log('💡 Make sure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set in your .env file');
    }
  }

  // Send SMS
  async sendSMS(phoneNumber, message) {
    if (!this.isConfigured) {
      console.error('❌ Twilio not configured - cannot send SMS');
      return false;
    }

    // Validate phone number
    if (!this.isValidPhoneNumber(phoneNumber)) {
      console.error('❌ Invalid phone number format:', phoneNumber);
      return false;
    }

    // Truncate message if too long (Twilio limit is 1600 characters, but we'll keep it shorter)
    const maxLength = 160;
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 3) + '...';
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: this.formatPhoneNumber(phoneNumber)
      });

      console.log(`✅ SMS sent to ${phoneNumber}. SID: ${result.sid}`);
      return true;
      
    } catch (error) {
      console.error('❌ Twilio SMS error:', error.message);
      
      // Handle common Twilio errors
      if (error.code === 21211) {
        console.error('❌ Invalid phone number format');
      } else if (error.code === 21408) {
        console.error('❌ Permission denied for this phone number');
      } else if (error.code === 21610) {
        console.error('❌ Message blocked - likely unsubscribed number');
      }
      
      return false;
    }
  }

  // Send booking confirmation SMS
  async sendBookingConfirmation(booking) {
    const businessName = process.env.BUSINESS_NAME || 'Prime Detailing';
    const businessPhone = process.env.BUSINESS_PHONE || '(514) 437-4816';
    
    const message = `✅ ${businessName}: Booking confirmed! 
Code: ${booking.confirmationCode}
${booking.firstName}, your ${booking.vehicleType} is scheduled for ${new Date(booking.date).toLocaleDateString()} at ${booking.time}.
Questions? ${businessPhone}`;
    
    return await this.sendSMS(booking.phoneNumber, message);
  }

  // Send booking status update SMS
  async sendBookingUpdate(booking, status) {
    const businessName = process.env.BUSINESS_NAME || 'Prime Detailing';
    const businessPhone = process.env.BUSINESS_PHONE || '(514) 437-4816';
    
    const statusMessages = {
      confirmed: '✅ Confirmed & Assigned',
      in_progress: '🔄 Service Started', 
      completed: '🎉 Service Complete',
      canceled: '❌ Canceled'
    };

    const statusText = statusMessages[status] || '📋 Status Updated';
    
    const message = `${statusText}: ${businessName}
Booking ${booking.confirmationCode} - ${booking.firstName}, your ${booking.vehicleType} detailing is now ${status.replace('_', ' ')}.
Questions? ${businessPhone}`;
    
    return await this.sendSMS(booking.phoneNumber, message);
  }

  // Send booking reminder SMS
  async sendBookingReminder(booking) {
    const businessName = process.env.BUSINESS_NAME || 'Prime Detailing';
    const businessPhone = process.env.BUSINESS_PHONE || '(514) 437-4816';
    
    const message = `⏰ ${businessName} Reminder: 
${booking.firstName}, your ${booking.vehicleType} detailing is TOMORROW ${new Date(booking.date).toLocaleDateString()} at ${booking.time}.
Code: ${booking.confirmationCode}
Remove personal items! Questions? ${businessPhone}`;
    
    return await this.sendSMS(booking.phoneNumber, message);
  }

  // Send detailer assignment notification
  async sendDetailerAssignment(booking, detailerName) {
    const businessName = process.env.BUSINESS_NAME || 'Prime Detailing';
    const businessPhone = process.env.BUSINESS_PHONE || '(514) 437-4816';
    
    const message = `👨‍🔧 ${businessName}: Great news ${booking.firstName}! 
${detailerName} has been assigned to detail your ${booking.vehicleType} on ${new Date(booking.date).toLocaleDateString()} at ${booking.time}.
Code: ${booking.confirmationCode}
Questions? ${businessPhone}`;
    
    return await this.sendSMS(booking.phoneNumber, message);
  }

  // Format phone number for Twilio (E.164 format)
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming North America +1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (phoneNumber.startsWith('+')) {
      return phoneNumber; // Already formatted
    } else {
      return `+1${cleaned}`; // Default to +1 for North America
    }
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber) {
    // Basic validation for phone numbers
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Must have at least 10 digits
    return phoneRegex.test(phoneNumber) && cleaned.length >= 10;
  }

  // Test SMS functionality
  async testSMS(phoneNumber = process.env.TEST_PHONE_NUMBER) {
    if (!phoneNumber) {
      console.log('❌ No test phone number provided. Set TEST_PHONE_NUMBER in .env file');
      return false;
    }

    const testMessage = `🧪 Test SMS from ${process.env.BUSINESS_NAME || 'Prime Detailing Service'}
Time: ${new Date().toLocaleTimeString()}
This is a test message to verify SMS functionality.`;
    
    console.log(`🧪 Testing SMS to ${phoneNumber}...`);
    const result = await this.sendSMS(phoneNumber, testMessage);
    
    if (result) {
      console.log('✅ SMS test successful!');
    } else {
      console.log('❌ SMS test failed');
    }
    
    return result;
  }

  // Get account balance (useful for monitoring)
  async getAccountBalance() {
    if (!this.isConfigured) {
      console.log('❌ Twilio not configured');
      return null;
    }

    try {
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return {
        balance: account.balance,
        currency: 'USD'
      };
    } catch (error) {
      console.error('❌ Failed to get account balance:', error.message);
      return null;
    }
  }

  // Get SMS usage for current month
  async getMonthlyUsage() {
    if (!this.isConfigured) {
      console.log('❌ Twilio not configured');
      return null;
    }

    try {
      const startDate = new Date();
      startDate.setDate(1); // First day of current month
      
      const usage = await this.client.usage.records.list({
        category: 'sms',
        startDate: startDate.toISOString().split('T')[0]
      });

      return usage.length > 0 ? {
        count: usage[0].count,
        price: usage[0].price,
        priceUnit: usage[0].priceUnit
      } : { count: 0, price: '0', priceUnit: 'USD' };
      
    } catch (error) {
      console.error('❌ Failed to get usage data:', error.message);
      return null;
    }
  }

  // Check if phone number is opted out
  async checkOptOutStatus(phoneNumber) {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // This would require additional Twilio setup for opt-out tracking
      // For now, we'll return false (not opted out)
      return false;
      
    } catch (error) {
      console.error('❌ Failed to check opt-out status:', error.message);
      return false;
    }
  }

  // Send bulk SMS (for admin notifications, etc.)
  async sendBulkSMS(phoneNumbers, message) {
    if (!this.isConfigured) {
      console.error('❌ Twilio not configured - cannot send bulk SMS');
      return { success: 0, failed: phoneNumbers.length };
    }

    let success = 0;
    let failed = 0;
    
    console.log(`📱 Sending bulk SMS to ${phoneNumbers.length} numbers...`);
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendSMS(phoneNumber, message);
        if (result) {
          success++;
        } else {
          failed++;
        }
        
        // Small delay to avoid rate limiting
        await this.delay(500);
        
      } catch (error) {
        console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error.message);
        failed++;
      }
    }
    
    console.log(`📊 Bulk SMS completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get service status and configuration info
  getServiceInfo() {
    return {
      configured: this.isConfigured,
      provider: 'Twilio',
      fromNumber: this.fromNumber,
      rateLimitDelay: 500, // milliseconds between messages
      maxMessageLength: 160,
      supportsBulk: true,
      supportsDeliveryStatus: true
    };
  }
}

// Create singleton instance
const twilioSMSService = new TwilioSMSService();

// Export methods
module.exports = {
  sendBookingConfirmation: (booking) => twilioSMSService.sendBookingConfirmation(booking),
  sendBookingUpdate: (booking, status) => twilioSMSService.sendBookingUpdate(booking, status),
  sendBookingReminder: (booking) => twilioSMSService.sendBookingReminder(booking),
  sendDetailerAssignment: (booking, detailerName) => twilioSMSService.sendDetailerAssignment(booking, detailerName),
  testSMS: (phoneNumber) => twilioSMSService.testSMS(phoneNumber),
  getAccountBalance: () => twilioSMSService.getAccountBalance(),
  getMonthlyUsage: () => twilioSMSService.getMonthlyUsage(),
  sendBulkSMS: (phoneNumbers, message) => twilioSMSService.sendBulkSMS(phoneNumbers, message),
  isConfigured: () => twilioSMSService.isConfigured,
  getServiceInfo: () => twilioSMSService.getServiceInfo()
};