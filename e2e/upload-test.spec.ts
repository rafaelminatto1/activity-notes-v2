import { test, expect } from '@playwright/test';
import path from 'path';

test('deve criar documento e fazer upload de imagem', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'rafael.minatto@yahoo.com.br');
  await page.fill('input[type="password"]', 'Yukari30@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/documents', { timeout: 30000 });

  // Criar documento
  await page.click('text=Novo Documento');
  // Wait for navigation to document page (UUID in URL)
  await page.waitForURL(/\/documents\/[a-zA-Z0-9]+/, { timeout: 30000 });

  // Wait for editor to load
  await page.waitForSelector('.tiptap', { state: 'visible', timeout: 30000 });

  // Upload imagem
  const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
  await fileInput.setInputFiles(path.join(__dirname, '../test-image.png'));

  // Verificar se a imagem foi inserida
  // The editor inserts an img tag with src starting with firebasestorage or blob (initially)
  // We wait for an img tag inside .tiptap
  await expect(page.locator('.tiptap img')).toBeVisible({ timeout: 30000 });
  
  console.log('Upload de imagem testado com sucesso!');
});
