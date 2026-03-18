import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockUploadFile, mockDeleteFile } = vi.hoisted(() => ({
  mockPrisma: {
    leadDocument: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    leadActivity: { create: vi.fn() },
  },
  mockUploadFile: vi.fn(),
  mockDeleteFile: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/storage', () => ({
  uploadFile: mockUploadFile,
  deleteFile: mockDeleteFile,
}));

import {
  listLeadDocuments,
  uploadLeadDocument,
  deleteLeadDocument,
} from '@/lib/services/leadDocumentService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.leadDocument.findMany.mockResolvedValue([]);
  mockPrisma.leadDocument.findFirst.mockResolvedValue(null);
  mockPrisma.leadDocument.create.mockResolvedValue({ id: 'doc1', title: 'Test' });
  mockPrisma.leadDocument.delete.mockResolvedValue({});
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockUploadFile.mockResolvedValue({ publicUrl: '/api/uploads/test.pdf', path: 'leads/l1/documents/test.pdf' });
  mockDeleteFile.mockResolvedValue(undefined);
});

describe('listLeadDocuments', () => {
  it('retorna documents del lead', async () => {
    mockPrisma.leadDocument.findMany.mockResolvedValue([{ id: 'doc1' }]);

    const result = await listLeadDocuments('l1');

    expect(result.ok).toBe(true);
    expect(result.documents).toHaveLength(1);
    expect(mockPrisma.leadDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { leadId: 'l1' } })
    );
  });
});

describe('uploadLeadDocument', () => {
  function makeBlobFile(name = 'test.pdf', type = 'application/pdf', sizeBytes = 1024) {
    const blob = new Blob([new Uint8Array(sizeBytes)], { type });
    return new File([blob], name, { type });
  }

  function makeFormData(overrides: Record<string, unknown> = {}) {
    const file = overrides.file !== undefined
      ? overrides.file
      : makeBlobFile();
    const fd = new FormData();
    if (file) fd.set('file', file as Blob);
    fd.set('title', String(overrides.title ?? 'Document Test'));
    fd.set('type', String(overrides.type ?? 'FILE'));
    return fd;
  }

  it('retorna 400 sense fitxer', async () => {
    const fd = new FormData();
    fd.set('title', 'Test');

    const result = await uploadLeadDocument('l1', fd);

    expect(result.status).toBe(400);
  });

  it('retorna 400 sense títol', async () => {
    const fd = makeFormData({ title: '' });

    const result = await uploadLeadDocument('l1', fd);

    expect(result.status).toBe(400);
  });

  it('retorna 400 amb tipus document invàlid', async () => {
    const fd = makeFormData({ type: 'HACKED' });

    const result = await uploadLeadDocument('l1', fd);

    expect(result.status).toBe(400);
  });

  it('retorna 400 amb mime type no permès', async () => {
    const file = makeBlobFile('test.exe', 'application/x-msdownload');
    const fd = makeFormData({ file });

    const result = await uploadLeadDocument('l1', fd);

    expect(result.status).toBe(400);
  });

  it('puja document correctament', async () => {
    const fd = makeFormData();
    // jsdom File doesn't have arrayBuffer — polyfill
    const origGet = fd.get.bind(fd);
    vi.spyOn(fd, 'get').mockImplementation((key: string) => {
      if (key === 'file') {
        return {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 1024,
          arrayBuffer: async () => new ArrayBuffer(1024),
        } as unknown as File;
      }
      return origGet(key);
    });

    const result = await uploadLeadDocument('l1', fd);

    expect(result.status).toBe(200);
    expect(mockUploadFile).toHaveBeenCalled();
    expect(mockPrisma.leadDocument.create).toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).toHaveBeenCalled();
  });
});

describe('deleteLeadDocument', () => {
  it('retorna 404 si document no existeix', async () => {
    const result = await deleteLeadDocument('l1', 'doc-inexistent');

    expect(result.status).toBe(404);
  });

  it('elimina document i fitxer', async () => {
    mockPrisma.leadDocument.findFirst.mockResolvedValue({
      id: 'doc1',
      leadId: 'l1',
      title: 'Test',
      filePath: 'leads/l1/documents/test.pdf',
    });

    const result = await deleteLeadDocument('l1', 'doc1');

    expect(result.status).toBe(200);
    expect(mockDeleteFile).toHaveBeenCalledWith('leads/l1/documents/test.pdf');
    expect(mockPrisma.leadDocument.delete).toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).toHaveBeenCalled();
  });

  it('elimina document sense filePath', async () => {
    mockPrisma.leadDocument.findFirst.mockResolvedValue({
      id: 'doc1',
      leadId: 'l1',
      title: 'Test',
      filePath: null,
    });

    const result = await deleteLeadDocument('l1', 'doc1');

    expect(result.status).toBe(200);
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });
});
