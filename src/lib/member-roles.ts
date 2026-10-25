import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "./data";

export type AccountRole = "admin" | "intern";
export type AccountRoleRow = { user_id: string; role: AccountRole };

// Display only. Existing server authorization remains the authority for every action.
export function memberAccountRole(member: Member, roles: AccountRoleRow[]): AccountRole | null {
  if (!member.user_id) return null;
  return roles.find((row) => row.user_id === member.user_id)?.role ?? null;
}

export function useAccountRoles() {
  return useQuery({ queryKey: ["member-account-roles"], queryFn: async () => {
    const { data, error } = await supabase.from("user_roles").select("user_id, role");
    if (error) throw error;
    return data as AccountRoleRow[];
  } });
}

export function loginRoleError(selected: AccountRole, actual: unknown): string | null {
  if (actual !== "admin" && actual !== "intern") return "Your account does not have an approved login role. Please contact your admin.";
  if (selected !== actual) return `This is an ${actual === "admin" ? "Admin" : "Intern"} account. Select ${actual === "admin" ? "Admin" : "Intern"} Login to continue.`;
  return null;
}