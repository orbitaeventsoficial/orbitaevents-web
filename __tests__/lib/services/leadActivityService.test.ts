import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    leadActivity: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listLeadActivities,
  createLeadActivity,
  cleanupDuplicateLeadActivities,
  deleteLeadActivity,
  recordLeadContractCancelled,
  recordLeadContractSent,
  recordLeadCommercialSequenceStepSent,
  recordLeadDocumentAdded,
  recordLeadDocumentDeleted,
  recordLeadEmailSent,
  recordLeadCreatedFromInbox,
  recordLeadNoteAdded,
  recordLeadQuoteSent,
  recordLeadQuoteGenerated,
  recordLeadScoreSnapshot,
  recordLeadSlaTaskCreated,
  recordLeadLost,
  recordLeadStatusChanged,
  recordLeadTechnicalSnapshotSaved,
  recordLeadTechnicalSnapshotSent,
  recordLeadTaskCreated,
  recordLeadTaskDeleted,
  recordLeadTaskUpdated,
  recordLeadUpdatedFromInbox,
} from '@/lib/services/leadActivityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.leadActivity.findMany.mockResolvedValue([]);
  mockPrisma.leadActivity.create.mockResolvedValue({
    id: 'act-1',
    leadId: 'lead-1',
    type: 'SYSTEM',
    title: 'Test',
    description: null,
    createdBy: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    metadata: null,
  });
  mockPrisma.leadActivity.findFirst.mockResolvedValue({ id: 'act-1' });
  mockPrisma.leadActivity.delete.mockResolvedValue({});
  mockPrisma.leadActivity.deleteMany.mockResolvedValue({ count: 0 });
});

describe('listLeadActivities', () => {
  it('retorna activitats', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', leadId: 'lead-1', type: 'SYSTEM', title: 'A', description: null, createdBy: null, createdAt: new Date('2026-01-01T10:00:00Z'), metadata: null },
      { id: 'a2', leadId: 'lead-1', type: 'NOTE', title: 'B', description: null, createdBy: null, createdAt: new Date('2026-01-02T10:00:00Z'), metadata: null },
    ]);
    const result = await listLeadActivities('lead-1');
    expect(result.ok).toBe(true);
    expect(result.activities).toHaveLength(2);
  });
});

describe('createLeadActivity', () => {
  it('crea activitat amb type per defecte SYSTEM', async () => {
    const result = await createLeadActivity('lead-1', { title: 'Test' });
    expect(result.ok).toBe(true);
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Test',
      }),
    });
  });

  it('usa type personalitzat', async () => {
    await createLeadActivity('lead-1', { type: 'CALL', title: 'Trucada' });
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'CALL' }),
    });
  });
});

describe('recordLeadEmailSent', () => {
  it('crea activitat shared per email enviat', async () => {
    await recordLeadEmailSent({
      leadId: 'lead-1',
      subject: 'Seguiment comercial',
      hasAttachments: true,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'EMAIL',
        title: 'Email enviat',
        description: 'Seguiment comercial (amb pressupost)',
        createdBy: 'Admin',
      },
    });
  });
});

describe('recordLeadQuoteSent', () => {
  it('crea activitat shared per pressupost enviat', async () => {
    await recordLeadQuoteSent({
      leadId: 'lead-1',
      quoteNumber: 'ORB-2026-100',
      to: 'client@test.com',
      total: 1815,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'EMAIL',
        title: 'Pressupost enviat',
        description: 'Pressupost ORB-2026-100',
        metadata: {
          quoteNumber: 'ORB-2026-100',
          to: 'client@test.com',
          total: 1815,
          source: 'email_quote_route',
        },
        createdBy: 'Admin',
      },
    });
  });
});

describe('recordLeadQuoteGenerated', () => {
  it('crea activitat shared per pressupost generat', async () => {
    await recordLeadQuoteGenerated({
      leadId: 'lead-1',
      quoteNumber: 'ORB-2026-100',
      total: 1815,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'DOCUMENT',
        title: 'Pressupost generat',
        description: 'Pressupost ORB-2026-100',
        metadata: {
          quoteNumber: 'ORB-2026-100',
          total: 1815,
          source: 'lead_quote_route',
        },
        createdBy: 'Sistema',
      },
    });
  });
});

describe('recordLeadScoreSnapshot', () => {
  it('crea activitat shared per snapshot de scoring', async () => {
    await recordLeadScoreSnapshot({
      leadId: 'lead-1',
      score: 75,
      band: 'HOT',
      probability: 0.65,
      weightedAmount: 1300,
      reasons: ['Event proper', 'Pressupost alt'],
      riskFlags: [],
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Scoring snapshot',
        description: 'Score 75 (HOT) · Prob 65.0% · Weighted 1300.00€',
        createdBy: 'Scoring Bot',
        metadata: {
          score: 75,
          band: 'HOT',
          probability: 0.65,
          weightedAmount: 1300,
          reasons: ['Event proper', 'Pressupost alt'],
          riskFlags: [],
        },
      },
    });
  });
});

