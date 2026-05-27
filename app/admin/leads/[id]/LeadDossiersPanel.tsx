import Link from 'next/link';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getDossiersByLead } from '@/lib/services/dossierService';
import { ANIMACIO_PRODUCTS } from '@/lib/constants/animacio-products';
import { formatDateShort } from '@/lib/constants';
import { LeadDossierActions } from './LeadDossierActions';

function readLogoDataUri(): string {
  try {
    const svg = readFileSync(join(process.cwd(), 'public', 'img', 'orbitalockupwhite.svg'), 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return '';
  }
}

interface Props {
  leadId: string;
  leadNom?: string;
  leadEmail?: string;
  leadTelefon?: string;
}

export async function LeadDossiersPanel({ leadId, leadNom, leadEmail, leadTelefon }: Props) {
  const dossiers = await getDossiersByLead(leadId);
  const logoDataUri = readLogoDataUri();

  const newParams = new URLSearchParams();
  newParams.set('leadId', leadId);
  if (leadNom) newParams.set('nom', leadNom);
  if (leadEmail) newParams.set('email', leadEmail);
  if (leadTelefon) newParams.set('telefon', leadTelefon);

  return (
    <section className="rounded-xl border border-white/10 p-6 admin-card-glass">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Dossiers</h2>
        <Link
          href={`/admin/dossiers?${newParams.toString()}`}
          className="ap-btn ap-btn--secondary text-sm px-3 py-1.5"
        >
          + Nou dossier
        </Link>
      </div>

      {dossiers.length === 0 ? (
        <p className="text-sm opacity-50">Cap dossier generat per a aquest lead.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {dossiers.map((d) => {
            const productNames = ANIMACIO_PRODUCTS
              .filter((p) => d.productIds.includes(p.id))
              .map((p) => p.nom)
              .join(' · ');
            return (
              <li key={d.id} className="flex items-start justify-between gap-4 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{d.nom}{d.empresa ? ` — ${d.empresa}` : ''}</p>
                  <p className="text-xs opacity-60 mt-0.5">{productNames || 'Sense productes'}</p>
                  <p className="text-xs opacity-40 mt-1">
                    {formatDateShort(d.createdAt.toISOString())}
                    {d.sentAt ? ` · Enviat ${formatDateShort(d.sentAt.toISOString())} a ${d.sentTo}` : ''}
                  </p>
                </div>
                <LeadDossierActions
                  dossierId={d.id}
                  email={d.email ?? undefined}
                  nom={d.nom}
                  productIds={d.productIds}
                  clientInfo={{
                    nom: d.nom,
                    empresa: d.empresa ?? undefined,
                    telefon: d.telefon ?? undefined,
                    email: d.email ?? undefined,
                    eventDesc: d.eventDesc ?? undefined,
                    salutacio: d.salutacio ?? undefined,
                  }}
                  alreadySent={!!d.sentAt}
                  logoDataUri={logoDataUri}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
