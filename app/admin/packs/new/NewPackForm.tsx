'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const inputClass = 'w-full rounded-xl border border-slate-600/60 bg-slate-900/80 px-3 py-2 text-sm text-slate-100';

export default function NewPackForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '',
    price: 0,
    djHours: 3,
    service: 'discomovil',
    nameCa: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/packs', {
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
        throw new Error(data?.error || 'No s’ha pogut crear el pack');
      }
      router.push(`/admin/packs/${data.pack.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperat');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputClass}
            placeholder="party-starter"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Nom (CA)</label>
          <input
            value={form.nameCa}
            onChange={(e) => setForm({ ...form, nameCa: e.target.value })}
            className={inputClass}
            placeholder="Party Starter"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Servei</label>
          <select
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            className={inputClass}
          >
            <option value="fiestas">fiestas</option>
            <option value="discomovil">discomovil</option>
            <option value="bodas">bodas</option>
            <option value="empresas">empresas</option>
            <option value="produccion">produccion</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Preu (€)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
            className={inputClass}
            min={0}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Hores DJ</label>
          <input
            type="number"
            value={form.djHours}
            onChange={(e) => setForm({ ...form, djHours: Number(e.target.value) || 1 })}
            className={inputClass}
            min={1}
            required
          />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg border px-3 py-2 text-sm">{error}</p>}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Creant...' : 'Crear pack'}
        </button>
        <Link href="/admin/packs" className="rounded-xl border px-4 py-2 text-sm">
          Cancel·lar
        </Link>
      </div>
    </form>
  );
}

