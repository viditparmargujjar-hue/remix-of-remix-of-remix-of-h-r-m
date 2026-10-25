import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;
export type GoalStatus = "not_started" | "in_progress" | "achieved" | "missed";
export type Goal = { id: string; title: string; description: string | null; owner_id: string | null; target_date: string; status: GoalStatus; progress: number; created_at: string };
export const GOAL_STATUS: Record<GoalStatus, string> = { not_started: "Not started", in_progress: "In progress", achieved: "Achieved", missed: "Missed" };
export const goalCls: Record<GoalStatus, string> = { not_started: "bg-todo-soft text-todo", in_progress: "bg-progress-soft text-progress", achieved: "bg-success-soft text-success", missed: "bg-danger-soft text-danger" };

export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: async () => {
    const { data, error } = await sb.from("goals").select("*").order("target_date");
    if (error) throw error; return data as Goal[];
  } });
}
function useM<T>(fn: (v: T) => Promise<{ error: any }>, ok: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => { const { error } = await fn(v); if (error) throw new Error(error.message); },
    onSuccess: () => { toast.success(ok); qc.invalidateQueries({ queryKey: ["goals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export const useSaveGoal = () => useM<Partial<Goal>>(({ id, ...v }) => (id ? sb.from("goals").update(v).eq("id", id) : sb.from("goals").insert(v)), "Goal saved");
export const useDeleteGoal = () => useM<string>((id) => sb.from("goals").delete().eq("id", id), "Goal deleted");
export const useInternGoal = () => useM<{ id: string; progress: number }>((v) => sb.rpc("intern_update_goal", { _goal: v.id, _progress: v.progress }), "Progress saved");
