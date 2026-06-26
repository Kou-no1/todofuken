import { JAPAN_BBOX, prefectureById, prefectures } from "../data/prefectures";
import { regionById } from "../data/regions";
import type { BBox, ViewBox } from "../types/puzzle";
import { bboxToViewBox, padBBox, unionBBoxes } from "./geometry";

const MIN_PADDING = 34;
const KYUSHU_OKINAWA_REGION_ID = "kyushu-okinawa";
const KYUSHU_MAINLAND_PREFECTURE_IDS = ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima"];
const KYUSHU_OKINAWA_MAX_PADDING = 68;
const OKINAWA_MAIN_ISLAND_BOX = {
  width: 92,
  height: 80
};

export function fitToJapan(padding = 28): ViewBox {
  return bboxToViewBox(padBBox(JAPAN_BBOX, padding));
}

export function fitToRegion(regionId: string, padding = 42): ViewBox {
  const region = regionById.get(regionId);
  if (!region) {
    return fitToJapan();
  }

  if (regionId === KYUSHU_OKINAWA_REGION_ID) {
    return fitToKyushuOkinawa(padding);
  }

  return bboxToViewBox(padBBox(region.bbox, Math.max(MIN_PADDING, padding)));
}

function fitToKyushuOkinawa(padding: number): ViewBox {
  const mainlandBoxes = KYUSHU_MAINLAND_PREFECTURE_IDS.map((id) => prefectureById.get(id)?.bbox).filter(
    (box): box is BBox => Boolean(box)
  );
  const okinawa = prefectureById.get("okinawa");
  const okinawaPoint = okinawa?.capitalPoint ?? okinawa?.centroid;
  const okinawaMainIslandBox = okinawaPoint
    ? {
        x: okinawaPoint.x - OKINAWA_MAIN_ISLAND_BOX.width / 2,
        y: okinawaPoint.y - OKINAWA_MAIN_ISLAND_BOX.height / 2,
        width: OKINAWA_MAIN_ISLAND_BOX.width,
        height: OKINAWA_MAIN_ISLAND_BOX.height
      }
    : undefined;

  const boxes = [...mainlandBoxes, okinawaMainIslandBox].filter((box): box is BBox => Boolean(box));
  if (boxes.length === 0) {
    return fitToJapan();
  }

  const boundedPadding = Math.min(Math.max(MIN_PADDING, padding), KYUSHU_OKINAWA_MAX_PADDING);
  return bboxToViewBox(padBBox(unionBBoxes(boxes), boundedPadding));
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
