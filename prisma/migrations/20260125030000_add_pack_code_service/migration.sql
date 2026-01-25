-- Add code/service to packs so admin changes can drive frontend.
ALTER TABLE "packs" ADD COLUMN "code" TEXT;
ALTER TABLE "packs" ADD COLUMN "service" TEXT;

CREATE UNIQUE INDEX "packs_code_key" ON "packs"("code");
