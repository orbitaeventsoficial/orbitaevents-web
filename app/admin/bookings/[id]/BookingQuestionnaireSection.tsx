import Link from 'next/link';
import { formatDateSimple } from '@/lib/constants';
import { getBookingQuestionnaire } from '@/lib/services/questionnaireService';

export default async function BookingQuestionnaireSection({ bookingId }: { bookingId: string }) {
  const data = await getBookingQuestionnaire(bookingId);

  return (
    <section className="ap-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="ap-h2">Qüestionari pre-event</h2>
        <Link
          href="/admin/questionnaires"
          className="text-xs text-[var(--t3)] hover:text-[var(--t2)]"
        >
          Gestionar plantilles →
        </Link>
      </div>

      {!data ? (
        <div className="ap-card p-4">
          <p className="text-sm text-[var(--t3)]">Cap plantilla de qüestionari activa.</p>
          <Link
            href="/admin/questionnaires/new"
            className="mt-2 inline-block text-xs text-[var(--gold)] hover:underline"
          >
            Crear primera plantilla
          </Link>
        </div>
      ) : !data.response ? (
        <div className="rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full admin-tone-bg-warning shrink-0" />
            <p className="text-sm font-medium">Pendent de resposta</p>
          </div>
          <p className="text-xs text-[var(--t3)]">
            Plantilla activa: <span className="text-[var(--t2)]">{data.template.title}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--t3)]">
            El client veurà el qüestionari al seu portal però encara no ha enviat respostes.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-block w-2 h-2 rounded-full admin-tone-bg-success shrink-0" />
            <p className="text-sm font-medium admin-tone-text-success">Qüestionari completat</p>
            {data.response.submittedAt && (
              <span className="text-xs text-[var(--t3)]">
                {formatDateSimple(data.response.submittedAt)}
              </span>
            )}
          </div>
          <dl className="space-y-3">
            {data.template.questions.map((q) => {
              const answer = data.response!.answers[q.id];
              const displayAnswer = Array.isArray(answer)
                ? answer.join(', ') || '—'
                : (answer as string) || '—';
              return (
                <div key={q.id} className="ap-card p-3">
                  <dt className="text-xs uppercase tracking-wider text-[var(--t3)]">{q.label}</dt>
                  <dd className="mt-1 text-sm text-[var(--t)]">{displayAnswer}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </section>
  );
}
