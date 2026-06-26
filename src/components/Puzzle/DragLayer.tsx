import type { CSSProperties } from "react";
import { getRegionColor } from "../../data/regionColors";
import type { ActiveDrag } from "../../hooks/useDragAndDrop";
import type { Prefecture } from "../../types/puzzle";
import { getDragGhostLayerCenter, getDragGhostMetrics, getDragLayerViewBox } from "../../utils/dragGhost";
import { viewBoxToString } from "../../utils/geometry";

type DragLayerProps = {
  activeDrag: ActiveDrag | null;
  prefecture?: Prefecture;
};

export function DragLayer({ activeDrag, prefecture }: DragLayerProps) {
  if (!activeDrag || !prefecture) {
    return null;
  }

  const color = getRegionColor(prefecture.regionId);
  const metrics = getDragGhostMetrics(activeDrag.pointerType);
  const layerCenter = getDragGhostLayerCenter(activeDrag);
  const viewBox = getDragLayerViewBox(prefecture);

  return (
    <div
      className={`drag-layer ${metrics.isTouchDrag ? "is-touch-drag" : "is-fine-drag"}`}
      style={{
        transform: `translate(${layerCenter.x}px, ${layerCenter.y}px) translate(-50%, -50%) scale(${metrics.scale})`,
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
