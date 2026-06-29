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
| 18 | 🟡 Editor de plantilles d'email | 🟡 | booking_confirmation CONNECTAT (#1221); resta pendent decisió (connectar tots o retirar) |
| 19 | **Web pública** (homepage/packs/serveis) | ⬜ | Zona consolidada; render pendent (captures async) |

## D. CRM / CLIENTS
| # | Procés | Estat | Nota |
|---|---|---|---|
| 20 | **Hub del client** (fitxa única) | ✅ | 15 blocs (V4) |
| 21 | **Segmentació / lifecycle** | ⬜ | Funcions existeixen; ús real per verificar |
| 22 | Reactivació / referrals | ✅ | pàgina→servei→BD cablejat (poques dades encara) |
| 23 | **Campanyes / màrqueting** | ✅ | Fitxa Codex (#1206): CRM massiu manual |

## E. SISTEMA / TRANSVERSAL
| # | Procés | Estat | Nota |
|---|---|---|---|
| 24 | **Comunicació / safata** (IMAP↔BD) | 🟡 | Timeline canònica OK; vinculació IMAP per afinar |
| 25 | Tasques / automatismes (15 crons) | ✅ | 15/15 programats (#1223 data-retention + dossier-trash-purge) |
| 26 | Privacitat / RGPD | ✅ | recordConsent (#1222) + cron retenció (#1223) connectats |
| 27 | **Documents / dossiers** | ✅ | Generació verificada |

---

## 🎯 MANQUES — estat després de la passada (Claude sol)
1. ✅ **Emails: confirmació de reserva connectada** (#1221) — el client ara rep email + editor governa aquest. RESTA: decidir si es connecten TOTS o es retira l'editor (decisió propietari).
2. 🟡 **Preus d'inventari «històric»** — 4-5 marcats «pendent confirmar» a la fitxa (cabina, fum baix, multiefectes, 2 focus). DECISIÓ PROPIETARI.
3. ✅ **RGPD RESOLT** — `recordConsent` connectat al formulari (#1222) + cron de retenció programat (#1223).
4. ✅ **Crons RESOLT** — 15/15 programats (faltaven dossier-trash-purge i data-retention).
5. ⬜ **Web pública** — render visual pendent (captures async fallen; zona consolidada en prod).

## ✅ El que Claude ha pogut tancar sol (2026-06-29)
Inventari 100% · confirmació de reserva + 1r email connectat a l'editor · RGPD complet ·
crons 15/15 · so Isma/Rufo · consolidació feina Codex. Tot validat i pujat.

## 🔒 El que NOMÉS pot fer el propietari (o junts davant pantalla)
- **Visual** de les pàgines usades (assenyalar elements concrets).
- **Decisió emails** (connectar tots vs retirar editor) + payment_reminder (té lògica).
- **Preus** (4-5 històrics + premium −19%) i **7 bolos** en efectiu.

## Decisions de producte pendents (propietari)
- Preu premium/luxury (−19% vs recomanat): apujar o assumir.
- Materialitzar 7 bolos en efectiu.
- Emails: opció A (connectar) confirmada → executar.

## Mètode per a la 2a passada (junts, pas a pas)
Per cada procés: el propietari el fa a la UI (operador real) mentre Claude observa el codi/dades → es detecten manques concretes → s'arreglen al moment. Començar per les 🔴/🟡.
