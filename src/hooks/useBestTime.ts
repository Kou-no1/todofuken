import { useCallback, useEffect, useState } from "react";
import type { BestTimeRecord, GameMode } from "../types/puzzle";
import { readStoredValue, writeStoredValue } from "../utils/storage";

const STORAGE_PREFIX = "pref-puzzle:best";

export function getBestTimeKey(mode: GameMode, regionId?: string): string {
  if (mode === "prefecture-region" || mode === "prefecture-learn-region") {
    return `${STORAGE_PREFIX}:${mode}:${regionId ?? "unknown"}`;
  }

  if (mode === "capital-quiz" || mode === "capital-quiz-special" || mode === "capital-label" || mode === "capital-pin") {
    return `${STORAGE_PREFIX}:${mode}:${regionId ?? "national"}`;
  }

  return `${STORAGE_PREFIX}:${mode}`;
}

export function loadBestTime(mode: GameMode, regionId?: string): BestTimeRecord | null {
  const rawRecord = readStoredValue(getBestTimeKey(mode, regionId));
  if (!rawRecord) {
    return null;
  }

  try {
    const record = JSON.parse(rawRecord) as BestTimeRecord | null;
    if (!record || record.mode !== mode || record.regionId !== regionId ||
        !Number.isFinite(record.bestTimeSeconds) || record.bestTimeSeconds < 0 ||
        !Number.isInteger(record.bestMistakes) || record.bestMistakes < 0 ||
        typeof record.achievedAt !== "string") {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function saveBestTimeIfImproved(
  mode: GameMode,
  regionId: string | undefined,
  clearTimeSeconds: number,
  mistakes: number
): { record: BestTimeRecord; isNewBest: boolean } {
  const current = loadBestTime(mode, regionId);
  const isNewBest =
    current === null ||
    clearTimeSeconds < current.bestTimeSeconds ||
    (clearTimeSeconds === current.bestTimeSeconds && mistakes < current.bestMistakes);

  const record: BestTimeRecord = isNewBest
    ? {
        mode,
        regionId,
        bestTimeSeconds: clearTimeSeconds,
        bestMistakes: mistakes,
        achievedAt: new Date().toISOString()
      }
    : current;

  if (isNewBest) {
    writeStoredValue(getBestTimeKey(mode, regionId), JSON.stringify(record));
  }

  return { record, isNewBest };
}

export function useBestTime(mode: GameMode, regionId?: string) {
  const [bestTime, setBestTime] = useState<BestTimeRecord | null>(() => loadBestTime(mode, regionId));

  useEffect(() => {
    setBestTime(loadBestTime(mode, regionId));
  }, [mode, regionId]);

  const recordResult = useCallback(
    (clearTimeSeconds: number, mistakes: number) => {
      const result = saveBestTimeIfImproved(mode, regionId, clearTimeSeconds, mistakes);
      setBestTime(result.record);
      return result;
    },
    [mode, regionId]
  );

  return { bestTime, recordResult };
}
