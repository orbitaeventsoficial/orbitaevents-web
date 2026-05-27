-- AlterTable
ALTER TABLE "dossiers" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "dossiers_deletedAt_idx" ON "dossiers"("deletedAt");
