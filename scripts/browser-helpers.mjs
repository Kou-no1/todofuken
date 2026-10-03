import { createRequire } from "node:module";
import path from "node:path";

export function getPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    const packages = process.env.BROWSER_NODE_MODULES ?? path.join(process.env.USERPROFILE ?? process.env.HOME ?? ".",
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
    return require(path.join(packages, "playwright"));
  }
}

export async function openBrowser() {
  return getPlaywright().chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined)
  });
}

export async function dismissOnboarding(page) {
  const skip = page.getByRole("button", { name: "スキップ", exact: true });
  if (await skip.isVisible()) await skip.click();
}

export async function startPuzzle(page, card = "全国カラーモード", region) {
  await page.goto(process.env.APP_URL ?? "http://127.0.0.1:5174/");
  await dismissOnboarding(page);
  await page.locator(".mode-card").filter({ hasText: card }).click();
  if (region) await page.locator(".region-card").filter({ hasText: region }).click();
  await page.waitForSelector(".puzzle-piece:not([disabled])");
}

// Use the actual SVG matrices from BOTH rendered paths, including CSS transforms.
// No game state, hit-test implementation or coordinate mocks are used to place pieces.
export async function dragPiece(page, id, { touch = false, zoom = "normal", dy = 0, slow = false } = {}) {
  const name = await page.evaluate(async (id) => {
    const { prefectureById } = await import("/src/data/prefectures.ts");
    return prefectureById.get(id).name;
  }, id);
  const piece = page.getByRole("button", { name: `${name}のピース`, exact: true });
  await piece.scrollIntoViewIfNeeded();
  const box = await piece.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const session = touch ? await page.context().newCDPSession(page) : null;
  const touchPoint = (p) => ({ x: p.x, y: p.y, radiusX: 7, radiusY: 7, force: 1, id: 1 });
  if (touch) await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touchPoint(start)] });
  else { await page.mouse.move(start.x, start.y); await page.mouse.down(); }
  await page.waitForSelector(".drag-layer");
  if (id === "okinawa") await page.waitForTimeout(320);
  if (zoom !== "normal") {
    await page.evaluate((zoom) => document.querySelector(`[aria-label="${zoom === "in" ? "ズームイン" : "ズームアウト"}"]`).click(), zoom);
    await page.waitForTimeout(60);
  }
  const destination = await page.evaluate(async ({ id, touch, dy, start }) => {
    const { prefectureById } = await import("/src/data/prefectures.ts");
    const { getPrefectureHitCandidatePoints } = await import("/src/utils/shapeHitTest.ts");
    const target = document.querySelector(`.japan-map path[data-prefecture-id="${id}"]`);
    const ghost = document.querySelector(".drag-layer path");
    const anchor = getPrefectureHitCandidatePoints(prefectureById.get(id)).find(p => target.isPointInFill(new DOMPoint(p.x, p.y)));
    if (!anchor) throw new Error(`No internal point: ${id}`);
    const mapPoint = new DOMPoint(anchor.x, anchor.y).matrixTransform(target.getScreenCTM());
    const ghostPoint = new DOMPoint(anchor.x, anchor.y).matrixTransform(ghost.getScreenCTM());
    return { x: start.x + mapPoint.x - ghostPoint.x, y: start.y + mapPoint.y - ghostPoint.y + dy };
  }, { id, touch, dy, start });
  const steps = slow ? 28 : 4;
  for (let i = 1; i <= steps; i++) {
    const next = { x: start.x + (destination.x - start.x) * i / steps, y: start.y + (destination.y - start.y) * i / steps };
    if (touch) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [touchPoint(next)] });
    else await page.mouse.move(next.x, next.y);
    await page.waitForTimeout(slow ? 28 : 16);
  }
  if (slow) await page.waitForTimeout(170);
  if (touch) { await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await session.detach(); }
  else await page.mouse.up();
  await page.waitForTimeout(slow ? 480 : 45);
  if (await piece.count()) throw new Error(`Drop failed: ${id}, ${touch ? "touch" : "mouse"}, ${zoom}, dy=${dy}`);
}
