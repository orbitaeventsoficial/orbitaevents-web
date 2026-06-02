-- Canvi #854: defaults coherents per reserves sense factura
-- El servei de creació desa explícitament 0 o 21 segons invoiceRequired.
-- Aquest default només protegeix insercions que no passin pel servei.

ALTER TABLE "bookings" ALTER COLUMN "vatRate" SET DEFAULT 0;
