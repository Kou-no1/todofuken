import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser, dismissOnboarding, dragPiece, startPuzzle } from "./browser-helpers.mjs";

const browser = await openBrowser();
const results = [];
const base = process.env.APP_URL ?? "http://127.0.0.1:5174/";
await fs.mkdir("artifacts/qa", { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, acceptDownloads: true });
  await context.addInitScript(() => {
    // Exercise the Web Share contract without opening an OS picker in an automated run.
    window.shareCalls = [];
    Object.defineProperty(navigator, "canShare", { value: (data) => data.files?.[0]?.type === "image/png", configurable: true });
    Object.defineProperty(navigator, "share", { value: async (data) => {
      window.shareCalls.push({ title: data.title, text: data.text, filename: data.files[0].name, size: data.files[0].size });
      if (window.shareShouldAbort) throw new DOMException("Cancelled", "AbortError");
    }, configurable: true });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await dismissOnboarding(page);
  const legacy = { mode: "prefecture-national", bestTimeSeconds: 108, bestMistakes: 2, achievedAt: "2026-10-01T00:00:00Z" };
  await page.evaluate((record) => localStorage.setItem("pref-puzzle:best:prefecture-national", JSON.stringify(record)), legacy);
  await page.reload();
  assert.equal(await page.locator(".mode-card").count(), 6);
  assert.equal(await page.locator(".review-shortcut").isDisabled(), true);
  await page.locator(".daily-shortcut").click();
  await page.waitForSelector(".puzzle-piece:not([disabled])");
  const daily = await page.evaluate(async () => {
    const { createDailyChallenge } = await import("/src/utils/learningProgress.ts");
    return createDailyChallenge();
  });
  assert.equal(await page.locator(".puzzle-piece").count(), 5);
  const first = daily.prefectureIds[0];
  const name = await page.evaluate(async (id) => (await import("/src/data/prefectures.ts")).prefectureById.get(id).name, first);
  const piece = page.getByRole("button", { name: `${name}のピース`, exact: true });
  await piece.scrollIntoViewIfNeeded();
  const box = await piece.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForSelector(".drag-layer");
  await page.mouse.move(5, 220);
  await page.mouse.up();
  assert.equal(await page.locator(".mistake-pill strong").textContent(), "1");
  for (const id of daily.prefectureIds) await dragPiece(page, id, { touch: true });
  await page.waitForSelector(".result-card");
  assert.equal(await page.locator(".time-title-badge").count(), 0);
  assert.equal(await page.locator(".result-stats dd").nth(1).textContent(), "5");
  await page.waitForSelector(".result-share a[download]");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "がぞうをほぞん", exact: true }).click();
  const download = await downloadPromise;
  const pngPath = "artifacts/qa/daily-result.png";
  await download.saveAs(pngPath);
  const png = await fs.readFile(pngPath);
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1080);
  assert.equal(png.readUInt32BE(20), 1350);
  assert.equal(await page.evaluate(() => window.shareCalls.length), 0);
  await page.getByRole("button", { name: "がぞうを共有", exact: true }).click();
  assert.equal(await page.evaluate(() => window.shareCalls[0].title), "パズルでおぼえる「都道府県」");
  await page.evaluate(() => { window.shareShouldAbort = true; });
  await page.getByRole("button", { name: "がぞうを共有", exact: true }).click();
  assert.equal(await page.locator(".result-share-message").count(), 0);
  const saved = await page.evaluate((dateKey) => ({
    daily: JSON.parse(localStorage.getItem(`pref-puzzle:best:prefecture-daily:${dateKey}`)),
    legacy: JSON.parse(localStorage.getItem("pref-puzzle:best:prefecture-national"))
  }), daily.dateKey);
  assert.equal(saved.daily.bestMistakes, 1);
  assert.deepEqual(saved.legacy, legacy);
  await page.screenshot({ path: "artifacts/qa/learning-result-mobile.png" });
  results.push({ daily: daily.dateKey, ids: daily.prefectureIds, fivePieces: true, separateDateRecord: true, legacyPreserved: true, png: { width: 1080, height: 1350 }, shareContractAndCancellation: true });
  console.log("Daily challenge, PNG and sharing passed");

  await page.locator(".result-card").getByRole("button", { name: "モードを選ぶ", exact: true }).click();
  assert.match(await page.locator(".daily-shortcut").textContent(), /今日もクリア/);
  assert.equal(await page.locator(".review-shortcut").isEnabled(), true);
  for (let run = 1; run <= 2; run++) {
    await page.locator(".review-shortcut").click();
    await page.waitForSelector(".puzzle-piece:not([disabled])");
    assert.equal(await page.locator(".puzzle-piece").count(), 1);
    await dragPiece(page, first, { touch: true, zoom: run === 1 ? "in" : "out" });
    await page.waitForSelector(".result-card");
    assert.equal(await page.locator(".time-title-badge").count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem("pref-puzzle:best:prefecture-review")), null);
    await page.locator(".result-card").getByRole("button", { name: "モードを選ぶ", exact: true }).click();
    assert.equal(await page.locator(".review-shortcut").isDisabled(), run === 2);
  }
  await page.reload();
  assert.equal(await page.locator(".review-shortcut").isDisabled(), true);
  await page.locator(".daily-shortcut").click();
  await page.waitForSelector(".puzzle-piece:not([disabled])");
  const repeatedNames = await page.locator(".puzzle-piece").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")).sort());
  const expectedNames = await page.evaluate(async (ids) => {
    const { prefectureById } = await import("/src/data/prefectures.ts");
    return ids.map((id) => `${prefectureById.get(id).name}のピース`).sort();
  }, daily.prefectureIds);
  assert.deepEqual(repeatedNames, expectedNames);
  results.push({ reviewOnlyMissed: true, clearedAfterTwoCleanRuns: true, reviewNoBestOrTitle: true, dailyStableAfterReload: true });
  console.log("Review persistence and daily reload passed");

  // Real play also verifies that the national title and grayscale result map remain intact.
  await startPuzzle(page, "全国47ピース");
  const allIds = await page.evaluate(async () => (await import("/src/data/prefectures.ts")).prefectures.map((p) => p.id));
  for (const id of allIds) {
    await dragPiece(page, id);
    if (allIds.indexOf(id) % 10 === 0) console.log(`National regression: ${id}`);
  }
  await page.waitForSelector(".result-card");
  assert.equal(await page.locator(".time-title-badge").count(), 1);
  await page.waitForSelector(".result-share a[download]");
  const hardDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "がぞうをほぞん", exact: true }).click();
  await (await hardDownload).saveAs("artifacts/qa/hard-result.png");
  await page.setViewportSize({ width: 360, height: 640 });
  const fits = await page.locator(".result-card").evaluate((element) => ({ height: element.clientHeight, content: element.scrollHeight, bottom: element.getBoundingClientRect().bottom, viewport: innerHeight }));
  assert.ok(fits.content <= fits.height + 1, JSON.stringify(fits));
  assert.ok(fits.bottom <= fits.viewport);
  const noteFits = await page.locator(".result-note").evaluate((element) => element.scrollHeight <= element.clientHeight + 1);
  assert.equal(noteFits, true, "Next-title message must not be clipped on a small screen");
  await page.screenshot({ path: "artifacts/qa/hard-result-small-mobile.png" });
  results.push({ hard47Complete: true, nationalTitleRetained: true, resultOneScreenAt360x640: true });

  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto(base);
    await page.waitForSelector(".mode-card");
    const layout = await page.evaluate(() => {
      const grid = document.querySelector(".mode-grid").getBoundingClientRect();
      const footer = document.querySelector(".home-footer").getBoundingClientRect();
      return { bodyScroll: document.body.scrollHeight > innerHeight, widthOverflow: document.body.scrollWidth > innerWidth, footerOverlap: footer.top < grid.bottom - 1, cards: document.querySelectorAll(".mode-card").length };
    });
    assert.deepEqual(layout, { bodyScroll: false, widthOverflow: false, footerOverlap: false, cards: 6 });
    await page.screenshot({ path: `artifacts/qa/learning-home-${viewport.width}.png` });
    results.push({ viewport, ...layout });
  }
  assert.deepEqual(errors, []);
  await fs.writeFile("artifacts/qa/learning-results.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
