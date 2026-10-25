import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { hydrateAssignments, type TaskAssignment } from "./task-assignments";

export type Status = "todo" | "in_progress" | "done";
export type Priority = "high" | "medium" | "low";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at: string;
  user_id: string | null;
  phone: string | null;
  department: string | null;
  joining_date: string | null;
  is_active: boolean;
}
export interface Task {
  assignments?: TaskAssignment[];
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string;
  assigned_to: string | null;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category: Category;
  review_status: ReviewStatus | null;
  review_note: string | null;
  completed_at: string | null;
}
export type Category = "Development" | "Design" | "Research" | "Testing" | "Documentation" | "Other";
export type ReviewStatus = "submitted" | "changes_requested" | "approved";
export const CATEGORIES: Category[] = ["Development", "Design", "Research", "Testing", "Documentation", "Other"];
export const REVIEW_LABEL: Record<ReviewStatus, string> = { submitted: "Submitted for Review", changes_requested: "Changes Requested", approved: "Approved" };
export interface HistoryRow {
  id: string;
  task_id: string;
  updated_by: string | null;
  previous_status: Status | null;
  status: Status;
  timestamp: string;
  old_progress: number | null;
  new_progress: number | null;
}
export interface TaskUpdate { id: string; task_id: string; user_id: string; author_name: string; author_role: string; message: string; created_at: string }
export interface WorkLog {
  id: string; intern_id: string; task_id: string | null; date: string; work_completed: string;
  hours_worked: number; progress: number; notes: string | null; blockers?: string | null; attachment_url: string | null; created_at: string; updated_at: string;
}
export interface Notification { id: string; user_id: string; title: string; message: string; type: string; related_task_id: string | null; is_read: boolean; created_at: string }

export const STATUS_LABEL: Record<Status, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
export const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };
export const STATUSES: Status[] = ["todo", "in_progress", "done"];
export const PRIORITIES: Priority[] = ["high", "medium", "low"];
export const ROLES = ["Frontend Developer", "Backend Developer", "UI/UX Designer", "Full Stack Developer", "QA Tester"];

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export const isOverdue = (t: Task) => t.status !== "done" && t.due_date < todayISO();

export function computeStats(tasks: Task[]) {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(isOverdue).length;
  const completion = total ? Math.round((done / total) * 100) : 0;
  return { total, todo, inProgress, done, overdue, completion };
}

export function formatDate(d: string) {
  return new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export const initials = (n: string) =>
  n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const db = supabase as any;

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await db.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: assignments, error: assignmentError } = await supabase.from("task_assignments").select("*");
      if (assignmentError) throw assignmentError;
      const { data: memberId, error: memberError } = await supabase.rpc("my_member_id");
      if (memberError) throw memberError;
      return hydrateAssignments(data as Task[], assignments as TaskAssignment[], memberId);
    },
  });
}
export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await db.from("team_members").select("*").order("name");
      if (error) throw error;
      return data as Member[];
    },
  });
}
export function useTaskHistory(taskId: string | null) {
  return useQuery({
    queryKey: ["history", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await db
        .from("task_history")
        .select("*")
        .eq("task_id", taskId)
        .order("timestamp", { ascending: false });
      if (error) throw error;
      return data as HistoryRow[];
    },
  });
}

export type TaskInput = Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "assigned_to" | "category"> & { assignee_ids?: string[] };
export type MemberInput = Pick<Member, "name" | "email" | "role" | "avatar"> & Partial<Pick<Member, "phone" | "department" | "joining_date">>;

function useMut<V>(fn: (v: V) => Promise<unknown>, success: string, keys: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: V) => {
      const r = (await fn(v)) as { error?: { message: string } };
      if (r?.error) throw new Error(r.error.message);
    },
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      toast.success(success);
    },
    onError: (e: Error) => toast.error(e.message || "Something went wrong"),
  });
}

export const useCreateTask = () =>
  useMut((v: TaskInput) => db.rpc("save_shared_task", { _id: null, _details: v, _members: v.assignee_ids ?? (v.assigned_to ? [v.assigned_to] : []) }), "Task created", [["tasks"], ["history"]]);
