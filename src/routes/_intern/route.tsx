import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { InternShell } from "@/components/app/InternShell";

export const Route = createFileRoute("/_intern")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/intern/login" });
    const { data: role } = await (supabase as any).rpc("my_role");
    if (role === "admin") throw redirect({ to: "/dashboard" });
    if (role !== "intern") throw redirect({ to: "/pending" });
    void (supabase as any).rpc("check_deadlines");
  },
  component: () => (
    <InternShell>
      <Outlet />
    </InternShell>
  ),
});
