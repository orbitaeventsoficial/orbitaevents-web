-- Lead.partnerPactValidatedAt: quan el propietari valida el pacte amb el partner (#1753).
-- NULL = pendent de validar. Governa la jerarquia del següent pas al lead (dossier s'encén
-- quan el pacte està clar) sense bloquejar cap acció.
ALTER TABLE "leads" ADD COLUMN "partnerPactValidatedAt" TIMESTAMP(3);
