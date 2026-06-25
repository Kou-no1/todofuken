import type { ReactNode } from "react";
import { loadBestTime } from "../../hooks/useBestTime";
import { formatClock } from "../../utils/timeFormat";

type ModeCardProps = {
  className: string;
  emoji: string;
  label: ReactNode;
  title: ReactNode;
  description: ReactNode;
  meta: ReactNode;
  onClick: () => void;
};

type ModeSelectProps = {
  onNationalLearn: () => void;
  onNationalTimeAttack: () => void;
  onRegionLearn: () => void;
  onRegionTimeAttack: () => void;
  onCapitalQuiz: () => void;
};

function ModeCard({ className, emoji, label, title, description, meta, onClick }: ModeCardProps) {
  return (
    <button type="button" className={className} onClick={onClick}>
      <span className="mode-card-top">
        <span className="mode-emoji" aria-hidden="true">
          {emoji}
        </span>
        <span className="mode-label">{label}</span>
      </span>
      <strong>{title}</strong>
      <span className="mode-description">{description}</span>
      <small className="mode-meta">{meta}</small>
    </button>
  );
}

function RubyText({ label, kana }: { label: string; kana: string }) {
  return (
    <ruby>
      {label}
      <rt>{kana}</rt>
    </ruby>
  );
}

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
        <p className="hero-catch">パズルで覚える！</p>
        <h1 id="home-title">都道府県</h1>
        <p className="hero-copy">形を見て、場所を思い出して、都道府県を覚えよう！</p>
      </section>

      <section className="mode-grid" aria-label="モードを選ぶ">
        <ModeCard
          className="mode-card primary-mode mode-red"
          emoji="⏱️"
          label="タイムアタック"
          title="全国47ピース"
          description="赤いガイドなしでじぶんのベストにちょうせん"
          meta={nationalBest ? `ベスト ${formatClock(nationalBest.bestTimeSeconds)}` : "まずはちょうせん"}
          onClick={onNationalTimeAttack}
        />
        <ModeCard
          className="mode-card mode-green"
          emoji="🧭"
          label="覚えるモード"
          title="全国を練習"
          description="赤いガイドを見ながら形と場所を覚える"
          meta={learnBest ? `練習ベスト ${formatClock(learnBest.bestTimeSeconds)}` : "ゆっくり練習"}
          onClick={onNationalLearn}
        />
        <ModeCard
          className="mode-card mode-blue"
          emoji="🚀"
          label="地方タイムアタック"
          title="地方ごとにちょうせん"
          description="ガイドなしで6地方を少しずつこうりゃく"
          meta="地方ごとにベストをのこす"
          onClick={onRegionTimeAttack}
        />
        <ModeCard
          className="mode-card mode-orange"
          emoji="🌈"
          label="地方で覚える"
          title="少しずつ練習"
          description="赤いガイドつきで地方ごとに覚える"
          meta="北海道・東北から九州・沖縄まで"
          onClick={onRegionLearn}
        />
        <ModeCard
          className="mode-card mode-purple"
          emoji="🏫"
          label="市名クイズ"
          title="4択クイズ"
          description={
            <>
              <RubyText label="県庁所在地" kana="けんちょうしょざいち" />
              を選ぶ
            </>
          }
          meta={quizBest ? `全国ベスト ${formatClock(quizBest.bestTimeSeconds)}` : "タイムものこす"}
          onClick={onCapitalQuiz}
        />
      </section>
    </main>
  );
}
