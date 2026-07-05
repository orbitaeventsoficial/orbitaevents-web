import { AdminPage } from '../../components/AdminPage';

export default function LoadingElectricAtlas() {
  return (
    <AdminPage
      title="Atles elèctric"
      subtitle="Escanejant fitxers, funcions, rutes, models i cables del repo real."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="ap-card p-4">
          <p className="ap-kpi-label">Circuit viu</p>
          <div className="mt-4 h-48 animate-pulse rounded-[var(--o-r-md)] bg-[var(--raised)]" />
        </div>
        <div className="ap-card p-4">
          <p className="ap-kpi-label">Lectura de placa</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-[var(--o-r-md)] bg-[var(--raised)]" />
            ))}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
