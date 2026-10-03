import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { openBrowser, dismissOnboarding } from "./browser-helpers.mjs";

const URL = process.env.APP_URL ?? "http://127.0.0.1:5174/";
await fs.mkdir("artifacts/qa", { recursive: true });
const browser = await openBrowser();
const checks = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(URL);
  await dismissOnboarding(page);
  await page.locator(".handwriting-shortcut").click();
  await page.waitForSelector('.tracing-canvas[data-font-ready="true"]');
  assert.equal(await page.getByLabel("練習する名前", { exact: true }).locator("option").count(), 47);
  const legacyBest = JSON.stringify({ mode: "prefecture-national", bestTimeSeconds: 108, bestMistakes: 2, achievedAt: "2026-10-04T00:00:00Z" });
  await page.evaluate(value => localStorage.setItem("pref-puzzle:best:prefecture-national", value), legacyBest);

  const inkBounds = () => page.locator("canvas").evaluate(canvas => {
    const { width, height } = canvas;
    const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    let count = 0, minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i] < 90 && data[i + 1] < 100 && data[i + 2] < 120 && data[i + 3] > 180) {
        count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    return { count, minX: minX / width, maxX: maxX / width, minY: minY / height, maxY: maxY / height };
  });
  const writeStroke = async (type = "touch", cancel = false) => {
    const box = await page.locator("canvas").boundingBox();
    const cdp = await context.newCDPSession(page);
    const points = Array.from({ length: 9 }, (_, i) => ({ x: box.x + box.width * (0.3 + i * 0.05), y: box.y + box.height * 0.5 }));
    if (type === "touch") {
      const tp = p => [{ ...p, id: 1, radiusX: 5, radiusY: 5, force: 0.7 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(points[0]) });
      for (const p of points.slice(1)) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(p) });
      await cdp.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
    } else {
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...points[0], button: "left", buttons: 1, clickCount: 1, pointerType: type });
      for (const p of points.slice(1)) await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...p, button: "left", buttons: 1, pointerType: type });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...points.at(-1), button: "left", buttons: 0, clickCount: 1, pointerType: type });
    }
    await cdp.detach();
    await page.waitForTimeout(80);
  };

  assert.ok(await page.locator("canvas").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let guide = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] === 210 && pixels[i + 1] === 217 && pixels[i + 2] === 226) guide++;
    return guide > 1000;
  }), "font glyph is actually rendered, not just loaded");

  assert.equal((await inkBounds()).count, 0);
  await writeStroke("touch", true);
  assert.equal((await inkBounds()).count, 0);
  assert.equal(await page.getByRole("button", { name: "書けた！", exact: false }).isDisabled(), true);
  for (const type of ["touch", "mouse", "pen"]) {
    await writeStroke(type);
    await page.screenshot({ path: `artifacts/qa/handwriting-input-${type}.png` });
    assert.ok((await inkBounds()).count > 100, JSON.stringify({ type, ink: await inkBounds(), box: await page.locator("canvas").boundingBox(), disabled: await page.getByRole("button", { name: "書けた！", exact: false }).isDisabled() }));
    await page.getByRole("button", { name: "1画もどす", exact: true }).click();
    await page.waitForTimeout(40);
    assert.equal((await inkBounds()).count, 0);
    checks.push(`${type}: rendered ink + undo`);
  }
  const multi = await context.newCDPSession(page);
  const box = await page.locator("canvas").boundingBox();
  const first = { id: 1, x: box.x + box.width * 0.3, y: box.y + box.height * 0.5, force: 0.7 };
  const second = { id: 2, x: box.x + box.width * 0.7, y: box.y + box.height * 0.8, force: 0.7 };
  await multi.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first] });
  await multi.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first, second] });
  await multi.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [first] });
  await multi.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...first, x: box.x + box.width * 0.7 }] });
  await multi.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await multi.detach();
  await page.waitForTimeout(70);
  assert.ok((await inkBounds()).maxY < 0.55, "second finger cannot move the pen or end the primary stroke");
  await page.getByRole("button", { name: "1画もどす", exact: true }).click();
  checks.push("second finger ignored; pointer cancellation discards unfinished ink");
  await writeStroke();
  const before = await inkBounds();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(160);
  const after = await inkBounds();
  assert.ok(after.count > 10);
  for (const key of ["minX", "maxX", "minY", "maxY"]) assert.ok(Math.abs(before[key] - after[key]) < 0.025, `${key} after rotation`);
  checks.push("rotation preserves normalized ink");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("checkbox", { name: "お手本", exact: true }).uncheck();
  const inkOnly = await inkBounds();
  assert.ok(inkOnly.count > 100);
  await page.getByRole("checkbox", { name: "お手本", exact: true }).check();
  await page.getByRole("button", { name: "書き直す", exact: true }).click();
  await page.waitForTimeout(50);
  assert.equal((await inkBounds()).count, 0);
  checks.push("guide toggle and clear");

  const finishName = async () => {
    const buttons = page.locator(".handwriting-characters button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await writeStroke();
      await page.getByRole("button", { name: "書けた！", exact: false }).click();
    }
    await page.getByRole("button", { name: "次の名前へ", exact: false }).waitFor();
  };
  await finishName();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("pref-puzzle:handwriting:v1"))), { prefecture: ["hokkaido"], capital: [] });
  await page.getByRole("button", { name: "次の名前へ", exact: false }).click();
  assert.equal(await page.locator(".handwriting-word h2").textContent(), "青森県あおもりけん");
  await page.getByRole("button", { name: "県庁所在地", exact: false }).click();
  await finishName();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("pref-puzzle:handwriting:v1"))), { prefecture: ["hokkaido"], capital: ["hokkaido"] });
  await page.getByLabel("地方", { exact: true }).selectOption("kanto");
  assert.equal(await page.getByLabel("練習する名前", { exact: true }).locator("option").count(), 7);
  await page.getByLabel("練習する名前", { exact: true }).selectOption({ label: "新宿区（しんじゅくく）" });
  await page.waitForSelector('.tracing-canvas[data-font-ready="true"]');
  assert.ok((await page.locator(".handwriting-word").textContent()).includes("東京都"));
  checks.push("prefecture/capital records separate; all 47 names + region selection");

  for (const size of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => {
      const selectors = [".tracing-canvas", ".handwriting-tools", ".handwriting-bottom", ".handwriting-selects"];
      return { scrollY, scrollX, scrollHeight: document.documentElement.scrollHeight, width: innerWidth, height: innerHeight,
        boxes: selectors.map(selector => { const box = document.querySelector(selector).getBoundingClientRect(); return { selector, left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height }; }) };
    });
    assert.equal(layout.scrollY, 0); assert.equal(layout.scrollX, 0);
    assert.ok(layout.scrollHeight <= size.height);
    for (const box of layout.boxes) {
      assert.ok(box.left >= -1 && box.right <= size.width + 1 && box.top >= 0 && box.bottom <= size.height + 1, JSON.stringify({ size, box }));
    }
    const paper = layout.boxes[0];
    assert.ok(paper.width >= 100 && Math.abs(paper.width - paper.height) < 1, JSON.stringify(paper));
    await page.screenshot({ path: `artifacts/qa/handwriting-${size.width}x${size.height}.png` });
    checks.push(`layout ${size.width}x${size.height}: square paper and controls in viewport`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "モードを選ぶ", exact: true }).click();
  assert.equal(await page.locator(".mode-card").count(), 6);
  assert.equal(await page.evaluate(() => localStorage.getItem("pref-puzzle:best:prefecture-national")), legacyBest);
  assert.ok((await page.locator(".mode-card").first().textContent()).includes("1:48"));
  await page.locator(".handwriting-shortcut").click();
  assert.ok((await page.locator(".handwriting-heading").textContent()).includes("1 / 47"));
  await page.reload();
  assert.equal(await page.locator(".mode-card").count(), 6);
  assert.deepEqual(errors, []);
  checks.push("return to home + persisted practice + no page errors");
  await context.close();

  const blocked = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get: () => { throw new Error("Storage denied"); } }));
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(URL);
  await dismissOnboarding(blockedPage);
  await blockedPage.locator(".handwriting-shortcut").click();
  await blockedPage.waitForSelector('.tracing-canvas[data-font-ready="true"]');
  const square = await blockedPage.locator("canvas").boundingBox();
  await blockedPage.mouse.move(square.x + square.width * 0.3, square.y + square.height * 0.5);
  await blockedPage.mouse.down();
  await blockedPage.mouse.move(square.x + square.width * 0.7, square.y + square.height * 0.5, { steps: 8 });
  await blockedPage.mouse.up();
  assert.equal(await blockedPage.getByRole("button", { name: "書けた！", exact: false }).isEnabled(), true);
  await blocked.close();
  checks.push("storage-denied browser still allows writing");
} finally { await browser.close(); }
await fs.writeFile("artifacts/qa/handwriting-results.json", JSON.stringify({ checks }, null, 2));
console.log(checks.join("\n"));
