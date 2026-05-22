import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findPortalAccessByRawToken } from '@/lib/services/clientPortalAccess';
import { getBookingQuestionnaire, submitQuestionnaireResponse } from '@/lib/services/questionnaireService';

export const dynamic = 'force-dynamic';

const SubmitSchema = z.object({
  answers: z.record(z.union([z.string(), z.array(z.string())])),
});

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const access = await findPortalAccessByRawToken(params.token);
  if (!access) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const data = await getBookingQuestionnaire(access.booking.id);
  if (!data) return NextResponse.json({ template: null, response: null });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const access = await findPortalAccessByRawToken(params.token);
  if (!access) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT', issues: parsed.error.issues }, { status: 400 });
  }

  const questionnaire = await getBookingQuestionnaire(access.booking.id);
  if (!questionnaire) {
    return NextResponse.json({ error: 'NO_TEMPLATE' }, { status: 404 });
  }

  const response = await submitQuestionnaireResponse(
    access.booking.id,
    questionnaire.template.id,
    parsed.data.answers,
  );
  return NextResponse.json(response, { status: 201 });
}
