import { describe, expect, it } from "vitest";
import { prefectureById } from "../data/prefectures";
import { containsPoint } from "../utils/geometry";
import { fitToRegion } from "../utils/mapViewport";
import { getPrefectureHitCandidatePoints, SHAPE_HIT_MARGIN_PX } from "../utils/shapeHitTest";

describe("drop geometry", () => {
  it("builds multiple shape hit anchors for island-heavy prefectures", () => {
    const targetIds = ["tokyo", "nagasaki", "kagoshima", "okinawa"];

    for (const id of targetIds) {
      const prefecture = prefectureById.get(id);
      expect(prefecture).toBeDefined();

      const candidates = getPrefectureHitCandidatePoints(prefecture!);
      expect(candidates.length).toBeGreaterThan(10);
      expect(candidates).toContainEqual(prefecture!.centroid);
    }
  });

  it("uses a small pixel margin around shape hit points", () => {
    expect(SHAPE_HIT_MARGIN_PX).toBe(10);
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
