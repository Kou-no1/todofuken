import { describe, expect, it } from "vitest";
import { getNextTitleGap, getTimeTitle } from "../utils/timeTitle";

describe("time title rules", () => {
  it("matches the required boundary titles", () => {
    expect(getTimeTitle(29.9).title).toBe("日本地図の神速マスター");
    expect(getTimeTitle(30).title).toBe("都道府県チャンピオン");
    expect(getTimeTitle(45).title).toBe("地図パズル名人");
    expect(getTimeTitle(300).title).toBe("完走チャレンジャー");
    expect(getTimeTitle(300.1).title).toBe("じっくり地図たんけん家");
  });

  it("calculates seconds needed for the next faster title", () => {
    const gap = getNextTitleGap(72);
    expect(gap.isTopTitle).toBe(false);
    expect(gap.secondsNeeded).toBe(12);
    expect(gap.nextTitle?.title).toBe("地図パズル名人");
  });

  it("reports top title achievement", () => {
    const gap = getNextTitleGap(18);
    expect(gap.isTopTitle).toBe(true);
    expect(gap.secondsNeeded).toBe(0);
  });
});
