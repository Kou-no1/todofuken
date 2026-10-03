import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const output = process.argv[2];
if (!output || !["docs", "dist"].includes(output)) throw new Error("Expected docs or dist output");
const files = await fs.readdir(output, { recursive: true });
const assets = files.filter(name => /\.(js|css|png|woff2|webmanifest)$/.test(name) && name !== "sw.js").sort();
const html = await fs.readFile(path.join(output, "index.html"), "utf8");
const hash = createHash("sha256").update(html);
for (const file of assets) hash.update(await fs.readFile(path.join(output, file)));
const version = hash.digest("hex").slice(0, 16);
const entry = output === "docs" ? "./docs/index.html" : "./index.html";
const prefix = output === "docs" ? "./docs/" : "./";
const precache = ["./", "./index.html", entry, ...assets.map(name => prefix + name.replaceAll("\\", "/"))];
const template = await fs.readFile("public/sw.js", "utf8");
const worker = template
  .replace('"todofuken-pwa-development"', JSON.stringify(`todofuken-pwa-${version}`))
  .replace('const APP_ENTRY = "./index.html";', `const APP_ENTRY = ${JSON.stringify(entry)};`)
  .replace("const PRECACHE_ASSETS = [];", `const PRECACHE_ASSETS = ${JSON.stringify([...new Set(precache)], null, 2)};`);
await fs.writeFile(path.join(output, "sw.js"), worker);
// GitHub Pages registers the worker at /todofuken/sw.js above docs/.
if (output === "docs") await fs.writeFile("sw.js", worker);
console.log(`PWA ${version}: precached ${new Set(precache).size} files`);
