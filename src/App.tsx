import { useState } from "react";
import { AppShell } from "./components/Layout/AppShell";
import { CapitalQuizMode } from "./components/Modes/CapitalQuizMode";
import { ModeSelect } from "./components/Modes/ModeSelect";
import { PrefecturePuzzleMode } from "./components/Modes/PrefecturePuzzleMode";
import { RegionSelect } from "./components/Modes/RegionSelect";
import type { PuzzlePlayMode } from "./types/puzzle";

type Screen = "home" | "region-puzzle-select" | "region-quiz-select" | "prefecture-puzzle" | "capital-quiz";

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
  const [puzzlePlayMode, setPuzzlePlayMode] = useState<PuzzlePlayMode>("time-attack");

  const startNationalPuzzle = (playMode: PuzzlePlayMode = "time-attack") => {
    setPuzzlePlayMode(playMode);
    setSelectedRegionId(undefined);
    setScreen("prefecture-puzzle");
  };

  const startRegionPuzzle = (regionId: string, playMode: PuzzlePlayMode = puzzlePlayMode) => {
    setPuzzlePlayMode(playMode);
    setSelectedRegionId(regionId);
    setScreen("prefecture-puzzle");
  };

  const openRegionPuzzleSelect = (playMode: PuzzlePlayMode) => {
    setPuzzlePlayMode(playMode);
    setScreen("region-puzzle-select");
  };

  const startNationalQuiz = () => {
    setSelectedRegionId(undefined);
    setScreen("capital-quiz");
  };

  const startRegionQuiz = (regionId: string) => {
    setSelectedRegionId(regionId);
    setScreen("capital-quiz");
  };

  const goHome = () => {
    setSelectedRegionId(undefined);
    setScreen("home");
  };

  return (
    <AppShell>
      {screen === "home" ? (
        <ModeSelect
          onNationalLearn={() => startNationalPuzzle("learn")}
          onNationalTimeAttack={() => startNationalPuzzle("time-attack")}
          onRegionLearn={() => openRegionPuzzleSelect("learn")}
          onRegionTimeAttack={() => openRegionPuzzleSelect("time-attack")}
          onCapitalQuiz={() => setScreen("region-quiz-select")}
        />
      ) : null}

      {screen === "region-puzzle-select" ? (
        <RegionSelect
          title={puzzlePlayMode === "learn" ? "地方別 覚えるモード" : "地方別 タイムアタック"}
          description={
            puzzlePlayMode === "learn"
              ? "赤いガイドを見ながら、地方ごとに形と位置を覚えましょう。"
              : "ガイドなしで、地方ごとの自己ベストに挑戦しましょう。"
          }
          mode={puzzlePlayMode === "learn" ? "prefecture-learn-region" : "prefecture-region"}
          onSelectRegion={(regionId) => startRegionPuzzle(regionId, puzzlePlayMode)}
          onBack={goHome}
        />
      ) : null}

      {screen === "region-quiz-select" ? (
        <RegionSelect
          title="県庁所在地モード"
          description="県名を見て、県庁所在地を4択から選びます。"
          mode="capital-quiz"
          includeNational
          onSelectNational={startNationalQuiz}
          onSelectRegion={startRegionQuiz}
          onBack={goHome}
        />
      ) : null}

      {screen === "prefecture-puzzle" ? (
        <PrefecturePuzzleMode
          playMode={puzzlePlayMode}
          regionId={selectedRegionId}
          onHome={goHome}
          onStartNational={startNationalPuzzle}
          onStartRegion={startRegionPuzzle}
        />
      ) : null}

      {screen === "capital-quiz" ? (
        <CapitalQuizMode
          regionId={selectedRegionId}
          onHome={goHome}
          onStartNationalQuiz={startNationalQuiz}
          onStartRegionQuiz={startRegionQuiz}
        />
      ) : null}
    </AppShell>
  );
}
