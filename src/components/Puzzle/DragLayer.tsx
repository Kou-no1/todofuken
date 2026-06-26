import type { CSSProperties } from "react";
import { getRegionColor } from "../../data/regionColors";
import type { ActiveDrag } from "../../hooks/useDragAndDrop";
import type { Prefecture } from "../../types/puzzle";
import { viewBoxToString } from "../../utils/geometry";

const TOUCH_DRAG_GHOST_OFFSET_Y = 96;
const FINE_DRAG_GHOST_OFFSET_Y = 0;
const TOUCH_DRAG_GHOST_EDGE_PADDING = 72;
const FINE_DRAG_GHOST_EDGE_PADDING = 28;
const TOUCH_DRAG_GHOST_MIN_Y = 84;
const FINE_DRAG_GHOST_MIN_Y = 36;

type DragLayerProps = {
  activeDrag: ActiveDrag | null;
  prefecture?: Prefecture;
};

export function DragLayer({ activeDrag, prefecture }: DragLayerProps) {
  if (!activeDrag || !prefecture) {
    return null;
  }

  const color = getRegionColor(prefecture.regionId);
  const isTouchDrag = activeDrag.pointerType === "touch";
  const offsetY = isTouchDrag ? TOUCH_DRAG_GHOST_OFFSET_Y : FINE_DRAG_GHOST_OFFSET_Y;
  const edgePadding = isTouchDrag ? TOUCH_DRAG_GHOST_EDGE_PADDING : FINE_DRAG_GHOST_EDGE_PADDING;
  const minY = isTouchDrag ? TOUCH_DRAG_GHOST_MIN_Y : FINE_DRAG_GHOST_MIN_Y;
  const ghostY = Math.max(minY, activeDrag.clientY - offsetY);
  const viewBox = {
    x: prefecture.bbox.x - 18,
    y: prefecture.bbox.y - 18,
    width: prefecture.bbox.width + 36,
    height: prefecture.bbox.height + 36
  };

  return (
    <div
      className={`drag-layer ${isTouchDrag ? "is-touch-drag" : "is-fine-drag"}`}
      style={{
        transform: `translate(clamp(${edgePadding}px, ${activeDrag.clientX}px, calc(100vw - ${edgePadding}px)), ${ghostY}px)`,
        "--drag-scale": isTouchDrag ? 1.18 : 1.08,
        "--region-main": color.main,
        "--region-soft": color.soft,
        "--region-ink": color.ink
      } as CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox={viewBoxToString(viewBox)} focusable="false">
        <path d={prefecture.path} />
      </svg>
    </div>
  );
}
