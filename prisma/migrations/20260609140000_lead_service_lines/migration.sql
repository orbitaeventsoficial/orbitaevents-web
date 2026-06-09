-- Línies del BOLO viu al lead (mirall de booking_service_lines).
CREATE TABLE "lead_service_lines" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
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
  CONSTRAINT "lead_service_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lead_service_lines_leadId_idx" ON "lead_service_lines"("leadId");
CREATE INDEX "lead_service_lines_collaboratorId_idx" ON "lead_service_lines"("collaboratorId");
ALTER TABLE "lead_service_lines" ADD CONSTRAINT "lead_service_lines_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_service_lines" ADD CONSTRAINT "lead_service_lines_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
