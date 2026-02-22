'use client';

import { HELP_ENTRIES } from './adminHelpGlossary';

export default function AdminHelpLegend() {
  return (
    <aside className="fixed right-4 top-24 z-[70] hidden w-80 max-h-[70vh] overflow-auto rounded-2xl border bg-slate-950/60/95 p-4 shadow-2xl lg:block">
      <h3 className="text-sm font-semibold">Glossari de l&apos;admin</h3>
      <p className="mt-1 text-xs">
        Explicat fàcil: què és cada cosa i per a què serveix. Mira també els símbols <strong>?</strong>.
      </p>
      <dl className="mt-3 space-y-2">
        {HELP_ENTRIES.map((entry) => (
          <div key={entry.term} className="rounded-lg border p-2.5">
            <dt className="text-xs font-semibold">{entry.term}</dt>
            <dd className="mt-0.5 text-xs">{entry.description}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

