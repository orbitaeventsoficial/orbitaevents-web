import { prisma } from '@/lib/prisma';

type FaqTranslationInput = {
  locale: string;
  question: string;
  answer: string;
};

type FaqCreateInput = {
  slug?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  translations?: FaqTranslationInput[];
};

type FaqUpdateInput = {
  slug?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  translations?: FaqTranslationInput[];
};

export async function listAdminFaqs() {
  const faqs = await prisma.fAQ.findMany({
    include: { translations: true },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return { ok: true, faqs };
}

export async function getAdminFaqById(id: string) {
  const faq = await prisma.fAQ.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!faq) {
    return { status: 404, body: { ok: false, error: 'FAQ no trobat' } };
  }

  return { status: 200, body: { ok: true, faq } };
}

export async function createAdminFaq(input: FaqCreateInput) {
  const { slug, category, order, isActive, translations } = input;

  if (!slug || !translations || translations.length === 0) {
    return { status: 400, body: { ok: false, error: 'Slug i traduccions són requerits' } };
  }

  const existing = await prisma.fAQ.findUnique({ where: { slug } });
  if (existing) {
    return { status: 400, body: { ok: false, error: 'Ja existeix una FAQ amb aquest slug' } };
  }

  const faq = await prisma.fAQ.create({
    data: {
      slug,
      category: category || 'general',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      translations: {
        create: translations.map((translation) => ({
          locale: translation.locale,
          question: translation.question,
          answer: translation.answer,
        })),
      },
    },
    include: { translations: true },
  });

  await prisma.adminLog.create({
    data: {
      action: 'CREATE',
      entity: 'faq',
      entityId: faq.id,
      details: { slug: faq.slug },
    },
  });

  return { status: 200, body: { ok: true, faq } };
}

export async function updateAdminFaq(id: string, input: FaqUpdateInput) {
  const updateData: Record<string, unknown> = {};

  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.order !== undefined) updateData.order = input.order;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  if (input.translations && Array.isArray(input.translations)) {
    updateData.translations = {
      deleteMany: {},
      create: input.translations.map((translation) => ({
        locale: translation.locale,
        question: translation.question,
        answer: translation.answer,
      })),
    };
  }

  const faq = await prisma.fAQ.update({
    where: { id },
    data: updateData,
    include: { translations: true },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'faq',
      entityId: faq.id,
      details: { slug: faq.slug },
    },
  });

  return { status: 200, body: { ok: true, faq } };
}

export async function deleteAdminFaq(id?: string | null) {
  if (!id) {
    return { status: 400, body: { ok: false, error: 'ID requerido' } };
  }

  await prisma.fAQ.delete({ where: { id } });
  await prisma.adminLog.create({
    data: {
      action: 'DELETE',
      entity: 'faq',
      entityId: id,
    },
  });

  return { status: 200, body: { ok: true } };
}
