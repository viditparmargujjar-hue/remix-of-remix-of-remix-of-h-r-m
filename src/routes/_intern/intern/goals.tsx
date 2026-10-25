import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { GOAL_STATUS, goalCls, useGoals, useInternGoal } from "@/lib/goals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_intern/intern/goals")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "My Goals – Intern Portal" }, { name: "description", content: "View your goals and milestones and update progress." },
    { property: "og:title", content: "My Goals – Intern Portal" }, { property: "og:description", content: "View your goals and milestones and update progress." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [] } = useGoals();
  const upd = useInternGoal();
  const [p, setP] = useState<Record<string, number>>({});
  return (
    <div>
      <PageHeader title="My Goals" subtitle="Goals and milestones set by your admin." />
      {data.length === 0 ? <EmptyState title="No goals yet" hint="Your admin hasn't set any goals for you." /> : (
        <div className="grid gap-4 md:grid-cols-2">{data.map((g) => {
          const v = p[g.id] ?? g.progress;
          return (
            <div key={g.id} className="card-soft space-y-3 p-5">
              <div className="flex items-start gap-2"><p className="flex-1 font-semibold">{g.title}</p><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", goalCls[g.status])}>{GOAL_STATUS[g.status]}</span></div>
              {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
              <p className="text-xs text-muted-foreground">Target: {g.target_date}</p>
              <div className="flex items-center gap-3"><Slider value={[v]} max={100} step={5} onValueChange={(x) => setP({ ...p, [g.id]: x[0] ?? 0 })} aria-label="Goal progress" /><span className="w-10 text-sm">{v}%</span></div>
              <Button size="sm" disabled={v === g.progress || upd.isPending} onClick={() => upd.mutate({ id: g.id, progress: v })}>Save progress</Button>
            </div>
          );
        })}</div>
      )}
    </div>
  );
}
