-- Lead.distanceKm: km anada+tornada des de Granollers (mirall de Booking.distanceKm).
-- Permet calcular el cost de transport en viu al bolo del lead (#1345).
ALTER TABLE "leads" ADD COLUMN "distanceKm" DOUBLE PRECISION;
