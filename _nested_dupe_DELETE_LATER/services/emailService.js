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

    const emailSubject = `Booking Confirmation - Prestige Plus Services #${confirmationCode}`;
    
    const formattedDate = new Date(date).toLocaleDateString('en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const emailHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Booking Confirmed — Prestige Plus Services</title>
</head>
<body style="margin:0;padding:0;background:#0b0f1a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f1a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#00a8cc,#00d4ff);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
      <div style="display:inline-block;background:rgba(0,0,0,0.18);border-radius:10px;padding:8px 16px;margin-bottom:14px;">
        <span style="color:#000;font-weight:900;font-size:14px;letter-spacing:0.1em;">PP</span>
        <span style="color:#000;font-weight:700;font-size:14px;margin-left:6px;">PRESTIGE PLUS DETAILING</span>
      </div>
      <h1 style="margin:0;color:#000;font-size:26px;font-weight:900;letter-spacing:-0.02em;">Booking Confirmed ✓</h1>
      <p style="margin:8px 0 0;color:rgba(0,0,0,0.6);font-size:14px;">We can't wait to transform your vehicle</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#111;padding:36px 40px;">

      <p style="margin:0 0 24px;color:rgba(255,255,255,0.8);font-size:16px;">Hi <strong style="color:#fff;">${firstName}</strong>, your booking is confirmed!</p>

      <!-- Confirmation code pill -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:rgba(0,168,204,0.1);border:1px solid rgba(0,168,204,0.3);border-radius:10px;padding:16px 20px;text-align:center;">
            <p style="margin:0;color:rgba(0,168,204,0.7);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Confirmation Code</p>
            <p style="margin:6px 0 0;color:#00d4ff;font-size:28px;font-weight:900;letter-spacing:0.08em;">#${confirmationCode}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.35);font-size:12px;">Save this code — you'll need it to manage your booking</p>
          </td>
        </tr>
      </table>

      <!-- Appointment Details -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;">
            <p style="margin:0 0 14px;color:#00a8cc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">📅 Appointment Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.45);font-size:13px;width:110px;">Date</td><td style="padding:5px 0;color:#fff;font-size:14px;font-weight:600;">${formattedDate}</td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.45);font-size:13px;">Time</td><td style="padding:5px 0;color:#fff;font-size:14px;font-weight:600;">${time}</td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.45);font-size:13px;">Location</td><td style="padding:5px 0;color:#fff;font-size:14px;">${address}<br><span style="color:rgba(255,255,255,0.6);">${city}, ${postalCode}</span></td></tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Vehicle & Services -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px 24px;">
            <p style="margin:0 0 14px;color:#00a8cc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">🚗 Vehicle &amp; Services</p>
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.45);font-size:12px;">Vehicle</p>
            <p style="margin:0 0 16px;color:#fff;font-size:14px;font-weight:600;">${vehicleInfo}</p>
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.45);font-size:12px;">Services</p>
            ${services.map(s => `<p style="margin:0 0 4px;color:#fff;font-size:14px;">• ${s}</p>`).join('')}
            ${addOns && addOns.length > 0 ? `
            <p style="margin:14px 0 8px;color:rgba(255,255,255,0.45);font-size:12px;">Add-ons</p>
            ${addOns.map(a => `<p style="margin:0 0 4px;color:#00d4ff;font-size:14px;">+ ${a}</p>`).join('')}` : ''}
            ${specialInstructions ? `<p style="margin:14px 0 4px;color:rgba(255,255,255,0.45);font-size:12px;">Special Instructions</p><p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;font-style:italic;">${specialInstructions}</p>` : ''}
          </td>
        </tr>
      </table>

      <!-- Price -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:16px 24px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;">Estimated Total</p>
            <p style="margin:4px 0 0;color:#34d399;font-size:32px;font-weight:900;">$${totalPrice}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.35);font-size:12px;">Final price confirmed at time of service</p>
          </td>
        </tr>
      </table>

      <!-- What to expect -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:20px 24px;">
            <p style="margin:0 0 12px;color:#00a8cc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">What to Expect</p>
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;">✓ &nbsp;We'll confirm 24 hours before your appointment</p>
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;">✓ &nbsp;Our team arrives fully equipped — no prep needed from you</p>
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;">✓ &nbsp;Service takes 2–4 hours depending on selected services</p>
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">✓ &nbsp;Cash, credit card, or e-transfer accepted on-site</p>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || 'https://prestigeplus.services'}/booking-lookup?code=${confirmationCode}"
               style="display:inline-block;background:linear-gradient(135deg,#00a8cc,#00d4ff);color:#000;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:900;font-size:15px;letter-spacing:0.02em;">
              Track My Booking
            </a>
          </td>
        </tr>
      </table>

      <!-- Contact -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;text-align:center;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,0.4);font-size:13px;">Need to reschedule? Contact us 24+ hours in advance.</p>
            <p style="margin:0;color:#00a8cc;font-size:13px;font-weight:600;">
              <a href="tel:+14387968001" style="color:#00a8cc;text-decoration:none;">(438) 796-8001</a>
              &nbsp;·&nbsp;
              <a href="mailto:info@prestigeplus.services" style="color:#00a8cc;text-decoration:none;">info@prestigeplus.services</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#111827;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid rgba(0,168,204,0.15);">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.25);font-size:12px;">© ${new Date().getFullYear()} Prestige Plus Services — Montréal, QC</p>
      <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;">This is an automated confirmation. Do not reply to this email.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      html: emailHTML,
      // Text version for email clients that don't support HTML
      text: `
        Prestige Plus Services Montreal - Booking Confirmation
        
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
        
        Questions? Call us at (438) 796-8001 or email info@prestigeplus.services
        
        Thank you for choosing Prestige Plus Services Montreal!
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
      phoneNumber,
      confirmationCode,
      date,
      time,
      address,
      city,
      services,
      addOns,
      vehicleInfo,
      vehicleType,
      vehicleCondition,
      propertyType,
      hasWaterPower,
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
              <p><strong>Phone:</strong> ${phoneNumber || phone || ''}</p>
            </div>

            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Address:</strong> ${address}, ${city}</p>
              <p><strong>Property type:</strong> ${propertyType || '—'}</p>
              <p><strong>Water & power on site:</strong> ${hasWaterPower === false ? 'NO — plan accordingly' : 'Yes'}</p>
              <p><strong>Vehicle:</strong> ${vehicleInfo || vehicleType || ''}</p>
              <p><strong>Condition:</strong> ${vehicleCondition || '—'}</p>
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
      from: process.env.EMAIL_FROM || `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
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
      from: process.env.EMAIL_FROM || `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
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
              <p>This is a friendly reminder about your upcoming appointment with Prestige Plus Services.</p>
              
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

              <p>Questions or need to reschedule? Call us at (438) 796-8001</p>
              
              <p>We're excited to make your vehicle look amazing!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
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
      from: process.env.EMAIL_FROM || `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Test Email - Prestige Plus Services System',
      html: `
        <h2>Email Service Test</h2>
        <p>This is a test email from Prestige Plus Services's booking system.</p>
        <p>If you receive this, the email service is working correctly!</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();