'use client';

import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/config/site-config';

export default function TerminosClient() {
  const t = useTranslations('legal.terminos');
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
            <p>{t('section1.intro')}</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>{t('section1.empresa')}</strong> {business.legalName}</li>
              <li><strong>{t('section1.ubicacion')}</strong> {business.address.city}, {business.address.region}, {business.address.country}</li>
              <li><strong>{t('section1.contacto')}</strong> {business.email}</li>
            </ul>
            <p className="text-sm text-white/60 mt-2">{t('section1.datosCompletos')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section2.title')}</h2>
            <p>{t('section2.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section3.title')}</h2>
            <h3 className="text-xl font-medium text-white mt-4">{t('section3.proceso.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section3.proceso.item1')}</li>
              <li>{t('section3.proceso.item2')}</li>
              <li>{t('section3.proceso.item3')}</li>
              <li>{t('section3.proceso.item4')}</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4">{t('section3.condiciones.title')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t('section3.condiciones.senal')}</strong> {t('section3.condiciones.senalDesc')}</li>
              <li><strong>{t('section3.condiciones.resto')}</strong> {t('section3.condiciones.restoDesc')}</li>
              <li><strong>{t('section3.condiciones.metodos')}</strong> {t('section3.condiciones.metodosDesc')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section4.title')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{t('section4.item1')}</strong> {t('section4.item1Desc')}</li>
              <li><strong>{t('section4.item2')}</strong> {t('section4.item2Desc')}</li>
              <li><strong>{t('section4.item3')}</strong> {t('section4.item3Desc')}</li>
              <li><strong>{t('section4.item4')}</strong> {t('section4.item4Desc')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section5.title')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section5.item1')}</li>
              <li>{t('section5.item2')}</li>
              <li>{t('section5.item3')}</li>
              <li>{t('section5.item4')}</li>
              <li>{t('section5.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section6.title')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section6.item1')}</li>
              <li>{t('section6.item2')}</li>
              <li>{t('section6.item3')}</li>
              <li>{t('section6.item4')}</li>
              <li>{t('section6.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section7.title')}</h2>
            <p>{t('section7.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('section7.item1')}</li>
              <li>{t('section7.item2')}</li>
              <li>{t('section7.item3')}</li>
              <li>{t('section7.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section8.title')}</h2>
            <p>{t('section8.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section9.title')}</h2>
            <p>{t('section9.content', { city: business.address.city })}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section10.title')}</h2>
            <p>{t('section10.intro')}</p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 Email: <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li>📱 Teléfono: <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
