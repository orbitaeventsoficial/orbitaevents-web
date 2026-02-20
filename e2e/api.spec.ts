import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint should work', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('pass');
  });

  test('public stats endpoint should work', async ({ request }) => {
    const response = await request.get('/api/public/stats');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.stats).toBeDefined();
    expect(data.stats.totalEvents).toBeDefined();
  });

  test('public availability endpoint should work', async ({ request }) => {
    const response = await request.get('/api/public/availability');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeDefined();
  });

  test('google reviews endpoint should work', async ({ request }) => {
    const response = await request.get('/api/google-reviews');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.rating).toBeDefined();
    expect(data.reviews).toBeDefined();
  });

  test('admin endpoints should require authentication', async ({ request }) => {
    const response = await request.get('/api/admin/dashboard');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('admin settings should require authentication', async ({ request }) => {
    const response = await request.get('/api/admin/settings');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('leads-new status endpoint should require authentication', async ({ request }) => {
    const response = await request.patch('/api/admin/leads-new/test-id/status', {
      data: { status: 'QUALIFIED' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('leads-new quote endpoint should require authentication', async ({ request }) => {
    const response = await request.get('/api/admin/leads-new/test-id/quote');
    expect([401, 403]).toContain(response.status());
  });

  test('contact endpoint should reject invalid data', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test',
        // Missing required email
      },
    });

    // Should return 400 or 403 (CSRF)
    expect([400, 403]).toContain(response.status());
  });

  test('client portal with invalid token should be blocked', async ({ request }) => {
    const response = await request.get('/ca/portal/invalid-token-for-e2e', {
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308, 404]).toContain(response.status());
  });
});
