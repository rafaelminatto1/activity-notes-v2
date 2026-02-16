import { test, expect } from '@playwright/test';

test.describe('Modernização Inteligente - Testes E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login inicial
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'rafael.minatto@yahoo.com.br');
    await page.fill('input[type="password"]', 'Yukari30@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/documents**', { timeout: 15000 });
  });

  test('deve abrir o Q&A Global via atalho Ctrl+Q', async ({ page }) => {
    await page.keyboard.press('Control+q');
    const modalTitle = page.locator('text=Pergunte às suas Notas');
    await expect(modalTitle).toBeVisible();
    
    // Testa o input
    const input = page.locator('placeholder="Faça uma pergunta..."');
    await input.fill('Como organizar meus projetos?');
    await page.keyboard.press('Enter');
    
    // Verifica se o loading ou resposta aparece
    const loadingState = page.locator('.animate-bounce');
    await expect(loadingState.first()).toBeVisible();
  });

  test('deve abrir a Sidebar Contextual e mostrar notas relacionadas', async ({ page }) => {
    // Entra no primeiro documento disponível
    await page.goto('http://localhost:3000/documents');
    const firstDoc = page.locator('nav a').first();
    await firstDoc.click();
    
    // Clica no botão de abrir sidebar (chevron left)
    const sidebarTrigger = page.locator('button:has(svg.lucide-chevron-left)');
    await sidebarTrigger.click();
    
    const sidebarTitle = page.locator('text=Notas Relacionadas');
    await expect(sidebarTitle).toBeVisible();
  });

  test('deve inserir template de email via Slash Command', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    const firstDoc = page.locator('nav a').first();
    await firstDoc.click();
    
    const editor = page.locator('.tiptap');
    await editor.focus();
    await page.keyboard.type('/email');
    await page.keyboard.press('Enter');
    
    const emailTemplate = page.locator('text=Assunto: [Assunto do Email]');
    await expect(emailTemplate).toBeVisible();
  });

  test('deve navegar para o Grafo Semântico e renderizar o canvas', async ({ page }) => {
    await page.goto('http://localhost:3000/graph');
    
    const graphTitle = page.locator('text=Mapa de Conexões');
    await expect(graphTitle).toBeVisible();
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('deve exibir o botão de Auto-Tagging e Executive Summary', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    const firstDoc = page.locator('nav a').first();
    await firstDoc.click();
    
    // Auto Tag Button (com ícone de Tag e Sparkles)
    const autoTagBtn = page.locator('button:has(svg.lucide-tag)');
    await expect(autoTagBtn).toBeVisible();
    
    // Executive Summary Area
    const summaryBtn = page.locator('text=Gerar Resumo Executivo com IA');
    await expect(summaryBtn).toBeVisible();
  });
});
