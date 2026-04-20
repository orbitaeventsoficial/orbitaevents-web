-- Add source, autoRule, dedupeKey and resolutionNote to tasks
ALTER TABLE "tasks" ADD COLUMN "source" TEXT;
ALTER TABLE "tasks" ADD COLUMN "autoRule" TEXT;
ALTER TABLE "tasks" ADD COLUMN "dedupeKey" TEXT;
ALTER TABLE "tasks" ADD COLUMN "resolutionNote" TEXT;

-- Indexes
CREATE UNIQUE INDEX "tasks_dedupeKey_key" ON "tasks"("dedupeKey");
CREATE INDEX "tasks_source_idx" ON "tasks"("source");
CREATE INDEX "tasks_autoRule_idx" ON "tasks"("autoRule");

-- Backfill source from legacy createdBy magic strings
UPDATE "tasks" SET "source" = 'AUTOMATION' WHERE "createdBy" = 'system:auto';
UPDATE "tasks" SET "source" = 'CHECKLIST' WHERE "createdBy" = 'system:daily-checklist';
UPDATE "tasks" SET "source" = 'PACK_PRICING' WHERE "createdBy" = 'system:pack-pricing-check';
UPDATE "tasks" SET "source" = 'BOOKING_COMPLETION' WHERE "createdBy" = 'system:auto-completed';
UPDATE "tasks" SET "source" = 'BOOKING_CREATION' WHERE "createdBy" = 'system:auto-booking-create';
UPDATE "tasks" SET "source" = 'CUSTOMER_CREATION' WHERE "createdBy" = 'system:auto-customer-create';

-- Extract embedded [dedupeKey:X] from description of automation tasks
-- Pattern: any description ending with " [dedupeKey:KEY]" — extract KEY and strip the marker
UPDATE "tasks"
SET
  "dedupeKey" = substring("description" FROM '\[dedupeKey:([^\]]+)\]'),
  "autoRule" = CASE
    WHEN "description" LIKE '%[dedupeKey:sla:%' THEN 'SLA_BROKEN'
    WHEN "description" LIKE '%[dedupeKey:stale:%' THEN 'STALE_LEAD'
    WHEN "description" LIKE '%[dedupeKey:prep:%' THEN 'BOOKING_PREP'
    WHEN "description" LIKE '%[dedupeKey:payment:%' THEN 'PAYMENT_OVERDUE'
    WHEN "description" LIKE '%[dedupeKey:postevent:%' THEN 'POST_EVENT'
    WHEN "description" LIKE '%[dedupeKey:atrisk:%' THEN 'AT_RISK_CLIENT'
    WHEN "description" LIKE '%[dedupeKey:quote:%' THEN 'QUOTE_FOLLOWUP'
  END,
  "description" = regexp_replace("description", '\s*\[dedupeKey:[^\]]+\]', '')
WHERE "source" = 'AUTOMATION'
  AND "description" LIKE '%[dedupeKey:%';
