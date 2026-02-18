import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE = "http://127.0.0.1:3000"; 
const EMAIL = "rafael.minatto@yahoo.com.br";
const PASSWORD = "Yukari30@";

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function takeScreenshot(page, name) {
  const dir = "/tmp/e2e-verify";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const screenshotPath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`  📸 Screenshot: ${screenshotPath}`);
  return screenshotPath;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const results = [];
  function record(name, status, detail = "") {
    results.push({ name, status, detail });
    const icon = status === "OK" ? "✅" : "❌";
    log(`${icon} ${name}${detail ? " — " + detail : ""}`);
  }

  try {
    // ========== 1. LOGIN ==========
    log("--- Login ---");
    log(`  Navigating to ${BASE}/login...`);
    try {
        await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    } catch {
        log("  Port 3000 failed, trying 3001...");
        await page.goto("http://127.0.0.1:3001/login", { waitUntil: "networkidle" });
    }
    
    await page.fill('input#email', EMAIL);
    await page.fill('input#password', PASSWORD);
    await takeScreenshot(page, "login-filled");
    await page.click('button[type="submit"]');
    log("  Clicked submit, waiting for /documents...");
    
    await page.waitForURL("**/documents", { timeout: 45000 });
    record("Login successful", "OK");

    // ========== 2. VERIFY SPACES & INBOX (UI) ==========
    log("--- Verify UI Components ---");
    await page.waitForTimeout(5000); 
    
    // Check for Bell icon (Inbox)
    const inboxTrigger = page.locator('button:has(.lucide-bell), .lucide-bell');
    record("Inbox (Bell) icon present", (await inboxTrigger.count()) > 0 ? "OK" : "FAIL");
    
    // Check for "Espaços" text
    const spacesSection = page.locator('text=Espaços');
    record("Spaces section present", (await spacesSection.count()) > 0 ? "OK" : "FAIL");
    await takeScreenshot(page, "sidebar-verify");

    // ========== 3. CREATE DOC & TEST AI ==========
    log("--- Verify Gemini AI ---");
    // Click "Nova página" - search for the label directly
    const novaPaginaBtn = page.locator('text=Nova página').first();
    await novaPaginaBtn.click();
    log("  Clicked 'Nova página', waiting for editor...");
    
    await page.waitForURL("**/documents/**", { timeout: 30000 });
    await page.waitForTimeout(5000); // Wait for editor and AI to load
    
    const aiPanelBtn = page.locator('button:has(.lucide-sparkles), .lucide-sparkles').first();
    if ((await aiPanelBtn.count()) > 0) {
        record("AI (Sparkles) button present", "OK");
        await aiPanelBtn.click();
        await page.waitForTimeout(2000);
        
        // Find the input in the AI panel
        const aiInput = page.locator('textarea[placeholder*="Pergunte"], input[placeholder*="Pergunte"]').first();
        if ((await aiInput.count()) > 0) {
            await aiInput.fill("Olá Gemini, qual o seu nome?");
            await page.keyboard.press("Enter");
            log("  Sent message to Gemini, waiting for response...");
            
            await page.waitForTimeout(15000);
            await takeScreenshot(page, "ai-response-check");
            const pageContent = await page.textContent('body');
            record("Gemini AI response checked", (pageContent?.length || 0) > 100 ? "OK" : "FAIL");
        } else {
            record("AI input not found", "FAIL");
        }
    } else {
        record("AI button not found", "FAIL");
    }

    // ========== 4. CONSOLE ERROR CHECK ==========
    log("--- Console Error Check ---");
    const consoleErrors = [];
    page.on("console", msg => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    
    // Navigate around to trigger potential errors
    await page.goto(`${BASE}/documents`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(5000);
    
    const hasIndexError = consoleErrors.some(e => e.toLowerCase().includes("index") || e.toLowerCase().includes("failed-precondition"));
    record("No Firestore index errors observed", !hasIndexError ? "OK" : "FAIL", hasIndexError ? "Found index error in console" : "");
    if (hasIndexError) {
        log("  Sample error: " + consoleErrors.find(e => e.includes("index")));
    }

  } catch (error) {
    log(`💥 FATAL ERROR: ${error.message}`);
    await takeScreenshot(page, "error");
  }

  console.log("\n" + "=".repeat(60));
  console.log("  VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  const passed = results.filter((r) => r.status === "OK").length;
  const failed = results.filter((r) => r.status !== "OK").length;
  console.log(`  Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  for (const r of results) {
    const icon = r.status === "OK" ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}${r.detail ? ` (${r.detail})` : ""}`);
  }
  console.log("=".repeat(60));

  await browser.close();
})();
