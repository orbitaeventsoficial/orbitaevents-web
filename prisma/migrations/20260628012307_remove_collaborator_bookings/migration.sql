-- Retirada del sistema de comissions (CollaboratorBooking) — #1196.
-- El cost del col·laborador subcontractat va per línies de servei (BookingServiceLine
-- amb collaboratorId, preu de venda = cost +20%). La taula estava buida (0 files).

-- DropForeignKey
ALTER TABLE "collaborator_bookings" DROP CONSTRAINT IF EXISTS "collaborator_bookings_bookingId_fkey";
ALTER TABLE "collaborator_bookings" DROP CONSTRAINT IF EXISTS "collaborator_bookings_collaboratorId_fkey";

-- DropTable
DROP TABLE IF EXISTS "collaborator_bookings";
