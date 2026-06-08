-- Persones dins d'un proveïdor (Masquerade → Carlos Lucas BOSS, Jonathan mag...).
CREATE TABLE "collaborator_members" (
  "id" TEXT NOT NULL,
  "collaboratorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'OTHER',
  "phone" TEXT,
  "email" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "collaborator_members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "collaborator_members_collaboratorId_idx" ON "collaborator_members"("collaboratorId");

ALTER TABLE "collaborator_members"
  ADD CONSTRAINT "collaborator_members_collaboratorId_fkey"
  FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
