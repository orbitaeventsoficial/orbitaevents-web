// app/admin/settings/company/page.tsx
import { prisma } from '@/lib/prisma';
import { AdminPage } from '../../components/AdminPage';
import { EditorControlStrip } from '../../components/EditorControlStrip';
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
  const holdedEnabled = settings['holded.enabled'] === 'true';
  const holdedApiKey = settings['holded.apiKey'] || '';
  const filledCompanyFields = [
    settings['company.name'],
    settings['company.legalName'],
    settings['company.nif'],
    settings['company.address'],
    settings['company.city'],
    settings['company.postalCode'],
    settings['company.iban'],
    settings['company.bankName'],
  ].filter(Boolean).length;

  return (
    <AdminPage
      title="Configuració d'empresa"
      back={{ href: '/admin/settings', label: 'Configuració' }}
      subtitle="Dades fiscals, bancàries i integració Holded"
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Dades sensibles',
          title: 'Què controla aquest espai',
          tone: holdedApiKey ? 'default' : 'warning',
          stats: [
            { label: 'Camps empresa', value: filledCompanyFields, hint: 'amb valor' },
            { label: 'Holded', value: holdedEnabled ? 'Actiu' : 'Inactiu', tone: holdedEnabled ? 'success' : 'warning' },
            { label: 'API Key', value: holdedApiKey ? 'Present' : 'Absent', tone: holdedApiKey ? 'success' : 'warning' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé vigilar abans d’editar',
          tone: !holdedApiKey || !holdedEnabled ? 'warning' : 'info',
          items: [
            'Aquestes dades impacten contractes, pressupostos, factures i sincronització amb Holded.',
            holdedEnabled
              ? 'La sincronització amb Holded està activada: qualsevol canvi aquí pot afectar el flux de facturació.'
              : 'La sincronització amb Holded està desactivada: revisa si és una decisió temporal o una integració pendent.',
            holdedApiKey
              ? 'La clau d’API existeix i queda ofuscada al formulari; toca-la només si realment canvies la credencial.'
              : 'Encara no hi ha API Key configurada per Holded.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: holdedApiKey ? 'Validar que les dades sensibles siguin correctes' : 'Completar primer la integració mínima',
          tone: holdedApiKey ? 'success' : 'warning',
          description: holdedApiKey
            ? 'El millor següent pas és revisar NIF, IBAN i email/credencial d’integració abans de tocar altres configuracions menys sensibles.'
            : 'Abans de discutir automatització, cal tenir dades fiscals completes i la credencial de Holded preparada.',
          primaryAction: { href: '/admin/settings/company', label: 'Revisar formulari' },
          secondaryAction: { href: '/admin/settings', label: 'Tornar a configuració' },
          secondaryPills: [
            settings['company.nif'] ? `NIF: ${settings['company.nif']}` : 'NIF pendent',
            settings['company.iban'] ? 'IBAN informat' : 'IBAN pendent',
          ],
        }}
      />

      <CompanySettingsClient initial={settings} />
    </AdminPage>
  );
}
