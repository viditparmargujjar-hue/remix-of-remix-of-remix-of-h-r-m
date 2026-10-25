import { useState } from "react";
import { Eye, MoreHorizontal, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { STATUSES, STATUS_LABEL, formatDate, isOverdue, useDeleteTask, useMembers, useUpdateTask, type Task } from "@/lib/data";
import { MemberAvatar, OverdueBadge, PriorityBadge, StatusBadge } from "./bits";
import { ConfirmDialog, TaskFormDialog, TaskViewDialog } from "./TaskDialogs";
import { assigneeIds } from "@/lib/task-assignments";

export function TaskTable({ tasks, showCreated = false }: { tasks: Task[]; showCreated?: boolean }) {
  const { data: members = [] } = useMembers();
  const updateStatus = useUpdateTask("Status updated");
  const del = useDeleteTask();
  const [view, setView] = useState<Task | null>(null);
  const [edit, setEdit] = useState<Task | null>(null);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const memberOf = (id: string | null) => members.find((m) => m.id === id);
  const namesOf = (task: Task) => assigneeIds(task).map((id) => memberOf(id)?.name ?? "Intern").join(", ") || "Unassigned";

  const Actions = ({ t }: { t: Task }) => (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="View task" onClick={() => setView(t)}><Eye className="size-4" /></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Edit task" onClick={() => setEdit(t)}><Pencil className="size-4" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
      <DropdownMenu>
        <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="More actions"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent>Change status / delete</TooltipContent></Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs"><RefreshCw className="size-3" /> Change status</DropdownMenuLabel>
          {STATUSES.map((s) => (
            <DropdownMenuItem key={s} disabled={t.status === s} onClick={() => updateStatus.mutate({ id: t.id, status: s })}>{STATUS_LABEL[s]}</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(t)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {/* desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Task</th><th className="px-4 py-3">Assigned to</th><th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due date</th><th className="px-4 py-3">Status</th>{showCreated && <th className="px-4 py-3">Created</th>}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const m = memberOf(t.assigned_to);
              return (
                <tr key={t.id} className="border-b last:border-0 transition-colors hover:bg-muted/60">
                  <td className="px-4 py-3"><button className="text-left font-semibold hover:text-primary" onClick={() => setView(t)}>{t.title}</button></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><MemberAvatar member={m ?? null} size="sm" /><span className="max-w-64 break-words">{namesOf(t)}</span></div></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2 whitespace-nowrap">{formatDate(t.due_date)} {isOverdue(t) && <OverdueBadge />}</div></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  {showCreated && <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>}
                  <td className="px-4 py-3"><Actions t={t} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* mobile */}
      <div className="space-y-3 p-3 md:hidden">
        {tasks.map((t) => {
          const m = memberOf(t.assigned_to);
          return (
            <div key={t.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left font-semibold" onClick={() => setView(t)}>{t.title}</button>
                <Actions t={t} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} />{isOverdue(t) && <OverdueBadge />}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><MemberAvatar member={m ?? null} size="sm" />{namesOf(t)}</span>
                <span>Due {formatDate(t.due_date)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <TaskViewDialog task={view} onOpenChange={(o) => !o && setView(null)} />
      <TaskFormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} task={edit} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this task?"
        description={`"${toDelete?.title}" will be permanently removed. This can't be undone.`}
        onConfirm={() => { if (toDelete) del.mutate(toDelete.id); setToDelete(null); }}
      />
    </>
  );
}
