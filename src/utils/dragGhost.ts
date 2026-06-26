import type { Point, Prefecture, ViewBox } from "../types/puzzle";

const TOUCH_DRAG_GHOST_OFFSET_Y = 96;
const FINE_DRAG_GHOST_OFFSET_Y = 0;
const TOUCH_DRAG_GHOST_EDGE_PADDING = 72;
const FINE_DRAG_GHOST_EDGE_PADDING = 28;
const TOUCH_DRAG_GHOST_MIN_Y = 84;
const FINE_DRAG_GHOST_MIN_Y = 36;
const TOUCH_DRAG_GHOST_SCALE = 1.18;
const FINE_DRAG_GHOST_SCALE = 1.08;
const DRAG_LAYER_WIDTH = 144;
const DRAG_LAYER_HEIGHT = 120;
const DRAG_SHAPE_PADDING = 18;

type DragPointInput = {
  clientX: number;
  clientY: number;
  pointerType: string;
};

export function getDragGhostMetrics(pointerType: string) {
  const isTouchDrag = pointerType === "touch";

  return {
    isTouchDrag,
    offsetY: isTouchDrag ? TOUCH_DRAG_GHOST_OFFSET_Y : FINE_DRAG_GHOST_OFFSET_Y,
    edgePadding: isTouchDrag ? TOUCH_DRAG_GHOST_EDGE_PADDING : FINE_DRAG_GHOST_EDGE_PADDING,
    minY: isTouchDrag ? TOUCH_DRAG_GHOST_MIN_Y : FINE_DRAG_GHOST_MIN_Y,
    scale: isTouchDrag ? TOUCH_DRAG_GHOST_SCALE : FINE_DRAG_GHOST_SCALE
  };
}

export function getDragLayerViewBox(prefecture: Prefecture): ViewBox {
  return {
    x: prefecture.bbox.x - DRAG_SHAPE_PADDING,
    y: prefecture.bbox.y - DRAG_SHAPE_PADDING,
    width: prefecture.bbox.width + DRAG_SHAPE_PADDING * 2,
    height: prefecture.bbox.height + DRAG_SHAPE_PADDING * 2
  };
}

function getViewportWidth() {
  return typeof window === "undefined" ? 1024 : window.innerWidth;
}

function clampToViewport(value: number, edgePadding: number, viewportWidth: number) {
  const max = Math.max(edgePadding, viewportWidth - edgePadding);
  return Math.min(Math.max(value, edgePadding), max);
}

export function getDragGhostLayerCenter(input: DragPointInput, viewportWidth = getViewportWidth()): Point {
  const metrics = getDragGhostMetrics(input.pointerType);

  return {
    x: clampToViewport(input.clientX, metrics.edgePadding, viewportWidth),
    y: Math.max(metrics.minY, input.clientY - metrics.offsetY)
  };
}

export function getDragGhostSnapClientPoint(
  input: DragPointInput,
  prefecture: Prefecture,
  viewportWidth = getViewportWidth()
): Point {
  const layerCenter = getDragGhostLayerCenter(input, viewportWidth);
  const metrics = getDragGhostMetrics(input.pointerType);
  const viewBox = getDragLayerViewBox(prefecture);
  const svgScale = Math.min(DRAG_LAYER_WIDTH / viewBox.width, DRAG_LAYER_HEIGHT / viewBox.height);
  const renderedWidth = viewBox.width * svgScale;
  const renderedHeight = viewBox.height * svgScale;
  const insetX = (DRAG_LAYER_WIDTH - renderedWidth) / 2;
  const insetY = (DRAG_LAYER_HEIGHT - renderedHeight) / 2;
  const centroidInLayer = {
    x: insetX + (prefecture.centroid.x - viewBox.x) * svgScale,
    y: insetY + (prefecture.centroid.y - viewBox.y) * svgScale
  };

  return {
    x: layerCenter.x + (centroidInLayer.x - DRAG_LAYER_WIDTH / 2) * metrics.scale,
    y: layerCenter.y + (centroidInLayer.y - DRAG_LAYER_HEIGHT / 2) * metrics.scale
  };
}
