-- Camps de nurturing per a la seqüència de follow-ups automàtics
ALTER TABLE "leads" ADD COLUMN "nurturingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN "lastNurturingAt" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "nurturingDone" BOOLEAN NOT NULL DEFAULT false;
