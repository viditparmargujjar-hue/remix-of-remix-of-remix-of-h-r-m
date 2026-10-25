import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarOff, Clock, History, Target, BarChart3, CheckSquare, LayoutDashboard, GraduationCap, LogOut, Menu, Settings, ShieldCheck, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAdminProfile } from "@/lib/profile";
import { TopBar } from "./TopBar";
import { useMembers } from "@/lib/data";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/team", label: "Interns", icon: Users },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/attendance", label: "Attendance", icon: Clock },
  { to: "/leave", label: "Leave", icon: CalendarOff },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/activity", label: "Activity", icon: History },
  { to: "/access", label: "Access", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useAdminProfile();

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        {profile.logo ? <img src={profile.logo} alt="" className="size-10 rounded-xl object-cover" /> : <div className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-primary-foreground">
          <CheckSquare className="size-5" />
        </div>}
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold leading-tight">{profile.company || "Task Manager"}</p>
          <p className="text-xs text-sidebar-muted">Admin Panel</p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((n) => {
          const active = path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <n.icon className="size-4.5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3">
        <div className="flex items-center gap-3">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <div className="grid size-9 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-primary-foreground">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">{profile.name}<span className="rounded bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-sidebar-primary-foreground">Admin</span></p>
            <p className="truncate text-xs text-sidebar-muted">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" /> Logout
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const profile = useAdminProfile();
  const { data: members = [] } = useMembers();
  const sampleCount = members.filter((m) => m.email.endsWith("@example.com")).length;
  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <TopBar kind="admin" name={profile.name} email={profile.email} avatar={profile.avatar} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{sampleCount > 0 && <p className="mb-5 border-l-2 border-primary bg-accent/50 px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-accent-foreground">Sample data included</span> · Example interns and their assigned tasks and goals are demonstration records.</p>}{children}</main>
      </div>
    </div>
  );
}
