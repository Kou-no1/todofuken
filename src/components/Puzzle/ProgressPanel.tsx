type ProgressPanelProps = {
  placedCount: number;
  totalCount: number;
  mistakes: number;
};

export function ProgressPanel({ placedCount, totalCount, mistakes }: ProgressPanelProps) {
  const progress = totalCount > 0 ? Math.round((placedCount / totalCount) * 100) : 0;

  return (
    <div className="progress-panel" aria-label="進み具合とミス回数">
      <div className="stat-row progress-stat">
        <span>
          進み具合 <strong>{placedCount}</strong> / {totalCount}
        </span>
        <span className="mistake-pill">
          ミス <strong>{mistakes}</strong>
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
