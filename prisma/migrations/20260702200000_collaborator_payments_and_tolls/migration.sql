-- Peatges de la ruta (manual; cost real de transport) — #1364
ALTER TABLE "leads" ADD COLUMN "tollsEur" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN "tollsEur" DOUBLE PRECISION;

-- Pagament a un col·laborador per la seva part d'un bolo (liquidació) — #1364
CREATE TABLE "collaborator_payments" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "bookingId" TEXT,
    "leadId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborator_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "collaborator_payments_collaboratorId_idx" ON "collaborator_payments"("collaboratorId");
CREATE INDEX "collaborator_payments_bookingId_idx" ON "collaborator_payments"("bookingId");
CREATE INDEX "collaborator_payments_leadId_idx" ON "collaborator_payments"("leadId");

ALTER TABLE "collaborator_payments" ADD CONSTRAINT "collaborator_payments_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collaborator_payments" ADD CONSTRAINT "collaborator_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "collaborator_payments" ADD CONSTRAINT "collaborator_payments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
