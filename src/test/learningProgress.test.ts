import { beforeEach, describe, expect, it, vi } from "vitest";
import { prefectureById } from "../data/prefectures";
import { createDailyChallenge, createReviewChallenge, getJapanDateKey, getReviewPrefectureIds, LEARNING_PROGRESS_KEY, loadLearningProgress, recordPrefecturePractice } from "../utils/learningProgress";

beforeEach(() => {
  vi.restoreAllMocks();
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }
  });
});

describe("daily five-prefecture challenge", () => {
  it("uses the Japanese calendar day rather than UTC or browser timezone", () => {
    expect(getJapanDateKey(new Date("2026-10-03T14:59:59Z"))).toBe("2026-10-03");
    expect(getJapanDateKey(new Date("2026-10-03T15:00:00Z"))).toBe("2026-10-04");
  });

  it("has five distinct valid prefectures, stable all day and changing over time", () => {
    const challenge = createDailyChallenge("2026-10-03");
    expect(challenge).toEqual(createDailyChallenge("2026-10-03"));
    expect(challenge.prefectureIds).toHaveLength(5);
    expect(new Set(challenge.prefectureIds).size).toBe(5);
    expect(challenge.prefectureIds.every((id) => prefectureById.has(id))).toBe(true);
    expect(challenge.prefectureIds).not.toEqual(createDailyChallenge("2026-10-04").prefectureIds);
  });
});

describe("local prefecture review", () => {
  it("keeps a missed prefecture until two later clean placements", () => {
    recordPrefecturePractice("tokyo", "mistake");
    recordPrefecturePractice("tokyo", "correct-after-mistake");
    expect(createReviewChallenge().prefectureIds).toEqual(["tokyo"]);
    recordPrefecturePractice("tokyo", "clean");
    expect(getReviewPrefectureIds()).toEqual(["tokyo"]);
    recordPrefecturePractice("tokyo", "clean");
    expect(getReviewPrefectureIds()).toEqual([]);
    expect(loadLearningProgress().tokyo.mistakes).toBe(1);
  });

  it("resets the clean streak on a new mistake and selects at most five", () => {
    for (const id of ["tokyo", "osaka", "kagawa", "kochi", "yamagata", "okinawa"]) recordPrefecturePractice(id, "mistake");
    recordPrefecturePractice("tokyo", "clean");
    recordPrefecturePractice("tokyo", "mistake");
    expect(loadLearningProgress().tokyo.cleanStreak).toBe(0);
    expect(createReviewChallenge().prefectureIds).toHaveLength(5);
    expect(getReviewPrefectureIds()).toHaveLength(6);
  });

  it("does not add clean prefectures or unknown IDs to review", () => {
    recordPrefecturePractice("hokkaido", "clean");
    recordPrefecturePractice("unknown", "mistake");
    expect(getReviewPrefectureIds()).toEqual([]);
    expect(loadLearningProgress().unknown).toBeUndefined();
  });

  it("ignores corrupted entries, arrays and unknown IDs", () => {
    for (const raw of ["{", "null", "[]", '{"tokyo":{"mistakes":-1}}', '{"unknown":{"mistakes":2}}']) {
      localStorage.setItem(LEARNING_PROGRESS_KEY, raw);
      expect(loadLearningProgress()).toEqual({});
    }
  });

  it("does not break gameplay when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem() { throw new Error("denied"); },
      setItem() { throw new Error("full"); }
    });
    expect(() => recordPrefecturePractice("tokyo", "mistake")).not.toThrow();
    expect(createDailyChallenge("2026-10-03").prefectureIds).toHaveLength(5);
    expect(createReviewChallenge().prefectureIds).toEqual([]);
  });
});
