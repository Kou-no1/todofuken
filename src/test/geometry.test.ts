import { describe, expect, it } from "vitest";
import { prefectureById } from "../data/prefectures";
import { containsPoint } from "../utils/geometry";
import { getDragLayerViewBox } from "../utils/dragGhost";
import { fitToOkinawaMainIsland, fitToRegion } from "../utils/mapViewport";
import {
  getMainlandCandidatePoints,
  HORIZONTAL_SNAP_SAMPLE_PX,
  getPrefectureHitCandidatePoints,
  VERTICAL_SNAP_SAMPLE_PX,
  VERTICAL_SNAP_STEP_PX
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

  it("uses a compact vertical sampling band for shape hit points", () => {
    expect(VERTICAL_SNAP_SAMPLE_PX).toBe(12);
    expect(VERTICAL_SNAP_STEP_PX).toBe(6);
    expect(HORIZONTAL_SNAP_SAMPLE_PX).toBe(4);
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

  it("uses display-specific drag bboxes for island-heavy ghost pieces", () => {
    const expectations = [
      { id: "tokyo", dragBbox: { x: 706.8, y: 433.6, width: 40.3, height: 16.5 } },
      { id: "nagasaki", dragBbox: { x: 314.8, y: 538.9, width: 32.9, height: 33.2 } },
      { id: "kagoshima", dragBbox: { x: 337.5, y: 588.7, width: 45.2, height: 49.6 } },
      { id: "okinawa", dragBbox: { x: 234.2, y: 810.6, width: 28.8, height: 33.1 } }
    ];

    for (const item of expectations) {
      const prefecture = prefectureById.get(item.id);
      expect(prefecture).toBeDefined();
      expect(prefecture!.dragBbox).toEqual(item.dragBbox);
    }

    const tokyo = prefectureById.get("tokyo");
    expect(tokyo).toBeDefined();
    const dragViewBox = getDragLayerViewBox(tokyo!);
    expect(dragViewBox.height).toBeLessThan(tokyo!.bbox.height);
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
    expect(viewBox.width).toBe(240);
    expect(viewBox.height).toBe(180);
    expect(viewBox.x).toBeGreaterThan(100);
  });
});
