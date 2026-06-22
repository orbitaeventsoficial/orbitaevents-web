import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { createAdminBlogPost, deleteAdminBlogPost, listAdminBlogPosts, updateAdminBlogPost } from '@/lib/services/blogAdminService';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

    const result = await listAdminBlogPosts({
      id: searchParams.get('id'),
      locale: searchParams.get('locale') || 'es',
      page,
      limit,
      category: searchParams.get('category'),
      published: searchParams.get('published'),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Failed to list blog posts', error);
    return NextResponse.json(
      { error: 'Failed to list blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;
    const csrfError = verifyCsrf(req);
    if (csrfError) return csrfError;

    const body = await req.json();
    const result = await createAdminBlogPost(body ?? {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Failed to create blog post', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;
    const csrfError = verifyCsrf(req);
    if (csrfError) return csrfError;

    const body = await req.json();
    const result = await updateAdminBlogPost(body ?? {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Failed to update blog post', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;
    const csrfError = verifyCsrf(req);
    if (csrfError) return csrfError;

    const { searchParams } = new URL(req.url);
    const result = await deleteAdminBlogPost(searchParams.get('id'));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Failed to delete blog post', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
