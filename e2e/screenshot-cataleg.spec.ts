import { test } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

test.describe('captura catàleg complet', () => {
  test.use({ extraHTTPHeaders: authHeaders() });

  test('visor Studio — pestanya Catàleg de serveis', async ({ page }) => {
    await page.goto('/admin/studio', { waitUntil: 'networkidle' });

    // Scroll a la secció PDFs i clica la pestanya catàleg
    await page.evaluate(() => {
      document.getElementById('sec-pdfs')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(800);

    const catalegTab = page.locator('#sec-pdfs button').filter({ hasText: /catàleg/i }).first();
    await catalegTab.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: '.codex-captures/studio-cataleg-tab.png', fullPage: false });
  });

  test('totes les pàgines del catàleg complet', async ({ page }) => {
    const response = await page.request.get('/api/admin/studio/preview/cataleg');
    const pdfBuffer = await response.body();
    const base64 = pdfBuffer.toString('base64');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head><style>body{margin:0;padding:0;background:white;} canvas{display:block;margin-bottom:8px;}</style></head>
      <body>
        <div id="pages"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script>
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const bytes = atob('${base64}');
          const array = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
          pdfjsLib.getDocument({ data: array }).promise.then(pdf => {
            window.totalPages = pdf.numPages;
            const container = document.getElementById('pages');
            const renders = [];
            for (let p = 1; p <= pdf.numPages; p++) {
              renders.push(pdf.getPage(p).then(page => {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                canvas.id = 'page-' + p;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                container.appendChild(canvas);
                return page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              }));
            }
            Promise.all(renders).then(() => { window.allRendered = true; });
          });
        </script>
      </body>
      </html>
    `);

    await page.waitForFunction(() => (window as any).allRendered === true, { timeout: 30000 });
    const totalPages = await page.evaluate(() => (window as any).totalPages);

    for (let p = 1; p <= totalPages; p++) {
      await page.locator(`#page-${p}`).screenshot({ path: `.codex-captures/cataleg-v2-page-${p}.png` });
    }
    console.log(`Captures fetes: ${totalPages} pàgines`);
  });
});
