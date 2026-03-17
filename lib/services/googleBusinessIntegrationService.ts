import { prisma } from '@/lib/prisma';

export type GoogleBusinessIntegrationConfig = {
  refreshToken?: string;
  accountId?: string;
  locationId?: string;
  locationName?: string;
};

export async function getGoogleBusinessIntegrationConfig(): Promise<GoogleBusinessIntegrationConfig | null> {
  if (process.env.SKIP_DB_QUERIES === '1' || process.env.CI === 'true' || process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  if (!process.env.DATABASE_URL) return null;

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'integrations.google.refreshToken',
          'integrations.google.accountId',
          'integrations.google.locationId',
          'integrations.google.locationName',
        ],
      },
    },
  });

  const map = settings.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return {
    refreshToken: map['integrations.google.refreshToken'],
    accountId: map['integrations.google.accountId'],
    locationId: map['integrations.google.locationId'],
    locationName: map['integrations.google.locationName'],
  };
}