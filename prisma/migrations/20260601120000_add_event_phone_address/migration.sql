-- Canvi #852: eventPhone + eventAddress a Lead i Booking
-- Contacte específic de l'esdeveniment (pot diferir del client)

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "eventPhone"   TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "eventAddress" TEXT;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "eventPhone"   TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "eventAddress" TEXT;
