// app/admin/settings/company/page.tsx
import { prisma } from '@/lib/prisma';
import { AdminPage } from '../../components/AdminPage';
import CompanySettingsClient from './CompanySettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Empresa | Configuració | Òrbita Admin',
};

async function getCompanySettings() {
  const settings = await prisma.setting.findMany({
    where: { category: { in: ['company', 'holded'] } },
    orderBy: { key: 'asc' },
  });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

export default async function CompanySettingsPage() {
  const settings = await getCompanySettings();

  return (
    <AdminPage
      title="Configuració d'empresa"
      back={{ href: '/admin/settings', label: 'Configuració' }}
      subtitle="Dades fiscals, bancàries i integració Holded"
    >
      <CompanySettingsClient initial={settings} />
    </AdminPage>
  );
}
