-- Add lostReason + lostAt to leads for loss audit trail
ALTER TABLE "leads" ADD COLUMN "lostReason" TEXT;
ALTER TABLE "leads" ADD COLUMN "lostAt" TIMESTAMP(3);

-- Index for querying losses by reason
CREATE INDEX "leads_lostReason_idx" ON "leads"("lostReason");
