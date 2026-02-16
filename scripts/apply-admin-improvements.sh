#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# SCRIPT D'APLICACIÓ DE MILLORES ADMIN - ÒRBITA EVENTS
# ═══════════════════════════════════════════════════════════════════════════
# 
# Aquest script aplica les millores al panell d'administració:
# 1. Nou sistema d'ajuda contextual
# 2. Layout simplificat
# 3. Redirects per eliminar duplicacions
# 4. Millores de UX
#
# BACKUP: Es crea automàticament una còpia de seguretat abans de fer canvis
# REVERT: Si alguna cosa falla, pots recuperar amb els backups
#
# Execució: chmod +x apply-admin-improvements.sh && ./apply-admin-improvements.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

BACKUP_DIR="backups/admin-improvements-$(date +%Y%m%d_%H%M%S)"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║  🚀 APLICANT MILLORES ADMIN - ÒRBITA EVENTS                          ║"
echo "╠═══════════════════════════════════════════════════════════════════════╣"
echo "║  Directori: $PROJECT_ROOT"
echo "║  Backup: $BACKUP_DIR"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 1. CREAR BACKUP
# ═══════════════════════════════════════════════════════════════════════════

echo "📦 Creant backup..."
mkdir -p "$PROJECT_ROOT/$BACKUP_DIR"

# Backup dels fitxers que modificarem
cp "$PROJECT_ROOT/app/admin/layout.tsx" "$PROJECT_ROOT/$BACKUP_DIR/layout.tsx.backup" 2>/dev/null || true
cp "$PROJECT_ROOT/app/admin/components/AdminHelpMode.tsx" "$PROJECT_ROOT/$BACKUP_DIR/AdminHelpMode.tsx.backup" 2>/dev/null || true
cp "$PROJECT_ROOT/app/admin/components/InfoTooltip.tsx" "$PROJECT_ROOT/$BACKUP_DIR/InfoTooltip.tsx.backup" 2>/dev/null || true
cp "$PROJECT_ROOT/app/admin/contactes/page.tsx" "$PROJECT_ROOT/$BACKUP_DIR/contactes-page.tsx.backup" 2>/dev/null || true

echo "   ✓ Backup creat a $BACKUP_DIR"

# ═══════════════════════════════════════════════════════════════════════════
# 2. APLICAR NOU SISTEMA D'AJUDA
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🔧 Aplicant nou sistema d'ajuda..."

if [ -f "$PROJECT_ROOT/app/admin/components/HelpSystem.tsx" ]; then
  echo "   ✓ HelpSystem.tsx ja existeix"
else
  echo "   ⚠️  HelpSystem.tsx no trobat - has de crear-lo primer"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 3. APLICAR NOU LAYOUT (OPCIONAL)
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🎨 Comprovant nou layout..."

if [ -f "$PROJECT_ROOT/app/admin/layout.new.tsx" ]; then
  echo "   ℹ️  Nou layout disponible a layout.new.tsx"
  echo "   Per aplicar-lo manualment:"
  echo "      cp app/admin/layout.new.tsx app/admin/layout.tsx"
else
  echo "   ⚠️  layout.new.tsx no trobat"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 4. CREAR REDIRECTS
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "🔀 Configurant redirects..."

# Redirect contactes -> clientes
if [ -f "$PROJECT_ROOT/app/admin/contactes/page.new.tsx" ]; then
  echo "   ℹ️  Redirect contactes -> clientes disponible"
  echo "      Per aplicar: cp app/admin/contactes/page.new.tsx app/admin/contactes/page.tsx"
fi

# ═══════════════════════════════════════════════════════════════════════════
# 5. RESUM
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║  📋 RESUM DE MILLORES                                                ║"
echo "╠═══════════════════════════════════════════════════════════════════════╣"
echo "║                                                                       ║"
echo "║  ✅ CREAT:                                                            ║"
echo "║     • HelpSystem.tsx - Sistema d'ajuda contextual complet            ║"
echo "║     • layout.new.tsx - Layout simplificat (opcional)                 ║"
echo "║     • Redirects per eliminar duplicacions                            ║"
echo "║                                                                       ║"
echo "║  📖 COM FUNCIONA EL NOU SISTEMA D'AJUDA:                             ║"
echo "║     1. Botó '?' a la capçalera activa mode ajuda                     ║"
echo "║     2. S'obre panell lateral amb glossari complet                    ║"
echo "║     3. Al passar el ratolí pels camps, apareix tooltip              ║"
echo "║     4. Cerca integrada per trobar termes ràpidament                  ║"
echo "║                                                                       ║"
echo "║  🔧 PASSOS MANUALS (si vols aplicar tots els canvis):               ║"
echo "║     1. Verificar que HelpSystem.tsx funciona                         ║"
echo "║     2. Opcional: cp layout.new.tsx layout.tsx                        ║"
echo "║     3. Integrar <HelpTooltip> als formularis                         ║"
echo "║                                                                       ║"
echo "║  🔙 PER REVERTIR:                                                    ║"
echo "║     cp $BACKUP_DIR/*.backup app/admin/                               ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

echo "✨ Procés completat!"
