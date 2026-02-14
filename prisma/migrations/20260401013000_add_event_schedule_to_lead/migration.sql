-- Add event schedule/time range for leads
ALTER TABLE "leads"
ADD COLUMN IF NOT EXISTS "eventSchedule" TEXT;
