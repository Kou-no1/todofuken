import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
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
  isLaunchLocked?: boolean;
  isLaunching?: boolean;
  onLaunchAnimationEnd?: () => void;
};

type ModeSelectProps = {
  onNationalLearn: () => void;
  onNationalTimeAttack: () => void;
  onRegionLearn: () => void;
  onRegionTimeAttack: () => void;
  onCapitalQuiz: () => void;
};

const ONBOARDING_SEEN_KEY = "todofuken:onboarding:v1:seen";

type OnboardingOverlayProps = {
  onClose: () => void;
  startButtonRef: RefObject<HTMLButtonElement | null>;
};

function OnboardingOverlay({ onClose, startButtonRef }: OnboardingOverlayProps) {
  return (
    <div className="onboarding-backdrop" role="presentation">
      <section
        className="onboarding-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose();
          }
        }}
      >
        <button type="button" className="onboarding-close" aria-label="遊び方をとじる" onClick={onClose}>
          ×
        </button>
        <p className="onboarding-kicker">はじめての人へ</p>
        <h2 id="onboarding-title">ピースを地図にはめよう！</h2>
        <p id="onboarding-description" className="onboarding-copy">
          ピースをタップして、その形が合う場所までドラッグしよう。近くに行くと、すっとはまるよ。
        </p>

        <div className="onboarding-demo" aria-hidden="true">
          <div className="demo-map-slot">
            <span>地図の枠</span>
          </div>
          <div className="demo-piece">県</div>
          <div className="demo-pointer" />
          <div className="demo-spark demo-spark-one" />
          <div className="demo-spark demo-spark-two" />
        </div>

        <ol className="onboarding-steps" aria-label="遊び方の手順">
          <li>
            <strong>1</strong>
            <span>ピースを選ぶ</span>
          </li>
          <li>
            <strong>2</strong>
            <span>地図まで運ぶ</span>
          </li>
          <li>
            <strong>3</strong>
            <span>はまると正解！</span>
          </li>
        </ol>

        <div className="onboarding-actions">
          <button type="button" className="secondary-button onboarding-skip" onClick={onClose}>
            スキップ
          </button>
          <button type="button" className="primary-button onboarding-start" onClick={onClose} ref={startButtonRef}>
            はじめる
          </button>
        </div>
      </section>
    </div>
  );
}

