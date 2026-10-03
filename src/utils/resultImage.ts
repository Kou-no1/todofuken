import { JAPAN_BBOX, prefectures } from "../data/prefectures";
import { getRegionColor, neutralPuzzleColor } from "../data/regionColors";
import { regionById } from "../data/regions";
import type { PuzzleResult } from "../types/puzzle";
import { getModeLabel } from "./resultLabel";
import { formatClearTime } from "./timeFormat";
import { getTimeTitle } from "./timeTitle";

export const APP_NAME = "パズルでおぼえる「都道府県」";
export const PUBLIC_APP_URL = "https://kou-no1.github.io/todofuken/";

export async function createResultImage(result: PuzzleResult, totalCount: number): Promise<Blob> {
  // Font loading is bounded; offline exports also work with installed Japanese fonts.
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 500))]);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const ink = "#27324a";
  const font = '"M PLUS Rounded 1c", "Yu Gothic", "Meiryo", sans-serif';
  const text = (value: string, x: number, y: number, size: number, maxWidth: number, color = ink) => {
    ctx.font = `900 ${size}px ${font}`;
    while (ctx.measureText(value).width > maxWidth && size > 14) {
      size -= 1;
      ctx.font = `900 ${size}px ${font}`;
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(value, x, y);
  };
  const box = (x: number, y: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 24);
    ctx.fill();
  };
  ctx.fillStyle = "#fffdf4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#dff3ef";
  ctx.lineWidth = 2;
  for (let x = 0; x < 1080; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1350); ctx.stroke();
  }
  for (let y = 0; y < 1350; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke();
  }
  box(60, 44, 960, 12, "#00C8E0");
  box(720, 44, 300, 12, "#FF6B1A");
  text("パズルでおぼえる", 540, 118, 38, 920);
  text("「都道府県」", 540, 210, 84, 920);
  const modeLabel = getModeLabel(result.mode, result.regionId);
  text(result.dateKey ? `${modeLabel} · ${result.dateKey}` : modeLabel, 540, 270, 34, 920);
  text("クリア！", 540, 348, 65, 920, "#087d8b");
  text(result.mode === "prefecture-national" ? getTimeTitle(result.clearTimeSeconds).title : "最後までできたね！", 540, 399, 33, 920);
  const stats = [
    { label: "タイム", value: formatClearTime(result.clearTimeSeconds), color: "#dff7ff" },
    { label: "できた数", value: `${totalCount}`, color: "#fff0b9" },
    { label: "ミス", value: `${result.mistakes}回`, color: "#ffe6f0" }
  ];
  stats.forEach((stat, index) => {
    const x = 60 + index * 326;
    box(x, 434, 308, 136, stat.color);
    text(stat.label, x + 154, 478, 27, 280);
    text(stat.value, x + 154, 535, 43, 280);
  });
  const ids = new Set(result.prefectureIds ?? regionById.get(result.regionId ?? "")?.prefectureIds ?? prefectures.map((p) => p.id));
  const mapWidth = 890;
  const mapHeight = 550;
  const scale = Math.min(mapWidth / JAPAN_BBOX.width, mapHeight / JAPAN_BBOX.height);
  ctx.save();
  ctx.translate(95 + (mapWidth - JAPAN_BBOX.width * scale) / 2, 600 + (mapHeight - JAPAN_BBOX.height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-JAPAN_BBOX.x, -JAPAN_BBOX.y);
  for (const prefecture of prefectures) {
    const path = new Path2D(prefecture.path);
    ctx.fillStyle = !ids.has(prefecture.id) ? "#e5e9ed" : result.mode === "prefecture-national" ? neutralPuzzleColor.main : getRegionColor(prefecture.regionId).main;
    ctx.fill(path, "evenodd");
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8 / scale;
    ctx.stroke(path);
  }
  ctx.restore();
  text(result.isNewBest ? "じぶんのベストこうしん！" : "またちょうせんしよう！", 540, 1200, 35, 920, "#087d8b");
  text("いっしょに日本地図にちょうせん！", 540, 1250, 29, 920);
  text(PUBLIC_APP_URL, 540, 1300, 24, 950);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG unavailable")), "image/png"));
}
