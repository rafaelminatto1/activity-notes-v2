import { test, expect } from '@playwright/test';

test.describe('Fluxo de Tarefas (Smart Tasks)', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'rafael.minatto@yahoo.com.br');
    await page.fill('input[type="password"]', 'Yukari30@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/documents**');
  });

  test('deve abrir o painel de tarefas, criar e concluir uma tarefa', async ({ page }) => {
    // 1. Abrir painel de tarefas com atalho Ctrl+J
    await page.keyboard.press('Control+j');
    
    // Validar se o painel abriu
    const tasksPanel = page.locator('text=Tarefas').first();
    await expect(tasksPanel).toBeVisible();

    // 2. Criar uma nova tarefa
    const taskTitle = `Tarefa de Teste ${Date.now()}`;
    await page.fill('input[placeholder="Nova tarefa..."]', taskTitle);
    
    // Clicar no botão de adicionar (submit do form)
    await page.locator('form button[type="submit"]').click();

    // 3. Verificar se a tarefa apareceu na lista
    const taskItem = page.getByText(taskTitle);
    await expect(taskItem).toBeVisible();

    // 4. Concluir a tarefa
    // O botão de check é o irmão anterior ao texto
    // Estrutura: div > button(check) + span(text) + button(trash)
    // Vou clicar no botão que está junto com o texto da tarefa
    await taskItem.locator('..').locator('button').first().click();

    // 5. Verificar se está concluída (texto riscado / line-through e cor alterada)
    await expect(taskItem).toHaveClass(/line-through/);
    await expect(taskItem).toHaveClass(/text-muted-foreground/);

    // 6. Excluir a tarefa (limpeza)
    // Hover na tarefa para mostrar o botão de lixeira
    await taskItem.locator('..').hover();
    await taskItem.locator('..').locator('button').last().click();

    // Validar se sumiu
    await expect(taskItem).not.toBeVisible();
  });
});
