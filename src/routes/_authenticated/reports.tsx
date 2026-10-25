import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PolarAngleAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computeStats, downloadCSV, isOverdue, isoDaysAgo, todayISO, useMembers, useTasks, useWorkLogs } from "@/lib/data";
import { TrendChart } from "@/components/app/DashboardWidgets";
import { ErrorState, PageHeader } from "@/components/app/bits";
import { StatCards } from "@/components/app/StatCards";
import { dateBefore, tasksInPeriod, validPeriod, weeklyHours } from "@/lib/reporting";
import { assigneeIds, taskForMember } from "@/lib/task-assignments";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Reports – Task Manager" },
      { name: "description", content: "Task status, priority, logged hours and team performance for a selected period." },
      { property: "og:title", content: "Reports – Task Manager" },
      { property: "og:description", content: "Task status, priority, logged hours and team performance for a selected period." },
    ],
  }),
  component: Reports,
});

const C = { todo: "var(--todo)", progress: "var(--progress)", done: "var(--success)", high: "var(--danger)", primary: "var(--primary)" };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card-soft p-5"><h2 className="mb-4 font-bold">{title}</h2><div className="h-72">{children}</div></div>;
}

function Reports() {
  const { data: allTasks = [], isLoading, error } = useTasks();
  const { data: members = [] } = useMembers();
  const { data: logs = [], isLoading: logsLoading, error: logsError } = useWorkLogs();
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(todayISO());
  const t = range === "custom" ? to : todayISO();
  const f = range === "custom" ? from : dateBefore(t, Number(range) - 1);
  const valid = validPeriod(f, t);
  const tasks = tasksInPeriod(allTasks, f, t);
  const rangeLogs = valid ? logs.filter((l) => l.date >= f && l.date <= t) : [];
  const s = computeStats(tasks);
  const days = valid ? Math.round((new Date(t).getTime() - new Date(f).getTime()) / 86400000) + 1 : 0;
  const weekData = weeklyHours(logs, f, t);
  const pendingReview = tasks.filter((x) => x.review_status === "submitted").length;
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name ?? "";
  const exportTasks = () => downloadCSV("tasks-report", tasks.flatMap((task) => {
    const ids = assigneeIds(task);
    return (ids.length ? ids : [null]).map((id) => {
      const x = id ? taskForMember(task, id) : task;
      return { title: x.title, category: x.category, status: x.status, priority: x.priority, progress: x.progress, assignee: memberName(id), due_date: x.due_date, overdue: isOverdue(x), review: x.review_status ?? "", created_at: x.created_at, completed_at: x.completed_at ?? "" };
    });
  }));
  const exportLogs = () => downloadCSV("work-logs", rangeLogs.map((l) => ({ date: l.date, intern: members.find((m) => m.user_id === l.intern_id)?.name ?? l.intern_id, task: allTasks.find((x) => x.id === l.task_id)?.title ?? "", hours: l.hours_worked, progress: l.progress, work_completed: l.work_completed, notes: l.notes ?? "" })));
  const statusData = [
    { name: "To Do", value: s.todo, fill: C.todo },
    { name: "In Progress", value: s.inProgress, fill: C.progress },
    { name: "Done", value: s.done, fill: C.done },
  ];
  const prioData = (["high", "medium", "low"] as const).map((p) => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: tasks.filter((t) => t.priority === p).length,
    fill: p === "high" ? C.high : p === "medium" ? C.progress : C.done,
  }));
  const memberData = members.map((m) => {
    const mine = tasks.filter((t) => assigneeIds(t).includes(m.id)).map((t) => taskForMember(t, m.id));
    return { name: m.name.split(" ")[0], "To Do": mine.filter((t) => t.status === "todo").length, "In Progress": mine.filter((t) => t.status === "in_progress").length, Done: mine.filter((t) => t.status === "done").length };
  });
  const tip = { contentStyle: { borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" } };

  return (
    <div>
      <PageHeader title="Reports" subtitle={`Tasks created in the selected period · ${pendingReview} pending review`} action={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!valid || isLoading || !!error || !tasks.length} onClick={exportTasks}><Download className="size-4" />Tasks CSV</Button><Button variant="outline" disabled={!valid || logsLoading || !!logsError || !rangeLogs.length} onClick={exportLogs}><Download className="size-4" />Work logs CSV</Button></div>} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {([["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["custom", "Custom"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" aria-pressed={range === k} variant={range === k ? "default" : "outline"} onClick={() => setRange(k)}>{l}</Button>
        ))}
        {range === "custom" && <><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-auto" aria-label="From date" /><span className="text-muted-foreground">to</span><Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9 w-auto" aria-label="To date" /></>}
      </div>
      {!valid && <ErrorState message="Choose a start date and an end date on or after it." />}
      {error && <ErrorState message="Couldn't load report data." />}
      {logsError && <ErrorState message="Work-hour records could not be loaded." />}
      {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : valid && !error && <StatCards stats={s} />}
      {valid && !isLoading && !error && tasks.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No tasks were created in this period.</p>}
      {valid && !isLoading && !error && <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-soft p-5 lg:col-span-2"><h2 className="mb-4 font-bold">Task completion trend</h2><TrendChart tasks={allTasks} days={days} end={t} /></div>
        <Panel title="Work hours by week">
          {logsLoading ? <Skeleton className="h-full" /> : logsError ? <p className="text-sm text-muted-foreground">Work hours unavailable.</p> : weekData.length === 0 ? <div className="grid h-full place-items-center text-sm text-muted-foreground">No work logs in this period.</div> : <ResponsiveContainer><BarChart data={weekData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="hours" name="Hours" fill={C.primary} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>}
        </Panel>
        <Panel title="Task status distribution">
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks in this period.</p> : <ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>{statusData.map((d) => <Cell key={d.name} fill={d.fill} />)}</Pie><Tooltip {...tip} /><Legend /></PieChart></ResponsiveContainer>}
        </Panel>
        <Panel title={`Completion rate — ${s.completion}%`}>
          <ResponsiveContainer>
            <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: "Completed", value: s.completion, fill: C.primary }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "var(--muted)" }} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-extrabold">{s.completion}%</text>
            </RadialBarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Tasks by priority">
          <ResponsiveContainer><BarChart data={prioData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="value" name="Tasks" radius={[8, 8, 0, 0]}>{prioData.map((d) => <Cell key={d.name} fill={d.fill} />)}</Bar></BarChart></ResponsiveContainer>
        </Panel>
        <Panel title="Tasks by team member">
          <ResponsiveContainer><BarChart data={memberData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip {...tip} cursor={{ fill: "var(--muted)" }} /><Legend /><Bar dataKey="To Do" stackId="a" fill={C.todo} /><Bar dataKey="In Progress" stackId="a" fill={C.progress} /><Bar dataKey="Done" stackId="a" fill={C.done} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Panel>
      </div>}
    </div>
  );
}
