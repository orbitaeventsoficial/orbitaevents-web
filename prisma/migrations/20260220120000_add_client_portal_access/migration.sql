-- CreateTable
CREATE TABLE "client_portal_access" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ca',
    "personalization" JSONB,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "lastAccessIp" TEXT,
    "lastAccessUa" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_portal_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_access_tokenHash_key" ON "client_portal_access"("tokenHash");

-- CreateIndex
CREATE INDEX "client_portal_access_bookingId_revokedAt_idx" ON "client_portal_access"("bookingId", "revokedAt");

-- CreateIndex
CREATE INDEX "client_portal_access_customerId_revokedAt_idx" ON "client_portal_access"("customerId", "revokedAt");

-- CreateIndex
CREATE INDEX "client_portal_access_expiresAt_idx" ON "client_portal_access"("expiresAt");

-- AddForeignKey
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
