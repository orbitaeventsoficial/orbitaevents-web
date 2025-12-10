import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG, getWhatsAppUrl } from '@/config/site-config';
import { Ghost, Skull, Moon, Sparkles, Star, CheckCircle, Calendar, MessageCircle, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Boda Halloween Barcelona | Especialistes en Bodes Temàtiques | Òrbita Events',
  description: 'Especialistas en bodas Halloween en Barcelona y Catalunya. Decoración, efectos especiales y DJ especializado. Presupuesto sin compromiso.',
  keywords: ['boda halloween', 'boda halloween barcelona', 'boda tematica halloween', 'bodas tematicas barcelona', 'dj boda halloween'],
  openGraph: {
    title: 'Boda Halloween Barcelona | Especialistas en Bodas Temáticas',
    description: 'Tematización completa, DJ especializado, efectos especiales. Haz tu boda inolvidable.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Òrbita Events',
  },
  alternates: {
    canonical: '/boda-halloween',
  },
};

const FEATURES = [
  {
    icon: Ghost,
    title: 'Tematización Completa',
    description: 'Decoración inmersiva con elementos Halloween: calabazas, telarañas, iluminación tenebrosa y más.',
  },
  {
    icon: Sparkles,
    title: 'Efectos Especiales',
    description: 'Humo bajo para el primer baile, luces espectaculares, efectos de terror controlados.',
  },
  {
    icon: Moon,
    title: 'DJ Especializado',
    description: 'Playlist personalizada mezclando tus canciones favoritas con clásicos de Halloween.',
  },
  {
    icon: Skull,
    title: 'Experiencia Única',
    description: 'Especialistes en bodes Halloween. Sabem exactament com crear l\'atmosfera perfecta.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Lorena & Carles',
    event: 'Casament Món Màgic',
    quote: 'Van transformar el nostre casament en una experiència màgica inoblidable. Els convidats encara en parlen!',
    rating: 5,
  },
];

const FAQ = [
  {
    question: '¿Qué incluye el servicio de boda Halloween?',
    answer: 'DJ profesional, iluminación temática, efectos especiales (humo, luces), decoración básica Halloween, coordinación del evento y playlist personalizada.',
  },
  {
    question: '¿Puedo hacer una boda Halloween en cualquier época del año?',
    answer: '¡Por supuesto! Aunque octubre es el mes estrella, realizamos bodas temáticas Halloween durante todo el año.',
  },
  {
    question: '¿Cuánto cuesta una boda Halloween?',
    answer: 'Los precios varían según el nivel de tematización. Desde 2.900€ para un pack básico hasta 5.500€+ para tematización completa.',
  },
  {
    question: '¿Trabajáis fuera de Barcelona?',
    answer: 'Sí, cubrimos Barcelona provincia y Girona provincia (incluyendo Costa Brava). Transporte incluido hasta 25km desde Granollers.',
  },
];

export default function BodaHalloweenPage() {
  const whatsappUrl = getWhatsAppUrl('bodas');
  
  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Boda Halloween Barcelona',
            description: 'Servicio especializado en bodas temáticas Halloween en Barcelona y Catalunya.',
            provider: {
              '@type': 'LocalBusiness',
              name: SITE_CONFIG.business.name,
              telephone: SITE_CONFIG.business.phone,
              email: SITE_CONFIG.business.email,
              address: {
                '@type': 'PostalAddress',
                addressLocality: SITE_CONFIG.business.address.city,
                addressRegion: SITE_CONFIG.business.address.region,
                addressCountry: 'ES',
              },
            },
            areaServed: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme'],
            serviceType: 'Wedding DJ and Event Production',
          }),
        }}
      />

      <main className="min-h-screen bg-bg-main">
        {/* HERO */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background con gradiente Halloween */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-bg-main to-purple-950/30" />
          
          {/* Elementos decorativos */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-orange-600/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full mb-8">
                <Ghost className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-medium">Especialistes en Bodes Temàtiques</span>
              </div>

              {/* Título */}
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                Tu Boda{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                  Halloween
                </span>
                <br />
                Será Inolvidable
              </h1>

              {/* Subtítulo */}
              <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
                Especialistas en bodas temáticas en Barcelona y Catalunya. 
                Creamos la atmósfera terroríficamente perfecta para tu día especial.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                  <Calendar className="w-5 h-5" />
                  Pedir Presupuesto Gratis
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Directo
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>+{SITE_CONFIG.stats.eventsCompleted} eventos realizados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{SITE_CONFIG.stats.recommendRate}% nos recomiendan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Respuesta en &lt;2h</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 bg-bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Por Qué Elegir Òrbita para tu Boda Halloween?
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                No somos solo DJs. Somos especialistas en crear experiencias temáticas completas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-bg-card border border-border rounded-2xl p-8 hover:border-orange-500/50 transition-all group"
                >
                  <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Lo Que Dicen Nuestras Parejas
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {TESTIMONIALS.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="bg-bg-card border border-border rounded-2xl p-8"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/80 text-lg mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-white/50 text-sm">{testimonial.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Preguntas Frecuentes
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {FAQ.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{item.question}</h3>
                  <p className="text-white/60">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-orange-950/50 to-purple-950/50 border border-orange-500/30 rounded-3xl p-12">
              <Ghost className="w-16 h-16 text-orange-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Listo para una Boda Terroríficamente Perfecta?
              </h2>
              <p className="text-xl text-white/70 mb-8">
                Contacta ahora y recibe tu presupuesto personalizado en menos de 2 horas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                  Quiero mi Presupuesto
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={`tel:${SITE_CONFIG.business.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all"
                >
                  Llamar: {SITE_CONFIG.business.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
