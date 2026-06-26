import type { Point, Prefecture, ViewBox } from "../types/puzzle";

const TOUCH_DRAG_GHOST_OFFSET_Y = 100;
const FINE_DRAG_GHOST_OFFSET_Y = 0;
const TOUCH_DRAG_GHOST_MIN_Y = 44;
const FINE_DRAG_GHOST_MIN_Y = 36;
const TOUCH_DRAG_GHOST_SCALE = 1.18;
const FINE_DRAG_GHOST_SCALE = 1.08;
const DRAG_LAYER_WIDTH = 144;
const DRAG_LAYER_HEIGHT = 120;
const DRAG_SHAPE_PADDING = 18;

export type DragPointInput = {
  clientX: number;
  clientY: number;
  pointerType: string;
};

export function getDragGhostMetrics(pointerType: string) {
  const isTouchDrag = pointerType === "touch";

  return {
    isTouchDrag,
    offsetY: isTouchDrag ? TOUCH_DRAG_GHOST_OFFSET_Y : FINE_DRAG_GHOST_OFFSET_Y,
    minY: isTouchDrag ? TOUCH_DRAG_GHOST_MIN_Y : FINE_DRAG_GHOST_MIN_Y,
    scale: isTouchDrag ? TOUCH_DRAG_GHOST_SCALE : FINE_DRAG_GHOST_SCALE
  };
}

export function getDragLayerViewBox(prefecture: Prefecture): ViewBox {
  const bbox = prefecture.dragBbox ?? prefecture.bbox;

  return {
    x: bbox.x - DRAG_SHAPE_PADDING,
    y: bbox.y - DRAG_SHAPE_PADDING,
    width: bbox.width + DRAG_SHAPE_PADDING * 2,
    height: bbox.height + DRAG_SHAPE_PADDING * 2
  };
}

export function getDragGhostLayerCenter(input: DragPointInput): Point {
  const metrics = getDragGhostMetrics(input.pointerType);

  return {
    x: input.clientX,
    y: Math.max(metrics.minY, input.clientY - metrics.offsetY)
  };
}

export function getDragGhostSnapClientPoint(
  input: DragPointInput,
  prefecture: Prefecture
): Point {
  return getDragGhostClientPointForMapPoint(input, prefecture, prefecture.centroid);
}

export function getDragGhostClientPointForMapPoint(
  input: DragPointInput,
  prefecture: Prefecture,
  mapPoint: Point
): Point {
  const layerCenter = getDragGhostLayerCenter(input);
  const metrics = getDragGhostMetrics(input.pointerType);
  const viewBox = getDragLayerViewBox(prefecture);
  const svgScale = Math.min(DRAG_LAYER_WIDTH / viewBox.width, DRAG_LAYER_HEIGHT / viewBox.height);
  const renderedWidth = viewBox.width * svgScale;
  const renderedHeight = viewBox.height * svgScale;
  const insetX = (DRAG_LAYER_WIDTH - renderedWidth) / 2;
  const insetY = (DRAG_LAYER_HEIGHT - renderedHeight) / 2;
  const mapPointInLayer = {
    x: insetX + (mapPoint.x - viewBox.x) * svgScale,
    y: insetY + (mapPoint.y - viewBox.y) * svgScale
  };

  return {
    x: layerCenter.x + (mapPointInLayer.x - DRAG_LAYER_WIDTH / 2) * metrics.scale,
    y: layerCenter.y + (mapPointInLayer.y - DRAG_LAYER_HEIGHT / 2) * metrics.scale
  };
}
