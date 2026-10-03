import fs from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { getPlaywright, openBrowser, dismissOnboarding } from "./browser-helpers.mjs";

const urls = ["https://kou-no1.github.io/todofuken/", "https://manabitane.jp/todofuken/"];
const results = [];
for (const url of urls) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    results.push({ requested: url, resolved: response.url, status: response.status,
      redirect: html.split("\n").find(line => line.includes("if (location.")),
      assets: html.match(/assets\/index[^" ]+/g) });
  } catch (error) { results.push({ requested: url, error: error.message }); }
}
const verify = process.argv.includes("--verify");
const browser = verify ? null : await openBrowser();
try {
  for (const url of urls) {
    // Browser.newContext is incognito, where Chrome intentionally disallows installation.
    // Verify installability in our own ordinary profile, never the user's Chrome profile.
    const context = verify
      ? await getPlaywright().chromium.launchPersistentContext(path.resolve(`artifacts/qa/pwa-profile-${new URL(url).hostname}-${Date.now()}`), {
          headless: true, viewport: { width: 390, height: 844 },
          executablePath: process.env.CHROME_PATH ?? (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined)
        })
      : await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await dismissOnboarding(page);
      const manifest = await page.evaluate(async () => {
        const element = document.querySelector('link[rel="manifest"]');
        if (!element) return null;
        const data = await (await fetch(element.href)).json();
        return { url: element.href, start_url: data.start_url, scope: data.scope,
          icons: await Promise.all(data.icons.map(async icon => ({ url: new URL(icon.src, element.href).href, status: (await fetch(new URL(icon.src, element.href))).status }))) };
      });
      results.push({ browserRequested: url, resolved: page.url(), cards: await page.locator(".mode-card").count(), errors, manifest });
      if (process.argv.includes("--verify")) {
        assert.equal(await page.locator(".mode-card").count(), 6);
        assert.equal(await page.locator(".learning-shortcut").count(), 2);
        assert.equal(new URL(page.url()).protocol, "https:");
        assert.equal(manifest.icons.every(icon => icon.status === 200), true);
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.waitForFunction(() => !!navigator.serviceWorker.controller);
        const cdp = await context.newCDPSession(page);
        const installability = await cdp.send("Page.getInstallabilityErrors");
        assert.deepEqual(installability.installabilityErrors, []);
        await context.setOffline(true);
        const offline = await context.newPage();
        await offline.goto(new URL("/todofuken/?offline-public=1", page.url()).href);
        await offline.waitForSelector(".mode-card");
        assert.equal(await offline.locator(".mode-card").count(), 6);
        await offline.locator(".daily-shortcut").click();
        await offline.waitForSelector(".puzzle-piece:not([disabled])");
        assert.equal(await offline.locator(".puzzle-piece").count(), 5);
        results.push({ origin: new URL(page.url()).origin, installability, offlineCards: 6, offlineDailyPieces: 5, secure: true });
      }
      await page.screenshot({ path: `artifacts/qa/public-${new URL(url).hostname}.png` });
    } catch (error) {
      results.push({ browserRequested: url, error: error.message, errors });
      if (process.argv.includes("--verify")) process.exitCode = 1;
    }
    await context.close();
  }
} finally { await browser?.close(); }
await fs.writeFile(`artifacts/qa/public-results${process.argv.includes("--verify") ? "-verified" : ""}.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
