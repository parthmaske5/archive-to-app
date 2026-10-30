import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function ContentPage({ title, html }: { title: string; html: string }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        <article className="content-prose mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
      <SiteFooter />
    </div>
  );
}
