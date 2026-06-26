import { describe, expect, it } from "vitest";
import { prefectureById } from "../data/prefectures";
import { containsPoint, getDropTolerance, isDropCorrect } from "../utils/geometry";
import { fitToRegion } from "../utils/mapViewport";

describe("drop geometry", () => {
  it("gives small prefectures a little more drop tolerance", () => {
    expect(getDropTolerance({ bbox: { x: 0, y: 0, width: 36, height: 22 } })).toBe(38);
    expect(getDropTolerance({ bbox: { x: 0, y: 0, width: 26, height: 32 } })).toBe(34);
    expect(getDropTolerance({ bbox: { x: 0, y: 0, width: 60, height: 48 } })).toBe(28);
  });

  it("accepts a nearby release point for a small prefecture without making the target unlimited", () => {
    const smallTarget = {
      bbox: { x: 0, y: 0, width: 26, height: 22 },
      centroid: { x: 13, y: 11 }
    };

    expect(isDropCorrect(smallTarget, { x: -34, y: 11 })).toBe(true);
    expect(isDropCorrect(smallTarget, { x: -48, y: 11 })).toBe(false);
  });
});

describe("region viewport", () => {
  it("zooms Kyushu and Okinawa around mainland Kyushu and Okinawa main island", () => {
    const viewBox = fitToRegion("kyushu-okinawa", 110);
    const targetIds = ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa"];

    for (const id of targetIds) {
      const prefecture = prefectureById.get(id);
      expect(prefecture).toBeDefined();
      expect(containsPoint(viewBox, prefecture!.centroid)).toBe(true);
    }

    expect(viewBox.x).toBeGreaterThan(100);
    expect(viewBox.width).toBeLessThan(460);
  });
});
