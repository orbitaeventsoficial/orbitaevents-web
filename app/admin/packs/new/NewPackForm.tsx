'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { PACK_SERVICE_OPTIONS } from '@/lib/constants';
import { useAsyncForm } from '../../components/useAsyncForm';

const inputClass = 'w-full ap-card px-3 py-2 text-sm text-[var(--t)]';

type PackServiceValue = (typeof PACK_SERVICE_OPTIONS)[number]['value'];

type NewPackFormState = {
  slug: string;
  price: string;
  djHours: string;
  service: PackServiceValue;
  nameCa: string;
};

export default function NewPackForm() {
  const router = useRouter();
  const [form, setForm] = useState<NewPackFormState>({
    slug: '',
    price: '',
    djHours: '3',
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
        router.push(buildPackHref(data.pack.id));
      });
    } catch {
      // L'error queda centralitzat al hook.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ap-card p-6">
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
            onChange={(e) => setForm({ ...form, service: e.target.value as PackServiceValue })}
            className={inputClass}
          >
            {PACK_SERVICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pack-price" className="mb-1 block text-sm">Preu (€)</label>
          <input
            id="pack-price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={inputClass}
            min={1}
            step={1}
            required
          />
        </div>
        <div>
          <label htmlFor="pack-dj-hours" className="mb-1 block text-sm">Hores DJ</label>
          <input
            id="pack-dj-hours"
            type="number"
            value={form.djHours}
            onChange={(e) => setForm({ ...form, djHours: e.target.value })}
            className={inputClass}
            min={1}
            step={1}
            required
          />
        </div>
      </div>

      {error && (
        <p className="ap-inline-alert ap-inline-alert--danger mt-3" role="alert" aria-live="assertive">
          Error: {error}
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="ap-btn ap-btn--primary disabled:opacity-60"
        >
          {submitting ? 'Creant...' : 'Crear pack'}
        </button>
        <Link href="/admin/packs" className="ap-btn ap-btn--secondary">
          Cancel·lar
        </Link>
      </div>
    </form>
  );
}
