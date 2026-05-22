import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import {
  getQuestionnaireTemplate,
  updateQuestionnaireTemplate,
  deleteQuestionnaireTemplate,
} from '@/lib/services/questionnaireService';

export const dynamic = 'force-dynamic';

const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'textarea', 'select', 'multiselect']),
  label: z.string().min(1),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  questions: z.array(questionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const template = await getQuestionnaireTemplate(params.id);
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const existing = await getQuestionnaireTemplate(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateQuestionnaireTemplate(params.id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const existing = await getQuestionnaireTemplate(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteQuestionnaireTemplate(params.id);
  return NextResponse.json({ ok: true });
}
