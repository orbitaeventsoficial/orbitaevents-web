-- Partner roles and source attribution for leads/bookings.
-- A collaborator can be a provider, referrer, equipment rental vendor, client partner, crew, or several of these at once.

ALTER TABLE "collaborators"
  ADD COLUMN "roles" TEXT[] NOT NULL DEFAULT ARRAY['PROVIDER']::TEXT[];

ALTER TABLE "leads"
  ADD COLUMN "sourceCollaboratorId" TEXT;

ALTER TABLE "bookings"
  ADD COLUMN "sourceCollaboratorId" TEXT;

CREATE INDEX "leads_sourceCollaboratorId_idx" ON "leads"("sourceCollaboratorId");
CREATE INDEX "bookings_sourceCollaboratorId_idx" ON "bookings"("sourceCollaboratorId");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_sourceCollaboratorId_fkey"
  FOREIGN KEY ("sourceCollaboratorId") REFERENCES "collaborators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_sourceCollaboratorId_fkey"
  FOREIGN KEY ("sourceCollaboratorId") REFERENCES "collaborators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
