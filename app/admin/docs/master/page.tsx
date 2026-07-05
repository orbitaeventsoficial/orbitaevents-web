import { AdminKpi, AdminKpiRow, AdminPage } from '../../components/AdminPage';
import { formatDateTimeFull, formatNumber } from '@/lib/constants';
import { loadMasterAtlas } from '@/lib/services/masterAtlasService';
import MasterAtlasClient from './MasterAtlasClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Master Òrbita | Òrbita Admin' };

export default async function MasterAtlasPage() {
  const atlas = await loadMasterAtlas();

  return (
    <AdminPage
      title="Master Òrbita"
      subtitle={`${atlas.thesis} Generat ${formatDateTimeFull(atlas.generatedAt)}.`}
      kpis={(
        <AdminKpiRow>
          <AdminKpi label="Mòduls" value={formatNumber(atlas.summary.modules)} />
          <AdminKpi label="Forts" value={formatNumber(atlas.summary.strongModules)} tone="success" />
          <AdminKpi label="En progrés" value={formatNumber(atlas.summary.inProgressModules)} tone="warning" />
          <AdminKpi label="Properes peces" value={formatNumber(atlas.summary.pendingMoves)} />
        </AdminKpiRow>
      )}
    >
      <MasterAtlasClient atlas={atlas} />
    </AdminPage>
  );
}
