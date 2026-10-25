import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, todayISO, useDeleteWorkLog, useMyMember, useSaveWorkLog, useTasks, useWorkLogs, type WorkLog, type WorkLogInput } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { ConfirmDialog } from "@/components/app/TaskDialogs";

export const Route = createFileRoute("/_intern/intern/work-log")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Work Log – Intern Portal" },
      { name: "description", content: "Keep a daily record of the work you've completed." },
      { property: "og:title", content: "Work Log – Intern Portal" },
      { property: "og:description", content: "Keep a daily record of the work you've completed." },
    ],
  }),
  component: WorkLogPage,
});

const blank = (): WorkLogInput => ({ task_id: null, date: todayISO(), work_completed: "", hours_worked: 1, progress: 0, notes: "", blockers: "", attachment_url: "" });

function WorkLogPage() {
  const { data: me } = useMyMember();
  const { data: logs = [], isLoading } = useWorkLogs(me?.user_id ?? "none");
  const { data: tasks = [] } = useTasks();
  const save = useSaveWorkLog();
  const del = useDeleteWorkLog();
  const [form, setForm] = useState<(WorkLogInput & { id?: string }) | null>(null);
  const [toDelete, setToDelete] = useState<WorkLog | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.date) return toast.error("Date is required");
    if (!form.work_completed.trim()) return toast.error("Describe the work you completed");
    if (!(form.hours_worked >= 0 && form.hours_worked <= 24)) return toast.error("Hours must be between 0 and 24");
    if (form.attachment_url && !/^https?:\/\//.test(form.attachment_url)) return toast.error("Attachment must be a link starting with http");
    save.mutate({ ...form, work_completed: form.work_completed.trim(), notes: form.notes?.trim() || null, blockers: form.blockers?.trim() || null, attachment_url: form.attachment_url?.trim() || null, progress: Math.min(100, Math.max(0, Math.round(form.progress))) }, { onSuccess: () => setForm(null) });
    return undefined;
  }
  const title = (id: string | null) => tasks.find((t) => t.id === id)?.title ?? "General";

  return (
    <div>
      <PageHeader title="Work Log" subtitle={`${logs.length} entries · ${logs.reduce((a, l) => a + l.hours_worked, 0)} hours in total`} action={<Button onClick={() => setForm(blank())}><Plus className="size-4" /> Add Work Log</Button>} />
      {isLoading ? <Skeleton className="h-48 rounded-2xl" /> : logs.length === 0 ? <div className="card-soft"><EmptyState title="No work logged yet" hint="Record what you worked on each day." /></div> : (
        <ol className="relative space-y-4 border-l-2 border-border pl-6">
          {logs.map((l) => (
            <li key={l.id} className="relative">
              <span className="absolute -left-[31px] top-5 size-3 rounded-full border-2 border-background bg-primary" />
              <div className="card-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{formatDate(l.date)}</p><p className="font-semibold">{title(l.task_id)}</p></div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">{l.hours_worked}h</span>
                    <span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success">{l.progress}%</span>
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Edit log" onClick={() => setForm({ id: l.id, task_id: l.task_id, date: l.date, work_completed: l.work_completed, hours_worked: l.hours_worked, progress: l.progress, notes: l.notes ?? "", blockers: l.blockers ?? "", attachment_url: l.attachment_url ?? "" })}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label="Delete log" onClick={() => setToDelete(l)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
                <p className="mt-2 text-sm">{l.work_completed}</p>
                {l.notes && <p className="mt-1 text-sm text-muted-foreground">Notes: {l.notes}</p>}
                {l.blockers && <p className="mt-1 text-sm text-danger">Blockers: {l.blockers}</p>}
                {l.attachment_url && <a href={l.attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-medium text-primary hover:underline">View attachment</a>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{form?.id ? "Edit work log" : "Add work log"}</DialogTitle><DialogDescription>Record what you completed and how long it took.</DialogDescription></DialogHeader>
          {form && (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="wd">Date *</Label><Input id="wd" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Task</Label>
                  <Select value={form.task_id ?? "none"} onValueChange={(v) => setForm({ ...form, task_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">General / no task</SelectItem>{tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="ww">Work completed *</Label><Textarea id="ww" rows={3} maxLength={2000} value={form.work_completed} onChange={(e) => setForm({ ...form, work_completed: e.target.value })} placeholder="Created responsive login UI and connected authentication." /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="wh">Hours worked</Label><Input id="wh" type="number" min={0} max={24} step={0.5} value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label htmlFor="wp">Progress %</Label><Input id="wp" type="number" min={0} max={100} step={5} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="wb">Blockers</Label><Textarea id="wb" rows={2} maxLength={1000} value={form.blockers ?? ""} onChange={(e) => setForm({ ...form, blockers: e.target.value })} placeholder="Anything stopping your progress?" /></div>
              <div className="space-y-1.5"><Label htmlFor="wn">Notes</Label><Textarea id="wn" rows={2} maxLength={1000} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Need to test mobile responsiveness." /></div>
              <div className="space-y-1.5"><Label htmlFor="wa">Attachment link (optional)</Label><Input id="wa" value={form.attachment_url ?? ""} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} placeholder="https://drive.google.com/…" /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="size-4 animate-spin" />}{form.id ? "Save changes" : "Add Work Log"}</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Delete this work log?" description="This entry will be permanently removed." onConfirm={() => { if (toDelete) del.mutate(toDelete.id); setToDelete(null); }} />
    </div>
  );
}
