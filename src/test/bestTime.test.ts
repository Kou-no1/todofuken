import { beforeEach, describe, expect, it } from "vitest";
import { getBestTimeKey, loadBestTime, saveBestTimeIfImproved } from "../hooks/useBestTime";

class LocalStorageMock {
  private store = new Map<string, string>();

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new LocalStorageMock(),
  configurable: true
});

describe("best time storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores national, region, and capital quiz records separately", () => {
    saveBestTimeIfImproved("prefecture-national", undefined, 100, 2);
    saveBestTimeIfImproved("prefecture-region", "chubu", 40, 0);
    saveBestTimeIfImproved("prefecture-region", "kanto", 45, 1);
    saveBestTimeIfImproved("prefecture-learn-region", "chubu", 70, 0);
    saveBestTimeIfImproved("capital-quiz", undefined, 80, 3);

    expect(loadBestTime("prefecture-national")?.bestTimeSeconds).toBe(100);
    expect(loadBestTime("prefecture-region", "chubu")?.bestTimeSeconds).toBe(40);
    expect(loadBestTime("prefecture-region", "kanto")?.bestTimeSeconds).toBe(45);
    expect(loadBestTime("prefecture-learn-region", "chubu")?.bestTimeSeconds).toBe(70);
    expect(loadBestTime("capital-quiz")?.bestTimeSeconds).toBe(80);
    expect(getBestTimeKey("prefecture-region", "chubu")).toBe("pref-puzzle:best:prefecture-region:chubu");
    expect(getBestTimeKey("prefecture-learn-region", "chubu")).toBe("pref-puzzle:best:prefecture-learn-region:chubu");
    expect(getBestTimeKey("capital-quiz")).toBe("pref-puzzle:best:capital-quiz:national");
  });

  it("keeps the better record", () => {
    expect(saveBestTimeIfImproved("prefecture-national", undefined, 90, 2).isNewBest).toBe(true);
    expect(saveBestTimeIfImproved("prefecture-national", undefined, 120, 0).isNewBest).toBe(false);
    expect(saveBestTimeIfImproved("prefecture-national", undefined, 80, 4).isNewBest).toBe(true);
    expect(loadBestTime("prefecture-national")?.bestTimeSeconds).toBe(80);
  });
});
