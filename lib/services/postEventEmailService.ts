/**
 * POST-EVENT EMAIL SERVICE
 * ========================
 * Font única per a la plantilla d'email post-event.
 * Usat per: cron/post-event, emails/send-post-event, emails/run-cron
 */

import { SITE_CONFIG } from '@/app/config/site-config';
import { toIntlLocale } from '@/lib/constants';

type PostEventLocale = 'ca' | 'es' | 'en';

export function normalizeLocale(locale?: string | null): PostEventLocale {
  const raw = String(locale || 'ca').trim().toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  return 'ca';
}

export function resolvePackName(
  translations: Array<{ locale: string; name: string }> | undefined,
  locale: PostEventLocale
): string {
  if (!translations || translations.length === 0) {
    return locale === 'en' ? 'Your pack' : locale === 'es' ? 'Tu pack' : 'El teu pack';
  }
  return (
    translations.find((t) => t.locale.toLowerCase() === locale)?.name ||
    translations.find((t) => t.locale.toLowerCase().startsWith(locale))?.name ||
    translations.find((t) => t.locale === 'ca')?.name ||
    translations.find((t) => t.locale === 'es')?.name ||
    translations.find((t) => t.locale === 'en')?.name ||
    translations[0]?.name ||
    (locale === 'en' ? 'Your pack' : locale === 'es' ? 'Tu pack' : 'El teu pack')
  );
}

export function getPostEventSubject(locale: PostEventLocale, name: string): string {
  const firstName = name.split(' ')[0];
  const subjects: Record<PostEventLocale, string> = {
    es: `${firstName}, gracias por confiar en nosotros. ¿Qué tal fue tu evento?`,
    ca: `${firstName}, gràcies per confiar en nosaltres. Com va anar el teu esdeveniment?`,
    en: `${firstName}, thank you for trusting us. How was your event?`,
  };
  return subjects[locale];
}

