import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getTemplate, sendEmail } = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock('@/lib/services/emailTemplateService', () => ({ getTemplate }));
vi.mock('@/lib/email', () => ({ sendEmail }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { sendLeadWelcomeEmail } from '@/lib/services/leadWelcomeEmailService';

beforeEach(() => {
  getTemplate.mockReset();
  sendEmail.mockReset();
});

describe('sendLeadWelcomeEmail', () => {
  it('renderitza la plantilla welcome en el locale i envia', async () => {
    getTemplate.mockResolvedValue({ subject: 'Benvingut/da!', bodyHtml: '<p>Hola Alba</p>' });
    sendEmail.mockResolvedValue({});
    const res = await sendLeadWelcomeEmail({ to: 'alba@x.com', clientName: 'Alba', locale: 'ca' });
    expect(res.ok).toBe(true);
    expect(getTemplate).toHaveBeenCalledWith('welcome', 'ca', { clientName: 'Alba' });
    expect(sendEmail).toHaveBeenCalledWith({ to: 'alba@x.com', subject: 'Benvingut/da!', html: '<p>Hola Alba</p>' });
  });

  it('locale desconegut cau a es', async () => {
    getTemplate.mockResolvedValue({ subject: 's', bodyHtml: 'b' });
    sendEmail.mockResolvedValue({});
    await sendLeadWelcomeEmail({ to: 'x@x.com', clientName: 'X', locale: 'pt' });
    expect(getTemplate).toHaveBeenCalledWith('welcome', 'es', { clientName: 'X' });
  });

  it('sense destinatari no envia', async () => {
    const res = await sendLeadWelcomeEmail({ to: '  ', clientName: 'X' });
    expect(res.ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('si l\'enviament falla, degrada segur (ok:false)', async () => {
    getTemplate.mockResolvedValue({ subject: 's', bodyHtml: 'b' });
    sendEmail.mockRejectedValue(new Error('SMTP down'));
    const res = await sendLeadWelcomeEmail({ to: 'x@x.com', clientName: 'X', locale: 'es' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('SMTP down');
  });
});
