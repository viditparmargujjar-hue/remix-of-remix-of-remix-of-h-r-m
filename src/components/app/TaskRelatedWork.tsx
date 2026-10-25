import { Link } from "@tanstack/react-router";
import { formatDate, useMembers, useWorkLogs, type Task } from "@/lib/data";
import { GOAL_STATUS, useGoals } from "@/lib/goals";
import { Progress } from "@/components/ui/progress";
import { ErrorState } from "./bits";
import { assigneeIds } from "@/lib/task-assignments";

export function TaskRelatedWork({ task, intern = false }: { task: Task; intern?: boolean }) {
  const logs = useWorkLogs();
  const goals = useGoals();
  const { data: members = [] } = useMembers();
  const relatedLogs = (logs.data ?? []).filter((l) => l.task_id === task.id);
  const ownerGoals = (goals.data ?? []).filter((g) => g.owner_id && assigneeIds(task).includes(g.owner_id));
  const total = relatedLogs.reduce((sum, l) => sum + l.hours_worked, 0);
  return <>
    <section aria-label="Task work logs" className="border-t pt-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Work logs</h3><span className="text-xs text-muted-foreground">{total.toFixed(1)}h logged</span></div>
      {logs.isLoading ? <p className="text-sm text-muted-foreground">Loading work logs…</p> : logs.error ? <ErrorState message="Work logs could not be loaded." /> : relatedLogs.length === 0 ? <p className="text-sm text-muted-foreground">No work logged for this task.</p> : <ul className="space-y-3">{relatedLogs.map((l) => <li key={l.id} className="border-b pb-3 last:border-0">
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{formatDate(l.date)} · {members.find((m) => m.user_id === l.intern_id)?.name ?? "Intern"}</span><span>{l.hours_worked}h · {l.progress}%</span></div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{l.work_completed}</p>
        {l.blockers && <p className="mt-1 break-words text-sm text-danger">Blocker: {l.blockers}</p>}
        {l.notes && <p className="mt-1 break-words text-xs text-muted-foreground">{l.notes}</p>}
      </li>)}</ul>}
    </section>
    <section aria-label="Assignee goals" className="border-t pt-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Assignee’s goals</h3><Link to={intern ? "/intern/goals" : "/goals"} className="text-xs font-semibold text-primary hover:underline">All goals</Link></div>
      {goals.isLoading ? <p className="text-sm text-muted-foreground">Loading goals…</p> : goals.error ? <ErrorState message="Goals could not be loaded." /> : ownerGoals.length === 0 ? <p className="text-sm text-muted-foreground">No goals for this assignee.</p> : <ul className="space-y-3">{ownerGoals.map((g) => <li key={g.id}>
        <p className="break-words text-sm font-medium">{g.title}</p><p className="mt-1 text-xs text-muted-foreground">{GOAL_STATUS[g.status]} · Target {formatDate(g.target_date)}</p>
        <div className="mt-2 flex items-center gap-3"><Progress value={g.progress} className="h-1.5 flex-1" /><span className="text-xs">{g.progress}%</span></div>
      </li>)}</ul>}
    </section>
  </>;
}