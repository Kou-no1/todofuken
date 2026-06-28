import type { CSSProperties, PointerEvent } from "react";
import { getRegionColor, type RegionColor } from "../../data/regionColors";
import type { Prefecture } from "../../types/puzzle";
import { viewBoxToString } from "../../utils/geometry";

type PuzzlePieceProps = {
  prefecture: Prefecture;
  disabled?: boolean;
  isWobbling?: boolean;
  color?: RegionColor;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, prefecture: Prefecture) => void;
};

export function PuzzlePiece({ prefecture, disabled = false, isWobbling = false, color, onPointerDown }: PuzzlePieceProps) {
  const pieceColor = color ?? getRegionColor(prefecture.regionId);
  const pieceViewBox = {
    x: prefecture.bbox.x - 10,
    y: prefecture.bbox.y - 10,
    width: prefecture.bbox.width + 20,
    height: prefecture.bbox.height + 20
  };

  return (
    <button
      type="button"
      className={`puzzle-piece${isWobbling ? " is-wobbling" : ""}`}
      style={
        {
          "--region-main": pieceColor.main,
          "--region-soft": pieceColor.soft,
          "--region-ink": pieceColor.ink,
          "--region-sparkle": pieceColor.sparkle
        } as CSSProperties
      }
      disabled={disabled}
      onPointerDown={(event) => onPointerDown(event, prefecture)}
      aria-label={`${prefecture.name}のピース`}
    >
      <svg viewBox={viewBoxToString(pieceViewBox)} aria-hidden="true" focusable="false">
        <path d={prefecture.path} />
      </svg>
      <span>{prefecture.name}</span>
    </button>
  );
}
