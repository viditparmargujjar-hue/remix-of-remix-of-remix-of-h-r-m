import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { useMembers } from "@/lib/data";
import { leaveCls, useDecideLeave, useLeaves } from "@/lib/hr";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leave")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "Leave Requests – Task Manager" }, { name: "description", content: "Approve or reject intern leave requests." },
    { property: "og:title", content: "Leave Requests – Task Manager" }, { property: "og:description", content: "Approve or reject intern leave requests." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [] } = useLeaves();
  const { data: members = [] } = useMembers();
  const decide = useDecideLeave();
  const [filter, setFilter] = useState("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const name = (u: string) => members.find((m) => m.user_id === u)?.name ?? "Unknown";
  const list = filter === "all" ? data : data.filter((l) => l.status === filter);
  return (
    <div>
      <PageHeader title="Leave Requests" subtitle={`${data.filter((l) => l.status === "pending").length} pending`} action={
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40" aria-label="Filter status"><SelectValue /></SelectTrigger><SelectContent>{["pending", "approved", "rejected", "all"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>} />
      <div className="space-y-3">
        {list.length === 0 ? <EmptyState title="Nothing here" hint="No requests match this filter." /> : list.map((l) => (
          <div key={l.id} className="card-soft space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1"><p className="font-semibold">{name(l.user_id)} · <span className="capitalize">{l.leave_type}</span> · {l.start_date} → {l.end_date}</p><p className="text-sm text-muted-foreground">{l.reason}</p>{l.admin_note && <p className="text-sm">Note: {l.admin_note}</p>}</div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", leaveCls[l.status])}>{l.status}</span>
            </div>
            {l.status === "pending" && <div className="flex flex-wrap gap-2">
              <Input placeholder="Optional note" className="max-w-xs" value={notes[l.id] ?? ""} onChange={(e) => setNotes({ ...notes, [l.id]: e.target.value })} />
              <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: l.id, approve: true, note: notes[l.id] ?? "" })}>Approve</Button>
              <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ id: l.id, approve: false, note: notes[l.id] ?? "" })}>Reject</Button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
