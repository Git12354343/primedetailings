// backend/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Fix: Use createTransport (not createTransporter)
    this.transporter = nodemailer.createTransport({
      // For Gmail SMTP
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
      }
    });

    // Alternative configuration for other providers
    // Uncomment and modify based on your email provider
    /*
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    */
  }

  // Send booking confirmation email to customer
  async sendBookingConfirmation(bookingData) {
    const {
      firstName,
      lastName,
      email,
      confirmationCode,
      date,
      time,
      address,
      city,
      postalCode,
      services,
      addOns,
      vehicleInfo,
      totalPrice,
      specialInstructions
    } = bookingData;

    const servicesList = services.map(service => `• ${service}`).join('\n');
    const addOnsList = addOns.length > 0 ? addOns.map(addon => `• ${addon}`).join('\n') : 'None';

    const emailSubject = `Booking Confirmation - Prime Detailing #${confirmationCode}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .confirmation-box { background: #10B981; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
            .details-section { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #3B82F6; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
            .contact-info { background: #EBF8FF; padding: 15px; border-radius: 6px; margin: 20px 0; }
            h1 { margin: 0; }
            h2 { color: #3B82F6; margin-top: 0; }
            .price { font-size: 18px; font-weight: bold; color: #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Prime Detailing Montreal</h1>
              <p>Professional Mobile Car Detailing</p>
            </div>
            
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Thank you for choosing Prime Detailing! Your booking has been confirmed and we're excited to make your vehicle look amazing.</p>
              
              <div class="confirmation-box">
                <h3 style="margin: 0;">Confirmation Code: #${confirmationCode}</h3>
                <p style="margin: 5px 0 0 0;">Save this code for your records</p>
              </div>

              <div class="details-section">
                <h2>Appointment Details</h2>
                <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Service Address:</strong><br>
                   ${address}<br>
                   ${city}, ${postalCode}</p>
              </div>

              <div class="details-section">
                <h2>Vehicle & Services</h2>
                <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
                <p><strong>Services:</strong></p>
                <pre style="font-family: Arial, sans-serif; margin: 5px 0;">${servicesList}</pre>
                <p><strong>Add-ons:</strong></p>
                <pre style="font-family: Arial, sans-serif; margin: 5px 0;">${addOnsList}</pre>
                ${specialInstructions ? `<p><strong>Special Instructions:</strong><br>${specialInstructions}</p>` : ''}
                <p class="price">Total: $${totalPrice}</p>
              </div>

              <div class="contact-info">
                <h3>What to Expect</h3>
                <p>• Our team will contact you 24 hours before your appointment</p>
                <p>• We'll arrive at your location with all necessary equipment</p>
                <p>• Service typically takes 2-4 hours depending on selected services</p>
                <p>• Payment can be made by cash, credit card, or e-transfer</p>
              </div>

              <div class="contact-info">
                <h3>Need to Make Changes?</h3>
                <p>Contact us at least 24 hours in advance:</p>
                <p><strong>Phone:</strong> (514) 437-4816</p>
                <p><strong>Email:</strong> info@primedetailing.ca</p>
                <p><strong>Reference:</strong> #${confirmationCode}</p>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing Prime Detailing Montreal!</p>
              <p>Follow us for tips and updates on social media</p>
              <p style="font-size: 12px; color: #999;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Prime Detailing Montreal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      html: emailHTML,
      // Text version for email clients that don't support HTML
      text: `
        Prime Detailing Montreal - Booking Confirmation
        
        Hello ${firstName}!
        
        Your booking has been confirmed!
        Confirmation Code: #${confirmationCode}
        
        Appointment Details:
        Date: ${new Date(date).toLocaleDateString()}
        Time: ${time}
        Address: ${address}, ${city} ${postalCode}
        
        Vehicle: ${vehicleInfo}
        Services: ${services.join(', ')}
        Add-ons: ${addOns.join(', ') || 'None'}
        Total: $${totalPrice}
        
        We'll contact you 24 hours before your appointment.
        
        Questions? Call us at (514) 437-4816 or email info@primedetailing.ca
        
        Thank you for choosing Prime Detailing Montreal!
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Send notification email to business owner
  async sendNewBookingNotification(bookingData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      confirmationCode,
      date,
      time,
      address,
      city,
      services,
      addOns,
      vehicleInfo,
      totalPrice
    } = bookingData;

    const emailSubject = `New Booking Alert - #${confirmationCode}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { background: #F59E0B; color: white; padding: 15px; border-radius: 6px; }
            .booking-details { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 6px; }
            .customer-info { background: #EBF8FF; padding: 15px; border-radius: 6px; margin: 10px 0; }
            .urgent { color: #DC2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert-header">
              <h2 style="margin: 0;">🚨 New Booking Alert</h2>
              <p style="margin: 5px 0 0 0;">Confirmation: #${confirmationCode}</p>
            </div>

            <div class="customer-info">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
            </div>

            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Address:</strong> ${address}, ${city}</p>
              <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
              <p><strong>Services:</strong> ${services.join(', ')}</p>
              <p><strong>Add-ons:</strong> ${addOns.join(', ') || 'None'}</p>
              <p><strong>Total Value:</strong> $${totalPrice}</p>
            </div>

            <div class="urgent">
              Action Required: Assign this booking to a detailer in the admin panel.
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Prime Detailing System" <${process.env.EMAIL_USER}>`,
      to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
      subject: emailSubject,
      html: emailHTML
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Send contact form notification
  async sendContactFormNotification(contactData) {
    const { name, email, phone, subject, message } = contactData;

    const emailSubject = `New Contact Form Submission - ${subject}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 15px; border-radius: 6px; }
            .content { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">📧 New Contact Form Submission</h2>
            </div>

            <div class="content">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 4px;">${message}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Prime Detailing Website" <${process.env.EMAIL_USER}>`,
      to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
      subject: emailSubject,
      html: emailHTML,
      replyTo: email // Allow direct reply to customer
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Send booking reminder email (can be scheduled)
  async sendBookingReminder(bookingData) {
    const {
      firstName,
      email,
      confirmationCode,
      date,
      time,
      address,
      city,
      services
    } = bookingData;

    const emailSubject = `Reminder: Your Detailing Appointment Tomorrow - #${confirmationCode}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .reminder-header { background: #F59E0B; color: white; padding: 15px; border-radius: 6px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="reminder-header">
              <h2 style="margin: 0;">⏰ Appointment Reminder</h2>
              <p style="margin: 5px 0 0 0;">Your detailing appointment is tomorrow!</p>
            </div>

            <div class="content">
              <p>Hello ${firstName}!</p>
              <p>This is a friendly reminder about your upcoming appointment with Prime Detailing.</p>
              
              <p><strong>Tomorrow's Appointment:</strong></p>
              <p>📅 <strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
              <p>🕐 <strong>Time:</strong> ${time}</p>
              <p>📍 <strong>Location:</strong> ${address}, ${city}</p>
              <p>🚗 <strong>Services:</strong> ${services.join(', ')}</p>
              <p>📞 <strong>Confirmation:</strong> #${confirmationCode}</p>

              <p><strong>Preparation Tips:</strong></p>
              <p>• Please ensure your vehicle is accessible</p>
              <p>• Remove personal items from the vehicle</p>
              <p>• Have a water source available nearby</p>
              <p>• Our team will arrive with all equipment</p>

              <p>Questions or need to reschedule? Call us at (514) 437-4816</p>
              
              <p>We're excited to make your vehicle look amazing!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Prime Detailing Montreal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      html: emailHTML
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Test email configuration
  async testConnection() {
    try {
      // Only test if email credentials are provided
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.log('⚠️  Email credentials not configured - emails will be disabled');
        return false;
      }

      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error.message);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(toEmail) {
    if (!process.env.EMAIL_USER) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `"Prime Detailing Montreal" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Test Email - Prime Detailing System',
      html: `
        <h2>Email Service Test</h2>
        <p>This is a test email from Prime Detailing's booking system.</p>
        <p>If you receive this, the email service is working correctly!</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();