-- Foto del bolo (línies) i mode de sortida al dossier.
ALTER TABLE "dossiers" ADD COLUMN "lineSnapshot" JSONB;
ALTER TABLE "dossiers" ADD COLUMN "mode" TEXT;
