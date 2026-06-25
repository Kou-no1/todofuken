import { prefectures } from "./prefectures";

export const capitals = prefectures.map((prefecture) => ({
  prefectureId: prefecture.id,
  prefectureName: prefecture.name,
  capital: prefecture.capital,
  capitalKana: prefecture.capitalKana,
  regionId: prefecture.regionId
}));
