import type { Task, Status } from "./data";

export interface TaskAssignment {
  task_id: string;
  member_id: string;
  status: Status;
  progress: number;
  review_status: Task["review_status"];
  review_note: string | null;
  completed_at: string | null;
  updated_at: string;
}

export function assigneeIds(task: Task): string[] {
  return task.assignments ? task.assignments.map((a) => a.member_id) : task.assigned_to ? [task.assigned_to] : [];
}

export function taskForMember(task: Task, memberId: string): Task {
  const assignment = task.assignments?.find((a) => a.member_id === memberId);
  return assignment ? { ...task, ...assignment, id: task.id, assigned_to: memberId } : task;
}

export function hydrateAssignments(tasks: Task[], assignments: TaskAssignment[], memberId?: string | null): Task[] {
  return tasks.map((task) => {
    const shared = { ...task, assignments: assignments.filter((a) => a.task_id === task.id) };
    return memberId ? taskForMember(shared, memberId) : shared;
  });
}