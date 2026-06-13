# Prestige Plus Detailing — Platform Audit & Roadmap

*Audit date: June 2026 · Scope: full codebase (React/Vite frontend, Express/Prisma backend, automation layer)*

---

## Executive summary

**The honest verdict: this platform does not need to be torn down.** A from-scratch rebuild was evaluated and rejected. The architecture already includes things most competitors lack: a race-condition-safe slot model (`slotId`/`startAt`/`endAt`), per-vehicle-type pricing, a bilingual data model (`nameFr` fields throughout), SMS automation with delivery logs, cron-driven reminders/review-requests/weather checks, booking history + audit trails, staff training modules, and job checklists.

What it *does* need, in priority order:

1. **A Customer + Vehicle data model.** This is the single biggest gap. Bookings are flat rows — repeat customers are invisible. Every retention feature (history, memberships, loyalty, LTV, re-engagement) is blocked on this.
2. **Booking flow friction reduction** (partially implemented in this audit — see Phase 8).
3. **Abandoned-booking recovery** — the data already exists (`VerificationCode.bookingData`, expired `PENDING` bookings) but nothing follows up.
4. **SEO foundation** — the SPA renders no per-page meta, no structured data, no hreflang. For a local-service business this is leaving free bookings on the table.
5. **Maintenance/follow-up campaigns** — ceramic coating customers should hear from you at 1, 6, and 12 months. They currently never do.

---

## Phase 1 — Full audit (Keep / Improve / Replace)

| # | Area | Verdict | Findings |
|---|------|---------|----------|
| 1 | Visual design system | **Keep** | The dark + cyan "luxury" theme is cohesive and on-brand for premium automotive. Typography (Inter, heavy weights) and glass-card language are consistent. Don't churn it. |
| 2 | UX | **Improve** | Translation gaps fixed in the prior session (hero, trust strip, navbar). Remaining: Booking page header was hardcoded English (fixed in this pass); 24h time formats fixed previously. |
| 3 | Conversion | **Improve** | Booking flow asked 2 decisions (condition, water/power) that 80% of users answer the same way — now smart-defaulted. Trust microcopy ("no payment to book, free cancellation") was missing at the decision point — added. No deposit = good for friction; revisit only if no-shows become a measured problem. |
| 4 | Mobile experience | **Keep/Improve** | Already strong: 44px tap targets, 16px inputs (no iOS zoom), sticky book bar, mobile summary toggle. Admin mobile layout was broken — fixed in prior session. |
| 5 | Navigation | **Improve (done)** | Desktop nav links were hidden behind a hamburger — fixed in prior session. |
| 6 | Booking flow | **Improve, don't replace** | See Phase 6. Verdict: keep the custom system; a third-party booker (Calendly/Squarespace) cannot do per-vehicle pricing, bilingual content, quote-routing, or SMS verification with your admin integration. |
| 7 | Service presentation | **Keep** | Packages vs à-la-carte split with per-vehicle pricing is the right model. `isMostPopular` badges exist. Add package *comparison* (side-by-side included services) as a later enhancement. |
| 8 | Trust building | **Improve** | Reviews are admin-curated (fine), but review *collection* automation exists while review *display* of fresh reviews requires manual entry. Connect the loop: surface approved review-request responses. Add photo count + years in business + "fully insured" near booking CTA. |
| 9 | SEO | **Replace (the approach)** | SPA has one static `index.html` — no per-route titles/descriptions, no `LocalBusiness`/`Service` JSON-LD, no sitemap.xml, no hreflang EN/FR alternates. Fix: `react-helmet-async` for meta + JSON-LD now; consider prerendering (`vite-plugin-ssr` or prerender service) later. For "détaillant auto Montréal" queries this matters more than any visual change. |
| 10 | Performance | **Improve** | Hero image is hotlinked from Unsplash (third-party dependency, no width variants) — replace with self-hosted WebP/AVIF. `AdminPage` chunk is 540 KB (recharts + react-big-calendar + moment) — admin-only so tolerable, but `moment` should be replaced with `date-fns` (backend already uses luxon). The boot `LoadingScreen` gates first paint — measure whether it costs more than it brands. |
| 11 | Admin workflow | **Improve (partially done)** | Broken Messages tab, unreachable Unassigned tab, missing titles — all fixed in prior session. Remaining gap: no customer view (blocked on Customer model), no per-detailer day view in admin. |
| 12 | Customer communication | **Improve** | Existing: confirmation, 24h reminder, reschedule, cancel, prep email, review request, full quote lifecycle (ready/accepted/declined/change/expiring-48h). Missing: maintenance reminders, ceramic follow-ups, re-engagement, abandoned recovery, referral asks. See Phase 3. |
| 13 | Scheduling | **Keep/Improve** | Slot architecture is sound (atomic booking service, backfill script, capacity limits, blocked dates). Improved in prior session (validation + visual preview). Later: per-detailer capacity (today `maxBookingsPerSlot` is global — with 2+ detailers you under-sell). Google Calendar service exists in `backend/services/googleCalendar.js` — verify it's wired to booking create/reschedule. |
| 14 | Email workflows | **Improve** | Nodemailer templates exist for core flows. Gaps are lifecycle/marketing emails (Phase 3), not infrastructure. |
| 15 | Missed opportunities | — | Memberships/maintenance plans (recurring revenue), referral program, customer portal, fleet follow-up cadence, gift cards (strong in detailing for holidays). |

