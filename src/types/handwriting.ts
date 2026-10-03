export type HandwritingKind = "prefecture" | "capital";

export type HandwritingWord = {
  prefectureId: string;
  regionId: string;
  text: string;
  kana: string;
  prefectureName: string;
  prefectureKana: string;
};

export type InkPoint = { x: number; y: number };
export type InkStroke = { points: InkPoint[]; width: number };
export type HandwritingProgress = Record<HandwritingKind, string[]>;
