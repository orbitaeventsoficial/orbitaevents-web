# Mètode de construcció de pàgines admin + marca TANCAT CHARLIE

> Com es construeix CADA pàgina de l'admin perquè totes surtin amb el mateix nivell.
> Complement de `docs/admin-migration-checklist.md` (què queda) i `docs/admin-inventari-pagines.md` (mapa 🔴/🟡/🟢).

---

## 1. La marca `TANCAT CHARLIE`

Significa: **pàgina validada pel propietari** («Charlie»). A prop de final, no 100% acabada, però **és el model de referència** al qual la resta s'ha de semblar.

És un eix **diferent** de l'estat de migració:
- 🟢 = migrada tècnicament al sistema visual.
- `TANCAT CHARLIE` = el propietari l'ha checkat i la dóna per bona com a patró.

**Marca canònica (comentari al TOP del fitxer de pàgina/component):**

```tsx
// ─────────────────────────────────────────────────────────
// ✅ TANCAT CHARLIE — validat pel propietari (DATA)
// Patró de referència. A prop de final (no 100%). La resta de
// pàgines s'ha de construir fidel a aquest model.
// ─────────────────────────────────────────────────────────
```

---

## 2. Pàgines validades pel propietari (Charlie) — **A CONFIRMAR**

Segons el que has dit: targetes del calendari, client pipeline, llista i «alguna més». La meva millor correspondència (confirma'm la llista exacta abans d'estampar):

- [ ] Targetes del calendari → `app/admin/calendario/CalendarMonthClient.tsx` (+ Week/Day?)
- [ ] Client pipeline → `app/admin/leads/LeadPipelineView.tsx`
- [ ] Llista → `app/admin/clientes/*` (llista) o `app/admin/leads` (llista)?
- [ ] «Alguna més» → ___

> Quan em confirmis la llista, estampo la marca al top de cada fitxer en un sol pas.

---

## 3. Mètode de construcció (per cada pàgina nova/migrada)

**Principi: partir de PANTALLA NEGRA, no del disseny vell.** No es retoca el Frankenstein; es reconstrueix net.

1. **Pantalla negra** — començar del buit amb el canvas i els tokens del sistema (`/admin/studio`), no arrossegant CSS antic.
2. **Element per element, de més a menys important** — primer el que aporta valor real (dades, accions, decisions), després el secundari. No pintar abans de tenir l'esquelet funcional.
3. **Treure soroll a cada pas** — eliminar el que no aporta: camps morts, duplicats, decoració buida, catàlegs locals. Menys, però net.
4. **Sense hardcoded** — colors → tokens `--ax-*`/`--o-*`; textos/labels → `lib/constants/*`; res de hex/`style={{`/`rgba` (el hook ho vigila).
5. **Responsiu** — 375px / tablet / desktop comprovats.
6. **Accessibilitat** — `htmlFor`+`id`, `aria-label`, `scope="col"`, focus visible.
7. **Tot relacionat** — la pàgina ha d'enllaçar amb el seu context (fitxa ↔ llista ↔ bolo ↔ partner ↔ client), no illes.
8. **El propietari valida CADA pàgina** abans de tancar-la. Fins que no diu «ok», no és `TANCAT CHARLIE`.

## 4. Funcions noves → marcar-les sempre

Si una pàgina incorpora una **funció nova** (no existia abans), s'ha de marcar perquè el propietari la validi expressament:

- Al **diari** (`admin-diary.md`): secció «Funcions noves en aquest tall».
- A la **UI**, opcionalment, un petit indicador `✨ NOU` mentre estigui pendent de validació.
- Un cop el propietari la valida → passa a formar part del `TANCAT CHARLIE` de la pàgina.

> Regla: cap funció nova es dóna per bona sola. Es construeix, es marca, el propietari la prova, i només llavors es consolida.

## 5. Ordre de treball
Seguir `docs/admin-migration-checklist.md` (Comercial → Finances → Growth → Catàleg → Sistema), **1-3 pàgines per sessió**, cada una: construir → treure soroll → validació del propietari → marca → tancar al diari/counter.
