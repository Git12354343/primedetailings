// prisma/seed.js  — creates a detailer in both Supabase Auth AND the DB table
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();

// Service-role client so we can create Auth users without email confirmation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🌱 Start seeding...');

  const email = 'zakhs93@gmail.com';
  const password = 'detailing123';
  const name = 'Zak H';
  const phone = '514-555-9393';

  // 1. Check if detailer already exists in DB
  const existingDetailer = await prisma.detailer.findUnique({ where: { email } });

  if (existingDetailer) {
    console.log(`ℹ️  Detailer ${email} already exists in DB. Skipping.`);
    return;
  }

  // 2. Create Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true   // skip confirmation email in dev
  });

  if (authError) {
    // If the user already exists in Supabase Auth, fetch their ID
    if (authError.message?.includes('already registered')) {
      console.log('ℹ️  Supabase Auth user already exists, looking up ID...');
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email === email);
      if (existing) {
        await createDetailerRecord(existing.id, name, email, phone);
      }
      return;
    }
    throw new Error(`Supabase Auth error: ${authError.message}`);
  }

  // 3. Create detailer record in DB, linked to Supabase Auth user
  await createDetailerRecord(authData.user.id, name, email, phone);

  console.log('\n✅ Seeding finished.');
}

async function createDetailerRecord(supabaseUserId, name, email, phone) {
  const detailer = await prisma.detailer.create({
    data: {
      name,
      email,
      phone,
      supabaseUserId,
      isActive: true
    }
  });
  console.log(`✅ Created detailer: ${detailer.name} (${detailer.email}), Supabase ID: ${supabaseUserId}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });