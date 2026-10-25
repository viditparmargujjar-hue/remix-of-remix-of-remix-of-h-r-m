import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type Attendance = { id: string; user_id: string; date: string; check_in: string; check_out: string | null };
export type Leave = { id: string; user_id: string; leave_type: string; start_date: string; end_date: string; reason: string; status: "pending" | "approved" | "rejected"; admin_note: string | null; created_at: string };
export const LEAVE_TYPES = ["casual", "sick", "personal", "other"] as const;

export function useAttendance() {
  return useQuery({ queryKey: ["attendance"], queryFn: async () => {
    const { data, error } = await sb.from("attendance").select("*").order("date", { ascending: false }).limit(500);
    if (error) throw error; return data as Attendance[];
  } });
}
export function useLeaves() {
  return useQuery({ queryKey: ["leaves"], queryFn: async () => {
    const { data, error } = await sb.from("leave_requests").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data as Leave[];
  } });
}
function useAct<T>(key: string, fn: (v: T) => Promise<{ error: any }>, ok: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => { const { error } = await fn(v); if (error) throw new Error(error.message); },
    onSuccess: () => { toast.success(ok); qc.invalidateQueries({ queryKey: [key] }); qc.invalidateQueries({ queryKey: ["notifications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export const useCheckIn = () => useAct<void>("attendance", () => sb.rpc("check_in"), "Checked in");
export const useCheckOut = () => useAct<void>("attendance", () => sb.rpc("check_out"), "Checked out");
export const useSubmitLeave = () => useAct<Pick<Leave, "leave_type" | "start_date" | "end_date" | "reason">>("leaves", (v) => sb.from("leave_requests").insert(v), "Leave request submitted");
export const useDecideLeave = () => useAct<{ id: string; approve: boolean; note: string }>("leaves", (v) => sb.rpc("decide_leave", { _id: v.id, _approve: v.approve, _note: v.note }), "Decision saved");

export const fmtTime = (s: string | null) => (s ? new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
export const hoursBetween = (a: string, b: string | null) => (b ? ((new Date(b).getTime() - new Date(a).getTime()) / 36e5).toFixed(2) + "h" : "—");
export const leaveCls: Record<Leave["status"], string> = { pending: "bg-progress-soft text-progress", approved: "bg-success-soft text-success", rejected: "bg-danger-soft text-danger" };
