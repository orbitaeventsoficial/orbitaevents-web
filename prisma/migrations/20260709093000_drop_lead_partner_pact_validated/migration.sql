-- Revert de la validacio amb partner (#1755): el pacte del lead es lectura,
-- no un estat de negoci persistent.
ALTER TABLE "leads" DROP COLUMN IF EXISTS "partnerPactValidatedAt";
