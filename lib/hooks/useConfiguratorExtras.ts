import { useEffect, useState } from 'react';
import { EXTRAS, type ExtraDefinition } from '@/config/packs-config';

export function useConfiguratorExtras(locale: string) {
  const [extrasCatalog, setExtrasCatalog] = useState<ExtraDefinition[]>(EXTRAS.filter(e => e.enabled !== false));

  useEffect(() => {
    let active = true;

    async function loadExtras() {
      try {
        const res = await fetch(`/api/public/extras?locale=${locale}`, { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (Array.isArray(data?.extras)) {
          setExtrasCatalog((data.extras as ExtraDefinition[]).filter(e => e.enabled !== false));
        }
      } catch (error) {
        console.error('[Configurador] Error carregant extres:', error);
      }
    }

    loadExtras();
    return () => {
      active = false;
    };
  }, [locale]);

  return extrasCatalog;
}
