// app/[locale]/gracias/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';
import { CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

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
  const urgentWhatsappUrl = WHATSAPP_URL_WITH_MESSAGE('Hola, acabo de enviar el formulario');

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-zinc-900 flex items-center justify-center px-4 py-20 relative">
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
              dangerouslySetInnerHTML={{ __html: t.raw('response.text') }}
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
              href={urgentWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-2"
            >
              <span>{t('urgent.whatsapp')}</span>
              <WhatsAppIcon className="w-4 h-4" />
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
              } catch (e) {
                consent = null;
              }
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
