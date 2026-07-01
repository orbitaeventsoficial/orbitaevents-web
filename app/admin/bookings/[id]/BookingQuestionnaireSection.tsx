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
          className="bd-questionnaire-link"
        >
          Gestionar plantilles →
        </Link>
      </div>

      {!data ? (
        <div className="ap-card p-4">
          <p className="bd-questionnaire-empty">Cap plantilla de qüestionari activa.</p>
          <Link
            href="/admin/questionnaires/new"
            className="bd-questionnaire-create-link"
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
          <p className="bd-questionnaire-meta">
            Plantilla activa: <span className="bd-questionnaire-template-title">{data.template.title}</span>
          </p>
          <p className="bd-questionnaire-help">
            El client veurà el qüestionari al seu portal però encara no ha enviat respostes.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-block w-2 h-2 rounded-full admin-tone-bg-success shrink-0" />
            <p className="text-sm font-medium admin-tone-text-success">Qüestionari completat</p>
            {data.response.submittedAt && (
              <span className="bd-questionnaire-date">
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
                  <dt className="bd-questionnaire-answer-label">{q.label}</dt>
                  <dd className="bd-questionnaire-answer-value">{displayAnswer}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </section>
  );
}
