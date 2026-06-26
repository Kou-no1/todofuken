import type { Point, Prefecture } from "../types/puzzle";
import { getDragGhostClientPointForMapPoint, type DragPointInput } from "./dragGhost";

export const VERTICAL_SNAP_SAMPLE_PX = 12;
export const VERTICAL_SNAP_STEP_PX = 6;
export const HORIZONTAL_SNAP_SAMPLE_PX = 4;

const GRID_RATIOS = [0.2, 0.35, 0.5, 0.65, 0.8];
const MAINLAND_GRID_RATIOS = [0.5, 0.45, 0.55, 0.35, 0.65, 0.25, 0.75];
const MAX_INTERNAL_ANCHORS = 1;

const HIT_OFFSET_PIXELS = buildHitOffsets();
const mainlandCandidateCache = new Map<string, Point[]>();
const hitCandidateCache = new Map<string, Point[]>();

type ShapeHitResult = {
  isHit: boolean;
  clientPoint: Point;
};

type PolygonInfo = {
  area: number;
  bbox: { x: number; y: number; width: number; height: number };
  centroid: Point;
  points: Point[];
};

function buildHitOffsets(): Point[] {
  const verticalOffsets = [
    -VERTICAL_SNAP_SAMPLE_PX,
    -VERTICAL_SNAP_STEP_PX,
    0,
    VERTICAL_SNAP_STEP_PX,
    VERTICAL_SNAP_SAMPLE_PX
  ];
  const offsets = verticalOffsets.map((y) => ({ x: 0, y }));

  for (const y of [-VERTICAL_SNAP_STEP_PX, 0, VERTICAL_SNAP_STEP_PX]) {
    offsets.push({ x: HORIZONTAL_SNAP_SAMPLE_PX, y }, { x: -HORIZONTAL_SNAP_SAMPLE_PX, y });
  }

  return uniquePoints(offsets);
}

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

function parsePathPolygons(path: string): Point[][] {
  const polygons: Point[][] = [];
  let current: Point[] = [];
  const commandPattern = /([MLZ])\s*([^MLZ]*)/g;
  let match: RegExpExecArray | null;

  while ((match = commandPattern.exec(path)) !== null) {
    const command = match[1];
    const values = match[2].trim();

    if (command === "M") {
      if (current.length > 0) {
        polygons.push(current);
      }
      current = [];
    }

    if (command === "M" || command === "L") {
      const numbers = values
        .split(/\s+/)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

      if (numbers.length >= 2) {
        current.push({ x: numbers[0], y: numbers[1] });
      }
    }

    if (command === "Z" && current.length > 0) {
      polygons.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    polygons.push(current);
  }

  return polygons.filter((polygon) => polygon.length >= 3);
}

function getPolygonArea(points: Point[]): number {
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}

function getPolygonBBox(points: Point[]): PolygonInfo["bbox"] {
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getPolygonCentroid(points: Point[]): Point {
  let areaTimesTwo = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    areaTimesTwo += cross;
    centroidX += (current.x + next.x) * cross;
    centroidY += (current.y + next.y) * cross;
  }

  if (Math.abs(areaTimesTwo) < 0.001) {
    const bbox = getPolygonBBox(points);
    return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
  }

  return {
    x: centroidX / (3 * areaTimesTwo),
    y: centroidY / (3 * areaTimesTwo)
  };
}

function getLargestPolygon(prefecture: Prefecture): PolygonInfo | null {
  const polygons = parsePathPolygons(prefecture.path)
    .map((points) => ({
      points,
      area: getPolygonArea(points),
      bbox: getPolygonBBox(points),
      centroid: getPolygonCentroid(points)
    }))
    .filter((polygon) => polygon.area > 0.5)
    .sort((a, b) => b.area - a.area);

  return polygons[0] ?? null;
}

export function getMainlandCandidatePoints(prefecture: Prefecture): Point[] {
  const cached = mainlandCandidateCache.get(prefecture.id);
  if (cached) {
    return cached;
  }

  const polygon = getLargestPolygon(prefecture);

  if (!polygon) {
    return [];
  }

  const candidates: Point[] = [
    polygon.centroid,
    {
      x: polygon.bbox.x + polygon.bbox.width / 2,
      y: polygon.bbox.y + polygon.bbox.height / 2
    }
  ];

  for (const xRatio of MAINLAND_GRID_RATIOS) {
    for (const yRatio of MAINLAND_GRID_RATIOS) {
      candidates.push({
        x: polygon.bbox.x + polygon.bbox.width * xRatio,
        y: polygon.bbox.y + polygon.bbox.height * yRatio
      });
    }
  }

  const unique = uniquePoints(candidates);
  mainlandCandidateCache.set(prefecture.id, unique);
  return unique;
}

export function getPrefectureHitCandidatePoints(prefecture: Prefecture): Point[] {
  const cached = hitCandidateCache.get(prefecture.id);
  if (cached) {
    return cached;
  }

  const candidates: Point[] = [
    ...getMainlandCandidatePoints(prefecture),
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

  const unique = uniquePoints(candidates);
  hitCandidateCache.set(prefecture.id, unique);
  return unique;
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
