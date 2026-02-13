import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const EMAIL = "rafael.minatto@yahoo.com.br";
const PASSWORD = "Yukari30@";

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function takeScreenshot(page, name) {
  const path = `/tmp/e2e-screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  log(`  📸 Screenshot: ${path}`);
  return path;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const results = [];
  function record(name, status, detail = "") {
    results.push({ name, status, detail });
    const icon = status === "OK" ? "✅" : "❌";
    log(`${icon} ${name}${detail ? " — " + detail : ""}`);
  }

  try {
    // ========== 1. LOGIN PAGE ==========
    log("--- Login Page ---");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await takeScreenshot(page, "01-login-page");

    const loginTitle = await page.textContent("h1");
    record("Login page loads", loginTitle?.includes("Bem-vindo") ? "OK" : "FAIL", `Title: "${loginTitle}"`);

    // Check form elements
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    record("Email input present", (await emailInput.count()) > 0 ? "OK" : "FAIL");
    record("Password input present", (await passwordInput.count()) > 0 ? "OK" : "FAIL");

    // Fill login form
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await takeScreenshot(page, "02-login-filled");

    // Submit
    await page.click('button[type="submit"]');
    log("  Submitted login form, waiting for navigation...");

    // Wait for navigation to /documents
    try {
      await page.waitForURL("**/documents", { timeout: 15000 });
      record("Login successful → /documents", "OK");
    } catch {
      await takeScreenshot(page, "02b-login-error");
      const currentUrl = page.url();
      record("Login successful → /documents", "FAIL", `Stuck at: ${currentUrl}`);
    }
    await takeScreenshot(page, "03-documents-home");

    // ========== 2. DOCUMENTS HOME PAGE ==========
    log("\n--- Documents Home Page ---");
    const url = page.url();
    record("URL is /documents", url.includes("/documents") ? "OK" : "FAIL", url);

    const greeting = await page.textContent("h1").catch(() => "");
    record("Greeting rendered", greeting ? "OK" : "FAIL", `"${greeting}"`);

    // Check quick action cards
    const novaPageBtn = page.locator('text=Nova página').first();
    record("'Nova página' card visible", (await novaPageBtn.count()) > 0 ? "OK" : "FAIL");

    // Check recent docs section
    const recentSection = page.locator('text=Recentes');
    record("'Recentes' section visible", (await recentSection.count()) > 0 ? "OK" : "FAIL");

    // ========== 3. CREATE NEW DOCUMENT ==========
    log("\n--- Create New Document ---");
    await novaPageBtn.click();
    try {
      await page.waitForURL("**/documents/**", { timeout: 10000 });
      record("New document created → editor", "OK", page.url());
    } catch {
      record("New document created → editor", "FAIL", page.url());
    }
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "04-new-document");

    // Check editor elements
    const editorPresent = await page.locator('[contenteditable="true"]').count();
    record("Editor (contenteditable) present", editorPresent > 0 ? "OK" : "FAIL");

    // ========== 4. NAVIGATE BACK TO DOCUMENTS ==========
    log("\n--- Navigate back to Documents ---");
    // Click sidebar "Documents" or navigate directly
    await page.goto(`${BASE}/documents`, { waitUntil: "networkidle", timeout: 15000 });
    record("Navigate to /documents", page.url().includes("/documents") ? "OK" : "FAIL");
    await takeScreenshot(page, "05-documents-after-create");

    // ========== 5. OPEN EXISTING DOCUMENT ==========
    log("\n--- Open Existing Document ---");
    // Try to click any document in the sidebar or recent list
    const docButton = page.locator('button').filter({ hasText: /\S/ }).first();
    const recentDoc = page.locator('.space-y-0\\.5 button').first();

    if ((await recentDoc.count()) > 0) {
      const docTitle = await recentDoc.textContent();
      await recentDoc.click();
      await page.waitForTimeout(2000);
      record("Opened recent document", "OK", `"${docTitle?.trim()}"`);
      await takeScreenshot(page, "06-opened-document");
    } else {
      record("Opened recent document", "FAIL", "No recent docs found to click");
    }

    // ========== 6. SETTINGS PAGE ==========
    log("\n--- Settings Page ---");
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "07-settings");

    record("Settings page loads", page.url().includes("/settings") ? "OK" : "FAIL", page.url());

    const settingsContent = await page.textContent("body");
    const hasSettingsUI = settingsContent?.includes("Configurações") || settingsContent?.includes("Tema") || settingsContent?.includes("Perfil");
    record("Settings UI rendered", hasSettingsUI ? "OK" : "FAIL");

    // ========== 7. TRASH PAGE ==========
    log("\n--- Trash Page ---");
    await page.goto(`${BASE}/trash`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "08-trash");

    record("Trash page loads", page.url().includes("/trash") ? "OK" : "FAIL", page.url());

    // ========== 8. REGISTER PAGE (without logging out) ==========
    log("\n--- Register Page ---");
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "09-register");

    const registerBody = await page.textContent("body");
    const hasRegisterForm = registerBody?.includes("Criar uma conta") || registerBody?.includes("Criar conta");
    record("Register page renders", hasRegisterForm ? "OK" : "FAIL");

    // ========== 9. SEARCH FUNCTIONALITY ==========
    log("\n--- Search ---");
    await page.goto(`${BASE}/documents`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);

    // Try opening search with Ctrl+K
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if ((await searchInput.count()) > 0) {
      record("Search dialog opens (Ctrl+K)", "OK");
      await searchInput.fill("test");
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "10-search");
      record("Search input functional", "OK");
      await page.keyboard.press("Escape");
    } else {
      record("Search dialog opens (Ctrl+K)", "FAIL", "Search input not found");
    }

  } catch (error) {
    log(`💥 FATAL ERROR: ${error.message}`);
    await takeScreenshot(page, "99-error").catch(() => {});
  }

  // ========== SUMMARY ==========
  console.log("\n" + "=".repeat(60));
  console.log("  E2E SMOKE TEST SUMMARY");
  console.log("=".repeat(60));
  const passed = results.filter((r) => r.status === "OK").length;
  const failed = results.filter((r) => r.status !== "OK").length;
  console.log(`  Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log("-".repeat(60));
  for (const r of results) {
    const icon = r.status === "OK" ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}${r.detail ? ` (${r.detail})` : ""}`);
  }
  console.log("=".repeat(60));

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
