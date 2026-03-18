-- CreateTable
CREATE TABLE "portfolio_events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "venue" TEXT,
    "location" TEXT,
    "eventDate" TIMESTAMP(3),
    "guestCount" INTEGER,
    "description" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImage" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_events_slug_key" ON "portfolio_events"("slug");
CREATE INDEX "portfolio_events_categorySlug_published_idx" ON "portfolio_events"("categorySlug", "published");
CREATE INDEX "portfolio_events_published_sortOrder_idx" ON "portfolio_events"("published", "sortOrder");

-- AlterTable: add eventId to portfolio_media
ALTER TABLE "portfolio_media" ADD COLUMN "eventId" TEXT;
CREATE INDEX "portfolio_media_eventId_idx" ON "portfolio_media"("eventId");

-- AddForeignKey
ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "portfolio_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
