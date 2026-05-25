// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🌱 Start seeding...');

  // ── Detailer ──────────────────────────────────────────────────────────────
  const email    = 'zakhs93@gmail.com';
  const password = 'detailing123';
  const name     = 'Zak H';
  const phone    = '514-555-9393';

  const existingDetailer = await prisma.detailer.findUnique({ where: { email } });

  if (!existingDetailer) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes('already registered')) {
        console.log('ℹ️  Supabase Auth user already exists, looking up ID...');
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === email);
        if (existing) await createDetailerRecord(existing.id, name, email, phone);
      } else {
        throw new Error(`Supabase Auth error: ${authError.message}`);
      }
    } else {
      await createDetailerRecord(authData.user.id, name, email, phone);
    }
  } else {
    console.log(`ℹ️  Detailer ${email} already exists. Skipping.`);
  }

  // ── Checklist Templates ───────────────────────────────────────────────────
  console.log('🌱 Seeding checklist templates...');

  const existingTemplates = await prisma.checklistTemplate.count();
  if (existingTemplates === 0) {

    // Standard template
    const standard = await prisma.checklistTemplate.create({
      data: {
        name: 'Standard Detail',
        nameFr: 'Détail standard',
        serviceType: 'STANDARD',
        isDefault: true,
      },
    });

    await prisma.checklistTemplateItem.createMany({
      data: [
        { templateId: standard.id, label: 'Arrived at customer location',        labelFr: 'Arrivé chez le client',                  isRequired: true,  requiresPhoto: false, sortOrder: 1 },
        { templateId: standard.id, label: 'Vehicle inspected for existing damage', labelFr: 'Véhicule inspecté pour dommages existants', isRequired: true,  requiresPhoto: false, sortOrder: 2 },
        { templateId: standard.id, label: 'Before photos uploaded',               labelFr: 'Photos avant téléversées',                isRequired: true,  requiresPhoto: true,  sortOrder: 3 },
        { templateId: standard.id, label: 'Services confirmed with customer',      labelFr: 'Services confirmés avec le client',       isRequired: true,  requiresPhoto: false, sortOrder: 4 },
        { templateId: standard.id, label: 'Interior tasks completed',              labelFr: 'Tâches intérieures complétées',            isRequired: false, requiresPhoto: false, sortOrder: 5 },
        { templateId: standard.id, label: 'Exterior tasks completed',              labelFr: 'Tâches extérieures complétées',            isRequired: false, requiresPhoto: false, sortOrder: 6 },
        { templateId: standard.id, label: 'After photos uploaded',                 labelFr: 'Photos après téléversées',                isRequired: true,  requiresPhoto: true,  sortOrder: 7 },
        { templateId: standard.id, label: 'Customer reviewed vehicle',             labelFr: 'Client a inspecté le véhicule',            isRequired: true,  requiresPhoto: false, sortOrder: 8 },
      ],
    });
    console.log('  ✅ Standard checklist template created');

    // Ceramic coating template
    const ceramic = await prisma.checklistTemplate.create({
      data: {
        name: 'Ceramic Coating',
        nameFr: 'Revêtement céramique',
        serviceType: 'CERAMIC_COATING',
        isDefault: true,
      },
    });

    await prisma.checklistTemplateItem.createMany({
      data: [
        { templateId: ceramic.id, label: 'Pre-wash completed',                       labelFr: 'Pré-lavage complété',                          isRequired: true, requiresPhoto: false, sortOrder: 1 },
        { templateId: ceramic.id, label: 'Full wash completed',                       labelFr: 'Lavage complet complété',                      isRequired: true, requiresPhoto: false, sortOrder: 2 },
        { templateId: ceramic.id, label: 'Decontamination completed',                 labelFr: 'Décontamination complétée',                    isRequired: true, requiresPhoto: false, sortOrder: 3 },
        { templateId: ceramic.id, label: 'Clay bar completed',                        labelFr: 'Clay bar complété',                            isRequired: true, requiresPhoto: false, sortOrder: 4 },
        { templateId: ceramic.id, label: 'Paint condition inspected & documented',    labelFr: 'État de la peinture inspecté et documenté',     isRequired: true, requiresPhoto: true,  sortOrder: 5 },
        { templateId: ceramic.id, label: 'Paint correction / polishing completed',    labelFr: 'Correction de peinture / polissage complété',   isRequired: false,requiresPhoto: false, sortOrder: 6 },
        { templateId: ceramic.id, label: 'Panel wipe / IPA wipe completed',           labelFr: 'Nettoyage des panneaux à l\'IPA complété',       isRequired: true, requiresPhoto: false, sortOrder: 7 },
        { templateId: ceramic.id, label: 'Ceramic coating applied to all panels',     labelFr: 'Revêtement céramique appliqué sur tous les panneaux', isRequired: true, requiresPhoto: false, sortOrder: 8 },
        { templateId: ceramic.id, label: 'Curing time observed',                      labelFr: 'Temps de séchage respecté',                    isRequired: true, requiresPhoto: false, sortOrder: 9 },
        { templateId: ceramic.id, label: 'Curing instructions explained to customer', labelFr: 'Instructions de séchage expliquées au client',  isRequired: true, requiresPhoto: false, sortOrder: 10 },
        { templateId: ceramic.id, label: 'After photos uploaded',                     labelFr: 'Photos après téléversées',                     isRequired: true, requiresPhoto: true,  sortOrder: 11 },
        { templateId: ceramic.id, label: 'Customer signed off on completed work',     labelFr: 'Client a approuvé le travail complété',         isRequired: true, requiresPhoto: false, sortOrder: 12 },
      ],
    });
    console.log('  ✅ Ceramic coating checklist template created');

    // Interior only template
    const interior = await prisma.checklistTemplate.create({
      data: {
        name: 'Interior Detail',
        nameFr: 'Détail intérieur',
        serviceType: 'INTERIOR_ONLY',
        isDefault: true,
      },
    });

    await prisma.checklistTemplateItem.createMany({
      data: [
        { templateId: interior.id, label: 'Arrived at customer location',   labelFr: 'Arrivé chez le client',          isRequired: true,  requiresPhoto: false, sortOrder: 1 },
        { templateId: interior.id, label: 'Before photos uploaded',          labelFr: 'Photos avant téléversées',       isRequired: true,  requiresPhoto: true,  sortOrder: 2 },
        { templateId: interior.id, label: 'Full vacuum completed',            labelFr: 'Aspiration complète effectuée',  isRequired: true,  requiresPhoto: false, sortOrder: 3 },
        { templateId: interior.id, label: 'Seats cleaned & conditioned',      labelFr: 'Sièges nettoyés et conditionnés',isRequired: true,  requiresPhoto: false, sortOrder: 4 },
        { templateId: interior.id, label: 'Dashboard & panels cleaned',       labelFr: 'Tableau de bord et panneaux nettoyés', isRequired: true, requiresPhoto: false, sortOrder: 5 },
        { templateId: interior.id, label: 'Windows cleaned (interior)',        labelFr: 'Vitres nettoyées (intérieur)',    isRequired: true,  requiresPhoto: false, sortOrder: 6 },
        { templateId: interior.id, label: 'Floor mats cleaned',               labelFr: 'Tapis nettoyés',                 isRequired: false, requiresPhoto: false, sortOrder: 7 },
        { templateId: interior.id, label: 'After photos uploaded',            labelFr: 'Photos après téléversées',       isRequired: true,  requiresPhoto: true,  sortOrder: 8 },
        { templateId: interior.id, label: 'Customer reviewed vehicle',        labelFr: 'Client a inspecté le véhicule',  isRequired: true,  requiresPhoto: false, sortOrder: 9 },
      ],
    });
    console.log('  ✅ Interior detail checklist template created');

  } else {
    console.log(`ℹ️  Checklist templates already exist (${existingTemplates}). Skipping.`);
  }

  // ── Training Modules (sample) ─────────────────────────────────────────────
  console.log('🌱 Seeding sample training modules...');

  const existingModules = await prisma.trainingModule.count();
  if (existingModules === 0) {

    await prisma.trainingModule.createMany({
      data: [
        {
          title: 'Welcome to the Team',
          titleFr: 'Bienvenue dans l\'équipe',
          description: 'Introduction to Prestige Plus Detailing standards and culture.',
          descriptionFr: 'Introduction aux standards et à la culture de Prestige Plus Detailing.',
          content: '# Welcome\n\nThis module covers our company values, professionalism standards, and what we expect from every detailer on the team.\n\n## Core Values\n- Quality over speed\n- Customer communication always\n- Document everything with photos\n- Leave every vehicle better than you found it',
          contentFr: '# Bienvenue\n\nCe module couvre nos valeurs d\'entreprise et nos standards de professionnalisme.',
          category: 'GENERAL',
          level: 'BEGINNER',
          isPublished: true,
          isRequired: true,
          sortOrder: 1,
          estimatedMinutes: 10,
        },
        {
          title: 'Before & After Photo Standards',
          titleFr: 'Standards des photos avant/après',
          description: 'How to take professional before and after photos for every job.',
          descriptionFr: 'Comment prendre des photos avant/après professionnelles pour chaque travail.',
          content: '# Photo Standards\n\n## Before Photos\nTake before photos from these angles:\n1. Full front\n2. Full rear\n3. Driver side\n4. Passenger side\n5. Interior overview\n6. Any existing damage (close-up)\n\n## After Photos\nMatch the same angles as before photos.\nEnsure good lighting. No blurry photos.\n\n## Upload Requirements\n- Upload all photos before marking job complete\n- Label damage photos clearly',
          contentFr: '# Standards des photos\n\n## Photos avant\nPrenez des photos depuis ces angles...',
          category: 'PHOTO_STANDARDS',
          level: 'BEGINNER',
          isPublished: true,
          isRequired: true,
          sortOrder: 2,
          estimatedMinutes: 15,
        },
        {
          title: 'Job Status Update Rules',
          titleFr: 'Règles de mise à jour du statut',
          description: 'When and how to update your job status in the dashboard.',
          descriptionFr: 'Quand et comment mettre à jour votre statut de travail dans le tableau de bord.',
          content: '# Job Status Rules\n\n## Status Flow\n`CONFIRMED` → `EN_ROUTE` → `STARTED` → `IN_PROGRESS` → `COMPLETED`\n\n## Rules\n- Set **EN_ROUTE** when you leave for the customer\n- Set **STARTED** when you arrive and introduce yourself\n- Set **IN_PROGRESS** when actual work begins\n- Set **COMPLETED** only after:\n  - All checklist items done\n  - After photos uploaded\n  - Customer has reviewed the vehicle\n\n## Never\n- Mark complete without photos\n- Skip the checklist',
          contentFr: '# Règles de statut\n\nFlux de statut: CONFIRMÉ → EN ROUTE → DÉMARRÉ → EN COURS → COMPLÉTÉ',
          category: 'JOB_WORKFLOW',
          level: 'BEGINNER',
          isPublished: true,
          isRequired: true,
          sortOrder: 3,
          estimatedMinutes: 10,
        },
        {
          title: 'Ceramic Coating Application',
          titleFr: 'Application du revêtement céramique',
          description: 'Full ceramic coating procedure from prep to cure.',
          descriptionFr: 'Procédure complète de revêtement céramique de la préparation au séchage.',
          content: '# Ceramic Coating Procedure\n\n## Step 1 — Decontamination\n1. Two-bucket wash method\n2. Iron remover spray\n3. Clay bar entire vehicle\n4. IPA wipe-down\n\n## Step 2 — Paint Inspection\n- Check for swirls, scratches, oxidation\n- Document all findings with photos\n- Discuss correction needs with customer\n\n## Step 3 — Polish (if needed)\n- Single stage polish for light swirls\n- Multi-stage for heavy correction\n\n## Step 4 — Coating Application\n- IPA final wipe\n- Apply coating panel by panel\n- Level with microfibre towel\n- Cure time: 24–48 hours\n\n## Step 5 — Customer Handoff\n- Explain no washing for 7 days\n- No parking under trees\n- Provide care card',
          contentFr: '# Procédure de revêtement céramique\n\n## Étape 1 — Décontamination\n...',
          category: 'CERAMIC_COATING',
          level: 'ADVANCED',
          isPublished: true,
          isRequired: false,
          sortOrder: 4,
          estimatedMinutes: 30,
        },
        {
          title: 'Customer Communication Standards',
          titleFr: 'Standards de communication client',
          description: 'How to communicate professionally with clients before, during, and after a job.',
          descriptionFr: 'Comment communiquer professionnellement avec les clients avant, pendant et après un travail.',
          content: '# Customer Communication\n\n## Before the Job\n- Confirm appointment 1 hour before\n- Send your ETA when leaving\n- Text if running more than 10 minutes late\n\n## During the Job\n- Introduce yourself by name\n- Walk around the vehicle together\n- Point out existing damage immediately\n- Do not enter the vehicle without permission\n\n## After the Job\n- Walk around with the customer\n- Show the before/after difference\n- Explain any care instructions\n- Ask if they have any questions\n\n## Never\n- Be on your phone during a job\n- Leave without customer approval\n- Promise results you cannot deliver',
          contentFr: '# Communication client\n\n## Avant le travail\n...',
          category: 'CUSTOMER_COMMUNICATION',
          level: 'BEGINNER',
          isPublished: true,
          isRequired: true,
          sortOrder: 5,
          estimatedMinutes: 15,
        },
      ],
    });
    console.log('  ✅ Sample training modules created');

    // Add quiz to first module
    const welcomeModule = await prisma.trainingModule.findFirst({
      where: { title: 'Welcome to the Team' },
    });

    if (welcomeModule) {
      await prisma.trainingQuiz.createMany({
        data: [
          {
            moduleId: welcomeModule.id,
            question: 'What should you prioritize on every job?',
            questionFr: 'Que devez-vous prioriser sur chaque travail?',
            options: JSON.stringify(['Speed', 'Quality over speed', 'Price negotiation', 'Finishing early']),
            optionsFr: JSON.stringify(['La vitesse', 'La qualité avant la vitesse', 'La négociation de prix', 'Finir tôt']),
            correctIdx: 1,
            explanation: 'Quality over speed is our core value. A rushed job reflects poorly on the entire company.',
            explanationFr: 'La qualité avant la vitesse est notre valeur fondamentale.',
            sortOrder: 1,
          },
          {
            moduleId: welcomeModule.id,
            question: 'When must you document existing damage?',
            questionFr: 'Quand devez-vous documenter les dommages existants?',
            options: JSON.stringify(['Only if the customer asks', 'Never, it is not your problem', 'Always, with photos, before starting work', 'Only for ceramic coating jobs']),
            optionsFr: JSON.stringify(['Seulement si le client demande', 'Jamais', 'Toujours, avec des photos, avant de commencer', 'Seulement pour le céramique']),
            correctIdx: 2,
            explanation: 'Always document existing damage with photos before starting. This protects both you and the customer.',
            explanationFr: 'Documentez toujours les dommages existants avec des photos avant de commencer.',
            sortOrder: 2,
          },
        ],
      });
      console.log('  ✅ Sample quiz added to Welcome module');
    }

  } else {
    console.log(`ℹ️  Training modules already exist (${existingModules}). Skipping.`);
  }

  console.log('\n✅ Seeding finished.');
}

async function createDetailerRecord(supabaseUserId, name, email, phone) {
  const detailer = await prisma.detailer.create({
    data: { name, email, phone, supabaseUserId, isActive: true },
  });
  console.log(`✅ Created detailer: ${detailer.name} (${detailer.email})`);
}

main()
  .catch((e) => { console.error('❌ Seeding error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
