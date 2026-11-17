import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ElectricCurrentDemo } from "@/components/demonstrations/ElectricCurrentDemo";
import { Zap, Sun, Cpu, Sparkles, BookOpen, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/demonstration/electriccurrentdemo")({
  head: () => ({
    meta: [
      { title: "Electric Current Demonstration — PUPUK Academy" },
      {
        name: "description",
        content:
          "Interactive physics demonstration showing how light photons liberate electrons in a photoresistor semiconductor to drive electric current and automatic screen brightness.",
      },
      { property: "og:title", content: "Light Sensor & Electric Current Demonstration — PUPUK Academy" },
      {
        property: "og:description",
        content:
          "Interactive physics simulation demonstrating photons, photoresistors, electric current (µA), and smartphone auto-brightness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ElectricCurrentDemoPage,
});

function ElectricCurrentDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <Zap className="size-3.5" /> Interactive Physics & Electronics Demonstration
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-display">
              Light Sensor to Phone Brightness
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl">
              Discover how ambient light photons liberate electrons in a semiconductor (photoresistor), lowering electrical resistance and driving current into an ADC to automatically calibrate your screen brightness.
            </p>
          </div>

          {/* Interactive Simulation Component */}
          <div className="mb-12">
            <ElectricCurrentDemo />
          </div>

          {/* Explanatory Educational Sections */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
                <Sun className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">1. Photoelectric Excitation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Incident photons strike the semiconductor material, imparting energy to valence electrons. Bound electrons break free and transition into the conduction band.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                <Zap className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">2. Decreased Resistance & Current</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                With more charge carriers available, the photoresistor's resistance plummets. In a 1.0 V loop, this surging current (measured in µA) drifts toward the positive terminal.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                <Cpu className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">3. ADC & Screen Brightness</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                An Analog-to-Digital Converter (ADC) samples the analog current. The smartphone operating system adjusts the display backlight to preserve readability and battery life.
              </p>
            </div>
          </div>

          {/* Classroom & Tutoring Note */}
          <div className="mt-8 rounded-2xl border border-border/80 bg-secondary/30 p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="size-10 shrink-0 rounded-full bg-primary/20 text-primary grid place-items-center">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-foreground">Need help mastering physics or electronics?</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                PUPUK connects students with top IGCSE, SPM, and Pre-U physics tutors across Malaysia. Learn concepts through hands-on visualizations and personalized guidance.
              </p>
              <div className="mt-3">
                <Link
                  to="/tutors"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Find a Physics Tutor <Sparkles className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
