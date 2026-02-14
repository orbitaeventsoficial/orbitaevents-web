'use client';

import { HELP_ENTRIES } from './adminHelpGlossary';

export default function AdminHelpLegend() {
  return (
    <aside className="fixed right-4 top-24 z-[70] hidden w-80 max-h-[70vh] overflow-auto rounded-2xl border border-amber-300/50 bg-white/95 p-4 shadow-2xl lg:block">
      <h3 className="text-sm font-semibold text-slate-800">Glossari de l&apos;admin</h3>
      <p className="mt-1 text-xs text-slate-600">
        Explicat fàcil: què és cada cosa i per a què serveix. Mira també els símbols <strong>?</strong>.
      </p>
      <dl className="mt-3 space-y-2">
        {HELP_ENTRIES.map((entry) => (
          <div key={entry.term} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <dt className="text-xs font-semibold text-slate-800">{entry.term}</dt>
            <dd className="mt-0.5 text-xs text-slate-600">{entry.description}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
