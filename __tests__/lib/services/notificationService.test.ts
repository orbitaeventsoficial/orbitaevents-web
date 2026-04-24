import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
}));

vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/services/notificationRecipientsService', () => ({
  getRecipientsAsString: vi.fn().mockResolvedValue('alerts@orbitaevents.com'),
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { phone: '+34612345678', phoneDisplay: '612 345 678', email: 'info@orbitaevents.com' },
    web: { domain: 'orbitaevents.com' },
  },
}));
vi.mock('@/lib/utils/sanitize', () => ({ escapeHtml: (s: string) => s }));
vi.mock('@/lib/constants', () => ({
  getEventLabel: (t: string) => t === 'WEDDING' ? 'Boda' : t,
  getSourceDisplay: (s: string) => ({ label: s === 'WEBSITE' ? 'Web' : s, icon: '📩' }),
  SOURCE_LABELS: { WEBSITE: 'Web', CONFIGURATOR: 'Configurador' },
  formatDateSimple: () => '15/09/2026',
  formatDate: () => '15 set. 2026',
  formatCurrency: (v: number) => `${v}€`,
}));
vi.mock('@/lib/site', () => ({ absoluteUrl: (p: string) => `https://orbitaevents.com${p}` }));

import { notifyNewLead } from '@/lib/services/notificationService';

const BASE_LEAD = {
  id: 'lead-1',
  name: 'Joan Garcia',
  email: 'joan@example.com',
  phone: '+34699123456',
  eventType: 'WEDDING',
  eventDate: new Date('2026-09-15'),
  guestCount: 120,
  budget: '2000€',
  message: 'Vull DJ per la boda',
  packName: 'Premium',
  estimatedPrice: 1500,
  source: 'WEBSITE',
  createdAt: new Date(),
};

describe('notifyNewLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
    // Reset env vars
    vi.stubEnv('SMTP_HOST', 'smtp.test.com');
    vi.stubEnv('SMTP_USER', 'user@test.com');
  });

  it('envia email amb SMTP configurat', async () => {
    const results = await notifyNewLead(BASE_LEAD);

    const emailResult = results.find(r => r.channel === 'email');
    expect(emailResult).toBeDefined();
    expect(emailResult!.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Joan Garcia'),
        html: expect.stringContaining('Joan Garcia'),
      }),
    );
  });

  it('inclou replyTo si email és real (no temp)', async () => {
    await notifyNewLead(BASE_LEAD);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'joan@example.com',
      }),
    );
  });

  it('no inclou replyTo per emails temporals', async () => {
    await notifyNewLead({
      ...BASE_LEAD,
      email: 'temp-12345@leads.orbitaevents.local',
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: undefined,
      }),
    );
  });

  it('retorna error email si SMTP no configurat', async () => {
    vi.stubEnv('SMTP_HOST', '');
    vi.stubEnv('SMTP_USER', '');

    const results = await notifyNewLead(BASE_LEAD);

    const emailResult = results.find(r => r.channel === 'email');
    expect(emailResult!.success).toBe(false);
    expect(emailResult!.error).toContain('SMTP');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('retorna error email si sendEmail falla', async () => {
    mockSendEmail.mockRejectedValue(new Error('SMTP timeout'));

    const results = await notifyNewLead(BASE_LEAD);

    const emailResult = results.find(r => r.channel === 'email');
    expect(emailResult!.success).toBe(false);
    expect(emailResult!.error).toContain('SMTP timeout');
  });

  it('intenta WhatsApp si email falla', async () => {
    mockSendEmail.mockRejectedValue(new Error('fail'));

    const results = await notifyNewLead(BASE_LEAD);

    // Hauria de tenir 2 resultats: email (fail) + whatsapp (fail perquè no està configurat)
    expect(results.length).toBe(2);
    expect(results[0].channel).toBe('email');
    expect(results[0].success).toBe(false);
    expect(results[1].channel).toBe('whatsapp');
  });

  it('no intenta WhatsApp si email OK i ALWAYS_SEND_WHATSAPP no actiu', async () => {
    vi.stubEnv('ALWAYS_SEND_WHATSAPP', '');

    const results = await notifyNewLead(BASE_LEAD);

    expect(results.length).toBe(1);
    expect(results[0].channel).toBe('email');
    expect(results[0].success).toBe(true);
  });

  it('envia WhatsApp si ALWAYS_SEND_WHATSAPP=true', async () => {
    vi.stubEnv('ALWAYS_SEND_WHATSAPP', 'true');

    const results = await notifyNewLead(BASE_LEAD);

    expect(results.length).toBe(2);
    expect(results[1].channel).toBe('whatsapp');
  });

  it('envia webhook si LEAD_WEBHOOK_URL configurat', async () => {
    vi.stubEnv('LEAD_WEBHOOK_URL', 'https://hooks.example.com/lead');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const results = await notifyNewLead(BASE_LEAD);

    const webhookResult = results.find(r => r.channel === 'webhook');
    expect(webhookResult).toBeDefined();
    expect(webhookResult!.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://hooks.example.com/lead',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('lead.created'),
      }),
    );

    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('inclou X-Webhook-Secret si configurat', async () => {
    vi.stubEnv('LEAD_WEBHOOK_URL', 'https://hooks.example.com/lead');
    vi.stubEnv('LEAD_WEBHOOK_SECRET', 'my-secret-123');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await notifyNewLead(BASE_LEAD);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Webhook-Secret': 'my-secret-123',
        }),
      }),
    );

    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('gestiona error webhook sense petar', async () => {
    vi.stubEnv('LEAD_WEBHOOK_URL', 'https://hooks.example.com/lead');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Server Error', { status: 500 })
    );

    const results = await notifyNewLead(BASE_LEAD);

    const webhookResult = results.find(r => r.channel === 'webhook');
    expect(webhookResult!.success).toBe(false);
    expect(webhookResult!.error).toContain('500');

    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('subject inclou preu estimat si disponible', async () => {
    await notifyNewLead(BASE_LEAD);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('1500€'),
      }),
    );
  });

  it('subject sense preu si no disponible', async () => {
    await notifyNewLead({ ...BASE_LEAD, estimatedPrice: null });

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).not.toContain('null');
    expect(call.subject).toContain('Joan Garcia');
  });

  it('email HTML inclou pack i missatge', async () => {
    await notifyNewLead(BASE_LEAD);

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain('Premium'); // packName
    expect(call.html).toContain('Vull DJ per la boda'); // message
    expect(call.html).toContain('admin/leads/lead-1'); // admin link
  });
});
