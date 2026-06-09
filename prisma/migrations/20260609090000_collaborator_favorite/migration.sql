-- Partner favorit: surt als desplegables ràpids de la nova reserva (origen/facturació).
ALTER TABLE "collaborators" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;
