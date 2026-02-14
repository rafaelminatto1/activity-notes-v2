import { test, expect } from '@playwright/test';

test.describe('Smoke Test - Verificação Básica', () => {
  test('Página deve carregar', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');

    // Screenshot para debug
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });

    // Verificar URL
    expect(page.url()).toContain('/documents');
  });

  test('Deve existir algum conteúdo na página', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    await page.waitForLoadState('networkidle');

    // Verificar se há algum conteúdo
    const body = page.locator('body');
    const textContent = await body.textContent();
    expect(textContent?.length).toBeGreaterThan(0);
  });
});
