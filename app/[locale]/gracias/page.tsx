// app/[locale]/gracias/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';
import { CheckCircle, Clock, MessageCircle } from 'lucide-react';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'gracias' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    robots: { index: false, follow: false },
  };
}

export default async function GraciasPage() {
  const t = await getTranslations('gracias');

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-zinc-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('title')}
          </h1>

          <p className="text-xl text-white/70">
            {t('subtitle')}
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Respuesta */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">{t('response.title')}</h3>
            </div>
            <p
              className="text-white/60 text-sm [&_strong]:text-amber-400"
              dangerouslySetInnerHTML={{ __html: t('response.text') }}
            />
          </div>

          {/* WhatsApp */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white">{t('urgent.title')}</h3>
            </div>
            <a
              href="https://wa.me/34699121023?text=Hola,%20acabo%20de%20enviar%20el%20formulario"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-2"
            >
              <span>{t('urgent.whatsapp')}</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Siguiente paso */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{t('nextSteps.title')}</h3>
          <ul className="space-y-3 text-white/60 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">1.</span>
              <span>{t('nextSteps.step1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">2.</span>
              <span>{t('nextSteps.step2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">3.</span>
              <span>{t('nextSteps.step3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">4.</span>
              <span>{t('nextSteps.step4')}</span>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-center hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            {t('backHome')}
          </Link>
          <Link
            href="/portfolio"
            className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-center hover:bg-white/10 transition-all"
          >
            {t('viewPortfolio')}
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/60 text-sm mt-8">
          {t('spamNote')}
        </p>
      </div>

      {/* Tracking script - GTM + Google Ads */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var consent = null;
              try {
                consent = JSON.parse(localStorage.getItem('orbita_cookie_consent') || 'null');
              } catch (e) {}
              var allowMarketing = !!(consent && consent.marketing);

              // Push to dataLayer (GTM)
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                'event': 'generate_lead',
                'event_category': 'engagement',
                'event_label': 'contact_form_complete',
                'value': 1
              });

              // Google Ads Conversion (requires consent + IDs)
              var adsId = '${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || ''}';
              var adsLabel = '${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || ''}';
              if (allowMarketing && adsId && adsLabel && typeof window.gtag === 'function') {
                window.gtag('event', 'conversion', {
                  'send_to': 'AW-' + adsId + '/' + adsLabel,
                  'value': 1.0,
                  'currency': 'EUR'
                });
              }
            })();
          `,
        }}
      />
    </main>
  );
}
