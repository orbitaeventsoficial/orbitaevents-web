/**
 * Recalcular cachedScore de tots els leads
 * ==========================================
 * Executa el motor de scoring per cada lead actiu i actualitza cachedScore/cachedScoreAt.
 *
 * Executar: npx tsx scripts/recalculate-scores.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Scoring simplificat (replica la lògica de commercialScoring.ts)
function computeScore(lead: {
  status: string;
  eventType: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  budget: string | null;
  source: string | null;
  phone: string | null;
  eventLocation: string | null;
}): number {
  let score = 0;

  // Status (max 25)
  const statusScores: Record<string, number> = {
    NEW: 10, CONTACTED: 15, QUOTE_SENT: 20, NEGOTIATING: 22, WON: 25, LOST: 0,
  };
  score += statusScores[lead.status] || 5;

  // Tipus event (max 15)
  const typeScores: Record<string, number> = {
    WEDDING: 15, CORPORATE: 12, BIRTHDAY: 8, PRIVATE_PARTY: 7, FESTIVAL: 10, OTHER: 5,
  };
  score += typeScores[lead.eventType || ''] || 5;

  // Data event (max 20) — més proper = més punts
  if (lead.eventDate) {
    const days = Math.max(0, Math.floor((new Date(lead.eventDate).getTime() - Date.now()) / 86400000));
    if (days <= 7) score += 20;
    else if (days <= 14) score += 18;
    else if (days <= 30) score += 15;
    else if (days <= 60) score += 10;
    else if (days <= 90) score += 7;
    else score += 3;
  }

  // Convidats (max 10)
  const guests = lead.guestCount || 0;
  if (guests >= 150) score += 10;
  else if (guests >= 100) score += 8;
  else if (guests >= 50) score += 5;
  else if (guests > 0) score += 3;

  // Pressupost (max 10)
  if (lead.budget) {
    const budgetNum = parseInt(lead.budget.replace(/\D/g, ''), 10) || 0;
    if (budgetNum >= 1000) score += 10;
    else if (budgetNum >= 500) score += 7;
    else if (budgetNum > 0) score += 4;
  }

  // Font (max 10)
  const sourceScores: Record<string, number> = {
    WEBSITE: 8, REFERRAL: 10, INSTAGRAM: 6, GOOGLE: 7, OTHER: 4,
  };
  score += sourceScores[lead.source || ''] || 3;

  // Completesa dades (max 10)
  let completeness = 0;
  if (lead.phone) completeness += 3;
  if (lead.eventDate) completeness += 3;
  if (lead.eventLocation) completeness += 2;
  if (lead.guestCount) completeness += 2;
  score += completeness;

  return Math.min(100, Math.max(0, score));
}

async function main() {
  console.log('📊 Recalculant scores de tots els leads...\n');

  const leads = await prisma.lead.findMany({
    where: { status: { not: 'LOST' } },
    select: {
      id: true, status: true, eventType: true, eventDate: true,
      guestCount: true, budget: true, source: true, phone: true,
      eventLocation: true, cachedScore: true,
    },
  });

  let updated = 0;
  let unchanged = 0;

  for (const lead of leads) {
    const newScore = computeScore(lead);
    const oldScore = lead.cachedScore || 0;

    if (newScore !== oldScore) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { cachedScore: newScore, cachedScoreAt: new Date() },
      });
      updated++;
      console.log(`  ↻ Lead ${lead.id.slice(0, 8)}... ${oldScore} → ${newScore}`);
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ Fet! ${updated} actualitzats, ${unchanged} sense canvis (total: ${leads.length})`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
