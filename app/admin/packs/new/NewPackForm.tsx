'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { useAsyncForm } from '../../components/useAsyncForm';

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90';

export default function NewPackForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: '',
    price: 0,
    djHours: 3,
    service: 'discomovil',
    nameCa: '',
  });
  const { submitting, error, run } = useAsyncForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await run(async () => {
        const res = await fetchWithCsrf('/api/admin/packs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: form.slug.trim().toLowerCase(),
            service: form.service,
            price: Number(form.price),
            djHours: Number(form.djHours),
            translations: [
              { locale: 'ca', name: form.nameCa || form.slug, tagline: '', description: '', features: [] },
            ],
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.pack?.id) {
          throw new Error(data?.error || "No s'ha pogut crear el pack");
        }
        router.push(`/admin/packs/${data.pack.id}`);
      });
    } catch {
      // L'error queda centralitzat al hook.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pack-slug" className="mb-1 block text-sm">Slug</label>
          <input
            id="pack-slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputClass}
            placeholder="disco-basico"
            required
          />
        </div>
        <div>
          <label htmlFor="pack-name-ca" className="mb-1 block text-sm">Nom (CA)</label>
          <input
            id="pack-name-ca"
            value={form.nameCa}
            onChange={(e) => setForm({ ...form, nameCa: e.target.value })}
            className={inputClass}
            placeholder="Party Starter"
          />
        </div>
        <div>
          <label htmlFor="pack-service" className="mb-1 block text-sm">Servei</label>
          <select
            id="pack-service"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            className={inputClass}
          >
            <option value="fiestas">Festes</option>
            <option value="discomovil">Discomòbil</option>
            <option value="bodas">Bodes</option>
            <option value="empresas">Empreses</option>
          </select>
        </div>
        <div>
          <label htmlFor="pack-price" className="mb-1 block text-sm">Preu (€)</label>
          <input
            id="pack-price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
            className={inputClass}
            min={0}
            required
          />
        </div>
        <div>
          <label htmlFor="pack-dj-hours" className="mb-1 block text-sm">Hores DJ</label>
          <input
            id="pack-dj-hours"
            type="number"
            value={form.djHours}
            onChange={(e) => setForm({ ...form, djHours: Number(e.target.value) || 1 })}
            className={inputClass}
            min={1}
            required
          />
        </div>
      </div>

      {error && <p className="mt-3 rounded-xl border px-3 py-2 text-sm">{error}</p>}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? 'Creant...' : 'Crear pack'}
        </button>
        <Link href="/admin/packs" className="rounded-xl border px-4 py-2 text-sm">
          Cancel·lar
        </Link>
      </div>
    </form>
  );
}
