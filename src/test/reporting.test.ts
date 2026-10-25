import { describe, expect, it } from "vitest";
import { dateBefore, tasksInPeriod, validPeriod, weeklyHours } from "@/lib/reporting";
import { completionSeries } from "@/components/app/DashboardWidgets";
import type { Task, WorkLog } from "@/lib/data";

const task = (id: string, created: string, completed: string | null = null) => ({ id, created_at: `${created}T12:00:00Z`, completed_at: completed ? `${completed}T12:00:00Z` : null } as Task);
describe("Report periods", () => {
  it("uses exactly seven inclusive calendar days across month boundaries", () => {
    expect(dateBefore("2026-10-03", 6)).toBe("2026-09-27");
    expect(dateBefore("2026-03-01", 1)).toBe("2026-02-28");
  });
  it("rejects empty or reversed custom ranges", () => {
    expect(validPeriod("", "2026-10-13")).toBe(false);
    expect(validPeriod("2026-10-14", "2026-10-13")).toBe(false);
  });
  it("counts only tasks created inside the selected period", () => {
    const tasks = [task("old", "2026-09-01"), task("start", "2026-10-01"), task("end", "2026-10-07"), task("later", "2026-10-08")];
    expect(tasksInPeriod(tasks, "2026-10-01", "2026-10-07").map((t) => t.id)).toEqual(["start", "end"]);
  });
  it("anchors completion events to the selected historical end date", () => {
    const series = completionSeries([task("a", "2026-09-29", "2026-10-01")], 3, "2026-10-01");
    expect(series.map((s) => s.date)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
    expect(series.map((s) => s.completed)).toEqual([0, 0, 1]);
    expect(series.map((s) => s.created)).toEqual([1, 0, 0]);
  });
  it("groups actual logged hours by chronological weeks across years", () => {
    const logs = [{ date: "2026-01-06", hours_worked: 3 }, { date: "2025-12-31", hours_worked: 2 }, { date: "2026-01-01", hours_worked: 1.5 }, { date: "2026-02-01", hours_worked: 10 }] as WorkLog[];
    expect(weeklyHours(logs, "2025-12-30", "2026-01-07").map((w) => [w.date, w.hours])).toEqual([["2025-12-29", 3.5], ["2026-01-05", 3]]);
  });
});