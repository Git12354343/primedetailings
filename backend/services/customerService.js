// backend/services/customerService.js
// CRM core: links every booking to a Customer record (keyed by normalized
// phone) and maintains their Vehicle profiles. Called fire-and-forget from
// bookingAtomic so booking creation can NEVER fail because of CRM work —
// even if the customers table doesn't exist yet (pre-migration deploys).

const prisma = require('../prisma/lib/prisma_lib');
const { normalisePhone } = require('./smsService');

/**
 * Find-or-create the customer for a phone number, refreshing identity
 * fields with the latest non-empty values.
 */
const upsertCustomer = async ({ phone, email, firstName, lastName, language, marketingConsent }) => {
  const normPhone = normalisePhone(phone);
  if (!normPhone) return null;

  const existing = await prisma.customer.findUnique({ where: { phone: normPhone } });

  if (!existing) {
    return prisma.customer.create({
      data: {
        phone:            normPhone,
        email:            email?.toLowerCase().trim() || null,
        firstName:        (firstName || '').trim(),
        lastName:         (lastName  || '').trim(),
        language:         language || 'en',
        marketingConsent: marketingConsent === true,
      },
    });
  }

  // Refresh with latest info; consent can only be turned ON here (turning it
  // off is an explicit admin/customer action, not a booking side-effect).
  const data = {};
  if (email?.trim() && email.toLowerCase().trim() !== existing.email) data.email = email.toLowerCase().trim();
  if (firstName?.trim() && firstName.trim() !== existing.firstName)   data.firstName = firstName.trim();
  if (lastName?.trim()  && lastName.trim()  !== existing.lastName)    data.lastName  = lastName.trim();
  if (marketingConsent === true && !existing.marketingConsent)        data.marketingConsent = true;

  if (Object.keys(data).length === 0) return existing;
  return prisma.customer.update({ where: { id: existing.id }, data });
};

/**
 * Ensure the customer has a Vehicle row matching this booking's vehicle.
 * Matching is loose on purpose: same make+model (case-insensitive) or, when
 * make/model are absent, same type with no make recorded.
 */
const upsertVehicle = async (customerId, { vehicleType, make, model, year }) => {
  if (!customerId || !vehicleType) return null;

  const vehicles = await prisma.vehicle.findMany({ where: { customerId } });
  const match = vehicles.find(v => {
    if (make && v.make) {
      return v.make.toLowerCase() === make.toLowerCase()
        && (v.model || '').toLowerCase() === (model || '').toLowerCase();
    }
    return !make && !v.make && v.type === vehicleType;
  });

  if (match) {
    const data = {};
    if (year && !match.year)   data.year = parseInt(year);
    if (model && !match.model) data.model = model.trim();
    if (Object.keys(data).length === 0) return match;
    return prisma.vehicle.update({ where: { id: match.id }, data });
  }

  return prisma.vehicle.create({
    data: {
      customerId,
      type:  vehicleType,
      make:  make?.trim()  || null,
      model: model?.trim() || null,
      year:  year ? parseInt(year) : null,
    },
  });
};

/**
 * Fire-and-forget hook called after a booking is created.
 * Links the booking to its customer and records the vehicle.
 */
const linkBookingToCustomer = async (booking, extra = {}) => {
  try {
    const customer = await upsertCustomer({
      phone:            booking.phoneNumber,
      email:            booking.email,
      firstName:        booking.firstName,
      lastName:         booking.lastName,
      language:         extra.language,
      marketingConsent: extra.marketingConsent,
    });
    if (!customer) return null;

    await prisma.booking.update({ where: { id: booking.id }, data: { customerId: customer.id } });
    await upsertVehicle(customer.id, booking);
    return customer;
  } catch (err) {
    // CRM must never break bookings (e.g. tables not migrated yet).
    console.error('[customerService] linkBookingToCustomer failed:', err.message);
    return null;
  }
};

/**
 * One-time backfill: builds Customer + Vehicle records from historical
 * bookings. Idempotent — only touches bookings with customerId = null.
 */
const backfillCustomers = async () => {
  const orphans = await prisma.booking.findMany({
    where:   { customerId: null },
    orderBy: { createdAt: 'asc' },
  });

  let customersCreated = 0, bookingsLinked = 0;

  // Group by normalized phone, preserving chronological order so the most
  // recent booking wins for identity fields.
  const byPhone = new Map();
  for (const b of orphans) {
    const p = normalisePhone(b.phoneNumber);
    if (!p) continue;
    if (!byPhone.has(p)) byPhone.set(p, []);
    byPhone.get(p).push(b);
  }

  for (const [, bookings] of byPhone) {
    const latest = bookings[bookings.length - 1];
    const before = await prisma.customer.findUnique({
      where: { phone: normalisePhone(latest.phoneNumber) },
      select: { id: true },
    });

    const customer = await upsertCustomer({
      phone:     latest.phoneNumber,
      email:     latest.email,
      firstName: latest.firstName,
      lastName:  latest.lastName,
    });
    if (!customer) continue;
    if (!before) customersCreated++;

    await prisma.booking.updateMany({
      where: { id: { in: bookings.map(b => b.id) } },
      data:  { customerId: customer.id },
    });
    bookingsLinked += bookings.length;

    for (const b of bookings) {
      await upsertVehicle(customer.id, b);
    }
  }

  return { customersCreated, bookingsLinked, phonesProcessed: byPhone.size };
};

module.exports = { upsertCustomer, upsertVehicle, linkBookingToCustomer, backfillCustomers };
