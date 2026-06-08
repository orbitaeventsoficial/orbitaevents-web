import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listCollaboratorMembers,
  createCollaboratorMember,
  updateCollaboratorMember,
  deleteCollaboratorMember,
} from '@/lib/services/collaboratorMemberService';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    collaboratorMember: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCollaboratorMember', () => {
  it('rebutja nom buit (400)', async () => {
    const r = await createCollaboratorMember('c1', { name: '  ' });
    expect(r.status).toBe(400);
    expect(mockPrisma.collaboratorMember.create).not.toHaveBeenCalled();
  });

  it('rebutja rol invàlid (400)', async () => {
    const r = await createCollaboratorMember('c1', { name: 'Jonathan', role: 'WIZARD' });
    expect(r.status).toBe(400);
  });

  it('crea amb rol normalitzat i defaults', async () => {
    mockPrisma.collaboratorMember.create.mockResolvedValue({ id: 'm1' });
    const r = await createCollaboratorMember('c1', { name: 'Carlos Lucas', role: 'BOSS' });
    expect(r.status).toBe(201);
    expect(mockPrisma.collaboratorMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ collaboratorId: 'c1', name: 'Carlos Lucas', role: 'BOSS' }) })
    );
  });

  it('rol absent → OTHER', async () => {
    mockPrisma.collaboratorMember.create.mockResolvedValue({ id: 'm2' });
    await createCollaboratorMember('c1', { name: 'X' });
    expect(mockPrisma.collaboratorMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'OTHER' }) })
    );
  });
});

describe('updateCollaboratorMember', () => {
  it('actualitza isActive', async () => {
    mockPrisma.collaboratorMember.update.mockResolvedValue({ id: 'm1', isActive: false });
    const r = await updateCollaboratorMember('m1', { isActive: false });
    expect(r.status).toBe(200);
    expect(mockPrisma.collaboratorMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'm1' }, data: expect.objectContaining({ isActive: false }) })
    );
  });
});

describe('listCollaboratorMembers / delete', () => {
  it('llista per col·laborador', async () => {
    mockPrisma.collaboratorMember.findMany.mockResolvedValue([{ id: 'm1' }]);
    const r = await listCollaboratorMembers('c1');
    expect(r.status).toBe(200);
    expect(r.body.members).toHaveLength(1);
  });

  it('elimina', async () => {
    mockPrisma.collaboratorMember.delete.mockResolvedValue({});
    const r = await deleteCollaboratorMember('m1');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
  });
});
