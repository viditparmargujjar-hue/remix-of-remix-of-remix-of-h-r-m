import { AlertCircle, CheckCircle2, Circle, Clock, ListTodo } from "lucide-react";
import type { computeStats } from "@/lib/data";
import { cn } from "@/lib/utils";

export function StatCards({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const cards = [
    { label: "Total Tasks", value: stats.total, icon: ListTodo, cls: "bg-accent text-accent-foreground" },
    { label: "To Do", value: stats.todo, icon: Circle, cls: "bg-todo-soft text-todo" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, cls: "bg-progress-soft text-progress" },
    { label: "Completed", value: stats.done, icon: CheckCircle2, cls: "bg-success-soft text-success" },
    { label: "Overdue", value: stats.overdue, icon: AlertCircle, cls: "bg-danger-soft text-danger" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className={cn("rounded-2xl p-5 card-hover", c.cls)}>
          <c.icon className="size-5" />
          <p className="mt-4 text-3xl font-extrabold">{c.value}</p>
          <p className="text-sm font-medium opacity-80">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

