import { getNextTitleGap, getTimeTitle } from "./timeTitle";

export function createResultSummary(clearTimeSeconds: number) {
  const title = getTimeTitle(clearTimeSeconds);
  const nextGap = getNextTitleGap(clearTimeSeconds);

  return {
    title,
    nextGap
  };
}
