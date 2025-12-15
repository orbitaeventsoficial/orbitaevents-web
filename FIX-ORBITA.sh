#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# FIX COMPLET ÒRBITA EVENTS
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔧 APLICANT CORRECCIONS..."
echo ""

# 1. STATS API - Anys i cobertura
echo "1️⃣ Corregint API stats..."
if [ -f "app/api/public/stats/route.ts" ]; then
  sed -i "s/const YEARS_ACTIVE = .*/const YEARS_ACTIVE = 'Des de 2023';  \/\/ CORREGIT/" app/api/public/stats/route.ts
  sed -i "s/const COVERAGE_AREAS = .*/const COVERAGE_AREAS = 'BCN + Girona';  \/\/ 2 províncies/" app/api/public/stats/route.ts
  echo "   ✅ API stats corregida"
else
  echo "   ❌ No trobat: app/api/public/stats/route.ts"
fi

# 2. HOOKS - Valors per defecte
echo "2️⃣ Corregint hooks..."
if [ -f "hooks/usePublicData.ts" ]; then
  sed -i "s/yearsExperience: '.*'/yearsExperience: 'Des de 2023'/" hooks/usePublicData.ts
  sed -i "s/coverage: 'Barcelona + Girona'/coverage: 'BCN + Girona'/" hooks/usePublicData.ts
  echo "   ✅ Hooks corregits"
else
  echo "   ❌ No trobat: hooks/usePublicData.ts"
fi

# 3. ELIMINAR LLEIDA I TARRAGONA
echo "3️⃣ Eliminant Lleida i Tarragona..."
find . -name "*.json" -not -path "./node_modules/*" -exec sed -i 's/Barcelona, Lleida, Girona, Tarragona/Barcelona i Girona/g' {} \; 2>/dev/null
find . -name "*.tsx" -not -path "./node_modules/*" -exec sed -i 's/Barcelona, Lleida, Girona, Tarragona/Barcelona i Girona/g' {} \; 2>/dev/null
echo "   ✅ Lleida i Tarragona eliminats"

# 4. CANVIAR 195 PER 48
echo "4️⃣ Canviant 195 per 48..."
find . -name "*.json" -not -path "./node_modules/*" -exec sed -i 's/+195/+48/g' {} \; 2>/dev/null
find . -name "*.tsx" -not -path "./node_modules/*" -exec sed -i 's/195 eventos/48 events/g' {} \; 2>/dev/null
find . -name "*.tsx" -not -path "./node_modules/*" -exec sed -i 's/195 events/48 events/g' {} \; 2>/dev/null
echo "   ✅ Números corregits"

# 5. VERIFICAR STATSECTION
echo "5️⃣ Verificant StatsSection..."
if [ -f "app/components/home/StatsSection-REAL.tsx" ]; then
  grep -q "value: 2," app/components/home/StatsSection-REAL.tsx && echo "   ✅ Províncies = 2" || echo "   ⚠️ Revisar valor de províncies"
else
  echo "   ❌ No trobat: StatsSection-REAL.tsx"
fi

# 6. NETEJAR CACHE
echo "6️⃣ Netejant cache..."
rm -rf .next/cache 2>/dev/null && echo "   ✅ Cache esborrat" || echo "   ℹ️ No hi havia cache"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "✅ CORRECCIONS APLICADES!"
echo ""
echo "SEGÜENTS PASSOS:"
echo "  1. npm run build"
echo "  2. npx vercel --prod --force"
echo ""
echo "VERIFICACIÓ POST-DEPLOY:"
echo "  - Stats: 'Des de 2023' (no '1+')"
echo "  - Províncies: '2' (no '1')"
echo "  - Cobertura: 'Barcelona i Girona' (sense Lleida/Tarragona)"
echo "  - Events: '+48' (no '+195')"
echo "═══════════════════════════════════════════════════════════════════════════════"
