'use client';

/**
 * CODIS DE DESCOMPTE - Gestió de codis promocionals
 * Creació, llistat, activació/desactivació
 * No acumulable amb descomptes web (per defecte)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateSimple } from '@/lib/constants';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { useAsyncForm } from '../components/useAsyncForm';
import { pluralize } from '@/lib/utils/pluralize';
import { log } from '@/lib/logger';

type DiscountCode = {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  description: string | null;
  validFrom: string;
  validUntil: string;
  maxUses: number | null;
  currentUses: number;
  minOrderValue: number | null;
  isAccumulative: boolean;
  sourceType: string | null;
  isActive: boolean;
  createdAt: string;
};

type Stats = {
  total: number;
  active: number;
  expired: number;
  totalUses: number;
};

type FormData = {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  description: string;
  validUntil: string;
  maxUses: string;
  minOrderValue: string;
  isAccumulative: boolean;
};

const INITIAL_FORM: FormData = {
  code: '',
  type: 'PERCENTAGE',
  value: '10',
  description: '',
  validUntil: '',
  maxUses: '',
  minOrderValue: '',
  isAccumulative: false,
};

export default function DiscountCodesPage() {
  const toast = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const { submitting, error: formError, success, setError: setFormError, setSuccess, run, reset } = useAsyncForm();

  const loadCodes = useCallback(async () => {
    setError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetchWithCsrf('/api/admin/discount-codes', { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setError('La connexió ha trigat massa. Reintenta.');
      } else {
        log.error('[DiscountCodes] Error carregant codis', error);
        setError('Error carregant codis de descompte');
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#nou-codi') {
      setShowForm(true);
    }
  }, []);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.code || !form.value || !form.validUntil) {
      setFormError('Codi, valor i data de caducitat són obligatoris');
      return;
    }

    try {
      await run(async () => {
        const body = {
          code: form.code.trim(),
          type: form.type,
          value: parseFloat(form.value) || 0,
          description: form.description.trim() || undefined,
          validUntil: form.validUntil,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
          minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : undefined,
          isAccumulative: form.isAccumulative,
        };

        const res = await fetchWithCsrf('/api/admin/discount-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Error creant codi');
        }

        setSuccess(`Codi "${form.code.toUpperCase()}" creat correctament`);
        setForm(INITIAL_FORM);
        setShowForm(false);
        await loadCodes();
      });
    } catch {
      // L'error queda centralitzat al hook.
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetchWithCsrf('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _action: 'toggle', id, isActive: !active }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error canviant l\'estat del codi');
      }

      await loadCodes();
      toast.success(!active ? 'Codi activat' : 'Codi desactivat');
    } catch (error) {
      log.error('[DiscountCodes] Error canviant estat', error);
      toast.error(error instanceof Error ? error.message : 'Error canviant l\'estat del codi');
    }
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const strip = useMemo(() => {
    if (!stats) return null;

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    const expiredFlaggedActive = codes.filter((c) => c.isActive && isExpired(c.validUntil)).length;
    const exhaustedFlaggedActive = codes.filter(
      (c) => c.isActive && c.maxUses != null && c.currentUses >= c.maxUses,
    ).length;
    const nearMaxUses = codes.filter(
      (c) =>
        c.isActive &&
        !isExpired(c.validUntil) &&
        c.maxUses != null &&
        c.currentUses < c.maxUses &&
        c.currentUses / c.maxUses >= 0.8,
    ).length;
    const aboutToExpire = codes.filter((c) => {
      if (!c.isActive || isExpired(c.validUntil)) return false;
      const until = new Date(c.validUntil).getTime();
      return until - now <= SEVEN_DAYS;
    }).length;
    const unusedActive = codes.filter(
      (c) => c.isActive && !isExpired(c.validUntil) && c.currentUses === 0,
    ).length;
    const firstExpiredFlag = codes.find((c) => c.isActive && isExpired(c.validUntil));

    const systemItems: string[] = [];
    if (stats.total > 0) {
      systemItems.push(`${stats.total} codis al catàleg · ${stats.active} actius · ${stats.expired} caducats`);
    }
    if (stats.totalUses > 0) {
      systemItems.push(`${stats.totalUses} ${pluralize(stats.totalUses, 'ús acumulat', 'usos acumulats')}`);
    }
    if (stats.total === 0) {
      systemItems.push('Cap codi creat encara');
    }

    const manualItems: string[] = [];
    if (expiredFlaggedActive > 0) {
      manualItems.push(
        `${expiredFlaggedActive} ${pluralize(expiredFlaggedActive, 'codi caducat encara marcat', 'codis caducats encara marcats')} actius`,
      );
    }
    if (exhaustedFlaggedActive > 0) {
      manualItems.push(
        `${exhaustedFlaggedActive} ${pluralize(exhaustedFlaggedActive, 'codi ha', 'codis han')} esgotat els usos màxims`,
      );
    }
    if (aboutToExpire > 0) {
      manualItems.push(
        `${aboutToExpire} ${pluralize(aboutToExpire, 'codi caduca', 'codis caduquen')} en ≤7 dies`,
      );
    }
    if (nearMaxUses > 0) {
      manualItems.push(
        `${nearMaxUses} ${pluralize(nearMaxUses, 'codi està', 'codis estan')} a ≥80% d'usos`,
      );
    }
    if (unusedActive > 0) {
      manualItems.push(
        `${unusedActive} ${pluralize(unusedActive, 'codi actiu sense ús', 'codis actius sense cap ús')}`,
      );
    }

    const systemTone: 'info' | 'warning' | 'success' =
      stats.total === 0 ? 'info' : stats.active === 0 ? 'warning' : 'success';

    const manualTone: 'info' | 'warning' | 'success' =
      expiredFlaggedActive > 0 || exhaustedFlaggedActive > 0
        ? 'warning'
        : manualItems.length > 0
          ? 'info'
          : 'success';

    const nextStep =
      stats.total === 0
        ? {
            eyebrow: 'Següent pas · Primer codi',
            title: 'Crear el primer codi de descompte',
            detail:
              'Encara no hi ha cap codi promocional. Activa un per enganxar campanyes, referits o segones reserves.',
            href: '#nou-codi',
            ctaLabel: 'Obrir formulari',
          }
        : expiredFlaggedActive > 0
          ? {
              eyebrow: 'Següent pas · Higiene',
              title: `Desactivar ${expiredFlaggedActive} ${pluralize(expiredFlaggedActive, 'codi caducat', 'codis caducats')}`,
              detail: firstExpiredFlag
                ? `"${firstExpiredFlag.code}" i ${expiredFlaggedActive - 1 >= 0 ? expiredFlaggedActive - 1 : 0} més tenen la bandera activa tot i haver caducat. Desactiva'ls per evitar errors d'aplicació.`
                : 'Hi ha codis caducats amb la bandera activa. Desactiva\'ls per evitar errors d\'aplicació.',
              href: '#codis-list',
              ctaLabel: 'Revisar llista',
            }
          : exhaustedFlaggedActive > 0
            ? {
                eyebrow: 'Següent pas · Usos',
                title: 'Tancar codis esgotats',
                detail: `${exhaustedFlaggedActive} ${pluralize(exhaustedFlaggedActive, 'codi ha', 'codis han')} arribat al màxim d'usos però continuen actius. Desactiva\'ls per mantenir el catàleg net.`,
                href: '#codis-list',
                ctaLabel: 'Revisar llista',
              }
            : aboutToExpire > 0
              ? {
                  eyebrow: 'Següent pas · Renovació',
                  title: `${aboutToExpire} ${pluralize(aboutToExpire, 'codi caduca', 'codis caduquen')} aviat`,
                  detail:
                    'Revisa si cal crear un codi de relleu abans que caduqui. Sense codi viu no pots aplicar promoció en aquest període.',
                  href: '#nou-codi',
                  ctaLabel: 'Nou codi',
                  secondaryAction: { href: '#codis-list', label: 'Veure llista' },
                }
              : stats.active === 0 && stats.total > 0
                ? {
                    eyebrow: 'Següent pas · Reviu',
                    title: 'Cap codi actiu ara mateix',
                    detail:
                      'Tots els codis del catàleg estan inactius o caducats. Activa\'n un d\'existent o crea\'n un de nou.',
                    href: '#codis-list',
                    ctaLabel: 'Revisar catàleg',
                    secondaryAction: { href: '#nou-codi', label: 'Nou codi' },
                  }
                : {
                    eyebrow: 'Següent pas',
                    title: 'Catàleg de codis al dia',
                    detail: `${stats.active} ${pluralize(stats.active, 'codi actiu disponible', 'codis actius disponibles')}. Aprofita per crear codis dirigits (referits, campanyes, segona reserva).`,
                    href: '#nou-codi',
                    ctaLabel: 'Nou codi',
                  };

    return {
      system: {
        eyebrow: 'Automàtic · Catàleg',
        title:
          stats.total === 0
            ? 'Sense codis encara'
            : stats.active === 0
              ? 'Sense codi actiu'
              : 'Catàleg promocional',
        tone: systemTone,
        items: systemItems,
        emptyText: 'Encara no hi ha codis.',
      },
      manual: {
        eyebrow: 'Manual · Backlog',
        title:
          manualItems.length === 0
            ? 'Cap senyal manual'
            : `${manualItems.length} ${pluralize(manualItems.length, 'senyal per revisar', 'senyals per revisar')}`,
        tone: manualTone,
        items: manualItems,
        emptyText: 'Sense codis caducats, esgotats ni propers a vèncer.',
      },
      nextStep,
    };
  }, [codes, stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !codes.length) {
    return (
      <AdminPage title="Codis de descompte" subtitle="Gestiona codis promocionals per a reserves" className="max-w-5xl">
        <AdminEmptyState
          icon="⚠️"
          title={error}
          action={
            <button type="button" onClick={() => { setLoading(true); loadCodes(); }} className="ap-btn ap-btn--primary">
              Reintentar
            </button>
          }
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Codis de descompte"
      subtitle="Gestiona codis promocionals per a reserves"
      actions={
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="ap-btn ap-btn--primary"
        >
          {showForm ? 'Tancar' : '+ Nou codi'}
        </button>
      }
      className="max-w-5xl"
    >
      {strip && (
        <OwnerControlStrip
          className="mb-2"
          system={strip.system}
          manual={strip.manual}
          nextStep={strip.nextStep}
        />
      )}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-medium uppercase">Total codis</p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-medium uppercase">Actius</p>
            <p className="mt-2 text-3xl font-bold">{stats.active}</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-medium uppercase">Caducats</p>
            <p className="mt-2 text-3xl font-bold">{stats.expired}</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-medium uppercase">Usos totals</p>
            <p className="mt-2 text-3xl font-bold">{stats.totalUses}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border p-4">
          <p className="text-sm">{success}</p>
        </div>
      )}
      {formError && (
        <div className="rounded-xl border p-4">
          <p className="text-sm">{formError}</p>
        </div>
      )}

      <div id="nou-codi" aria-hidden="true" />
      {showForm && (
        <div className="rounded-2xl border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Nou codi de descompte</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="dc-code" className="text-xs">Codi *</label>
              <input
                id="dc-code"
                type="text"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="BODA2026"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs">Tipus</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('type', 'PERCENTAGE')}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                    form.type === 'PERCENTAGE'
                      ? 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
                      : 'admin-tone-idle'
                  }`}
                >
                  Percentatge %
                </button>
                <button
                  type="button"
                  onClick={() => updateField('type', 'FIXED_AMOUNT')}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                    form.type === 'FIXED_AMOUNT'
                      ? 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
                      : 'admin-tone-idle'
                  }`}
                >
                  Import fix
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="dc-value" className="text-xs">
                Valor * {form.type === 'PERCENTAGE' ? '(%)' : '(â‚¬)'}
              </label>
              <input
                id="dc-value"
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => updateField('value', e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="dc-valid-until" className="text-xs">Vàlid fins *</label>
              <input
                id="dc-valid-until"
                type="date"
                value={form.validUntil}
                onChange={(e) => updateField('validUntil', e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
            <div>
              <label htmlFor="dc-max-uses" className="text-xs">Usos màxims</label>
              <input
                id="dc-max-uses"
                type="number"
                min={0}
                value={form.maxUses}
                onChange={(e) => updateField('maxUses', e.target.value)}
                placeholder="Il·limitat"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
            <div>
              <label htmlFor="dc-min-order" className="text-xs">Comanda mínima (â‚¬)</label>
              <input
                id="dc-min-order"
                type="number"
                min={0}
                value={form.minOrderValue}
                onChange={(e) => updateField('minOrderValue', e.target.value)}
                placeholder="Sense mínim"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
          </div>

          <div>
            <label htmlFor="dc-description" className="text-xs">Descripció</label>
            <input
              id="dc-description"
              type="text"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descripció interna del codi..."
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAccumulative}
                onChange={(e) => updateField('isAccumulative', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Acumulable amb descomptes web</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting || !form.code || !form.value || !form.validUntil}
              className="ap-btn ap-btn--primary disabled:opacity-50"
            >
              {submitting ? 'Creant...' : 'Crear codi'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); }}
              className="rounded-xl border px-4 py-2.5 text-sm transition-colors"
            >
              Cancel·lar
            </button>
          </div>
        </div>
      )}

      <div id="codis-list" aria-hidden="true" />

      <section className="lg:hidden space-y-3">
        {codes.map((c) => {
          const expired = isExpired(c.validUntil);
          const maxReached = c.maxUses != null && c.currentUses >= c.maxUses;
          const active = c.isActive && !expired && !maxReached;
          return (
            <article key={c.id} className="ap-card block rounded-2xl p-4 transition-colors hover:admin-tone-bg-neutral">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <code className="text-sm font-mono px-2 py-0.5 rounded bg-white/5">{c.code}</code>
                  {c.description && <p className="text-xs mt-1">{c.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-lg">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : `${c.value}â‚¬`}
                  </span>
                  <span className={`block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium text-center ${
                    active ? 'admin-tone-soft-success' : 'bg-white/5 text-white/40'
                  }`}>
                    {active ? 'Actiu' : 'Inactiu'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3 admin-tone-border-neutral text-xs">
                <div className="flex items-center gap-3">
                  <span>{c.type === 'PERCENTAGE' ? 'Percentatge' : 'Import fix'}</span>
                  <span className={expired ? 'admin-tone-text-danger' : ''}>
                    {formatDateSimple(c.validUntil)}{expired ? ' (caducat)' : ''}
                  </span>
                  <span>{c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ''} usos</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(c.id, c.isActive)}
                  className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors min-h-[44px]"
                >
                  {c.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </article>
          );
        })}
        {codes.length === 0 && (
          <AdminEmptyState
            icon="🎟️"
            title="No hi ha codis de descompte"
            description="Crea el primer codi per oferir promocions"
          />
        )}
      </section>

      <div className="hidden lg:block rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Codis de descompte">
            <thead className="border-b">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium">Codi</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Tipus</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Valor</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Vàlid fins</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Usos</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Estat</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Acumulable</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y admin-tone-border-subtle">
              {codes.map((c) => {
                const expired = isExpired(c.validUntil);
                const maxReached = c.maxUses != null && c.currentUses >= c.maxUses;
                return (
                  <tr key={c.id} className="transition-colors adm-row-hover">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono px-2 py-1 rounded">{c.code}</code>
                      {c.description && <p className="text-xs mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3">{c.type === 'PERCENTAGE' ? 'Percentatge' : 'Import fix'}</td>
                    <td className="px-4 py-3 font-semibold">{c.type === 'PERCENTAGE' ? `${c.value}%` : `${c.value}â‚¬`}</td>
                    <td className={`px-4 py-3 ${expired ? 'admin-tone-text-danger' : 'text-white/60'}`}>
                      {formatDateSimple(c.validUntil)}
                      {expired && <span className="block text-xs">Caducat</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ''}
                      {maxReached && <span className="block text-xs">Exhaurit</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.isActive && !expired && !maxReached
                            ? 'admin-tone-soft-success'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {c.isActive && !expired && !maxReached ? 'Actiu' : 'Inactiu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{c.isAccumulative ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(c.id, c.isActive)}
                        className="rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors"
                      >
                        {c.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {codes.length === 0 && (
          <div className="p-12">
            <AdminEmptyState
              icon="🎟️"
              title="No hi ha codis de descompte"
              description="Crea el primer codi per oferir promocions"
            />
          </div>
        )}
      </div>
    </AdminPage>
  );
}

