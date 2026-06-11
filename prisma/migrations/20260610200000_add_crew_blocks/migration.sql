-- CreateTable
CREATE TABLE "crew_blocks" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crew_blocks_collaboratorId_date_idx" ON "crew_blocks"("collaboratorId", "date");

-- CreateIndex
CREATE INDEX "crew_blocks_date_idx" ON "crew_blocks"("date");

-- AddForeignKey
ALTER TABLE "crew_blocks" ADD CONSTRAINT "crew_blocks_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
