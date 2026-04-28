-- CreateEnum
CREATE TYPE "CustomerLifecycle" AS ENUM ('NEW', 'PROSPECT', 'FIRST_TIME', 'RETURNING', 'VIP', 'DORMANT', 'CHURNED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'X', 'PINTEREST', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('IDEA', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialContentType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'REEL', 'STORY', 'TEXT');

-- CreateEnum
CREATE TYPE "SocialCategory" AS ENUM ('EVENT_SHOWCASE', 'BEHIND_SCENES', 'TESTIMONIAL', 'PROMO', 'TIPS', 'TEAM', 'SEASONAL', 'COLLAB');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "healthScore" INTEGER,
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "lifecycleStage" "CustomerLifecycle" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "referredById" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT[],
    "platforms" "SocialPlatform"[],
    "status" "SocialPostStatus" NOT NULL DEFAULT 'IDEA',
    "contentType" "SocialContentType" NOT NULL DEFAULT 'IMAGE',
    "category" "SocialCategory",
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "mediaUrls" TEXT[],
    "bookingId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "social_posts_scheduledAt_idx" ON "social_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "social_posts_category_idx" ON "social_posts"("category");

-- CreateIndex
CREATE INDEX "social_posts_bookingId_idx" ON "social_posts"("bookingId");

-- CreateIndex
CREATE INDEX "customers_lifecycleStage_idx" ON "customers"("lifecycleStage");

-- CreateIndex
CREATE INDEX "customers_healthScore_idx" ON "customers"("healthScore");

-- CreateIndex
CREATE INDEX "customers_referredById_idx" ON "customers"("referredById");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
