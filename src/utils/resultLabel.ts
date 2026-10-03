import { regionById } from "../data/regions";
import type { GameMode } from "../types/puzzle";

export function getModeLabel(mode: GameMode, regionId?: string): string {
  switch (mode) {
    case "prefecture-national": return "全国 ハードモード";
    case "prefecture-national-color": return "全国 カラーモード";
    case "prefecture-learn-national": return "全国 覚えるモード";
    case "prefecture-region": return `${regionById.get(regionId ?? "")?.name ?? "地方モード"} タイムアタック`;
    case "prefecture-learn-region": return `${regionById.get(regionId ?? "")?.name ?? "地方モード"} 覚えるモード`;
    case "prefecture-daily": return "今日の5県";
    case "prefecture-review": return "もう一回練習";
    case "capital-quiz": return regionId ? `${regionById.get(regionId)?.name ?? "地方"} 市名クイズ` : "全国 市名クイズ";
    case "capital-quiz-special": return "県名とちがう市 とっくん";
    default: return "学ぶモード";
  }
}
