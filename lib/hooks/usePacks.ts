// lib/hooks/usePacks.ts
import { useEffect, useMemo, useState } from 'react';
import type { PackDefinition, ServiceSlug } from '@/config/packs-config';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';

type PacksState = {
  packs: PackDefinition[];
  loading: boolean;
  error: string | null;
};

export function usePacks(options: {
  service?: ServiceSlug;
  locale: string;
  fallback?: PackDefinition[];
}) {
  const { service, locale, fallback = [] } = options;
  const localizedFallback = useMemo(
    () =>
      fallback.map((pack) => ({
        ...pack,
        name: resolvePackI18nKey(pack.name, locale),
        tagline: resolvePackI18nKey(pack.tagline, locale),
        emotion: resolvePackI18nKey(pack.emotion || pack.tagline || '', locale),
        features: resolvePackI18nFeatures(pack.features || [], locale),
        badge: pack.badge ? resolvePackI18nKey(pack.badge, locale) : null,
        ideal: resolvePackI18nKey(pack.ideal || '', locale),
      })),
    [fallback, locale]
  );

  const [state, setState] = useState<PacksState>({
    packs: localizedFallback,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (service) params.set('service', service);
        if (locale) params.set('locale', locale);

        const res = await fetch(`/api/public/packs?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('No s\'han pogut carregar els packs');
        }

        const data = await res.json();
        if (!active) return;
        const remotePacks = Array.isArray(data.packs) ? data.packs : [];

        setState({
          packs: remotePacks.length > 0 ? remotePacks : localizedFallback,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState({
          packs: localizedFallback,
          loading: false,
          error: error instanceof Error ? error.message : 'Error carregant packs',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [service, locale, localizedFallback]);

  return state;
}