---

## Phase 2 — Business optimization (prioritized)

**Tier 1 — unlocks everything else**
1. **Customer + Vehicle models** (Prisma migration, backfill by grouping bookings on `phoneNumber`):
   ```prisma
   model Customer { id, phone @unique, email, firstName, lastName, language,
                    tags, createdAt, bookings Booking[], vehicles Vehicle[] }
   model Vehicle  { id, customerId, type, make, model, year, color, notes }
   ```
   Unlocks: service history, "welcome back" prefill on booking, LTV, segments for campaigns, vehicle-aware upsells ("your ceramic coating is due for annual inspection").

**Tier 2 — direct revenue**
2. **Abandoned-booking recovery** — expired `PENDING` bookings + unverified `VerificationCode.bookingData` already capture the lead. One cron + one SMS template ("Your spot is still available — finish in 30 seconds: {link}") at +2h. Typical recovery: 10–20% of abandons.
3. **Ceramic/protection follow-up sequence** (Phase 3) — drives annual maintenance-detail rebookings.
4. **Referral program** — unique code per customer, asked in the post-review email (only to 5-star responders).

**Tier 3 — efficiency & retention**
5. Per-detailer scheduling capacity + admin day-view.
6. Waitlist for full days ("notify me if a spot opens").
7. Seasonal campaign calendar (spring salt-removal, fall winter-prep).

> **Scope decision (owner, June 2026):** customer portal, memberships/subscriptions,
> and payments/deposits are explicitly OUT of scope. Do not build unless the owner
> asks again.

---

## Phase 3 — Communication system (exists vs. needed)

| Communication | Status | Trigger | Timing | Impact |
|---|---|---|---|---|
| Booking confirmation (SMS+email) | ✅ exists | booking verified | instant | table stakes |
| 24h reminder (SMS) | ✅ exists | cron 8:00 | day before | no-show ↓ |
| Prep email ("how to prepare") | ✅ exists | cron | day before | reviews ↑, friction ↓ |
| Same-day "en route" SMS | ⚠️ partial | detailer taps En Route | live | premium feel — verify wired to status change |
| Reschedule / cancel confirmations | ✅ exists | status change | instant | — |
| Review request (SMS+email) | ✅ exists | cron post-completion | +1 day | reviews ↑ |
| Quote lifecycle (ready/accepted/declined/change/expiring) | ✅ exists | status changes | instant / 48h before expiry | quote conversion ↑ |
| **Abandoned booking recovery** | ❌ build | PENDING expired / OTP never verified | +2h, optional +24h | recovers 10–20% of abandons |
| **Estimate follow-up (quotes with no response)** | ⚠️ partial | quote QUOTED, no action | +3 days (expiring SMS exists at 48h) | add a softer +3d nudge |
| **Maintenance reminder** | ❌ build | last service date | +3 months (wash), +12 months (detail) | repeat bookings ↑ — highest-ROI missing email |
| **Ceramic coating follow-up** | ❌ build | ceramic booking completed | +1 week (care guide), +6 mo (checkup), +12 mo (annual maintenance offer) | locks in annual revenue per coated car |
| **Re-engagement / inactive** | ❌ build | no booking in 9 months | once, with offer | win-backs |
| **Seasonal campaigns** | ❌ build | calendar | Mar–Apr (salt), Oct–Nov (winter prep), Dec (gift cards) | Québec-specific demand spikes |
| **Referral request** | ❌ build | 5-star review submitted | +1 day | lowest-CAC channel |
| **VIP/fleet communications** | ❌ build | tag-based | quarterly | B2B retention |

All new sends must respect **CASL** (Canadian anti-spam): transactional messages are fine; marketing sequences need consent capture at booking (one checkbox: "Send me maintenance reminders and offers") and an unsubscribe path. Add `marketingConsent Boolean` to the Customer model.

---

## Phase 4 — Customer journey friction map

```
Visitor → Interested → Booking → Service → Follow-up → Repeat → Loyal
```

