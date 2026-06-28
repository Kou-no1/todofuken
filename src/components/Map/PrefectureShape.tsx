import type { CSSProperties } from "react";
import { getRegionColor, type RegionColor } from "../../data/regionColors";
import type { Prefecture } from "../../types/puzzle";

type PrefectureShapeProps = {
  prefecture: Prefecture;
  isPlaced: boolean;
  isInScope: boolean;
  isTarget: boolean;
  isHinted: boolean;
  isDropPreview: boolean;
  isRecent: boolean;
  color?: RegionColor;
};

function shortName(name: string) {
  return name.replace(/[都道府県]$/, "");
}

function shouldShowLabel(prefecture: Prefecture, isRecent: boolean) {
  if (isRecent) {
    return true;
  }

  return prefecture.bbox.width >= 34 && prefecture.bbox.height >= 22;
}

export function PrefectureShape({
  prefecture,
  isPlaced,
  isInScope,
  isTarget,
  isHinted,
  isDropPreview,
  isRecent,
  color
}: PrefectureShapeProps) {
  const shapeColor = color ?? getRegionColor(prefecture.regionId);
  const label = shortName(prefecture.name);
  const labelWidth = Math.max(28, Math.min(58, label.length * 12 + 14));
  const showLabel = isPlaced && shouldShowLabel(prefecture, isRecent);
  const classNames = [
    "prefecture-shape",
    isPlaced ? "is-placed" : "",
    isInScope ? "is-in-scope" : "is-out-scope",
    isTarget ? "is-target" : "",
    isHinted ? "is-hinted" : "",
    isDropPreview ? "is-drop-preview" : "",
    isRecent ? "is-recent" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g
      className={classNames}
      style={
        {
          "--region-main": shapeColor.main,
          "--region-soft": shapeColor.soft,
          "--region-ink": shapeColor.ink,
          "--region-sparkle": shapeColor.sparkle
        } as CSSProperties
      }
    >
      <path d={prefecture.path} data-prefecture-id={prefecture.id} />
      {showLabel ? (
        <g className="prefecture-label" aria-hidden="true">
          <rect
            x={prefecture.centroid.x - labelWidth / 2}
            y={prefecture.centroid.y - 10}
            width={labelWidth}
            height="18"
            rx="9"
          />
          <text x={prefecture.centroid.x} y={prefecture.centroid.y + 3} textAnchor="middle">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
}
