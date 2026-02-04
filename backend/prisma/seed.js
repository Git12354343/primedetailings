const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Create a specific detailer account ---
  const email = 'zakhs93@gmail.com';
  const password = 'detailing123';

  // Check if the detailer already exists to avoid errors
  const existingDetailer = await prisma.detailer.findUnique({
    where: { email: email },
  });

  if (existingDetailer) {
    console.log(`Detailer with email ${email} already exists. Skipping.`);
  } else {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new detailer
    const newDetailer = await prisma.detailer.create({
      data: {
        name: 'Zak H', // You can change the name if you like
        email: email,
        phone: '514-555-9393', // Placeholder phone number
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log(`✅ Created new detailer: ${newDetailer.name} (Email: ${newDetailer.email})`);
  }

  console.log('\nSeeding finished.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });