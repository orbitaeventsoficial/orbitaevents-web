-- Partner billing target for bookings.
ALTER TABLE "bookings"
  ADD COLUMN "billedCollaboratorId" TEXT;

-- Structured service lines for revenue/cost split per booking.
CREATE TYPE "BookingServiceLineKind" AS ENUM (
  'DJ',
  'SOUND_TECH',
  'PROVIDER_SERVICE',
  'EQUIPMENT',
  'OTHER'
);

CREATE TABLE "booking_service_lines" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "collaboratorId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "partyType" TEXT,
  "kind" "BookingServiceLineKind" NOT NULL DEFAULT 'OTHER',
  "label" TEXT NOT NULL,
  "revenueAmount" DOUBLE PRECISION,
  "costAmount" DOUBLE PRECISION,
  "quantity" INTEGER,
  "hours" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "booking_service_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_billedCollaboratorId_idx" ON "bookings"("billedCollaboratorId");
CREATE INDEX "booking_service_lines_bookingId_idx" ON "booking_service_lines"("bookingId");
CREATE INDEX "booking_service_lines_collaboratorId_idx" ON "booking_service_lines"("collaboratorId");

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_billedCollaboratorId_fkey"
  FOREIGN KEY ("billedCollaboratorId") REFERENCES "collaborators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_service_lines"
  ADD CONSTRAINT "booking_service_lines_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_service_lines"
  ADD CONSTRAINT "booking_service_lines_collaboratorId_fkey"
  FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
