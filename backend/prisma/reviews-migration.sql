-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor
-- Creates the reviews table used by the admin panel + ReviewsSection
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "reviews" (
  "id"        SERIAL PRIMARY KEY,
  "name"      VARCHAR(100) NOT NULL,
  "rating"    INTEGER      NOT NULL DEFAULT 5,
  "vehicle"   VARCHAR(100),
  "text"      TEXT         NOT NULL,
  "source"    VARCHAR(50)  NOT NULL DEFAULT 'Google',
  "isActive"  BOOLEAN      NOT NULL DEFAULT true,
  "sortOrder" INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for the public endpoint (only active reviews, ordered)
CREATE INDEX IF NOT EXISTS "reviews_isActive_sortOrder_idx"
  ON "reviews" ("isActive", "sortOrder");


-- ═══════════════════════════════════════════════════════════════════════════════
-- Add to schema.prisma — inside the model section (alongside other models)
-- ═══════════════════════════════════════════════════════════════════════════════

/*
model Review {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  rating    Int      @default(5)
  vehicle   String?  @db.VarChar(100)
  text      String   @db.Text
  source    String   @default("Google") @db.VarChar(50)
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive, sortOrder])
  @@map("reviews")
}
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- After running the SQL, run this in your backend terminal:
--   npx prisma db pull   (syncs schema from DB)
-- OR add the model above manually to schema.prisma then:
--   npx prisma generate  (regenerates the client — no migration needed)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed some initial reviews (optional — you can add them via admin panel instead)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO "reviews" ("name","rating","vehicle","text","source","isActive","sortOrder","updatedAt") VALUES
  ('Marc-André L.',  5, 'BMW M4',        'The ceramic coating is unreal — water just sheets off and the gloss is mirror-deep. Booked, they came to me, done in a day.',           'Google',   true, 1, NOW()),
  ('Jessica T.',     5, 'Tesla Model 3', 'Best detailing experience in Montréal. Professional, on time, and my white paint has never looked this clean.',                          'Google',   true, 2, NOW()),
  ('Karim B.',       5, 'Audi Q5',       'Paid for the 5-year ceramic and it was worth every dollar. The depth on the paint after correction is incredible.',                       'Facebook', true, 3, NOW()),
  ('Sophie R.',      5, 'Range Rover',   'They treat your car like their own. Spotless interior, flawless exterior. Already booked my second car.',                                 'Google',   true, 4, NOW()),
  ('David C.',       5, 'Porsche 911',   'Best detailing service in Montréal, no question. Quick to respond, on time, and the results speak for themselves.',                       'Google',   true, 5, NOW()),
  ('Sarah M.',       5, 'Mercedes C300', 'My car has never looked better. The ceramic coating is absolutely flawless — water just beads right off. True professionals.',            'Google',   true, 6, NOW())
ON CONFLICT DO NOTHING;
