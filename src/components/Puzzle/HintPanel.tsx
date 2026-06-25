type HintPanelProps = {
  message: string;
  targetName?: string;
  onHint: () => void;
};

export function HintPanel({ message, targetName, onHint }: HintPanelProps) {
  return (
    <aside className="hint-panel" aria-live="polite">
      <p>{message}</p>
      <button type="button" className="secondary-button" onClick={onHint}>
        {targetName ? `${targetName}のヒント` : "ヒント"}
      </button>
    </aside>
  );
}
