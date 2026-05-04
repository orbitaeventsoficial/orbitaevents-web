// lib/hooks/usePacks.ts
import { useEffect, useMemo, useState } from 'react';
import type { PackDefinition, ServiceSlug } from '@/config/packs-config';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';
import { fetchPublicPacks } from '@/lib/api/publicPacksClient';

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
        const response = await fetchPublicPacks(
          { service, locale },
          { cache: 'no-store' },
        );
        if (!active) return;
        const remotePacks = Array.isArray(response.packs)
          ? (response.packs as PackDefinition[])
          : [];

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
