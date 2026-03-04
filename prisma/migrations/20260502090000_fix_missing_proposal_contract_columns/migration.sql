DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContractStatus') THEN
    CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'CANCELLED');
  END IF;
END
$$;

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractReference" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractStatus" "ContractStatus";
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractPdfUrl" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractPdfKey" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractSentAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractSignedAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "contractSignedBy" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "depositDueDate" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "finalPaymentDue" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "additionalClauses" TEXT;

CREATE INDEX IF NOT EXISTS "proposals_contractStatus_idx" ON "proposals"("contractStatus");
