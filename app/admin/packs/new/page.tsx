import NewPackForm from './NewPackForm';

export const dynamic = 'force-dynamic';

export default function NewPackPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Nou pack</h1>
        <p className="mt-1 text-sm text-slate-400">Crea un pack base i després edita inventari, textos i economia.</p>
      </header>
      <NewPackForm />
    </div>
  );
}

