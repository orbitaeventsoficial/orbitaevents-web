import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { getAdminDashboardApiData } from '@/lib/services/adminDashboardApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json(await getAdminDashboardApiData(searchParams.get('locale')));
  } catch (error) {
    return handleApiError(error, {
      context: 'Fetching dashboard stats',
      userMessage: 'Error carregant les estadístiques del panell',
    });
  }
}
