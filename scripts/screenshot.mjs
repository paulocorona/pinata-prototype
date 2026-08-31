/**
 * Capture a gameplay screenshot for visual QA.
 * Usage: node scripts/screenshot.mjs [label]
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const label = (process.argv[2] ?? "shot").replace(/[^\w.-]+/g, "_");
const outDir = path.resolve("screenshots");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${label}-${Date.now()}.png`);

const base = process.env.PINATA_URL ?? "http://localhost:5174/";
const url = new URL(base);
if (process.env.HITDEBUG === "1") url.searchParams.set("hitdebug", "1");
url.searchParams.set("t", String(Date.now()));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.route("**/*", (route) => {
  const headers = {
    ...route.request().headers(),
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
  return route.continue({ headers });
});
const page = await context.newPage();
page.setDefaultTimeout(20000);

await page.goto(url.toString(), { waitUntil: "networkidle" });

const start = page.locator("[data-start]");
if (await start.count()) {
  await start.click();
  await page.waitForTimeout(2000);
}

await page.screenshot({ path: outPath, type: "png" });

const hitDebug = await page.evaluate(() => {
  return window.__pinataHitDebug ? window.__pinataHitDebug() : null;
});
console.log("hitDebug", JSON.stringify(hitDebug, null, 2));

await browser.close();

console.log(outPath);
