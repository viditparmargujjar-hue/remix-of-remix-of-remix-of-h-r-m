import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ErrorState } from "./bits";

const B = "task-files";
const MAX = 10 * 1024 * 1024;

export function TaskFiles({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [remove, setRemove] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const key = ["files", taskId];
  const { data = [], isLoading, error } = useQuery({ queryKey: key, queryFn: async () => {
    const { data, error } = await supabase.storage.from(B).list(taskId, { sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error; return data.filter((f) => f.name !== ".emptyFolderPlaceholder");
  } });
  const up = useMutation({
    mutationFn: async (f: File) => {
      if (f.size > MAX) throw new Error("File must be 10 MB or smaller");
      const { error } = await supabase.storage.from(B).upload(`${taskId}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`, f);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("File uploaded"); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });
  async function open(name: string) {
    const { data, error } = await supabase.storage.from(B).createSignedUrl(`${taskId}/${name}`, 60);
    if (error) return void toast.error(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  }
  async function del(name: string) {
    setDeleting(true);
    try {
      const { error } = await supabase.storage.from(B).remove([`${taskId}/${name}`]);
      if (error) throw error;
      toast.success("File removed"); qc.invalidateQueries({ queryKey: key }); setRemove(null);
    } catch { toast.error("File could not be removed. Please try again."); }
    finally { setDeleting(false); }
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Attachments</p>
        <input ref={ref} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) up.mutate(f); e.target.value = ""; }} />
        <Button size="sm" variant="outline" disabled={up.isPending} onClick={() => ref.current?.click()}>{up.isPending ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />} Upload</Button>
      </div>
      {error ? <ErrorState message="Attachments could not be loaded." /> : isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : data.length === 0 ? <p className="text-sm text-muted-foreground">No files yet (max 10 MB each).</p> : (
        <ul className="space-y-1.5">{data.map((f) => (
          <li key={f.name} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{f.name.replace(/^\d+-/, "")}</span>
            <Button size="icon" variant="ghost" className="size-7" aria-label="Download" onClick={() => open(f.name)}><Download className="size-4" /></Button>
            <Button size="icon" variant="ghost" className="size-7" aria-label="Delete file" onClick={() => setRemove(f.name)}><Trash2 className="size-4" /></Button>
          </li>))}</ul>
      )}
      <AlertDialog open={!!remove} onOpenChange={(o) => { if (!o && !deleting) setRemove(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete attachment?</AlertDialogTitle><AlertDialogDescription className="break-words">{remove?.replace(/^\d+-/, "")} will be removed. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(e) => { e.preventDefault(); if (remove) void del(remove); }}>{deleting ? "Removing…" : "Delete"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
