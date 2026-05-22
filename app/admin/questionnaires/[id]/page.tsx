import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminPage } from '../../components/AdminPage';
import { getQuestionnaireTemplate } from '@/lib/services/questionnaireService';
import QuestionnaireTemplateEditor from './QuestionnaireTemplateEditor';

export const metadata: Metadata = { title: 'Editar qüestionari — Admin' };
export const dynamic = 'force-dynamic';

export default async function QuestionnaireEditPage({ params }: { params: { id: string } }) {
  const template = await getQuestionnaireTemplate(params.id);
  if (!template) notFound();

  return (
    <AdminPage title={`Editar: ${template.title}`}>
      <QuestionnaireTemplateEditor template={template} />
    </AdminPage>
  );
}
