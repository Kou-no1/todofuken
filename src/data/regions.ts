import type { Region } from "../types/puzzle";

export const regions: Region[] = [
  {
    id: "hokkaido-tohoku",
    name: "北海道・東北地方",
    prefectureIds: ["hokkaido", "aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima"],
    bbox: { x: 845, y: 30, width: 325, height: 430 }
  },
  {
    id: "kanto",
    name: "関東地方",
    prefectureIds: ["ibaraki", "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa"],
    bbox: { x: 720, y: 420, width: 235, height: 205 }
  },
  {
    id: "chubu",
    name: "中部地方",
    prefectureIds: ["niigata", "toyama", "ishikawa", "fukui", "yamanashi", "nagano", "gifu", "shizuoka", "aichi"],
    bbox: { x: 515, y: 345, width: 335, height: 320 }
  },
  {
    id: "kinki",
    name: "近畿地方",
    prefectureIds: ["mie", "shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama"],
    bbox: { x: 380, y: 540, width: 260, height: 235 }
  },
  {
    id: "chugoku-shikoku",
    name: "中国・四国地方",
    prefectureIds: ["tottori", "shimane", "okayama", "hiroshima", "yamaguchi", "tokushima", "kagawa", "ehime", "kochi"],
    bbox: { x: 145, y: 520, width: 305, height: 290 }
  },
  {
    id: "kyushu-okinawa",
    name: "九州・沖縄地方",
    prefectureIds: ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa"],
    bbox: { x: 10, y: 685, width: 340, height: 285 }
  }
];

export const regionById = new Map(regions.map((region) => [region.id, region]));
