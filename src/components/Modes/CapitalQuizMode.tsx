import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeaderBar } from "../Layout/HeaderBar";
import { JapanMap } from "../Map/JapanMap";
import { ZoomControls } from "../Map/ZoomControls";
import { ProgressPanel } from "../Puzzle/ProgressPanel";
import { ResultModal } from "../Puzzle/ResultModal";
import { TimeAttackPanel } from "../Puzzle/TimeAttackPanel";
import { prefectures } from "../../data/prefectures";
import { regionById, regions } from "../../data/regions";
import { useBestTime } from "../../hooks/useBestTime";
import { useMapViewport } from "../../hooks/useMapViewport";
import { useTimer } from "../../hooks/useTimer";
import type { Prefecture, PuzzleResult } from "../../types/puzzle";
import {
  createCapitalQuizOptions,
  createCapitalQuizQuestions,
  getCapitalQuizPrefectures,
  type CapitalQuizOption,
  type CapitalQuizQuestion,
  type CapitalQuizVariant
} from "../../utils/capitalQuiz";

type CapitalQuizModeProps = {
  regionId?: string;
  variant?: CapitalQuizVariant;
  onHome: () => void;
  onStartRegionQuiz: (regionId: string) => void;
};

type QuizPhase = "countdown" | "playing" | "complete";

function getScopePrefectures(regionId?: string): Prefecture[] {
  if (!regionId) {
    return prefectures;
  }

  const region = regionById.get(regionId);
  if (!region) {
    return prefectures;
  }

  return prefectures.filter((prefecture) => region.prefectureIds.includes(prefecture.id));
}

function RubyName({ label, kana }: { label: string; kana: string }) {
  return (
    <ruby>
      {label}
      <rt>{kana}</rt>
    </ruby>
  );
}

function CapitalTerm() {
  return (
    <ruby>
      県庁所在地<rt>けんちょうしょざいち</rt>
    </ruby>
  );
}

function getQuizModeLabel(variant: CapitalQuizVariant, regionId?: string) {
  if (variant === "different-capital") {
    return "県名とちがう市 とっくん";
  }

  return regionId ? `${regionById.get(regionId)?.name ?? "地方"} クイズ` : "全国 クイズ";
}

function getOpeningFeedback(variant: CapitalQuizVariant) {
  return variant === "different-capital"
    ? "県名と市名がちがうところだけを、6つから選びます。"
    : "県名から市名、市名から県名のもんだいが出ます。";
}

function getQuestionTitle(question: CapitalQuizQuestion | undefined) {
  if (!question) {
    return "じゅんび中";
  }

  if (question.direction === "prefecture-to-capital") {
    return (
      <>
        <RubyName label={question.prefecture.name} kana={question.prefecture.kana} />
        の<CapitalTerm />は？
      </>
    );
  }

  return (
    <>
      <RubyName label={question.prefecture.capital} kana={question.prefecture.capitalKana} />
      は、どの都道府県の<CapitalTerm />？
    </>
  );
}

function getCorrectAnswerText(question: CapitalQuizQuestion) {
  if (question.direction === "prefecture-to-capital") {
    return question.prefecture.capital;
  }

  return question.prefecture.name;
}

