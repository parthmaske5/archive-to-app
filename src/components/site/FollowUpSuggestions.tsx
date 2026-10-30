import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Hourglass, Zap } from "lucide-react";
import { fetchApprovedTutors } from "@/lib/tutor-data";
import { needsFollowUp } from "@/lib/activity";
import type { ThreadSummary } from "@/lib/enquiries";

/** "This tutor hasn't replied yet" card with 3 similar active tutors, per unanswered enquiry. */
export function FollowUpSuggestions({ threads }: { threads: ThreadSummary[] }) {
  const waiting = threads.filter((t) => needsFollowUp(t));
  const tutors = useQuery({ queryKey: ["tutors", "approved"], queryFn: fetchApprovedTutors, enabled: waiting.length > 0 });
  if (waiting.length === 0) return null;
  const all = tutors.data ?? [];

  return (
    <div className="space-y-4">
      {waiting.slice(0, 3).map((w) => {
        const subj = w.subject.toLowerCase();
        const picks = all
          .filter((t) => t.id !== w.teacherProfileId)
          .map((t) => ({ t, score: (t.subjects.some((s) => s.toLowerCase().includes(subj) || subj.includes(s.toLowerCase())) ? 2 : 0) + (t.badges?.length ?? 0) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((x) => x.t);
        return (
          <section key={w.id} className="rounded-2xl bg-butter p-5" aria-label={`Follow-up for ${w.subject}`}>
            <p className="flex items-center gap-2 font-extrabold"><Hourglass className="size-5 text-primary" /> {w.counterpartName} hasn't replied yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your {w.subject} enquiry has been waiting over 48 hours. Here are {picks.length || 3} similar active tutors.</p>
            {picks.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {picks.map((t) => (
                  <li key={t.id}>
                    <Link to="/tutors/$id" params={{ id: t.id }} className="block rounded-xl bg-card p-3 shadow-soft hover:ring-2 hover:ring-primary/40">
                      <p className="font-bold">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.subjects.join(", ")}</p>
                      {t.badges?.[0] && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"><Zap className="size-3" /> {t.badges[0]}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
