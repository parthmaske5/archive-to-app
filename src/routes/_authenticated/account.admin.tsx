import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { kindLabel } from "@/components/site/ProofDocuments";
import { useSession } from "@/lib/use-session";
import { AdminMemberships } from "@/components/site/AdminMemberships";

export const Route = createFileRoute("/_authenticated/account/admin")({
  head: () => ({
    meta: [
      { title: "Tutor Approvals — PUPUK Academy" },
      { name: "description", content: "Review tutor proof of qualification and approve listings on PUPUK Academy." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReview,
});

async function fetchPending() {
  const { data: tps, error } = await supabase.from("teacher_profiles").select("*").eq("status", "pending").not("completed_at", "is", null).order("updated_at");
  if (error) throw error;
  const rows = tps ?? [];
  if (!rows.length) return [];
  const [{ data: names }, { data: docs }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", rows.map((r) => r.user_id)),
    supabase.from("teacher_documents").select("*").in("teacher_profile_id", rows.map((r) => r.id)),
  ]);
  return rows.map((r) => ({
    ...r,
    name: names?.find((n) => n.id === r.user_id)?.display_name ?? "Tutor",
    docs: (docs ?? []).filter((d) => d.teacher_profile_id === r.id),
  }));
}

function AdminReview() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const roles = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data === true,
    enabled: !!user?.id,
  });
  const isAdmin = roles.data === true;
  const pending = useQuery({ queryKey: ["admin_pending"], queryFn: fetchPending, enabled: isAdmin });

  async function openDoc(path: string) {
    const { data } = await supabase.storage.from("tutor-documents").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
    else toast.error("Couldn't open that file.");
  }
  async function decide(id: string, status: "approved" | "rejected") {
    setBusy(id + status);
    const { error } = await supabase.from("teacher_profiles").update({ status }).eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message.includes("proof") ? "This tutor hasn't uploaded a certificate or ID yet." : "Couldn't save. Please try again."); return; }
    toast.success(status === "approved" ? "Tutor approved." : "Changes requested.");
    await qc.invalidateQueries({ queryKey: ["admin_pending"] });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">Tutor approvals</h1>
        <p className="mt-1 text-muted-foreground">A tutor can only be approved after uploading at least one certificate or ID.</p>
        {roles.isLoading ? (
          <div className="grid place-items-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : !isAdmin ? (
          <div className="card-soft mt-6 flex items-center gap-3 p-6"><ShieldAlert className="size-6 text-primary" /> This page is for PUPUK admins only.</div>
        ) : pending.isLoading ? (
          <div className="grid place-items-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : (pending.data ?? []).length === 0 ? (
          <div className="card-soft mt-6 p-6">No tutors waiting for review.</div>
        ) : (
          <ul className="mt-6 space-y-4">
            {pending.data!.map((t) => {
              const hasProof = t.docs.some((d) => d.kind === "certificate" || d.kind === "id");
              return (
                <li key={t.id} className="card-soft p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.qualification} · {t.subjects.join(", ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="pill" size="sm" disabled={!hasProof || !!busy} onClick={() => decide(t.id, "approved")}>
                        {busy === t.id + "approved" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Approve
                      </Button>
                      <Button variant="pill-outline" size="sm" disabled={!!busy} onClick={() => decide(t.id, "rejected")}><XCircle /> Request changes</Button>
                    </div>
                  </div>
                  {t.docs.length === 0 ? (
                    <p className="mt-3 text-sm font-semibold text-destructive">No proof of qualification uploaded yet.</p>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {t.docs.map((d) => (
                        <li key={d.id}>
                          <Button size="sm" variant="secondary" onClick={() => openDoc(d.file_path)}><FileText /> {kindLabel(d.kind)}: {d.file_name}</Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {t.docs.length > 0 && !hasProof && <p className="mt-2 text-sm font-semibold text-destructive">Needs a certificate or ID before approval.</p>}
                </li>
              );
            })}
          </ul>
        )}
        {isAdmin && <AdminMemberships />}
      </main>
      <SiteFooter />
    </div>
  );
}
