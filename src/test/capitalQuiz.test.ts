import { describe, expect, it } from "vitest";
import type { Prefecture } from "../types/puzzle";
import {
  createCapitalQuizOptions,
  createCapitalQuizQuestions,
  hasDifferentCapitalName,
  type CapitalQuizQuestion
} from "../utils/capitalQuiz";

function pref(
  id: string,
  name: string,
  kana: string,
  regionId: string,
  capital: string,
  capitalKana: string
): Prefecture {
  return {
    id,
    name,
    kana,
    regionId,
    capital,
    capitalKana,
    path: "",
    centroid: { x: 0, y: 0 },
    bbox: { x: 0, y: 0, width: 1, height: 1 }
  };
}

const fixtures = [
  pref("kanagawa", "神奈川県", "かながわけん", "kanto", "横浜市", "よこはまし"),
  pref("tokyo", "東京都", "とうきょうと", "kanto", "新宿区", "しんじゅくく"),
  pref("chiba", "千葉県", "ちばけん", "kanto", "千葉市", "ちばし"),
  pref("saitama", "埼玉県", "さいたまけん", "kanto", "さいたま市", "さいたまし"),
  pref("nagano", "長野県", "ながのけん", "chubu", "長野市", "ながのし"),
  pref("aichi", "愛知県", "あいちけん", "chubu", "名古屋市", "なごやし")
];

describe("capital quiz question generation", () => {
  it("detects prefectures where the capital name is different", () => {
    expect(hasDifferentCapitalName(fixtures[0])).toBe(true);
    expect(hasDifferentCapitalName(fixtures[2])).toBe(false);
    expect(hasDifferentCapitalName(fixtures[3])).toBe(false);
  });

  it("uses only different-capital prefectures for the drill", () => {
    const questions = createCapitalQuizQuestions(fixtures, "different-capital");
    expect(questions.map((question) => question.prefecture.id).sort()).toEqual(["aichi", "kanagawa", "tokyo"]);
    expect(new Set(questions.map((question) => question.direction)).size).toBe(2);
  });

  it("prioritizes same-region distractors for normal choices", () => {
    const question: CapitalQuizQuestion = {
      prefecture: fixtures[0],
      direction: "prefecture-to-capital"
    };

    const options = createCapitalQuizOptions(question, fixtures, 4);
    const wrongOptions = options.filter((option) => !option.isCorrect);

    expect(options).toHaveLength(4);
    expect(options.some((option) => option.label === "横浜市" && option.isCorrect)).toBe(true);
    expect(wrongOptions.every((option) => ["tokyo", "chiba", "saitama"].includes(option.prefectureId))).toBe(true);
  });

  it("builds reverse questions with prefecture-name answers", () => {
    const question: CapitalQuizQuestion = {
      prefecture: fixtures[5],
      direction: "capital-to-prefecture"
    };

    const options = createCapitalQuizOptions(question, fixtures, 6);

    expect(options).toHaveLength(6);
    expect(options.some((option) => option.label === "愛知県" && option.isCorrect)).toBe(true);
    expect(options.every((option) => option.label.endsWith("県") || option.label === "東京都")).toBe(true);
  });
});
