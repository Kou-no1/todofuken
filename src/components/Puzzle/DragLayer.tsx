import type { CSSProperties } from "react";
import { getRegionColor } from "../../data/regionColors";
import type { ActiveDrag } from "../../hooks/useDragAndDrop";
import type { Prefecture } from "../../types/puzzle";
import { viewBoxToString } from "../../utils/geometry";

const DRAG_GHOST_OFFSET_Y = 58;

type DragLayerProps = {
  activeDrag: ActiveDrag | null;
  prefecture?: Prefecture;
};

export function DragLayer({ activeDrag, prefecture }: DragLayerProps) {
  if (!activeDrag || !prefecture) {
    return null;
  }

  const color = getRegionColor(prefecture.regionId);
  const viewBox = {
    x: prefecture.bbox.x - 12,
    y: prefecture.bbox.y - 12,
    width: prefecture.bbox.width + 24,
    height: prefecture.bbox.height + 24
  };

  return (
    <div
      className="drag-layer"
      style={{
        transform: `translate(${activeDrag.clientX}px, ${activeDrag.clientY - DRAG_GHOST_OFFSET_Y}px)`,
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
