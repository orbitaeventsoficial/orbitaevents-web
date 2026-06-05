-- CreateTable: catàleg de productes/serveis que revèn un col·laborador (cost + PVP amb marge)
CREATE TABLE "collaborator_products" (
    "id" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "crew" TEXT,
    "durationLabel" TEXT,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "includes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborator_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collaborator_products_collaboratorId_idx" ON "collaborator_products" ("collaboratorId");

-- AddForeignKey
ALTER TABLE "collaborator_products"
  ADD CONSTRAINT "collaborator_products_collaboratorId_fkey"
  FOREIGN KEY ("collaboratorId") REFERENCES "collaborators" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
