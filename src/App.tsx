import { useState } from "react";
import { AppShell } from "./components/Layout/AppShell";
import { CapitalQuizMode } from "./components/Modes/CapitalQuizMode";
import { ModeSelect } from "./components/Modes/ModeSelect";
import { PrefecturePuzzleMode } from "./components/Modes/PrefecturePuzzleMode";
import { RegionSelect } from "./components/Modes/RegionSelect";

type Screen = "home" | "region-puzzle-select" | "region-quiz-select" | "prefecture-puzzle" | "capital-quiz";

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);

  const startNationalPuzzle = () => {
    setSelectedRegionId(undefined);
    setScreen("prefecture-puzzle");
  };

  const startRegionPuzzle = (regionId: string) => {
    setSelectedRegionId(regionId);
    setScreen("prefecture-puzzle");
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
          onNationalPuzzle={startNationalPuzzle}
          onRegionPuzzle={() => setScreen("region-puzzle-select")}
          onCapitalQuiz={() => setScreen("region-quiz-select")}
        />
      ) : null}

      {screen === "region-puzzle-select" ? (
        <RegionSelect
          title="地方モード"
          description="少ない数のピースから練習して、少しずつ全国へ進みましょう。"
          mode="prefecture-region"
          onSelectRegion={startRegionPuzzle}
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
