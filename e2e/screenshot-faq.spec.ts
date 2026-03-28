import { test, devices } from '@playwright/test';

const BASE = 'http://localhost:3001/ca';

test.use({ ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } });

test('homepage sections polish - desktop', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

  // Close cookie banner if present
  const acceptBtn = page.locator('button:has-text("Acceptar-ho tot")');
  if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }

  // Hero
  await page.screenshot({ path: 'e2e/screenshots/01-hero.png', fullPage: false });

  // Scroll through sections
  const sections = [
    { sel: '[data-section-id="services"]', name: '02-services' },
    { sel: '[data-section-id="stats"]', name: '03-stats' },
    { sel: '[data-section-id="calendar"]', name: '04-calendar' },
    { sel: '[data-section-id="portfolio"]', name: '05-portfolio' },
    { sel: '[data-section-id="process"]', name: '06-process' },
    { sel: '[data-section-id="reviews"]', name: '07-reviews' },
    { sel: '[data-section-id="garantia"]', name: '08-garantia' },
    { sel: '[data-section-id="faq"]', name: '09-faq' },
    { sel: '[data-section-id="cta"]', name: '10-cta-final' },
    { sel: '#footer', name: '11-footer' },
  ];

  for (const { sel, name } of sections) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, sel);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: false });
  }
});
