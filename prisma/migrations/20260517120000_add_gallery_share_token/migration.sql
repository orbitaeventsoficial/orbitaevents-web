-- AddColumn galleryShareToken and gallerySharePassword to Booking
ALTER TABLE "bookings" ADD COLUMN "galleryShareToken" TEXT;
ALTER TABLE "bookings" ADD COLUMN "gallerySharePassword" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_galleryShareToken_key" ON "bookings"("galleryShareToken");
