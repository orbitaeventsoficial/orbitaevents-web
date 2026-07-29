import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import {
  createSocialPost,
  listSocialPosts,
  getSocialCalendar,
  getSocialPostCounts,
} from '@/lib/services/socialPostService';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_POST_STATUSES,
  SOCIAL_CONTENT_TYPES,
  SOCIAL_CATEGORIES,
  SOCIAL_POST_ORIGIN_TYPES,
} from '@/lib/constants';

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

const createSchema = z.object({
  title: z.string().min(1).max(200),
  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(platformEnum).min(1),
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

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');

    // KPI counts
    if (view === 'counts') {
      const counts = await getSocialPostCounts();
      return NextResponse.json({ ok: true, counts });
    }

    // Vista calendari (agrupat per dia)
    if (view === 'calendar') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      if (!from || !to) {
        return NextResponse.json(
          { ok: false, error: 'Calendari requereix from i to' },
          { status: 400 }
        );
      }
      const calendar = await getSocialCalendar({
        from: new Date(from),
        to: new Date(to),
      });
      return NextResponse.json({ ok: true, calendar });
    }

    // Llista plana amb filtres
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const posts = await listSocialPosts({
      status: (searchParams.get('status') as never) || null,
      platform: (searchParams.get('platform') as never) || null,
      category: (searchParams.get('category') as never) || null,
      bookingId: searchParams.get('bookingId') || null,
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null,
    });

    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    log.error('Error obtenint social posts', error);
    return NextResponse.json(
      { ok: false, error: 'Error obtenint social posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const post = await createSocialPost(parsed.data as never);
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creant social post';
    log.error('Error creant social post', error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
