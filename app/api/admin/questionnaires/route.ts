import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import {
  listQuestionnaireTemplates,
  createQuestionnaireTemplate,
} from '@/lib/services/questionnaireService';

export const dynamic = 'force-dynamic';

const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'textarea', 'select', 'multiselect']),
  label: z.string().min(1),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  questions: z.array(questionSchema).min(1),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const templates = await listQuestionnaireTemplates();
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const template = await createQuestionnaireTemplate(parsed.data);
  return NextResponse.json(template, { status: 201 });
}
