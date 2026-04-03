'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import ImagePlacementCard from './ImagePlacementCard';
import type { ImageManagerSection } from './image-manager-config';
import type { PlacementRow } from './ImagePlacementCard';

export default function ImageManagerPage() {
  const [sections, setSections] = useState<ImageManagerSection[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithCsrf('/api/admin/image-manager');
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "No s'ha pogut carregar el gestor d'imatges");
        return;
      }
      setSections(data.sections || []);
      setPlacements(data.placements || []);
      setSuccess(null);
    } catch {
      setError("Error de connexió carregant el gestor d'imatges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return placements.filter((placement) => {
      if (activeSection !== 'all' && placement.section !== activeSection) return false;
      if (!term) return true;
      return [placement.key, placement.label, placement.description, placement.target]
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [placements, activeSection, search]);

  const stats = useMemo(() => {
    const manual = placements.filter((p) => p.override.mode === 'manual').length;
    return { total: placements.length, manual, auto: placements.length - manual };
  }, [placements]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Gestor d&apos;imatges</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Monocapa de govern visual del projecte. Puja imatges des d&apos;aquí i es propaguen a web, mòbil i SEO automàticament.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            {stats.total} placements
          </span>
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-amber-300">
            {stats.manual} manuals
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            {stats.auto} auto
          </span>
        </div>
      </div>

      <AdminHelpPanel
        title="Com funciona"
        description="Puja una imatge a qualsevol placement i es processarà automàticament (AVIF per web, JPEG per OG, format original per marca). Tots els consumidors (pàgines, mòbil, SEO) l'usen."
        items={[
          {
            title: 'Pujar',
            body: "Arrossega o clica la zona de drop per assignar una imatge. Es desa a uploads/ i es registra a la BBDD.",
          },
          {
            title: 'Col·leccions',
            body: "Heroes, galeries i logos admeten múltiples imatges amb ordre. Puja més d'una i reordena amb les fletxes.",
          },
          {
            title: 'Tornar a auto',
            body: "El botó «Tornar a auto» elimina les imatges manuals i recupera la jerarquia real (PortfolioMedia, booking photos, fallback).",
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`w-full rounded-2xl px-4 py-2 text-left text-sm ${activeSection === 'all' ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 text-white/70'}`}
            >
              Totes les seccions
            </button>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-2xl px-4 py-2 text-left text-sm ${activeSection === section.id ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 text-white/70'}`}
              >
                {section.icon} {section.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca per clau, target o descripció"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>

          {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {success && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">Carregant placements...</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((placement) => (
                <ImagePlacementCard
                  key={placement.key}
                  placement={placement}
                  onReload={loadData}
                />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-white/40">
                  Cap placement trobat
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
