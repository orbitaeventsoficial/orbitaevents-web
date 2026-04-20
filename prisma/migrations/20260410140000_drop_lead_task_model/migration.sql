-- DropTable: lead_tasks (model LeadTask)
-- The LeadTask model is a fossil — all consumers migrated to Task (universalTasks)
-- since Canvi #3 (2026-04-09). Zero code references remain.
-- The enums LeadTaskStatus and LeadTaskPriority are preserved (renamed in Prisma
-- schema to TaskStatus/TaskPriority with @@map to keep the DB enum names).

DROP TABLE IF EXISTS "lead_tasks";
