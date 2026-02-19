import { test, expect } from "@playwright/test";

const EMAIL = "rafael.minatto@yahoo.com.br";
const PASSWORD = "Yukari30@";
const FIREBASE_ENV_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
];
const hasFirebaseConfig = FIREBASE_ENV_VARS.every((key) => Boolean(process.env[key]));

test.describe("Canvas note search dialog", () => {
  test.skip(!hasFirebaseConfig, "Firebase env vars missing; skipping Canvas note-search e2e");
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/documents", { timeout: 20000 });
  });

  test("opens the note search dialog, validates localized feedback, and handles longer results", async ({ page }) => {
    await page.goto("/canvas");
    await page.getByRole("button", { name: "Criar Canvas" }).click();
    await page.waitForURL("**/documents/*", { timeout: 60000 });

    await page.getByRole("button", { name: "Conectar Nota" }).click();
    await expect(page.getByRole("heading", { name: "Conectar nota" })).toBeVisible();

    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("Digite um termo para buscar notas.")).toBeVisible();

    const input = page.getByPlaceholder("Título ou palavra-chave");
    await input.fill("Bio");
    await page.getByRole("button", { name: "Buscar" }).click();
    const connectorButtons = page.locator("button", { hasText: "Conectar" });
    const results = await connectorButtons.count();
    if (results === 0) {
      await expect(page.getByText("Nenhuma nota encontrada.")).toBeVisible();
    } else {
      await expect(connectorButtons.first()).toBeVisible();
    }
  });
});
