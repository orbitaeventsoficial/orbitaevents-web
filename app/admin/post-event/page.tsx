// app/admin/post-event/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió post-event
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Post-Event | Òrbita Admin',
};

function getPackName(
  translations: Array<{ locale: string; name: string }>,
  fallback: string,
  locale?: string | null
) {
  const preferred = String(locale || 'ca').toLowerCase();
  return (
    translations.find((t) => t.locale === preferred)?.name ||
    translations.find((t) => t.locale === 'ca')?.name ||
    translations[0]?.name ||
    fallback
  );
}

async function getPostEventData() {
  try {
    const [
      recentBookings,
      pendingReports,
      pendingSurveys,
      completedReports,
      completedSurveys,
    ] = await Promise.all([
      // Reserves recents completades sense informe
      prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          postEventReport: null,
        },
        orderBy: { eventDate: 'desc' },
        take: 10,
        include: {
          pack: { include: { translations: true } },
          lead: { select: { preferredLocale: true } },
        },
      }),
      // Informes pendents (draft)
      prisma.postEventReport.count({
        where: { status: 'DRAFT' },
      }),
      // Enquestes pendents d'enviar
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          clientSurvey: null,
          eventDate: { lt: new Date() },
        },
      }),
      // Informes completats
      prisma.postEventReport.count({
        where: { status: 'COMPLETED' },
      }),
      // Enquestes rebudes
      prisma.clientSurvey.count(),
    ]);

    return {
      recentBookings,
      pendingReports,
      pendingSurveys,
      completedReports,
      completedSurveys,
    };
  } catch (error) {
    log.error('Error obtenint dades post-event:', error);
    return {
      recentBookings: [],
      pendingReports: 0,
      pendingSurveys: 0,
      completedReports: 0,
      completedSurveys: 0,
    };
  }
}

export default async function PostEventPage() {
  const data = await getPostEventData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Post-Event</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona informes, enquestes i feedback dels esdeveniments
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-300 uppercase">Informes Pendents</p>
          <p className="mt-2 text-3xl font-bold text-orange-200">{data.pendingReports}</p>
          <p className="text-xs text-orange-400 mt-1">Esborrany</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-300 uppercase">Enquestes per enviar</p>
          <p className="mt-2 text-3xl font-bold text-blue-200">{data.pendingSurveys}</p>
          <p className="text-xs text-blue-400 mt-1">Sense enquesta enviada</p>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-300 uppercase">Informes Completats</p>
          <p className="mt-2 text-3xl font-bold text-green-200">{data.completedReports}</p>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 shadow-sm">
          <p className="text-xs font-medium text-purple-300 uppercase">Enquestes Rebudes</p>
          <p className="mt-2 text-3xl font-bold text-purple-200">{data.completedSurveys}</p>
        </div>
      </section>

      {/* Workflow Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Step 1: Informe Intern */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 shadow-sm overflow-hidden">
          <div className="bg-orange-500/10 border-b border-orange-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Informe Intern</h3>
                <p className="text-xs text-slate-400">Completa després de l&apos;event</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span>📋</span> Timing real de l&apos;event
              </li>
              <li className="flex items-center gap-2">
                <span>🔊</span> Qualitat del so i equip
              </li>
              <li className="flex items-center gap-2">
                <span>💃</span> Nivell de pista
              </li>
              <li className="flex items-center gap-2">
                <span>🎵</span> Estils musicals
              </li>
              <li className="flex items-center gap-2">
                <span>⚠️</span> Incidències
              </li>
            </ul>
            <Link
              href="/admin/post-event/reports"
              className="mt-4 w-full inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Veure informes
            </Link>
          </div>
        </div>

        {/* Step 2: Enquesta Client */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 shadow-sm overflow-hidden">
          <div className="bg-blue-500/10 border-b border-blue-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Enquesta Client</h3>
                <p className="text-xs text-slate-400">S&apos;envia automàticament</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span>⭐</span> Valoració general
              </li>
              <li className="flex items-center gap-2">
                <span>🎵</span> Selecció musical
              </li>
              <li className="flex items-center gap-2">
                <span>👤</span> Professionalitat
              </li>
              <li className="flex items-center gap-2">
                <span>📊</span> NPS Score
              </li>
              <li className="flex items-center gap-2">
                <span>💬</span> Testimoni públic
              </li>
            </ul>
            <Link
              href="/admin/post-event/surveys"
              className="mt-4 w-full inline-flex items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Veure enquestes
            </Link>
          </div>
        </div>

        {/* Step 3: Feedback Client */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 shadow-sm overflow-hidden">
          <div className="bg-green-500/10 border-b border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Feedback al Client</h3>
                <p className="text-xs text-slate-400">Envia agraïment</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span>💌</span> Missatge personalitzat
              </li>
              <li className="flex items-center gap-2">
                <span>📸</span> Foto icònica
              </li>
              <li className="flex items-center gap-2">
                <span>🎁</span> Codi descompte 10%
              </li>
              <li className="flex items-center gap-2">
                <span>👥</span> Per referits
              </li>
            </ul>
            <Link
              href="/admin/post-event/feedback"
              className="mt-4 w-full inline-flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Veure feedback
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Completed Events */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-900/70 shadow-sm overflow-hidden">
        <div className="bg-slate-800/80 border-b border-slate-700 p-4">
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            📅 Events Completats Sense Informe
            <span className="text-sm font-normal text-slate-400">
              ({data.recentBookings.length})
            </span>
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recentBookings.map((booking) => {
            const packName =
              getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
            return (
              <div
                key={booking.id}
                className="p-4 hover:bg-slate-800/70 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-100">{booking.clientName}</p>
                  <p className="text-sm text-slate-400">
                    {booking.eventDate.toLocaleDateString('ca-ES')} · {packName} · {booking.eventLocation}
                  </p>
                </div>
                <Link
                  href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                  className="inline-flex items-center rounded-md bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-200 hover:bg-orange-500/30"
                >
                  📝 Crear informe
                </Link>
              </div>
            );
          })}
          {data.recentBookings.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              ✅ Tots els esdeveniments completats tenen informe
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