export function generatePostEventEmail(params: {
  name: string;
  packName: string;
  eventDate: Date;
  reviewUrl: string;
  questionnaireUrl?: string;
  googleReviewUrl: string;
  locale: PostEventLocale;
}): string {
  const { name, packName, eventDate, reviewUrl, questionnaireUrl, googleReviewUrl, locale } = params;

  const firstName = name.split(' ')[0];
  const formattedDate = eventDate.toLocaleDateString(toIntlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const texts = {
    es: {
      title: 'Gracias por tu confianza',
      greeting: `Hola ${firstName},`,
      intro: `Esperamos que tu evento del <strong>${formattedDate}</strong> con el <strong>${packName}</strong> haya sido increíble y que tú y tus invitados lo hayáis disfrutado al máximo.`,
      question: '¿Nos dejas tu opinión?',
      explanation: 'Tu opinión nos ayuda a mejorar y, además, <strong>tenemos un regalo para ti</strong>.',
      reward: 'Al dejarnos tu valoración, recibirás un <strong>código de descuento exclusivo</strong> para tu próximo evento o para compartir con amigos y familiares.',
      cta: 'Dejar mi valoración',
      bonus: 'Cuanto más compartas, mayor descuento',
      bonusDetails: '+5% extra si compartes foto / +10% extra si compartes video',
      googleText: 'También puedes dejarnos una reseña en Google:',
      googleCta: 'Reseña en Google',
      questionnaireText: '¿Nos ayudas con una breve encuesta de satisfacción? Solo te llevará un minuto.',
      questionnaireCta: 'Responder la encuesta',
      footer: 'Gracias por formar parte de la familia Òrbita Events',
    },
    ca: {
      title: 'Gràcies per la teva confiança',
      greeting: `Hola ${firstName},`,
      intro: `Esperem que el teu esdeveniment del <strong>${formattedDate}</strong> amb el <strong>${packName}</strong> hagi estat increïble i que tu i els teus convidats n'hàgiu gaudit al màxim.`,
      question: 'Ens deixes la teva opinió?',
      explanation: 'La teva opinió ens ajuda a millorar i, a més, <strong>tenim un regal per a tu</strong>.',
      reward: 'En deixar-nos la teva valoració, rebràs un <strong>codi de descompte exclusiu</strong> per al teu pròxim esdeveniment o per compartir amb amics i familiars.',
      cta: 'Deixar la meva valoració',
      bonus: 'Com més comparteixis, més descompte',
      bonusDetails: '+5% extra si comparteixes foto / +10% extra si comparteixes video',
      googleText: 'També pots deixar-nos una ressenya a Google:',
      googleCta: 'Ressenya a Google',
      questionnaireText: 'Ens ajudes amb una breu enquesta de satisfacció? Només et portarà un minut.',
      questionnaireCta: 'Respondre l\'enquesta',
      footer: 'Gràcies per formar part de la família Òrbita Events',
    },
    en: {
      title: 'Thank you for your trust',
      greeting: `Hi ${firstName},`,
      intro: `We hope your event on <strong>${formattedDate}</strong> with the <strong>${packName}</strong> was amazing and that you and your guests had a great time.`,
      question: 'Would you leave us a review?',
      explanation: 'Your review helps us improve and <strong>we have a gift for you</strong>.',
      reward: "When you leave your review, you'll receive an <strong>exclusive discount code</strong> for your next event or to share with friends and family.",
      cta: 'Leave my review',
      bonus: 'The more you share, the bigger the discount',
      bonusDetails: '+5% extra for a photo / +10% extra for a video',
      googleText: 'You can also leave us a Google review:',
      googleCta: 'Google Review',
      questionnaireText: 'Would you help us with a short satisfaction survey? It only takes a minute.',
      questionnaireCta: 'Answer the survey',
      footer: 'Thank you for being part of the Òrbita Events family',
    },
  };

  const t = texts[locale] || texts.ca;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 50px 30px; text-align: center;">
      <h1 style="color: #FFB800; margin: 0; font-size: 32px; font-weight: 300;">
        ${t.title}
      </h1>
      <p style="color: rgba(255,255,255,0.5); margin: 16px 0 0 0; font-size: 14px; letter-spacing: 2px;">
        ÒRBITA EVENTS
      </p>
    </div>

    <div style="padding: 40px 30px; color: #e5e5e5;">
      <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
        ${t.greeting}
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
        ${t.intro}
      </p>

      <div style="background: rgba(255,184,0,0.1); border: 2px solid rgba(255,184,0,0.3); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
        <h2 style="color: #FFB800; margin: 0 0 16px 0; font-size: 24px;">
          ${t.question}
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: rgba(255,255,255,0.8);">
          ${t.explanation}
        </p>
        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
          ${t.reward}
        </p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${reviewUrl}"
           style="background: linear-gradient(135deg, #FFB800, #CC9600);
                  color: #000;
                  padding: 20px 50px;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: bold;
                  font-size: 18px;
                  display: inline-block;
                  box-shadow: 0 4px 20px rgba(255,184,0,0.3);">
          ${t.cta}
        </a>
      </div>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; color: #FFB800; font-weight: bold;">
          ${t.bonus}
        </p>
        <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.6);">
          ${t.bonusDetails}
        </p>
      </div>

      <div style="margin-top: 18px; text-align: center; font-size: 13px; color: rgba(255,255,255,0.7);">
        ${t.googleText}
        <a href="${googleReviewUrl}" style="display: inline-block; background: #4285f4; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 13px; margin-top: 10px;">
          ${t.googleCta}
        </a>
      </div>
${questionnaireUrl ? `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.75);">
          ${t.questionnaireText}
        </p>
        <a href="${questionnaireUrl}" style="display: inline-block; background: rgba(255,184,0,0.15); border: 1px solid rgba(255,184,0,0.4); color: #FFB800; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px;">
          ${t.questionnaireCta}
        </a>
      </div>` : ''}

    </div>

    <div style="padding: 30px; background: #0a0a0a; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.6);">
        ${t.footer}
      </p>
      <p style="margin: 0; font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} Òrbita Events · ${SITE_CONFIG.business.phone} · ${SITE_CONFIG.business.email}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

