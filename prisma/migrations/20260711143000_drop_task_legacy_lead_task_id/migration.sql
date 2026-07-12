-- Elimina el camp temporal Task.legacyLeadTaskId (#795, #67 -> #413 -> #1929).
-- Era un pont de compatibilitat creat a la migracio 20260410140000_drop_lead_task_model
-- per resoldre enllacos antics cap al model LeadTask ja eliminat. L'auditoria Zenit
-- (#1929) va confirmar legacyLeadTaskLinks=0 sobre BD real; verificacio directa
-- repetida abans d'aquesta migracio (2026-07-11): 0 de 81 tasks amb el camp no nul.
-- findTaskLinkByTaskOrLegacyId() ja no necessita el fallback legacy.

DROP INDEX IF EXISTS "tasks_legacyLeadTaskId_key";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "legacyLeadTaskId";
