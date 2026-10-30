// ============= Full file contents =============

import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Briefcase, CalendarClock, Check, Download, GraduationCap, HeartHandshake, RefreshCw, ShieldCheck, Sparkles, Users, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section } from "@/components/site/Section";
import { JoinMembershipButton } from "@/components/site/JoinMembershipButton";
import { materials } from "@/data/sample";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "Student Learning Materials Membership — RM20/month | PUPUK Academy" },
      { name: "description", content: "The first PUPUK membership: unlimited access to membership-eligible worksheets, notes and revision packs for students, RM20 a month. Renews monthly, cancel anytime." },
      { property: "og:title", content: "PUPUK Student Learning Materials Membership — RM20/month" },
      { property: "og:description", content: "One simple monthly plan for eligible learning materials made by real educators. More membership types are on the way." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembershipPage,
});

const benefits = [
  { icon: Download, tone: "bg-mint", t: "Unlimited downloads", d: "Download every worksheet, note and revision pack marked “Membership eligible”." },
  { icon: Sparkles, tone: "bg-sky", t: "New resources regularly", d: "Fresh eligible materials are added by our educators throughout the year." },
  { icon: BookOpen, tone: "bg-peach", t: "Made by real educators", d: "Content organised by subject, level and topic so revision stays focused." },
  { icon: ShieldCheck, tone: "bg-butter", t: "Secure payment", d: "Pay safely through Razorpay with card or other supported methods." },
];

const steps = [
  { icon: Check, t: "Join", d: "Sign in and pay RM20 securely through Razorpay." },
  { icon: CalendarClock, t: "Access activated", d: "Our team activates your access, usually within one working day." },
  { icon: RefreshCw, t: "Renews monthly", d: "RM20 is charged automatically each month so access continues." },
  { icon: XCircle, t: "Cancel anytime", d: "Stop renewal whenever you like — access lasts until the end of your paid month." },
];

const planned = [
  { icon: HeartHandshake, t: "For parents", d: "Guidance on choosing subjects, tutors and study plans." },
  { icon: Users, t: "For educators", d: "Tools and visibility for teachers who publish materials." },
  { icon: Briefcase, t: "For freelancers", d: "Listing and enquiry features for service providers." },
];

function MembershipPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-hero">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Memberships at PUPUK</p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] md:text-6xl">Membership isn’t only for students. <span className="text-primary">One plan is open today.</span></h1>
              <p className="mt-5 text-lg text-muted-foreground">We’re building a membership for each part of the PUPUK community. Right now the only one you can join is the <strong className="text-foreground">Student Learning Materials membership</strong> — the rest are still being planned.</p>
            </div>

            <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {/* OPEN PLAN */}
              <div className="relative rounded-[2.5rem] bg-card p-8 shadow-lift ring-2 ring-primary/25 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground">Open now</span>
                  <span className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary-foreground">For students</span>
                </div>
                <div className="mt-6 flex items-start gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-mint text-primary"><GraduationCap className="size-7" /></span>
                  <div>
                    <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">Student Learning Materials</h2>
                    <p className="mt-2 max-w-xl text-muted-foreground">For students of every level — and the parents who buy for them. Unlimited downloads of every learning material marked <strong className="text-foreground">“Membership eligible”</strong>.</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-1 border-t border-border pt-7">
                  <p className="font-display text-6xl font-extrabold leading-none">RM20<span className="text-xl text-muted-foreground">/month</span></p>
                  <p className="pb-1 text-sm font-semibold text-muted-foreground">Renews monthly · cancel anytime</p>
                </div>

                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {["Every eligible worksheet, note and revision pack", "New eligible materials added all year", "One student account, unlimited downloads", "Premium items not marked eligible sold separately"].map((f) => (
                    <li key={f} className="flex items-start gap-2 font-semibold"><Check className="mt-0.5 size-5 shrink-0 text-primary" /> {f}</li>
                  ))}
                </ul>

                <JoinMembershipButton />
              </div>

              {/* COMING SOON */}
              <div className="rounded-[2.5rem] border-2 border-dashed border-border bg-card/60 p-8 md:p-10">
                <span className="rounded-full bg-muted px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Not open yet</span>
                <h3 className="mt-6 text-2xl font-extrabold">Other memberships are coming</h3>
                <p className="mt-2 text-muted-foreground">Membership will grow beyond students. These are being planned — no price or start date yet.</p>
                <ul className="mt-7 space-y-5">
                  {planned.map((p) => (
                    <li key={p.t} className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><p.icon className="size-5" /></span>
                      <div>
                        <p className="font-bold">{p.t}</p>
                        <p className="text-sm text-muted-foreground">{p.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 text-sm text-muted-foreground">Want a say in what comes next? Tell us what you’d pay for — your answers shape which membership we open next.</p>
              </div>
            </div>
          </div>
        </section>

        <Section eyebrow="Benefits" title="What the Student Learning Materials membership gives you" intro="Included in the RM20/month plan that is open now.">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.t} className={`rounded-[2rem] p-7 ${b.tone}`}>
                <span className="grid size-12 place-items-center rounded-2xl bg-card text-primary shadow-soft"><b.icon className="size-6" /></span>
                <h3 className="mt-5 text-xl font-extrabold">{b.t}</h3>
                <p className="mt-2 text-foreground/75">{b.d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Cost & renewal" title="How billing works">
          <ol className="grid gap-4 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.t} className="card-soft p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><s.icon className="size-5" /></span>
                <p className="mt-4 font-bold">{i + 1}. {s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section eyebrow="Preview" title="A taste of the library" intro="Examples of the kinds of student materials in our library. Eligibility is shown on each item.">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((m) => (
              <article key={m.title} className="card-soft overflow-hidden">
                <div className={`grid aspect-[4/3] place-items-center text-6xl ${m.tone}`} aria-hidden>{m.emoji}</div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{m.subject} · {m.grade}</p>
                  <h3 className="mt-1 text-lg font-extrabold leading-snug">{m.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6">
          <span className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary-foreground">Student Learning Materials membership</span>
          <h2 className="mt-5 text-3xl font-extrabold">Ready to start learning?</h2>
          <p className="mt-2 text-muted-foreground">RM20/month · renews monthly · cancel anytime</p>
          <div className="mx-auto max-w-sm"><JoinMembershipButton /></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
