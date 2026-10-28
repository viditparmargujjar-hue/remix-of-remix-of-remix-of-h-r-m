import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckSquare, GraduationCap, LogOut, Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useMembers, useTasks } from "@/lib/data";
import { NotificationBell } from "./NotificationBell";
import { StatusBadge } from "./bits";

const THEME_KEY = "tm-theme";
export type ThemePref = "light" | "dark" | "system";
const THEME_EVT = "tm-theme-change";
const resolve = (p: ThemePref) => (p === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : p);
export function applyTheme(p: ThemePref, persist = true) {
  document.documentElement.classList.toggle("dark", resolve(p) === "dark");
  if (persist) {
    localStorage.setItem(THEME_KEY, p);
    window.dispatchEvent(new Event(THEME_EVT));
    void (supabase as any).from("settings").upsert({ key: "theme", value: p }, { onConflict: "user_id,key" });
  }
}
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("light");
  useEffect(() => {
    const sync = () => { const p = (localStorage.getItem(THEME_KEY) as ThemePref | null) ?? "light"; setPref(p); applyTheme(p, false); };
    sync();
    (supabase as any).from("settings").select("value").eq("key", "theme").maybeSingle().then(({ data }: any) => {
      if (data?.value && data.value !== localStorage.getItem(THEME_KEY)) { localStorage.setItem(THEME_KEY, data.value); sync(); }
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener(THEME_EVT, sync); mq.addEventListener("change", sync);
    return () => { window.removeEventListener(THEME_EVT, sync); mq.removeEventListener("change", sync); };
  }, []);
  const theme = typeof window === "undefined" ? "light" : resolve(pref);
  const set = (p: ThemePref) => applyTheme(p);
  const toggle = () => set(theme === "dark" ? "light" : "dark");
  return { theme, pref, set, toggle };
}

export function ThemeSelect({ id }: { id?: string }) {
  const { pref, set } = useTheme();
  return (
    <select id={id} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={pref} onChange={(e) => set(e.target.value as ThemePref)}>
      <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
    </select>
  );
}

/** Resize an image file to a small data URL (stored in existing profile fields). */
export function imageToDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((res, rej) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return rej(new Error("Choose a PNG, JPG, WEBP or GIF image"));
    if (file.size > 5_000_000) return rej(new Error("Image must be under 5 MB"));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const k = Math.min(1, max / Math.max(img.width, img.height));
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => rej(new Error("Could not read this image"));
    img.src = URL.createObjectURL(file);
  });
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function GlobalSearch({ open, onOpenChange, kind }: { open: boolean; onOpenChange: (o: boolean) => void; kind: "admin" | "intern" }) {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const go = (fn: () => void) => { onOpenChange(false); fn(); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={kind === "admin" ? "Search tasks and interns…" : "Search your tasks…"} />
      <CommandList>
        <CommandEmpty>No matching results.</CommandEmpty>
        <CommandGroup heading="Tasks">
          {tasks.map((t) => (
            <CommandItem key={t.id} value={`task ${t.title} ${t.category}`} onSelect={() => go(() => navigate(kind === "admin" ? { to: "/tasks", search: { q: t.title } } : { to: "/intern/tasks", search: { q: t.title } }))}>
              <CheckSquare className="size-4" /> <span className="flex-1 truncate">{t.title}</span> <StatusBadge status={t.status} />
            </CommandItem>
          ))}
        </CommandGroup>
        {kind === "admin" && (
          <CommandGroup heading="Team & Interns">
            {members.map((m) => (
              <CommandItem key={m.id} value={`intern ${m.name} ${m.email}`} onSelect={() => go(() => navigate({ to: "/team/$id", params: { id: m.id } }))}>
                <GraduationCap className="size-4" /> {m.name} <span className="text-xs text-muted-foreground">{m.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function TopBar({ kind, name, email, avatar, onMenu }: { kind: "admin" | "intern"; name: string; email: string; avatar?: string | null; onMenu: () => void }) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  async function logout() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8 [&>button]:shrink-0">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></Button>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold">{greeting()}, {name.split(" ")[0]}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3" />{today}</p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)} className="ml-auto min-w-0 max-w-xs flex-1 justify-start text-muted-foreground" aria-label="Open search">
          <Search className="size-4" /> <span className="flex-1 text-left">Search…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] font-semibold sm:inline">Ctrl K</kbd>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">{theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}</Button>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-ring" aria-label="Profile menu">
            {avatar ? <img src={avatar} alt="" className="size-9 rounded-full object-cover" /> : <div className="grid size-9 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-primary-foreground">{name.slice(0, 2).toUpperCase()}</div>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel><p className="truncate">{name}</p><p className="truncate text-xs font-normal text-muted-foreground">{email}</p></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: kind === "admin" ? "/settings" : "/intern/profile" })}>{kind === "admin" ? <Settings className="size-4" /> : <User className="size-4" />}{kind === "admin" ? "Settings" : "My profile"}</DropdownMenuItem>
            <DropdownMenuItem onClick={toggle}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}{theme === "dark" ? "Light mode" : "Dark mode"}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-danger"><LogOut className="size-4" />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <GlobalSearch open={open} onOpenChange={setOpen} kind={kind} />
    </header>
  );
}
