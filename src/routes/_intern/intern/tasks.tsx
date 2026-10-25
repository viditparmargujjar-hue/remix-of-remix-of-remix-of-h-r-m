import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITIES, PRIORITY_LABEL, formatDate, isOverdue, useTasks, type Task } from "@/lib/data";
import { EmptyState, ErrorState, OverdueBadge, PageHeader, PriorityBadge, StatusBadge } from "@/components/app/bits";
import { InternTaskDialog } from "@/components/app/InternTaskDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_intern/intern/tasks")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Tasks – Intern Portal" },
      { name: "description", content: "Tasks assigned to you, with status and progress." },
      { property: "og:title", content: "My Tasks – Intern Portal" },
      { property: "og:description", content: "Tasks assigned to you, with status and progress." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { q?: string } => typeof s["q"] === "string" ? { q: s["q"] } : {},
  component: MyTasks,
});

const tabs = [["all", "All"], ["todo", "To Do"], ["in_progress", "In Progress"], ["done", "Completed"], ["overdue", "Overdue"]] as const;

function MyTasks() {
  const { data: tasks = [], isLoading, error } = useTasks();
  const [tab, setTab] = useState<string>("all");
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => { setQ(search.q ?? ""); }, [search.q]);
  const [prio, setPrio] = useState("all");
  const [sort, setSort] = useState("asc");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => tasks
    .filter((t) => tab === "all" || (tab === "overdue" ? isOverdue(t) : t.status === tab))
    .filter((t) => prio === "all" || t.priority === prio)
    .filter((t) => !q || (t.title + " " + (t.description ?? "")).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "asc" ? 1 : -1) * a.due_date.localeCompare(b.due_date)), [tasks, tab, q, prio, sort]);

  const Row = ({ t }: { t: Task }) => (
    <Button variant="outline" onClick={() => setOpen(t.id)} className="block h-auto w-full whitespace-normal rounded-xl bg-card p-4 text-left">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="break-words font-semibold">{t.title}</p><p className="line-clamp-1 text-sm text-muted-foreground">{t.description}</p></div>
        <div className="flex flex-wrap gap-2"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} />{isOverdue(t) && <OverdueBadge />}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Assigned {formatDate(t.created_at)}</span><span>Due {formatDate(t.due_date)}</span><span>Updated {formatDate(t.updated_at)}</span>
        <span className="flex flex-1 items-center gap-2"><Progress value={t.progress} className="h-1.5 min-w-20" /> {t.progress}%</span>
        <span className="font-semibold text-primary">Open →</span>
      </div>
    </Button>
  );

  return (
    <div>
      <PageHeader title="My Tasks" subtitle="Only tasks assigned to you are shown here." />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)} className={cn("rounded-full")}>{l}</Button>)}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search my tasks" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" /></div>
        <Select value={prio} onValueChange={setPrio}><SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}</SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sort"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">Due: soonest first</SelectItem><SelectItem value="desc">Due: latest first</SelectItem></SelectContent></Select>
      </div>
      {error ? <ErrorState message="Couldn't load your tasks." />
        : isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        : list.length === 0 ? <div className="card-soft"><EmptyState title="No tasks found" hint={tasks.length ? "Try a different filter." : "Your admin hasn't assigned you anything yet."} /></div>
        : <div className="space-y-3">{list.map((t) => <Row key={t.id} t={t} />)}</div>}
      <InternTaskDialog task={tasks.find((t) => t.id === open) ?? null} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}
