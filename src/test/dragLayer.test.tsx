import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { prefectures } from "../data/prefectures";
import { DragLayer } from "../components/Puzzle/DragLayer";
import { getDragGhostLayerCenter, getDragGhostSnapClientPoint } from "../utils/dragGhost";

describe("drag layer offset", () => {
  const prefecture = prefectures[0];

  it("keeps the touch ghost above the finger", () => {
    const html = renderToStaticMarkup(
      <DragLayer activeDrag={{ prefectureId: prefecture.id, clientX: 200, clientY: 220, pointerType: "touch" }} prefecture={prefecture} />
    );

    expect(html).toContain("is-touch-drag");
    expect(html).toMatch(/translate\(200px,\s*120px\)/);
  });

  it("keeps the touch ghost horizontally aligned with the finger near the edge", () => {
    const layerCenter = getDragGhostLayerCenter({
      clientX: 24,
      clientY: 220,
      pointerType: "touch"
    });

    expect(layerCenter.x).toBe(24);
    expect(layerCenter.y).toBe(120);
  });

  it("keeps the mouse ghost centered near the cursor", () => {
    const html = renderToStaticMarkup(
      <DragLayer activeDrag={{ prefectureId: prefecture.id, clientX: 200, clientY: 220, pointerType: "mouse" }} prefecture={prefecture} />
    );

    expect(html).toContain("is-fine-drag");
    expect(html).toMatch(/translate\(200px,\s*220px\)/);
  });

  it("can report the visible silhouette centroid separately from the pointer", () => {
    const kagoshima = prefectures.find((item) => item.id === "kagoshima");
    expect(kagoshima).toBeDefined();

    const input = { prefectureId: kagoshima!.id, clientX: 200, clientY: 220, pointerType: "touch" };
    const layerCenter = getDragGhostLayerCenter(input);
    const snapPoint = getDragGhostSnapClientPoint(input, kagoshima!);

    expect(layerCenter.y).toBe(120);
    expect(snapPoint.y).toBeLessThan(220);
    expect(snapPoint.y).not.toBeCloseTo(layerCenter.y);
  });
});
