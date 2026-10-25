import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminProfile {
  name: string;
  email: string;
  avatar: string;
  notifyEmail: boolean;
  notifyDue: boolean;
  theme: "light" | "dark";
  company: string;
  logo: string;
  defaultPriority: "high" | "medium" | "low";
  defaultDueDays: number;
}

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await (supabase as any)
        .from("settings")
        .select("value")
        .eq("key", "profile")
        .maybeSingle();
      const email = u.user?.email ?? "admin@company.com";
      const base: AdminProfile = { name: "Admin", email, avatar: "", notifyEmail: true, notifyDue: true, theme: "light", company: "", logo: "", defaultPriority: "medium", defaultDueDays: 7 };
      return { ...base, ...(data?.value ?? {}) } as AdminProfile;
    },
  });
}
export function useAdminProfile(): AdminProfile {
  const q = useAdminProfileQuery();
  return q.data ?? { name: "Admin", email: "", avatar: "", notifyEmail: true, notifyDue: true, theme: "light", company: "", logo: "", defaultPriority: "medium", defaultDueDays: 7 };
}
