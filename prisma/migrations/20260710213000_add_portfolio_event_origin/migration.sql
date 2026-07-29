-- CreateEnum
CREATE TYPE "PortfolioEventOriginType" AS ENUM ('MANUAL', 'BOOKING_GALLERY', 'POST_EVENT_REPORT', 'TESTIMONIAL');

-- AlterTable
ALTER TABLE "portfolio_events"
ADD COLUMN "originType" "PortfolioEventOriginType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "sourceBookingId" TEXT,
ADD COLUMN "sourceGalleryPhotoId" TEXT,
ADD COLUMN "sourceTestimonialId" TEXT,
ADD COLUMN "originLabel" TEXT;

-- Backfill events whose cover comes directly from a booking gallery path.
UPDATE "portfolio_events"
SET "originType" = 'BOOKING_GALLERY',
    "sourceBookingId" = regexp_replace("coverImage", '^/api/uploads/bookings/([^/]+)/.*$', '\1')
WHERE "coverImage" LIKE '/api/uploads/bookings/%'
  AND "sourceBookingId" IS NULL;

-- CreateIndex
CREATE INDEX "portfolio_events_originType_sourceBookingId_idx" ON "portfolio_events"("originType", "sourceBookingId");

-- CreateIndex
CREATE INDEX "portfolio_events_sourceGalleryPhotoId_idx" ON "portfolio_events"("sourceGalleryPhotoId");

-- CreateIndex
CREATE INDEX "portfolio_events_sourceTestimonialId_idx" ON "portfolio_events"("sourceTestimonialId");
