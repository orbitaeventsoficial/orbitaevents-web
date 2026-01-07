// app/admin/post-event/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió post-event
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Post-Event | Òrbita Admin',
};

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
          pack: { include: { translations: { where: { locale: 'es' } } } },
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
          <h1 className="text-2xl font-semibold tracking-tight text-black">Post-Event</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona informes, enquestes i feedback dels events
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">Informes Pendents</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">{data.pendingReports}</p>
          <p className="text-xs text-orange-500 mt-1">Esborrany</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Enquestes per Enviar</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{data.pendingSurveys}</p>
          <p className="text-xs text-blue-500 mt-1">Sense enquesta enviada</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Informes Completats</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{data.completedReports}</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-purple-600 uppercase">Enquestes Rebudes</p>
          <p className="mt-2 text-3xl font-bold text-purple-700">{data.completedSurveys}</p>
        </div>
      </section>

      {/* Workflow Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Step 1: Informe Intern */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-black">Informe Intern</h3>
                <p className="text-xs text-slate-500">Completa després de l&apos;event</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm text-slate-600">
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
              Veure Informes
            </Link>
          </div>
        </div>

        {/* Step 2: Enquesta Client */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-black">Enquesta Client</h3>
                <p className="text-xs text-slate-500">S&apos;envia automàticament</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm text-slate-600">
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
              Veure Enquestes
            </Link>
          </div>
        </div>

        {/* Step 3: Feedback Client */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-black">Feedback al Client</h3>
                <p className="text-xs text-slate-500">Envia agraïment</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm text-slate-600">
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
              Veure Feedbacks
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Completed Events */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <h2 className="font-semibold text-black flex items-center gap-2">
            📅 Events Completats Sense Informe
            <span className="text-sm font-normal text-slate-500">
              ({data.recentBookings.length})
            </span>
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recentBookings.map((booking) => {
            const packName =
              booking.pack.translations[0]?.name || booking.pack.slug;
            return (
              <div
                key={booking.id}
                className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-black">{booking.clientName}</p>
                  <p className="text-sm text-slate-500">
                    {booking.eventDate.toLocaleDateString('ca-ES')} · {packName} · {booking.eventLocation}
                  </p>
                </div>
                <Link
                  href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                  className="inline-flex items-center rounded-md bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
                >
                  📝 Crear Informe
                </Link>
              </div>
            );
          })}
          {data.recentBookings.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              ✅ Tots els events completats tenen informe
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
