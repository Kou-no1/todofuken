import { describe, expect, it } from "vitest";
import { formatClearTime, formatClock } from "../utils/timeFormat";

describe("time formatting", () => {
  it("carries rounded seconds into the next minute", () => {
    expect(formatClearTime(59.99)).toBe("1分0秒");
    expect(formatClearTime(119.99)).toBe("2分0秒");
    expect(formatClearTime(72.34)).toBe("1分12.3秒");
  });
  it("handles missing or invalid records without showing NaN", () => {
    expect(formatClock(NaN)).toBe("0:00");
    expect(formatClearTime(Infinity)).toBe("0秒");
  });
});
