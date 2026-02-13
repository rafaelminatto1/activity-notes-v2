import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';
const EMAIL = 'rafael.minatto@yahoo.com.br';
const PASSWORD = 'Yukari30@';

test('smoke login and pages', async ({ page }) => {
  await page.goto(`${BASE}/login`);

  try {
    await Promise.race([
      page.waitForURL('**/documents', { timeout: 7000 }),
      page.getByRole('heading', { name: 'Bem-vindo de volta' }).first().waitFor({ timeout: 7000 }),
    ]);
  } catch {}

  if (!page.url().includes('/documents')) {
    await page.locator('#email').fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/documents', { timeout: 25000 });
  }

  await expect(page.getByText('O que você gostaria de fazer hoje?', { exact: false }).first()).toBeVisible();

  await page.getByRole('button', { name: /Nova página/i }).first().click();
  await page.waitForURL('**/documents/*', { timeout: 20000 });
  const m = page.url().match(/\/documents\/([^/?#]+)/);
  expect(m).not.toBeNull();
  const id = m![1];

  await page.getByRole('button', { name: /^Publicar$/ }).first().click();
  await expect(page.getByRole('button', { name: /^Publicado$/ }).first()).toBeVisible({ timeout: 20000 });

  const resp = await page.goto(`${BASE}/preview/${id}`);
  expect(resp?.status()).toBe(200);
  await expect(page.getByText('Documento não encontrado', { exact: false }).first()).toHaveCount(0);

  await page.goto(`${BASE}/settings`);
  await expect(page.getByRole('heading', { name: 'Configurações' }).first()).toBeVisible();

  await page.goto(`${BASE}/trash`);
  await expect(page.getByRole('heading', { name: 'Lixeira' }).first()).toBeVisible();
});
