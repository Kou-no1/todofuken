import { describe, expect, it } from "vitest";
import { prefectures } from "../data/prefectures";
import { regions } from "../data/regions";
import { fitToRegion } from "../utils/mapViewport";

describe("prefecture and region data", () => {
  it("contains all 47 prefectures", () => {
    expect(prefectures).toHaveLength(47);
    expect(new Set(prefectures.map((prefecture) => prefecture.id)).size).toBe(47);
  });

  it("defines exactly the six required region modes", () => {
    expect(regions.map((region) => region.name)).toEqual([
      "北海道・東北地方",
      "関東地方",
      "中部地方",
      "近畿地方",
      "中国・四国地方",
      "九州・沖縄地方"
    ]);
    expect(regions).toHaveLength(6);
    expect(regions.some((region) => region.name === "北陸地方")).toBe(false);
    expect(regions.some((region) => region.name === "中国地方")).toBe(false);
    expect(regions.some((region) => region.name === "四国地方")).toBe(false);
  });

  it("has the required region counts", () => {
    expect(regions.find((region) => region.id === "hokkaido-tohoku")?.prefectureIds).toHaveLength(7);
    expect(regions.find((region) => region.id === "kanto")?.prefectureIds).toHaveLength(7);
    expect(regions.find((region) => region.id === "chubu")?.prefectureIds).toHaveLength(9);
    expect(regions.find((region) => region.id === "kinki")?.prefectureIds).toHaveLength(7);
    expect(regions.find((region) => region.id === "chugoku-shikoku")?.prefectureIds).toHaveLength(9);
    expect(regions.find((region) => region.id === "kyushu-okinawa")?.prefectureIds).toHaveLength(8);
  });

  it("assigns every prefecture to exactly one region", () => {
    const regionIds = new Set(regions.map((region) => region.id));
    const assignedIds = regions.flatMap((region) => region.prefectureIds);

    expect(assignedIds).toHaveLength(47);
    expect(new Set(assignedIds).size).toBe(47);

    for (const prefecture of prefectures) {
      expect(regionIds.has(prefecture.regionId)).toBe(true);
      expect(assignedIds.filter((id) => id === prefecture.id)).toHaveLength(1);
    }
  });

  it("returns valid viewBox values for every region", () => {
    for (const region of regions) {
      const viewBox = fitToRegion(region.id);
      expect(viewBox.width).toBeGreaterThan(0);
      expect(viewBox.height).toBeGreaterThan(0);
      expect(Number.isFinite(viewBox.x)).toBe(true);
      expect(Number.isFinite(viewBox.y)).toBe(true);
    }
  });
});
