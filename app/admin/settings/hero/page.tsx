'use client';

import Link from 'next/link';
import { AdminHelpLegend } from '@/app/admin/components/AdminHelpLegend';

export default function HeroMediaAdmin() {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hero — Mitjans</h1>
        <p className="mt-2 text-sm text-white/70">
          Aquest bloc ja no es gestiona amb un sistema separat. El hero de la home ara forma part del gestor d’imatges unificat.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AdminHelpLegend title="Font única" body="Els slides del hero viuen al placement `home.hero.slides` dins del gestor d’imatges." />
        <AdminHelpLegend title="Uploads reals" body="Els fitxers pujats es desen al storage del projecte i queden governats per la mateixa capa comuna." />
        <AdminHelpLegend title="Sense duplicats" body="Això evita tenir un panell separat per al hero i un altre per a la resta d’imatges." />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">On s’ha mogut?</h2>
        <p className="text-sm text-white/65">
          Obre el gestor d’imatges i treballa la col·lecció manual del placement <span className="font-mono text-white">home.hero.slides</span>.
        </p>
        <Link
          href="/admin/image-manager"
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-black"
        >
          Anar al gestor d’imatges
        </Link>
      </div>
    </div>
  );
}
