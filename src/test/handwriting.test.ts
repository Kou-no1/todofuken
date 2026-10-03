import { beforeEach, describe, expect, it, vi } from "vitest";
import { regions } from "../data/regions";
import { getHandwritingWords, getInkPoint, HANDWRITING_PROGRESS_KEY, loadHandwritingProgress, markHandwritingPracticed } from "../utils/handwriting";

beforeEach(() => {
  vi.restoreAllMocks();
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }
  });
});

describe("handwriting word lists", () => {
  it("keeps 47 kanji names and their readings in both practice lists", () => {
    for (const kind of ["prefecture", "capital"] as const) {
      const words = getHandwritingWords(kind);
      expect(words).toHaveLength(47);
      expect(new Set(words.map(w => w.prefectureId)).size).toBe(47);
      expect(words.every(w => w.text.length > 0 && w.kana.length > 0)).toBe(true);
    }
    expect(getHandwritingWords("capital")[0].text).toBe("札幌市");
    expect(getHandwritingWords("capital").find(w => w.prefectureId === "tokyo")?.text).toBe("新宿区");
  });

  it("uses the existing six learning regions without changing data", () => {
    for (const kind of ["prefecture", "capital"] as const) {
      expect(regions.map(r => getHandwritingWords(kind, r.id).length)).toEqual([7, 7, 9, 7, 9, 8]);
      for (const region of regions) expect(getHandwritingWords(kind, region.id).every(w => w.regionId === region.id)).toBe(true);
    }
  });
});

describe("handwriting practice records", () => {
  it("saves unique practiced names separately and leaves timed records untouched", () => {
    localStorage.setItem("pref-puzzle:best:prefecture-national", "existing-best");
    markHandwritingPracticed("prefecture", "hokkaido");
    markHandwritingPracticed("prefecture", "hokkaido");
    markHandwritingPracticed("capital", "tokyo");
    expect(loadHandwritingProgress()).toEqual({ prefecture: ["hokkaido"], capital: ["tokyo"] });
    expect(localStorage.getItem("pref-puzzle:best:prefecture-national")).toBe("existing-best");
  });

  it("validates damaged storage and unknown IDs", () => {
    for (const value of ["{", "null", "[]", '"text"', '{"prefecture":42}']) {
      localStorage.setItem(HANDWRITING_PROGRESS_KEY, value);
      expect(loadHandwritingProgress()).toEqual({ prefecture: [], capital: [] });
    }
    localStorage.setItem(HANDWRITING_PROGRESS_KEY, '{"prefecture":["tokyo","tokyo",null,"unknown"],"capital":["osaka"]}');
    expect(loadHandwritingProgress()).toEqual({ prefecture: ["tokyo"], capital: ["osaka"] });
    expect(markHandwritingPracticed("prefecture", "unknown").saved).toBe(false);
  });

  it("does not crash if storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); }
    });
    expect(markHandwritingPracticed("prefecture", "hokkaido")).toEqual({
      progress: { prefecture: ["hokkaido"], capital: [] }, saved: false
    });
  });
});

describe("normalized canvas coordinates", () => {
  it("represents the same ink position before and after resizing", () => {
    expect(getInkPoint(160, 250, { left: 10, top: 100, width: 300, height: 300 })).toEqual({ x: 0.5, y: 0.5 });
    expect(getInkPoint(320, 500, { left: 20, top: 200, width: 600, height: 600 })).toEqual({ x: 0.5, y: 0.5 });
  });
  it("clips captured outside strokes and rejects invalid coordinates", () => {
    expect(getInkPoint(-100, 1000, { left: 0, top: 0, width: 300, height: 300 })).toEqual({ x: 0, y: 1 });
    expect(getInkPoint(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
    expect(getInkPoint(NaN, 10, { left: 0, top: 0, width: 300, height: 300 })).toBeNull();
  });
});
