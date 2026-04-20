// app/admin/inbox/page.tsx
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import InboxClient from './InboxClient';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';
import { OwnerControlStrip } from '../components/OwnerControlStrip';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Correu | Òrbita Admin',
};

type QuotePackOption = {
  id: string;
  label: string;
  price: number;
};

async function getLeads() {
  try {
    return await cachedQuery(
      'admin:inbox:leads:50',
      () => prisma.lead.findMany({
        where: {
          email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          eventType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          preferredLocale: true,
          interestedPackId: true,
          interestedExtras: true,
          budget: true,
          guestCount: true,
          eventDate: true,
          eventLocation: true,
          source: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      CacheTTL.VERY_SHORT
    );
  } catch (error) {
    log.error('[Inbox] Error carregant leads:', error);
    return [];
  }
}

async function getStats() {
  try {
    const startToday = new Date(new Date().setHours(0, 0, 0, 0));
    const [totalLeads, unreadLeads, todayLeads] = await cachedQuery(
      `admin:inbox:stats:${startToday.toISOString().slice(0, 10)}`,
      () => Promise.all([
        prisma.lead.count({
          where: { email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } } },
        }),
        prisma.lead.count({
          where: {
            email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
            status: 'NEW',
          },
        }),
        prisma.lead.count({
          where: {
            email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
            createdAt: { gte: startToday },
          },
        }),
      ]),
      CacheTTL.SHORT
    );
    return { totalLeads, unreadLeads, todayLeads };
  } catch (error) {
    log.error('[Inbox] Error carregant stats:', error);
    return { totalLeads: 0, unreadLeads: 0, todayLeads: 0 };
  }
}

async function getQuotePacks(): Promise<QuotePackOption[]> {
  try {
    const packs = await cachedQuery(
      'admin:inbox:quote-packs',
      () => prisma.pack.findMany({
        where: { isActive: true },
        select: {
          code: true,
          slug: true,
          price: true,
          translations: {
            where: { locale: 'ca' },
            select: { name: true },
            take: 1,
          },
        },
        orderBy: { price: 'asc' },
        take: 20,
      }),
      CacheTTL.SHORT
    );

    return packs.map((pack) => ({
      id: (pack.code || pack.slug || '').toLowerCase(),
      label: pack.translations[0]?.name || pack.slug,
      price: Number(pack.price || 0),
    })).filter((pack) => pack.id && pack.price > 0);
  } catch (error) {
    log.error('[Inbox] Error carregant packs:', error);
    return [];
  }
}

import { isImapConfigured } from '@/lib/env';
import PendingFollowUpsPanel from './PendingFollowUpsPanel';

export default async function InboxPage() {
  const [leads, stats, quotePacks, followUps] = await Promise.all([getLeads(), getStats(), getQuotePacks(), loadPendingFollowUps()]);
  const imapConfigured = isImapConfigured();
  const automaticSignals = [
    imapConfigured ? 'Correu IMAP configurat' : 'Només entren leads web; el correu real encara no està configurat',
    stats.todayLeads > 0 ? `${stats.todayLeads} entrada${stats.todayLeads > 1 ? 'es' : ''} avui` : null,
    followUps.total > 0 ? `${followUps.total} seguiment${followUps.total > 1 ? 's' : ''} pendent${followUps.total > 1 ? 's' : ''}` : null,
  ].filter(Boolean) as string[];
  const manualSignals = [
    stats.unreadLeads > 0 ? `${stats.unreadLeads} entrada${stats.unreadLeads > 1 ? 'es' : ''} nova${stats.unreadLeads > 1 ? 'es' : ''}` : null,
    followUps.urgent > 0 ? `${followUps.urgent} seguiment${followUps.urgent > 1 ? 's' : ''} urgent${followUps.urgent > 1 ? 's' : ''}` : null,
    !imapConfigured ? 'Configurar IMAP per operar la safata real' : null,
  ].filter(Boolean) as string[];
  const nextStepHref = followUps.urgent > 0
    ? '#pending-followups'
    : stats.unreadLeads > 0
      ? '#inbox-main'
      : !imapConfigured
        ? '/admin/inbox/settings'
        : '/admin/inbox/compose';
  const nextStepLabel = followUps.urgent > 0
    ? 'Atacar seguiments urgents'
    : stats.unreadLeads > 0
      ? 'Revisar entrades noves'
      : !imapConfigured
        ? 'Configurar correu real'
        : 'Enviar correu nou';
  const nextStepDetail = followUps.urgent > 0
    ? 'Hi ha leads contactats sense resposta que ja passen del llindar saludable.'
    : stats.unreadLeads > 0
      ? 'La prioritat és buidar les entrades noves abans que es refredin.'
      : !imapConfigured
        ? 'La safata encara no és completa fins que IMAP estigui connectat.'
        : 'No hi ha tensió crítica ara mateix; pots iniciar comunicació nova.';

  return (
    <AdminPage
      title="Inbox"
      subtitle={imapConfigured ? 'Safata unificada de correu i entrades' : 'Entrades web i correu en una sola safata'}
      actions={<>
        <Link href="/admin/inbox/compose" className="ap-btn ap-btn--primary">✏️ Nou email</Link>
        <Link href="/admin/inbox/settings" className="ap-btn ap-btn--secondary">⚙️ Configuració</Link>
      </>}
    >
      <div className="mx-4 mt-4 sm:mx-6">
        <OwnerControlStrip
          system={{
            eyebrow: 'Automàtic',
            title: 'Què vigila el sistema',
            tone: 'info',
            items: automaticSignals,
            emptyText: 'Sense senyals automàtiques destacades ara mateix.',
          }}
          manual={{
            eyebrow: 'Manual',
            title: 'Què et reclama decisió',
            tone: manualSignals.length > 0 ? 'warning' : 'success',
            items: manualSignals,
            emptyText: 'No hi ha cap front manual calent a la safata.',
          }}
          nextStep={{
            title: nextStepLabel,
            detail: nextStepDetail,
            href: nextStepHref,
          }}
        />
      </div>

      {/* Avís si IMAP no està configurat */}
      {!imapConfigured && (
        <div className="mx-6 mt-4 p-4 border rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold">Correu no configurat</h3>
              <p className="text-sm mt-1">
                Per veure emails reals del teu domini, configura les variables IMAP a Railway:
              </p>
              <code className="block mt-2 p-2 rounded text-xs">
                IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS
              </code>
              <p className="text-sm mt-2">
                Mentrestant, la safata només mostrarà les entrades web disponibles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Follow-ups pendents */}
      <div id="pending-followups" className="mx-4 mt-4 scroll-mt-24 sm:mx-6">
        <PendingFollowUpsPanel />
      </div>

      {/* Main content */}
      <div id="inbox-main" className="scroll-mt-24">
        <InboxClient
          initialLeads={leads}
          stats={stats}
          imapConfigured={imapConfigured}
          quotePacks={quotePacks}
        />
      </div>
    </AdminPage>
  );
}




