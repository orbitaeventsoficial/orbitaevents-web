// app/admin/post-event/page.tsx
import { log } from '@/lib/logger';
import { formatDateSimple } from '@/lib/constants';
import { getTranslatedPackName } from '@/lib/pack-name';
// Pàgina de gestió post-event
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';

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
    <AdminPage title="Post-Event" subtitle="Gestiona informes, enquestes i feedback dels esdeveniments">

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Informes Pendents</p>
          <p className="mt-2 text-3xl font-bold">{data.pendingReports}</p>
          <p className="text-xs mt-1">Esborrany</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Enquestes per enviar</p>
          <p className="mt-2 text-3xl font-bold">{data.pendingSurveys}</p>
          <p className="text-xs mt-1">Sense enquesta enviada</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Informes Completats</p>
          <p className="mt-2 text-3xl font-bold">{data.completedReports}</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Enquestes Rebudes</p>
          <p className="mt-2 text-3xl font-bold">{data.completedSurveys}</p>
        </div>
      </section>

      {/* Workflow Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Step 1: Informe Intern */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Informe Intern</h3>
                <p className="text-xs">Completa després de l&apos;event</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm">
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
              className="mt-4 w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Veure informes
            </Link>
          </div>
        </div>

        {/* Step 2: Enquesta Client */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Enquesta Client</h3>
                <p className="text-xs">S&apos;envia automàticament</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm">
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
              className="mt-4 w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Veure enquestes
            </Link>
          </div>
        </div>

        {/* Step 3: Feedback Client */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Feedback al Client</h3>
                <p className="text-xs">Envia agraïment</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2 text-sm">
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
              className="mt-4 w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Veure feedback
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Completed Events */}
      <section className="rounded-xl border shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold flex items-center gap-2">
            📅 Events Completats Sense Informe
            <span className="text-sm font-normal">
              ({data.recentBookings.length})
            </span>
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentBookings.map((booking) => {
            const packName =
              getTranslatedPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
            return (
              <div
                key={booking.id}
                className="p-4 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{booking.clientName}</p>
                  <p className="text-sm">
                    {formatDateSimple(booking.eventDate)} · {packName} · {booking.eventLocation}
                  </p>
                </div>
                <Link
                  href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                >
                  📝 Crear informe
                </Link>
              </div>
            );
          })}
          {data.recentBookings.length === 0 && (
            <div className="p-8 text-center">
              ✅ Tots els esdeveniments completats tenen informe
            </div>
          )}
        </div>
      </section>
    </AdminPage>
  );
}


