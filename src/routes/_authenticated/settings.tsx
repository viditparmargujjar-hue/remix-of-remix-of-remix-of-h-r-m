import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProfileQuery, type AdminProfile } from "@/lib/profile";
import { PageHeader } from "@/components/app/bits";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Settings – Task Manager" },
      { name: "description", content: "Admin profile and notification preferences." },
      { property: "og:title", content: "Settings – Task Manager" },
      { property: "og:description", content: "Admin profile and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, isLoading } = useAdminProfileQuery();
  const qc = useQueryClient();
  const [f, setF] = useState<AdminProfile | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setF(data); }, [data]);

  useEffect(() => {
    if (!f) return;
    document.documentElement.classList.toggle("dark", f.theme === "dark");
    localStorage.setItem("tm-theme", f.theme);
  }, [f?.theme]);

  function pickLogo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image file");
    if (file.size > 5_000_000) return void toast.error("Image must be under 5 MB");
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const k = Math.min(1, 256 / Math.max(img.width, img.height));
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      setF((p) => (p ? { ...p, logo: c.toDataURL("image/png") } : p)); URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return undefined;
    if (!f.name.trim()) return toast.error("Name is required");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error("Enter a valid email");
    setSaving(true);
    const { error } = await (supabase as any).from("settings").upsert({ key: "profile", value: f }, { onConflict: "user_id,key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
    return undefined;
  }

  if (isLoading || !f) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-80 rounded-2xl" /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your admin profile and preferences." />
      <form onSubmit={save} className="space-y-6">
        <section className="card-soft space-y-4 p-6">
          <h2 className="font-bold">Company branding</h2>
          <div className="flex items-center gap-4">
            {f.logo ? <img src={f.logo} alt="Company logo preview" className="size-16 rounded-xl border border-border object-cover" /> : <div className="grid size-16 place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">No logo</div>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild><label className="cursor-pointer">{f.logo ? "Change logo" : "Upload logo"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} /></label></Button>
              {f.logo && <Button type="button" variant="ghost" onClick={() => setF({ ...f, logo: "" })}>Remove</Button>}
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="co">Company name</Label><Input id="co" maxLength={60} placeholder="PeoplePlace" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
        </section>
        <section className="card-soft space-y-4 p-6">
          <h2 className="font-bold">Task defaults</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="dp">Default priority</Label><select id="dp" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.defaultPriority} onChange={(e) => setF({ ...f, defaultPriority: e.target.value as AdminProfile["defaultPriority"] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="dd">Default due in (days)</Label><Input id="dd" type="number" min={0} max={365} value={f.defaultDueDays} onChange={(e) => setF({ ...f, defaultDueDays: Math.max(0, Math.min(365, Number(e.target.value) || 0)) })} /></div>
          </div>
        </section>
        <section className="card-soft space-y-4 p-6">
          <h2 className="font-bold">Profile</h2>
          <div className="flex items-center gap-4">
            {f.avatar ? <img src={f.avatar} alt="" className="size-16 rounded-full object-cover" /> : <div className="grid size-16 place-items-center rounded-full bg-brand-gradient text-lg font-bold text-primary-foreground">{f.name.slice(0, 2).toUpperCase()}</div>}
            <div className="flex-1 space-y-1.5"><Label htmlFor="av">Avatar image URL</Label><Input id="av" value={f.avatar} onChange={(e) => setF({ ...f, avatar: e.target.value })} placeholder="https://…" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="nm">Display name</Label><Input id="nm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="em">Contact email</Label><Input id="em" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          </div>
        </section>
        <section className="card-soft space-y-4 p-6">
          <h2 className="font-bold">Notifications</h2>
          <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-medium">Email updates</span><span className="text-xs text-muted-foreground">Get notified when task status changes.</span></span><Switch checked={f.notifyEmail} onCheckedChange={(v) => setF({ ...f, notifyEmail: v })} /></label>
          <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-medium">Deadline reminders</span><span className="text-xs text-muted-foreground">Remind me about tasks due soon.</span></span><Switch checked={f.notifyDue} onCheckedChange={(v) => setF({ ...f, notifyDue: v })} /></label>
        </section>
        <section className="card-soft p-6">
          <label className="flex items-center justify-between gap-4"><span><span className="block font-bold">Dark theme</span><span className="text-xs text-muted-foreground">Switch the panel to a darker look.</span></span><Switch checked={f.theme === "dark"} onCheckedChange={(v) => setF({ ...f, theme: v ? "dark" : "light" })} /></label>
        </section>
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />}Save changes</Button>
      </form>
    </div>
  );
}
