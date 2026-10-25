import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { STATUS_LABEL, useMembers, useTasks, type Status } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "Activity History – Task Manager" }, { name: "description", content: "Who changed what and when across tasks." },
    { property: "og:title", content: "Activity History – Task Manager" }, { property: "og:description", content: "Who changed what and when across tasks." },
  ] }),
  component: Page,
});

type H = { id: string; task_id: string; updated_by: string | null; previous_status: Status | null; status: Status; old_progress: number | null; new_progress: number | null; timestamp: string };

function Page() {
  const { data = [], isLoading } = useQuery({ queryKey: ["history", "all"], queryFn: async () => {
    const { data, error } = await (supabase as any).from("task_history").select("*").order("timestamp", { ascending: false }).limit(200);
    if (error) throw error; return data as H[];
  } });
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const actor = (u: string | null) => (u ? members.find((m) => m.user_id === u)?.name ?? "Admin" : "System");
  const describe = (h: H) => !h.previous_status ? "created the task"
    : h.previous_status !== h.status ? `moved it from ${STATUS_LABEL[h.previous_status]} to ${STATUS_LABEL[h.status]}`
    : `changed progress ${h.old_progress ?? 0}% → ${h.new_progress ?? 0}%`;
  return (
    <div>
      <PageHeader title="Activity History" subtitle="Latest 200 task changes, recorded automatically." />
      <div className="card-soft overflow-x-auto">
        {isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p> : data.length === 0 ? <EmptyState title="No activity yet" hint="Changes to tasks will show here." /> :
        <table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Task</th><th className="p-3">Action</th></tr></thead>
          <tbody>{data.map((h) => <tr key={h.id} className="border-b last:border-0"><td className="whitespace-nowrap p-3 text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</td><td className="p-3 font-medium">{actor(h.updated_by)}</td><td className="p-3">{tasks.find((t) => t.id === h.task_id)?.title ?? "Deleted task"}</td><td className="p-3">{describe(h)}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
