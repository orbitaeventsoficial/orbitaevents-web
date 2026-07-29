'use client';

import Link from 'next/link';
import { AdminPage } from '@/app/admin/components/AdminPage';
import { AdminHelpLegend } from '@/app/admin/components/AdminHelpLegend';
import { EditorControlStrip } from '@/app/admin/components/EditorControlStrip';

export default function HeroMediaAdmin() {
  return (
    <AdminPage
      title="Hero — Mitjans"
      subtitle="Aquest bloc ja no es gestiona amb un sistema separat. El hero de la home ara forma part del gestor d’imatges unificat."
      back={{ href: '/admin/settings', label: 'Configuració' }}
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Font única',
          title: 'Què controla ara aquest espai',
          stats: [
            { label: 'Placement', value: 'home.hero.slides' },
            { label: 'Panells', value: '1', hint: 'unificat' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què ha canviat',
          items: [
            'El hero de la home ja no viu en un sistema separat.',
            'Els uploads i l’ordre de slides passen pel mateix gestor d’imatges que la resta de col·leccions.',
            'Aquest pont existeix només per evitar dubtes i rutes mortes dins de configuració.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: 'Treballar el hero des del gestor d’imatges',
          description: 'Si has de canviar slides, ordre o assets del hero, el lloc correcte és el gestor d’imatges amb el placement `home.hero.slides`.',
          primaryAction: { href: '/admin/image-manager', label: 'Anar al gestor d’imatges' },
          secondaryAction: { href: '/admin/settings', label: 'Tornar a configuració' },
          secondaryPills: ['Placement: home.hero.slides'],
        }}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <AdminHelpLegend title="Font única" body="Els slides del hero viuen al placement `home.hero.slides` dins del gestor d’imatges." />
        <AdminHelpLegend title="Uploads reals" body="Els fitxers pujats es desen al storage del projecte i queden governats per la mateixa capa comuna." />
        <AdminHelpLegend title="Sense duplicats" body="Això evita tenir un panell separat per al hero i un altre per a la resta d’imatges." />
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6 space-y-4">
        <h2 className="ap-h2 text-[var(--t)]">On s’ha mogut?</h2>
        <p className="text-sm text-[var(--t2)]">
          Obre el gestor d’imatges i treballa la col·lecció manual del placement <span className="font-mono text-[var(--t)]">home.hero.slides</span>.
        </p>
        <Link
          href="/admin/image-manager"
          className="inline-flex items-center gap-2 rounded-full admin-tone-bg-warning px-5 py-2.5 text-sm font-bold text-[var(--gold-ink)]"
        >
          Anar al gestor d’imatges
        </Link>
      </div>
    </AdminPage>
  );
}
