import { useCallback, useState } from "react";

export function usePuzzleState(prefectureIds: string[]) {
  const [placedIds, setPlacedIds] = useState<Set<string>>(() => new Set());
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("ピースを持つと、その地方へ地図が近づきます。");

  const reset = useCallback(() => {
    setPlacedIds(new Set());
    setMistakes(0);
    setFeedback("ピースを持つと、その地方へ地図が近づきます。");
  }, []);

  const placeCorrect = useCallback((prefectureId: string, prefectureName: string) => {
    setPlacedIds((current) => new Set(current).add(prefectureId));
    setFeedback(`${prefectureName}、せいかい！その調子です。`);
  }, []);

  const markMistake = useCallback((prefectureName: string) => {
    setMistakes((current) => current + 1);
    setFeedback(`${prefectureName}は別の場所です。ヒントで場所を見てみましょう。`);
  }, []);

  return {
    placedIds,
    placedCount: placedIds.size,
    totalCount: prefectureIds.length,
    mistakes,
    feedback,
    reset,
    placeCorrect,
    markMistake,
    setFeedback
  };
}
