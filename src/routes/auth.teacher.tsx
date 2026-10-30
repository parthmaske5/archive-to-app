import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/site/AuthForm";

export const Route = createFileRoute("/auth/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Sign In — PUPUK Academy" },
      { name: "description", content: "Sign in or create a teacher account on PUPUK Academy to build your tutor listing." },
      { property: "og:title", content: "Teacher Sign In — PUPUK Academy" },
      { property: "og:description", content: "Sign in or create a teacher account on PUPUK Academy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } => (s["mode"] === "signup" ? { mode: "signup" } : {}),
  component: TeacherAuthPage,
});

function TeacherAuthPage() {
  const { mode } = Route.useSearch();
  return <AuthForm role="teacher" initialMode={mode ?? "signin"} />;
}
