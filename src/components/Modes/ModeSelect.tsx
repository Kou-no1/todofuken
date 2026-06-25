import { APP_NAME } from "../../constants";
import { loadBestTime } from "../../hooks/useBestTime";
import { formatClock } from "../../utils/timeFormat";

type ModeSelectProps = {
  onNationalPuzzle: () => void;
  onRegionPuzzle: () => void;
  onCapitalQuiz: () => void;
};

export function ModeSelect({ onNationalPuzzle, onRegionPuzzle, onCapitalQuiz }: ModeSelectProps) {
  const nationalBest = loadBestTime("prefecture-national");
  const quizBest = loadBestTime("capital-quiz");

  return (
    <main className="home-screen">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="hero-kicker">小学校4年生向け 日本地図パズル</p>
        <h1 id="home-title">{APP_NAME}</h1>
        <p className="hero-copy">ピースを地図に置いて、都道府県の場所を覚えよう！</p>
      </section>

      <section className="mode-grid" aria-label="モード選択">
        <button type="button" className="mode-card primary-mode" onClick={onNationalPuzzle}>
          <span className="mode-label">全国モード</span>
          <strong>47都道府県パズル</strong>
          <span>全部のピースに挑戦</span>
          {nationalBest ? <small>ベスト {formatClock(nationalBest.bestTimeSeconds)}</small> : <small>まずは挑戦</small>}
        </button>
        <button type="button" className="mode-card" onClick={onRegionPuzzle}>
          <span className="mode-label">地方モード</span>
          <strong>少しずつ練習</strong>
          <span>6つの地方から選べます</span>
          <small>北海道・東北から九州・沖縄まで</small>
        </button>
        <button type="button" className="mode-card" onClick={onCapitalQuiz}>
          <span className="mode-label">県庁所在地モード</span>
          <strong>4択クイズ</strong>
          <span>県名から県庁所在地を選ぶ</span>
          {quizBest ? <small>全国ベスト {formatClock(quizBest.bestTimeSeconds)}</small> : <small>タイムも記録</small>}
        </button>
      </section>
    </main>
  );
}
