import Link from 'next/link';
import FaqEditorForm from '../FaqEditorForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nova FAQ | Òrbita Admin',
};

export default function NewFaqPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova pregunta FAQ</h1>
          <p className="mt-1 text-sm">Crea una nova entrada i les seves traduccions</p>
        </div>
        <Link
          href="/admin/faq"
          className="rounded-xl border px-4 py-2 text-sm font-medium"
        >
          ← FAQ
        </Link>
      </header>
      <FaqEditorForm mode="create" />
    </div>
  );
}

