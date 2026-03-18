#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Backup complet de PostgreSQL (Railway) via pg_dump
# ══════════════════════════════════════════════════════════════════════════════
#
# Ús:
#   ./scripts/backup-db.sh                    # Usa DATABASE_URL del .env
#   DATABASE_URL="postgresql://..." ./scripts/backup-db.sh  # URL explícita
#
# Requisits:
#   - pg_dump instal·lat (inclòs amb PostgreSQL)
#   - Variable DATABASE_URL definida (o al .env)
#
# Resultat:
#   backup/db-YYYY-MM-DD-HHMMSS.sql.gz (comprimit amb gzip)
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Carregar .env si existeix
if [ -f .env ]; then
  export $(grep -E '^DATABASE_URL=' .env | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL no definida. Defineix-la al .env o com a variable d'entorn."
  exit 1
fi

# Verificar pg_dump
if ! command -v pg_dump &>/dev/null; then
  echo "❌ ERROR: pg_dump no trobat. Instal·la PostgreSQL client."
  exit 1
fi

# Crear directori backup
BACKUP_DIR="$(dirname "$0")/../backup"
mkdir -p "$BACKUP_DIR"

# Generar nom fitxer
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db-${TIMESTAMP}.sql.gz"

echo "🔄 Iniciant backup de la base de dades..."
echo "   Destí: $BACKUP_FILE"

# Executar pg_dump amb compressió
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup completat: $BACKUP_FILE ($SIZE)"

# Netejar backups antics (mantenir últims 10)
cd "$BACKUP_DIR"
ls -t db-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
echo "🧹 Backups antics netejats (mantenim últims 10)"
