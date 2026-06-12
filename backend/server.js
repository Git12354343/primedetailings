/**
 * server.js  — backend/server.js
 *
 * Changes from previous version:
 *  - Hardcoded static GET /api/reviews replaced by the real reviews router
 *    (reads from the `reviews` DB table managed by admin panel)
 *  - Added FAQ route: GET /api/faq + PUT /api/faq (admin editable)
 */

'use strict';

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const { PrismaClient } = require('@prisma/client');
const twilio     = require('twilio');
const emailService = require('./services/emailService');
const { sms }    = require('./services/smsService');
require('dotenv').config();

const {
  createBookingAtomic,
  BookingConflictError,
  resolveSlotId,
} = require('./services/bookingAtomic');

const authRoutes         = require('./routes/auth');
const bookingRoutes      = require('./routes/bookings');
const adminRoutes        = require('./routes/admin');
const serviceRoutes      = require('./routes/services');
const availabilityRoutes = require('./routes/availabilityRoutes');
const packageRoutes      = require('./routes/packages');
const scheduleRoutes     = require('./routes/scheduleRoutes');
const trainingRoutes     = require('./routes/training');
const checklistRoutes    = require('./routes/checklists');
const imageRoutes        = require('./routes/images');
const fleetRoutes        = require('./routes/fleet');
const quoteRoutes        = require('./routes/quotes');
const exportRoutes       = require('./routes/export');
const auditRoutes        = require('./routes/auditRoutes');
const photoRoutes        = require('./routes/photos');
const reviewRoutes       = require('./routes/reviews');
const faqRoutes          = require('./routes/faq');
const customerRoutes     = require('./routes/customers');

const { createManualBooking } = require('./controllers/manualBookingController');
const { startScheduler }      = require('./jobs/scheduler');

const app    = express();
const prisma = new PrismaClient();

app.set('trust proxy', 1);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

emailService.testConnection().then(isReady => {
  if (isReady) console.log('📧 Email service initialized successfully');
  else         console.warn('⚠️  Email service not configured properly');
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '20mb' }));

const publicReadLimiter  = rateLimit({ windowMs: 15*60*1000, max: 500, message: { success:false, message:'Too many requests, please try again later.' } });
const generalLimiter     = rateLimit({ windowMs: 15*60*1000, max: 200, message: { success:false, message:'Too many requests from this IP, please try again later.' } });
const authLimiter        = rateLimit({ windowMs: 15*60*1000, max: 50,  message: { success:false, message:'Too many login attempts, please try again later.' } });
const smsLimiter         = rateLimit({ windowMs: 15*60*1000, max: 5,   message: 'Too many SMS requests, please try again later' });
const contactLimiter     = rateLimit({ windowMs: 15*60*1000, max: 3,   message: 'Too many contact submissions, please try again later' });
const imageUploadLimiter = rateLimit({ windowMs: 60*60*1000, max: 20,  message: { success:false, message:'Too many image uploads, please try again later.' } });
const fleetLimiter       = rateLimit({ windowMs: 60*60*1000, max: 5,   message: { success:false, message:'Too many fleet quote requests.' } });

app.use('/api/services/active',        publicReadLimiter);
app.use('/api/services/addons/active', publicReadLimiter);
app.use('/api/packages/active',        publicReadLimiter);
app.use('/api/availability',           publicReadLimiter);
app.use('/api/schedule/config',        publicReadLimiter);
app.use('/api/training/modules',       publicReadLimiter);
app.use('/api/reviews',                publicReadLimiter);
app.use('/api/faq',                    publicReadLimiter);
app.use('/api/',                       generalLimiter);
app.use('/api/auth/login',             authLimiter);
app.use('/api/bookings/initiate',      smsLimiter);
app.use('/api/contact',                contactLimiter);
app.use('/api/images/upload/quote',    imageUploadLimiter);
app.use('/api/fleet/quote',            fleetLimiter);
app.use('/api/quotes',                 generalLimiter);

