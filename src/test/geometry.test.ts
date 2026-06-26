import { describe, expect, it } from "vitest";
import { prefectureById } from "../data/prefectures";
import { containsPoint, getDropTolerance, isDropCorrect } from "../utils/geometry";
import { fitToRegion } from "../utils/mapViewport";

describe("drop geometry", () => {
  it("uses a size-aware centroid snap tolerance", () => {
    expect(getDropTolerance({ bbox: { x: 0, y: 0, width: 36, height: 22 } })).toBe(22);
    expect(getDropTolerance({ bbox: { x: 0, y: 0, width: 51.2, height: 39.3 } })).toBeCloseTo(28.296);
    expect(getDropTolerance({ bbox: { x: 0, y: 0, width: 60, height: 48 } })).toBe(32);
  });

  it("accepts a nearby silhouette centroid without making the target unlimited", () => {
    const smallTarget = {
      bbox: { x: 0, y: 0, width: 26, height: 22 },
      centroid: { x: 13, y: 11 }
    };

    expect(isDropCorrect(smallTarget, { x: 13, y: 11 })).toBe(true);
    expect(isDropCorrect(smallTarget, { x: -8.9, y: 11 })).toBe(true);
    expect(isDropCorrect(smallTarget, { x: -9.1, y: 11 })).toBe(false);
  });

  it("lets Yamagata, Oita, and Fukushima snap at their centers without accepting neighbor centers", () => {
    const cases = [
      { id: "yamagata", neighbors: ["akita", "miyagi", "fukushima", "niigata"] },
      { id: "oita", neighbors: ["fukuoka", "kumamoto", "miyazaki"] },
      { id: "fukushima", neighbors: ["miyagi", "yamagata", "niigata", "tochigi", "ibaraki"] }
    ];

    for (const item of cases) {
      const target = prefectureById.get(item.id);
      expect(target).toBeDefined();
      expect(isDropCorrect(target!, target!.centroid)).toBe(true);
      expect(
        isDropCorrect(target!, {
          x: target!.bbox.x + target!.bbox.width / 2,
          y: target!.bbox.y + target!.bbox.height / 2
        })
      ).toBe(true);

      for (const neighborId of item.neighbors) {
        const neighbor = prefectureById.get(neighborId);
        expect(neighbor).toBeDefined();
        expect(isDropCorrect(target!, neighbor!.centroid)).toBe(false);
      }
    }
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