describe('recordLeadSlaTaskCreated', () => {
  it('crea activitat shared per tasca automàtica SLA', async () => {
    await recordLeadSlaTaskCreated({
      leadId: 'lead-1',
      slaHours: 24,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'TASK',
        title: 'SLA incomplert: tasca automàtica creada',
        description: 'Es crea tasca automàtica en superar 24h en estat NEW.',
        createdBy: 'SLA Bot',
        metadata: { slaHours: 24 },
      },
    });
  });
});

describe('recordLeadStatusChanged', () => {
  it('crea activitat shared per canvi d estat', async () => {
    await recordLeadStatusChanged({
      leadId: 'lead-1',
      fromStatus: 'NEW',
      toStatus: 'CONTACTED',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'STATUS_CHANGE',
        title: "Canvi d'estat",
        description: 'NEW → CONTACTED',
      },
    });
  });
});

describe('recordLeadLost', () => {
  it('crea activitat shared per lead perdut amb metadata canònica', async () => {
    await recordLeadLost({
      leadId: 'lead-1',
      fromStatus: 'NEGOTIATING',
      reason: 'PRICE_TOO_HIGH',
      description: 'Preu massa alt — Pressupost 2k sobre 1.5k',
      note: 'Pressupost 2k sobre 1.5k',
      actor: 'admin@orbita',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'STATUS_CHANGE',
        title: 'Lead perdut',
        description: 'Preu massa alt — Pressupost 2k sobre 1.5k',
        metadata: {
          fromStatus: 'NEGOTIATING',
          toStatus: 'LOST',
          reason: 'PRICE_TOO_HIGH',
          note: 'Pressupost 2k sobre 1.5k',
        },
        createdBy: 'admin@orbita',
      },
    });
  });
});

describe('recordLeadTechnicalSnapshotSaved', () => {
  it('crea activitat shared per instantania tecnica desada', async () => {
    await recordLeadTechnicalSnapshotSaved({
      leadId: 'lead-1',
      title: 'Snapshot tècnic 2026-03-18 12:00',
      documentId: 'doc-1',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'DOCUMENT',
        title: 'Instantània tècnica desada',
        description: 'Snapshot tècnic 2026-03-18 12:00',
        metadata: { documentId: 'doc-1' },
        createdBy: 'Sistema',
      },
    });
  });
});

describe('recordLeadTechnicalSnapshotSent', () => {
  it('crea activitat shared per instantania tecnica enviada', async () => {
    await recordLeadTechnicalSnapshotSent({
      leadId: 'lead-1',
      recipient: 'admin@test.com',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'EMAIL',
        title: 'Instantània tècnica enviada',
        description: 'Enviat a admin@test.com',
        metadata: { recipient: 'admin@test.com', kind: 'technical_snapshot' },
        createdBy: 'Sistema',
      },
    });
  });
});

describe('recordLeadContractSent', () => {
  it('crea activitat shared per contracte enviat', async () => {
    await recordLeadContractSent({
      leadId: 'lead-1',
      contractReference: 'CTR-2026-AB12',
      to: 'client@test.com',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'DOCUMENT',
        title: 'Contracte enviat',
        description: 'Contracte CTR-2026-AB12 enviat per email a client@test.com',
      },
    });
  });
});

describe('recordLeadContractCancelled', () => {
  it('crea activitat shared per contracte cancel·lat', async () => {
    await recordLeadContractCancelled({
      leadId: 'lead-1',
      contractReference: 'CTR-2026-AB12',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Contracte cancel·lat',
        description: 'Contracte CTR-2026-AB12 cancel·lat',
      },
    });
  });
});

describe('recordLeadDocumentAdded', () => {
  it('crea activitat shared per document afegit', async () => {
    await recordLeadDocumentAdded({
      leadId: 'lead-1',
      documentId: 'doc-1',
      documentType: 'FILE',
      title: 'Pressupost PDF',
      createdBy: 'Admin',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'DOCUMENT',
        title: 'Document afegit',
        description: 'Pressupost PDF',
        metadata: { documentId: 'doc-1', type: 'FILE' },
        createdBy: 'Admin',
      },
    });
  });
});

describe('recordLeadDocumentDeleted', () => {
  it('crea activitat shared per document eliminat', async () => {
    await recordLeadDocumentDeleted({
      leadId: 'lead-1',
      documentId: 'doc-1',
      title: 'Pressupost PDF',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'DOCUMENT',
        title: 'Document eliminat',
        description: 'Pressupost PDF',
        metadata: { documentId: 'doc-1' },
        createdBy: 'Admin',
      },
    });
  });
});

describe('recordLeadTaskCreated', () => {
  it('crea activitat shared per tasca creada', async () => {
    await recordLeadTaskCreated({
      leadId: 'lead-1',
      taskId: 'task-1',
      title: 'Preparar proposta',
      status: 'OPEN',
      priority: 'HIGH',
      createdBy: 'Admin',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'TASK',
        title: 'Tasca creada',
        description: 'Preparar proposta',
        metadata: { taskId: 'task-1', status: 'OPEN', priority: 'HIGH' },
        createdBy: 'Admin',
      },
    });
  });
});

