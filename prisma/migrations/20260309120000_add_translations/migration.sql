-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isAutoTranslated" BOOLEAN NOT NULL DEFAULT false,
    "lastManualEdit" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "translations_namespace_key_locale_key" ON "translations"("namespace", "key", "locale");

-- CreateIndex
CREATE INDEX "translations_namespace_locale_idx" ON "translations"("namespace", "locale");
