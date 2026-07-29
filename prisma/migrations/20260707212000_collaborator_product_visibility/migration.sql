ALTER TABLE "collaborator_products"
  ADD COLUMN "visibleInDossier" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "visibleInBooking" BOOLEAN NOT NULL DEFAULT true;
