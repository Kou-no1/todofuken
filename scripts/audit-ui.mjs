import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser, dismissOnboarding, startPuzzle } from "./browser-helpers.mjs";

const browser = await openBrowser();
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:5174/");
  await page.waitForSelector(".onboarding-card");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => !!document.activeElement.closest(".onboarding-card")), true);
  }
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".onboarding-card").count(), 0);
  await page.reload();
  assert.equal(await page.locator(".onboarding-card").count(), 0);
  results.push({ onboardingFocusTrap: true, onceOnly: true });

  for (const card of ["全国47ピース", "全国カラーモード", "全国を練習", "地方ごとにちょうせん", "少しずつ練習"]) {
    await startPuzzle(page, card, ["地方ごとにちょうせん", "少しずつ練習"].includes(card) ? "関東地方" : undefined);
    const colorCount = await page.locator(".puzzle-piece").evaluateAll(elements => new Set(elements.map(element => getComputedStyle(element).getPropertyValue("--region-main"))).size);
    const progressBeforeCancel = await page.evaluate(() => localStorage.getItem("pref-puzzle:learning:v1"));
    assert.equal(card === "全国47ピース" ? colorCount === 1 : colorCount > 0, true);
    await page.locator(".puzzle-piece").first().dispatchEvent("pointerdown", { pointerId: 9, pointerType: "mouse", clientX: 170, clientY: 740, isPrimary: true, button: 0, bubbles: true });
    await page.waitForSelector(".drag-layer");
    const learning = ["全国を練習", "少しずつ練習"].includes(card);
    assert.equal(await page.locator(".japan-map .is-target").count() > 0, learning);
    // A second finger must not finish or move the active drag.
    await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 10, clientX: 1, clientY: 1 })));
    assert.equal(await page.locator(".drag-layer").count(), 1);
    await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 9 })));
    assert.equal(await page.locator(".drag-layer").count(), 0);
    assert.equal(await page.locator(".mistake-pill strong").textContent(), "0");
    assert.equal(await page.evaluate(() => localStorage.getItem("pref-puzzle:learning:v1")), progressBeforeCancel);
    results.push({ card, colorCount, redGuide: learning, cancellationWithoutMistake: true, secondPointerIgnored: true });
  }

  await page.goto("http://127.0.0.1:5174/");
  await page.locator(".mode-card").filter({ hasText: "4択クイズ" }).click();
  await page.locator(".region-card").filter({ hasText: "関東地方" }).click();
  await page.waitForSelector(".option-button:not([disabled])");
  for (let i = 0; i < 8; i++) {
    const correct = await page.evaluate(async () => {
      const { prefectureById } = await import("/src/data/prefectures.ts");
      const id = document.querySelector(".japan-map .is-target path").dataset.prefectureId;
      const prefecture = prefectureById.get(id);
      return document.querySelector(".quiz-card h1").textContent.includes("は、どの") ? prefecture.name : prefecture.capital;
    });
    const options = page.locator(".option-button");
    assert.equal(await options.count(), 4);
    await (i === 0 ? options.filter({ hasNotText: correct }).first() : options.filter({ hasText: correct })).click();
    if (i < 7) await page.waitForSelector(".option-button:not([disabled])");
  }
  await page.waitForSelector(".result-card");
  assert.equal(await page.locator(".result-stats div").last().locator("dd").textContent(), "1回");
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => !!document.activeElement.closest(".result-backdrop")), true);
  }
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem("pref-puzzle:best:capital-quiz:kanto")));
  assert.equal(best.bestMistakes, 1);
  const clockBefore = await page.locator('[aria-label="タイムアタック"] strong').first().textContent();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('[aria-label="タイムアタック"] strong').first().textContent(), clockBefore);
  results.push({ quiz4Options: true, wrongAnswerReview: true, separateBest: true, resultFocusTrap: true, timerStopped: true });

  await page.goto("http://127.0.0.1:5174/");
  await page.locator(".mode-card").filter({ hasText: "4択クイズ" }).click();
  await page.locator(".special-card").click();
  await page.waitForSelector(".option-button:not([disabled])");
  assert.equal(await page.locator(".option-button").count(), 6);
  results.push({ specialQuiz6Options: true });

  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  });
  const deniedPage = await denied.newPage();
  deniedPage.on("pageerror", error => errors.push(error.message));
  await startPuzzle(deniedPage, "全国47ピース");
  await deniedPage.getByRole("button", { name: "音 OFF", exact: true }).click();
  assert.equal(await deniedPage.locator(".puzzle-piece").count(), 47);
  results.push({ deniedStorageStartsAndTogglesSound: true });

  await page.route("https://script.google.com/macros/**", route => route.fulfill({ json: { updatedAt: "2026-10-03", overall: [{ name: '<img src=x onerror="window.injected=true">', grade: "4年", time: "1:23" }], byGrade: {} } }));
  await page.goto("http://127.0.0.1:5174/todofuken_ranking.html");
  await page.waitForSelector(".ranking-table");
  assert.equal(await page.locator(".ranking-table img").count(), 0);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  results.push({ rankingEscapesUntrustedNames: true });
  assert.deepEqual(errors, []);
  await fs.writeFile("artifacts/qa/ui-results.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
