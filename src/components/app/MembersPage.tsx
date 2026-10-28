import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Power, Search, Trash2, UserPlus, Wand2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROLES, useCreateMember, useUpdateMember, useDeleteMember, useMembers, useTasks, useWorkLogs, formatDate, type Member, type MemberInput } from "@/lib/data";
import { useAccountRoles, memberAccountRole } from "@/lib/member-roles";
import { createInternAccount, deleteIntern, resetInternPassword, setInternActive } from "@/lib/interns.functions";
import { EmptyState, ErrorState, MemberAvatar, PageHeader } from "@/components/app/bits";
import { ConfirmDialog } from "@/components/app/TaskDialogs";
import { assigneeIds, taskForMember } from "@/lib/task-assignments";
function MemberForm({ open, onOpenChange, member }: { open: boolean; onOpenChange: (o: boolean) => void; member?: Member | null }) {
  const create = useCreateMember();
  const update = useUpdateMember();
  const [f, setF] = useState<MemberInput>({ name: "", email: "", role: ROLES[0] ?? "Intern", avatar: "" });
  const [err, setErr] = useState<Partial<Record<"name" | "email", string>>>({});
  useEffect(() => {
    if (open) { setErr({}); setF(member ? { name: member.name, email: member.email, role: member.role, avatar: member.avatar ?? "" } : { name: "", email: "", role: ROLES[0] ?? "Intern", avatar: "" }); }
  }, [open, member]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Partial<Record<"name" | "email", string>> = {};
    if (!f.name.trim()) er.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email";
    setErr(er);
    if (Object.keys(er).length) return;
    const v = { ...f, name: f.name.trim(), email: f.email.trim(), avatar: f.avatar?.trim() || null };
    const o = { onSuccess: () => onOpenChange(false) };
    if (member) update.mutate({ id: member.id, ...v }, o); else create.mutate(v, o);
  }
  const pending = create.isPending || update.isPending;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{member ? "Edit intern" : "Add intern"}</DialogTitle><DialogDescription>Interns can be assigned tasks.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5"><Label htmlFor="mn">Full name *</Label><Input id="mn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{err.name && <p className="text-xs text-destructive">{err.name}</p>}</div>
          <div className="space-y-1.5"><Label htmlFor="me">Email *</Label><Input id="me" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />{err.email && <p className="text-xs text-destructive">{err.email}</p>}</div>
          <div className="space-y-1.5"><Label>Job role</Label>
            <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}><SelectTrigger aria-label="Intern job role"><SelectValue /></SelectTrigger><SelectContent>{Array.from(new Set([...ROLES, f.role])).filter(Boolean).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ma">Avatar image URL (optional)</Label><Input id="ma" value={f.avatar ?? ""} onChange={(e) => setF({ ...f, avatar: e.target.value })} placeholder="https://…" /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}{member ? "Save" : "Add intern"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function genPassword() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const a = new Uint32Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => c[n % c.length]).join("");
}

function CreateDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (o: boolean) => void; member: Member | null }) {
  const create = useServerFn(createInternAccount);
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", department: "", joining_date: "", avatar: "" });
  const [busy, setBusy] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setF({ name: member?.name ?? "", email: member?.email ?? "", phone: member?.phone ?? "", password: genPassword(), department: member?.department ?? "", joining_date: member?.joining_date ?? new Date().toISOString().slice(0, 10), avatar: member?.avatar ?? "" });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || f.password.length < 8) return toast.error("Name, a valid email and an 8+ character password are required");
    setBusy(true);
    try {
      await create({ data: { ...f, memberId: member?.id, role: member?.role ?? "Intern" } });
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success(`Login created. Share these details: ${f.email} / ${f.password}`, { duration: 15000 });
      onOpenChange(false);
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
    return undefined;
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? `Create login for ${member.name}` : "Add intern"}</DialogTitle>
          <DialogDescription>The intern signs in using Intern Login on the common sign-in page.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="in">Full name *</Label><Input id="in" value={f.name} onChange={set("name")} /></div>
            <div className="space-y-1.5"><Label htmlFor="ie">Email *</Label><Input id="ie" type="email" value={f.email} onChange={set("email")} /></div>
            <div className="space-y-1.5"><Label htmlFor="ip">Phone</Label><Input id="ip" value={f.phone} onChange={set("phone")} /></div>
            <div className="space-y-1.5"><Label htmlFor="id">Department</Label><Input id="id" value={f.department} onChange={set("department")} placeholder="e.g. Engineering" /></div>
            <div className="space-y-1.5"><Label htmlFor="ij">Joining date</Label><Input id="ij" type="date" value={f.joining_date} onChange={set("joining_date")} /></div>
            <div className="space-y-1.5"><Label htmlFor="ia">Photo URL</Label><Input id="ia" value={f.avatar} onChange={set("avatar")} placeholder="https://…" /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ipw">Password *</Label>
            <div className="flex gap-2"><Input id="ipw" value={f.password} onChange={set("password")} /><Button type="button" variant="outline" onClick={() => setF({ ...f, password: genPassword() })}><Wand2 className="size-4" /> Generate</Button></div>
          </div>
          <p className="text-xs text-muted-foreground">Role: <span className="font-semibold">Intern</span></p>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}Create login</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({ member, onOpenChange }: { member: Member | null; onOpenChange: (o: boolean) => void }) {
  const reset = useServerFn(resetInternPassword);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={!!member} onOpenChange={(o) => { if (o) setPw(genPassword()); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Reset password</DialogTitle><DialogDescription>Set a new password for {member?.name}.</DialogDescription></DialogHeader>
        <div className="flex gap-2"><Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" /><Button variant="outline" onClick={() => setPw(genPassword())}><Wand2 className="size-4" /></Button></div>
        <DialogFooter>
          <Button disabled={busy || pw.length < 8} onClick={async () => {
            if (!member) return;
            setBusy(true);
            try { await reset({ data: { memberId: member.id, password: pw } }); toast.success(`New password: ${pw}`, { duration: 15000 }); onOpenChange(false); }
            catch (e) { toast.error((e as Error).message); }
            setBusy(false);
          }}>{busy && <Loader2 className="size-4 animate-spin" />}Save password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function MembersPage() {
  const membersQuery = useMembers();
  const { data: members = [], isLoading, error } = membersQuery;
  const rolesQuery = useAccountRoles();
  const { data: tasks = [] } = useTasks();
  const { data: logs = [] } = useWorkLogs();
  const qc = useQueryClient();
  const toggle = useServerFn(setInternActive);
  const removeIntern = useServerFn(deleteIntern);
  const removeMember = useDeleteMember();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
  const [create, setCreate] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
  const [reset, setReset] = useState<Member | null>(null);
  const [del, setDel] = useState<Member | null>(null);
  const roleOf = (m: Member) => memberAccountRole(m, rolesQuery.data ?? []);
  const list = useMemo(() => members.filter((m) => {
    const account = memberAccountRole(m, rolesQuery.data ?? []);
    return [m.name, m.email, m.role, m.department ?? ""].some((v) => v.toLowerCase().includes(q.trim().toLowerCase()))
      && (role === "all" || (role === "no_login" ? !m.user_id : account === role))
      && (status === "all" || (status === "active" ? m.is_active : !m.is_active));
  }), [members, rolesQuery.data, q, role, status]);
  async function run(p: Promise<unknown>, message: string) {
    try { await p; await qc.invalidateQueries({ queryKey: ["members"] }); qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success(message); }
    catch (e) { toast.error((e as Error).message); }
  }
  return <div>
    <PageHeader title="Interns" subtitle={`${members.length} interns · ${members.filter((m) => m.user_id).length} with a login`} action={<div className="flex flex-wrap gap-2"><Button onClick={() => setCreate({ open: true, member: null })}><UserPlus className="size-4" />Add Intern</Button></div>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_160px]">
      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search interns" placeholder="Search name, email, job role or department…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" /></div>
      <Select value={role} onValueChange={setRole}><SelectTrigger aria-label="Filter account role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="intern">Intern</SelectItem><SelectItem value="no_login">No login</SelectItem></SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter intern status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
    </div>
    {rolesQuery.error && <ErrorState message="Account roles couldn't be loaded. Role-specific actions are unavailable." />}
    {error ? <ErrorState message="Couldn't load members." /> : isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2].map((i) => <Skeleton key={i} className="h-64" />)}</div> : !list.length ? <EmptyState title="No members found" hint="No members match these filters." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((m) => {
      const mine = tasks.filter((t) => assigneeIds(t).includes(m.id)).map((t) => taskForMember(t, m.id));
      const done = mine.filter((t) => t.status === "done").length;
      const pending = mine.length - done;
      const avg = mine.length ? Math.round(mine.reduce((a,t) => a + t.progress, 0) / mine.length) : 0;
      const account = roleOf(m);
      const last = [...logs.filter((l) => !!m.user_id && l.intern_id === m.user_id).map((l) => l.updated_at), ...mine.map((t) => t.updated_at)].sort().pop();
      return <article key={m.id} className="card-soft p-5">
        <Link to="/team/$id" params={{ id: m.id }} className="flex min-w-0 items-start gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring"><MemberAvatar member={m} size="lg" /><div className="min-w-0 flex-1"><h2 className="break-words font-bold hover:text-primary">{m.name}</h2><p className="break-words text-sm text-muted-foreground">{m.email}</p><p className="mt-1 text-xs text-muted-foreground">{m.role}</p></div></Link>
        <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-accent px-2 py-1 font-semibold text-accent-foreground">{account === "admin" ? "Admin" : account === "intern" ? "Intern" : m.user_id ? "Role unavailable" : "No login"}</span><span className={`rounded-md px-2 py-1 ${m.is_active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{m.is_active ? "Active" : "Inactive"}</span>{m.email.endsWith("@example.com") && <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">Sample</span>}</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Assigned", mine.length], ["Completed", done], ["Pending", pending]].map(([label,value]) => <div key={label} className="rounded-lg bg-muted p-2"><p className="text-lg font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
        <div className="mt-3 flex items-center gap-2"><Progress value={avg} className="h-1.5" /><span className="shrink-0 text-xs text-muted-foreground">{avg}%</span></div>
        <p className="mt-2 text-xs text-muted-foreground">Workload: {pending >= 4 ? "High" : pending >= 2 ? "Medium" : "Light"} · Last activity: {last ? formatDate(last) : "—"}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1 border-t pt-3">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`Edit ${m.name}`} onClick={() => setForm({ open: true, member: m })}><Pencil className="size-4" /></Button></TooltipTrigger><TooltipContent>Edit member</TooltipContent></Tooltip>
          {!m.user_id && <Button size="sm" variant="outline" onClick={() => setCreate({ open: true, member: m })}><UserPlus className="size-4" />Create login</Button>}
          {account === "intern" && <><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`Reset password for ${m.name}`} onClick={() => setReset(m)}><KeyRound className="size-4" /></Button></TooltipTrigger><TooltipContent>Reset password</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`${m.is_active ? "Deactivate" : "Activate"} ${m.name}`} onClick={() => run(toggle({ data: { memberId: m.id, active: !m.is_active } }), "Intern status updated")}><Power className="size-4" /></Button></TooltipTrigger><TooltipContent>{m.is_active ? "Deactivate" : "Activate"}</TooltipContent></Tooltip></>}
          {(!m.user_id || account === "intern") && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="ml-auto text-destructive" aria-label={`Remove ${m.name}`} onClick={() => setDel(m)}><Trash2 className="size-4" /></Button></TooltipTrigger><TooltipContent>Remove member</TooltipContent></Tooltip>}
        </div>
      </article>;
    })}</div>}
    <MemberForm open={form.open} member={form.member} onOpenChange={(open) => setForm((s) => ({ ...s, open }))} />
    <CreateDialog open={create.open} member={create.member} onOpenChange={(open) => setCreate((s) => ({ ...s, open }))} />
    <ResetDialog member={reset} onOpenChange={(open) => { if (!open) setReset(null); }} />
    <ConfirmDialog open={!!del} onOpenChange={(open) => { if (!open) setDel(null); }} title="Remove intern?" description={`${del?.name}'s profile${del?.user_id ? " and intern login" : ""} will be removed. Their tasks become unassigned.`} onConfirm={() => { if (!del) return; if (del.user_id && roleOf(del) === "intern") run(removeIntern({ data: { memberId: del.id } }), "Intern removed"); else if (!del.user_id) removeMember.mutate(del.id); setDel(null); }} confirmLabel="Remove" />
  </div>;
}
