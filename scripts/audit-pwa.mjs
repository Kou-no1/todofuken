import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { openBrowser, dismissOnboarding } from "./browser-helpers.mjs";

const root = process.cwd();
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:4175");
    if (!url.pathname.startsWith("/todofuken/")) { res.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice("/todofuken/".length)) || "index.html";
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(filename);
    res.writeHead(200, { "Content-Type": types[path.extname(filename)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(4175, "127.0.0.1", resolve));
const browser = await openBrowser();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4175/todofuken/docs/index.html");
  await dismissOnboarding(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const manifest = await page.evaluate(async () => {
    const url = document.querySelector('link[rel="manifest"]').href;
    const data = await (await fetch(url)).json();
    return { ...data, url, icons: await Promise.all(data.icons.map(async icon => ({ ...icon, url: new URL(icon.src, url).href, status: (await fetch(new URL(icon.src, url))).status }))) };
  });
  assert.equal(manifest.start_url, "/todofuken/"); assert.equal(manifest.scope, "/todofuken/");
  assert.ok(manifest.icons.every(icon => icon.status === 200));
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find(name => name.startsWith("todofuken-pwa-")));
    return (await cache.keys()).map(request => request.url);
  });
  assert.ok(cached.some(url => /assets\/.*\.js$/.test(url)));
  assert.ok(cached.some(url => /assets\/.*\.css$/.test(url)));
  await context.setOffline(true);
  const offline = await context.newPage();
  const errors = [];
  offline.on("pageerror", e => errors.push(e.message));
  await offline.goto("http://127.0.0.1:4175/todofuken/?offline-test=1");
  await offline.waitForSelector(".mode-card");
  assert.equal(await offline.locator(".mode-card").count(), 6);
  await offline.locator(".daily-shortcut").click();
  await offline.waitForSelector(".puzzle-piece:not([disabled])");
  assert.equal(await offline.locator(".puzzle-piece").count(), 5);
  await offline.getByRole("button", { name: "モードを選ぶ", exact: true }).click();
  await offline.locator(".mode-card").filter({ hasText: "全国カラーモード" }).click();
  await offline.waitForSelector(".puzzle-piece:not([disabled])");
  assert.equal(await offline.locator(".puzzle-piece").count(), 47);
  assert.deepEqual(errors, []);
  await offline.screenshot({ path: "artifacts/qa/pwa-offline.png" });
  const result = { manifest, cached, offlineStartUrl: offline.url(), offlinePieceCount: 47, offlineDailyPieceCount: 5, errors };
  await fs.writeFile("artifacts/qa/pwa-results.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
