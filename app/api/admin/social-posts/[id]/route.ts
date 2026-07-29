import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import {
  getSocialPost,
  updateSocialPost,
  deleteSocialPost,
} from '@/lib/services/socialPostService';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_POST_STATUSES,
  SOCIAL_CONTENT_TYPES,
  SOCIAL_CATEGORIES,
  SOCIAL_POST_ORIGIN_TYPES,
} from '@/lib/constants';

interface Params {
  params: { id: string };
}

const platformEnum = z.enum(
  Object.values(SOCIAL_PLATFORMS) as [string, ...string[]]
);
const statusEnum = z.enum(
  Object.values(SOCIAL_POST_STATUSES) as [string, ...string[]]
);
const contentTypeEnum = z.enum(
  Object.values(SOCIAL_CONTENT_TYPES) as [string, ...string[]]
);
const categoryEnum = z.enum(
  Object.values(SOCIAL_CATEGORIES) as [string, ...string[]]
);
const originTypeEnum = z.enum(
  Object.values(SOCIAL_POST_ORIGIN_TYPES) as [string, ...string[]]
);

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(platformEnum).min(1).optional(),
  status: statusEnum.optional(),
  contentType: contentTypeEnum.optional(),
  category: categoryEnum.nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  mediaUrls: z.array(z.string()).optional(),
  bookingId: z.string().nullable().optional(),
  originType: originTypeEnum.nullable().optional(),
  originId: z.string().nullable().optional(),
  originLabel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const post = await getSocialPost(params.id);
    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Social post no trobat' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    log.error('Error obtenint social post', error, { context: { id: params.id } });
    return NextResponse.json(
      { ok: false, error: 'Error obtenint social post' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const post = await updateSocialPost(params.id, parsed.data as never);
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualitzant social post';
    log.error('Error actualitzant social post', error, { context: { id: params.id } });
    const status = message.includes('no trobat') ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    await deleteSocialPost(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant social post', error, { context: { id: params.id } });
    return NextResponse.json(
      { ok: false, error: 'Error eliminant social post' },
      { status: 500 }
    );
  }
}
