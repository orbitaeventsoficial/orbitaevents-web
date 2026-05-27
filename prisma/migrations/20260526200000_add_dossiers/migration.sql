-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "nom" TEXT NOT NULL,
    "empresa" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "eventDesc" TEXT,
    "salutacio" TEXT,
    "productIds" TEXT[],
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dossiers_leadId_idx" ON "dossiers"("leadId");

-- CreateIndex
CREATE INDEX "dossiers_createdAt_idx" ON "dossiers"("createdAt");

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
