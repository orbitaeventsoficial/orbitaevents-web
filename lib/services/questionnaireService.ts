import 'server-only';
import { prisma } from '@/lib/prisma';

export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect';

export type QuestionnaireQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  options?: string[];
  required: boolean;
};

export type QuestionnaireTemplateData = {
  title: string;
  description?: string | null;
  questions: QuestionnaireQuestion[];
  isActive?: boolean;
};

export type QuestionnaireTemplateDTO = {
  id: string;
  title: string;
  description: string | null;
  questions: QuestionnaireQuestion[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type QuestionnaireResponseDTO = {
  id: string;
  bookingId: string;
  templateId: string;
  answers: Record<string, string | string[]>;
  submittedAt: Date | null;
  createdAt: Date;
};

function parseQuestions(raw: unknown): QuestionnaireQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as QuestionnaireQuestion[];
}

function parseAnswers(raw: unknown): Record<string, string | string[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, string | string[]>;
}

export async function listQuestionnaireTemplates(): Promise<QuestionnaireTemplateDTO[]> {
  const rows = await prisma.questionnaireTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    questions: parseQuestions(r.questions),
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getQuestionnaireTemplate(id: string): Promise<QuestionnaireTemplateDTO | null> {
  const r = await prisma.questionnaireTemplate.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    questions: parseQuestions(r.questions),
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function createQuestionnaireTemplate(data: QuestionnaireTemplateData): Promise<QuestionnaireTemplateDTO> {
  const r = await prisma.questionnaireTemplate.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      questions: data.questions as object[],
      isActive: data.isActive ?? true,
    },
  });
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    questions: parseQuestions(r.questions),
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function updateQuestionnaireTemplate(
  id: string,
  data: Partial<QuestionnaireTemplateData>,
): Promise<QuestionnaireTemplateDTO> {
  const r = await prisma.questionnaireTemplate.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.questions !== undefined && { questions: data.questions as object[] }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    questions: parseQuestions(r.questions),
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function deleteQuestionnaireTemplate(id: string): Promise<void> {
  await prisma.questionnaireTemplate.delete({ where: { id } });
}

export async function getBookingQuestionnaire(
  bookingId: string,
): Promise<{ template: QuestionnaireTemplateDTO; response: QuestionnaireResponseDTO | null } | null> {
  const activeTemplate = await prisma.questionnaireTemplate.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!activeTemplate) return null;

  const existing = await prisma.questionnaireResponse.findUnique({
    where: { bookingId_templateId: { bookingId, templateId: activeTemplate.id } },
  });

  const template: QuestionnaireTemplateDTO = {
    id: activeTemplate.id,
    title: activeTemplate.title,
    description: activeTemplate.description,
    questions: parseQuestions(activeTemplate.questions),
    isActive: activeTemplate.isActive,
    createdAt: activeTemplate.createdAt,
    updatedAt: activeTemplate.updatedAt,
  };

  return {
    template,
    response: existing
      ? {
          id: existing.id,
          bookingId: existing.bookingId,
          templateId: existing.templateId,
          answers: parseAnswers(existing.answers),
          submittedAt: existing.submittedAt,
          createdAt: existing.createdAt,
        }
      : null,
  };
}

export async function submitQuestionnaireResponse(
  bookingId: string,
  templateId: string,
  answers: Record<string, string | string[]>,
): Promise<QuestionnaireResponseDTO> {
  const r = await prisma.questionnaireResponse.upsert({
    where: { bookingId_templateId: { bookingId, templateId } },
    create: {
      bookingId,
      templateId,
      answers: answers as object,
      submittedAt: new Date(),
    },
    update: {
      answers: answers as object,
      submittedAt: new Date(),
    },
  });
  return {
    id: r.id,
    bookingId: r.bookingId,
    templateId: r.templateId,
    answers: parseAnswers(r.answers),
    submittedAt: r.submittedAt,
    createdAt: r.createdAt,
  };
}
