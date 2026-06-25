import { timeTitles } from "../data/timeTitles";
import type { TimeTitle } from "../types/puzzle";

export function getTimeTitle(clearTimeSeconds: number): TimeTitle {
  const title = timeTitles.find((item) => {
    if (item.maxSeconds === null) {
      return clearTimeSeconds > item.minSeconds;
    }

    if (item.maxSeconds === 300) {
      return clearTimeSeconds >= item.minSeconds && clearTimeSeconds <= item.maxSeconds;
    }

    return clearTimeSeconds >= item.minSeconds && clearTimeSeconds < item.maxSeconds;
  });

  return title ?? timeTitles[timeTitles.length - 1];
}

export function getNextTitleGap(clearTimeSeconds: number): {
  isTopTitle: boolean;
  secondsNeeded: number;
  nextTitle?: TimeTitle;
} {
  const current = getTimeTitle(clearTimeSeconds);
  const currentIndex = timeTitles.findIndex((item) => item.id === current.id);

  if (currentIndex <= 0) {
    return { isTopTitle: true, secondsNeeded: 0 };
  }

  const secondsNeeded = Math.max(1, Math.ceil(clearTimeSeconds - current.minSeconds));
  return {
    isTopTitle: false,
    secondsNeeded,
    nextTitle: timeTitles[currentIndex - 1]
  };
}
