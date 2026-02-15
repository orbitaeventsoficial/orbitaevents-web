import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { z } from 'zod';

const createTaskSchema = z.object({
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  bookingId: z.string().optional(),
  proposalId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(Number(searchParams.get('limit') || '25'), 100);
    const page = Math.max(Number(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    const where = {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
    };

    const prismaAny = prisma as any;
    const [tasks, total] = await Promise.all([
      prismaAny.task.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prismaAny.task.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      tasks,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    log.error('Error obtenint tasques universals', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint tasques' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const prismaAny = prisma as any;
    const task = await prismaAny.task.create({
      data: {
        customerId: data.customerId || null,
        leadId: data.leadId || null,
        bookingId: data.bookingId || null,
        proposalId: data.proposalId || null,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'OPEN',
        priority: data.priority || 'MEDIUM',
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy || 'Admin',
        completedAt: data.status === 'DONE' ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    log.error('Error creant tasca universal', error);
    return NextResponse.json({ ok: false, error: 'Error creant tasca' }, { status: 500 });
  }
}