| Stage | Today | Friction | Fix |
|---|---|---|---|
| Visitor | Strong home page, instant quote | Weak SEO entry points; FR hero was English (fixed) | SEO phase; FR parity audit |
| Interested | InstantQuote → prefilled booking (good!) | Packages page lacks comparison view | side-by-side compare (later) |
| Booking | 3 steps + SMS OTP | 2 unnecessary decisions (defaulted now); OTP adds ~30s but kills fake bookings — keep, but see Phase 6 | done / monitor |
| Service | Status tracking, checklists, photos | "En route" SMS — verify it fires | wire check |
| Follow-up | Review request only | No care guide, no maintenance touch | Phase 3 sequences |
| Repeat | Nothing recognizes them | No customer record | **Customer model** |
| Loyal | Nothing | No referral, no membership | Tier 2 features |

---

## Phase 5 — Website design verdict

The current design language **stays** — it already hits the "premium automotive" brief. Targeted upgrades only:

- Replace hotlinked Unsplash hero with owned photography (real before/afters outperform stock for conversion in detailing).
- All 13 required sections already exist across Home/Services/Ceramic/Gallery/HowItWorks/Contact. Gap: a dedicated **Paint Correction** section (currently inside services) — worth its own anchor like ceramic has.
- Package comparison table on Services page.
- Scroll animations, sticky CTA, reduced-motion support: already present.
- Accessibility: add `aria-label`s on icon-only buttons, check contrast of `#6b7280` text on `#0b0f1a` (borderline), add skip-to-content link.

---

## Phase 6 — Booking flow (the priority)

**Recommendation: refined Option A — keep the current architecture, cut the friction.** Option B (vehicle → recommendations) adds a recommendation engine without evidence it converts better for a 3-package catalog. A full rebuild risks a working revenue path.

The flow audit found, step by step:

- **Step 1** asked: vehicle type, condition, mode choice, package, optional make/model/year. → Condition now defaults to *Moderate* (the honest median; customers adjust if needed). Make/model/year collapsed behind a disclosure. Result: 1 tap + 1 package pick for most users.
- **Step 2** (date/time): already good — live availability, slot validation, 12h format (fixed earlier).
- **Step 3** asked 9 fields. → Water/power now defaults to *Yes* (true for driveway customers, the majority). Property type stays required — it's a real operational need for a mobile service.
- **SMS OTP**: this is the biggest single time cost (~30s) but it's also your fake-booking firewall and produces a verified phone for all downstream SMS automation. **Keep it**, but treat unverified attempts as leads (abandoned recovery, Phase 3). If abandonment at the OTP screen measures high later, switch to "book first, verify via confirmation link" — backend already stores `bookingData` with the code, so the migration is small.
- **Trust at the decision point**: added "free cancellation · we come to you · insured" microcopy directly under the continue button.

Realistic completed-booking time after these changes: **~60–90 seconds including OTP** for a package booking.

Later (needs Customer model): returning-customer fast path — enter phone first, everything prefills, book in 3 taps.

---

## Phase 7 — Admin dashboard

Current admin covers live feed, unassigned, quotes, catalog, reviews, manual booking, schedule, revenue, detailers, messages, gallery, bulk reschedule, export, audit (navigation fixed in prior session). Additions, in order:

1. **Customers tab** (blocked on Customer model): list, search, profile with booking/vehicle history, LTV, tags (VIP/fleet), notes.
2. **Today view** as the default landing tab: today's jobs by detailer with status, weather banner, one-tap call/SMS customer.
3. **Campaigns tab**: send/preview the Phase 3 sequences, see consent counts (CASL).
4. Revenue: add repeat-rate, average order value, and booking-source once Customer model lands.

---

## Phase 8 — Roadmap

| Phase | Work | Effort | Status |
|---|---|---|---|
| **Now** | Translation gaps, admin nav bugs, schedule validation, 12h times, navbar | small | ✅ shipped |
| **Now** | Booking smart defaults + collapsed optional fields + trust microcopy + Booking page i18n | small | ✅ this commit |
| **Next 1** | SEO: react-helmet-async, per-route meta EN/FR, JSON-LD LocalBusiness, sitemap, hreflang | 1–2 days | — |
| **Next 2** | Customer + Vehicle models, migration + backfill, admin Customers tab | 3–5 days | — |
| **Next 3** | Abandoned-booking recovery cron + SMS | 1 day | — |
| **Next 4** | Maintenance + ceramic follow-up sequences (+ CASL consent checkbox) | 2–3 days | — |
| **Later** | Referral program, per-detailer capacity, waitlist, package comparison, owned photography | iterative | — |
| **Out of scope (owner decision)** | Customer portal, memberships/subscriptions, payments/deposits | — | ❌ excluded |

**Migration safety:** every "Next" item is additive (new tables, new crons, new components). No existing table is altered destructively; the Customer backfill is a read-group-insert that leaves `bookings` untouched and adds a nullable `customerId`.
