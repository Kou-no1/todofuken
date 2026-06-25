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
import { shuffle, takeRandom } from "../../utils/shuffle";

type CapitalQuizModeProps = {
  regionId?: string;
  onHome: () => void;
  onStartNationalQuiz: () => void;
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

function makeOptions(current: Prefecture | undefined): string[] {
  if (!current) {
    return [];
  }

  const otherCapitals = takeRandom(
    prefectures.map((prefecture) => prefecture.capital),
    3,
    [current.capital]
  );

  return shuffle([current.capital, ...otherCapitals]);
}

export function CapitalQuizMode({ regionId, onHome, onStartNationalQuiz, onStartRegionQuiz }: CapitalQuizModeProps) {
  const scopePrefectures = useMemo(() => getScopePrefectures(regionId), [regionId]);
  const scopeIds = useMemo(() => new Set(scopePrefectures.map((prefecture) => prefecture.id)), [scopePrefectures]);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [questions, setQuestions] = useState<Prefecture[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set());
  const [isReview, setIsReview] = useState(false);
  const [feedback, setFeedback] = useState("県名を見て、県庁所在地を選びましょう。");
  const [locked, setLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const timer = useTimer();
  const { bestTime, recordResult } = useBestTime("capital-quiz", regionId);
  const viewport = useMapViewport(regionId);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const currentQuestion = questions[questionIndex];
  const options = useMemo(() => makeOptions(currentQuestion), [currentQuestion?.id]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timer.reset();
    setQuestions(shuffle(scopePrefectures));
    setQuestionIndex(0);
    setMistakes(0);
    setMissedIds(new Set());
    setIsReview(false);
    setFeedback("県名を見て、県庁所在地を選びましょう。");
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
  }, [regionId, runId]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    if (regionId) {
      viewport.fitToRegion(regionId);
    } else {
      viewport.fitToRegion(currentQuestion.regionId);
    }
  }, [currentQuestion?.id, regionId]);

  const completeQuiz = useCallback(
    (finalMistakes: number) => {
      const clearTimeSeconds = timer.stop();
      const best = recordResult(clearTimeSeconds, finalMistakes);
      setResult({
        mode: "capital-quiz",
        regionId,
        clearTimeSeconds,
        mistakes: finalMistakes,
        isNewBest: best.isNewBest
      });
      setPhase("complete");
    },
    [recordResult, regionId, timer]
  );

  const moveNext = useCallback(
    (nextMissedIds: Set<string>, finalMistakes: number) => {
      const isLastQuestion = questionIndex >= questions.length - 1;

      if (!isLastQuestion) {
        setQuestionIndex((current) => current + 1);
        setLocked(false);
        setSelectedOption(null);
        setFeedback(isReview ? "復習問題です。落ち着いて選びましょう。" : "次の問題です。");
        return;
      }

      if (!isReview && nextMissedIds.size > 0) {
        const reviewQuestions = scopePrefectures.filter((prefecture) => nextMissedIds.has(prefecture.id));
        setQuestions(reviewQuestions);
        setQuestionIndex(0);
        setMissedIds(new Set());
        setIsReview(true);
        setLocked(false);
        setSelectedOption(null);
        setFeedback("間違えた問題だけ復習します。ここで覚え直しましょう。");
        return;
      }

      completeQuiz(finalMistakes);
    },
    [completeQuiz, isReview, questionIndex, questions.length, scopePrefectures]
  );

  const handleOption = useCallback(
    (option: string) => {
      if (phase !== "playing" || locked || !currentQuestion) {
        return;
      }

      const isCorrect = option === currentQuestion.capital;
      const nextMistakes = isCorrect ? mistakes : mistakes + 1;
      const nextMissedIds = new Set(missedIds);

      setLocked(true);
      setSelectedOption(option);
      setMistakes(nextMistakes);

      if (isCorrect) {
        setFeedback(`${currentQuestion.capital}、正解！`);
      } else {
        nextMissedIds.add(currentQuestion.id);
        setMissedIds(nextMissedIds);
        setFeedback(`答えは${currentQuestion.capital}です。あとで復習できます。`);
      }

      timeoutRef.current = window.setTimeout(() => {
        moveNext(nextMissedIds, nextMistakes);
      }, isCorrect ? 650 : 900);
    },
    [currentQuestion, locked, mistakes, missedIds, moveNext, phase]
  );

  const handleRetry = useCallback(() => setRunId((current) => current + 1), []);

  const handleFit = useCallback(() => {
    if (regionId) {
      viewport.fitToRegion(regionId);
    } else if (currentQuestion) {
      viewport.fitToRegion(currentQuestion.regionId);
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
          モード選択
        </button>
      </HeaderBar>

      <section className="play-status" aria-label="クイズ状況">
        <TimeAttackPanel elapsedSeconds={timer.elapsedSeconds} bestTime={bestTime} />
        <ProgressPanel
          placedCount={Math.min(questionIndex + (locked ? 1 : 0), Math.max(questions.length, 1))}
          totalCount={Math.max(questions.length, 1)}
          mistakes={mistakes}
        />
        <p className="status-message" aria-live="polite">
          {isReview ? "復習中" : regionId ? regionById.get(regionId)?.name : "全国 県庁所在地クイズ"} / {feedback}
        </p>
      </section>

      <section className="quiz-main">
        <div className="quiz-card" aria-live="polite">
          <p className="quiz-step">{isReview ? "復習問題" : "4択クイズ"}</p>
          <h1>{currentQuestion ? `${currentQuestion.name}の県庁所在地は？` : "準備中"}</h1>
          <div className="option-grid">
            {options.map((option) => {
              const isCorrectOption = option === currentQuestion?.capital;
              const className = [
                "option-button",
                locked && selectedOption === option ? "is-selected" : "",
                locked && isCorrectOption ? "is-correct" : "",
                locked && selectedOption === option && !isCorrectOption ? "is-wrong" : ""
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={option}
                  type="button"
                  className={className}
                  disabled={phase !== "playing" || locked}
                  onClick={() => handleOption(option)}
                >
                  {option}
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
            targetId={currentQuestion?.id}
            hintedId={locked ? currentQuestion?.id : undefined}
          />
          <ZoomControls
            fitLabel={regionId ? "この地方を表示" : "出題範囲を表示"}
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
          totalCount={scopePrefectures.length}
          onRetry={handleRetry}
          onNextRegion={regionId ? handleNextRegion : undefined}
          onHome={onHome}
        />
      ) : null}
    </main>
  );
}
