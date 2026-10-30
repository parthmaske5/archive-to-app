import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminMemberships() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin_memberships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("memberships").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [dates, setDates] = useState<Record<string, string>>({});

  async function save(id: string) {
    const value = dates[id];
    const { error } = await supabase.from("memberships").update({ access_until: value || null, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Couldn't save."); return; }
    toast.success("Access date saved.");
    qc.invalidateQueries({ queryKey: ["admin_memberships"] });
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-extrabold">Members</h2>
      <p className="mt-1 text-muted-foreground">Set the date each member's access lasts until.</p>
      {(q.data ?? []).length === 0 ? (
        <div className="card-soft mt-4 p-6">No membership sign-ups yet.</div>
      ) : (
        <ul className="mt-4 space-y-3">
          {q.data!.map((m) => (
            <li key={m.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold">{m.email ?? m.user_id}</p>
                <p className="text-sm text-muted-foreground">
                  {m.status === "paid" ? "Paid" : "Checkout started"} · {new Date(m.created_at).toLocaleDateString()}
                  {m.access_until ? ` · Access until ${m.access_until}` : " · No access set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="date" className="w-44" defaultValue={m.access_until ?? ""} onChange={(e) => setDates((d) => ({ ...d, [m.id]: e.target.value }))} />
                <Button size="sm" variant="pill" onClick={() => save(m.id)}>Save</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
