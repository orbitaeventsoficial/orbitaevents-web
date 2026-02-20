// lib/hooks/usePacks.ts
import { useEffect, useState } from 'react';
import type { PackDefinition, ServiceSlug } from '@/config/packs-config';

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
  const [state, setState] = useState<PacksState>({
    packs: fallback,
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
          packs: remotePacks.length > 0 ? remotePacks : fallback,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState({
          packs: fallback,
          loading: false,
          error: error instanceof Error ? error.message : 'Error carregant packs',
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [service, locale, fallback]);

  return state;
}
