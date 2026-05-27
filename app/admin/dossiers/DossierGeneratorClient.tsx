'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { buildDossierHtml } from '@/lib/utils/dossier-html-builder';
import './dossiers.css';

interface Props {
  products: AnimacioProduct[];
  logoDataUri?: string;
  leadId?: string;
  initialNom?: string;
  initialEmail?: string;
  initialTelefon?: string;
  initialEmpresa?: string;
  initialEventDesc?: string;
}

type LeadResult = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  eventType: string;
  status: string;
  eventDate: string | null;
  eventLocation: string | null;
};

export function DossierGeneratorClient({ products, logoDataUri, leadId: initialLeadId, initialNom, initialEmail, initialTelefon, initialEmpresa, initialEventDesc }: Props) {
  const toast = useToast();
  const [linkedLeadId, setLinkedLeadId] = useState(initialLeadId ?? '');
  const [nom, setNom] = useState(initialNom ?? '');
  const [empresa, setEmpresa] = useState(initialEmpresa ?? '');
  const [telefon, setTelefon] = useState(initialTelefon ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [eventDesc, setEventDesc] = useState(initialEventDesc ?? '');
  const [salutacio, setSalutacio] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(products.map((p) => p.id)),
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Cercador de leads
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeadResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLeads = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/leads?search=${encodeURIComponent(q)}&limit=8`);
      if (!res.ok) return;
      const data = await res.json() as { leads?: LeadResult[] };
      setSearchResults(data.leads ?? []);
      setShowResults(true);
    } catch {
      // silenci
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchLeads(q), 280);
  }

  function selectLead(lead: LeadResult) {
    setLinkedLeadId(lead.id);
    setNom(lead.name);
    setEmail(lead.email ?? '');
    setTelefon(lead.phone ?? '');
    const parts: string[] = [];
    if (lead.eventType && lead.eventType !== 'OTHER') parts.push(lead.eventType);
    if (lead.eventDate) parts.push(lead.eventDate.slice(0, 10));
    if (lead.eventLocation) parts.push(lead.eventLocation);
    setEventDesc(parts.join(' · '));
    setSearchQuery('');
    setShowResults(false);
    setSavedId(null);
  }

  function clearLinkedLead() {
    setLinkedLeadId('');
    setNom('');
    setEmail('');
    setTelefon('');
    setEventDesc('');
    setSavedId(null);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function generate(mode: 'preview' | 'pdf' | 'download') {
    if (!nom.trim()) return;
    setGenerating(true);
    try {
      const selected = products.filter((p) => selectedIds.has(p.id));
      const clientInfo = {
        nom: nom.trim(), empresa: empresa.trim(), telefon: telefon.trim(),
        email: email.trim(), eventDesc: eventDesc.trim(),
        salutacio: salutacio.trim() || undefined,
      };
      const html = buildDossierHtml(clientInfo, selected, { autoPrint: mode === 'pdf', logoDataUri });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier-${nom.trim().toLowerCase().replace(/[^a-z0-9àáèéíïòóúüç]+/gi, '-')}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function saveDossier() {
    if (!nom.trim() || selectedIds.size === 0) return;
    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: linkedLeadId || undefined,
          nom: nom.trim(),
          empresa: empresa.trim() || undefined,
          telefon: telefon.trim() || undefined,
          email: email.trim() || undefined,
          eventDesc: eventDesc.trim() || undefined,
          salutacio: salutacio.trim() || undefined,
          productIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error('Error desant');
      const data = await res.json() as { id: string };
      setSavedId(data.id);
      toast.success('Dossier desat correctament');
    } catch (err) {
      console.error('[DossierGenerator] saveDossier error:', err);
      toast.error('Error desant el dossier');
    } finally {
      setSaving(false);
    }
  }

  const canGenerate = nom.trim().length > 0 && selectedIds.size > 0;

  return (
    <div className="dg__wrap">

      {/* Cercador de leads */}
      <div className="dg__search-wrap" ref={searchRef}>
        {linkedLeadId ? (
          <div className="dg__linked-lead">
            <span className="dg__linked-label">Lead vinculat:</span>
            <span className="dg__linked-nom">{nom}</span>
            {email && <span className="dg__linked-email">{email}</span>}
            <button type="button" className="dg__linked-clear" onClick={clearLinkedLead} aria-label="Desvincula el lead">
              ✕ Canviar
            </button>
          </div>
        ) : (
          <div className="dg__search-field">
            <label htmlFor="dg-search" className="dg__label">Cerca lead existent</label>
            <input
              id="dg-search"
              type="search"
              className="ix__forminput"
              placeholder="Nom, email o telèfon..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              autoComplete="off"
            />
            {searching && <span className="dg__search-spinner">Cercant…</span>}
            {showResults && searchResults.length > 0 && (
              <ul className="dg__search-results">
                {searchResults.map((lead) => (
                  <li key={lead.id}>
                    <button type="button" className="dg__search-result" onClick={() => selectLead(lead)}>
                      <span className="dg__sr-nom">{lead.name}</span>
                      <span className="dg__sr-meta">
                        {lead.email ?? lead.phone ?? ''}
                        {' · '}
                        {lead.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showResults && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
              <div className="dg__search-empty">Cap lead trobat. Omple les dades manualment.</div>
            )}
          </div>
        )}
      </div>

      <div className="dg__grid">
        {/* Dades client */}
        <section className="ap-card rounded-2xl p-6">
          <h2 className="dg__section-title">Dades del client</h2>
          <div className="dg__fields">
            <div className="dg__field">
              <label htmlFor="dg-nom" className="dg__label">Nom *</label>
              <input id="dg-nom" type="text" className="ix__forminput" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Adrià" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-empresa" className="dg__label">Empresa / Associació</label>
              <input id="dg-empresa" type="text" className="ix__forminput" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Associació de Veïns de Rubí" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-telefon" className="dg__label">Telèfon</label>
              <input id="dg-telefon" type="tel" className="ix__forminput" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="+34 654 46 70 87" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-email" className="dg__label">Email</label>
              <input id="dg-email" type="email" className="ix__forminput" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@exemple.com" autoComplete="off" />
            </div>
            <div className="dg__field dg__field--full">
              <label htmlFor="dg-event" className="dg__label">Descripció de l&apos;event</label>
              <input id="dg-event" type="text" className="ix__forminput" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Event: 11 de juliol · 22:00 a 00:00" autoComplete="off" />
            </div>
            <div className="dg__field dg__field--full">
              <label htmlFor="dg-salutacio" className="dg__label">
                Text d&apos;introducció
                <span className="dg__label-hint">opcional — si és buit s'usa el text per defecte</span>
              </label>
              <textarea id="dg-salutacio" className="ix__forminput ix__forminput--textarea" value={salutacio} onChange={(e) => setSalutacio(e.target.value)} placeholder="Gràcies per contactar amb nosaltres..." rows={4} />
            </div>
          </div>
        </section>

        {/* Selecció productes */}
        <section className="ap-card rounded-2xl p-6">
          <h2 className="dg__section-title">Productes a incloure</h2>
          <p className="dg__section-hint">Selecciona els productes que vols afegir al dossier.</p>
          <div className="dg__products">
            {products.map((p) => {
              const checked = selectedIds.has(p.id);
              return (
                <label key={p.id} className={`dg__product-card${checked ? ' dg__product-card--active' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} className="dg__product-checkbox" aria-label={`Incloure ${p.nom}`} />
                  <div className="dg__product-info">
                    <span className="dg__product-name">{p.nom}</span>
                    {p.trams && p.trams.length > 0 && (
                      <span className="dg__product-price">des de {p.trams.find((t) => t.price !== null)?.price}€</span>
                    )}
                    {p.djOptions && p.djOptions.length > 0 && (
                      <span className="dg__product-price">des de {p.djOptions.find((o) => o.price !== null)?.price}€/h</span>
                    )}
                  </div>
                  <div className={`dg__product-check${checked ? ' dg__product-check--on' : ''}`}>✓</div>
                </label>
              );
            })}
          </div>
          {selectedIds.size === 0 && <p className="dg__warn">Selecciona almenys un producte per generar el dossier.</p>}
        </section>
      </div>

      {/* Accions */}
      <div className="dg__actions">
        <button type="button" className="dg__btn dg__btn--preview" onClick={() => generate('preview')} disabled={!canGenerate || generating}>
          Previsualitzar
        </button>
        <button type="button" className="dg__btn dg__btn--pdf" onClick={() => generate('pdf')} disabled={!canGenerate || generating}>
          Guardar PDF
        </button>
        <button type="button" className="dg__btn dg__btn--save" onClick={saveDossier} disabled={!canGenerate || saving}>
          {saving ? 'Desant…' : savedId ? '✓ Desat' : 'Desar al sistema'}
        </button>
        <button type="button" className="dg__btn dg__btn--download" onClick={() => generate('download')} disabled={!canGenerate || generating}>
          Descarregar HTML
        </button>
        <span className="dg__hint">
          {!nom.trim() ? 'Omple el nom del client per continuar' : selectedIds.size === 0 ? 'Selecciona almenys un producte' : `${selectedIds.size} producte${selectedIds.size > 1 ? 's' : ''} seleccionat${selectedIds.size > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}
