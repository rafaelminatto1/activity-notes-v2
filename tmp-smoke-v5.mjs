import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const EMAIL = 'rafael.minatto@yahoo.com.br';
const PASSWORD = 'Yukari30@';

const results = [];
let createdDocId = null;

const add = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  const icon = ok ? 'OK' : 'FAIL';
  console.log(`${icon} | ${name}${detail ? ` | ${detail}` : ''}`);
};

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
      await Promise.race([
        page.waitForURL('**/documents', { timeout: 7000 }),
        page.getByRole('heading', { name: 'Bem-vindo de volta' }).first().waitFor({ state: 'visible', timeout: 7000 }),
      ]);
    } catch {}

    if (!page.url().includes('/documents')) {
      await page.locator('#email').fill(EMAIL);
      await page.locator('#password').fill(PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/documents', { timeout: 25000 });
    }

    await page.getByText('O que você gostaria de fazer hoje?', { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 });
    add('Login + /documents', true, page.url());

    await page.getByRole('button', { name: /Nova página/i }).first().click();
    await page.waitForURL('**/documents/*', { timeout: 20000 });
    const m = page.url().match(/\/documents\/([^/?#]+)/);
    if (m) createdDocId = m[1];
    await page.locator('textarea[placeholder="Sem título"]').first().waitFor({ state: 'visible', timeout: 15000 });
    add('Create /documents/[id]', !!createdDocId, page.url());

    if (createdDocId) {
      await page.getByRole('button', { name: /^Publicar$/ }).first().click();
      await page.getByRole('button', { name: /^Publicado$/ }).first().waitFor({ state: 'visible', timeout: 20000 });
      add('Publish document', true, createdDocId);

      const resp = await page.goto(`${BASE}/preview/${createdDocId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = resp ? resp.status() : null;
      await page.waitForTimeout(2500);
      const hasNotFound = await page.getByText('Documento não encontrado', { exact: false }).first().isVisible().catch(() => false);
      const previewOk = status === 200 && !hasNotFound;
      add('Open /preview/[id]', previewOk, `status=${status} notFound=${hasNotFound}`);
    }

    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('heading', { name: 'Configurações' }).first().waitFor({ state: 'visible', timeout: 15000 });
    add('/settings', true, page.url());

    await page.goto(`${BASE}/trash`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('heading', { name: 'Lixeira' }).first().waitFor({ state: 'visible', timeout: 15000 });
    add('/trash', true, page.url());

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL('**/documents', { timeout: 20000 });
    add('/ -> /documents (logado)', page.url().includes('/documents'), page.url());

    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL('**/documents', { timeout: 20000 });
    add('/register -> /documents (logado)', page.url().includes('/documents'), page.url());

    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL('**/documents', { timeout: 20000 });
    add('/login -> /documents (logado)', page.url().includes('/documents'), page.url());
  } catch (err) {
    add('Flow', false, err instanceof Error ? err.message : String(err));
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log('\nSUMMARY');
  console.log(JSON.stringify({
    base: BASE,
    createdDocId,
    total: results.length,
    passed,
    failed,
    results,
    finalUrl: page.url(),
    title: await page.title(),
  }, null, 2));

  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
})();
