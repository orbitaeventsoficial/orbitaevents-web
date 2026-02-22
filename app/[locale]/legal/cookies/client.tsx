'use client';

import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/app/config/site-config';

export default function CookiesClient() {
  const t = useTranslations('legal.cookies');
  const { business } = SITE_CONFIG;

  return (
    <main className="min-h-screen bg-bg-main py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>

        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <p className="text-lg" suppressHydrationWarning>
            {t('lastUpdate')} 13 de diciembre de 2025
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section1.title')}</h2>
            <p>{t('section1.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section2.title')}</h2>

            <h3 className="text-xl font-medium text-white mt-6">{t('section2.technical.title')}</h3>
            <p>{t('section2.technical.description')}</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 text-white">{t('section2.technical.table.nombre')}</th>
                    <th className="text-left py-2 text-white">{t('section2.technical.table.finalidad')}</th>
                    <th className="text-left py-2 text-white">{t('section2.technical.table.duracion')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-2">{t('section2.technical.table.sessionId.name')}</td>
                    <td className="py-2">{t('section2.technical.table.sessionId.purpose')}</td>
                    <td className="py-2">{t('section2.technical.table.sessionId.duration')}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2">{t('section2.technical.table.cookieConsent.name')}</td>
                    <td className="py-2">{t('section2.technical.table.cookieConsent.purpose')}</td>
                    <td className="py-2">{t('section2.technical.table.cookieConsent.duration')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-white mt-6">{t('section2.analytical.title')}</h3>
            <p>{t('section2.analytical.description')}</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 text-white">{t('section2.analytical.table.nombre')}</th>
                    <th className="text-left py-2 text-white">{t('section2.analytical.table.proveedor')}</th>
                    <th className="text-left py-2 text-white">{t('section2.analytical.table.finalidad')}</th>
                    <th className="text-left py-2 text-white">{t('section2.analytical.table.duracion')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-2">{t('section2.analytical.table.ga.name')}</td>
                    <td className="py-2">{t('section2.analytical.table.ga.provider')}</td>
                    <td className="py-2">{t('section2.analytical.table.ga.purpose')}</td>
                    <td className="py-2">{t('section2.analytical.table.ga.duration')}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2">{t('section2.analytical.table.gid.name')}</td>
                    <td className="py-2">{t('section2.analytical.table.gid.provider')}</td>
                    <td className="py-2">{t('section2.analytical.table.gid.purpose')}</td>
                    <td className="py-2">{t('section2.analytical.table.gid.duration')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section3.title')}</h2>
            <p>{t('section3.content')}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-oe-gold hover:underline">{t('section3.browsers.chrome')}</a></li>
              <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener" className="text-oe-gold hover:underline">{t('section3.browsers.firefox')}</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="text-oe-gold hover:underline">{t('section3.browsers.safari')}</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener" className="text-oe-gold hover:underline">{t('section3.browsers.edge')}</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section4.title')}</h2>
            <p>{t('section4.intro')}</p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 Email: <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
