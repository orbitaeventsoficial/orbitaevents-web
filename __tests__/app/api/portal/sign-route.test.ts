import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSignContractOnline } = vi.hoisted(() => ({
  mockSignContractOnline: vi.fn(),
}));

vi.mock('@/lib/services/contractSignatureService', () => ({
  signContractOnline: mockSignContractOnline,
}));

import { POST } from '@/app/api/portal/[token]/sign/route';

function makePostReq(body: Record<string, unknown> | string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/portal/raw-token/sign', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('POST /api/portal/[token]/sign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignContractOnline.mockResolvedValue({ ok: true, proposalId: 'proposal-1' });
  });

  it('rebutja input invàlid sense cridar el servei', async () => {
    const response = await POST(makePostReq({ signedBy: 'x' }), { params: { token: 'raw-token' } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'INVALID_INPUT' });
    expect(mockSignContractOnline).not.toHaveBeenCalled();
  });

  it('signa i passa token, nom net i metadata de xarxa al servei', async () => {
    const response = await POST(
      makePostReq(
        { signedBy: '  Maria Garcia  ', signatureBlob: 'data:image/png;base64,abc123' },
        { 'x-forwarded-for': '203.0.113.10', 'user-agent': 'vitest-agent' },
      ),
      { params: { token: 'raw-token' } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mockSignContractOnline).toHaveBeenCalledWith({
      rawToken: 'raw-token',
      signedBy: 'Maria Garcia',
      ip: '203.0.113.10',
      userAgent: 'vitest-agent',
      signatureBlob: 'data:image/png;base64,abc123',
    });
  });

  it('usa x-real-ip si no hi ha x-forwarded-for', async () => {
    await POST(
      makePostReq({ signedBy: 'Maria Garcia' }, { 'x-real-ip': '198.51.100.7' }),
      { params: { token: 'raw-token' } },
    );

    expect(mockSignContractOnline).toHaveBeenCalledWith(expect.objectContaining({
      ip: '198.51.100.7',
      userAgent: null,
      signatureBlob: null,
    }));
  });

  it('retorna 404 per token invàlid', async () => {
    mockSignContractOnline.mockResolvedValueOnce({ ok: false, reason: 'INVALID_TOKEN' });

    const response = await POST(makePostReq({ signedBy: 'Maria Garcia' }), { params: { token: 'bad-token' } });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'INVALID_TOKEN' });
  });

  it('retorna 409 per contracte no signable o ja signat', async () => {
    mockSignContractOnline.mockResolvedValueOnce({ ok: false, reason: 'NOT_SIGNABLE' });
    const notSignable = await POST(makePostReq({ signedBy: 'Maria Garcia' }), { params: { token: 'raw-token' } });

    mockSignContractOnline.mockResolvedValueOnce({ ok: false, reason: 'ALREADY_SIGNED' });
    const alreadySigned = await POST(makePostReq({ signedBy: 'Maria Garcia' }), { params: { token: 'raw-token' } });

    expect(notSignable.status).toBe(409);
    expect(await notSignable.json()).toEqual({ error: 'NOT_SIGNABLE' });
    expect(alreadySigned.status).toBe(409);
    expect(await alreadySigned.json()).toEqual({ error: 'ALREADY_SIGNED' });
  });

  it('retorna 500 JSON si el servei falla inesperadament', async () => {
    mockSignContractOnline.mockRejectedValueOnce(new Error('DB'));

    const response = await POST(makePostReq({ signedBy: 'Maria Garcia' }), { params: { token: 'raw-token' } });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'SIGNATURE_FAILED' });
  });
});
