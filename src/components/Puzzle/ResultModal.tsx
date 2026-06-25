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
    return "全国モード";
  }

  if (mode === "prefecture-region") {
    return regionById.get(regionId ?? "")?.name ?? "地方モード";
  }

  if (mode === "capital-quiz") {
    return regionId ? `${regionById.get(regionId)?.name ?? "地方"} 県庁所在地クイズ` : "全国 県庁所在地クイズ";
  }

  return "学習モード";
}

export function ResultModal({ result, totalCount, onRetry, onNextRegion, onNational, onHome }: ResultModalProps) {
  const title = getTimeTitle(result.clearTimeSeconds);
  const nextGap = getNextTitleGap(result.clearTimeSeconds);

  return (
    <div className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <section className="result-card">
        <p className="result-mode">{getModeLabel(result.mode, result.regionId)}</p>
        <h2 id="result-title">クリア！</h2>
        <TimeTitleBadge title={title} />
        <dl className="result-stats">
          <div>
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
        <p className="title-comment">{title.comment}</p>
        <p className={result.isNewBest ? "best-message new-record" : "best-message"}>
          {result.isNewBest ? "自己ベスト更新！" : "最後までやりきれました。次は自己ベストをねらいましょう。"}
        </p>
        <p className="next-title-message">
          {nextGap.isTopTitle
            ? `最上位称号達成！きみは${title.title}！`
            : `次の称号「${nextGap.nextTitle?.title}」まであと${nextGap.secondsNeeded}秒！`}
        </p>
        <div className="result-actions">
          <button type="button" className="primary-button" onClick={onRetry}>
            もう一度
          </button>
          {onNextRegion ? (
            <button type="button" className="secondary-button" onClick={onNextRegion}>
              次の地方へ
            </button>
          ) : null}
          {onNational ? (
            <button type="button" className="secondary-button" onClick={onNational}>
              全国モードへ
            </button>
          ) : null}
          <button type="button" className="ghost-button" onClick={onHome}>
            モード選択へ
          </button>
        </div>
      </section>
    </div>
  );
}
