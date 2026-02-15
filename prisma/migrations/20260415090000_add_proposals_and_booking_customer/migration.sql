-- Link bookings to customers
ALTER TABLE "bookings"
ADD COLUMN IF NOT EXISTS "customerId" TEXT;

DO $$
BEGIN
  ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "bookings_customerId_idx" ON "bookings"("customerId");

-- Backfill booking.customerId from linked lead where possible
UPDATE "bookings" b
SET "customerId" = l."customerId"
FROM "leads" l
WHERE b."leadId" = l."id"
  AND b."customerId" IS NULL
  AND l."customerId" IS NOT NULL;

-- Proposal status enum
DO $$
BEGIN
  CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Proposals table
CREATE TABLE IF NOT EXISTS "proposals" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "leadId" TEXT,
  "bookingId" TEXT,
  "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "locale" TEXT NOT NULL DEFAULT 'es',
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "validityDays" INTEGER NOT NULL DEFAULT 15,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 21,
  "vatAmount" DOUBLE PRECISION NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "snapshot" JSONB NOT NULL,
  "pdfUrl" TEXT,
  "pdfKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "proposals_reference_key" ON "proposals"("reference");
CREATE INDEX IF NOT EXISTS "proposals_customerId_createdAt_idx" ON "proposals"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "proposals_leadId_idx" ON "proposals"("leadId");
CREATE INDEX IF NOT EXISTS "proposals_bookingId_idx" ON "proposals"("bookingId");
CREATE INDEX IF NOT EXISTS "proposals_status_createdAt_idx" ON "proposals"("status", "createdAt");

DO $$
BEGIN
  ALTER TABLE "proposals"
  ADD CONSTRAINT "proposals_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "proposals"
  ADD CONSTRAINT "proposals_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "proposals"
  ADD CONSTRAINT "proposals_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
