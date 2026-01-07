/**
 * API ROUTE: Admin Logs Monitoring
 * GET - Get recent logs for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '50');

    let logs = log.getLogs();

    // Filter by level if specified
    if (level && ['error', 'warn', 'info', 'debug'].includes(level)) {
      logs = logs.filter(entry => entry.level === level);
    }

    // Limit results
    logs = logs.slice(-limit);

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    log.error('Error fetching logs:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching logs' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    log.clearLogs();
    return NextResponse.json({
      success: true,
      message: 'Logs cleared',
    });
  } catch (error) {
    log.error('Error clearing logs:', error);
    return NextResponse.json(
      { success: false, error: 'Error clearing logs' },
      { status: 500 }
    );
  }
}
