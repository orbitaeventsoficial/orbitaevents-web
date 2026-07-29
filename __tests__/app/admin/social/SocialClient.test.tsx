import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SocialPostStatus } from '@/lib/constants';
import SocialClient from '@/app/admin/social/SocialClient';
import { fetchWithCsrf } from '@/lib/csrf';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

const draftPost = {
  id: 'sp-1',
  title: 'Esborrany post-event',
  caption: 'Caption pendent de revisar.',
  hashtags: [],
  platforms: ['INSTAGRAM'],
  status: 'DRAFT',
  contentType: 'TEXT',
  category: 'EVENT_SHOWCASE',
  scheduledAt: null,
  publishedAt: null,
  mediaUrls: [],
  bookingId: 'booking-1',
  originType: 'BOOKING',
  originId: 'booking-1',
  originLabel: 'OE-2026-001',
  notes: 'Creat des del playbook post-event. Revisar consentiment, imatges i dades personals abans de publicar. No publicat automaticament.',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
};

function jsonResponse(payload: unknown, ok: boolean): Response {
  return {
    ok,
    json: async () => payload,
  } as Response;
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
    // Operating loop viu (l'antic panell OwnerControlStrip va ser eradicat al #976 → null)
    expect(screen.getByText('Calendari sense pols públic')).toBeInTheDocument();
    expect(screen.getByText('Publicar una peça real i mesurar si genera conversa comercial')).toBeInTheDocument();
    expect(screen.getByText('Instagram encara sense pipeline atribuït')).toBeInTheDocument();
  });

  it('obre el modal d edicio quan rep un focusPostId existent', async () => {
    render(
      <SocialClient
        initialPosts={[draftPost]}
        initialCounts={counts}
        initialIdeas={[]}
        initialContentPulse={activePulse}
        focusPostId="sp-1"
      />,
    );

    expect(await screen.findByText('Editar publicació')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Esborrany post-event')).toBeInTheDocument();
    expect(screen.getByText('Esborrany social obert des del playbook')).toBeInTheDocument();
    expect(screen.getByText(/Revisió obligatòria/)).toBeInTheDocument();
  });

  it('bloqueja programar o publicar un draft post-event pendent de consentiment', () => {
    render(
      <SocialClient
        initialPosts={[draftPost]}
        initialCounts={counts}
        initialIdeas={[]}
        initialContentPulse={activePulse}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('Esborrany'), { target: { value: 'PUBLISHED' } });

    expect(fetchWithCsrf).not.toHaveBeenCalled();
    expect(screen.getByText('Revisa consentiment, imatges i dades personals abans de programar o publicar.')).toBeInTheDocument();
  });

  it('mostra el motiu backend quan falla canviar estat social', async () => {
    const fetchMock = vi.mocked(fetchWithCsrf);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: false, error: 'Consentiment pendent al backend' }, false));

    render(
      <SocialClient
        initialPosts={[draftPost]}
        initialCounts={counts}
        initialIdeas={[]}
        initialContentPulse={activePulse}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('Esborrany'), { target: { value: 'ARCHIVED' } });

    expect(await screen.findByText('Consentiment pendent al backend')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/social-posts/sp-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'ARCHIVED' }),
      }),
    );
  });

  it('mostra el motiu backend quan falla eliminar una publicacio social', async () => {
    const fetchMock = vi.mocked(fetchWithCsrf);
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'No es pot eliminar una publicació publicada' }, false));

    render(
      <SocialClient
        initialPosts={[draftPost]}
        initialCounts={counts}
        initialIdeas={[]}
        initialContentPulse={activePulse}
      />,
    );

    fireEvent.click(screen.getByText('🗑️'));
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('No es pot eliminar una publicació publicada')).toBeInTheDocument();
    expect(screen.getByText('Esborrany post-event')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/social-posts/sp-1', { method: 'DELETE' });
  });

  it('persisteix la revisio social resolta a notes i permet publicar', async () => {
    const fetchMock = vi.mocked(fetchWithCsrf);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        post: {
          ...draftPost,
          status: 'PUBLISHED',
          notes: 'Creat des del playbook post-event.\nRevisió post-event resolta: permís, imatges i privacitat revisats.',
          publishedAt: '2026-07-02T10:00:00.000Z',
        },
      }),
    } as Response);

    render(
      <SocialClient
        initialPosts={[draftPost]}
        initialCounts={counts}
        initialIdeas={[]}
        initialContentPulse={activePulse}
        focusPostId="sp-1"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Marcar revisió feta' }));
    expect(screen.queryByText(/Revisió obligatòria/)).not.toBeInTheDocument();

    const statusSelect = screen.getAllByDisplayValue('Esborrany').at(-1) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'PUBLISHED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desar canvis' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/social-posts/sp-1',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.any(String),
      }),
    ));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.status).toBe('PUBLISHED');
    expect(body.notes).toContain('Revisió post-event resolta');
    expect(body.notes).not.toContain('Revisar consentiment');
    expect(body.notes).not.toContain('No publicat automaticament');
  });

  it('crea post des d una idea de testimoni amb origen canonic', async () => {
    const fetchMock = vi.mocked(fetchWithCsrf);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        post: {
          id: 'sp-testimonial',
          title: 'Testimoni de Anna',
          caption: 'Molt be',
          hashtags: ['OrbitaEvents'],
          platforms: ['INSTAGRAM'],
          status: 'DRAFT',
          contentType: 'TEXT',
          category: 'TESTIMONIAL',
          scheduledAt: null,
          publishedAt: null,
          mediaUrls: [],
          bookingId: null,
          originType: 'TESTIMONIAL',
          originId: 'testimonial-1',
          originLabel: 'Anna Garcia',
          notes: null,
          createdAt: '2026-07-03T10:00:00.000Z',
          updatedAt: '2026-07-03T10:00:00.000Z',
        },
      }),
    } as Response);

    render(
      <SocialClient
        initialPosts={[]}
        initialCounts={counts}
        initialIdeas={[
          {
            id: 'testimonial:testimonial-1',
            source: 'testimonial',
            title: 'Testimoni de Anna',
            caption: 'Molt be',
            hashtags: ['OrbitaEvents'],
            platforms: ['INSTAGRAM'],
            contentType: 'TEXT',
            category: 'TESTIMONIAL',
            scheduledAt: null,
            mediaUrl: null,
            sourceRef: { type: 'testimonial', id: 'testimonial-1', label: 'Anna Garcia' },
            reason: 'Testimoni 5★ aprovat sense publicar',
          },
        ]}
        initialContentPulse={activePulse}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Usar aquesta idea' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Crear publicació' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/social-posts',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }),
    ));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.originType).toBe('TESTIMONIAL');
    expect(body.originId).toBe('testimonial-1');
    expect(body.originLabel).toBe('Anna Garcia');
    expect(body.bookingId).toBeUndefined();
  });
});
