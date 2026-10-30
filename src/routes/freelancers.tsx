import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Megaphone, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section } from "@/components/site/Section";
import { services } from "@/data/sample";

export const Route = createFileRoute("/freelancers")({
  head: () => ({
    meta: [
      { title: "Education Freelancers — PUPUK Academy" },
      { name: "description", content: "Design, editing, translation and more from education freelancers. Join PUPUK as a freelancer and reach students, parents and educators." },
      { property: "og:title", content: "Education Freelancers on PUPUK" },
      { property: "og:description", content: "Browse education freelancer services or join as a freelancer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FreelancersPage,
});

function JoinButton() {
  return (
    <Button variant="pill" size="xl" asChild>
      <Link to="/auth/teacher" search={{ mode: "signup" }}>Join as a Freelancer <ArrowRight /></Link>
    </Button>
  );
}

function FreelancersPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-hero">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-24">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-peach text-primary"><Briefcase className="size-7" /></span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] md:text-6xl">Skills meet <span className="text-primary">opportunities.</span></h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Design, editing, translation, coding and more — offered by talented freelancers for educators, students and parents.</p>
            <div className="mt-8"><JoinButton /></div>
          </div>
        </section>

        <Section eyebrow="Services" title="Featured freelancer services" intro="Listings are curated and updated by the PUPUK team.">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <article key={s.title} className="card-soft overflow-hidden">
                <div className={`grid aspect-video place-items-center text-5xl ${s.tone}`} aria-hidden>{s.emoji}</div>
                <div className="p-5">
                  <p className="text-sm font-bold text-primary">{s.freelancer}</p>
                  <h3 className="mt-1 text-lg font-extrabold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                  <p className="mt-4 text-sm text-muted-foreground">Starting from <span className="font-display text-lg font-extrabold text-foreground">RM{s.from}</span></p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section eyebrow="For freelancers" title="Offer your skills on PUPUK">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: UserPlus, tone: "bg-mint", t: "Sign up", d: "Create your account and tell us about the services you offer." },
              { icon: Megaphone, tone: "bg-sky", t: "Get listed", d: "Our team reviews your details and adds your listing to the page." },
              { icon: Wallet, tone: "bg-butter", t: "Get hired", d: "Reach students, parents and educators looking for your skills." },
            ].map((s, i) => (
              <div key={s.t} className={`rounded-[2rem] p-7 ${s.tone}`}>
                <span className="grid size-12 place-items-center rounded-2xl bg-card text-primary shadow-soft"><s.icon className="size-6" /></span>
                <h3 className="mt-5 text-xl font-extrabold">{i + 1}. {s.t}</h3>
                <p className="mt-2 text-foreground/75">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center"><JoinButton /></div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
