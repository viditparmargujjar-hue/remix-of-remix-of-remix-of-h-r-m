import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarOff, Clock, Plus } from "lucide-react";
import { AdminKpis, DeadlineList, OverdueAlerts, TrendChart } from "@/components/app/DashboardWidgets";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computeStats, useTasks, useMembers, useAllUpdates, formatDate } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { useAdminProfile } from "@/lib/profile";
import { EmptyState, ErrorState, PageHeader } from "@/components/app/bits";
import { TaskTable } from "@/components/app/TaskTable";
import { TaskFormDialog } from "@/components/app/TaskDialogs";
import { cn } from "@/lib/utils";
import { useAttendance, useLeaves } from "@/lib/hr";
import { todayISO } from "@/lib/data";
import { assigneeIds, taskForMember } from "@/lib/task-assignments";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dashboard – Task Manager" },
      { name: "description", content: "Team productivity, task progress and deadlines at a glance." },
      { property: "og:title", content: "Dashboard – Task Manager" },
      { property: "og:description", content: "Team productivity, task progress and deadlines at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { data: members = [] } = useMembers();
  const profile = useAdminProfile();
  const [open, setOpen] = useState(false);
  const s = computeStats(tasks);
  const pct = (n: number) => (s.total ? (n / s.total) * 100 : 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Here's what's happening with your team today, ${profile.name}.`}
        action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Create Task</Button>}
      />
      {error && <ErrorState message="Couldn't load tasks. Please refresh the page." />}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <>
          <AdminKpis tasks={tasks} members={members} />
          <OverdueAlerts tasks={tasks} members={members} />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card-soft p-5 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Completion trend</h2><Link to="/reports" className="text-sm font-semibold text-primary hover:underline">Full reports</Link></div>
              <TrendChart tasks={tasks} />
            </div>
            <div className="card-soft p-5">
              <h2 className="mb-1 text-lg font-bold">Upcoming deadlines</h2>
              <DeadlineList tasks={tasks} members={members} />
            </div>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card-soft lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-2">
            <h2 className="text-lg font-bold">Recently assigned</h2>
            <Link to="/tasks" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          {isLoading ? <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : tasks.length === 0 ? <EmptyState title="No tasks yet" hint="Create your first task to get started." />
            : <TaskTable tasks={tasks.slice(0, 6)} />}
        </div>

        <div className="card-soft p-5">
          <h2 className="text-lg font-bold">Productivity</h2>
          <p className="text-sm text-muted-foreground">Overall task completion</p>
          <div className="relative mx-auto my-6 size-40">
            <svg viewBox="0 0 36 36" className="size-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="3.2" />
              <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-primary transition-all duration-700" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${s.completion} 100`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div><p className="text-3xl font-extrabold">{s.completion}%</p><p className="text-xs text-muted-foreground">completed</p></div>
            </div>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="bg-success transition-all" style={{ width: `${pct(s.done)}%` }} />
            <div className="bg-progress transition-all" style={{ width: `${pct(s.inProgress)}%` }} />
            <div className="bg-todo transition-all" style={{ width: `${pct(s.todo)}%` }} />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {[["Completed", s.done, "bg-success"], ["In Progress", s.inProgress, "bg-progress"], ["To Do", s.todo, "bg-todo"], ["Overdue", s.overdue, "bg-danger"]].map(([l, v, c]) => (
              <li key={l as string} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", c as string)} />{l}</span><span className="font-semibold">{v}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <PeopleSummary />
      <InternSection />
      <TaskFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function InternSection() {
  const { data: members = [] } = useMembers();
  const { data: tasks = [] } = useTasks();
  const { data: updates = [] } = useAllUpdates(6);
  const interns = members.filter((m) => m.user_id || m.email.endsWith("@example.com"));
  const recentDone = tasks.filter((t) => t.status === "done").sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="card-soft overflow-x-auto p-5 lg:col-span-2">
        <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <h2 className="text-lg font-bold">Intern & sample workload</h2>
          <span className="text-sm text-muted-foreground">{interns.length} interns · {interns.filter((m) => m.is_active).length} active</span>
        </div>
        {interns.length === 0 ? <p className="text-sm text-muted-foreground">No interns yet. <Link to="/team" className="font-semibold text-primary">Add one</Link></p> : (
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Intern</th><th>Assigned</th><th>Completed</th><th>Pending</th><th>Progress</th></tr></thead>
            <tbody>{interns.map((m) => {
              const mine = tasks.filter((t) => assigneeIds(t).includes(m.id)).map((t) => taskForMember(t, m.id));
              const done = mine.filter((t) => t.status === "done").length;
              const avg = mine.length ? Math.round(mine.reduce((a, t) => a + t.progress, 0) / mine.length) : 0;
              return (<tr key={m.id} className="border-b last:border-0">
                <td className="py-2.5">{m.user_id ? <Link to="/team/$id" params={{ id: m.id }} className="font-semibold hover:text-primary">{m.name}</Link> : <Link to="/team/$id" params={{ id: m.id }} className="font-semibold hover:text-primary">{m.name}<span className="ml-2 text-xs font-normal text-muted-foreground">Sample</span></Link>}</td>
                <td>{mine.length}</td><td>{done}</td><td>{mine.length - done}</td>
                <td><div className="flex items-center gap-2"><Progress value={avg} className="h-1.5 w-20" /><span className="text-xs">{avg}%</span></div></td>
              </tr>);
            })}</tbody>
          </table>
        )}
      </div>
      <div className="card-soft p-5">
        <h2 className="mb-3 text-lg font-bold">Intern activity</h2>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Latest updates</p>
        {updates.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No updates yet.</p> : (
          <ul className="mb-4 space-y-2">{updates.map((u) => <li key={u.id} className="text-sm"><span className="font-semibold">{u.author_name}:</span> {u.message.slice(0, 90)}<span className="block text-xs text-muted-foreground">{formatDate(u.created_at)}</span></li>)}</ul>
        )}
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Recently completed</p>
        <ul className="space-y-1.5">{recentDone.map((t) => <li key={t.id} className="flex justify-between gap-2 text-sm"><span className="truncate">{t.title}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(t.updated_at)}</span></li>)}</ul>
      </div>
    </div>
  );
}

function PeopleSummary() {
  const attendance = useAttendance();
  const leaves = useLeaves();
  const today = new Set((attendance.data ?? []).filter((a) => a.date === todayISO()).map((a) => a.user_id)).size;
  const pending = (leaves.data ?? []).filter((l) => l.status === "pending").length;
  return <section aria-label="People overview" className="mt-6 grid gap-4 sm:grid-cols-2">
    {[{ label: "Attendance today", icon: Clock, query: attendance, value: today, to: "/attendance" as const }, { label: "Pending leave requests", icon: CalendarOff, query: leaves, value: pending, to: "/leave" as const }].map((item) => <Link key={item.label} to={item.to} className="card-soft card-hover flex items-center gap-4 p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><item.icon className="size-5" /></span>
      <div><p className="text-sm text-muted-foreground">{item.label}</p>{item.query.isLoading ? <Skeleton className="mt-1 h-7 w-16" /> : item.query.error ? <p className="text-sm text-danger">Unavailable</p> : <><p className="text-2xl font-bold">{item.value}</p>{!item.query.data?.length && <p className="text-xs text-muted-foreground">No records available</p>}</>}</div>
    </Link>)}
  </section>;
}
