import Link from 'next/link';
import type { Metadata } from 'next';
import { AdminPage } from '../components/AdminPage';
import { listQuestionnaireTemplates } from '@/lib/services/questionnaireService';
import QuestionnaireTemplateActions from './QuestionnaireTemplateActions';

export const metadata: Metadata = { title: 'Qüestionaris — Admin' };
export const dynamic = 'force-dynamic';

export default async function QuestionnairesPage() {
  const templates = await listQuestionnaireTemplates();

  return (
    <AdminPage title="Qüestionaris pre-event">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/50">
          {templates.length === 0
            ? 'Crea el primer qüestionari que els clients veuran al portal.'
            : `${templates.length} plantill${templates.length === 1 ? 'a' : 'es'}`}
        </p>
        <Link
          href="/admin/questionnaires/new"
          className="ap-btn ap-btn--primary"
        >
          Nova plantilla
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="ap-card p-8 text-center text-sm text-white/40">
          Cap qüestionari creat encara.
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((tpl) => (
            <li
              key={tpl.id}
              className="ap-card p-4 flex flex-wrap items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{tpl.title}</p>
                  {tpl.isActive ? (
                    <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-200">
                      Actiu
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">
                      Inactiu
                    </span>
                  )}
                </div>
                {tpl.description && (
                  <p className="mt-0.5 text-sm text-white/50 truncate">{tpl.description}</p>
                )}
                <p className="mt-1 text-xs text-white/30">
                  {tpl.questions.length} pregunt{tpl.questions.length === 1 ? 'a' : 'es'}
                </p>
              </div>
              <QuestionnaireTemplateActions id={tpl.id} isActive={tpl.isActive} />
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
