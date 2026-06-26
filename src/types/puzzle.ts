export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type ViewBox = BBox;

export type Prefecture = {
  id: string;
  name: string;
  kana: string;
  regionId: string;
  capital: string;
  capitalKana: string;
  path: string;
  centroid: Point;
  capitalPoint?: Point;
  bbox: BBox;
  dragBbox?: BBox;
};

export type Region = {
  id: string;
  name: string;
  prefectureIds: string[];
  bbox: BBox;
};

export type TimeTitle = {
  id: string;
  minSeconds: number;
  maxSeconds: number | null;
  title: string;
  comment: string;
};

export type GameMode =
  | "prefecture-national"
  | "prefecture-region"
  | "prefecture-learn-national"
  | "prefecture-learn-region"
  | "capital-quiz"
  | "capital-quiz-special"
  | "capital-label"
  | "capital-pin";

export type PuzzlePlayMode = "learn" | "time-attack";

export type BestTimeRecord = {
  mode: GameMode;
  regionId?: string;
  bestTimeSeconds: number;
  bestMistakes: number;
  achievedAt: string;
};

export type PuzzleResult = {
  mode: GameMode;
  regionId?: string;
  clearTimeSeconds: number;
  mistakes: number;
  isNewBest: boolean;
};
