import { test, expect } from "@playwright/test";

test.describe("Connection Map (Semantic Graph)", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto("/login");
    await page.fill('input[type="email"]', 'rafael.minatto@yahoo.com.br');
    await page.fill('input[type="password"]', 'Yukari30@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/documents**', { timeout: 15000 });

    // 2. Navigate to /graph
    await page.goto("/graph");
    // Wait for initial load
    await page.waitForSelector("canvas", { timeout: 30000 });
  });

  test("should load the graph page", async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mapa de Conexões' })).toBeVisible();
    await expect(page.getByText("Semantic Engine V2.1")).toBeVisible();
  });

  test("should show loading state and then canvas", async ({ page }) => {
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("should have zoom controls", async ({ page }) => {
    const zoomIn = page.locator("button").filter({ has: page.locator(".lucide-zoom-in") });
    const zoomOut = page.locator("button").filter({ has: page.locator(".lucide-zoom-out") });
    
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Buscar nota no grafo...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Test");
    await expect(searchInput).toHaveValue("Test");
  });

  test("should show group legend", async ({ page }) => {
    // The legend items are based on GROUP_COLORS keys
    await expect(page.getByText("GENERAL")).toBeVisible();
    await expect(page.getByText("WORK")).toBeVisible();
  });
});
