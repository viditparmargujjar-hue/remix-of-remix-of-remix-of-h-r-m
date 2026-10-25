import { TopBar } from "./TopBar";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Target, CalendarOff, Clock, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, NotebookPen, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useMyMember, useNotifications } from "@/lib/data";
import { MemberAvatar } from "./bits";
import { NotificationBell } from "./NotificationBell";

const nav = [
  { to: "/intern/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/intern/tasks", label: "My Tasks", icon: ClipboardList },
  { to: "/intern/work-log", label: "Work Log", icon: NotebookPen },
  { to: "/intern/goals", label: "Goals", icon: Target },
  { to: "/intern/attendance", label: "Attendance", icon: Clock },
  { to: "/intern/leave", label: "Leave", icon: CalendarOff },
  { to: "/intern/notifications", label: "Notifications", icon: Bell },
  { to: "/intern/profile", label: "Profile", icon: UserRound },
] as const;

function Body({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMyMember();
  const { data: notes = [] } = useNotifications();
  const unread = notes.filter((n) => !n.is_read).length;
  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid size-10 place-items-center rounded-xl bg-intern-gradient text-primary-foreground"><GraduationCap className="size-5" /></div>
        <div><p className="font-extrabold leading-tight">Intern Portal</p><p className="text-xs text-sidebar-muted">Task Manager</p></div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((n) => {
          const active = path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate}
              className={cn("flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <n.icon className="size-4.5" />
              <span className="flex-1">{n.label}</span>
              {n.label === "Notifications" && unread > 0 && <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3">
        <div className="flex items-center gap-3">
          <MemberAvatar member={me ?? null} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">{me?.name ?? "Intern"}<span className="rounded bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-sidebar-primary-foreground">Intern</span></p>
            <p className="truncate text-xs text-sidebar-muted">{me?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar hover:text-sidebar-foreground"><LogOut className="size-4" /> Logout</button>
      </div>
    </div>
  );
}

export function InternShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: me } = useMyMember();
  return (
    <div className="intern-theme flex min-h-screen w-full bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block"><Body /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="intern-theme w-64 border-0 p-0"><SheetTitle className="sr-only">Navigation</SheetTitle><Body onNavigate={() => setOpen(false)} /></SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <TopBar kind="intern" name={me?.name ?? "Intern"} email={me?.email ?? ""} avatar={me?.avatar ?? null} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
