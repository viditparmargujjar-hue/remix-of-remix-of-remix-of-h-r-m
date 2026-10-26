import { useAdminProfile } from "@/lib/profile";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { assigneeIds, taskForMember } from "@/lib/task-assignments";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIES, REVIEW_LABEL, useReviewTask, PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, formatDate, isOverdue, todayISO,
  useCreateTask, useMembers, useTasks, useTaskHistory, useUpdateTask, type Task, type TaskInput,
} from "@/lib/data";
import { MemberAvatar, OverdueBadge, PriorityBadge, StatusBadge } from "./bits";
import { TaskActivity } from "./TaskActivity";
import { TaskFiles } from "./TaskFiles";
import { Progress } from "@/components/ui/progress";
import { TaskRelatedWork } from "./TaskRelatedWork";

const empty: TaskInput = { title: "", description: "", status: "todo", priority: "medium", due_date: "", assigned_to: null, assignee_ids: [], category: "Development" };

export function TaskFormDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | null }) {
  const { data: members = [] } = useMembers();
  const create = useCreateTask();
  const update = useUpdateTask();
  const [f, setF] = useState<TaskInput>(empty);
  const [who, setWho] = useState("");
  const prof = useAdminProfile();
  const [errors, setErrors] = useState<Partial<Record<"title" | "assigned_to" | "priority" | "due_date", string>>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setF(task ? { title: task.title, description: task.description ?? "", status: task.status, priority: task.priority, due_date: task.due_date, assigned_to: task.assigned_to, assignee_ids: assigneeIds(task), category: task.category ?? "Development" } : { ...empty, priority: prof.defaultPriority ?? "medium", due_date: new Date(Date.now() + (prof.defaultDueDays ?? 0) * 864e5).toISOString().slice(0, 10) || todayISO() });
    }
  }, [open, task]);

  const pending = create.isPending || update.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Partial<Record<"title" | "assigned_to" | "priority" | "due_date", string>> = {};
    if (!f.title.trim()) er.title = "Task title is required";
    if (f.title.length > 120) er.title = "Keep the title under 120 characters";
    if (!f.assignee_ids?.length) er.assigned_to = "Please choose at least one intern";
    if (!f.priority) er.priority = "Priority is required";
    if (!f.due_date) er.due_date = "Due date is required";
    setErrors(er);
    if (Object.keys(er).length) return;
    const payload = { ...f, title: f.title.trim(), description: f.description?.trim() || null };
    const opts = { onSuccess: () => onOpenChange(false) };
    if (task) update.mutate({ id: task.id, ...payload }, opts);
    else create.mutate(payload, opts);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>{task ? "Update any of the task details." : "Fill in the details and assign it to an intern."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Task title *</Label>
            <Input id="title" maxLength={120} aria-invalid={!!errors.title} aria-describedby={errors.title ? "title-error" : undefined} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Design Homepage" />
            {errors.title && <p id="title-error" role="alert" className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={3} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What needs to be done?" />
          </div>
          <div className="space-y-1.5">
            <Label>Assign to interns * <span className="font-normal text-muted-foreground">({f.assignee_ids?.length ?? 0} selected)</span></Label>
            <Input aria-label="Search interns" placeholder="Search interns…" value={who} onChange={(e) => setWho(e.target.value)} />
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3" role="group" aria-label="Assign to interns">
              {members.filter((m) => (m.is_active || f.assignee_ids?.includes(m.id)) && (!who || m.name.toLowerCase().includes(who.toLowerCase()))).map((m) => <label key={m.id} className="flex items-center gap-3 text-sm">
                <Checkbox checked={f.assignee_ids?.includes(m.id) ?? false} onCheckedChange={(checked) => {
                  const ids = checked ? [...(f.assignee_ids ?? []), m.id] : (f.assignee_ids ?? []).filter((id) => id !== m.id);
                  setF({ ...f, assignee_ids: ids, assigned_to: ids[0] ?? null });
                }} aria-label={m.name} />
                <span className="min-w-0 break-words">{m.name} <span className="text-muted-foreground">— {m.role}</span></span>
              </label>)}
              {!members.length && <p className="text-sm text-muted-foreground">No interns available.</p>}
            </div>
            {errors.assigned_to && <p id="assignee-error" role="alert" className="text-xs text-destructive">{errors.assigned_to}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v as TaskInput["category"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Priority *</Label>
              <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as TaskInput["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as TaskInput["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date *</Label>
              <Input id="due" type="date" aria-invalid={!!errors.due_date} aria-describedby={errors.due_date ? "due-error" : undefined} value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
              {errors.due_date && <p id="due-error" role="alert" className="text-xs text-destructive">{errors.due_date}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TaskViewDialog({ task, onOpenChange }: { task: Task | null; onOpenChange: (o: boolean) => void }) {
  const { data: liveTasks = [] } = useTasks();
  task = liveTasks.find((t) => t.id === task?.id) ?? task;
  const { data: members = [] } = useMembers();
  const { data: history = [], isLoading } = useTaskHistory(task?.id ?? null);
  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {task && (
          <>
            <DialogHeader>
              <DialogTitle className="break-words pr-6">{task.title}</DialogTitle>
              <DialogDescription className="break-words whitespace-pre-wrap">{task.description || "No description provided."}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted p-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={task.status} /></div></div>
              <div><p className="text-xs text-muted-foreground">Priority</p><div className="mt-1"><PriorityBadge priority={task.priority} /></div></div>
              <div><p className="text-xs text-muted-foreground">Due date</p><p className="mt-1 flex flex-wrap items-center gap-2 font-medium">{formatDate(task.due_date)} {isOverdue(task) && <OverdueBadge />}</p></div>
              <div><p className="text-xs text-muted-foreground">Category</p><p className="mt-1 font-medium">{task.category}</p></div>
              <div><p className="text-xs text-muted-foreground">Last updated</p><p className="mt-1 font-medium">{new Date(task.updated_at).toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Created</p><p className="mt-1 font-medium">{formatDate(task.created_at)}</p></div>
              <div className="col-span-2 flex flex-wrap gap-3">{assigneeIds(task).map((id) => { const member = members.find((x) => x.id === id); return <div key={id} className="flex items-center gap-2"><MemberAvatar member={member ?? null} size="sm" /><span>{member?.name ?? "Intern"}</span></div>; })}</div>
            </div>
            <div><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">Progress</span><span>{task.progress}%</span></div><Progress value={task.progress} /></div>
            {task.assignments?.length ? <section className="space-y-3 border-t pt-4" aria-label="Intern progress"><h3 className="text-sm font-semibold">Intern progress</h3>{task.assignments.map((a) => <div key={a.member_id} className="space-y-2 border-b pb-3 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{members.find((x) => x.id === a.member_id)?.name ?? "Intern"}</span><StatusBadge status={a.status} /></div><div className="flex items-center gap-3"><Progress value={a.progress} className="h-1.5 flex-1" /><span className="text-xs">{a.progress}%</span></div><ReviewPanel task={taskForMember(task, a.member_id)} member={a.member_id} /></div>)}</section> : <ReviewPanel task={task} />}
            <TaskRelatedWork task={task} />
            <TaskFiles taskId={task.id} />
            <TaskActivity taskId={task.id} canComment />
            <div>
              <p className="mb-2 text-sm font-semibold">Status history</p>
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : history.length === 0 ? <p className="text-sm text-muted-foreground">No history yet.</p> : (
                <ol className="space-y-2 border-l-2 border-border pl-4">
                  {history.map((h) => (
                    <li key={h.id} className="text-sm">
                      <span className="font-medium">{h.previous_status ? `${STATUS_LABEL[h.previous_status]} → ${STATUS_LABEL[h.status]}` : `Created as ${STATUS_LABEL[h.status]}`}</span>
                      <span className="block text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = "Delete" }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; onConfirm: () => void; confirmLabel?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReviewPanel({ task, member }: { task: Task; member?: string }) {
  const review = useReviewTask();
  const [note, setNote] = useState("");
  if (task.status !== "done" && !task.review_status) return null;
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Review</p>
        <span className="rounded-full bg-violet-soft px-2.5 py-0.5 text-xs font-semibold text-violet">{task.review_status ? REVIEW_LABEL[task.review_status] : "Not reviewed"}</span>
      </div>
      {task.review_note && <p className="mt-2 text-sm text-muted-foreground">“{task.review_note}”</p>}
      {task.status === "done" && task.review_status !== "approved" && (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} placeholder="Optional feedback for the intern" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <div className="flex gap-2">
            <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ task: task.id, ...(member ? { member } : {}), decision: "approved", note })}>Approve</Button>
            <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ task: task.id, ...(member ? { member } : {}), decision: "changes_requested", note })}>Request changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
