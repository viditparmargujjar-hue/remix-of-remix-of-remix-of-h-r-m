import { describe, it, expect } from "vitest";
import { assigneeIds, hydrateAssignments, taskForMember, type TaskAssignment } from "@/lib/task-assignments";
import type { Task } from "@/lib/data";

const task = { id: "shared", assigned_to: "first", status: "in_progress", progress: 30 } as Task;
const assignments: TaskAssignment[] = [
  { task_id: "shared", member_id: "first", status: "in_progress", progress: 60, review_status: null, review_note: null, completed_at: null, updated_at: "2026-10-21" },
  { task_id: "shared", member_id: "second", status: "todo", progress: 0, review_status: null, review_note: null, completed_at: null, updated_at: "2026-10-21" },
];
describe("Shared assignments", () => {
  it("includes both interns on one task", () => {
    expect(assigneeIds(hydrateAssignments([task], assignments)[0] as Task)).toEqual(["first", "second"]);
  });
  it("keeps each intern's progress independent", () => {
    const [shared] = hydrateAssignments([task], assignments);
    if (!shared) throw new Error("Missing task");
    expect(taskForMember(shared, "first").progress).toBe(60);
    expect(taskForMember(shared, "second").progress).toBe(0);
    expect(taskForMember(shared, "second").status).toBe("todo");
    expect(shared.progress).toBe(30);
  });
  it("overlays only the signed-in intern's assignment", () => {
    expect(hydrateAssignments([task], assignments, "second")[0]?.progress).toBe(0);
    expect(hydrateAssignments([task], assignments, "first")[0]?.progress).toBe(60);
  });
  it("preserves legacy single-assignee membership", () => {
    expect(assigneeIds(task)).toEqual(["first"]);
  });
});