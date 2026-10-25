import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { LEAVE_TYPES, leaveCls, useLeaves, useSubmitLeave } from "@/lib/hr";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_intern/intern/leave")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "Leave – Intern Portal" }, { name: "description", content: "Request leave and track approval status." },
    { property: "og:title", content: "Leave – Intern Portal" }, { property: "og:description", content: "Request leave and track approval status." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [] } = useLeaves();
  const submit = useSubmitLeave();
  const [f, setF] = useState({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
  function send(e: React.FormEvent): void {
    e.preventDefault();
    if (!f.start_date || !f.end_date) { toast.error("Choose start and end dates"); return; }
    if (f.end_date < f.start_date) { toast.error("End date can't be before start date"); return; }
    if (!f.reason.trim()) { toast.error("Please give a reason"); return; }
    submit.mutate({ ...f, reason: f.reason.trim() }, { onSuccess: () => setF({ leave_type: "casual", start_date: "", end_date: "", reason: "" }) });
  }
  return (
    <div>
      <PageHeader title="Leave" subtitle="Submit a request; an admin will approve or reject it." />
      <form onSubmit={send} className="card-soft mb-6 grid gap-4 p-5 sm:grid-cols-3">
        <div className="space-y-1.5"><Label>Type</Label><Select value={f.leave_type} onValueChange={(v) => setF({ ...f, leave_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="ls">From</Label><Input id="ls" type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="le">To</Label><Input id="le" type="date" min={f.start_date} value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></div>
        <div className="space-y-1.5 sm:col-span-3"><Label htmlFor="lr">Reason</Label><Textarea id="lr" rows={2} maxLength={500} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        <div><Button type="submit" disabled={submit.isPending}>Submit request</Button></div>
      </form>
      <div className="space-y-3">
        {data.length === 0 ? <EmptyState title="No leave requests" hint="Your requests will appear here." /> : data.map((l) => (
          <div key={l.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1"><p className="font-semibold capitalize">{l.leave_type} leave · {l.start_date} → {l.end_date}</p><p className="text-sm text-muted-foreground">{l.reason}</p>{l.admin_note && <p className="text-sm">Admin: {l.admin_note}</p>}</div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", leaveCls[l.status])}>{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
