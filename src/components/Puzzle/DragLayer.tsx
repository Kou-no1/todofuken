import type { ActiveDrag } from "../../hooks/useDragAndDrop";
import type { Prefecture } from "../../types/puzzle";
import { viewBoxToString } from "../../utils/geometry";

type DragLayerProps = {
  activeDrag: ActiveDrag | null;
  prefecture?: Prefecture;
};

export function DragLayer({ activeDrag, prefecture }: DragLayerProps) {
  if (!activeDrag || !prefecture) {
    return null;
  }

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
        transform: `translate(${activeDrag.clientX}px, ${activeDrag.clientY}px)`
      }}
      aria-hidden="true"
    >
      <svg viewBox={viewBoxToString(viewBox)} focusable="false">
        <path d={prefecture.path} />
      </svg>
      <span>{prefecture.name}</span>
    </div>
  );
}
