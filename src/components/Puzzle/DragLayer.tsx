import type { CSSProperties } from "react";
import { getRegionColor } from "../../data/regionColors";
import type { ActiveDrag } from "../../hooks/useDragAndDrop";
import type { Prefecture } from "../../types/puzzle";
import { viewBoxToString } from "../../utils/geometry";

const DRAG_GHOST_OFFSET_Y = 96;
const DRAG_GHOST_EDGE_PADDING = 72;
const DRAG_GHOST_MIN_Y = 84;

type DragLayerProps = {
  activeDrag: ActiveDrag | null;
  prefecture?: Prefecture;
};

export function DragLayer({ activeDrag, prefecture }: DragLayerProps) {
  if (!activeDrag || !prefecture) {
    return null;
  }

  const color = getRegionColor(prefecture.regionId);
  const ghostY = Math.max(DRAG_GHOST_MIN_Y, activeDrag.clientY - DRAG_GHOST_OFFSET_Y);
  const viewBox = {
    x: prefecture.bbox.x - 18,
    y: prefecture.bbox.y - 18,
    width: prefecture.bbox.width + 36,
    height: prefecture.bbox.height + 36
  };

  return (
    <div
      className="drag-layer"
      style={{
        transform: `translate(clamp(${DRAG_GHOST_EDGE_PADDING}px, ${activeDrag.clientX}px, calc(100vw - ${DRAG_GHOST_EDGE_PADDING}px)), ${ghostY}px)`,
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
