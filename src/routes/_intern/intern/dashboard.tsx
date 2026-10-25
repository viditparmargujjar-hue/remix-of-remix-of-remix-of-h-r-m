import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Circle, Clock, ListTodo, Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { computeStats, formatDate, hoursByDay, isOverdue, todayISO, useMyMember, useTasks, useWorkLogs, type Task } from "@/lib/data";
import { EmptyState, ErrorState, PageHeader, PriorityBadge, StatusBadge } from "@/components/app/bits";
import { InternTaskDialog } from "@/components/app/InternTaskDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_intern/intern/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Dashboard – Intern Portal" },
      { name: "description", content: "An overview of your assigned work and daily progress." },
      { property: "og:title", content: "My Dashboard – Intern Portal" },
      { property: "og:description", content: "An overview of your assigned work and daily progress." },
    ],
  }),
  component: InternDashboard,
});

function InternDashboard() {
  const { data: me } = useMyMember();
  const { data: tasks = [], isLoading, error } = useTasks();
  const { data: logs = [] } = useWorkLogs(me?.user_id ?? "none");
  const [open, setOpen] = useState<Task | null>(null);
  const s = computeStats(tasks);
  const today = logs.filter((l) => l.date === todayISO());
  const hoursToday = today.reduce((a, l) => a + l.hours_worked, 0);
  const week = hoursByDay(logs, 7);
  const active = tasks.filter((t) => t.status !== "done").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const cards = [
    { label: "Total Assigned", value: s.total, icon: ListTodo, cls: "bg-accent text-accent-foreground" },
    { label: "Pending", value: s.todo, icon: Circle, cls: "bg-todo-soft text-todo" },
    { label: "In Progress", value: s.inProgress, icon: Clock, cls: "bg-progress-soft text-progress" },
    { label: "Completed", value: s.done, icon: CheckCircle2, cls: "bg-success-soft text-success" },
    { label: "Overdue", value: s.overdue, icon: AlertCircle, cls: "bg-danger-soft text-danger" },
  ];

  return (
    <div>
      <PageHeader title={`Welcome, ${me?.name?.split(" ")[0] ?? "there"} 👋`} subtitle="Here is an overview of your assigned work." />
      {error && <ErrorState message="Your assigned tasks could not be loaded." />}
      {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => <div key={c.label} className={cn("card-hover rounded-2xl p-5", c.cls)}><c.icon className="size-5" /><p className="mt-4 text-3xl font-extrabold">{c.value}</p><p className="text-sm font-medium opacity-80">{c.label}</p></div>)}
        </div>
      )}

      {active[0] && <section className="mt-6 border-y py-5"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="text-xs font-semibold text-primary">Continue working</p><h2 className="mt-1 break-words text-lg font-bold">{active[0].title}</h2><p className="mt-1 text-sm text-muted-foreground">Due {formatDate(active[0].due_date)} · {active[0].progress}% complete</p></div><Button onClick={() => setOpen(active[0] ?? null)}>Open task</Button></div></section>}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card-soft p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Up next</h2><Link to="/intern/tasks" className="text-sm font-semibold text-primary hover:underline">All tasks</Link></div>
          {active.length === 0 ? <EmptyState title="Nothing pending 🎉" hint="You're all caught up." /> : (
            <ul className="space-y-3">
              {active.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Button variant="outline" onClick={() => setOpen(t)} className="block h-auto w-full whitespace-normal rounded-xl p-4 text-left">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><span className="break-words font-semibold">{t.title}</span><span className="flex gap-2"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></span></div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><Progress value={t.progress} className="h-1.5 flex-1" /><span>{t.progress}%</span><span className={cn(isOverdue(t) && "font-semibold text-danger")}>Due {formatDate(t.due_date)}</span></div>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft space-y-4 p-5">
          <h2 className="text-lg font-bold">Daily progress</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-accent p-3"><Timer className="size-4 text-accent-foreground" /><p className="mt-2 text-2xl font-extrabold">{hoursToday}h</p><p className="text-xs text-muted-foreground">Worked today</p></div>
            <div className="rounded-xl bg-success-soft p-3"><ClipboardIcon /><p className="mt-2 text-2xl font-extrabold">{new Set(today.map((l) => l.task_id).filter(Boolean)).size}</p><p className="text-xs text-muted-foreground">Tasks today</p></div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Weekly productivity</p>
            <div className="h-40"><ResponsiveContainer><BarChart data={week}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} fontSize={11} width={24} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => [`${v} h`, "Hours"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} /><Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold">Latest update</p>
            {logs[0] ? <p className="text-sm text-muted-foreground">{formatDate(logs[0].date)} — {logs[0].work_completed}</p> : <p className="text-sm text-muted-foreground">No work logged yet. <Link to="/intern/work-log" className="font-semibold text-primary">Add one</Link></p>}
          </div>
        </div>
      </div>
      <InternTaskDialog task={open ? tasks.find((t) => t.id === open.id) ?? null : null} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}

function ClipboardIcon() {
  return <CheckCircle2 className="size-4 text-success" />;
}
