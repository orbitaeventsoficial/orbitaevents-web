-- CreateTable
CREATE TABLE "portfolio_media" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_media_slug_idx" ON "portfolio_media"("slug");
CREATE INDEX "portfolio_media_slug_sortOrder_idx" ON "portfolio_media"("slug", "sortOrder");
