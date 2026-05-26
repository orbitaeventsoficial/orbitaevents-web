// app/admin/inbox/page.tsx
// Canvi #801 — reconstrucció des de zero (ix- classes, cap AdminPage)
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import Link from 'next/link';
import InboxClient from './InboxClient';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { buildInboxOwnerControlSummary } from '@/lib/services/inboxOwnerControlSummaryService';
import { isImapConfigured } from '@/lib/env';
import PendingFollowUpsPanel from './PendingFollowUpsPanel';
import './inbox.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Safata | Òrbita Admin',
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
      () =>
        prisma.lead.findMany({
          where: { email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } } },
          select: {
            id: true,
            customerId: true,
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
      CacheTTL.VERY_SHORT,
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
      () =>
        Promise.all([
          prisma.lead.count({ where: { email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } } } }),
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
      CacheTTL.SHORT,
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
      () =>
        prisma.pack.findMany({
          where: { isActive: true },
          select: {
            code: true,
            slug: true,
            price: true,
            translations: { where: { locale: 'ca' }, select: { name: true }, take: 1 },
          },
          orderBy: { price: 'asc' },
          take: 20,
        }),
      CacheTTL.SHORT,
    );
    return packs
      .map((pack) => ({
        id: (pack.code || pack.slug || '').toLowerCase(),
        label: pack.translations[0]?.name || pack.slug,
        price: Number(pack.price || 0),
      }))
      .filter((pack) => pack.id && pack.price > 0);
  } catch (error) {
    log.error('[Inbox] Error carregant packs:', error);
    return [];
  }
}

export default async function InboxPage() {
  const [leads, stats, quotePacks, followUps] = await Promise.all([
    getLeads(),
    getStats(),
    getQuotePacks(),
    loadPendingFollowUps(),
  ]);
  const imapConfigured = isImapConfigured();
  const ownerSummary = buildInboxOwnerControlSummary({
    imapConfigured,
    leads,
    stats,
    followUps,
  });

  return (
    <div className="ix">
      {/* Capçalera */}
      <div className="ix__head">
        <div className="ix__headleft">
          <span className="ix__eyebrow">Comunicació</span>
          <h1 className="ix__title">Safata</h1>
          <p className="ix__subtitle">
            {imapConfigured
              ? 'Safata unificada de correu i entrades'
              : 'Entrades web i correu en una sola safata'}
          </p>
        </div>
        <div className="ix__headactions">
          <Link href="/admin/inbox/compose" className="ix__btn ix__btn--primary">
            ✏ Nou correu
          </Link>
          <Link href="/admin/inbox/settings" className="ix__btn ix__btn--ghost">
            Configuració
          </Link>
        </div>
      </div>

      {/* Pols operatiu */}
      <div style={{ padding: '16px 20px 0' }}>
        <OwnerControlStrip
          system={{
            eyebrow: 'Automàtic',
            title: 'Què vigila el sistema',
            tone: 'info',
            items: ownerSummary.automaticSignals,
            emptyText: 'Sense senyals automàtiques destacades ara mateix.',
          }}
          manual={{
            eyebrow: 'Manual',
            title: 'Què et reclama decisió',
            tone: ownerSummary.manualSignals.length > 0 ? 'warning' : 'success',
            items: ownerSummary.manualSignals,
            emptyText: 'No hi ha cap front manual calent a la safata.',
          }}
          nextStep={{
            title: ownerSummary.nextStep.label,
            detail: ownerSummary.nextStep.detail,
            href: ownerSummary.nextStep.href,
          }}
        />
      </div>

      {/* Avís IMAP no configurat */}
      {!imapConfigured && (
        <div className="ix__imapbanner">
          <span className="ix__imapbanner-icon">⚠</span>
          <div>
            <p className="ix__imapbanner-title">Correu no configurat</p>
            <p className="ix__imapbanner-body">
              Per veure emails reals del teu domini, configura les variables IMAP a Railway:
            </p>
            <code className="ix__imapbanner-code">
              IMAP_HOST · IMAP_PORT · IMAP_USER · IMAP_PASS
            </code>
            <p className="ix__imapbanner-body" style={{ marginTop: 6 }}>
              Mentrestant, la safata mostrarà les entrades web disponibles.
            </p>
          </div>
        </div>
      )}

      {/* Follow-ups pendents */}
      <div className="ix__followups" id="pending-followups">
        <PendingFollowUpsPanel />
      </div>

      {/* Inbox principal */}
      <InboxClient
        initialLeads={leads}
        stats={stats}
        imapConfigured={imapConfigured}
        quotePacks={quotePacks}
      />
    </div>
  );
}
