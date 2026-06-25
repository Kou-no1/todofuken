import type { BestTimeRecord } from "../../types/puzzle";
import { formatClock } from "../../utils/timeFormat";

type TimeAttackPanelProps = {
  elapsedSeconds: number;
  bestTime?: BestTimeRecord | null;
};

export function TimeAttackPanel({ elapsedSeconds, bestTime }: TimeAttackPanelProps) {
  return (
    <div className="stat-row" aria-label="タイムアタック">
      <span>
        タイム <strong>{formatClock(elapsedSeconds)}</strong>
      </span>
      <span>
        ベスト <strong>{bestTime ? formatClock(bestTime.bestTimeSeconds) : "--:--"}</strong>
      </span>
    </div>
  );
}
