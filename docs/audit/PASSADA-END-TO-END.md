# 🔁 Passada end-to-end de tots els processos — 2026-06-29

> Primera passada ràpida de TOTS els processos del negoci, amb l'estat verificat
> (molts comprovats amb ulls: captures, render PDF, render email). Serveix de mapa per
> repassar-los **pas a pas els dos junts** després. Llegenda: ✅ verificat sòlid ·
> 🟡 funciona amb matís/manca · 🔴 manca real (acció) · ⬜ no verificat encara.

## A. FLUX COMERCIAL (lead → cash)
| # | Procés | Estat | Nota |
|---|---|---|---|
| 1 | **Captació de lead** (web → `/api/contact` → Lead) | ✅ | Zod + captcha + dedup + UTM |
| 2 | **Fitxa lead + accions** | ✅ | «Següent pas» connectat (#1198); WON redirigeix a crear reserva |
| 3 | **Conversió lead → reserva** | ✅ | Completa: marca WON, calendari, tasca −7d, arrossega tot |
| 4 | **Pressupost** (proposal + PDF + send) | ✅ | 25 reals; send marca SENT, lead→QUOTE_SENT |
| 5 | **Contracte** (generació + signatura portal) | ✅ | Rutes contract + signatura |
| 6 | **Pagament** (Stripe/Bizum/efectiu) | ✅ | Webhook idempotent; 3 mètodes |
| 7 | **Operativa** (calendari + quadrant + conflictes) | ✅ | availability, crewSchedule, capacityConflict |
| 8 | **Post-event** (enquesta + valoració) | ✅ | Enquesta cosida (#1195), email excel·lent |

## B. ECONOMIA / COST
| # | Procés | Estat | Nota |
|---|---|---|---|
| 9 | **Motor de cost/marge** | ✅ | Quadra al cèntim (dissecció verificada) |
| 10 | **Inventari** (preu+foto+enllaç+specs) | ✅ | 100% complet (#1199-#1209 + dades) |
| 11 | **Amortització → preu recomanat pack** | ✅ | Encès; premium/luxury −19% (decisió propietari) |
| 12 | **So real** (lloguer Isma 50€/bolo) | ✅ | Automatitzat (#1209); EV = desig futur |
| 13 | **Reporting / economia** (KPIs, CAC, previsions) | ✅ | Quadra; certificat read-only |
| 14 | **Fiscalitat / cobrament** (IVA vs canal) | ✅ | Separat per Codex (V1-#2 #1211) |

## C. CARA EXTERNA (el que el client rep)
| # | Procés | Estat | Nota |
|---|---|---|---|
| 15 | **PDF** (catàleg/dossier/contracte/factura) | ✅ | Catàleg verificat amb render: de luxe |
| 16 | **Portal del client** (contracte/galeria/pagament) | ✅ | Impecable (V4) |
| 17 | **Emails automàtics** (post-event, etc.) | ✅ | HTML als serveis, ben fets (render verificat) |
| 18 | 🔴 **Editor de plantilles d'email** (`/admin/email-templates`) | 🔴 **MANCA** | 24 plantilles editables PERÒ desconnectades: editar-les NO canvia els emails reals (s'envien des de l'HTML del codi). **Opció A = connectar; Opció B = retirar l'editor.** |
| 19 | **Web pública** (homepage/packs/serveis) | ⬜ | Zona consolidada; render pendent (captures async) |

## D. CRM / CLIENTS
| # | Procés | Estat | Nota |
|---|---|---|---|
| 20 | **Hub del client** (fitxa única) | ✅ | 15 blocs (V4) |
| 21 | **Segmentació / lifecycle** | ⬜ | Funcions existeixen; ús real per verificar |
| 22 | **Reactivació / referrals** | ⬜ | Per verificar |
| 23 | **Campanyes / màrqueting** | ✅ | Fitxa Codex (#1206): CRM massiu manual |

## E. SISTEMA / TRANSVERSAL
| # | Procés | Estat | Nota |
|---|---|---|---|
| 24 | **Comunicació / safata** (IMAP↔BD) | 🟡 | Timeline canònica OK; vinculació IMAP per afinar |
| 25 | **Tasques / automatismes** (14 crons) | ⬜ | Verificar que cada cron dispara i té efecte |
| 26 | **Privacitat / RGPD** | 🟡 | Vives les de llista; `recordConsent`/retenció desconnectades |
| 27 | **Documents / dossiers** | ✅ | Generació verificada |

---

## 🎯 MANQUES REALS trobades (per fer junts)
1. 🔴 **Emails: editor de plantilles desconnectat** (#18) — opció A (connectar) o B (retirar). *El propietari ha demanat A.*
2. 🟡 **Preus d'inventari «històric»** — 4-5 surten alts vs mercat (cabina, fum baix, multiefectes, focus) — confirmar.
3. 🟡 **RGPD** — `recordConsent` (0 consentiments registrats) + retenció sense cron.
4. ⬜ **Crons** — verificar que els 14 disparen de debò.
5. ⬜ **Web pública** — render visual pendent (captures async fallen).

## Decisions de producte pendents (propietari)
- Preu premium/luxury (−19% vs recomanat): apujar o assumir.
- Materialitzar 7 bolos en efectiu.
- Emails: opció A (connectar) confirmada → executar.

## Mètode per a la 2a passada (junts, pas a pas)
Per cada procés: el propietari el fa a la UI (operador real) mentre Claude observa el codi/dades → es detecten manques concretes → s'arreglen al moment. Començar per les 🔴/🟡.
