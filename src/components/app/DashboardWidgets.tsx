import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, GraduationCap, ListTodo, UserCheck, type LucideIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, isOverdue, isoDaysAgo, todayISO, type Member, type Task } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MemberAvatar, PriorityBadge } from "./bits";
import { dateBefore } from "@/lib/reporting";
import { assigneeIds } from "@/lib/task-assignments";

function Kpi({ label, value, icon: Icon, tone, delta, to, search }: { label: string; value: number; icon: LucideIcon; tone: string; delta?: number | null; to: "/tasks" | "/team"; search?: Record<string, string> }) {
  return (
    <Link to={to} search={search as never} className="card-soft card-hover block p-5">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-lg", tone)}><Icon className="size-4.5" /></span>
        {delta != null && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", delta >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{delta >= 0 ? "+" : ""}{delta} vs prev 30d</span>}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

const inRange = (d: string | null, from: string, to: string) => !!d && d.slice(0, 10) >= from && d.slice(0, 10) <= to;

export function AdminKpis({ tasks, members }: { tasks: Task[]; members: Member[] }) {
  const interns = members.filter((m) => m.user_id);
  const t0 = todayISO(), d30 = isoDaysAgo(30), d60 = isoDaysAgo(60);
  const hasHistory = tasks.some((t) => t.created_at.slice(0, 10) < d30);
  const diff = (f: (t: Task) => string | null) => (hasHistory ? tasks.filter((t) => inRange(f(t), d30, t0)).length - tasks.filter((t) => inRange(f(t), d60, d30)).length : null);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total interns" value={interns.length} icon={GraduationCap} tone="bg-accent text-accent-foreground" to="/team" />
      <Kpi label="Active interns" value={interns.filter((m) => m.is_active).length} icon={UserCheck} tone="bg-violet-soft text-violet" to="/team" />
      <Kpi label="Total tasks" value={tasks.length} icon={ListTodo} tone="bg-todo-soft text-todo" delta={diff((t) => t.created_at)} to="/tasks" />
      <Kpi label="Completed" value={tasks.filter((t) => t.status === "done").length} icon={CheckCircle2} tone="bg-success-soft text-success" delta={diff((t) => t.completed_at)} to="/tasks" search={{ status: "done" }} />
      <Kpi label="Pending tasks" value={tasks.filter((t) => t.status !== "done").length} icon={Clock} tone="bg-progress-soft text-progress" to="/tasks" search={{ status: "pending" }} />
      <Kpi label="Overdue" value={tasks.filter(isOverdue).length} icon={AlertTriangle} tone="bg-danger-soft text-danger" to="/tasks" search={{ status: "overdue" }} />
    </div>
  );
}

export function completionSeries(tasks: Task[], days: number, end = todayISO()) {
  const out: { date: string; label: string; completed: number; created: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dateBefore(end, i);
    out.push({
      date: d,
      label: new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      completed: tasks.filter((t) => t.completed_at?.slice(0, 10) === d).length,
      created: tasks.filter((t) => t.created_at.slice(0, 10) === d).length,
    });
  }
  return out;
}

export function TrendChart({ tasks, days = 14, end = todayISO() }: { tasks: Task[]; days?: number; end?: string }) {
  const data = completionSeries(tasks, days, end);
  const empty = data.every((d) => !d.completed && !d.created);
  return (
    <div className="h-64">
      {empty ? (
        <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">Not enough activity in this period yet.<br />The trend appears once tasks are created or completed.</div>
      ) : (
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: -20, right: 8 }}>
            <defs>
              <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--success)" stopOpacity={0} /></linearGradient>
              <linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} />
            <Area type="monotone" dataKey="created" name="Created" stroke="var(--primary)" fill="url(#gn)" strokeWidth={2} />
            <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--success)" fill="url(#gc)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DeadlineList({ tasks, members }: { tasks: Task[]; members: Member[] }) {
  const t0 = todayISO();
  const upcoming = tasks.filter((t) => t.status !== "done" && t.due_date >= t0).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 6);
  if (!upcoming.length) return <p className="py-8 text-center text-sm text-muted-foreground">No upcoming deadlines.</p>;
  return (
    <ul className="divide-y">
      {upcoming.map((t) => {
        const days = Math.round((new Date(t.due_date + "T00:00:00").getTime() - new Date(t0 + "T00:00:00").getTime()) / 86400000);
        return (
           <li key={t.id} className="py-2.5"><Link to="/tasks" search={{ q: t.title }} className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
            <MemberAvatar member={members.find((m) => m.id === t.assigned_to) ?? null} size="sm" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{t.title}</p><p className="text-xs text-muted-foreground">{formatDate(t.due_date)}</p></div>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", days <= 1 ? "bg-danger-soft text-danger" : days <= 3 ? "bg-progress-soft text-progress" : "bg-muted text-muted-foreground")}>{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}</span>
           </Link></li>
        );
      })}
    </ul>
  );
}

export function OverdueAlerts({ tasks, members }: { tasks: Task[]; members: Member[] }) {
  const list = tasks.filter(isOverdue).sort((a, b) => a.due_date.localeCompare(b.due_date));
  if (!list.length) return null;
  return (
    <div className="mt-6 rounded-xl border border-danger/30 bg-danger-soft p-4">
      <div className="mb-2 flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="size-4" />{list.length} overdue task{list.length > 1 && "s"}
        <Link to="/tasks" search={{ status: "overdue" }} className="ml-auto shrink-0 text-sm hover:underline">Review all</Link>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, 6).map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-lg bg-card p-2.5 text-sm">
            <PriorityBadge priority={t.priority} /><Link to="/tasks" search={{ q: t.title }} className="min-w-0 flex-1 truncate font-medium hover:underline">{t.title}</Link>
            <span className="text-xs text-muted-foreground">{assigneeIds(t).map((id) => members.find((m) => m.id === id)?.name.split(" ")[0] ?? "Intern").join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
