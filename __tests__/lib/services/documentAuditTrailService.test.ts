import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockLogWarn } = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: {
      create: vi.fn(),
    },
  },
  mockLogWarn: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { warn: mockLogWarn } }));

import {
  DOCUMENT_ADMIN_LOG_ACTIONS,
  recordDocumentAdminLog,
} from '@/lib/services/documentAuditTrailService';

describe('recordDocumentAdminLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.adminLog.create.mockResolvedValue({});
  });

  it('registra una traca documental amb entity per defecte i details normalitzats', async () => {
    await recordDocumentAdminLog({
      action: DOCUMENT_ADMIN_LOG_ACTIONS.PROPOSAL_SENT,
      entityId: 'proposal-1',
      userId: 'user-1',
      details: {
        leadId: 'lead-1',
        nested: { ok: true },
        missing: undefined,
      },
    });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        action: 'DOCUMENT_PROPOSAL_SENT',
        entity: 'proposal',
        entityId: 'proposal-1',
        userId: 'user-1',
        details: {
          leadId: 'lead-1',
          nested: { ok: true },
        },
      },
    });
  });

  it('no bloqueja el flux si adminLog falla', async () => {
    mockPrisma.adminLog.create.mockRejectedValueOnce(new Error('db down'));

    await expect(recordDocumentAdminLog({
      action: DOCUMENT_ADMIN_LOG_ACTIONS.DOSSIER_SENT,
      entity: 'dossier',
      entityId: 'dossier-1',
    })).resolves.toBeUndefined();

    expect(mockLogWarn).toHaveBeenCalledWith(
      'No s ha pogut registrar traca documental adminLog',
      expect.objectContaining({
        action: 'DOCUMENT_DOSSIER_SENT',
        entity: 'dossier',
        entityId: 'dossier-1',
        error: 'db down',
      }),
    );
  });
});
