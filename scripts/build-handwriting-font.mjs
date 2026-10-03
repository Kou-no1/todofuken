import fs from "node:fs/promises";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

// Google's text endpoint subsets only the glyphs used by the two practice lists.
const source = await fs.readFile("src/data/prefectures.ts", "utf8");
const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } });
const { prefectures } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const text = [...new Set(prefectures.flatMap(p => [...p.name, ...p.capital]))].sort().join("");
const cssResponse = await fetch(`https://fonts.googleapis.com/css2?family=Klee+One:wght@600&text=${encodeURIComponent(text)}`, {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" }
});
if (!cssResponse.ok) throw new Error(`Font CSS: ${cssResponse.status}`);
const css = await cssResponse.text();
const url = css.match(/url\((https:\/\/[^)]+)\) format\('woff2'\)/)?.[1];
if (!url) throw new Error(`Expected WOFF2 font: ${css}`);
const fontResponse = await fetch(url);
if (!fontResponse.ok) throw new Error(`Font: ${fontResponse.status}`);
const bytes = Buffer.from(await fontResponse.arrayBuffer());
if (bytes.subarray(0, 4).toString() !== "wOF2") throw new Error("Invalid WOFF2 signature");
const licenseResponse = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/kleeone/OFL.txt");
if (!licenseResponse.ok) throw new Error(`License: ${licenseResponse.status}`);
await fs.mkdir("src/assets", { recursive: true });
await fs.mkdir("public/fonts", { recursive: true });
await fs.writeFile("src/assets/handwriting-guide.woff2", bytes);
await fs.writeFile("public/fonts/OFL-KleeOne.txt", (await licenseResponse.text()).replace(/[ \t]+$/gm, ""));
console.log(`Handwriting guide: ${text.length} glyphs, ${bytes.length} bytes`);
