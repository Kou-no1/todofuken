import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser, startPuzzle, dragPiece } from "./browser-helpers.mjs";

const out = "artifacts/qa";
await fs.mkdir(out, { recursive: true });
const browser = await openBrowser();
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await startPuzzle(page);
  await page.screenshot({ path: `${out}/puzzle-mobile.png` });
  const ids = await page.evaluate(async () => (await import("/src/data/prefectures.ts")).prefectures.map(p => p.id));
  const requested = ["hokkaido", "tokyo", "osaka", "kagawa", "saga", "kanagawa", "yamagata", "oita", "fukushima", "nagasaki", "kagoshima", "okinawa", "kochi"];
  for (const touch of [false, true]) {
    for (const zoom of ["normal", "in", "out"]) {
      await startPuzzle(page);
      let count = 0;
      for (const id of zoom === "normal" ? ids : requested) {
        await dragPiece(page, id, { touch, zoom });
        if (++count % 10 === 0) console.log(`${touch ? "touch" : "mouse"}/${zoom}: ${count}`);
      }
      if (zoom === "normal") {
        assert.equal(await page.getByRole("dialog").count(), 1);
        await page.screenshot({ path: `${out}/result-${touch ? "touch" : "mouse"}.png` });
      }
      results.push({ pointer: touch ? "touch" : "mouse", zoom, placed: zoom === "normal" ? ids.length : requested.length });
      console.log(JSON.stringify(results.at(-1)));
    }
  }
  await startPuzzle(page);
  const before = await page.locator(".mistake-pill strong").textContent();
  const firstPiece = page.locator(".puzzle-piece").first();
  const b = await firstPiece.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.waitForSelector(".drag-layer");
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, pointerType: "mouse", clientX: 10, clientY: 10 })));
  await page.mouse.up();
  await page.waitForTimeout(100);
  const cancelFeedback = await page.locator(".status-message").textContent();
  assert.equal(await page.locator(".mistake-pill strong").textContent(), before);
  assert.equal(await page.locator(".drag-layer").count(), 0);
  results.push({ cancelFeedback, before });
  for (const zoom of ["normal", "in", "out"]) {
    await startPuzzle(page);
    for (const id of requested) await dragPiece(page, id, { touch: true, zoom, dy: 12 });
    results.push({ southernDrops: requested.length, zoom, dy: 12 });
    console.log(`southern/${zoom}: ${requested.length}`);
  }
  for (const viewport of [{width:390,height:844},{width:768,height:1024},{width:1366,height:768}]) {
    await page.setViewportSize(viewport);
    await startPuzzle(page);
    const layout = await page.evaluate(() => ({ scrollY, overflow: document.documentElement.scrollHeight > innerHeight, trayBottom: document.querySelector(".bottom-tray").getBoundingClientRect().bottom, height: innerHeight }));
    assert.equal(layout.overflow, false); assert.equal(layout.scrollY, 0);
    assert.ok(layout.trayBottom <= viewport.height + 1);
    results.push({ viewport, layout });
  }
  assert.deepEqual(errors, []);
  const corrupt = await browser.newContext();
  await corrupt.addInitScript(() => localStorage.setItem("pref-puzzle:best:prefecture-national", "{}"));
  const badPage = await corrupt.newPage();
  await badPage.goto("http://127.0.0.1:5174/");
  await badPage.waitForTimeout(400);
  results.push({ corruptedNullLoads: await badPage.locator(".mode-card").count() === 6 });
  await fs.writeFile(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log("BROWSER QA COMPLETE");
} finally { await browser.close(); }
