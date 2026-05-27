-- AlterTable: traça observable de l'enviament (SMTP + IMAP APPEND) i headers Òrbita
ALTER TABLE "email_sends"
  ADD COLUMN "smtpAccepted"   TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "smtpRejected"   TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "smtpResponse"   TEXT,
  ADD COLUMN "smtpMessageId"  TEXT,
  ADD COLUMN "imapAppendOk"   BOOLEAN,
  ADD COLUMN "imapSentFolder" TEXT,
  ADD COLUMN "imapSentUid"    INTEGER,
  ADD COLUMN "imapError"      TEXT,
  ADD COLUMN "orbitaKind"     TEXT,
  ADD COLUMN "orbitaId"       TEXT,
  ADD COLUMN "orbitaOrigin"   TEXT;

-- Índexs per a la safata d'admin (filtres ràpids per estat APPEND i vincle entitat)
CREATE INDEX "email_sends_imapAppendOk_idx" ON "email_sends" ("imapAppendOk");
CREATE INDEX "email_sends_orbitaKind_orbitaId_idx" ON "email_sends" ("orbitaKind", "orbitaId");
