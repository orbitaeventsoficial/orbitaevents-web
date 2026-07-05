import { AdminKpi, AdminKpiRow, AdminPage } from '../../components/AdminPage';
import { formatDateTimeFull, formatNumber } from '@/lib/constants';
import { loadRepoElectricAtlas } from '@/lib/services/repoElectricAtlasService';
import ElectricAtlasClient from './ElectricAtlasClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Atles elèctric | Òrbita Admin' };

export default async function ElectricAtlasPage() {
  const atlas = await loadRepoElectricAtlas();

  return (
    <AdminPage
      title="Atles elèctric"
      subtitle={`Mapa viu del repo real: ${formatNumber(atlas.summary.files)} fitxers llegits, ${formatNumber(atlas.summary.cables)} cables detectats i ${formatNumber(atlas.summary.functions)} símbols indexats. Generat ${formatDateTimeFull(atlas.generatedAt)}.`}
      kpis={(
        <AdminKpiRow>
          <AdminKpi label="Fitxers" value={formatNumber(atlas.summary.files)} />
          <AdminKpi label="Línies" value={formatNumber(atlas.summary.lines)} />
          <AdminKpi label="Serveis" value={formatNumber(atlas.summary.services)} />
          <AdminKpi label="Models BD" value={formatNumber(atlas.summary.models)} />
        </AdminKpiRow>
      )}
    >
      <ElectricAtlasClient atlas={atlas} />
    </AdminPage>
  );
}
