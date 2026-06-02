-- Canvi #852: paymentMethod + invoiceRequired + cashAmount a Booking
-- Permet registrar cobraments en efectiu, transferència o factura

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "paymentMethod"   TEXT    NOT NULL DEFAULT 'INVOICE';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "invoiceRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cashAmount"      FLOAT;
