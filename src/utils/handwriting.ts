import { prefectures, prefectureById } from "../data/prefectures";
import type { HandwritingKind, HandwritingProgress, HandwritingWord, InkPoint } from "../types/handwriting";
import { readStoredValue, writeStoredValue } from "./storage";

export const HANDWRITING_PROGRESS_KEY = "pref-puzzle:handwriting:v1";

export function getHandwritingWords(kind: HandwritingKind, regionId?: string): HandwritingWord[] {
  return prefectures.filter(p => !regionId || p.regionId === regionId).map(p => ({
    prefectureId: p.id,
    regionId: p.regionId,
    text: kind === "prefecture" ? p.name : p.capital,
    kana: kind === "prefecture" ? p.kana : p.capitalKana,
    prefectureName: p.name,
    prefectureKana: p.kana
  }));
}

export function loadHandwritingProgress(): HandwritingProgress {
  const result: HandwritingProgress = { prefecture: [], capital: [] };
  try {
    const value: unknown = JSON.parse(readStoredValue(HANDWRITING_PROGRESS_KEY) ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return result;
    for (const kind of ["prefecture", "capital"] as const) {
      const list = (value as Record<string, unknown>)[kind];
      if (Array.isArray(list)) {
        result[kind] = [...new Set(list.filter((id): id is string => typeof id === "string" && prefectureById.has(id)))];
      }
    }
  } catch { /* Practice still works when storage is unavailable or damaged. */ }
  return result;
}

export function markHandwritingPracticed(kind: HandwritingKind, id: string): {
  progress: HandwritingProgress; saved: boolean;
} {
  const progress = loadHandwritingProgress();
  if (!prefectureById.has(id)) return { progress, saved: false };
  if (!progress[kind].includes(id)) progress[kind].push(id);
  return { progress, saved: writeStoredValue(HANDWRITING_PROGRESS_KEY, JSON.stringify(progress)) };
}

// Store ink in unit-square coordinates so resizing and rotating never move it.
export function getInkPoint(clientX: number, clientY: number, rect: {
  left: number; top: number; width: number; height: number;
}): InkPoint | null {
  if (rect.width <= 0 || rect.height <= 0 || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  return {
    x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
  };
}
