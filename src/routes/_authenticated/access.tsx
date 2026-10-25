import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { formatDate } from "@/lib/data";
import { cn } from "@/lib/utils";
import { decideInternRegistration } from "@/lib/interns.functions";

export const Route = createFileRoute("/_authenticated/access")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Admin Access – Task Manager" },
      { name: "description", content: "Approve or decline new admin accounts." },
      { property: "og:title", content: "Admin Access – Task Manager" },
      { property: "og:description", content: "Approve or decline new admin accounts." },
    ],
  }),
  component: AccessPage,
});

interface Req { user_id: string; email: string; kind: "admin" | "intern"; full_name: string | null; status: "pending" | "approved" | "rejected"; created_at: string }

const badge = { pending: "bg-progress-soft text-progress", approved: "bg-success-soft text-success", rejected: "bg-danger-soft text-danger" };

function AccessPage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  const { data = [], isLoading } = useQuery({
    queryKey: ["access"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("access_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Req[];
    },
  });
  const decide = useMutation({
    mutationFn: async (v: { id: string; approve: boolean; intern?: boolean }) => {
      if (v.intern) return decideInternRegistration({ data: { userId: v.id, approve: v.approve } });
      const { error } = await (supabase as any).rpc("decide_access", { _user_id: v.id, _approve: v.approve });
      if (error) throw new Error(error.message);
      return { ok: true };
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["access"] }); qc.invalidateQueries({ queryKey: ["members"] }); qc.invalidateQueries({ queryKey: ["member-account-roles"] }); toast.success(v.approve ? "Access approved" : "Access rejected"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const interns = data.filter((r) => r.kind === "intern");
  const admins = data.filter((r) => r.kind !== "intern");
  const pending = admins.filter((r) => r.status === "pending").length;
  const internPending = interns.filter((r) => r.status === "pending").length;
  const label = { pending: "Pending Approval", approved: "Approved", rejected: "Rejected" };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Admin Access" subtitle={pending ? `${pending} request${pending > 1 ? "s" : ""} waiting for approval` : "Only approved admins can use the Task Manager."} />
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-bold">Pending Registrations</h2>
        <p className="mb-3 text-sm text-muted-foreground">{internPending ? `${internPending} intern${internPending > 1 ? "s" : ""} waiting for approval` : "New intern sign-ups appear here for approval."}</p>
        <div className="card-soft divide-y">
          {isLoading ? <div className="space-y-2 p-4">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : interns.length === 0 ? <EmptyState title="No intern requests yet" />
            : interns.map((r) => (
              <div key={r.user_id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.full_name || r.email}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.email}</p>
                  <p className="text-xs text-muted-foreground">Registered {formatDate(r.created_at)}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", badge[r.status])}>{label[r.status]}</span>
                <div className="flex gap-2">
                  {r.status !== "approved" && <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.user_id, approve: true, intern: true })}><Check className="size-4" /> Approve</Button>}
                  {r.status !== "rejected" && <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.user_id, approve: false, intern: true })}><X className="size-4" /> Reject</Button>}
                </div>
              </div>
            ))}
        </div>
      </section>
      <h2 className="mb-3 text-lg font-bold">Admin Access Requests</h2>
      <div className="card-soft divide-y">
        {isLoading ? <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          : admins.length === 0 ? <EmptyState title="No access requests yet" />
          : admins.map((r) => (
            <div key={r.user_id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.email}{r.user_id === me && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                <p className="text-xs text-muted-foreground">Requested {formatDate(r.created_at)}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", badge[r.status])}>{r.status}</span>
              {r.user_id !== me && (
                <div className="flex gap-2">
                  {r.status !== "approved" && <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.user_id, approve: true })}><Check className="size-4" /> Approve</Button>}
                  {r.status !== "rejected" && <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.user_id, approve: false })}><X className="size-4" /> {r.status === "approved" ? "Revoke" : "Decline"}</Button>}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
