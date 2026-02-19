import { test, expect } from "@playwright/test";

const EMAIL = "rafael.minatto@yahoo.com.br";
const PASSWORD = "Yukari30@";
const FIREBASE_ENV_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
];
const hasFirebaseConfig = FIREBASE_ENV_VARS.every((key) => Boolean(process.env[key]));

test.describe("Canvas flow", () => {
  test.skip(!hasFirebaseConfig, "Firebase env vars missing; skipping Canvas flow e2e");
  test.setTimeout(120000);
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/documents", { timeout: 20000 });
  });

  test("creates a canvas, persists edits, and duplicates it", async ({ page }) => {
    await page.goto("/canvas");
    await page.getByRole("button", { name: "Criar Canvas" }).click();
    await page.waitForURL("**/documents/*", { timeout: 60000 });

    const addTextButton = page.getByRole("button", { name: "Adicionar Texto" });
    await addTextButton.click();

    const canvasTextArea = page.getByPlaceholder("Texto livre...").first();
    await canvasTextArea.fill("Canvas Playwright Test");

    await page.waitForTimeout(3500);

    await page.reload();
    await page.waitForURL("**/documents/*", { timeout: 20000 });
    await expect(page.getByPlaceholder("Texto livre...").first()).toHaveValue(
      "Canvas Playwright Test"
    );

    const originalUrl = page.url();

    const moreOptions = page.locator("button").filter({
      has: page.locator(".lucide-more-horizontal"),
    });
    await moreOptions.first().click();
    await page.getByRole("menuitem", { name: "Duplicar" }).click();
    await page.waitForURL(
      (url) =>
        url
          .toString()
          .includes("/documents/") &&
        url.toString() !== originalUrl,
      { timeout: 20000 }
    );

    await expect(page.getByPlaceholder("Texto livre...").first()).toHaveValue(
      "Canvas Playwright Test"
    );
  });
});
