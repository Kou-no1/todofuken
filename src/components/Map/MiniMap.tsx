import { JAPAN_BBOX, prefectures } from "../../data/prefectures";
import type { ViewBox } from "../../types/puzzle";

type MiniMapProps = {
  viewBox: ViewBox;
  scopeIds: Set<string>;
};

export function MiniMap({ viewBox, scopeIds }: MiniMapProps) {
  return (
    <svg
      className="mini-map"
      viewBox={`${JAPAN_BBOX.x} ${JAPAN_BBOX.y} ${JAPAN_BBOX.width} ${JAPAN_BBOX.height}`}
      aria-label="現在見ている場所"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      {prefectures.map((prefecture) => (
        <path
          key={prefecture.id}
          d={prefecture.path}
          className={scopeIds.has(prefecture.id) ? "mini-scope" : "mini-context"}
        />
      ))}
      <rect
        className="mini-view"
        x={viewBox.x}
        y={viewBox.y}
        width={viewBox.width}
        height={viewBox.height}
      />
    </svg>
  );
}
