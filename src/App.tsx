import { useState } from "react";
import { AppShell } from "./components/Layout/AppShell";
import { CapitalQuizMode } from "./components/Modes/CapitalQuizMode";
import { ModeSelect } from "./components/Modes/ModeSelect";
import { PrefecturePuzzleMode } from "./components/Modes/PrefecturePuzzleMode";
import { RegionSelect } from "./components/Modes/RegionSelect";
import type { PuzzlePlayMode } from "./types/puzzle";
import type { CapitalQuizVariant } from "./utils/capitalQuiz";

type Screen = "home" | "region-puzzle-select" | "region-quiz-select" | "prefecture-puzzle" | "capital-quiz";

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
  const [puzzlePlayMode, setPuzzlePlayMode] = useState<PuzzlePlayMode>("time-attack");
  const [capitalQuizVariant, setCapitalQuizVariant] = useState<CapitalQuizVariant>("standard");

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

  const startNationalQuiz = (variant: CapitalQuizVariant = "standard") => {
    setCapitalQuizVariant(variant);
    setSelectedRegionId(undefined);
    setScreen("capital-quiz");
  };

  const startRegionQuiz = (regionId: string) => {
    setCapitalQuizVariant("standard");
    setSelectedRegionId(regionId);
    setScreen("capital-quiz");
  };

  const startDifferentCapitalQuiz = () => {
    startNationalQuiz("different-capital");
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
          title={puzzlePlayMode === "learn" ? "地方ごとにおぼえる" : "地方タイムアタック"}
          description={
            puzzlePlayMode === "learn"
              ? "赤いガイドを見ながら、地方ごとに形と場所をおぼえよう。"
              : "ガイドなしで、地方ごとのじぶんのベストにちょうせんしよう。"
          }
          mode={puzzlePlayMode === "learn" ? "prefecture-learn-region" : "prefecture-region"}
          onSelectRegion={(regionId) => startRegionPuzzle(regionId, puzzlePlayMode)}
          onBack={goHome}
        />
      ) : null}

      {screen === "region-quiz-select" ? (
        <RegionSelect
          title={
            <>
              <ruby>
                県庁所在地<rt>けんちょうしょざいち</rt>
              </ruby>
              クイズ
            </>
          }
          description="県名から市名、市名から県名を選ぶもんだいが出ます。"
          mode="capital-quiz"
          includeNational
          onSelectNational={() => startNationalQuiz()}
          onSelectRegion={startRegionQuiz}
          extraCards={[
            {
              emoji: "🎯",
              label: "6択とっくん",
              title: "県名とちがう市",
              description: "よくまちがえるところだけを、6つから選ぼう。",
              meta: "ベストは別にのこります",
              onClick: startDifferentCapitalQuiz,
              mode: "capital-quiz-special"
            }
          ]}
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
          variant={capitalQuizVariant}
          onHome={goHome}
          onStartRegionQuiz={startRegionQuiz}
        />
      ) : null}
    </AppShell>
  );
}
