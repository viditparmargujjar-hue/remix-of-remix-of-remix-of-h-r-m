import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, useMyMember } from "@/lib/data";
import { MemberAvatar, PageHeader } from "@/components/app/bits";

export const Route = createFileRoute("/_intern/intern/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Profile – Intern Portal" },
      { name: "description", content: "Your intern profile and contact details." },
      { property: "og:title", content: "My Profile – Intern Portal" },
      { property: "og:description", content: "Your intern profile and contact details." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: me, isLoading } = useMyMember();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (me) { setPhone(me.phone ?? ""); setAvatar(me.avatar ?? ""); } }, [me]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (avatar && !/^https?:\/\//.test(avatar)) return toast.error("Photo must be a link starting with http");
    if (phone && !/^[+\d\s()-]{6,20}$/.test(phone)) return toast.error("Enter a valid phone number");
    setBusy(true);
    const { error } = await (supabase as any).rpc("update_my_profile", { _phone: phone, _avatar: avatar });
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-member"] });
    toast.success("Profile updated");
    return undefined;
  }

  if (isLoading || !me) return <Skeleton className="h-72 rounded-2xl" />;
  const rows = [["Email", me.email], ["Department", me.department ?? "—"], ["Joining date", me.joining_date ? formatDate(me.joining_date) : "—"], ["Role", "Intern"]];
  return (
    <div className="max-w-2xl">
      <PageHeader title="My Profile" />
      <div className="card-soft p-6">
        <div className="flex items-center gap-4"><MemberAvatar member={{ ...me, avatar: avatar || null }} size="lg" /><div><p className="text-xl font-extrabold">{me.name}</p><p className="text-sm text-muted-foreground">{me.role}</p></div></div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        <form onSubmit={save} className="mt-6 space-y-4 border-t pt-6">
          <p className="text-sm text-muted-foreground">You can update your phone and photo. Ask your admin to change anything else.</p>
          <div className="space-y-1.5"><Label htmlFor="ph">Phone</Label><Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
          <div className="space-y-1.5"><Label htmlFor="av">Profile photo URL</Label><Input id="av" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" /></div>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}Save</Button>
        </form>
      </div>
    </div>
  );
}
