import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { computeStats, formatDate, hoursByDay, useAllUpdates, useMembers, useTasks, useWorkLogs } from "@/lib/data";
import { EmptyState, MemberAvatar } from "@/components/app/bits";
import { StatCards } from "@/components/app/StatCards";
import { TaskTable } from "@/components/app/TaskTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAttendance, useLeaves, fmtTime, hoursBetween } from "@/lib/hr";
import { useGoals, GOAL_STATUS } from "@/lib/goals";
import { useAccountRoles, memberAccountRole } from "@/lib/member-roles";
import { ErrorState } from "@/components/app/bits";
import { assigneeIds, taskForMember } from "@/lib/task-assignments";

export const Route = createFileRoute("/_authenticated/team_/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Intern Profile – Task Manager" },
      { name: "description", content: "Tasks, work logs and performance for an intern." },
      { property: "og:title", content: "Intern Profile – Task Manager" },
      { property: "og:description", content: "Tasks, work logs and performance for an intern." },
    ],
  }),
  component: InternDetail,
});

const tip = { contentStyle: { borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" } };

function InternDetail() {
  const { id } = Route.useParams();
  const { data: members = [], isLoading } = useMembers();
  const { data: tasks = [] } = useTasks();
  const m = members.find((x) => x.id === id);
  const { data: logs = [] } = useWorkLogs(m?.user_id ?? "none");
  const { data: updates = [] } = useAllUpdates(100);
  const attendance = useAttendance();
  const leaves = useLeaves();
  const goals = useGoals();
  const roles = useAccountRoles();
  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!m) return <EmptyState title="Intern not found" action={<Link to="/team" className="text-primary">Back to interns</Link>} />;

  const mine = tasks.filter((t) => assigneeIds(t).includes(m.id)).map((t) => taskForMember(t, m.id));
  const s = computeStats(mine);
  const hours = logs.reduce((a, l) => a + l.hours_worked, 0);
  const week = hoursByDay(logs, 14);
  const doneOverTime = week.map((d) => ({ day: d.day, done: mine.filter((t) => t.status === "done" && t.updated_at.slice(0, 10) <= d.date).length }));
  const myUpdates = updates.filter((u) => mine.some((t) => t.id === u.task_id)).slice(0, 6);
  const statusData = [{ name: "To Do", value: s.todo, fill: "var(--todo)" }, { name: "In Progress", value: s.inProgress, fill: "var(--progress)" }, { name: "Done", value: s.done, fill: "var(--success)" }];

  return (
    <div className="space-y-6">
      <Link to="/team" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Team & Interns</Link>
      <div className="card-soft flex flex-wrap items-center gap-4 p-6">
        <MemberAvatar member={m} size="lg" />
        <div className="min-w-0 flex-1 break-words">
          <h1 className="text-2xl font-extrabold">{m.name}</h1>
          <p className="text-sm text-muted-foreground">{m.email}{m.phone && ` · ${m.phone}`}{m.department && ` · ${m.department}`}</p>
          {m.joining_date && <p className="text-xs text-muted-foreground">Joined {formatDate(m.joining_date)}</p>}
          <p className="mt-2 text-xs font-semibold text-primary">{memberAccountRole(m, roles.data ?? []) === "admin" ? "Admin" : memberAccountRole(m, roles.data ?? []) === "intern" ? "Intern" : m.user_id ? "Role unavailable" : "No login"} · {m.is_active ? "Active" : "Inactive"} · {m.role}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-accent px-4 py-2"><p className="text-2xl font-extrabold">{s.completion}%</p><p className="text-xs text-muted-foreground">Completion</p></div>
          <div className="rounded-xl bg-success-soft px-4 py-2"><p className="text-2xl font-extrabold text-success">{hours}</p><p className="text-xs text-muted-foreground">Hours logged</p></div>
        </div>
      </div>
      <Tabs defaultValue="performance">
      <div className="overflow-x-auto"><TabsList aria-label="Intern profile sections"><TabsTrigger value="performance">Performance & work</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger><TabsTrigger value="leave">Leave</TabsTrigger><TabsTrigger value="goals">Goals</TabsTrigger></TabsList></div>
      <TabsContent value="performance" className="space-y-6 pt-4">
      <StatCards stats={s} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft p-5"><h2 className="mb-3 font-bold">Status distribution</h2><div className="h-56"><ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>{statusData.map((d) => <Cell key={d.name} fill={d.fill} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div></div>
        <div className="card-soft p-5"><h2 className="mb-3 font-bold">Hours worked (14 days)</h2><div className="h-56"><ResponsiveContainer><BarChart data={week}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} /><Tooltip {...tip} /><Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="card-soft p-5"><h2 className="mb-3 font-bold">Tasks completed over time</h2><div className="h-56"><ResponsiveContainer><LineChart data={doneOverTime}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} /><Tooltip {...tip} /><Line dataKey="done" stroke="var(--success)" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></div>
      </div>
      <div id="tasks" className="card-soft"><h2 className="p-5 pb-2 font-bold">Assigned tasks</h2>{mine.length ? <TaskTable tasks={mine} /> : <EmptyState title="No tasks assigned" />}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div id="logs" className="card-soft p-5">
          <h2 className="mb-3 font-bold">Work logs</h2>
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">No work logs yet.</p> : (
            <ol className="space-y-3">{logs.map((l) => (
              <li key={l.id} className="rounded-xl border p-3 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{formatDate(l.date)} · {mine.find((t) => t.id === l.task_id)?.title ?? "General"}</span><span>{l.hours_worked}h · {l.progress}%</span></div>
                <p className="mt-1">{l.work_completed}</p>{l.notes && <p className="mt-1 text-xs text-muted-foreground">Note: {l.notes}</p>}
              </li>))}</ol>
          )}
        </div>
        <div className="card-soft p-5">
          <h2 className="mb-3 font-bold">Recent task updates</h2>
          {myUpdates.length === 0 ? <p className="text-sm text-muted-foreground">No updates yet.</p> : (
            <ol className="space-y-3">{myUpdates.map((u) => (
              <li key={u.id} className="rounded-xl border p-3 text-sm"><p className="text-xs text-muted-foreground">{u.author_name} ({u.author_role}) · {new Date(u.created_at).toLocaleString()} · {mine.find((t) => t.id === u.task_id)?.title}</p><p className="mt-1">{u.message}</p></li>))}</ol>
          )}
        </div>
      </div>
      </TabsContent>
      <TabsContent value="attendance" className="pt-4">
        {attendance.isLoading ? <Skeleton className="h-40" /> : attendance.error ? <ErrorState message="Couldn't load attendance." /> : !m.user_id || !attendance.data?.some((a) => a.user_id === m.user_id) ? <EmptyState title="No attendance records" /> : <div className="overflow-x-auto"><table className="w-full min-w-[450px] text-sm"><thead><tr className="border-b text-left"><th className="p-3">Date</th><th>Check in</th><th>Check out</th><th>Hours</th></tr></thead><tbody>{attendance.data.filter((a) => a.user_id === m.user_id).map((a) => <tr key={a.id} className="border-b"><td className="p-3">{formatDate(a.date)}</td><td>{fmtTime(a.check_in)}</td><td>{fmtTime(a.check_out)}</td><td>{hoursBetween(a.check_in, a.check_out)}</td></tr>)}</tbody></table></div>}
      </TabsContent>
      <TabsContent value="leave" className="pt-4">
        {leaves.isLoading ? <Skeleton className="h-40" /> : leaves.error ? <ErrorState message="Couldn't load leave requests." /> : !m.user_id || !leaves.data?.some((l) => l.user_id === m.user_id) ? <EmptyState title="No leave requests" /> : <ul className="space-y-3">{leaves.data.filter((l) => l.user_id === m.user_id).map((l) => <li key={l.id} className="rounded-lg border p-4"><p className="font-semibold capitalize">{l.leave_type} · {l.status}</p><p className="text-sm text-muted-foreground">{formatDate(l.start_date)} – {formatDate(l.end_date)}</p><p className="mt-2 break-words text-sm">{l.reason}</p>{l.admin_note && <p className="mt-1 text-sm text-muted-foreground">{l.admin_note}</p>}</li>)}</ul>}
      </TabsContent>
      <TabsContent value="goals" className="pt-4">
        {goals.isLoading ? <Skeleton className="h-40" /> : goals.error ? <ErrorState message="Couldn't load goals." /> : !goals.data?.some((g) => g.owner_id === m.id) ? <EmptyState title="No goals assigned" /> : <ul className="space-y-3">{goals.data.filter((g) => g.owner_id === m.id).map((g) => <li key={g.id} className="rounded-lg border p-4"><p className="break-words font-semibold">{g.title}</p><p className="text-sm text-muted-foreground">{GOAL_STATUS[g.status]} · {g.progress}% · Target {formatDate(g.target_date)}</p>{g.description && <p className="mt-2 break-words text-sm">{g.description}</p>}</li>)}</ul>}
      </TabsContent>
      </Tabs>
    </div>
  );
}
