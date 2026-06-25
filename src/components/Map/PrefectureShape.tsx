import type { Prefecture } from "../../types/puzzle";

type PrefectureShapeProps = {
  prefecture: Prefecture;
  isPlaced: boolean;
  isInScope: boolean;
  isTarget: boolean;
  isHinted: boolean;
};

export function PrefectureShape({ prefecture, isPlaced, isInScope, isTarget, isHinted }: PrefectureShapeProps) {
  const classNames = [
    "prefecture-shape",
    isPlaced ? "is-placed" : "",
    isInScope ? "is-in-scope" : "is-out-scope",
    isTarget ? "is-target" : "",
    isHinted ? "is-hinted" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g className={classNames}>
      <path d={prefecture.path} />
      {(isPlaced || isHinted) && (
        <text x={prefecture.centroid.x} y={prefecture.centroid.y + 5} textAnchor="middle" aria-hidden="true">
          {prefecture.name.replace(/[都道府県]$/, "")}
        </text>
      )}
    </g>
  );
}
