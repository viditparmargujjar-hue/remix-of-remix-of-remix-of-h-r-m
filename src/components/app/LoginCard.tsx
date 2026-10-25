import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginRoleError } from "@/lib/member-roles";

/** Shared email/password form used by admin and intern login pages. */
export function LoginForm({ kind, allowSignup }: { kind: "admin" | "intern"; allowSignup?: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function route() {
    let { data: role, error: roleError } = await (supabase as any).rpc("my_role");
    if (roleError) throw new Error("Couldn't verify your account role. Please try again.");
    if (kind === "admin" && role !== "admin" && role !== "intern") {
      // Server-side access flow: bootstraps the first admin or records a pending request.
      const { data: status, error: accessError } = await (supabase as any).rpc("request_access");
      if (accessError) throw new Error("Couldn't verify your account role. Please try again.");
      if (status !== "approved") return navigate({ to: "/pending" });
      role = "admin";
    }
    if (kind === "intern" && role !== "admin" && role !== "intern") {
      const { data: req, error: requestError } = await (supabase as any).from("access_requests").select("kind, status").maybeSingle();
      if (requestError) throw new Error("Couldn't check your approval request. Please try again.");
      if (req?.kind === "intern") return navigate({ to: "/pending" });
      if (!req) {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const fullName = data.user?.user_metadata?.['full_name'];
        if (typeof fullName === "string" && fullName.trim()) {
          const { error: accessError } = await (supabase as any).rpc("request_intern_access", { _name: fullName.trim() });
          if (accessError) throw new Error("Couldn't save your approval request. Please try again.");
          return navigate({ to: "/pending" });
        }
      }
    }
    const mismatch = loginRoleError(kind, role);
    if (mismatch) {
      await supabase.auth.signOut();
      throw new Error(mismatch);
    }
    if (role === "intern") return navigate({ to: "/intern/dashboard" });
    return navigate({ to: "/dashboard" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const loginEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(loginEmail)) return toast.error("Enter a valid email");
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("If that email has an account, a reset link is on its way.");
        setMode("in");
      } else if (mode === "in") {
        if (!password) throw new Error("Enter your password");
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (error) {
          const m = error.message.toLowerCase();
          if (error.status === 0 || /fetch|network|connection|timeout/.test(m)) throw new Error("Couldn't reach the sign-in service. Check your connection and try again.");
          if (error.status && error.status >= 500) throw new Error("The sign-in service is temporarily unavailable. Please try again later.");
          if (error.status === 429) throw new Error("Too many sign-in attempts. Please wait before trying again.");
          if (error.code === "email_not_confirmed") throw new Error("Please confirm your email using the link sent when you signed up.");
          if (m.includes("banned")) throw new Error("This account has been deactivated. Please contact your admin.");
          if (error.code === "invalid_credentials" || m.includes("invalid login")) throw new Error("The email or password wasn't accepted. Use an account registered in this workspace.");
          throw error;
        }
        if (remember) localStorage.removeItem("tm-forget"); else { localStorage.setItem("tm-forget", "1"); sessionStorage.setItem("tm-alive", "1"); }
        await route();
      } else if (intern) {
        const fullName = name.trim();
        if (!fullName) throw new Error("Enter your full name");
        if (fullName.length > 100) throw new Error("Full name must be under 100 characters");
        if (password.length < 8) throw new Error("Use at least 8 characters");
        if (password !== confirm) throw new Error("Passwords do not match");
        const { data, error } = await supabase.auth.signUp({ email: loginEmail, password, options: { data: { full_name: fullName, registration_type: "intern" } } });
        if (error) throw new Error(/rate limit/i.test(error.message) ? "Too many sign-ups right now. Please try again later." : error.message);
        if (data.session) {
          const { error: reqError } = await (supabase as any).rpc("request_intern_access", { _name: fullName });
          await supabase.auth.signOut();
          if (reqError) throw new Error(reqError.message);
        }
        if (!data.user?.id) throw new Error("Registration could not be completed. Please try again.");
        setNotice("Account created successfully. Please wait for Admin approval.");
        setPassword(""); setConfirm(""); setMode("in");
      } else {
        if (password.length < 8) throw new Error("Use at least 8 characters");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session) await route();
        else { toast.success("Account created. Please sign in."); setMode("in"); }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      setError(/fetch|network|connection|timeout/i.test(message) ? "Couldn't reach the sign-in service. Check your connection and try again." : message);
    }
    setLoading(false);
    return undefined;
  }

  const intern = kind === "intern";
  const title = mode === "forgot" ? "Reset your password" : intern ? mode === "up" ? "Create Intern Account" : "Welcome, Intern!" : mode === "in" ? "Admin sign in" : "Create admin account";
  const sub = mode === "forgot" ? "We'll email you a link to set a new password." : intern ? mode === "up" ? "An admin will review and approve your account." : "Your work. Your growth. Your workspace." : mode === "in" ? "Welcome back! Please enter your details." : "New admin accounts need approval from an existing admin.";

  return (
    <form onSubmit={submit} className="w-full space-y-6" noValidate>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-lg border border-primary/15 bg-accent text-primary">{intern ? <GraduationCap className="size-6" /> : <ShieldCheck className="size-6" />}</div>
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{sub}</p>
      </div>
      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-success/30 bg-success-soft p-3 text-sm text-success">{notice}</p>}
      {intern && mode === "up" && <div className="space-y-2"><Label htmlFor="fullname">Full name</Label><Input id="fullname" autoComplete="name" placeholder="Your full name" className="h-12 rounded-md bg-background/50 px-3.5" value={name} onChange={(e) => setName(e.target.value)} /></div>}
      <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@company.com" className="h-12 rounded-md bg-background/50 px-3.5" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {mode !== "forgot" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><Label htmlFor="pw">Password</Label>{mode === "in" && <Button variant="link" type="button" className="h-auto p-0 text-xs font-semibold" onClick={() => { setError(""); setMode("forgot"); }}>Forgot password?</Button>}</div>
          <div className="relative">
            <Input id="pw" type={show ? "text" : "password"} autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-md bg-background/50 pl-3.5 pr-12" />
            <Button variant="ghost" size="icon" type="button" aria-label={show ? "Hide password" : "Show password"} title={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff /> : <Eye />}</Button>
          </div>
        </div>
      )}
      {intern && mode === "up" && <div className="space-y-2"><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-md bg-background/50 px-3.5" /></div>}
      {mode === "in" && <label className="flex items-center gap-2.5 text-sm text-muted-foreground"><Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember me</label>}
      <Button type="submit" className="h-12 w-full gap-3 rounded-md text-sm font-semibold" disabled={loading}>{loading && <Loader2 className="size-4 animate-spin" />}{mode === "forgot" ? "Send reset link" : mode === "in" ? intern ? "Sign In to Intern Portal" : "Sign In as Admin" : intern ? "Create Intern Account" : "Create account"}{mode === "in" && !loading && <ArrowRight />}</Button>
      <div className="border-t border-border pt-5 text-center text-xs leading-relaxed text-muted-foreground">
        {mode === "forgot" ? <Button variant="link" type="button" className="h-auto p-0 text-xs font-semibold" onClick={() => { setError(""); setMode("in"); }}>Back to login</Button>
          : intern ? <>{mode === "in" ? "New intern?" : "Already have an account?"}{" "}<Button variant="link" type="button" className="h-auto p-0 text-xs font-semibold" onClick={() => { setError(""); setNotice(""); setMode(mode === "in" ? "up" : "in"); }}>{mode === "in" ? "Create Intern Account" : "Sign in"}</Button></>
          : allowSignup ? <>{mode === "in" ? "No account yet?" : "Already have an account?"}{" "}<Button variant="link" type="button" className="h-auto p-0 text-xs font-semibold" onClick={() => { setError(""); setMode(mode === "in" ? "up" : "in"); }}>{mode === "in" ? "Create one" : "Sign in"}</Button></>
          : <>Don't have a login? Please contact your admin.</>}
      </div>
    </form>
  );
}
