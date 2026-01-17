'use client';

import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/config/site-config';

export default function AvisoLegalClient() {
  const t = useTranslations('legal.avisoLegal');
  const { business } = SITE_CONFIG;

  return (
    <main className="min-h-screen bg-bg-main py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>

        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section1.title')}</h2>
            <p>{t('section1.intro')}</p>
            <ul className="list-none space-y-2 mt-4 bg-white/5 p-6 rounded-xl">
              <li><strong className="text-white">{t('section1.titular')}</strong> {business.legalName}</li>
              <li><strong className="text-white">{t('section1.ubicacion')}</strong> {business.address.city}, {business.address.region}, {business.address.country}</li>
              <li><strong className="text-white">{t('section1.email')}</strong> <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li><strong className="text-white">{t('section1.telefono')}</strong> <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
              <li><strong className="text-white">{t('section1.sitioWeb')}</strong> <a href="https://orbitaevents.com" className="text-oe-gold hover:underline">orbitaevents.com</a></li>
              <li className="text-white/60 text-sm mt-4">{t('section1.datosCompletos')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section2.title')}</h2>
            <p>{t('section2.content', { businessName: business.name })}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section3.title')}</h2>
            <p>{t('section3.intro')}</p>
            <p className="mt-4">{t('section3.compromiso')}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('section3.item1')}</li>
              <li>{t('section3.item2')}</li>
              <li>{t('section3.item3')}</li>
              <li>{t('section3.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section4.title')}</h2>
            <p>{t('section4.content1', { businessName: business.name })}</p>
            <p className="mt-4">{t('section4.content2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section5.title')}</h2>
            <p>{t('section5.intro', { businessName: business.name })}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('section5.item1')}</li>
              <li>{t('section5.item2')}</li>
              <li>{t('section5.item3')}</li>
              <li>{t('section5.item4')}</li>
              <li>{t('section5.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section6.title')}</h2>
            <p>{t('section6.content', { businessName: business.name })}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section7.title')}</h2>
            <p>{t('section7.content', { city: business.address.city })}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section8.title')}</h2>
            <p>{t('section8.content', { businessName: business.name })}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">{t('section9.title')}</h2>
            <p>{t('section9.intro')}</p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 {t('section1.email')} <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li>📱 {t('section1.telefono')} <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
