import { JAPAN_BBOX, prefectureById, prefectures } from "../data/prefectures";
import { regionById } from "../data/regions";
import type { BBox, ViewBox } from "../types/puzzle";
import { bboxToViewBox, padBBox, unionBBoxes } from "./geometry";

const MIN_PADDING = 34;

export function fitToJapan(padding = 28): ViewBox {
  return bboxToViewBox(padBBox(JAPAN_BBOX, padding));
}

export function fitToRegion(regionId: string, padding = 42): ViewBox {
  const region = regionById.get(regionId);
  if (!region) {
    return fitToJapan();
  }

  return bboxToViewBox(padBBox(region.bbox, Math.max(MIN_PADDING, padding)));
}

export function fitToPrefecture(prefectureId: string, padding = 80): ViewBox {
  const prefecture = prefectureById.get(prefectureId);
  if (!prefecture) {
    return fitToJapan();
  }

  return bboxToViewBox(padBBox(prefecture.bbox, padding));
}

export function fitToPrefectureGroup(prefectureIds: string[], padding = 48): ViewBox {
  const boxes = prefectureIds
    .map((id) => prefectureById.get(id)?.bbox)
    .filter((box): box is BBox => Boolean(box));

  if (boxes.length === 0) {
    return fitToJapan();
  }

  return bboxToViewBox(padBBox(unionBBoxes(boxes), padding));
}

export function getJapanDataBBox(): BBox {
  return unionBBoxes(prefectures.map((prefecture) => prefecture.bbox));
}

export function zoomViewBox(viewBox: ViewBox, scale: number): ViewBox {
  const nextWidth = Math.max(90, Math.min(1250, viewBox.width * scale));
  const nextHeight = Math.max(90, Math.min(1050, viewBox.height * scale));
  return {
    x: viewBox.x + (viewBox.width - nextWidth) / 2,
    y: viewBox.y + (viewBox.height - nextHeight) / 2,
    width: nextWidth,
    height: nextHeight
  };
}
