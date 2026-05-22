import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QuestionnaireQuestion } from '@/lib/services/questionnaireService';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    questionnaireTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    questionnaireResponse: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listQuestionnaireTemplates,
  getQuestionnaireTemplate,
  createQuestionnaireTemplate,
  updateQuestionnaireTemplate,
  deleteQuestionnaireTemplate,
  getBookingQuestionnaire,
  submitQuestionnaireResponse,
} from '@/lib/services/questionnaireService';

const sampleQuestions: QuestionnaireQuestion[] = [
  { id: 'q1', type: 'text', label: 'Nom del contacte principal', required: true },
  { id: 'q2', type: 'select', label: 'Estil musical', options: ['Pop', 'Rock', 'Electrònica'], required: false },
];

const sampleTemplate = {
  id: 'tpl-1',
  title: 'Qüestionari pre-event',
  description: 'Dades per preparar el dia',
  questions: sampleQuestions,
  isActive: true,
  createdAt: new Date('2026-05-16'),
  updatedAt: new Date('2026-05-16'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listQuestionnaireTemplates', () => {
  it('retorna templates formatats', async () => {
    mockPrisma.questionnaireTemplate.findMany.mockResolvedValue([sampleTemplate]);
    const result = await listQuestionnaireTemplates();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Qüestionari pre-event');
    expect(result[0].questions).toHaveLength(2);
  });
});

describe('getQuestionnaireTemplate', () => {
  it('retorna null si no existeix', async () => {
    mockPrisma.questionnaireTemplate.findUnique.mockResolvedValue(null);
    expect(await getQuestionnaireTemplate('no-id')).toBeNull();
  });

  it('retorna el template parsejat', async () => {
    mockPrisma.questionnaireTemplate.findUnique.mockResolvedValue(sampleTemplate);
    const result = await getQuestionnaireTemplate('tpl-1');
    expect(result?.id).toBe('tpl-1');
    expect(result?.questions[0].type).toBe('text');
  });
});

describe('createQuestionnaireTemplate', () => {
  it('crea el template i el retorna', async () => {
    mockPrisma.questionnaireTemplate.create.mockResolvedValue(sampleTemplate);
    const result = await createQuestionnaireTemplate({
      title: 'Qüestionari pre-event',
      questions: sampleQuestions,
    });
    expect(result.title).toBe('Qüestionari pre-event');
    expect(mockPrisma.questionnaireTemplate.create).toHaveBeenCalledOnce();
  });
});

describe('updateQuestionnaireTemplate', () => {
  it('actualitza els camps demanats', async () => {
    mockPrisma.questionnaireTemplate.update.mockResolvedValue({ ...sampleTemplate, title: 'Nou títol' });
    const result = await updateQuestionnaireTemplate('tpl-1', { title: 'Nou títol' });
    expect(result.title).toBe('Nou títol');
  });
});

describe('deleteQuestionnaireTemplate', () => {
  it('crida delete al prisma', async () => {
    mockPrisma.questionnaireTemplate.delete.mockResolvedValue(sampleTemplate);
    await deleteQuestionnaireTemplate('tpl-1');
    expect(mockPrisma.questionnaireTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
  });
});

describe('getBookingQuestionnaire', () => {
  it('retorna null si no hi ha template actiu', async () => {
    mockPrisma.questionnaireTemplate.findFirst.mockResolvedValue(null);
    expect(await getBookingQuestionnaire('bk-1')).toBeNull();
  });

  it('retorna template + null response si el client no ha respost', async () => {
    mockPrisma.questionnaireTemplate.findFirst.mockResolvedValue(sampleTemplate);
    mockPrisma.questionnaireResponse.findUnique.mockResolvedValue(null);
    const result = await getBookingQuestionnaire('bk-1');
    expect(result?.template.id).toBe('tpl-1');
    expect(result?.response).toBeNull();
  });

  it('retorna template + response existent', async () => {
    const existingResponse = {
      id: 'resp-1',
      bookingId: 'bk-1',
      templateId: 'tpl-1',
      answers: { q1: 'Joan', q2: 'Pop' },
      submittedAt: new Date('2026-05-16'),
      createdAt: new Date('2026-05-16'),
      updatedAt: new Date('2026-05-16'),
    };
    mockPrisma.questionnaireTemplate.findFirst.mockResolvedValue(sampleTemplate);
    mockPrisma.questionnaireResponse.findUnique.mockResolvedValue(existingResponse);
    const result = await getBookingQuestionnaire('bk-1');
    expect(result?.response?.answers['q1']).toBe('Joan');
    expect(result?.response?.submittedAt).toBeInstanceOf(Date);
  });
});

describe('submitQuestionnaireResponse', () => {
  it('crea o actualitza la resposta via upsert', async () => {
    const savedResponse = {
      id: 'resp-1',
      bookingId: 'bk-1',
      templateId: 'tpl-1',
      answers: { q1: 'Joan', q2: 'Pop' },
      submittedAt: new Date('2026-05-16'),
      createdAt: new Date('2026-05-16'),
      updatedAt: new Date('2026-05-16'),
    };
    mockPrisma.questionnaireResponse.upsert.mockResolvedValue(savedResponse);
    const result = await submitQuestionnaireResponse('bk-1', 'tpl-1', { q1: 'Joan', q2: 'Pop' });
    expect(result.bookingId).toBe('bk-1');
    expect(result.answers['q1']).toBe('Joan');
    expect(result.submittedAt).toBeInstanceOf(Date);
    expect(mockPrisma.questionnaireResponse.upsert).toHaveBeenCalledOnce();
  });
});
