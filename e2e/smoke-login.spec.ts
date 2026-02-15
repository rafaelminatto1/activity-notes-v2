import { test, expect } from '@playwright/test';

test('deve realizar login com sucesso', async ({ page }) => {
  // Acessa a página de login local
  await page.goto('http://localhost:3000/login');

  // Preenche as credenciais
  await page.fill('input[type="email"]', 'rafael.minatto@yahoo.com.br');
  await page.fill('input[type="password"]', 'Yukari30@');

  // Clica no botão de login
  await page.click('button[type="submit"]');

  // Espera o redirecionamento para /documents (painel principal)
  await page.waitForURL('**/documents**', { timeout: 15000 });

  // Valida se algum elemento da interface principal está visível
  await expect(page).toHaveURL(/.*documents/);
  console.log('Login validado com sucesso!');
});
