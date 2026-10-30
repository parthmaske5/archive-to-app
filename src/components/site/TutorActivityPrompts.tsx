import { useEffect, useState } from "react";
import { CalendarCheck, EyeOff, Loader2, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { checkinDue } from "@/lib/activity";
import type { Tables } from "@/integrations/supabase/types";

/** Hidden-for-inactivity, paused, and monthly "Still available?" prompts on the tutor dashboard. */
export function TutorActivityPrompts({ teacher, onChanged }: { teacher: Tables<"teacher_profiles">; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { void supabase.rpc("teacher_heartbeat"); }, []);

  async function run(key: string, fn: () => PromiseLike<{ error: unknown }>, ok: string) {
    setBusy(key);
    const { error } = await fn();
    setBusy(null);
    if (error) { toast.error("Something went wrong. Please try again."); return; }
    await onChanged();
    toast.success(ok);
  }
  const spin = (k: string) => busy === k && <Loader2 className="animate-spin" />;

  if (teacher.hidden_at) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 rounded-2xl bg-rose px-5 py-4">
        <EyeOff className="size-6 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Your profile is hidden</p>
          <p className="text-sm text-muted-foreground">Three enquiries in a row went unanswered, so students can't see you right now. Reactivate when you're ready to reply.</p>
        </div>
        <Button variant="pill" disabled={!!busy} onClick={() => run("re", () => supabase.rpc("reactivate_my_listing"), "Your profile is visible again.")}>{spin("re")} Reactivate</Button>
      </div>
    );
  }
  if (teacher.paused_at) {
    return (
      <div role="status" className="flex flex-wrap items-center gap-4 rounded-2xl bg-secondary px-5 py-4">
        <PauseCircle className="size-6 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Your profile is paused</p>
          <p className="text-sm text-muted-foreground">Students can't find you until you're available again.</p>
        </div>
        <Button variant="pill" disabled={!!busy} onClick={() => run("yes", () => supabase.rpc("tutor_checkin", { _available: true }), "Welcome back! Your profile is visible again.")}>{spin("yes")} I'm available again</Button>
      </div>
    );
  }
  if (teacher.status === "approved" && checkinDue(teacher.last_checkin_at)) {
    return (
      <div role="status" className="flex flex-wrap items-center gap-4 rounded-2xl bg-butter px-5 py-4">
        <CalendarCheck className="size-6 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Monthly check-in: still available to take students?</p>
          <p className="text-sm text-muted-foreground">One click keeps your profile live. Pause hides it until you come back.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="pill" disabled={!!busy} onClick={() => run("yes", () => supabase.rpc("tutor_checkin", { _available: true }), "Thanks! You're checked in for this month.")}>{spin("yes")} Yes</Button>
          <Button variant="pill-outline" disabled={!!busy} onClick={() => run("no", () => supabase.rpc("tutor_checkin", { _available: false }), "Your profile is paused.")}>{spin("no")} Pause</Button>
        </div>
      </div>
    );
  }
  return null;
}
