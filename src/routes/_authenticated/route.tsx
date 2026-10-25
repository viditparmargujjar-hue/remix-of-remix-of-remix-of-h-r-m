import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: status } = await (supabase as any).rpc("request_access");
    if (status === "intern") throw redirect({ to: "/intern/dashboard" });
    if (status !== "approved") throw redirect({ to: "/pending" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
