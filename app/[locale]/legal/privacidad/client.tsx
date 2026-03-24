'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { SITE_CONFIG } from '@/app/config/site-config';

export default function PrivacidadClient() {
  const t = useTranslations('legal.privacidad');
  const { business } = SITE_CONFIG;

  return (
    <main className="min-h-screen bg-bg-main py-20 relative">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>

        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <p className="text-lg" suppressHydrationWarning>
            {t('lastUpdate')} {new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Banner Portal de Privacitat */}
          <div className="not-prose bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-xl p-6 my-8">
            <h3 className="text-xl font-semibold text-white mb-2">{t('portalBanner.title')}</h3>
            <p className="text-white/70 mb-4">{t('portalBanner.description')}</p>
            <Link
              href="/privacitat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('portalBanner.button')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section1.title')}</h2>
            <ul className="list-none space-y-2">
              <li><strong>{t('section1.empresa')}</strong> {business.legalName}</li>
              <li><strong>{t('section1.ubicacion')}</strong> {business.address.city}, {business.address.region}, {business.address.country}</li>
              <li><strong>{t('section1.email')}</strong> {business.email}</li>
              <li><strong>{t('section1.telefono')}</strong> {business.phoneDisplay}</li>
            </ul>
            <p className="text-sm text-white/60 mt-2">{t('section1.datosCompletos')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section2.title')}</h2>
            <p>{t('section2.intro')}</p>

            <h3 className="text-xl font-medium text-white mt-4">{t('section2.identificacion.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section2.identificacion.item1')}</li>
              <li>{t('section2.identificacion.item2')}</li>
              <li>{t('section2.identificacion.item3')}</li>
              <li>{t('section2.identificacion.item4')}</li>
              <li>{t('section2.identificacion.item5')}</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4">{t('section2.evento.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section2.evento.item1')}</li>
              <li>{t('section2.evento.item2')}</li>
              <li>{t('section2.evento.item3')}</li>
              <li>{t('section2.evento.item4')}</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4">{t('section2.navegacion.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section2.navegacion.item1')}</li>
              <li>{t('section2.navegacion.item2')}</li>
              <li>{t('section2.navegacion.item3')}</li>
              <li>{t('section2.navegacion.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section3.title')}</h2>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 px-3 text-white">{t('section3.table.finalidad')}</th>
                    <th className="text-left py-2 px-3 text-white">{t('section3.table.baseLegal')}</th>
                    <th className="text-left py-2 px-3 text-white">{t('section3.table.conservacion')}</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">{t('section3.table.row1.purpose')}</td>
                    <td className="py-2 px-3">{t('section3.table.row1.legal')}</td>
                    <td className="py-2 px-3">{t('section3.table.row1.retention')}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">{t('section3.table.row2.purpose')}</td>
                    <td className="py-2 px-3">{t('section3.table.row2.legal')}</td>
                    <td className="py-2 px-3">{t('section3.table.row2.retention')}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">{t('section3.table.row3.purpose')}</td>
                    <td className="py-2 px-3">{t('section3.table.row3.legal')}</td>
                    <td className="py-2 px-3">{t('section3.table.row3.retention')}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">{t('section3.table.row4.purpose')}</td>
                    <td className="py-2 px-3">{t('section3.table.row4.legal')}</td>
                    <td className="py-2 px-3">{t('section3.table.row4.retention')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">{t('section3.table.row5.purpose')}</td>
                    <td className="py-2 px-3">{t('section3.table.row5.legal')}</td>
                    <td className="py-2 px-3">{t('section3.table.row5.retention')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section4.title')}</h2>
            <p>{t('section4.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t('section4.providers')}</strong> {t('section4.providersDetail')}</li>
              <li><strong>{t('section4.public')}</strong> {t('section4.publicDetail')}</li>
            </ul>
            <p className="mt-4 text-amber-400 font-medium">{t('section4.noSale')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section5.title')}</h2>
            <p>{t('section5.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section6.title')}</h2>
            <p>{t('section6.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t('section6.acceso')}</strong> {t('section6.accesoDesc')}</li>
              <li><strong>{t('section6.rectificacion')}</strong> {t('section6.rectificacionDesc')}</li>
              <li><strong>{t('section6.supresion')}</strong> {t('section6.supresionDesc')}</li>
              <li><strong>{t('section6.oposicion')}</strong> {t('section6.oposicionDesc')}</li>
              <li><strong>{t('section6.portabilidad')}</strong> {t('section6.portabilidadDesc')}</li>
              <li><strong>{t('section6.limitacion')}</strong> {t('section6.limitacionDesc')}</li>
            </ul>

            <div className="not-prose bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
              <p className="text-white/80 mb-3">
                <strong className="text-white">{t('section6.plazo')}</strong> {t('section6.plazoDesc')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/privacitat"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  {t('section6.portalButton')}
                </Link>
                <a
                  href={`mailto:${business.email}?subject=Ejercicio%20de%20derechos%20RGPD`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {t('section6.emailButton')}
                </a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section7.title')}</h2>
            <p>{t('section7.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section7.item1')}</li>
              <li>{t('section7.item2')}</li>
              <li>{t('section7.item3')}</li>
              <li>{t('section7.item4')}</li>
              <li>{t('section7.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section8.title')}</h2>
            <p>
              {t('section8.content')}{' '}
              <Link href="/legal/cookies" className="text-oe-gold hover:underline">
                {t('section8.link')}
              </Link>
              {' '}{t('section8.contentEnd')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section9.title')}</h2>
            <p>{t('section9.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section10.title')}</h2>
            <p>
              {t('section10.content')}{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-oe-gold hover:underline">
                www.aepd.es
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section11.title')}</h2>
            <p>{t('section11.intro')}</p>
            <ul className="list-none space-y-2 mt-4">
              <li>{t('section11.email')} <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li>{t('section11.telefono')} <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section12.title')}</h2>
            <p>{t('section12.content')}</p>
          </section>
        </div>

        {/* CTA al portal */}
        <div className="mt-12 text-center">
          <Link
            href="/privacitat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            {t('ctaFinal.button')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
