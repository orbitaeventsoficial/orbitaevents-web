import { test } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
function authHeaders() {
  const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

test.describe('captura dossier', () => {
  test.use({ extraHTTPHeaders: authHeaders() });

  test('totes les pàgines del dossier preview', async ({ page }) => {
    const response = await page.request.get('/api/admin/studio/preview/dossier');
    const pdfBuffer = await response.body();
    const base64 = pdfBuffer.toString('base64');

    await page.setContent(`
      <!DOCTYPE html><html><head><style>body{margin:0;background:white}canvas{display:block;margin-bottom:6px}</style></head>
      <body><div id="pages"></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const b=atob('${base64}');const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
        pdfjsLib.getDocument({data:a}).promise.then(pdf=>{
          window.totalPages=pdf.numPages;const c=document.getElementById('pages');const r=[];
          for(let p=1;p<=pdf.numPages;p++){r.push(pdf.getPage(p).then(pg=>{
            const v=pg.getViewport({scale:1.4});const cv=document.createElement('canvas');cv.id='page-'+p;cv.height=v.height;cv.width=v.width;c.appendChild(cv);
            return pg.render({canvasContext:cv.getContext('2d'),viewport:v}).promise;}));}
          Promise.all(r).then(()=>{window.allRendered=true;});
        });
      </script></body></html>
    `);
    await page.waitForFunction(() => (window as any).allRendered === true, { timeout: 30000 });
    const total = await page.evaluate(() => (window as any).totalPages);
    for (let p = 1; p <= total; p++) {
      await page.locator(`#page-${p}`).screenshot({ path: `.codex-captures/dossier-page-${p}.png` });
    }
    console.log(`Dossier: ${total} pàgines`);
  });
});