export function CapitalQuizMode({ regionId, variant = "standard", onHome, onStartRegionQuiz }: CapitalQuizModeProps) {
  const scopePrefectures = useMemo(() => getScopePrefectures(regionId), [regionId]);
  const quizPrefectures = useMemo(
    () => getCapitalQuizPrefectures(scopePrefectures, variant),
    [scopePrefectures, variant]
  );
  const scopeIds = useMemo(
    () => new Set((quizPrefectures.length > 0 ? quizPrefectures : scopePrefectures).map((prefecture) => prefecture.id)),
    [quizPrefectures, scopePrefectures]
  );
  const optionCount = variant === "different-capital" ? 6 : 4;
  const gameMode = variant === "different-capital" ? "capital-quiz-special" : "capital-quiz";
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [questions, setQuestions] = useState<CapitalQuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());
  const [isReview, setIsReview] = useState(false);
  const [feedback, setFeedback] = useState(getOpeningFeedback(variant));
  const [locked, setLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const timer = useTimer();
  const { bestTime, recordResult } = useBestTime(gameMode, regionId);
  const viewport = useMapViewport(regionId);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const currentQuestion = questions[questionIndex];
  const options = useMemo(
    () => createCapitalQuizOptions(currentQuestion, prefectures, optionCount),
    [currentQuestion, optionCount]
  );

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timer.reset();
    setQuestions(createCapitalQuizQuestions(scopePrefectures, variant));
    setQuestionIndex(0);
    setMistakes(0);
    setMissedIds(new Set());
    setIsReview(false);
    setFeedback(getOpeningFeedback(variant));
    setLocked(false);
    setSelectedOption(null);
    setResult(null);
    setPhase("countdown");
    setCountdown(3);

    if (regionId) {
      viewport.fitToRegion(regionId);
    } else {
      viewport.fitToJapan();
    }

    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setPhase("playing");
          timer.start();
          return 0;
        }

        return current - 1;
      });
    }, 850);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [regionId, runId, scopePrefectures, variant]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    if (regionId) {
      viewport.fitToRegion(regionId);
    } else {
      viewport.fitToRegion(currentQuestion.prefecture.regionId);
    }
  }, [currentQuestion?.prefecture.id, regionId]);

  const completeQuiz = useCallback(
    (finalMistakes: number) => {
      const clearTimeSeconds = timer.stop();
      const best = recordResult(clearTimeSeconds, finalMistakes);
      setResult({
        mode: gameMode,
        regionId,
        clearTimeSeconds,
        mistakes: finalMistakes,
        isNewBest: best.isNewBest
      });
      setPhase("complete");
    },
    [gameMode, recordResult, regionId, timer]
  );

  const moveNext = useCallback(
    (nextMissedIds: Set<string>, finalMistakes: number) => {
      const isLastQuestion = questionIndex >= questions.length - 1;

      if (!isLastQuestion) {
        setQuestionIndex((current) => current + 1);
        setLocked(false);
        setSelectedOption(null);
        setFeedback(isReview ? "ふくしゅう中です。落ち着いて選びましょう。" : "つぎのもんだいです。");
        return;
      }

      if (!isReview && nextMissedIds.size > 0) {
        const reviewQuestions = questions.filter((question) => nextMissedIds.has(question.prefecture.id));
        setQuestions(reviewQuestions);
        setQuestionIndex(0);
        setMissedIds(new Set());
        setIsReview(true);
        setLocked(false);
        setSelectedOption(null);
        setFeedback("まちがえたもんだいだけ、もう一回やってみよう。");
        return;
      }

      completeQuiz(finalMistakes);
    },
    [completeQuiz, isReview, questionIndex, questions]
  );

  const handleOption = useCallback(
    (option: CapitalQuizOption) => {
      if (phase !== "playing" || locked || !currentQuestion) {
        return;
      }

      const nextMistakes = option.isCorrect ? mistakes : mistakes + 1;
      const nextMissedIds = new Set(missedIds);

      setLocked(true);
      setSelectedOption(option.value);
      setMistakes(nextMistakes);

      if (option.isCorrect) {
        setFeedback(`${getCorrectAnswerText(currentQuestion)}、せいかい！`);
      } else {
        nextMissedIds.add(currentQuestion.prefecture.id);
        setMissedIds(nextMissedIds);
        setFeedback(`答えは${getCorrectAnswerText(currentQuestion)}です。あとでふくしゅうできます。`);
      }

      timeoutRef.current = window.setTimeout(() => {
        moveNext(nextMissedIds, nextMistakes);
      }, option.isCorrect ? 650 : 950);
    },
    [currentQuestion, locked, mistakes, missedIds, moveNext, phase]
  );

  const handleRetry = useCallback(() => setRunId((current) => current + 1), []);

  const handleFit = useCallback(() => {
    if (regionId) {
      viewport.fitToRegion(regionId);
    } else if (currentQuestion) {
      viewport.fitToRegion(currentQuestion.prefecture.regionId);
    } else {
      viewport.fitToJapan();
    }
  }, [currentQuestion, regionId, viewport]);

  const handleNextRegion = useCallback(() => {
    if (!regionId) {
      return;
    }

    const currentIndex = regions.findIndex((region) => region.id === regionId);
    const nextRegion = regions[(currentIndex + 1) % regions.length];
    onStartRegionQuiz(nextRegion.id);
  }, [onStartRegionQuiz, regionId]);

  return (
    <main className="quiz-screen">
      <HeaderBar onHome={onHome}>
        <button type="button" className="ghost-button compact" onClick={handleRetry}>
          リセット
        </button>
        <button type="button" className="ghost-button compact" onClick={onHome}>
          モードを選ぶ
        </button>
      </HeaderBar>

      <section className="play-status" aria-label="クイズのようす">
        <TimeAttackPanel elapsedSeconds={timer.elapsedSeconds} bestTime={bestTime} />
        <ProgressPanel
          placedCount={Math.min(questionIndex + (locked ? 1 : 0), Math.max(questions.length, 1))}
          totalCount={Math.max(questions.length, 1)}
          mistakes={mistakes}
        />
        <p className="status-message" aria-live="polite">
          {isReview ? "ふくしゅう中" : getQuizModeLabel(variant, regionId)} / {feedback}
        </p>
      </section>

      <section className="quiz-main">
        <div className={`quiz-card ${locked ? (selectedOption && options.find((option) => option.value === selectedOption)?.isCorrect ? "is-correct" : "is-wrong") : ""}`} aria-live="polite">
          <p className="quiz-step">
            {isReview ? "ふくしゅう" : variant === "different-capital" ? "6択とっくん" : "4択クイズ"}
          </p>
          <h1>{getQuestionTitle(currentQuestion)}</h1>
          <div className={`option-grid ${optionCount === 6 ? "has-six-options" : ""}`}>
            {options.map((option) => {
              const className = [
                "option-button",
                locked && selectedOption === option.value ? "is-selected" : "",
                locked && option.isCorrect ? "is-correct" : "",
                locked && selectedOption === option.value && !option.isCorrect ? "is-wrong" : ""
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={`${option.prefectureId}-${option.value}`}
                  type="button"
                  className={className}
                  disabled={phase !== "playing" || locked}
                  onClick={() => handleOption(option)}
                >
                  <RubyName label={option.label} kana={option.kana} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="quiz-map-panel">
          <JapanMap
            svgRef={svgRef}
            viewBox={viewport.viewBox}
            placedIds={new Set()}
            scopeIds={scopeIds}
            targetId={currentQuestion?.prefecture.id}
            hintedId={locked ? currentQuestion?.prefecture.id : undefined}
          />
          <ZoomControls
            fitLabel={regionId ? "この地方を見る" : "出るはんいを見る"}
            onZoomIn={viewport.zoomIn}
            onZoomOut={viewport.zoomOut}
            onFit={handleFit}
          />
        </div>

        {phase === "countdown" ? (
          <div className="countdown" aria-live="assertive">
            <span>{countdown > 0 ? countdown : "スタート！"}</span>
          </div>
        ) : null}
      </section>

      {result ? (
        <ResultModal
          result={result}
          totalCount={quizPrefectures.length}
          onRetry={handleRetry}
          onNextRegion={regionId ? handleNextRegion : undefined}
          onHome={onHome}
        />
      ) : null}
    </main>
  );
}
