import { describe, expect, it } from "vitest";

import { isInWindow } from "../../src/jobs/notification-scheduler";

const at = (hours: number, minutes: number): Date => {
  const d = new Date(2026, 5, 10);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

describe("isInWindow", () => {
  it("matches the exact target minute", () => {
    expect(isInWindow(at(8, 0), "08:00")).toBe(true);
  });

  it("matches up to 14 minutes after the target", () => {
    expect(isInWindow(at(8, 14), "08:00")).toBe(true);
  });

  it("does not match 15+ minutes after the target", () => {
    expect(isInWindow(at(8, 15), "08:00")).toBe(false);
  });

  it("does not match before the target", () => {
    expect(isInWindow(at(7, 59), "08:00")).toBe(false);
  });

  it("handles late-evening times", () => {
    expect(isInWindow(at(20, 5), "20:00")).toBe(true);
    expect(isInWindow(at(19, 55), "20:00")).toBe(false);
  });
});
