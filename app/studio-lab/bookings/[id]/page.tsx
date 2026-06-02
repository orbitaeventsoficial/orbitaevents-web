import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import './booking-lab.css';
import { formatCurrency, formatDateFull, formatDateSimple } from '@/lib/constants';
import { ADMIN_CHANGE_COUNTER } from '@/lib/constants/admin';
import { VAT_RATE_INVOICE, calcDeposit } from '@/lib/constants/pricing';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendent', CONFIRMED: 'Confirmada', PREPARING: 'Preparant',
  COMPLETED: 'Completada', CANCELLED: 'Cancel·lada',
};
const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'];
const PAY_LABEL: Record<string, string> = {
  full: 'Pagada del tot', part: 'Senyal pagat · resta pendent', none: 'Sense cap pagament',
};

function payState(depositPaid: boolean, remainingPaid: boolean) {
  if (depositPaid && remainingPaid) return 'full';
  if (depositPaid) return 'part';
  return 'none';
}

function daysUntil(dateISO: string | null) {
  if (!dateISO) return null;
  const diff = new Date(dateISO).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function BookingLabPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      pack: { select: { id: true, slug: true, price: true, djHours: true, translations: { select: { name: true, locale: true }, take: 1 } } },
      extras: { include: { extra: { select: { slug: true, price: true, translations: { select: { name: true, locale: true }, take: 1 } } } } },
      collaboratorBookings: {
        include: { collaborator: { select: { name: true } } },
        take: 1,
      },
    },
  });

  if (!booking) notFound();

  const pay = payState(booking.depositPaid, booking.remainingPaid);
  const days = daysUntil(booking.eventDate?.toISOString() ?? null);
  const total = Number(booking.total);
  const deposit = Number(booking.depositAmount);
  const remaining = Number(booking.remainingAmount);
  const packCost = Number(booking.pack?.price ?? 0);
  const travelCost = Number(booking.travelCost ?? 0);
  const collabCost = booking.collaboratorBookings[0]
    ? Number(booking.collaboratorBookings[0].commissionAmount)
    : 0;
  const costFloor = packCost + travelCost + collabCost;
  const margin = total - costFloor;
  const marginPct = total > 0 ? Math.round((margin / total) * 100) : 0;

  // Detecta preu personalitzat: total ≠ preu catàleg del pack (diferència > 5€)
  const catalogBase = booking.pack ? Number(booking.pack.price) : 0;
  const isPriceCustom = catalogBase > 0 && Math.abs(total - catalogBase) > 5;

  // Hores reals del servei (inici → fi)
  const contractedHours = (() => {
    const s = booking.eventStartTime;
    const e = booking.eventEndTime;
    if (!s || !e) return null;
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return Math.round(mins / 60 * 10) / 10;
  })();
  const hoursLabel = contractedHours !== null
    ? `${contractedHours}h`
    : booking.pack
      ? `${(booking.pack.djHours ?? 0) + (booking.extraHours ?? 0)}h (pack)`
      : null;

  // Semàfor d'alertes — ordre de criticitat
  const flags: { kind: 'crit' | 'warn' | 'info'; title: string; desc: string }[] = [];
  if (!booking.customerId) flags.push({ kind: 'warn', title: 'Sense client CRM', desc: 'La reserva no està vinculada a cap fitxa de client.' });
  if (pay === 'none') flags.push({ kind: 'crit', title: 'Senyal no cobrat', desc: `Pendent: ${formatCurrency(deposit)}` });
  if (pay === 'part') flags.push({ kind: 'warn', title: 'Resta pendent', desc: `${formatCurrency(remaining)} per cobrar` });
  if (booking.status === 'PENDING') flags.push({ kind: 'warn', title: 'Reserva no confirmada', desc: 'Falta confirmació operativa.' });
  if (days !== null && days >= 0 && days <= 7) flags.push({ kind: days <= 2 ? 'crit' : 'warn', title: `Event en ${days} dies`, desc: days === 0 ? 'Avui!' : `${formatDateFull(booking.eventDate?.toISOString() ?? '')}` });
  if (margin < 0) flags.push({ kind: 'crit', title: 'Marge negatiu', desc: `Perdem ${formatCurrency(Math.abs(margin))} amb aquest preu` });
  if (margin >= 0 && marginPct < 20 && costFloor > 0) flags.push({ kind: 'warn', title: `Marge baix (${marginPct}%)`, desc: `Objectiu ≥ 30%. Considera ajustar el preu.` });
  if (!booking.pack) flags.push({ kind: 'info', title: 'Sense pack assignat', desc: 'No s\'ha seleccionat cap servei.' });

  return (
    <div className="bk2__root ax-root" data-status={booking.status}>

      {/* Barra superior */}
      <header className="bk2__topbar">
        <Link href={booking.leadId ? `/admin/leads/${booking.leadId}` : '/admin/leads'} className="bk2__back">
          ← {booking.leadId ? 'Lead' : 'Leads'}
        </Link>
        <span className="bk2__ref">{booking.reference}</span>
        <span className="bk2__client">{booking.clientName}</span>
        <span className="bk2__status">{STATUS_LABEL[booking.status] ?? booking.status}</span>
        <Link href={`/admin/bookings/${booking.id}`} style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 8 }}>
          Vista clàssica →
        </Link>
      </header>

      <div className="bk2__body">

        {/* ── Columna esquerra ── */}
        <aside className="bk2__sidebar">

          {/* Semàfor */}
          {flags.length > 0 && (
            <div className="bk2__flags">
              {flags.map((f, i) => (
                <div key={i} className={`bk2__flag bk2__flag--${f.kind}`}>
                  <div><b>{f.title}</b>{f.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Canvi d'estat */}
          <div>
            <h4 className="bk2__sidebar-h">Estat</h4>
            <div className="bk2__statuspick">
              {STATUS_ORDER.map((s) => (
                <button key={s} className={s === booking.status ? 'is-on' : ''} disabled>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Accions primàries */}
          <div>
            <h4 className="bk2__sidebar-h">Accions</h4>
            <div className="bk2__actions">
              {booking.clientPhone && (
                <a
                  href={`https://wa.me/${booking.clientPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${booking.clientName}! Et contactem des d'Òrbita Events.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bk2__btn"
                >
                  💬 WhatsApp
                </a>
              )}
              {!booking.customerId && (
                <Link href={`/admin/bookings/${booking.id}#client`} className="bk2__btn bk2__btn--danger">
                  ⚠ Vincular client
                </Link>
              )}
              {!booking.depositPaid && (
                <button className="bk2__btn bk2__btn--primary" disabled>
                  Marcar senyal pagat
                </button>
              )}
              {booking.depositPaid && !booking.remainingPaid && (
                <button className="bk2__btn bk2__btn--primary" disabled>
                  Marcar resta pagada
                </button>
              )}
              <Link href={`/admin/bookings/${booking.id}`} className="bk2__btn">
                Fitxa completa →
              </Link>
            </div>
          </div>

        </aside>

        {/* ── Zona principal (3 columnes) ── */}
        <main className="bk2__main">

          {/* Panell 1 — Bolo */}
          <section className="bk2__panel">
            <div className="bk2__ph"><h3>Bolo</h3></div>
            <dl className="bk2__rows">
              <div><dt>Data</dt><dd>{booking.eventDate ? formatDateFull(booking.eventDate.toISOString()) : <em className="bk2__val--muted">Sense data</em>}</dd></div>
              {(booking.eventStartTime || booking.eventEndTime) && (
                <div><dt>Hora</dt><dd>{booking.eventStartTime ?? '—'}{booking.eventEndTime ? ` → ${booking.eventEndTime}` : ''}</dd></div>
              )}
              <div><dt>Lloc</dt><dd title={booking.eventLocation ?? undefined}>{booking.eventVenue || booking.eventLocation || <em className="bk2__val--muted">Sense lloc</em>}</dd></div>
              {booking.eventAddress && <div><dt>Adreça</dt><dd>{booking.eventAddress}</dd></div>}
              {booking.eventPhone && <div><dt>Tel. event</dt><dd>{booking.eventPhone}</dd></div>}
              <div><dt>Convidats</dt><dd>{booking.guestCount ?? <em className="bk2__val--muted">—</em>}</dd></div>
              {booking.distanceKm && <div><dt>Desplaçament</dt><dd>{Number(booking.distanceKm).toFixed(0)} km · {formatCurrency(travelCost)}</dd></div>}
            </dl>
          </section>

          {/* Panell 2 — Cobrament */}
          <section className="bk2__panel">
            <div className="bk2__ph"><h3>Cobrament</h3></div>
            <dl className="bk2__rows">
              <div>
                <dt>Total pactat</dt>
                <dd className="bk2__val--gold">
                  {formatCurrency(total)}
                  {isPriceCustom && (
                    <span className="bk2__val--muted" title={`Tarifa base pack: ${formatCurrency(catalogBase)}`}>
                      · personalitzat
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Senyal ({formatCurrency(deposit)})</dt>
                <dd className={booking.depositPaid ? 'bk2__val--ok' : 'bk2__val--danger'}>
                  <span className={`bk2__paydot bk2__paydot--${booking.depositPaid ? 'ok' : 'none'}`} />
                  {booking.depositPaid ? `Pagat${booking.depositPaidAt ? ` · ${formatDateSimple(booking.depositPaidAt.toISOString())}` : ''}` : 'Pendent'}
                </dd>
              </div>
              <div>
                <dt>Resta ({formatCurrency(remaining)})</dt>
                <dd className={booking.remainingPaid ? 'bk2__val--ok' : pay === 'part' ? 'bk2__val--warn' : 'bk2__val--muted'}>
                  <span className={`bk2__paydot bk2__paydot--${booking.remainingPaid ? 'ok' : pay === 'part' ? 'part' : 'none'}`} />
                  {booking.remainingPaid ? `Pagada${booking.remainingPaidAt ? ` · ${formatDateSimple(booking.remainingPaidAt.toISOString())}` : ''}` : 'Pendent'}
                </dd>
              </div>
              <div><dt>Mètode</dt><dd>{booking.paymentMethod === 'CASH' ? 'Efectiu' : booking.paymentMethod === 'TRANSFER' ? 'Transferència' : 'Factura'}</dd></div>
              <div><dt>Factura</dt><dd>{booking.invoiceRequired ? `Sí · IVA ${VAT_RATE_INVOICE}%` : 'No'}</dd></div>
              {booking.cashAmount && <div><dt>Import efectiu</dt><dd>{formatCurrency(Number(booking.cashAmount))}</dd></div>}
            </dl>
          </section>

          {/* Panell 3 — Marge (3a columna, primera fila) */}
          <section className="bk2__panel">
            <div className="bk2__ph"><h3>Marge estimat</h3></div>
            <dl className="bk2__rows">
              <div><dt>Ingrés</dt><dd className="bk2__val--gold">{formatCurrency(total)}</dd></div>
              {packCost > 0 && <div><dt>Pack base</dt><dd className="bk2__val--muted">-{formatCurrency(packCost)}</dd></div>}
              {travelCost > 0 && <div><dt>Desplaçament</dt><dd className="bk2__val--muted">-{formatCurrency(travelCost)}</dd></div>}
              {collabCost > 0 && (
                <div>
                  <dt>{booking.collaboratorBookings[0]?.collaborator.name ?? 'Col·laborador'}</dt>
                  <dd className="bk2__val--muted">-{formatCurrency(collabCost)}</dd>
                </div>
              )}
              {costFloor > 0 && (
                <div>
                  <dt>Marge net</dt>
                  <dd className={margin >= 0 ? (marginPct >= 30 ? 'bk2__val--ok' : 'bk2__val--warn') : 'bk2__val--danger'}>
                    {formatCurrency(margin)}
                    <span className="bk2__val--muted"> ({marginPct}%)</span>
                  </dd>
                </div>
              )}
              {costFloor === 0 && <div><dt>—</dt><dd className="bk2__val--muted">Afegeix pack i col·laborador</dd></div>}
            </dl>
          </section>

          {/* Panell 4 — Servei contractat (fila 2, ample complet) */}
          <section className="bk2__panel bk2__panel--wide">
            <div className="bk2__ph">
              <h3>Servei contractat</h3>
              {isPriceCustom && (
                <span className="bk2__badge bk2__badge--custom">Preu personalitzat</span>
              )}
            </div>
            <dl className="bk2__rows bk2__rows--cols">
              {hoursLabel && (
                <div><dt>Durada</dt><dd className="bk2__val--gold">{hoursLabel}</dd></div>
              )}
              {booking.eventStartTime && booking.eventEndTime && (
                <div><dt>Horari</dt><dd>{booking.eventStartTime} → {booking.eventEndTime}</dd></div>
              )}
              {booking.pack && (
                <div><dt>Servei base</dt><dd>{booking.pack.translations[0]?.name ?? booking.pack.slug}</dd></div>
              )}
              {booking.extras.map((e, i) => (
                <div key={i}>
                  <dt>{e.extra.translations[0]?.name ?? e.extra.slug}</dt>
                  <dd>{e.quantity > 1 ? `×${e.quantity}` : '+'}</dd>
                </div>
              ))}
              {booking.guestCount && (
                <div><dt>Convidats</dt><dd>{booking.guestCount} pax</dd></div>
              )}
              {booking.distanceKm && (
                <div><dt>Desplaçament</dt><dd>{Number(booking.distanceKm).toFixed(0)} km</dd></div>
              )}
            </dl>
          </section>

        </main>
      </div>

      {/* Peu */}
      <footer className="bk2__footer">
        <span>Studio Lab · Fitxa reserva v2</span>
        <span className="bk2__counter">#{ADMIN_CHANGE_COUNTER}</span>
        <span style={{ marginLeft: 'auto' }}>
          <Link href={`/admin/bookings/${booking.id}`} style={{ color: 'var(--t3)', fontSize: 11 }}>
            → Vista clàssica completa
          </Link>
        </span>
      </footer>

    </div>
  );
}
