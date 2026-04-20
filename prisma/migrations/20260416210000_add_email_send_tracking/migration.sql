-- CreateTable
CREATE TABLE "email_sends" (
    "id" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "templateKey" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "locale" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickedAt" TIMESTAMP(3),
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_sends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_sends_trackingToken_key" ON "email_sends"("trackingToken");

-- CreateIndex
CREATE INDEX "email_sends_templateKey_idx" ON "email_sends"("templateKey");

-- CreateIndex
CREATE INDEX "email_sends_leadId_idx" ON "email_sends"("leadId");

-- CreateIndex
CREATE INDEX "email_sends_sentAt_idx" ON "email_sends"("sentAt");
