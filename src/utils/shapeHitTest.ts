import type { Point, Prefecture } from "../types/puzzle";
import { getDragGhostClientPointForMapPoint, type DragPointInput } from "./dragGhost";

export const SHAPE_HIT_MARGIN_PX = 10;

const HIT_OFFSET_PIXELS: Point[] = [
  { x: 0, y: 0 },
  { x: SHAPE_HIT_MARGIN_PX, y: 0 },
  { x: -SHAPE_HIT_MARGIN_PX, y: 0 },
  { x: 0, y: SHAPE_HIT_MARGIN_PX },
  { x: 0, y: -SHAPE_HIT_MARGIN_PX },
  { x: SHAPE_HIT_MARGIN_PX * 0.7, y: SHAPE_HIT_MARGIN_PX * 0.7 },
  { x: -SHAPE_HIT_MARGIN_PX * 0.7, y: SHAPE_HIT_MARGIN_PX * 0.7 },
  { x: SHAPE_HIT_MARGIN_PX * 0.7, y: -SHAPE_HIT_MARGIN_PX * 0.7 },
  { x: -SHAPE_HIT_MARGIN_PX * 0.7, y: -SHAPE_HIT_MARGIN_PX * 0.7 }
];

const GRID_RATIOS = [0.2, 0.35, 0.5, 0.65, 0.8];
const MAX_INTERNAL_ANCHORS = 14;

type ShapeHitResult = {
  isHit: boolean;
  clientPoint: Point;
};

function getPrefecturePath(prefectureId: string): SVGPathElement | null {
  const paths = document.querySelectorAll<SVGPathElement>(".japan-map path[data-prefecture-id]");
  return Array.from(paths).find((path) => path.dataset.prefectureId === prefectureId) ?? null;
}

function uniquePoints(points: Point[]): Point[] {
  const seen = new Set<string>();
  const unique: Point[] = [];

  for (const point of points) {
    const key = `${Math.round(point.x * 10) / 10}:${Math.round(point.y * 10) / 10}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(point);
    }
  }

  return unique;
}

export function getPrefectureHitCandidatePoints(prefecture: Prefecture): Point[] {
  const candidates: Point[] = [
    prefecture.capitalPoint ?? prefecture.centroid,
    prefecture.centroid,
    {
      x: prefecture.bbox.x + prefecture.bbox.width / 2,
      y: prefecture.bbox.y + prefecture.bbox.height / 2
    }
  ];

  for (const xRatio of GRID_RATIOS) {
    for (const yRatio of GRID_RATIOS) {
      candidates.push({
        x: prefecture.bbox.x + prefecture.bbox.width * xRatio,
        y: prefecture.bbox.y + prefecture.bbox.height * yRatio
      });
    }
  }

  return uniquePoints(candidates);
}

function isMapPointInPath(path: SVGPathElement, point: Point): boolean {
  if (typeof path.isPointInFill !== "function") {
    return true;
  }

  return path.isPointInFill(new DOMPoint(point.x, point.y));
}

function getInternalAnchorPoints(prefecture: Prefecture, path: SVGPathElement): Point[] {
  const internalPoints = getPrefectureHitCandidatePoints(prefecture).filter((point) => isMapPointInPath(path, point));
  return (internalPoints.length > 0 ? internalPoints : [prefecture.centroid]).slice(0, MAX_INTERNAL_ANCHORS);
}

function isClientPointInPath(path: SVGPathElement, clientPoint: Point): boolean {
  const matrix = path.getScreenCTM();
  if (!matrix || typeof path.isPointInFill !== "function") {
    return false;
  }

  const localPoint = new DOMPoint(clientPoint.x, clientPoint.y).matrixTransform(matrix.inverse());

  if (path.isPointInFill(localPoint)) {
    return true;
  }

  return typeof path.isPointInStroke === "function" ? path.isPointInStroke(localPoint) : false;
}

export function hitTestPrefectureShape(input: DragPointInput, prefecture: Prefecture): ShapeHitResult {
  const path = getPrefecturePath(prefecture.id);
  const primaryClientPoint = getDragGhostClientPointForMapPoint(input, prefecture, prefecture.centroid);

  if (!path) {
    return { isHit: false, clientPoint: primaryClientPoint };
  }

  const anchors = getInternalAnchorPoints(prefecture, path);

  for (const anchor of anchors) {
    const anchorClientPoint = getDragGhostClientPointForMapPoint(input, prefecture, anchor);

    for (const offset of HIT_OFFSET_PIXELS) {
      const testClientPoint = {
        x: anchorClientPoint.x + offset.x,
        y: anchorClientPoint.y + offset.y
      };

      if (isClientPointInPath(path, testClientPoint)) {
        return { isHit: true, clientPoint: testClientPoint };
      }
    }
  }

  return { isHit: false, clientPoint: primaryClientPoint };
}
