-- CreateTable
CREATE TABLE "booking_gallery_photos" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "isPortal" BOOLEAN NOT NULL DEFAULT true,
    "portfolioSlug" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_gallery_photos_bookingId_idx" ON "booking_gallery_photos"("bookingId");
CREATE INDEX "booking_gallery_photos_isPortfolio_idx" ON "booking_gallery_photos"("isPortfolio");
CREATE INDEX "booking_gallery_photos_portfolioSlug_idx" ON "booking_gallery_photos"("portfolioSlug");

-- AddForeignKey
ALTER TABLE "booking_gallery_photos" ADD CONSTRAINT "booking_gallery_photos_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
