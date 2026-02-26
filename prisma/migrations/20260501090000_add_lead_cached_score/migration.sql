-- AlterTable
ALTER TABLE "leads" ADD COLUMN "cachedScore" INTEGER;
ALTER TABLE "leads" ADD COLUMN "cachedScoreAt" TIMESTAMP(3);
