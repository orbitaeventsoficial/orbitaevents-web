# Fitxes tipus — patrons de pàgina canònics i comparables

> Decidit amb el propietari (2026-06-13). Aquest document i la secció **#20 «Fitxes tipus»**
> de `/admin/studio` són la font de veritat dels patrons de pàgina de l'admin.

## Filosofia

El sistema visual d'Òrbita té dos nivells:

1. **Tokens i components** (Studio #00–#19): colors, tipografia, botons, inputs, cards, estats…
2. **Fitxes tipus** (Studio #20): **patrons de pàgina sencers**, canònics, **comparables entre ells**.

La regla del propietari: *«anar trobant pàgines tipus de tot, establir-les com un estàndard, i que
siguin comparables»*; *«evolucionar el sistema comparant i millorant les fitxes i els passos»*;
*«no val tenir relacions així, s'ha de fer bé tot»*.

Conseqüència pràctica:
- **Un sol component canònic per patró**, parametritzat per dades. Mai codi per a un registre concret
  (res de `if (lead.id === 'x')`). Esborrar un registre real no pot trencar la pàgina.
- Cada domini té diverses **vistes** del mateix patró; una és la **canònica de referència** i les
  altres s'hi **alineen** comparant-les amb els criteris d'estàndard.
- S'evoluciona **comparant**: quan una vista millora, l'estàndard puja i la resta hi convergeix.

## Criteris d'estàndard (amb què es mesura qualsevol fitxa tipus)

| Criteri | Estàndard |
|---|---|
| Una sola pantalla | `scrollH = clientH` a 1440×900 (sense scroll vertical). |
| Protagonista clar | L'element de treball mana i ocupa l'ample. |
| Catàleg a la dreta | Allò que es pot afegir viu a la dreta del configurador. |
| Històric al peu | Seguiment secundari, mai al mig de la fitxa. |
| Font de dades per context | Pre-reserva → `LeadServiceLine` · Post-reserva → `Booking`. |
| Un sol component | Parametritzat per dades; mai codi per-registre. |

## Inventari

### Domini Leads
| Vista | Fitxer | Rol | Estat |
|---|---|---|---|
| Calendari | `app/admin/leads/LeadsSeasonClient.tsx` | Vista de temporada: tots els leads pel mapa de caps de setmana. Revisada i tancada pel propietari. | 🟢 **canònica** |
| Fitxa compacta | drawer `.fxd__sheet` dins `LeadsSeasonClient.tsx` | Resum ràpid del lead seleccionat + porta a la fitxa completa. Cobrament tret (va a la reserva). | 🟢 **canònica** |
| **Fitxa completa** | `app/admin/leads/[id]/LeadDetailClient.tsx` | Govern del lead + configurador del bolo en una pantalla. | 🟢 **canònica** |

### Domini Reserves
| Vista | Fitxer | Rol | Estat |
|---|---|---|---|
| Fitxa de reserva | `app/admin/bookings/[id]/BookingMarginCard.tsx` | Veritat contractual: productes, marge real, cobraments. Mateix configurador que el lead. | 🟡 a alinear |

### Domini Clients
| Vista | Fitxer | Rol | Estat |
|---|---|---|---|
| Hub de client | `app/admin/clientes/[id]/page.tsx` | Fitxa 360 (`fetchCustomerHub`): historial, reserves, comunicacions. | 🟡 a alinear |

### Domini Proveïdors
| Vista | Fitxer | Rol | Estat |
|---|---|---|---|
| Partner Hub | `app/admin/collaborators/[id]/PartnerHubClient.tsx` | Fitxa del col·laborador: productes, bolos derivats, economia. | 🟡 a alinear |

**Anatomia de la fitxa completa canònica (model «Cristina»)**, de dalt a baix:
1. Capçalera d'identitat (nom + rail de fets).
2. Barra d'estats (Nou·Contactat·Guanyat·Perdut) + govern (Responsable / Derivat per).
3. Marge: sense reserva = marge del bolo (provisional); **amb reserva = marge REAL de la reserva**
   (`computeBookingFinancialSummary`, mateixa font que la fitxa de reserva).
4. **El bolo** a tot l'ample (`fxd__zenith--solo`); si hi ha reserva, base contractada com a lectura
   no editable dins el configurador.
5. Històric comercial: tira fina al peu.

Regla de domini (vegeu `docs/bolo-flux.md` §Doctrina canònica): la reserva viu a la reserva; el lead
n'és la porta. **Els cobraments es gestionen a la fitxa de reserva, no al lead.**

## Pròxim a canonitzar (ja inventariats i a Studio #20 com 🟡)
- **Fitxa de reserva** — comparar amb la fitxa de lead (mateix configurador del bolo; el lead n'és el previ).
- **Hub de client** — aplicar els criteris d'estàndard (una pantalla, protagonista clar).
- **Partner Hub** — íd.

## Procés per afegir/evolucionar una fitxa tipus
1. Identificar el patró i les seves vistes al domini.
2. Triar (o crear) la vista **canònica** que compleix millor els criteris d'estàndard.
3. Afegir-la a Studio #20 (`TYPE_PAGES` a `StudioShowroom.tsx`) amb estat `canonica`/`alinear`.
4. Alinear la resta de vistes a la canònica; quan passen els criteris, marcar-les 🟢.
5. Registrar el canvi (comptador + protocol §9 + diari) com qualsevol altre.
