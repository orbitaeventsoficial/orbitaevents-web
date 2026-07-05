import { AdminKpi, AdminKpiRow, AdminPage } from '../../components/AdminPage';
import { formatDateTimeFull, formatNumber } from '@/lib/constants';
import { loadVisualAuditAtlas } from '@/lib/services/visualAuditAtlasService';
import VisualAuditClient from './VisualAuditClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Auditoria visual | Òrbita Admin' };

export default async function VisualAuditPage() {
  const atlas = await loadVisualAuditAtlas();
  const generated = atlas.generatedAt ? formatDateTimeFull(atlas.generatedAt) : 'sense baseline local';

  return (
    <AdminPage
      title="Auditoria visual"
      subtitle={`Radiografia runtime i taula de revisió humana: ${formatNumber(atlas.summary.routeCount)} rutes, ${formatNumber(atlas.summary.completedCaptures)} captures, generat ${generated}.`}
      kpis={(
        <AdminKpiRow>
          <AdminKpi label="Rutes" value={formatNumber(atlas.summary.routeCount)} />
          <AdminKpi label="Captures" value={`${formatNumber(atlas.summary.completedCaptures)}/${formatNumber(atlas.summary.expectedCaptures)}`} />
          <AdminKpi label="Checks fallits" value={formatNumber(atlas.summary.failedChecks)} />
          <AdminKpi label="Òrgans" value={formatNumber(atlas.organs.length)} />
        </AdminKpiRow>
      )}
    >
      <VisualAuditClient atlas={atlas} />
    </AdminPage>
  );
}
