import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultModal } from "../components/Puzzle/ResultModal";
import type { PuzzleResult } from "../types/puzzle";

const noop = () => undefined;

function renderResult(result: PuzzleResult, totalCount: number) {
  return renderToStaticMarkup(
    <ResultModal
      result={result}
      totalCount={totalCount}
      onRetry={noop}
      onNextRegion={result.mode === "prefecture-region" ? noop : undefined}
      onNational={result.mode === "prefecture-region" ? noop : undefined}
      onHome={noop}
    />
  );
}

describe("result modal title display", () => {
  it("keeps the title card for national time attack", () => {
    const html = renderResult(
      {
        mode: "prefecture-national",
        clearTimeSeconds: 72,
        mistakes: 1,
        isNewBest: true
      },
      47
    );

    expect(html).toContain("time-title-badge");
    expect(html).toContain("称号");
    expect(html).toContain("次の称号まであと12秒");
    expect(html).toContain("自己ベスト更新！");
  });

  it("hides title-related content for region time attack", () => {
    const html = renderResult(
      {
        mode: "prefecture-region",
        regionId: "kanto",
        clearTimeSeconds: 42,
        mistakes: 0,
        isNewBest: true
      },
      7
    );

    expect(html).not.toContain("time-title-badge");
    expect(html).not.toContain("称号");
    expect(html).not.toContain("次の称号");
    expect(html).not.toContain("最上位称号");
    expect(html).not.toContain("全国モードへ");
    expect(html).toContain("関東地方 タイムアタック");
    expect(html).toContain("自己ベスト更新！");
    expect(html).toContain("次の地方へ");
  });
});
