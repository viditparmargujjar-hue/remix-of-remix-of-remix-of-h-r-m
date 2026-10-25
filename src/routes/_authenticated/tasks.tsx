import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Columns3, List, Plus, Search, X } from "lucide-react";
import { KanbanBoard, TaskCalendar } from "@/components/app/TaskViews";
import { CATEGORIES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isOverdue, PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, useMembers, useTasks } from "@/lib/data";
import { EmptyState, ErrorState, PageHeader } from "@/components/app/bits";
import { TaskTable } from "@/components/app/TaskTable";
import { TaskFormDialog } from "@/components/app/TaskDialogs";
import { assigneeIds } from "@/lib/task-assignments";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Tasks – Task Manager" },
      { name: "description", content: "Search, filter, create and manage all team tasks." },
      { property: "og:title", content: "Tasks – Task Manager" },
      { property: "og:description", content: "Search, filter, create and manage all team tasks." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => {
    const out: { q?: string; status?: string; view?: string } = {};
    for (const k of ["q", "status", "view"] as const) { const v = s[k]; if (typeof v === "string") out[k] = v; }
    return out;
  },
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { data: members = [] } = useMembers();
  const sp = Route.useSearch();
  const [q, setQ] = useState(sp.q ?? "");
  const [status, setStatus] = useState(sp.status ?? "all");
  const [cat, setCat] = useState("all");
  const [mode, setMode] = useState(sp.view ?? "table");
  const [prio, setPrio] = useState("all");
  const [who, setWho] = useState("all");
  const [sort, setSort] = useState("none");
  const [open, setOpen] = useState(false);
  useEffect(() => { setQ(sp.q ?? ""); setStatus(sp.status ?? "all"); setMode(sp.view ?? "table"); }, [sp.q, sp.status, sp.view]);

  const list = useMemo(() => {
    let l = tasks.filter((t) =>
      (status === "all" || status === "overdue" || (status === "pending" ? t.status !== "done" : t.status === status)) &&
      (prio === "all" || t.priority === prio) &&
      (cat === "all" || t.category === cat) &&
      (status !== "overdue" || isOverdue(t)) &&
       (who === "all" || assigneeIds(t).includes(who)) &&
      (!q || t.title.toLowerCase().includes(q.toLowerCase()) || (t.description ?? "").toLowerCase().includes(q.toLowerCase())),
    );
    if (sort !== "none") l = [...l].sort((a, b) => (sort === "asc" ? 1 : -1) * a.due_date.localeCompare(b.due_date));
    return l;
  }, [tasks, q, status, prio, who, sort, cat]);

  const filtered = q || cat !== "all" || status !== "all" || prio !== "all" || who !== "all";
  const reset = () => { setQ(""); setStatus("all"); setPrio("all"); setWho("all"); setSort("none"); setCat("all"); };

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${tasks.length} tasks in total`} action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Create Task</Button>} />
      <div className="mb-3 inline-flex rounded-lg border bg-card p-1" role="tablist" aria-label="View mode">
        {([["table", "Table", List], ["board", "Board", Columns3], ["calendar", "Calendar", CalendarDays]] as const).map(([k, l, I]) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", mode === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><I className="size-4" />{l}</button>
        ))}
      </div>
      <div className="card-soft">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search tasks" placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending tasks</SelectItem><SelectItem value="overdue">Overdue</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select>
          <Select value={prio} onValueChange={setPrio}><SelectTrigger aria-label="Filter by priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}</SelectContent></Select>
          <Select value={who} onValueChange={setWho}><SelectTrigger aria-label="Filter by assignee"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All assignees</SelectItem>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
          <Select value={cat} onValueChange={setCat}><SelectTrigger aria-label="Filter by category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sort by due date"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Newest first</SelectItem><SelectItem value="asc">Due date: soonest</SelectItem><SelectItem value="desc">Due date: latest</SelectItem></SelectContent></Select>
        </div>
        {filtered && <div className="flex items-center justify-between px-4 pt-3 text-sm text-muted-foreground"><span>{list.length} result{list.length !== 1 && "s"}</span><button onClick={reset} className="flex items-center gap-1 font-medium text-primary"><X className="size-3" /> Clear filters</button></div>}
        {error ? <div className="p-4"><ErrorState message="Couldn't load tasks." /></div>
          : isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
          : list.length === 0 ? <EmptyState title="No tasks found" hint={filtered ? "Try adjusting your search or filters." : "Create your first task."} action={filtered ? <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button> : undefined} />
          : mode === "board" ? <KanbanBoard tasks={list} /> : mode === "calendar" ? <TaskCalendar tasks={list} /> : <TaskTable tasks={list} showCreated />}
      </div>
      <TaskFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
