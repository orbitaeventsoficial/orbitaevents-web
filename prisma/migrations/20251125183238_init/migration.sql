-- CreateEnum
CREATE TYPE "OrigenLead" AS ENUM ('WEB', 'WHATSAPP', 'TELEFONO', 'INSTAGRAM', 'FACEBOOK', 'REFERIDO', 'GOOGLE_ADS', 'EVENTO_ANTERIOR', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('LEAD', 'CONTACTADO', 'PRESUPUESTO', 'NEGOCIACION', 'RESERVA_CONFIRMADA', 'EVENTO_REALIZADO', 'CLIENTE_RECURRENTE', 'PERDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('BODA', 'BAUTIZO', 'CUMPLEANYOS', 'COMUNION', 'CORPORATIVO', 'FIESTA_TEMATICA', 'DISCOMOVIL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'EN_PREPARACION', 'EN_CURSO', 'COMPLETADA', 'CANCELADA_CLIENTE', 'CANCELADA_ORBITA', 'NO_PRESENTACION');

-- CreateEnum
CREATE TYPE "MotivoBloqueado" AS ENUM ('RESERVADO', 'VACACIONES', 'MANTENIMIENTO', 'FESTIVO', 'PERSONAL', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoInteraccion" AS ENUM ('PRIMER_CONTACTO', 'CONSULTA', 'PRESUPUESTO_ENVIADO', 'LLAMADA', 'REUNION', 'VISITA_SHOWROOM', 'SEGUIMIENTO', 'RECORDATORIO_PAGO', 'CONFIRMACION_EVENTO', 'AGRADECIMIENTO', 'SOLICITUD_RESENYA', 'OTRO');

-- CreateEnum
CREATE TYPE "CanalInteraccion" AS ENUM ('WHATSAPP', 'EMAIL', 'TELEFONO', 'PRESENCIAL', 'INSTAGRAM_DM', 'FACEBOOK', 'WEB_FORM');

-- CreateEnum
CREATE TYPE "PlataformaResenya" AS ENUM ('GOOGLE', 'FACEBOOK', 'BODAS_NET', 'WEB_ORBITA', 'INSTAGRAM', 'OTRA');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "origen" "OrigenLead" NOT NULL DEFAULT 'WEB',
    "utm_source" TEXT,
    "utm_campaign" TEXT,
    "estado" "EstadoCliente" NOT NULL DEFAULT 'LEAD',
    "tipoEventoInteres" "TipoEvento",
    "fechaEventoAprox" TIMESTAMP(3),
    "presupuestoAprox" DOUBLE PRECISION,
    "numInvitados" INTEGER,
    "ubicacionEvento" TEXT,
    "notas" TEXT,
    "consentimientoComercial" BOOLEAN NOT NULL DEFAULT false,
    "consentimientoPrivacidad" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionHoras" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "ubicacion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "tipoEvento" "TipoEvento" NOT NULL,
    "packContratado" TEXT NOT NULL,
    "numInvitados" INTEGER NOT NULL,
    "extras" JSONB,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "precioExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuentos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "senyal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "senyalPagada" BOOLEAN NOT NULL DEFAULT false,
    "fechaPagoSenyal" TIMESTAMP(3),
    "restoPagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPagoResto" TIMESTAMP(3),
    "notasCliente" TEXT,
    "notasInternas" TEXT,
    "horaLlegada" TEXT,
    "tiempoMontaje" INTEGER,
    "equipoAsignado" TEXT,
    "facturaEmitida" BOOLEAN NOT NULL DEFAULT false,
    "numeroFactura" TEXT,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_bloqueados" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivo" "MotivoBloqueado" NOT NULL,
    "notas" TEXT,

    CONSTRAINT "dias_bloqueados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacciones" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoInteraccion" NOT NULL,
    "canal" "CanalInteraccion" NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT,
    "duracion" INTEGER,
    "adjuntos" JSONB,
    "requiereSeguimiento" BOOLEAN NOT NULL DEFAULT false,
    "fechaSeguimiento" TIMESTAMP(3),

    CONSTRAINT "interacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenyas" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT,
    "nombreCliente" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "plataforma" "PlataformaResenya" NOT NULL,
    "urlExterna" TEXT,
    "aprobada" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "tipoEvento" "TipoEvento",
    "fechaEvento" TIMESTAMP(3),
    "respuesta" TEXT,
    "fechaRespuesta" TIMESTAMP(3),

    CONSTRAINT "resenyas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sitio" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalEventos" INTEGER NOT NULL DEFAULT 0,
    "totalClientes" INTEGER NOT NULL DEFAULT 0,
    "totalResenyas" INTEGER NOT NULL DEFAULT 0,
    "ratingPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diasAntelacionMinima" INTEGER NOT NULL DEFAULT 7,
    "horasMaximasPorDia" INTEGER NOT NULL DEFAULT 1,
    "horaInicioEventos" TEXT NOT NULL DEFAULT '18:00',
    "horaFinEventos" TEXT NOT NULL DEFAULT '04:00',
    "temporadaAltaInicio" TEXT,
    "temporadaAltaFin" TEXT,
    "earlyBirdActivo" BOOLEAN NOT NULL DEFAULT true,
    "earlyBirdDias" INTEGER NOT NULL DEFAULT 60,
    "earlyBirdPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "comboActivo" BOOLEAN NOT NULL DEFAULT true,
    "comboPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "zonasCobertura" JSONB NOT NULL,

    CONSTRAINT "configuracion_sitio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_evento" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evento" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "usuario" TEXT,

    CONSTRAINT "logs_evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_telefono_idx" ON "clientes"("telefono");

-- CreateIndex
CREATE INDEX "clientes_estado_idx" ON "clientes"("estado");

-- CreateIndex
CREATE INDEX "reservas_fechaEvento_idx" ON "reservas"("fechaEvento");

-- CreateIndex
CREATE INDEX "reservas_estado_idx" ON "reservas"("estado");

-- CreateIndex
CREATE INDEX "reservas_clienteId_idx" ON "reservas"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "dias_bloqueados_fecha_key" ON "dias_bloqueados"("fecha");

-- CreateIndex
CREATE INDEX "dias_bloqueados_fecha_idx" ON "dias_bloqueados"("fecha");

-- CreateIndex
CREATE INDEX "interacciones_clienteId_idx" ON "interacciones"("clienteId");

-- CreateIndex
CREATE INDEX "interacciones_createdAt_idx" ON "interacciones"("createdAt");

-- CreateIndex
CREATE INDEX "resenyas_rating_idx" ON "resenyas"("rating");

-- CreateIndex
CREATE INDEX "resenyas_plataforma_idx" ON "resenyas"("plataforma");

-- CreateIndex
CREATE INDEX "resenyas_visible_idx" ON "resenyas"("visible");

-- CreateIndex
CREATE INDEX "logs_evento_createdAt_idx" ON "logs_evento"("createdAt");

-- CreateIndex
CREATE INDEX "logs_evento_evento_idx" ON "logs_evento"("evento");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacciones" ADD CONSTRAINT "interacciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenyas" ADD CONSTRAINT "resenyas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
