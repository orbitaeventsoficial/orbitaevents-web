# Auditoria Executiva (Solo Founder) - Òrbita Events

Data: 17/02/2026
Objectiu: fer el sistema "fàcil d'usar per una sola persona", maximitzant conversió i reduint risc operatiu.

## Estat actual (resum)
- Base tècnica sòlida: TypeScript i tests passant.
- Seguretat base present: CSRF, rate limit i Turnstile.
- SEO molt treballat: metadata/canonical/OG en moltes pàgines.
- CRM/admin molt potent, però amb massa superfície per operar-ho sol.

## Verificacions tècniques fetes
- `npx tsc --noEmit`: OK.
- `npm run test:run`: OK (61/61 tests).
- `npm run lint`: 1 warning no crític (`app/admin/clientes/page.tsx:183` hook dependency).

## Canvis fets ara (zero tràfic Supabase opcional)
- Kill switch global Supabase:
  - `lib/supabase.ts`
  - `app/api/upload/route.ts`
  - `.env.example`
- Variable nova:
  - `DISABLE_SUPABASE=true` -> desactiva clients/rutes Supabase i evita tràfic accidental.

## Findings prioritzats (enfocats a simplicitat)
### P0 - Crític (avui)
1. Massa opcions al panell admin (fricció cognitiva alta)
- Evidència: `app/admin/layout.tsx` (seccions Operativa/Eines/Configuració molt extenses).
- Impacte: més errors i més temps per tasca diària.

2. Heterogeneïtat d'idioma i nomenclatura a admin
- Evidència: rutes i labels barrejats (`clientes`, `contactes`, `rentabilidad`, `presupuestos`).
- Impacte: aprenentatge més lent i operativa menys intuïtiva.

3. Dependència potencial de Supabase en parts del backoffice
- Evidència: ús a `lib/supabase.ts`, `app/api/upload/route.ts`, i altres rutes admin.
- Impacte: risc de cost/servei si no es controla.

### P1 - Important (30 dies)
1. Falta de "Single Daily View" per operar en 20 minuts.
2. Massa passos manuals entre lead -> proposta -> reserva -> post-event.
3. Alertes i SLA dispersos (cal centralitzar semàfor operatiu).

### P2 - Creixement (90 dies)
1. Poca estandardització de playbooks.
2. Falta score automàtic de lead i priorització per valor/probabilitat.
3. Manca de cicle complet de retenció/referrals automatitzat.

## Pla d'acció simplificat
## Avui (execució immediata)
1. Activar bloqueig Supabase:
- `.env.local`: `DISABLE_SUPABASE=true`

2. Definir "Mode Solo" a admin:
- Només 6 entrades visibles per defecte:
  - Entrades
  - Entrada ràpida
  - Clients
  - Reserves
  - Tasques
  - Pressupost (PDF)
- La resta sota "Avançat".

3. Unificar llengua admin a català (labels/UI):
- Mantenir rutes internes, però text d'interfície 100% català.

4. Crear "Checklist diària" fixa:
- Nous leads sense resposta
- Pressupostos pendents > 24h
- Reserves a 7 dies sense tancar
- Factures/pendents
- Post-event pendents

## Pla 30 dies (operació robusta per 1 persona)
1. Flux únic de treball
- Inbox + Leads + Tasques en una vista "Avui".
- 3 estats obligatoris: `Nou`, `En seguiment`, `Tancat`.

2. Automatitzacions mínimes d'alt impacte
- Auto-recordatori a 24h/72h de pressupostos no contestats.
- Auto-creació de tasques clau en confirmar reserva.
- Plantilles de missatge "1 clic" per WhatsApp/email.

3. KPI setmanals (dashboard curt)
- Temps primera resposta
- % pressupost -> reserva
- Ingressos confirmats del mes
- Càrrega setmanal (hores compromeses)

## Pla 90 dies (escala sense perdre simplicitat)
1. Lead scoring automàtic
- Prioritat segons data propera, pressupost i resposta client.

2. Predictibilitat comercial
- Forecast de facturació 30/60/90 dies.
- Risc de cancel·lació i saturació de calendari.

3. Retenció i referrals
- Flux post-event automàtic:
  - Ressenya
  - Codi descompte
  - Recordatori aniversari/event recurrent

## KPI objectiu (realistes)
- Primera resposta: < 15 min en horari laboral.
- Conversió lead -> pressupost: > 70%.
- Conversió pressupost -> reserva: > 35%.
- % tasques vençudes: < 10%.
- Temps administratiu diari: < 90 min.

## Regla d'or (per evitar complexitat)
Qualsevol funcionalitat nova ha de passar aquest filtre:
- "M'estalvia temps aquesta setmana?"
- "Redueix errors humans?"
- "Ho podré explicar en 1 frase?"

Si no passa 2 de 3, no entra.
