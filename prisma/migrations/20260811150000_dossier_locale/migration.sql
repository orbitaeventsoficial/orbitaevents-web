-- La llengua en què es va fer el dossier, desada amb el document.
--
-- Fins ara el document es refeia sempre amb la llengua del lead, de manera que
-- el selector del generador no arribava al PDF: triaves català i sortia en
-- castellà. La llengua forma part de la foto del client, com el nom o el
-- telèfon: qui envia el dossier la tria, i el lead pot canviar de llengua més
-- tard sense reescriure un document ja enviat.
--
-- Nul·la als dossiers anteriors: aquells continuen caient a la llengua del lead.
ALTER TABLE "dossiers" ADD COLUMN "locale" TEXT;
