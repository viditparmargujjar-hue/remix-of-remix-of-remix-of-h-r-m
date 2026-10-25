import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STATUSES, STATUS_LABEL, formatDate, isOverdue, useMembers, useUpdateTask, type Status, type Task } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MemberAvatar, OverdueBadge, PriorityBadge } from "./bits";
import { TaskViewDialog } from "./TaskDialogs";
import { assigneeIds } from "@/lib/task-assignments";

type Col = Status | "review";
const COLS: Col[] = ["todo", "in_progress", "review", "done"];
const colLabel = (c: Col) => (c === "review" ? "In Review" : STATUS_LABEL[c]);
const colCls: Record<Col, string> = { todo: "bg-todo", in_progress: "bg-progress", review: "bg-primary", done: "bg-success" };
const colOf = (t: Task): Col => (t.status === "done" && t.review_status === "submitted" ? "review" : t.status);

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const { data: members = [] } = useMembers();
  const update = useUpdateTask("Status updated");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Col | null>(null);
  const [view, setView] = useState<Task | null>(null);
  const move = (id: string, c: Col) => {
    if (c === "review") return;
    const status = c;
    const t = tasks.find((x) => x.id === id);
    if (t && t.status !== status) update.mutate({ id, status });
  };
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
      {COLS.map((s) => {
        const col = tasks.filter((t) => colOf(t) === s);
        return (
          <div
            key={s}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }}
            onDragLeave={() => setOver(null)}
            onDrop={() => { if (drag) move(drag, s); setDrag(null); setOver(null); }}
            className={cn("flex min-h-64 flex-col rounded-xl bg-muted/60 p-3 transition-colors", over === s && "bg-accent ring-2 ring-primary/30")}
          >
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
              <span className={cn("size-2 rounded-full", colCls[s])} />{colLabel(s)}
              <span className="ml-auto rounded-full bg-card px-2 text-xs text-muted-foreground">{col.length}</span>
            </div>
            <div className="space-y-2.5">
              {col.length === 0 && <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{s === "review" ? "Finished tasks awaiting approval appear here" : "Drop tasks here"}</p>}
              {col.map((t) => {
                const m = members.find((x) => x.id === t.assigned_to);
                return (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={() => setDrag(t.id)}
                    onDragEnd={() => setDrag(null)}
                    onClick={() => setView(t)}
                    className={cn("cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing", drag === t.id && "opacity-50")}
                  >
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold leading-snug">{t.title}</p><PriorityBadge priority={t.priority} /></div>
                    {t.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>}
                    <div className="mt-2 flex items-center gap-2"><Progress value={t.progress} className="h-1.5 flex-1" /><span className="text-[11px] text-muted-foreground">{t.progress}%</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">{assigneeIds(t).map((id) => members.find((x) => x.id === id)?.name ?? "Intern").join(", ")}</p>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">{t.category}</span>
                      <span className="flex items-center gap-1.5">{isOverdue(t) && <OverdueBadge />}{formatDate(t.due_date)}<MemberAvatar member={m ?? null} size="sm" /></span>
                    </div>
                    <div className="mt-2 flex gap-1 md:hidden" onClick={(e) => e.stopPropagation()}>
                      {STATUSES.filter((x) => x !== t.status).map((x) => <Button key={x} size="sm" variant="outline" className="h-7 text-xs" onClick={() => move(t.id, x)}>→ {STATUS_LABEL[x]}</Button>)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
      <TaskViewDialog task={view} onOpenChange={(o) => !o && setView(null)} />
    </div>
  );
}

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function TaskCalendar({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [view, setView] = useState<Task | null>(null);
  const days = useMemo(() => {
    const start = new Date(cursor); start.setDate(1 - ((start.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);
  const today = iso(new Date());
  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="flex-1 font-bold">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
        <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setCursor(() => { const d = new Date(); d.setDate(1); return d; })}>Today</Button>
        <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="size-4" /></Button>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-xl border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="border-b bg-muted/60 px-2 py-1.5 text-xs font-semibold text-muted-foreground">{d}</div>)}
          {days.map((d) => {
            const k = iso(d);
            const list = tasks.filter((t) => t.due_date === k);
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <div key={k} className={cn("min-h-24 border-b border-r p-1.5", !inMonth && "bg-muted/30 text-muted-foreground")}>
                <span className={cn("inline-grid size-6 place-items-center rounded-full text-xs", k === today && "bg-primary font-bold text-primary-foreground")}>{d.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {list.slice(0, 3).map((t) => (
                    <button key={t.id} onClick={() => setView(t)} className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium", t.status === "done" ? "bg-success-soft text-success" : isOverdue(t) ? "bg-danger-soft text-danger" : "bg-accent text-accent-foreground")}>{t.title}</button>
                  ))}
                  {list.length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{list.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <TaskViewDialog task={view} onOpenChange={(o) => !o && setView(null)} />
    </div>
  );
}
