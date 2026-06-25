import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BottomTray } from "../Layout/BottomTray";
import { HeaderBar } from "../Layout/HeaderBar";
import { JapanMap } from "../Map/JapanMap";
import { MiniMap } from "../Map/MiniMap";
import { ZoomControls } from "../Map/ZoomControls";
import { DragLayer } from "../Puzzle/DragLayer";
import { HintPanel } from "../Puzzle/HintPanel";
import { ProgressPanel } from "../Puzzle/ProgressPanel";
import { PuzzlePiece } from "../Puzzle/PuzzlePiece";
import { ResultModal } from "../Puzzle/ResultModal";
import { TimeAttackPanel } from "../Puzzle/TimeAttackPanel";
import { prefectureById, prefectures } from "../../data/prefectures";
import { regionById, regions } from "../../data/regions";
import { useBestTime } from "../../hooks/useBestTime";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { useMapViewport } from "../../hooks/useMapViewport";
import { usePuzzleState } from "../../hooks/usePuzzleState";
import { useTimer } from "../../hooks/useTimer";
import type { GameMode, Prefecture, PuzzleResult } from "../../types/puzzle";
import { isDropCorrect, pointFromClientPosition } from "../../utils/geometry";
import { shuffle } from "../../utils/shuffle";

type PrefecturePuzzleModeProps = {
  regionId?: string;
  onHome: () => void;
  onStartNational: () => void;
  onStartRegion: (regionId: string) => void;
};

type PuzzlePhase = "countdown" | "playing" | "complete";

function getScopePrefectures(regionId?: string): Prefecture[] {
  if (!regionId) {
    return prefectures;
  }

  const region = regionById.get(regionId);
  if (!region) {
    return prefectures;
  }

  return region.prefectureIds
    .map((prefectureId) => prefectureById.get(prefectureId))
    .filter((prefecture): prefecture is Prefecture => Boolean(prefecture));
}

