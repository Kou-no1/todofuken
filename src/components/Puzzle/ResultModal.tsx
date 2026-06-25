import { regionById } from "../../data/regions";
import type { GameMode, PuzzleResult } from "../../types/puzzle";
import { formatClearTime } from "../../utils/timeFormat";
import { getNextTitleGap, getTimeTitle } from "../../utils/timeTitle";
import { TimeTitleBadge } from "./TimeTitleBadge";

type ResultModalProps = {
  result: PuzzleResult;
  totalCount: number;
  onRetry: () => void;
  onNextRegion?: () => void;
  onNational?: () => void;
  onHome: () => void;
};

function getModeLabel(mode: GameMode, regionId?: string): string {
  if (mode === "prefecture-national") {
    return "全国タイムアタック";
  }

  if (mode === "prefecture-learn-national") {
    return "全国 覚えるモード";
  }

  if (mode === "prefecture-region") {
    return `${regionById.get(regionId ?? "")?.name ?? "地方モード"} タイムアタック`;
  }

  if (mode === "prefecture-learn-region") {
    return `${regionById.get(regionId ?? "")?.name ?? "地方モード"} 覚えるモード`;
  }

  if (mode === "capital-quiz") {
    return regionId ? `${regionById.get(regionId)?.name ?? "地方"} 市名クイズ` : "全国 市名クイズ";
  }

  if (mode === "capital-quiz-special") {
    return "県名とちがう市 とっくん";
  }

  return "学ぶモード";
}

function getResultMessage(result: PuzzleResult, showTimeTitle: boolean, title: ReturnType<typeof getTimeTitle>) {
  if (showTimeTitle) {
    return title.comment;
  }

  return result.isNewBest
    ? "いいペースでクリア！つぎも楽しくちょうせんしよう。"
    : "最後までクリア！つぎはじぶんのベストをねらおう。";
}

export function ResultModal({ result, totalCount, onRetry, onNextRegion, onNational: _onNational, onHome }: ResultModalProps) {
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
    <div className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
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
      </section>
    </div>
  );
}
