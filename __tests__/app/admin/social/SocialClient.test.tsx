import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SocialPostStatus } from '@/lib/constants';
import SocialClient from '@/app/admin/social/SocialClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const counts: Record<SocialPostStatus, number> = {
  IDEA: 0,
  DRAFT: 1,
  SCHEDULED: 2,
  PUBLISHED: 3,
  ARCHIVED: 0,
};

const activePulse = {
  windowDays: 30,
  postsLast30d: 5,
  publishedLast30d: 3,
  scheduledUpcoming: 2,
  draftsPending: 1,
  daysSinceLastPost: 4 as number | null,
  isActive: true,
  consistencyScore: 67,
  instagramLeadCount: 9,
  instagramWonCount: 2,
};

function renderSocial(overrides: Partial<typeof activePulse> = {}) {
  render(
    <SocialClient
      initialPosts={[]}
      initialCounts={counts}
      initialIdeas={[]}
      initialContentPulse={{ ...activePulse, ...overrides }}
    />,
  );
}

describe('SocialClient', () => {
  it('mostra el pols real de contingut dins la vista social', () => {
    renderSocial();

    expect(screen.getByText('Pols editorial')).toBeInTheDocument();
    expect(screen.getByText('Actiu')).toBeInTheDocument();
    expect(screen.getByText('Cadència')).toBeInTheDocument();
    expect(screen.getAllByText('67%')).toHaveLength(1);
    expect(screen.getByText('Cua editorial')).toBeInTheDocument();
    expect(screen.getByText('Instagram → pipeline')).toBeInTheDocument();
    expect(screen.getByText('Bucle social únic')).toBeInTheDocument();
    expect(screen.getByText('Contingut connectat a captació')).toBeInTheDocument();
    expect(screen.getByText('Repetir el format que porta leads i revisar conversió guanyada')).toBeInTheDocument();
    expect(screen.getByText('9 leads Instagram · 2 guanyats')).toBeInTheDocument();
    expect(screen.getByText('2 guanyats · 22% conversió')).toBeInTheDocument();
    expect(screen.getByText(/3 publicades en 30 dies · consistència 67% · Instagram: 9 leads, 2 guanyats/)).toBeInTheDocument();
  });

  it('eleva el següent pas quan el calendari social esta aturat', () => {
    renderSocial({
      publishedLast30d: 0,
      scheduledUpcoming: 0,
      daysSinceLastPost: null,
      isActive: false,
      consistencyScore: 0,
      instagramLeadCount: 0,
      instagramWonCount: 0,
    });

    expect(screen.getByText('Aturat')).toBeInTheDocument();
    expect(screen.getByText('Cap publicació publicada en els últims 30 dies.')).toBeInTheDocument();
    expect(screen.getByText('Publicar una peça real abans de generar més idees')).toBeInTheDocument();
    expect(screen.getByText(/Instagram sense leads atribuïts/)).toBeInTheDocument();
    expect(screen.getByText('Calendari sense pols públic')).toBeInTheDocument();
  });
});
