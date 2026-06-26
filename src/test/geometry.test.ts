import { describe, expect, it } from "vitest";
import { prefectureById } from "../data/prefectures";
import { containsPoint } from "../utils/geometry";
import { fitToOkinawaMainIsland, fitToRegion } from "../utils/mapViewport";
import {
  getMainlandCandidatePoints,
  getPrefectureHitCandidatePoints,
  SHAPE_HIT_MARGIN_PX,
  SOUTH_SNAP_OFFSET_PX
} from "../utils/shapeHitTest";

describe("drop geometry", () => {
  it("builds multiple shape hit anchors for island-heavy prefectures", () => {
    const targetIds = ["tokyo", "nagasaki", "kagoshima", "okinawa"];

    for (const id of targetIds) {
      const prefecture = prefectureById.get(id);
      expect(prefecture).toBeDefined();

      const candidates = getPrefectureHitCandidatePoints(prefecture!);
      expect(candidates.length).toBeGreaterThan(10);
      expect(
        candidates.some((point) => Math.hypot(point.x - prefecture!.centroid.x, point.y - prefecture!.centroid.y) < 0.2)
      ).toBe(true);
    }
  });

  it("uses a small pixel margin around shape hit points", () => {
    expect(SHAPE_HIT_MARGIN_PX).toBe(18);
    expect(SOUTH_SNAP_OFFSET_PX).toBe(24);
  });

  it("prioritizes mainland anchors for small and island-heavy prefectures", () => {
    const expectations = [
      { id: "kagawa", maxHeightFromTop: 22 },
      { id: "kagoshima", maxHeightFromTop: 110 },
      { id: "tokyo", maxHeightFromTop: 30 },
      { id: "okinawa", maxHeightFromTop: 50 }
    ];

    for (const item of expectations) {
      const prefecture = prefectureById.get(item.id);
      expect(prefecture).toBeDefined();

      const mainlandCandidates = getMainlandCandidatePoints(prefecture!);
      expect(mainlandCandidates.length).toBeGreaterThan(0);
      expect(containsPoint(prefecture!.bbox, mainlandCandidates[0])).toBe(true);
      expect(mainlandCandidates[0].y - prefecture!.bbox.y).toBeLessThanOrEqual(item.maxHeightFromTop);
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

  it("zooms Okinawa drag around the main island, not the far islands", () => {
    const viewBox = fitToOkinawaMainIsland();
    const okinawa = prefectureById.get("okinawa");
    expect(okinawa).toBeDefined();

    expect(containsPoint(viewBox, okinawa!.capitalPoint ?? okinawa!.centroid)).toBe(true);
    expect(viewBox.width).toBe(152);
    expect(viewBox.height).toBe(132);
    expect(viewBox.x).toBeGreaterThan(150);
  });
});
