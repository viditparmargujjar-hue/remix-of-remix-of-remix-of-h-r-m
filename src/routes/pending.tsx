import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pending")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Awaiting Approval – Task Manager" },
      { name: "description", content: "Your admin access request is waiting for approval." },
      { property: "og:title", content: "Awaiting Approval – Task Manager" },
      { property: "og:description", content: "Your admin access request is waiting for approval." },
    ],
  }),
  component: Pending,
});

function Pending() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function check() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/auth", replace: true });
    setEmail(u.user.email ?? "");
    const { data } = await (supabase as any).rpc("request_access");
    if (data === "approved") return navigate({ to: "/dashboard", replace: true });
    if (data === "intern") return navigate({ to: "/intern/dashboard", replace: true });
    setStatus(data ?? "pending");
    return undefined;
  }
  useEffect(() => { check(); }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const rejected = status === "rejected" || status === "intern_rejected";
  const internReq = status?.startsWith("intern_");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="card-soft w-full max-w-md p-8 text-center">
        <div className={`mx-auto grid size-14 place-items-center rounded-full ${rejected ? "bg-danger-soft text-danger" : "bg-progress-soft text-progress"}`}>
          {rejected ? <ShieldX className="size-6" /> : <Clock className="size-6" />}
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">{rejected ? "Access declined" : "Waiting for approval"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? internReq ? "Status: Rejected. An admin has declined this intern account." : "An admin has declined access for this account."
            : <>Your account <span className="font-semibold text-foreground">{email}</span> has been created. Status: Pending Approval. {internReq ? "An admin needs to approve it before you can use the Intern Portal." : "An existing admin needs to approve it before you can use the Task Manager."}</>}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {!rejected && <Button onClick={check}>Check again</Button>}
          <Button variant="outline" onClick={logout}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
