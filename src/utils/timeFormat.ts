export function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatClearTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.round((safeSeconds % 60) * 10) / 10;

  if (minutes === 0) {
    return `${remainingSeconds.toFixed(remainingSeconds % 1 === 0 ? 0 : 1)}秒`;
  }

  return `${minutes}分${remainingSeconds.toFixed(remainingSeconds % 1 === 0 ? 0 : 1)}秒`;
}
