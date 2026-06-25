import type { Prefecture } from "../types/puzzle";
import { shuffle } from "./shuffle";

export type CapitalQuizVariant = "standard" | "different-capital";
export type CapitalQuizDirection = "prefecture-to-capital" | "capital-to-prefecture";

export type CapitalQuizQuestion = {
  prefecture: Prefecture;
  direction: CapitalQuizDirection;
};

export type CapitalQuizOption = {
  id: string;
  label: string;
  kana: string;
  value: string;
  isCorrect: boolean;
  prefectureId: string;
};

function stripPrefectureSuffix(value: string): string {
  return value.replace(/[都道府県]$/u, "");
}

function stripCapitalSuffix(value: string): string {
  return value.replace(/[市区町村]$/u, "");
}

function stripPrefectureKanaSuffix(value: string): string {
  return value.replace(/(どう|と|ふ|けん)$/u, "");
}

function stripCapitalKanaSuffix(value: string): string {
  return value.replace(/(ちょう|まち|むら|し|く)$/u, "");
}

export function hasSamePrefectureAndCapitalName(prefecture: Prefecture): boolean {
  const nameCore = stripPrefectureSuffix(prefecture.name);
  const capitalCore = stripCapitalSuffix(prefecture.capital);
  const kanaCore = stripPrefectureKanaSuffix(prefecture.kana);
  const capitalKanaCore = stripCapitalKanaSuffix(prefecture.capitalKana);

  return nameCore === capitalCore || kanaCore === capitalKanaCore;
}

export function hasDifferentCapitalName(prefecture: Prefecture): boolean {
  return !hasSamePrefectureAndCapitalName(prefecture);
}

export function getCapitalQuizPrefectures(
  scopePrefectures: Prefecture[],
  variant: CapitalQuizVariant
): Prefecture[] {
  if (variant === "different-capital") {
    return scopePrefectures.filter(hasDifferentCapitalName);
  }

  return scopePrefectures;
}

export function createCapitalQuizQuestions(
  scopePrefectures: Prefecture[],
  variant: CapitalQuizVariant
): CapitalQuizQuestion[] {
  return shuffle(getCapitalQuizPrefectures(scopePrefectures, variant)).map((prefecture, index) => ({
    prefecture,
    direction: index % 2 === 0 ? "prefecture-to-capital" : "capital-to-prefecture"
  }));
}

function collectDistractors(current: Prefecture, allPrefectures: Prefecture[]): Prefecture[] {
  const sameRegion = shuffle(
    allPrefectures.filter((prefecture) => prefecture.regionId === current.regionId && prefecture.id !== current.id)
  );
  const sameNameTraps = shuffle(
    allPrefectures.filter((prefecture) => prefecture.id !== current.id && hasSamePrefectureAndCapitalName(prefecture))
  );
  const differentCapitalTraps = shuffle(
    allPrefectures.filter((prefecture) => prefecture.id !== current.id && hasDifferentCapitalName(prefecture))
  );
  const fallback = shuffle(allPrefectures.filter((prefecture) => prefecture.id !== current.id));

  const seen = new Set<string>();
  return [...sameRegion, ...sameNameTraps, ...differentCapitalTraps, ...fallback].filter((prefecture) => {
    if (seen.has(prefecture.id)) {
      return false;
    }

    seen.add(prefecture.id);
    return true;
  });
}

export function createCapitalQuizOptions(
  question: CapitalQuizQuestion | undefined,
  allPrefectures: Prefecture[],
  optionCount: number
): CapitalQuizOption[] {
  if (!question) {
    return [];
  }

  const { prefecture, direction } = question;
  const distractors = collectDistractors(prefecture, allPrefectures).slice(0, Math.max(0, optionCount - 1));
  const candidates = shuffle([prefecture, ...distractors]);

  return candidates.map((candidate) => {
    const isCapitalAnswer = direction === "prefecture-to-capital";
    return {
      id: isCapitalAnswer ? candidate.capital : candidate.id,
      label: isCapitalAnswer ? candidate.capital : candidate.name,
      kana: isCapitalAnswer ? candidate.capitalKana : candidate.kana,
      value: isCapitalAnswer ? candidate.capital : candidate.id,
      isCorrect: candidate.id === prefecture.id,
      prefectureId: candidate.id
    };
  });
}
