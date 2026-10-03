import { prefectureById, prefectures } from "../data/prefectures";
import type { PuzzleChallenge } from "../types/puzzle";
import { readStoredValue, writeStoredValue } from "./storage";

export const LEARNING_PROGRESS_KEY = "pref-puzzle:learning:v1";

export type PrefectureProgress = {
  mistakes: number;
  cleanStreak: number;
  needsReview: boolean;
  lastPracticedAt: string;
};

export type LearningProgress = Record<string, PrefectureProgress>;

export function getJapanDateKey(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function createDailyChallenge(dateKey = getJapanDateKey()): PuzzleChallenge & { kind: "daily" } {
  let seed = 2166136261;
  for (const char of `daily-v1:${dateKey}`) {
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  const ids = prefectures.map((prefecture) => prefecture.id);
  // A seeded shuffle keeps the same five prefectures all day, including offline.
  for (let index = ids.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = Math.floor((seed / 4294967296) * (index + 1));
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }
  return { kind: "daily", dateKey, prefectureIds: ids.slice(0, 5) };
}

export function loadLearningProgress(): LearningProgress {
  try {
    const value: unknown = JSON.parse(readStoredValue(LEARNING_PROGRESS_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const progress: LearningProgress = {};
    for (const [id, entry] of Object.entries(value)) {
      if (!prefectureById.has(id) || !entry || typeof entry !== "object") continue;
      const item = entry as PrefectureProgress;
      if (!Number.isSafeInteger(item.mistakes) || item.mistakes < 0 ||
          !Number.isInteger(item.cleanStreak) || item.cleanStreak < 0 || item.cleanStreak > 2 ||
          typeof item.needsReview !== "boolean" || typeof item.lastPracticedAt !== "string" ||
          !Number.isFinite(Date.parse(item.lastPracticedAt))) continue;
      progress[id] = item;
    }
    return progress;
  } catch {
    return {};
  }
}

export function recordPrefecturePractice(prefectureId: string, outcome: "mistake" | "clean" | "correct-after-mistake") {
  if (!prefectureById.has(prefectureId)) return;
  const progress = loadLearningProgress();
  const previous = progress[prefectureId] ?? { mistakes: 0, cleanStreak: 0, needsReview: false, lastPracticedAt: "" };
  const cleanStreak = outcome === "clean" ? Math.min(2, previous.cleanStreak + 1) : 0;
  progress[prefectureId] = {
    mistakes: previous.mistakes + (outcome === "mistake" ? 1 : 0),
    cleanStreak,
    needsReview: outcome === "mistake" || (previous.needsReview && cleanStreak < 2),
    lastPracticedAt: new Date().toISOString()
  };
  writeStoredValue(LEARNING_PROGRESS_KEY, JSON.stringify(progress));
}

export function getReviewPrefectureIds(progress = loadLearningProgress()): string[] {
  return Object.entries(progress)
    .filter(([id, entry]) => prefectureById.has(id) && entry.needsReview)
    .sort(([idA, a], [idB, b]) =>
      a.cleanStreak - b.cleanStreak || Date.parse(a.lastPracticedAt) - Date.parse(b.lastPracticedAt) || idA.localeCompare(idB))
    .map(([id]) => id);
}

export function createReviewChallenge(): PuzzleChallenge & { kind: "review" } {
  return { kind: "review", prefectureIds: getReviewPrefectureIds().slice(0, 5) };
}
