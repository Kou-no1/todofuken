import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { prefectures } from "../data/prefectures";
import { DragLayer } from "../components/Puzzle/DragLayer";

describe("drag layer offset", () => {
  const prefecture = prefectures[0];

  it("keeps the touch ghost above the finger", () => {
    const html = renderToStaticMarkup(
      <DragLayer activeDrag={{ prefectureId: prefecture.id, clientX: 200, clientY: 220, pointerType: "touch" }} prefecture={prefecture} />
    );

    expect(html).toContain("is-touch-drag");
    expect(html).toContain("clamp(72px, 200px, calc(100vw - 72px)), 124px");
  });

  it("keeps the mouse ghost centered near the cursor", () => {
    const html = renderToStaticMarkup(
      <DragLayer activeDrag={{ prefectureId: prefecture.id, clientX: 200, clientY: 220, pointerType: "mouse" }} prefecture={prefecture} />
    );

    expect(html).toContain("is-fine-drag");
    expect(html).toContain("clamp(28px, 200px, calc(100vw - 28px)), 220px");
  });
});
