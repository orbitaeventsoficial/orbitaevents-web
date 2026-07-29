-- CreateEnum
CREATE TYPE "SocialPostOriginType" AS ENUM ('MANUAL', 'BOOKING', 'TESTIMONIAL', 'PORTFOLIO', 'UPCOMING_EVENT');

-- AlterTable
ALTER TABLE "social_posts"
ADD COLUMN "originType" "SocialPostOriginType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "originId" TEXT,
ADD COLUMN "originLabel" TEXT;

-- Backfill existing booking-derived posts into the canonical origin fields.
UPDATE "social_posts"
SET "originType" = 'BOOKING',
    "originId" = "bookingId"
WHERE "bookingId" IS NOT NULL
  AND "originId" IS NULL;

-- CreateIndex
CREATE INDEX "social_posts_originType_originId_idx" ON "social_posts"("originType", "originId");
