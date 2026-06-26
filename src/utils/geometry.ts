import type { BBox, Point, ViewBox } from "../types/puzzle";

export function unionBBoxes(boxes: BBox[]): BBox {
  if (boxes.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function padBBox(box: BBox, padding: number): BBox {
  return {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2
  };
}

export function bboxToViewBox(box: BBox): ViewBox {
  return {
    x: Math.round(box.x * 100) / 100,
    y: Math.round(box.y * 100) / 100,
    width: Math.max(1, Math.round(box.width * 100) / 100),
    height: Math.max(1, Math.round(box.height * 100) / 100)
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function containsPoint(box: BBox, point: Point): boolean {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

export function isPointNearBBox(box: BBox, point: Point, padding: number): boolean {
  return containsPoint(padBBox(box, padding), point);
}

export function getDropTolerance(target: { bbox: BBox }): number {
  const shortSide = Math.min(target.bbox.width, target.bbox.height);
  return Math.max(22, Math.min(32, shortSide * 0.72));
}

export function pointFromClientPosition(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewBox: ViewBox
): Point {
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  const renderedWidth = viewBox.width * scale;
  const renderedHeight = viewBox.height * scale;
  const insetX = (rect.width - renderedWidth) / 2;
  const insetY = (rect.height - renderedHeight) / 2;

  return {
    x: viewBox.x + (clientX - rect.left - insetX) / scale,
    y: viewBox.y + (clientY - rect.top - insetY) / scale
  };
}

export function isDropCorrect(
  target: { bbox: BBox; centroid: Point },
  point: Point,
  tolerance = getDropTolerance(target)
): boolean {
  return distance(point, target.centroid) <= tolerance;
}

export function viewBoxToString(viewBox: ViewBox): string {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}
