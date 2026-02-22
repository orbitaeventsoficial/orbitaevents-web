import NewPackForm from './NewPackForm';

export const dynamic = 'force-dynamic';

export default function NewPackPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Nou pack</h1>
        <p className="mt-1 text-sm">Crea un pack base i després edita inventari, textos i economia.</p>
      </header>
      <NewPackForm />
    </div>
  );
}

