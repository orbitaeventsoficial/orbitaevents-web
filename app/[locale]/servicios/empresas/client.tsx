"use client";

import { useEffect } from "react";
import Link from 'next/link';
import ContactForm from "@/components/forms/ContactForm.client";
import { Briefcase, Users, Lightbulb, Star, Check, FileText, Shield, TrendingUp, Handshake, Sparkles } from "lucide-react";
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function EmpresasClient() {
  const { track } = useAnalytics();

  useEffect(() => {
    track("View_Empresas");
  }, [track]);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-bg-main">
      {/* HERO */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-bg-main z-10" />
          <img
            src="/img/portfolio/empresas-cover.webp"
            alt="Eventos corporativos Òrbita Events"
            className="w-full h-full object-cover animate-slow-zoom"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-5xl sm:text-7xl font-display font-black text-white mb-6 leading-[1.05]">
            DJ Eventos Corporativos
            <br />
            <span className="gradient-text breathe">Barcelona</span>
          </h1>
          <p className="text-xl sm:text-2xl text-text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
            Cenas de empresa, team building, presentaciones y networking elegante.
            <br />Profesionalismo que refuerza tu marca.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/configurador"
              className="oe-btn-gold text-lg px-8 py-5 inline-flex items-center justify-center gap-3"
              onClick={() => track("CTA_Configurador_Empresas")}
            >
              <Sparkles className="w-5 h-5" />
              Configurar Mi Evento
            </Link>
            <Link
              href="/contacto"
              className="oe-btn-outline text-lg px-8 py-5 inline-flex items-center justify-center gap-3"
              onClick={() => track("CTA_Contact_Empresas")}
            >
              <FileText className="w-5 h-5" />
              Solicitar Propuesta
            </Link>
          </div>
        </div>
      </section>

      {/* TIPOS DE EVENTOS */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-main to-bg-surface">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-h2 text-center text-white mb-12">
            Eventos que <span className="text-oe-gold">Conectan</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: "Cenas de Empresa",
                text: "Música ambiente elegante, iluminación corporativa y coordinación impecable para que tu equipo disfrute sin preocupaciones.",
              },
              {
                icon: Users,
                title: "Team Building",
                text: "Dinámicas musicales, juegos interactivos y ambiente que genera conexión real entre tu equipo.",
              },
              {
                icon: Handshake,
                title: "Networking Empresarial",
                text: "Música de fondo sofisticada, iluminación profesional y ambiente que facilita la conversación.",
              },
              {
                icon: TrendingUp,
                title: "Presentaciones Corporativas",
                text: "Sonido profesional para speakers, pantallas LED, iluminación escénica y coordinación con protocolo.",
              },
              {
                icon: Lightbulb,
                title: "Lanzamientos de Producto",
                text: "Producción técnica completa, branding integrado y efectos especiales para impactar a tus invitados.",
              },
              {
                icon: Star,
                title: "Eventos Institucionales",
                text: "Profesionalismo en cada detalle: montaje discreto, técnico onsite y backup total del equipamiento.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-bg-surface border border-border hover:border-oe-gold/50 transition-all text-center"
              >
                <s.icon className="w-12 h-12 text-oe-gold mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALOR DIFERENCIAL */}
      <section className="py-20 sm:py-32 bg-bg-surface">
        <div className="mx-auto max-w-5xl px-4">
          <div className="oe-card p-10 rounded-3xl border-2 border-oe-gold/50">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-oe-gold/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-oe-gold" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4 text-center">
              Profesionalismo que Refuerza tu Marca
            </h2>
            <p className="text-xl text-text-muted mb-8 leading-relaxed text-center">
              No solo producción técnica: creamos networking elegante, ambiente profesional y momentos de conexión real entre asistentes. Tu equipo recuerda el evento, tu cliente queda impresionado.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-bg-main rounded-xl">
                <Star className="w-6 h-6 text-oe-gold mx-auto mb-2" />
                <p className="text-white font-bold">2+</p>
                <p className="text-text-muted text-xs">Años experiencia</p>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <Check className="w-6 h-6 text-oe-gold mx-auto mb-2" />
                <p className="text-white font-bold">BCN</p>
                <p className="text-text-muted text-xs">+ Girona</p>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <Briefcase className="w-6 h-6 text-oe-gold mx-auto mb-2" />
                <p className="text-white font-bold">100%</p>
                <p className="text-text-muted text-xs">Dedicación</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ INCLUYE */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-surface to-bg-main">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-h2 text-center text-white mb-12">
            Qué Incluye <span className="text-oe-gold">Tu Evento</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-bg-surface border border-oe-gold/30">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Check className="w-6 h-6 text-oe-gold" />
                Producción Técnica
              </h3>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Sonido profesional Pioneer + EV (cobertura perfecta)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Iluminación LED corporativa sincronizada con branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Micrófonos inalámbricos para speakers/presentadores</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Pantallas LED opcionales para proyección corporativa</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Montaje discreto, técnico onsite y backup total</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-bg-surface border border-oe-gold/30">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-oe-gold" />
                Ambiente Profesional
              </h3>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Música ambiente adaptada al momento del evento</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Integración de identidad corporativa (logo, colores, mensajes)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Dinámicas de networking si se requieren</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Coordinación con catering, venue y proveedores</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>Protocolo y timing impecable durante el evento</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-main to-bg-surface">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-display font-black text-white mb-6">
            Cuéntanos Tu Evento
          </h2>
          <p className="text-lg text-text-muted mb-10">
            Dinos qué necesitas y te enviaremos una propuesta adaptada a tu empresa.
          </p>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
