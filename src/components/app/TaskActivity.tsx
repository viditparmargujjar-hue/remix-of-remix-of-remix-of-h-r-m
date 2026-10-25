import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddUpdate, useTaskUpdates } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ErrorState } from "./bits";

export function TaskActivity({ taskId, canComment }: { taskId: string; canComment?: boolean }) {
  const { data = [], isLoading, error } = useTaskUpdates(taskId);
  const add = useAddUpdate();
  const [msg, setMsg] = useState("");
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">Conversation & updates</p>
      {canComment && (
        <div className="mb-3 flex gap-2">
          <Textarea aria-label="Comment" rows={2} value={msg} maxLength={1000} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message…" />
          <Button size="icon" aria-label="Post comment" disabled={!msg.trim() || add.isPending}
            onClick={() => add.mutate({ task_id: taskId, message: msg.trim() }, { onSuccess: () => setMsg("") })}>
            {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      )}
      {error ? <ErrorState message="Comments could not be loaded." /> : isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
        : data.length === 0 ? <p className="text-sm text-muted-foreground">No updates yet.</p>
        : (
          <ol className="space-y-3">
            {data.map((u) => (
              <li key={u.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">{u.author_name}</span>
                  <span className={cn("rounded px-1.5 py-0.5 font-semibold", u.author_role === "Admin" ? "bg-accent text-accent-foreground" : "bg-success-soft text-success")}>{u.author_role}</span>
                  <span className="text-muted-foreground">{new Date(u.created_at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-1 break-words whitespace-pre-wrap text-sm">{u.message}</p>
              </li>
            ))}
          </ol>
        )}
    </div>
  );
}
