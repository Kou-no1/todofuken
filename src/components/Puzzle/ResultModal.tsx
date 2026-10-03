import type { PuzzleResult } from "../../types/puzzle";
import { formatClearTime } from "../../utils/timeFormat";
import { getNextTitleGap, getTimeTitle } from "../../utils/timeTitle";
import { TimeTitleBadge } from "./TimeTitleBadge";
import { useRef } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { getModeLabel } from "../../utils/resultLabel";
import { ResultShare } from "./ResultShare";

type ResultModalProps = {
  result: PuzzleResult;
  totalCount: number;
  onRetry: () => void;
  onNextRegion?: () => void;
  onNational?: () => void;
  onHome: () => void;
};

function getResultMessage(result: PuzzleResult, showTimeTitle: boolean, title: ReturnType<typeof getTimeTitle>) {
  if (showTimeTitle) {
    return title.comment;
  }

  if (result.mode === "prefecture-review") return "ふくしゅうできたね！形と場所をもう一回おぼえたよ。";
  if (result.mode === "prefecture-daily") return "今日の5県クリア！明日もちょうせんしよう。";

  return result.isNewBest
    ? "いいペースでクリア！つぎも楽しくちょうせんしよう。"
    : "最後までクリア！つぎはじぶんのベストをねらおう。";
}

export function ResultModal({ result, totalCount, onRetry, onNextRegion, onNational: _onNational, onHome }: ResultModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useDialogFocus(dialogRef);
  const title = getTimeTitle(result.clearTimeSeconds);
  const nextGap = getNextTitleGap(result.clearTimeSeconds);
  const showTimeTitle = result.mode === "prefecture-national";
  const resultMessage = getResultMessage(result, showTimeTitle, title);
  const titleProgressMessage = nextGap.isTopTitle
    ? "さいじょういしょうごう たっせい！"
    : `つぎのしょうごうまであと${nextGap.secondsNeeded}秒`;
  const compactMessage = [
    result.isNewBest ? "じぶんのベストこうしん！" : "",
    showTimeTitle ? titleProgressMessage : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={dialogRef} className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <section className={showTimeTitle ? "result-card has-title" : "result-card no-title"}>
        <div className="result-heading">
          <p className="result-mode">{getModeLabel(result.mode, result.regionId)}</p>
          <h2 id="result-title">クリア！</h2>
        </div>
        {showTimeTitle ? <TimeTitleBadge title={title} /> : null}
        <dl className="result-stats">
          <div className="result-stat-time">
            <dt>タイム</dt>
            <dd>{formatClearTime(result.clearTimeSeconds)}</dd>
          </div>
          <div>
            <dt>できた数</dt>
            <dd>{totalCount}</dd>
          </div>
          <div>
            <dt>ミス</dt>
            <dd>{result.mistakes}回</dd>
          </div>
        </dl>
        <p className="result-message">{resultMessage}</p>
        {compactMessage ? <p className="result-note new-record">{compactMessage}</p> : null}
        <div className="result-actions">
          <button type="button" className="primary-button" onClick={onRetry}>
            もう一度
          </button>
          {onNextRegion ? (
            <button type="button" className="secondary-button" onClick={onNextRegion}>
              次の地方へ
            </button>
          ) : null}
          <button type="button" className="ghost-button" onClick={onHome}>
            モードを選ぶ
          </button>
        </div>
        <ResultShare result={result} totalCount={totalCount} />
      </section>
    </div>
  );
}