export function PrefecturePuzzleMode({ regionId, onHome, onStartNational, onStartRegion }: PrefecturePuzzleModeProps) {
  const mode: GameMode = regionId ? "prefecture-region" : "prefecture-national";
  const scopePrefectures = useMemo(() => getScopePrefectures(regionId), [regionId]);
  const scopeIds = useMemo(() => new Set(scopePrefectures.map((prefecture) => prefecture.id)), [scopePrefectures]);
  const scopeIdList = useMemo(() => scopePrefectures.map((prefecture) => prefecture.id), [scopePrefectures]);
  const scopeKey = regionId ?? "national";
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<PuzzlePhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [pieceOrder, setPieceOrder] = useState<string[]>([]);
  const [targetId, setTargetId] = useState<string | undefined>();
  const [hintedId, setHintedId] = useState<string | undefined>();
  const [result, setResult] = useState<PuzzleResult | null>(null);

  const timer = useTimer();
  const { bestTime, recordResult } = useBestTime(mode, regionId);
  const drag = useDragAndDrop();
  const viewport = useMapViewport(regionId);
  const puzzle = usePuzzleState(scopeIdList);

  useEffect(() => {
    puzzle.reset();
    timer.reset();
    drag.endDrag();
    setResult(null);
    setTargetId(undefined);
    setHintedId(undefined);
    setPieceOrder(shuffle(scopeIdList));
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

    return () => window.clearInterval(intervalId);
  }, [runId, scopeKey]);

  const remainingPrefectures = useMemo(() => {
    const orderedIds = pieceOrder.length > 0 ? pieceOrder : scopeIdList;
    return orderedIds
      .map((id) => prefectureById.get(id))
      .filter((prefecture): prefecture is Prefecture => Boolean(prefecture))
      .filter((prefecture) => !puzzle.placedIds.has(prefecture.id));
  }, [pieceOrder, puzzle.placedIds, scopeIdList]);

  const activePrefecture = drag.activeDrag ? prefectureById.get(drag.activeDrag.prefectureId) : undefined;

  const completePuzzle = useCallback(
    (finalMistakes: number) => {
      const clearTimeSeconds = timer.stop();
      const best = recordResult(clearTimeSeconds, finalMistakes);
      setResult({
        mode,
        regionId,
        clearTimeSeconds,
        mistakes: finalMistakes,
        isNewBest: best.isNewBest
      });
      setPhase("complete");
    },
    [mode, recordResult, regionId, timer]
  );

  const finishDrop = useCallback(
    (clientX: number, clientY: number) => {
      const active = drag.activeDrag;
      const target = active ? prefectureById.get(active.prefectureId) : undefined;
      drag.endDrag();
      setTargetId(undefined);

      if (!active || !target || phase !== "playing") {
        return;
      }

      const rect = svgRef.current?.getBoundingClientRect();
      const isInsideMap =
        Boolean(rect) &&
        clientX >= rect!.left &&
        clientX <= rect!.right &&
        clientY >= rect!.top &&
        clientY <= rect!.bottom;

      const dropPoint = rect ? pointFromClientPosition(clientX, clientY, rect, viewport.viewBox) : null;
      const isCorrect = Boolean(isInsideMap && dropPoint && isDropCorrect(target, dropPoint));

      if (isCorrect) {
        puzzle.placeCorrect(target.id, target.name);
        setHintedId(undefined);
        const nextPlacedCount = puzzle.placedIds.size + 1;

        if (nextPlacedCount >= scopeIdList.length) {
          completePuzzle(puzzle.mistakes);
        }
      } else {
        puzzle.markMistake(target.name);
        setHintedId(target.id);
      }
    },
    [completePuzzle, drag, phase, puzzle, scopeIdList.length, viewport.viewBox]
  );

  useEffect(() => {
    if (!drag.activeDrag) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      drag.moveDrag(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();
      finishDrop(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerUp, { passive: false });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [drag.activeDrag, drag.moveDrag, finishDrop]);

  const handlePiecePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, prefecture: Prefecture) => {
      if (phase !== "playing") {
        return;
      }

      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is a convenience only; window-level listeners still handle the drag.
      }

      drag.startDrag(prefecture.id, event.clientX, event.clientY);
      setTargetId(prefecture.id);
      setHintedId(undefined);

      if (regionId) {
        viewport.fitToRegion(regionId);
      } else {
        viewport.fitToRegion(prefecture.regionId);
      }

      const regionName = regionById.get(prefecture.regionId)?.name ?? "この地方";
      puzzle.setFeedback(`${prefecture.name}は${regionName}にあります。地図が近づきました。`);
    },
    [drag, phase, puzzle, regionId, viewport]
  );

  const handleHint = useCallback(() => {
    const target = activePrefecture ?? remainingPrefectures[0];
    if (!target) {
      return;
    }

    setHintedId(target.id);
    viewport.fitToPrefecture(target.id, 95);
    const regionName = regionById.get(target.regionId)?.name ?? "この地方";
    puzzle.setFeedback(`${target.name}は${regionName}。県庁所在地は${target.capital}です。光っている場所を見てみよう。`);
  }, [activePrefecture, puzzle, remainingPrefectures, viewport]);

  const handleFit = useCallback(() => {
    if (regionId) {
      viewport.fitToRegion(regionId);
    } else {
      viewport.fitToJapan();
    }
  }, [regionId, viewport]);

  const handleRetry = useCallback(() => {
    setRunId((current) => current + 1);
  }, []);

  const handleNextRegion = useCallback(() => {
    if (!regionId) {
      return;
    }

    const currentIndex = regions.findIndex((region) => region.id === regionId);
    const nextRegion = regions[(currentIndex + 1) % regions.length];
    onStartRegion(nextRegion.id);
  }, [onStartRegion, regionId]);

  return (
    <main className="puzzle-screen">
      <HeaderBar onHome={onHome}>
        <button type="button" className="ghost-button compact" onClick={handleRetry}>
          リセット
        </button>
        <button type="button" className="ghost-button compact" onClick={onHome}>
          モード選択
        </button>
      </HeaderBar>

      <section className="play-status" aria-label="プレイ状況">
        <TimeAttackPanel elapsedSeconds={timer.elapsedSeconds} bestTime={bestTime} />
        <ProgressPanel placedCount={puzzle.placedCount} totalCount={puzzle.totalCount} mistakes={puzzle.mistakes} />
        <p className="status-message" aria-live="polite">
          {regionId ? regionById.get(regionId)?.name : "全国モード"} / {puzzle.feedback}
        </p>
      </section>

      <section className="map-stage" aria-label="地図エリア">
        <JapanMap
          svgRef={svgRef}
          viewBox={viewport.viewBox}
          placedIds={puzzle.placedIds}
          scopeIds={scopeIds}
          targetId={targetId}
          hintedId={hintedId}
        />
        <MiniMap viewBox={viewport.viewBox} scopeIds={scopeIds} />
        <ZoomControls
          fitLabel={regionId ? "この地方を表示" : "全国表示"}
          onZoomIn={viewport.zoomIn}
          onZoomOut={viewport.zoomOut}
          onFit={handleFit}
        />
        <HintPanel
          message={activePrefecture ? `${activePrefecture.name}を持っています。` : "困ったらヒントで場所を光らせます。"}
          targetName={activePrefecture?.name ?? remainingPrefectures[0]?.name}
          onHint={handleHint}
        />
        {phase === "countdown" ? (
          <div className="countdown" aria-live="assertive">
            <span>{countdown > 0 ? countdown : "スタート！"}</span>
          </div>
        ) : null}
      </section>

      <BottomTray label={regionId ? "この地方のピース" : "都道府県ピース"}>
        {remainingPrefectures.map((prefecture) => (
          <PuzzlePiece
            key={prefecture.id}
            prefecture={prefecture}
            disabled={phase !== "playing"}
            onPointerDown={handlePiecePointerDown}
          />
        ))}
      </BottomTray>

      <DragLayer activeDrag={drag.activeDrag} prefecture={activePrefecture} />

      {result ? (
        <ResultModal
          result={result}
          totalCount={scopeIdList.length}
          onRetry={handleRetry}
          onNextRegion={regionId ? handleNextRegion : undefined}
          onNational={regionId ? onStartNational : undefined}
          onHome={onHome}
        />
      ) : null}
    </main>
  );
}
