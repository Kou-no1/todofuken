import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { openBrowser, dismissOnboarding, dragPiece } from "./browser-helpers.mjs";

const out = "artifacts/short";
await fs.mkdir(`${out}/raw`, { recursive: true });
const browser = await openBrowser();
const shots = [];
try {
  const context = await browser.newContext({
    viewport: { width: 540, height: 800 }, deviceScaleFactor: 2,
    hasTouch: true, recordVideo: { dir: `${out}/raw`, size: { width: 540, height: 800 } }
  });
  const origin = performance.now();
  const page = await context.newPage();
  const now = () => (performance.now() - origin) / 1000;
  const shot = (id, start) => { shots.push({ id, start, end: now() }); console.log(JSON.stringify(shots.at(-1))); };
  await page.goto("http://127.0.0.1:5174/");
  await dismissOnboarding(page);
  await page.evaluate(() => document.fonts.ready);
  const menuStart = now();
  await page.waitForTimeout(1800);
  await page.locator(".mode-card").filter({ hasText: "地方ごとにちょうせん" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(550);
  await page.locator(".mode-card").filter({ hasText: "地方ごとにちょうせん" }).click();
  await page.locator(".region-card").filter({ hasText: "中国・四国地方" }).click();
  shot("menu", menuStart);
  await page.waitForSelector(".puzzle-piece:not([disabled])");

  // A filming-only touch indicator. It never receives events or changes game state.
  await page.evaluate(() => {
    const dot = document.createElement("div");
    dot.id = "recording-touch";
    dot.style.cssText = "position:fixed;left:0;top:0;width:30px;height:30px;border:3px solid #fff;background:#00c8e040;border-radius:50%;pointer-events:none;z-index:100;display:none;box-shadow:0 0 0 3px #00c8e0";
    document.body.append(dot);
    const move = event => { dot.style.display = "block"; dot.style.transform = `translate(${event.clientX - 15}px,${event.clientY - 15}px)`; };
    window.addEventListener("pointerdown", move);
    window.addEventListener("pointermove", event => { if (event.buttons) move(event); });
    window.addEventListener("pointerup", () => { dot.style.display = "none"; });
  });
  const hookStart = now();
  await dragPiece(page, "kochi", { touch: true, slow: true });
  shot("hook", hookStart);
  const playStart = now();
  for (const id of ["kagawa", "ehime", "tokushima", "okayama", "hiroshima", "tottori", "shimane", "yamaguchi"]) {
    await dragPiece(page, id, { touch: true, slow: true });
    console.log(`recorded ${id}`);
  }
  shot("gameplay", playStart);
  await page.waitForSelector(".result-card");
  const clearStart = now();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}/clear-source.png` });
  shot("clear", clearStart);
  await page.getByRole("button", { name: "モードを選ぶ", exact: true }).last().click();
  await page.locator(".mode-card").filter({ hasText: "4択クイズ" }).click();
  await page.locator(".region-card").filter({ hasText: "関東地方" }).click();
  await page.waitForSelector(".option-button:not([disabled])");
  const quizStart = now();
  for (let i = 0; i < 2; i++) {
    const correct = await page.evaluate(async () => {
      const { prefectureById } = await import("/src/data/prefectures.ts");
      const id = document.querySelector(".japan-map .is-target path").dataset.prefectureId;
      const prefecture = prefectureById.get(id);
      return document.querySelector(".quiz-card h1").textContent.includes("は、どの") ? prefecture.name : prefecture.capital;
    });
    await page.waitForTimeout(1000);
    await page.locator(".option-button").filter({ hasText: correct }).click();
    await page.waitForTimeout(900);
  }
  shot("quiz", quizStart);
  await page.getByRole("button", { name: "モードを選ぶ", exact: true }).click();
  const endStart = now();
  await page.locator(".mode-grid").evaluate(element => { element.scrollTop = 0; });
  await page.waitForTimeout(2300);
  await page.screenshot({ path: `${out}/home-source.png` });
  shot("ending", endStart);
  const video = page.video();
  await context.close();
  const filename = await video.path();
  await fs.writeFile(`${out}/shots.json`, JSON.stringify({ raw: filename, shots }, null, 2));
  console.log(`RAW VIDEO: ${filename}`);
} finally { await browser.close(); }
