-- AlterTable
ALTER TABLE "email_sends" ADD COLUMN "clickedAt" TIMESTAMP(3);
ALTER TABLE "email_sends" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;
