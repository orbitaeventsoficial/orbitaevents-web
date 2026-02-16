import type { BookingDTO, MessageDTO, ProposalDTO, TaskDTO, TimelineEventDTO } from './dto';
import { labelEstatReserva } from './labels';

type BuildTimelineInput = {
  proposals: ProposalDTO[];
  bookings: BookingDTO[];
  tasks: TaskDTO[];
  messages: MessageDTO[];
  customerActivities: Array<{ id: string; action: string; createdAt: Date }>;
  leadActivities: Array<{ id: string; type: string; title?: string | null; createdAt: Date; leadId: string }>;
};

export function buildTimeline(input: BuildTimelineInput): TimelineEventDTO[] {
  const events: TimelineEventDTO[] = [];
  const bookingStatusLabel = (status: string) => labelEstatReserva(status).toLowerCase();
  const activityLabel = (action: string) => {
    if (action === 'NOTE_ADDED') return 'Nota interna afegida';
    if (action === 'MESSAGE_SENT') return 'Missatge enviat';
    if (action === 'TASK_CREATED') return 'Tasca creada';
    if (action === 'TASK_DONE') return 'Tasca completada';
    if (action === 'PROPOSAL_SENT') return 'Pressupost enviat';
    if (action === 'BOOKING_CONFIRMED') return 'Reserva confirmada';
    return action;
  };

  for (const p of input.proposals) {
    events.push({
      id: `proposal:${p.id}:created`,
      type: 'PROPOSAL_CREATED',
      at: p.createdAt,
      title: `Pressupost creat (${p.reference})`,
      link: { label: 'Obrir', href: `/admin/presupuestos?proposalId=${p.id}` },
    });
    if (p.sentAt) {
      events.push({
        id: `proposal:${p.id}:sent`,
        type: 'PROPOSAL_SENT',
        at: p.sentAt,
        title: `Pressupost enviat (${p.reference})`,
      });
    }
    if (p.acceptedAt) {
      events.push({
        id: `proposal:${p.id}:accepted`,
        type: 'PROPOSAL_ACCEPTED',
        at: p.acceptedAt,
        title: `Pressupost acceptat (${p.reference})`,
      });
    }
  }

  for (const b of input.bookings) {
    if (!b.date) continue;
    events.push({
      id: `booking:${b.id}:created`,
      type: b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'BOOKING_CONFIRMED' : 'BOOKING_CREATED',
      at: b.date,
      title: `Reserva ${b.reference || b.id.slice(0, 8)} · ${bookingStatusLabel(b.status)}`,
      link: { label: 'Veure reserva', href: `/admin/bookings/${b.id}` },
    });
  }

  for (const t of input.tasks) {
    events.push({
      id: `task:${t.id}`,
      type: t.done ? 'TASK_DONE' : 'TASK_CREATED',
      at: t.dueDate || new Date().toISOString(),
      title: `${t.done ? 'Tasca completada' : 'Tasca creada'}: ${t.title}`,
      link: t.leadId ? { label: 'Veure entrada', href: `/admin/leads/${t.leadId}` } : undefined,
    });
  }

  for (const m of input.messages) {
    events.push({
      id: `msg:${m.id}`,
      type: m.channel === 'NOTE' ? 'NOTE_ADDED' : 'MESSAGE_SENT',
      at: m.sentAt || m.createdAt,
      title: m.subject || m.bodyPreview || 'Comunicació',
      link: m.leadId ? { label: 'Veure entrada', href: `/admin/leads/${m.leadId}` } : undefined,
    });
  }

  for (const a of input.customerActivities) {
    events.push({
      id: `ca:${a.id}`,
      type: 'ACTIVITY',
      at: a.createdAt.toISOString(),
      title: activityLabel(a.action),
    });
  }

  for (const a of input.leadActivities) {
    events.push({
      id: `la:${a.id}`,
      type: 'ACTIVITY',
      at: a.createdAt.toISOString(),
      title: a.title || activityLabel(a.type),
      link: { label: 'Veure entrada', href: `/admin/leads/${a.leadId}` },
    });
  }

  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  return events.slice(0, 250);
}
