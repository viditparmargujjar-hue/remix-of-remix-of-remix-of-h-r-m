import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { ConfirmDialog } from "@/components/app/TaskDialogs";
import { useMembers } from "@/lib/data";
import { GOAL_STATUS, goalCls, useDeleteGoal, useGoals, useSaveGoal, type Goal, type GoalStatus } from "@/lib/goals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "Goals & Milestones – Task Manager" }, { name: "description", content: "Set goals and milestones for interns and track progress." },
    { property: "og:title", content: "Goals & Milestones – Task Manager" }, { property: "og:description", content: "Set goals and milestones for interns and track progress." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [] } = useGoals();
  const { data: members = [] } = useMembers();
  const save = useSaveGoal(); const del = useDeleteGoal();
  const [f, setF] = useState<Partial<Goal> | null>(null);
  const [rm, setRm] = useState<string | null>(null);
  function submit() {
    if (!f?.title?.trim()) return void toast.error("Title is required");
    if (!f.target_date) return void toast.error("Target date is required");
    save.mutate({ ...(f.id ? { id: f.id } : {}), title: f.title.trim(), description: f.description || null, owner_id: f.owner_id || null, target_date: f.target_date, status: f.status ?? "not_started", progress: f.progress ?? 0 }, { onSuccess: () => setF(null) });
  }
  return (
    <div>
      <PageHeader title="Goals & Milestones" subtitle={`${data.length} goals`} action={<Button onClick={() => setF({ status: "not_started", progress: 0 })}><Plus className="size-4" /> New goal</Button>} />
      {data.length === 0 ? <EmptyState title="No goals yet" hint="Create a goal and assign an owner." /> : (
        <div className="grid gap-4 md:grid-cols-2">{data.map((g) => (
          <div key={g.id} className="card-soft space-y-3 p-5">
            <div className="flex items-start gap-2"><p className="flex-1 font-semibold">{g.title}</p><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", goalCls[g.status])}>{GOAL_STATUS[g.status]}</span></div>
            {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
            <div className="flex items-center gap-2"><Progress value={g.progress} className="h-2 flex-1" /><span className="text-xs">{g.progress}%</span></div>
            <div className="flex items-center text-xs text-muted-foreground"><span className="flex-1">{members.find((m) => m.id === g.owner_id)?.name ?? "Unassigned"} · due {g.target_date}</span>
              <Button size="icon" variant="ghost" className="size-8" aria-label="Edit goal" onClick={() => setF(g)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" className="size-8" aria-label="Delete goal" onClick={() => setRm(g.id)}><Trash2 className="size-4" /></Button></div>
          </div>))}</div>
      )}
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent><DialogHeader><DialogTitle>{f?.id ? "Edit goal" : "New goal"}</DialogTitle></DialogHeader>
          {f && <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="gt">Title</Label><Input id="gt" maxLength={150} value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="gd">Description</Label><Textarea id="gd" rows={2} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Owner</Label><Select value={f.owner_id ?? "none"} onValueChange={(v) => setF({ ...f, owner_id: v === "none" ? null : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="gdt">Target date</Label><Input id="gdt" type="date" value={f.target_date ?? ""} onChange={(e) => setF({ ...f, target_date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={f.status ?? "not_started"} onValueChange={(v) => setF({ ...f, status: v as GoalStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(GOAL_STATUS) as GoalStatus[]).map((s) => <SelectItem key={s} value={s}>{GOAL_STATUS[s]}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="gp">Progress %</Label><Input id="gp" type="number" min={0} max={100} value={f.progress ?? 0} onChange={(e) => setF({ ...f, progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} /></div>
            </div>
            <Button onClick={submit} disabled={save.isPending}>Save goal</Button>
          </div>}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!rm} onOpenChange={(o) => !o && setRm(null)} title="Delete goal?" description="This can't be undone." onConfirm={() => { if (rm) del.mutate(rm); setRm(null); }} />
    </div>
  );
}
