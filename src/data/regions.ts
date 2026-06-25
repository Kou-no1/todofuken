import { prefectureById } from "./prefectures";
import type { BBox, Region } from "../types/puzzle";

type RegionDefinition = Omit<Region, "bbox">;

const regionDefinitions: RegionDefinition[] = [
  {
    id: "hokkaido-tohoku",
    name: "北海道・東北地方",
    prefectureIds: ["hokkaido", "aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima"]
  },
  {
    id: "kanto",
    name: "関東地方",
    prefectureIds: ["ibaraki", "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa"]
  },
  {
    id: "chubu",
    name: "中部地方",
    prefectureIds: ["niigata", "toyama", "ishikawa", "fukui", "yamanashi", "nagano", "gifu", "shizuoka", "aichi"]
  },
  {
    id: "kinki",
    name: "近畿地方",
    prefectureIds: ["mie", "shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama"]
  },
  {
    id: "chugoku-shikoku",
    name: "中国・四国地方",
    prefectureIds: ["tottori", "shimane", "okayama", "hiroshima", "yamaguchi", "tokushima", "kagawa", "ehime", "kochi"]
  },
  {
    id: "kyushu-okinawa",
    name: "九州・沖縄地方",
    prefectureIds: ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa"]
  }
];

function unionBBoxes(boxes: BBox[]): BBox {
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export const regions: Region[] = regionDefinitions.map((region) => ({
  ...region,
  bbox: unionBBoxes(
    region.prefectureIds.map((prefectureId) => {
      const prefecture = prefectureById.get(prefectureId);

      if (!prefecture) {
        throw new Error(`Missing prefecture for region bbox: ${prefectureId}`);
      }

      return prefecture.bbox;
    })
  )
}));

export const regionById = new Map(regions.map((region) => [region.id, region]));
