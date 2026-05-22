import type { Metadata } from 'next';
import { AdminPage } from '../../components/AdminPage';
import QuestionnaireTemplateCreator from './QuestionnaireTemplateCreator';

export const metadata: Metadata = { title: 'Nova plantilla — Admin' };

export default function QuestionnaireNewPage() {
  return (
    <AdminPage title="Nova plantilla de qüestionari">
      <QuestionnaireTemplateCreator />
    </AdminPage>
  );
}
