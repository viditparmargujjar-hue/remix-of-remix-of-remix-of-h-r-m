import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, STATUS_LABEL, initials, type Member, type Priority, type Status } from "@/lib/data";

const statusCls: Record<Status, string> = {
  todo: "bg-todo-soft text-todo",
  in_progress: "bg-progress-soft text-progress",
  done: "bg-success-soft text-success",
};
const prioCls: Record<Priority, string> = {
  high: "bg-danger-soft text-danger",
  medium: "bg-progress-soft text-progress",
  low: "bg-success-soft text-success",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", statusCls[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", prioCls[priority])}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger">
      Overdue
    </span>
  );
}

const avatarTints = ["bg-accent text-accent-foreground", "bg-success-soft text-success", "bg-progress-soft text-progress", "bg-violet-soft text-violet", "bg-todo-soft text-todo", "bg-danger-soft text-danger"];
export function MemberAvatar({ member, size = "md" }: { member?: Pick<Member, "name" | "avatar" | "id"> | null; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "size-7 text-[11px]" : size === "lg" ? "size-14 text-lg" : "size-9 text-xs";
  if (!member) return <div className={cn("grid place-items-center rounded-full bg-muted text-muted-foreground", s)}>?</div>;
  if (member.avatar) return <img src={member.avatar} alt={member.name} className={cn("rounded-full object-cover", s)} />;
  const tint = avatarTints[member.id.charCodeAt(member.id.length - 1) % avatarTints.length];
  return <div className={cn("grid shrink-0 place-items-center rounded-full font-bold", s, tint)}>{initials(member.name)}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="min-w-0 shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Inbox className="size-5" />
      </div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
      <AlertTriangle className="size-4 shrink-0" /> {message}
    </div>
  );
}