export const useUpdateTask = (msg = "Task updated") =>
  useMut(
    ({ id, ...v }: Partial<TaskInput> & { id: string }) => v.title !== undefined
      ? db.rpc("save_shared_task", { _id: id, _details: v, _members: v.assignee_ids ?? (v.assigned_to ? [v.assigned_to] : []) })
      : db.rpc("set_shared_task_status", { _task: id, _status: v.status }),
    msg,
    [["tasks"], ["history"]],
  );
export const useDeleteTask = () =>
  useMut((id: string) => db.from("tasks").delete().eq("id", id), "Task deleted", [["tasks"]]);

export const useCreateMember = () =>
  useMut((v: MemberInput) => db.from("team_members").insert(v), "Team member added", [["members"]]);
export const useUpdateMember = () =>
  useMut(
    ({ id, ...v }: Partial<MemberInput> & { id: string }) => db.from("team_members").update(v).eq("id", id),
    "Intern updated",
    [["members"]],
  );
export const useDeleteMember = () =>
  useMut((id: string) => db.from("team_members").delete().eq("id", id), "Team member removed", [
    ["members"],
    ["tasks"],
  ]);

export function useTaskUpdates(taskId: string | null) {
  return useQuery({
    queryKey: ["updates", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await db.from("task_updates").select("*").eq("task_id", taskId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskUpdate[];
    },
  });
}
export function useAllUpdates(limit = 8) {
  return useQuery({
    queryKey: ["updates", "all", limit],
    queryFn: async () => {
      const { data, error } = await db.from("task_updates").select("*").order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data as TaskUpdate[];
    },
  });
}
export const useAddUpdate = () =>
  useMut((v: { task_id: string; message: string }) => db.from("task_updates").insert(v), "Update posted", [["updates"]]);

export function useWorkLogs(internId?: string | null) {
  return useQuery({
    queryKey: ["worklogs", internId ?? "all"],
    queryFn: async () => {
      let q = db.from("work_logs").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
      if (internId) q = q.eq("intern_id", internId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as WorkLog[]).map((w) => ({ ...w, hours_worked: Number(w.hours_worked) }));
    },
  });
}
export type WorkLogInput = Pick<WorkLog, "task_id" | "date" | "work_completed" | "hours_worked" | "progress" | "notes" | "attachment_url"> & { blockers?: string | null };
export const useSaveWorkLog = () =>
  useMut(
    ({ id, ...v }: WorkLogInput & { id?: string }) => (id ? db.from("work_logs").update(v).eq("id", id) : db.from("work_logs").insert(v)),
    "Work log saved",
    [["worklogs"]],
  );
export const useDeleteWorkLog = () =>
  useMut((id: string) => db.from("work_logs").delete().eq("id", id), "Work log deleted", [["worklogs"]]);

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await db.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });
}
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | "all") => {
      const q = db.from("notifications").update({ is_read: true });
      const { error } = id === "all" ? await q.eq("is_read", false) : await q.eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useInternUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { task: string; status: Status; progress: number; message: string }) => {
      const { error } = await db.rpc("intern_update_task", { _task: v.task, _status: v.status, _progress: v.progress, _message: v.message });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      ["tasks", "updates", "history"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success("Progress updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyMember() {
  return useQuery({
    queryKey: ["my-member"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await db.from("team_members").select("*").eq("user_id", u.user?.id).maybeSingle();
      if (error) throw error;
      return data as Member | null;
    },
  });
}

export function hoursByDay(logs: WorkLog[], days = 7) {
  const out: { day: string; date: string; hours: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    out.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), date: iso, hours: logs.filter((l) => l.date === iso).reduce((a, l) => a + l.hours_worked, 0) });
  }
  return out;
}

export function useReviewTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { task: string; member?: string; decision: "approved" | "changes_requested"; note: string }) => {
      const { error } = await db.rpc(v.member ? "review_task_assignment" : "review_task", { _task: v.task, ...(v.member ? { _member: v.member } : {}), _decision: v.decision, _note: v.note });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, v) => {
      ["tasks", "history"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success(v.decision === "approved" ? "Work approved" : "Changes requested");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function downloadCSV(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.error("Nothing to export"); return; }
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => { const t = v == null ? "" : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${name}-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function isoDaysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