app.use('/api/auth',         authRoutes);
app.use('/api/bookings',     bookingRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/packages',     packageRoutes);
app.use('/api/schedule',     scheduleRoutes);
app.use('/api/training',     trainingRoutes);
app.use('/api/checklists',   checklistRoutes);
app.use('/api/images',       imageRoutes);
app.use('/api/fleet',        fleetRoutes);
app.use('/api/quotes',       quoteRoutes);
app.use('/api/export',       exportRoutes);
app.use('/api/audit',        auditRoutes);
app.use('/api/photos',       photoRoutes);
app.use('/api/reviews',      reviewRoutes);
app.use('/api/faq',          faqRoutes);
app.use('/api/customers',    customerRoutes);

app.post('/api/admin/manual-booking', createManualBooking);

const formatPhoneNumber = (phone) => {
  const digits = String(phone||'').replace(/\D/g,'');
  if (digits.length===10) return `+1${digits}`;
  if (digits.length===11&&digits[0]==='1') return `+${digits}`;
  return `+${digits}`;
};
const generateVerificationCode = () => Math.floor(100000+Math.random()*900000).toString();
const storeVerificationCode = async (phone,code,bookingData) => {
  const expiresAt = new Date(Date.now()+10*60*1000);
  await prisma.verificationCode.upsert({
    where:{phoneNumber:phone},
    update:{code,expiresAt,attempts:0,bookingData:JSON.stringify(bookingData||{})},
    create:{phoneNumber:phone,code,expiresAt,attempts:0,bookingData:JSON.stringify(bookingData||{})},
  });
};
const getVerificationCode    = async(phone) => prisma.verificationCode.findUnique({where:{phoneNumber:phone}});
const deleteVerificationCode = async(phone) => prisma.verificationCode.delete({where:{phoneNumber:phone}}).catch(()=>{});
const stripHtml = (str) => (str||'').replace(/<[^>]*>/g,'').trim();

app.post('/api/bookings/initiate', async (req,res) => {
  try {
    const {phoneNumber,bookingData} = req.body;
    if (!phoneNumber) return res.status(400).json({success:false,error:'Phone number is required'});
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const code = generateVerificationCode();
    await storeVerificationCode(formattedPhone,code,bookingData);
    const hasTwilio = process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_PHONE_NUMBER&&!process.env.TWILIO_ACCOUNT_SID.includes('your_')&&!process.env.TWILIO_ACCOUNT_SID.includes('placeholder');
    if (hasTwilio) {
      try { await twilioClient.messages.create({body:`Your Prestige Plus Services verification code is: ${code}. Valid for 10 minutes.`,from:process.env.TWILIO_PHONE_NUMBER,to:formattedPhone}); console.log(`✅ SMS sent to ${formattedPhone}`); }
      catch(e) { console.error('Twilio error:',e.message); console.log(`📱 FALLBACK — SMS Code for ${formattedPhone}: ${code}`); }
    } else { console.log(`📱 Twilio not configured — SMS Code for ${formattedPhone}: ${code}`); }
    res.json({success:true,message:'Verification code sent',phoneNumber:formattedPhone});
  } catch(error) { console.error('Initiate booking error:',error); res.status(500).json({success:false,error:'Failed to send verification code'}); }
});

app.post('/api/bookings/verify', async (req,res) => {
  try {
    const {phoneNumber,code,bookingData} = req.body;
    if (!phoneNumber||!code) return res.status(400).json({success:false,error:'Phone number and code are required'});
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const stored = await getVerificationCode(formattedPhone);
    if (!stored) return res.status(400).json({success:false,error:'No verification code found. Please request a new one.'});
    if (new Date()>new Date(stored.expiresAt)) { await deleteVerificationCode(formattedPhone); return res.status(400).json({success:false,error:'Verification code has expired. Please request a new one.'}); }
    try { await prisma.verificationCode.update({where:{phoneNumber:formattedPhone},data:{attempts:{increment:1}}}); } catch{}
    const updatedAttempts=(stored.attempts||0)+1;
    if (updatedAttempts>3) { await deleteVerificationCode(formattedPhone); return res.status(400).json({success:false,error:'Too many failed attempts. Please request a new code.'}); }
    if (stored.code!==code) return res.status(400).json({success:false,error:'Invalid verification code',attemptsRemaining:3-updatedAttempts});
    await deleteVerificationCode(formattedPhone);
    const finalData = bookingData||(stored.bookingData?JSON.parse(stored.bookingData):{});
    if (!finalData.date||!finalData.time) return res.status(400).json({success:false,error:'Booking data incomplete — missing date or time'});
    const slotId = finalData.slotId||await resolveSlotId(finalData.time);
    if (!slotId) return res.status(400).json({success:false,error:`Invalid time slot: "${finalData.time}"`});
    try {
      const booking = await createBookingAtomic({
        date:finalData.date, slotId, time:finalData.time,
        firstName:finalData.firstName||'', lastName:finalData.lastName||'', email:finalData.email||'',
        phoneNumber:formattedPhone, address:finalData.address||'', city:finalData.city||'', postalCode:finalData.postalCode||'',
        vehicleType:finalData.vehicleType||'', vehicleCondition:finalData.vehicleCondition||'',
        make:finalData.make||null, model:finalData.model||null, year:finalData.year||null,
        services:Array.isArray(finalData.services)?JSON.stringify(finalData.services):(finalData.services||'[]'),
        extras:Array.isArray(finalData.addOns)?JSON.stringify(finalData.addOns):(finalData.extras||'[]'),
        totalPrice:finalData.totalPrice||null, specialInstructions:finalData.specialInstructions||null,
        propertyType:finalData.propertyType||'', hasWaterPower:finalData.hasWaterPower!==false, packageId:finalData.packageId||null,
      },{initiatedBy:'customer',status:'PENDING'});
      emailService.sendBookingConfirmation?.(booking).catch(()=>{});
      sms.bookingConfirmed?.(booking).catch(()=>{});
      return res.json({success:true,booking:{id:booking.id,confirmationCode:booking.confirmationCode,status:booking.status,date:booking.date,time:booking.time,slotId:booking.slotId,startAt:booking.startAt,firstName:booking.firstName,lastName:booking.lastName}});
    } catch(err) {
      if (err instanceof BookingConflictError) return res.status(409).json({success:false,error:err.message,availabilityError:true,conflictCode:err.conflictCode,suggestedAction:'The time slot was taken while you were verifying. Please go back and pick another time.'});
      throw err;
    }
  } catch(error) { console.error('Verify booking error:',error); res.status(500).json({success:false,error:'Failed to create booking'}); }
});

app.get('/api/bookings/:code', async (req,res) => {
  try {
    const booking = await prisma.booking.findUnique({where:{confirmationCode:req.params.code.toUpperCase()},include:{detailer:{select:{name:true,phone:true}}}});
    if (!booking) return res.status(404).json({success:false,error:'Booking not found'});
    res.json({success:true,booking:{id:booking.id,confirmationCode:booking.confirmationCode,firstName:booking.firstName,lastName:booking.lastName,phoneNumber:booking.phoneNumber,email:booking.email,address:booking.address,city:booking.city,postalCode:booking.postalCode,vehicleType:booking.vehicleType,make:booking.make,model:booking.model,year:booking.year,services:typeof booking.services==='string'?JSON.parse(booking.services):booking.services,extras:booking.extras?(typeof booking.extras==='string'?JSON.parse(booking.extras):booking.extras):[],date:booking.date,time:booking.time,slotId:booking.slotId,startAt:booking.startAt,status:booking.status,totalPrice:booking.totalPrice,specialInstructions:booking.specialInstructions,detailer:booking.detailer,enRouteAt:booking.enRouteAt,startedAt:booking.startedAt,arrivedAt:booking.arrivedAt,completedAt:booking.completedAt}});
  } catch(error) { console.error('Get booking error:',error); res.status(500).json({success:false,error:'Failed to fetch booking'}); }
});

app.post('/api/contact', async (req,res) => {
  try {
    const {name,email,phone,subject,message} = req.body;
    if (!name||!email||!message) return res.status(400).json({success:false,error:'Name, email, and message are required'});
    const contact = await prisma.contact.create({data:{name:stripHtml(name).substring(0,100),email:stripHtml(email).substring(0,200),phone:phone?stripHtml(phone).substring(0,30):null,subject:stripHtml(subject||'General Inquiry').substring(0,200),message:stripHtml(message).substring(0,5000)}});
    emailService.sendContactNotification?.({name:contact.name,email:contact.email,phone:contact.phone,subject:contact.subject,message:contact.message,referenceId:contact.id}).catch(err=>console.error('Contact email error:',err));
    res.status(201).json({success:true,message:'Message received!',referenceId:contact.id});
  } catch(error) { console.error('Contact form error:',error); res.status(500).json({success:false,error:'Failed to submit contact form'}); }
});

const requireAdminSecret = (req,res,next) => {
  const secret = req.headers['x-admin-secret']||req.headers.authorization?.replace('Bearer ','');
  if (!secret||secret!==process.env.ADMIN_SECRET) return res.status(401).json({success:false,error:'Unauthorized'});
  next();
};
app.get('/api/admin/contacts',requireAdminSecret,async(req,res)=>{ try{const contacts=await prisma.contact.findMany({orderBy:{createdAt:'desc'},take:100});res.json({success:true,contacts});}catch(err){res.status(500).json({success:false,error:err.message});}});
app.put('/api/admin/contacts/:id',requireAdminSecret,async(req,res)=>{ try{const{status}=req.body;const contact=await prisma.contact.update({where:{id:parseInt(req.params.id)},data:{...(status&&{status})}});res.json({success:true,contact});}catch(err){res.status(500).json({success:false,error:err.message});}});
app.delete('/api/admin/contacts/:id',requireAdminSecret,async(req,res)=>{ try{await prisma.contact.delete({where:{id:parseInt(req.params.id)}});res.json({success:true});}catch(err){res.status(500).json({success:false,error:err.message});}});

app.get('/api/health',async(req,res)=>{ try{await prisma.$queryRaw`SELECT 1`;res.json({success:true,status:'healthy',database:'supabase-postgresql',timestamp:new Date().toISOString(),environment:process.env.NODE_ENV});}catch(error){res.status(503).json({success:false,status:'unhealthy',error:error.message});}});

const PORT = process.env.PORT||3001;
app.listen(PORT,()=>{ console.log(`🚀 Server running on port ${PORT}`); console.log(`🗄️  Database: Supabase PostgreSQL`); console.log(`🌍 Environment: ${process.env.NODE_ENV||'development'}`); startScheduler(); });
module.exports = app;
