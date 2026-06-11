/**
 * backfill-slots.js
 *
 * One-time migration script.
 * Run AFTER the schema migration adds slotId / startAt / endAt columns.
 *
 * Usage:
 *   node prisma/backfill-slots.js
 *
 * What it does:
 *   1. Loads the current schedule config (from AppConfig table)
 *   2. For each non-canceled booking with startAt = null:
 *      a. Tries to resolve the slotId from the stored time label
 *      b. Computes startAt = date + slot.startHour in America/Toronto
 *      c. Computes endAt  = startAt + (estimatedDuration or 4h) + 30min buffer
 *      d. Updates the row
 *   3. Rows whose time label can't be resolved are reported (not deleted).
 *   4. Reports any interval conflicts found in the backfilled data.
 */

'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { DateTime }     = require('luxon');
const prisma           = new PrismaClient();

const TZ              = 'America/Toronto';
const DEFAULT_SLOTS   = [
  { id: 'morning',   label: '8:00 AM',  startHour: 8  },
  { id: 'afternoon', label: '12:00 PM', startHour: 12 },
  { id: 'afternoon', label: '1:00 PM',  startHour: 13 },
];
const DEFAULT_DURATION_MINUTES = 240; // 4 hours
const DEFAULT_BUFFER_MINUTES   = 30;  // 30 minutes

async function loadSlots() {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: 'schedule_config' } });
    if (row?.value?.timeSlots?.length) {
      console.log('[Backfill] Using slots from AppConfig:', row.value.timeSlots.map(s => s.label).join(', '));
      return row.value.timeSlots;
    }
  } catch {}
  console.log('[Backfill] No AppConfig found — using default slots');
  return DEFAULT_SLOTS;
}

function resolveSlot(time, slots) {
  // Try exact label match first, then case-insensitive
  return slots.find(s => s.label === time)
      || slots.find(s => s.label?.toLowerCase() === time?.toLowerCase());
}

function computeStartAt(dateValue, startHour) {
  // dateValue is a JS Date from Prisma (might be UTC midnight)
  const isoDate = dateValue instanceof Date
    ? DateTime.fromJSDate(dateValue, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
    : String(dateValue).split('T')[0];

  return DateTime.fromObject(
    { year: parseInt(isoDate.slice(0,4)), month: parseInt(isoDate.slice(5,7)), day: parseInt(isoDate.slice(8,10)), hour: startHour, minute: 0, second: 0 },
    { zone: TZ }
  ).toJSDate();
}

function computeEndAt(startAt, durationMinutes, bufferMinutes) {
  return new Date(startAt.getTime() + (durationMinutes + bufferMinutes) * 60 * 1000);
}

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('  Prestige Plus — Backfill Slots       ');
  console.log('═══════════════════════════════════════\n');

  const slots = await loadSlots();

  // Find all bookings that need backfilling
  const bookings = await prisma.booking.findMany({
    where: {
      startAt: null,
      status:  { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: {
      id:                true,
      confirmationCode:  true,
      date:              true,
      time:              true,
      slotId:            true,
      estimatedDuration: true,
      status:            true,
    },
    orderBy: { date: 'asc' },
  });

  console.log(`[Backfill] Found ${bookings.length} booking(s) needing backfill\n`);

  const unresolved = [];
  let   updated    = 0;

  for (const b of bookings) {
    const slot = resolveSlot(b.time, slots)
               || (b.slotId ? slots.find(s => s.id === b.slotId) : null);

    if (!slot) {
      unresolved.push({ id: b.id, code: b.confirmationCode, time: b.time, date: b.date });
      continue;
    }

    const durationMin = b.estimatedDuration || DEFAULT_DURATION_MINUTES;
    const startAt     = computeStartAt(b.date, slot.startHour);
    const endAt       = computeEndAt(startAt, durationMin, DEFAULT_BUFFER_MINUTES);

    await prisma.booking.update({
      where: { id: b.id },
      data: {
        slotId:  slot.id,
        startAt,
        endAt,
        // Normalise time label to the canonical one from config
        time:    slot.label,
      },
    });

    console.log(`  ✅ ${b.confirmationCode} | ${b.date?.toISOString()?.slice(0,10)} | "${b.time}" → ${slot.id} | startAt: ${startAt.toISOString()}`);
    updated++;
  }

  // ── Report unresolved ───────────────────────────────────────────────────────
  if (unresolved.length > 0) {
    console.log('\n⚠️  UNRESOLVED (time label not matching any configured slot):');
    unresolved.forEach(u =>
      console.log(`  ❌ ${u.code} | date: ${String(u.date).slice(0,10)} | time: "${u.time}"`)
    );
    console.log('\n  → These bookings still have startAt=null. Fix by:');
    console.log('    a) Manually updating time label in the DB to match a configured slot, then re-running this script.');
    console.log('    b) Assigning them via the admin calendar after checking for conflicts.');
  }

  // ── Check for interval conflicts in the newly backfilled data ──────────────
  console.log('\n[Backfill] Checking for interval conflicts...');
  const active = await prisma.booking.findMany({
    where: {
      startAt: { not: null },
      status:  { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: { id: true, confirmationCode: true, startAt: true, endAt: true },
    orderBy: { startAt: 'asc' },
  });

  const conflicts = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (!a.endAt || !b.startAt) continue;
      if (a.startAt < b.endAt && a.endAt > b.startAt) {
        conflicts.push({ a: a.confirmationCode, b: b.confirmationCode });
      }
    }
  }

  if (conflicts.length > 0) {
    console.log('\n⚠️  INTERVAL CONFLICTS FOUND (DO NOT add unique index until resolved):');
    conflicts.forEach(c => console.log(`  ⚡ ${c.a} ↔ ${c.b}`));
    console.log('\n  → Review these pairs in the admin calendar and manually reschedule/cancel one.');
  } else {
    console.log('  ✅ No interval conflicts found — safe to add the unique index (see migration.sql Step 5)');
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log(`  Updated:    ${updated}`);
  console.log(`  Unresolved: ${unresolved.length}`);
  console.log(`  Conflicts:  ${conflicts.length}`);
  console.log('═══════════════════════════════════════\n');

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('Backfill failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
