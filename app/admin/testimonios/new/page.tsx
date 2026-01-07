import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const EVENT_TYPES = [
  'WEDDING',
  'BIRTHDAY',
  'CORPORATE',
  'COMMUNION',
  'BAPTISM',
  'GRADUATION',
  'ANNIVERSARY',
  'PRIVATE_PARTY',
  'OTHER',
] as const;

const LOCALES = ['ca', 'es', 'en'] as const;

type EventTypeValue = (typeof EVENT_TYPES)[number];

function getString(value: FormDataEntryValue | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return '';
}

async function createTestimonial(formData: FormData) {
  'use server';
  const authorName = getString(formData.get('authorName'));
  const authorLabel = getString(formData.get('authorLabel'));
  const quote = getString(formData.get('quote'));
  const locale = getString(formData.get('locale')) || 'ca';
  const ratingRaw = Number(formData.get('rating'));
  const eventTypeRaw = getString(formData.get('eventType'));
  const isFeatured = formData.get('isFeatured') === 'on';
  const isVerified = formData.get('isVerified') !== 'off';

  if (!authorName || !quote || Number.isNaN(ratingRaw)) {
    redirect('/admin/testimonios/new?error=missing');
  }

  const rating = Math.min(5, Math.max(1, ratingRaw));
  const eventType: EventTypeValue | null =
    EVENT_TYPES.includes(eventTypeRaw as EventTypeValue) ? (eventTypeRaw as EventTypeValue) : null;
  const safeLocale = LOCALES.includes(locale as (typeof LOCALES)[number]) ? locale : 'ca';

  await prisma.testimonial.create({
    data: {
      authorName,
      authorLabel: authorLabel || null,
      rating,
      eventType,
      isFeatured,
      isVerified,
      isActive: true,
      order: 0,
      translations: {
        create: [
          {
            locale: safeLocale,
            quote,
          },
        ],
      },
    },
  });

  redirect('/admin/testimonios?created=1');
}

export default function NewTestimonialPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/testimonios" className="text-sm text-slate-500 hover:text-slate-700">
            ← Tornar a testimonis
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
            Nou testimoni
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Afegeix un testimoni manual per a la web.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Falten camps obligatoris.
        </div>
      )}

      <form action={createTestimonial} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom del client *</label>
          <input
            name="authorName"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="Laura & Marc"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Etiqueta (opcional)</label>
          <input
            name="authorLabel"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="Boda a Granollers"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valoració *</label>
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            defaultValue={5}
            required
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipus d'event</label>
          <select
            name="eventType"
            defaultValue="OTHER"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="WEDDING">Boda</option>
            <option value="BIRTHDAY">Aniversari</option>
            <option value="CORPORATE">Corporatiu</option>
            <option value="COMMUNION">Comuni&#243;</option>
            <option value="BAPTISM">Bateig</option>
            <option value="GRADUATION">Graduaci&#243;</option>
            <option value="ANNIVERSARY">Aniversari</option>
            <option value="PRIVATE_PARTY">Festa privada</option>
            <option value="OTHER">Altres</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
          <select
            name="locale"
            defaultValue="ca"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="ca">Català</option>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Text del testimoni *</label>
          <textarea
            name="quote"
            rows={4}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="El servei va ser increïble..."
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isFeatured" className="rounded border-slate-300" />
            Destacat
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isVerified" defaultChecked className="rounded border-slate-300" />
            Verificat
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href="/admin/testimonios"
            className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel·lar
          </Link>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
