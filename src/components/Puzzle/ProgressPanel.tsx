type ProgressPanelProps = {
  placedCount: number;
  totalCount: number;
  mistakes: number;
};

export function ProgressPanel({ placedCount, totalCount, mistakes }: ProgressPanelProps) {
  return (
    <div className="stat-row" aria-label="進み具合とミス回数">
      <span>
        進み具合 <strong>{placedCount}</strong> / {totalCount}
      </span>
      <span>
        ミス <strong>{mistakes}</strong>
      </span>
    </div>
  );
}
