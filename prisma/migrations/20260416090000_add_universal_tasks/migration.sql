-- Universal tasks linked to customer/lead/booking/proposal
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "leadId" TEXT,
  "bookingId" TEXT,
  "proposalId" TEXT,
  "legacyLeadTaskId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" "LeadTaskStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "LeadTaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "assignedTo" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tasks_legacyLeadTaskId_key" ON "tasks"("legacyLeadTaskId");
CREATE INDEX IF NOT EXISTS "tasks_customerId_status_dueDate_idx" ON "tasks"("customerId", "status", "dueDate");
CREATE INDEX IF NOT EXISTS "tasks_leadId_status_idx" ON "tasks"("leadId", "status");
CREATE INDEX IF NOT EXISTS "tasks_bookingId_idx" ON "tasks"("bookingId");
CREATE INDEX IF NOT EXISTS "tasks_proposalId_idx" ON "tasks"("proposalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_customerId_fkey'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_leadId_fkey'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_bookingId_fkey'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_proposalId_fkey'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_proposalId_fkey"
      FOREIGN KEY ("proposalId") REFERENCES "proposals"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill from legacy lead_tasks when possible.
INSERT INTO "tasks" (
  "id",
  "customerId",
  "leadId",
  "legacyLeadTaskId",
  "title",
  "description",
  "dueDate",
  "status",
  "priority",
  "assignedTo",
  "createdBy",
  "createdAt",
  "updatedAt",
  "completedAt"
)
SELECT
  lt."id",
  l."customerId",
  lt."leadId",
  lt."id",
  lt."title",
  lt."description",
  lt."dueDate",
  lt."status",
  lt."priority",
  lt."assignedTo",
  lt."createdBy",
  lt."createdAt",
  lt."updatedAt",
  lt."completedAt"
FROM "lead_tasks" lt
LEFT JOIN "leads" l ON l."id" = lt."leadId"
WHERE NOT EXISTS (
  SELECT 1 FROM "tasks" t WHERE t."legacyLeadTaskId" = lt."id"
);