function ModeCard({
  className,
  emoji,
  label,
  title,
  description,
  meta,
  onClick,
  isLaunchLocked = false,
  isLaunching = false,
  onLaunchAnimationEnd
}: ModeCardProps) {
  return (
    <button
      type="button"
      className={`${className}${isLaunching ? " is-launching" : ""}${isLaunchLocked ? " is-launch-locked" : ""}`}
      aria-disabled={isLaunchLocked || undefined}
      data-launching={isLaunching || undefined}
      onClick={onClick}
      onAnimationEnd={(event) => {
        if (isLaunching && event.animationName === "mode-card-launch" && event.elapsedTime >= 0.32) {
          onLaunchAnimationEnd?.();
        }
      }}
    >
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [launchingMode, setLaunchingMode] = useState<string | null>(null);
  const launchActionRef = useRef<(() => void) | null>(null);
  const launchTimerRef = useRef<number | null>(null);
  const isLaunchLockedRef = useRef(false);
  const onboardingStartRef = useRef<HTMLButtonElement | null>(null);

  const finishLaunch = () => {
    if (!isLaunchLockedRef.current) {
      return;
    }

    if (launchTimerRef.current !== null) {
      window.clearTimeout(launchTimerRef.current);
      launchTimerRef.current = null;
    }

    const action = launchActionRef.current;
    launchActionRef.current = null;
    isLaunchLockedRef.current = false;
    setLaunchingMode(null);
    action?.();
  };

  const startLaunch = (modeId: string, action: () => void) => {
    if (isLaunchLockedRef.current) {
      return;
    }

    isLaunchLockedRef.current = true;
    launchActionRef.current = action;
    setLaunchingMode(modeId);
    launchTimerRef.current = window.setTimeout(finishLaunch, 460);
  };

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(ONBOARDING_SEEN_KEY) !== "1") {
        setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!showOnboarding) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      onboardingStartRef.current?.focus();
    }, 60);

    return () => window.clearTimeout(focusTimer);
  }, [showOnboarding]);

  const closeOnboarding = () => {
    try {
      window.localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    } catch {
      // localStorageが使えない環境でも、今の画面では閉じられるようにする。
    }

    setShowOnboarding(false);
  };

  return (
    <main className="home-screen">
      {showOnboarding ? <OnboardingOverlay onClose={closeOnboarding} startButtonRef={onboardingStartRef} /> : null}
      <section className="home-hero" aria-labelledby="home-title">
        <p className="hero-catch">パズルで覚える！</p>
        <h1 id="home-title">都道府県</h1>
        <p className="hero-copy">形を見て、場所を思い出して、都道府県を覚えよう！</p>
        <button type="button" className="onboarding-replay-button" onClick={() => setShowOnboarding(true)}>
          遊び方をもう一回
        </button>
      </section>

      <section className="mode-grid" aria-label="モードを選ぶ">
        <ModeCard
          className="mode-card primary-mode mode-red"
          emoji="⏱️"
          label="タイムアタック"
          title="全国47ピース"
          description="赤いガイドなしでじぶんのベストにちょうせん"
          meta={nationalBest ? `ベスト ${formatClock(nationalBest.bestTimeSeconds)}` : "まずはちょうせん"}
          isLaunchLocked={launchingMode !== null}
          isLaunching={launchingMode === "national-time-attack"}
          onLaunchAnimationEnd={finishLaunch}
          onClick={() => startLaunch("national-time-attack", onNationalTimeAttack)}
        />
        <ModeCard
          className="mode-card mode-green"
          emoji="🧭"
          label="覚えるモード"
          title="全国を練習"
          description="赤いガイドを見ながら形と場所を覚える"
          meta={learnBest ? `練習ベスト ${formatClock(learnBest.bestTimeSeconds)}` : "ゆっくり練習"}
          isLaunchLocked={launchingMode !== null}
          isLaunching={launchingMode === "national-learn"}
          onLaunchAnimationEnd={finishLaunch}
          onClick={() => startLaunch("national-learn", onNationalLearn)}
        />
        <ModeCard
          className="mode-card mode-blue"
          emoji="🚀"
          label="地方タイムアタック"
          title="地方ごとにちょうせん"
          description="ガイドなしで6地方を少しずつこうりゃく"
          meta="地方ごとにベストをのこす"
          isLaunchLocked={launchingMode !== null}
          isLaunching={launchingMode === "region-time-attack"}
          onLaunchAnimationEnd={finishLaunch}
          onClick={() => startLaunch("region-time-attack", onRegionTimeAttack)}
        />
        <ModeCard
          className="mode-card mode-orange"
          emoji="🌈"
          label="地方で覚える"
          title="少しずつ練習"
          description="赤いガイドつきで地方ごとに覚える"
          meta="北海道・東北から九州・沖縄まで"
          isLaunchLocked={launchingMode !== null}
          isLaunching={launchingMode === "region-learn"}
          onLaunchAnimationEnd={finishLaunch}
          onClick={() => startLaunch("region-learn", onRegionLearn)}
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
          isLaunchLocked={launchingMode !== null}
          isLaunching={launchingMode === "capital-quiz"}
          onLaunchAnimationEnd={finishLaunch}
          onClick={() => startLaunch("capital-quiz", onCapitalQuiz)}
        />
      </section>
      <footer className="home-footer">
        <span className="home-footer-tagline">「あったらいいな」をつくってる</span>
        <span className="home-footer-credit">
          <strong>野村 晃一</strong>
          <small>All rights reserves.</small>
        </span>
      </footer>
    </main>
  );
}
