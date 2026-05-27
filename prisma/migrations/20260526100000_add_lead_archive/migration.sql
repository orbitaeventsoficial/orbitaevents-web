-- CreateTable: lead_archive (snapshot historic de leads LOST purgats)
CREATE TABLE "lead_archive" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "eventType" "EventType" NOT NULL,
    "eventDate" TIMESTAMP(3),
    "eventLocation" TEXT,
    "guestCount" INTEGER,
    "source" "LeadSource" NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "priority" "Priority" NOT NULL,
    "assignedTo" TEXT,
    "lostReason" TEXT,
    "lostAt" TIMESTAMP(3),
    "originalCreatedAt" TIMESTAMP(3) NOT NULL,
    "originalUpdatedAt" TIMESTAMP(3) NOT NULL,
    "contactedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedBy" TEXT,

    CONSTRAINT "lead_archive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_archive_archivedAt_idx" ON "lead_archive"("archivedAt");
CREATE INDEX "lead_archive_lostReason_idx" ON "lead_archive"("lostReason");
CREATE INDEX "lead_archive_eventType_idx" ON "lead_archive"("eventType");
CREATE INDEX "lead_archive_source_idx" ON "lead_archive"("source");
CREATE INDEX "lead_archive_lostAt_idx" ON "lead_archive"("lostAt");
