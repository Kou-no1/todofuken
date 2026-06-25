import type { RefObject } from "react";
import { prefectures } from "../../data/prefectures";
import type { ViewBox } from "../../types/puzzle";
import { viewBoxToString } from "../../utils/geometry";
import { PrefectureShape } from "./PrefectureShape";

type JapanMapProps = {
  svgRef: RefObject<SVGSVGElement | null>;
  viewBox: ViewBox;
  placedIds: Set<string>;
  scopeIds: Set<string>;
  targetId?: string;
  hintedId?: string;
};

export function JapanMap({ svgRef, viewBox, placedIds, scopeIds, targetId, hintedId }: JapanMapProps) {
  return (
    <svg
      ref={svgRef}
      className="japan-map"
      viewBox={viewBoxToString(viewBox)}
      role="img"
      aria-label="日本地図パズル"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="hint-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect className="map-sea" x="-80" y="-40" width="1320" height="1080" rx="30" />
      <g>
        {prefectures.map((prefecture) => (
          <PrefectureShape
            key={prefecture.id}
            prefecture={prefecture}
            isPlaced={placedIds.has(prefecture.id)}
            isInScope={scopeIds.has(prefecture.id)}
            isTarget={targetId === prefecture.id}
            isHinted={hintedId === prefecture.id}
          />
        ))}
      </g>
    </svg>
  );
}
