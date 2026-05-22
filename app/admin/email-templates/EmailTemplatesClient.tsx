'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '../components/ToastProvider';
import { EditorControlStrip } from '../components/EditorControlStrip';
import { buildEmailTemplateHref } from '@/lib/admin/emailTemplateWorkspaceHref';
import { SUPPORTED_LOCALES, SUPPORTED_LOCALE_LABELS } from '@/lib/constants';
import { ADMIN_EMAIL_TEMPLATE_SOURCE_BADGE } from '@/lib/constants/admin';

interface TemplateInfo {
  slug: string;
  description: string;
  locales: { locale: string; source: 'db' | 'default'; updatedAt?: string }[];
  variables: string[];
}


export default function EmailTemplatesClient() {
  const toast = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/email-templates');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error carregant llista de plantilles email', err);
      toast.error(err instanceof Error ? err.message : 'Error carregant');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm admin-tone-text-neutral" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant plantilles...
      </div>
    );
  }

  const customized = templates.filter((t) => t.locales.some((l) => l.source === 'db')).length;
  const defaultOnly = templates.length - customized;
  const allCovered = templates.filter((t) => t.locales.length === SUPPORTED_LOCALES.length).length;
  const totalLocaleVariants = templates.reduce((sum, template) => sum + template.locales.length, 0);
  const maxVariables = templates.reduce((max, template) => Math.max(max, template.variables.length), 0);
  const heaviestTemplate = templates.reduce<TemplateInfo | null>((current, template) => {
    if (!current) return template;
    return template.variables.length > current.variables.length ? template : current;
  }, null);
  const weakestLink =
    templates.length === 0
      ? 'Encara no hi ha cap plantilla carregada a l’admin.'
      : defaultOnly === templates.length
        ? 'Tot el catàleg depèn encara del fallback per defecte.'
        : defaultOnly > 0
          ? `${defaultOnly} plantilles encara viuen només del fallback per defecte.`
          : 'Totes les plantilles tenen almenys una capa personalitzada o revisada.';
  const actionTitle =
    templates.length === 0
      ? 'Carregar primer el catàleg mínim de plantilles'
      : defaultOnly > 0
        ? 'Cobrir primer les plantilles que encara depenen del fallback'
        : 'Revisar consistència i copy de les plantilles actives';
  const actionDescription =
    templates.length === 0
      ? 'Sense plantilles visibles no hi ha base editorial per a correus automàtics, notificacions ni post-event.'
      : defaultOnly > 0
        ? 'El retorn més alt aquí no és tocar totes les còpies alhora, sinó portar a capa pròpia les plantilles que encara depenen del text per defecte.'
        : 'Amb la cobertura bàsica resolta, el pas bo és revisar coherència entre idiomes, variables i to abans de seguir afegint automatismes.';

  return (
    <div className="space-y-4">
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: 'Quin estat té ara mateix el catàleg de correus',
          tone: templates.length === 0 ? 'default' : defaultOnly > 0 ? 'warning' : 'success',
          stats: [
            { label: 'Plantilles', value: templates.length, hint: `${totalLocaleVariants} variants visibles` },
            { label: 'Personalitzades', value: customized, tone: customized > 0 ? 'success' : 'default', hint: 'amb capa pròpia' },
            { label: 'Cobertes', value: allCovered, tone: allCovered === templates.length && templates.length > 0 ? 'success' : 'warning', hint: `${SUPPORTED_LOCALES.length} idiomes suportats` },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de tocar el copy',
          tone: templates.length === 0 ? 'default' : defaultOnly > 0 ? 'warning' : 'info',
          items: [
            weakestLink,
            heaviestTemplate
              ? `${heaviestTemplate.description} és ara mateix la plantilla amb més variables (${heaviestTemplate.variables.length}).`
              : 'Quan hi hagi plantilles carregades, aquí apareixerà la peça editorial més densa.',
            maxVariables > 0
              ? `La complexitat màxima visible és de ${maxVariables} variables en una sola plantilla.`
              : 'Encara no hi ha variables actives visibles en aquest catàleg.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          tone: defaultOnly > 0 || templates.length === 0 ? 'warning' : 'success',
          primaryAction: templates[0]
            ? {
                href: buildEmailTemplateHref(templates[0].slug, SUPPORTED_LOCALES[0]),
                label: 'Obrir primera plantilla',
              }
            : undefined,
          secondaryAction: { href: '/admin/settings/notifications', label: 'Notificacions' },
          secondaryPills: [
            `${SUPPORTED_LOCALES.length} idiomes`,
            defaultOnly > 0 ? `${defaultOnly} per defecte` : 'Sense fallbacks pendents',
          ],
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="ap-kpi">
          <div className="ap-kpi-label">Total plantilles</div>
          <div className="ap-kpi-value">{templates.length}</div>
        </div>
        <div className="ap-kpi ap-kpi--success">
          <div className="ap-kpi-label">Personalitzades</div>
          <div className="ap-kpi-value">{customized}</div>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <div className="ap-kpi-label">Idiomes</div>
          <div className="ap-kpi-value">{SUPPORTED_LOCALES.length}</div>
          <div className="ap-kpi-trend">{SUPPORTED_LOCALES.map((locale) => locale.toUpperCase()).join(' · ')}</div>
        </div>
      </div>

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.slug} className="ap-card rounded-2xl p-4 transition-all hover:admin-tone-bg-neutral">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{t.description}</div>
                <div className="mt-0.5 font-mono text-xs admin-tone-text-slate">{t.slug}</div>
              </div>
              <div className="flex items-center gap-2 text-xs admin-tone-text-slate">{t.variables.length} variables</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {t.locales.map((l) => {
                const badge = ADMIN_EMAIL_TEMPLATE_SOURCE_BADGE[l.source];
                return (
                  <Link
                    key={l.locale}
                    href={buildEmailTemplateHref(t.slug, l.locale)}
                    className="ap-btn ap-btn--secondary"
                  >
                    <span className="font-semibold">{SUPPORTED_LOCALE_LABELS[l.locale] || l.locale}</span>
                    <span className={badge.className}>{badge.label}</span>
                  </Link>
                );
              })}
            </div>

            {t.variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.variables.map((v) => (
                  <span key={v} className="ap-badge font-mono text-[10px]">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
