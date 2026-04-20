'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import { EditorControlStrip } from '../components/EditorControlStrip';
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
  const filteredManual = useMemo(
    () => filtered.filter((placement) => placement.override.mode === 'manual').length,
    [filtered],
  );
  const coverageMode = stats.total === 0 ? 'default' : stats.manual > 0 ? 'warning' : 'success';
  const sectionLabel =
    activeSection === 'all'
      ? 'Totes les seccions'
      : sections.find((section) => section.id === activeSection)?.name || 'Secció activa';
  const weakestLink = loading
    ? 'Encara s’està carregant la monocapa visual del projecte.'
    : error
      ? 'Ara mateix hi ha un error de càrrega i el gestor no reflecteix l’estat real dels placements.'
      : stats.manual > 0
        ? `${stats.manual} placements depenen de override manual i convé revisar si encara cal mantenir-los fora de l’auto.`
        : 'La cobertura actual viu tota dins de la jerarquia automàtica.';
  const actionTitle = error
    ? 'Recuperar primer la lectura real del gestor'
    : filteredManual > 0
      ? 'Revisar overrides manuals abans d’afegir més imatges'
      : 'Governar la monocapa visual des de secció i cerca';
  const actionDescription = error
    ? 'Si el gestor no carrega bé, el següent pas útil no és tocar placements a cegues sinó recuperar la lectura real de dades.'
    : filteredManual > 0
      ? 'El millor retorn aquí és validar quins placements continuen necessitant override manual i quins poden tornar a la jerarquia automàtica.'
      : 'Amb la base estable, el treball bo és ordenar per secció, cercar el placement correcte i mantenir la monocapa neta, no duplicar camins visuals.';

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

      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: 'Quin estat té ara mateix la monocapa visual',
          tone: coverageMode,
          stats: [
            { label: 'Placements', value: stats.total, hint: `${sections.length} seccions` },
            { label: 'Manuals', value: stats.manual, tone: stats.manual > 0 ? 'warning' : 'success', hint: 'override explícit' },
            { label: 'Auto', value: stats.auto, tone: stats.auto > 0 ? 'success' : 'default', hint: 'jerarquia automàtica' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de tocar imatges',
          tone: error ? 'warning' : stats.manual > 0 ? 'warning' : 'info',
          items: [
            weakestLink,
            `Secció activa: ${sectionLabel}. ${filtered.length} placements visibles amb el filtre actual.`,
            search.trim()
              ? `La cerca actual és "${search.trim()}" i està acotant el treball sobre el catàleg.`
              : 'Sense cerca activa: el workspace està mostrant la cobertura completa del catàleg.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          tone: error || filteredManual > 0 ? 'warning' : 'success',
          secondaryPills: [
            activeSection === 'all' ? 'Vista global' : sectionLabel,
            search.trim() ? 'Cerca activa' : 'Sense cerca',
          ],
        }}
      />

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
