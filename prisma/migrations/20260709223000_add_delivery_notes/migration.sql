-- Albarans operatius de reserva (#1848).
CREATE TYPE "DeliveryNoteStatus" AS ENUM ('DRAFT', 'DELIVERED', 'SIGNED', 'CANCELLED');

CREATE TABLE "delivery_notes" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT,
    "clientName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "notes" TEXT,
    "status" "DeliveryNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveredAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "signatureIp" TEXT,
    "signatureUa" TEXT,
    "pdfUrl" TEXT,
    "pdfKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_notes_reference_key" ON "delivery_notes"("reference");
CREATE INDEX "delivery_notes_bookingId_idx" ON "delivery_notes"("bookingId");
CREATE INDEX "delivery_notes_customerId_idx" ON "delivery_notes"("customerId");
CREATE INDEX "delivery_notes_status_idx" ON "delivery_notes"("status");
CREATE INDEX "delivery_notes_createdAt_idx" ON "delivery_notes"("createdAt");

ALTER TABLE "delivery_notes"
  ADD CONSTRAINT "delivery_notes_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_notes"
  ADD CONSTRAINT "delivery_notes_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
