type ZoomControlsProps = {
  fitLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

export function ZoomControls({ fitLabel, onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className="zoom-controls" aria-label="地図の見え方を変える">
      <button type="button" onClick={onZoomIn} aria-label="ズームイン">
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="ズームアウト">
        -
      </button>
      <button type="button" className="fit-button" onClick={onFit}>
        {fitLabel}
      </button>
    </div>
  );
}
