import { APP_NAME } from "../../constants";
import { loadBestTime } from "../../hooks/useBestTime";
import { formatClock } from "../../utils/timeFormat";

type ModeSelectProps = {
  onNationalLearn: () => void;
  onNationalTimeAttack: () => void;
  onRegionLearn: () => void;
  onRegionTimeAttack: () => void;
  onCapitalQuiz: () => void;
};

export function ModeSelect({
  onNationalLearn,
  onNationalTimeAttack,
  onRegionLearn,
  onRegionTimeAttack,
  onCapitalQuiz
}: ModeSelectProps) {
  const nationalBest = loadBestTime("prefecture-national");
  const learnBest = loadBestTime("prefecture-learn-national");
  const quizBest = loadBestTime("capital-quiz");

  return (
    <main className="home-screen">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="hero-kicker">小学校4年生向け 日本地図パズル</p>
        <h1 id="home-title">{APP_NAME}</h1>
        <p className="hero-copy">形を見て、場所を思い出して、都道府県を覚えよう！</p>
      </section>

      <section className="mode-grid" aria-label="モード選択">
        <button type="button" className="mode-card primary-mode mode-red" onClick={onNationalTimeAttack}>
          <span className="mode-emoji" aria-hidden="true">
            ⏱️
          </span>
          <span className="mode-label">タイムアタック</span>
          <strong>全国47ピース</strong>
          <span>赤いガイドなしで自己ベストに挑戦</span>
          {nationalBest ? <small>ベスト {formatClock(nationalBest.bestTimeSeconds)}</small> : <small>まずは挑戦</small>}
        </button>
        <button type="button" className="mode-card mode-green" onClick={onNationalLearn}>
          <span className="mode-emoji" aria-hidden="true">
            🧭
          </span>
          <span className="mode-label">覚えるモード</span>
          <strong>全国を練習</strong>
          <span>赤いガイドを見ながら形と場所を覚える</span>
          {learnBest ? <small>練習ベスト {formatClock(learnBest.bestTimeSeconds)}</small> : <small>ゆっくり練習</small>}
        </button>
        <button type="button" className="mode-card mode-blue" onClick={onRegionTimeAttack}>
          <span className="mode-emoji" aria-hidden="true">
            🚀
          </span>
          <span className="mode-label">地方タイムアタック</span>
          <strong>地方別に挑戦</strong>
          <span>ガイドなしで6地方を少しずつ攻略</span>
          <small>地方ごとにベスト保存</small>
        </button>
        <button type="button" className="mode-card mode-orange" onClick={onRegionLearn}>
          <span className="mode-emoji" aria-hidden="true">
            🌈
          </span>
          <span className="mode-label">地方で覚える</span>
          <strong>少しずつ練習</strong>
          <span>赤いガイドつきで地方ごとに覚える</span>
          <small>北海道・東北から九州・沖縄まで</small>
        </button>
        <button type="button" className="mode-card mode-purple" onClick={onCapitalQuiz}>
          <span className="mode-emoji" aria-hidden="true">
            🏫
          </span>
          <span className="mode-label">県庁所在地モード</span>
          <strong>4択クイズ</strong>
          <span>県名から県庁所在地を選ぶ</span>
          {quizBest ? <small>全国ベスト {formatClock(quizBest.bestTimeSeconds)}</small> : <small>タイムも記録</small>}
        </button>
      </section>
    </main>
  );
}
