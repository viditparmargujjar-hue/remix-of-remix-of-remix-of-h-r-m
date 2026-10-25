import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, STATUS_LABEL, formatDate, isOverdue, useInternUpdateTask, type Status, type Task } from "@/lib/data";
import { OverdueBadge, PriorityBadge, StatusBadge } from "./bits";
import { TaskActivity } from "./TaskActivity";
import { TaskFiles } from "./TaskFiles";
import { TaskRelatedWork } from "./TaskRelatedWork";

export function InternTaskDialog({ task, onOpenChange }: { task: Task | null; onOpenChange: (o: boolean) => void }) {
  const update = useInternUpdateTask();
  const [status, setStatus] = useState<Status>("todo");
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (task) { setStatus(task.status); setProgress(task.progress); setMsg(""); } }, [task]);

  function submit() {
    if (!task) return;
    if (status === task.status && progress === task.progress && !msg.trim()) return;
    update.mutate({ task: task.id, status, progress: status === "done" ? 100 : progress, message: msg }, { onSuccess: () => setMsg("") });
  }

  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        {task && <>
          <DialogHeader>
            <DialogTitle className="break-words pr-6">{task.title}</DialogTitle>
            <DialogDescription className="break-words">{task.description || "No description provided."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted p-4 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={task.status} /></div></div>
            <div><p className="text-xs text-muted-foreground">Priority</p><div className="mt-1"><PriorityBadge priority={task.priority} /></div></div>
            <div><p className="text-xs text-muted-foreground">Assigned by</p><p className="mt-1 font-medium">Admin</p></div>
            <div><p className="text-xs text-muted-foreground">Assigned</p><p className="mt-1 font-medium">{formatDate(task.created_at)}</p></div>
            <div><p className="text-xs text-muted-foreground">Due</p><p className="mt-1 flex flex-wrap items-center gap-1.5 font-medium">{formatDate(task.due_date)} {isOverdue(task) && <OverdueBadge />}</p></div>
            <div><p className="text-xs text-muted-foreground">Progress</p><div className="mt-2 flex items-center gap-2"><Progress value={task.progress} className="h-1.5" /><span className="text-xs">{task.progress}%</span></div></div>
          </div>

          <div className="space-y-4 rounded-xl border p-4">
            <p className="font-semibold">Work progress</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v as Status); if (v === "done") setProgress(100); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Progress: {progress}%</Label><Slider className="pt-3" value={[progress]} max={100} step={5} onValueChange={(v) => setProgress(v[0] ?? 0)} aria-label="Progress percentage" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="wu">Work update</Label><Textarea id="wu" rows={3} maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Completed homepage UI and started API integration." /></div>
            <Button onClick={submit} disabled={update.isPending || (status === task.status && progress === task.progress && !msg.trim())}>{update.isPending && <Loader2 className="size-4 animate-spin" />}Submit Update</Button>
          </div>
          <TaskRelatedWork task={task} intern />
          <TaskFiles taskId={task.id} />
          <TaskActivity taskId={task.id} canComment />
        </>}
      </DialogContent>
    </Dialog>
  );
}
