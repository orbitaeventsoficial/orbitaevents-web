import { AdminPage } from '../../components/AdminPage';

export default function LoadingVisualAudit() {
  return (
    <AdminPage
      title="Auditoria visual"
      subtitle="Carregant baseline de captures, rutes i checks runtime."
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="ap-card p-4">
          <p className="ap-kpi-label">Radiografia</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-[var(--o-r-md)] bg-[var(--raised)]" />
            ))}
          </div>
        </div>
        <div className="ap-card p-4">
          <p className="ap-kpi-label">Captures</p>
          <div className="mt-4 h-72 animate-pulse rounded-[var(--o-r-md)] bg-[var(--raised)]" />
        </div>
      </div>
    </AdminPage>
  );
}
