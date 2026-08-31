import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const outDir = path.resolve("screenshots");
mkdirSync(outDir, { recursive: true });
const stamp = Date.now();

const url = new URL("http://localhost:5174/");
url.searchParams.set("t", String(stamp));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);

await page.goto(url.toString(), { waitUntil: "networkidle" });
await page.locator("[data-start]").click();
await page.waitForTimeout(2000);

await page.screenshot({ path: path.join(outDir, `hitmesh-idle-${stamp}.png`) });

const pinatas = await page.evaluate(() => window.__pinataHitDebug?.() ?? []);
console.log("idle", JSON.stringify(pinatas, null, 2));
const target = pinatas[0];
if (!target?.screen) {
  throw new Error("No pinata screen position");
}

await page.mouse.move(target.screen[0], target.screen[1]);

let hitState = null;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(50);
  const state = await page.evaluate(() => window.__pinataHitDebug?.() ?? []);
  const showing = state.find((p) => p.hitVisible && p.hitMeshTimer > 0);
  if (showing) {
    hitState = showing;
    break;
  }
  if (state[0]?.screen) {
    await page.mouse.move(state[0].screen[0], state[0].screen[1]);
  }
}

await page.screenshot({ path: path.join(outDir, `hitmesh-during-${stamp}.png`) });
console.log("during", JSON.stringify(hitState, null, 2));

await page.waitForTimeout(250);
const after = await page.evaluate(() => window.__pinataHitDebug?.() ?? []);
await page.screenshot({ path: path.join(outDir, `hitmesh-after-${stamp}.png`) });
console.log("after", JSON.stringify(after, null, 2));

await browser.close();
console.log(`screenshots hitmesh-*-${stamp}.png`);