describe('recordLeadTaskUpdated', () => {
  it('crea activitat shared per tasca actualitzada', async () => {
    await recordLeadTaskUpdated({
      leadId: 'lead-1',
      taskId: 'task-1',
      title: 'Preparar proposta',
      status: 'DONE',
      priority: 'URGENT',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'TASK',
        title: 'Tasca actualitzada',
        description: 'Preparar proposta',
        metadata: { taskId: 'task-1', status: 'DONE', priority: 'URGENT' },
      },
    });
  });
});

describe('recordLeadTaskDeleted', () => {
  it('crea activitat shared per tasca eliminada', async () => {
    await recordLeadTaskDeleted({
      leadId: 'lead-1',
      taskId: 'task-1',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'TASK',
        title: 'Tasca eliminada',
        metadata: { taskId: 'task-1' },
      },
    });
  });
});

describe('recordLeadNoteAdded', () => {
  it('crea activitat shared per nota afegida', async () => {
    await recordLeadNoteAdded({
      leadId: 'lead-1',
      content: 'Nota interna important',
      createdBy: 'Admin',
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'NOTE',
        title: 'Nota afegida',
        description: 'Nota interna important',
        createdBy: 'Admin',
      },
    });
  });
});

describe('recordLeadUpdatedFromInbox', () => {
  it('crea activitat shared per lead actualitzat des de inbox', async () => {
    await recordLeadUpdatedFromInbox({
      leadId: 'lead-1',
      senderAddress: 'client@example.com',
      uid: 100,
      subject: 'Consulta boda setembre',
      usedFallback: false,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Lead actualitzat des d’Inbox',
        description: 'Importació automàtica des d’email client@example.com',
        createdBy: 'Admin Inbox',
        metadata: {
          uid: 100,
          subject: 'Consulta boda setembre',
          usedFallback: false,
        },
      },
    });
  });
});

describe('recordLeadCreatedFromInbox', () => {
  it('crea activitat shared per lead creat des de inbox', async () => {
    await recordLeadCreatedFromInbox({
      leadId: 'lead-1',
      senderAddress: 'client@example.com',
      uid: 100,
      subject: 'Consulta boda setembre',
      usedFallback: true,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Lead creat des d’Inbox',
        description: 'Importació automàtica des d’email client@example.com',
        createdBy: 'Admin Inbox',
        metadata: {
          uid: 100,
          subject: 'Consulta boda setembre',
          usedFallback: true,
        },
      },
    });
  });
});

describe('recordLeadCommercialSequenceStepSent', () => {
  it('crea activitat shared per un pas de nurturing comercial', async () => {
    await recordLeadCommercialSequenceStepSent({
      leadId: 'lead-1',
      channel: 'email',
      activityTitle: 'Seguiment comercial enviat',
      step: 2,
      totalSteps: 5,
      templateSlug: 'follow-up-2',
      locale: 'ca',
      delayHours: 72,
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        type: 'EMAIL',
        title: 'Seguiment comercial enviat',
        description: 'Pas 2/5 (follow-up-2) · canal email',
        createdBy: 'Sequence Bot',
        metadata: {
          step: 2,
          totalSteps: 5,
          templateSlug: 'follow-up-2',
          channel: 'email',
          locale: 'ca',
          delayHours: 72,
        },
      },
    });
  });
});

describe('cleanupDuplicateLeadActivities', () => {
  it('no elimina si no hi ha duplicats', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', title: 'A', description: null, createdBy: 'Admin', metadata: null },
      { id: 'a2', title: 'B', description: null, createdBy: 'Admin', metadata: null },
    ]);

    const result = await cleanupDuplicateLeadActivities('lead-1');
    expect(result.deleted).toBe(0);
  });

  it('elimina duplicats per title+description+createdBy', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', title: 'Same', description: 'desc', createdBy: 'Bot', metadata: null },
      { id: 'a2', title: 'Same', description: 'desc', createdBy: 'Bot', metadata: null },
    ]);

    const result = await cleanupDuplicateLeadActivities('lead-1');
    expect(result.deleted).toBe(1);
  });

  it('considera UID de metadata per deduplicació', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', title: 'Import', description: 'same', createdBy: 'Bot', metadata: { uid: 42 } },
      { id: 'a2', title: 'Import', description: 'same', createdBy: 'Bot', metadata: { uid: 42 } },
    ]);

    const result = await cleanupDuplicateLeadActivities('lead-1');
    expect(result.deleted).toBe(1);
  });
});

describe('deleteLeadActivity', () => {
  it('elimina activitat i retorna 200', async () => {
    const result = await deleteLeadActivity('lead-1', 'act-1');
    expect(result.status).toBe(200);
  });

  it('retorna 404 si no existeix', async () => {
    mockPrisma.leadActivity.findFirst.mockResolvedValue(null);
    const result = await deleteLeadActivity('lead-1', 'inexistent');
    expect(result.status).toBe(404);
  });
});
