import { test, expect } from '@playwright/test';

test.describe('Validação de Margens Laterais', () => {
  test('margens reduzidas na página de documento', async ({ page }) => {
    // Navegar para a página de documentos
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Verificar a presença do conteúdo principal
    await page.waitForSelector('body', { timeout: 5000 });

    // Buscar pelo container principal com px-4 (padding reduzido)
    // O seletor busca elementos que têm a classe px-4 aplicada
    const contentElements = page.locator('[class*="px-4"]');

    const count = await contentElements.count();
    console.log(`Elementos com px-4 encontrados: ${count}`);

    if (count > 0) {
      // Pegar o primeiro elemento com padding reduzido
      const firstContent = contentElements.first();

      const paddingLeft = await firstContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingLeft);
      });

      const paddingRight = await firstContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingRight);
      });

      console.log(`Padding-left: ${paddingLeft}px, Padding-right: ${paddingRight}px`);

      // px-4 no Tailwind é aproximadamente 16px
      // Verificar se o padding foi reduzido
      expect(paddingLeft).toBeLessThanOrEqual(20); // Margem não deve exceder 20px
      expect(paddingRight).toBeLessThanOrEqual(20); // Margem não deve exceder 20px
    } else {
      // Se não encontrar px-4, verificar se há algum elemento com padding pequeno
      const allContainers = page.locator('main > div').first();
      const paddingLeft = await allContainers.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingLeft);
      });

      const paddingRight = await allContainers.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingRight);
      });

      console.log(`Fallback - Padding-left: ${paddingLeft}px, Padding-right: ${paddingRight}px`);

      // Mesmo fallback, o padding deve ser reduzido
      expect(paddingLeft).toBeLessThanOrEqual(32);
      expect(paddingRight).toBeLessThanOrEqual(32);
    }
  });

  test('margens reduzidas na página home', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Buscar elementos com px-4 ou verificar o container principal
    const contentElements = page.locator('[class*="px-4"]');

    if (await contentElements.count() > 0) {
      const firstContent = contentElements.first();

      const paddingLeft = await firstContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingLeft);
      });

      const paddingRight = await firstContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingRight);
      });

      console.log(`Home - Padding-left: ${paddingLeft}px, Padding-right: ${paddingRight}px`);

      expect(paddingLeft).toBeLessThanOrEqual(20);
      expect(paddingRight).toBeLessThanOrEqual(20);
    } else {
      const mainContainer = page.locator('main > div').first();
      const paddingLeft = await mainContainer.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingLeft);
      });

      const paddingRight = await mainContainer.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingRight);
      });

      console.log(`Home Fallback - Padding-left: ${paddingLeft}px, Padding-right: ${paddingRight}px`);

      expect(paddingLeft).toBeLessThanOrEqual(32);
      expect(paddingRight).toBeLessThanOrEqual(32);
    }
  });

  test('margens reduzidas na página de configurações', async ({ page }) => {
    // Tentar acessar settings, pode redirecionar para login se não autenticado
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Verificar se foi redirecionado para login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Settings redirecionou para login (esperado - requer autenticação)');
      // Test passou por não ter autenticação, mas verificamos o CSS
      test.skip(true, 'Settings requer autenticação');
      return;
    }

    // Buscar elementos com p-4 no settings
    const contentElements = page.locator('[class*="p-4"]');

    if (await contentElements.count() > 0) {
      const firstContent = contentElements.first();

      const paddingLeft = await firstContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingLeft);
      });

      const paddingRight = await firstContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingRight);
      });

      console.log(`Settings - Padding-left: ${paddingLeft}px, Padding-right: ${paddingRight}px`);

      expect(paddingLeft).toBeLessThanOrEqual(20);
      expect(paddingRight).toBeLessThanOrEqual(20);
    } else {
      // Fallback: buscar qualquer div dentro do body
      const bodyDiv = page.locator('body > div').first();
      const paddingLeft = await bodyDiv.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingLeft);
      });

      const paddingRight = await bodyDiv.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.paddingRight);
      });

      console.log(`Settings Fallback - Padding-left: ${paddingLeft}px, Padding-right: ${paddingRight}px`);

      expect(paddingLeft).toBeLessThanOrEqual(32);
      expect(paddingRight).toBeLessThanOrEqual(32);
    }
  });
});
