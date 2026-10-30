import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const kinds = [
  { value: "certificate", label: "Qualification certificate" },
  { value: "id", label: "ID document" },
  { value: "other", label: "Other (resume, etc.)" },
] as const;
export const kindLabel = (k: string) => kinds.find((x) => x.value === k)?.label ?? k;

/** Tutor uploads proof of qualification; at least one certificate or ID is needed before approval. */
export function ProofDocuments({ userId, teacherId }: { userId: string; teacherId: string }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<(typeof kinds)[number]["value"]>("certificate");
  const [busy, setBusy] = useState(false);
  const key = ["teacher_documents", teacherId];
  const docs = useQuery({
    queryKey: key,
    queryFn: async () => (await supabase.from("teacher_documents").select("*").eq("teacher_profile_id", teacherId).order("created_at")).data ?? [],
  });
  const list = docs.data ?? [];
  const hasProof = list.some((d) => d.kind === "certificate" || d.kind === "id");

  async function upload(f: File | undefined) {
    if (!f) return;
    if (!/^(image\/|application\/pdf)/.test(f.type)) { toast.error("Please upload a PDF or image."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB."); return; }
    setBusy(true);
    try {
      const path = `${userId}/${Date.now()}-${f.name.replace(/[^\w.-]+/g, "_").slice(-80)}`;
      const { error: upErr } = await supabase.storage.from("tutor-documents").upload(path, f, { contentType: f.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("teacher_documents").insert({ user_id: userId, teacher_profile_id: teacherId, kind, file_path: path, file_name: f.name.slice(0, 200) });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: key });
      toast.success("Document uploaded.");
    } catch {
      toast.error("We couldn't upload that file. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, path: string) {
    await supabase.storage.from("tutor-documents").remove([path]);
    await supabase.from("teacher_documents").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="card-soft p-5 sm:p-7" aria-labelledby="proof-h">
      <h2 id="proof-h" className="flex items-center gap-2 text-xl font-extrabold"><FileCheck2 className="size-5 text-primary" /> Proof of qualification</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasProof
          ? "Thanks — an admin will check your documents. Only admins can see them."
          : "Upload at least one university certificate or ID. We need this before your profile can be approved. Only admins can see it."}
      </p>
      {list.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {list.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate"><strong>{kindLabel(d.kind)}</strong> · {d.file_name}</span>
              <Button size="sm" variant="ghost" aria-label={`Remove ${d.file_name}`} onClick={() => remove(d.id, d.file_path)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select aria-label="Document type" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="h-10 rounded-full border border-input bg-background px-4 text-sm">
          {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <Button variant="pill" asChild disabled={busy}>
          <label className="cursor-pointer">
            {busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload file
            <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </Button>
      </div>
    </section>
  );
}
