-- AlterTable: snapshot del HTML enviat al model EmailSend per a previsualització a l'admin
ALTER TABLE "email_sends" ADD COLUMN "htmlBody" TEXT;
