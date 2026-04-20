import { describe, it, expect } from 'vitest';
import { generateSocialIdeas, type SocialIdeasInput } from '@/lib/services/socialIdeasService';

const NOW = new Date('2026-04-10T12:00:00Z');
const DAY = 1000 * 60 * 60 * 24;

function makeInput(overrides: Partial<SocialIdeasInput> = {}): SocialIdeasInput {
  return {
    recentBookings: [],
    newTestimonials: [],
    portfolioEvents: [],
    upcomingEvents: [],
    now: NOW,
    ...overrides,
  };
}

describe('generateSocialIdeas', () => {
  it('retorna array buit sense dades', () => {
    const ideas = generateSocialIdeas(makeInput());
    expect(ideas).toEqual([]);
  });

  it('genera idea per booking recent sense post', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        recentBookings: [
          {
            id: 'b1',
            eventDate: new Date(NOW.getTime() - 5 * DAY),
            eventType: 'WEDDING',
            packName: 'Pack Or',
            customerName: 'Laura',
            hasSocialPost: false,
          },
        ],
      })
    );
    expect(ideas).toHaveLength(1);
    expect(ideas[0].source).toBe('booking');
    expect(ideas[0].id).toBe('booking:b1');
    expect(ideas[0].title).toContain('WEDDING');
    expect(ideas[0].sourceRef.label).toBe('Laura');
  });

  it('exclou booking amb post social existent', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        recentBookings: [
          {
            id: 'b1',
            eventDate: new Date(NOW.getTime() - 5 * DAY),
            eventType: 'WEDDING',
            packName: null,
            customerName: null,
            hasSocialPost: true,
          },
        ],
      })
    );
    expect(ideas).toHaveLength(0);
  });

  it('exclou booking de fa més de 30 dies', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        recentBookings: [
          {
            id: 'b1',
            eventDate: new Date(NOW.getTime() - 60 * DAY),
            eventType: 'WEDDING',
            packName: null,
            customerName: null,
            hasSocialPost: false,
          },
        ],
      })
    );
    expect(ideas).toHaveLength(0);
  });

  it('genera idea per testimoni aprovat', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        newTestimonials: [
          {
            id: 't1',
            customerName: 'Marc',
            text: 'Un servei fantàstic, molt recomanat.',
            rating: 5,
            eventType: 'WEDDING',
            photoUrl: null,
            hasSocialPost: false,
          },
        ],
      })
    );
    expect(ideas).toHaveLength(1);
    expect(ideas[0].source).toBe('testimonial');
    expect(ideas[0].caption).toContain('⭐⭐⭐⭐⭐');
    expect(ideas[0].caption).toContain('Marc');
    expect(ideas[0].category).toBe('TESTIMONIAL');
  });

  it('testimoni amb foto usa contentType IMAGE', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        newTestimonials: [
          {
            id: 't1',
            customerName: 'Marc',
            text: 'Excel·lent.',
            rating: 4,
            eventType: null,
            photoUrl: 'https://example.com/foto.jpg',
            hasSocialPost: false,
          },
        ],
      })
    );
    expect(ideas[0].contentType).toBe('IMAGE');
    expect(ideas[0].mediaUrl).toBe('https://example.com/foto.jpg');
  });

  it('genera idea per portfolio event recent', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        portfolioEvents: [
          {
            id: 'p1',
            slug: 'boda-laura-marc',
            title: 'Boda Laura & Marc',
            categorySlug: 'bodas',
            coverImage: 'https://example.com/cover.jpg',
            createdAt: new Date(NOW.getTime() - 10 * DAY),
          },
        ],
      })
    );
    expect(ideas).toHaveLength(1);
    expect(ideas[0].source).toBe('portfolio');
    expect(ideas[0].mediaUrl).toBe('https://example.com/cover.jpg');
    expect(ideas[0].platforms).toContain('PINTEREST');
  });

  it('exclou portfolio més antic de 45 dies', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        portfolioEvents: [
          {
            id: 'p1',
            slug: 'old',
            title: 'Old',
            categorySlug: 'bodas',
            coverImage: 'x',
            createdAt: new Date(NOW.getTime() - 60 * DAY),
          },
        ],
      })
    );
    expect(ideas).toHaveLength(0);
  });

  it('genera idea teaser per upcoming event amb scheduledAt suggerit', () => {
    const eventDate = new Date(NOW.getTime() + 7 * DAY);
    const ideas = generateSocialIdeas(
      makeInput({
        upcomingEvents: [
          {
            id: 'e1',
            eventDate,
            eventType: 'PARTY',
            venue: 'Masia Can Riera',
          },
        ],
      })
    );
    expect(ideas).toHaveLength(1);
    expect(ideas[0].source).toBe('upcoming-event');
    expect(ideas[0].caption).toContain('7 dies');
    expect(ideas[0].caption).toContain('Masia Can Riera');
    expect(ideas[0].scheduledAt).toBeInstanceOf(Date);
    // Scheduled 2 days before event
    const expectedScheduled = new Date(eventDate.getTime() - 2 * DAY);
    expect(ideas[0].scheduledAt?.getTime()).toBe(expectedScheduled.getTime());
  });

  it('exclou upcoming events més llunyans de 14 dies', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        upcomingEvents: [
          {
            id: 'e1',
            eventDate: new Date(NOW.getTime() + 30 * DAY),
            eventType: 'PARTY',
            venue: null,
          },
        ],
      })
    );
    expect(ideas).toHaveLength(0);
  });

  it('combina múltiples fonts en una sola resposta', () => {
    const ideas = generateSocialIdeas(
      makeInput({
        recentBookings: [
          {
            id: 'b1',
            eventDate: new Date(NOW.getTime() - 3 * DAY),
            eventType: 'WEDDING',
            packName: null,
            customerName: null,
            hasSocialPost: false,
          },
        ],
        newTestimonials: [
          {
            id: 't1',
            customerName: 'Marc',
            text: 'Bo',
            rating: 5,
            eventType: null,
            photoUrl: null,
            hasSocialPost: false,
          },
        ],
        portfolioEvents: [
          {
            id: 'p1',
            slug: 's',
            title: 'T',
            categorySlug: 'bodas',
            coverImage: 'x',
            createdAt: new Date(NOW.getTime() - 5 * DAY),
          },
        ],
        upcomingEvents: [
          {
            id: 'e1',
            eventDate: new Date(NOW.getTime() + 5 * DAY),
            eventType: 'PARTY',
            venue: null,
          },
        ],
      })
    );
    expect(ideas).toHaveLength(4);
    const sources = ideas.map((i) => i.source);
    expect(sources).toContain('booking');
    expect(sources).toContain('testimonial');
    expect(sources).toContain('portfolio');
    expect(sources).toContain('upcoming-event');
  });

  it('truncat de text llarg al testimoni', () => {
    const longText = 'a'.repeat(500);
    const ideas = generateSocialIdeas(
      makeInput({
        newTestimonials: [
          {
            id: 't1',
            customerName: 'Marc',
            text: longText,
            rating: 5,
            eventType: null,
            photoUrl: null,
            hasSocialPost: false,
          },
        ],
      })
    );
    expect(ideas[0].caption).toContain('…');
    expect(ideas[0].caption.length).toBeLessThan(500);
  });
});
