-- Metadata de signatura digital inline al contracte
ALTER TABLE "proposals" ADD COLUMN "contractSignatureIp" TEXT;
ALTER TABLE "proposals" ADD COLUMN "contractSignatureUa" TEXT;
